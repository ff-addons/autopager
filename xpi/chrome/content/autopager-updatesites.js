
function AutoPagerUpdateType(type,defaultLocales,defaultUrl,contentType,filenamePrefix,callback,xpath,desc)
{
    this.type=type;
    this.defaultLocales = defaultLocales;
    this.defaultUrl=defaultUrl;
    this.contentType = contentType;
    this.filenamePrefix = filenamePrefix;
    this.callback = callback;
    this.xpath = xpath;
    this.desc=desc;
}

function AutoPagerUpdateSite(owner,locales,url,contenttype,desc,filename,xpath,enabled,typeName,updateperiod,backupUrls)
{
    if (owner!=null)
    {
        this.owner = owner;
        this.locales=locales;
        this.url=url;
        this.contenttype=contenttype;
        this.filename = filename;
        this.enabled = enabled;
        this.xpath = xpath;
        this.desc=desc;
        this.updateType = AutoPagerUpdateTypes.getType(typeName);
        this.callback = this.updateType.callback;
        this.updateperiod = updateperiod;//use global setting

		this.backupUrls = backupUrls;
    }
    this.triedTime=0;
	this.triedBackup = 0;
    this.defaulted = true;
    this.lastupdate =null;
}

var AutoPagerUpdateTypes = 
{
    types : null,
    updateSites: null,
	backupUrls: [],
	triedBackup: 0,
    init : function (){
        if (this.types == null)
        {
            this.types =  new Array();

            this.types.push(new AutoPagerUpdateType("autopager-xml","all",
            "http://rep.teesoft.info/autopager/json/?version={version}&lastupdate={timestamp}&all={all}",
            "application/json; charset=utf-8",
            "ap-",this.autopagerConfigCallback,"//site",
            "default configurations on teesoft.info"));
            
            this.types.push(new AutoPagerUpdateType("autopager-lite","all",
            autopagerPref.loadPref("repository-site") + "discover/json?ids={ids}&version={version}&lastupdate={timestamp}&all={all}",
            "application/json; charset=utf-8",
            "ap-",this.autopagerConfigCallback,"//site",
            "Lite configurations on teesoft.info"));

            this.types.push(new AutoPagerUpdateType("autopager-freetext","all",
            "http://examplehost/examplepage",
            "text/html; charset=utf-8",
            "af-",this.blogConfigCallback,"//div[@class='autopager-setting']","configurations in web pages"));

            this.types.push(new AutoPagerUpdateType("autopagerize","all",
            "http://swdyh.infogami.com/autopagerize","text/html; charset=utf-8",
            "az-",AutoPagerize.onload,'//*[@class="autopagerize_data"]',"autopagerize configurations"));

            this.types.push(new AutoPagerUpdateType("autopagerize-json","all",
            "http://wedata.net/databases/AutoPagerize/items.json?lastupdate={timestamp}","text/plain; charset=utf-8",
            "az-",AutoPagerize.onJsonLoad,'//*[@class="autopagerize_data"]',"autopagerize configurations"));

        }
    },
    getType : function (name)
    {
        for(var i in this.types)
        {
            if (this.types[i].type == name)
            {
                return this.types[i];
            }
        }
        return null;
    },
    getUpdateSites : function()
    {
        var sites = AutoPagerUpdateTypes.loadAllSites();
        if (sites == null|| sites.length==0)
        {
            sites = this.getDefaultSites();
            for(var i=0;i<sites.length;i++)
            {
                    var newSite = autopagerUtils.clone(sites[i]);
                    newSite.referred = sites[i];
                    sites[i]= newSite;
                    if (sites[i].filename == "chinalist.xml" && autopagerUtils.isChineseLocale())
                    {
                        newSite.enabled = true;
                    }
            }
            //this.saveSettingSiteConfig(sites);
        }
        return sites;
    },
    getDefaultSites : function()
    {
            var sites = new Array();
        
//            sites.push(new AutoPagerUpdateSite("pagerization","all",
//                        "http://k75.s321.xrea.com/pagerization/siteinfo","text/html; charset=utf-8",
//                        "pagerization configurations",
//                        "pagerization.xml",'//*[@class="autopagerize_data"]',false,"autopagerize",0,[]));
            var lite = autopagerLite.isInLiteMode();
            var withlite = autopagerPref.loadBoolPref("with-lite-rules");

            if(!lite)
            {
            if (!autopagerBwUtil.isFennec())
            {
            sites.push(new AutoPagerUpdateSite("autopagerize","all",
                        "http://swdyh.infogami.com/autopagerize","text/html; charset=utf-8",
                        "autopagerize configurations",
                        "autopagerize.xml",'//*[@class="autopagerize_data"]',false,"autopagerize",0,[]));

            sites.push(new AutoPagerUpdateSite("autopagerize","all",
                        "http://rep.teesoft.info/autopager/AutoPagerize/items.json?lastupdate={timestamp}","text/plain; charset=utf-8",
                        "autopagerize new configurations. Use our cached version first. Use the orgnial sites if our cache failed.\nhttp://wedata.net/databases/AutoPagerize/items.json?lastupdate={timestamp},http://utatane.appjet.net/databases/AutoPagerize/items.json",
                        "autopagerizeJson.xml",'',true,"autopagerize-json",168,["http://wedata.net/databases/AutoPagerize/items.json?lastupdate={timestamp}","http://utatane.appjet.net/databases/AutoPagerize/items.json"]));

            sites.push(new AutoPagerUpdateSite("chinalist","all",
                        "http://www.quchao.com/projects/chinalist/","text/html; charset=utf-8",
                        "pagerization chinalist configurations",
                        "chinalist.xml",'//*[@class="autopagerize_data"]',false,"autopagerize",168,[]));
            
            sites.push(new AutoPagerUpdateSite("Wind Li","all",
                        "http://blogs.sun.com/wind/entry/autopager_site_config#comments","text/html; charset=utf-8",
                        "configurations added to blog",
                        "blogcomments.xml","//div[@class='comment even' or @class='comment odd']",false,"autopager-freetext",0,[]));

                    
            sites.push(new AutoPagerUpdateSite("Wind Li","all",
                        "http://autopager.mozdev.org/conf.d/autopager.xml","text/xml; charset=utf-8",
                        "default configurations on autopager.mozdev.org",
                        "autopagerMozdev.xml","//site",true,"autopager-xml",0,[]));
            }
            sites.push(new AutoPagerUpdateSite("Wind Li","all",
                        "http://rep.teesoft.info/autopager/json/?approvedOnly=0&version={version}&lastupdate={timestamp}&all={all}","application/json; charset=utf-8",
                        "Experimental configurations @ teesoft.info, please don't enable this.",
                        "autopagerBeta.xml","//site",false,"autopager-xml",-2,[
                            "http://vps.teesoft.info/autopager/json/?approvedOnly=0&version={version}&lastupdate={timestamp}&all={all}",
                            "http://stone.teesoft.info/autopager/json/?approvedOnly=0&version={version}&lastupdate={timestamp}&all={all}",
                            "http://s2.teesoft.info/autopager/json/?approvedOnly=0&version={version}&lastupdate={timestamp}&all={all}"]));

            sites.push(new AutoPagerUpdateSite("Wind Li","all",
                        "http://rep.teesoft.info/autopager/json/?version={version}&lastupdate={timestamp}&all={all}","application/json; charset=utf-8",
                        "default configurations @ teesoft.info",
                        "autopagerTee.xml","//site",true,"autopager-xml",-2,
                                ["http://vps.teesoft.info/autopager/json/?version={version}&lastupdate={timestamp}&all={all}",
                                "http://stone.teesoft.info/autopager/json/?version={version}&lastupdate={timestamp}&all={all}",
                                "http://s2.teesoft.info/autopager/json/?version={version}&lastupdate={timestamp}&all={all}",
                                "http://es4.teesoft.info/autopager/json/?version={version}&lastupdate={timestamp}&all={all}",
                                "http://member.teesoft.info/autopager/json/?version={version}&lastupdate={timestamp}&all={all}",
                                "http://shared.teesoft.info/autopager/json/?version={version}&lastupdate={timestamp}&all={all}",
                                "http://wind.liyong.googlepages.com/autopager.json?version={version}&lastupdate={timestamp}&all={all}",
                                "http://teesoft.co.cc/autopager/json/?version={version}&lastupdate={timestamp}&all={all}"]));


            }
            if(withlite || lite)
            {
            sites.push(new AutoPagerUpdateSite("Wind Li","all",
                        autopagerPref.loadPref("repository-site") +"discover/json?ids={ids}&version={version}&lastupdate={timestamp}&all={all}","application/json; charset=utf-8",
                        "AutoPager Lite Configurations @ teesoft.info",
                        "autopagerLite.xml","//site",true,"autopager-lite",-2,
                                ["http://vps.teesoft.info/autopager/json/?version={version}&lastupdate={timestamp}&all={all}",
                                "http://stone-ap.teesoft.info/discover/json?ids={ids}&version={version}&lastupdate={timestamp}&all={all}",
                                "http://s1-ap.teesoft.info/discover/json?ids={ids}&version={version}&lastupdate={timestamp}&all={all}",
                                "http://member-ap.teesoft.info/discover/json?ids={ids}&version={version}&lastupdate={timestamp}&all={all}",
                                "http://es4-ap.teesoft.info/discover/json?ids={ids}&version={version}&lastupdate={timestamp}&all={all}"]));
            }
            sites.push(new AutoPagerUpdateSite("Wind Li","all",
                        "","text/html; charset=utf-8",
                        "user created configurations",
                        "autopager.xml","//site",true,"autopager-xml",-2,[]));
           return sites;
        
    },
    xmlConfigCallback : function(doc,updatesite)
    {
        var sites = autopagerConfig.loadConfigFromDoc(doc);
        return sites;
    },
    autopagerConfigCallback : function(doc,updatesite)
    {
        var sites = null;
        if (typeof doc =='string')
            sites = autopagerJsonSetting.loadCompactFromString(doc);
        else
            sites = autopagerConfig.loadConfigFromDoc(doc);
        return sites;
    },
    blogConfigCallback : function(doc,updatesite)
    {
        var commentPath= updatesite.xpath;// "//div[@class='comment even' or @class='comment odd']";
        var nodes =doc.evaluate(commentPath, doc, null, 0, null);
        var allSites = new Array();
        for (var node = null; (node = nodes.iterateNext()); ) {
            
            var sites = autopagerConfig.loadConfigFromStr( "<root>" + node.textContent + "</root>",false);
            autopagerConfig.mergeArray(allSites,sites,true);
        }
        return allSites;
    },
    loadAllSites : function ()
    {
        
        var configContents="";
        var sites= null;
        var newSites = [];
        try{
            var file = "all-sites.xml";
            if (autopagerLite.isInLiteMode())
                file = "all-sites-lite.xml";
            configContents= autopagerBwUtil.getConfigFileContents(file);
            var doc = autopagerConfig.autopagerDomParser.parseFromString(configContents, "text/xml");
            sites = this.loadSettingSitesFromDoc(doc);
			var defaultSites = this.getDefaultSites();
			var needSave = false;
            for(var i in sites)
            {
				var site = sites[i];
                var found = false;
				for(var h in defaultSites)
				{
					var defaultSite = defaultSites[h]
                    if (defaultSite.filename == site.filename)
                    {
                        if (typeof site.url != 'undefined')
                            needSave = true;
                        var newSite = autopagerUtils.clone(defaultSite);

                        newSite.referred = defaultSite;
                        if (typeof site.enabled != 'undefined')
                            newSite.enabled = site.enabled;
                        if (needSave && site.filename == "chinalist.xml")
                        {
                            var isChineseLocale = autopagerUtils.isChineseLocale();
                            if (isChineseLocale)
                                newSite.enabled = true;
                        }
                        if (typeof site.updateType != 'undefined')
                            newSite.updateType = site.updateType;
                        if (typeof site.updateperiod != 'undefined')
                            newSite.updateperiod = site.updateperiod;
                        newSite.lastupdate = site.lastupdate
                        newSites.push(newSite);
                        found = true;
                        break;
                    }
				}
                if (!found && (typeof site.url != 'undefined'))
                {
                    newSites.push(site)
                }
            }
            //process the items added in default sites
            for(var h= defaultSites.length-1;h>=0;h--)
            {
                var defaultSite = defaultSites[h]
                var found = false;

                for(var i in sites)
                {
                    var site = sites[i];
                    if (defaultSite.filename == site.filename)
                    {
                        found = true;
                        break;
                    }
                }
                if (!found)
                {
                    var newSite = autopagerUtils.clone(defaultSite);
                    newSite.referred = defaultSite;
                    var off = defaultSites.length - h-1;
                    var pos = newSites.length-off

                    if(pos<0 || pos>newSites.length-1)
                        pos=newSites.length-1
                    newSites.splice(pos,0,newSite)
                    needSave = true;
                }
            }
            if (needSave)
            {
                this.saveSettingSiteConfig(newSites);
            }
                      
        }catch(e)
        {
            //autopagerBwUtil.consoleError(e);
        }
        return newSites;
        
    },
    loadSettingSitesFromDoc : function (doc)
    {
        var sites = new Array();
    
        var nodes = doc.evaluate("//update-site", doc, null, 0, null);
        if (nodes == null)
            return sites;
        for (var node = null; (node = nodes.iterateNext()); ) {
            var site = new AutoPagerUpdateSite();

            var childNodes = node.childNodes;
            //childNode = childNodes[i]
            for (var i = 0, childNode = null; (childNode = childNodes[i]) ; i++) {
                var nodeName = childNode.nodeName;
                if (nodeName == "owner") {
                    site.owner	= autopagerConfig.getValue(childNode) ;
                }
                else if (nodeName == "locales") {
                    site.locales = autopagerConfig.getValue(childNode);
                }else  if (nodeName == "url") {
                    site.url = autopagerConfig.getValue(childNode);
                }else if (nodeName == "contenttype") {
                    site.contenttype	= (autopagerConfig.getValue(childNode) == 'true');
                }
                else if (nodeName == "desc") {
                    site.desc = autopagerConfig.getValue(childNode);
                }
                else if (nodeName == "filename") {
                    site.filename	= autopagerConfig.getValue(childNode);
                }
                else if (nodeName == "updateType") {
                    site.updateType	= AutoPagerUpdateTypes.getType(autopagerConfig.getValue(childNode));
                    site.callback = site.updateType.callback;
                    if (site.contenttype==null || site.contenttype=="")
                        site.contenttype = site.updateType.contentType;
                }
                else if (nodeName == "enabled") {
                    site.enabled = (autopagerConfig.getValue(childNode) == 'true');
                }
                else if (nodeName == "xpath") {
                    site.xpath	= autopagerConfig.getValue(childNode) ;
                }
                else if (nodeName == "updateperiod") {
                    site.updateperiod	= autopagerConfig.getValue(childNode) ;
                }
                else if (nodeName == "lastupdate") {
                    site.lastupdate	= autopagerConfig.getValue(childNode) ;
                }                
                else if (nodeName == "defaulted") {
                    site.defaulted	= autopagerConfig.getValue(childNode) ;
                }                
                else if (nodeName == "backupUrl") {
					if (site.backupUrls==null)
						site.backupUrls = [];

                    site.backupUrls.push(autopagerConfig.getValue(childNode));
                }
                
            }
            sites.push(site);
        }
        return sites;
        
    },
    saveAllSettingSiteConfig : function() {
        this.saveSettingSiteConfig(UpdateSites.getUpdateSites());
    },
    saveSettingSiteConfig : function(sites) {
        var file = "all-sites.xml";
        if (autopagerLite.isInLiteMode())
            file = "all-sites-lite.xml";
        this.saveSettingSiteConfigToFile(sites,autopagerBwUtil.getConfigFile(file));
    },    
    saveSettingSiteConfigToFile : function(sites,saveFile) {
        try{
            var doc = document.implementation.createDocument("", "all-sites", null);
            doc.firstChild.appendChild(doc.createTextNode("\n"))
            
            if (sites!=null)
            {
                for (var i = 0, siteObj = null; (siteObj = sites[i]); i++) {
                    var siteNode = doc.createElement("update-site");
                    if (typeof siteObj.referred == 'undefined')
                    {
                        autopagerConfig.createNode(siteNode,"enabled",siteObj.enabled);
                        autopagerConfig.createNode(siteNode,"updateType",siteObj.updateType.type);
                        autopagerConfig.createNode(siteNode,"updateperiod",siteObj.updateperiod);

                        autopagerConfig.createNode(siteNode,"owner",siteObj.owner);
                        autopagerConfig.createNode(siteNode,"locales",siteObj.locales);
                        autopagerConfig.createNode(siteNode,"url",siteObj.url);
                        autopagerConfig.createNode(siteNode,"contenttype",siteObj.contenttype);
                        autopagerConfig.createNode(siteNode,"xpath",siteObj.xpath);
                        autopagerConfig.createNode(siteNode,"desc",siteObj.desc);
                        autopagerConfig.createNode(siteNode,"defaulted",siteObj.defaulted);
                        if (siteObj.backupUrls!=null)
                        {
                            for(var u=0;u<siteObj.backupUrls.length;u++)
                                autopagerConfig.createNode(siteNode,"backupUrl",siteObj.backupUrls[u]);
                        }
                    }
                    else
                    {
                        if (siteObj.enabled != siteObj.referred.enabled)
                        {
                            autopagerConfig.createNode(siteNode,"enabled",siteObj.enabled);                                
                        }
                        if (siteObj.updateType.type != siteObj.referred.updateType.type)
                        {
                            autopagerConfig.createNode(siteNode,"updateType",siteObj.updateType.type);                                
                        }
                        if (siteObj.updateperiod != siteObj.referred.updateperiod)
                        {
                            autopagerConfig.createNode(siteNode,"updateperiod",siteObj.updateperiod);                                
                        }
                    }
                    autopagerConfig.createNode(siteNode,"filename",siteObj.filename);
                    autopagerConfig.createNode(siteNode,"lastupdate",siteObj.lastupdate);

                    doc.firstChild.appendChild(siteNode);
                    doc.firstChild.appendChild(doc.createTextNode("\n"));
                }
            }
            autopagerBwUtil.saveContentToFile(new XMLSerializer().serializeToString(doc),saveFile);

//            var configStream = autopagerConfig.getWriteStream(saveFile);
//            new XMLSerializer().serializeToStream(doc, configStream, "utf-8");
//            configStream.close();
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
    }
}
AutoPagerUpdateTypes.init();
