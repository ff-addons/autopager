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
  prefix : "autopager",
  domUtils: XULDOMUtils,
  hidden : true,
  execute: function(node,method)
  {
  	const lm = this.domUtils.lookupMethod;
   	lm(node, method)(null);
  },    
  init : function() 
  {
  	document.splitBrowserCount = 0;
    window.removeEventListener("load",splitbrowse.init,false);
  },
  getSplitKey :function ()
  {
  	return "is" + this.prefix + "_subwin";
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
  		var b = document.getElementById(this.prefix + "-split-browser-" + i);
  		if (b.contentWindow == ctx)
  		{
  			return b;
  		}
  	}
  	return null;
  },
  getSplitBrowser : function (doc)
  {
  	var browser = this.getBrowserNode(doc);
  	
 	if (!browser.getAttribute(this.prefix + "splitbrowse-id"))
  	{
  		document.splitBrowserCount ++;
  		browser.setAttribute(this.prefix + "splitbrowse-id",document.splitBrowserCount);
  	}
  	var subfix = browser.getAttribute(this.prefix + "splitbrowse-id");

  	var id = this.prefix + "-split-browser-" + subfix;
    var splitBrowser = document.getElementById(id);
    
    if (!splitBrowser)
    {
        
    	var vbox = document.createElement("vbox");
        var splitBar = document.createElement("splitter");
    	//if (browser.nextSibling)
        //    {
                var node = browser;
            	browser.parentNode.insertBefore(vbox,node);
	    	browser.parentNode.insertBefore(splitBar,node);
        //    }
	//    else
        //    {
	//    	browser.parentNode.appendChild(splitBar);
        //    	browser.parentNode.appendChild(vbox);
        //    }
	    splitBar.setAttribute("id", id + "-splitbar");
            splitBar.setAttribute("orient", "vertical");            
            splitBar.className = "chromeclass-extrachrome";
            
	    splitBrowser = document.createElement("browser");
    
	    splitBrowser.setAttribute("id", id);
	    splitBrowser.setAttribute("name", id);
             
	    splitBrowser.setAttribute("type", "content");
    	splitBrowser.setAttribute("contextmenu", "contentAreaContextMenu");
	    //splitBrowser.setAttribute("home", "about:black");
	    vbox.appendChild(splitBrowser);
	    
	    splitBrowser.setAttribute(this.getSplitKey(),true);
        splitBrowser.addProgressListener(splitpanelProgressListener,
           Components.interfaces.nsIWebProgress.NOTIFY_ALL);
        splitBrowser.loadURI("about:",null,null);
    	if (!browser.getAttribute("flex"))
	    		browser.setAttribute("flex", "1");
		this.setVisible(splitBrowser,this.hidden);        
    }
    
	//splitBrowser.parentNode.hidden = hidden;
//	splitBrowser.hidden = hidden; 
  	
  	return splitBrowser;
  },
  show :function(splitBrowser)
  {
  	this.setVisible(splitBrowser,false);     
  },
  hide : function(splitBrowser)
  {
  	this.setVisible(splitBrowser,true);     
  },
  setVisible: function (splitBrowser,hidden)
  {
    this.hidden = hidden;
    var splitBar = document.getElementById(splitBrowser.id + "-splitbar");           
	    if (!this.hidden)
	    {
	  		splitBrowser.parentNode.setAttribute("flex", "1");
	  		splitBrowser.setAttribute("flex", "1");
	    }
	  	else
	  	{
	  		splitBrowser.parentNode.setAttribute("flex", "0");
	  		splitBrowser.setAttribute("flex", "1");
	  	}
    splitBar.hidden = hidden;
  	
  },
  open : function(doc,hidden) 
  {
  	var splitBrowser =null;
  	this.hidden = hidden;
  	try {
    	 splitBrowser = this.getSplitBrowser(doc);
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
  	var splitBrowser = getSplitBrowser(doc);
      try{
       litBrowser.removeProgressListener(splitpanelProgressListener);
      } catch(e) {}
      try {
	      	var parent = splitBrowser.parentNode;
	        splitBrowser.destroy();
	        parent.removeChild(splitBrowser);
      }catch (e) {}
      content.focus();
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
  done : function() 
  {
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
      aStateFlags & nsIWebProgressListener.STATE_IS_NETWORK) {
        splitbrowse.done();
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
window.addEventListener("load",splitbrowse.init,false);