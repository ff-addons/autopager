/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
var autopagerPref =
{
  autopagerPrefs : null,
        
    unicodeConverter: null,
getAutopagerPrefs : function () {
    if (this.autopagerPrefs == null && (typeof Components == 'object')) {
        this.autopagerPrefs = Components.classes["@mozilla.org/preferences-service;1"].
        getService(Components.interfaces.nsIPrefService).getBranch("extensions.autopager")
        .QueryInterface(Components.interfaces.nsIPrefBranch2);
    }
    return this.autopagerPrefs;
},
init : function()
{
    this.unicodeConverter = Components
      .classes["@mozilla.org/intl/scriptableunicodeconverter"]
      .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
  this.unicodeConverter.charset = "utf-8";  
},
loadUTF8Pref : function(name) {
    var str = this.loadPref(name);
    try{
        return this.unicodeConverter.ConvertToUnicode(str);
    }catch(e) {
        return str;
    }	  	
},
saveUTF8Pref : function(name,value) {
    try{
        this.savePref(name,this.unicodeConverter.ConvertFromUnicode(value));
    }catch(e) {
        this.savePref(name,value);
    }	  	
},
loadPref : function(name) {
    try{
            if (name=="last_version")
            {
                //migration preference from autopager.x to extensions.autopager.x
                if ((typeof Components == 'object')) {
                    var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                        getService(Components.interfaces.nsIPrefService).getBranch("autopager.")
                        .QueryInterface(Components.interfaces.nsIPrefBranch2);

                    var obj={}
                    var keys = prefs.getChildList("",obj);
                    for(var i=0;i<keys.length;i++)
                    {
                        var k = keys[i];
                        try{
                            if (this.getAutopagerPrefs().prefHasUserValue("." +k))
                                this.getAutopagerPrefs().clearUserPref("." +k);
                            if (prefs.getPrefType(k)==128)//PREF_BOOL
                            {
                                if (this.getAutopagerPrefs().getBoolPref("." +  k)!=prefs.getBoolPref(k))
                                    this.getAutopagerPrefs().setBoolPref("." +  k,prefs.getBoolPref(k))
                            }else
                            {
                                this.getAutopagerPrefs().setCharPref("." +  k,prefs.getCharPref(k))
                            }
                            prefs.clearUserPref(k)
                        }catch(e){
                        }
                    }
                    
                }
            }
        //if (this.getAutopagerPrefs().prefHasUserValue("." +  name))
        return this.getAutopagerPrefs().getCharPref("." +  name); // get a pref
    }catch(e) {
        //autopagerMain.alertErr(e);
    }
    return "";
},
getDatePrefs : function(name){
   var date = new Date();
   try{        
        var timestamp = this.loadPref( name); // get a pref
          date.setTime(timestamp);
    }catch(e) {
        //autopagerMain.alertErr(e);
    }     
    return date;
},
setDatePrefs : function(name,date){
   try{
       this.savePref(name,date.getTime());
    }catch(e) {
        //autopagerMain.alertErr(e);
    }     
},

loadBoolPref : function(name) {
    try{
        
        return this.getAutopagerPrefs().getBoolPref("." +  name); // get a pref
    }catch(e) {
        //autopagerMain.alertErr(e);
    }
    return false;
},
savePref : function(name,value) {
    try{
        if (this.loadPref(name)!=value)
            return this.getAutopagerPrefs().setCharPref("." +  name,value); // set a pref
//        else if (this.getAutopagerPrefs().prefHasUserValue("." +  name))
//            this.resetPref(name);
    }catch(e) {
        this.getAutopagerPrefs().setCharPref("." +  name,value);
    }
},
saveBoolPref : function(name,value) {
    try{
        if (this.loadBoolPref(name)!=value)
            return this.getAutopagerPrefs().setBoolPref("." +  name,value); // get a pref
//        else if (this.getAutopagerPrefs().prefHasUserValue("." +  name))
//            this.resetPref(name);
    }catch(e) {
        //autopagerMain.alertErr(e);
        return this.getAutopagerPrefs().setBoolPref("." +  name,value);
    }
},
resetPref : function(name,value) {
    try{
        this.getAutopagerPrefs().clearUserPref("." +  name);
    }catch(e) {
        //autopagerMain.alertErr(e);
    }
    return "";
},
 saveMyName : function(myname) {
    this.saveUTF8Pref("myname", myname); // set a pref
},
loadMyName : function() {
    try{
        
        return this.loadUTF8Pref("myname"); // get a pref
    }catch(e) {
        //autopagerMain.alertErr(e);
    }
    return "";
},
 changeMyName : function() {
    var name = prompt(autopagerUtils.autopagerGetString("inputname"),this.loadMyName());
    if (name!=null && name.length>0) {
        this.saveMyName(name);
    }
    return name;
},
resetAll : function()
{
     var obj = [];
    var children = this.getAutopagerPrefs().getChildList(".",obj)
    for(var k=0;k<obj.value;k++)
    {
        try{
            this.getAutopagerPrefs().clearUserPref(children[k]);
        }catch(e){            
        }
    }
}
}
autopagerPref.init();
