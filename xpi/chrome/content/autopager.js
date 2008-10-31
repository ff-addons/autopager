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

var autopagerMain = 
{
    autopagerPrefs : null,
    autopagerDebug : false,
    workingAutoSites:null,
    workingAllSites:null,
    autopagerConfirmSites : null,

autopagerOnLoad : function() {
    window.addEventListener("DOMContentLoaded", autopagerMain.onContentLoad, false);
    //window.addEventListener("beforeunload", autopagerMain.onPageUnLoad, true);
    //window.addEventListener("select", autopagerMain.onSelect, true);
    autopagerMain.autopagerConfirmSites = autopagerConfig.loadConfirm();
    
    //window.onscroll = autopagerMain.scrollWatcher;
	window.addEventListener("scroll",autopagerMain.scrollWatcher,false);
    window.addEventListener('AutoPagerRefreshPage', this.AutoPagerRefreshPage, true, true);

    //autopagerMain.log("dbclick " + new Date().getTime())
        window.addEventListener(
        'dblclick',function(event){
            if (event.clientX + 20 < window.innerWidth &&
            event.clientY + 20 < window.innerHeight &&
            event.clientX > 20 &&
            event.clientY > 20) {
                if (event.ctrlKey == autopagerMain.getCtrlKey() && event.altKey == autopagerMain.getAltKey() && event.shiftKey == autopagerMain.getShiftKey())
                    autopagerMain.setGlobalEnabled(!autopagerMain.getGlobalEnabled());
            }
        },true
        );
    //autopagerMain.log("dbclick enabled" + new Date().getTime())

},
AutoPagerRefreshPage : function(evt){
   switch (evt.type)
   {
       case 'AutoPagerRefreshPage':
        autopagerMain.handleCurrentDoc();
        return;
   }
   
},
sitewizard : function(doc) {
    alert(autopagerConfig.autopagerGetString("selectlinkxpath"));
    document.autopagerXPathModel = "wizard";
    document.autopagerWizardStep = "";
    if(!doc.documentElement.autoPagerSelectorEnabled)
        autopagerMain.enableSelector(doc,true);
},
createXpath : function(doc) {
    document.autopagerXPathModel = "test";
    autopagerMain.enableSelector(doc,true);
},
addStyleSheetToDoc : function(doc,styleSheet) {
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
},
removeStyleSheetFromDoc : function(doc,styleSheet) {
    var nodes = autopagerMain.autopagerEvaluateXPath(doc.getElementsByTagName("head")[0],"link[@href ='" + styleSheet + "']",false);
    for (var i=0;i<nodes.length;++i)
        doc.getElementsByTagName("head")[0].removeChild(nodes[i]);
},
escToExitCreateModel : function(e) {
    var code;
    if (!e) var e = window.event;
    if (e.keyCode) code = e.keyCode;
    else if (e.which) code = e.which;
    //var character = String.fromCharCode(code);
    if (code == 27) //escape
    {
        var doc = (e.target.ownerDocument == null) ? e.target : e.target.ownerDocument ;
        autopagerMain.enableSelector(doc.defaultView.top.document,true);
    }
},
enableSelector : function(doc,setMenuStatus) {
    if (!(doc instanceof HTMLDocument))
    {
        return;
    }
    
    try{
    var de = doc.documentElement;
    
    //alert(doc);
    if (de.autoPagerSelectorEnabled) {
        doc.removeEventListener("mouseover", autopagerMain.onXPathMouseOver, false);
        doc.removeEventListener("keyup", autopagerMain.escToExitCreateModel, false);
        de.autoPagerSelectorEnabled = false;
        autopagerMain.removeStyleSheetFromDoc(doc,"chrome://autopagerimg/content/EditorContent.css");
        autopagerMain.removeStyleSheetFromDoc(doc,"chrome://autopagerimg/content/EditorAllTags.css");
        autopagerMain.hiddenRegionDivs(doc,"");
        autopagerMain.hiddenDiv(doc.getElementById("autoPagerLabel"),true);

        if (autopagerMain.selectedObj) {
            autopagerMain.enableClick(autopagerMain.selectedObj,false);
        }
        
    }else {
        doc.addEventListener("mouseover", autopagerMain.onXPathMouseOver, false);
        doc.addEventListener("keyup", autopagerMain.escToExitCreateModel, false);
        de.autoPagerSelectorEnabled = true;
        
        autopagerMain.addStyleSheetToDoc(doc,"chrome://autopagerimg/content/EditorContent.css");
        if (autopagerMain.loadBoolPref('showtags'))
          autopagerMain.addStyleSheetToDoc(doc,"chrome://autopagerimg/content/EditorAllTags.css");
    }
    if (setMenuStatus) {
        if (de.autoPagerSelectorEnabled ) {
            var msg = autopagerConfig.autopagerGetString("esctoabort");
            alert(msg);
            autopagerMain.logInfo(msg,msg);
        }
        document.getElementById("autoPagerCreateXPath").setAopenSettingttribute("checked",
                de.autoPagerSelectorEnabled);
    }
    if (doc.defaultView.frames != null) {
        //alert(doc.defaultView.frames.length);
        var i=0;
        for(i=0;i<doc.defaultView.frames.length;++i) {
            autopagerMain.enableSelector(doc.defaultView.frames[i].document,false);
        }
    }
    }catch(e){}
},
onPageUnLoad : function(event) {
    
    try
    {
        if (!document.autoPagerInited) {
            document.autoPagerInited = true;
            autopagerMain.setGlobalEnabled(autopagerMain.loadEnableStat());
        }

        var doc = event.originalTarget;
        if (!(doc instanceof HTMLDocument))
            {
                return;
            }
        autopagerMain.setGlobalImageByStatus(autopagerMain.getGlobalEnabled());
        try{
            autopagerMain.hiddenDiv(autopagerMain.getPagingWatcherDiv(doc,false),true);
            document.getElementById("autoPagerCreateXPath").setAttribute("checked", false);	
        }catch(e){}


        if (doc == null)
            return;
        //don't handle frames
        if (doc.defaultView != doc.defaultView.top)
               return;

        splitbrowse.close(doc);
    }catch(e){}
},
handleCurrentDoc : function()
{
    if (content && content.document)
    {
		document.autoPagerInited = false;
        this.onContentLoad(content.document);
    }
},
onContentLoad : function(event) {
    var doc = event;

    if (doc == null || !(doc instanceof HTMLDocument))
    {
        doc = event.target;// event.originalTarget;        
    }
    if (doc == null)
        return;
    if (doc.defaultView == null)
        return;
    if (!(doc instanceof HTMLDocument))
        {
            return;
        }
	autopagerMain.showStatus();
    if (doc.defaultView.name=="autoPagerLoadDivifr")
        return;
    if (!document.autoPagerInited) {
        document.autoPagerInited = true;
        autopagerMain.setGlobalEnabled(autopagerMain.loadEnableStat());
        window.setTimeout(function(){autopagerConfig.autopagerUpdate();},400);
   }
    autopagerMain.setGlobalImageByStatus(autopagerMain.getGlobalEnabled());
	if (doc.documentElement.forceLoadPage==null)
		doc.documentElement.forceLoadPage = 0;
	if (!autopagerMain.loadEnableStat() && doc.documentElement.forceLoadPage==0)
		return;
    try{
        autopagerMain.hiddenDiv(autopagerMain.getPagingWatcherDiv(doc,false),true);
        document.getElementById("autoPagerCreateXPath").setAttribute("checked", false);	
    }catch(e){}
    
    if (splitbrowse)
    {
      var browser = splitbrowse.getBrowserNode(doc);
      if (browser && !browser.getAttribute(splitbrowse.getSplitKey()))
      {
          autopagerMain.handleDocLoad(doc,false);
      }
    }
    autopagerMain.scrollWatcher();
  },
  Copy : function (container,doc)
  {
    var childs = doc.documentElement.childNodes;
    var i=0;
    for(i=childs.length-1;i>=0;--i)
    {
        doc.documentElement.removeChild(childs[i]);
    }
    childs = container.documentElement.childNodes;
    for(i=0;i<childs.length;++i)
    {
        doc.documentElement.appendChild(doc.importNode( childs[i].cloneNode(true),true));
    }
    
        
  },
  onSplitDocLoaded :function(doc,safe) {
    var furtherscrollWatcher = true;
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
                        var reg = this.getRegExp (container.documentElement.autoSiteSetting)
                        var url = this.getDocURL(container,de.getAttribute('enableJS') == 'true');
                        if (! reg.test(url))
                            return;
            
                        if (container.documentElement.getAttribute('autopagerAjax') == "true")
                            autopagerMain.Copy(container,doc);
                        //var doc = browser.webNavigation.document;
                        if (container.documentElement.getAttribute('fixOverflow') == 'true')
                            autopagerMain.fixOverflow(doc);
                        
                        nextUrl = autopagerMain.getNextUrlIncludeFrames(container,doc);
                        container.documentElement.autopagernextUrl = nextUrl;
                        browser.autopagerSplitWinFirstDocloaded = true;
                        container.documentElement.autopagerSplitDocInited = true;
                        container.documentElement.autopagerEnabled = true;
                    }
                    else {
                        if (browser.auotpagerContentDoc.documentElement.getAttribute('autopagerAjax') == "false")
                        {
                            furtherscrollWatcher =autopagerMain.scrollWindow(browser.auotpagerContentDoc,doc);
                            autopagerMain.onStopPaging(browser.auotpagerContentDoc);
                        }
                    }
                }
            }
            
        }
        if (furtherscrollWatcher)
        autopagerMain.scrollWatcher();
        return;
    }

},
handleDocLoad : function(doc,safe)
{
    //autopagerMain.workingAutoSites = autopagerConfig.loadConfig();
    autopagerMain.workingAllSites = UpdateSites.loadAll();

	var tmpSites = autopagerMain.loadTempConfig();

	tmpSites.updateSite = new AutoPagerUpdateSite("Wind Li","all",
						"","text/html; charset=utf-8",
						"smart paging configurations",
						"smartpaging.xml","//site",true,"autopager-xml",0);
	autopagerMain.workingAllSites[tmpSites.updateSite.filename] = tmpSites;
    autopagerMain.onInitDoc(doc,safe);
},
testDoc : function(doc,site)
{
	//autopagerMain.workingAutoSites = autopagerConfig.loadConfig();
    autopagerMain.workingAllSites = UpdateSites.loadAll();
            
    var tmpSites = [site];
    tmpSites.updateSite = new AutoPagerUpdateSite("Wind Li","all",
                        "","text/html; charset=utf-8",
                        "test paging configurations",
                        "testing.xml","//site",true,"autopager-xml",0);
	tmpSites.testing = true;
    autopagerMain.workingAllSites[tmpSites.updateSite.filename] = tmpSites;
    doc.location.reload();
},
getNextUrlIncludeFrames : function(container,doc)
{
    var urlNodes = autopagerMain.findNodeInDoc(doc,
            container.documentElement.getAttribute('linkXPath'),container.documentElement.getAttribute('enableJS') == 'true');
    //alert(urlNodes);
    var nextUrl = null;
    if (urlNodes != null && urlNodes.length >0) {
        nextUrl = autopagerMain.getNextUrl(container,container.documentElement.getAttribute('enableJS') == 'true',urlNodes[0]);
    }else
    {
        if (doc.defaultView.frames != null) {
            //alert(doc.defaultView.frames.length);
            var i=0;
            for(i=0;i<doc.defaultView.frames.length;++i) {
                nextUrl = autopagerMain.getNextUrlIncludeFrames(container,doc.defaultView.frames[i].document);
                if ( nextUrl != null)
                    return nextUrl;
            }
        }
     }    
    return nextUrl;
},
loadTempConfig : function() {
    var sites = new Array();
    var smartenable = autopagerMain.loadBoolPref("smartenable");
    if (smartenable) {
        
        var smarttext = autopagerMain.loadUTF8Pref("smarttext");
        if (smarttext.length>0) {
            var smartlinks = autopagerMain.loadPref("smartlinks");
            var site = autopagerConfig.newSite("*","temp site for smart paging"
            ,"","//body/*",[]);
            site.maxLinks = smartlinks;
            site.enableJS = true;
            site.isTemp = true;
            site.tmpPaths =  autopagerMain.convertToXpath(smarttext);
            
            site.fixOverflow = true;
            site.margin = autopagerMain.loadPref("smartMargin");
            site.guid="autopagertemp";
            sites.push(site);
            //alert(linkXPath);
        }
    }
    return sites;
},
convertToXpath : function(str) {
    var xpaths = new Array();
    var strs = str.split("|");
    for(var i=0;i<strs.length;++i)
        strs[i] = strs[i].toLowerCase();
    for(var i=0;i<strs.length;++i) {
        var strCon =  autopagerMain.convertStringToXPath(strs[i],"");
        if (strCon.length >0)
            xpaths.push( "//a[" + strCon + "] | //input[" + strCon + "]");
    }
    return xpaths;
},
xpathToLowerCase : function(str) {
    return "translate(" + str +", 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')";
},
convertStringToXPath : function(str,dir) {
    var xi="";
    
    if (str.length>0) {
        xi = autopagerMain.appendOrCondition(xi,  dir + autopagerMain.xpathToLowerCase("text()") + " ='" + str + "'");
        xi = autopagerMain.appendOrCondition(xi,  "(" +  dir + "@id and " +    autopagerMain.xpathToLowerCase(dir +"@id") + "='" + str + "')");
        xi = autopagerMain.appendOrCondition(xi,  "(" +  dir + "@name and " + autopagerMain.xpathToLowerCase(dir + "@name") + "='" + str + "')");
        xi = autopagerMain.appendOrCondition(xi,  "(" +  dir + "@class and " + autopagerMain.xpathToLowerCase(dir + "@class") + "='" + str + "')");
        xi = autopagerMain.appendOrCondition(xi,  "(" +  dir + "img and (" +   autopagerMain.xpathToLowerCase(dir +"img/@src") + "='" + str + "' or " + 
         autopagerMain.xpathToLowerCase("substring(" + dir + "img/@src,1, " + str.length + ")") + "='" + str + "'))");
    }
    return xi;
},
getCapString : function(str)
{
    return str.substring(0,1).toUpperCase() + str.substring(1);
},
convertStringToXPath2 : function(str,dir) {
    var xi="";
    
    if (str.length>0) {
       xi = autopagerMain.doConvertStringToXPath (str,dir)
        var cap = autopagerMain.getCapString(str);
       if (cap != str)
        xi = autopagerMain.appendOrCondition(xi,autopagerMain.doConvertStringToXPath (cap,dir));
    }
    return xi;
},
doConvertStringToXPath : function(str,dir) {
    var xi="";
    
    if (str.length>0) {
        xi = autopagerMain.appendOrCondition(xi,  dir + ("text()") + " ='" + str + "'");
        xi = autopagerMain.appendOrCondition(xi,  "(" + dir + "@id and " + dir + "@id" + "='" + str + "')");
        xi = autopagerMain.appendOrCondition(xi,  "(" + dir + "@name and " + dir + "@name" + "='" + str + "')");
        xi = autopagerMain.appendOrCondition(xi,  "(" + dir + "@class and " + dir + "@class" + "='" + str + "')");
        xi = autopagerMain.appendOrCondition(xi,  "(" + dir + "img and ("  + dir + "img/@src" + "='" + str + "' " +
        				" or substring(" + dir + "img/@src,1," + str.length + ")" + "='" + str + "'))");

    }
    return xi;
},

