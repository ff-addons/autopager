/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
const autopagerUtils = {
    log: (location.protocol=="chrome:") ? function(message) {
        if (autopagerPref.loadBoolPref("debug"))
        {
            var consoleService = Components.classes['@mozilla.org/consoleservice;1']
            .getService(Components.interfaces.nsIConsoleService);
            consoleService.logStringMessage(message)
        }
    } : function(message) {
        if (autopagerPref.loadBoolPref("debug"))
            debug(message)
    },
    consoleLog: function(message) {
        var consoleService = Components.classes['@mozilla.org/consoleservice;1']
        .getService(Components.interfaces.nsIConsoleService);
        consoleService.logStringMessage(message)
    },
    consoleError: function(message) {
        Components.utils.reportError(message)
    },
    currentDocument: function()
    {
        return this.currentBrowser().contentDocument;
    },
    currentBrowser: function()
    {
        var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
        var browser = windowManager.getMostRecentWindow("navigator:browser").document.getElementById("content");


        return browser;
    },
    currentWindow: function()
    {
        var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
        var browserWindow = windowManager.getMostRecentWindow("navigator:browser");
        return browserWindow;
    },
    cloneBrowser: function(targetB, originalB)
    {
        var webNav = targetB.webNavigation;
        var newHistory = webNav.sessionHistory;

        if (newHistory == null)
        {
            newHistory = Components.classes["@mozilla.org/browser/shistory-internal;1"].getService(Components.interfaces.nsISHistory);
            webNav.sessionHistory = newHistory;
        }
        newHistory = newHistory.QueryInterface(Components.interfaces.nsISHistoryInternal);

        // delete history entries if they are present
    
        if (newHistory.count > 0)
            newHistory.PurgeHistory(newHistory.count);
        var originalHistory  = originalB.webNavigation.sessionHistory;
        originalHistory = originalHistory.QueryInterface(Components.interfaces.nsISHistoryInternal);


        var entry = originalHistory.getEntryAtIndex(originalHistory.index,false).QueryInterface(Components.interfaces.nsISHEntry);
        var newEntry = this.cloneHistoryEntry(entry);
        if (newEntry)
            newHistory.addEntry(newEntry, true);
    

        webNav.gotoIndex(0);
    
    },
    cloneHistoryEntry: function(aEntry) {
        if (!aEntry)
            return null;
        aEntry = aEntry.QueryInterface(Components.interfaces.nsISHContainer);
        var newEntry = aEntry.clone(true);
        newEntry = newEntry.QueryInterface(Components.interfaces.nsISHContainer);
        newEntry.loadType = Math.floor(aEntry.loadType);
        if (aEntry.childCount) {
            for (var j = 0; j < aEntry.childCount; j++) {
                var childEntry = this.cloneHistoryEntry(aEntry.GetChildAt(j));
                if (childEntry)
                    newEntry.AddChild(childEntry, j);
            }
        }
        return newEntry;
    }
    ,
    findContentWindow: function(doc) {
        var ctx = doc;
        if(!ctx)
            return null;
        const ci = Components.interfaces;
        const lm = this.lookupMethod;
        if(!(ctx instanceof ci.nsIDOMWindow)) {
            if(ctx instanceof ci.nsIDOMDocument) {
                ctx = lm(ctx, "defaultView")();
            } else if(ctx instanceof ci.nsIDOMNode) {
                ctx = lm(lm(ctx, "ownerDocument")(), "defaultView")();
            } else return null;
        }
        if(!ctx) return null;
        ctx = lm(ctx, "top")();
    
        return ctx;
    },
    windowEnumerator : function(aWindowtype) {
        if (typeof(aWindowtype) == "undefined")
            aWindowtype = "navigator:browser";
        var WindowManager = Components.classes['@mozilla.org/appshell/window-mediator;1']
        .getService(Components.interfaces.nsIWindowMediator);
        return WindowManager.getEnumerator(aWindowtype);
    },
    numberOfWindows : function(all, aWindowtype) {
        var enumerator = autopagerUtils.windowEnumerator(aWindowtype);
        var count = 0;
        while ( enumerator.hasMoreElements() ) {
            var win = enumerator.getNext();
            if ("SessionManager" in win && win.SessionManager.windowClosed)
                continue;
            count++;
            if (!all && count == 2)
                break;
        }
        return count;
    },
    isLastWindow : function(aWindowtype) {
        var count = autopagerUtils.numberOfWindows(false,aWindowtype);
        return count <=1;
    },
    clone : function(obj){
        if(obj == null || typeof obj != 'object')
            return obj;
        var temp = new obj.constructor();

        for(var key in obj)
        {
            temp[key] = this.clone(obj[key]);
        }
        return temp;
    },
    getLocale : function ()
    {
        return navigator.language;
    },
    isChineseLocale : function ()
    {
        var l = navigator.language;
        return (l == 'zh-CN' || l == 'zh-TW');
    },
    clearUrl : function (sourceUri)
    {
        var uri = autopagerUtils.parseUri(sourceUri)
        return autopagerUtils.doClearedUrl(uri)
    },
    doClearedUrl : function (uri)
    {
        var u = uri["protocol"] + "://" + uri["host"] + ":" + uri["port"] + uri["directoryPath"] + uri["fileName"];
        for(var k in uri["searchParts"])
        {
            u += k + "=&";
        }
        return u;
    },
    parseUri : function (sourceUri){
        var uriPartNames = ["href","protocol","host","hostname","port","pathname","directoryPath","fileName","search","hash"];
        var uriParts = new RegExp("^(?:([^:/?#.]+):)?(?://)?(([^:/?#]*)(?::(\\d*))?)?((/(?:[^?#](?![^?#/]*\\.[^?#/.]+(?:[\\?#]|$)))*/?)?([^?#/]*))?(?:\\?([^#]*))?(?:#(.*))?").exec(sourceUri);
        var uri = {};

        for(var i = 0; i < 10; i++){
            uri[uriPartNames[i]] = (uriParts[i] ? uriParts[i] : "");
        }

        // Always end directoryPath with a trailing backslash if a path was present in the source URI
        // Note that a trailing backslash is NOT automatically inserted within or appended to the "path" key
        if(uri.directoryPath.length > 0){
            uri.directoryPath = uri.directoryPath.replace(/\/?$/, "/");
        }
        uri.pathes = uri.pathname.substring(1).split("/");
        var search = uri["search"];
        var searchParts = this.parseSearch(search);
        uri["searchParts"] = searchParts
        return uri;
    },
    parseSearch : function(search)
    {
        /* parse the query */
        var x = search.replace(/;/g, '&').split('&');
        var q={};
        for (var i=0; i<x.length; i++)
        {
            if (x[i].length==0)
                continue;
            var t = x[i].split('=', 2);
            var name = unescape(t[0]);
            var v;
            if (t.length > 1)
                v = unescape(t[1]);
            else
                v = true;

            if (q[name])
            {
                var vs = [];
                vs[0] = q[name];
                q[name] = vs;
                q[name][q[name].length] = v;
            }
            else
                q[name] = v;
        }
        return q;
    },
    // Dump the object in a table
    dumpResults : function(obj,container){
        var output = "";
        for (var property in obj){
            output += '<tr><td class="name">' + property +
            '</td><td class="result">"<span class="value">' +
            this.dumpObject(obj[property],10) + '</span>"</td></tr>';
        }
        container.innerHTML = "<table>" + output + "</table>";
    },
    dumpObject : function (obj,level)
    {
        if(obj == null || typeof obj != 'object' || level<0)
            return obj;
        var temp = "[";

        for(var key in obj)
        {
            if (temp.length>1)
                temp+=",";
            try{
                temp += key + "=" + this.dumpObject(obj[key],level-1);
            }catch(e){
                temp += key + "=<unable to access>";
            }
        }
        return temp+"]";
    },
    getPattern : function (location ,depth)
    {
        var url=location.protocol + "://" + location.host + (location.port!=""?location.port : "");
        var last;
        for(var lastPos=0;lastPos<depth && lastPos<location.pathes.length;lastPos++)
        {
            url += "/" + location.pathes[lastPos]
        }
        return url + (depth<=location.pathes.length-1 || depth==0 ?"/*":"*");
    },
    isNotMain : function(str,num)
    {
        return ((str.match(/[0123456789-_]/g) && str.match(/[0123456789-_]/g).length>=num)
            || str.replace(/[0123456789-_]/g,'').length==0);
    },
    getMainDirDepth : function (location ,num)
    {
        var align=0;
        if (location.pathname.match(/(\.)(html|shtml|txt|htm)(\*)?$/) || (location.pathname.match(/(\.)(asp|php|php3|php5)(\*)?$/)) && location.search=="")
            align = 1;
        var lastPos =0;
        for(lastPos=location.pathes.length-1-align;
            lastPos>=0 && this.isNotMain(location.pathes[lastPos],num) ;lastPos--)
            {
        }

        //        if (lastPos ==0 && align==0 && location.pathes.length==1 &&
        //                (location.pathes[lastPos].match(/[0123456789-_]/g) == null || location.pathes[lastPos].match(/[0123456789-_]/g).length<num))
        //                return 1;
        return lastPos+1;
    }
}