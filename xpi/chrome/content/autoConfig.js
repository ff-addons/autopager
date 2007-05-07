var configFile = getConfigFile("autopager.xml");
var autoSites = null;

var strbundle=null;



function getString(name)
{
	try{
		
		if (strbundle == null)
			strbundle = document.getElementById("autopagerStrings");
		return strbundle.getString(name);
	}catch(e)
	{
		alert(name + " " + e);
		return "";
	}
}
function formatString(name,parms)
{
	
	
	try{
		if (strbundle == null)
			strbundle = document.getElementById("autopagerStrings");
		return strbundle.getFormattedString(name, parms);
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


function getContents(aURL, charset,warn){
	var str;
	try{
	  if( !charset ) {
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
	  configContents= getContents(getConfigFileURI("autopager.xml"));
    }catch(e)
    {
    	//alert(e);
    }
    return loadConfigFromStr(configContents,true);
 }
function importFromURL()
{
	var url = prompt(getString("inputurl"),
		"http://blogs.sun.com/wind/resource/autopager.xml");
	if (!url && url.length >0)
	{
		var sites = loadConfigFromUrl(url);
		mergeSetting(sites,false);
	}
}
function importFromFile()
{
	try{
		var file = selectFile(getString("inputfile"),Components.interfaces.nsIFilePicker.modeOpen);
		var fileURI = Components.classes["@mozilla.org/network/io-service;1"]
	                   .getService(Components.interfaces.nsIIOService)
	                   .newFileURI(file);
		var configContents = getContents(fileURI);
		sites =  loadConfigFromStr(configContents,false);
		mergeSetting(sites,false);
	}catch(e)
	{
		alert(e);
	}
}
function exportSetting()
{
	var file = selectFile(getString("outputfile"),Components.interfaces.nsIFilePicker.modeSave);
	if (file)
		saveConfigToFile(autoSites,file,false);
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
				|| autoSites[siteIndex].createdByYou))
			{
				updatedCount++;
				autoSites[siteIndex] = sites[i];
			}
		}
	}
	var msg = formatString("importdone",[insertCount,updatedCount]);
	if (!silient)
	{
		alert(msg);
		//alert("import done with " + insertCount + " new sites and " + updatedCount +  " updated.");
	}
	
	logInfo(msg,msg);
}
function loadConfigFromUrl(url) {
  try{
	  var configContents = getContents(getRemoteURI(url),"UTF-8",true);
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
function loadConfigFromStr(configContents,remote) {
  var sites = new Array();
  try{
		  var domParser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
		    .createInstance(Components.interfaces.nsIDOMParser);
		  //alert(configFile);
		  //var configContents = getContents(getConfigFileURI("autopager.xml"));
		  var doc = domParser.parseFromString(configContents, "text/xml");
		  var nodes = doc.evaluate("//site", doc, null, 0, null);
		
		  for (var node = null; (node = nodes.iterateNext()); ) {
		    var site = new Site();
		
		    for (var i = 0, childNode = null; (childNode = node.childNodes[i]); i++) {
		      if (childNode.nodeName == "urlPattern") {
					site.urlPattern = getValue(childNode);
		      }
		      else if (childNode.nodeName == "margin") {
		      		var val = getValue(childNode);
					if (isNumeric(val))
						site.margin = val;
		      }
		      else if (childNode.nodeName == "desc") {
					site.desc	= getValue(childNode);
		      }
		      else if (childNode.nodeName == "linkXPath") {
					site.linkXPath	= getValue(childNode);
		      }
		      else if (childNode.nodeName == "contentXPath") {
					site.contentXPath.push(getValue(childNode));
		      }
		      else if (childNode.nodeName == "enabled") {
					site.enabled	= (getValue(childNode) == 'true');
		      }
		      else if (childNode.nodeName == "enableJS") {
					site.enableJS	= (getValue(childNode) == 'true');
					//alert(site.enableJS + " " + childNode.firstChild.nodeValue);
		      }
		      else if (childNode.nodeName == "createdByYou") {
					site.createdByYou	= (getValue(childNode) == 'true');
		      }
		      else if (childNode.nodeName == "changedByYou") {
					site.changedByYou	= (getValue(childNode) == 'true');
		      }else if (childNode.nodeName == "owner") {
					site.owner	= getValue(childNode) ;
		      }
		    }
			sites.push(site);
		  }
	}catch(e)
	{
		//alert(e);
	}
  if (remote && sites.length ==0 )
  {
  	sites = loadConfigFromUrl("http://blogs.sun.com/wind/resource/autopager.xml");
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
	
	  for (var i = 0, siteObj = null; (siteObj = sites[i]); i++) {
	    var siteNode = doc.createElement("site");
	
	    createNode(siteNode,"urlPattern",siteObj.urlPattern);
	    createNode(siteNode,"margin",siteObj.margin);
	    createNode(siteNode,"enabled",siteObj.enabled);
	    createNode(siteNode,"enableJS",siteObj.enableJS);
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
	
	  var configStream = getWriteStream(saveFile);
	  new XMLSerializer().serializeToStream(doc, configStream, "utf-8");
	  configStream.close();
	}catch(e)
	{
		alert(e);
	}
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
	this.enabled  = true;
	this.enableJS  = false;
	this.createdByYou  = false;
	this.changedByYou  = false;
	this.owner  = "";
	this.contentXPath = [];//["//div[@class='g']"];
	this.linkXPath = "//a[contains(.//text(),'Next')]";
	this.desc = null;
	this.oldSite = null;
	this.margin = 1.5;
}
function cloneSite(site)
{
	var newSite = new Site();
	newSite.urlPattern  = site.urlPattern;
	newSite.margin  = site.margin;
	newSite.enabled  = site.enabled;
	newSite.enableJS  = site.enableJS;
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
						|| oldSite.margin  != site.margin
						|| oldSite.enabled  != site.enabled
						|| oldSite.enableJS  != site.enableJS
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

	function removeFromArray(array,index) {
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
	
function getUpdateFrame(doc)
{
	var divName = "autoPagerUpdateDiv";
	var frameName = divName + "ifr";
	
	var frame = doc.getElementById(frameName);
	if (frame == null || !frame)
	{
		var div = createDiv(doc,"<div  id='" + divName + "' class='autoPagerS'  style='border: 0px; margin: 0px; padding: 0px; position: absolute; width: 0px; display: block; z-index: -90; left: -100px; top: -100px; height: 0px; '>" +
				"<iframe id='" + frameName + "' name='" + frameName + "' width='100%' height='100%' src=''></iframe></div>");
		//var div = createDiv(doc,"<div  id='" + divName + "' class='autoPagerS'  style='border: 2px solid orange; margin: 0px; padding: 0px; position: absolute; width: 600px; display: block; z-index: 90; left: 0px; top: 0px; height: 600px; '>" +
		//		"<iframe id='" + frameName + "' name='" + frameName + "' width='100%' height='100%' src=''></iframe></div>");
		frame = doc.getElementById(frameName);
	}
	return frame;
};
	
var updateUrl="http://blogs.sun.com/wind/entry/autopager_site_config#comments";
var commentPath="//div[@class='comment even' or @class='comment odd']";
//var commentPath="//div";
function UpdateSetting(silence)
{
	var url = updateUrl;
	var xmlhttp=null;
	try{
	      try{
	        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	      }catch(e){
	        xmlhttp = new XMLHttpRequest();
	      }
		xmlhttp.overrideMimeType("text/html; charset=utf-8");
        xmlhttp.onreadystatechange = function (aEvt) {
        if(xmlhttp.readyState == 4) 
        {
        	if(xmlhttp.status == 200)
        	{
        		var frame = getUpdateFrame(_content.document);
        		frame.autoPagerInited = false;
        		frame.contentDocument.clear();
        		//alert(xmlhttp.responseText);
				frame.contentDocument.write(getHtmlInnerHTML(xmlhttp.responseText,false));
				frame.contentDocument.close();
				var doc = frame.contentDocument;
        		
        		
				var nodes =doc.evaluate(commentPath, doc, null, 0, null);
				var allSites = new Array();
				for (var node = null; (node = nodes.iterateNext()); ) {
		  
					//alert(node.textContent);
					var sites = loadConfigFromStr( "<root>" + node.textContent + "</root>",false);
					//alert(sites.length);
					mergeArray(allSites,sites,true);
				}
				mergeSetting(allSites,silence);
        	}
        	else
        	{
        		if (!silence)
        			alert(getString("errorload") + url);
		      logInfo(getString("errorload") + url,getString("errorload") + url);
        	}
        }
      };
      xmlhttp.open("GET", url, true);
      logInfo(getString("loading") + url,getString("loading") + url);
      xmlhttp.send(null);

    }catch (e){
    	if (!silence)
        		alert(getString("unableload") + url);
      logInfo(getString("unableload") + url,getString("unableload") + url);
    }
}
function  isNumeric(strNumber)
{  
		var  newPar=/^(\+)?\d+(\.\d+)?$/  
        return  newPar.test(strNumber);  
} 