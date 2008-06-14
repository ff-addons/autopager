var configFile = getConfigFile("autopager.xml");
var autoSites = null;

var autopagerStrbundle=null;
var autopagerDomParser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
		    .createInstance(Components.interfaces.nsIDOMParser);
var UpdateSites=
{
    updateSites: null,
    allSiteSetting: null,
    submitCount:0,
    loadeddate:null,
    init:function()
    {
        function xmlConfigCallback(doc,updatesite)
        {
            var sites = loadConfigFromDoc(doc);
            return sites;
        }
        function blogConfigCallback(doc,updatesite)
        {
            var commentPath="//div[@class='comment even' or @class='comment odd']";
            var nodes =doc.evaluate(commentPath, doc, null, 0, null);
                var allSites = new Array();
                for (var node = null; (node = nodes.iterateNext()); ) {

                        //alert(node.textContent);
                        var sites = loadConfigFromStr( "<root>" + node.textContent + "</root>",false);
                        //alert(sites.length);
                        mergeArray(allSites,sites,true);
                }
            return allSites;
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
                        "http://www.teesoft.info/components/com_autopager/export.php?version=0.1.6.0.14&lastupdate=" + (new Date()).getTime(),"text/xml; charset=utf-8",
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
                 savePref("lastupdate",(new Date()).getTime());
             
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
            var file = getConfigFile(updatesite.filename);
            if (file)
            {
                saveConfigToFile(sites,file,true);
             }
             UpdateSites.submitCount--;
             //if (UpdateSites.submitCount<=0)
              savePref("lastupdate",(new Date()).getTime());
    },
    defaultSite : function()
    {
        return UpdateSites.updateSites[UpdateSites.updateSites.length-2].url;
    },
    isUpdated:function()
    {
        if (this.allSiteSetting == null)
            return true;
        var date = getDatePrefs("settingupdatedate");
        if (this.loadeddate == null || date > this.loadeddate)
            {
              return true;
            }
            return false;
    },
    loadAll:function()
    {
        if (this.isUpdated())
        {
          this.allSiteSetting = {};
            for(var i=this.updateSites.length-1;i>=0;i--)
            {
                var configContents="";
                try{
                      configContents= autopagerGetContents(getConfigFileURI(this.updateSites[i].filename));
                      var sites= null;
                      sites = loadConfigFromStr(configContents,false);
                      sites.updateSite = this.updateSites[i];
                      this.allSiteSetting[this.updateSites[i].filename] = sites;
                }catch(e)
                {
                    //alert(e);
                }            
            }
            this.loadeddate = new Date();
        }
        return this.allSiteSetting;
    },
    getMatchedSiteConfig: function(allSites,url)
    {
        var newSites = new Array();
        var key;
        for ( key in allSites){
                    var tmpsites = allSites[key];
                    
                    for (var i = 0; i < tmpsites.length; i++) {
                            var site = tmpsites[i];
                             var pattern = getRegExp(site);
                            if (pattern.test(url)) { 
                                newSites.push(site);
                            }
                    }
            };
        return newSites;
        
    }
};
UpdateSites.init();
function autopagerUpdate()
{
    var update = loadPref("update");
    if (update == "-1")
        UpdateSites.updateOnline();
    else if(update != "0")
    {
        var today = new Date();
        var lastUpdate = loadPref("lastupdate");
        
        if (lastUpdate.length == 0 || (today.getTime() - lastUpdate) /(1000 * 60 * 60) > update)
            UpdateSites.updateOnline();
    }    
}
function autopagerGetString(name)
{
	try{
		
		if (autopagerStrbundle == null)
			autopagerStrbundle = document.getElementById("autopagerStrings");
		return autopagerStrbundle.getString(name);
	}catch(e)
	{
		//alert(name + " " + e);
		return name;
	}
}
function autopagerFormatString(name,parms)
{
	
	
	try{
		if (autopagerStrbundle == null)
			autopagerStrbundle = document.getElementById("autopagerStrings");
		return autopagerStrbundle.getFormattedString(name, parms);
	}catch(e)
	{
		alert(name + " " + e);
		return "";
	}
}
function getConfigFileURI(fileName) {
	try{
  return Components.classes["@mozilla.org/network/io-service;1"]
                   .getService(Components.interfaces.nsIIOService)
                   .newFileURI(getConfigFile(fileName));
	}catch(e)
	{
		//alert(e);
	}
}
function getRemoteURI(url)
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

function getConfigFile(fileName) {
  var file = getConfigDir();
  file.append(fileName);
  if (!file.exists()) {
          file.create(Components.interfaces.nsIFile.FILE_TYPE, 0755);
  }

  return file;
}

function getConfigDir() {
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
  
}


function autopagerGetContents(aURL, charset,warn){
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
}
function loadConfig() {
  var configContents="";
  try{
	  configContents= autopagerGetContents(getConfigFileURI("autopager.xml"));
    }catch(e)
    {
    	//alert(e);
    }
    return loadConfigFromStr(configContents,true);
 }
function importFromURL()
{
	var url = prompt(autopagerGetString("inputurl"),
                        UpdateSites.defaultSite());
	if (url!=null && url.length >0)
	{
            function callback(doc,obj)
            {
                var sites = loadConfigFromDoc(doc);
		mergeSetting(sites,false);

            }
            function onerror(doc,obj)
            {
                //TODO:notify error
            }
            apxmlhttprequest.xmlhttprequest(url,"text/html; charset=utf-8",callback,onerror,url);
	
	}
}

function importFromClip()
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
                
		sites =  loadConfigFromStr(configContents,false);
		mergeSetting(sites,false);
	}catch(e)
	{
		alert(e);
	}
}
function importFromFile()
{
	try{
                var fileURI  = null;
               try{
		var file = selectFile(autopagerGetString("inputfile"),Components.interfaces.nsIFilePicker.modeOpen);
		
                fileURI = Components.classes["@mozilla.org/network/io-service;1"]
	                   .getService(Components.interfaces.nsIIOService)
	                   .newFileURI(file);
                }catch(e){
                    return;
                }
		var configContents = autopagerGetContents(fileURI);
		sites =  loadConfigFromStr(configContents,false);
		mergeSetting(sites,false);
	}catch(e)
	{
		alert(e);
	}
}
function exportSetting()
{
	var file = selectFile(autopagerGetString("outputfile"),Components.interfaces.nsIFilePicker.modeSave);
	if (file)
        {
            autoSites = loadConfig();
            saveConfigToFile(autoSites,file,false);
         }
}

