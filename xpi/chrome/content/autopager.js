/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is AutoPager code.
 *
 * The Initial Developer of the AutoPager is
 * Wind Li
 * Portions created by the Initial Developer are Copyright (C) 2007
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either of the GNU General Public License Version 2 or later (the "GPL"),
 * or the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */
var easy = false;
autopagerOnLoad();
var autopagerPrefs = null;
var debug= false;
var workingAutoSites=null;
function autopagerOnLoad() {
    // listen for tab switches
    window.addEventListener("load", onPageLoad, true);
    window.addEventListener("DOMContentLoaded", onContentLoad, false);
    //window.addEventListener("DOMContentLoaded", onPageLoad, false);
//    window.addEventListener("unload", onPageUnLoad, true);
    window.addEventListener("select", onSelect, true);
    //window.addEventListener("focus", onSelect, false);
    
};

function sitewizard(doc) {
    alert(getString("selectlinkxpath"));
    document.autopagerXPathModel = "wizard";
    if(!doc.documentElement.autoPagerSelectorEnabled)
        enableSelector(doc,true);
}
function createXpath(doc) {
    document.autopagerXPathModel = "test";
    enableSelector(doc,true);
}
function addStyleSheetToDoc(doc,styleSheet) {
    if(doc.createStyleSheet) {
        doc.createStyleSheet(styleSheet);
    }
    
    else {
        
        var styles = "@import url(' " + styleSheet +  " ');";
        var newSS=doc.createElement('link');
        newSS.rel='stylesheet';
        newSS.type = "text/css";
        newSS.href=styleSheet;	//'data:text/css,'+escape(styles);
        doc.getElementsByTagName("head")[0].appendChild(newSS);
    }		
}
function removeStyleSheetFromDoc(doc,styleSheet) {
    
    var nodes = evaluateXPath(doc.getElementsByTagName("head")[0],"link[@href ='" + styleSheet + "']",false);
    for (var i=0;i<nodes.length;++i)
        doc.getElementsByTagName("head")[0].removeChild(nodes[i]);
}
function escToExitCreateModel(e) {
    var code;
    if (!e) var e = window.event;
    if (e.keyCode) code = e.keyCode;
    else if (e.which) code = e.which;
    //var character = String.fromCharCode(code);
    if (code == 27) //escape
    {
        var doc = (e.target.ownerDocument == null) ? e.target : e.target.ownerDocument ;
        //alert(doc);
        enableSelector(doc,true);
    }
    //alert('keycode was ' + code);	
}
function enableSelector(doc,setMenuStatus) {
    var de = doc.documentElement;
    
    //alert(doc);
    if (de.autoPagerSelectorEnabled) {
        doc.removeEventListener("mouseover", onXPathMouseOver, false);
        doc.removeEventListener("keyup", escToExitCreateModel, false);
        de.autoPagerSelectorEnabled = false;
        removeStyleSheetFromDoc(doc,"chrome://autopager/content/EditorContent.css");
        removeStyleSheetFromDoc(doc,"chrome://autopager/content/EditorAllTags.css");
        hiddenSelectorDivs(doc);
        if (selectedObj) {
            enableClick(selectedObj,false);
        }
        
    }else {
        doc.addEventListener("mouseover", onXPathMouseOver, false);
        doc.addEventListener("keyup", escToExitCreateModel, false);
        de.autoPagerSelectorEnabled = true;
        
        addStyleSheetToDoc(doc,"chrome://autopager/content/EditorContent.css");
        addStyleSheetToDoc(doc,"chrome://autopager/content/EditorAllTags.css");
    }
    if (setMenuStatus) {
        if (de.autoPagerSelectorEnabled ) {
            alert("Press ESC to abort.");
            logInfo("Press ESC to abort.","Press ESC to abort.");
        }
        document.getElementById("autoPagerCreateXPath").setAttribute("checked",
        de.autoPagerSelectorEnabled);
    }
    if (doc.defaultView.frames != null) {
        //alert(doc.defaultView.frames.length);
        var i=0;
        for(i=0;i<doc.defaultView.frames.length;++i) {
            enableSelector(doc.defaultView.frames[i].document,false);
        }
    }
};

function onPageUnLoad(event) {
    
    
    if (!document.autoPagerInited) {
        document.autoPagerInited = true;
        setGlobalEnabled(loadEnableStat());
    }
    
    var doc = event.originalTarget;
    if (!(doc instanceof HTMLDocument))
        {
            return;
        }
    setGlobalImageByStatus(getGlobalEnabled());
    try{
        hiddenDiv(getPagingWatcherDiv(doc),true);
        document.getElementById("autoPagerCreateXPath").setAttribute("checked", false);	
    }catch(e){}
    
    
    if (doc == null)
        return;
    //don't handle frames
    if (doc.defaultView != doc.defaultView.top)
           return;

    var browser = splitbrowse.getBrowserNode(doc);
    //alert(url);
    
    
    if (browser.getAttribute(splitbrowse.getSplitKey())) {
        //vbox
        var parent = browser.parentNode;
        browser.destroy();
        //remove the splitter
	parent.parentNode.removeChild(parent.nextSibling);
        parent.removeChild(browser);
        parent.parentNode.removeChild(parent);
        
    }
}

