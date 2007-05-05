var configFile = getConfigFile("autopager.xml");
var autoSites = null;
	

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
  	alert(e);
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
	var url = prompt("Please input the url to import settings:",
		"http://blogs.sun.com/wind/resource/autopager.xml");
	if (!url && url.length >0)
	{
		var sites = loadConfigFromUrl(url);
		mergeSetting(sites);
	}
}
function importFromFile()
{
	try{
		var file = selectFile("Please select auto pager setting file:",Components.interfaces.nsIFilePicker.modeOpen);
		var fileURI = Components.classes["@mozilla.org/network/io-service;1"]
	                   .getService(Components.interfaces.nsIIOService)
	                   .newFileURI(file);
		var configContents = getContents(fileURI);
		sites =  loadConfigFromStr(configContents,false);
		mergeSetting(sites);
	}catch(e)
	{
		alert(e);
	}
}
function exportSetting()
{
	var file = selectFile("Please choose a file name:",Components.interfaces.nsIFilePicker.modeSave);
	saveConfigToFile(autoSites,file);
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

function mergeSetting(sites)
{
	autoSites = loadConfig();
	for (var i=0;i<sites.length;i++)
		autoSites.push(sites[i]);
	saveConfig(autoSites);
	autoSites = loadConfig();
	alert("import done with " + sites.length + " sites.");
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
function loadConfigFromStr(configContents,remote) {
  var sites = new Array();
  try{
		  var domParser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
		    .createInstance(Components.interfaces.nsIDOMParser);
		  //alert(configFile);
		  //var configContents = getContents(getConfigFileURI("autopager.xml"));
		  var doc = domParser.parseFromString(configContents, "text/xml");
		  var nodes = doc.evaluate("/autopager/site", doc, null, 0, null);
		
		
		  for (var node = null; (node = nodes.iterateNext()); ) {
		    var site = new Site();
		
		    for (var i = 0, childNode = null; (childNode = node.childNodes[i]); i++) {
		      if (childNode.nodeName == "urlPattern") {
					site.urlPattern = (childNode.firstChild.nodeValue);
		      }
		      else if (childNode.nodeName == "desc") {
					site.desc	= (childNode.firstChild.nodeValue);
		      }
		      else if (childNode.nodeName == "linkXPath") {
					site.linkXPath	= (childNode.firstChild.nodeValue);
		      }
		      else if (childNode.nodeName == "contentXPath") {
					site.contentXPath.push(childNode.firstChild.nodeValue);
		      }
		      else if (childNode.nodeName == "enabled") {
					site.enabled	= (childNode.firstChild.nodeValue == 'true');
		      }
		      else if (childNode.nodeName == "enableJS") {
					site.enableJS	= (childNode.firstChild.nodeValue == 'true');
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
	saveConfigToFile(sites,configFile);
}
function saveConfigToFile(sites,saveFile) {
	try{
	  var doc = document.implementation.createDocument("", "autopager", null);
	  doc.firstChild.appendChild(doc.createTextNode("\n"))
	
	  for (var i = 0, siteObj = null; (siteObj = sites[i]); i++) {
	    var siteNode = doc.createElement("site");
	
	    var urlPattern = doc.createElement("urlPattern");
	    urlPattern.appendChild(doc.createTextNode(siteObj.urlPattern));
	    siteNode.appendChild(urlPattern);
	
		var enabled = doc.createElement("enabled");
	    enabled.appendChild(doc.createTextNode(siteObj.enabled));
	    siteNode.appendChild(enabled);

		var enableJS = doc.createElement("enableJS");
	    enableJS.appendChild(doc.createTextNode(siteObj.enableJS));
	    siteNode.appendChild(enableJS);

	    var x=0;
	    for(x=0;x<siteObj.contentXPath.length;++x)
	    {
	    	var contentXPath = doc.createElement("contentXPath");
	    	contentXPath.appendChild(doc.createTextNode(siteObj.contentXPath[x]));
		    siteNode.appendChild(contentXPath);
		}
	    
	    var linkXPath = doc.createElement("linkXPath");
	    linkXPath.appendChild(doc.createTextNode(siteObj.linkXPath));
	    siteNode.appendChild(linkXPath);
	    
	    var desc = doc.createElement("desc");
	    desc.appendChild(doc.createTextNode(siteObj.desc));
	    siteNode.appendChild(desc);
	
	    siteNode.appendChild(doc.createTextNode("\n"));
	    doc.firstChild.appendChild(siteNode);
	  }
	
	  doc.firstChild.appendChild(doc.createTextNode("\n"))
	
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
	this.contentXPath = [];//["//div[@class='g']"];
	this.linkXPath = "//a[contains(.//text(),'Next')]";
	this.desc = null;
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