function selectFile  (title,mode) {
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
}

function getSiteIndex(sites,site)
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
}
function mergeSetting(sites,silient)
{
	autoSites = loadConfig();
	mergeArray(autoSites,sites,silient);
	saveConfig(autoSites);
	autoSites = loadConfig();
			
}
function mergeArray(autoSites,sites,silient)
{
	
	var insertCount=0;
	var updatedCount=0;
	var ignoreCount=0;
	for (var i=0;i<sites.length;i++)
	{
		var siteIndex = getSiteIndex(autoSites,sites[i]);
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
	var msg = autopagerFormatString("importdone",[insertCount,updatedCount,ignoreCount]);
	if (!silient)
	{
		alert(msg);
		//alert("import done with " + insertCount + " new sites and " + updatedCount +  " updated.");
	}
	
	logInfo(msg,msg);
}
function loadConfigFromUrl(url) {
  try{
	  var configContents = autopagerGetContents(getRemoteURI(url),"UTF-8",true);
	  return loadConfigFromStr(configContents,false);
    }
    catch(e)
    {
    	alert(e);
    }
 }
 function getValue(node)
 {
 	if (!node.firstChild)
 		return "";
 	else
 		return node.firstChild.nodeValue;
 }
function loadConfigFromDoc(doc) {
  var sites = new Array();
    
  var nodes = doc.evaluate("//site", doc, null, 0, null);
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
                        site.urlPattern = getValue(childNode);
      }else  if (nodeName == "guid") {
                        site.guid = getValue(childNode);
      }else if (nodeName == "urlIsRegex") {
                        site.isRegex	= (getValue(childNode) == 'true');
      }
      else if (nodeName == "margin") {
                var val = getValue(childNode);
                        if (isNumeric(val))
                                site.margin = val;
      }
      else if (nodeName == "desc") {
                        site.desc	= getValue(childNode);
      }
      else if (nodeName == "linkXPath") {
                        site.linkXPath	= getValue(childNode);
      }
      else if (nodeName == "contentXPath") {
                        site.contentXPath.push(getValue(childNode));
      }
      else if (nodeName == "enabled") {
                        site.enabled	= (getValue(childNode) == 'true');
      }
      else if (nodeName == "enableJS") {
                        site.enableJS	= (getValue(childNode) == 'true');
                        //alert(site.enableJS + " " + childNode.firstChild.nodeValue);
      }
      else if (nodeName == "quickLoad") {
                        site.quickLoad	= (getValue(childNode) == 'true');
                        hasQuickLoad = true;
      }
      else if (nodeName == "fixOverflow") {
                        site.fixOverflow	= (getValue(childNode) == 'true');
                        //alert(site.fixOverflow + " " + childNode.firstChild.nodeValue);
      }
      else if (nodeName == "createdByYou") {
                        site.createdByYou	= (getValue(childNode) == 'true');
      }
      else if (nodeName == "changedByYou") {
                        site.changedByYou	= (getValue(childNode) == 'true');
      }else if (nodeName == "owner") {
                        site.owner	= getValue(childNode) ;
      }
    
    }
     if (!hasQuickLoad)
         site.quickLoad = false;
     if (site.guid.length == 0 && site.createdByYou)
        site.guid = generateGuid();
     sites.push(site);
  }
  return sites;
}
function loadConfigFromStr(configContents,remote) {
  var sites = null;
  try{

		  //alert(configFile);
		  //var configContents = autopagerGetContents(getConfigFileURI("autopager.xml"));
		  var doc = autopagerDomParser.parseFromString(configContents, "text/xml");
                  sites = loadConfigFromDoc(doc);
	}catch(e)
	{
		//alert(e);
	}
  if (remote && sites.length ==0 )
  {
  	//sites = loadConfigFromUrl(UpdateSites.defaultSite());
  	//saveConfig(sites);
  }
  return sites;
}
function newSite(urlPattern,desc,linkXPath,contentXPath)
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
}
function saveConfig(sites) {
	saveConfigToFile(sites,configFile,true);
}
function createNode(siteNode,name,value)
{
	var doc = siteNode.ownerDocument;
	var node = doc.createElement(name);
	node.appendChild(doc.createTextNode(value));
	siteNode.appendChild(node);
	siteNode.appendChild(doc.createTextNode("\n"));
}
function saveConfigToFile(sites,saveFile,includeChangeInfo) {
    
	try{
	  var doc = document.implementation.createDocument("", "autopager", null);
	  doc.firstChild.appendChild(doc.createTextNode("\n"))
	
if (sites!=null)
    {
    for (var i = 0, siteObj = null; (siteObj = sites[i]); i++) {
	    var siteNode = doc.createElement("site");
	
            if (siteObj.createdByYou && siteObj.guid.length == 0)
                siteObj.guid = generateGuid();
	    createNode(siteNode,"urlPattern",siteObj.urlPattern);
	    createNode(siteNode,"guid",siteObj.guid);
	    createNode(siteNode,"urlIsRegex",siteObj.isRegex);
	    createNode(siteNode,"margin",siteObj.margin);
	    createNode(siteNode,"enabled",siteObj.enabled);
	    createNode(siteNode,"enableJS",siteObj.enableJS);
	    createNode(siteNode,"quickLoad",siteObj.quickLoad);
	    createNode(siteNode,"fixOverflow",siteObj.fixOverflow);
	    createNode(siteNode,"owner",siteObj.owner);
	

	    var x=0;
	    for(x=0;x<siteObj.contentXPath.length;++x)
	    {
		    createNode(siteNode,"contentXPath",siteObj.contentXPath[x]);
		}
	    
	    createNode(siteNode,"linkXPath",siteObj.linkXPath);
	    createNode(siteNode,"desc",siteObj.desc);
	
		if (includeChangeInfo)
	    {
		    createNode(siteNode,"createdByYou",siteObj.createdByYou);
		    createNode(siteNode,"changedByYou",siteObj.changedByYou);
	    }
	    	    
	    doc.firstChild.appendChild(siteNode);
	  	doc.firstChild.appendChild(doc.createTextNode("\n"));
	  }
	}
	  var configStream = getWriteStream(saveFile);
	  new XMLSerializer().serializeToStream(doc, configStream, "utf-8");
	  configStream.close();
	}catch(e)
	{
		alert(e);
	}
        UpdateSites.allSiteSetting= null;
        setDatePrefs("settingupdatedate", new Date());
}
function getWriteStream(file) {
  var stream = Components.classes["@mozilla.org/network/file-output-stream;1"]
    .createInstance(Components.interfaces.nsIFileOutputStream);

  stream.init(file, 0x02 | 0x08 | 0x20, 420, 0);

  return stream;
}
function Site()
{
	this.urlPattern  = null;
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
	this.desc = null;
	this.oldSite = null;
	this.margin = 2;
	
	this.maxLinks = -1;
        this.isTemp = false;
        this.tmpPaths = [];
        this.guid = "";
}
// Array.insert( index, value ) - Insert value at index, without overwriting existing keys
function insertAt(sites, index, site ) {
    sites.push(site);
    if( index>=0 && index<sites.length) {
     for(var i=sites.length -1;i>index;i--)
     {
         sites[i] = sites[i-1];
     }
    sites[index] = site;
  return sites;
 }
};
function generateGuid()
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

