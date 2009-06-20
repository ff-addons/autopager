
var autopagerRefinement =
{
    partner : { 
        uiLabel: 'Auto Pager Refinements',
        partnerCode: 'autopager',
        authCode: 'fbt62709'
    },
    pref: Components.classes["@mozilla.org/preferences-service;1"].
    getService(Components.interfaces.nsIPrefService).getBranch("autopager"),
    entryPoint : function(event) {
        var doc = event;
        if (!autopagerRefinement.pref.getBoolPref(".refinement"))
            return;
        if (doc == null || !(doc instanceof HTMLDocument))
        {
            if (event.explicitOriginalTarget !=null && event.explicitOriginalTarget  instanceof HTMLDocument
                && event.explicitOriginalTarget.location!=null)
                doc = event.explicitOriginalTarget;
            else if (event.originalTarget !=null && event.originalTarget  instanceof HTMLDocument
                && event.originalTarget.location!=null)
                doc = event.originalTarget;
            else 
                doc = event.target;
        }
        if (doc == null)
            return;
        if (doc.defaultView == null)
            return;
        if (!(doc instanceof HTMLDocument))
        {
            return;
        }
        if (doc.location == null)
        {
            return;
        }
        // quit if SC or any other extension has already put the refinement links on the page
        if (doc.getElementById('scTopOfPageRefinementLinks')) {
            return;
        }
        try
        {
            if (doc.location && doc.location.host)
            {
                var host = doc.location.host;
//                if (doc.location.href.match(new RegExp("^http://[^.]+\.google\.(?:[^.]+\.)?[^./]+/\#"))) {
//                    doc.documentElement.scRefinementQuery = null;
//                    autopagerRefinement.waitForGoogleAjaxToComplete(doc);
//                }
//                else
                if (doc.location.href.match(new RegExp("^http://[^.]+\.google\.(?:[^.]+\.)?[^./]+/"))) {
                    var qs = autopagerRefinement.evaluate(doc,"//input[@name='q']",1)
                    if (qs!=null && qs.length==1)
                    {
                        var q = qs[0]
                        doc.documentElement.scRefinementQuery = q.value;
                        var insertPoint = autopagerRefinement.evaluate(doc,"//div[@id='res']/div/ol[1] | //div[@id='res']/*[1][not(//div[@id='res']/div/ol)]",1)[0];
                        autopagerRefinement.launchSCAjaxRequestForRefinementLinks(doc,insertPoint, '');
                    }
                }
                else if (autopagerRefinement.scContainsSubstring(host, 'search.yahoo.')) {
                    doc.documentElement.scRefinementQuery = doc.getElementById("yschsp").value;
                    var div = doc.getElementById('web');
                    var insertPoint = autopagerRefinement.scGetDescendents(div, "ol")[0];
                    autopagerRefinement.launchSCAjaxRequestForRefinementLinks(doc,insertPoint, ' margin-left: 20px;');
                } else if (autopagerRefinement.scContainsSubstring(host, '.bing.com')) {
                    doc.documentElement.scRefinementQuery = doc.getElementById("sb_form_q").value;
                    var div = doc.getElementById('results');
                    var insertPoint = autopagerRefinement.scGetDescendents(div, "ul")[0];
                    autopagerRefinement.launchSCAjaxRequestForRefinementLinks(doc,insertPoint, '');
                }
            }
        }catch(e){
        }
    },
    waitForGoogleAjaxToComplete : function (doc) {
        // in case google is in ajax mode, loop until the search results have been displayed.
        // do this by waiting for the preferences link to appear
        if (!doc.documentElement.scRefinementQuery) {
            var aTags = doc.getElementsByTagName('a');
            for (var i = 0; (i < aTags.length) && !doc.documentElement.scRefinementQuery; i++) {
                var aTag = aTags[i];
                var href = aTag.href;
                if (autopagerRefinement.scContainsSubstring(href, '/preferences?') && autopagerRefinement.scContainsSubstring(href, '.google.') && autopagerRefinement.scContainsSubstring(href, 'q=')) {
                    // we have a preferences link.  extract the query from it.
                    if (autopagerRefinement.scContainsSubstring(href, '?q=')) {
                        doc.documentElement.scRefinementQuery = href.replace(/.*\?q=/, '').replace(/&.*/, '');
                    } else if (autopagerRefinement.scContainsSubstring(href, '&q=')) {
                        doc.documentElement.scRefinementQuery = href.replace(/.*&q=/, '').replace(/&.*/, '');
                    }
                }
            }
            if (!doc.documentElement.scRefinementQuery) {
                setTimeout(function(){
                    autopagerRefinement.waitForGoogleAjaxToComplete(doc)
                }, 200);
                return;
            }
        }
        if (doc.getElementById("res")!=null)
        {
            var insertPoint = doc.getElementById("res").firstChild;
            autopagerRefinement.launchSCAjaxRequestForRefinementLinks(doc,insertPoint,'');
            return;
        }
        var liTags = doc.getElementsByTagName('li');
        for (i = 0; i < liTags.length; i++) {
            var liTag = liTags[i];
            var cls = liTag.getAttribute('class');
            if (cls && ((cls == 'g') || (cls.indexOf('g ') === 0))) {
                var insertPoint = liTag.parentNode.parentNode.parentNode;
                autopagerRefinement.launchSCAjaxRequestForRefinementLinks(doc,insertPoint,'');
                break;
            }
        }
    },
    launchSCAjaxRequestForRefinementLinks : function(doc, insertPoint, yStyle) {
        var div = doc.createElement("div");
        div.innerHTML = '<div id=scTopOfPageRefinementLinks scTopPos=1 partner="' + autopagerRefinement.partner.partnerCode + '" style="height: 20px; margin-top: 7px; margin-bottom: 7px;' + yStyle + '"></div>';
        insertPoint.parentNode.insertBefore(div, insertPoint);
        var url = 'http://' + autopagerRefinement.partner.authCode + '.surfcanyon.com/queryReformulation?partner=' + autopagerRefinement.partner.partnerCode + '&authCode=' + autopagerRefinement.partner.authCode + '&q=' + doc.documentElement.scRefinementQuery.replace(/ /g, '+');

        var xhr = new window.XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                var parser = new window.DOMParser();
                var text = xhr.responseText;
                var xmlRoot = parser.parseFromString(text, "text/xml");
                var itemNodes = xmlRoot.getElementsByTagName('refinement');
                var items = [];
                var runningLength = 0;
                for (var i = 0; i < itemNodes.length; i++) {
                    try {
                        var itemNode = itemNodes[i];
                        var refinement = itemNode.textContent.toLowerCase();
                        var refinementLength = refinement.length;
                        if (runningLength + refinementLength < 99) {
                            runningLength += refinementLength;
                            var query = autopagerRefinement.makeRefinementQuery(doc,refinement).replace(/ /g, '+');
                            items.push('<a href="http://search.surfcanyon.com/search?f=nrl' + i + '&q=' + query + '&partner=' + autopagerRefinement.partner.partnerCode + '">' + refinement + '</a>');
                        }
                    } catch (e) {
                    }
                }
                if (items.length > 0) {
                    var div = doc.getElementById('scTopOfPageRefinementLinks');
                    if (div && (div.getAttribute('partner') == 'autopager')) {
                        div.innerHTML = '<font size=-1><b>' + items.join(' &nbsp;') + '</b> &nbsp;<font size =-1 color=darkgray>' + autopagerRefinement.partner.uiLabel + '</font></font>';
                    }
                }
            }
        };
        xhr.send(null);
    },
    makeRefinementQuery : function(doc,refinement) {
        var query = refinement;
        var words = doc.documentElement.scRefinementQuery.replace(/"'\(\),/g, '').replace(/\+/g, ' ').split(' ');
        for (var i = 0; i < words.length; i++) {
            var word = words[i];
            if (!autopagerRefinement.scContainsSubstring(query.toLowerCase(), word.toLowerCase())) {
                query = query + ' ' + word;
            }
        }
        return query;
    },
    scContainsSubstring : function(text, substring) {
        return text && substring && (text.indexOf(substring) >= 0);
    },
    scGetDescendents : function(node, tagName) {
        var arr = [];
        if (node && node.childNodes) {
            var childNodes = node.childNodes;
            for (var i = 0; i < childNodes.length; i++) {
                var child = childNodes.item(i);
                if (child.tagName && (!tagName || (child.tagName.toUpperCase() == tagName.toUpperCase()))) {
                    arr[arr.length] = child;
                }
                if (child.hasChildNodes()) {
                    arr = arr.concat(autopagerRefinement.scGetDescendents(child, tagName));
                }
            }
        }
        return arr;
    },
    evaluate : function(node,expr,max)
    {
        var doc = (node.ownerDocument == null) ? node : node.ownerDocument;
        var found = [];
        try{
            var xpe = new XPathEvaluator();
            var nsResolver = xpe.createNSResolver(doc.documentElement);
            var result = xpe.evaluate(expr, node, nsResolver, 0, null);

            var res;
            while ((res = result.iterateNext()) && (typeof(max)=='undefined' || found.length<max))
                found.push(res);
            //alert(found.length);
        }catch(e) {
            autopagerUtils.log("unableevaluator");//TODO: autopagerConfig.autopagerFormatString("unableevaluator",[aExpr,e]));
        }
        return found;
    },

}
window.addEventListener("DOMContentLoaded", autopagerRefinement.entryPoint, false);