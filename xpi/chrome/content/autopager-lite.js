/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var autopagerLite =
{
    openRules : function(event) {
        if(event.currentTarget != event.target) return;
        if(event.button == 2) {
            event.preventDefault();
            autopagerMain.showAutoPagerMenu("autopagerlite-popup");
        }
        else if(event.button == 0) {
            autopagerLite.openRulesSelector(content.document);
        }
    },
    openRulesSelector : function(doc)
    {
        var url=autopagerPref.loadPref("repository-site");
        if (doc && doc.location && doc.location.href)
        {
            url = url + "?url=" + encodeURIComponent(doc.location.href);
        }
        autopagerBwUtil.autopagerOpenIntab(url);
    },
    asyncRequest : function(url,contentType, handler)
    {
        var xmlhttp;
        try{
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }catch(e){
            xmlhttp = new XMLHttpRequest();
        }
        xmlhttp.overrideMimeType(contentType);
        xmlhttp.open("GET", url);
        xmlhttp.addEventListener("load", function(event)
        {
            handler(xmlhttp);
        }, false);
        xmlhttp.send(null);
    },
    hiddenStatus : function (hidden)
    {
        var icon = document.getElementById("autopagerlite_status");
        if (icon)
        {
            if (autopagerPref.loadBoolPref("with-lite-discovery-aways-display"))
                hidden = false;
            icon.setAttribute("hidden", hidden);
        }
    },
    setStatus : function (label,hidden)
    {
        var icon = document.getElementById("autopagerlite_status");
        if (icon)
        {
            if (autopagerPref.loadBoolPref("with-lite-discovery-aways-display"))
                hidden = false;
            if (!hidden && (label==null||label.length==0))
                label="?";
            icon.setAttribute("label", label);
            icon.setAttribute("hidden", hidden);
        }
    },
    apSiteRegex : function ()
    {
        return /ap\.teesoft.info\/.*/;
    }
    ,discoveryRules : function (doc)
    {
        if (doc && doc.location && doc.location.href)
        {
            if (doc.location.href.match(autopagerLite.apSiteRegex()))
                autopagerLite.processDiscoverResult("0");
            else
            {
                var href = doc.location.href;
                var clearedHref = autopagerUtils.clearUrl(href);
                var text = UpdateSites.AutopagerCOMP.discoverdUrls[clearedHref]
                if (text)
                {
                    if (text == " ")
                        autopagerLite.processDiscoverResult("");
                    else
                        autopagerLite.processDiscoverResult(text);
                }else
                {
                    var url=autopagerPref.loadPref("repository-site") + "discover/discover?ir=false&url=" + encodeURIComponent(doc.location.href);
                    autopagerLite.asyncRequest(url,"text/plan",function(xmlhttp){
                        if (xmlhttp)
                        {
                            if (xmlhttp.responseText)
                                UpdateSites.AutopagerCOMP.discoverdUrls[clearedHref] = xmlhttp.responseText
                            else
                                UpdateSites.AutopagerCOMP.discoverdUrls[clearedHref] = " "
                            autopagerLite.processDiscoverResult(xmlhttp.responseText);
                        }
                    })
                }
            }
        }
    },
    promptLiteDiscovery : function ()
    {
        //disabled, server can't handle two many requests
        return;
        if (autopagerBwUtil.isFennec())
            return;

        if (autopagerPref.loadBoolPref("lite-discovery-prompted"))
        {
            return;
        }
        var message = autopagerConfig.autopagerGetString("lite-discovery");
        var notificationBox = gBrowser.getNotificationBox();
        var notification = notificationBox.getNotificationWithValue("autopager-lite-discovery");
        if (notification) {
            notification.label = message;
        }
        else {
            var buttons = [{
                label: autopagerConfig.autopagerGetString("Yes"),
                accessKey: "Y",
                callback: function(){
                    autopagerPref.saveBoolPref("lite-discovery-prompted",true)
                    autopagerPref.saveBoolPref("with-lite-discovery",true)
                    autopagerLite.discoveryRules(content.document);
                }
            },{
                label: autopagerConfig.autopagerGetString("No"),
                accessKey: "N",
                callback: function(){
                    autopagerPref.saveBoolPref("lite-discovery-prompted",true)
                    autopagerPref.saveBoolPref("with-lite-discovery",false)
                    autopagerPref.saveBoolPref("with-lite-discovery-aways-display",true)
                }
            },{
                label: autopagerConfig.autopagerGetString("Help"),
                accessKey: "H",
                callback: function(){
                    autopagerBwUtil.autopagerOpenIntab("http://autopager.teesoft.info/lite.html");
                }
            }];

            const priority = notificationBox.PRIORITY_INFO_MEDIUM;
            notificationBox.appendNotification(message, "autopager-lite-discovery",
                "chrome://autopager/skin/autopager32.gif",
                priority, buttons);
        }

    },

    processDiscoverResult : function (result)
    {
        var values;
        if (result.length==0)
            values = [];
        else
            values = result.split(",");
        autopagerLite.setStatus(values.length,values.length==0 && autopagerPref.loadBoolPref("hide-lite-discovery-on-no-rules"));
        if (gBrowser && gBrowser.selectedTab && gBrowser.selectedTab.linkedBrowser)
        {
            gBrowser.selectedTab.linkedBrowser.setAttribute("autopagerMatchedRules",values.length);
        }
    },
    TabSelected : function(event)
    {
        if (gBrowser && gBrowser.selectedTab && gBrowser.selectedTab.linkedBrowser)
        {
            var length = gBrowser.selectedTab.linkedBrowser.getAttribute("autopagerMatchedRules");
            autopagerLite.setStatus(length,(length==null || length.length==0) && autopagerPref.loadBoolPref("hide-lite-discovery-on-no-rules"));
        }

    },
    apRuleSiteOnInit : function ()
    {
        // During initialisation
        window.addEventListener("DOMContentLoaded", autopagerLite.onContentLoad, false);
        try{
            if (getBrowser && getBrowser() && getBrowser().mTabContainer)
                {
                    getBrowser().mTabContainer.addEventListener("TabSelect", autopagerLite.TabSelected, false);
                }
        }catch(e){}
        if (autopagerPref.loadBoolPref("with-lite-discovery-aways-display"))
            autopagerLite.hiddenStatus(false);
    },
    onContentLoad : function (event)
    {
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
        if (!doc || !doc.location || !doc.location.href || !(doc.location.href.match(/ap\.teesoft\.info/)))
            return;

        if (autopagerBwUtil.isFennec() && typeof Browser!="undefined" && Browser._browserView)
        {
            var bv = Browser._browserView
            bv.setZoomLevel(2);
//            var browser = Browser;
//            if (browser && browser.markupDocumentViewer)
//            {
//                var zoomFactor=2
//              if (FullZoom.siteSpecific) {
//                FullZoom._cps.setPref(browser.currentURI, FullZoom.name, zoomFactor);
//              } else {
//                browser.markupDocumentViewer.fullZoom = zoomFactor;
//              }
//            }
        }

        var selectAll = doc.getElementById("apRulesForm:rulesTable:selectAll");
        if (selectAll)
            selectAll.checked = false;

        var sheets = doc.styleSheets
        for(var i=0;i<sheets.length;i++)
        {
            var sheet = sheets.item(i);
            if (!sheet || !sheet.href)
                continue;
            if (sheet.href.match(/ap\.teesoft\.info/))
            {
                if (sheet.cssRules)
                for(var r=0;r<sheet.cssRules.length;r++)
                {
                    if (sheet.cssRules[r].selectorText=='.editor')
                    {
                        sheet.cssRules[r].style.display="inline";
                    }
                }
            }
        }
        var enableButtons = ["apRulesForm:rulesTable:enable1","apRulesForm:rulesTable:enable2"];
        for(var i=0;i<enableButtons.length;i++)
        {
            var button = doc.getElementById(enableButtons[i]);
            if (button)
            {
                button.addEventListener("click", function(){
                    autopagerLite.enableRules(doc,true);
                }, true)
            }
        }
        var disableButtons = ["apRulesForm:rulesTable:disable1","apRulesForm:rulesTable:disable2"];
        for(var i=0;i<disableButtons.length;i++)
        {
            var button = doc.getElementById(disableButtons[i]);
            if (button)
            {
                button.addEventListener("click", function(){
                    autopagerLite.enableRules(doc,false);
                }, true)
            }
        }
        var idsEle = doc.getElementById("apRulesForm:ids_body");
        if (idsEle)
        {
            idsEle.addEventListener("DOMAttrModified",autopagerLite.idsChanged,false);
        }
    },
    idsChanged : function (e)
    {
        var node = e.target
        var ids = node.getAttribute("name");
        autopagerPref.savePref("ids",autopagerLite.processIds(ids));
    }
    ,enableRules : function(doc,enabled)
    {
        var inputs = doc.getElementsByTagName("input");
        var ids = "";
        for(var i=0; i < inputs.length; i++)
        {
            if (inputs[i].type=='checkbox' && inputs[i].id.match(/\:select$/)
                && inputs[i].checked)
                {
                ids = ids + "," + (inputs[i].nextSibling.textContent);
            }
        }
        if (enabled)
            autopagerPref.savePref("ids",autopagerLite.processIds(autopagerPref.loadPref("ids") + "," + ids));
        else
            autopagerPref.savePref("ids",autopagerLite.removeIds(autopagerPref.loadPref("ids") ,"," + ids + ","));

        //TODO:update the rules online
    },
    processIds : function (idStr)
    {
        var strs = idStr.replace(/\s+/g,",").split(",");
        var newS = ",";
        var numReg = new RegExp("\\d+")
        for(var i=0;i<strs.length;i++)
        {
            var s = strs[i];
            if (numReg.test(s) && newS.indexOf("," + s + ",")==-1)
            {
                newS += s + ",";
            }
        }
        return newS.substring(1,newS.length - 1);
    },
    removeIds : function (idStr,removedStr)
    {
        var strs = idStr.replace(/\s+/g,",").split(",");
        var newS = "";
        var numReg = new RegExp("\\d+")
        for(var i=0;i<strs.length;i++)
        {
            var s = strs[i];
            if (numReg.test(s) && !removedStr.match("," + s + ","))
            {
                if (newS.length>0)
                    newS+=",";
                newS += s;
            }
        }
        return newS;
    },
    switchToLite : function(doc,liteMode)
    {
        autopagerPref.saveBoolPref("work-in-lite-mode",liteMode);
       if (liteMode)
       {
           autopagerPref.saveBoolPref("noprompt",true);
           autopagerPref.saveBoolPref("disable-by-default",false);
       }
    },
    isInLiteMode : function ()
    {
//        if (!autopagerBwUtil.isFennec())
            return autopagerPref.loadBoolPref("work-in-lite-mode");
//        return true;
    }
}