function cloneSite(site)
{
	var newSite = new Site();
	newSite.urlPattern  = site.urlPattern;
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
	newSite.desc = site.desc;
	newSite.oldSite = site;
	
	return newSite;
}
	function isChanged(site)
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

	function cloneSites(sites)
	{
		var newSites = new Array();
		for (var i=0;i<sites.length;++i)
		{
			var site = cloneSite(sites[i]);
			newSites.push(site);
		}
		return newSites;
	}

	function removeFromArrayByIndex(array,index) {
		if (index < array.length)
		{
			for(var i = index;i<array.length -1;++i)
			{
				array[i] = array[i+1];
			}
			array[array.length-1]=null;
			array.pop();
		}
	}
	function removeFromArray(array,item) {
		var index = -1;
		for(index=0;index<array.length 
				&& array[index]!=item;index++)
		{	
		}
		if (index>=0 && index <array.length)
		{
			removeFromArrayByIndex(array,index);
		}
	}
	
function getUpdateFrame(doc)
{
	var divName = "autoPagerUpdateDiv";
	var frameName = divName + "ifr";
	
	var frame = doc.getElementById(frameName);
	if (frame == null || !frame)
	{
		var div = createDiv(doc,divName,
		"border: 0px; margin: 0px; padding: 0px; position: absolute; width: 0px; display: block; z-index: -90; left: -100px; top: -100px; height: 0px;");
		div.innerHTML = "<iframe id='" + frameName + "' name='" + frameName + "' width='100%' height='100%' src=''></iframe>";
		
		//var div = createDiv(doc,"<div  id='" + divName + "' class='autoPagerS'  style='border: 2px solid orange; margin: 0px; padding: 0px; position: absolute; width: 600px; display: block; z-index: 90; left: 0px; top: 0px; height: 600px; '>" +
		//		"<iframe id='" + frameName + "' name='" + frameName + "' width='100%' height='100%' src=''></iframe></div>");
		frame = doc.getElementById(frameName);
	}
	return frame;
};
	
