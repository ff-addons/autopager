var UpdateSites=
{
    updateSites: null,
    allSiteSetting: null,
    submitCount:0,
    AutopagerCOMP:null,
    init:function()
    {
        function xmlConfigCallback(doc,updatesite)
        {
            var sites = autopagerConfig.loadConfigFromDoc(doc);
            return sites;
        }
        function blogConfigCallback(doc,updatesite)
        {
            var commentPath="//div[@class='comment even' or @class='comment odd']";
            var nodes =doc.evaluate(commentPath, doc, null, 0, null);
                var allSites = new Array();
                for (var node = null; (node = nodes.iterateNext()); ) {

                        //alert(node.textContent);
                        var sites = autopagerConfig.loadConfigFromStr( "<root>" + node.textContent + "</root>",false);
                        //alert(sites.length);
                        autopagerConfig.mergeArray(allSites,sites,true);
                }
            return allSites;
        }
try {
        // this is needed to generally allow usage of components in javascript
        //netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

        this.AutopagerCOMP = Components.classes['@www.teesoft.com/AutopagerCOMP;1'].getService().wrappedJSObject;

        //alert(myComponent.loadAll());
} catch (anError) {
}
    
        if (this.updateSites == null)
        {
            this.updateSites =  new Array();

            this.updateSites.push(new UpdateSite("pagerization","all",
                        "http://userjs.oh.land.to/pagerization/convert.php?file=siteinfo.v4","text/html; charset=utf-8",
                        "pagerization configurations",
                        "pagerization.xml",AutoPagerize.onload));

            this.updateSites.push(new UpdateSite("autopagerize","all",
                        "http://swdyh.infogami.com/autopagerize","text/html; charset=utf-8",
                        "autopagerize configurations",
                        "autopagerize.xml",AutoPagerize.onload));


            this.updateSites.push(new UpdateSite("chinalist","all",
                        "http://www.quchao.com/projects/chinalist/","text/html; charset=utf-8",
                        "pagerization chinalist configurations",
                        "chinalist.xml",AutoPagerize.onload));
            
            this.updateSites.push(new UpdateSite("Wind Li","all",
                        "http://blogs.sun.com/wind/entry/autopager_site_config#comments","text/html; charset=utf-8",
                        "configurations added to blog",
                        "blogcomments.xml",blogConfigCallback));

                    
            this.updateSites.push(new UpdateSite("Wind Li","all",
                        "http://autopager.mozdev.org/conf.d/autopager.xml","text/xml; charset=utf-8",
                        "default configurations on autopager.mozdev.org",
                        "autopagerMozdev.xml",xmlConfigCallback));

            this.updateSites.push(new UpdateSite("Wind Li","all",
                        "http://www.teesoft.info/components/com_autopager/export.php?version=0.1.6.0.28&lastupdate=" + (new Date()).getTime(),"text/xml; charset=utf-8",
                        "default configurations @ teesoft.info",
                        "autopagerTee.xml",xmlConfigCallback));
                                               
            this.updateSites.push(new UpdateSite("Wind Li","all",
                        "","text/html; charset=utf-8",
                        "user created configurations",
                        "autopager.xml",null));

         }
        
    },
    updateSiteOnline:function (updatesite)
    {
        UpdateSites.submitCount ++;
        apxmlhttprequest.xmlhttprequest(updatesite.url,updatesite.type,this.callback,this.onerror,updatesite);
    },
    updateOnline:function ()
    {
        this.init();
        UpdateSites.submitCount=0;
        for(var i=0;i<this.updateSites.length;i++)
        {
            var site= this.updateSites[i];
            if (site.url.length >0)
                this.updateSiteOnline(site);
        }
    },
    onerror:function(doc,obj)
    {
            //TODO:notification the update failed
             UpdateSites.submitCount--;
             if (UpdateSites.submitCount<=0)
                 autopagerMain.savePref("lastupdate",(new Date()).getTime());
             
             if (obj.triedTime < 3)
             {
                    obj.triedTime ++;
                    //try 3 times
                    updateSiteOnline(obj)
             }
    },
    callback:function(doc,updatesite)
    {
            var sites = updatesite.callback(doc,updatesite);
            var file = autopagerConfig.getConfigFile(updatesite.filename);
            if (file)
            {
                autopagerConfig.saveConfigToFile(sites,file,true);
             }
             UpdateSites.submitCount--;
             //if (UpdateSites.submitCount<=0)
              autopagerMain.savePref("lastupdate",(new Date()).getTime());
              UpdateSites.AutopagerCOMP.setAll([]);//notify update
        autopagerMain.handleCurrentDoc();
    },
    defaultSite : function()
    {
        return UpdateSites.updateSites[UpdateSites.updateSites.length-2].url;
    },
    loadAll:function()
    {
        if (this.AutopagerCOMP.loadAll().length==0)
        {
          this.allSiteSetting = {};
            for(var i=this.updateSites.length-1;i>=0;i--)
            {
                var configContents="";
                try{
                      configContents= autopagerConfig.autopagerGetContents(autopagerConfig.getConfigFileURI(this.updateSites[i].filename));
                      var sites= null;
                      sites = autopagerConfig.loadConfigFromStr(configContents,false);
                      sites.updateSite = this.updateSites[i];
                      this.allSiteSetting[this.updateSites[i].filename] = sites;
                }catch(e)
                {
                    //alert(e);
                }            
            }
            this.AutopagerCOMP.setAll(this.allSiteSetting);
        }
        return this.AutopagerCOMP.loadAll();
    },
    getMatchedSiteConfig: function(allSites,url,count)
    {
        var newSites = new Array();
        var key;
        for ( key in allSites){
                    var tmpsites = allSites[key];

                    for (var i = 0; i < tmpsites.length; i++) {
                            var site = tmpsites[i];
                             var pattern = autopagerMain.getRegExp(site);
                            if (pattern.test(url)) { 
                                newSites.push(site);
								if (count == newSites.length)
										return newSites;
                            }
                    }
            };
        return newSites;
        
    }
};
UpdateSites.init();

