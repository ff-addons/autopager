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
    workingAllSites:null,
    addonsList : null,
    flashIconNotify: false,
    lastScrollWatchExecuteTime: 0,
    tweakingSession: false,
autopagerOnLoad : function() {
    autopagerMain.tweakingSession = autopagerMain.loadBoolPref("tweaking-session");
    window.addEventListener("DOMContentLoaded", autopagerMain.onContentLoad, false);
    window.addEventListener("load", autopagerMain.onContentLoad, false);
    window.addEventListener("beforeunload", autopagerMain.onPageUnLoad, true);
    
    //window.onscroll = autopagerMain.scrollWatcher;
	//window.addEventListener("scroll",autopagerMain.scrollWatcher,false);
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
    toggleSidebar('viewautopagerSidebar',true);
    window.setTimeout(function(){
        var sidebar = document.getElementById("sidebar");
        var discoverPath = sidebar.contentDocument.getElementById("discoverPath");
        discoverPath.doCommand();

    },400);

//    alert(autopagerConfig.autopagerGetString("selectlinkxpath"));
//    document.autopagerXPathModel = "wizard";
//    document.autopagerWizardStep = "";
//    if(!doc.documentElement.autoPagerSelectorEnabled)
//        autopagerMain.enableSelector(doc,true);
},
createXpath : function(doc) {
    toggleSidebar('viewautopagerSidebar',true);
    window.setTimeout(function(){
        var sidebar = document.getElementById("sidebar");
        var pickupContentPath = sidebar.contentDocument.getElementById("pickupContentPath");
        pickupContentPath.doCommand();
    },200);
    //document.autopagerXPathModel = "test";
    //autopagerMain.enableSelector(doc,true);
},
testXPathTest : function(doc) {
    toggleSidebar('viewautopagerSidebar',true);
    window.setTimeout(function(){
        var sidebar = document.getElementById("sidebar");
        var contentXPath = sidebar.contentDocument.getElementById("contentXPath");
        contentXPath.focus();
    },200);
    //document.autopagerXPathModel = "test";
    //autopagerMain.enableSelector(doc,true);
},
onPageUnLoad : function(event) {    
    try
    {
        autopagerMain.setGlobalEnabled(autopagerMain.loadEnableStat());

        var doc = event.originalTarget;
        if (!(doc instanceof HTMLDocument))
            {
                return;
            }

        if (doc == null)
            return;
        //don't handle frames
        if (doc.defaultView != doc.defaultView.top)
               return;
//        autopagerMain.setGlobalImageByStatus(autopagerMain.getGlobalEnabled());
        try{
            autopagerMain.hiddenDiv(autopagerMain.getPagingWatcherDiv(doc,false),true);
            document.getElementById("autoPagerCreateXPath").setAttribute("checked", false);
        }catch(e){}


        var browser = splitbrowse.getBrowserNode(doc);
    if (browser && browser.autopagerProgressListenerAttached)
    {
        browser.removeProgressListener(apBrowserProgressListener,
                    Components.interfaces.nsIWebProgress.NOTIFY_LOCATION);
        browser.autopagerProgressListenerAttached = false;
    }

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

   //doc.documentElement.scrollHeight is 0 for some site, don't know why. We should not ignore them.
   if (doc.defaultView.top.document  instanceof HTMLDocument && doc.defaultView.top.document!=doc
       && ( (doc.documentElement.scrollWidth > 0 && doc.documentElement.scrollWidth<window.innerWidth/3)
           || (doc.documentElement.scrollHeight>0 && doc.documentElement.scrollHeight<autopagerMain.loadPref("mini-window-height"))))
   {
       //ignore small iframe/frame
       if (doc.defaultView.top.document.documentElement.autopagerContentHandled)
            return false;
   }
   if (doc.location && doc.location.href.substring(0,4)!='http' && doc.location.href.substring(0,4)!='file')
        return false;
   if (doc.defaultView.innerWidth <autopagerMain.loadPref("mini-window-width") || doc.defaultView.innerHeight<autopagerMain.loadPref("mini-window-height"))
          return false;
    return true;

},
onContentLoad : function(event) {

    if (autopagerMain.doContentLoad(event))
    {    
        autopagerMain.scrollWatcher(event);
    }
},
doContentLoad : function(event) {
    var doc = event;

    if (doc == null || !(doc instanceof HTMLDocument))
    {
            if (autopagerMain.isValidDoc(event.explicitOriginalTarget))
                doc = event.explicitOriginalTarget;
            else if (autopagerMain.isValidDoc(event.originalTarget))
                doc = event.originalTarget;
            else if (autopagerMain.isValidDoc(event.target))
                doc = event.target;
    }
    if (!(autopagerMain.isValidDoc(doc)))
        return false;

    try{
        autopagerRefinement.entryPoint(doc);
    }catch(e){}

    autopagerMain.showStatus();
    if (doc.defaultView.name=="autoPagerLoadDivifr")
        return false;
    if (!document.autoPagerInited) {
        document.autoPagerInited = true;
        window.setTimeout(function(){autopagerConfig.autopagerUpdate();},400);
   }
    autopagerMain.setGlobalEnabled(autopagerMain.loadEnableStat());
//    autopagerMain.setGlobalImageByStatus(autopagerMain.getGlobalEnabled());
    autopagerMain.flashIconNotify = autopagerMain.loadBoolPref("flashIconNotify");
	if (doc.documentElement.forceLoadPage==null)
		doc.documentElement.forceLoadPage = 0;
	if (!autopagerMain.loadEnableStat() && doc.documentElement.forceLoadPage==0)
		return false;
    try{
        autopagerMain.hiddenDiv(autopagerMain.getPagingWatcherDiv(doc,false),true);
        document.getElementById("autoPagerCreateXPath").setAttribute("checked", false);	
    }catch(e){}
    if (doc.defaultView.top.document.documentElement.autopagerEnabledDoc!=null)
    {
        for(var i=0; i<doc.defaultView.top.document.documentElement.autopagerEnabledDoc.length;i++)
            if (doc.defaultView.top.document.documentElement.autopagerEnabledDoc[i]==doc)
            return false;
    }
        
    if (splitbrowse)
    {
      var browser = splitbrowse.getBrowserNode(doc);
      if (browser && !browser.getAttribute(splitbrowse.getSplitKey()))
      {
        if (!browser.autopagerProgressListenerAttached)
        {
            browser.addProgressListener(apBrowserProgressListener,
                        Components.interfaces.nsIWebProgress.NOTIFY_LOCATION);
            browser.autopagerProgressListenerAttached = true;
        }
          doc.removeEventListener("scroll",autopagerMain.scrollWatcher,false);
          doc.addEventListener("scroll",autopagerMain.scrollWatcher,false);
//           if (doc.defaultView && doc.defaultView.top &&
//           doc.defaultView.top != doc.defaultView)
//           {
//               doc.defaultView.top.document.removeEventListener("scroll",autopagerMain.scrollWatcher,false);
//               doc.defaultView.top.document.addEventListener("scroll",autopagerMain.scrollWatcher,false);
//           }
          autopagerMain.handleDocLoad(doc,false);
          return true;
      }
    }
    return false;
  },
  prepareSessionTweaking : function (doc)
  {
      if (autopagerMain.tweakingSession && doc.defaultView.top == doc.defaultView)
      {
          if (!doc.documentElement.autopagerTweakingMonitorAdded)
          {
              doc.documentElement.autopagerTweakingMonitorAdded = true;
              window.addEventListener("click", autopagerMain.tweakingSessionMonitor, false);
//              window.addEventListener("mousemove", autopagerMain.tweakingSessionMonitor, false);
              window.addEventListener("scroll", autopagerMain.tweakingSessionMonitor, false);
          }        
      }    
  },
  tweakingSessionMonitor : function (e)
  {
      var doc = content.document
      var pos = 0;
      if (e.screenY)
          pos = e.clientY;
      autopagerMain.changeSessionUrlByScrollHeight(doc,pos);
  },
  Copy : function (container,doc)
  {

    //We can't use this, it doesn't work in some ajax page
    return;
    var childs = doc.documentElement.childNodes;
    for(var i=childs.length-1;i>=0;--i)
    {
        doc.documentElement.removeChild(childs[i]);
    }
    childs = container.documentElement.childNodes;
    for(var i=0;i<childs.length;++i)
    {
        doc.documentElement.appendChild(doc.importNode( childs[i].cloneNode(true),true));
    }           
  },
  searchForMatchedFrame : function (doc, reg,enableJS)
  {
      if (doc.defaultView.frames != null) {
            //alert(doc.defaultView.frames.length);
            for(var i=0;i<doc.defaultView.frames.length;++i) {
                var frame = doc.defaultView.frames[i].document;
                var url = this.getDocURL(frame,enableJS);
                if (reg.test(url))
                    return frame;
            }
      }
      return null;

  },
  onSplitDocLoaded :function(doc,safe) {
    var furtherscrollWatcher = true;
        var browser = splitbrowse.getBrowserNode(doc);
        if (browser && browser.getAttribute(splitbrowse.getSplitKey())) {
            if (browser.auotpagerContentDoc) {
                var container = browser.auotpagerContentDoc;
                var de = container.documentElement.QueryInterface(Components.interfaces.nsIDOMElement);
                var reg = this.getRegExp (container.documentElement.autoSiteSetting)
                var url = this.getDocURL(doc,de.getAttribute('enableJS') == 'true');
                if (container.defaultView == container.defaultView.top && !reg.test(url) )
                    return;
                else if (!reg.test(url))
                    doc = this.searchForMatchedFrame(doc,reg,de.getAttribute('enableJS') == 'true');
                if (doc==null)
                    return;
                if (browser.autopagerSplitWinFirstDocSubmited) {
                    if(!browser.autopagerSplitWinFirstDocloaded) {
                        //                        if (doc.defaultView != doc.defaultView.top)
                        //                               return;
                        var nextUrl = null;
                                    
                        if (container.documentElement.getAttribute('autopagerAjax') == "true")
                            autopagerMain.Copy(container,doc);
                        //var doc = browser.webNavigation.document;
                        if (container.documentElement.getAttribute('fixOverflow') == 'true')
                            autopagerMain.fixOverflow(doc);
                        
                        nextUrl = autopagerMain.getNextUrlIncludeFrames(container,doc);
                        if (nextUrl==null && (browser.auotpagerContentDoc.documentElement.getAttribute('autopagerAjax') == "false"))
                        {
                            //ajax site, not load yet,wait a while
                            window.setTimeout(function(){
                                nextUrl = autopagerMain.getNextUrlIncludeFrames(container,doc);
                                container.documentElement.autopagernextUrl = nextUrl;
                                browser.autopagerSplitWinFirstDocloaded = true;
                                container.documentElement.autopagerSplitDocInited = true;
                                container.documentElement.autopagerEnabled = true;
                            },splitbrowse.getDelayMiliseconds(doc));
                        }else
                        {
                            container.documentElement.autopagernextUrl = nextUrl;
                            browser.autopagerSplitWinFirstDocloaded = true;
                            container.documentElement.autopagerSplitDocInited = true;
                            container.documentElement.autopagerEnabled = true;
                        }
                    }
                    else {
                        if (browser.auotpagerContentDoc.documentElement.getAttribute('autopagerAjax') == "false")
                        {
                            if (browser.auotpagerContentDoc.documentElement.delaymsecs && browser.auotpagerContentDoc.documentElement.delaymsecs>0)
                                window.setTimeout(function(){autopagerMain.scrollFunc(browser,doc);}, browser.auotpagerContentDoc.documentElement.delaymsecs);
                            else
                                furtherscrollWatcher = autopagerMain.scrollFunc(browser,doc);

                        }
                    }
                }
            
            
                if (furtherscrollWatcher)
                {
                    autopagerMain.scrollWatcher(browser.auotpagerContentDoc);
                }
            }
            return;
        }

},
scrollFunc : function(browser,doc){
    var furtherscrollWatcher =autopagerMain.scrollWindow(browser.auotpagerContentDoc,doc);
    autopagerMain.onStopPaging(browser.auotpagerContentDoc);
    splitbrowse.switchToCollapsed(true);
    return furtherscrollWatcher;
},
handleDocLoad : function(doc,safe)
{
        autopagerMain.workingAllSites = UpdateSites.loadAll();
        //doc.documentElement.autopagerContentHandled = true;
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
            for(var i=0;i<doc.defaultView.frames.length;++i) {
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
            this.autopagerPrefs.addObserver("", this, false);

        }catch(e){}
    }
    return this.autopagerPrefs;
},
fixOverflow : function(doc) {
    var nodes = autopagerMain.findNodeInDoc(doc,"//*[contains(@style,'overflow')][not(@className = 'clsCleekiComponent')]",false);
    if (nodes != null) {
        for(var i = 0;i<nodes.length;++i) {
            var node = nodes[i];
            
            node.style.overflow = "visible";
        }
    }
    nodes = autopagerMain.findNodeInDoc(doc,"//*[contains(@style,'position')][not(@className = 'clsCleekiComponent')]",false);
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
   try{
       if (site.regex==null)
       {
             if (site.isRegex)
                try{
                    site.regex = new RegExp(site.urlPattern);
                }catch(re)
                {
                    //error create regexp, try to use it as pattern
                    site.regex = convert2RegExp(site.urlPattern);
                }
             else
                site.regex = convert2RegExp(site.urlPattern);
        }
    }catch(e)
    {
        site.regex = /no-such-regex/;
    }
	return site.regex;
},
promptNewVersion : function (version)
{
    var message = autopagerConfig.autopagerFormatString("unsupport-version",[version,autopagerConfig.formatVersion]);
    autopagerUtils.consoleLog(message);
    if (autopagerMain.loadBoolPref("ignore-format-version-check"))
    {
        return;
    }
        var notificationBox = gBrowser.getNotificationBox();
        var notification = notificationBox.getNotificationWithValue("autopager-version-unsupport");
        if (notification) {
          notification.label = message;
        }
        else {
          var buttons = [{
            label: autopagerConfig.autopagerGetString("IgnoreVersionCheck"),
            accessKey: "I",
            callback: function(){
                autopagerMain.saveBoolPref("ignore-format-version-check",true)
            }
          },{
            label: autopagerConfig.autopagerGetString("CheckUpdate"),
            accessKey: "U",
//            popup: "autopager-menu-popup",
            callback: function(){
                autopagerMain.showHelp();
            }
          }];

          const priority = notificationBox.PRIORITY_WARNING_MEDIUM;
          notificationBox.appendNotification(message, "autopager-version-unsupport",
                                             "chrome://browser/skin/Info.png",
                                             priority, buttons);
        }

//    var alertsService = Components.classes["@mozilla.org/alerts-service;1"]
//    .getService(Components.interfaces.nsIAlertsService);
//    var listener = {
//        observe: function(subject, topic, data) {
//            alert("subject=" + subject + ", topic=" + topic + ", data=" + data);
//        }
//    }
//
//    alertsService.showAlertNotification("chrome://mozapps/skin/downloads/downloadIcon.png",
//        "Alert title", "Alert text goes here.",
//        false, "", listener);

},
promptNewRule : function (doc,force)
{
        if (!gBrowser || !gBrowser.getNotificationBox || !gBrowser.getNotificationBox())
        {
            autopagerMain.enabledThisSite(doc,true);
            return false;
        }
    var host = doc.location.host;
    var owner = doc.documentElement.getAttribute("autopagerSettingOwner")

    if (!force && autopagerMain.loadBoolPref("noprompt"))
    {
        return false;
    }
    var message = autopagerConfig.autopagerFormatString("enableonsite",[host,owner]);
        var notificationBox = gBrowser.getNotificationBox();
        var notification = notificationBox.getNotificationWithValue("autopager-new-rule");
        if (notification) {
          notification.autopagerDoc = doc
          notification.label = message;
        }
        else {
            var buttons = [
            {
                label: autopagerConfig.autopagerGetString("Yes"),
                accessKey: "Y",
                callback: function(){
                    autopagerMain.enabledThisSite(notificationBox.getNotificationWithValue("autopager-new-rule").autopagerDoc,true);
                }
            }
            ,{
                label: autopagerConfig.autopagerGetString("No"),
                accessKey: "N",
                callback: function(){
                    autopagerMain.enabledThisSite(notificationBox.getNotificationWithValue("autopager-new-rule").autopagerDoc,false);
                }
            }
            ,{
                label: autopagerConfig.autopagerGetString("Options"),
                accessKey: "O",
                popup: "autopager-notification-popup",
                callback: function(){
                    autopagerMain.saveBoolPref("noprompt",true)
                }
            }
            ];

          const priority = notificationBox.PRIORITY_INFO_MEDIUM;
          notificationBox.appendNotification(message, "autopager-new-rule",
                                             "chrome://autopager/skin/autopager32.gif",
                                             priority, buttons);
          notification = notificationBox.getNotificationWithValue("autopager-new-rule");
          notification.autopagerDoc = doc;
        }
        return true;
},
onInitDoc : function(doc,safe)
{
    var ret = autopagerMain.doOnInitDoc(doc,safe);
    if (ret ==0 && autopagerMain.loadBoolPref("with-lite-discovery") && !doc.documentElement.apDiscovered)
    {
        
        if (autopagerMain.loadBoolPref("lite-discovery-prompted"))
        {
            doc.documentElement.apDiscovered = true
            autopagerLite.discoveryRules(doc);
        }
        else
            autopagerLite.promptLiteDiscovery(doc);
    }
    return ret;
},
    doOnInitDoc : function(doc,safe) {
        if (doc.location == null)
            return -1;
    
        if (doc.defaultView.innerWidth <autopagerMain.loadPref("mini-window-width") || doc.defaultView.innerHeight<autopagerMain.loadPref("mini-window-height"))
            return -1;
    
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
            return -1;
        var i=0;
        var sitepos = new Array();

        while(sitepos!=null)
        {
            sitepos = UpdateSites.getNextMatchedSiteConfig(autopagerMain.workingAllSites,url,sitepos);
            if (sitepos!=null)
            {
                //autopagerMain.log("4 " + new Date().getTime())
                var pattern = autopagerMain.getRegExp(sitepos.site);
                if (pattern.test(url)) {
                    //should not equal
                    //if (sitepos.site.quickLoad == safe)
                    if (safe)
                        return 0;
                    if (typeof sitepos.site.formatVersion != 'undefined'
                        && sitepos.site.formatVersion > autopagerConfig.formatVersion)
                        {
                        autopagerMain.promptNewVersion(sitepos.site.formatVersion);
                        //not use it, try next
                        continue;
                    }

                    var msg="";
                    var info = "";
                    var de = doc.documentElement;
                    if (!de.autoPagerRunning) {
                        autopagerMain.prepareSessionTweaking(doc);
                        de.patternRegExp = pattern;
                        de.autopagerHasMatchedURL=true;
                        var insertPoint = null;
                        var nextUrl = null;

                        //autopagerMain.log("5 " + new Date().getTime())
                        var urlNodes = null;
                        if (sitepos.site.isTemp )
                            tryTime = 2;
                        if (!sitepos.site.isTemp)
                            urlNodes = autopagerMain.findNodeInDoc(doc,sitepos.site.linkXPath,sitepos.site.enableJS || (!sitepos.site.fixOverflow &&  autopagerMain.loadBoolPref("alwaysEnableJavaScript")));
                        else{
                            sitepos.site.linkXPath = null;
                            for(var t=0;t<sitepos.site.tmpPaths.length; ++t) {
                                //autopagerMain.log("6.1 " + new Date().getTime())
                                autopagerMain.log(sitepos.site.tmpPaths[t])
                                urlNodes = autopagerMain.findNodeInDoc(doc,sitepos.site.tmpPaths[t],sitepos.site.enableJS || (!sitepos.site.fixOverflow &&  autopagerMain.loadBoolPref("alwaysEnableJavaScript")));
                                //autopagerMain.log("6 " + new Date().getTime())
                                if ( urlNodes != null  && urlNodes.length >0
                                    && urlNodes.length <= sitepos.site.maxLinks) {
                                    sitepos.site.linkXPath = sitepos.site.tmpPaths[t];
                                    //alert(sitepos.site.linkXPath);
                                    break;
                                }
                            }
                        }
                        //autopagerMain.log("7 " + new Date().getTime())
                        if (urlNodes == null || urlNodes.length ==0)
                        {
                            if (sitepos.site.isTemp )
                                de.autopagerEnabled = false ;
                            continue;
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

                        de.contentBottomMargin = 0;
                        var oldNodes = null;
                        var parentNodes = [];
                        if (sitepos.site.contentXPath!=null && sitepos.site.contentXPath.length>0)
                        {
                            de.hasContentXPath = true;
                            oldNodes = autopagerMain.findNodeInDoc(doc,sitepos.site.contentXPath,sitepos.site.enableJS || (!sitepos.site.fixOverflow &&  autopagerMain.loadBoolPref("alwaysEnableJavaScript")));
                            var maxH = 0;
                            if (oldNodes==null || oldNodes.length==0)
                            {
                                continue;
                            }
                            for(var n=0;n<oldNodes.length;n++)
                            {
                                var node = oldNodes[n];
                                var h = autopagerMain.getOffsetTop(node) + node.scrollHeight
                                if (h>maxH)
                                {
                                    maxH = h;
                                }
                                if (sitepos.site.ajax)
                                {
                                    if (parentNodes.indexOf(node.parentNode)==-1)
                                    {
                                        parentNodes.push(node.parentNode);
                                        autopagerMain.watchForNodeChange(node.parentNode);
                                    }
                                }
                            }
                            var sh = (doc && doc.scrollHeight)
                            ? doc.scrollHeight : doc.body.scrollHeight;
                            h = sh - maxH;
                            de.contentBottomMargin = h>0?h:0;
                        }else
                            de.hasContentXPath = false;

                        de.autoPagerRunning = true;
                        de.contentXPath = sitepos.site.contentXPath;
                        de.removeXPath = sitepos.site.removeXPath;
                
                        de.autopagerGUID = sitepos.site.guid;
                        de.margin = sitepos.site.margin;
                        de.minipages = sitepos.site.minipages;
                        de.delaymsecs = sitepos.site.delaymsecs;
                        de.enabled = sitepos.site.enabled;
                        //if (sitepos.site.enabled)
                        de.autopagerSplitDocInited = false;
                        de.setAttribute('enableJS', sitepos.site.enableJS ||sitepos.site.ajax || (!sitepos.site.fixOverflow &&  autopagerMain.loadBoolPref("alwaysEnableJavaScript")));
                        de.setAttribute('autopagerAjax', sitepos.site.ajax);
                        de.setAttribute('autopagerNeedMouseEvent', sitepos.site.needMouseDown);

                        if (!de.autopagerPagingCount)
                            de.autopagerPagingCount = 0;
                        if (!de.autoPagerPage)
                        {
                            de.autoPagerPage = 0;
                            de.autoPagerPageHeight = [];
                            de.autoPagerPageUrl = [];
                        }
                        var siteConfirm = autopagerConfig.findConfirm(autopagerConfig.getConfirm(),sitepos.site.guid,doc.location.host);
                        if (siteConfirm!=null)
                        {
                            de.autopagerUserConfirmed= true;
                            de.autopagerSessionAllowed= siteConfirm.UserAllowed;
                            de.autopagerAllowedPageCount=siteConfirm.AllowedPageCount;
                            de.autopagerSessionAllowedPageCount = siteConfirm.AllowedPageCount;
                            de.autopagerUserAllowed=siteConfirm.UserAllowed;
                        }
                        //autopagerMain.log("10 " + new Date().getTime())

                        if (oldNodes!= null && oldNodes.length >0)
                            insertPoint = oldNodes[oldNodes.length - 1].nextSibling;
                        if(insertPoint == null)
                        {
                            if (oldNodes!= null && oldNodes.length >0)
                            {
                                var br = autopagerMain.createDiv(doc,"","display:none;");
                                oldNodes[oldNodes.length - 1].parentNode.appendChild(br);
                                insertPoint = oldNodes[oldNodes.length - 1].nextSibling;
                            }else
                                insertPoint = autopagerMain.getLastDiv(doc);
                        }
                        //alert(oldNodes[oldNodes.length - 1]);
                        if (this.autopagerDebug)
                            autopagerMain.logInfo(insertPoint, "go");
                        de.setAttribute('linkXPath',sitepos.site.linkXPath);
                
                        var tooManyLinks = false;
                        if (sitepos.site.maxLinks  != -1 && urlNodes != null
                            && urlNodes.length > sitepos.site.maxLinks )
                            tooManyLinks = true;
                
                        //alert(urlNodes);
                        if (urlNodes != null && urlNodes.length >0)
                        {
                            nextUrl = autopagerMain.getNextUrl(doc,sitepos.site.enableJS || (!sitepos.site.fixOverflow &&  autopagerMain.loadBoolPref("alwaysEnableJavaScript")),urlNodes[0]);
                            autopagerMain.watchForNodeChange(nextUrl.parentNode);
                            autopagerMain.watchForNodeAttrChange(nextUrl);
                        } else
                            nextUrl = null;
                        //alert(insertPoint);
                        //alert(nextUrl);
                        var autopagerEnabled =	(insertPoint != null) && (nextUrl != null)
                        && sitepos.site.enabled && !(tooManyLinks);
                        de.autopagerEnabled = autopagerEnabled;
                        de.autopagerProcessed = true;
                        de.autoSiteSetting = sitepos.site;
                        //alert(doc.autopagerEnabled);
                        de.autoPagerPage = 1;
                        de.autopagerinsertPoint = insertPoint;
                        if  (de.hasContentXPath && (sitepos.site.enableJS || (!sitepos.site.fixOverflow &&  autopagerMain.loadBoolPref("alwaysEnableJavaScript"))))
                            de.autopagernextUrl= null;
                        else
                            de.autopagernextUrl = nextUrl;
                        de.autopagerUseSafeEvent = (doc.defaultView.top != doc.defaultView) ||
                        (!sitepos.site.quickLoad);
                        de.setAttribute('fixOverflow',sitepos.site.fixOverflow);
                        de.setAttribute('contentXPath',sitepos.site.contentXPath);
                        de.setAttribute('containerXPath',sitepos.site.containerXPath);
                        de.setAttribute('autopagerSettingOwner',sitepos.site.owner);
                        de.setAttribute('autopagerVersion',"0.5.5.6");
                        de.autopagerSplitCreated = false;
                
                        //autopagerMain.log("11 " + new Date().getTime())

                        de.autoPagerPageHeight = [];
                        de.autoPagerPageUrl     = [];
                        if (autopagerEnabled) {
                            if(sitepos.site.fixOverflow)
                                autopagerMain.fixOverflow(doc);

                            var topDoc = doc.defaultView.top.document;
                            if (!topDoc.documentElement.autopagerEnabledDoc)
                                topDoc.documentElement.autopagerEnabledDoc = [];
                            topDoc.documentElement.autopagerEnabledDoc.push( doc);
                            try{
                                var needLoadSplit = de.hasContentXPath && (sitepos.site.enableJS || (!sitepos.site.fixOverflow &&  autopagerMain.loadBoolPref("alwaysEnableJavaScript")));
                                if (needLoadSplit)
                                {
                                    doc = doc.QueryInterface(Components.interfaces.nsIDOMDocument);
                                    var splitbrowser = autopagerMain.getSplitBrowserForDoc(doc,true);
                                //splitbrowser.autopagerSplitWinFirstDocloaded = false;
                                //splitbrowser.autopagerSplitWinFirstDocSubmited = true;
                                }
                            }catch(e)
                            {}
                    
                            msg = autopagerConfig.autopagerFormatString("enableurl",[ url ]);
                            info = autopagerConfig.autopagerFormatString("enableinfo",[url,sitepos.site.linkXPath,sitepos.site.contentXPath]);
                        }
                        else if (!autopagerMain.getGlobalEnabled()) {
                            msg = autopagerConfig.autopagerFormatString("globaldisabled",[url]);
                            info = msg;
                        }
                        //autopagerMain.log("11 " + new Date().getTime())

                        if (msg.length>0)
                            autopagerMain.logInfo(msg, info);
                        setTimeout(autopagerMain.scrollWatcher,1000);
                        if (de.autopagerEnabled && doc.defaultView.top != doc.defaultView && doc.defaultView.frameElement!=null) //we are in a frame
                        {
                            var fr = doc.defaultView.frameElement
                            if (fr.getAttribute("scrolling")!=null && fr.getAttribute("scrolling").toLowerCase()=='no')
                            {
                                fr.setAttribute("scrolling",'yes')
                            }
                        }
                        autopagerLite.hiddenStatus(true);
                        if (sitepos.site.enabled==false)
                            break;
                        return 1;
                    }
                }
            }
        }
        return 0;
    },
watchForNodeChange : function (node)
{
    //node.addEventListener("DOMNodeRemoved",autopagerMain.onAjaxRemoveNode,false);
    //node.addEventListener("DOMNodeInserted",autopagerMain.onAjaxInsertNode,false);

},
watchForNodeAttrChange : function (node)
{
    node.addEventListener("DOMAttrModified",autopagerMain.onAjaxAttrModified,false);

},
onAjaxRemoveNode : function (e)
{
    var node = e.target
    var str = "Loaded:" + node.ownerDocument.documentElement.autoPagerPage + " " + node.tagName + ",id=" + node.getAttribute("id") + ",class=" + node.getAttribute("class") + ",href=" + node.getAttribute("href")
    //autopagerUtils.consoleLog("onAjaxRemoveNode:" + str + " " + node.innerHTML);
},
onAjaxInsertNode : function (e)
{
    var node = e.target
    var str = "Loaded:" + node.ownerDocument.documentElement.autoPagerPage + " " + node.tagName + ",id=" + node.getAttribute("id") + ",class=" + node.getAttribute("class") + ",href=" + node.getAttribute("href")
    //autopagerUtils.consoleLog("onAjaxInsertNode:" + str + " " + node.innerHTML);
},
onAjaxAttrModified : function (e)
{
    var node = e.target
    var str = "Loaded:" + node.ownerDocument.documentElement.autoPagerPage + " " + node.tagName + ",id=" + node.getAttribute("id") + ",class=" + node.getAttribute("class") + ",href=" + node.getAttribute("href")
    //autopagerUtils.consoleLog("onAjaxAttrModified:" + str + " " + node.innerHTML);
},
clearLoadedPages : function (doc)
{
    var xpath="//div[@id='apBreakStart2']/preceding-sibling::*[1]/following-sibling::*[./following-sibling::div[@id='apBreakEnd" + doc.documentElement.autoPagerPage + "']] | //div[@id='apBreakEnd" + doc.documentElement.autoPagerPage + "']";
    autopagerMain.removeElements(doc,[xpath],true);
    autopagerMain.clearLoadStatus(doc);
    autopagerMain.onContentLoad(doc);
},
clearLoadStatus : function (doc)
{
    doc.documentElement.autoPagerPage = 0;
    doc.documentElement.autopagerContentHandled = false;
    doc.documentElement.autoPagerRunning=false;
    doc.documentElement.autopagernextUrl=null
    doc.documentElement.autopagerinsertPoint=null
    doc.documentElement.autopagerSplitCreated=false
    doc.documentElement.autopagerSplitDocInited=false
    doc.documentElement.autopagerPagingCount=0
    doc.documentElement.forceLoadPage=0
    
    var  docs = [];

    for(var i=0; i<doc.defaultView.top.document.documentElement.autopagerEnabledDoc.length;i++)
    {
        if (doc.defaultView.top.document.documentElement.autopagerEnabledDoc[i]!=doc)
        {
            docs.push(doc.defaultView.top.document.documentElement.autopagerEnabledDoc[i]);
        }
    }
    doc.defaultView.top.document.documentElement.autopagerEnabledDoc = docs;
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
    enabled = enabled && ( !(doc.documentElement.getAttribute('enableJS') == 'true')  || doc.documentElement.autopagerSplitDocInited || !doc.documentElement.hasContentXPath);
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
	//doc.documentElement.autopagerEnabled = true;
	autopagerMain.scrollWatcher(doc);
},
count:0,
scrollWatching: false,
scrollWatcher : function(event) {
    //autopagerMain.doScrollWatcher();
    var doc = null;
    if (event == null)
        doc = content.docuement;
    else if (event instanceof HTMLDocument)
        doc = event;
    else 
        doc = event.target;
    if (doc != null)
        setTimeout(function(){ autopagerMain.doScrollWatcher(doc);},20);
},
doScrollWatcher : function(scrollTarget) {
    if (autopagerMain.scrollWatching || (new Date().getTime() - autopagerMain.lastScrollWatchExecuteTime) < 40)
			return;
	autopagerMain.scrollWatching = true;
    autopagerMain.lastScrollWatchExecuteTime = new Date().getTime();
    try{
        if (this.autopagerDebug)
            autopagerMain.logInfo(this.count,"Enter scrollWatcher");
        var scollDoc = scrollTarget;
        if (!(scollDoc instanceof HTMLDocument) && scollDoc.ownerDocument)
            scollDoc = scollDoc.ownerDocument;
        
        var de =  scollDoc.defaultView.top.document.documentElement;//content.document.documentElement;

        if (de.autopagerEnabledDoc != null)
       {
            for(var i=0;i<de.autopagerEnabledDoc.length;i++) {
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

								var winHeight = window.innerHeight;//scrollDoc.defaultView.innerHeight ? scrollDoc.defaultView.innerHeight : scrollDoc.documentElement.clientHeight;

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
                                                                scrollContainer.style.setProperty("height",(wHeight - this.getOffsetTop(scrollContainer)) + 'px',null);
                                                            }
                                                        }
												}
										}

								}
								if (scrollContainer==null)
										scrollContainer = scrollDoc.documentElement;
								var scrollTop = (scrollContainer && scrollContainer.scrollTop)
								? scrollContainer.scrollTop : scrollDoc.body.scrollTop;
								var scrollOffset = (scrollContainer && scrollContainer.scrollHeight)
								? scrollContainer.scrollHeight : scrollDoc.body.scrollHeight;
								if (scrollDoc.body != null && scrollDoc.body.scrollHeight > scrollOffset)
										scrollOffset = scrollDoc.body.scrollHeight;


                                var m = doc.documentElement.contentBottomMargin
								var remain = scrollOffset - scrollTop - scrollContainer.offsetTop - winHeight
                                            - doc.documentElement.contentBottomMargin;
								this.count++;
								if (this.autopagerDebug)
										autopagerMain.logInfo(this.count + ": Auto pager wh:" + winHeight+ " sc:" + scrollTop + " remain: " + remain,
												"sh=" + scrollOffset + " sc = " + scrollTop + " wh= " + winHeight + " Auto pager remain: " + remain + ".\nremain < " + winHeight+" will auto page.");

								//alert(wh);
								if (this.autopagerDebug)
										winHeight = winHeight * (doc.documentElement.margin*1 + 1);
								else
										winHeight = winHeight * (doc.documentElement.margin * 1);
								//alert(wh);
								//needLoad = remain < wh;
								var currHeight = scrollTop + scrollContainer.offsetTop;// + wh
								var targetHeight = 0;
                                var minipages = doc.documentElement.minipages;
                                if (minipages==-1)
                                    minipages = autopagerMain.loadPref("minipages");
                                if (minipages>0)
                                {
                                    //notice doc.documentElement is different to de here!!!!!
                                    var a = doc.documentElement.autoPagerPageHeight;
                                    if (a!=null && a.length >= minipages)
                                    {
                                            var pos = a.length - minipages;//doc.documentElement.margin
                                            targetHeight = a[pos];
                                    }
                                }else
                                    targetHeight = currHeight;
								needLoad = ( (targetHeight < currHeight)) || remain < winHeight;
							}
                            if( needLoad){
                                if (doc.documentElement.autoPagerPage==null || doc.documentElement.autoPagerPage<2)
                                 {
                                    //test the contetXPATH first
                                    if (doc.documentElement.hasContentXPath)
                                    {
                                    var xpath = doc.documentElement.contentXPath;

                                    var nodes = autopagerMain.findNodeInDoc(doc,xpath,doc.documentElement.getAttribute('enableJS') == 'true');
                                    if (nodes.length==0)
                                    {
                                        autopagerMain.scrollWatching = false;
                                        return;
                                    }

                                    }
                                }
                                //alert(remain + "   " + wh + "  "  + sh + " " + sc);
                                if (autopagerMain.loadBoolPref("noprompt") && !doc.documentElement.autopagerUserConfirmed)
                                {
                                    doc.documentElement.autopagerUserConfirmed = true;
                                    doc.documentElement.autopagerUserAllowed = !autopagerMain.loadBoolPref("disable-by-default");
                                    doc.documentElement.autopagerAllowedPageCount = -1;
                                    doc.documentElement.autopagerSessionAllowedPageCount  = -1;
                                }
                                if (!doc.documentElement.autopagerUserConfirmed)
								{
										var siteConfirm = autopagerConfig.findConfirm(autopagerConfig.getConfirm(),de.autopagerGUID,doc.location.host);
										if (siteConfirm!=null)
										{
											de.autopagerUserConfirmed= true;
											de.autopagerSessionAllowed= siteConfirm.UserAllowed;
											de.autopagerAllowedPageCount=siteConfirm.AllowedPageCount;
											de.autopagerUserAllowed=siteConfirm.UserAllowed;
                                            de.autopagerSessionAllowedPageCount = siteConfirm.AllowedPageCount;
										}
								}
                                var needConfirm =  (!autopagerMain.loadBoolPref("noprompt"))
										&& (!doc.documentElement.autopagerUserConfirmed || (doc.documentElement.autopagerSessionAllowed
																&& doc.documentElement.autopagerAllowedPageCount== doc.documentElement.autoPagerPage))
										&& (doc.documentElement.forceLoadPage==0);
                                  
                                if (needConfirm)
                                {
                                    if (autopagerMain.promptNewRule (doc,true))
                                        doc.documentElement.autopagerEnabled = false;
                                }
                                else
                                    if ((doc.documentElement.autopagerUserConfirmed
                                    && doc.documentElement.autopagerUserAllowed
                                    && ( doc.documentElement.autopagerAllowedPageCount < 0
                                    ||  doc.documentElement.autopagerAllowedPageCount> doc.documentElement.autoPagerPage)
                                       ) || doc.documentElement.forceLoadPage>0)
                                {
                                //test the url if there is not content
                                    if (doc.documentElement.contentXPath == null || doc.documentElement.contentXPath.length==0)
                                    {
                                        var nextUrl = doc.documentElement.autopagernextUrl;
                                        if (nextUrl==null || nextUrl.ownerDocument!=doc)
                                        {
                                            return;
                                        }
                                        var pos = autopagerMain.myGetPos(nextUrl);
                                        if (pos.x<=0 || nextUrl.scrollWidth<=0 || pos.y<=0 || nextUrl.scrollHeight<=0)
                                        {
                                            return;
                                        }                                        
                                    }
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
                                            try{
                                                doc.documentElement.autopagerSplitCreated = true;
                                                var splitbrowser = autopagerMain.getSplitBrowserForDoc(doc,true);
                                            }catch(e)
                                            {
                                                var splitbrowser = autopagerMain.getSplitBrowserForDoc(doc,true);
                                            }
                                            
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
         else
         {
            if (!de.autopagerFirstScrollDone)
            {
                de.autopagerFirstScrollDone = 1;
            }else{
                de.autopagerFirstScrollDone = de.autopagerFirstScrollDone+1;
                if (de.autopagerHasMatchedURL &&  de.autopagerFirstScrollDone<=3)
                {
                    autopagerMain.doContentLoad(scollDoc);
                }
                else
                {
                    scollDoc.removeEventListener("scroll",autopagerMain.scrollWatcher,false);
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
        if (this.autopagerDebug)
            autopagerMain.logInfo(this.count,"Enter showAllPagingOptions");
        var de = content.document.documentElement;
        if (de.autopagerEnabledDoc != null)
       {
            for(var i=0;i<de.autopagerEnabledDoc.length;i++) {
                var doc = de.autopagerEnabledDoc[i];
                if (doc.location != null)
               {
                     autopagerMain.promptNewRule (doc,true);
                     showedCount ++;
                     break;
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
isEnabledOnDoc : function(target)
{
    var de = target.documentElement;
    var enabled = true;
    if (de.autopagerEnabledDoc != null)
    {
        for(var i=0;i<de.autopagerEnabledDoc.length;i++) {
            var doc = de.autopagerEnabledDoc[i];
            if (doc.location != null)
            {
                var siteConfirm = autopagerConfig.findConfirm(autopagerConfig.getConfirm(),doc.documentElement.autopagerGUID,doc.location.host);

                if (siteConfirm)
                    enabled = siteConfirm.UserAllowed;
                else
                    enabled =  !autopagerMain.loadBoolPref("disable-by-default");
                break;
            }
        }
    }
    return enabled;
},
loadedCount : function(target)
{
    var de = target.documentElement;
    var count = 0;
    if (de.autopagerEnabledDoc != null)
    {
        for(var i=0;i<de.autopagerEnabledDoc.length;i++) {
            var doc = de.autopagerEnabledDoc[i];
            if (doc.location != null)
            {
                if (doc.documentElement.autoPagerPage>0)
                    count =count +doc.documentElement.autoPagerPage;
            }
        }
    }
    return count;
},
onHandlingCoreOption : function (event)
{
    var menuitem = event.target
    if (menuitem.getAttribute("pref") && menuitem.getAttribute("type")=='checkbox')
    {
        autopagerMain.saveBoolPref(menuitem.getAttribute("pref"),menuitem.getAttribute("checked")=='true');
    }else if (menuitem.getAttribute("prefV") && menuitem.getAttribute("type")=='checkbox')
    {
        autopagerMain.saveBoolPref(menuitem.getAttribute("prefV"),menuitem.getAttribute("checked")!='true');
    }
    else if (menuitem.getAttribute("type")=='radio' && menuitem.parentNode.parentNode.getAttribute("pref"))
    {
        autopagerMain.savePref(menuitem.parentNode.parentNode.getAttribute("pref"),
                menuitem.value);
    }

},
onPrepareCoreOption : function (target)
{
    var menupopup = target;
    window.setTimeout(function (){
    for(var i=0;i<menupopup.childNodes.length;i++)
    {
        var menuitem = menupopup.childNodes[i];
        if (menuitem.tagName=='menuitem')
        {
            if (menuitem.getAttribute("pref"))
            {
                menuitem.setAttribute("checked",autopagerMain.loadBoolPref(menuitem.getAttribute("pref")));
            }else if (menuitem.getAttribute("prefV"))
            {
                menuitem.setAttribute("checked",!autopagerMain.loadBoolPref(menuitem.getAttribute("prefV")));
            }
        }else if (menuitem.tagName=='menu')
        {
            var popup = menuitem.childNodes
            var options = popup[0].childNodes
            var value = autopagerMain.loadPref(menuitem.getAttribute("pref"))

            for(var o=0;o<options.length;o++)
            {
                var option = options[o]
                if (option.value == value)
                {
                    option.setAttribute("checked",true);
                    break;
                }
            }
        }
    }
    }
    ,10);
},
FillPopup : function(target,prefix) {

    var menupopup = target;
    if (menupopup.childNodes.length < 2)
    {
        var menuTemplate = document.getElementById("autopager-menu-popup")
        for(var i=0;i<menuTemplate.childNodes.length;i++)
        {
            var child = menuTemplate.childNodes[i].cloneNode(true);
            if (child.getAttribute("id"))
                child.setAttribute("id",prefix + "-" + child.getAttribute("id"));
            menupopup.appendChild(child);
        }
    }
        try{
            var de = content.document.documentElement;
            document.getElementById(prefix + "-autopager-disable-on-site").setAttribute("checked", false)
            var matched = false;
            var allowed = false;
            if (de.autopagerEnabledDoc != null)
            {
                for(var i=0;i<de.autopagerEnabledDoc.length;i++) {
                    var doc = de.autopagerEnabledDoc[i];
                    if (doc.location != null)
                    {
                        matched = true;
                        var siteConfirm = autopagerConfig.findConfirm(autopagerConfig.getConfirm(),doc.documentElement.autopagerGUID,doc.location.host);
                        if (siteConfirm)
                            allowed = siteConfirm.UserAllowed;
                        else
                            allowed = !autopagerMain.loadBoolPref("disable-by-default");
                        break;
                    }
                }
            }
            document.getElementById(prefix + "-autopager-disable-on-site").setAttribute("checked", !allowed);
            document.getElementById(prefix + "-autopager-disable-on-site").setAttribute("hidden",!matched);
            document.getElementById(prefix + "-autopager-issue-on-site").setAttribute("hidden",!matched);
            document.getElementById(prefix + "-autopager-request-on-site").setAttribute("hidden",matched);
            document.getElementById(prefix + "-autopager-enabled").setAttribute("checked",autopagerMain.loadEnableStat());
            //document.getElementById(prefix + "-autopager-immedialate-load").setAttribute("hidden",!matched);
            //document.getElementById(prefix + "-autopager-showoption").setAttribute("hidden",!matched);

            var showpagehold=autopagerMain.loadBoolPref("showpagehold");
            document.getElementById(prefix +"-autopager-hidden-panel-menu").hidden = !this.autopagerDebug && !showpagehold;
            document.getElementById(prefix +"-autopager-hidden-panel-separator").hidden = !this.autopagerDebug && !showpagehold;

            document.getElementById(prefix + "-autopagerlite-switchToNormal").setAttribute("hidden",!autopagerMain.loadBoolPref("work-in-lite-mode"));
            document.getElementById(prefix + "-autopagerlite-switchToLite").setAttribute("hidden",autopagerMain.loadBoolPref("work-in-lite-mode"));

        }catch(e){
            autopagerMain.alertErr("Exception:" + e);
        }
    
},
disableOnSite : function(target,d) {

        try{
            var de = d.documentElement;

            if (de.autopagerEnabledDoc != null)
            {
                for(var i=0;i<de.autopagerEnabledDoc.length;i++) {
                    var doc = de.autopagerEnabledDoc[i];
                    if (doc.location != null)
                    {
                        var siteConfirm = autopagerConfig.findConfirm(autopagerConfig.getConfirm(),doc.documentElement.autopagerGUID,doc.location.host);
                        if (siteConfirm)
                        {
                            siteConfirm.UserAllowed = !siteConfirm.UserAllowed;
                            autopagerMain.enabledInThisSession(doc,siteConfirm.UserAllowed);
                        }
                        else
                        {
                            var host = doc.location.host;
                            var guid = doc.documentElement.autopagerGUID;
                            var enabled = target.getAttribute("checked")=='true';
                            autopagerConfig.addConfirm(autopagerConfig.getConfirm(),guid,-1,host,enabled);
                            if (enabled)
                            {
                                autopagerMain.clearLoadStatus(d);
                                autopagerMain.onContentLoad(d);
                            }
                            else
                                autopagerMain.enabledInThisSession(doc,enabled);
                        }
                        autopagerConfig.saveConfirm(autopagerConfig.getConfirm());
                        break;
                    }
                }
            }

        }catch(e){
            autopagerMain.alertErr("Exception:" + e);
        }
    autopagerMain.setGlobalEnabled(autopagerMain.loadEnableStat());
},
requestHelp : function(target,d) {
    autopagerMain.reportSite(target,d);
},
reportSite : function(target,d) {

        try{
            var de = d.documentElement;
            var opened = false;
            if (de.autopagerEnabledDoc != null)
            {
                for(var i=0;i<de.autopagerEnabledDoc.length;i++) {
                    var doc = de.autopagerEnabledDoc[i];
                    if (doc.location != null)
                    {
                        autopagerToolbar.autopagerOpenIntab("http://autopager.teesoft.info/reportissues/" + doc.location.href);
                        opened = true;
                        break;
                    }
                }
            }
            if (!opened)
                autopagerToolbar.autopagerOpenIntab("http://autopager.teesoft.info/requestsites/" + d.location.href);

        }catch(e){
            autopagerMain.alertErr("Exception:" + e);
        }

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
    if (doc.documentElement.contentXPath == null || doc.documentElement.contentXPath.length==0)
    {
        autopagerMain.processByClickOnly(doc,url);
    }
    else if (doc.documentElement.getAttribute('enableJS') == 'true') {
        autopagerMain.processInSplitWin(doc);
    }else{
        autopagerMain.processNextDocUsingXMLHttpRequest(doc,url);
    }
},
processByClickOnly : function(doc,url)
{
        autopagerMain.autopagerSimulateClick(doc.defaultView, doc,url);

        var de = doc.documentElement;
        var loaded = false;
        if (de.autopagerNodeListener)
        {
            doc.removeEventListener("DOMNodeInserted",de.autopagerNodeListener,false);
            de.autopagerNodeListener = null;
        }
        doc.addEventListener("DOMNodeInserted",function()
        {
            var self = arguments.callee;
            de.autopagerNodeListener = self;
            var urlNodes = autopagerMain.findNodeInDoc(doc,de.getAttribute('linkXPath'),de.getAttribute('enableJS') == 'true');
            if (urlNodes != null && urlNodes.length >0) 
            {
                var nextUrl = autopagerMain.getNextUrl(doc,de.getAttribute('enableJS') == 'true',urlNodes[0]);
                if (nextUrl != null && de.autopagernextUrl != nextUrl)
                {
                    de.autopagernextUrl = nextUrl;
                }
            }
            if (!loaded)
            {
                loaded = true;
                window.setTimeout(function (){
                    autopagerMain.onStopPaging(doc);
            var scrollContainer = null;
			if (de.getAttribute("containerXPath"))
			{
					autopagerContainer = autopagerMain.findNodeInDoc(
							de,de.getAttribute("containerXPath"),false);
					if (autopagerContainer!=null)
					{
							scrollContainer = autopagerContainer[0];
                            scrollContainer.removeEventListener("scroll",autopagerMain.scrollWatcher,true);
							scrollContainer.addEventListener("scroll",autopagerMain.scrollWatcher,true);
					//scrollContainer.onscroll = autopagerMain.scrollWatcher;
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
			de.autoPagerPageHeight.push(sh);
                }, doc.documentElement.delaymsecs);
            }

        },false);
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
    doc.documentElement.autopagerSplitCloning = false;
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
        splitbrowse.switchToCollapsed(true);
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
    //autopagerUtils.consoleLog("autopagerSimulateClick")
    var xPower= 0.5;
    var yPower= 0.5;

    if (autopagerMain.loadBoolPref("anti-anti-autopager"))
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
    if (doc.documentElement.getAttribute('autopagerAjax')=='true')
    {
        //observe http conections
        listener = this.observeConnection(node.ownerDocument);
    }
    splitbrowse.switchToCollapsed(false);
    var focused = document.commandDispatcher.focusedElement;

    var canceled = false;
    var needMouseEvents =  autopagerMain.loadBoolPref("simulateMouseDown") || doc.documentElement.getAttribute('autopagerAjax')=='true' || doc.documentElement.getAttribute('autopagerNeedMouseEvent')=='true';
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
    if (doc.documentElement.getAttribute('autopagerAjax')=='true')
    {
        //observe http conections
        if (listener!=null)
        {
            var delaymsecs = 0;
            if (doc.documentElement.delaymsecs && doc.documentElement.delaymsecs>0)
                delaymsecs = doc.documentElement.delaymsecs*1; //convert to integer
            setTimeout(function(){ listener.stopObserveConnection()},1000 + delaymsecs);
            //clear after teen seconds whethere success or not
            setTimeout(function(){ listener.removeObserveConnection()},10000 + delaymsecs);
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
        var newDoc = b.contentDocument;
        autopagerMain.processInSplitDoc(doc,newDoc,b);
    }catch (e){
        autopagerMain.alertErr("unable to load url:" + e);
    }
    
},
processInSplitDoc : function(doc,splitDoc,b){
    try{
        var de = doc.documentElement
        //alert(nodes.length);
        var urlNodes = autopagerMain.findNodeInDoc(splitDoc,de.getAttribute('linkXPath'),de.getAttribute('enableJS') == 'true');
        //alert(urlNodes);
        if (urlNodes != null && urlNodes.length >0) {
              nextUrl = autopagerMain.getNextUrl(doc,de.getAttribute('enableJS') == 'true',urlNodes[0]);
        }else //try frames
        {
            if (splitDoc.defaultView.frames != null) {
                for(var i=0;i<splitDoc.defaultView.frames.length;++i) {
                    if (autopagerMain.processInSplitDoc(doc,splitDoc.defaultView.frames[i].document,b))
                        return true;
                }
            }
            return false;
        }
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
        return false;
    }
    return true;

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
evaluateWrapper: function (doc, aExpr, aNode)
{
    return doc.evaluate(aExpr, aNode, null, 0, null);
},
// Evaluate an XPath expression aExpression against a given DOM node
// or Document object (aNode), returning the results as an array
// thanks wanderingstan at morethanwarm dot mail dot com for the
// initial work.
autopagerEvaluateXPath : function(aNode, path,enableJS) {
    var doc = (aNode.ownerDocument == null) ? aNode : aNode.ownerDocument;
    //var aNode = doc.documentElement;
    var aExpr = autopagerMain.preparePath(doc,path,enableJS);

    var found = new Array();
    try{
        //var doc = aNode.ownerDocument == null ?
        //		aNode.documentElement : aNode.ownerDocument.documentElement;
        var result =  autopagerMain.evaluateWrapper(doc,aExpr, aNode);// doc.evaluate(aExpr, aNode, null, 0, null);
        
//        var xpe = new XPathEvaluator();
//        var nsResolver = xpe.createNSResolver(doc.documentElement);
//        var result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);
//        
        var res;
        while ((res = result.iterateNext()))
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
    //autopagerUtils.consoleLog(xpath);
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
        while ((res = result.iterateNext()))
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
			if (de.getAttribute("containerXPath"))
			{
					autopagerContainer = autopagerMain.findNodeInDoc(
							de,de.getAttribute("containerXPath"),false);
					if (autopagerContainer!=null)
					{
							scrollContainer = autopagerContainer[0];
                            scrollContainer.removeEventListener("scroll",autopagerMain.scrollWatcher,true);
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

            //alert(nodes);
            var divStyle = autopagerMain.loadUTF8Pref("pagebreak");// "clear:both; line-height:20px; background:#E6E6E6; text-align:center;";
            var div= autopagerMain.createDiv(container,"",divStyle); 

            var nextPageHref = nextUrl
            if (nextUrl.getAttribute && nextUrl.getAttribute('href')
                && ((nextUrl.getAttribute('href').substr(0, 7)=='http://' ) || (nextUrl.getAttribute('href').substr(0, 8)=='https://' )))
            {
                nextPageHref = nextUrl.getAttribute('href')
            }else
            if (!(typeof (nextPageHref) == 'string'))
            {
                nextPageHref = doc.location.href;
            }
			de.autoPagerPageHeight.push(sh);
            de.autoPagerPageUrl.push(nextPageHref);
            div.innerHTML = "<span><a target='_blank' href='http://autopager.teesoft.info/help.html'>" + autopagerConfig.autopagerGetString("pagebreak2") + "</a>&nbsp;&nbsp;" +
                        autopagerConfig.autopagerFormatString("pagelink",[nextPageHref,"&nbsp;&nbsp;&nbsp;" + (++de.autoPagerPage) + "&nbsp;&nbsp;&nbsp;"])
                        + autopagerMain.getNavLinks(de.autoPagerPage,sh)
                        + "</span>";
            var insertPoint =	de.autopagerinsertPoint;
            div.setAttribute("id","apBreakStart" + de.autoPagerPage);
            insertPoint.parentNode.insertBefore(div,insertPoint);

            //load preload xpaths, like //style for make WOT works
            var preXPath=this.getPreloadXPaths();
            if (preXPath.length>0)
             {
                var preloadNodes = autopagerMain.findNodeInDoc(doc,preXPath,de.getAttribute('enableJS') == 'true');
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
                    newNode = container.importNode (newNode,true);
                    autopagerMain.removeElements(newNode,de.removeXPath,de.getAttribute('enableJS') == 'true')
                    newNode = insertPoint.parentNode.insertBefore(newNode,insertPoint);
                    
                }catch(e) {
                    autopagerMain.alertErr(e);
                }
            }
            div = autopagerMain.createDiv(container,"","display:none;");
            div.setAttribute("id","apBreakEnd" + de.autoPagerPage);
            insertPoint.parentNode.insertBefore(div,insertPoint);
            
            //alert(nodes.length);
            var urlNodes = autopagerMain.findNodeInDoc(doc,de.getAttribute('linkXPath'),de.getAttribute('enableJS') == 'true');
            //alert(urlNodes);
            if (urlNodes != null && urlNodes.length >0) {
                nextUrl = autopagerMain.getNextUrl(container,de.getAttribute('enableJS') == 'true',urlNodes[0]);
            }else
            {
                nextUrl = null;
                container.removeEventListener("scroll",autopagerMain.scrollWatcher,false);
                if (scrollContainer != de)
                {
                    scrollContainer.removeEventListener("scroll",autopagerMain.scrollWatcher,false);
//                     if (container.defaultView && container.defaultView.top &&
//                       container.defaultView.top != container.defaultView)
//                       container.defaultView.top.document.removeEventListener("scroll",autopagerMain.scrollWatcher,false);
               }

            }
            de.autopagernextUrl = nextUrl;
            autopagerRefinement.listenOndisableRefinement(container);
            }
           
           if (autopagerMain.tweakingSession && container.defaultView.top == container.defaultView)
           {
//               if (de.autopagerPreviousURL && de.autopagerPreviousURL != doc.location.href)
//                {
//                    autopagerMain.changeSessionUrl(container, de.autopagerPreviousURL,de.autoPagerPage);
//                }
                de.autopagerPreviousURL = doc.location.href
           }
        }

    }catch(e) {
        autopagerMain.alertErr(e);
    }

   if (doc.defaultView!=null && doc.defaultView.frames != null) {
        for(var i=0;i<doc.defaultView.frames.length;++i) {
            autopagerMain.scrollWindow(container,doc.defaultView.frames[i].document);
        }
    }
    return true;
},
changeSessionUrlByScrollHeight : function (container,pos)
{
    if (autopagerMain.tweakingSession && container.defaultView.top == container.defaultView)
    {
        var de = container.documentElement;
        var a = de.autoPagerPageHeight
        if (!a)
            return;
        var st = (container && container.documentElement &&  container.documentElement.scrollTop)
					? container.documentElement.scrollTop : container.body.scrollTop;
//        if (container.body != null && container.body.scrollHeight > sh)
//        {
//                sh = container.body.scrollHeight;
//        }
        //autopagerUtils.consoleLog(st + " " + pos)
        for(var i=a.length-1;i>=0;i--)
        {
            if ((st + pos)>a[i] - container.documentElement.contentBottomMargin)
            {
                var url = de.autoPagerPageUrl[i];
                autopagerMain.changeSessionUrl(container, url,i);
                return;
            }
        }
        autopagerMain.changeSessionUrl(container, container.location.href,1);
    }
},
changeSessionUrl : function (container, url,pagenum)
{
        var browser = splitbrowse.getBrowserNode(container);
        var webNav = browser.webNavigation;
        var newHistory = webNav.sessionHistory;

        newHistory = newHistory.QueryInterface(Components.interfaces.nsISHistoryInternal);
        var entry = newHistory.getEntryAtIndex(newHistory.index,false).QueryInterface(Components.interfaces.nsISHEntry);
        //autopagerUtils.consoleLog(url)
        if (entry==null || entry.URI==null || entry.URI.spec==url)
        {
            return;
        }
        if (newHistory.index==0 ||
            (newHistory.getEntryAtIndex(newHistory.index-1,false)
            .QueryInterface(Components.interfaces.nsISHEntry) &&
             !newHistory.getEntryAtIndex(newHistory.index-1,false)
            .QueryInterface(Components.interfaces.nsISHEntry).URI.spec == container.location.href))
        {
            var newEntry = splitbrowse.cloneHistoryEntry(entry);
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
getNavImage : function(nav){
    return "<img align='top' style='border: 0pt;height:18px;float:none;display:inline' src='chrome://autopagerimg/content/" + nav+ "_24.png' alt='" + autopagerConfig.autopagerGetString("nav" + nav) + "' />";
},
getNavLinks : function(pos)
{
  var links = "<a id='autopager_" + (pos+0) + "' name='autopager_" + (pos+0) + "'/>";
  if (autopagerMain.loadBoolPref("show-nav-top"))
    links = links + "&nbsp;&nbsp;<a href='javascript:window.scroll(0,0)' title='" + autopagerConfig.autopagerGetString("navtop") + "'>" + autopagerMain.getNavImage("top") + "</a>";
  if (autopagerMain.loadBoolPref("show-nav-up"))
  {
      if (pos>2)
          links = links + "&nbsp;&nbsp;<a href='#autopager_" + (pos-1) +"' title='" + autopagerConfig.autopagerGetString("navup") + "'>" + autopagerMain.getNavImage("up") + "</a>";
      else //same as top if this is the first page break
          links = links + "&nbsp;&nbsp;<a href='javascript:window.scroll(0,0)' title='" + autopagerConfig.autopagerGetString("navup") + "'>" + autopagerMain.getNavImage("up") + "</a>";
  }
  if (autopagerMain.loadBoolPref("show-nav-down"))
    links = links + "&nbsp;&nbsp;<a href='#autopager_" + (pos+1) +"' title='" + autopagerConfig.autopagerGetString("navdown") + "'>" + autopagerMain.getNavImage("down") + "</a>";
  if (autopagerMain.loadBoolPref("show-nav-bottom"))
    links = links + "&nbsp;&nbsp;<a href='javascript:window.scroll(0,document.body.scrollHeight)' title='" + autopagerConfig.autopagerGetString("navbottom") + "'>" + autopagerMain.getNavImage("bottom") + "</a>";
return links;
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
    autopagerMain.pagingWatcher(doc);
},
onStopPaging : function(doc) {

    //if (doc.documentElement.autopagerPagingCount>0)
    doc.documentElement.autopagerPagingCount--;
    autopagerMain.hiddenDiv(autopagerMain.getPagingWatcherDiv(doc,false),true);
    if (doc.documentElement.autopagerPagingCount <= 0)
    {
        
                if (autopagerMain.flashIconNotify)
                    autopagerMain.setGlobalEnabled(autopagerMain.loadEnableStat());
    }
    doc.documentElement.autopagerEnabled = true;
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
HighlightNextLinks : function(doc)
{
    if (!doc)
        doc = content.document;
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
HighlightAutoPagerContents : function(doc)
{
    if (!doc)
        doc = content.document;
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
enabledInNextPagesAlways : function(doc,always)
{
    if (!doc)
        doc = content.document;
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
        autopagerConfig.addConfirm(autopagerConfig.getConfirm(),guid,countNumber,host,true);
        autopagerConfig.saveConfirm(autopagerConfig.getConfirm());
        autopagerMain.setGlobalEnabled(autopagerMain.loadEnableStat());
    }
},
enabledInThisTime : function(doc,enabled)
{
    if (!doc)
        doc = content.document;
    autopagerMain.enabledInNextPages(doc,enabled,1);
},
enabledInNextPages : function(doc,enabled,count)
{
    if (!doc)
        doc = content.document;
    var de =doc.documentElement;
    de.autopagerUserConfirmed= true;
    de.autopagerSessionAllowed= true;
    de.autopagerSessionAllowedPageCount = count;
    de.autopagerAllowedPageCount=de.autoPagerPage+count;
    de.autopagerUserAllowed=enabled;
    de.autopagerEnabled = enabled;
     autopagerMain.hiddenOptionDiv(doc);
     autopagerMain.scrollWatcher(doc);
},
hiddenOptionDiv : function(doc)
{
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
enabledThisSite : function(doc,enabled)
{
    if (!doc)
        doc = content.document;
    autopagerMain.enabledInThisSession(doc,enabled);
    var host = doc.location.host;
    var guid = doc.documentElement.autopagerGUID;
    autopagerConfig.addConfirm(autopagerConfig.getConfirm(),guid,-1,host,enabled);
    autopagerConfig.saveConfirm(autopagerConfig.getConfirm());
    autopagerMain.scrollWatcher(doc);
    autopagerMain.setGlobalEnabled(autopagerMain.loadEnableStat());
},
enabledInThisSession : function(doc,enabled)
{
    if (!doc)
        doc = document.content;
    var de =doc.documentElement;
    de.autopagerUserConfirmed= true;
    de.autopagerSessionAllowed= enabled;
    de.autopagerAllowedPageCount=-1;
    de.autopagerUserAllowed=enabled;
    de.autopagerEnabled = enabled;
     autopagerMain.hiddenOptionDiv(doc);
     autopagerMain.scrollWatcher(doc);
},
pagingWatcher : function(doc) {
    if (!(doc instanceof HTMLDocument) && doc.ownerDocument)
            doc = doc.ownerDocument;
    doc =  doc.defaultView.top.document;
    var de = doc.documentElement;
    try{
        if((autopagerMain.getGlobalEnabled() ||  de.forceLoadPage>0) && de.autopagerEnabledDoc!=null) {
    	    var Enable = false;
            var loading = false;
            for(var i=0;i<de.autopagerEnabledDoc.length;i++) {
                doc = de.autopagerEnabledDoc[i];
                Enable = doc.documentElement.autopagerPagingCount>0;
                if (Enable) {
                     autopagerMain.hiddenDiv(autopagerMain.getPagingWatcherDiv(doc,true),false);
                    loading = true;
                }
            }
            if (loading)
                {
                    if (autopagerMain.flashIconNotify)
                    {
                    document.autoPagerImageShowStatus = !document.autoPagerImageShowStatus;
                    autopagerMain.setGlobalImageByStatus(document.autoPagerImageShowStatus);
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
        autopagerMain.hiddenDiv(autopagerMain.getPagingWatcherDiv(doc,false),true);
        if (autopagerMain.flashIconNotify)
            autopagerMain.setGlobalEnabled(autopagerMain.loadEnableStat());
        //autopagerMain.setGlobalImageByStatus(autopagerMain.getGlobalEnabled());
    }
    
},
fixUrl : function(doc,url) {
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
showAutoPagerMenu : function(menuid) {
    if (!menuid)
        menuid="autopager-popup";
    var popup = document.getElementById(menuid);
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
    if (document.autoGlobalPagerEnabled != enabled) {
        autopagerMain.saveEnableStat(enabled);
    }
    //autopagerMain.setGlobalEnabled( enabled);
//	if (enabled)
//	{
//		window.removeEventListener("scroll",autopagerMain.scrollWatcher,false);
//		window.addEventListener("scroll",autopagerMain.scrollWatcher,false);
//    }
//	else
//		window.removeEventListener("scroll",autopagerMain.scrollWatcher,false);

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
    autopagerMain.saveBoolPref("enabled", enabled); // set a pref
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
        if (autopagerMain.getAutopagerPrefs().getCharPref("." +  name)!=value)
            return autopagerMain.getAutopagerPrefs().setCharPref("." +  name,value); // set a pref
    }catch(e) {
        //autopagerMain.alertErr(e);
    }
    return "";
},
saveBoolPref : function(name,value) {
    try{
        
        if (autopagerMain.getAutopagerPrefs().getBoolPref("." +  name)!=value)
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
    //autopagerMain.setGlobalImageByStatus(enabled);
    if (enabled)
        autopagerMain.logInfo(autopagerConfig.autopagerGetString("autopageenabled"),autopagerConfig.autopagerGetString("autopageenabledTip"));
    else
        autopagerMain.logInfo(autopagerConfig.autopagerGetString("autopagedisabled"),autopagerConfig.autopagerGetString("autopagedisabledTip"));
    var autopagerButton = document.getElementById("autopager-button");
    if (!autopagerButton)
        autopagerButton = document.getElementById("autopager-button-fennec");
    var image = document.getElementById("autopager_status");
    if (autopagerButton!=null || image!=null)
    {
        var apStatus ="ap-disabled";
        if (enabled)
        {
            if (content && !this.isEnabledOnDoc(content.document))
                apStatus = "ap-site-disabled";
            else
                apStatus = "ap-enabled";
        }
        if (autopagerButton)
        {
            if (autopagerButton.className.indexOf(" ap-")==-1)
                autopagerButton.className= autopagerButton.className + " " + apStatus;
            else
                autopagerButton.className= autopagerButton.className.substr(0,autopagerButton.className.indexOf(" ap-")) + " " + apStatus;
        }
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
    while(tooltip.childNodes.length < tips.length)
        tooltip.appendChild(tooltip.childNodes[0].cloneNode(true));
    for(var i=0;i< tooltip.childNodes.length;++i) {
        tooltip.childNodes[i].hidden=(i >= tips.length);
    }
    
    for(var i=0;i<tips.length;i++)
        tooltip.childNodes[i].value = tips[i];
  }catch(e){}
},
logInfoDebug : function(status,tip) {
    window.content.status = status;
    var tooltip = document.getElementById("autopager_tip");
    
    var tips = tip.split("\n");
    var tipCount = tooltip.childNodes.length;
    for(var i=0;i<tips.length;++i)
        tooltip.appendChild(tooltip.childNodes[0].cloneNode(true));
    for(var i=0;i<tips.length;i++)
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
    openWorkshopInDialog : function(url,obj) {
        window.autopagerSelectUrl=url;
        window.autopagerOpenerObj = obj;
        window.open("chrome://autopager/content/autopager-workshopWin.xul", "autopager-workshopWin",
        "chrome,resizable,centerscreen,width=700,height=600");
    },
changeMyName : function() {
    var name = prompt(autopagerConfig.autopagerGetString("inputname"),autopagerMain.loadMyName());
    if (name!=null && name.length>0) {
        autopagerMain.saveMyName(name);
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
			return autopagerMain.loadPref("miniheight");
    }
	, getDefaultMargin : function()
	{
			return autopagerMain.loadPref("defaultheight");
    }
	, showStatus : function(){
            var statusBar = document.getElementById("autopager_status");
            if (statusBar!=null)
				statusBar.hidden = autopagerMain.loadBoolPref("hide-status");
            var separator1 = document.getElementById("autopager-context-separator1");
            if (separator1!=null)
                separator1.hidden = autopagerMain.loadBoolPref("hide-context-menu");
            var menu = document.getElementById("autopager-context-menu");
            if (menu!=null)
                menu.hidden = autopagerMain.loadBoolPref("hide-context-menu");

    },
    showToolbarIcon : function(){
        if (!autopagerMain.loadBoolPref("hide-toolbar-icon"))
        {
            autopagerToolbar.addAutopagerButton();
        }
        else
            autopagerToolbar.removeAutopagerButton();
    },
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
  getPreloadXPaths : function ()
  {
    var xPathlists = [];
    var extensionsXPath = {
      "{a0d7ccb3-214d-498b-b4aa-0e8fda9a7bf7}": "//style" //WOT
    }

    var list = this.getAddonsList();

    var len = list.length;

    for (var j = 0; j < len; j++) {
      var curExt = list[j];
      if (extensionsXPath[curExt]) {
        xPathlists.push(extensionsXPath[curExt]);
      }
    }
    return xPathlists;

  },
  getDelayMiliseconds : function()
  {
    return autopagerMain.loadPref("loadingDelayMiliseconds");
  },
  getMinipages : function()
  {
    return autopagerMain.loadPref("minipages");
  },
  showWorkshop : function()
  {
    if (autopagerMain.loadBoolPref("show-workshop-in-sidebar"))
        toggleSidebar('viewautopagerSidebar');
    else
        autopagerMain.openWorkshopInDialog();
  },
  showHelp : function()
    {
        autopagerToolbar.autopagerOpenIntab("http://autopager.teesoft.info/help.html");
    },
 showDonation : function()
    {
        autopagerToolbar.autopagerOpenIntab("http://autopager.teesoft.info/donation.html");
    },
 showRules : function()
    {
        autopagerToolbar.autopagerOpenIntab("http://autopager.teesoft.info/rules.html");
    },
 showTutorials : function()
    {
        autopagerToolbar.autopagerOpenIntab("http://autopager.teesoft.info/tutorials.html");
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

 },
   observe: function(subject, topic, data)
   {
     if (topic != "nsPref:changed")
     {
       return;
     }

     switch(data)
     {
       case ".enabled":
         try{
            autopagerMain.setGlobalEnabled(autopagerMain.loadEnableStat());
         }catch(e){}         
         break;
       case ".hide-status":
         try{
            autopagerMain.showStatus();
         }catch(e){}
         break;
       case ".hide-toolbar-icon":
         try{
            autopagerMain.showToolbarIcon();
         }catch(e){}
         break;
       case ".tweaking-session":
           autopagerMain.tweakingSession= autopagerMain.loadBoolPref("tweaking-session");
           break;
       case ".ids":
       case ".with-lite-recommended-rules":
           UpdateSites.updateRepositoryOnline("autopagerLite.xml",true);
           break;
       case ".work-in-lite-mode":
           autopagerMain.saveBoolPref("with-lite-discovery",autopagerMain.loadBoolPref("work-in-lite-mode"));
           alert("You need restart firefox to make this change take effect.");
           autopagerToolbar.autopagerOpenIntab("http://autopager.teesoft.info/lite.html");
           break;
       case ".with-lite-discovery-aways-display":
           if (autopagerMain.loadBoolPref("with-lite-discovery-aways-display"))
               autopagerLite.hiddenStatus(false);
           break;

     }
   },
   openCoreOptions : function()
   {
       window.open("chrome://autopager/content/options.xul", "autopager-option",
                "chrome,resizable,centerscreen");
   },
    isAutoPagerHiddenWindow : function (doc)
    {
        var browser = splitbrowse.getBrowserNode(doc);
        return (browser && browser.getAttribute(splitbrowse.getSplitKey()))
    }
};

autopagerMain.autopagerOnLoad();

var apBrowserProgressListener = {
    onStateChange : function(aWebProgress, aRequest, aStateFlags, aStatus)
    {
        const nsIWebProgressListener = Components.interfaces.nsIWebProgressListener;
        const nsIChannel = Components.interfaces.nsIChannel;

//        autopagerUtils.consoleLog("onStateChange:" + aStateFlags + ":" + aStatus +":"
//        + (aStateFlags & nsIWebProgressListener.STATE_START &&
//            aStateFlags & nsIWebProgressListener.STATE_IS_NETWORK) + ":"
//        + (aStateFlags & nsIWebProgressListener.STATE_STOP &&
//            aStateFlags & nsIWebProgressListener.STATE_IS_NETWORK));

        if (!aWebProgress.isLoadingDocument  && (aStateFlags & nsIWebProgressListener.STATE_STOP) &&
            (aStateFlags & nsIWebProgressListener.STATE_IS_NETWORK))
        {
            window.setTimeout(function(){
                if (!(!aWebProgress.isLoadingDocument 
                        && aWebProgress.QueryInterface(Components.interfaces.nsIWebProgress)
                        && aWebProgress.DOMWindow
                        && aWebProgress.DOMWindow.document
                        && aWebProgress.DOMWindow.document.location
                        && aWebProgress.DOMWindow.document.location.href))
                    return;
                //autopagerUtils.consoleLog(aWebProgress.DOMWindow.document.location.href)
                autopagerMain.onContentLoad(aWebProgress.DOMWindow.document);
        },1000);

        }

    },
    onStatusChange : function(webProgress, request, status, message)
    {
//        return;
    },
    onLocationChange : function(webProgress, request, location)
    {
        //autopagerUtils.consoleLog(location.spec)
        if (!webProgress.isLoadingDocument
            && webProgress.DOMWindow
            && webProgress.DOMWindow.document
            && webProgress.DOMWindow.document.documentElement.getAttribute('autopagerAjax') == "true")
        {
            window.setTimeout(function(){
                autopagerMain.clearLoadedPages(webProgress.DOMWindow.document);
        },1000);
        }
//        return;
    },
    onProgressChange : function(webProgress, request,
        curSelfProgress, maxSelfProgress,
        curTotalProgress, maxTotalProgress) {
//        return;
    },
    onSecurityChange : function(webProgress, request, state)
    {
//        return;
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