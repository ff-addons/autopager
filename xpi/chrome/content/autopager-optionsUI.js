var autopagerOptionUI = {
    pref : Components.classes["@mozilla.org/preferences-service;1"].
        getService(Components.interfaces.nsIPrefService).getBranch("autopager")
        .QueryInterface(Components.interfaces.nsIPrefBranch2),
    init : function()
    {
        var checks = document.getElementsByTagName("checkbox")
        for(var i=0;i<checks.length;i++)
        {
            if (checks[i].getAttribute("pref"))
            {
                checks[i].setAttribute("checked",this.pref.getBoolPref("." + checks[i].getAttribute("pref")));
            }else if (checks[i].getAttribute("prefV"))
            {
                checks[i].setAttribute("checked",!this.pref.getBoolPref("." + checks[i].getAttribute("prefV")));
            }
        }
        var menus = document.getElementsByTagName("menulist")
        for(var i=0;i<menus.length;i++)
        {
            if (menus[i].getAttribute("pref"))
            {
                menus[i].value=this.pref.getCharPref("." + menus[i].getAttribute("pref"));
            }
        }
    },
    handleHelpButton : function(){
        autopagerMain.showHelp();
    },
    setBoolPref : function (key, v)
    {
        if (this.pref.prefHasUserValue("." + key))
            this.pref.clearUserPref("." + key);
        if (this.pref.getBoolPref("." + key)!=v)
        {
            this.pref.setBoolPref("."+key,v);
        }
    },
    setCharPref : function (key, v)
    {
        if (this.pref.prefHasUserValue("." + key))
            this.pref.clearUserPref("." + key);
        if (this.pref.getCharPref("." + key)!=v)
        {
            this.pref.setCharPref("."+key,v);
        }
    },
    handleOkButton : function()
    {
        var checks = document.getElementsByTagName("checkbox")
        for(var i=0;i<checks.length;i++)
        {
            if (checks[i].getAttribute("pref"))
            {
                this.setBoolPref(checks[i].getAttribute("pref"),checks[i].getAttribute("checked")=='true');
            }else if (checks[i].getAttribute("prefV"))
            {
                this.setBoolPref(checks[i].getAttribute("prefV"),checks[i].getAttribute("checked")!='true');
            }
        }
        var menus = document.getElementsByTagName("menulist")
        for(var i=0;i<menus.length;i++)
        {
            if (menus[i].getAttribute("pref"))
            {
                this.setCharPref(menus[i].getAttribute("pref"),menus[i].getAttribute("value"));
            }
        }
    },
    handleMoreOptionButton : function()
    {
        autopagerConfig.openSetting("");
    }
}