function Site()
{
	this.urlPattern  = null;
	this.regex = null;
        this.isRegex = false;
	this.enabled  = true;
	this.enableJS  = false;
        this.quickLoad = false;
	this.fixOverflow  = false;
	this.createdByYou  = false;
	this.changedByYou  = false;
	this.owner  = "";
	this.contentXPath = [];//["//div[@class='g']"];
	this.linkXPath = "//a[contains(.//text(),'Next')]";
        this.containerXPath="";
	this.desc = null;
	this.oldSite = null;
	this.margin = 2;
	
	this.maxLinks = -1;
        this.isTemp = false;
        this.tmpPaths = [];
        this.guid = "";
}

	

function UpdateSite(owner,locales,url,type,desc,filename,callback)
{
    this.owner = owner;
    this.locales=locales;
    this.url=url;
    this.type=type;
    this.desc=desc;
    this.filename = filename;
    this.callback = callback;
    this.triedTime=0;
    this.updateType = null;
    this.enabled = true;
    this.xpath = "//site";
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
    autopagerStrbundle:null,
    autoSites : null,
    autopagerDomParser : Components.classes["@mozilla.org/xmlextras/domparser;1"]
		    .createInstance(Components.interfaces.nsIDOMParser),
    openSetting : function(url) {
        window.autopagerSelectUrl=url;
        window.open("chrome://autopager/content/autopager.xul", "autopager",
        "chrome,resizable,centerscreen");
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
	  new XMLSerializer().serializeToStream(doc, configStream, "utf-8");
	  configStream.close();
	}catch(e)
	{
		alert(e);
	}
    },
    saveConfirm : function(sites) {
	this.saveConfirmToFile(sites, autopagerConfig.getConfigFile("site-confim.xml"));
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
  	//alert(e);
  }
  return file;
  
},
 loadConfirmFromStr : function(configContents) {
  var sites = new Array();
  try{
		  //var configContents = autopagerConfig.autopagerGetContents(autopagerConfig.getConfigFileURI("autopager.xml"));
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
					site.UserAllowed	= (autopagerConfig.getValue(childNode) == 'true');
		      }
		  }
                 sites.push(site);
               }
	}catch(e)
	{
		//alert(e);
	}
  return sites;
}
 ,
  loadConfirm : function() {
  var confirmContents="";
  try{
	  confirmContents= autopagerConfig.autopagerGetContents(autopagerConfig.getConfigFileURI("site-confim.xml"));
    }catch(e)
    {
    	//alert(e);
    }
    return this.loadConfirmFromStr(confirmContents);
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
 },
 isNumeric : function (strNumber)
{  
		var  newPar=/^(\+)?\d+(\.\d+)?$/  
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
	newSite.urlPattern  = site.urlPattern;
	newSite.regex  = site.regex;

	newSite.guid  = site.guid;
	newSite.isRegex  = site.isRegex;
	newSite.margin  = site.margin;
	newSite.enabled  = site.enabled;
	newSite.enableJS  = site.enableJS;
        newSite.quickLoad  = site.quickLoad;
	newSite.fixOverflow  = site.fixOverflow;
	newSite.createdByYou  = site.createdByYou;
	newSite.changedByYou  = site.changedByYou;
	newSite.owner  = site.owner;
	for(var i=0;i<site.contentXPath.length;++i)
			newSite.contentXPath[i] = site.contentXPath[i];
	
	newSite.linkXPath = site.linkXPath;
        newSite.containerXPath = site.containerXPath;
        
	newSite.desc = site.desc;
	newSite.oldSite = site;
	
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
                                                || oldSite.guid  != site.guid
                                                || oldSite.isRegex  != site.isRegex
						|| oldSite.margin  != site.margin
						|| oldSite.enabled  != site.enabled
						|| oldSite.enableJS  != site.enableJS
						|| oldSite.quickLoad  != site.quickLoad
						|| oldSite.fixOverflow  != site.fixOverflow
						|| oldSite.owner  != site.owner
						|| oldSite.linkXPath != site.linkXPath
						|| oldSite.containerXPath != site.containerXPath
						|| oldSite.desc != site.desc
						|| oldSite.contentXPath.length != site.contentXPath.length)
						{
							return true;
						}
			for(var i=0;i<site.contentXPath.length;++i)
			{
				if (oldSite.contentXPath[i] != site.contentXPath[i])
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
    var update = autopagerMain.loadPref("update");
    if (update == "-1")
        UpdateSites.updateOnline();
    else if(update != "0")
    {
        var today = new Date();
        var lastUpdate = autopagerMain.loadPref("lastupdate");
        
        if (lastUpdate.length == 0 || (today.getTime() - lastUpdate) /(1000 * 60 * 60) > update)
            UpdateSites.updateOnline();
    }    
}, autopagerGetString : function(name)
{
	try{
		
		if (autopagerConfig.autopagerStrbundle == null)
			autopagerConfig.autopagerStrbundle = document.getElementById("autopagerStrings");
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
			autopagerConfig.autopagerStrbundle = document.getElementById("autopagerStrings");
		return autopagerConfig.autopagerStrbundle.getFormattedString(name, parms);
	}catch(e)
	{
		alert(name + " " + e);
		return "";
	}
},
getConfigFileURI : function(fileName) {
	try{
  return Components.classes["@mozilla.org/network/io-service;1"]
                   .getService(Components.interfaces.nsIIOService)
                   .newFileURI(autopagerConfig.getConfigFile(fileName));
	}catch(e)
	{
		//alert(e);
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
		alert(e);
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
//  var configContents="";
//  try{
//	  configContents= autopagerConfig.autopagerGetContents(autopagerConfig.getConfigFileURI("autopager.xml"));
//    }catch(e)
//    {
//    	//alert(e);
//    }
//    return autopagerConfig.loadConfigFromStr(configContents,true);
    var allConfigs = UpdateSites.loadAll();
    return allConfigs["autopager.xml"];
 },
importFromURL :function()
{
	var url = prompt(autopagerConfig.autopagerGetString("inputurl"),
                        UpdateSites.defaultSite());
	if (url!=null && url.length >0)
	{
            function callback(doc,obj)
            {
                var sites = autopagerConfig.loadConfigFromDoc(doc);
		autopagerConfig.mergeSetting(sites,false);

                autopagerMain.handleCurrentDoc();
            }
            function onerror(doc,obj)
            {
                //TODO:notify error
            }
            apxmlhttprequest.xmlhttprequest(url,"text/html; charset=utf-8",callback,onerror,url);
	
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
		alert(e);
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
		alert(e);
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
mergeSetting : function (sites,silient)
{
	autopagerConfig.autoSites = autopagerConfig.loadConfig();
	autopagerConfig.mergeArray(autopagerConfig.autoSites,sites,silient);
	autopagerConfig.saveConfig(autopagerConfig.autoSites);
	//autopagerConfig.autoSites = autopagerConfig.loadConfig();
        autopagerMain.handleCurrentDoc();
			
},
mergeArray : function(autoSites,sites,silient)
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
	
	autopagerMain.logInfo(msg,msg);
},
loadConfigFromUrl : function(url) {
  try{
	  var configContents = autopagerConfig.autopagerGetContents(autopagerConfig.getRemoteURI(url),"UTF-8",true);
	  return autopagerConfig.loadConfigFromStr(configContents,false);
    }
    catch(e)
    {
    	alert(e);
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
  if (nodes == null)
      return sites;
  var hasQuickLoad = false;
  for (var node = null; (node = nodes.iterateNext()); ) {
    var site = new Site();

    var childNodes = node.childNodes;
    //childNode = childNodes[i]
    for (var i = 0, childNode = null; (childNode = childNodes[i]) ; i++) {
      var nodeName = childNode.nodeName;
      if (nodeName == "urlPattern") {
                        site.urlPattern = autopagerConfig.getValue(childNode);
      }
      else  if (nodeName == "guid") {
                        site.guid = autopagerConfig.getValue(childNode);
      }else if (nodeName == "urlIsRegex") {
                        site.isRegex	= (autopagerConfig.getValue(childNode) == 'true');
      }
      else if (nodeName == "margin") {
                var val = autopagerConfig.getValue(childNode);
                        if (autopagerConfig.isNumeric(val))
                                site.margin = val;
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
      else if (nodeName == "enabled") {
                        site.enabled	= (autopagerConfig.getValue(childNode) == 'true');
      }
      else if (nodeName == "enableJS") {
                        site.enableJS	= (autopagerConfig.getValue(childNode) == 'true');
                        //alert(site.enableJS + " " + childNode.firstChild.nodeValue);
      }
      else if (nodeName == "quickLoad") {
                        site.quickLoad	= (autopagerConfig.getValue(childNode) == 'true');
                        hasQuickLoad = true;
      }
      else if (nodeName == "fixOverflow") {
                        site.fixOverflow	= (autopagerConfig.getValue(childNode) == 'true');
                        //alert(site.fixOverflow + " " + childNode.firstChild.nodeValue);
      }
      else if (nodeName == "createdByYou") {
                        site.createdByYou	= (autopagerConfig.getValue(childNode) == 'true');
      }
      else if (nodeName == "changedByYou") {
                        site.changedByYou	= (autopagerConfig.getValue(childNode) == 'true');
      }else if (nodeName == "owner") {
                        site.owner	= autopagerConfig.getValue(childNode) ;
      }
    }
     if (!hasQuickLoad)
         site.quickLoad = false;
     if (site.guid.length == 0 && site.createdByYou)
        site.guid = autopagerConfig.generateGuid();
     sites.push(site);
  }
  return sites;
},
loadConfigFromStr : function(configContents,remote) {
  var sites = null;
  try{

		  //var configContents = autopagerConfig.autopagerGetContents(autopagerConfig.getConfigFileURI("autopager.xml"));
		  var doc = autopagerConfig.autopagerDomParser.parseFromString(configContents, "text/xml");
                  sites = autopagerConfig.loadConfigFromDoc(doc);
	}catch(e)
	{
		//alert(e);
	}
  if (remote && sites.length ==0 )
  {
  	//sites = autopagerConfig.loadConfigFromUrl(UpdateSites.defaultSite());
  	//autopagerConfig.saveConfig(sites);
  }
  return sites;
},
newSite : function(urlPattern,desc,linkXPath,contentXPath)
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
	return site;
},
saveConfig : function(sites) {
	autopagerConfig.saveConfigToFile(sites,autopagerConfig.getConfigFile("autopager.xml"),true);
        var allConfigs = UpdateSites.loadAll();
        //sites.updateSite = allConfigs["autopager.xml"].updateSite;
        allConfigs["autopager.xml"] = sites;
        UpdateSites.AutopagerCOMP.setAll(allConfigs);          
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
	    autopagerConfig.createNode(siteNode,"urlIsRegex",siteObj.isRegex);
	    autopagerConfig.createNode(siteNode,"margin",siteObj.margin);
	    autopagerConfig.createNode(siteNode,"enabled",siteObj.enabled);
	    autopagerConfig.createNode(siteNode,"enableJS",siteObj.enableJS);
	    autopagerConfig.createNode(siteNode,"quickLoad",siteObj.quickLoad);
	    autopagerConfig.createNode(siteNode,"fixOverflow",siteObj.fixOverflow);
	    autopagerConfig.createNode(siteNode,"owner",siteObj.owner);
	

	    var x=0;
	    for(x=0;x<siteObj.contentXPath.length;++x)
	    {
		    autopagerConfig.createNode(siteNode,"contentXPath",siteObj.contentXPath[x]);
		}
	    
	    autopagerConfig.createNode(siteNode,"linkXPath",siteObj.linkXPath);
	    autopagerConfig.createNode(siteNode,"containerXPath",siteObj.containerXPath);
            
	    autopagerConfig.createNode(siteNode,"desc",siteObj.desc);
	
		if (includeChangeInfo)
	    {
		    autopagerConfig.createNode(siteNode,"createdByYou",siteObj.createdByYou);
		    autopagerConfig.createNode(siteNode,"changedByYou",siteObj.changedByYou);
	    }
	    	    
	    doc.firstChild.appendChild(siteNode);
	  	doc.firstChild.appendChild(doc.createTextNode("\n"));
	  }
	}
	  var configStream = autopagerConfig.getWriteStream(saveFile);
	  new XMLSerializer().serializeToStream(doc, configStream, "utf-8");
	  configStream.close();
	}catch(e)
	{
		alert(e);
	}
        UpdateSites.allSiteSetting= UpdateSites.loadAll();

        autopagerMain.setDatePrefs("settingupdatedate", new Date());
},
getWriteStream : function(file) {
  var stream = Components.classes["@mozilla.org/network/file-output-stream;1"]
    .createInstance(Components.interfaces.nsIFileOutputStream);

  stream.init(file, 0x02 | 0x08 | 0x20, 420, 0);

  return stream;
}
};
