//In GPL license
var AutoPagring = function (site)
{
    this.site = site;    
    this.count=0;
    this.scrollWatching= false;
    this.lastScrollWatchExecuteTime = 0;
    this.forceLoadPage=0;
    this.autopagerPage=1;
    this.autopagerPageHeight = [];
    this.hasContentXPath = (site.contentXPath!=null && site.contentXPath.length>0);
    this.contentBottomMargin = 0;
    this.autopagerRunning = true;
    this.autopagerPagingCount=0;
    this.autopagerPageUrl=[];
    this.autopagerProcessed = true;
    this.autopagernextUrl=null
    this.inSplitWindow = false;
    this.changeMonitor = null;
}

AutoPagring.prototype.getAllowCheckpagingAutopagingPage = function() {
    //    if (!this.autopagerProcessed)
    //      autopagerMain.onInitDoc(doc,false);
    var enabled =this.autopagerEnabledSite && (autopagerMain.getGlobalEnabled() || this.forceLoadPage>this.autopagerPage);
    //enabled = enabled && ( !this.enableJS  || this.autopagerSplitDocInited );
    return  enabled;
}
AutoPagring.prototype.getEnabledAutopagingPage = function() {
    if (!autopagerBwUtil.supportHiddenBrowser())
        return true;
    var enabled =this.autopagerEnabledSite && (autopagerMain.getGlobalEnabled() ||  this.forceLoadPage>this.autopagerPage);
    enabled = enabled && ( !(this.enableJS)  || this.autopagerSplitDocInited || !this.hasContentXPath);
    return  enabled ;
},

AutoPagring.prototype.scrollWatcher = function(event) {
    if (this.scrollWatching || (new Date().getTime() - this.lastScrollWatchExecuteTime) < 500)
        return;

    var doc = null;
    if (event == null)
        doc = content.docuement;
    else if (event instanceof HTMLDocument)
        doc = event;
    else
        doc = event.target;

    if (doc != null)
    {
        this.scrollWatcherOnDoc(doc);
    }
}

AutoPagring.prototype.onRenderStateChanged = function(event) {
    if (!autopagerBwUtil.isFennec())
        return;
    if (this.scrollWatching || (new Date().getTime() - this.lastScrollWatchExecuteTime) < 500)
        return;
    
    var rect = Browser._browserView.getVisibleRect();

    var doc = getBrowser().contentDocument;
    
    autopagerBwUtil.consoleError(doc);

    if (doc != null)
    {
        if (!(doc instanceof HTMLDocument))
            doc = doc.ownerDocument;
        this.scrollWatcherOnDoc(doc,rect.top);
    }
}

AutoPagring.prototype.onMouseDown = function(event) {
    if (this.scrollWatching || (new Date().getTime() - this.lastScrollWatchExecuteTime) < 500)
        return;
    var doc = null;
    if (event == null)
        doc = content.docuement;
    else if (event instanceof HTMLDocument)
        doc = event;
    else if (event.target instanceof HTMLDocument)
        doc = event.target;
    else if (event.originalTarget instanceof HTMLDocument)
        doc = event.originalTarget;
    else if (event.target && event.target.ownerDocument instanceof HTMLDocument)
        doc = event.target.ownerDocument;
    else if (event.originalTarget && event.originalTarget.ownerDocument instanceof HTMLDocument)
        doc = event.originalTarget.ownerDocument;
    else
        doc = content.docuement;

    if (doc != null)
    {
        if (!(doc instanceof HTMLDocument))
            doc = doc.ownerDocument;
        this.scrollWatcherOnDoc(doc,event.pageY);
    }
}
AutoPagring.prototype.scrollWatcherOnDoc = function(doc,pageY) {
    if (doc != null)
        var paging = this
        this.scrollWatching = true;
        this.lastScrollWatchExecuteTime = new Date().getTime();
        setTimeout(function(){
            paging.doScrollWatcher(doc,pageY);
        },20);
}