function onContentLoad(event) {
    if (!document.autoPagerInited) {
        document.autoPagerInited = true;
        setGlobalEnabled(loadEnableStat());
    }
    
    var doc = event.originalTarget;
    if (!(doc instanceof HTMLDocument))
        {
            return;
        }
    setGlobalImageByStatus(getGlobalEnabled());
    try{
        hiddenDiv(getPagingWatcherDiv(doc),true);
        document.getElementById("autoPagerCreateXPath").setAttribute("checked", false);	
    }catch(e){}
    
    
    //don't handle frames
    var browser = splitbrowse.getBrowserNode(doc);
    //if (browser.contentDocument != doc)
    //    return;
    //	alert(event.target + " " 
    //			+ event.currentTarget + " " 
    //			+ event.originalTarget );
    
    var url;
    try{
        url = doc.location.href;
    }catch(e) {
        //alert(e);
        doc = doc.ownerDocument;
        url = doc.location.href;
    }
    if (doc == null)
        return;
    //alert(url);
    if (browser.getAttribute(splitbrowse.getSplitKey())) {
        if (browser.auotpagerContentDoc) {
            {
                if (browser.autopagerSplitWinFirstDocSubmited) {
                    if(browser.autopagerSplitWinFirstDocloaded) {
                        //use onload to make sure every thing is loaded
                        if (browser.auotpagerContentDoc.documentElement.autopagerUseSafeEvent)
                            return;
                        //if (!browser.auotpagerContentDoc.documentElement.patternRegExp.test(url))
                        //    return;
                        scrollWindow(browser.auotpagerContentDoc,doc);
                        
                        onStopPaging(browser.auotpagerContentDoc);
                    }
                }
            }
            
        }
        
        return;
    }
    //alert(doc.location.href);
    
    handleDocLoad(doc,false);
}
function handleDocLoad(doc,safe)
{
    workingAutoSites = loadConfig();
    loadTempConfig();
    
    onInitDoc(doc,safe);
    if (doc.defaultView.frames != null) {
        //alert(doc.defaultView.frames.length);
        var i=0;
        for(i=0;i<doc.defaultView.frames.length;++i) {
            //alert(doc.defaultView.frames[i]);
            onInitDoc(doc.defaultView.frames[i].document,safe);
            //doc.defaultView.frames[i].addEventListener("load", onPageLoad, true);
        }
    }    
}
function onPageLoad(event) {
    
    var doc = event.originalTarget;
    if (!(doc instanceof HTMLDocument))
        {
            return;
        }
    
    
    var browser = splitbrowse.getBrowserNode(doc);
    
    var url;
    try{
        url = doc.location.href;
    }catch(e) {
        //alert(e);
        doc = doc.ownerDocument;
        url = doc.location.href;
    }
    if (doc == null)
        return;
    //alert(url);
    
    
    if (browser.getAttribute(splitbrowse.getSplitKey())) {
        
        if (browser.auotpagerContentDoc) {
            {
                if (browser.autopagerSplitWinFirstDocSubmited) {
                    if(!browser.autopagerSplitWinFirstDocloaded) {
                        if (doc.defaultView != doc.defaultView.top)
                               return;
                        var nextUrl = null;
                        
                        var container = browser.auotpagerContentDoc;
                        //var doc = browser.webNavigation.document;
                        nextUrl = getNextUrlIncludeFrames(container,doc);
                        container.documentElement.autopagernextUrl = nextUrl;
                        browser.autopagerSplitWinFirstDocloaded = true;
                        //do_request(container);
                        container.documentElement.autopagerSplitDocInited = true;
                    }
                    else {
                        //don't use onload to make sure every thing is loaded
                        if (!browser.auotpagerContentDoc.documentElement.autopagerUseSafeEvent)
                            return;                        
                         //if (!browser.auotpagerContentDoc.documentElement.patternRegExp.test(url))
                         //   return;
                        scrollWindow(browser.auotpagerContentDoc,doc);
                        
                        onStopPaging(browser.auotpagerContentDoc);
                    }
                }
            }
            
        }
        
        return;
    }
    handleDocLoad(doc,true);
}
function getNextUrlIncludeFrames(container,doc)
{
    var urlNodes = findNodeInDoc(doc,
            container.documentElement.linkXPath,container.documentElement.enableJS);
    //alert(urlNodes);
    var nextUrl = null;
    if (urlNodes != null && urlNodes.length >0) {
        nextUrl = getNextUrl(container,container.documentElement.enableJS,urlNodes[0]);
    }else
    {
        if (doc.defaultView.frames != null) {
            //alert(doc.defaultView.frames.length);
            var i=0;
            for(i=0;i<doc.defaultView.frames.length && nextUrl == null;++i) {
                nextUrl = getNextUrlIncludeFrames(container,doc.defaultView.frames[i].document);
                //alert(urlNodes);
              
            }
        }
     }    
    return nextUrl;
}
function loadTempConfig() {
    var smartenable = loadBoolPref("smartenable");
    if (smartenable) {
        
        var smarttext = loadUTF8Pref("smarttext");
        if (smarttext.length>0) {
            var smartlinks = loadPref("smartlinks");
            var site = newSite("*","temp site for smart paging"
            ,"","//body/*");
            site.maxLinks = smartlinks;
            site.enableJS = true;
            site.isTemp = true;
            site.tmpPaths =  convertToXpath(smarttext);
            
            site.fixOverflow = true;
            site.margin = loadPref("smartMargin");
            workingAutoSites.push(site);
            //alert(linkXPath);
        }
    }
}
function convertToXpath(str) {
    var xpaths = new Array();
    var strs = str.split("|");
    for(var i=0;i<strs.length;++i)
        strs[i] = strs[i].toLowerCase();
    for(var i=0;i<strs.length;++i) {
        var strCon =  convertStringToXPath(strs[i],"");
        if (strCon.length >0)
            xpaths.push( "//a[" + strCon + "] | //input[" + strCon + "]");
    }
    return xpaths;
}
function xpathToLowerCase(str) {
    return "translate(" + str +", 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')";
}
function convertStringToXPath(str,dir) {
    var xi="";
    
    if (str.length>0) {
        xi = appendOrCondition(xi,  dir + xpathToLowerCase("text()") + " ='" + str + "'");
        xi = appendOrCondition(xi,  dir + xpathToLowerCase("@id") + "='" + str + "'");
        xi = appendOrCondition(xi,  dir + xpathToLowerCase("@name") + "='" + str + "'");
        xi = appendOrCondition(xi,  dir + xpathToLowerCase("@class") + "='" + str + "'");
        xi = appendOrCondition(xi,  dir + xpathToLowerCase("img/@src") + "='" + str + "'");
        xi = appendOrCondition(xi,  dir + xpathToLowerCase("substring(img/@src,string-length(img/@src) - " 
        + str.length + ")") + "='" + str + "'");
    }
    return xi;
}
function appendOrCondition(base,newStr) {
    if (base.length > 0) {
        if (newStr.length > 0)
            return base + " or " + newStr;
        else
            return base;
    }
    return newStr;
}

function getPrefs() {
    if (autopagerPrefs == null) {
        autopagerPrefs = Components.classes["@mozilla.org/preferences-service;1"].
        getService(Components.interfaces.nsIPrefService).getBranch("autopager");
        
    }
    return autopagerPrefs;
}
function fixOverflow(doc) {
    var nodes = findNodeInDoc(doc,"//*[contains(@style,'overflow')]",false);
    if (nodes != null) {
        for(var i = 0;i<nodes.length;++i) {
            var node = nodes[i];
            
            node.style.overflow = "visible";
        }
    }
    nodes = findNodeInDoc(doc,"//*[contains(@style,'position')]",false);
    if (nodes != null) {
        for(var i = 0;i<nodes.length;++i) {
            var node = nodes[i];
            if ( node.style.position == "fixed" && node.className != "autoPagerS")
                node.style.position = "absolute";
        }
    }
    /*
    try{
    if (doc.styleSheets.length>0)
        {
            for (var i =0;i< doc.styleSheets.length;i++)
                {
                    var sheet = doc.styleSheets[i];
                    for (var j=0;j<sheet.cssRules.length;j++)
                        {
                            var rule = sheet.cssRules.item(j);
                            if (rule!=null)
                            {
                                if (rule.style != null)
                                    {
                                        if (rule.style.position != null && rule.style.position.toLowerCase().indexOf ("fixed")!= -1 )
                                            {
                                                //alert(rule.style.position);
                                                sheet.deleteRule(j);
                                                j--;
                                            //rule.style.position = "absolute ! important";
                                            }
                                            else
                                            rule.style.overflow = "visible";
                                    }
                            }
                            
                        }
                }
        }
        }catch(e){ alert(e);}
        */
}
function getCtrlKey()
{
    return getPrefs().getBoolPref(".enablehotkeys.ctrlkey");
}
function setCtrlKey(value)
{
    return getPrefs().setBoolPref(".enablehotkeys.ctrlkey",value);
}
function getAltKey()
{
    return getPrefs().getBoolPref(".enablehotkeys.altkey");
}
function setAltKey(value)
{
    return getPrefs().setBoolPref(".enablehotkeys.altkey",value);
}
function getShiftKey()
{
    return getPrefs().getBoolPref(".enablehotkeys.shiftkey");
}
function setShiftKey(value)
{
    return getPrefs().setBoolPref(".enablehotkeys.shiftkey",value);
}