function  isNumeric(strNumber)
{  
		var  newPar=/^(\+)?\d+(\.\d+)?$/  
        return  newPar.test(strNumber);  
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
};
function SiteConfirm()
{
        this.guid = "";
        this.host = "";
        this.AllowedPageCount = -1;
        this.UserAllowed = false;
}
 function addConfirm(confirmSites,guid,countNumber,host,enabled)
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
 }
 function findConfirm(confirmSites,guid,host)
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
function loadConfirm() {
  var confirmContents="";
  try{
	  confirmContents= autopagerGetContents(getConfigFileURI("site-confim.xml"));
    }catch(e)
    {
    	//alert(e);
    }
    return loadConfirmFromStr(confirmContents);
 }
function loadConfirmFromStr(configContents) {
  var sites = new Array();
  try{
		  //alert(configFile);
		  //var configContents = autopagerGetContents(getConfigFileURI("autopager.xml"));
		  var doc = autopagerDomParser.parseFromString(configContents, "text/xml");
		  var nodes = doc.evaluate("/autopager/site-confirm", doc, null, 0, null);
		  for (var node = null; (node = nodes.iterateNext()); ) {
		    var site = new SiteConfirm();
		
		    for (var i = 0, childNode = null; (childNode = node.childNodes[i]); i++) {
		      if (childNode.nodeName == "guid") {
					site.guid = getValue(childNode);
		      }else  if (childNode.nodeName == "AllowedPageCount") {
					site.AllowedPageCount = getValue(childNode);
		      }else  if (childNode.nodeName == "host") {
					site.host = getValue(childNode);
		      }
		      else if (childNode.nodeName == "UserAllowed") {
					site.UserAllowed	= (getValue(childNode) == 'true');
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
function saveConfirm(sites) {
	saveConfirmToFile(sites, getConfigFile("site-confim.xml"));
}
function saveConfirmToFile(sites,saveFile) {
	try{
	  var doc = document.implementation.createDocument("", "autopager", null);
	  doc.firstChild.appendChild(doc.createTextNode("\n"))
	
	  for (var i = 0, siteObj = null; (siteObj = sites[i]); i++) {
                var siteNode = doc.createElement("site-confirm");

                createNode(siteNode,"guid",siteObj.guid);
                createNode(siteNode,"host",siteObj.host);
                createNode(siteNode,"AllowedPageCount",siteObj.AllowedPageCount);
                createNode(siteNode,"UserAllowed",siteObj.UserAllowed);
                doc.firstChild.appendChild(siteNode);
                doc.firstChild.appendChild(doc.createTextNode("\n"));
	  }
	
	  var configStream = getWriteStream(saveFile);
	  new XMLSerializer().serializeToStream(doc, configStream, "utf-8");
	  configStream.close();
	}catch(e)
	{
		alert(e);
	}
}
function openSetting(url) {
    window.autopagerSelectUrl=url;
    window.open("chrome://autopager/content/autopager.xul", "autopager",
    "chrome,resizable,centerscreen");
}