AutoPagring.prototype.doScrollWatcher = function(scrollTarget,pageY)
{
    try{
        if (autopagerMain.autopagerDebug)
            autopagerMain.logInfo(this.count,"Enter scrollWatcher");
        var scollDoc = scrollTarget;
        if (!(scollDoc instanceof HTMLDocument) && scollDoc.ownerDocument)
            scollDoc = scollDoc.ownerDocument;

        var doc = scollDoc;
        if (doc.location != null)
        {
            var Enable = this.getAllowCheckpagingAutopagingPage();
            if (Enable) {
                var readyToPaging = this.getEnabledAutopagingPage();
                if (autopagerMain.autopagerDebug)
                    autopagerMain.logInfo(this.count+ "Enabled " + autopagerUtils.getUrl(doc),this.count+ "Enabled " + autopagerUtils.getUrl(doc));
                try{
                    var needLoad = false;
                    if (this.forceLoadPage> this.autopagerPage)
                        needLoad = true;
                    else
                    {
//                        if (this.forceLoadPage>0)
//                            this.forceLoadPage = 0;
                        var scrollDoc =doc;

                        var winHeight = window.innerHeight;//scrollDoc.defaultView.innerHeight ? scrollDoc.defaultView.innerHeight : scrollDoc.documentElement.clientHeight;
                        var scrollContainer = null;
                        if (this.site.containerXPath)
                        {
                            containerXPath = this.site.containerXPath;
                            var autopagerContainer = null;
                            if (containerXPath != "")
                            {
                                autopagerContainer = autopagerMain.findNodeInDoc(doc,containerXPath,false);
                                if (autopagerContainer!=null)
                                {
                                    scrollContainer = autopagerContainer[0];
                                    winHeight = autopagerContainer[0].clientHeight;

                                    if (!(scrollContainer.style.getPropertyValue("overflow-y") == 'scroll'))
                                    {
                                        scrollContainer.style.setProperty("overflow-y",'scroll',null);
                                        var pNode=scrollContainer.parentNode;
                                        var s1 = scrollDoc.defaultView.getComputedStyle(pNode, null);
                                        var s2 = scrollDoc.defaultView.getComputedStyle(scrollDoc.body, null);
                                        if ((s1 !=null &&( s1.getPropertyValue("overflow")=='hidden'
                                            ||s1.getPropertyValue("overflow-y")=='hidden'))
                                        || ((s2 != null && s2.getPropertyValue("overflow")=='hidden'
                                            ||s2.getPropertyValue("overflow-y")=='hidden')))
                                            {
                                            var wHeight = scrollDoc.body != null ?
                                            scrollDoc.body.scrollHeight : scrollContainer.scrollHeight ;
                                            //                                                                if (scrollContainer != null && scrollContainer.scrollHeight < sh)
                                            //                                                                    wHeight = scrollContainer.scrollHeight;
                                            scrollContainer.style.setProperty("height",(wHeight - autopagerMain.getOffsetTop(scrollContainer)) + 'px',null);
                                        }
                                    }
                                }
                            }

                        }
                        if (scrollContainer==null)
                            scrollContainer = scrollDoc.documentElement;
                        var scrollTop = pageY? pageY:(scrollContainer && scrollContainer.scrollTop)
                                        ? scrollContainer.scrollTop : scrollDoc.body?scrollDoc.body.scrollTop:0;

                        var scrollOffset = ((scrollContainer && scrollContainer.scrollHeight)
                                                ? scrollContainer.scrollHeight : scrollDoc.body.scrollHeight);
                        if (!pageY && scrollDoc.body != null && scrollDoc.body.scrollHeight > scrollOffset)
                            scrollOffset = scrollDoc.body.scrollHeight;

                        
                        var m = this.contentBottomMargin
                        var offsetTop = scrollContainer.offsetTop ? scrollContainer.offsetTop : 0;
                        var remain = scrollOffset - scrollTop - offsetTop - winHeight
                        - (m?m:0);
                    
//                        if (pageY)
//                        {
//                        alert(scrollOffset + ":" + pageY + ":" + scrollTop + ":" + offsetTop + ":" +winHeight + " remain:" + remain)
//                        }

                        this.count++;
                        if (autopagerMain.autopagerDebug)
                            autopagerMain.logInfo(this.count + ": Auto pager wh:" + winHeight+ " sc:" + scrollTop + " remain: " + remain,
                                "sh=" + scrollOffset + " sc = " + scrollTop + " wh= " + winHeight + " Auto pager remain: " + remain + ".\nremain < " + winHeight+" will auto page.");

                        if (autopagerMain.autopagerDebug)
                            winHeight = winHeight * (this.site.margin*1 + 1);
                        else
                            winHeight = winHeight * (this.site.margin * 1);
                        //alert(wh);
                        //needLoad = remain < wh;
                        var currHeight = scrollTop + offsetTop;// + wh
                        var targetHeight = 0;
                        var minipages = this.site.minipages;
                        if (minipages==-1)
                            minipages = autopagerPref.loadPref("minipages");
                        if (minipages>0)
                        {
                            //notice doc.documentElement is different to de here!!!!!
                            var a = this.autopagerPageHeight;
                            if (a!=null && a.length >= minipages)
                            {
                                var pos = a.length - minipages;//this.site.margin
                                targetHeight = a[pos];
                            }
                        }else
                            targetHeight = currHeight;

                        needLoad = ( (targetHeight < currHeight)) || remain < winHeight;
                    }
                    if( needLoad){
                           if (this.autopagerPage==null || this.autopagerPage<2)
                        {
                            //test the contetXPATH first
                            if (this.hasContentXPath)
                            {
                                var xpath = this.site.contentXPath;

                                var nodes = autopagerMain.findNodeInDoc(doc,xpath,this.enableJS || this.inSplitWindow);
//                                alert(nodes.length + " " + xpath + ":" + doc.location)
                                if (nodes.length==0)
                                {
                                    this.scrollWatching = false;
                                    return;
                                }

                            }
                        }
                        if (autopagerUtils.noprompt() && !this.autopagerUserConfirmed)
                        {
                            this.autopagerUserConfirmed = true;
                            this.autopagerUserAllowed = !autopagerPref.loadBoolPref("disable-by-default");
                            this.autopagerAllowedPageCount = -1;
                            this.autopagerSessionAllowedPageCount  = -1;
                        }
                        if (!this.autopagerUserConfirmed)
                        {
                            var siteConfirm = autopagerConfig.findConfirm(autopagerConfig.getConfirm(),this.site.guid,doc.location.host);
                            if (siteConfirm!=null)
                            {
                                this.autopagerUserConfirmed= true;
                                this.autopagerSessionAllowed= siteConfirm.UserAllowed;
                                this.autopagerAllowedPageCount=siteConfirm.AllowedPageCount;
                                this.autopagerUserAllowed=siteConfirm.UserAllowed;
                                this.autopagerSessionAllowedPageCount = siteConfirm.AllowedPageCount;
                            }
                        }
                        var needConfirm =  (!autopagerUtils.noprompt())
                        && (!this.autopagerUserConfirmed || (this.autopagerSessionAllowed
                            && this.autopagerAllowedPageCount== this.autopagerPage))
                        && (this.forceLoadPage==0);
//alert(4 + " " + needConfirm);

                        if (needConfirm)
                        {
                            if (autopagerMain.promptNewRule (doc,true))
                                this.autopagerEnabledSite=false
                        }
                        else
                        if ((this.autopagerUserConfirmed
                            && this.autopagerUserAllowed
                            && ( this.autopagerAllowedPageCount < 0
                                ||  this.autopagerAllowedPageCount> this.autopagerPage)
                            ) || this.forceLoadPage>this.autopagerPage)
                            {
//                            alert(3)
                            //test the url if there is not content
                            if (!this.hasContentXPath)
                            {
                                var nextUrl = this.autopagernextUrl;
                                if (nextUrl==null || nextUrl.ownerDocument!=doc)
                                {
                                    return;
                                }
                                var p = autopagerMain.myGetPos(nextUrl);
                                if (p.x<=0 || nextUrl.scrollWidth<=0 || p.y<=0 || nextUrl.scrollHeight<=0)
                                {
                                    return;
                                }
                            }
                            if (readyToPaging){
                                if (!autopagerBwUtil.supportHiddenBrowser() || doc.defaultView){
                                    this.autopagerEnabledSite = false;
                                    this.loadNextPage(doc);
                                }
                            }
                            else
                            {
                                if (!this.autopagerSplitCreated)
                                {
                                    try{
                                        this.autopagerSplitCreated = true;
                                        var splitbrowser = autopagerMain.getSplitBrowserForDoc(doc,true,this);
                                    }catch(e)
                                    {
                                        this.autopagerSplitCreated = true;
                                        var splitbrowser = autopagerMain.getSplitBrowserForDoc(doc,true,this);
                                        autopagerBwUtil.consoleError(e)
                                    }

                                }
                            }
                        }

                    }
                }catch(e){
                    autopagerBwUtil.consoleError(e);
                }
            }
        }
    }catch(e){
        autopagerBwUtil.consoleError(e);
    }
    this.scrollWatching = false;
//    var self = arguments.callee;
//setTimeout(self,400);
}
AutoPagring.prototype.loadNextPage = function(doc){
    var nextUrl = this.autopagernextUrl;
    //var linkXPath = this.site.linkXPath;
    
    //TODO
    if (nextUrl != null && ( typeof(nextUrl) =='string' || 
        !nextUrl.getAttribute || !nextUrl.getAttribute("disabled")))
    {
         //validate insertPoint
            try{
                var parentNode = this.getAutopagerinsertPoint(doc).parentNode.parentNode;
            }catch(e)
            {
                autopagerBwUtil.consoleError(e)
                var de = doc.documentElement
                this.autopagerSplitCreated = false;
                this.autopagerSplitCreated = false;
                this.autopagerSplitDocInited = false;
                var topDoc = content.document;

                this.autopagerPagingCount = 0
                var pagring = this
                setTimeout(function(){
                    topDoc =content.document;
                    de = topDoc.documentElement;
                    doc = topDoc
                    //doc.documentElement.autopagerRunning = false;
                    pagring.autopagerRunning = false;
                    autopagerMain.onInitDoc(doc,false);
                    pagring.autopagerSplitCreated = false;
                    pagring.autopagerSplitDocInited = false;
                    splitbrowse.close(doc);
                    splitbrowse.close(topDoc);

                    var splitbrowser = autopagerMain.getSplitBrowserForDoc(doc,true);
                },100);

                return false;

            }
            this.onStartPaging(doc);
            this.processNextDoc(doc,nextUrl);
    }
}
AutoPagring.prototype.onStartPaging  = function(doc) {
    this.autopagerPagingCount ++;
    this.pagingWatcher(doc);
}
AutoPagring.prototype.onStopPaging = function(doc) {
    //if (this.autopagerPagingCount>0)
    this.autopagerPagingCount--;
    autopagerMain.hiddenDiv(autopagerMain.getPagingWatcherDiv(doc,false),true);
    var loadgingImg = doc.getElementById("autopagerLoadingImg");
    if (loadgingImg)
        loadgingImg.parentNode.removeChild(loadgingImg);
    if (this.autopagerPagingCount <= 0)
    {

                if (autopagerMain.flashIconNotify)
                    autopagerMain.setGlobalEnabled(autopagerMain.loadEnableStat());
    }
    this.autopagerEnabledSite = true

    if (this.autopagernextUrl != null && this.forceLoadPage>this.autopagerPage)
    {
        this.scrollWatcherOnDoc(doc);
    }
    if (this.site.monitorXPath)
    {
        autopagerMain.monitorForCleanPages(doc,this)
    }
}
AutoPagring.prototype.processNextDoc = function(doc,url) {
    if (!this.hasContentXPath)
    {
        this.processByClickOnly(doc,url);
    }
    else if (autopagerBwUtil.supportHiddenBrowser() &&  (this.enableJS || this.inSplitWindow || url==null || url.constructor != String)) {
        this.inSplitWindow = true;
        this.site.enableJS = true;
        this.enableJS = true;
        this.processInSplitWin(doc);
    }else if (autopagerBwUtil.supportHiddenBrowser() && url!=null && url.constructor == String)
    {
        this.inSplitWindow = true;
        this.processInSplitWinByUrl(doc,url);
    }
    else if (url!=null && url.constructor == String){
        this.processNextDocUsingXMLHttpRequest(doc,url);
    }
    else
        autopagerMain.enabledInThisSession(doc,false);
},
AutoPagring.prototype.processByClickOnly = function(doc,url)
{
        var de = doc.documentElement;
        var loaded = false;
        if (this.autopagerNodeListener)
        {
            doc.removeEventListener("DOMNodeInserted",this.autopagerNodeListener,false);
            this.autopagerNodeListener = null;
        }
        var paging = this;
        doc.addEventListener("DOMNodeInserted",function()
            {
                var self = arguments.callee;
                paging.autopagerNodeListener = self;
                var urlNodes = autopagerMain.findNodeInDoc(doc,paging.site.linkXPath,paging.enableJS || paging.inSplitWindow);
                if (urlNodes != null && urlNodes.length >0)
                {
                    paging.autopagernextUrl = urlNodes[0];
                }
                if (!loaded)
                {
                    loaded = true;
                    window.setTimeout(function (){
                        paging.onStopPaging(doc);
                        var scrollContainer = null;
                        if (paging.site.containerXPath)
                        {
                            autopagerContainer = autopagerMain.findNodeInDoc(
                                de,paging.site.containerXPath,false);
                            if (autopagerContainer!=null)
                            {
                                scrollContainer = autopagerContainer[0];
                                if (paging.tmpScrollWatcher)
                                    scrollContainer.removeEventListener("scroll",paging.tmpScrollWatcher,true);
                                paging.tmpScrollWatcher =function(event){
                                    paging.scrollWatcher(event);
                                }
                                scrollContainer.addEventListener("scroll",paging.tmpScrollWatcher,true);
                            }
                        }
                        var scrollDoc =doc;
                        if (scrollContainer==null)
                            scrollContainer = de;
                        var sh = (scrollContainer && scrollContainer.scrollHeight)
                        ? scrollContainer.scrollHeight : scrollDoc.body.scrollHeight;
                        if (scrollDoc.body != null && scrollDoc.body.scrollHeight > sh)
                        {
                            sh = scrollDoc.body.scrollHeight;
                        }
                        paging.autopagerPageHeight.push(sh);
                        var urlNodes = autopagerMain.findNodeInDoc(doc,paging.site.linkXPath,paging.enableJS || paging.inSplitWindow);
                        if (urlNodes != null && urlNodes.length >0)
                        {
                            paging.autopagernextUrl = urlNodes[0];
                        }
                    }, paging.site.delaymsecs);
                }

            },false);
        this.autopagerSimulateClick(doc.defaultView, doc,url);

}

