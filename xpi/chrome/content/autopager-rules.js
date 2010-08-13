var autopagerRules =
{
    AutopagerCOMP:null,
    ignoresites : null,
    ignoreRegex : null,
    getAutopagerCOMP : function ()
    {
        if (this.AutopagerCOMP == null)
        {
            // this is needed to generally allow usage of components in javascript
            //netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
            this.AutopagerCOMP = Components.classes['@www.teesoft.com/AutopagerCOMP;1'].getService().wrappedJSObject;
        }
        return this.AutopagerCOMP;
    },
    getNextMatchedSiteConfig: function(url,pos,matchCallBack)
    {
        if (!autopagerUtils.equals(autopagerPref.loadPref("ignoresites"),this.ignoresites))
        {
            this.ignoresites = autopagerPref.loadPref("ignoresites");
            this.ignoreRegex = autopagerUtils.newRegExp(this.ignoresites)
        }
        if (this.ignoreRegex && this.ignoreRegex.test(url))
        {
            matchCallBack(null);
            return null;
        }
        
        if (url.length>256) //truncate the url
            url = url.substring(0,256);
//        autopagerBwUtil.consoleLog("Process " + url)
        var allSites=autopagerMain.workingAllSites
        for (var key in allSites){
            //alert(key)
            var tmpsites = allSites[key];
            if (tmpsites==null || !tmpsites.updateSite.enabled)
                continue;

            for (var i = 0; i < tmpsites.length; i++) {
            {
                var site = tmpsites[i];
                var pattern = autopagerUtils.getRegExp(site);
                if (pattern.test(url)) {
                    var newSite = autopagerConfig.cloneSite (site);
                    newSite.updateSite = tmpsites.updateSite;
                    pos = new Array();
                    pos.key = key;
                    pos.index = i;
                    pos.site=newSite;
                    if (matchCallBack(pos))
                    {
                        return pos;
                    }
                }
            }
            }
        }
        matchCallBack(null);
        return null;
    },
    discoverRule: function(url,matchCallBack)
    {
        if (autopagerPref.loadBoolPref("with-lite-discovery"))
        {
            if (autopagerPref.loadBoolPref("lite-discovery-prompted"))
            {
                this.doDiscoverRule(url,matchCallBack);
            }
            else
                autopagerLite.promptLiteDiscovery();
        }
        else
            matchCallBack(null);
    }
    ,
    doDiscoverRule: function(url,matchCallBack)
    {
        if (!autopagerMain.getGlobalEnabled())
            return null;
        var patterns = this.getAutopagerCOMP().getPatterns();
        if (patterns)
        {
            for(var i=0;i<patterns.length;i++)
            {
                var pattern = patterns[i];
                var p = autopagerUtils.getRegExp2(pattern);
                if (p.test(url)) {
                    matchCallBack(pattern);
                    return p;
                }
            }
        }
        matchCallBack(null);
        return null;
    }
    ,
    getPublishingSite : function ()
    {
        return this.getAutopagerCOMP().getPublishingSite();
    },
    setPublishingSite : function (publishingSite)
    {
        this.getAutopagerCOMP().setPublishingSite(publishingSite);
    }
    ,
    isAllowUpdate : function()
    {
        return true;
    }
}
