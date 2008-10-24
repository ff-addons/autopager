//this is come from noscript DOMUtils
const XULDOMUtils = {
  lookupMethod: Components.utils ? Components.utils.lookupMethod : Components.lookupMethod,
  
  findBrowser: function(chrome, win) {
    var gb = chrome.getBrowser();
    var browsers;
    if(! (gb && (browsers = gb.browsers))) return null;
    
    var browser = gb.selectedBrowser;
    if(browser.contentWindow == win) return browser;
    
    for(var j = browsers.length; j-- > 0;) {
      browser = browsers[j];
      if(browser.contentWindow == win) return browser;
    }
    
    return null;
  },
  findContentWindow: function(doc) {
  	var ctx = doc;
    if(!ctx)
        return null;
    const ci = Components.interfaces;
    const lm = this.lookupMethod;
    if(!(ctx instanceof ci.nsIDOMWindow)) {
      if(ctx instanceof ci.nsIDOMDocument) {
        ctx = ctx.defaultView;
        //ctx = lm(ctx, "defaultView")();
      } else if(ctx instanceof ci.nsIDOMNode) {
        //ctx = lm(lm(ctx, "ownerDocument")(), "defaultView")();
        ctx = ctx.ownerDocument.defaultView;        
      } else return null; 
    }
    if(!ctx) 
        return null;
    //ctx = lm(ctx, "top")();
    ctx = ctx.top;
    
    return ctx;
  },
  findBrowserForNode: function(ctx) {
    if(!ctx) return null;
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
    
    var bi = new this.BrowserIterator();
    for(var b; b = bi.next();) {
      if(b.contentWindow == ctx) return b;
    }
    return null;
  },
  
  getDocShellFromWindow: function(window) {
    const ci = Components.interfaces;
    try {
      return window.QueryInterface(ci.nsIInterfaceRequestor)
                   .getInterface(ci.nsIWebNavigation)
                   .QueryInterface(ci.nsIDocShell);
    } catch(e) {
      return null;
    }
  },
  
  BrowserIterator: function() {
  	
     const wm = Components.classes['@mozilla.org/appshell/window-mediator;1']
                          .getService(Components.interfaces.nsIWindowMediator);
    
    var mostRecentWin, mostRecentTab;
    var currentWin = mostRecentWin = wm.getMostRecentWindow("navigator:browser");
    var winEnum = null;
    var currentTB, currentTab;
    var curTabIdx;
    var browsers;
    
    function initPerWin() {
      currentTB = currentWin && currentWin.getBrowser();
      if(currentTB) {
        browsers = currentTB.browsers;
        currentTab = mostRecentTab = currentTB && currentTB.selectedBrowser;
      } else {
        currentTab = null;
      }
      curTabIdx = 0;
    }
    
    initPerWin();
   
    this.next = function() {
      var ret = currentTab;
      if(!ret) return null;
      if(curTabIdx >= browsers.length) {
        
        if(!winEnum) {
          winEnum = wm.getEnumerator("navigator:browser");
        }
        if(winEnum.hasMoreElements()) {
          currentWin = winEnum.getNext();
          if(currentWin == mostRecentWin) return this.next();
          initPerWin();
        } else {
          currentTab = null;
          return ret;
        }
      }
      currentTab = browsers[curTabIdx++];
      
      if(currentTab == mostRecentTab) this.next();
      return ret;
    }
  }
};

