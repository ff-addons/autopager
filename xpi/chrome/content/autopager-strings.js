var autopagerStrings = function (filename)
{
    // Help box hasn't been filled yet, need to do it now
    var stringService = Components.classes["@mozilla.org/intl/stringbundle;1"]
    .getService(Components.interfaces.nsIStringBundleService);
    this.strings = stringService.createBundle("chrome://autopager/locale/" + filename + ".properties");
}

autopagerStrings.prototype.getString = function (name)
{

    try{
        if (this.strings != null)
            return this.strings.GetStringFromName(name);
    }catch(e)
    {
    }
    return name;
}

autopagerStrings.prototype.getFormattedString = function(name,params)
{
    try{
        if (this.strings != null)
            return this.strings.formatStringFromName(name,params,params.length);
    }catch(e)
    {
    }
    return this.getString(name);
}