function getRegExp(site)
{
    if (site.isRegex)
        return new RegExp(site.urlPattern);
    else
        return convert2RegExp(site.urlPattern);
}
function onInitDoc(doc,safe) {
    try{
        debug=getPrefs().getBoolPref(".debug");
        document.getElementById("autopager-hidden-panel-menu").hidden = !debug;
        document.getElementById("autopager-hidden-panel-menu").nextSibling.hidden = !debug;
        
    }catch(e) {
        alertErr(e);
    }
    if(doc.body.attachEvent){
        doc.body.attachEvent(
        'ondblclick',function(){
            setGlobalEnabled(!getGlobalEnabled());
        }
        );
    }else{
        doc.documentElement.addEventListener(
        'dblclick',function(event){
            if (event.clientX + 20 < window.innerWidth &&
            event.clientY + 20 < window.innerHeight &&
            event.clientX > 20 &&
            event.clientY > 20) {
                if (event.ctrlKey == getCtrlKey() && event.altKey == getAltKey() && event.shiftKey == getShiftKey())
                    setGlobalEnabled(!getGlobalEnabled());
            }
        },true
        );
    }	
    var url = doc.location.href;
    if (url == "about:blank")
        return;
    var i=0;
    for(i=0;i<workingAutoSites.length;++i) {
        var pattern = getRegExp(workingAutoSites[i]);
        if (pattern.test(url)) {
            //should not equal
            //if (workingAutoSites[i].quickLoad == safe)
            //    return false;
            if (safe)
                return false;
            var msg="";
            var info = "";
            
            
            var de = doc.documentElement;
            if (!de.autoPagerRunning) {
                de.patternRegExp = pattern;
                var insertPoint = null;
                var nextUrl = null;
                
                de.autoPagerRunning = true;
                var oldNodes = findNodeInDoc(doc,workingAutoSites[i].contentXPath,workingAutoSites[i].enableJS);
                
                de.contentXPath = workingAutoSites[i].contentXPath;
                de.margin = workingAutoSites[i].margin;
                de.enabled = workingAutoSites[i].enabled;
                //if (workingAutoSites[i].enabled)
                de.autopagerSplitDocInited = false;
                de.enableJS = workingAutoSites[i].enableJS;
                if (!de.autopagerPagingCount)
                    de.autopagerPagingCount = 0;
                
                if (oldNodes!= null && oldNodes.length >0)
                    insertPoint = oldNodes[oldNodes.length - 1].nextSibling;
                if(insertPoint == null)
                    insertPoint = getLastDiv(doc);
                //alert(oldNodes[oldNodes.length - 1]);
                if (debug)
                    logInfo(insertPoint, "go");
                var urlNodes = null;
                if (!workingAutoSites[i].isTemp)
                    urlNodes = findNodeInDoc(doc,workingAutoSites[i].linkXPath,workingAutoSites[i].enableJS);
                else{
                    workingAutoSites[i].linkXPath = null;
                    for(var t=0;t<workingAutoSites[i].tmpPaths.length; ++t) {
                        urlNodes = findNodeInDoc(doc,workingAutoSites[i].tmpPaths[t],workingAutoSites[i].enableJS);
                        if ( urlNodes != null  && urlNodes.length >0
                        && urlNodes.length <= workingAutoSites[i].maxLinks) {
                            workingAutoSites[i].linkXPath = workingAutoSites[i].tmpPaths[t];
                            break;
                        }
                    }       
                }
                de.linkXPath = workingAutoSites[i].linkXPath;
                
                var tooManyLinks = false;
                if (workingAutoSites[i].maxLinks  != -1 && urlNodes != null 
                && urlNodes.length > workingAutoSites[i].maxLinks )
                    tooManyLinks = true;
                
                //alert(urlNodes);
                if (urlNodes != null && urlNodes.length >0) {
                    nextUrl = getNextUrl(doc,workingAutoSites[i].enableJS,urlNodes[0]);
                }else
                    nextUrl = null;
                //alert(insertPoint);
                //alert(nextUrl);
                var autopagerEnabled =	(insertPoint != null) && (nextUrl != null) 
                && workingAutoSites[i].enabled && !(tooManyLinks);
                de.autopagerEnabled = autopagerEnabled;
                //alert(doc.autopagerEnabled);
                de.autoPagerPage = 1;
                de.autopagerinsertPoint = insertPoint;
                if (workingAutoSites[i].enableJS)
                    de.autopagernextUrl= null;
                else
                    de.autopagernextUrl = nextUrl;
                de.autopagerUseSafeEvent = !workingAutoSites[i].quickLoad;
                
                if (autopagerEnabled) {
                     if(workingAutoSites[i].fixOverflow)
                        fixOverflow(doc);

                    try{
                        if (workingAutoSites[i].enableJS) {
                            var splitbrowser = getSplitBrowserForDoc(doc,true);
                            splitbrowser.autopagerSplitWinFirstDocloaded = false;
                            splitbrowser.autopagerSplitWinFirstDocSubmited = true;
                        }
                    }catch(e)
                    {}				
                    
                    var topDoc = doc.defaultView.top.document;
                    if (!topDoc.documentElement.autopagerEnabledDoc)
                        topDoc.documentElement.autopagerEnabledDoc = new Array();
                    topDoc.documentElement.autopagerEnabledDoc.push( doc);
                    //if (!topDoc.documentElement.autopagerWatcherRunning) {
                    //   topDoc.documentElement.autopagerWatcherRunning = true;
                        scrollWatcher();
                    //}
                    msg = formatString("enableurl",[ url ]);
                    info = formatString("enableinfo",[url,workingAutoSites[i].linkXPath,workingAutoSites[i].contentXPath]);
                }
                else if (!getGlobalEnabled()) {
                    msg = formatString("globaldisabled",[url]);
                    info = msg;
                }
                if (msg.length>0)
                    logInfo(msg, info);				
                return true;
            }
        }
    }
    
};
function onSelect(event) {
    try{
        var de = content.document.documentElement;
        
        if (de != null ) {	
            if (de.autopagerEnabledDoc!=null
            && de.autopagerEnabledDoc.length >0) {
                try{
                    scrollWatcher();
                }catch(e){}
                try{
                    pagingWatcher();
                }catch(e){}
            }
            document.getElementById("autoPagerCreateXPath").setAttribute("checked", 
            de.autoPagerSelectorEnabled);
        }
    }catch(e) {
        //logInfo(e,e);
    }
    
};
function do_request(doc){
    var nextUrl = doc.documentElement.autopagernextUrl;
    var browser = null;
    //if (doc.documentElement.enableJS)
    //    browser = getSplitBrowserForDoc(doc,false);
    var linkXPath = doc.documentElement.linkXPath;
    if (nextUrl != null && ( (nextUrl instanceof String) || !nextUrl.disabled))
    {
            onStartPaging(doc);
            processNextDoc(doc,nextUrl);
    }
};

