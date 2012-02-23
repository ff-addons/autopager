var autopagerRelated =
{
    relatedSearch: "http://api.search.live.net/json.aspx?Appid=41CC52599D6F30EE0E2C7D7F1C4DDCB97F98992B&query=autopager&Sources=RelatedSearch",
    getRelelatedSearchOptions : function (host,callback)
    {
        if (typeof callback == 'function')
        {
            var searchEngines = autopagerPref.loadPref("searchs");
            var sts = null
            if (typeof searchEngines != "undefined" && searchEngines!=null && searchEngines!="")
            {
                sts = autopagerBwUtil.decodeJSON(searchEngines);
            }
            var siteEnabled = autopagerPref.loadPref("host." + host +".related-search-enabled");
            if (typeof siteEnabled == "undefined" || siteEnabled===null || siteEnabled==="")
            {
                siteEnabled = autopagerPref.loadBoolPref("related-search-enabled");
            }
            callback({enabled:siteEnabled,
                      prompted:autopagerPref.loadBoolPref("related-search-prompted"),
                      keywordXPath:autopagerPref.loadPref("keywordXPath"),
                      discoverUrl : autopagerPref.loadPref("related-search-discover-url"),
                      searchs: sts,
                      searchEngine: autopagerPref.loadPref("related-search-engine")})
        }
    }
    , getRelelatedSearchText : function (options,ut,callback)
    {
        var discoverUrl = options.discoverUrl
        if (ut.d)
            discoverUrl = ut.d
        if (!discoverUrl)
            return;
        var url = discoverUrl.replace(/{query}/g,options.searchQuery.replace(/ /g, '+'))

        var xhr = new window.XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                var texts = []
                try{
                    var ss = autopagerBwUtil.decodeJSON(xhr.responseText)
                    var results = ss.SearchResponse.RelatedSearch.Results
                    for(var i in results)
                    {
                        texts.push(results[i].Title)
                        if (texts.length==8)
                            break;
                    }                    
                }catch(e){
                    var parser = new window.DOMParser();
                    var text = xhr.responseText;
                    var xmlRoot = parser.parseFromString(text, "text/xml");
                    var itemNodes = xmlRoot.getElementsByTagName('refinement');
                    var length = Math.min(8,itemNodes.length)
                    for (var i = 0; i < length; i++) {
                        try {
                            var itemNode = itemNodes[i];
                            var refinement = itemNode.textContent.toLowerCase();
                            texts.push(autopagerRelated.makeCombinedQuery(options.searchQuery,refinement));
                        } catch (e) {
                        }
                    }
                }
                callback(texts)
            }
        };
        xhr.send(null);
    },
    makeCombinedQuery : function(search,refinement) {
        var query = refinement;
        var words = search.replace(/"'\(\),/g, '').replace(/\+/g, ' ').split(' ');
        for (var i = 0; i < words.length; i++) {
            var word = words[i];
            if (!autopagerRelated.scContainsSubstring(query.toLowerCase(), word.toLowerCase())) {
                query = query + ' ' + word;
            }
        }
        return query;
    },
    scContainsSubstring : function(text, substring) {
        return text && substring && (text.indexOf(substring) >= 0);
    }
}
