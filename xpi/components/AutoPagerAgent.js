var headerName  = "X-AutoPager";
var headerValue = "0.6.0.8";



function autopagerHTTPListener() { }

autopagerHTTPListener.prototype = {
    pref: Components.classes["@mozilla.org/preferences-service;1"].
        getService(Components.interfaces.nsIPrefService).getBranch("autopager"),
    LOG : function (text)
    {
        if (this.pref.getBoolPref(".debug"))
        {
            var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
            consoleService.logStringMessage(text);
        }
    },
  observe: function(subject, topic, data)
  {
      if (topic == "http-on-modify-request") {
          var httpChannel = subject.QueryInterface(Components.interfaces.nsIHttpChannel);
          if (httpChannel.URI.host.match(/ap\.teesoft\.info/))
          {
            httpChannel.setRequestHeader("X-AutoPager-Rules", this.pref.getCharPref(".ids"), false);
            httpChannel.setRequestHeader("X-AutoPager", "0.6.0.8", false);

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

          httpChannel.setRequestHeader(headerName, headerValue, false);
          var agent = httpChannel.getRequestHeader("User-Agent") + " AutoPager/0.6.0.8";
          httpChannel.setRequestHeader("User-Agent", agent, false);
          return;
      }


      if (topic == "app-startup") {

          this.LOG("----------------------------> app-startup");

          var os = Components.classes["@mozilla.org/observer-service;1"]
                             .getService(Components.interfaces.nsIObserverService);

          os.addObserver(this, "http-on-modify-request", false);
          return;
      }
  },

  QueryInterface: function (iid) {
        if (iid.equals(Components.interfaces.nsIObserver) ||
            iid.equals(Components.interfaces.nsISupports))
            return this;

        Components.returnCode = Components.results.NS_ERROR_NO_INTERFACE;
        return null;
    },
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
    },
};

var autopagerAgentModule = {
    registerSelf: function (compMgr, fileSpec, location, type) {

        var compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
        compMgr.registerFactoryLocation(this.myCID,
                                        this.myName,
                                        this.myProgID,
                                        fileSpec,
                                        location,
                                        type);


        var catMgr = Components.classes["@mozilla.org/categorymanager;1"].getService(Components.interfaces.nsICategoryManager);
        catMgr.addCategoryEntry("app-startup", this.myName, this.myProgID, true, true);
    },


    getClassObject: function (compMgr, cid, iid) {
        return this.myFactory;
    },

    myCID: Components.ID("{9cf5f3df-2505-42dd-9094-c1631bd1be1c}"),

    myProgID: "@autopager.teesoft.info/autopagerHTTPListener;1",

    myName:   "AutoPager Agent Modify HTTP Listener",

    myFactory: {
        QueryInterface: function (aIID) {
            if (!aIID.equals(Components.interfaces.nsISupports) &&
                !aIID.equals(Components.interfaces.nsIFactory))
                throw Components.results.NS_ERROR_NO_INTERFACE;
            return this;
        },

        createInstance: function (outer, iid) {
          return new autopagerHTTPListener();
        }
    },

    canUnload: function(compMgr) {
        return true;
    }
};

function NSGetModule(compMgr, fileSpec) {
    return autopagerAgentModule;
}
