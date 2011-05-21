Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

/***********************************************************
class definition
 ***********************************************************/

//class constructor
function AutopagerCOMP() {
    // If you only need to access your component from Javascript, uncomment the following line:
    this.wrappedJSObject = this;
}

var autopagerHTTPListener = {
    headerName  : "X-AutoPager",
    autopagerVersionValue : "0.6.2.10",
    observe: function(obj,subject, topic, data)
    {
        let os = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
        switch (topic)
        {
            case "http-on-modify-request": {
                    var httpChannel = subject.QueryInterface(Components.interfaces.nsIHttpChannel);
                    if (httpChannel.URI.host.match(/ap\.teesoft\.info/))
                    {
                        httpChannel.setRequestHeader("X-AutoPager-Rules", this.pref.getCharPref(".ids"), false);
                        httpChannel.setRequestHeader("X-AutoPager", autopagerHTTPListener.autopagerVersionValue, false);
                    }

                    if (this.pref.prefHasUserValue(".httphead." + httpChannel.URI.host))
                    {
                        if (!this.pref.getBoolPref(".httphead." + httpChannel.URI.host))
                        {
                            return;
                        }

                    }else
                    {
                        if (!this.pref.getBoolPref(".set-x-autopager-httphead"))
                        {
                            return;
                        }
                    }
                    this.LOG("----------------------------> (" + subject + ") mod request");

                    httpChannel.setRequestHeader(autopagerHTTPListener.headerName, autopagerHTTPListener.autopagerVersionValue, false);
                    var agent = httpChannel.getRequestHeader("User-Agent") + " AutoPager/" + autopagerHTTPListener.autopagerVersionValue;
                    httpChannel.setRequestHeader("User-Agent", agent, false);
                    break;
                }
            case "app-startup": {
                    os.addObserver(obj, "http-on-modify-request", false);
                    os.addObserver(obj, "profile-after-change", true);
                    break;
                }
            case "profile-after-change": {
                    os.addObserver(obj, "quit-application", true);
                    if (typeof Components.interfaces.nsIContentPolicy.TYPE_MEDIA != "undefined")
                    {
                        let registrar = Components.manager.QueryInterface(Components.interfaces.nsIComponentRegistrar);
                        let PolicyPrivate = this.getPolicyPrivate();
                        try
                        {
                            registrar.registerFactory(PolicyPrivate.classID, PolicyPrivate.classDescription, PolicyPrivate.contractID, PolicyPrivate);
                        }
                        catch (e)
                        {
                            // Don't stop on errors - the factory might already be registered
                            this.LOG(e);
                        }

                        let catMan = Components.classes["@mozilla.org/categorymanager;1"]
                        .getService(Components.interfaces.nsICategoryManager);

                        for each (let category in PolicyPrivate.xpcom_categories)
                            catMan.addCategoryEntry(category, PolicyPrivate.classDescription, PolicyPrivate.contractID, false, true);
                    }
                break;
                }
            case "quit-application":{
                    os.removeObserver(obj, "quit-application");
                    try{
                        os.removeObserver(obj, "profile-after-change");
                    }catch(e) {}
                    break;
                }
        }
    },
    get pref(){
        let pf = Components.classes["@mozilla.org/preferences-service;1"].
            getService(Components.interfaces.nsIPrefService).getBranch("extensions.autopager");
        this.__defineGetter__("pref", function() pf);
        return this.pref;
    } ,
    getPolicyPrivate : function ()
    {
        /**
         * Private nsIContentPolicy implementation to disable video and audio elements in AutoPagerHiddenBrowser
         * @class
         */
        var PolicyPrivate =
            {
            classDescription: "AutoPager content policy",
            classID: Components.ID("{af3f547f-d79b-b14a-a300-3a48de76a3d0}"),
            contractID: "@teesoft.info/autopager/policy;1",
            xpcom_categories: ["content-policy"],

            //
            // nsISupports interface implementation
            //

            QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIContentPolicy,
                    Components.interfaces.nsIFactory, Components.interfaces.nsISupportsWeakReference]),

            //
            // nsIContentPolicy interface implementation
            //

            shouldLoad: function(contentType, contentLocation, requestOrigin, node, mimeTypeGuess, extra)
            {
                // Ignore requests without context and top-level documents
                if (!node || contentType != Components.interfaces.nsIContentPolicy.TYPE_MEDIA)
                    return Components.interfaces.nsIContentPolicy.ACCEPT;

                let wnd = PolicyPrivate.getWindow(node);
                //reject video and audio elements on the AutoPagerHiddenBrowser
                if (wnd && typeof wnd.AutoPagerHiddenBrowser != "undefined")
                {
                    return Components.interfaces.nsIContentPolicy.REJECT_REQUEST;;
                }
                return Components.interfaces.nsIContentPolicy.ACCEPT;
            },
            shouldProcess: function(contentType, contentLocation, requestOrigin, insecNode, mimeType, extra)
            {
                return Components.interfaces.nsIContentPolicy.ACCEPT;
            },

            //
            // nsIFactory interface implementation
            //
            createInstance: function(outer, iid)
            {
                if (outer)
                    throw Components.results.NS_ERROR_NO_AGGREGATION;
                return this.QueryInterface(iid);
            }
            ,
            /**
             * Retrieves the window for a document node.
             * @return {Window} will be null if the node isn't associated with a window
             */
            getWindow: function(/**Node*/ node)
            {
                if ("ownerDocument" in node && node.ownerDocument)
                    node = node.ownerDocument;

                if ("defaultView" in node)
                    return node.defaultView;

                return null;
            }
        };
        return PolicyPrivate;
    },
    LOG : function (text)
    {
        if (this.pref.getBoolPref(".debug"))
        {
            var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
            consoleService.logStringMessage(text);
        }
    }
    ,
    dumpObject : function (obj,level)
    {
        if(obj == null || typeof obj != 'object' || level>10)
            return obj;
        var temp = "[";

        for(var key in obj)
        {
            if (temp.length>1)
                temp+=",";
            try{
                temp += key + "=" + this.dumpObject(obj[key],level+1);
            }catch(e){
                temp += key + "=<unable to access>";
            }
        }
        return temp+"]";
    }
}

