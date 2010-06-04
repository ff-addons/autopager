var autopagerUtils = {
    log: (typeof location!= "undefined" && location.protocol=="chrome:") ? function(message) {
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
        var url=location.protocol + "://" + location.host ;//+ (location.port!=""?location.port : "");
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
    },
    correctRegExp : function( pattern ) {
        var s = new String(pattern);
        var res = new String("");
        var escaped = false;
        var c = '';
        for (var i = 0 ; i < s.length ; i++) {
            c = s[i];
            if(c == '\\')
            {
                escaped = !escaped;
                res += c;
            }else
            {
                if (c == '/' && !escaped)
                {
                    res += "\\";
                }
                res+=c;
                escaped = false;
            }
        }
        return new RegExp(res, "i");
    },
    getRegExp :function(site)
    {
        try{
            if (site.regex==null)
            {
                if (site.isRegex)
                    try{
                        //site.regex = new RegExp(autopagerUtils.correctRegExp(site.urlPattern));
                        site.regex = new RegExp(site.urlPattern);
                    }catch(re)
                    {
                        try{
                            site.regex = new RegExp(autopagerUtils.correctRegExp(site.urlPattern));
                        }catch(e){
                            //error create regexp, try to use it as pattern
                            site.regex = autopagerUtils.convert2RegExp(site.urlPattern);
                        }        
                    }
                else
                    site.regex = autopagerUtils.convert2RegExp(site.urlPattern);
            }
        }catch(e)
        {
            site.regex = /no-such-regex/;
        }
        return site.regex;
    }
    ,
    getRegExp2 :function(pattern)
    {
        try{
            if (pattern.rg==null)
            {
                if (pattern.r)
                    try{
                        pattern.rg = new RegExp(pattern.u);
                    }catch(re)
                    {
                        try{
                            pattern.rg = new RegExp(autopagerUtils.correctRegExp(pattern.u));
                        }catch(e){
                            //error create regexp, try to use it as pattern
                            pattern.rg = autopagerUtils.convert2RegExp(pattern.u);
                        }
                    }
                else
                    pattern.rg = autopagerUtils.convert2RegExp(pattern.u);
            }
        }catch(e)
        {
            pattern.rg = /no-such-regex/;
        }
        return pattern.rg;
    }
    ,
    printStackTrace : function() {
        var callstack = [];
        var ex = null;
        try {
            i.dont.exist+=0; //doesn't exist- that's the point
        } catch(e) {
            ex = e;
        }
        callstack = this.getStack(ex);
        this.output(callstack);
    },
    getStack : function(e) {
        if (typeof e == "undefined")
        {
            try {
                i.dont.exist+=0; //doesn't exist- that's the point
            } catch(ex) {
                e = ex;
            }
        }
        var callstack = [];
        var isCallstackPopulated = false;

        if (e.stack) { //Firefox
            var lines = e.stack.split("\n");
            for (var i=0, len=lines.length; i<len; i++) {
                if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(:/)) {
                    callstack.push(lines[i]);
                }
            }
            //Remove call to printStackTrace()
            callstack.shift();
            isCallstackPopulated = true;
        }
        else if (window.opera && e.message) { //Opera
            var lines = e.message.split("\n");
            for (var i=0, len=lines.length; i<len; i++) {
                if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(/)) {
                    var entry = lines[i];
                    //Append next line also since it has the file info
                    if (lines[i+1]) {
                        entry += " at " + lines[i+1];
                        i++;
                    }
                    callstack.push(entry);
                }
            }
            //Remove call to printStackTrace()
            callstack.shift();
            isCallstackPopulated = true;
        }

        if (!isCallstackPopulated) { //IE and Safari
            var currentFunction = arguments.callee.caller;
            while (currentFunction) {
                var fn = currentFunction.toString();
                var fname = fn.substring(fn.indexOf("function") + 8, fn.indexOf("(")) || "anonymous";
                callstack.push(fname);
                currentFunction = currentFunction.caller;
            }
        }
        return callstack;
    }
    ,
    output : function(arr) {
        //Optput however you want
        alert(arr.join("\n"));
    }
    ,
    outputStack : function(ex) {
        var callstack = this.getStack(ex);
        this.output(callstack);
    }
    ,
    getTopDoc : function (doc)
    {
        return doc.defaultView? doc.defaultView.top.document : (doc.top?doc.top:doc);
    }
    ,
    findUrlInElement : function (ele)
    {
        if (ele !=null && ele.href)
            return ele.href;
            
        var href = this.findUrlInBelowElement(ele);
        if (href != null && typeof href == 'string')
            return href;
        href = this.findUrlInUpperElement(ele);
        return href;

    }
    ,
    findUrlInBelowElement : function (ele)
    {
        if (!ele.childNodes)
            return null;
        var childNode=null;
        for (var i = 0; (childNode = ele.childNodes[i]); i++)
        {
            if (childNode !=null && childNode.href)
                return childNode.href;
        }
        for (i = 0; (childNode = ele.childNodes[i]); i++)
        {
            var href = this.findUrlInBelowElement(childNode);
            if (href != null && typeof href == 'string')
                return href;
        }
        return null;
    }
    ,
    findUrlInUpperElement : function (ele)
    {
        while(ele !=null && ele.parentNode!=null && ele.parentNode!=ele)
        {
            if (ele !=null && ele.href)
                return ele.href;
            ele = ele.parentNode
        }
        return null;
    }
    ,
    getUrl : function (doc)
    {
        if (!doc)
            return "";

        if (doc.location && doc.location.href)
            return doc.location.href;
        if (doc && doc.documentElement && doc.documentElement.getAttribute("url"))
            return doc.documentElement.getAttribute("url");
        return "";
    }
    ,
    isValidDoc : function (doc)
    {
        if (doc == null)
            return false;
        if (!(doc instanceof HTMLDocument))
        {
            return false;
        }
        if (doc.defaultView == null)
            return false;
        if (doc.location == null)
        {
            return false;
        }
        return true;
    }
    ,
    getFormName : function(node)
    {
        while(node && node.localName.toLowerCase()!="form"
            && node.localName.toLowerCase()!="body"
            && node != node.parentNode)
        node = node.parentNode;
        if (!node || node.localName.toLowerCase()!="form" || (!node.id && !node.name))
            return "_default_";
        if (!node.id)
            return node.id;
        if (!node.name)
            return node.name;
        return "_default_";
    }
    ,
    serializeUserInput : function(aFrame)
    {
        var data = {};
        try {
            var xpe = new XPathEvaluator();
            var nsResolver = xpe.createNSResolver(aFrame.document.documentElement);
            var xpathResult = aFrame.document.evaluate(
                'descendant::textbox | descendant::*[local-name() = "input" or local-name() = "INPUT" or local-name() = "textarea" or local-name() = "TEXTAREA"]',
                aFrame.document,
                nsResolver,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null
                );
            if (xpathResult.snapshotLength) {
                var node;
                for (var i = 0, maxi = xpathResult.snapshotLength; i < maxi; i++)
                {
                    node = xpathResult.snapshotItem(i);
                    if (node.wrappedJSObject) node = node.wrappedJSObject;
                    if (!node.id && !node.name)
                        continue;

                    var formName = autopagerUtils.getFormName(node);
                    var form = data[formName];
                    if (typeof form == "undefined")
                    {
                        form = {}
                        data[formName]=form;
                    }
                    var text = {};
                    text.id = node.id;
                    text.name = node.name;
                    form[text.id +"|" + text.name] = text
                    switch (node.localName.toLowerCase())
                    {
                        case 'input':
                            if (/^(true|readonly|disabled)$/i.test(node.getAttribute('readonly') || node.getAttribute('disabled') || ''))
                                continue;
                            switch ((node.getAttribute('type') || '').toLowerCase())
                            {
                                case 'checkbox':
                                    text.value = node.checked ? true : false;
                                    break;

                                case 'radio':
                                case 'text':
                                    text.value = node.value;
                                    break;
                                case 'submit':
                                case 'reset':
                                case 'button':
                                case 'image':
                                default:
                                    break;
                            }
                            break;
                        case 'textbox':
                        case 'text':
                        case 'textarea':
                            if (node.value)
                                text.value = node.value;
                            break;

                        default:
                            break;
                    }

                }
            }
        }
        catch(e) {
            autopagerBwUtil.consoleError(e);
        }
        //data.innerHTML = aFrame.document.documentElement.innerHTML
        var frames = aFrame.frames;
        if (frames.length) {
            data.children = [];
            for (var i = 0, maxi = frames.length; i < maxi; i++)
            {
                data.children.push(autopagerUtils.serializeUserInput(frames[i]));
            }
        }

        return data;
    }
    ,
    deSerializeUserInput : function(aFrame,data)
    {
        try {
            var xpe = new XPathEvaluator();
            var nsResolver = xpe.createNSResolver(aFrame.document.documentElement);
            var xpathResult = aFrame.document.evaluate(
                'descendant::textbox | descendant::*[local-name() = "input" or local-name() = "INPUT" or local-name() = "textarea" or local-name() = "TEXTAREA"]',
                aFrame.document,
                nsResolver,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null
                );
            if (xpathResult.snapshotLength) {
                var node;
                for (var i = 0, maxi = xpathResult.snapshotLength; i < maxi; i++)
                {
                    node = xpathResult.snapshotItem(i);
                    if (node.wrappedJSObject) node = node.wrappedJSObject;
                    if (!node.id && !node.name)
                        continue;

                    var formName = autopagerUtils.getFormName(node);
                    var form = data[formName];
                    if (typeof form == "undefined")
                    {
                        continue;
                    }
                    var text = form[node.id +"|" + node.name];
                    if (typeof text == "undefined")
                    {
                        continue;
                    }
                    switch (node.localName.toLowerCase())
                    {
                        case 'input':
                            if (/^(true|readonly|disabled)$/i.test(node.getAttribute('readonly') || node.getAttribute('disabled') || ''))
                                continue;
                            switch ((node.getAttribute('type') || '').toLowerCase())
                            {
                                case 'checkbox':
                                    node.checked  = text.value;
                                    break;

                                case 'radio':
                                case 'text':
                                    node.value = text.value ;
                                    break;
                                case 'submit':
                                case 'reset':
                                case 'button':
                                case 'image':
                                default:
                                    break;
                            }
                            break;
                        case 'textbox':
                        case 'text':
                        case 'textarea':
                            if (text.value)
                                node.value = text.value;
                            break;

                        default:
                            break;
                    }

                }
            }
        }
        catch(e) {
            autopagerBwUtil.consoleError(e);
        }
        //aFrame.document.documentElement.innerHTML = data.innerHTML
        var frames = aFrame.frames;
        if (frames.length && data.children ) {
            for (var i = 0, maxi = Math.min(frames.length,data.children.length); i < maxi; i++)
            {
                autopagerUtils.deSerializeUserInput(frames[i],data.children[i]);
            }
        }

        return data;
    }
    ,
    noprompt : function()
    {
        return autopagerPref.loadBoolPref("noprompt") || autopagerBwUtil.isInPrivateMode()
        || autopagerBwUtil.isFennec();
    },
    contains : function(parent, descendant) {
        // We use browser specific methods for this if available since it is faster
        // that way.

        // IE / Safari(some) DOM
        if (typeof parent.contains != 'undefined') {
            return parent == descendant || parent.contains(descendant);
        }

        // W3C DOM Level 3
        if (typeof parent.compareDocumentPosition != 'undefined') {
            return parent == descendant ||
            Boolean(parent.compareDocumentPosition(descendant) & 16);
        }

        // W3C DOM Level 1
        while (descendant && parent != descendant) {
            descendant = descendant.parentNode;
        }
        return descendant == parent;
    }

    ,
    Set_Cookie : function(doc, name, value, expires, domain, path, secure )
    {
        // set time, it's in milliseconds
        var today = new Date();
        today.setTime( today.getTime() );

        /*
if the expires variable is set, make the correct
expires time, the current script below will set
it for x number of days, to make it for hours,
delete * 24, for minutes, delete * 60 * 24
*/
        if ( expires )
        {
            expires = expires * 1000 * 60 * 60 * 24;
        }
        var expires_date = new Date( today.getTime() + (expires) );

        var oldCookie = doc.cookie
        var a_all_cookies = oldCookie.split( ';' );
        oldCookie = ''
        for (var i = 0; i < a_all_cookies.length; i++ )
        {
            // now we'll split apart each name=value pair
            var a_temp_cookie = a_all_cookies[i].split( '=' );
            // and trim left/right whitespace while we're at it
            var cookie_name = a_temp_cookie[0].replace(/^\s+|\s+$/g, '');

            // if the extracted name matches passed check_name
            if ( cookie_name != name )
            {
                oldCookie += ";" +  a_all_cookies[i]
            }
        }
        doc.cookie = name + "=" +escape( value ) +
        ( ( expires ) ? ";expires=" + expires_date.toGMTString() : "" ) +
        ( ( path ) ? ";path=" + path : "" ) +
        ( ( domain ) ? ";domain=" + domain : "" ) +
        ( ( secure ) ? ";secure" : "" )
        + oldCookie;
    }
    // this fixes an issue with the old method, ambiguous values
    // with this test document.cookie.indexOf( name + "=" );
    ,
    Get_Cookie : function(doc, check_name ) {
        // first we'll split this cookie up into name/value pairs
        // note: document.cookie only returns name=value, not the other components
        var a_all_cookies = doc.cookie.split( ';' );
        var a_temp_cookie = '';
        var cookie_name = '';
        var cookie_value = '';
        var b_cookie_found = false; // set boolean t/f default f

        for (var i = 0; i < a_all_cookies.length; i++ )
        {
            // now we'll split apart each name=value pair
            a_temp_cookie = a_all_cookies[i].split( '=' );


            // and trim left/right whitespace while we're at it
            cookie_name = a_temp_cookie[0].replace(/^\s+|\s+$/g, '');

            // if the extracted name matches passed check_name
            if ( cookie_name == check_name )
            {
                b_cookie_found = true;
                // we need to handle case where cookie has no value but exists (no = sign, that is):
                if ( a_temp_cookie.length > 1 )
                {
                    cookie_value = unescape( a_temp_cookie[1].replace(/^\s+|\s+$/g, '') );
                }
                // note that in cases where cookie is initialized but no value, null is returned
                return cookie_value;
                break;
            }
            a_temp_cookie = null;
            cookie_name = '';
        }
        if ( !b_cookie_found )
        {
            return null;
        }
    }
    ,notification : function (id,message,buttons)
    {
        if (typeof autopagerBwUtil.notification != "undefined")
        {
            autopagerBwUtil.notification(id,message,buttons)
        }
    }
// Converts a pattern in this programs simple notation to a regular expression.
// thanks AdBlock! http://www.mozdev.org/source/browse/adblock/adblock/
,convert2RegExp : function( pattern ) {
  var s = new String(pattern);
  var res = new String("^");

  for (var i = 0 ; i < s.length ; i++) {
    switch(s[i]) {
      case '*' :
        res += ".*";
        break;

      case '.' :
      case '?' :
      case '^' :
      case '$' :
      case '+' :
      case '{' :
      case '[' :
      case '|' :
      case '(' :
      case ')' :
      case ']' :
      case '/' :
        res += "\\" + s[i];
        break;

      case '\\' :
        res += "\\\\";
        break;

      case ' ' :
        // Remove spaces from URLs.
        break;

      default :
        res += s[i];
        break;
    }
  }

  return new RegExp(res + '$', "i");
}
}
