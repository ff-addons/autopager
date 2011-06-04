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
    ,
    newDOMParser : function ()
    {
        return (typeof Components == "object")? Components.classes["@mozilla.org/xmlextras/domparser;1"]
        .createInstance(Components.interfaces.nsIDOMParser):new window.DOMParser()

    }
    ,
    doDecodeJSON : function (str)
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
    ,
    decodeJSON : function (str)
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
    ,
    encodeJSON : function (obj)
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
    ,
    supportHiddenBrowser : function ()
    {
        return !autopagerPref.loadBoolPref("disable-hidden-browser");
    //return !autopagerBwUtil.isFennec();
    }
    ,
    createHTMLDocumentFromStr : function(str,urlStr) {
        return null;
    }
    ,
    openAlert : function(title,message,link,callback,openTimeout)
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
                title,message,link,callback,openTimeout);
        }
    }
    ,
    processXPath : function (xpath)
    {
        return xpath;
    }
    ,
    isInPrivateMode : function()
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
    ,
    apBrowserId : function()
    {
        //AutoPager supported browser id
        //Firefox 0, Fennec 1, MicroB 2, Chrome 3
        if  (navigator.userAgent.indexOf(" Fennec/")!=-1)
            return 1;
        if (navigator.userAgent.indexOf(" Maemo/")!=-1)
            return 2;
        return 0;
    }
    ,
    allowModifyHeader : function()
    {
        return true;
    }
    ,
    notification : function (id,message,buttons)
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

    ,
    deleteConfigFolder : function ()
    {
        var file = this.getConfigDir();
        if (file.exists()) {
            file.remove(true);
        }
    }
    ,
    getAddonsList: function _getAddonsList() {
        if (this.addonsList==null)
        {
            var extensionDir = Components.classes["@mozilla.org/file/directory_service;1"]
            .getService(Components.interfaces.nsIProperties)
            .get("ProfD", Components.interfaces.nsIFile);
            extensionDir.append("extensions");
            var entries = extensionDir.directoryEntries;

            var list = [];

            while (entries.hasMoreElements()) {
                var entry = entries.getNext();
                entry.QueryInterface(Components.interfaces.nsIFile);
                if (!entry.isDirectory())
                    continue;
                var guid = entry.leafName;
                list.push(guid);
            }
            this.addonsList = list;
        }
        return this.addonsList;
    },
    updateStatusIcons : function() {
        var enabled = autopagerPref.loadBoolPref("enabled");
        var autopagerButton = document.getElementById("autopager-button");
        var autopagerButton2= document.getElementById("autopager-button-fennec");
        if (autopagerButton2){
            autopagerButton2.setAttribute("hidden", !autopagerLite.isInLiteMode());
        }
        var image = document.getElementById("autopager_status");
        if (autopagerButton!=null || image!=null || autopagerButton2!=null)
        {
            var apStatus ="ap-disabled";
            if (enabled)
            {
                if (content && !autopagerMain.isEnabledOnDoc(content.document))
                    apStatus = "ap-site-disabled";
                else
                    apStatus = "ap-enabled";
            }
            this.changeButtonStatus(autopagerButton,apStatus);
            this.changeButtonStatus(autopagerButton2,apStatus);
            if (image)
            {
                if (apStatus =="ap-disabled")
                    image.setAttribute("src", "chrome://autopager/skin/autopager-small.off.gif");
                else if (apStatus =="ap-enabled")
                    image.setAttribute("src", "chrome://autopager/skin/autopager-small.on.gif");
                else if (apStatus =="ap-site-disabled")
                    image.setAttribute("src", "chrome://autopager/skin/autopager-small-site.off.gif");
            }
        }
    }
    ,
    changeButtonStatus : function (autopagerButton,apStatus)
    {
        if (autopagerButton)
        {
            if (autopagerButton.className.indexOf(" ap-")==-1)
                autopagerButton.className= autopagerButton.className + " " + apStatus;
            else
                autopagerButton.className= autopagerButton.className.substr(0,autopagerButton.className.indexOf(" ap-")) + " " + apStatus;
        }
    }
    ,
    addTabSelectListener : function (callback,useCapture)
    {
        if (typeof callback == "undefined")
            return;
        var container = null;
        if (typeof gBrowser != 'undefined' && gBrowser.tabContainer)
            container = gBrowser.tabContainer;
        else if (typeof getBrowser != 'undefined' && getBrowser() && getBrowser().mTabContainer)
            container = getBrowser().mTabContainer;
        if (container)
        {
            function listner(event)
            {
                if (gBrowser && gBrowser.selectedTab && gBrowser.selectedTab.linkedBrowser)
                {
                    var doc = gBrowser.selectedTab.linkedBrowser.contentDocument
                    callback(doc)
                }
            }
            container.addEventListener("TabSelect", listner, useCapture);
            window.addEventListener("unload", function(){
                window.removeEventListener("unload", arguments.callee, false);
                container.removeEventListener("TabSelect", listner, useCapture);
            },false);
        }
    },
    createXpath : function(doc) {
        toggleSidebar('autopagerSiteWizardSidebar',true);
        window.setTimeout(function(){
            var sidebar = document.getElementById("sidebar");
            var pickupContentPath = sidebar.contentDocument.getElementById("pickupContentPath");
            pickupContentPath.doCommand();
        },200);
    },
    testXPathTest : function(doc) {
        toggleSidebar('autopagerSiteWizardSidebar',true);
        window.setTimeout(function(){
            var sidebar = document.getElementById("sidebar");
            var contentXPath = sidebar.contentDocument.getElementById("contentXPath");
            contentXPath.focus();
        },200);
    },
