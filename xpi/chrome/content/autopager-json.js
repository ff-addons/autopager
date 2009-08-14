var autopagerJsonSetting= {
    onJsonLoad :function(doc,updatesite)
    {
        return autopagerJsonSetting.loadCompactFromString(doc);
    },
    loadCompactFromString : function (str)
    {
        var info = autopagerJsonSetting.decodeJSON(str);
        var sites = new Array();
        for(var i=0;i<info.length;i++){
            var site = info[i]

            var newSite = autopagerJsonSetting.compactToNormal(site);
//            alert(newSite)
            newSite.oldSite = null;
            sites.push(newSite);
        }

        return sites;
    },
    decodeJSON : function (str)
    {
        var info = null;
        //try native json first

        var Ci = Components.interfaces;
        var Cc = Components.classes;

        if (Cc["@mozilla.org/dom/json;1"])
        {
            var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
            info = nativeJSON.decode(str);
        }
        else
            info = autopagerJSON.parse(str);
        return info;
    },

    saveCompactToString : function (sites)
    {
        var str = null;
        //try native json first

        var Ci = Components.interfaces;
        var Cc = Components.classes;

        if (Cc["@mozilla.org/dom/json;1"])
        {
            var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
            str = nativeJSON.encode(sites);
        }
        else
            str = autopagerJSON.stringify(sites);
        return str;
    },
    saveNormalToCompactString : function (normalSites)
    {
        var str = null;
        var sites = new Array();
        for(var i=0;i<normalSites.length;i++){
            var site = normalSites[i]

            var newSite = autopagerJsonSetting.normalToCompact(site);
            sites.push(newSite);
        }

        str = autopagerJsonSetting.saveCompactToString(sites);

        return str;
    },
    saveOverrideToCompactString : function (normalSites)
    {
        var str = null;
        var overrides = new Array();
        for(var i=0;i<normalSites.length;i++){
            var site = normalSites[i]
            if (site.changedByYou)
            {
                var override = autopagerJsonSetting.overrideToCompact(site);
                if (override!=null)
                    overrides.push(override);
            }
        }

        str = autopagerJsonSetting.saveCompactToString(overrides);

        return str;
    },
    mergeOverrides : function (normalSites,overrides)
    {
        for(var o=0;o<overrides.length;o++)
        {
            var override = overrides[o]

            for(var i=0;i<normalSites.length;i++){
                var site = normalSites[i]
                if (site.guid == override.g)
                {
                    autopagerJsonSetting.mergeOverrideToNormal(site,override);
                }
            }
        }
    },
    trim : function (str) {
        return str.replace(/^\s*/, "").replace(/\s*$/, "");
    },
    compactToNormal : function(site)
    {
            var newSite = new Site();
            newSite.urlPattern  = site.u;
            newSite.guid  = site.g;
            if (typeof site.r != 'undefined')
                newSite.isRegex  = site.r;
            
            if (typeof site.e != 'undefined')
                newSite.enabled  = site.e;

            if (typeof site.j != 'undefined')
                newSite.enableJS  = site.j;
            
            if (typeof site.x == 'undefined')
            {}
            else if (typeof site.x == 'string')
            {
                if (this.trim(site.x).length>0)
                newSite.contentXPath.push(this.trim(site.x));
            }
            else
            {
                for(var i=0;i<site.x.length;i++)
                {
                    newSite.contentXPath.push(site.x[i]);
                }
            }

            newSite.linkXPath = site.n;
            if (typeof site.d != 'undefined')
                newSite.desc = site.d;

            if (typeof site.m != 'undefined')
                newSite.margin  = site.m;

            if (typeof site.q != 'undefined')
                newSite.quickLoad  = site.q;
            else
                newSite.quickLoad = false;
            
            if (typeof site.f != 'undefined')
                newSite.fixOverflow  = site.f;

            if (typeof site.c != 'undefined')
                newSite.createdByYou  = site.c;

            if (typeof site.u != 'undefined')
                newSite.changedByYou  = site.y;

            if (typeof site.o != 'undefined')
                newSite.owner  = site.o;

            if (typeof site.t != 'undefined')
                newSite.testLink.push(site.t);
            if (typeof site.h != 'undefined')
                newSite.containerXPath=site.h;

            if (typeof site.l != 'undefined')
            {
                if (typeof site.l == 'string')
                    newSite.removeXPath.push(site.l);
                else
                {
                    for(var i=0;i<site.l.length;i++)
                    {
                        newSite.removeXPath.push(site.l[i]);
                    }
                }
            }
            if (typeof site.a != 'undefined')
                newSite.ajax=site.a;
            if (typeof site.w != 'undefined')
                newSite.needMouseDown = site.w;
            
            if (typeof site.p != 'undefined')
                newSite.published = site.p;
            if (typeof site.i != 'undefined')
                newSite.minipages = site.i;
            if (typeof site.s != 'undefined')
                newSite.delaymsecs = site.s;

            if (typeof site.v != 'undefined')
                newSite.formatVersion = site.v;

            return newSite;
    },
    mergeOverrideToNormal : function(normalSite,site)
    {
        if (normalSite.guid  != site.g)
            return;
        normalSite.oldSite = autopagerConfig.cloneSite(normalSite);

            if (typeof site.u != 'undefined')
                normalSite.urlPattern  = site.u;
            //normalSite.guid  = site.g;
            if (typeof site.r != 'undefined')
                normalSite.isRegex  = site.r;

            if (typeof site.e != 'undefined')
                normalSite.enabled  = site.e;

            if (typeof site.j != 'undefined')
                normalSite.enableJS  = site.j;

            if (typeof site.x != 'undefined')
            {
                normalSite.contentXPath = [];
                if (typeof site.x == 'string')
                {
                    if (this.trim(site.x).length>0)
                    normalSite.contentXPath.push(this.trim(site.x));
                }
                else
                {
                    for(var i=0;i<site.x.length;i++)
                    {
                        normalSite.contentXPath.push(site.x[i]);
                    }
                }
           }

            if (typeof site.n != 'undefined')
                normalSite.linkXPath = site.n;
            if (typeof site.d != 'undefined')
                normalSite.desc = site.d;

            if (typeof site.m != 'undefined')
                normalSite.margin  = site.m;

            if (typeof site.q != 'undefined')
                normalSite.quickLoad  = site.q;

            if (typeof site.f != 'undefined')
                normalSite.fixOverflow  = site.f;

//            if (typeof site.c != 'undefined')
//                normalSite.createdByYou  = site.c;

//            if (typeof site.u != 'undefined')
            normalSite.changedByYou  = true;

            if (typeof site.o != 'undefined')
                normalSite.owner  = site.o;

            if (typeof site.t != 'undefined')
                normalSite.testLink.push(site.t);
            if (typeof site.h != 'undefined')
                normalSite.containerXPath=site.h;

            if (typeof site.l != 'undefined')
            {
                normalSite.removeXPath = [];
                if (typeof site.l == 'string')
                    normalSite.removeXPath.push(site.l);
                else
                {
                    for(var i=0;i<site.l.length;i++)
                    {
                        normalSite.removeXPath.push(site.l[i]);
                    }
                }
            }
            if (typeof site.a != 'undefined')
                normalSite.ajax=site.a;
            if (typeof site.w != 'undefined')
                normalSite.needMouseDown = site.w;

            if (typeof site.p != 'undefined')
                normalSite.published = site.p;
            if (typeof site.i != 'undefined')
                normalSite.minipages = site.i;
            if (typeof site.s != 'undefined')
                normalSite.delaymsecs = site.s;

            if (typeof site.v != 'undefined')
                normalSite.formatVersion = site.v;

    },

    arrayEqual : function (a1, a2)
    {
        if (a1.length!=a2.length)
            return false;
        for(var i=0;i<a1.length;++i)
	{
            if (a1[i] != a2[i])
		return false;
	}
        return true;
    },
    overrideToCompact : function(normal)
    {
            var override = new Object();
            override.g = normal.guid;
            var oldSite = normal.oldSite
            if (oldSite==null)
                return null;
            if (normal.urlPattern!=oldSite.urlPattern)
                override.u = normal.urlPattern;

            if (normal.isRegex != oldSite.isRegex)
                override.r = normal.isRegex;
            if (normal.margin != oldSite.margin)
                override.m = normal.margin;
            if (normal.enabled != oldSite.enabled)
              override.e = normal.enabled;

            if (normal.enableJS != oldSite.enableJS)
                override.j = normal.enableJS;
            if (normal.quickLoad != oldSite.quickLoad)
                override.q = normal.quickLoad;
            if (normal.fixOverflow != oldSite.fixOverflow)
                override.f = normal.fixOverflow;

//            if (normal.createdByYou != oldSite.createdByYou)
//                override.c = normal.createdByYou;

//            if (normal.changedByYou != oldSite.changedByYou)
//                override.y = normal.changedByYou;

//            override.o = normal.owner;

            if (!autopagerJsonSetting.arrayEqual(normal.contentXPath,oldSite.contentXPath))
            {
                if (normal.contentXPath.length==1)
                    override.x = normal.contentXPath[0];
                else
                    override.x = normal.contentXPath;
            }
            if (normal.linkXPath != oldSite.linkXPath)
                override.n = normal.linkXPath;

            if (normal.desc != oldSite.desc)
                if (typeof normal.desc != 'undefined' && normal.desc!=null && normal.desc.length>0)
                    override.d = normal.desc;

            if (normal.testLink != oldSite.testLink)
            if (normal.testLink.length>0)
                override.t = normal.testLink[0];

            if (normal.containerXPath != oldSite.containerXPath)
            if (normal.containerXPath!=null && normal.containerXPath.length>0)
                override.h = normal.containerXPath;

            if (!autopagerJsonSetting.arrayEqual(normal.removeXPath,oldSite.removeXPath))
            {
                if (normal.removeXPath.length==1)
                    override.l = normal.removeXPath[0];
                else if (normal.removeXPath.length>1)
                    override.l = normal.removeXPath;
            }

            if (normal.ajax != oldSite.ajax)
                override.a = normal.ajax;
            if (normal.needMouseDown != oldSite.needMouseDown)
                 override.w = normal.needMouseDown;

//            if (normal.published != oldSite.published)
//                 override.p = normal.published;
            if (normal.minipages != oldSite.minipages)
                 override.i = normal.minipages;
            if (normal.delaymsecs != oldSite.delaymsecs)
                override.s = normal.delaymsecs;
            var count=0;
            for(var key in override)
            {
                count ++;
            }
            //not only g : guid
            if (count>1)
                return override;
            return null;
    },
    normalToCompact : function(normal)
    {
            var site = new Object();
            site.u = normal.urlPattern;
            site.g = normal.guid;
            if (normal.isRegex)
                site.r = normal.isRegex;
            if (normal.margin != autopagerMain.getDefaultMargin())
                site.m = normal.margin;
            if (!normal.enabled)
              site.e = normal.enabled;

            if (normal.enableJS)
                site.j = normal.enableJS;
            if (normal.quickLoad)
                site.q = normal.quickLoad;
            if (normal.fixOverflow)
                site.f = normal.fixOverflow;
            
            if (normal.createdByYou)
                site.c = normal.createdByYou;

            if (normal.changedByYou)
                site.y = normal.changedByYou;

            site.o = normal.owner;
            if (normal.contentXPath.length==1)
                site.x = normal.contentXPath[0];
            else
                site.x = normal.contentXPath;

            site.n = normal.linkXPath;
            if (typeof normal.desc != 'undefined' && normal.desc!=null && normal.desc.length>0)
                site.d = normal.desc;
            if (normal.testLink.length>0)
                site.t = normal.testLink[0];
            if (normal.containerXPath!=null && normal.containerXPath.length>0)
                site.h = normal.containerXPath;

            if (normal.removeXPath.length==1)
                site.l = normal.removeXPath[0];
            else if (normal.removeXPath.length>1)
                site.l = normal.removeXPath;

            if (normal.ajax)
                site.a = normal.ajax;
            if (normal.needMouseDown)
                 site.w = normal.needMouseDown;
            
            if (normal.published)
                 site.p = normal.published;
            if (normal.minipages >=0)
                 site.i = normal.minipages;
            if (normal.delaymsecs>=0)
                site.s = normal.delaymsecs;
            if (typeof normal.formatVersion != 'undefined')
                site.v = normal.formatVersion;
            return site;
    },
    parse : function (str)
    {
        var info = null;
        //try native json first

        var Ci = Components.interfaces;
        var Cc = Components.classes;

        if (Cc["@mozilla.org/dom/json;1"])
        {
            var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
            info = nativeJSON.decode(str);
        }
        else
            info = autopagerJSON.parse(str);
        return info;
    }
}