appendOrCondition : function(base,newStr) {
    if (base.length > 0) {
        if (newStr.length > 0)
            return base + " or " + newStr;
        else
            return base;
    }
    return newStr;
},
getAutopagerPrefs : function () {
    if (this.autopagerPrefs == null) {
        this.autopagerPrefs = Components.classes["@mozilla.org/preferences-service;1"].
        getService(Components.interfaces.nsIPrefService).getBranch("autopager");
        try{
            this.autopagerPrefs=this.autopagerPrefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
        }catch(e){}
    }
    return this.autopagerPrefs;
},
fixOverflow : function(doc) {
    var nodes = autopagerMain.findNodeInDoc(doc,"//*[contains(@style,'overflow')]",false);
    if (nodes != null) {
        for(var i = 0;i<nodes.length;++i) {
            var node = nodes[i];
            
            node.style.overflow = "visible";
        }
    }
    nodes = autopagerMain.findNodeInDoc(doc,"//*[contains(@style,'position')]",false);
    if (nodes != null) {
        for(var i = 0;i<nodes.length;++i) {
            var node = nodes[i];
            if ( (node.style.position == "fixed" || node.style.position == "absolute" ) && node.className != "autoPagerS")
                node.style.position = "relative"; 
        }
    }
},
getCtrlKey : function()
{
    return autopagerMain.getAutopagerPrefs().getBoolPref(".enablehotkeys.ctrlkey");
},
setCtrlKey : function(value)
{
    return autopagerMain.getAutopagerPrefs().setBoolPref(".enablehotkeys.ctrlkey",value);
},
getAltKey : function()
{
    return autopagerMain.getAutopagerPrefs().getBoolPref(".enablehotkeys.altkey");
},
setAltKey : function(value)
{
    return autopagerMain.getAutopagerPrefs().setBoolPref(".enablehotkeys.altkey",value);
},
getShiftKey : function()
{
    return autopagerMain.getAutopagerPrefs().getBoolPref(".enablehotkeys.shiftkey");
},
setShiftKey:function(value)
{
    return autopagerMain.getAutopagerPrefs().setBoolPref(".enablehotkeys.shiftkey",value);
},
getRegExp :function(site)
{
   if (site.regex==null)
   {
		 if (site.isRegex)
            site.regex = new RegExp(site.urlPattern);
         else
            site.regex = convert2RegExp(site.urlPattern);
    }
	return site.regex;
},
onInitDoc : function(doc,safe) {
    var t  = new Date().getTime();
    //autopagerMain.log("1 " + new Date().getTime())
    try{
    //autopagerMain.log("1.1 " + new Date().getTime())
        this.autopagerDebug=autopagerMain.getAutopagerPrefs().getBoolPref(".debug");
        document.getElementById("autopager-hidden-panel-menu").hidden = !this.autopagerDebug;
        document.getElementById("autopager-hidden-panel-separator").hidden = !this.autopagerDebug;
    //autopagerMain.log("1.2 " + new Date().getTime())
    }catch(e) {
        autopagerMain.alertErr(e);
    }
    if (doc.location == null)
        return;
    
    if (doc.defaultView.innerWidth <200 || doc.defaultView.innerHeight<200)
        return;
    
//    if(doc.body.attachEvent){
//        doc.body.attachEvent(
//        'ondblclick',function(){
//            autopagerMain.setGlobalEnabled(!autopagerMain.getGlobalEnabled());
//        }
//        );
//    }else{
    //}	
    //autopagerMain.log("2 " + new Date().getTime())

    var url = doc.location.href;
    if (url == "about:blank")
        return;
    var i=0;
    
    var tryTime = 0;
    for(tryTime=0;tryTime<2;tryTime++)
    {
    //autopagerMain.log("3 " + new Date().getTime())

        if (tryTime==0)
            autopagerMain.workingAutoSites= UpdateSites.getMatchedSiteConfig(autopagerMain.workingAllSites,url,1);
        else
        {
            if (autopagerMain.workingAutoSites==null || autopagerMain.workingAutoSites.length==0 || autopagerMain.workingAutoSites[0].urlPattern == "*")
                return;
            autopagerMain.workingAutoSites= UpdateSites.getMatchedSiteConfig(autopagerMain.workingAllSites,url,10);
        }
    for(i=0;i<autopagerMain.workingAutoSites.length;++i)
    {
    //autopagerMain.log("4 " + new Date().getTime()) 
        var pattern = autopagerMain.getRegExp(autopagerMain.workingAutoSites[i]);
        if (pattern.test(url)) {
            //should not equal
            //if (autopagerMain.workingAutoSites[i].quickLoad == safe)
            if (safe)
                return false;
            var msg="";
            var info = "";
            var de = doc.documentElement;
            if (!de.autoPagerRunning) {
                de.patternRegExp = pattern;
                var insertPoint = null;
                var nextUrl = null;

    //autopagerMain.log("5 " + new Date().getTime()) 
                var urlNodes = null;
                if (autopagerMain.workingAutoSites[i].isTemp )
                    tryTime = 2;
                if (!autopagerMain.workingAutoSites[i].isTemp)
                    urlNodes = autopagerMain.findNodeInDoc(doc,autopagerMain.workingAutoSites[i].linkXPath,autopagerMain.workingAutoSites[i].enableJS || (!autopagerMain.workingAutoSites[i].fixOverflow &&  autopagerMain.loadBoolPref("alwaysEnableJavaScript")));
                else{
                    autopagerMain.workingAutoSites[i].linkXPath = null;
                    for(var t=0;t<autopagerMain.workingAutoSites[i].tmpPaths.length; ++t) {
    //autopagerMain.log("6.1 " + new Date().getTime()) 
    autopagerMain.log(autopagerMain.workingAutoSites[i].tmpPaths[t])
                        urlNodes = autopagerMain.findNodeInDoc(doc,autopagerMain.workingAutoSites[i].tmpPaths[t],autopagerMain.workingAutoSites[i].enableJS || (!autopagerMain.workingAutoSites[i].fixOverflow &&  autopagerMain.loadBoolPref("alwaysEnableJavaScript")));
    //autopagerMain.log("6 " + new Date().getTime()) 
                        if ( urlNodes != null  && urlNodes.length >0
                        && urlNodes.length <= autopagerMain.workingAutoSites[i].maxLinks) {
                            autopagerMain.workingAutoSites[i].linkXPath = autopagerMain.workingAutoSites[i].tmpPaths[t];
                            //alert(autopagerMain.workingAutoSites[i].linkXPath);
                            break;
                        }
                    }       
                }
    //autopagerMain.log("7 " + new Date().getTime()) 
                if (urlNodes == null || urlNodes.length ==0)
                {
                    if (autopagerMain.workingAutoSites[i].isTemp )
                        de.autopagerEnabled = false ;                    
                    break;
                }
    //autopagerMain.log("8 " + new Date().getTime()) 
                var visible = false;
                for(var l in urlNodes)
                {
                    var style = doc.defaultView.getComputedStyle(urlNodes[l],null);
                    //alert(urlNodes[l].offsetLeft)
                    if (!(style.display=="none" || style.display=="hidden"  || style.visibility=="invisible"))
                    {
                        var pos = autopagerMain.myGetPos(urlNodes[l]);
                        var left = pos.x;
                        var top = pos.y;

                        visible = !((left +urlNodes[l].offsetWidth)<= 0 || (top + urlNodes[l].offsetHeight) <=0);
                        if (visible)
                            break;
                    }
                        
                }
                if (!visible)
                {
                    de.autopagerEnabled = false ;
                    break;
                }
    //autopagerMain.log("9 " + new Date().getTime()) 

                de.autoPagerRunning = true;
                var oldNodes = autopagerMain.findNodeInDoc(doc,autopagerMain.workingAutoSites[i].contentXPath,autopagerMain.workingAutoSites[i].enableJS || (!autopagerMain.workingAutoSites[i].fixOverflow &&  autopagerMain.loadBoolPref("alwaysEnableJavaScript")));
                
                de.contentXPath = autopagerMain.workingAutoSites[i].contentXPath;
                de.removeXPath = autopagerMain.workingAutoSites[i].removeXPath;
                
                de.autopagerGUID = autopagerMain.workingAutoSites[i].guid;
                de.margin = autopagerMain.workingAutoSites[i].margin;
                de.enabled = autopagerMain.workingAutoSites[i].enabled;
                //if (autopagerMain.workingAutoSites[i].enabled)
                de.autopagerSplitDocInited = false;
                de.setAttribute('enableJS', autopagerMain.workingAutoSites[i].enableJS ||autopagerMain.workingAutoSites[i].ajax || (!autopagerMain.workingAutoSites[i].fixOverflow &&  autopagerMain.loadBoolPref("alwaysEnableJavaScript")));
                de.setAttribute('autopagerAjax', autopagerMain.workingAutoSites[i].ajax);
                if (!de.autopagerPagingCount)
                    de.autopagerPagingCount = 0;
                if (!de.autoPagerPage)
                {
						de.autoPagerPage = 0;
                		de.autoPagerPageHeight = [];
                }
                if (autopagerMain.autopagerConfirmSites == null)
                    autopagerMain.autopagerConfirmSites = autopagerConfig.loadConfirm();
                var siteConfirm = autopagerConfig.findConfirm(autopagerMain.autopagerConfirmSites,autopagerMain.workingAutoSites[i].guid,doc.location.host);
                if (siteConfirm!=null)
                {
                    de.autopagerUserConfirmed= true;
                    de.autopagerSessionAllowed= siteConfirm.UserAllowed;
                    de.autopagerAllowedPageCount=siteConfirm.AllowedPageCount;
                    de.autopagerUserAllowed=siteConfirm.UserAllowed;
                }
    //autopagerMain.log("10 " + new Date().getTime()) 

                if (oldNodes!= null && oldNodes.length >0)
                    insertPoint = oldNodes[oldNodes.length - 1].nextSibling;
                if(insertPoint == null)
                    insertPoint = autopagerMain.getLastDiv(doc);
                //alert(oldNodes[oldNodes.length - 1]);
                if (this.autopagerDebug)
                    autopagerMain.logInfo(insertPoint, "go");
                de.setAttribute('linkXPath',autopagerMain.workingAutoSites[i].linkXPath);
                
                var tooManyLinks = false;
                if (autopagerMain.workingAutoSites[i].maxLinks  != -1 && urlNodes != null 
                    && urlNodes.length > autopagerMain.workingAutoSites[i].maxLinks )
                    tooManyLinks = true;
                
                //alert(urlNodes);
                if (urlNodes != null && urlNodes.length >0) {
                    nextUrl = autopagerMain.getNextUrl(doc,autopagerMain.workingAutoSites[i].enableJS || (!autopagerMain.workingAutoSites[i].fixOverflow &&  autopagerMain.loadBoolPref("alwaysEnableJavaScript")),urlNodes[0]);
                }else
                    nextUrl = null;
                //alert(insertPoint);
                //alert(nextUrl);
                var autopagerEnabled =	(insertPoint != null) && (nextUrl != null) 
                && autopagerMain.workingAutoSites[i].enabled && !(tooManyLinks);
                de.autopagerEnabled = autopagerEnabled;
                de.autopagerProcessed = true;
                de.autoSiteSetting = autopagerMain.workingAutoSites[i];
                //alert(doc.autopagerEnabled);
                de.autoPagerPage = 1;
                de.autopagerinsertPoint = insertPoint;
                if (autopagerMain.workingAutoSites[i].enableJS || (!autopagerMain.workingAutoSites[i].fixOverflow &&  autopagerMain.loadBoolPref("alwaysEnableJavaScript")))
                    de.autopagernextUrl= null;
                else
                    de.autopagernextUrl = nextUrl;
                de.autopagerUseSafeEvent = !autopagerMain.workingAutoSites[i].quickLoad;
                de.setAttribute('fixOverflow',autopagerMain.workingAutoSites[i].fixOverflow);
                de.setAttribute('contentXPath',autopagerMain.workingAutoSites[i].contentXPath);
                de.setAttribute('containerXPath',autopagerMain.workingAutoSites[i].containerXPath);
				de.setAttribute('autopagerSettingOwner',autopagerMain.workingAutoSites[i].owner);
                de.autopagerSplitCreated = false;
                
    //autopagerMain.log("11 " + new Date().getTime())

				de.autoPagerPageHeight = [];
				
				if (autopagerEnabled) {
                     if(autopagerMain.workingAutoSites[i].fixOverflow)
                        autopagerMain.fixOverflow(doc);

                    var topDoc = doc.defaultView.top.document;
                    if (!topDoc.documentElement.autopagerEnabledDoc)
                        topDoc.documentElement.autopagerEnabledDoc = new Array();
                    topDoc.documentElement.autopagerEnabledDoc.push( doc);
                    try{
                        if (autopagerMain.workingAutoSites[i].enableJS || (!autopagerMain.workingAutoSites[i].fixOverflow &&  autopagerMain.loadBoolPref("alwaysEnableJavaScript"))) {
                            doc = doc.QueryInterface(Components.interfaces.nsIDOMDocument);
                            var splitbrowser = autopagerMain.getSplitBrowserForDoc(doc,true);
                            splitbrowser.autopagerSplitWinFirstDocloaded = false;
                            splitbrowser.autopagerSplitWinFirstDocSubmited = true;
                        }
                    }catch(e)
                    {}				
                    
                    msg = autopagerConfig.autopagerFormatString("enableurl",[ url ]);
                    info = autopagerConfig.autopagerFormatString("enableinfo",[url,autopagerMain.workingAutoSites[i].linkXPath,autopagerMain.workingAutoSites[i].contentXPath]);
                }
                else if (!autopagerMain.getGlobalEnabled()) {
                    msg = autopagerConfig.autopagerFormatString("globaldisabled",[url]);
                    info = msg;
                }
    //autopagerMain.log("11 " + new Date().getTime()) 

                if (msg.length>0)
                    autopagerMain.logInfo(msg, info);				
                setTimeout(autopagerMain.scrollWatcher,1000);
                return true;
            }
        }
    }
}
    
},
onSelect : function(event) {
    try{
        var de = content.document.documentElement;
        
        if (de != null ) {	
            if (de.autopagerEnabledDoc!=null
            && de.autopagerEnabledDoc.length >0) {
                try{
                    autopagerMain.scrollWatcher();
                }catch(e){}
                try{
                    autopagerMain.pagingWatcher();
                }catch(e){}
            }
            document.getElementById("autoPagerCreateXPath").setAttribute("checked", 
            de.autoPagerSelectorEnabled);
        }
    }catch(e) {
        //autopagerMain.logInfo(e,e);
    }
    
},
do_request : function(doc){
    var nextUrl = doc.documentElement.autopagernextUrl;
    var linkXPath = doc.documentElement.getAttribute('linkXPath');
    if (nextUrl != null && ( typeof(nextUrl) =='string' || !nextUrl.getAttribute("disabled")))
    {
         //validate insertPoint
            try{
                var parentNode = doc.documentElement.autopagerinsertPoint.parentNode.parentNode;
            }catch(e)
            {
                var de = doc.documentElement
                doc.documentElement.autopagerSplitCreated = false;
                de.autopagerSplitCreated = false;
                de.autopagerSplitDocInited = false;
                var topDoc = content.document;
                //topDoc.documentElement.autopagerEnabledDoc = null;
                topDoc.documentElement.autopagerPagingCount = 0                
                    
                setTimeout(function(){
                    topDoc =content.document;
                    de = topDoc.documentElement;
                    doc = topDoc
                    de.autoPagerRunning = false;
                    autopagerMain.onInitDoc(doc,false);
                    doc.documentElement.autopagerSplitCreated = false;
                    doc.documentElement.autopagerSplitDocInited = false;
                    splitbrowse.close(doc);
                    splitbrowse.close(topDoc);
                    
                    var splitbrowser = autopagerMain.getSplitBrowserForDoc(doc,true);
                },100);
            
                return false;
                
            }
            autopagerMain.onStartPaging(doc);
            autopagerMain.processNextDoc(doc,nextUrl);
    }
},
getAllowCheckpagingAutopagingPage : function(doc) {
//    if (!doc.documentElement.autopagerProcessed)
//      autopagerMain.onInitDoc(doc,false);
    var enabled =doc.documentElement.autopagerEnabled && autopagerMain.getGlobalEnabled();
    //enabled = enabled && ( !(doc.documentElement.getAttribute('enableJS') == 'true')  || doc.documentElement.autopagerSplitDocInited );
    return  enabled ||  doc.documentElement.forceLoadPage>0;
},
getEnabledAutopagingPage : function(doc) {
    var enabled =doc.documentElement.autopagerEnabled && (autopagerMain.getGlobalEnabled() ||  doc.documentElement.forceLoadPage>0);
    enabled = enabled && ( !(doc.documentElement.getAttribute('enableJS') == 'true')  || doc.documentElement.autopagerSplitDocInited );
    return  enabled ;
},
loadPages : function (doc,pages)
{
	doc.documentElement.forceLoadPage = pages;
	if (doc.documentElement.autoPagerPage!=null && doc.documentElement.autoPagerPage!=0)
		doc.documentElement.forceLoadPage += doc.documentElement.autoPagerPage;
	if (doc.documentElement.autopagerEnabledDoc == null)
	{
		autopagerMain.onContentLoad(doc);
    }
	doc.documentElement.autopagerEnabled = true;
	autopagerMain.scrollWatcher();
},
count:0,
scrollWatching: false,
scrollWatcher : function() {
    autopagerMain.doScrollWatcher();
    setTimeout(autopagerMain.doScrollWatcher,2000);
},
doScrollWatcher : function() {
    if (autopagerMain.scrollWatching)
			return;
	autopagerMain.scrollWatching = true;
    try{
        var i =0;
        if (this.autopagerDebug)
            autopagerMain.logInfo(this.count,"Enter scrollWatcher");
        var de = content.document.documentElement;
        if (de.autopagerEnabledDoc != null)
       {
            for(i=0;i<de.autopagerEnabledDoc.length;i++) {
                var doc = de.autopagerEnabledDoc[i];
                if (doc.location != null)
               {
                    var Enable = autopagerMain.getAllowCheckpagingAutopagingPage(doc);
                    if (Enable) {
                        var readyToPaging = autopagerMain.getEnabledAutopagingPage(doc);
                        if (this.autopagerDebug)
                            autopagerMain.logInfo(this.count+ "Enabled " + doc.location.href,this.count+ "Enabled " + doc.location.href);
                        try{
							var needLoad = false;
							if (doc.documentElement.forceLoadPage> doc.documentElement.autoPagerPage)
								needLoad = true;
						    else
							{
								if (doc.documentElement.forceLoadPage>0)
									doc.documentElement.forceLoadPage = 0;
								var scrollDoc =doc;

								var wh = window.innerHeight;//scrollDoc.defaultView.innerHeight ? scrollDoc.defaultView.innerHeight : scrollDoc.documentElement.clientHeight;

								var scrollContainer = null;
								if (scrollDoc.documentElement.getAttribute("containerXPath"))
								{
										containerXPath = scrollDoc.documentElement.getAttribute("containerXPath");
										var autopagerContainer = null;
										if (containerXPath != "")
										{
												autopagerContainer = autopagerMain.findNodeInDoc(doc,containerXPath,false);
												if (autopagerContainer!=null)
												{
														scrollContainer = autopagerContainer[0];
														wh = autopagerContainer[0].clientHeight;
												}
										}

								}
								if (scrollContainer==null)
										scrollContainer = scrollDoc.documentElement;
								var sc = (scrollContainer && scrollContainer.scrollTop)
								? scrollContainer.scrollTop : scrollDoc.body.scrollTop;
								var sh = (scrollContainer && scrollContainer.scrollHeight)
								? scrollContainer.scrollHeight : scrollDoc.body.scrollHeight;
								if (scrollDoc.body != null && scrollDoc.body.scrollHeight > sh)
										sh = scrollDoc.body.scrollHeight;


								var remain = sh - sc - scrollContainer.offsetTop - wh;
								this.count++;
								if (this.autopagerDebug)
										autopagerMain.logInfo(this.count + ": Auto pager wh:" + wh+ " sc:" + sc + " remain: " + remain,
												"sh=" + sh + " sc = " + sc + " wh= " + wh + " Auto pager remain: " + remain + ".\nremain < " + wh+" will auto page.");

								//alert(wh);
								if (this.autopagerDebug)
										wh = wh * (doc.documentElement.margin*1 + 1.5);
								else
										wh = wh * (doc.documentElement.margin * 1);
								//alert(wh);
								//needLoad = remain < wh;
								var targetHeight = 0;
								var a = de.autoPagerPageHeight
								if (a!=null && a.length >= doc.documentElement.margin)
								{
										var pos = a.length - doc.documentElement.margin
										targetHeight = a[pos];
								}
								var currHeight = sc + scrollContainer.offsetTop;// + wh
								needLoad = (targetHeight < currHeight) || remain < wh;
							}
                            if( needLoad){
                                if (de.autoPagerPage==null || de.autoPagerPage<2)
                                 {
                                    //test the contetXPATH first
                                    var xpath = doc.documentElement.contentXPath;

                                    var nodes = autopagerMain.findNodeInDoc(doc,xpath,doc.documentElement.getAttribute('enableJS') == 'true');
                                    if (nodes.length==0)
                                    {
                                        autopagerMain.scrollWatching = false;
                                        return;
                                    }
                                }
                                //alert(remain + "   " + wh + "  "  + sh + " " + sc);
                                if (autopagerMain.loadBoolPref("noprompt") && !doc.documentElement.autopagerUserConfirmed)
                                {
                                    doc.documentElement.autopagerUserConfirmed = true;
                                    doc.documentElement.autopagerUserAllowed = true;
                                    doc.documentElement.autopagerAllowedPageCount = -1;
                                }
                                if (!doc.documentElement.autopagerUserConfirmed)
								{
										var siteConfirm = autopagerConfig.findConfirm(autopagerMain.autopagerConfirmSites,de.autopagerGUID,doc.location.host);
										if (siteConfirm!=null)
										{
											de.autopagerUserConfirmed= true;
											de.autopagerSessionAllowed= siteConfirm.UserAllowed;
											de.autopagerAllowedPageCount=siteConfirm.AllowedPageCount;
											de.autopagerUserAllowed=siteConfirm.UserAllowed;
										}
								}
                                var needConfirm =  (!autopagerMain.loadBoolPref("noprompt"))
										&& (!doc.documentElement.autopagerUserConfirmed || (doc.documentElement.autopagerSessionAllowed
																&& doc.documentElement.autopagerAllowedPageCount== doc.documentElement.autoPagerPage))
										&& (doc.documentElement.forceLoadPage==0);
                                  
                                if (needConfirm)
                                {
                                    doc.documentElement.autopagerEnabled = false;
									var showoption = {value: false};
									var result = false;
									if (autopagerMain.loadEnableStat() && autopagerMain.loadBoolPref("modalprompt"))
									{
										var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
																.getService(Components.interfaces.nsIPromptService);
										var host = doc.location.host;
										var owner = doc.documentElement.getAttribute("autopagerSettingOwner")
										result = prompts.confirmCheck(window, autopagerConfig.autopagerFormatString("enableurl",[host]),
											autopagerConfig.autopagerFormatString("enableonsite",[host,owner]),
																		  autopagerConfig.autopagerFormatString("showoptions",[host,owner]), showoption);
									    document.autopagerConfirmDoc = doc;
										if (showoption.value==false)
										{
											autopagerMain.enabledThisSite(result);
										}
										else
											autopagerMain.enabledInThisSession(false);
									    document.autopagerConfirmDoc = null;

									}
									else if (!autopagerMain.loadBoolPref("modalprompt"))
										showoption.value = true;
									if (showoption.value)
										autopagerMain.hiddenDiv(autopagerMain.getPagingOptionDiv(doc),false || !autopagerMain.loadEnableStat());
                                }
                                else
                                    if ((doc.documentElement.autopagerUserConfirmed
                                    && doc.documentElement.autopagerUserAllowed
                                    && ( doc.documentElement.autopagerAllowedPageCount < 0
                                    ||  doc.documentElement.autopagerAllowedPageCount> doc.documentElement.autoPagerPage)
                                       ) || doc.documentElement.forceLoadPage>0)
                                {
                                    if (readyToPaging){
                                        if (doc.defaultView){
                                            doc.documentElement.autopagerEnabled = false;
                                            autopagerMain.do_request(doc);   
                                        }          
                                    }
                                    else
                                    {
                                        if (!doc.documentElement.autopagerSplitCreated)
                                        {
                                            doc.documentElement.autopagerSplitCreated = true;
                                            var splitbrowser = autopagerMain.getSplitBrowserForDoc(doc,true);
                                        }
                                    }
                                }
                                    
                            }
                        }catch(e){
                            autopagerMain.alertErr("Exception:" + e);
                        }
                     }
                }
            }
         }
    }catch(e){
       autopagerMain.alertErr("Exception:" + e);
   }
    autopagerMain.scrollWatching = false;
//    var self = arguments.callee;
    //setTimeout(self,400);
    
},
showAllPagingOptions : function() {
    
    try{
        var showedCount = 0;
        var i =0;
        if (this.autopagerDebug)
            autopagerMain.logInfo(this.count,"Enter showAllPagingOptions");
        var de = content.document.documentElement;
        if (de.autopagerEnabledDoc != null)
       {
            for(i=0;i<de.autopagerEnabledDoc.length;i++) {
                var doc = de.autopagerEnabledDoc[i];
                if (doc.location != null)
               {
                     autopagerMain.hiddenDiv(autopagerMain.getPagingOptionDiv(doc),false || !autopagerMain.loadEnableStat());
                     showedCount ++;
                }
            }
         }
         if (showedCount==0)
        {
            alert(autopagerConfig.autopagerGetString("nomatchedconfig"));
        }
    }catch(e){
       autopagerMain.alertErr("Exception:" + e);
   }
    
},
onXPathMouseOver : function(event) {
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
    
    var str = autopagerConfig.autopagerFormatString("moveover",[target.tagName,autopagerMain.getXPathForObject(target)]);
    autopagerMain.logInfo(str,str);
    
    //event.target.addEventListener("click",autopagerMain.onXPathClick,true);
    //event.target.addEventListener("contextmenu",onMyContextMenu,true);
    autopagerMain.createPagerSelectorDivs(target.ownerDocument,target);
    return true;
},
createDiv : function(doc,id,style) {
    var div = doc.createElement("div");
    //div.innerHTML = divHtml;
    doc.body.appendChild(div);
    div.className="autoPagerS";
    if (id.length>0)
        div.id = id;
    
    if (style.length>0)
        div.style.cssText = style;
    return div;
},
getSelectorDiv : function(doc,divName) {
    var div = doc.getElementById(divName);
    if (!div) {
        var style ="border: 2px solid orange; margin: 0px; padding: 0px; position: absolute; width: 0px; display: block; z-index: 65534; left: -100px; top: -100px; height: 0px;"; 
        div = autopagerMain.createDiv(doc,divName,style);
    }
    return div;
},
getLabelDiv : function(doc,divName) {
    var div = doc.getElementById(divName);
    if (!div) {
        var style =""; 
        div = autopagerMain.createDiv(doc,divName,style);
        var s = div.style;
	s.display = "none";
	s.backgroundColor = "#fff0cc";
	s.borderColor = "black";
	s.borderWidth = "1px 2px 2px 1px";
	s.borderStyle = "solid";
	s.fontFamily = "arial";
	s.textAlign = "left";
	s.color = "#000";
	s.fontSize = "12px";
	s.position = "absolute";
	s.paddingTop = "2px";
	s.paddingBottom = "2px";
	s.paddingLeft = "5px";
	s.paddingRight = "5px";
        
	s.borderTopWidth = "0";
	s.MozBorderRadiusBottomleft = "6px";
	s.MozBorderRadiusBottomright = "6px";
        s.zIndex = "65535";        
              
    }
    return div;
},
getSelectorLoadFrame : function(doc) {
    var divName = "autoPagerLoadDiv";
    var frameName = divName + "ifr";
    
//    var frame = doc.ownerDocument.autopagerFrame;
//    if (frame == null || !frame)
        frame = doc.getElementById(frameName);
    if (frame == null || !frame) {
        var div = null;
        if (this.autopagerDebug) {
            div = autopagerMain.createDiv(doc,divName,"");
        }
        else {	
            div = autopagerMain.createDiv(doc,divName,  "border: 0px; margin: 0px; padding: 0px; position: absolute; width: 0px; display: block; z-index: -90; left: -100px; top: -100px; height: 0px;");
        }
        div.innerHTML=
            "<iframe id='" + frameName + "' name='" + frameName + "' width='100%' height='100%' src=''></iframe>";
        
        frame = doc.getElementById(frameName);

        //frame.src = "about:";
        frame.autoPagerInited = false;
        //create a empty div in target
        autopagerMain.getLastDiv(doc);
//        frame.addEventListener("load", autopagerMain.onFrameLoad, false);
//        doc.ownerDocument.autopagerFrame = frame;
    }
    //fix for enable to work at restored session
    try{
            frame.removeEventListener("DOMContentLoaded", autopagerMain.onFrameLoad, false);
            frame.removeEventListener("load", autopagerMain.onFrameLoad, false);
         frame.contentDocument.clear();
        frame.normalize();
        frame.contentDocument.documentElement.innerHTML = "<html><body>autopaging</body></html>";
    }catch(e){}
    if (doc.documentElement.autopagerUseSafeEvent)
        frame.addEventListener("load", autopagerMain.onFrameLoad, false);
    else
        frame.addEventListener("DOMContentLoaded", autopagerMain.onFrameLoad, false);
    return frame;
},
getLastDiv: function(doc) {
    var divName = "autoPagerLastDiv";
    var div = doc.getElementById(divName);
    if (div == null || !div) {
        var div = autopagerMain.createDiv(doc,divName,
        "border: 0px; margin: 0px; padding: 0px; position: absolute; width: 0px; display: block; z-index: -90; left: -100px; top: -100px; height: 0px;");
        div = doc.getElementById(divName);
    }
    
    return div;
},
enableClickOnNode : function(node,enabled) {
    if (node!=null)
    {
    if (enabled) {
        node.addEventListener("click",autopagerMain.onXPathClick,true);
    }else {
        node.removeEventListener("click",autopagerMain.onXPathClick,true);
    }
    }
},
enableClick : function(node,enabled) {
    //if (node.parentNode.tagName == "A")
    autopagerMain.enableClickOnNode(node.parentNode,enabled);
    autopagerMain.enableClickOnNodes(node,enabled);
},
enableClickOnNodes : function(node,enabled) {
    autopagerMain.enableClickOnNode(node,enabled);
    var childs = node.childNodes;
    var i=0;
    for(i=0;i<childs.length;++i)
        autopagerMain.enableClickOnNodes(childs[i],enabled);
},
selectedObj : null,
hiddenRegionDivs : function(doc,subfix) {
    var leftDiv =autopagerMain.getSelectorDiv(doc,"autoPagerBorderLeft" + subfix);
    var rightDiv =autopagerMain.getSelectorDiv(doc,"autoPagerBorderRight" + subfix);
    var topDiv =autopagerMain.getSelectorDiv(doc,"autoPagerBorderTop" + subfix);
    var bottomDiv =autopagerMain.getSelectorDiv(doc,"autoPagerBorderBottom" + subfix);
    autopagerMain.hiddenDiv(leftDiv,true);
    autopagerMain.hiddenDiv(rightDiv,true);
    autopagerMain.hiddenDiv(topDiv,true);
    autopagerMain.hiddenDiv(bottomDiv,true);
},
hiddenDiv :function(div,hidden) {
    if (div)
    {
        if (hidden) {
            div.style.display = "none";
        }else {
            div.style.display = "block";
        }
    }
	//div.hidden = hidden;
},
createPagerSelectorDivs : function(doc,target) {
    if (autopagerMain.selectedObj) {
        autopagerMain.enableClick(autopagerMain.selectedObj,false);
    }
    autopagerMain.selectedObj = target;
    autopagerMain.enableClick(autopagerMain.selectedObj,true);
    autopagerMain.createRegionDivs(doc,target,"");
    autopagerMain.createLabelDivs(doc,target,"");
        
},
myGetPos : function(target)
{
    var node = target;
	var pos = {x: 0, y: 0};

	while (node)
	{
		pos.x += node.offsetLeft;
		pos.y += node.offsetTop;
		node = node.offsetParent;
	}
	return pos;
},
myGetWindowDimensions : function (doc)
{
	var out = {};

	out.scrollX = doc.body.scrollLeft + doc.documentElement.scrollLeft; 
	out.scrollY = doc.body.scrollTop + doc.documentElement.scrollTop;

	if (doc.compatMode == "BackCompat")
	{
		out.width = doc.body.clientWidth;
		out.height = doc.body.clientHeight;
	}
	else
	{
		out.width = doc.documentElement.clientWidth;
		out.height = doc.documentElement.clientHeight;
	}
	return out;
},
makeElementLabelString :function(target) {
	var s = "<b style='color:#000'>" + target.tagName.toLowerCase() + "</b>";
	if (target.id != '')
		s += ", id: " + target.id;
	if (target.className != '')
		s += ", class: " + target.className;
	/*for (var i in target.style)
		if (target.style[i] != '')
			s += "<br> " + i + ": " + target.style[i]; */
	if (target.style.cssText != '')
		s += ", style: " + target.style.cssText;
		
	return s;
},
labelDrawnHigh :null,
createLabelDivs : function(doc,target,subfix)
{
	var pos = autopagerMain.myGetPos(target)
	var dims = autopagerMain.myGetWindowDimensions (doc);    
    	var y = pos.y + target.offsetHeight + 1;
        var labelDiv =autopagerMain.getLabelDiv(doc,"autoPagerLabel" + subfix);
	labelDiv.style.left = (pos.x + 2) + "px";
        
    
    	
        labelDiv.innerHTML = autopagerMain.makeElementLabelString(target);
	labelDiv.style.display = "";

	// adjust the label as necessary to make sure it is within screen and
	// the border is pretty
	if ((y + labelDiv.offsetHeight) >= dims.scrollY + dims.height)
	{
		labelDiv.style.borderTopWidth = "1px";
		labelDiv.style.MozBorderRadiusTopleft = "6px";
		labelDiv.style.MozBorderRadiusTopright = "6px";
		autopagerMain.labelDrawnHigh = true;
		y = (dims.scrollY + dims.height) - labelDiv.offsetHeight;
	}
	else if (labelDiv.offsetWidth > target.offsetWidth)
	{
		labelDiv.style.borderTopWidth = "1px";
		labelDiv.style.MozBorderRadiusTopright = "6px";
		autopagerMain.labelDrawnHigh = true;
	}
	else if (autopagerMain.labelDrawnHigh)
	{
		labelDiv.style.borderTopWidth = "0";
		labelDiv.style.MozBorderRadiusTopleft = "";
		labelDiv.style.MozBorderRadiusTopright = "";
		delete (autopagerMain.labelDrawnHigh); 
	}
	labelDiv.style.top = y + "px";	

            
},
    
