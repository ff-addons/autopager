
var apxmlhttprequest=
{
    loadCallBack:null,
    errorCallBack:null,
    obj:null,
    
    /**
   * get from http://lxr.mozilla.org/mozilla/source/browser/components/microsummaries/src/nsMicrosummaryService.js
   * Parse a string of HTML text.  Used by _load() when it retrieves HTML.
   * We do this via hidden XUL iframes, which according to bz is the best way
   * to do it currently, since bug 102699 is hard to fix.
   * @param   htmlText
   *          a string containing the HTML content
   *
   */
   
  createHTMLDocumentByString2: function(htmlText) {
    // Find a window to stick our hidden iframe into.
    var windowMediator = Components.classes['@mozilla.org/appshell/window-mediator;1'].
                         getService(Components.interfaces.nsIWindowMediator);
    var window = windowMediator.getMostRecentWindow("navigator:browser");
    // XXX We can use other windows, too, so perhaps we should try to get
    // some other window if there's no browser window open.  Perhaps we should
    // even prefer other windows, since there's less chance of any browser
    // window machinery like throbbers treating our load like one initiated
    // by the user.
    if (!window)
      throw(this._uri.spec + " can't parse; no browser window");
    var document = window.document;
    var rootElement = document.documentElement;
  
    // Create an iframe, make it hidden, and secure it against untrusted content.
    var _iframe = document.createElement('iframe');
    _iframe.setAttribute("collapsed", true);
    _iframe.setAttribute("type", "content");
  
    // Insert the iframe into the window, creating the doc shell.
    rootElement.appendChild(_iframe);

    // When we insert the iframe into the window, it immediately starts loading
    // about:blank, which we don't need and could even hurt us (for example
    // by triggering bugs like bug 344305), so cancel that load.
    var webNav = _iframe.docShell.QueryInterface(Components.interfaces.nsIWebNavigation);
    webNav.stop(Components.interfaces.nsIWebNavigation.STOP_NETWORK);

    // Turn off JavaScript and auth dialogs for security and other things
    // to reduce network load.
    // XXX We should also turn off CSS.
    _iframe.docShell.allowJavascript = false;
    _iframe.docShell.allowAuth = false;
    _iframe.docShell.allowPlugins = false;
    _iframe.docShell.allowMetaRedirects = false;
    _iframe.docShell.allowSubframes = false;
    _iframe.docShell.allowImages = false;
  
    var parseHandler = {
      _self: this,
      handleEvent: function (event) {
        event.target.removeEventListener("DOMContentLoaded", this, false);
        try     { this._self._handleParse(event) }
        finally { this._self = null }
      }
    };
 
    // Convert the HTML text into an input stream.
    var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
                    createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
    converter.charset = "UTF-8";
    var stream = converter.convertToInputStream(htmlText);

    // Set up a channel to load the input stream.
    var channel = Components.classes["@mozilla.org/network/input-stream-channel;1"].
                  createInstance(Components.interfaces.nsIInputStreamChannel);
    channel.setURI(this._uri);
    channel.contentStream = stream;

    // Load in the background so we don't trigger web progress listeners.
    var request = channel.QueryInterface(Components.interfaces.nsIRequest);
    request.loadFlags |= Components.interfaces.nsIRequest.LOAD_BACKGROUND;

    // Specify the content type since we're not loading content from a server,
    // so it won't get specified for us, and if we don't specify it ourselves,
    // then Firefox will prompt the user to download content of "unknown type".
    var baseChannel = channel.QueryInterface(Components.interfaces.nsIChannel);
    baseChannel.contentType = "text/html";

    // Load as UTF-8, which it'll always be, because XMLHttpRequest converts
    // the text (i.e. XMLHTTPRequest.responseText) from its original charset
    // to UTF-16, then the string input stream component converts it to UTF-8.
    baseChannel.contentCharset = "UTF-8";

    // Register the parse handler as a load event listener and start the load.
    // Listen for "DOMContentLoaded" instead of "load" because background loads
    // don't fire "load" events.
    _iframe.addEventListener("DOMContentLoaded", parseHandler, true);
    var uriLoader = Components.classes["@mozilla.org/uriloader;1"].getService(Components.interfaces.nsIURILoader);
    uriLoader.openURI(channel, true, _iframe.docShell);
    return null;
  },
_handleParse: function (event) {
    // XXX Make sure the parse was successful?

    var doc = event.target.contentDocument;
    this.loadCallback(doc,this.obj);
  },
    // utility functions.
    createHTMLDocumentByString: function(str) {
    var windowMediator = Components.classes['@mozilla.org/appshell/window-mediator;1'].
                         getService(Components.interfaces.nsIWindowMediator);
    var window = windowMediator.getMostRecentWindow("navigator:browser");
    var doc;
    //if (window != null)
    //  doc = window.document;
  //else
      doc = content.document;

    var html = str.replace(/<!DOCTYPE.*?>/, '').replace(/<html.*?>/, '').replace(/<\/html>.*/, '');
        var htmlDoc  = doc.implementation.createDocument(null, 'html', null);
        var fragment = apxmlhttprequest.createDocumentFragmentByString(doc,html);
        htmlDoc.documentElement.appendChild(fragment);
        return htmlDoc;
    },
    createDocumentFragmentByString: function(doc,str) {
        var range = doc.createRange()
        range.setStartAfter(doc.body)
        //range.setStartAfter(doc.documentElement)
        return range.createContextualFragment(str)
    },

    xmlhttprequest: function(url,type,loadCallBack,errorCallBack,obj)
    {
            this.loadCallBack = loadCallBack;
            this.errorCallBack = errorCallBack;
            this.obj = obj;
            var xmlhttp=null;
            var doc=null;
            try{
                  try{
                    xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
                  }catch(e){
                    xmlhttp = new XMLHttpRequest();
                  }
            xmlhttp.overrideMimeType(type);
            xmlhttp.onreadystatechange = function (aEvt) {
            if(xmlhttp.readyState == 4) 
            {
                    if(xmlhttp.status == 200)
                    {
                        doc=xmlhttp.responseXML;
                        if (doc == null)
                        {
                            try{
                                var domParser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
                                .createInstance(Components.interfaces.nsIDOMParser);
                                //alert(configFile);
                                //var configContents = getContents(getConfigFileURI("autopager.xml"));
                                doc = domParser.parseFromString(xmlhttp.responseText, "text/xml");
                                if (doc != null && doc.childNodes[0].localName == "parsererror")
                                    doc = null;
                            }catch(e){
                                doc = null;
                            }
                        }
                        if (doc == null)
                            doc = apxmlhttprequest.createHTMLDocumentByString(xmlhttp.responseText);
                        loadCallBack(doc,obj);
                    }
                    else
                    {
                        //errorCallBack(doc,obj);
                    }
            }
          };
          xmlhttp.open("GET", url, true);
          xmlhttp.setRequestHeader("Cache-Control" ,"no-cache");
          xmlhttp.send(null);

        }catch (e){
                errorCallBack(doc,obj);
        }
    },

    getElementsByXPath:function(xpath, node) {
        var node = node || document
        var nodesSnapshot = content.document.evaluate(xpath, node, null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
        var data = []
        for (var i = 0; i < nodesSnapshot.snapshotLength; i++) {
            data.push(nodesSnapshot.snapshotItem(i))
        }
        return (data.length >= 1) ? data : null
    }

}