function getEnabled(doc) {
    var enabled =doc.documentElement.autopagerEnabled && getGlobalEnabled();
    enabled = enabled && ( !doc.documentElement.enableJS  || doc.documentElement.autopagerSplitDocInited );
    return  enabled;
};
var count=0;
function  scrollWatcher() {
    var i =0;
    if (debug)
        logInfo(count,"Enter scrollWatcher");
    var de = content.document.documentElement;
    for(i=0;i<de.autopagerEnabledDoc.length;i++) {
        var doc = de.autopagerEnabledDoc[i];
        
        var Enable = getEnabled(doc);
        if (Enable) {
            if (debug)
                logInfo(count+ "Enabled " + doc.location.href,count+ "Enabled " + doc.location.href);
            try{
                var scroolDoc =doc; 
                
                var sc = (scroolDoc.documentElement && scroolDoc.documentElement.scrollTop)
                ? scroolDoc.documentElement.scrollTop : scroolDoc.body.scrollTop;
                var sh = (scroolDoc.documentElement && scroolDoc.documentElement.scrollHeight)
                ? scroolDoc.documentElement.scrollHeight : scroolDoc.body.scrollHeight;
                if (scroolDoc.body != null && scroolDoc.body.scrollHeight > sh)
                    sh = scroolDoc.body.scrollHeight;
                
                var wh = window.innerHeight ? window.innerHeight : scroolDoc.documentElement.clientHeight;
                var remain = sh - sc - wh;
                // window.status = remain;
                count++;
                if (debug)
                    logInfo(count + ": Auto pager wh:" + wh+ " sc:" + sc + " remain: " + remain,
                    "SH=" + sh + " sc = " + sc + " wh= " + wh + " Auto pager remain: " + remain + ".\nremain < " + wh+" will auto page.");
                
                //alert(wh);
                if (debug)
                    wh = wh * (doc.documentElement.margin*1 + 1.5);
                else
                    wh = wh * (doc.documentElement.margin * 1);
                //alert(wh);
                
                if(remain < wh ){
                    doc.documentElement.autopagerEnabled = false;
                    do_request(doc)
                }
            }catch(e){
                alertErr("Exception:" + e);
            }
        }
    }
    var self = arguments.callee;
    setTimeout(self,400);
    
};

function onXPathMouseOver(event) {
    var target = event.target;
    if (target == null)
        target = event.explicitTarget;
    
    if(target.tagName=="BODY"||target.tagName=="HTML" 
    ||(target.offsetHeight<10&&target.offsetWidth<10)) {
        return true;
    }
    if (target.className == "autoPagerS") {
        return true;
    }
    if (target.tagName != 'A' && target.parentNode.tagName == 'A')
        target = target.parentNode;
    
    var str = formatString("moveover",[target.tagName,getXPathForObject(target)]);
    logInfo(str,str);
    
    //event.target.addEventListener("click",onXPathClick,true);
    //event.target.addEventListener("contextmenu",onMyContextMenu,true);
    createPagerSelectorDivs(target.ownerDocument,target);
    return true;
};
function createDiv(doc,id,style) {
    var div = doc.createElement("div");
    //div.innerHTML = divHtml;
    doc.documentElement.appendChild(div);
    div.className="autoPagerS";
    if (id.length>0)
        div.id = id;
    
    if (style.length>0)
        div.style.cssText = style;
    return div;
};
function getSelectorDiv(doc,divName) {
    var div = doc.getElementById(divName);
    if (!div) {
        var style ="border: 2px solid orange; margin: 0px; padding: 0px; position: absolute; width: 0px; display: block; z-index: 90; left: -100px; top: -100px; height: 0px;"; 
        //		div = createDiv(doc, divName,
        //			style);
        div = createDiv(doc,divName,style);
        //div.innerHTML = "<div id=" + divName + " class = 'autoPagerS' style ='" + style + "'></div>";  
        //div = doc.getElementById(divName);
    }
    return div;
};
function getSelectorLoadFrame(doc) {
    var divName = "autoPagerLoadDiv";
    var frameName = divName + "ifr";
    
    var frame = doc.getElementById(frameName);
    if (frame == null || !frame) {
        var div = null;
        if (debug) {
            div = createDiv(doc,divName,"");
        }
        else {	
            div = createDiv(doc,divName,  "border: 0px; margin: 0px; padding: 0px; position: absolute; width: 0px; display: block; z-index: -90; left: -100px; top: -100px; height: 0px;");
        }
        div.innerHTML=
        "<iframe id='" + frameName + "' name='" + frameName + "' width='100%' height='100%' src=''></iframe>";
        
        frame = doc.getElementById(frameName);
        frame.autoPagerInited = false;
        //create a empty div in target
        getLastDiv(doc);
    }
    //fix for enable to work at restored session
    try{
        frame.removeEventListener("load", onFrameLoad, false);
    }catch(e){}
    
    frame.addEventListener("load", onFrameLoad, false);
    return frame;
};


function getLastDiv(doc) {
    var divName = "autoPagerLastDiv";
    var div = doc.getElementById(divName);
    if (div == null || !div) {
        var div = createDiv(doc,divName,
        "border: 0px; margin: 0px; padding: 0px; position: absolute; width: 0px; display: block; z-index: -90; left: -100px; top: -100px; height: 0px;");
        div = doc.getElementById(divName);
    }
    
    return div;
};

function enableClickOnNode(node,enabled) {
    if (enabled) {
        node.addEventListener("click",onXPathClick,true);
    }else {
        node.removeEventListener("click",onXPathClick,true);
    }
};
function enableClick(node,enabled) {
    //if (node.parentNode.tagName == "A")
    enableClickOnNode(node.parentNode,enabled);
    enableClickOnNodes(node,enabled);
}
function enableClickOnNodes(node,enabled) {
    enableClickOnNode(node,enabled);
    var childs = node.childNodes;
    var i=0;
    for(i=0;i<childs.length;++i)
        enableClickOnNodes(childs[i],enabled);
};