// class definition
AutopagerCOMP.prototype = {
    
    allSiteSetting: [],
    updateSites: [],
    siteConfirms : [],
    discoverdUrls : [],
    publishingSite : [],
    // define the function we want to expose in our interface
    loadAll: function() {
        return this.allSiteSetting;
    },
    setAll: function(settings) {
        this.allSiteSetting = settings;
    },

    getUpdateSites : function() {
        return this.updateSites;
    },
    setUpdateSites : function(sites) {
        this.updateSites = sites;
    },
    getSiteConfirms : function() {
        return this.siteConfirms;
    },
    setSiteConfirms : function(sites) {
        this.siteConfirms = sites;
    },
    getDiscoveredUrls : function()
    {
        return this.discoverdUrls;
    },
    getPublishingSite : function ()
    {
        return this.publishingSite;
    },
    setPublishingSite : function (publishingSite)
    {
        this.publishingSite = publishingSite;
    }
    ,existingPatterns : null
    ,getPatterns : function() {
        return this.existingPatterns;
    }
    ,setPatterns : function(patterns) {
        this.existingPatterns = patterns;
    },
    // this must match whatever is in chrome.manifest!
    classDescription:   "AutopagerCOMP Javascript XPCOM Component",
    contractID: "@www.teesoft.com/AutopagerCOMP;1",
    classID: Components.ID("{93AFF2EE-79AA-11DD-8660-026156D89593}"),
    _xpcom_categories: [{ category: "app-startup", service: true }],

    QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIObserver, Components.interfaces.nsISupportsWeakReference]),
    observe: function(subject, topic, data)
    {
        autopagerHTTPListener.observe(this,subject, topic, data);
    }
};

if (XPCOMUtils.generateNSGetFactory)
    const NSGetFactory = XPCOMUtils.generateNSGetFactory([AutopagerCOMP]);
else
    const NSGetModule = XPCOMUtils.generateNSGetModule([AutopagerCOMP]);
