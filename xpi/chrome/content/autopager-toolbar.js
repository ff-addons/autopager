const CI = Components.interfaces;
const CC = Components.classes;
function addAutopagerButton() {
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
                    if(!hasAutopagerButton && child.id == "urlbar-container") {
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
}

function autopagerToobarInit() {
    //var autopagerHome = "http://www.teesoft.info/content/view/27/1/";
    var autopagerHome = "http://autopager.teesoft.info/index.html";
//    var autopagerHome = "http://www.teesoft.info";

    var prefService = Components.classes["@mozilla.org/preferences;1"].getService(Components.interfaces.nsIPrefService);
    var prefBranch = prefService.getBranch("autopager.");
    if (!prefBranch.prefHasUserValue("last_version")) {  // new user
        prefBranch.setCharPref("last_version", "0.1.6.0.33");
        autopagerOpenIntab(autopagerHome,null);
        addAutopagerButton();
    } else { // check for upgrade
        var lastVersion = prefBranch.getCharPref("last_version");
        if (lastVersion != "0.1.6.0.33")
        {
            prefBranch.setCharPref("last_version", "0.1.6.0.33");
            autopagerOpenIntab(autopagerHome,null);
            //addAutopagerButton();
        }
    }
}

function autopagerOpenIntab(url,obj)
{
    var wm =  CC['@mozilla.org/appshell/window-mediator;1'].getService(CI.nsIWindowMediator);
    var w = wm && wm.getMostRecentWindow('navigator:browser', true);
    if(w && !w.closed) {
        var browser = getBrowser();//w.getBrowser();
        var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                      .getService(Components.interfaces.nsIIOService);
        var ops = ioService.newURI("http://www.teesoft.info", null, null);
        var tab = browser.addTab(url,ops);
        browser.selectedTab = tab;
        return tab;
    } else {
        return window.open(url, "_blank");
    }        
}

window.addEventListener("load", function() {
        var self = arguments.callee;
        window.removeEventListener("load",self,false);
        setTimeout(autopagerToobarInit, 250); }, false);