var selectedObj = null;
function hiddenSelectorDivs(doc) {
    var leftDiv =getSelectorDiv(doc,"autoPagerBorderLeft");
    var rightDiv =getSelectorDiv(doc,"autoPagerBorderRight");
    var topDiv =getSelectorDiv(doc,"autoPagerBorderTop");
    var bottomDiv =getSelectorDiv(doc,"autoPagerBorderBottom");
    hiddenDiv(leftDiv,true);
    hiddenDiv(rightDiv,true);
    hiddenDiv(topDiv,true);
    hiddenDiv(bottomDiv,true);
}
function hiddenDiv(div,hidden) {
    if (hidden) {
        div.style.display = "none";
    }else {
        div.style.display = "block";
    }
	//div.hidden = hidden;
}
function createPagerSelectorDivs(doc,target) {
    if (selectedObj) {
        enableClick(selectedObj,false);
    }
    selectedObj = target;
    enableClick(selectedObj,true);
    
    var margin = 2;
    var leftDiv =getSelectorDiv(doc,"autoPagerBorderLeft");
    var rightDiv =getSelectorDiv(doc,"autoPagerBorderRight");
    var topDiv =getSelectorDiv(doc,"autoPagerBorderTop");
    var bottomDiv =getSelectorDiv(doc,"autoPagerBorderBottom");
    var left = getOffsetLeft(target);
    var top = getOffsetTop(target);
    
    var height = target.offsetHeight;
    if (!height)
        height = target.parentNode.offsetHeight;
    var width = target.offsetWidth;
    if (!width)
        width = target.parentNode.offsetWidth;
    
    leftDiv.style.left = (left - margin) + "px";
    leftDiv.style.top = (top - margin) + "px";
    leftDiv.style.height = (height + margin) + "px";
    
    rightDiv.style.left = (left + width) + "px";
    rightDiv.style.top = (top - margin) + "px";
    rightDiv.style.height = (height + margin) + "px";
    
    topDiv.style.left = left + "px";
    topDiv.style.top = (top - margin) + "px";
    topDiv.style.width = width + "px";
    
    bottomDiv.style.left = left + "px";
    bottomDiv.style.top = (top + height) + "px";
    bottomDiv.style.width = width + "px";
    
    hiddenDiv(leftDiv,false);
    hiddenDiv(rightDiv,false);
    hiddenDiv(topDiv,false);
    hiddenDiv(bottomDiv,false);
    
    
    //	doc.body.appendChild(leftDiv);
    //	alert(leftDiv.style.height);
    //target.offsetWidth;
    
};
function appendCondition(base,newStr) {
    if (base.length > 0) {
        if (newStr.length > 0)
            return base + " and " + newStr;
        else
            return base;
    }
    return newStr;
}
function getXIdetify(node,dir) {
    var xi = "";
    try{
        if ((node.className != null) && (node.className.length >0)) {
            xi = appendCondition(xi,dir + "@class='" + node.className + "'");
        }
        if (node.getAttribute("id") != null && node.getAttribute("id").length >0) {
            xi = appendCondition(xi,dir + "@id='" + node.getAttribute("id") + "'");
        }
        if (node.textContent != null && node.childNodes.length ==1 && node.textContent.length >0 && node.textContent.length < 10) {
            //only if child is #text
            var child = node.childNodes[0];
            
            if(child.nodeType == 3)
                xi = appendCondition(xi, "contains(" +dir + "text(),'" + child.textContent + "')");
        }
        if(node.tagName == "INPUT") {
            if (node.getAttribute("type") != null && node.getAttribute("type").length >0) {
                xi = appendCondition(xi,dir + "@type='" + node.getAttribute("type") + "'");
            }
            if (node.getAttribute("name") != null && node.getAttribute("name").length >0) {
                xi = appendCondition(xi,dir + "@name='" + node.getAttribute("name") + "'");
            }
            if (node.getAttribute("value") != null && node.getAttribute("value").length >0) {
                xi = appendCondition(xi,dir + "@value='" + node.getAttribute("value") + "'");
            }
            if (node.getAttribute("src") != null && node.getAttribute("src").length >0) {
                xi = appendCondition(xi,dir + "@src='" + node.getAttribute("src") + "'");
            }
        }
        else if(node.tagName == "IMG") {
            if (node.getAttribute("src") != null && node.getAttribute("src").length >0) {
                xi = appendCondition(xi,dir + "@src='" + node.getAttribute("src") + "'");
            }
            if (node.getAttribute("alt") != null && node.getAttribute("alt").length >0) {
                xi = appendCondition(xi,dir + "@alt='" + node.getAttribute("alt") + "'");
            }
        }
    }catch(e) {
        alertErr(e);
    }
    return xi;
}
function getTagCount(childs,index) {
    var tagCount = 0;
    var tagname = childs[index].tagName;
    var i;
    for(i=childs.length-1;i>=0;--i) {
        if (childs[i].tagName == tagname)
            tagCount ++;
    }
    return tagCount;
};

function getTagIndex(childs,index) {
    var tagIndex = 1;
    var tagname = childs[index].tagName;
    var i;
    for( i=index-1;i>=0;--i) {
        if (childs[i].tagName == tagname)
            tagIndex ++;
    }
    return tagIndex;
}
function getXPath(node,dir,deep) {
    var xi = getXIdetify(node,dir);
    if (deep >0 && node.hasChildNodes() &&  (node.childNodes != null) && (node.childNodes.length > 0)) {
        var i=0;
        var childs = node.childNodes;
        for(i=0;i<childs.length;++i) {
            if (childs[i].nodeType == 1) {
                var tagname = childs[i].tagName.toLowerCase();
                if (getTagCount(childs,i) > 1)
                    tagname = tagname + "[" + getTagIndex(childs,i) + "]";
                xi = appendCondition(xi,
                getXPath(childs[i], dir + tagname +"/" ,deep-1));
            }
        }
    }
    return xi;
}
function getTagName(node) {
    var tagname = node.tagName.toLowerCase();
    if (tagname == 'td' || tagname == 'th' || tagname == 'tr' || tagname == 'tbody')
        tagname = "table";
    return tagname;
}
function getPathDir(root,child) {
    var dir="";
    if (root != child) {
        if (root == 'table') {
            if (child == 'td' || child == 'th')
                dir = "/" + child;
            if (child != "tbody")
                dir = "/tr" + dir;
            dir = "tbody" + dir;
        }
        if (dir.length >0)
            dir = dir +"/";
    }
    return dir;
}
function getXPathForObject(target) {
    var tagname = getTagName(target);
    var dir = getPathDir(tagname,target.tagName.toLowerCase());
    var path="//" + tagname;
    var xi = getXPath(target,dir,1);
    if (xi.length >0)
        path = path +  "[" + xi + "]";
    return path;	
}
function onXPathClick(event) {
    event.preventDefault();
    var target = event.target;
    if(target != event.currentTarget)
        return false;
    
    if (target.tagName != 'A' && target.parentNode.tagName == 'A')
        target = target.parentNode;
    var path = getXPathForObject(target);
    content.document.xTestLastDoc = target.ownerDocument;
    var doc = content.document.xTestLastDoc;
    var url = doc.location.href;
    
    var newpath = xTestXPath(target.ownerDocument,path);
    if (document.autopagerXPathModel == "wizard") {
        if (confirm(getString("xpathconfirm"))) {
            var urlPattern = url;
            if (url.indexOf("?")>0)
                urlPattern = url.substring(0,url.indexOf("?")) + "*";
            var site = newSite(urlPattern,url
            ,newpath,"//body/*");
            site.createdByYou = true;
            site.owner = loadMyName();
            //general link
            if (target.tagName == "A" && target.href.toLowerCase().indexOf("javascript") == -1)
                site.enableJS = false;
            else
                site.enableJS = true;
            workingAutoSites = loadConfig();
            workingAutoSites.push(site);
            saveConfig(workingAutoSites);
            document.autopagerXPathModel = "";
            openSetting(urlPattern);
            if(doc.documentElement.autoPagerSelectorEnabled)
                enableSelector(doc,true);
        }else if(!confirm(getString("tryagain"))) {
            if(doc.documentElement.autoPagerSelectorEnabled)
                enableSelector(content.document,true);
        }
        else
            if(!doc.documentElement.autoPagerSelectorEnabled)
                enableSelector(content.document,true);
    }
    //	if (target.tagName == 'A')
    //		processNextDoc(target.autoPagerHref);
    event.preventDefault();
    return true;
};
function getOffsetTop(target) {
    var node=target;
    var top=0;
    while(node&&node.tagName!="BODY") {
        top+=node.offsetTop;
        node=node.offsetParent;
    }
    return top;
};

function getOffsetLeft(target) {
    var node=target;
    var left=0;
    while(node&&node.tagName!="BODY") {
        left+=node.offsetLeft;
        node=node.offsetParent;
    }
    return left;
};
function onFrameLoad(event) {
    //alert(event.currentTarget);
    //alert(event.target);
    //alert(event.originalTarget);
    
    var target = null;
     if (event.target != null)
        target = event.target;
    else if (event.originalTarget != null)
        target = event.originalTarget;
    else
        target = event.currentTarget;
    //alert(target);
    var frame=target;
    //try{
   //     frame = getSelectorLoadFrame(content.document);
    //}catch(e) {
   //     frame = target;
    //}
    //if (frame.contentDocument.documentURI == 'about:blank')
    //    return;
    if (!frame.autoPagerInited) {
        //alert("onFrameLoad");
        
        frame.autoPagerInited = true;
        var doc = frame.contentDocument;
        scrollWindow(frame.ownerDocument,doc);
        onStopPaging(frame.ownerDocument);        
        frame.contentDocument.close();
        
    }
};

