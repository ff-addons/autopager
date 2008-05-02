function AutoPagerUpdateType(type,defaultLocales,defaultUrl,contentType,filenamePrefix,callback,xpath,desc)
{
    this.type=type;
    this.defaultLocales = defaultLocales;
    this.defaultUrl=defaultUrl;
    this.contentType = contentType;
    this.filenamePrefix = filenamePrefix;
    this.callback = callback;
    this.xpath = xpath;
    this.desc=desc;
};

var AutoPagerUpdateTypes = 
    {
    types : null,
    init : function (){
        if (this.types == null)
        {
            this.types =  new Array();

            this.types.push(new AutoPagerUpdateType("autopagerize","all",
            "http://swdyh.infogami.com/autopagerize","text/html; charset=utf-8",
            "autopagerize-",AutoPagerize.onload,'//*[@class="autopagerize_data"]',"autopagerize configurations"));

            this.types.push(new AutoPagerUpdateType("autopager-freetext","all",
            "http://blogs.sun.com/wind/entry/autopager_site_config#comments",
            "text/html; charset=utf-8",
            "autofree-",blogConfigCallback,"//div[@class='comment even' or @class='comment odd']","configurations in web pages"));
          
            this.types.push(new AutoPagerUpdateType("autopager-xml","all",
            "http://autopager.mozdev.org/conf.d/autopager.xml",
            "text/xml; charset=utf-8",
            "autopagerMozdev.xml",xmlConfigCallback,"//site",
            "default configurations on autopager.mozdev.org"));
        }
    },
    getType : function (name)
    {
        for(var i in this.types)
        {
            if (this.types[i].type == name)
            {
                return this.types[i];
            }
        }
        return null;
    },
    loadAllSites : function ()
    {
        
        var configContents="";
        try{
            configContents= getContents(getConfigFileURI("all-sites.xml"));
            var doc = autopagerDomParser.parseFromString(configContents, "text/xml");
                      
            var sites= null;
            sites = this.loadSitesFromDoc(configContents);
                      
            for(var i in sites)
            {
                this.allUpdateSites[sites[i].filename] = sites[i];
            }
                      
        }catch(e)
        {
            //alert(e);
        }            
        
    },
        
    /*
function UpdateSite(owner,locales,url,type,desc,filename,callback)
{
    this.owner = owner;
    this.locales=locales;
    this.url=url;
    this.type=type;
    this.desc=desc;
    this.filename = filename;
    this.callback = callback;
    this.triedTime=0;
    this.updateType = null;
    this.enabled = true;
    this.xpath = "//site";
}
     */
    loadSitesFromDoc : function (doc)
    {
        var sites = new Array();
    
        var nodes = doc.evaluate("//update-site", doc, null, 0, null);
        if (nodes == null)
            return sites;
        var hasQuickLoad = false;
        for (var node = null; (node = nodes.iterateNext()); ) {
            var site = new Site();

            var childNodes = node.childNodes;
            //childNode = childNodes[i]
            for (var i = 0, childNode = null; (childNode = childNodes[i]) ; i++) {
                var nodeName = childNode.nodeName;
                if (nodeName == "urlPattern") {
                    site.urlPattern = getValue(childNode);
                }else  if (nodeName == "guid") {
                    site.guid = getValue(childNode);
                }else if (nodeName == "urlIsRegex") {
                    site.isRegex	= (getValue(childNode) == 'true');
                }
                else if (nodeName == "margin") {
                    var val = getValue(childNode);
                    if (isNumeric(val))
                        site.margin = val;
                }
                else if (nodeName == "desc") {
                    site.desc	= getValue(childNode);
                }
                else if (nodeName == "linkXPath") {
                    site.linkXPath	= getValue(childNode);
                }
                else if (nodeName == "contentXPath") {
                    site.contentXPath.push(getValue(childNode));
                }
                else if (nodeName == "enabled") {
                    site.enabled	= (getValue(childNode) == 'true');
                }
                else if (nodeName == "enableJS") {
                    site.enableJS	= (getValue(childNode) == 'true');
                    //alert(site.enableJS + " " + childNode.firstChild.nodeValue);
                }
                else if (nodeName == "quickLoad") {
                    site.quickLoad	= (getValue(childNode) == 'true');
                    hasQuickLoad = true;
                }
                else if (nodeName == "fixOverflow") {
                    site.fixOverflow	= (getValue(childNode) == 'true');
                    //alert(site.fixOverflow + " " + childNode.firstChild.nodeValue);
                }
                else if (nodeName == "createdByYou") {
                    site.createdByYou	= (getValue(childNode) == 'true');
                }
                else if (nodeName == "changedByYou") {
                    site.changedByYou	= (getValue(childNode) == 'true');
                }else if (nodeName == "owner") {
                    site.owner	= getValue(childNode) ;
                }
    
            }
            if (!hasQuickLoad)
                site.quickLoad = false;
            if (site.guid.length == 0 && site.createdByYou)
                site.guid = generateGuid();
            sites.push(site);
        }
        return sites;
        
    }
}