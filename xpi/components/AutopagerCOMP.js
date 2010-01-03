/***********************************************************
constants
***********************************************************/

// reference to the interface defined in nsIAutopagerCOMP.idl
const nsIAutopagerCOMP = Components.interfaces.nsIAutopagerCOMP;

// reference to the required base interface that all components must support
const nsISupports = Components.interfaces.nsISupports;

const CLASS_ID = Components.ID("{93AFF2EE-79AA-11DD-8660-026156D89593}");

// description
const CLASS_NAME = "AutopagerCOMP Javascript XPCOM Component";

// textual unique identifier
const CONTRACT_ID = "@www.teesoft.com/AutopagerCOMP;1";

/***********************************************************
class definition
***********************************************************/

//class constructor
function AutopagerCOMP() {
        // If you only need to access your component from Javascript, uncomment the following line:
    this.wrappedJSObject = this;
};

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
        },

        QueryInterface: function(aIID)
        {
                if (!aIID.equals(nsIAutopagerCOMP) &&
                        !aIID.equals(nsISupports))
                        throw Components.results.NS_ERROR_NO_INTERFACE;
                return this;
        }
};


/***********************************************************
class factory

This object is a member of the global-scope Components.classes.
It is keyed off of the contract ID. Eg:

myAutopagerCOMP = Components.classes["'@www.teesoft.com/AutopagerCOMP;1"].
                          createInstance(Components.interfaces.nsIAutopagerCOMP);

***********************************************************/
var AutopagerCOMPFactory = {
        createInstance: function (aOuter, aIID)
        {
                if (aOuter != null)
                        throw Components.results.NS_ERROR_NO_AGGREGATION;
                return (new AutopagerCOMP()).QueryInterface(aIID);
        }
};

/***********************************************************
module definition (xpcom registration)
***********************************************************/
var AutopagerCOMPModule = {
        registerSelf: function(aCompMgr, aFileSpec, aLocation, aType)
        {
                aCompMgr = aCompMgr.
                QueryInterface(Components.interfaces.nsIComponentRegistrar);
                aCompMgr.registerFactoryLocation(CLASS_ID, CLASS_NAME,
                        CONTRACT_ID, aFileSpec, aLocation, aType);
        },

        unregisterSelf: function(aCompMgr, aLocation, aType)
        {
                aCompMgr = aCompMgr.
                QueryInterface(Components.interfaces.nsIComponentRegistrar);
                aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);
        },

        getClassObject: function(aCompMgr, aCID, aIID)
        {
                if (!aIID.equals(Components.interfaces.nsIFactory))
                        throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

                if (aCID.equals(CLASS_ID))
                        return AutopagerCOMPFactory;

                throw Components.results.NS_ERROR_NO_INTERFACE;
        },

        canUnload: function(aCompMgr) {
                return true;
        }
};

/***********************************************************
module initialization

When the application registers the component, this function
is called.
***********************************************************/
function NSGetModule(aCompMgr, aFileSpec) { 
        return AutopagerCOMPModule;
}

