var autopagerJsonSetting= {
    onJsonLoad :function(doc,updatesite)
    {
        return autopagerJsonSetting.loadCompactFromString(doc);
    },
    loadCompactFromString : function (str)
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
        //alert(info)
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
