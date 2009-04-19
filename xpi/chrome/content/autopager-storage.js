const autopagerStorage =
{
    open : function (filename)
    {
        var file = autopagerConfig.getConfigDir( filename + ".sqlite");

        var storageService = Components.classes["@mozilla.org/storage/service;1"]
                                .getService(Components.interfaces.mozIStorageService);
        var mDBConn = storageService.openDatabase(file); // Will also create the file if it does not exist
        return mDBConn;
    },
    getAll : function (dbConn)
    {
        var statement = dbConn.createStatement("SELECT * FROM autopager_setting order by ap_order");
        var sites = new Array();
        while (statement.executeStep())
        {
            var site = new Site();
            site.urlPattern = statement.row.urlPattern;
            site.guid = statement.row.guid;
            site.urlIsRegex = statement.row.urlIsRegex;
            var val = statement.row.margin;
            if (val>miniMargin)
                site.margin = val;
            else
                site.margin = miniMargin;
            site.minipages = statement.row.minipages;
            site.delaymsecs = statement.row.delaymsecs;
            site.desc = statement.row.desc;
            site.linkXPath = statement.row.linkXPath;
            site.containerXPath = statement.row.containerXPath;
            site.contentXPath = statement.row.contentXPath;
            site.testLink = statement.row.testLink;
            site.removeXPath = statement.row.removeXPath;
            site.enabled = statement.row.enabled;
            site.enableJS = statement.row.enableJS;
            site.needMouseDown = statement.row.needMouseDown;
            site.ajax = statement.row.ajax;
            site.quickLoad = statement.row.quickLoad;
            site.fixOverflow = statement.row.fixOverflow;
            site.createdByYou = statement.row.createdByYou;
            site.changedByYou = statement.row.changedByYou;
            site.owner = statement.row.owner;
            site.published = statement.row.published;

            if (site.guid.length == 0 && site.createdByYou)
                site.guid = autopagerConfig.generateGuid();
            sites.push(site);
        }
    }
}