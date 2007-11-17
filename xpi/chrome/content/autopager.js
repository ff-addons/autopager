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
autopagerOnLoad();
var autopagerPrefs = null;
var debug= false;
var workingAutoSites=null;
var workingAllSites=null;
var autopagerConfirmSites = null;
 
function autopagerOnLoad() {
    window.addEventListener("DOMContentLoaded", onContentLoad, false);
    //window.addEventListener("beforeunload", onPageUnLoad, true);
    window.addEventListener("select", onSelect, true);
    autopagerConfirmSites = loadConfirm();
    
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
        enableSelector(doc.defaultView.top.document,true);
    }
}
function enableSelector(doc,setMenuStatus) {
    if (!(doc instanceof HTMLDocument))
    {
        return;
    }
    
    try{
    var de = doc.documentElement;
    
    //alert(doc);
    if (de.autoPagerSelectorEnabled) {
        doc.removeEventListener("mouseover", onXPathMouseOver, false);
        doc.removeEventListener("keyup", escToExitCreateModel, false);
        de.autoPagerSelectorEnabled = false;
        removeStyleSheetFromDoc(doc,"chrome://autopager/content/EditorContent.css");
        removeStyleSheetFromDoc(doc,"chrome://autopager/content/EditorAllTags.css");
        hiddenRegionDivs(doc,"");
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
            var msg = getString("esctoabort");
            alert(msg);
            logInfo(msg,msg);
        }
        document.getElementById("autoPagerCreateXPath").setAopenSettingttribute("checked",
                de.autoPagerSelectorEnabled);
    }
    if (doc.defaultView.frames != null) {
        //alert(doc.defaultView.frames.length);
        var i=0;
        for(i=0;i<doc.defaultView.frames.length;++i) {
            enableSelector(doc.defaultView.frames[i].document,false);
        }
    }
    }catch(e){}
};

function onPageUnLoad(event) {
    
    try
    {
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

        splitbrowse.close(doc);
    }catch(e){}
}