createRegionDivs : function(doc,target,subfix) {
    var margin = 3;
    var leftDiv =autopagerMain.getSelectorDiv(doc,"autoPagerBorderLeft" + subfix);
    var rightDiv =autopagerMain.getSelectorDiv(doc,"autoPagerBorderRight" + subfix);
    var topDiv =autopagerMain.getSelectorDiv(doc,"autoPagerBorderTop" + subfix);
    var bottomDiv =autopagerMain.getSelectorDiv(doc,"autoPagerBorderBottom" + subfix);
    var left = autopagerMain.getOffsetLeft(target);
    var top = autopagerMain.getOffsetTop(target);
    
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
    
    autopagerMain.hiddenDiv(leftDiv,false);
    autopagerMain.hiddenDiv(rightDiv,false);
    autopagerMain.hiddenDiv(topDiv,false);
    autopagerMain.hiddenDiv(bottomDiv,false);
    
},
appendCondition : function(base,newStr) {
    if (base.length > 0) {
        if (newStr.length > 0)
            return base + " and " + newStr;
        else
            return base;
    }
    return newStr;
},
getXIdetify:function(node,dir) {
    var xi = "";
    try{
        if ((node.className != null) && (node.className.length >0)) {
            xi = autopagerMain.appendCondition(xi,dir + "@class='" + node.className + "'");
        }
        if (node.getAttribute("id") != null && node.getAttribute("id").length >0) {
            xi = autopagerMain.appendCondition(xi,dir + "@id='" + node.getAttribute("id") + "'");
        }
        if (node.textContent != null && node.childNodes.length ==1 && node.textContent.length >0 && node.textContent.length < 10) {
            //only if child is #text
            var child = node.childNodes[0];
            
            if(child.nodeType == 3)
                xi = autopagerMain.appendCondition(xi, "contains(" +dir + "text(),'" + child.textContent + "')");
        }
        if(node.tagName == "INPUT") {
            if (node.getAttribute("type") != null && node.getAttribute("type").length >0) {
                xi = autopagerMain.appendCondition(xi,dir + "@type='" + node.getAttribute("type") + "'");
            }
            if (node.getAttribute("name") != null && node.getAttribute("name").length >0) {
                xi = autopagerMain.appendCondition(xi,dir + "@name='" + node.getAttribute("name") + "'");
            }
            if (node.getAttribute("value") != null && node.getAttribute("value").length >0) {
                xi = autopagerMain.appendCondition(xi,dir + "@value='" + node.getAttribute("value") + "'");
            }
            if (node.getAttribute("src") != null && node.getAttribute("src").length >0) {
                xi = autopagerMain.appendCondition(xi,dir + "@src='" + node.getAttribute("src") + "'");
            }
        }
        else if(node.tagName == "IMG") {
            if (node.getAttribute("src") != null && node.getAttribute("src").length >0) {
                xi = autopagerMain.appendCondition(xi,dir + "@src='" + node.getAttribute("src") + "'");
            }
            if (node.getAttribute("alt") != null && node.getAttribute("alt").length >0) {
                xi = autopagerMain.appendCondition(xi,dir + "@alt='" + node.getAttribute("alt") + "'");
            }
        }
    }catch(e) {
        autopagerMain.alertErr(e);
    }
    return xi;
},
getTagCount : function(childs,index) {
    var tagCount = 0;
    var tagname = childs[index].tagName;
    var i;
    for(i=childs.length-1;i>=0;--i) {
        if (childs[i].tagName == tagname)
            tagCount ++;
    }
    return tagCount;
},
getTagIndex : function(childs,index) {
    var tagIndex = 1;
    var tagname = childs[index].tagName;
    var i;
    for( i=index-1;i>=0;--i) {
        if (childs[i].tagName == tagname)
            tagIndex ++;
    }
    return tagIndex;
},
getXPath :function(node,dir,deep) {
    var xi = autopagerMain.getXIdetify(node,dir);
    if (deep >0 && node.hasChildNodes() &&  (node.childNodes != null) && (node.childNodes.length > 0)) {
        var i=0;
        var childs = node.childNodes;
        for(i=0;i<childs.length;++i) {
            if (childs[i].nodeType == 1) {
                var tagname = childs[i].tagName.toLowerCase();
                if (autopagerMain.getTagCount(childs,i) > 1)
                    tagname = tagname + "[" + autopagerMain.getTagIndex(childs,i) + "]";
                xi = autopagerMain.appendCondition(xi,
                autopagerMain.getXPath(childs[i], dir + tagname +"/" ,deep-1));
            }
        }
    }
    return xi;
},
getTagName : function(node) {
    var tagname = node.tagName.toLowerCase();
    if (tagname == 'td' || tagname == 'th' || tagname == 'tr' || tagname == 'tbody')
        tagname = "table";
    return tagname;
},
getPathDir : function(root,child) {
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
},
getXPathForObject : function(target) {
    var tagname = autopagerMain.getTagName(target);
    var dir = autopagerMain.getPathDir(tagname,target.tagName.toLowerCase());
    var path="//" + tagname;
    var xi = autopagerMain.getXPath(target,dir,1);
    if (xi.length >0)
        path = path +  "[" + xi + "]";
    return path;	
},
onXPathClick : function(event) {
    event.preventDefault();
    var target = event.target;
    if(target != event.currentTarget)
        return false;
    
    if (target.tagName != 'A' && target.parentNode.tagName == 'A')
        target = target.parentNode;
    var path = autopagerMain.getXPathForObject(target);
    content.document.xTestLastDoc = target.ownerDocument;
    var doc = content.document.xTestLastDoc;
    var url = doc.location.href;
    
    var newpath = autopagerMain.xTestXPath(target.ownerDocument,path);
    if (newpath != null && document.autopagerXPathModel == "wizard") {

        if (document.autopagerWizardStep != "contentXPath")
        {
        //step1, select the xpath
         if ( confirm(autopagerConfig.autopagerGetString("xpathconfirm"))) {
            document.autopagerWizardStep = "contentXPath";
            document.autopagerWizardLinkXPath = newpath;
            alert(autopagerConfig.autopagerGetString("selectcontentxpath"));
        }else if(!confirm(autopagerConfig.autopagerGetString("tryagain"))) {
            if(doc.documentElement.autoPagerSelectorEnabled)
                autopagerMain.enableSelector(content.document,true);
        }
        else
            if(!doc.documentElement.autoPagerSelectorEnabled)
                autopagerMain.enableSelector(content.document,true);
       
        }
       else
           {
       
      if ( confirm(autopagerConfig.autopagerGetString("contentxpathconfirm"))) {
            var urlPattern = url;
            if (url.indexOf("?")>0)
                urlPattern = url.substring(0,url.indexOf("?")) + "*";
            var site = autopagerConfig.newSite(urlPattern,url
                ,document.autopagerWizardLinkXPath,newpath,[url]);
            site.createdByYou = true;
            site.owner = autopagerMain.loadMyName();
            while (site.owner.length == 0)
                site.owner = autopagerMain.changeMyName();
            //general link
            if (target.tagName == "A" && (/^( )*javascript( )*\:/.test(target.href.toLowerCase())))
                site.enableJS = false;
            else
                site.enableJS = true;
            autopagerMain.workingAutoSites = autopagerConfig.loadConfig();
            autopagerConfig.insertAt(autopagerMain.workingAutoSites,0,site);
            autopagerConfig.saveConfig(autopagerMain.workingAutoSites);
            document.autopagerXPathModel = "";
            document.autopagerWizardStep = "";
            autopagerConfig.openSetting(urlPattern);
            if(doc.documentElement.autoPagerSelectorEnabled)
                autopagerMain.enableSelector(doc,true);
        }else if(!confirm(autopagerConfig.autopagerGetString("tryagain"))) {
            if(doc.documentElement.autoPagerSelectorEnabled)
                autopagerMain.enableSelector(content.document,true);
        }
        else
            if(!doc.documentElement.autoPagerSelectorEnabled)
                autopagerMain.enableSelector(content.document,true);
       }
    }
    //	if (target.tagName == 'A')
    //		autopagerMain.processNextDoc(target.autoPagerHref);
    event.preventDefault();
    return true;
},
getOffsetTop : function(target) {
    var node=target;
    var top=0;
    while(node&&node.tagName!="BODY") {
        top+=node.offsetTop;
        node=node.offsetParent;
    }
    return top;
},
getOffsetLeft : function(target) {
    var node=target;
    var left=0;
    while(node&&node.tagName!="BODY") {
        left+=node.offsetLeft;
        node=node.offsetParent;
    }
    return left;
},
fireFrameDOMContentLoaded : function(frame)
{
        var newCmdEvent = frame.contentDocument.createEvent('Events');
        newCmdEvent.initEvent('DOMContentLoaded',true, true);         
        var newEvent = frame.contentDocument.createEvent('XULCommandEvents');
        newEvent.initCommandEvent('DOMContentLoaded', true, true,frame.defaultView, 0, false, false, false, false,  newCmdEvent);
        //newEvent.target = frame;
        //document.getElementById("appcontent").dispatchEvent(newEvent);
        frame.contentDocument.dispatchEvent(newEvent);
    
},
onFrameLoad : function(event) {
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
        //alert("autopagerMain.onFrameLoad");
        
        frame.autoPagerInited = true;

        //autopagerMain.fireFrameDOMContentLoaded(frame);
        var doc = frame.contentDocument;
        autopagerMain.scrollWindow(frame.ownerDocument,doc);
        autopagerMain.onStopPaging(frame.ownerDocument);
        
  
        //frame.contentDocument.close();
        
    }
},
processNextDoc : function(doc,url) {
    if (doc.documentElement.getAttribute('enableJS') == 'true') {
        autopagerMain.processInSplitWin(doc);
    }else{
        autopagerMain.processNextDocUsingXMLHttpRequest(doc,url);
    }
},
headEndMark:/<[ ]*\/[ ]*[Hh][Ee][Aa][Dd]>/,
htmlEndMark:/<[ ]*\/[ ]*[Hh][Tt][Mm][Ll]>/,
getHtmlInnerHTML : function(html,enableJS,url,type) {
    var s= html.replace(/top\.location(\.href)*[ ]*\=/g,"atoplocationhref=");
    if (!enableJS) {
        //<base href="http://bbs.chinaunix.net/forumdisplay.php?fid=46">
        
//        var headEnd = s.indexOf("</head>");
//        if (headEnd == -1)
        headEnd = s.search(autopagerMain.headEndMark);
        var htmlEnd = s.search(autopagerMain.htmlEndMark);
        if (htmlEnd>0)
            s = s.substring(0,htmlEnd);
        
        var h = "<head><base href='" + url +
            "'><meta http-equiv='Content-Type' content='" + type +"'/></head> ";

        if (headEnd >0)
            s = h + s.slice(headEnd + "</head>".length);
        else
            s = h+s;
        //s = s.replace(/<script/g,"<!-- script");
        s = s.replace(/<[ ]*[Ss][Cc][Rr][Ii][Pp][Tt]/g,"<! -- script");
        s = s.replace(/ -- script/g,"-- script");
        
        s = s.replace(/<[ ]*\/[ ]*[Ss][Cc][Rr][Ii][Pp][Tt]>/g,"<\/script -->");
    }
    //s = "Location:" + url + "\n\n" + s;
    //alert(s);
    return s;
},
getHtmlBody  : function(html,enableJS) {
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
},
getContentType : function(doc) {
    //var nodes = doc.getElementsByTagName("meta");
    var nodes  = doc.evaluate("//head/meta[@http-equiv]", doc, null, 0, null);
    
    for (var node = null; (node = nodes.iterateNext()); ) {
        if (node.content != "")
        {
            return node.content;
        }
    }
    var type= doc.contentType + "; charset=" + doc.characterSet;
    return type;
},
getSplitBrowserForDoc : function(doc,clone) {
    
	var doClone = clone;
	if (clone && (doc.documentElement.autopagerSplitCloning==true))
	{
		doClone = false;
    }else
	{
		doc.documentElement.autopagerSplitCloning = clone;
    }
    var browse = splitbrowse.getSplitBrowser(doc,true,doClone);
    //splitbrowse.setVisible(browse,this.loadBoolPref("debug"));
    if (clone)
        browse.auotpagerContentDoc = doc;
    return browse;
},
onSplitDocLoadedWithDelay : function(doc,timeout)
{
    setTimeout(function () {
    var browser = splitbrowse.getBrowserNode(doc);
    //browser.autopagerSplitWinFirstDocloaded=true;
    doc.documentElement.autopageCurrentPageLoaded=false;
    try{
        autopagerMain.scrollWindow(browser.auotpagerContentDoc,doc);
        autopagerMain.onStopPaging(browser.auotpagerContentDoc);
    }catch(e)
    {
        var de = doc.documentElement
                doc.documentElement.autopagerSplitCreated = false;
                de.autopagerSplitCreated = false;
                de.autopagerSplitDocInited = false;
                var topDoc = content.document;
                //topDoc.documentElement.autopagerEnabledDoc = null;                
                    topDoc.documentElement.autopagerPagingCount = 0
                setTimeout(function(){
                    topDoc =content.document;
                    de = topDoc.documentElement;
                    doc = topDoc
                    de.autoPagerRunning = false;
                    autopagerMain.onInitDoc(doc,false);
                    doc.documentElement.autopagerSplitCreated = false;
                    doc.documentElement.autopagerSplitDocInited = false;
                    splitbrowse.close(doc);
                    splitbrowse.close(topDoc);

                },100);

    return;
       }
    //autopagerMain.onSplitDocLoaded (doc,true);
    },timeout);
},
getURLNoArch : function (url)
{
    if (url.indexOf("\#")==-1)
        return url
    return url.substring(0,url.indexOf("\#"));
},
getStack : function ()
{
    var stack = "";
  try {
       i.dont.exist+=0; //does not exist - that's the point
   } catch(e)
   {
       stack =  e.stack;
   }
   return stack;
      
},
getListener : function (doc)
{
 function listener(doc) {
    this.connectionCount = 0;
    this.maxCount = 0;
    this.stopped = false;
    this.doc = doc;
    this.removed=false;
    this.requests = new Array();
    
    this.observe = function(aSubject, aTopic, aData) {

    
         var httpChannel = aSubject.QueryInterface(Components.interfaces.nsIHttpChannel);
         if (httpChannel.notificationCallbacks instanceof XMLHttpRequest &&  httpChannel.referrer && ( httpChannel.referrer.spec  == autopagerMain.getURLNoArch(this.doc.location.href)))
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
//                            alert(e)
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

    autopagerMain.alertErr("Observer stopped, max count:" + this.maxCount + " current connection " + this.connectionCount);
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
        autopagerMain.onSplitDocLoadedWithDelay(this.doc,100);
    }
    }
    
}
}
return new listener(doc);
},
observeConnection : function (doc)
{
    var listener = this.getListener(doc);
    // get the observer service and register for the two coookie topics.
    var observerService = Components.classes["@mozilla.org/observer-service;1"]
                                    .getService(Components.interfaces.nsIObserverService);
    observerService.addObserver(listener, "http-on-modify-request", false);
    //observerService.addObserver(listener, "http-on-examine-response", false);
    return listener;
},
autopagerSimulateClick : function(win,doc,node) {
    var evt = node.ownerDocument.createEvent("MouseEvents");
    evt.initMouseEvent("click", true, true, win,
                0, 0, 0, 0, 0, false, false, false, false, 0, null);
    //handle ajax site
    var listener=null;
    if (doc.documentElement.getAttribute('autopagerAjax')=='true')
    {
        //observe http conections
        listener = this.observeConnection(node.ownerDocument);
    }
    var canceled = !node.dispatchEvent(evt);
    if (doc.documentElement.getAttribute('autopagerAjax')=='true')
    {
        //observe http conections
        if (listener!=null)
        {
            setTimeout(function(){ listener.stopObserveConnection()},1000);
            //clear after teen seconds whethere success or not
            setTimeout(function(){ listener.removeObserveConnection()},10000);   
        }
    }
    
    if(canceled) {
        // A handler called preventDefault
        //alert("canceled");
    } else {
        // None of the handlers called preventDefault
        //alert("not canceled");
    }
},
processInSplitWin : function(doc){
    try{
        var b = autopagerMain.getSplitBrowserForDoc(doc,false);
        var de = doc.documentElement
        //alert(nodes.length);
        var urlNodes = autopagerMain.findNodeInDoc(b.contentDocument,de.getAttribute('linkXPath'),de.getAttribute('enableJS') == 'true');
        //alert(urlNodes);
        if (urlNodes != null && urlNodes.length >0) {
              nextUrl = autopagerMain.getNextUrl(doc,de.getAttribute('enableJS') == 'true',urlNodes[0]);
        }else
              nextUrl = null;
           //alert(nextUrl);
        de.autopagernextUrl = nextUrl;
 
        var node = doc.documentElement.autopagernextUrl;
        if (node.constructor == String)
            b.loadURI(doc.documentElement.autopagernextUrl,null,null);
        else {
            //alert("autopagerMain.autopagerSimulateClick");
            if (node.tagName == "A")
                node.target = "_self";
            autopagerMain.autopagerSimulateClick(b.contentWindow, doc,node);
        }
    }catch (e){
        autopagerMain.alertErr("unable to load url:" + e);
    }
    
},
processInSplitWinByUrl  : function(doc,url){
    try{
        var win = autopagerMain.getSplitBrowserForDoc(doc,false);
        win.loadURI(url,null,null);
    }catch (e){
        autopagerMain.alertErr("unable to load url:" + url);
    }
    
},
loadToFrame : function (frame,responseText,contentType,contentCharset,enableJS,url)
{
    // Convert the HTML text into an input stream.
    var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
                    createInstance(Ci.nsIScriptableUnicodeConverter);
    converter.charset = "UTF-8";
    var stream = converter.convertToInputStream(responseText);

    // Set up a channel to load the input stream.
    var channel = Cc["@mozilla.org/network/input-stream-channel;1"].
                  createInstance(Ci.nsIInputStreamChannel);
    channel.setURI(url);
    channel.contentStream = stream;

    // Load in the background so we don't trigger web progress listeners.
    var request = channel.QueryInterface(Ci.nsIRequest);
    request.loadFlags |= Ci.nsIRequest.LOAD_BACKGROUND;

    // Specify the content type since we're not loading content from a server,
    // so it won't get specified for us, and if we don't specify it ourselves,
    // then Firefox will prompt the user to download content of "unknown type".
    var baseChannel = channel.QueryInterface(Ci.nsIChannel);
    baseChannel.contentType = contentType;


    baseChannel.contentCharset = contentCharset;


    var docShell = frame.contentWindow;
    
    var webNav = docShell.QueryInterface(Ci.nsIWebNavigation);
    webNav.stop(Ci.nsIWebNavigation.STOP_NETWORK);
    
 //   frame.contentWindow.allowJavascript = false;
    docShell.allowAuth = false;
    docShell.allowPlugins = false;
    docShell.allowMetaRedirects = false;
    docShell.allowSubframes = false;
    docShell.allowImages = true;
    

    docShell.allowJavascript = enableJS;
    var uriLoader = Cc["@mozilla.org/uriloader;1"].getService(Ci.nsIURILoader);
    uriLoader.openURI(channel, true, docShell);
    
},
loadChannelToFrame : function (frame,channel,enableJS)
{
    
//    var webNav = frame.contentWindow.QueryInterface(Ci.nsIWebNavigation);
//    webNav.stop(Ci.nsIWebNavigation.STOP_NETWORK);

   var win = frame.contentWindow.QueryInterface(Ci.nsIDOMWindow);
 //   var docShell = win.QueryInterface(Ci.nsIDocShell);

//    frame.contentWindow.allowJavascript = false;
    frame.contentWindow.allowAuth = false;
    frame.contentWindow.allowPlugins = false;
    frame.contentWindow.allowMetaRedirects = false;
    frame.contentWindow.allowSubframes = false;
    frame.contentWindow.allowImages = true;
    
    
    frame.contentWindow.allowJavascript = enableJS;

    var uriLoader = Cc["@mozilla.org/uriloader;1"].getService(Ci.nsIURILoader);
    uriLoader.openURI(channel, true, frame.contentDocument);
    
},
processNextDocUsingXMLHttpRequest : function(doc,url){
    var xmlhttp=null;
    //alert(doc.location.href);
    try{
        try{
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }catch(e){
            xmlhttp = new XMLHttpRequest();
        }
        var type = autopagerMain.getContentType(doc);
        xmlhttp.overrideMimeType(type);
        xmlhttp.onreadystatechange = function (aEvt) {
            if (this.autopagerDebug)
                autopagerMain.logInfo(xmlhttp.readyState + " " + xmlhttp.status,
                xmlhttp.readyState + " " + xmlhttp.status);
            if(xmlhttp.readyState == 4) {
                if(xmlhttp.status == 200) {
                        var frame = autopagerMain.getSelectorLoadFrame(doc);
                        frame.autoPagerInited = false;
                        frame.contentDocument.clear();
                        frame.contentDocument.documentElement.autopageCurrentPageLoaded = false;
                        //alert(xmlhttp.responseText);
                        var html = autopagerMain.getHtmlInnerHTML(xmlhttp.responseText,doc.documentElement.getAttribute('enableJS') == 'true',url,type);
                        //frame.contentDocument.write(autopagerMain.getHtmlInnerHTML(xmlhttp.responseText,doc.documentElement.getAttribute('enableJS') == 'true',url));
                        try
                        {
                            frame.contentDocument.documentElement.innerHTML = html
                            //frame.contentDocument.open("about:blank");
                            //frame.contentDocument.write(html);
                        }catch(e)
                        {
                            alert(e)
                        }
                        //autopagerMain.loadChannelToFrame(frame,xmlhttp.channel,true);
                        setTimeout(function (){
                            if (!frame.autoPagerInited) {
                                //autopagerMain.fireFrameDOMContentLoaded(frame);
                                var newDoc = frame.contentDocument;
                                var s = newDoc.documentElement.innerHTML
                                //
                                frame.autoPagerInited = true;
                                autopagerMain.scrollWindow(doc,newDoc);
                                autopagerMain.onStopPaging(doc);
                            }
                        }
                        ,100);
                        //xmlhttp.abort();
                }
                else {
                    autopagerMain.alertErr("Error loading page:" + url);
                    doc.documentElement.autopagerEnabled = true;
                    autopagerMain.onStopPaging(doc);
                }
                
            }
        };
        xmlhttp.open("GET", url, true);
        //window.content.status = "loading ... " + url;
        xmlhttp.send(null);
        
    }catch (e){
        autopagerMain.alertErr("unable to load url:" + url);
        doc.documentElement.autopagerEnabled = true;
    }
    
},