function processNextDoc(doc,url) {
    window.status = "Loading " + url;
    if (doc.documentElement.enableJS) {
        processInSplitWin(doc);
    }else{
        processNextDocUsingXMLHttpRequest(doc,url);
    }
};
function getHtmlInnerHTML(html,enableJS,url) {
    var s= html.replace(/top\.location(\.href)*[ ]*\=/g,"atoplocationhref=");
    if (!enableJS) {
        //<base href="http://bbs.chinaunix.net/forumdisplay.php?fid=46">
        
        var headEnd = s.indexOf("</head>");
        if (headEnd == -1)
            headEnd = s.toLowerCase().indexOf("</head>");
        if (headEnd >0)
            s = "<html><head><base href='" + url +
            "'></head> "+ s.slice(headEnd + "</head>".length);
        //s = s.replace(/<script/g,"<!-- script");
        s = s.replace(/<[ ]*[Ss][Cc][Rr][Ii][Pp][Tt]/g,"<! -- script");
        s = s.replace(/ -- script/g,"-- script");
        
        s = s.replace(/<[ ]*\/[ ]*[Ss][Cc][Rr][Ii][Pp][Tt]>/g,"<\/script -->");
    }
    //alert(s);
    return s;
}
function getHtmlBody(html,enableJS) {
    var s= html.replace(/top\.location(\.href)*[ ]*\=/g,"atoplocationhref=");
    if (!enableJS) {
        
        var bodyStart = s.indexOf("<body");
        if (bodyStart == -1)
            bodyStart = s.toLowerCase().indexOf("<body");
        if (bodyStart >0)
            s = "<div" +  s.slice(bodyStart + "<body".length);
        var bodyEnd = s.indexOf("body>");
        if (bodyEnd == -1)
            bodyEnd = s.toLowerCase().indexOf("body>");
        if (bodyEnd >0)
            s = s.slice(0,bodyEnd) + "div>";
        
        
    }
    //alert(s);
    return s;
}
function getContentType(doc) {
    var nodes = doc.getElementsByTagName("meta");
    var type= doc.contentType + "; charset=" + doc.characterSet;
    return type;
}
function getSplitBrowserForDoc(doc,clone) {
    var win = splitbrowse.getSplitBrowser(doc,true,clone);
    if (debug)
        splitbrowse.show(win);
    win.auotpagerContentDoc = doc;
    return win;
}
function simulateClick(win,node) {
    //logInfo("simulate click on:" +  node.ownerDocument.location.href,
    //	"simulate click on:" +  node.ownerDocument.location.href);
    //	alert("simulate click on:" +  node.ownerDocument.location.href);
    var evt = node.ownerDocument.createEvent("MouseEvents");
    evt.initMouseEvent("click", true, true, win,
    0, 0, 0, 0, 0, false, false, false, false, 0, null);
    var canceled = !node.dispatchEvent(evt);
    if(canceled) {
        // A handler called preventDefault
        //alert("canceled");
    } else {
        // None of the handlers called preventDefault
        //alert("not canceled");
    }
}
function processInSplitWin(doc){
    try{
        var b = getSplitBrowserForDoc(doc,false);
        //if(!b.autopagerSplitWinFirstDocloaded) {
        //    b.autopagerSplitWinFirstDocSubmited = true;
        //    b.loadURI(doc.location.href,null,null);
        //}
       // else
       {
            var node = doc.documentElement.autopagernextUrl;
            if (node.constructor == String)
                b.loadURI(doc.documentElement.autopagernextUrl,null,null);
            else {
                //alert("simulateClick");
                if (node.tagName == "A")
                    node.target = "";
                simulateClick(b.contentWindow, node);
                //alert(node.constructor);
                //splitbrowse.execute(node,"click");
            }
            
            
            //submit the split window to next page
        }
        
    }catch (e){
        alertErr("unable to load url:" + e);
    }
    
};
function processInSplitWinByUrl(doc,url){
    try{
        var win = getSplitBrowserForDoc(doc,false);
        win.loadURI(url,null,null);
    }catch (e){
        alertErr("unable to load url:" + url);
    }
    
};

function processNextDocUsingXMLHttpRequest(doc,url){
    var xmlhttp=null;
    //alert(doc.location.href);
    try{
        try{
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }catch(e){
            xmlhttp = new XMLHttpRequest();
        }
        xmlhttp.overrideMimeType(getContentType(doc));
        xmlhttp.onreadystatechange = function (aEvt) {
            if (debug)
                logInfo(xmlhttp.readyState + " " + xmlhttp.status,
                xmlhttp.readyState + " " + xmlhttp.status);
            if(xmlhttp.readyState == 4) {
                if(xmlhttp.status == 200) {
                    
                    {
                        var frame = getSelectorLoadFrame(doc);
                        frame.autoPagerInited = false;
                        frame.contentDocument.clear();
                        frame.contentDocument.documentElement.autopageCurrentPageLoaded = false;
                        //alert(xmlhttp.responseText);
                        frame.contentDocument.write(getHtmlInnerHTML(xmlhttp.responseText,doc.documentElement.enableJS,url));
                        frame.contentDocument.close();
                        setTimeout(function (){
                            if (!frame.autoPagerInited) {
                                var newDoc = frame.contentDocument;
                                //
                                frame.autoPagerInited = true;
                                scrollWindow(doc,newDoc);
                                onStopPaging(doc);
                            }
                        }
                        ,60000);
                    }
                    
                }
                else {
                    alertErr("Error loading page:" + url);
                    doc.documentElement.autopagerEnabled = true;
                    onStopPaging(doc);
                }
                
            }
        };
        xmlhttp.open("GET", url, true);
        window.content.status = "loading ... " + url;
        xmlhttp.send(null);
        
    }catch (e){
        alertErr("unable to load url:" + url);
        doc.documentElement.autopagerEnabled = true;
    }
    
};

// Evaluate an XPath expression aExpression against a given DOM node
// or Document object (aNode), returning the results as an array
// thanks wanderingstan at morethanwarm dot mail dot com for the
// initial work.
function evaluateXPath(aNode, path,enableJS) {
    var doc = (aNode.ownerDocument == null) ? aNode : aNode.ownerDocument;
    //var aNode = doc.documentElement;
    var aExpr = preparePath(doc,path,enableJS);
    var test = doc.location.href
    var found = new Array();
    try{
        //var doc = aNode.ownerDocument == null ?
        //		aNode.documentElement : aNode.ownerDocument.documentElement;
        //var result = doc.evaluate(aExpr, aNode, null, 0, null);
        
        var xpe = new XPathEvaluator();
        var nsResolver = xpe.createNSResolver(doc.documentElement);
        var result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);
        
        var res;
        while (res = result.iterateNext())
            found.push(res);
        //alert(found.length);
    }catch(e) {
        alertErr(formatString("unableevaluator",[aExpr,e]));
    }
    return found;
};
function preparePath(doc,path,enableJS) {
    //host
    //href
    //hostname
    //pathname
    //port
    //protocol
    //search
    //title
    
    var newPath = path;
    if (newPath.indexOf("%") == -1)
        return newPath;
    try{
        var href = "";
        var host= "";
        if (enableJS) {
            host = doc.location.host;
            href = doc.location.href;
        }
        else {
            href = doc.baseURI;
            host= href;
            
            //remove prototol
            host = host.substring(doc.location.protocol.length + 2);
            var port = doc.location.port + "";
            host = host.substring(0,host.indexOf("/"));
            
            if (port.length > 0)
                host = host.substring(0,host.length - port.length -1);
        }			
        newPath = newPath.replace(/\%href\%/g,"'" + href+ "'");
        newPath = newPath.replace(/\%host\%/g,"'" + host + "'");
        newPath = newPath.replace(/\%hostname\%/g,"'" + host+ "'");
        newPath = newPath.replace(/\%pathname\%/g,"'" + doc.location.pathname+ "'");
        var port = "";
        if (!doc.location.port)
            port = doc.location.port;
        newPath = newPath.replace(/\%port\%/g,			port);
        newPath = newPath.replace(/\%protocol\%/g,"'" + doc.location.protocol+ "'");
        newPath = newPath.replace(/\%search\%/g,"'" + doc.location.search+ "'");
        newPath = newPath.replace(/\%title\%/g,"'" + doc.title+ "'");
        //newPath = newPath.replace(/\%referrer\%/g,"'" + doc.referrer+ "'");
        //newPath = newPath.replace(/\%baseURI\%/g,"'" + doc.baseURI+ "'");
    }catch(e) {
        alertErr(e);
    }
    return newPath;
    
}
var xpath="//table[tbody/tr/td/@class='f']";
////a[contains(font/text(),'Next')]
///a[.//text() = '?????????']
var className = "res";
var tagName   = "DIV";


