/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
const autopagerPref =
{
  autopagerPrefs : Components.classes["@mozilla.org/preferences-service;1"].
        getService(Components.interfaces.nsIPrefService).getBranch("autopager")
        .QueryInterface(Components.interfaces.nsIPrefBranch2),
        
    unicodeConverter: Components
      .classes["@mozilla.org/intl/scriptableunicodeconverter"]
      .createInstance(Components.interfaces.nsIScriptableUnicodeConverter),
      
init : function()
{
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
        savePref(name,value);
    }	  	
},
loadPref : function(name) {
    try{
        
        return this.autopagerPrefs.getCharPref("." +  name); // get a pref
    }catch(e) {
        //alertErr(e);
    }
    return "";
},
getDatePrefs : function(name){
   var date = new Date();
   try{        
        var timestamp = this.autopagerPrefs.getCharPref("." +  name); // get a pref
          date.setTime(timestamp);
    }catch(e) {
        //alertErr(e);
    }     
    return date;
},
setDatePrefs : function(name,date){
   try{
        
        this.autopagerPrefs.setCharPref("." +  name,date.getTime()); // get a pref
    }catch(e) {
        //alertErr(e);
    }     
},

loadBoolPref : function(name) {
    try{
        
        return this.autopagerPrefs.getBoolPref("." +  name); // get a pref
    }catch(e) {
        //alertErr(e);
    }
    return "";
},
savePref : function(name,value) {
    try{
        
        return this.autopagerPrefs.setCharPref("." +  name,value); // set a pref
    }catch(e) {
        //alertErr(e);
    }
    return "";
},
saveBoolPref : function(name,value) {
    try{
        
        return this.autopagerPrefs.setBoolPref("." +  name,value); // get a pref
    }catch(e) {
        //alertErr(e);
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
        //alertErr(e);
    }
    return "";
},
  showMyName : function(){
    try{
        var myname = document.getElementById("autopager-myname");
        myname.label = autopagerFormatString("myname" ,[this.loadMyName()]);
    }catch(e) {
        
    }
},
 changeMyName : function() {
    var name = prompt(autopagerGetString("inputname"),this.loadMyName());
    if (name!=null && name.length>0) {
        this.saveMyName(name);
        this.showMyName();
    }
    return name;
}   
}
autopagerPref.init();