var autopagerBwUtil =
{
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
getConfigFileURI : function(fileName) {
	try{
  return Components.classes["@mozilla.org/network/io-service;1"]
                   .getService(Components.interfaces.nsIIOService)
                   .newFileURI(this.getConfigFile(fileName));
	}catch(e)
	{
		autopagerBwUtil.consoleLog(e);
	}
},
getConfigFileContents : function(file, charset,warn){
    var aURL = this.getConfigFileURI(file);
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
saveContentToConfigFile: function(str,filename)
{
    var file = this.getConfigFile(filename);
    this.saveContentToFile(str,file)
},
saveContentToFile: function(str,saveFile)
{
    try{
        var fStream = autopagerConfig.getWriteStream(saveFile);
        var configStream = autopagerConfig.getConverterWriteStream(fStream);
        configStream.writeString(str);
        configStream.close();
        fStream.close();
    }catch(e)
    {
		autopagerBwUtil.consoleError(e);
    }
},
autopagerOpenIntab : function(url,obj)
    {
        if (typeof Components == "object")
        {
            var wm =  Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
            var w = wm && wm.getMostRecentWindow('navigator:browser', true);
            var b = null
            if(w && !w.closed)
            {
                b = w.getBrowser();//w.getBrowser();
            }else if (typeof getBrowser!="undefined")
                b = getBrowser();

            if (b)
            {
                var b = w.getBrowser();//w.getBrowser();
                var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService);
                var ops = ioService.newURI("http://www.teesoft.info", null, null);
                var uri = ioService.newURI(url, null, null);
                var tab = null;
                if (typeof b.addTab !="undefined")
                {
                    try{
                        tab = b.addTab(url,ops);
                        b.selectedTab = tab;
                    }catch(e)
                    {
                         if (window.Browser && window.Browser._content)
                         {
                             tab = window.Browser._content.newTab(true);
                         }
                    }
                }
                else if (window.Browser && window.Browser._content)
                {
                    try{
                        tab = window.Browser._content.newTab(true);
                        if (tab) {
                            var content = Browser._content;
                            var b = content.getBrowserForDisplay(content.getDisplayForTab(tab));
                            newWindow = b.contentWindow;
                        }
                        newWindow.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                        .getInterface(Components.interfaces.nsIWebNavigation)
                        .loadURI(uri.spec,
                            Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE,
                            null, null, null);
                        newWindow.focus();
                        return true;
                    }catch(e)
                    {
                        autopagerBwUtil.consoleError(e)
                    }
                }else if (Browser && Browser.addTab)
                {
                    tab = Browser.addTab(url,ops);
                }
                else
                {
                    return window.open(url, "_blank")!=null;
                }
                return tab;
            } else {
                return window.open(url, "_blank")!=null;
            }
        }
        else
        {
            return window.open(url, "_blank")!=null;
        }
        return false;
    },
    isFennec : function()
    {
     var f= (navigator.userAgent.indexOf(" Fennec/")!=-1)
         || (navigator.userAgent.indexOf(" Maemo/")!=-1);
     return f;
    },
    consoleLog: function(message) {
        var consoleService = Components.classes['@mozilla.org/consoleservice;1']
        .getService(Components.interfaces.nsIConsoleService);
        consoleService.logStringMessage(message)
    },
    consoleError: function(e) {
        if (e && e.stack)
            Components.utils.reportError(e + "@" + e.stack)
        else
            Components.utils.reportError(e)
    }
    ,newDOMParser : function ()
    {
        return (typeof Components == "object")? Components.classes["@mozilla.org/xmlextras/domparser;1"]
		    .createInstance(Components.interfaces.nsIDOMParser):new window.DOMParser()

    }
    ,doDecodeJSON : function (str)
    {
        try{
            return JSON.parse(str);
        }catch(e){
            if (Components && Components.classes["@mozilla.org/dom/json;1"])
            {
                var nativeJSON = Components.classes["@mozilla.org/dom/json;1"].createInstance(Components.interfaces.nsIJSON);
                return nativeJSON.decode(str);
            }
            this.consoleLog("error parser:" +e + ":"  + str)
            throw "unable to parser str";
        }
    }
    ,decodeJSON : function (str)
    {
        var info = [];
        if (str==="")
            return info;
        //try native json first
        try{
            info = this.doDecodeJSON(str);
        }catch(ex){
            //try parse it manually
            var strs = str.split("},{");
            var v
            if (strs.length>=1)
            {
                v = this.doDecodeJSON( strs[0] + "}]");
                if (v && v[0])
                    info.push(v[0]);
            }
            for(var index=1; index<strs.length-1;index++)
            {
                v = this.doDecodeJSON( "{" + strs[index] + "}");
                if (v)
                    info.push(v);
            }
            if (strs.length>1)
            {
                v = this.doDecodeJSON("[{" + strs[strs.length-1]);
                if (v && v[0])
                    info.push(v[0]);
            }
        }
        return info;
    }
    ,encodeJSON : function (obj)
    {
        var str = null;
        //try native json first

        var Ci = Components.interfaces;
        var Cc = Components.classes;

        if (Cc["@mozilla.org/dom/json;1"])
        {
            var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
            str = nativeJSON.encode(obj);
        }
        return str;
    }
    ,supportHiddenBrowser : function ()
    {
        return !autopagerPref.loadBoolPref("disable-hidden-browser");
        //return !autopagerBwUtil.isFennec();
    }
    ,createHTMLDocumentFromStr : function(str,urlStr) {
      return null;
    }
    ,openAlert : function(title,message,link,callback)
    {
        if (autopagerBwUtil.isFennec())
        {
            var listener = {
              observe: function(subject, topic, data) {
                if (topic == "alertclickcallback" && callback)
                    callback();                
              }
            }

            var alerts =  Components.classes["@mozilla.org/alerts-service;1"].getService(Components.interfaces.nsIAlertsService);
            alerts.showAlertNotification("chrome://autopager/skin/autopager48.ico", title,
                message, true, "", listener);
        }
        else
        {
            window.openDialog("chrome://autopager/content/alert.xul",
                "alert:alert",
                "chrome,dialog=yes,titlebar=no,popup=yes",
                title,message,link,callback);
        }
    }
    ,processXPath : function (xpath)
    {
        return xpath;
    }
    , isInPrivateMode : function()
    {
        try{
            var pbs = Components.classes["@mozilla.org/privatebrowsing;1"]
                                .getService(Components.interfaces.nsIPrivateBrowsingService);
            var inPrivateBrowsingMode = pbs.privateBrowsingEnabled;
            return inPrivateBrowsingMode;
        }catch(e)
        {
            return false;
        }
    }
    , apBrowserId : function()
    {
        //AutoPager supported browser id
        //Firefox 0, Fennec 1, MicroB 2, Chrome 3
        if  (navigator.userAgent.indexOf(" Fennec/")!=-1)
            return 1;
        if (navigator.userAgent.indexOf(" Maemo/")!=-1)
            return 2;
        return 0;
    }
    ,allowModifyHeader : function()
    {
        return true;
    }
    ,notification : function (id,message,buttons)
    {
        var notificationBox = gBrowser.getNotificationBox();
        var notification = notificationBox.getNotificationWithValue(id);
        if (notification) {
            notificationBox.removeNotification(notification)
        }
        var priority = notificationBox.PRIORITY_INFO_MEDIUM;
        notificationBox.appendNotification(message, "autopager-lite-discovery",
            "chrome://autopager/skin/autopager32.gif",
            priority, buttons);
    }

    ,deleteConfigFolder : function ()
    {
        var file = this.getConfigDir();
        if (file.exists()) {
            file.remove(true);
        }
    }
}