var splitbrowse = {
  autopagerPrefix : "autopager",
  domUtils: XULDOMUtils,
  hidden : true,
  execute: function(node,method)
  {
  	const lm = this.domUtils.lookupMethod;
   	lm(node, method)(null);
  },    
  init : function() 
  {
  	//document.splitBrowserCount = 0;
        window.removeEventListener("load",splitbrowse.init,false);
    	var splitBox =document.getElementById("autopager-split-box");
        var splitSplitter = document.getElementById("autopager-split-splitter");
        var xbrowser = document.getElementById("browser");
        var xappcontent = document.getElementById("appcontent");

        if (xappcontent)
        {
          //xbrowser.appendChild(splitBox);
          //xbrowser.appendChild(splitSplitter);
          //xbrowser.insertBefore(splitBox,xappcontent);
          //xbrowser.insertBefore(splitSplitter,xappcontent);
          xappcontent.appendChild(splitSplitter);
          xappcontent.appendChild(splitBox);
          //splitBox.setAttribute("position", "bottom");
          //splitBox.setAttribute("height", "0");
          splitBox.setAttribute("collapsed","true");
          splitSplitter.setAttribute("orient", "vertical");
          splitSplitter.setAttribute("collapsed","true");
        }
  },
  getSplitKey :function ()
  {
  	return "is" + this.autopagerPrefix + "_subwin";
  },
  getBrowserNode : function(doc)
  {
  	var ctx = this.domUtils.findContentWindow(doc);
  	/*
  	try{
	  	var browsers = document.getElementsByTagName("browser");
	  	for(var i=0;i<browsers.length;++i)
	  	{
	  		var b = browsers[i];
	  		if (b.contentWindow == ctx)
	  		{
	  			return b;
	  		}
	  	}
	}catch(e)
	{
		//alert(e);
	}
	alert("go to built in");
  	*/
	var browser = this.domUtils.findBrowserForNode(doc);
  	if (browser!=null)
  		return browser;
  	
  	for(var i=1;i<=document.splitBrowserCount;++i)
  	{
  		var b = document.getElementById(this.autopagerPrefix + "-split-browser-" + i);
  		if (b!=null && b.contentWindow == ctx)
  		{
  			return b;
  		}
  	}
  	return null;
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
  },  
  cloneBrowser: function(targetB, originalB)
  {
      
      var webNav = targetB.webNavigation;
    var newHistory = webNav.sessionHistory;

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
    
//    //
//    //targetB.contentDocument.documentElement.innerHTML = originalB.contentDocument.documentElement.innerHTML
//    
//    // Convert the HTML text into an input stream.
//    var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
//                    createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
//    converter.charset = originalB.contentDocument.characterSet;
//    var stream = converter.convertToInputStream(
//    "<html>" + 
//    originalB.contentDocument.documentElement.innerHTML
//+ "</html>"
//);
//
//    // Set up a channel to load the input stream.
//    var channel = Components.classes["@mozilla.org/network/input-stream-channel;1"].
//                  createInstance(Components.interfaces.nsIInputStreamChannel);
//    channel.setURI(originalB.contentDocument.documentElement.location);
//    channel.contentStream = stream;
//
//    var request = channel.QueryInterface(Components.interfaces.nsIRequest);
//    request.loadFlags |= Components.interfaces.nsIRequest.LOAD_BACKGROUND;
//
//    var baseChannel = channel.QueryInterface(Components.interfaces.nsIChannel);
//    baseChannel.contentType = "text/html";
//
//    baseChannel.contentCharset = originalB.contentDocument.characterSet;
//
//    var uriLoader = Components.classes["@mozilla.org/uriloader;1"].getService(Components.interfaces.nsIURILoader);
//    uriLoader.openURI(channel, true, targetB.docShell);
//    
//    var html = targetB.contentDocument.documentElement.innerHTML
  },
  getSplitBrowser : function (doc,createNew,clone)
  {
  	var browser = this.getBrowserNode(doc);
  	
 	if (!browser.getAttribute(this.autopagerPrefix + "splitbrowse-id"))
  	{
  		document.splitBrowserCount ++;
  		browser.setAttribute(this.autopagerPrefix + "splitbrowse-id",document.splitBrowserCount);
  	}
  	var subfix = browser.getAttribute(this.autopagerPrefix + "splitbrowse-id");

  	var id = this.autopagerPrefix + "-split-browser-" + subfix;
    var splitBrowser = document.getElementById(id);
    
    this.hidden = !autopagerMain.loadBoolPref("debug");
    if (!splitBrowser && createNew)
    {
        
          
            var vbox = document.getElementById("autopager-split-box");;
            splitBrowser = document.createElement("browser");
    
	    splitBrowser.setAttribute("id", id);
	    splitBrowser.setAttribute("name", id);
             
	    splitBrowser.setAttribute("type", "content");
            splitBrowser.setAttribute("contextmenu", "contentAreaContextMenu");
            //splitBrowser.setAttribute("class",this.autopagerPrefix + "-split-browser");
	    //splitBrowser.setAttribute("home", "about:black");
	    vbox.appendChild(splitBrowser);
	    
	    splitBrowser.setAttribute(this.getSplitKey(),true);
        splitBrowser.addProgressListener(splitpanelProgressListener,
              Components.interfaces.nsIWebProgress.NOTIFY_ALL);
        splitBrowser.autopagerSplitWinFirstDocSubmited = false;
        splitBrowser.autopagerSplitWinFirstDocloaded = false;
        splitBrowser.loadURI("about:",null,null);
//    	if (!browser.getAttribute("flex"))
//	    		browser.setAttribute("flex", "1");
        //this.setVisible(splitBrowser,!this.hidden);      
                   
        browser.parentNode.parentNode.addEventListener("DOMNodeRemoved",this.onclose,false);
    }

    if (splitBrowser != null)
    {
        splitBrowser.docShell.allowPlugins = false;
    }
    if (splitBrowser != null && clone)
        {
            //splitBrowser.auotpagerContentDoc = doc;
            splitBrowser.autopagerSplitWinFirstDocloaded = false;
            splitBrowser.autopagerSplitWinFirstDocSubmited = true;
            //alert(doc.documentElement.autopagerUseSafeEvent)
            if (!doc.documentElement.autopagerUseSafeEvent )
                this.cloneBrowser(splitBrowser,browser);
            else
                splitBrowser.loadURI( doc.location.href, null, null );
            
        }                  
 
	//splitBrowser.parentNode.hidden = hidden;
//	splitBrowser.hidden = hidden; 
  	//this.setVisible(splitBrowser,!this.hidden);  
  	return splitBrowser;
  },
  show :function(splitBrowser)
  {
  	this.setVisible(splitBrowser,true);     
  },
  hide : function(splitBrowser)
  {
  	this.setVisible(splitBrowser,false);     
  },
  setVisible: function (splitBrowser,visible)
  {
      var hidden = !visible;
      this.hidden = hidden;
      if (splitBrowser == null)
          return;
      var splitBar = document.getElementById("autopager-split-splitter");
      splitBrowser.parentNode.collapsed=hidden;
      splitBrowser.collapsed=hidden;
      splitBar.collapsed = hidden;
  	
  },
  open : function(doc,hidden) 
  {
  	var splitBrowser =null;
  	this.hidden = hidden;
  	try {
    	 splitBrowser = this.getSplitBrowser(doc,!hidden,true);
    }catch (e) {
    	alert(e);
    }
  	if (!hidden)
  		this.show(splitBrowser);
  	else
  		this.hide(splitBrowser);
    // ***** load page
   	//splitBrowser.loadURI( "http://www.mozilla.org", null, null );
    return splitBrowser;
  },
  close : function(doc) 
  {
  	try{
            var splitBrowser = this.getSplitBrowser(doc,false,false);
            if (splitBrowser==null)
                return;
            splitBrowser.removeProgressListener(splitpanelProgressListener);
     
	    var parent = splitBrowser.parentNode;
            if (parent == null)
                return;
	    splitBrowser.parentNode.removeChild(splitBrowser);
            //splitBrowser.destroy();
	    //content.focus();
        }catch (e) {}         
  },
  onclose:function(event)
  {
         var browser=splitbrowse.getBrowserFromTarget(event.target);
          if (browser == null)
          {
              return;
          }
  	var subfix = browser.getAttribute(splitbrowse.autopagerPrefix +  "splitbrowse-id");

  	var id = splitbrowse.autopagerPrefix +"-split-browser-" + subfix;
        var splitBrowser = document.getElementById(id);
    
        if (splitBrowser != null)
        {
                splitBrowser.removeProgressListener(splitpanelProgressListener);
                var parent = splitBrowser.parentNode;
                parent.removeChild(splitBrowser);
                //splitBrowser.destroy();
         }
  	 
  },
  getBrowserFromTarget: function(target)
  {
       if (target.localName == "browser")
                return target;
       for (var i=0;i<target.childNodes.length;i++)
       {
           var b = splitbrowse.getBrowserFromTarget(target.childNodes[i]);
           if (b!= null)
               return b;
       }
       return null;
  },
  loadNewUrl : function(win,url)
  {
  	try{
  		win.loadURI(url,null,null);
  	}catch (e) {
  		alert(e);
  	}
  },
  // ***** set start navigation ui
  start : function() 
  {
  },
  // ***** set done navigation ui
  done : function(doc) 
  {
      //alert("done");
      autopagerMain.onSplitDocLoaded(doc,true);
  }
};
var splitpanelProgressListener = {    
  onStateChange : function(aWebProgress, aRequest, aStateFlags, aStatus)
  {
    const nsIWebProgressListener = Components.interfaces.nsIWebProgressListener;
    const nsIChannel = Components.interfaces.nsIChannel;
    if (aStateFlags & nsIWebProgressListener.STATE_START && 
      aStateFlags & nsIWebProgressListener.STATE_IS_NETWORK) {
        splitbrowse.start();
        return;
    } else if (aStateFlags & nsIWebProgressListener.STATE_STOP &&
      aStateFlags & nsIWebProgressListener.STATE_IS_NETWORK && aStatus==0) {
       //aStateFlags & nsIWebProgressListener.STATE_IS_WINDOW
        splitbrowse.done( aWebProgress.DOMWindow.document);
        
        return;
    }
  },
  onStatusChange : function(webProgress, request, status, message)
  {
    return;
  },
  onLocationChange : function(webProgress, request, location)
  {
    splitbrowse.start();
    return;
  },
  onProgressChange : function(webProgress, request,
    curSelfProgress, maxSelfProgress,
    curTotalProgress, maxTotalProgress) {
      return;
  },
  onSecurityChange : function(webProgress, request, state) 
  {
    return;
  },
  QueryInterface : function(aIID)
  {
    if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
        aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
        aIID.equals(Components.interfaces.nsISupports))
    return this;
    throw Components.results.NS_NOINTERFACE;
  }
};
document.splitBrowserCount = 0;
window.addEventListener("load",splitbrowse.init,false);