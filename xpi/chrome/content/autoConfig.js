var UpdateSites=
    {
    updateSites: null,
    submitCount:0,
    AutopagerCOMP:null,
    updatedCount: 0,
    init:function()
    {

        if (this.updateSites == null || this.AutopagerCOMP==null)
        {
            this.updateSites = this.getUpdateSites();
        }
    },
    getAutopagerCOMP : function()
    {
        if (this.AutopagerCOMP==null)
            this.AutopagerCOMP = autopagerRules.getAutopagerCOMP();
        return this.AutopagerCOMP;
    },
    getUpdateSites : function()
    {
        var sites = this.getAutopagerCOMP().getUpdateSites();
        if (sites==null || sites.length==0)
        {

            sites = AutoPagerUpdateTypes.getUpdateSites();
            this.getAutopagerCOMP().setUpdateSites(sites);
        }
        return sites;
    },
    updateSiteOnline :function (updatesite,force,error)
    {
        if (!autopagerRules.isAllowUpdate())
            return;
        UpdateSites.submitCount ++;
        var needUpdate = force;
        if (!force)
        {
            var updateperiod = updatesite.updateperiod;
            if (updateperiod == -2) //global
                updateperiod = autopagerPref.loadPref("update");

            if (updateperiod == "-1")
                needUpdate = true;
            else if (0 == updateperiod)
            {
                var allSettings = UpdateSites.loadAll();
                needUpdate = allSettings[updatesite.filename].length<=0;
            }
            else
            {
                var today = new Date();
                var lastUpdate = updatesite.lastupdate;
                var lasttry = updatesite.lasttry;
                if (typeof lastUpdate=="undefined" || lastUpdate==null || lastUpdate=="null" || lastUpdate.length == 0 || (today.getTime() - lastUpdate) /(1000 * 60 * 60) > updateperiod)
                {
                    //try if not try in last 1 minutes
                    if (typeof lasttry=="undefined" || lasttry==null || lasttry.length == 0 || (today.getTime() - lasttry) /(1000 * 60) > 1)
                    {
                        needUpdate = true;
                        updatesite.lasttry = today.getTime();
                    }
                }
                //alert(updatesite.filename + " " + (today.getTime() - lastUpdate) /(1000 * 60 * 60))
            }
        }
        //        autopagerBwUtil.consoleLog("needUpdate:" + needUpdate)
        if (needUpdate)
        {
            apxmlhttprequest.xmlhttprequest( this.getUrl(updatesite.url,force,error),updatesite.contenttype,this.callback,this.onerror,updatesite);
            //alert("update " + updatesite.filename)
        }
    },
    updateSiteOnlineBackup :function (updatesite,error)
    {
        if (updatesite.backupUrls!=null &&  updatesite.triedBackup < updatesite.backupUrls.length)
            apxmlhttprequest.xmlhttprequest( this.getUrl(updatesite.backupUrls[updatesite.triedBackup],true,error),updatesite.contenttype,this.callback,this.onerror,updatesite);
    },
    getUrl : function (url,force,error)
    {
        var all=0;
        if (autopagerPref.loadBoolPref("include-unsafe-rules"))
            all=1;
        var t='';
        if (force)
            t +=  (new Date()).getTime() + "&apForce=1";
        if (error!=0)
            t += (new Date()).getTime() + "&apError=" + error;

        url = url.replace(/\{version\}/,"0.6.1.6").replace(/\{timestamp\}/,t).replace(/\{all\}/,all);
        var ids = autopagerPref.loadUTF8Pref("ids");
        if (!autopagerPref.loadBoolPref("with-lite-recommended-rules"))
            ids = ids + "&ir=false";
        url = url.replace(/\{ids\}/,ids);
        return url;
    },
    updatePatternOnline :function (force)
    {
        if (!autopagerRules.isAllowUpdate() || !autopagerPref.loadBoolPref("with-lite-discovery"))
            return;
        var needUpdate = force;
        var today = new Date();
        if (!force)
        {
            var updateperiod = autopagerPref.loadPref("update");

            if (updateperiod == "-1")
                needUpdate = true;
            else if (0 == updateperiod)
            {
                var patterns = this.getAutopagerCOMP().getPatterns();
                needUpdate = patterns==null || patterns.length==0;
            }
            else
            {
                var lastUpdate = autopagerPref.loadPref("pattern-update-date");
                var lasttry = autopagerPref.loadPref("pattern-lasttry-date");
                if (typeof lastUpdate=="undefined" || lastUpdate==null || lastUpdate=="null" || lastUpdate.length == 0 || (today.getTime() - lastUpdate) /(1000 * 60 * 60) > updateperiod)
                {
                    //try if not try in last 1 minutes
                    if (typeof lasttry=="undefined" || lasttry==null || lasttry.length == 0 || (today.getTime() - lasttry) /(1000 * 60) > 1)
                    {
                        needUpdate = true;
                    }
                }
            }
        }
        if (needUpdate)
        {
            //            var lastUpdate = autopagerPref.loadPref("pattern-update-date");
            autopagerPref.savePref("pattern-lasttry-date",today.getTime());
            var url = "http://rep.teesoft.info/autopager/patterns/?approvedOnly=0&version={version}&lastupdate={timestamp}&all={all}";
            if (autopagerLite.isInLiteMode())
                url = "http://rep.teesoft.info/autopager/patterns/?version={version}&lastupdate={timestamp}&all={all}";
            apxmlhttprequest.xmlhttprequest( this.getUrl(url,force,0)
            ,"application/json; charset=utf-8"
            ,function(str,options){
                UpdateSites.getAutopagerCOMP().setPatterns(autopagerBwUtil.decodeJSON(str));
                autopagerBwUtil.saveContentToConfigFile(str,"autopager-patterns.json");
                autopagerPref.savePref("pattern-update-date",today.getTime());
            }
            ,function(){
                var str = autopagerBwUtil.getConfigFileContents("autopager-patterns.json","utf-8");
                UpdateSites.getAutopagerCOMP().setPatterns(autopagerBwUtil.decodeJSON(str));
            },{});
            //alert("update " + updatesite.filename)
        }
        else
        {
            var str = autopagerBwUtil.getConfigFileContents("autopager-patterns.json","utf-8");
            UpdateSites.getAutopagerCOMP().setPatterns(autopagerBwUtil.decodeJSON(str));
        }

    },
    updateOnline :function (force)
    {
        if (!autopagerRules.isAllowUpdate())
            return;
        if (force || UpdateSites.updatedCount<=0)
        {
            UpdateSites.updatedCount=0;
            this.init();
            UpdateSites.submitCount=0;

            for(var i=0;i<this.updateSites.length;i++)
            {
                var site= this.updateSites[i];
                if ( (force || site.enabled) && site.url.length >0)
                {
                    site.triedTime = 0;
                    site.triedBackup = 0;
                    this.updateSiteOnline(site,force,0);
                }
            }
        }
        this.updatePatternOnline(force);
    },
    updateRepositoryOnline :function (repositoryName,force)
    {
        if (force || UpdateSites.updatedCount<=0)
        {
            UpdateSites.updatedCount=0;
            this.init();
            UpdateSites.submitCount=0;
            for(var i=0;i<this.updateSites.length;i++)
            {
                var site= this.updateSites[i];
                if (site.filename != repositoryName)
                    continue;

                if ( (force || site.enabled) && site.url.length >0)
                {
                    site.triedTime = 0;
                    site.triedBackup = 0;
                    this.updateSiteOnline(site,force,0);
                }
            }
        }
    },
    onerror:function(doc,obj)
    {
        //TODO:notification the update failed
        UpdateSites.submitCount--;
        if (UpdateSites.submitCount<=0)
            autopagerPref.savePref("lastupdate",(new Date()).getTime());

        if (obj.triedTime < 2)
        {
            obj.triedTime ++;
            //try 2 times
            window.setTimeout(function(){
                UpdateSites.updateSiteOnline(obj,true,obj.triedTime)
            },10);

        }
        else
            if (obj.backupUrls!=null &&  obj.triedBackup < obj.backupUrls.length)
        {
            window.setTimeout(function(){
                obj.triedBackup ++;
                UpdateSites.updateSiteOnlineBackup(obj,obj.triedBackup * -1)
            },10);
        }
    },
    callback:function(doc,updatesite)
    {
        //        autopagerBwUtil.consoleLog("callback:" + updatesite + " " + doc)
        var sites = updatesite.callback(doc,updatesite);
        if (sites==null || sites.length==0)
            return;

        sites.updateSite = updatesite;
        var file = autopagerBwUtil.getConfigFile(updatesite.filename.replace(/\.xml/,".json"));
        if (file)
        {
            autopagerConfig.saveConfigToJsonFile(sites,file,true);
            var jsonOverridefile = updatesite.filename.replace(/\.xml/,".json.override");
            try{
                if (updatesite.filename != "autopager.xml")
                {
                    var overrideContents= autopagerBwUtil.getConfigFileContents(jsonOverridefile);
                    if (overrideContents!=null && overrideContents.length>0)
                    {
                        var overrides = autopagerBwUtil.decodeJSON(overrideContents);
                        autopagerJsonSetting.mergeOverrides(updatesite,sites,overrides);
                    }
                }
            }catch(e)
            {
                autopagerBwUtil.consoleError(e);
            }
        }
        UpdateSites.submitCount--;
        //if (UpdateSites.submitCount<=0)
        autopagerPref.savePref("lastupdate",(new Date()).getTime());
        updatesite.lastupdate = (new Date()).getTime();
        var allSites = UpdateSites.loadAll();
        allSites[updatesite.filename] = sites;
        UpdateSites.AutopagerCOMP.setAll(allSites);//notify update
        //        alert("start save " + updatesite.filename);
        var settings = UpdateSites.getUpdateSites();
        AutoPagerUpdateTypes.saveSettingSiteConfig(settings);
        //        alert("saved " + updatesite.filename);
        UpdateSites.updateSites = UpdateSites.getUpdateSites();
        //autopagerMain.handleCurrentDoc();
        UpdateSites.updatedCount++;
    },
    defaultSite : function()
    {
        return UpdateSites.updateSites[UpdateSites.updateSites.length-3].url;
    },
    loadAll:function()
    {
        var allSiteSetting = this.getAutopagerCOMP().loadAll();
        if (allSiteSetting == null || allSiteSetting.length==0)
        {
            allSiteSetting = {};
            allSiteSetting["testing.xml"] = null;
            for(var i=this.updateSites.length-1;i>=0;i--)
            {
                var sites = autopagerConfig.reLoadConfig(allSiteSetting,this.updateSites[i]);
                allSiteSetting[this.updateSites[i].filename] = sites;
            }
            this.getAutopagerCOMP().setAll(allSiteSetting);
        }
        return this.getAutopagerCOMP().loadAll();
    },
    getMatchedSiteConfig: function(allSites,url,count)
    {
        var newSites = new Array();
        var key;
        for ( key in allSites){
            //alert(key)
            var tmpsites = allSites[key];
            if (tmpsites==null || !tmpsites.updateSite.enabled)
                continue;
            for (var i = 0; i < tmpsites.length; i++) {
                var site = tmpsites[i];
                var pattern = autopagerUtils.getRegExp(site);
                if (pattern.test(url)) {
                    var newSite = autopagerConfig.cloneSite (site);
                    newSite.updateSite = tmpsites.updateSite;
                    newSites.push(newSite);
                    if (count == newSites.length)
                        return newSites;
                }
            }
        }
        return newSites;

    },
    getMatchedSiteConfigByGUID: function(allSites,guid,includeLocal,count)
    {
        var newSites = new Array();
        var key;
        for ( key in allSites){
            var tmpsites = allSites[key];
            if (tmpsites==null || !tmpsites.updateSite.enabled)
                continue;
            if (!includeLocal && (tmpsites.updateSite.filename == 'autopager.xml'))
                continue;

            for (var i = 0; i < tmpsites.length; i++) {
                var site = tmpsites[i];
                if (site.guid == guid) {
                    var newSite = autopagerConfig.cloneSite (site);
                    newSite.updateSite = tmpsites.updateSite;
                    newSites.push(newSite);
                    if (count == newSites.length)
                        return newSites;
                }
            }
        }
        return newSites;

    }
};