sitewizard : function(doc) {
    if (autopagerPref.loadBoolPref("show-workshop-in-sidebar"))
    {
        toggleSidebar('autopagerSiteWizardSidebar',true);
        window.setTimeout(function(){
            var sidebar = document.getElementById("sidebar");
            var discoverPath = sidebar.contentDocument.getElementById("discoverPath");
            discoverPath.doCommand();

        },400);
    }else
    {
        var win=autopagerBwUtil.openWorkshopInDialog(doc.location.href);
    }
},
    openWorkshopInDialog : function(url,obj) {
        window.autopagerSelectUrl=url;
        window.autopagerOpenerObj = obj;
        var win= window.open("chrome://autopager/content/autopager-workshopWin.xul", "autopager-workshopWin",
                "chrome,resizable,centerscreen,width=700,height=600");
        win.focus();
        return win;
    },
    changeSessionUrl: function (container, url,pagenum)
    {
        var browser = AutoPagerNS.apSplitbrowse.getBrowserNode(container);
        var webNav = browser.webNavigation;
        var newHistory = webNav.sessionHistory;

        newHistory = newHistory.QueryInterface(Components.interfaces.nsISHistoryInternal);
        var entry = newHistory.getEntryAtIndex(newHistory.index,false).QueryInterface(Components.interfaces.nsISHEntry);
        //autopagerBwUtil.consoleLog(url)
        if (entry==null || entry.URI==null || entry.URI.spec==url)
        {
            return;
        }
        if (newHistory.index==0 ||
            (newHistory.getEntryAtIndex(newHistory.index-1,false)
                .QueryInterface(Components.interfaces.nsISHEntry) &&
                !(newHistory.getEntryAtIndex(newHistory.index-1,false)
                    .QueryInterface(Components.interfaces.nsISHEntry).URI.spec == container.location.href)))
                    {
            var newEntry = AutoPagerNS.apSplitbrowse.cloneHistoryEntry(entry);
            if (newEntry)
            {
                var uri = autopagerConfig.getRemoteURI(url);
                newEntry.setURI (uri);
                var histories = [];
                //copy all forward enties
                for(var i =newHistory.index+1 ;i<newHistory.count;i++)
                {
                    histories.push(newHistory.getEntryAtIndex(i,false).QueryInterface(Components.interfaces.nsISHEntry));
                }
                for(var i=0;i<histories.length;i++)
                {
                    newHistory.addEntry(histories[i], true);
                }
                newHistory.addEntry(newEntry, true);
                newEntry.saveLayoutStateFlag= false;
            }
        }
        else{
            var uri = autopagerConfig.getRemoteURI(url);
            entry.setURI (uri);
            entry.saveLayoutStateFlag= false;
        }
    },
 showAbout: function ()
 {
   try {
       var thisAddon = Application.extensions.get("autopager@mozilla.org");
     var extensionManager = Components.classes["@mozilla.org/extensions/manager;1"]
       .getService(Components.interfaces.nsIExtensionManager);
var rds = extensionManager.datasource.QueryInterface(Components.interfaces.nsIRDFRemoteDataSource);
  if (rds)
    rds.Flush();
     var database =
       Components.classes["@mozilla.org/rdf/datasource;1?name=composite-datasource"]
       .getService(Components.interfaces.nsIRDFCompositeDataSource);

     database.AddDataSource(extensionManager.datasource);
   window.openDialog("chrome://mozapps/content/extensions/about.xul",
                     "autopagerAbout",
                     "chrome,centerscreen,modal",
                     "urn:mozilla:item:autopager@mozilla.org",//thisAddon.id,
                     extensionManager.datasource);
   } catch (ex) {

   }

 } 
}