function onContentLoad(event) {
    var doc = event.target;// event.originalTarget;
    if (doc == null)
        return;
    if (doc.defaultView == null)
        return;
    if (!(doc instanceof HTMLDocument))
        {
            return;
        }
    if (!document.autoPagerInited) {
        document.autoPagerInited = true;
        setGlobalEnabled(loadEnableStat());
        window.setTimeout(function(){autopagerUpdate();},400);
   }
    setGlobalImageByStatus(getGlobalEnabled());
    try{
        hiddenDiv(getPagingWatcherDiv(doc),true);
        document.getElementById("autoPagerCreateXPath").setAttribute("checked", false);	
    }catch(e){}
    
    var browser = splitbrowse.getBrowserNode(doc);
    if (!browser.getAttribute(splitbrowse.getSplitKey()))
    {
        handleDocLoad(doc,false);
     }
  }
  function onSplitDocLoaded(doc,safe) {
    var browser = splitbrowse.getBrowserNode(doc);
    if (browser.getAttribute(splitbrowse.getSplitKey())) {
        if (browser.auotpagerContentDoc) {
            {
                if (browser.autopagerSplitWinFirstDocSubmited) {
                    if(!browser.autopagerSplitWinFirstDocloaded) {
                        if (doc.defaultView != doc.defaultView.top)
                               return;
                        var nextUrl = null;
                        
                        var container = browser.auotpagerContentDoc;
                        var de = container.documentElement.QueryInterface(Components.interfaces.nsIDOMElement);
                        //var doc = browser.webNavigation.document;
                        if (container.documentElement.getAttribute('fixOverflow') == 'true')
                            fixOverflow(doc);
                        
                        nextUrl = getNextUrlIncludeFrames(container,doc);
                        container.documentElement.autopagernextUrl = nextUrl;
                        browser.autopagerSplitWinFirstDocloaded = true;
                        container.documentElement.autopagerSplitDocInited = true;
                        scrollWatcher();
                    }
                    else {
                        scrollWindow(browser.auotpagerContentDoc,doc);
                        onStopPaging(browser.auotpagerContentDoc);
                    }
                }
            }
            
        }
        
        return;
    }

}
function handleDocLoad(doc,safe)
{
    //workingAutoSites = loadConfig();
    workingAllSites = UpdateSites.loadAll();
            
    var tmpSites = loadTempConfig();
    tmpSites.updateSite = new UpdateSite("Wind Li","all",
                        "","text/html; charset=utf-8",
                        "smart paging configurations",
                        "smartpaging.xml",null);
    workingAllSites[tmpSites.updateSite.filename] = tmpSites;
    onInitDoc(doc,safe);
}
function getNextUrlIncludeFrames(container,doc)
{
    var urlNodes = findNodeInDoc(doc,
            container.documentElement.getAttribute('linkXPath'),container.documentElement.getAttribute('enableJS') == 'true');
    //alert(urlNodes);
    var nextUrl = null;
    if (urlNodes != null && urlNodes.length >0) {
        nextUrl = getNextUrl(container,container.documentElement.getAttribute('enableJS') == 'true',urlNodes[0]);
    }else
    {
        if (doc.defaultView.frames != null) {
            //alert(doc.defaultView.frames.length);
            var i=0;
            for(i=0;i<doc.defaultView.frames.length;++i) {
                nextUrl = getNextUrlIncludeFrames(container,doc.defaultView.frames[i].document);
                if ( nextUrl != null)
                    return nextUrl;
            }
        }
     }    
    return nextUrl;
}
function loadTempConfig() {
    var sites = new Array();
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
            site.guid="autopagertemp";
            sites.push(site);
            //alert(linkXPath);
        }
    }
    return sites;
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
        try{
            autopagerPrefs=autopagerPrefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
        }catch(e){}
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
            if ( (node.style.position == "fixed" || node.style.position == "absolute" ) && node.className != "autoPagerS")
                node.style.position = "relative"; 
        }
    }
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
    if (doc.location == null)
        return;
    
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
    workingAutoSites= UpdateSites.getMatchedSiteConfig(workingAllSites,url);
    for(i=0;i<workingAutoSites.length;++i) {
        var pattern = getRegExp(workingAutoSites[i]);
        if (pattern.test(url)) {
            //should not equal
            //if (workingAutoSites[i].quickLoad == safe)
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
                de.autopagerGUID = workingAutoSites[i].guid;
                de.margin = workingAutoSites[i].margin;
                de.enabled = workingAutoSites[i].enabled;
                //if (workingAutoSites[i].enabled)
                de.autopagerSplitDocInited = false;
                de.setAttribute('enableJS', workingAutoSites[i].enableJS);
                if (!de.autopagerPagingCount)
                    de.autopagerPagingCount = 0;
                if (!de.autoPagerPage)
                    de.autoPagerPage = 0;
                if (autopagerConfirmSites == null)
                    autopagerConfirmSites = loadConfirm();
                var siteConfirm = findConfirm(autopagerConfirmSites,workingAutoSites[i].guid,doc.location.host);
                if (siteConfirm!=null)
                {
                    de.autopagerUserConfirmed= true;
                    de.autopagerSessionAllowed= siteConfirm.UserAllowed;
                    de.autopagerAllowedPageCount=siteConfirm.AllowedPageCount;
                    de.autopagerUserAllowed=siteConfirm.UserAllowed;
                }

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
                de.setAttribute('linkXPath',workingAutoSites[i].linkXPath);
                
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
                de.setAttribute('fixOverflow',workingAutoSites[i].fixOverflow);
                if (autopagerEnabled) {
                     if(workingAutoSites[i].fixOverflow)
                        fixOverflow(doc);

                    var topDoc = doc.defaultView.top.document;
                    if (!topDoc.documentElement.autopagerEnabledDoc)
                        topDoc.documentElement.autopagerEnabledDoc = new Array();
                    topDoc.documentElement.autopagerEnabledDoc.push( doc);
                    try{
                        if (workingAutoSites[i].enableJS) {
                            //doc = doc.QueryInterface(Components.interfaces.nsIDOMDocument);
                            var splitbrowser = getSplitBrowserForDoc(doc,true);
                            //splitbrowser.autopagerSplitWinFirstDocloaded = false;
                            //splitbrowser.autopagerSplitWinFirstDocSubmited = true;
                        }
                    }catch(e)
                    {}				
                    
                    scrollWatcher();
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
    var linkXPath = doc.documentElement.getAttribute('linkXPath');
    if (nextUrl != null && ( typeof(nextUrl) =='string' || !nextUrl.getAttribute("disabled")))
    {
            onStartPaging(doc);
            processNextDoc(doc,nextUrl);
    }
};

function getEnabledAutopagingPage(doc) {
    var enabled =doc.documentElement.autopagerEnabled && getGlobalEnabled();
    enabled = enabled && ( !(doc.documentElement.getAttribute('enableJS') == 'true')  || doc.documentElement.autopagerSplitDocInited );
    return  enabled;
};
var count=0;
function  scrollWatcher() {
    
    try{
        var i =0;
        if (debug)
            logInfo(count,"Enter scrollWatcher");
        var de = content.document.documentElement;
        if (de.autopagerEnabledDoc != null)
       {
            for(i=0;i<de.autopagerEnabledDoc.length;i++) {
                var doc = de.autopagerEnabledDoc[i];
                if (doc.location != null)
               {
                    var Enable = getEnabledAutopagingPage(doc);
                    if (Enable) {
                        if (debug)
                            logInfo(count+ "Enabled " + doc.location.href,count+ "Enabled " + doc.location.href);
                        try{
                            var scrollDoc =doc; 

                            var sc = (scrollDoc.documentElement && scrollDoc.documentElement.scrollTop)
                                    ? scrollDoc.documentElement.scrollTop : scrollDoc.body.scrollTop;
                            var sh = (scrollDoc.documentElement && scrollDoc.documentElement.scrollHeight)
                                    ? scrollDoc.documentElement.scrollHeight : scrollDoc.body.scrollHeight;
                            if (scrollDoc.body != null && scrollDoc.body.scrollHeight > sh)
                                sh = scrollDoc.body.scrollHeight;

                            var wh = window.innerHeight;//scrollDoc.defaultView.innerHeight ? scrollDoc.defaultView.innerHeight : scrollDoc.documentElement.clientHeight;

                            var remain = sh - sc - wh;
                            count++;
                            if (debug)
                                logInfo(count + ": Auto pager wh:" + wh+ " sc:" + sc + " remain: " + remain,
                                    "sh=" + sh + " sc = " + sc + " wh= " + wh + " Auto pager remain: " + remain + ".\nremain < " + wh+" will auto page.");

                            //alert(wh);
                            if (debug)
                                wh = wh * (doc.documentElement.margin*1 + 1.5);
                            else
                                wh = wh * (doc.documentElement.margin * 1);
                            //alert(wh);

                            if(remain < wh ){
                                //alert(remain + "   " + wh + "  "  + sh + " " + sc);
                                doc.documentElement.autopagerEnabled = false;
                                if (!doc.documentElement.autopagerUserConfirmed
                                    || (doc.documentElement.autopagerSessionAllowed && doc.documentElement.autopagerAllowedPageCount== doc.documentElement.autoPagerPage)
                                )
                                    hiddenDiv(getPagingOptionDiv(doc),false);
                                else
                                if (doc.documentElement.autopagerUserConfirmed
                                    && doc.documentElement.autopagerUserAllowed
                                    && ( doc.documentElement.autopagerAllowedPageCount < 0
                                                ||  doc.documentElement.autopagerAllowedPageCount> doc.documentElement.autoPagerPage)
                                )
                                    do_request(doc);
                                
                                    
                            }
                        }catch(e){
                            alertErr("Exception:" + e);
                        }
                     }
                }
            }
         }
    }catch(e){
       alertErr("Exception:" + e);
   }
        
    var self = arguments.callee;
    setTimeout(self,400);
    
};
function  showAllPagingOptions() {
    
    try{
        var showedCount = 0;
        var i =0;
        if (debug)
            logInfo(count,"Enter showAllPagingOptions");
        var de = content.document.documentElement;
        if (de.autopagerEnabledDoc != null)
       {
            for(i=0;i<de.autopagerEnabledDoc.length;i++) {
                var doc = de.autopagerEnabledDoc[i];
                if (doc.location != null)
               {
                     hiddenDiv(getPagingOptionDiv(doc),false);
                     showedCount ++;
                }
            }
         }
         if (showedCount==0)
        {
            alert(getString("nomatchedconfig"));
        }
    }catch(e){
       alertErr("Exception:" + e);
   }
    
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
        div = createDiv(doc,divName,style);
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
     //       frame.removeEventListener("DOMContentLoaded", onFrameLoad, false);
            frame.removeEventListener("load", onFrameLoad, false);
    }catch(e){}
   // if (doc.documentElement.autopagerUseSafeEvent)
        frame.addEventListener("load", onFrameLoad, false);
  //  else
  //      frame.addEventListener("DOMContentLoaded", onFrameLoad, false);
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
function hiddenRegionDivs(doc,subfix) {
    var leftDiv =getSelectorDiv(doc,"autoPagerBorderLeft" + subfix);
    var rightDiv =getSelectorDiv(doc,"autoPagerBorderRight" + subfix);
    var topDiv =getSelectorDiv(doc,"autoPagerBorderTop" + subfix);
    var bottomDiv =getSelectorDiv(doc,"autoPagerBorderBottom" + subfix);
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
    createRegionDivs(doc,target,"");
}    
function createRegionDivs(doc,target,subfix) {
    var margin = 2;
    var leftDiv =getSelectorDiv(doc,"autoPagerBorderLeft" + subfix);
    var rightDiv =getSelectorDiv(doc,"autoPagerBorderRight" + subfix);
    var topDiv =getSelectorDiv(doc,"autoPagerBorderTop" + subfix);
    var bottomDiv =getSelectorDiv(doc,"autoPagerBorderBottom" + subfix);
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
            while (site.owner.length == 0)
                site.owner = changeMyName();
            //general link
            if (target.tagName == "A" && target.href.toLowerCase().indexOf("javascript") == -1)
                site.enableJS = false;
            else
                site.enableJS = true;
            workingAutoSites = loadConfig();
            insertAt(workingAutoSites,0,site);
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
    var target = null;
     if (event.target != null)
        target = event.target;
    else if (event.originalTarget != null)
        target = event.originalTarget;
    else
        target = event.currentTarget;
    //alert(target);
    var frame=target;
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
    if (doc.documentElement.getAttribute('enableJS') == 'true') {
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
    
    var browse = splitbrowse.getSplitBrowser(doc,true,clone);
    splitbrowse.setVisible(browse,debug);
    if (clone)
        browse.auotpagerContentDoc = doc;
    return browse;
}
function simulateClick(win,node) {
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
        var node = doc.documentElement.autopagernextUrl;
        if (node.constructor == String)
            b.loadURI(doc.documentElement.autopagernextUrl,null,null);
        else {
            //alert("simulateClick");
            if (node.tagName == "A")
                node.target = "_self";
            simulateClick(b.contentWindow, node);
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
                        var frame = getSelectorLoadFrame(doc);
                        frame.autoPagerInited = false;
                        frame.contentDocument.clear();
                        frame.contentDocument.documentElement.autopageCurrentPageLoaded = false;
                        //alert(xmlhttp.responseText);
                        frame.contentDocument.write(getHtmlInnerHTML(xmlhttp.responseText,doc.documentElement.getAttribute('enableJS') == 'true',url));
                        xmlhttp.abort();
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
        var xpath = de.contentXPath;
        
        var nodes = findNodeInDoc(doc,xpath,de.getAttribute('enableJS') == 'true');
        
        logInfo(nodes.length + " at "+  doc.location.href
                ,nodes.length + " at "+  doc.location.href);
        
        if (nodes.length >0)
        {
            if (debug)
                logInfo(nodes.toString(),nodes.toString());
            //alert(nodes);
            var i=0;
            var divStyle = loadUTF8Pref("pagebreak");// "clear:both; line-height:20px; background:#E6E6E6; text-align:center;";
            var div= createDiv(container,"",divStyle); 

            div.innerHTML = "<span>" + formatString("pagebreak",[nextUrl,++de.autoPagerPage]) + "</span>";
            var insertPoint =	de.autopagerinsertPoint;

            insertPoint.parentNode.insertBefore(div,insertPoint);
            for(i=0;i<nodes.length;++i) {
                try{
                    var newNode = insertPoint.parentNode.insertBefore(container.importNode (nodes[i],true),insertPoint);
                }catch(e) {
                    alertErr(e);
                }
            }
            //alert(nodes.length);
            var urlNodes = findNodeInDoc(doc,de.getAttribute('linkXPath'),de.getAttribute('enableJS') == 'true');
            //alert(urlNodes);
            if (urlNodes != null && urlNodes.length >0) {
                nextUrl = getNextUrl(container,de.getAttribute('enableJS') == 'true',urlNodes[0]);
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
function getPagingOptionDiv(doc)
{
	var divName = "autoPagerBorderOptions";
    var div = doc.getElementById(divName);
    if (!div) {
        var str = "<div style='cursor:move;height:18px;background-color: gray;margin:0px;' class='autoPagerS' "
  + " onmouseover='document.documentElement.setAttribute(\"over\",true);' onmouseout='document.documentElement.setAttribute(\"over\",false);'>"
+"<table valign='top' cellpadding='0' cellspacing='0' id='autoPagerBorderOptionsTitle' class='autoPagerS' style='margin:0px;width:100%'>"
+"<tbody class='autoPagerS'><tr class='autoPagerS' ><td class='autoPagerS'  width='90%'><a  href='javascript:showConfirmTip();'><b class='autoPagerS'>"
+getString("optiontitle") + "</b></a></td><td class='autoPagerS'  width='10%' align='right'><a href='javascript:enabledInThisSession(false)'>"
+ "<img  class='autoPagerS'  style='border: 0px solid ; width: 9px; height: 7px;' alt='Close'  src='chrome://autopager/content/images/vx.png'></a></td></tr></tbody></table></div> "
+ "<ul class='autoPagerS' style='margin-left:0;margin-top:0; margin-bottom:0;'>"
+"<li class='autoPagerS'><a href='javascript:HighlightNextLinks()''>"+ getString("highlightnextlinks") +"</a></li>"
+ "<li class='autoPagerS'><a href='javascript:enabledInThisTime(true)'>"+ getString("enableshort") +"</a>/<a href='javascript:enabledInThisTime(false)'>D</a>:"
+ getString("thistime") + "</li>"
+ "<li class='autoPagerS'><a href='javascript:enabledInThisSession(true)'>"+ getString("enableshort") +"</a>/<a"
+ " href='javascript:enabledInThisSession(false)'>"+ getString("disableshort") +"</a>:"
+ getString("thissession") + "</li>"
+ "<li class='autoPagerS'><a href='javascript:enabledInNextPagesAlways(false)'>"+ getString("enableshort") +"</a>/<a"
+ " href='javascript:enabledInNextPagesAlways(true)'>"+ getString("alwaysenableshort") +"</a>:"
+ formatString("nextpages",["<input  class='autoPagerS' maxlength='3' size='1' id='autopagercount' value='3'>"]) +"</li>"
+ "<li class='autoPagerS'><a href='javascript:enabledThisSite(true)'>"+ getString("alwaysenableshort") +"</a>/<a"
+ " href='javascript:enabledThisSite(false)'>"+ getString("alwaysdisableshort") +"</a>:"
+ getString("thissite") + "</li></ul>";
    var style = getOptionStyle();
    
        div = createDiv(doc,divName,style);
        if (div.style.width == "")
            div.style.width = "190px";
        div.innerHTML = str;//"<b>Loading ...</b>";
        var links=evaluateXPath(div,".//a",false);
        for(var i=0;i<links.length;i++)
        {
            links[i].addEventListener("click",onConfirmClick,true);
             links[i].title = getString("optionexplain");
             links[i].style.color="rgb(0,0,204)";
             links[i].className = 'autoPagerS';
        }
        doc.addEventListener("mousedown",initializedrag,false);
        doc.addEventListener("mouseup",stopdrag,false);
         
    }
    
    return div;
	
}
function showConfirmTip()
{
    alert(getString("optionexplain"));
}
function stopdrag(event){
    var div=event.target;
    var doc = event.target.ownerDocument;
    doc.removeEventListener("mousemove",dragdrop,false);
    doc.removeEventListener("selectstart",selectstart,true);
}

function initializedrag(event)
{
    var doc = event.target.ownerDocument;
    //alert(doc.documentElement);
    //alert(doc.documentElement.over);
    if (doc.documentElement.getAttribute("over")=='true')
    {
            var objDiv = doc.getElementById("autoPagerBorderOptions");
            doc.documentElement.startX = window.innerWidth - event.pageX - parseInt(objDiv.style.right);
            doc.documentElement.startY = window.innerHeight - event.pageY - parseInt(objDiv.style.bottom);
            doc.addEventListener("mousemove",dragdrop,false);
            doc.addEventListener("selectstart",selectstart,true);
            return false;
    }
    
}
function selectstart(event)
{
    event.preventDefault();
    return false;
}
function dragdrop(event)
{
    var div=event.target;
    var doc = event.target.ownerDocument;
    var objDiv = doc.getElementById("autoPagerBorderOptions");
    
    //if (doc.documentElement.getAttribute("over")=='true')
    {
            objDiv.style.right=(window.innerWidth - event.pageX -  doc.documentElement.startX) + 'px';
            objDiv.style.bottom=(window.innerHeight - event.pageY - doc.documentElement.startY ) + 'px';
    }
    
}
function onConfirmClick(event)
{
    event.preventDefault();
    var link = event.target;
    if (link.tagName.toLowerCase() != "a")
        link = link.parentNode;
    var exp = link.href;
    document.autopagerConfirmDoc = link.ownerDocument;
    
    eval(exp);
    document.autopagerConfirmDoc = null;
}
function HighlightNextLinks()
{
    var doc=document.autopagerConfirmDoc ;
    var urlNodes = findNodeInDoc(doc,
            doc.documentElement.getAttribute('linkXPath'),doc.documentElement.getAttribute('enableJS') == 'true');
    if (urlNodes == null || urlNodes.length == 0)
        return;
    for(var i=0;i<urlNodes.length;i++)
        createRegionDivs(doc,urlNodes[i],i);
    doc.documentElement.autopagerHighlightedNextLinkCount = urlNodes.length;
    if(doc.documentElement.autopagerHighlightedNextLinkNumber == null)
        doc.documentElement.autopagerHighlightedNextLinkNumber = 0;
    if (doc.documentElement.autopagerHighlightedNextLinkNumber >= urlNodes.length)
        doc.documentElement.autopagerHighlightedNextLinkNumber  = 0;
    var node = urlNodes[doc.documentElement.autopagerHighlightedNextLinkNumber];
    var left = getOffsetLeft(node);
    var top = getOffsetTop(node);
    doc.defaultView.scrollTo(left,top);
    node.focus();

    doc.documentElement.autopagerHighlightedNextLinkNumber ++;
}
function enabledInNextPagesAlways(always)
{
    var doc=document.autopagerConfirmDoc ;
    var count = doc.getElementById("autopagercount").value;
    var countNumber = parseInt(count);
    if (isNaN(countNumber))
    {
        alert("please input a integer.");
        return;
    }
    enabledInNextPages(true,countNumber);
    if (always)
    {
        var host = doc.location.host;
        var guid = doc.documentElement.autopagerGUID;
        autopagerConfirmSites = loadConfirm();
        addConfirm(autopagerConfirmSites,guid,countNumber,host,true);
        saveConfirm(autopagerConfirmSites);
    }
}
function enabledInThisTime(enabled)
{
    enabledInNextPages(enabled,1);
}
function enabledInNextPages(enabled,count)
{
    var doc = document.autopagerConfirmDoc;
    var de =doc.documentElement;
    de.autopagerUserConfirmed= true;
    de.autopagerSessionAllowed= true;
    de.autopagerAllowedPageCount=de.autoPagerPage+count;
    de.autopagerUserAllowed=enabled;
    de.autopagerEnabled = enabled;
     hiddenOptionDiv(doc);
}
function hiddenOptionDiv(doc)
{
    hiddenDiv(getPagingOptionDiv(doc),true);
    for(var i=0;i<doc.documentElement.autopagerHighlightedNextLinkCount;i++)
        hiddenRegionDivs(doc,i);
}
function enabledThisSite(enabled)
{
    enabledInThisSession(enabled);
    var doc = document.autopagerConfirmDoc;
    var host = doc.location.host;
    var guid = doc.documentElement.autopagerGUID;
    autopagerConfirmSites = loadConfirm();
    addConfirm(autopagerConfirmSites,guid,-1,host,enabled);
    saveConfirm(autopagerConfirmSites);
}
function enabledInThisSession(enabled)
{
    var doc = document.autopagerConfirmDoc;
    var de =doc.documentElement;
    de.autopagerUserConfirmed= true;
    de.autopagerSessionAllowed= enabled;
    de.autopagerAllowedPageCount=-1;
    de.autopagerUserAllowed=enabled;
    de.autopagerEnabled = enabled;
     hiddenOptionDiv(doc);
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
                    setTimeout(self, 300);//10 +Math.random()*200);                    
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
            div.appendChild(newDoc.importNode( found[i],true));
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
function getOptionStyle()
{
 try{
        
        return loadUTF8Pref("optionstyle"); // get a pref
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

function openSettingForDoc(doc)
{
     var url = content.document.location.href;
     try{
         var de = doc.documentElement;
         if (de.autopagerEnabledDoc != null && de.autopagerEnabledDoc.length >0)
         {
             var i=0;
             while(de.autopagerEnabledDoc[i].location == null && i< de.autopagerEnabledDoc.length )
                i++;
              if (i<de.autopagerEnabledDoc.length )
                url = de.autopagerEnabledDoc[i].location.href;
         }
     }catch(e){}
     openSetting(url);
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
    var name = prompt(getString("inputname"),loadMyName());
    if (name!=null && name.length>0) {
        saveMyName(name);
        showMyName();
    }
    return name;
}
function alertErr(e) {
    logInfo(e,e);
    //if (debug)
    //    alert(e);
}