function Site()
{
    this.urlPattern  = null;
    this.regex = null;
    this.isRegex = false;
    this.enabled  = true;
    this.enableJS  = false;
    this.quickLoad = true;
    this.fixOverflow  = false;
    this.createdByYou  = false;
    this.changedByYou  = false;
    this.owner  = "";
    this.contentXPath = [];//["//div[@class='g']"];

    this.linkXPath = "//a[contains(.//text(),'Next')]";
    this.containerXPath="";
    this.monitorXPath="";
    this.removeXPath=[];
    //this.desc = null;
    this.testLink = [];
    this.oldSite = null;
    this.margin = autopagerMain.getDefaultMargin();

    this.maxLinks = -1;
    this.isTemp = false;
    this.tmpPaths = [];
    this.guid = "";
    this.ajax=false;
    this.needMouseDown = false;
    this.published = false;
    this.minipages = -1;
    this.delaymsecs = -1;
}

function SiteConfirm()
{
    this.guid = "";
    this.host = "";
    this.AllowedPageCount = -1;
    this.UserAllowed = false;
}


var autopagerConfig =
    {
    autopagerStrbundle : new autopagerStrings("autopager"),
    autoSites : null,
    formatVersion: 1,
    autopagerDomParser : autopagerBwUtil.newDOMParser(),
    openSetting : function(url,obj) {
        var settingUrl = "chrome://autopager/content/autopager.xul";
        if (!autopagerBwUtil.isFennec())
        {
            window.autopagerSelectUrl=url;
            window.autopagerOpenerObj = obj;
            window.open(settingUrl, "autopager",
            "chrome,resizable,centerscreen");
        }else
        {
            content.location.href=settingUrl;
            if (typeof Browser!="undefined" && Browser._browserView)
            {
                var bv = Browser._browserView
                bv.setZoomLevel(0.5);
            }
        }
    },
    saveConfirmToFile : function(sites,saveFile) {
        try{
            var doc = document.implementation.createDocument("", "autopager", null);
            doc.firstChild.appendChild(doc.createTextNode("\n"))

            for (var i = 0, siteObj = null; (siteObj = sites[i]); i++) {
                var siteNode = doc.createElement("site-confirm");

                autopagerConfig.createNode(siteNode,"guid",siteObj.guid);
                autopagerConfig.createNode(siteNode,"host",siteObj.host);
                autopagerConfig.createNode(siteNode,"AllowedPageCount",siteObj.AllowedPageCount);
                autopagerConfig.createNode(siteNode,"UserAllowed",siteObj.UserAllowed);
                doc.firstChild.appendChild(siteNode);
                doc.firstChild.appendChild(doc.createTextNode("\n"));
            }

            var configStream = autopagerConfig.getWriteStream(saveFile);
            new window.XMLSerializer().serializeToStream(doc, configStream, "utf-8");
            configStream.close();
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
    },
    saveConfirm : function(sites) {
        this.saveConfirmToFile(sites, autopagerBwUtil.getConfigFile("site-confim.xml"));
    }
    ,
    getConfigFile : function(fileName) {
        var file = this.getConfigDir();
        file.append(fileName);
        if (!file.exists()) {
            file.create(Components.interfaces.nsIFile.FILE_TYPE, 0755);
        }

        return file;
    },

    getConfigDir : function() {
        try{
            var file = Components.classes["@mozilla.org/file/directory_service;1"]
            .getService(Components.interfaces.nsIProperties)
            .get("ProfD", Components.interfaces.nsILocalFile);
            file.append("autopager");
            if (!file.exists()) {
                file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0755);
            }
        }catch(e)
        {
            autopagerBwUtil.consoleLog(e);
        }
        return file;

    },
    loadConfirmFromStr : function(configContents) {
        var sites = new Array();
        try{
            var doc = this.autopagerDomParser.parseFromString(configContents, "text/xml");
            var nodes = doc.evaluate("/autopager/site-confirm", doc, null, 0, null);
            for (var node = null; (node = nodes.iterateNext()); ) {
                var site = new SiteConfirm();

                for (var i = 0, childNode = null; (childNode = node.childNodes[i]); i++) {
                    if (childNode.nodeName == "guid") {
                        site.guid = autopagerConfig.getValue(childNode);
                    }else  if (childNode.nodeName == "AllowedPageCount") {
                        site.AllowedPageCount = autopagerConfig.getValue(childNode);
                    }else  if (childNode.nodeName == "host") {
                        site.host = autopagerConfig.getValue(childNode);
                    }
                    else if (childNode.nodeName == "UserAllowed") {
                        site.UserAllowed	= (autopagerConfig.getValue(childNode) == 'true' || autopagerConfig.getValue(childNode) == '1');
                    }
                }
                sites.push(site);
            }
        }catch(e)
        {
            autopagerBwUtil.consoleLog(e);
        }
        return sites;
    }
    ,
    getConfirm : function() {
        var confirms = UpdateSites.AutopagerCOMP.getSiteConfirms();
        if (confirms == null || confirms.length==0)
        {
            var confirmContents="";
            try{
                confirmContents= autopagerBwUtil.getConfigFileContents("site-confim.xml");
            }catch(e)
            {
                autopagerBwUtil.consoleLog(e);
            }
            confirms = this.loadConfirmFromStr(confirmContents);
            UpdateSites.AutopagerCOMP.setSiteConfirms(confirms);
        }
        return confirms;
    }
    ,
    findConfirm : function(confirmSites,guid,host)
    {
        for(var i=0;i<confirmSites.length;i++)
        {
            if (confirmSites[i].guid == guid
                && confirmSites[i].host == host  )
            {
                return confirmSites[i];
            }
        }
        return null;
    }
    ,
    addConfirm : function(confirmSites,guid,countNumber,host,enabled)
    {
        for(var i=0;i<confirmSites.length;i++)
        {
            if (confirmSites[i].guid == guid
                && confirmSites[i].host == host  )
            {
                confirmSites[i].AllowedPageCount = countNumber;
                confirmSites[i].UserAllowed = enabled;
                return;
            }
        }
        var site = new SiteConfirm();
        site.guid = guid;
        site.host = host;
        site.AllowedPageCount = countNumber;
        site.UserAllowed = enabled;
        confirmSites.push(site);
        UpdateSites.AutopagerCOMP.setSiteConfirms(confirmSites);
    },
    isNumeric : function (strNumber)
    {
        var  newPar=/^(\+|\-)?\d+(\.\d+)?$/
        return  newPar.test(strNumber);
    }
    // Array.insert( index, value ) - Insert value at index, without overwriting existing keys
    ,
    insertAt : function (sites, index, site ) {
        sites.push(site);
        if( index>=0 && index<sites.length) {
            for(var i=sites.length -1;i>index;i--)
            {
                sites[i] = sites[i-1];
            }
            sites[index] = site;
            return sites;
        }
    },
    generateGuid : function()
    {
        var result, i;
        result = '';
        for(i=0; i<32; i++)
        {
            if( i >4  && i % 4 == 0)
                result = result + '-';
            result +=Math.floor(Math.random()*16).toString(16).toUpperCase();
        }
        return result
    }
    , cloneSite : function(site)
    {
        var newSite = new Site();
        return autopagerConfig.doCloneSite(newSite,site);
    },
    doCloneSite : function(newSite,site)
    {
        newSite.urlPattern  = site.urlPattern;
        newSite.regex  = site.regex;

        newSite.guid  = site.guid;
        if (site.id)
            newSite.id  = site.id;
        newSite.isRegex  = site.isRegex;
        newSite.margin  = site.margin;
        newSite.minipages  = site.minipages;
        newSite.delaymsecs  = site.delaymsecs;
        newSite.enabled  = site.enabled;
        newSite.enableJS  = site.enableJS;
        newSite.ajax  = site.ajax;
        newSite.needMouseDown  = site.needMouseDown;
        newSite.published = site.published;
        newSite.quickLoad  = site.quickLoad;
        newSite.fixOverflow  = site.fixOverflow;
        newSite.createdByYou  = site.createdByYou;
        newSite.changedByYou  = site.changedByYou;
        newSite.owner  = site.owner;
        newSite.contentXPath = [];
        for(var i=0;i<site.contentXPath.length;++i)
            newSite.contentXPath[i] = site.contentXPath[i];

        newSite.testLink = [];
        if (site.testLink)
        {
            newSite.testLink = []
            for(var i=0;i<site.testLink.length;++i)
                newSite.testLink[i] = site.testLink[i];
        }

        if (site.removeXPath)
        {
            newSite.removeXPath = [];
            for(var i=0;i<site.removeXPath.length;++i)
                newSite.removeXPath[i] = site.removeXPath[i];
        }

        newSite.linkXPath = site.linkXPath;
        newSite.containerXPath = site.containerXPath;
        newSite.monitorXPath = site.monitorXPath;

        if (site.desc)
            newSite.desc = site.desc;

        if (typeof site.formatVersion != 'undefined')
            newSite.formatVersion = site.formatVersion;
        newSite.oldSite = site;
        newSite.isTemp = site.isTemp
        newSite.tmpPaths = site.tmpPaths
        newSite.maxLinks = site.maxLinks
        return newSite;
    }
    ,
    isChanged : function(site)
    {
        if (site.oldSite == null)
            return true;
        else
        {
            var oldSite = site.oldSite;
            if (oldSite.urlPattern  != site.urlPattern
                || oldSite.id  != site.id
                || oldSite.guid  != site.guid
                || oldSite.isRegex  != site.isRegex
                || oldSite.margin  != site.margin
                || oldSite.minipages  != site.minipages
                || oldSite.delaymsecs  != site.delaymsecs
                || oldSite.enabled  != site.enabled
                || oldSite.enableJS  != site.enableJS
                || oldSite.published  != site.published
                || oldSite.ajax  != site.ajax
                || oldSite.needMouseDown  != site.needMouseDown
                || oldSite.quickLoad  != site.quickLoad
                || oldSite.fixOverflow  != site.fixOverflow
                || oldSite.owner  != site.owner
                || oldSite.linkXPath != site.linkXPath
                || oldSite.containerXPath != site.containerXPath
                || oldSite.monitorXPath != site.monitorXPath
                || oldSite.removeXPath.length != site.removeXPath.length
                || oldSite.desc != site.desc
                || oldSite.contentXPath.length != site.contentXPath.length
                || oldSite.testLink.length != site.testLink.length)
            {
                return true;
            }
            for(var i=0;i<site.contentXPath.length;++i)
            {
                if (oldSite.contentXPath[i] != site.contentXPath[i])
                    return true;
            }
            for(var i=0;i<site.testLink.length;++i)
            {
                if (oldSite.testLink[i] != site.testLink[i])
                    return true;
            }

            for(var i=0;i<site.removeXPath.length;++i)
            {
                if (oldSite.removeXPath[i] != site.removeXPath[i])
                    return true;
            }
        }
        return false;
    }

    ,cloneSites: function(sites)
    {
        var newSites = new Array();
        for (var i=0;i<sites.length;++i)
        {
            var site = autopagerConfig.cloneSite(sites[i]);
            newSites.push(site);
        }
        newSites.updateSite = sites.updateSite;
        return newSites;
    }

    ,removeFromArrayByIndex : function (array,index) {
        if (index < array.length)
        {
            for(var i = index;i<array.length -1;++i)
            {
                array[i] = array[i+1];
            }
            array[array.length-1]=null;
            array.pop();
        }
    },
    removeFromArray : function(array,item) {
        var index = -1;
        for(index=0;index<array.length
            && array[index]!=item;index++)
        {
        }
        if (index>=0 && index <array.length)
        {
            autopagerConfig.removeFromArrayByIndex(array,index);
        }
    }
    , getUpdateFrame : function(doc)
    {
        var divName = "autoPagerUpdateDiv";
        var frameName = divName + "ifr";

        var frame = doc.getElementById(frameName);
        if (frame == null || !frame)
        {
            var div = autopagerMain.createDiv(doc,divName,
            "border: 0px; margin: 0px; padding: 0px; position: absolute; width: 0px; display: block; z-index: -90; left: -100px; top: -100px; height: 0px;");
            div.innerHTML = "<iframe id='" + frameName + "' name='" + frameName + "' width='100%' height='100%' src=''></iframe>";

            //var div = autopagerMain.createDiv(doc,"<div  id='" + divName + "' class='autoPagerS'  style='border: 2px solid orange; margin: 0px; padding: 0px; position: absolute; width: 600px; display: block; z-index: 90; left: 0px; top: 0px; height: 600px; '>" +
            //		"<iframe id='" + frameName + "' name='" + frameName + "' width='100%' height='100%' src=''></iframe></div>");
            frame = doc.getElementById(frameName);
        }
        return frame;
    },
    autopagerUpdate : function()
    {
        UpdateSites.updateOnline(false);
    }, autopagerGetString : function(name)
    {
        try{

            if (autopagerConfig.autopagerStrbundle == null)
                autopagerConfig.autopagerStrbundle = new autopagerStrings("autopager");
            return autopagerConfig.autopagerStrbundle.getString(name);
        }catch(e)
        {
            //alert(name + " " + e);
            return name;
        }
    },
    autopagerFormatString :function(name,parms)
    {


        try{
            if (autopagerConfig.autopagerStrbundle == null)
                autopagerConfig.autopagerStrbundle = new autopagerStrings("autopager");
            return autopagerConfig.autopagerStrbundle.getFormattedString(name, parms);
        }catch(e)
        {
            //alert(name + " " + e);
            return name;
        }
    },
    getConfigFileURI : function(fileName) {
        try{
            return Components.classes["@mozilla.org/network/io-service;1"]
            .getService(Components.interfaces.nsIIOService)
            .newFileURI(autopagerBwUtil.getConfigFile(fileName));
        }catch(e)
        {
            autopagerBwUtil.consoleLog(e);
        }
    },
    getRemoteURI : function(url)
    {
        try{
            return Components.classes["@mozilla.org/network/io-service;1"]
            .getService(Components.interfaces.nsIIOService)
            .newURI(url,"UTF-8",null);
        }catch(e)
        {
            //autopagerBwUtil.consoleError(e);
        }
    }
    ,
    autopagerGetContents : function(aURL, charset,warn){
        var str;
        try{
            if( charset == null) {
                charset = "UTF-8";
                warn = false;
            }
            var ioService=Components.classes["@mozilla.org/network/io-service;1"]
            .getService(Components.interfaces.nsIIOService);
            var scriptableStream=Components
            .classes["@mozilla.org/scriptableinputstream;1"]
            .getService(Components.interfaces.nsIScriptableInputStream);
            // http://lxr.mozilla.org/mozilla/source/intl/uconv/idl/nsIScriptableUConv.idl
            var unicodeConverter = Components
            .classes["@mozilla.org/intl/scriptableunicodeconverter"]
            .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
            unicodeConverter.charset = charset;

            var channel=ioService.newChannelFromURI(aURL);
            var input=channel.open();
            scriptableStream.init(input);
            str=scriptableStream.read(input.available());
            scriptableStream.close();
            input.close();

            try {
                return unicodeConverter.ConvertToUnicode(str);
            } catch( e ) {
                return str;
            }
        } catch( e ) {
            if (warn)
                alert("unable to load file because:" + e);
        }
    },
    loadConfig :function() {
        var allConfigs = UpdateSites.loadAll();
        return allConfigs["autopager.xml"];
    },
    reLoadConfig :function(allSiteSetting,updateSite) {
        var configContents="";
        var loaded = false;
        var jsonfile = updateSite.filename.replace(/\.xml/,".json");
        var jsonOverridefile = updateSite.filename.replace(/\.xml/,".json.override");
        try{

            configContents= autopagerBwUtil.getConfigFileContents(jsonfile);
            if (configContents!=null && configContents.length>0)
            {
                var sites= null;
                sites = autopagerJsonSetting.loadCompactFromString(configContents);
                sites.updateSite = updateSite;
                loaded = true;
                if (updateSite.filename != "autopager.xml")
                {
                    var overrideContents= autopagerBwUtil.getConfigFileContents(jsonOverridefile);
                    if (overrideContents!=null && overrideContents.length>0)
                    {
                        var overrides = autopagerBwUtil.decodeJSON(overrideContents);
                        autopagerJsonSetting.mergeOverrides(updateSite,sites,overrides);
                    }

                }
            }
        }catch(e)
        {
            loaded = false;
        }
        if (!loaded)
        {
            try{
                configContents= autopagerBwUtil.getConfigFileContents(updateSite.filename);
                var sites= null;
                sites = autopagerConfig.loadConfigFromStr(configContents,false);
                sites.updateSite = updateSite;
                //save to json
                if (sites.length>0)
                {
                    autopagerConfig.saveConfigToJsonFile(sites,autopagerBwUtil.getConfigFile(jsonfile),true);
                    //todo:delete old xml file
                }
            }catch(e)
            {
                autopagerBwUtil.consoleLog(e);
            }
        }
        allSiteSetting[updateSite.filename] = sites;
        return sites
    },
    importText :function(str,silient,callback)
    {
        if (typeof silient=='undefined')
            silient=false
        try{
            var configContents = "<root>" + str + "</root>";
            sites =  autopagerConfig.loadConfigFromStr(configContents,false);
            autopagerConfig.mergeSetting(sites,silient,callback);
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
    }
    ,importFromURL :function(func)
    {
        var url = prompt(autopagerConfig.autopagerGetString("inputurl"),
        UpdateSites.defaultSite());
        if (url!=null && url.length >0)
        {
            function callback(doc,obj)
            {
                var sites = autopagerConfig.loadConfigFromDoc(doc);
                autopagerConfig.mergeSetting(sites,false);

                if (func!=null)
                    func();
                autopagerMain.handleCurrentDoc();
            }
            function onerror(doc,obj)
            {
                //TODO:notify error
            }
            apxmlhttprequest.xmlhttprequest(UpdateSites.getUrl(url,false,0),"text/xml; charset=utf-8",callback,onerror,url);

        }
    },
    importFromClip :function()
    {
        try{
            var configContents = "<root></root>";
            var clip  = Components.classes["@mozilla.org/widget/clipboard;1"].getService(Components.interfaces.nsIClipboard);
            if (!clip) return false;

            var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
            if (!trans) return false;
            trans.addDataFlavor("text/unicode");
            clip.getData(trans, clip.kGlobalClipboard);

            var str       = new Object();
            var strLength = new Object();

            trans.getTransferData("text/unicode", str, strLength);
            if (str) str       = str.value.QueryInterface(Components.interfaces.nsISupportsString);
            if (str) configContents = str.data.substring(0, strLength.value / 2);

            sites =  autopagerConfig.loadConfigFromStr(configContents,false);
            autopagerConfig.mergeSetting(sites,false);
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
    }
    ,importFromFile : function()
    {
        try{
            var fileURI  = null;
            try{
                var file = autopagerConfig.selectFile(autopagerConfig.autopagerGetString("inputfile"),Components.interfaces.nsIFilePicker.modeOpen);

                fileURI = Components.classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService)
                .newFileURI(file);
            }catch(e){
                return;
            }
            var configContents = autopagerConfig.autopagerGetContents(fileURI);
            sites =  autopagerConfig.loadConfigFromStr(configContents,false);
            autopagerConfig.mergeSetting(sites,false);
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
    },
    exportSetting : function()
    {
        var file = autopagerConfig.selectFile(autopagerConfig.autopagerGetString("outputfile"),Components.interfaces.nsIFilePicker.modeSave);
        if (file)
        {
            autopagerConfig.autoSites = autopagerConfig.loadConfig();
            autopagerConfig.saveConfigToFile(autopagerConfig.autoSites,file,false);
        }
    },
    selectFile :function  (title,mode) {
        var fp = Components.classes["@mozilla.org/filepicker;1"]
        .createInstance(Components.interfaces.nsIFilePicker);

        var title = title;
        fp.init(window, title, mode);
        fp.appendFilters(Components.interfaces.nsIFilePicker.filterAll);


        var ret = fp.show();
        if (ret == Components.interfaces.nsIFilePicker.returnOK ||
            ret == Components.interfaces.nsIFilePicker.returnReplace) {
            return  fp.file;
        }
        return null;
    },
    getSiteIndex : function(sites,site)
    {
        if ( site.guid.length >0)
        {
            for (var i=0;i<sites.length;i++)
            {
                if (sites[i].guid == site.guid)
                    return i;
            }
        }
        for (var i=0;i<sites.length;i++)
        {
            if (sites[i].urlPattern == site.urlPattern)
                return i;
        }
        return -1;
    },
    mergeSetting : function (sites,silient,callback)
    {
        autopagerConfig.autoSites = autopagerConfig.loadConfig();
        autopagerConfig.mergeArray(autopagerConfig.autoSites,sites,silient,callback);
        autopagerConfig.saveConfig(autopagerConfig.autoSites);
        //autopagerConfig.autoSites = autopagerConfig.loadConfig();
        try{
            autopagerMain.handleCurrentDoc();
        }catch(e){}
    },
    clearLocalRules : function (sites,silient)
    {
        autopagerConfig.saveConfig([]);
        //autopagerConfig.autoSites = autopagerConfig.loadConfig();
        try{
            autopagerMain.handleCurrentDoc();
        }catch(e){}
    },
    mergeArray : function(autoSites,sites,silient,callback)
    {

        var insertCount=0;
        var updatedCount=0;
        var ignoreCount=0;
        for (var i=0;i<sites.length;i++)
        {
            var siteIndex = autopagerConfig.getSiteIndex(autoSites,sites[i]);
            if (siteIndex == -1)
            {
                autoSites.push(sites[i]);
                insertCount ++;
            }
            else
            {
                if (!(autoSites[siteIndex].changedByYou
                    || autoSites[siteIndex].createdByYou) &&
                    !(autoSites[siteIndex].guid.length > 0 && sites[i].guid.length == 0)
            )
                {
                    updatedCount++;
                    autoSites[siteIndex] = sites[i];
                }
                else
                    ignoreCount ++;
            }
        }
        var msg = autopagerConfig.autopagerFormatString("importdone",[insertCount,updatedCount,ignoreCount]);
        if (!silient)
        {
            alert(msg);
            //alert("import done with " + insertCount + " new sites and " + updatedCount +  " updated.");
        }
        if (typeof callback !='undefined')
        {
            callback({insertCount:insertCount,updatedCount:updatedCount,ignoreCount:ignoreCount});
        }

        autopagerMain.logInfo(msg,msg);
    },
    loadConfigFromUrl : function(url) {
        try{
            var configContents = autopagerConfig.autopagerGetContents(autopagerConfig.getRemoteURI(url),"UTF-8",true);
            return autopagerConfig.loadConfigFromStr(configContents,false);
        }
        catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
    },
    getValue :function(node)
    {
        if (!node.childNodes || node.childNodes.length==0)
            return "";
        var first = node.firstChild
        if (!first)
            return "";
        else
            return first.nodeValue;
    },
    autopagerGetNode : function(doc)
    {
        return doc.evaluate("//site", doc, null, 0, null);
    },
    loadConfigFromDoc : function(doc) {
        var sites = new Array();
        var nodes = autopagerConfig.autopagerGetNode(doc);
        var miniMargin = autopagerMain.getMiniMargin();
        if (nodes == null)
            return sites;
        var hasQuickLoad = false;
        for (var node = null; (node = nodes.iterateNext()); ) {
            var site = new Site();
            var ajax = false;
            var needMouseDown = false;
            var published =false;
            var enabled = true;
            var enableJS = true;
            var quickLoad = false;
            var fixOverflow = false;
            var isRegex = false;
            var createdByYou = false;
            var changedByYou = false;
            var childNode = node.firstChild
            while(childNode)
            {
                var nodeName = childNode.nodeName;
                if (nodeName == "#text")
                {
                    childNode = childNode.nextSibling
                    continue;
                }
                else if (nodeName == "urlPattern") {
                    site.urlPattern = autopagerConfig.getValue(childNode);
                }
                else  if (nodeName == "guid") {
                    site.guid = autopagerConfig.getValue(childNode);
                }else if (nodeName == "urlIsRegex") {
                    isRegex	= (autopagerConfig.getValue(childNode) == 'true' || autopagerConfig.getValue(childNode) == '1');
                }
                else if (nodeName == "margin") {
                    var val = autopagerConfig.getValue(childNode);
                    if (autopagerConfig.isNumeric(val))
                    {
                        if (val>miniMargin)
                            site.margin = val;
                        else
                            site.margin = miniMargin;
                    }
                }
                else if (nodeName == "minipages") {
                    var minipages = autopagerConfig.getValue(childNode);
                    if (autopagerConfig.isNumeric(val))
                    {
                        site.minipages = minipages;
                    }
                }
                else if (nodeName == "delaymsecs") {
                    var delaymsecs = autopagerConfig.getValue(childNode);
                    if (autopagerConfig.isNumeric(val))
                    {
                        site.delaymsecs = delaymsecs;
                    }
                }
                else if (nodeName == "desc") {
                    site.desc	= autopagerConfig.getValue(childNode);
                }
                else if (nodeName == "linkXPath") {
                    site.linkXPath	= autopagerConfig.getValue(childNode);
                }
                else if (nodeName == "containerXPath") {
                    site.containerXPath	= autopagerConfig.getValue(childNode);
                }
                else if (nodeName == "contentXPath") {
                    site.contentXPath.push(autopagerConfig.getValue(childNode));
                }
                else if (nodeName == "testLink") {
                    site.testLink.push(autopagerConfig.getValue(childNode));
                }
                else if (nodeName == "removeXPath") {
                    site.removeXPath.push(autopagerConfig.getValue(childNode));
                }
                else if (nodeName == "enabled") {
                    enabled	= (autopagerConfig.getValue(childNode) == 'true' || autopagerConfig.getValue(childNode) == '1');
                }
                else if (nodeName == "enableJS") {
                    enableJS	= autopagerConfig.getValue(childNode);
                    //alert(site.enableJS + " " + childNode.firstChild.nodeValue);
                }
                else if (nodeName == "needMouseDown") {
                    needMouseDown	= (autopagerConfig.getValue(childNode) == 'true' || autopagerConfig.getValue(childNode) == '1');
                }
                else if (nodeName == "ajax") {
                    ajax	= (autopagerConfig.getValue(childNode) == 'true' || autopagerConfig.getValue(childNode) == '1');
                }
                else if (nodeName == "quickLoad") {
                    quickLoad	= (autopagerConfig.getValue(childNode) == 'true' || autopagerConfig.getValue(childNode) == '1');
                }
                else if (nodeName == "fixOverflow") {
                    fixOverflow	= (autopagerConfig.getValue(childNode) == 'true' || autopagerConfig.getValue(childNode) == '1');
                    //alert(site.fixOverflow + " " + childNode.firstChild.nodeValue);
                }
                else if (nodeName == "createdByYou") {
                    createdByYou	= (autopagerConfig.getValue(childNode) == 'true' || autopagerConfig.getValue(childNode) == '1');
                }
                else if (nodeName == "changedByYou") {
                    changedByYou	= (autopagerConfig.getValue(childNode) == 'true' || autopagerConfig.getValue(childNode) == '1');
                }else if (nodeName == "owner") {
                    site.owner	= autopagerConfig.getValue(childNode) ;
                }
                else if (nodeName == "published") {
                    published	= (autopagerConfig.getValue(childNode) == 'true' || autopagerConfig.getValue(childNode) == '1');
                }
                else if (nodeName == "monitorXPath") {
                    site.monitorXPath	= autopagerConfig.getValue(childNode);
                }
                childNode = childNode.nextSibling
            }
            site.ajax = ajax;
            site.needMouseDown = needMouseDown;
            site.published = published;
            site.enabled = enabled;
            site.enableJS = enableJS;
            site.quickLoad = quickLoad;
            site.fixOverflow = fixOverflow;
            site.isRegex = isRegex;
            site.createdByYou = createdByYou;
            site.changedByYou = changedByYou;

            if (site.guid.length == 0 && site.createdByYou)
                site.guid = autopagerConfig.generateGuid();
            sites.push(site);
        }
        return sites;
    },
    loadConfigFromStr : function(configContents,remote) {
        var sites = null;
        try{

            var doc = autopagerConfig.autopagerDomParser.parseFromString(configContents, "text/xml");
            sites = autopagerConfig.loadConfigFromDoc(doc);
        }catch(e)
        {
            autopagerBwUtil.consoleLog(e);
        }
        if (remote && sites.length ==0 )
        {
            //sites = autopagerConfig.loadConfigFromUrl(UpdateSites.defaultSite());
            //autopagerConfig.saveConfig(sites);
        }
        return sites;
    },
    newSite : function(urlPattern,desc,linkXPath,contentXPath,testLink)
    {
        var site = new Site();
        site.urlPattern = urlPattern;
        site.desc =desc;
        site.linkXPath = linkXPath;
        if (contentXPath[0].length == 1)
            site.contentXPath[0] = contentXPath;
        else
        {
            for(var i=0;i<contentXPath.length;++i)
                site.contentXPath[i] = contentXPath[i];
        }
        //	if (testLink[0].length == 1)
        //		site.testLink[0] = testLink;
        //	else
        {
            for(var i=0;i<testLink.length;++i)
                site.testLink[i] = testLink[i];
        }
        site.guid = autopagerConfig.generateGuid();
        site.quickLoad = true;
        return site;
    },
    saveAllOverride : function (allSites)
    {
        for (var key in allSites)
        {
            var updateSite = allSites[key].updateSite;
            if (updateSite.fileName =='smartpaging.xml' || updateSite.fileName == 'testing.xml' || updateSite.fileName == 'autopager.xml')
                continue;
            var jsonfile = updateSite.filename.replace(/\.xml/,".json.override");
            autopagerConfig.saveOverrideToJsonFile(allSites[key], autopagerBwUtil.getConfigFile(jsonfile));
        }
    },
    saveOverrideToJsonFile: function(sites,saveFile)
    {
        try{
            var fStream = autopagerConfig.getWriteStream(saveFile);
            var configStream = autopagerConfig.getConverterWriteStream(fStream);
            var str = autopagerJsonSetting.saveOverrideToCompactString(sites);
            configStream.writeString(str);
            configStream.close();
            fStream.close();
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
    },

    saveConfigXML : function(sites) {
        autopagerConfig.saveConfigToFile(sites,autopagerBwUtil.getConfigFile("autopager.xml"),true);
        var allConfigs = UpdateSites.loadAll();
        //sites.updateSite = allConfigs["autopager.xml"].updateSite;
        allConfigs["autopager.xml"] = sites;
        UpdateSites.AutopagerCOMP.setAll(allConfigs);
    },
    saveConfigJSON : function(sites) {
        autopagerConfig.saveConfigToJsonFile(sites,autopagerBwUtil.getConfigFile("autopager.json"),true);
        var allConfigs = UpdateSites.loadAll();
        //sites.updateSite = allConfigs["autopager.xml"].updateSite;
        allConfigs["autopager.xml"] = sites;
        UpdateSites.AutopagerCOMP.setAll(allConfigs);
    },
    saveConfigToJsonFile: function(sites,saveFile,includeChangeInfo)
    {
        try{
            var str = autopagerJsonSetting.saveNormalToCompactString(sites);
            autopagerBwUtil.saveContentToFile(str,saveFile);
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
        //UpdateSites.allSiteSetting= UpdateSites.loadAll();
        autopagerPref.setDatePrefs("settingupdatedate", new Date());
    },
    saveConfig : function(sites) {
        autopagerConfig.saveConfigJSON(sites);
    },
    createNode : function(siteNode,name,value)
    {
        var doc = siteNode.ownerDocument;
        var node = doc.createElement(name);
        node.appendChild(doc.createTextNode(value));
        siteNode.appendChild(node);
        siteNode.appendChild(doc.createTextNode("\n"));
    },
    saveConfigToFile: function(sites,saveFile,includeChangeInfo) {

        try{
            var doc = document.implementation.createDocument("", "autopager", null);
            doc.firstChild.appendChild(doc.createTextNode("\n"))

            if (sites!=null)
            {
                for (var i = 0, siteObj = null; (siteObj = sites[i]); i++) {
                    var siteNode = doc.createElement("site");

                    if (siteObj.createdByYou && siteObj.guid.length == 0)
                        siteObj.guid = autopagerConfig.generateGuid();
                    autopagerConfig.createNode(siteNode,"urlPattern",siteObj.urlPattern);
                    autopagerConfig.createNode(siteNode,"guid",siteObj.guid);
                    if (siteObj.margin>autopagerMain.getMiniMargin())
                        autopagerConfig.createNode(siteNode,"margin",siteObj.margin);
                    if (siteObj.minipages>=0)
                        autopagerConfig.createNode(siteNode,"minipages",siteObj.minipages);
                    if (siteObj.delaymsecs>=0)
                        autopagerConfig.createNode(siteNode,"delaymsecs",siteObj.delaymsecs);
                    autopagerConfig.createNode(siteNode,"owner",siteObj.owner);

                    if (siteObj.isRegex)
                        autopagerConfig.createNode(siteNode,"urlIsRegex",siteObj.isRegex);
                    if (!siteObj.enabled)
                        autopagerConfig.createNode(siteNode,"enabled",siteObj.enabled);

                    if (!siteObj.enableJS)
                        autopagerConfig.createNode(siteNode,"enableJS",siteObj.enableJS);

                    if (siteObj.quickLoad)
                        autopagerConfig.createNode(siteNode,"quickLoad",siteObj.quickLoad);

                    if (siteObj.fixOverflow)
                        autopagerConfig.createNode(siteNode,"fixOverflow",siteObj.fixOverflow);

                    if (siteObj.ajax)
                        autopagerConfig.createNode(siteNode,"ajax",siteObj.ajax);

                    if (siteObj.needMouseDown)
                        autopagerConfig.createNode(siteNode,"needMouseDown",siteObj.needMouseDown);

                    if (siteObj.published)
                        autopagerConfig.createNode(siteNode,"published",siteObj.published);

                    for(var x=0;x<siteObj.contentXPath.length;++x)
                    {
                        autopagerConfig.createNode(siteNode,"contentXPath",siteObj.contentXPath[x]);
                    }
                    for(var x=0;x<siteObj.testLink.length;++x)
                    {
                        autopagerConfig.createNode(siteNode,"testLink",siteObj.testLink[x]);
                    }
                    for(var x=0;x<siteObj.removeXPath.length;++x)
                    {
                        autopagerConfig.createNode(siteNode,"removeXPath",siteObj.removeXPath[x]);
                    }

                    autopagerConfig.createNode(siteNode,"linkXPath",siteObj.linkXPath);
                    if (siteObj.containerXPath!=null && siteObj.containerXPath.length>0)
                        autopagerConfig.createNode(siteNode,"containerXPath",siteObj.containerXPath);

                    if (siteObj.monitorXPath!=null && siteObj.monitorXPath.length>0)
                        autopagerConfig.createNode(siteNode,"monitorXPath",siteObj.monitorXPath);

                    if (siteObj.desc!=null && siteObj.desc.length>0)
                        autopagerConfig.createNode(siteNode,"desc",siteObj.desc);

                    if (includeChangeInfo)
                    {
                        if (siteObj.createdByYou)
                            autopagerConfig.createNode(siteNode,"createdByYou",siteObj.createdByYou);
                        if (siteObj.changedByYou)
                            autopagerConfig.createNode(siteNode,"changedByYou",siteObj.changedByYou);
                    }

                    doc.firstChild.appendChild(siteNode);
                    doc.firstChild.appendChild(doc.createTextNode("\n"));
                }
            }
            var configStream = autopagerConfig.getWriteStream(saveFile);
            new window.XMLSerializer().serializeToStream(doc, configStream, "utf-8");
            configStream.close();
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
        //UpdateSites.allSiteSetting= UpdateSites.loadAll();

        autopagerPref.setDatePrefs("settingupdatedate", new Date());
    },
    getWriteStream : function(file) {
        var stream = Components.classes["@mozilla.org/network/file-output-stream;1"]
        .createInstance(Components.interfaces.nsIFileOutputStream);

        stream.init(file, 0x02 | 0x08 | 0x20, 420, 0);

        return stream;
    },
    getConverterWriteStream : function(output) {
        var stream = Components.classes["@mozilla.org/intl/converter-output-stream;1"]
        .createInstance(Components.interfaces.nsIConverterOutputStream);

        stream.init(output, "UTF-8", 0, 0x0000);
        return stream;
    }

};
UpdateSites.init();

/*
  sanitize privte data by clear the file site-confirm.xml
 */
var autopagerSanitizer = {
    addSanitizeItem: function ()
    {
        window.removeEventListener('load', autopagerSanitizer.addSanitizeItem, true);
        if (typeof Sanitizer != 'function')
            return;
        // Sanitizer will execute this
        Sanitizer.prototype.items['extensions-autopager'] = {
            clear : function() {
                try {
                    autopagerSanitizer.sanitize();
                } catch (ex) {
                    try { Components.utils.reportError(ex); } catch(ex) {}
                }
            },
            get canClear() {
                return true;
            }
        }
    },

    addMenuItem: function ()
    {
        var prefs = document.getElementsByTagName('preferences')[0];
        var firstCheckbox = document.getElementsByTagName('checkbox')[0];
        if (prefs && firstCheckbox) // if this isn't true we are lost :)
        {
            var pref = document.createElement('preference');
            pref.setAttribute('id', 'privacy.item.extensions-autopager');
            pref.setAttribute('name', 'privacy.item.extensions-autopager');
            pref.setAttribute('type', 'bool');
            prefs.appendChild(pref);

            var check = document.createElement('checkbox');
            check.setAttribute('label', autopagerSanitize.label);
            check.setAttribute('accesskey', autopagerSanitize.accesskey);
            check.setAttribute('preference', 'privacy.item.extensions-autopager');
            check.setAttribute('oncommand', 'autopagerSanitizer.confirm(this);');
            firstCheckbox.parentNode.insertBefore(check, firstCheckbox);

            if (typeof(gSanitizePromptDialog) == 'object')
            {
                pref.setAttribute('readonly', 'true');
                check.setAttribute('onsyncfrompreference', 'return gSanitizePromptDialog.onReadGeneric();');
            }
        }
    },

    confirm: function (aCheckbox)
    {
        if (!aCheckbox.checked)
            return;

        var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
        .getService(Components.interfaces.nsIPromptService);

        var title = "AutoPager - " + document.title;
        var msg = autopagerSanitize.confirm;
        var buttonPressed = promptService.confirmEx(null,
        title,
        msg,
        (promptService.BUTTON_TITLE_YES * promptService.BUTTON_POS_0)
            + (promptService.BUTTON_TITLE_NO * promptService.BUTTON_POS_1),
        null, null, null, null, {});
        if (buttonPressed == 1)
            aCheckbox.checked = false;
    },

    isSanitizeAPwithoutPrompet: function ()
    {
        var prefService = Components.classes["@mozilla.org/preferences-service;1"]
        .getService(Components.interfaces.nsIPrefBranch);

        try {
            var promptOnSanitize = prefService.getBoolPref("privacy.sanitize.promptOnSanitize");
        } catch (e) { promptOnSanitize = true;}

        // if promptOnSanitize is true we call autopagerSanitizer.sanitize from Firefox Sanitizer
        if (promptOnSanitize)
            return false;

        try {
            var sanitizeAutopager = prefService.getBoolPref("privacy.item.extensions-autopager");
        } catch (e) { sanitizeAutopager = false;}

        if (!sanitizeAutopager)
            return false;

        return true;
    },

    tryToSanitize: function ()
    {
        if (this.isSanitizeAPwithoutPrompet()) {
            this.sanitize();
            return true;
        }

        return false;
    },

    sanitize: function AP_SN_sanitize()
    {
        UpdateSites.AutopagerCOMP.setSiteConfirms(new Array());
        autopagerConfig.saveConfirm(new Array());
        //autopagerPref.resetPref("noprompt")
    },
    onWindowClose : function()
    {
        try{
            window.removeEventListener("unload", autopagerSanitizer.onWindowClose, false);
            if (autopagerUtils.isLastWindow())
            {
                var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                .getService(Components.interfaces.nsIPrefBranch);
                if (prefService.getBoolPref("privacy.sanitize.sanitizeOnShutdown"))
                    autopagerSanitizer.tryToSanitize();
            }
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
    }
}
