var autopagerSidebar =  
    {
    prompt : "Input A XPath Or Double a XPath in the list to see the effect.",
    currentDoc:  autopagerUtils.currentDocument(),
    currUrl : null,
    discovery: function()
    {
        var doc = autopagerUtils.currentDocument();
        if (this.currUrl != doc.documentURI)
          this.loadXPathForNode(doc);
      
      
        var res = autopagerXPath.discovery(doc);
        this.showXPathList(document.getElementById("autoLinkPathTreeBody"),res.linkXPaths)
        this.showXPathList(document.getElementById("autoContentPathTreeBody"),res.contentXPaths)
        
        if (res.linkXPaths.length>0)
        {    
          document.getElementById("xpath").value = res.linkXPaths[0].xpath;
          this.searchXPath(res.linkXPaths[0].xpath,document.getElementById("resultsFrame"),"status");
        }
        
        if (res.contentXPaths.length>0)
        {
            document.getElementById("contentXPath").value = res.contentXPaths[0].xpath;
            this.searchXPath(res.contentXPaths[0].xpath,document.getElementById("resultsFrame2"),"status2");
        }
        document.getElementById("xpathDeck").selectedIndex = 0;
    },

    onLoad : function() {
        autopagerUtils.log("onLoad() called");
        
        document.getElementById("xpath").addEventListener('command',function(){autopagerSidebar.search('xpath','resultsFrame','status');},false);
        document.getElementById("xpath").addEventListener('input',function(){autopagerSidebar.onTextChangeInXPathBox('xpath','status');},false);
        document.getElementById("xpath").addEventListener('keypress',
                    function(event){if (event.keyCode == event.DOM_VK_RETURN)
                             autopagerSidebar.search('xpath','resultsFrame','status');},true);


        document.getElementById("contentXPath").addEventListener('command',function(){autopagerSidebar.search('contentXPath','resultsFrame2','status2');},false);
        document.getElementById("contentXPath").addEventListener('input',function(){autopagerSidebar.onTextChangeInXPathBox('contentXPath','status2');},false);
        document.getElementById("contentXPath").addEventListener('keypress',
                    function(event){if (event.keyCode == event.DOM_VK_RETURN)
                            autopagerSidebar.search('contentXPath','resultsFrame2','status2');},true);
        
        this.loadXPathForNode(this.currentDoc);

    },
    refreshDoc : function()
    {
        this.loadXPathForNode(autopagerUtils.currentDocument());
    },
    clearNoneLink : function(node)
    {
      var n = node.firstChild;
      while(n != null)
      {
        var curr=n;
        n = curr.nextSibling;
        if (!(curr instanceof HTMLLinkElement))
        {
            node.removeChild(curr); 
        }
      }         
    },
    loadXPathForNode : function(doc) {
        autopagerUtils.log("getXPathForNode called");
        this.currUrl = doc.documentURI;
        this.currentDoc = doc;

        var browser = autopagerUtils.currentBrowser()
        this.loadIFrame(doc,"resultsFrame2","results-caption2");
        this.loadIFrame(doc,"resultsFrame","results-caption");

        setTimeout(function(){
        var iframe = document.getElementById( "resultsFrame");            
        iframe.addEventListener("DOMContentLoaded", function() {
            var self = arguments.callee;
            var iframe = document.getElementById( "resultsFrame");      
            iframe.removeEventListener("DOMContentLoaded",self,false);
            autopagerSidebar.clearNoneLink(iframe.contentDocument.body);
            var b=autopagerSidebar.addNode(iframe.contentDocument.body,"b");
            autopagerSidebar.addTextNode(b,autopagerSidebar.prompt);
        } 
        , false);
        autopagerUtils.cloneBrowser(iframe, browser);

        iframe = document.getElementById( "resultsFrame2");
        iframe.addEventListener("DOMContentLoaded", function() {
            var self = arguments.callee;
            var iframe = document.getElementById( "resultsFrame2");      
            iframe.removeEventListener("DOMContentLoaded",self,false);
            autopagerSidebar.clearNoneLink(iframe.contentDocument.body);
            var b=autopagerSidebar.addNode(iframe.contentDocument.body,"b");
            autopagerSidebar.addTextNode(b,autopagerSidebar.prompt);
        } 
        , false);
        autopagerUtils.cloneBrowser(iframe, browser);
        },1000);

    },

    getUrl : function() {
        var iframe = document.getElementById("resultsFrame")
        return iframe.contentDocument.location.href
    },

    loadIFrame:function(newDocument,frameID,captionID) {
        var url = newDocument.documentURI

        autopagerUtils.log("loading iframe from "+url)

        var iframe = document.getElementById( frameID)
        var docShell = iframe.docShell

        docShell.allowAuth = false
        docShell.allowJavascript = false
        docShell.allowMetaRedirects = false
        docShell.allowPlugins = false
        docShell.allowSubframes = false

        document.getElementById(captionID).label = "Results from "+url
    },

    onTextChangeInXPathBox:function(xpathID,statusID) {
        var xpath = document.getElementById(xpathID).value
        var isValid = autopagerXPath.isValidXPath(xpath,autopagerSidebar.currentDoc)
        document.getElementById(statusID).value = isValid ? "" : "Syntax error"
    },

    search:function(xpathID,resultFrameID,statusID) {
        autopagerUtils.log("search called")
        var xpath = document.getElementById(xpathID).value
        this.searchXPath(xpath,document.getElementById(resultFrameID),statusID);

    },
    searchXPath:function(xpath,contentFrame,statusID) {
        autopagerUtils.log("search called")

        var doc = autopagerSidebar.currentDoc;
        
        if(!autopagerXPath.isValidXPath(xpath,doc)) {
            document.getElementById(statusID).value = "Syntax error"
            return 
        }

        var resultList = this.getXPathNodes(doc, xpath)
        this.showResultList(doc,resultList,contentFrame,statusID)

    },
    showResultList:function (doc,resultList,contentFrame,statusID)
    {
        this.updateStatus(resultList,statusID)
        this.updateHtmlResults(resultList,contentFrame)
    },
    updateStatus:function(results,statusID) {
        var status;
        if(results.length==0) {
            status = "No matches found"
        } else if(results.length==1) {
            status = "One match found"
        } else if(results.length>1) {
            status = results.length+" matches found"
        }
        document.getElementById(statusID).value = status
    }
    , updateHtmlResults:function(results,contentFrame) {
        var doc = contentFrame.contentDocument;
        autopagerSidebar.clearNoneLink(doc.body);

        var table = autopagerSidebar.addNode(doc.body,"table");
        var tbody = autopagerSidebar.addNode(table,"tbody");
        

        autopagerHightlight.HighlightNodes(autopagerSidebar.currentDoc,results,-1);
        for (var i in results) {
            var node = results[i]
            node.blur = true;
            var label = (parseInt(i)+1)+":"

            var row = autopagerSidebar.addNode(tbody,"tr");
            var td1 = autopagerSidebar.addNode(row,"td");
            var td2 = autopagerSidebar.addNode(row,"td");

            autopagerSidebar.addTextNode(td1, label);
            var n = doc.importNode(node.cloneNode(true),true);
            td2.appendChild (n);
        }

    }

    // ================================================================


    , getXPathNodes:function(doc, xpath) {

        return autopagerXPath.evaluate(doc,xpath);
    }

    ,countProperties:function(obj) {
        var result = 0
        for (p in obj) {
            result++
        }
        return result
    },
    showXPathList:function(treeChild,lists)
    {
        treeChild.parentNode.xpathes = lists;
        this.clearNode(treeChild);
        for (var i in lists) 
        {
            var xpath = lists[i];
            var treeitem = this.addNode(treeChild,"treeitem");
            treeitem.xpath = xpath;
            
        
            var treerow = this.addNode(treeitem,"treerow");
            var treecell = this.addNode(treerow,"treecell");
            treecell.setAttribute("label", xpath.xpath);
            
            treecell = this.addNode(treerow,"treecell");
            treecell.setAttribute("label", this.round(xpath.authority));
            
            treecell = this.addNode(treerow,"treecell");
            treecell.setAttribute("label", xpath.matchCount);
        }
    },
    round:function(num)
    {
      return Math.round(num * 100) /100; 
    },
    addNode:function (pNode,name)
    {
        var node = pNode.ownerDocument.createElement(name);
        pNode.appendChild(node);
        return node;
    },
    addTextNode:function (pNode,text)
    {
        var node = pNode.ownerDocument.createTextNode(text);
        pNode.appendChild(node);
        return node;
    },
    clearNode:function (node)
    {
        while(node.hasChildNodes()){ node.removeChild(node.firstChild); } 
    },
    clearNodeBefore:function (node,before)
    {
        while(node.hasChildNodes() && node.firstChild!=before)
        {
            node.removeChild(node.firstChild); 
        } 
    },
    setLinkXPath:function()
    {
        autopagerSidebar.setXPath('xpath','xpaths','resultsFrame','status','results-caption');
    },
    setContentXPath:function()
    {
        autopagerSidebar.setXPath('contentXPath','contentXPaths','resultsFrame2','status2','results-caption2');
    },
    setXPath:function(txtboxID,treeID,resultFrameID,statusID,captionID)
    {
        var txtbox = document.getElementById(txtboxID);
        var tree = document.getElementById(treeID);
        var view = tree.view;
        var list = tree.xpathes;
        var xpathItem = list[view.selection.currentIndex];
        //        this.loadIFrame(autopagerSidebar.currentDoc,resultFrameID,captionID);

        txtbox.value = xpathItem.xpath;
        this.searchXPath(xpathItem.xpath,document.getElementById(resultFrameID),statusID);
    },
    addSite : function()
    {
        var linkXPath =document.getElementById("xpath").value;
        if (linkXPath == null || linkXPath.length ==0)
        {
          alert("Link XPath can't be null!");
          document.getElementById("xpath").focus();
          return;
        }
        var contentXPath =document.getElementById("contentXPath").value;
        if (contentXPath == null || contentXPath.length ==0)
        {
          alert("Content XPath can't be null!");
          document.getElementById("contentXPath").focus();
          return;
        }
        var url = this.currentDoc.documentURI;
            var urlPattern = url;
            if (url.indexOf("?")>0)
                urlPattern = url.substring(0,url.indexOf("?")) + "*";
            
            var site = newSite(urlPattern,url
                ,linkXPath,contentXPath);
            site.createdByYou = true;
            site.owner = autopagerPref.loadMyName();
            while (site.owner.length == 0)
                site.owner = autopagerPref.changeMyName();
            //general link
            //var targets = this.getXPathNodes(this.currentDoc,linkXPath);
            //var target = targets[0];
            //if (target.tagName == "A" && target.href.toLowerCase().indexOf("javascript") == -1)
            //    site.enableJS = false;
            //else
            
            //enable this by default for best compatibility
                site.enableJS = true;
            workingAutoSites = loadConfig();
            insertAt(workingAutoSites,0,site);
            saveConfig(workingAutoSites);
            document.autopagerXPathModel = "";
            document.autopagerWizardStep = "";
            openSetting(urlPattern);
        
    },
        pickupLink : function ()
        {
            //alert("This function is not implemented yet.Please wait for next versions.");
            autopagerSelector.clearFunctions();
            autopagerSelector.registorSelectFunction(function (elem){
              
                  var doc = elem.ownerDocument;
                  if (autopagerSidebar.currUrl != doc.documentURI)
                    autopagerSidebar.loadXPathForNode(doc);

                 var nodes = [];
                 nodes.push(elem);

                  var links = document.getElementById("autoLinkPathTreeBody").parentNode.xpathes;
                  if (!links)
                      links = [];
                  links = autopagerXPath.discoveryMoreLinks(doc,links,nodes);
                  autopagerSidebar.showXPathList(document.getElementById("autoLinkPathTreeBody"),links)

                  if (links.length>0)
                  {    
                    document.getElementById("xpath").value = links[0].xpath;
                    autopagerSidebar.searchXPath(links[0].xpath,document.getElementById("resultsFrame"),"status");
                  }

                  document.getElementById("xpathDeck").selectedIndex = 0;

                
            });
            autopagerSelector.registorStartFunction(function (){
              document.getElementById("xpathDeck").selectedIndex = 1;
            });
            autopagerSelector.registorQuitFunction(function (){
              document.getElementById("xpathDeck").selectedIndex = 0;
            });
        
            autopagerSelector.start(autopagerUtils.currentBrowser());
        }
        ,
        pickupContent : function ()
        {
//            alert("This function is not implemented yet.Please wait for next versions.");
            autopagerSelector.clearFunctions();
            autopagerSelector.registorSelectFunction(function (elem){
              
                  var doc = elem.ownerDocument;
                  if (autopagerSidebar.currUrl != doc.documentURI)
                    autopagerSidebar.loadXPathForNode(doc);

                 var nodes = [];
                 nodes.push(elem);

                  var links = document.getElementById("autoContentPathTreeBody").parentNode.xpathes;
                  if (!links)
                      links = [];
                  links = autopagerXPath.discoveryMoreLinks(doc,links,nodes);
                  autopagerSidebar.showXPathList(document.getElementById("autoContentPathTreeBody"),links)

                  if (links.length>0)
                  {    
                    document.getElementById("contentXPath").value = links[0].xpath;
                    autopagerSidebar.searchXPath(links[0].xpath,document.getElementById("resultsFrame2"),"status2");
                  }

                  document.getElementById("xpathDeck").selectedIndex = 0;

                
            });
            autopagerSelector.registorStartFunction(function (){
              document.getElementById("xpathDeck").selectedIndex = 1;
            });
            autopagerSelector.registorQuitFunction(function (){
              document.getElementById("xpathDeck").selectedIndex = 0;
            });
        
            autopagerSelector.start(autopagerUtils.currentBrowser());
        },
    clearAll: function()
    {
        var doc = autopagerUtils.currentDocument();
        this.loadXPathForNode(doc);
      
      
        var XPaths = [];
        this.showXPathList(document.getElementById("autoLinkPathTreeBody"),XPaths)
        this.showXPathList(document.getElementById("autoContentPathTreeBody"),XPaths)
        
        document.getElementById("xpath").value = "";
        document.getElementById("contentXPath").value = "";
        document.getElementById("xpathDeck").selectedIndex = 0;
    }


};
autopagerUtils.log("loading window.js");