AutoPagring.prototype.pagingWatcher = function(doc) {
    if (!(doc instanceof HTMLDocument) && doc.ownerDocument)
            doc = doc.ownerDocument;
    //doc =  autopagerUtils.getTopDoc(doc);
    try{
        if((autopagerMain.getGlobalEnabled() ||  this.forceLoadPage>this.autopagerPage)) {
            var loading = true;
            if (loading)
                {
                    autopagerMain.hiddenDiv(autopagerMain.getPagingWatcherDiv(doc,true),false);
                    this.insertLoadingBreak(doc);
                    if (autopagerMain.flashIconNotify)
                    {
                    this.autoPagerImageShowStatus = !this.autoPagerImageShowStatus;
                    autopagerMain.setGlobalImageByStatus(this.autoPagerImageShowStatus);
                    var self = arguments.callee;
                    setTimeout(self, 300);//10 +Math.random()*200);
                    }
                }

        }
        else {
            autopagerMain.hiddenDiv(autopagerMain.getPagingWatcherDiv(doc,false),true);
            if (autopagerMain.flashIconNotify)
                autopagerMain.setGlobalEnabled(autopagerMain.loadEnableStat());
            //autopagerMain.setGlobalImageByStatus(autopagerMain.getGlobalEnabled());
        }
    }catch(e) {
        autopagerBwUtil.consoleError(e)
        autopagerMain.hiddenDiv(autopagerMain.getPagingWatcherDiv(doc,false),true);
        if (autopagerMain.flashIconNotify)
            autopagerMain.setGlobalEnabled(autopagerMain.loadEnableStat());
        //autopagerMain.setGlobalImageByStatus(autopagerMain.getGlobalEnabled());
    }

}
AutoPagring.prototype.processInSplitWin = function(doc)
{
    try{
        var b = autopagerMain.getSplitBrowserForDoc(doc,false,this);
        var newDoc = b.contentDocument;
        this.processInSplitDoc(doc,newDoc,b);
    }catch (e){
        autopagerBwUtil.consoleError(e);
    }

}
AutoPagring.prototype.processInSplitDoc = function(doc,splitDoc,b){
    try{
        var de = doc.documentElement
        var nextUrl=null;
        //alert(nodes.length);
        var urlNodes = autopagerMain.findNodeInDoc(splitDoc,this.site.linkXPath,this.enableJS||this.inSplitWindow);
        //alert(urlNodes);
        if (urlNodes != null && urlNodes.length >0) {
              nextUrl = autopagerMain.getNextUrl(doc,this.enableJS||this.inSplitWindow,urlNodes[0]);
        }else if (splitDoc.defaultView)//try frames
        {
            if (splitDoc.defaultView.frames != null) {
                for(var i=0;i<splitDoc.defaultView.frames.length;++i) {
                    if (this.processInSplitDoc(doc,splitDoc.defaultView.frames[i].document,b))
                        return true;
                }
            }
            return false;
        }
           //alert(nextUrl);
        this.autopagernextUrl = nextUrl;
//        de.setAttribute("autopagernextUrlObj",nextUrl)


        var node = this.autopagernextUrl;
        if (node.constructor == String)
            b.loadURI(this.autopagernextUrl,null,null);
        else {
            //alert("this.autopagerSimulateClick");
            if ((node.tagName == "A" || node.tagName == "a"))
                node.target = "_self";
            this.autopagerSimulateClick(b.contentWindow, doc,node);
        }
    }catch (e){
        autopagerBwUtil.consoleError(e);
        return false;
    }
    return true;

}
AutoPagring.prototype.processInSplitWinByUrl  = function(doc,url){
    try{
        var b = autopagerMain.getSplitBrowserForDoc(doc,false,this);
        b.auotpagerContentDoc = doc;
        b.autopagerSplitWinFirstDocSubmited=true;
        b.autopagerSplitWinFirstDocloaded = true;
        this.autopagerSplitDocInited = true;
        this.autopagerEnabledSite = false;
        b.loadURI(url,null,null);
    }catch (e){
        autopagerBwUtil.consoleError(e);
    }

}
AutoPagring.prototype.lazyLoad = function(doc)
{
    var paging = this
    return function (event){
        var target = null;
        if (event.target != null)
            target = event.target;
        else if (event.originalTarget != null)
            target = event.originalTarget;
        else if (event.currentTarget != null)
            target = event.currentTarget;
        else
            target = event
        //alert(target);
        var frame=target;
        if (!frame.autoPagerInited) {
            //autopagerMain.fireFrameDOMContentLoaded(frame);
            var newDoc = frame.contentDocument;
            newDoc.documentElement.setAttribute("autopageCurrentPageLoaded","false")

            //                                var nodes = autopagerMain.findNodeInDoc(newDoc,'/*[1]',false);
            //                                frame.setAttribute('src','about:blank');
            //                                frame.contentDocument.documentElement.innerHTML = nodes[0].innerHTML
            //                                //var s = newDoc.documentElement.innerHTML
            //                                frame.autoPagerInited = true;
            //                                newDoc = frame.contentDocument;
            //                                newDoc.documentElement.setAttribute("autopageCurrentPageLoaded","false")

            paging.scrollWindow(doc,newDoc);
            paging.onStopPaging(doc);
            try{
                frame.removeEventListener("DOMContentLoaded", arguments.callee, false);
                frame.removeEventListener("load", arguments.callee, false);
            }catch(e){}
        }
    }
}
AutoPagring.prototype.loadInFrame = function(doc,url){
    var frame = autopagerMain.getSelectorLoadFrame(doc);
    var lazyLoad = this.lazyLoad(doc);
    frame.addEventListener("load", lazyLoad, false);
    frame.addEventListener("DOMContentLoaded", lazyLoad, false);
    frame.setAttribute('src', url);
}
AutoPagring.prototype.processNextDocUsingXMLHttpRequest = function(doc,url){
    var xmlhttp=null;
    //alert(autopagerUtils.getUrl(doc));
    try{
        var paging = this
        var urlStr = ""
        if (! (typeof url == 'string'))
        {
            urlStr = autopagerUtils.findUrlInElement(url);
        }
        else
            urlStr = url
        if (doc && doc.location && doc.location.host)
        {
            var currentHost = doc.location.host
            var pos = urlStr.indexOf("://");
            var protocol = urlStr.substring(0,pos);
            var urlPart = urlStr.substring(pos+3)
            if (urlPart.substring(0,currentHost.length)!=currentHost)
            {
                //link to a different domain,try to parse the url to get the real one
                if (urlPart.indexOf(currentHost)>0)
                    urlStr = protocol + "://" + unescape(urlPart.substring(urlPart.indexOf(currentHost)))
            }
        }

        if (typeof paging.frameSafe == "undefined")
            paging.frameSafe = paging.site.enableJS==3 && !autopagerMain.hasTopLocationRefer(doc.documentElement.innerHTML)
                    && !doc.documentElement.getAttribute("xmlns");
        //loade the next page in a iframe if the page doesn't redirect to top
        if (paging.frameSafe)
        {
            paging.loadInFrame(doc,urlStr);
            return;
        }
        //now use XMLHttpRequest to retrive the site content
        //tested on unbase64 aHR0cDovL3ZpZG9oZS5jb20vc2l0ZXMucGhwCg==
        try{
            xmlhttp = new XMLHttpRequest();
        }catch(e){
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        var type = autopagerMain.getContentType(doc);
        xmlhttp.overrideMimeType(type);

        xmlhttp.onreadystatechange = function (aEvt) {
            if (autopagerMain.autopagerDebug)
                autopagerMain.logInfo(xmlhttp.readyState + " " + xmlhttp.status,
                xmlhttp.readyState + " " + xmlhttp.status);
            if(xmlhttp.readyState == 4) {
                if(xmlhttp.status == 200) {
                    var newDoc = autopagerBwUtil.createHTMLDocumentFromStr(xmlhttp.responseText,urlStr);
                    if (newDoc)
                    {
                        paging.scrollWindow(doc,newDoc);
                        paging.onStopPaging(doc);
                    }else
                    {
                        paging.frameSafe = paging.site.enableJS==3 && !autopagerMain.hasTopLocationRefer(xmlhttp.responseText);
                        if (paging.frameSafe)
                        {
                            paging.loadInFrame(doc,urlStr);
                            return;
                        }
                        else
                        {
                            var frame = autopagerMain.getSelectorLoadFrame(doc);
                            var lazyLoad = paging.lazyLoad(doc);
                            frame.addEventListener("load", lazyLoad, false);
                            frame.addEventListener("DOMContentLoaded", lazyLoad, false);

                            frame.autoPagerInited = false;
                            frame.contentDocument.clear();
                            frame.contentDocument.documentElement.autopageCurrentPageLoaded = false;
                            //alert(xmlhttp.responseText);
                            var html = autopagerMain.getHtmlInnerHTML(xmlhttp.responseText,paging.enableJS||paging.inSplitWindow,url,type);
                            //frame.contentDocument.write(autopagerMain.getHtmlInnerHTML(xmlhttp.responseText,this.enableJS||this.inSplitWindow,url));
                            try
                            {
                                frame.contentDocument.documentElement.innerHTML = html
                                //frame.setAttribute('src', 'data:text/html,' + html);
                                //frame.setAttribute('src', url);
                                //frame.contentDocument.open("about:blank");
                                //frame.contentDocument.write(html);
                            }catch(e)
                            {
                                autopagerBwUtil.consoleError(e)
                            }
                            //autopagerMain.loadChannelToFrame(frame,xmlhttp.channel,true);

                            setTimeout(
                                function(){frame.normalize();lazyLoad(frame);}
                            ,1000);
                            //xmlhttp.abort();
                        }
                    }
                }
                else {
                    autopagerMain.alertErr("Error loading page:" + url);
                    paging.autopagerEnabledSite = true
                    paging.onStopPaging(doc);
                }

            }
        };

        xmlhttp.open("GET", urlStr, true);
        //window.content.status = "loading ... " + url;
        xmlhttp.send(null);

    }catch (e){
        autopagerBwUtil.consoleError(e)
        this.autopagerEnabledSite = true
    }

}
AutoPagring.prototype.insertLoadingBreak = function(doc) {
    if (this.autopagerinsertPoint)
    {
        var divStyle = autopagerPref.loadUTF8Pref("pagebreak");// "clear:both; line-height:20px; background:#E6E6E6; text-align:center;";
        var div= autopagerMain.createDiv(doc,"",divStyle);
        div.innerHTML = "<span id='autopagerLoadingImg'><a target='_blank' href='http://autopager.teesoft.info/help.html'><img src='" + autopagerPref.loadPref("images-prefix") + "loading.gif'/></a></span>";
        var insertPoint =	this.autopagerinsertPoint;
        div.setAttribute("id","apBreakStart" + this.autopagerPage);
        insertPoint.parentNode.insertBefore(div,insertPoint);
        this.lastBreakStart = div;
    }
}
AutoPagring.prototype.scrollWindow = function(container,doc) {
    if (typeof doc == "undefined" || doc == null ||
        typeof doc.documentElement == "undefined" ||
            (doc.documentElement.getAttribute("autopageCurrentPageLoaded") != null
        && doc.documentElement.getAttribute("autopageCurrentPageLoaded") == "true"))
        return false;
    doc.documentElement.setAttribute("autopageCurrentPageLoaded","true");
    
    var de = container.documentElement;

    try{
        if (autopagerMain.autopagerDebug)
            autopagerMain.logInfo("autopagerMain.scrollWindow","autopagerMain.scrollWindow");
        //validate the url first
        var site = this.site;
        var reg = autopagerUtils.getRegExp (site)
        var url = autopagerMain.getDocURL(doc,this.inSplitWindow);
        if (!this.inSplitWindow || reg.test(url))
        {

        var nextUrl=this.autopagernextUrl;
        var xpath = this.site.contentXPath;

        var nodes = autopagerMain.findNodeInDoc(doc,xpath,this.enableJS||this.inSplitWindow);

//        autopagerMain.logInfo(nodes.length + " at "+  autopagerUtils.getUrl(doc)
//                ,nodes.length + " at "+  autopagerUtils.getUrl(doc));

        if (nodes.length >0)
        {

            if (autopagerMain.autopagerDebug)
                autopagerMain.logInfo(nodes.toString(),nodes.toString());


			var scrollContainer = null;
			if (this.site.containerXPath)
			{
					autopagerContainer = autopagerMain.findNodeInDoc(
							de,this.site.containerXPath,false);
					if (autopagerContainer!=null)
					{
							scrollContainer = autopagerContainer[0];
//                            scrollContainer.removeEventListener("scroll",autopagerMain.scrollWatcher,true);
//							scrollContainer.addEventListener("scroll",autopagerMain.scrollWatcher,true);
//					//scrollContainer.onscroll = autopagerMain.scrollWatcher;
					}
			}
			var scrollDoc =container;
			if (scrollContainer==null)
					scrollContainer = de;
			var sh = (scrollContainer && scrollContainer.scrollHeight)
					? scrollContainer.scrollHeight : scrollDoc.body.scrollHeight;
			if (scrollDoc.body != null && scrollDoc.body.scrollHeight > sh)
			{
					sh = scrollDoc.body.scrollHeight;
			}

            if (typeof nextUrl=='undefined' || nextUrl==null)
            {
                var urlNodes = autopagerMain.findNodeInDoc(doc,this.site.linkXPath,this.enableJS||this.inSplitWindow);
                //alert(urlNodes);
                if (urlNodes != null && urlNodes.length >0) {
                      nextUrl = autopagerMain.getNextUrl(container,this.enableJS||this.inSplitWindow,urlNodes[0]);
                }
            }
            var nextPageHref = nextUrl
            if (nextUrl.href
                && ((nextUrl.href.substr(0, 7)=='http://' ) || (nextUrl.href.substr(0, 8)=='https://' )))
            {
                nextPageHref = nextUrl.href
            }else
            if (!(typeof (nextPageHref) == 'string'))
            {
                nextPageHref = autopagerUtils.getUrl(doc);
            }
			this.autopagerPageHeight.push(sh);
            this.autopagerPageUrl.push(nextPageHref);

            var insertPoint =	this.getAutopagerinsertPoint(container);
            var div = this.lastBreakStart
            if (!div && insertPoint)
            {
                //alert(nodes);
                var divStyle = autopagerPref.loadUTF8Pref("pagebreak");// "clear:both; line-height:20px; background:#E6E6E6; text-align:center;";
                var div= autopagerMain.createDiv(container,"",divStyle);
                div.setAttribute("id","apBreakStart" + this.autopagerPage);
                insertPoint.parentNode.insertBefore(div,insertPoint);                
            }
            var innerHTML = "<a target='_blank' href='http://autopager.teesoft.info/help.html'>" + autopagerConfig.autopagerGetString("pagebreak2") + "</a>&nbsp;&nbsp;" +
                            autopagerConfig.autopagerFormatString("pagelink",[nextPageHref,"&nbsp;&nbsp;&nbsp;" + (++this.autopagerPage) + "&nbsp;&nbsp;&nbsp;"])
                            + autopagerMain.getNavLinks(this.autopagerPage,sh);
            try{
                div.innerHTML = "<span>" +  innerHTML+ "</span>";
            }catch(e){
                div.innerHTML="<a href='http://autopager.teesoft.info/help.html'>Page break by AutoPager.</a>"
                    + autopagerConfig.autopagerFormatString("pagelink",[nextPageHref.replace(/\&/g,"&amp;"),"   " + (this.autopagerPage) + "   "])
                    ;
            }

            //load preload xpaths, like //style for make WOT works
            var preXPath=autopagerMain.getPreloadXPaths();
            if (preXPath.length>0)
             {
                var preloadNodes = autopagerMain.findNodeInDoc(doc,preXPath,this.enableJS||this.inSplitWindow);
                for(var i=0;i<preloadNodes.length;++i) {
                    try{
                        var newNode = preloadNodes[i];
                        newNode = container.importNode (newNode,true);
                        newNode = insertPoint.parentNode.insertBefore(newNode,insertPoint);

                    }catch(e) {
                        autopagerMain.alertErr(e);
                    }
                }
             }


            for(var i=0;i<nodes.length;++i) {
                try{
                    var newNode = nodes[i];

                    //this will be fire on the hidden loaded doc
                    var event = container.createEvent("Events");
                    event.initEvent("AutoPagerBeforeInsert", true, true);
                    newNode.dispatchEvent(event)


                    newNode = container.importNode (newNode,true);
                    autopagerMain.removeElements(newNode,this.site.removeXPath,this.enableJS||this.inSplitWindow,true)


                    newNode = insertPoint.parentNode.insertBefore(newNode,insertPoint);

                    //this will be fire on the displayed doc
                    container.createEvent("Events");
                    event.initEvent("AutoPagerAfterInsert", true, true);
                    newNode.dispatchEvent(event)

                }catch(e) {
                    autopagerMain.alertErr(e);
                }
            }
            div = autopagerMain.createDiv(container,"apBreakEnd" + this.autopagerPage,"display:none;");
            //div.setAttribute("id","apBreakEnd" + this.autopagerPage);
            insertPoint.parentNode.insertBefore(div,insertPoint);

            //alert(nodes.length);
            var urlNodes = autopagerMain.findNodeInDoc(doc,this.site.linkXPath,this.enableJS||this.inSplitWindow);
            //alert(urlNodes);
            if (urlNodes != null && urlNodes.length >0) {
                nextUrl = autopagerMain.getNextUrl(container,this.enableJS||this.inSplitWindow,urlNodes[0]);
            }else
            {
                nextUrl = null;
                //TODO
                if (this.tmpScrollWatcher)
                    container.removeEventListener("scroll",this.tmpScrollWatcher,false);
                if (scrollContainer != de)
                {
                    scrollContainer.removeEventListener("scroll",this.tmpScrollWatcher,false);
//                     if (container.defaultView && container.defaultView.top &&
//                       container.defaultView.top != container.defaultView)
//                       container.defaultView.top.document.removeEventListener("scroll",autopagerMain.scrollWatcher,false);
               }

            }
            this.autopagernextUrl = nextUrl;
//            de.setAttribute("autopagernextUrlObj",nextUrl)
 
               if (autopagerMain.tweakingSession && container.defaultView && container.defaultView.top == container.defaultView)
               {
    //               if (this.autopagerPreviousURL && this.autopagerPreviousURL != autopagerUtils.getUrl(doc))
    //                {
    //                    autopagerMain.changeSessionUrl(container, this.autopagerPreviousURL,this.autopagerPage);
    //                }
                    this.autopagerPreviousURL = autopagerUtils.getUrl(doc)
               }
               return true;
           }
        }

    }catch(e) {
        autopagerMain.alertErr(e);
    }

   if (doc.defaultView!=null && doc.defaultView.frames != null) {
        for(var i=0;i<doc.defaultView.frames.length;++i) {
            this.scrollWindow(container,doc.defaultView.frames[i].document);
        }
    }
    return true;
}
  AutoPagring.prototype.onSplitDocLoaded = function(doc,safe) {
    var furtherscrollWatcher = true;
    var paging = this
        var browser = splitbrowse.getBrowserNode(doc);
        if (browser && browser.getAttribute(splitbrowse.getSplitKey())) {
            //if (browser.auotpagerContentDoc)
            {
                var container = browser.auotpagerContentDoc;
                var de = container.documentElement.QueryInterface(Components.interfaces.nsIDOMElement);
                var reg = autopagerUtils.getRegExp (this.site)
                var url = autopagerMain.getDocURL(doc,this.inSplitWindow);
                if (container.defaultView == container.defaultView.top && !reg.test(url) )
                    return;
                else if (!reg.test(url))
                    doc = autopagerMain.searchForMatchedFrame(doc,reg,this.inSplitWindow);
                if (doc==null)
                    return;
                if (browser.autopagerSplitWinFirstDocSubmited) {
                    if(!browser.autopagerSplitWinFirstDocloaded) {
                        //                        if (doc.defaultView != doc.defaultView.top)
                        //                               return;
                        var nextUrl = null;

                        if (paging.site.ajax || (container.documentElement.getAttribute('autopagerAjax') == "true"))
                            autopagerMain.Copy(container,doc);
                        //var doc = browser.webNavigation.document;
                        if (paging.site.fixOverflow || (container.documentElement.getAttribute('fixOverflow') == 'true'))
                            autopagerMain.fixOverflow(doc);

                        nextUrl = this.getNextUrlIncludeFrames(container,doc);
                        if (nextUrl==null && (!this.site.ajax))
                        {
                            //ajax site, not load yet,wait a while
                            window.setTimeout(function(){
                                nextUrl = paging.getNextUrlIncludeFrames(container,doc);
                                paging.autopagernextUrl = nextUrl;
//                                container.documentElement.setAttribute("autopagernextUrlObj",nextUrl)
                                browser.autopagerSplitWinFirstDocloaded = true;
                                paging.autopagerSplitDocInited = true;
                                paging.autopagerEnabledSite = true;
                            },splitbrowse.getDelayMiliseconds(doc));
                        }else
                        {
                            this.autopagernextUrl = nextUrl;
//                            container.documentElement.setAttribute("autopagernextUrlObj",nextUrl)
                            browser.autopagerSplitWinFirstDocloaded = true;
                            this.autopagerSplitDocInited = true;
                            this.autopagerEnabledSite = true;
                        }
                    }
                    else {
                        if (!this.site.ajax)
                        {
                            //TODO
                            if (paging.site.delaymsecs && paging.site.delaymsecs>0)
                                window.setTimeout(function(event){
                                    paging.scrollFunc(browser,doc);
                                    },
                                    paging.site.delaymsecs);
                            else
                                furtherscrollWatcher = paging.scrollFunc(browser,doc);

                        }
                    }
                }


                if (furtherscrollWatcher)
                {
                    this.scrollWatcherOnDoc(browser.auotpagerContentDoc);
                }
            }
            return;
        }

}
AutoPagring.prototype.scrollFunc = function(browser,doc){
    var furtherscrollWatcher =this.scrollWindow(browser.auotpagerContentDoc,doc);
    this.onStopPaging(browser.auotpagerContentDoc);
    splitbrowse.switchToCollapsed(true);
    return furtherscrollWatcher;
}
AutoPagring.prototype.getNextUrlIncludeFrames = function(container,doc)
{
    var urlNodes = autopagerMain.findNodeInDoc(doc,
            this.site.linkXPath,this.enableJS || this.inSplitWindow);
    //alert(urlNodes);
    var nextUrl = null;
    if (urlNodes != null && urlNodes.length >0) {
        nextUrl = autopagerMain.getNextUrl(container,this.enableJS || this.inSplitWindow,urlNodes[0]);
    }else
    {
        if (doc.defaultView && doc.defaultView.frames != null) {
            //alert(doc.defaultView.frames.length);
            for(var i=0;i<doc.defaultView.frames.length;++i) {
                nextUrl = this.getNextUrlIncludeFrames(container,doc.defaultView.frames[i].document);
                if ( nextUrl != null)
                    return nextUrl;
            }
        }
     }
    return nextUrl;
}
AutoPagring.prototype.autopagerSimulateClick = function(win,doc,node) {
    //autopagerBwUtil.consoleLog("autopagerSimulateClick")
    var xPower= 0.5;
    var yPower= 0.5;

    if (autopagerPref.loadBoolPref("anti-anti-autopager"))
    {
        xPower = Math.random() * 0.8 + 0.1;
        yPower = Math.random() * 0.8 + 0.1;
    }

    var x = autopagerMain.getOffsetLeft(node) + node.clientWidth * xPower;
    var y = autopagerMain.getOffsetTop(node)+ node.clientHeight * yPower;
    var dim = autopagerMain.myGetWindowDimensions(node.ownerDocument)
    var clientX = x - dim.scrollX
    var clientY = y - dim.scrollY

    var click = node.ownerDocument.createEvent("MouseEvents");
    click.initMouseEvent("click", true, true, win,
                1, x, y, clientX, clientY, false, false, false, false, 0, null);

    var mousedown = node.ownerDocument.createEvent("MouseEvents");
    mousedown.initMouseEvent("mousedown", true, true, win,
                1, x, y, clientX, clientY, false, false, false, false, 0, null);
    var mouseup = node.ownerDocument.createEvent("MouseEvents");
    mouseup.initMouseEvent("mouseup", true, true, win,
                1, x, y, clientX, clientY, false, false, false, false, 0, null);

    //handle ajax site
    var listener=null;
    if (this.site.ajax)
    {
        //observe http conections
        listener = this.observeConnection(node.ownerDocument);
    }
    splitbrowse.switchToCollapsed(false);
    var focused = (document && document.commandDispatcher)?
            document.commandDispatcher.focusedElement : null;

    var canceled = false;
    var needMouseEvents =  autopagerPref.loadBoolPref("simulateMouseDown") || this.site.ajax || this.site.needMouseDown;
    if (needMouseEvents)
    {
        canceled = !node.dispatchEvent(mousedown);
    }
    canceled = !node.dispatchEvent(click);
    //if the mouse is currently down then the click event may be canceled,
    //let's try it again with simulating mouse down ,click and up
    if (canceled && !needMouseEvents)
    {
        node.dispatchEvent(mousedown);
        //renew the click event
        click = node.ownerDocument.createEvent("MouseEvents");
        click.initMouseEvent("click", true, true, win,
                1, x, y, clientX, clientY, false, false, false, false, 0, null);
        node.dispatchEvent(click);
        node.dispatchEvent(mouseup);
    }
    if (needMouseEvents)
        canceled = !node.dispatchEvent(mouseup);
    if (focused && focused.focus && focused != document.commandDispatcher.focusedElement)
    {
        var box = focused.ownerDocument.getBoxObjectFor(focused);
        var de=focused.ownerDocument.documentElement;
        if ((box.screenX + box.width>0 && box.screenY + box.height>0)
            && ((de instanceof HTMLHtmlElement && (box.x - de.scrollLeft < de.scrollWidth && box.y - de.scrollTop < de.scrollHeight)
                )
                || (!(de instanceof HTMLHtmlElement) && (box.x < de.width && box.y < de.height)))
            )
            focused.focus();
    }
//    var canceled =false;
//    node.doCommand();
    if (this.site.ajax)
    {
        //observe http conections
        if (listener!=null)
        {
            var delaymsecs = 0;
            if (this.site.delaymsecs && this.site.delaymsecs>0)
                delaymsecs = this.site.delaymsecs*1; //convert to integer
            setTimeout(function(){listener.stopObserveConnection()},1000 + delaymsecs);
            //clear after teen seconds whethere success or not
            setTimeout(function(){listener.removeObserveConnection()},10000 + delaymsecs);
        }
    }

    if(canceled) {
        // A handler called preventDefault
        //alert("canceled");
    } else {
        // None of the handlers called preventDefault
        //alert("not canceled");
    }
}

AutoPagring.prototype.onDocUnLoad = function(doc) {
        if (this.tmpScrollWatcher)
            doc.removeEventListener("scroll",this.tmpScrollWatcher,false);
        if (this.tmpPageUnLoad)
        {
            if (!autopagerBwUtil.supportHiddenBrowser())
                window.removeEventListener("beforeunload",this.tmpPageUnLoad,true);
            else if(doc.defaultView)
                doc.defaultView.removeEventListener("beforeunload",this.tmpPageUnLoad,true);
        }

//        if (this.tmpMouseUp)
//            window.removeEventListener("mousedown",this.tmpMouseDown,false);
        if (this.tmpRenderStateChanged)
        {
            var browsers = document.getElementById("browsers");
            browsers.removeEventListener("RenderStateChanged",this.tmpRenderStateChanged,false);
        }

        if (this.intervalId)
            window.clearInterval(this.intervalId)
}
AutoPagring.prototype.onPageUnLoad = function(event) {
    if (event && event.originalTarget && event.originalTarget instanceof HTMLDocument)
    {
        this.onDocUnLoad(event.originalTarget)
    }else if (event && event.target && event.target instanceof HTMLDocument)
    {
        this.onDocUnLoad(event.target)
    }

    try
    {
        if (autopagerBwUtil.supportHiddenBrowser())
        {
            //autopagerBwUtil.consoleLog("splitbrowse.close(doc,this);");
            splitbrowse.close(doc,this);
        }
    }catch(e){}
}

AutoPagring.prototype.observeConnection = function (doc)
{
    var listener = this.getListener(doc,this);
    // get the observer service and register for the two coookie topics.
    var observerService = Components.classes["@mozilla.org/observer-service;1"]
                                    .getService(Components.interfaces.nsIObserverService);
    observerService.addObserver(listener, "http-on-modify-request", false);
    //observerService.addObserver(listener, "http-on-examine-response", false);
    return listener;
}

AutoPagring.prototype.getListener = function (doc,paging)
{

 function listener(doc,paging) {
    this.connectionCount = 0;
    this.maxCount = 0;
    this.stopped = false;
    this.doc = doc;
    this.removed=false;
    this.requests = new Array();
    this.paging = paging;
    this.observe = function(aSubject, aTopic, aData) {


         var httpChannel = aSubject.QueryInterface(Components.interfaces.nsIHttpChannel);
         if (httpChannel.notificationCallbacks instanceof XMLHttpRequest &&  httpChannel.referrer && ( httpChannel.referrer.spec  == autopagerMain.getURLNoArch(this.autopagerUtils.getUrl(doc))))
        {
            if (aTopic == "http-on-modify-request") {
                var stack = autopagerMain.getStack();
                var lines = stack.split("\n");
                //make sure it's triggered by the simulate click'
                if (lines[lines.length-3].indexOf("MouseEvent")>0 && lines[lines.length-3].indexOf("onclick")>=0)
                {
                    this.connectionCount ++;
                    this.maxCount ++;

                    try{
                    var xmlhttp = httpChannel.notificationCallbacks
                    var oldonreadystatechange = xmlhttp.onreadystatechange;
                    var listener = this

                    xmlhttp.onreadystatechange = function (aEvt) {
//                        try{
                            oldonreadystatechange.handleEvent(aEvt);
//                        }catch(e)
//                        {
//                            autopagerBwUtil.consoleError(e)
//                        }
//
                        if(xmlhttp.readyState == 4) {
                            //if(xmlhttp.status == 200)
                            {
                                //if (this.requests.indexOf(httpChannel)!=-1)
                                {
                                    //autopagerConfig.removeFromArray( this.requests,httpChannel)
                                    listener.connectionCount --;
                                    if (listener.connectionCount<=0)
                                    {
                                        if (listener.stopped)
                                        {
                                            setTimeout(function(){listener.stopObserveConnection()},100)
                                            //listener.stopObserveConnection();
                                            //listener.removeObserveConnection();
                                        }
                                        autopagerMain.alertErr("All Connection finished, max count:" + listener.maxCount);
                                    }
                                }
                            }
                        }
                    }
                }catch(e)
                {
                    var ms = e.message
                    var s = e.stack
                }
                }
            }
    }
  };

  this.QueryInterface = function(aIID) {
    if (aIID.equals(Components.interfaces.nsISupports) ||
        aIID.equals(Components.interfaces.nsIObserver))
      return this;
    throw Components.results.NS_NOINTERFACE;
  }
  this.stopObserveConnection = function()
{
    this.stopped = true;

    if (this.connectionCount<=0)
    {
        if (this.maxCount<=1)
            {
                var listener = this
                this.maxCount++;
                setTimeout(function(){listener.stopObserveConnection()},500)
            }
        else
            this.removeObserveConnection();
    }

    //autopagerMain.alertErr("Observer stopped, max count:" + this.maxCount + " current connection " + this.connectionCount);
}
,this.removeObserveConnection = function ()
{
    if (!this.removed)
    {
        this.removed = true;
    // get the observer service and register for the two coookie topics.
    var observerService = Components.classes["@mozilla.org/observer-service;1"]
                                    .getService(Components.interfaces.nsIObserverService);
    this.stopped = true;
    if (this.connectionCount==0)
    {
        observerService.removeObserver(this, "http-on-modify-request", false);
        //observerService.removeObserver(this, "http-on-examine-response", false);
        if (this.paging)
            this.paging.onSplitDocLoadedWithDelay(this.doc,100);
    }
    }

}
}
return new listener(doc,paging);
}

AutoPagring.prototype.onSplitDocLoadedWithDelay = function(doc,timeout)
{
    var paging = this
    setTimeout(function () {
    var browser = splitbrowse.getBrowserNode(doc);
    //browser.autopagerSplitWinFirstDocloaded=true;
    doc.documentElement.setAttribute("autopageCurrentPageLoaded",false);
    try{
        paging.scrollWindow(browser.auotpagerContentDoc,doc);
        paging.onStopPaging(browser.auotpagerContentDoc);
        splitbrowse.switchToCollapsed(true);
    }catch(e)
    {
        //var de = doc.documentElement
                paging.autopagerSplitCreated = false;
                paging.autopagerSplitCreated = false;
                paging.autopagerSplitDocInited = false;
                var topDoc = content.document;

                    this.autopagerPagingCount = 0
                setTimeout(function(){
                    topDoc =content.document;
                    de = topDoc.documentElement;
                    doc = topDoc
                    paging.autopagerRunning = false;
                    autopagerMain.onInitDoc(doc,false);
                    paging.autopagerSplitCreated = false;
                    paging.autopagerSplitDocInited = false;
                    splitbrowse.close(doc);
                    splitbrowse.close(topDoc);

                },100);

    return;
       }
    //autopagerMain.onSplitDocLoaded (doc,true);
    },timeout);
}
AutoPagring.prototype.getAutopagerinsertPoint = function(doc)
{
    if (this.autopagerinsertPoint==null)
    {
//        var oldNodes = autopagerMain.findNodeInDoc(doc,this.site.contentXPath,this.enableJS);
//        var insertPoint
//        if (oldNodes!= null && oldNodes.length >0)
//            insertPoint = oldNodes[oldNodes.length - 1].nextSibling;
//        if(insertPoint == null)
//        {
//            if (oldNodes!= null && oldNodes.length >0)
//            {
//                var br = autopagerMain.createDiv(doc,"","display:none;");
//                oldNodes[oldNodes.length - 1].parentNode.appendChild(br);
//                insertPoint = oldNodes[oldNodes.length - 1].nextSibling;
//            }else
//                insertPoint = autopagerMain.getLastDiv(doc);
//        }
//        var div = autopagerMain.createDiv(doc,"apBreakEnd","display:none;");
//        //div.setAttribute("id","apBreakEnd" + this.autopagerPage);
//        insertPoint = insertPoint.parentNode.insertBefore(div,insertPoint);
//        this.autopagerinsertPoint = insertPoint
    }
    return this.autopagerinsertPoint;
}
AutoPagring.prototype.getChangeMonitor = function()
{
    var paging = this;
    if (!paging.changeMonitor)
    {
        paging.changeMonitor =  function _changeMonitor(evt){
            if (evt && evt.target && evt.target.ownerDocument)
                autopagerMain.doClearLoadedPages(evt.target.ownerDocument,true)
        }
    }
    return paging.changeMonitor;
}
AutoPagring.prototype.getDOMNodeMonitor = function()
{
    var paging = this;
    if (!paging.domMonitor)
    {
        paging.domMonitor =  function _domMonitor(evt){
            if (evt && evt.target && evt.target.ownerDocument)
            {
//                if (paging.clearnedTime && new Date().getTime() - paging.clearnedTime< 1000)
//                    return;
//                paging.clearnedTime = null;
                var n = evt.target;
                var p = evt.relatedNode;//n.parentNode
                var nodes = autopagerMain.findNodeInDoc(evt.target,paging.site.linkXPath,paging.enableJS);
                var contained = true;
                for(var i=0;i<nodes.length;i++)
                {
                    if (!autopagerUtils.contains(n,nodes[i]))
                    {
                        contained = false;
                        break;
                    }
                }
//                var cleared = false;
                if (contained && nodes.length>0)
                {
                    nodes = autopagerMain.findNodeInDoc(evt.target,paging.site.contentXPath,paging.enableJS);
                    if (nodes.length>0)
                    {
                        autopagerMain.doClearLoadedPages(evt.target.ownerDocument,true,paging);
//                        cleared = true;
//                        paging.clearnedTime = new Date().getTime()
                    }
                }
                //autopagerUtils.contains(n,a)
//                autopagerBwUtil.consoleLog(evt.type + ":" +  p.tagName + ":" + p.id  + ":" + p.getAttribute('class')
//                    + " -- " + n.tagName + ":" + n.id + ":" + n.getAttribute('class') + "::" + nodes.length + ": " + cleared)
            }
//            if (evt && evt.target && evt.target.ownerDocument)
//                autopagerMain.doClearLoadedPages(evt.target.ownerDocument,true)
        }
    }
    return paging.domMonitor;
}
