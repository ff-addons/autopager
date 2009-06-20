var autopagerToolbar =
{
    addAutopagerButton : function() {
        var toolbox = document.getElementById("navigator-toolbox");
        var toolboxDocument = toolbox.ownerDocument;

        var hasAutopagerButton = false;
        for (var i = 0; i < toolbox.childNodes.length; ++i) {
            var toolbar = toolbox.childNodes[i];
            if (toolbar.localName == "toolbar" && toolbar.getAttribute("customizable") == "true") {
                if (toolbar.currentSet.indexOf("autopager-button") > -1) {
                    hasAutopagerButton = true;
                }
            }
        }

        if(!hasAutopagerButton) {
            for (var i = 0; i < toolbox.childNodes.length; ++i) {
                toolbar = toolbox.childNodes[i];
                if (toolbar.localName == "toolbar" &&  toolbar.getAttribute("customizable") == "true" && toolbar.id == "nav-bar") {
                    var newSet = "";
                    var child = toolbar.firstChild;
                    while (child) {
                        if(!hasAutopagerButton && (child.id == "urlbar-container" || child.id =="nav-bar-inner") ) {
                            newSet += "autopager-button,";
                            hasAutopagerButton = true;
                        }
                        newSet += child.id + ",";
                        child = child.nextSibling;
                    }
                    newSet = newSet.substring(0, newSet.length - 1);
                    toolbar.currentSet = newSet;
                    toolbar.setAttribute("currentset", newSet);
                    toolboxDocument.persist(toolbar.id, "currentset");
                    try {
                        BrowserToolboxCustomizeDone(true);
                    } catch (e) {}
                    break;
                }
            }
        }
    },

    autopagerToobarInit : function() {
        //var autopagerHome = "http://www.teesoft.info/content/view/27/1/";
        var autopagerHome = "http://autopager.teesoft.info/index.html";
        //    var autopagerHome = "http://www.teesoft.info";

        var prefService = Components.classes["@mozilla.org/preferences;1"].getService(Components.interfaces.nsIPrefService);
        var prefBranch = prefService.getBranch("autopager.");
        if (!prefBranch.prefHasUserValue("last_version")) {  // new user
            if (autopagerToolbar.autopagerOpenIntab(autopagerHome + "?i=0.5.2.2",null))
            {
                prefBranch.setCharPref("last_version", "0.5.2.2");
                autopagerToolbar.addAutopagerButton();
                autopagerToolbar.autopagerOpenIntab("chrome://autopager/content/options.xul");
            }
            autopagerConfig.autopagerUpdate();
        } else { // check for upgrade
            var lastVersion = prefBranch.getCharPref("last_version");
            if (lastVersion != "0.5.2.2")
            {
                if (autopagerToolbar.autopagerOpenIntab(autopagerHome+ "?u=" + lastVersion + "&i=0.5.2.2",null))
                {
                    prefBranch.setCharPref("last_version", "0.5.2.2");
                //autopagerToolbar.addAutopagerButton();
                    autopagerToolbar.autopagerOpenIntab("chrome://autopager/content/options.xul");
                }
                autopagerConfig.autopagerUpdate();
            }
        }
    },
    autopagerOpenIntab : function(url,obj)
    {
        var wm =  Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
        var w = wm && wm.getMostRecentWindow('navigator:browser', true);
        if(w && !w.closed) {
            var browser = w.getBrowser();//w.getBrowser();
            var ioService = Components.classes["@mozilla.org/network/io-service;1"]
            .getService(Components.interfaces.nsIIOService);
            var ops = ioService.newURI("http://www.teesoft.info", null, null);
            var uri = ioService.newURI(url, null, null);
            var tab = null;
            if (browser.addTab)
            {
                tab = browser.addTab(url,ops);
                browser.selectedTab = tab;
            }
            else if (window.Browser)
            {
                try{
                    tab = Browser._content.newTab(true);
                    if (tab) {
                        var content = Browser._content;
                        var browser = content.getBrowserForDisplay(content.getDisplayForTab(tab));
                        newWindow = browser.contentWindow;
                    }
                    newWindow.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                    .getInterface(Components.interfaces.nsIWebNavigation)
                    .loadURI(uri.spec,
                        Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE,
                        null, null, null);
                    newWindow.focus();
                    return true;
                }catch(e)
                {
                    alert(e)
                }
            }else
            {
                return window.open(url, "_blank")!=null;
            }
            return tab;
        } else {
            return window.open(url, "_blank")!=null;
        }
        return false;
    }
};

window.addEventListener("load", function() {
    var self = arguments.callee;
    window.removeEventListener("load",self,false);
    setTimeout(autopagerToolbar.autopagerToobarInit, 250);
}, false);
