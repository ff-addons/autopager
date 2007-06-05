var AutoPagerize= {
    parseInfo:function(str) {
        var lines = str.split(/\r\n|\r|\n/)
        var re = /(^[^:]*?):(.*)$/
        var strip = function(str) {
            return str.replace(/^\s*/, '').replace(/\s*$/, '')
        }
        var info = {}
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].match(re)) {
                info[RegExp.$1] = strip(RegExp.$2)
            }
        }
        info.remainHeight = parseInt(info.remainHeight)
        var isValid = function(info) {
            var infoProp = ['nextLink', 'insertBefore', 'pageElement']
            for (var i = 0; i < infoProp.length; i++) {
                if (!infoProp[i]) {
                    return false
                }
            }
            return true
        }
        return isValid(info) ? info : null
    },
    onload:function(doc,obj)
    {
        var info = []
        var textareas = apxmlhttprequest.getElementsByXPath(
            '//*[@class="autopagerize_data"]', doc) || []
        textareas.forEach(function(textarea) {
            var d = AutoPagerize.parseInfo(textarea.value)
            if (d) {
                var text = AutoPagerize.getDesc(textarea);
                d["desc"] = text;
                info.push(d)
            }
        }) 
        var sites = new Array();
        info.forEach(function(site){
            var newSite = new Site();
            newSite.urlPattern  = site["url"];
            newSite.guid  = newSite.urlPattern;
            newSite.isRegex  = true;
            if (!isNaN(site["remainHeight"] ))
                newSite.margin  = site["remainHeight"] / 500;
            newSite.enabled  = true;
            newSite.enableJS  = false;
            newSite.quickLoad  = false;
            newSite.fixOverflow  = true;
            newSite.createdByYou  = false;
            newSite.changedByYou  = false;
            newSite.owner  = obj.owner;
            newSite.contentXPath=new Array();
            newSite.contentXPath.push(site["pageElement"]);

            newSite.linkXPath = site["nextLink"];
            newSite.desc = site["desc"];
            newSite.oldSite = null;
            sites.push(newSite);
	});
        
        return sites;
    },
    getDesc:function(textarea)
    {
        var descNode = textarea.parentNode.previousSibling;
        while ( (descNode.previousSibling != null) && (! (descNode instanceof HTMLHeadingElement)))
        {
            descNode = descNode.previousSibling;
        }
        if (descNode!=null)
        {
            return descNode.textContent;
        }
        return "Can't get desc";
    }
}