// Evaluate an XPath expression aExpression against a given DOM node
// or Document object (aNode), returning the results as an array
// thanks wanderingstan at morethanwarm dot mail dot com for the
// initial work.
autopagerEvaluateXPath : function(aNode, path,enableJS) {
    var doc = (aNode.ownerDocument == null) ? aNode : aNode.ownerDocument;
    //var aNode = doc.documentElement;
    var aExpr = autopagerMain.preparePath(doc,path,enableJS);
    var test = doc.location.href
    var found = new Array();
    try{
        //var doc = aNode.ownerDocument == null ?
        //		aNode.documentElement : aNode.ownerDocument.documentElement;
        var result = doc.evaluate(aExpr, aNode, null, 0, null);
        
//        var xpe = new XPathEvaluator();
//        var nsResolver = xpe.createNSResolver(doc.documentElement);
//        var result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);
//        
        var res;
        while (res = result.iterateNext())
            found.push(res);
        //alert(found.length);
    }catch(e) {
        autopagerMain.alertErr(autopagerConfig.autopagerFormatString("unableevaluator",[aExpr,e]));
    }
    return found;
},
getDocURL : function(doc,enableJS)
{
    var href = "";
    if (enableJS && doc.location!=null) {
        href = doc.location.href;
    }
    else {
        href = doc.baseURI;
    }    
//    if (href=="about:blank")
//    {
//        var nodes =doc.evaluate("//head/base", doc, null, 0, null);
//        for (var node = null; (node = nodes.iterateNext()); ) {
//            if (node.href != "about:blank")
//            {
//                href = node.href;
//                break;
//            }
//        }
//    }        
    return href;
},
preparePath : function(doc,path,enableJS) {
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
        autopagerMain.alertErr(e);
    }
    return newPath;
    
},
removeElements : function (node,xpath,enableJS)
{
    if (xpath==null || xpath.length==0)
        return;
    var doc = (node.ownerDocument == null) ? node : node.ownerDocument;
    var xpe = new XPathEvaluator();
    var nsResolver = xpe.createNSResolver(node);
    
//    alert(node.innerHTML)
    var aExpr
    for(var i=0;i<xpath.length;i++)
    {
       try{
			var orgPath = autopagerMain.preparePath(doc,xpath[i],enableJS);
			aExpr = orgPath;
			aExpr = aExpr.replace(/^( )*\/\//g,"*//");
			aExpr = aExpr.replace(/\|( )*\/\//g,"| *//");
			//autopagerMain.removeElementByXPath(xpe,aExpr,nsResolver,node);
			var aExpr2 = orgPath;
			aExpr2 = aExpr2.replace(/^( )*\/\//g,"");
			aExpr2 = aExpr2.replace(/\|( )*\/\//g,"| ");
			if (aExpr != aExpr2)
					aExpr = aExpr + " | " + aExpr2;
			autopagerMain.removeElementByXPath(xpe,aExpr,nsResolver,node);
        }catch(e)
       {
             autopagerMain.alertErr(e)
       }
    }
//   alert(node.innerHTML)
//    var nodes = autopagerMain.findNodeInDoc(node,xpath,enableJS);
  
},
removeElementByXPath : function (xpe,aExpr,nsResolver,node)
{
	try{
	    var xpathExpr = xpe.createExpression(aExpr,nsResolver)
        var result = xpathExpr.evaluate( node, 0, null);
        var res;
        var nodes = [];
        while (res = result.iterateNext())
        {
            nodes.push(res);
        }
  for(var k=0;k<nodes.length;++k) {
        nodes[k].parentNode.removeChild(nodes[k])
    }
        }catch(e)
       {
             autopagerMain.alertErr(e)
       }

},
xpath :"//table[tbody/tr/td/@class='f']",
////a[contains(font/text(),'Next')]
///a[.//text() = '?????????']
//className :"res",
//tagName  : "DIV",
scrollWindow : function(container,doc) {
    if (doc.documentElement.autopageCurrentPageLoaded != null 
        && doc.documentElement.autopageCurrentPageLoaded == true)
        return false;
    doc.documentElement.autopageCurrentPageLoaded = true;
    var de = container.documentElement;
    
    try{
        if (this.autopagerDebug)
            autopagerMain.logInfo("autopagerMain.scrollWindow","autopagerMain.scrollWindow");
        //validate the url first
        var site = de.autoSiteSetting;
        var reg = this.getRegExp (site)
        var url = this.getDocURL(doc,de.getAttribute('enableJS') == 'true');
        if (de.getAttribute('enableJS') != 'true' || reg.test(url))
        {
        
        var nextUrl=de.autopagernextUrl;
        var xpath = de.contentXPath;
        
        var nodes = autopagerMain.findNodeInDoc(doc,xpath,de.getAttribute('enableJS') == 'true');
        
        autopagerMain.logInfo(nodes.length + " at "+  doc.location.href
                ,nodes.length + " at "+  doc.location.href);
        
        if (nodes.length >0)
        {
           
            if (this.autopagerDebug)
                autopagerMain.logInfo(nodes.toString(),nodes.toString());


			var scrollContainer = null;
			if (de.containerXPath != null)
			{
					autopagerContainer = autopagerMain.findNodeInDoc(
							de,de.containerXPath,false);
					if (autopagerContainer!=null)
					{
							scrollContainer = autopagerContainer[0];
							scrollContainer.addEventListener("scroll",autopagerMain.scrollWatcher,true);
					//scrollContainer.onscroll = autopagerMain.scrollWatcher;
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
			de.autoPagerPageHeight.push(sh);

            //alert(nodes);
            var i=0;
            var divStyle = autopagerMain.loadUTF8Pref("pagebreak");// "clear:both; line-height:20px; background:#E6E6E6; text-align:center;";
            var div= autopagerMain.createDiv(container,"",divStyle); 

            div.innerHTML = "<span><a target='_blank' href='http://autopager.teesoft.info/help.html'>"  + autopagerConfig.autopagerFormatString("pagebreak",[nextUrl,"&nbsp;&nbsp;&nbsp;" + (++de.autoPagerPage) + "&nbsp;&nbsp;&nbsp;"]) + "</a></span>";
            var insertPoint =	de.autopagerinsertPoint;

            insertPoint.parentNode.insertBefore(div,insertPoint);
            for(i=0;i<nodes.length;++i) {
                try{
                    var newNode = nodes[i];
                    newNode = container.importNode (newNode,true);
                    autopagerMain.removeElements(newNode,de.removeXPath,de.getAttribute('enableJS') == 'true')
                    newNode = insertPoint.parentNode.insertBefore(newNode,insertPoint);
                    
                }catch(e) {
                    autopagerMain.alertErr(e);
                }
            }
            //alert(nodes.length);
            var urlNodes = autopagerMain.findNodeInDoc(doc,de.getAttribute('linkXPath'),de.getAttribute('enableJS') == 'true');
            //alert(urlNodes);
            if (urlNodes != null && urlNodes.length >0) {
                nextUrl = autopagerMain.getNextUrl(container,de.getAttribute('enableJS') == 'true',urlNodes[0]);
            }else
                nextUrl = null;
            //alert(nextUrl);
            de.autopagernextUrl = nextUrl;
            //container.close();
            }
        }
    }catch(e) {
        autopagerMain.alertErr(e);
    }

   if (doc.defaultView.frames != null) {
        //alert(doc.defaultView.frames.length);
        var i=0;
        for(i=0;i<doc.defaultView.frames.length;++i) {
            //alert(doc.defaultView.frames[i]);
            autopagerMain.scrollWindow(container,doc.defaultView.frames[i].document);
            //doc.defaultView.frames[i].addEventListener("load", onPageLoad, true);
        }
    }
    return true;
},
getNextUrl : function(container,enableJS,node) {
    if(node == null)
        return null;
    if (!enableJS && node.tagName == "A")
        return autopagerMain.fixUrl(container,node.href);
    if (node.tagName == "INPUT")
        return node;
    return node;
    
},
onStartPaging  : function(doc) {
    doc.documentElement.autopagerPagingCount ++;
    try{
        autopagerMain.logInfo(autopagerConfig.autopagerFormatString("autopaging",[ doc.location.href]),
        autopagerConfig.autopagerFormatString("autopaging",[ doc.location.href]));
    }catch(e) {		
    }
    autopagerMain.pagingWatcher();
},
onStopPaging : function(doc) {
    try{
        autopagerMain.logInfo(autopagerConfig.autopagerFormatString("autopageOn",[doc.location.href]),
        autopagerConfig.autopagerFormatString("autopageOnTip",[doc.location.href]));
    }catch(e) {		
    }
    doc.documentElement.autopagerEnabled = true;
    //if (doc.documentElement.autopagerPagingCount>0)
        doc.documentElement.autopagerPagingCount--;
    if (doc.documentElement.autopagerPagingCount <= 0)
    {
        //.defaultView.top.content.document
                autopagerMain.hiddenDiv(autopagerMain.getPagingWatcherDiv(doc,false),true);
            autopagerMain.setGlobalImageByStatus(autopagerMain.getGlobalEnabled());
    }
},
getPagingWatcherDiv : function(doc,create)
{
	var divName = "autoPagerBorderPaging";
    var div = doc.getElementById(divName);
    if (create && !div) {
        var str = autopagerConfig.autopagerGetString("loading");
    var style = autopagerMain.getLoadingStyle();
        div = autopagerMain.createDiv(doc,divName,style);
        div.innerHTML = str;//"<b>Loading ...</b>";
        
    }
    return div;
	
},
onNoPrompt : function (event)
{
   var showonnew = event.currentTarget;//doc.getElementById("autopagerSowOnNewSiteCheckbox");
   autopagerMain.saveBoolPref("noprompt",!showonnew.checked)
 
},
getPagingOptionDiv : function(doc)
{
	var divName = "autoPagerBorderOptions";
    var div = doc.getElementById(divName);
    var showonnew = doc.getElementById("autopagerSowOnNewSiteCheckbox");
    
	if (!div) {
        var overEvent = "onmouseover='document.documentElement.setAttribute(\"over\",true);' onmouseout='document.documentElement.setAttribute(\"over\",false);'";
        var str = "<div style='cursor:move;height:18px;background-color: gray;margin:0px;width:100%;' class='autoPagerS' "
  + overEvent + " >"
+"<table valign='top' cellpadding='0' cellspacing='0' id='autoPagerBorderOptionsTitle' class='autoPagerS' style='margin:0px;width:100%' "+ overEvent + ">"
+"<tbody class='autoPagerS'><tr class='autoPagerS' ><td class='autoPagerS'  width='80%'><a alt='" + autopagerConfig.autopagerGetString("optionexplain") +"'  href='javascript:autopagerMain.showConfirmTip();'><b class='autoPagerS'>"
+autopagerConfig.autopagerGetString("optiontitle") + "</b></a></td><td class='autoPagerS'  width='10%' align='right'>"
+ "<a id='autopagerOptionHelp' target='_blank' title='Help' href='http://autopager.teesoft.info/help.html'><img  class='autoPagerS'  style='border: 0px solid ; width: 9px; height: 7px;' alt='Help'  src='chrome://autopagerimg/content/question.gif'></a>"
+ "</td><td class='autoPagerS'  width='10%' align='right'>"
+ "<a id='autopagerOptionClose' title='Close'  href='javascript:autopagerMain.enabledInThisSession(false);'><img  class='autoPagerS'  style='border: 0px solid ; width: 9px; height: 7px;' alt='Close'  src='chrome://autopagerimg/content/vx.png'></a></td></tr></tbody></table></div> "
+ "<ul class='autoPagerS' style='margin-left:0;margin-top:0; margin-bottom:0;width:100%;list-style-type:disc !important;' "+ overEvent + ">"
+"<li class='autoPagerS' width='100%' style='' ><a href='javascript:autopagerMain.HighlightNextLinks()''>"+ autopagerConfig.autopagerGetString("highlightnextlinks") +"</a></li>"
+"<li class='autoPagerS' width='100%' style='' ><a href='javascript:autopagerMain.HighlightAutoPagerContents()''>"+ autopagerConfig.autopagerGetString("highlightcontents") +"</a></li>"
+ "<li class='autoPagerS' width='100%' style='' ><a href='javascript:autopagerMain.enabledInThisTime(true)'>"+ autopagerConfig.autopagerGetString("enableshort") +"</a> / <a href='javascript:autopagerMain.enabledInThisTime(false)'>D</a>:"
+ autopagerConfig.autopagerGetString("thistime") + "</li>"
+ "<li class='autoPagerS' width='100%' style='' ><a href='javascript:autopagerMain.enabledInThisSession(true)'>"+ autopagerConfig.autopagerGetString("enableshort") +"</a> / <a"
+ " href='javascript:autopagerMain.enabledInThisSession(false)'>"+ autopagerConfig.autopagerGetString("disableshort") +"</a>:"
+ autopagerConfig.autopagerGetString("thissession") + "</li>"
+ "<li class='autoPagerS' width='100%' style='' ><a href='javascript:autopagerMain.enabledInNextPagesAlways(false)'>"+ autopagerConfig.autopagerGetString("enableshort") +"</a> / <a"
+ " href='javascript:autopagerMain.enabledInNextPagesAlways(true)'>"+ autopagerConfig.autopagerGetString("alwaysenableshort") +"</a>:"
+ autopagerConfig.autopagerFormatString("nextpages",["<input style='float:none !important;' class='autoPagerS' maxlength='3' size='1' id='autopagercount' value='3'>"]) +"</li>"
+ "<li class='autoPagerS' width='100%' style='' ><a href='javascript:autopagerMain.enabledThisSite(true)'>"+ autopagerConfig.autopagerGetString("alwaysenableshort") +"</a> / <a"
+ " href='javascript:autopagerMain.enabledThisSite(false)'>"+ autopagerConfig.autopagerGetString("alwaysdisableshort") +"</a>:"
+ autopagerConfig.autopagerGetString("thissite") + "</li></ul>" +
"<div class='autoPagerS'><INPUT TYPE='CHECKBOX' id='autopagerSowOnNewSiteCheckbox'/>" + autopagerConfig.autopagerGetString("ShowOnNewSite") + "</div>";
    var style = autopagerMain.getOptionStyle();
    
        div = autopagerMain.createDiv(doc,divName,style);
         
        if (div.style.width == "")
            div.style.width = "190px";
        div.innerHTML = str;//"<b>Loading ...</b>";
        var links=autopagerMain.autopagerEvaluateXPath(div,".//a[not (@id='autopagerOptionHelp')]",false);
        for(var i=0;i<links.length;i++)
        {
             links[i].addEventListener("click",autopagerMain.onConfirmClick,true);
			 if (links[i].getAttribute('id') != 'autopagerOptionClose')
				links[i].title = autopagerConfig.autopagerGetString("optionexplain");
             links[i].style.color="rgb(0,0,204)";
             links[i].className = 'autoPagerS';
        }

		doc.addEventListener("mousedown",autopagerMain.initializedrag,false);
        doc.addEventListener("mouseup",autopagerMain.stopdrag,false);

        showonnew = doc.getElementById("autopagerSowOnNewSiteCheckbox");
        showonnew.addEventListener("click",autopagerMain.onNoPrompt,false);
         
    }
    if (!autopagerMain.loadBoolPref("noprompt"))
        showonnew.checked = true;
    
    return div;
	
},
showConfirmTip : function()
{
    autopagerMain.openSettingForDoc(content.document);
    //alert(autopagerConfig.autopagerGetString("optionexplain"));
},
stopdrag : function(event){
    var div=event.target;
    var doc = event.target.ownerDocument;
    doc.removeEventListener("mousemove",autopagerMain.dragdrop,false);
    doc.removeEventListener("autopagerMain.selectstart",autopagerMain.selectstart,true);
},
initializedrag : function(event)
{
    var doc = event.target.ownerDocument;
    //alert(doc.documentElement);
    //alert(doc.documentElement.over);
    if (doc.documentElement.getAttribute("over")=='true')
    {
            var objDiv = doc.getElementById("autoPagerBorderOptions");
            doc.documentElement.startX = window.innerWidth - event.pageX - parseInt(objDiv.style.right);
            doc.documentElement.startY = window.innerHeight - event.pageY - parseInt(objDiv.style.bottom);
            doc.addEventListener("mousemove",autopagerMain.dragdrop,false);
            doc.addEventListener("autopagerMain.selectstart",autopagerMain.selectstart,true);
            return false;
    }
    
},
selectstart : function(event)
{
    event.preventDefault();
    return false;
},
dragdrop : function(event)
{
    var div=event.target;
    var doc = event.target.ownerDocument;
    var objDiv = doc.getElementById("autoPagerBorderOptions");
    
    //if (doc.documentElement.getAttribute("over")=='true')
    {
            objDiv.style.right=(window.innerWidth - event.pageX -  doc.documentElement.startX) + 'px';
            objDiv.style.bottom=(window.innerHeight - event.pageY - doc.documentElement.startY ) + 'px';
    }
    
},
onConfirmClick : function(event)
{
    event.preventDefault();
    var link = event.target;
    if (link.tagName.toLowerCase() != "a")
        link = link.parentNode;
    var exp = link.href;
    document.autopagerConfirmDoc = link.ownerDocument;
    
    eval(exp);
    document.autopagerConfirmDoc = null;
},
HighlightNextLinks : function()
{
    var doc=document.autopagerConfirmDoc ;
    var urlNodes = autopagerMain.findNodeInDoc(doc,
            doc.documentElement.getAttribute('linkXPath'),doc.documentElement.getAttribute('enableJS') == 'true');
    if (urlNodes == null || urlNodes.length == 0)
        return;
    for(var i=0;i<urlNodes.length;i++)
        autopagerMain.createRegionDivs(doc,urlNodes[i],i);
    if (doc.documentElement.autopagerHighlightedNextLinkCount==null)
        doc.documentElement.autopagerHighlightedNextLinkCount = 0;
    if (doc.documentElement.autopagerHighlightedNextLinkCount<urlNodes.length)
        doc.documentElement.autopagerHighlightedNextLinkCount = urlNodes.length;
    if(doc.documentElement.autopagerHighlightedNextLinkNumber == null)
        doc.documentElement.autopagerHighlightedNextLinkNumber = 0;
    if (doc.documentElement.autopagerHighlightedNextLinkNumber >= urlNodes.length)
        doc.documentElement.autopagerHighlightedNextLinkNumber  = 0;
    var node = urlNodes[doc.documentElement.autopagerHighlightedNextLinkNumber];
    var left = autopagerMain.getOffsetLeft(node);
    var top = autopagerMain.getOffsetTop(node);
    doc.defaultView.scrollTo(left,top);
    node.focus();

    doc.documentElement.autopagerHighlightedNextLinkNumber ++;
},
HighlightAutoPagerContents : function()
{
    var doc=document.autopagerConfirmDoc ;
    var urlNodes = autopagerMain.findNodeInDoc(doc,
            doc.documentElement.getAttribute('contentXPath'),doc.documentElement.getAttribute('enableJS') == 'true');
    if (urlNodes == null || urlNodes.length == 0)
        return;
    for(var i=0;i<urlNodes.length;i++)
        autopagerMain.createRegionDivs(doc,urlNodes[i],i);
    if (doc.documentElement.autopagerHighlightedNextLinkCount==null)
        doc.documentElement.autopagerHighlightedNextLinkCount = 0;
    if (doc.documentElement.autopagerHighlightedNextLinkCount<urlNodes.length)
        doc.documentElement.autopagerHighlightedNextLinkCount = urlNodes.length;
},
enabledInNextPagesAlways : function(always)
{
    var doc=document.autopagerConfirmDoc ;
    var count = doc.getElementById("autopagercount").value;
    var countNumber = parseInt(count);
    if (isNaN(countNumber))
    {
        alert("please input a integer.");
        return;
    }
    autopagerMain.enabledInNextPages(true,countNumber);
    if (always)
    {
        var host = doc.location.host;
        var guid = doc.documentElement.autopagerGUID;
        autopagerMain.autopagerConfirmSites = autopagerConfig.loadConfirm();
        autopagerConfig.addConfirm(autopagerMain.autopagerConfirmSites,guid,countNumber,host,true);
        autopagerConfig.saveConfirm(autopagerMain.autopagerConfirmSites);
    }
},
enabledInThisTime : function(enabled)
{
    autopagerMain.enabledInNextPages(enabled,1);
},
enabledInNextPages : function(enabled,count)
{
    var doc = document.autopagerConfirmDoc;
    var de =doc.documentElement;
    de.autopagerUserConfirmed= true;
    de.autopagerSessionAllowed= true;
    de.autopagerAllowedPageCount=de.autoPagerPage+count;
    de.autopagerUserAllowed=enabled;
    de.autopagerEnabled = enabled;
     autopagerMain.hiddenOptionDiv(doc);
     autopagerMain.scrollWatcher();
},
hiddenOptionDiv : function(doc)
{
    autopagerMain.hiddenDiv(autopagerMain.getPagingOptionDiv(doc),true);
    autopagerMain.hiddenDiv(doc.getElementById("autoPagerLabel"),true);
    
    //alert(doc.documentElement.autopagerHighlightedNextLinkCount)
    for(var i=0;i<doc.documentElement.autopagerHighlightedNextLinkCount;i++)
    {
    try{
        autopagerMain.hiddenRegionDivs(doc,i);
    }catch(e)
    {}
    }
    doc.documentElement.autopagerHighlightedNextLinkCount = 0;
},
enabledThisSite : function(enabled)
{
    autopagerMain.enabledInThisSession(enabled);
    var doc = document.autopagerConfirmDoc;
    var host = doc.location.host;
    var guid = doc.documentElement.autopagerGUID;
    autopagerMain.autopagerConfirmSites = autopagerConfig.loadConfirm();
    autopagerConfig.addConfirm(autopagerMain.autopagerConfirmSites,guid,-1,host,enabled);
    autopagerConfig.saveConfirm(autopagerMain.autopagerConfirmSites);
    autopagerMain.scrollWatcher();
},
enabledInThisSession : function(enabled)
{
    var doc = document.autopagerConfirmDoc;
    var de =doc.documentElement;
    de.autopagerUserConfirmed= true;
    de.autopagerSessionAllowed= enabled;
    de.autopagerAllowedPageCount=-1;
    de.autopagerUserAllowed=enabled;
    de.autopagerEnabled = enabled;
     autopagerMain.hiddenOptionDiv(doc);
     autopagerMain.scrollWatcher();
},
pagingWatcher : function() {
    var doc = content.document;
    var de = doc.documentElement;
    try{
        if((autopagerMain.getGlobalEnabled() ||  de.forceLoadPage>0) && de.autopagerEnabledDoc!=null) {
    	    var i =0;
            var Enable = false;
            var loading = false;
            for(i=0;i<de.autopagerEnabledDoc.length;i++) {
                doc = de.autopagerEnabledDoc[i];
                Enable = doc.documentElement.autopagerPagingCount>0;
                if (Enable) {
                     autopagerMain.hiddenDiv(autopagerMain.getPagingWatcherDiv(doc,true),false);
                    loading = true;
                }
            }
            if (loading)
                {
                    document.autoPagerImageShowStatus = !document.autoPagerImageShowStatus;
                    autopagerMain.setGlobalImageByStatus(document.autoPagerImageShowStatus);
                    var self = arguments.callee;
                    setTimeout(self, 300);//10 +Math.random()*200);                    
                }
            
        }
        else {
            autopagerMain.hiddenDiv(autopagerMain.getPagingWatcherDiv(doc,false),true);
            autopagerMain.setGlobalImageByStatus(autopagerMain.getGlobalEnabled());
        }
    }catch(e) {
        autopagerMain.setGlobalImageByStatus(autopagerMain.getGlobalEnabled());
        autopagerMain.hiddenDiv(autopagerMain.getPagingWatcherDiv(doc,false),true);
    }
    
},
fixUrl : function(doc,url) {
    if (/^( )*javascript( )*\:/.test(url.toLowerCase()))
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
},
findNodeInDoc : function(doc,path,enableJS) {
    autopagerMain.xpath = path;
    if (autopagerMain.xpath.length>0 && autopagerMain.xpath[0].length == 1)
        return autopagerMain.autopagerEvaluateXPath(doc,autopagerMain.xpath,enableJS);
    else {
        var result = autopagerMain.autopagerEvaluateXPath(doc,autopagerMain.xpath[0],enableJS);
        for(var i=1;i<autopagerMain.xpath.length;i++) {
            var nodes = autopagerMain.autopagerEvaluateXPath(doc,autopagerMain.xpath[i],enableJS);
            for(var k=0;k<nodes.length;++k) {
                result.push( nodes[k]);
            }
        }
        return result;
    }
    
},
xPathTest : function(doc) {
    if (!doc.xTestLastDoc)
        doc.xTestLastDoc = doc;
    autopagerMain.xTestXPath(doc,autopagerMain.xpath);
},
xTestXPath : function(doc,path) {
    
    var newpath = path;//prompt("Please input the xpath:",path);
    var key = "inputxpath";
    if (document.autopagerXPathModel != "wizard") {
        key = "inputxpath";
    }
    else
        key = "modifyxpath";
    newpath =prompt(autopagerConfig.autopagerGetString(key),path);
    
    if (!newpath || newpath.length==0)
        return null;
    autopagerMain.xpath = newpath;
    var found = autopagerMain.autopagerEvaluateXPath(doc,autopagerMain.xpath,false);
    if (found==null || found.length ==0) {
        //try on all frame
         if (document.autopagerXPathModel != "wizard") {
            if (doc.defaultView.frames != null) {
                //alert(doc.defaultView.frames.length);
                var i=0;
                for(i=0;i<doc.defaultView.frames.length;++i) {
                    found = autopagerMain.autopagerEvaluateXPath(doc.defaultView.frames[i].document,autopagerMain.xpath,false);
                    if (found!=null && found.length >0)
                        break;
                }
            }

         }
         if (found==null || found.length ==0) 
        {
                alert(autopagerConfig.autopagerGetString("xpathreturnnothing"));
                return null;
        }
    }
    
    var w=window.open();
    var newDoc = 	w.document;
    autopagerMain.createDiv(newDoc,"","").innerHTML = "<h1>Result for XPath: " + autopagerMain.xpath + "</h1><br/>" ;
    for(var i=0;i<found.length;++i) {
        try{
            //alert(found[i].tagName);
            var div = autopagerMain.createDiv(newDoc,"","");
            div.appendChild(newDoc.importNode( found[i],true));
        }catch(e) {
            autopagerMain.alertErr(e);
        }
    }
    
    return newpath;
},
showAutoPagerMenu : function() {
    autopagerMain.showMyName();
    
    var popup = document.getElementById("autopager-popup");
    popup.hidden=false;
    popup.addEventListener("popuphidden", function(ev) {
        if(ev.currentTarget != ev.target) return;
        ev.target.removeEventListener("popuphidden", arguments.callee, false);
        ev.target.hidden=true;
    }, false);    
    popup.showPopup();
    
}
,
onEnable : function() {
    var enabled = !autopagerMain.getGlobalEnabled();
    autopagerMain.setGlobalEnabled( enabled);
	if (enabled)
	{
		window.removeEventListener("scroll",autopagerMain.scrollWatcher,false);
		window.addEventListener("scroll",autopagerMain.scrollWatcher,false);
    }
	else
		window.removeEventListener("scroll",autopagerMain.scrollWatcher,false);

	this.handleCurrentDoc();
},
statusClicked : function(event) {
    if(event.currentTarget != event.target) return;
    if(event.button == 2) {
        event.preventDefault();
        autopagerMain.showAutoPagerMenu();
    }
    else if(event.button == 0) {
        var popup = document.getElementById("autopager-popup");
        popup.hidden=true;
        popup.hidePopup();
        var image = document.getElementById("autopager_status");
        autopagerMain.onEnable();
    }
},
setGlobalImageByStatus : function(enabled) {
    try{
        if (enabled)
            autopagerMain.setGlobalStatusImage("chrome://autopager/skin/autopager-small.on.gif");
        else
            autopagerMain.setGlobalStatusImage("chrome://autopager/skin/autopager-small.off.gif");
    }catch(e) {
        //alert(e);
    }
},
setGlobalStatusImage : function(url) {
    var image = document.getElementById("autopager_status");
    image.src=url;
},
getGlobalEnabled : function() {
    try{
        if (!document.autoGlobalPagerEnabled)
            return false;
        else
            return true;
    }catch(e) {
        autopagerMain.alertErr(e);
        return false;
    }
},
saveEnableStat : function(enabled) {
    autopagerMain.getAutopagerPrefs().setBoolPref(".enabled", enabled); // set a pref
},
loadEnableStat : function() {
    return autopagerMain.getAutopagerPrefs().getBoolPref(".enabled"); // get a pref
},
saveMyName : function(myname) {
    autopagerMain.saveUTF8Pref("myname", myname); // set a pref
},
loadMyName  : function() {
    try{
        
        return autopagerMain.loadUTF8Pref("myname"); // get a pref
    }catch(e) {
        //autopagerMain.alertErr(e);
    }
    return "";
},
getLoadingStyle : function()
{
 try{
        
        return autopagerMain.loadUTF8Pref("loading"); // get a pref
    }catch(e) {
        //autopagerMain.alertErr(e);
    }
    return "";
},
getOptionStyle : function()
{
 try{
        
        return autopagerMain.loadUTF8Pref("optionstyle"); // get a pref
    }catch(e) {
        //autopagerMain.alertErr(e);
    }
    return "";
},
setLoadingStyle : function(value)
{
 try{
        
        autopagerMain.saveUTF8Pref("loading",value); // get a pref
    }catch(e) {
        //autopagerMain.alertErr(e);
    }
},
loadUTF8Pref : function(name) {
    var unicodeConverter = Components
    .classes["@mozilla.org/intl/scriptableunicodeconverter"]
    .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
    unicodeConverter.charset = "utf-8";
    var str = autopagerMain.loadPref(name);
    try{
        return unicodeConverter.ConvertToUnicode(str);
    }catch(e) {
        return str;
    }	  	
},
saveUTF8Pref : function(name,value) {
    var unicodeConverter = Components
    .classes["@mozilla.org/intl/scriptableunicodeconverter"]
    .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
    unicodeConverter.charset = "UTF-8";
    try{
        autopagerMain.savePref(name,unicodeConverter.ConvertFromUnicode(value));
    }catch(e) {
        autopagerMain.savePref(name,value);
    }	  	
},
loadPref : function(name) {
    try{
        
        return autopagerMain.getAutopagerPrefs().getCharPref("." +  name); // get a pref
    }catch(e) {
        //autopagerMain.alertErr(e);
    }
    return "";
},
getDatePrefs : function(name){
   var date = new Date();
   try{        
        var timestamp = autopagerMain.getAutopagerPrefs().getCharPref("." +  name); // get a pref
          date.setTime(timestamp);
    }catch(e) {
        //autopagerMain.alertErr(e);
    }     
    return date;
},
setDatePrefs : function(name,date){
   try{
        
        autopagerMain.getAutopagerPrefs().setCharPref("." +  name,date.getTime()); // get a pref
    }catch(e) {
        //autopagerMain.alertErr(e);
    }     
},
loadBoolPref : function(name) {
    try{
        
        return autopagerMain.getAutopagerPrefs().getBoolPref("." +  name); // get a pref
    }catch(e) {
        //autopagerMain.alertErr(e);
    }
    return "";
},
savePref : function(name,value) {
    try{
        
        return autopagerMain.getAutopagerPrefs().setCharPref("." +  name,value); // set a pref
    }catch(e) {
        //autopagerMain.alertErr(e);
    }
    return "";
},
saveBoolPref : function(name,value) {
    try{
        
        return autopagerMain.getAutopagerPrefs().setBoolPref("." +  name,value); // get a pref
    }catch(e) {
        //autopagerMain.alertErr(e);
    }
    return "";
},
setGlobalEnabled : function(enabled) {
    
    if (document.autoGlobalPagerEnabled != enabled) {
        autopagerMain.saveEnableStat(enabled);
    }
    document.autoGlobalPagerEnabled = enabled;
    autopagerMain.setGlobalImageByStatus(enabled);
    if (enabled)
        autopagerMain.logInfo(autopagerConfig.autopagerGetString("autopageenabled"),autopagerConfig.autopagerGetString("autopageenabledTip"));
    else
        autopagerMain.logInfo(autopagerConfig.autopagerGetString("autopagedisabled"),autopagerConfig.autopagerGetString("autopagedisabledTip"));
    var enableMenuItem = document.getElementById("autopager-enabled");
    if (enableMenuItem)
      enableMenuItem.setAttribute("checked",enabled);	  		  
},
logInfo : function(status,tip) {
    if (this.autopagerDebug) {
        autopagerMain.logInfoDebug(status,tip);
        return;
    }
    try{
        if (this.autopagerDebug)
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
},
logInfoDebug : function(status,tip) {
    window.content.status = status;
    var tooltip = document.getElementById("autopager_tip");
    
    var tips = tip.split("\n");
    var tipCount = tooltip.childNodes.length;
    var i;
    for(i=0;i<tips.length;++i)
        tooltip.appendChild(tooltip.childNodes[0].cloneNode(true));
    for(i=0;i<tips.length;i++)
        tooltip.childNodes[i+tipCount].value = tips[i];
},
openSettingForDoc : function(doc)
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
     autopagerConfig.openSetting(url);
},
showMyName  : function(){
    try{
        var myname = document.getElementById("autopager-myname");
        myname.label = autopagerConfig.autopagerFormatString("myname" ,[autopagerMain.loadMyName()]);
    }catch(e) {
        
    }
},
changeMyName : function() {
    var name = prompt(autopagerConfig.autopagerGetString("inputname"),autopagerMain.loadMyName());
    if (name!=null && name.length>0) {
        autopagerMain.saveMyName(name);
        autopagerMain.showMyName();
    }
    return name;
},
alertErr : function(e) {
    autopagerMain.logInfo(e,e);
    this.log(e);
    //if (this.autopagerDebug)
    //    alert(e);
}
,    log: (location.protocol=="chrome:") ? function(message) {
        if (this.loadBoolPref("debug"))
        {
        var consoleService = Components.classes['@mozilla.org/consoleservice;1']
                .getService(Components.interfaces.nsIConsoleService);
        consoleService.logStringMessage(message)            
        }
      } : function(message) {
        if (autopagerPref.loadBoolPref("debug"))
           debug(message)
    }
	, getMiniMargin : function()
	{
			return 2;
    }
	, showStatus : function(){
            var statusBar = document.getElementById("autopager_status");
            if (statusBar!=null)
				statusBar.hidden = autopagerMain.loadBoolPref("hide-status");
    }
};

autopagerMain.autopagerOnLoad();
