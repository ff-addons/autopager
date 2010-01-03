var autopagerRules =
{
    AutopagerCOMP:null,
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
        var posNew= autopagerRules.doGetNextMatchedSiteConfig(autopagerMain.workingAllSites,url,pos);
        if (!matchCallBack(posNew) && posNew!=null)
        {
            autopagerRules.getNextMatchedSiteConfig(url,posNew,matchCallBack)
        }
    },
    doGetNextMatchedSiteConfig: function(allSites,url,pos)
    {
        var key;
        var fileStarted = (pos ==="" || pos ==null || pos.key==null || pos.index==null);
        var firstCall = fileStarted
        //var lineStarted = (pos =="" || pos ==null || pos.key==null || pos.index==null);
        for ( key in allSites){
            //alert(key)
            var tmpsites = allSites[key];
            if (tmpsites==null || !tmpsites.updateSite.enabled)
                continue;
            if (!fileStarted)
                fileStarted = ((key == pos.key));
            if (!fileStarted)
                continue;
            var start = 0;
            if (!firstCall && key == pos.key)
                start = pos.index +1
            //alert(key + ":" +firstCall + ":" + start + ":" + (!firstCall && key == pos.key))
            for (var i = start; i < tmpsites.length; i++) {
//                if (!started)
//                    started = ((key == pos.key) && i>=pos.index);
//                else
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
                        return pos;
                    }
                }
            }
        }
        return null;

    },
        getPublishingSite : function ()
        {
          return this.getAutopagerCOMP().getPublishingSite();
        },
        setPublishingSite : function (publishingSite)
        {
          this.getAutopagerCOMP().setPublishingSite(publishingSite);
        }
    ,isAllowUpdate : function()
    {
        return true;
    }
}