function scrollWindow(container,doc) {
    if (doc.documentElement.autopageCurrentPageLoaded != null 
        && doc.documentElement.autopageCurrentPageLoaded == true)
        return ;
    doc.documentElement.autopageCurrentPageLoaded = true;
    var de = container.documentElement;
    
    try{
        if (debug)
            logInfo("scrollWindow","scrollWindow");
        var nextUrl=de.autopagernextUrl;
        //if (nextUrl == null)
        //	return;
        var xpath = de.contentXPath;
        //alert(doc);
        //alert(doc.innerHTML);
        
        var nodes = findNodeInDoc(doc,xpath,de.enableJS);
        
        logInfo(nodes.length + " at "+  doc.location.href
        ,nodes.length + " at "+  doc.location.href);
        
        if (nodes.length >0)
        {
            //alert(nodes);
            var i=0;
            var divStyle = loadUTF8Pref("pagebreak");// "clear:both; line-height:20px; background:#E6E6E6; text-align:center;";
            var div= createDiv(container,"",divStyle); 

            div.innerHTML = "<span>" + formatString("pagebreak",[nextUrl,++de.autoPagerPage]) + "</span>";
            var insertPoint =	de.autopagerinsertPoint;

            insertPoint.parentNode.insertBefore(div,insertPoint);
            for(i=0;i<nodes.length;++i) {
                try{
                    var newNode = insertPoint.parentNode.insertBefore(nodes[i].cloneNode(true),insertPoint);
                }catch(e) {
                    alertErr(e);
                }
            }
            //alert(nodes.length);
            var urlNodes = findNodeInDoc(doc,de.linkXPath,de.enableJS);
            //alert(urlNodes);
            if (urlNodes != null && urlNodes.length >0) {
                nextUrl = getNextUrl(container,de.enableJS,urlNodes[0]);
            }else
                nextUrl = null;
            //alert(nextUrl);
            de.autopagernextUrl = nextUrl;
            //container.close();
        }
    }catch(e) {
        alertErr(e);
    }

   if (doc.defaultView.frames != null) {
        //alert(doc.defaultView.frames.length);
        var i=0;
        for(i=0;i<doc.defaultView.frames.length;++i) {
            //alert(doc.defaultView.frames[i]);
            scrollWindow(container,doc.defaultView.frames[i].document);
            //doc.defaultView.frames[i].addEventListener("load", onPageLoad, true);
        }
    }
};
function getNextUrl(container,enableJS,node) {
    if(node == null)
        return null;
    if (!enableJS && node.tagName == "A")
        return fixUrl(container,node.href);
    if (node.tagName == "INPUT")
        return node;
    return node;
    
}
function onStartPaging(doc) {
    doc.documentElement.autopagerPagingCount ++;
    try{
        logInfo(formatString("autopaging",[ doc.location.href]),
        formatString("autopaging",[ doc.location.href]));
    }catch(e) {		
    }
    pagingWatcher();
}
function onStopPaging(doc) {
    try{
        logInfo(formatString("autopageOn",[doc.location.href]),
        formatString("autopageOnTip",[doc.location.href]));
    }catch(e) {		
    }
    doc.documentElement.autopagerEnabled = true;
    if (doc.documentElement.autopagerPagingCount>0)
        doc.documentElement.autopagerPagingCount--;
    if (doc.documentElement.autopagerPagingCount == 0)
    {
        //.defaultView.top.content.document
                hiddenDiv(getPagingWatcherDiv(doc),true);
            setGlobalImageByStatus(getGlobalEnabled());
    }
}
function getPagingWatcherDiv(doc)
{
	var divName = "autoPagerBorderPaging";
    var div = doc.getElementById(divName);
    if (!div) {
        var str = getString("loading");
    var style = getLoadingStyle();
        div = createDiv(doc,divName,style);
        div.innerHTML = str;//"<b>Loading ...</b>";
        
    }
    return div;
	
}
function  pagingWatcher() {
    var doc = content.document;
    var de = doc.documentElement;
    try{
        if(getGlobalEnabled() && de.autopagerEnabledDoc!=null) {
    	
            
            var i =0;
            var Enable = false;
            var loading = false;
            for(i=0;i<de.autopagerEnabledDoc.length;i++) {
                doc = de.autopagerEnabledDoc[i];
                Enable = doc.documentElement.autopagerPagingCount>0;
                if (Enable) {
                     hiddenDiv(getPagingWatcherDiv(doc),false);
                    loading = true;
                }
            }
            if (loading)
                {
                    document.autoPagerImageShowStatus = !document.autoPagerImageShowStatus;
                    setGlobalImageByStatus(document.autoPagerImageShowStatus);
                    var self = arguments.callee;
                    setTimeout(self, 100);//10 +Math.random()*200);                    
                }
            
        }
        else {
            hiddenDiv(getPagingWatcherDiv(doc),true);
            setGlobalImageByStatus(getGlobalEnabled());
        }
    }catch(e) {
        setGlobalImageByStatus(getGlobalEnabled());
        hiddenDiv(getPagingWatcherDiv(doc),true);
    }
    
};

function fixUrl(doc,url) {
    if (url.toLowerCase().indexOf("javascript")!=-1)
        eval(url);
    return url;
    if(url.indexOf(doc.location.protocol) == 0)
        return url
        //alert(doc.location);
        var newStr=doc.location.protocol +"//"+ doc.location.host;
    if ( doc.location.port.length >0)
        newStr += ":" + doc.location.port;
    //
    if(url.substring(0,1) != "/")
        newStr += doc.location.pathname.substring(0, 
        doc.location.pathname.lastIndexOf("/")+1);
    newStr += url;
    //alert(newStr);
    return  newStr;
}
function findNodeInDoc(doc,path,enableJS) {
    xpath = path;
    if (xpath[0].length == 1)
        return evaluateXPath(doc,xpath,enableJS);
    else {
        var result = evaluateXPath(doc,xpath[0],enableJS);
        for(var i=1;i<xpath.length;i++) {
            var nodes = evaluateXPath(doc,xpath[i],enableJS);
            for(var k=0;k<nodes.length;++k) {
                result.push( nodes[k]);
            }
        }
        return result;
    }
    
};
function xPathTest(doc) {
    if (!doc.xTestLastDoc)
        doc.xTestLastDoc = doc;
    xTestXPath(doc,xpath);
}
function xTestXPath(doc,path) {
    
    var newpath = path;//prompt("Please input the xpath:",path);
    if (document.autopagerXPathModel != "wizard") {
        newpath =prompt("Please input the xpath:",path);
        }
    if (!newpath || newpath.length==0)
        return;
    xpath = newpath;
    var found = evaluateXPath(doc,xpath,false);
    if (found==null || found.length ==0) {
        //try on all frame
         if (document.autopagerXPathModel != "wizard") {
            if (doc.defaultView.frames != null) {
                //alert(doc.defaultView.frames.length);
                var i=0;
                for(i=0;i<doc.defaultView.frames.length;++i) {
                    found = evaluateXPath(doc.defaultView.frames[i].document,xpath,false);
                    if (found!=null && found.length >0)
                        break;
                }
            }

         }
         if (found==null || found.length ==0) 
        {
                alert(getString("xpathreturnnothing"));
                return;
        }
    }
    
    var w=window.open();
    var newDoc = 	w.document;
    createDiv(newDoc,"","").innerHTML = "<h1>Result for XPath: " + xpath + "</h1><br/>" ;
    for(var i=0;i<found.length;++i) {
        try{
            //alert(found[i].tagName);
            var div = createDiv(newDoc,"","");
            div.appendChild(found[i].cloneNode(true));
        }catch(e) {
            alertErr(e);
        }
    }
    
    return newpath;
}

function showAutoPagerMenu() {
    showMyName();
    
    var popup = document.getElementById("autopager-popup");
    popup.addEventListener("popuphidden", function(ev) {
        if(ev.currentTarget != ev.target) return;
        ev.target.removeEventListener("popuphidden", arguments.callee, false);
    }, false);    
    popup.showPopup();
    
}
function onEnable() {
    var enabled = !getGlobalEnabled();
    setGlobalEnabled( enabled);
}
function statusClicked(event) {
    if(event.currentTarget != event.target) return;
    if(event.button == 2) {
        showAutoPagerMenu();
    }
    else if(event.button == 0) {
        var image = document.getElementById("autopager_image");
        var enabled = !getGlobalEnabled();
        setGlobalEnabled( enabled);
    }
}
function setGlobalImageByStatus(enabled) {
    try{
        if (enabled)
            setGlobalStatusImage("chrome://autopager/skin/autopager-small.on.gif");
        else
            setGlobalStatusImage("chrome://autopager/skin/autopager-small.off.gif");
    }catch(e) {
        //alert(e);
    }
}
function setGlobalStatusImage(url) {
    var image = document.getElementById("autopager_image");
    image.src=url;
}
function getGlobalEnabled() {
    try{
        if (!document.autoGlobalPagerEnabled)
            return false;
        else
            return true;
    }catch(e) {
        alertErr(e);
        return false;
    }
}
function saveEnableStat(enabled) {
    getPrefs().setBoolPref(".enabled", enabled); // set a pref
}
function loadEnableStat() {
    return getPrefs().getBoolPref(".enabled"); // get a pref
}
function saveMyName(myname) {
    saveUTF8Pref("myname", myname); // set a pref
}
function loadMyName() {
    try{
        
        return loadUTF8Pref("myname"); // get a pref
    }catch(e) {
        //alertErr(e);
    }
    return "";
}
function getLoadingStyle()
{
 try{
        
        return loadUTF8Pref("loading"); // get a pref
    }catch(e) {
        //alertErr(e);
    }
    return "";
}
function setLoadingStyle(value)
{
 try{
        
        saveUTF8Pref("loading",value); // get a pref
    }catch(e) {
        //alertErr(e);
    }
}
function loadUTF8Pref(name) {
    var unicodeConverter = Components
    .classes["@mozilla.org/intl/scriptableunicodeconverter"]
    .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
    unicodeConverter.charset = "utf-8";
    var str = loadPref(name);
    try{
        return unicodeConverter.ConvertToUnicode(str);
    }catch(e) {
        return str;
    }	  	
}
function saveUTF8Pref(name,value) {
    var unicodeConverter = Components
    .classes["@mozilla.org/intl/scriptableunicodeconverter"]
    .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
    unicodeConverter.charset = "UTF-8";
    try{
        savePref(name,unicodeConverter.ConvertFromUnicode(value));
    }catch(e) {
        savePref(name,value);
    }	  	
}
function loadPref(name) {
    try{
        
        return getPrefs().getCharPref("." +  name); // get a pref
    }catch(e) {
        //alertErr(e);
    }
    return "";
}
function loadBoolPref(name) {
    try{
        
        return getPrefs().getBoolPref("." +  name); // get a pref
    }catch(e) {
        //alertErr(e);
    }
    return "";
}
function savePref(name,value) {
    try{
        
        return getPrefs().setCharPref("." +  name,value); // set a pref
    }catch(e) {
        //alertErr(e);
    }
    return "";
}
function saveBoolPref(name,value) {
    try{
        
        return getPrefs().setBoolPref("." +  name,value); // get a pref
    }catch(e) {
        //alertErr(e);
    }
    return "";
}
function setGlobalEnabled(enabled) {
    
    if (document.autoGlobalPagerEnabled != enabled) {
        saveEnableStat(enabled);
    }
    document.autoGlobalPagerEnabled = enabled;
    setGlobalImageByStatus(enabled);
    if (enabled)
        logInfo(getString("autopageenabled"),getString("autopageenabledTip"));
    else
        logInfo(getString("autopagedisabled"),getString("autopagedisabledTip"));
    var enableMenuItem = document.getElementById("autopager-enabled");
    enableMenuItem.setAttribute("checked",enabled);	  		  
}
function logInfo(status,tip) {
    if (debug) {
        logInfoDebug(status,tip);
        return;
    }
    try{
        window.content.status = status;
    var tooltip = document.getElementById("autopager_tip");
    
    var tips = tip.split("\n");
    var i;
    while(tooltip.childNodes.length < tips.length)
        tooltip.appendChild(tooltip.childNodes[0].cloneNode(true));
    for(i=0;i< tooltip.childNodes.length;++i) {
        tooltip.childNodes[i].hidden=(i >= tips.length);
    }
    
    for(i=0;i<tips.length;i++)
        tooltip.childNodes[i].value = tips[i];
  }catch(e){}
}
function logInfoDebug(status,tip) {
    window.content.status = status;
    var tooltip = document.getElementById("autopager_tip");
    
    var tips = tip.split("\n");
    var tipCount = tooltip.childNodes.length;
    var i;
    for(i=0;i<tips.length;++i)
        tooltip.appendChild(tooltip.childNodes[0].cloneNode(true));
    for(i=0;i<tips.length;i++)
        tooltip.childNodes[i+tipCount].value = tips[i];
}

function openSetting(url) {
    window.autopagerSelectUrl=url;
    window.open("chrome://autopager/content/autopager.xul", "autopager",
    "chrome,resizable,centerscreen");
}

function showMyName(){
    try{
        var myname = document.getElementById("autopager-myname");
        myname.label = formatString("myname" ,[loadMyName()]);
    }catch(e) {
        
    }
}
function changeMyName() {
    var name = prompt(getString("inputname")
    ,loadMyName());
    if (name!=null && name.length>0) {
        saveMyName(name);
        showMyName();
    }
    return name;
}
function alertErr(e) {
    logInfo(e,e);
    if (debug)
        alert(e);
}