var autopagerSidebar =  
    {
    initialized: false,
    currentDoc:  autopagerUtils.currentDocument(),
    currUrl : null,
    tabbox : null,
	linkColor: "blue",
	contentColor: "orange",
	maxWidth: '',
	orgPriority: '',
    search: false,
    tips : null,
    loadString: function() {
        // initialization code
        this.initialized = true;
        this.gfiltersimportexportBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
        this.mystrings = this.gfiltersimportexportBundle.createBundle("chrome://autopager/locale/autopager.properties");
    },
    getString:function(key)
    {
        if (!this.initialized)
            this.loadString();
        try{
            var str = this.mystrings.GetStringFromName(key);
            return str;
        }catch(e)
       {
            return key;
       }
    },
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
          this.searchXPath(res.linkXPaths[0].xpath,document.getElementById("resultsFrame"),"status",autopagerSidebar.linkColor,false);
        }
        
        if (res.contentXPaths.length>0)
        {
            document.getElementById("contentXPath").value = res.contentXPaths[0].xpath;
            this.searchXPath(res.contentXPaths[0].xpath,document.getElementById("resultsFrame2"),"status2",autopagerSidebar.contentColor,false);
        }
        document.getElementById("xpathDeck").selectedIndex = 0;
    },
    onMouseOver:function (event)
    {
        autopagerSidebar.tips.onMouseOver(event);
    },
    onMouseOut:function (event)
    {
        autopagerSidebar.tips.onMouseOut(event);
    },
    onLoad : function() {
        autopagerUtils.log("onLoad() called");

    autopagerSidebar.tips = new autopagerTip("AutopagerWorkshop:");

        if (autopagerMain.loadBoolPref("show-help"))
        {
            window.addEventListener("mouseover",autopagerSidebar.onMouseOver,false);
            window.addEventListener("mouseout",autopagerSidebar.onMouseOut,false);
        }
		var sidebar = window.top.document.getElementById("sidebar");
        if (sidebar)
        {
            autopagerSidebar.orgPriority = sidebar.style.getPropertyPriority ("max-width");
            autopagerSidebar.maxWidth = sidebar.style.getPropertyValue ("max-width");

            sidebar.style.removeProperty("max-width");
            sidebar.addEventListener("DOMAttrModified",this.changed,false);
            var sidebarBox = window.top.document.getElementById("sidebar-box");
            sidebarBox.addEventListener("DOMAttrModified",this.changed,false);
            var sheets = window.top.document.styleSheets
            for(var i=0;i<sheets.length;i++)
            {
                    if('chrome://autopager/skin/autopager-toolbar.css' == sheets.item(i).href)
                    {
                            var sheet = sheets.item(i);
                            sheet.insertRule("#sidebar-box { overflow-x: hidden !important;}",sheet.cssRules.length);
                            sheet.insertRule("#sidebar {  min-width: 0px !important;    max-width: none !important;    overflow-x: hidden !important;}",sheet.cssRules.length);
                    }
            }
        }
		//document.getElementById("xpath").addEventListener('command',function(){autopagerSidebar.search('xpath','resultsFrame','status',autopagerSidebar.linkColor,false);},false);
        document.getElementById("xpath").addEventListener('input',function(){autopagerSidebar.onTextChangeInXPathBox('xpath','resultsFrame','status',autopagerSidebar.linkColor);},false);
        document.getElementById("xpath").addEventListener('keypress',
                    function(event){
                        if (event.keyCode == event.DOM_VK_RETURN)
                        {
                            autopagerSidebar.tabbox.selectedIndex=1;
    						autopagerSidebar.search('xpath','resultsFrame','status',autopagerSidebar.linkColor,true);
                            event.preventDefault();
                        }
                    },true);
        document.getElementById("xpath").addEventListener('focus',function(){autopagerSidebar.tabbox.selectedIndex=1;},false);


        //document.getElementById("contentXPath").addEventListener('command',function(){autopagerSidebar.search('contentXPath','resultsFrame2','status2',autopagerSidebar.contentColor,false);},false);
        document.getElementById("contentXPath").addEventListener('input',function(){autopagerSidebar.onTextChangeInXPathBox('contentXPath','resultsFrame2','status2',autopagerSidebar.contentColor);},false);
        document.getElementById("contentXPath").addEventListener('keypress',
                    function(event){
                        if (event.keyCode == event.DOM_VK_RETURN)
                        {
                            autopagerSidebar.tabbox.selectedIndex=2;
                            autopagerSidebar.search('contentXPath','resultsFrame2','status2',autopagerSidebar.contentColor,true);
                            event.preventDefault();
                        }
                    },true);
        document.getElementById("contentXPath").addEventListener('focus',function(){autopagerSidebar.tabbox.selectedIndex=2;},false);
        
        this.loadXPathForNode(this.currentDoc);

		this.tabbox = document.getElementById("autopager-workshop-tabbox");
		var urlPattern = document.getElementById("urlPattern");
		var chkIsRegex = document.getElementById("chkIsRegex");
		chkIsRegex.addEventListener('command',function(){
			autopagerSidebar.checkurlPattern(chkIsRegex,urlPattern);
		},false);

		urlPattern.addEventListener('input',
			function()
			{
				autopagerSidebar.checkurlPattern(chkIsRegex,urlPattern);
			}
			,false);

    },
	checkurlPattern : function (chkIsRegex,urlPattern)
	{
		var url = autopagerSidebar.currUrl;
		if (!url)
		{
			urlPattern.style.color = "";
		}
		var regex = null;
		try{
			if (chkIsRegex.checked)
			{
				regex = new RegExp(urlPattern.value);
			}else
			{
				regex = convert2RegExp(urlPattern.value);
			}
			if (url)
			{
				if (regex.test(url))
					urlPattern.style.color = "green";
				else
				{
					urlPattern.style.color = "red";
				}
			}
		}catch(e)
		{
			urlPattern.style.color = "red";
		}

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

        if (autopagerMain.loadBoolPref("tweaking-workshop-result-style"))
        {
            setTimeout(function(){
            var iframe = document.getElementById( "resultsFrame");
            iframe.addEventListener("DOMContentLoaded", function() {
                var self = arguments.callee;
                var iframe = document.getElementById( "resultsFrame");
                iframe.removeEventListener("DOMContentLoaded",self,false);
                autopagerSidebar.clearNoneLink(iframe.contentDocument.body);
                var b=autopagerSidebar.addNode(iframe.contentDocument.body,"b");
                autopagerSidebar.addTextNode(b,autopagerSidebar.getString("testprompt"));
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
                autopagerSidebar.addTextNode(b,autopagerSidebar.getString("testprompt"));
            }
            , false);
            autopagerUtils.cloneBrowser(iframe, browser);
            },1000);
        }
        else
        {
            var iframe = document.getElementById( "resultsFrame");
            var b=autopagerSidebar.addNode(iframe.contentDocument.body,"b");
            autopagerSidebar.addTextNode(b,autopagerSidebar.getString("testprompt"));
            iframe = document.getElementById( "resultsFrame2");
            b=autopagerSidebar.addNode(iframe.contentDocument.body,"b");
            autopagerSidebar.addTextNode(b,autopagerSidebar.getString("testprompt"));
        }
		var sites = UpdateSites.getMatchedSiteConfig(UpdateSites.loadAll(),this.currUrl,10);

		autopagerSidebar.showSettingList(document.getElementById("settingsTreeBody"),sites);

		//The following code are similar to the example from
		//http://developer.mozilla.org/En/Full_page_zoom
		//but fullZoom doesn't work, will zoom the whole browser don't know why
		var iframe = document.getElementById( "resultsFrame");
		var contViewer = iframe.docShell.contentViewer;
		var docViewer = contViewer.QueryInterface(Components.interfaces.nsIMarkupDocumentViewer);
		docViewer.textZoom = 0.8;
//		docViewer.fullZoom = 0.8

		iframe = document.getElementById( "resultsFrame2");
		contViewer = iframe.docShell.contentViewer;
		docViewer = contViewer.QueryInterface(Components.interfaces.nsIMarkupDocumentViewer);
		docViewer.textZoom = 0.8;
//		docViewer.fullZoom = 0.8;
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

        var cap = document.getElementById(captionID);
        //cap.label = this.getString("Resultsfrom") + ":" + url;
        cap.tooltip = url
        if(url.length>30)
            url = url.substring(0,15)+ "..." + url.substring(url.length - 15 )

        cap.label = this.getString("Resultsfrom") + ":" +url;
        
        
    },

    onTextChangeInXPathBox:function(xpathID,resultsFrame,statusID,color) {
        setTimeout(function()
        {
            var xpathCtrl = document.getElementById(xpathID)
            var xpath = xpathCtrl.value
            var isValid = autopagerXPath.isValidXPath(xpath,autopagerSidebar.currentDoc)
            document.getElementById(statusID).value = isValid ? "" : "Syntax error"
            xpathCtrl.style.color = isValid? "green": "red";
            autopagerSidebar.lazySearch(xpathID,resultsFrame,statusID,color,false);
        },10);
    },
    lazySearch:function(xpathID,resultFrameID,statusID,color,focus) {
        autopagerSidebar.xpathID = xpathID;
        autopagerSidebar.resultFrameID = resultFrameID;
        autopagerSidebar.statusID = statusID;
        autopagerSidebar.color = color;
        if (!autopagerSidebar.searching)
        {
              setTimeout(function()
              {
                  autopagerSidebar.searching = true;
                  autopagerSidebar.search(autopagerSidebar.xpathID
                        ,autopagerSidebar.resultFrameID
                        ,autopagerSidebar.statusID
                        ,autopagerSidebar.color
                        ,false);
                  autopagerSidebar.searching = false;
              },1000);
        }
    },
    search:function(xpathID,resultFrameID,statusID,color,focus) {
        autopagerUtils.log("search called")
        var xpath = document.getElementById(xpathID).value
        this.searchXPath(xpath,document.getElementById(resultFrameID),statusID,color,focus);
    },
    searchXPath:function(xpath,contentFrame,statusID,color,focus) {
        autopagerUtils.log("search called")

        var doc = autopagerSidebar.currentDoc;
        
        if(!autopagerXPath.isValidXPath(xpath,doc)) {
            document.getElementById(statusID).value = "Syntax error"
            return 
        }

        var resultList = this.getXPathNodes(doc, xpath)
        if (focus && resultList.length>0)
        {
            if (autopagerSidebar.linkColor == color)
                this.addXPathList(document.getElementById("autoLinkPathTreeBody"),xpath,1,resultList.length);
            else
                this.addXPathList(document.getElementById("autoContentPathTreeBody"),xpath,1,resultList.length);
        }
        this.showResultList(doc,resultList,contentFrame,statusID,color,focus)

    },
    showResultList:function (doc,resultList,contentFrame,statusID,color,focus)
    {
        this.updateStatus(resultList,statusID)
        this.updateHtmlResults(resultList,contentFrame,color,focus)
    },
    updateStatus:function(results,statusID) {
        var status;
        if(results.length==0) {
            status = this.getString("Nomatchesfound");
        } else if(results.length==1) {
            status = this.getString("Onematchfound");
        } else if(results.length>1) {
            status = results.length+ " " + this.getString("matchesfound")
        }
        document.getElementById(statusID).value = status
    }
    , updateHtmlResults:function(results,contentFrame,color,focus) {
        var doc = contentFrame.contentDocument;
        autopagerSidebar.clearNoneLink(doc.body);

        var table = autopagerSidebar.addNode(doc.body,"table");
        var tbody = autopagerSidebar.addNode(table,"tbody");
        

        autopagerHightlight.HighlightNodes(autopagerSidebar.currentDoc,results,-1,color,focus);
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
        return autopagerXPath.evaluate(doc,"(" + xpath + ")[not (@class='autoPagerS')]");
    }
    ,countProperties:function(obj) {
        var result = 0
        for (p in obj) {
            result++
        }
        return result
    },
    addXPathList:function(treeChild,xpath,authority,matchCount)
    {
        var lists = treeChild.parentNode.xpathes;
        for (var i in lists)
        {
            var xpathNode = lists[i];
            if (xpathNode.xpath == xpath)
                return;
        }
        var newXpathNode = new autopagerXPathItem();
        newXpathNode.xpath = xpath;
        newXpathNode.authority = authority;
        newXpathNode.matchCount = matchCount;

        var newList = [newXpathNode];
        for (var i in lists)
        {
            newList.push( lists[i]);
        }
        this.showXPathList(treeChild,newList)
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
    showSettingList:function(treeChild,lists)
    {
        treeChild.parentNode.xpathes = lists;
        this.clearNode(treeChild);
        for (var i in lists)
        {
            var site = lists[i];
            var treeitem = this.addNode(treeChild,"treeitem");
            treeitem.site = site;


            var treerow = this.addNode(treeitem,"treerow");
            var treecell = this.addNode(treerow,"treecell");
            treecell.setAttribute("label", site.urlPattern);

            treecell = this.addNode(treerow,"treecell");
            treecell.setAttribute("label", site.linkXPath);

            treecell = this.addNode(treerow,"treecell");
            treecell.setAttribute("label", site.contentXPath[0]);
            treecell = this.addNode(treerow,"treecell");
            treecell.setAttribute("label", site.updateSite.filename);
        }
		var chkIsRegex = document.getElementById("chkIsRegex");
        var urlPattern = document.getElementById("urlPattern");
		if (lists.length>0)
		{
			var site = lists[0];
			chkIsRegex.checked = site.isRegex;
			urlPattern.value = site.urlPattern;
		}
		else{
			chkIsRegex.checked = false;
            var url = this.currentDoc.documentURI;
            var urlPatternValue = url;
            if (url.indexOf("?")>0)
                urlPatternValue = url.substring(0,url.indexOf("?")) + "*";
			urlPattern.value = urlPatternValue;
		}
		autopagerSidebar.checkurlPattern(chkIsRegex,urlPattern);
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
        autopagerSidebar.setXPath('xpath','xpaths','resultsFrame','status','results-caption',autopagerSidebar.linkColor);
    },
    setContentXPath:function()
    {
        autopagerSidebar.setXPath('contentXPath','contentXPaths','resultsFrame2','status2','results-caption2',autopagerSidebar.contentColor);
    },
    setXPath:function(txtboxID,treeID,resultFrameID,statusID,captionID,color,focus)
    {
        var txtbox = document.getElementById(txtboxID);
        var tree = document.getElementById(treeID);
        var view = tree.view;
        var list = tree.xpathes;
        var xpathItem = list[view.selection.currentIndex];
        //        this.loadIFrame(autopagerSidebar.currentDoc,resultFrameID,captionID);

        txtbox.value = xpathItem.xpath;
        this.searchXPath(xpathItem.xpath,document.getElementById(resultFrameID),statusID,color,focus);
    },
	setXPathes:function()
    {
        var tree = document.getElementById('setings');
        var view = tree.view;
        var list = tree.xpathes;
        var site = list[view.selection.currentIndex];
        //        this.loadIFrame(autopagerSidebar.currentDoc,resultFrameID,captionID);

        var txtbox = document.getElementById('xpath');
        txtbox.value = site.linkXPath;
		txtbox = document.getElementById('contentXPath');
        txtbox.value = site.contentXPath;

		var urlPattern = document.getElementById("urlPattern");
		urlPattern.value = site.urlPattern;
        this.searchXPath(site.linkXPath,document.getElementById('resultsFrame'),'status',autopagerSidebar.linkColor,false);
        this.searchXPath(site.contentXPath,document.getElementById('resultsFrame2'),'status2',autopagerSidebar.contentColor,false);
    },
    addSite : function()
    {
      autopagerSidebar.doAddSite(false);
    },
    doAddSite : function(closethisFirst)
    {
        var linkXPath =document.getElementById("xpath").value;
        if (linkXPath == null || linkXPath.length ==0)
        {
          alert(this.getString("LinkXPathcannotbenull"));
          document.getElementById("xpath").focus();
          return false;
        }
        var contentXPath =document.getElementById("contentXPath").value;
        if (contentXPath == null || contentXPath.length ==0)
        {
          alert(this.getString("ContentXPathcannotbenull"));
          document.getElementById("contentXPath").focus();
          return false;
        }
        var url = this.currentDoc.documentURI;

			var chkIsRegex = document.getElementById("chkIsRegex");
			var urlPattern = document.getElementById("urlPattern");

            var site = autopagerConfig.newSite(urlPattern.value,url
                ,linkXPath,contentXPath,[url]);
            site.createdByYou = true;
			site.isRegex = chkIsRegex.checked;
            site.owner = autopagerPref.loadMyName();
            while (site.owner.length == 0)
                site.owner = autopagerPref.changeMyName();
            //general link
            var targets = this.getXPathNodes(this.currentDoc,linkXPath);
            var target = targets[0];
//            if (target.tagName == "A" && target.hash!=null
//								&& target.hash.length>0 &&
//								target.onclick!=null && target.href.toLowerCase().indexOf("#") != -1)
//                site.ajax = true;

            //enable this by default for best compatibility
            site.enableJS = true;
            autopagerMain.workingAutoSites = autopagerConfig.loadConfig();
            autopagerConfig.insertAt(autopagerMain.workingAutoSites,0,site);
            autopagerConfig.saveConfig(autopagerMain.workingAutoSites);
            document.autopagerXPathModel = "";
            document.autopagerWizardStep = "";
			window.autopagerSelectUrl = autopagerSidebar.currUrl;
            if (closethisFirst || (window.top.document.getElementById("sidebar")==null))
            {
                autopagerSidebar.quit()
                window.close();
            }
            autopagerConfig.openSetting(autopagerSidebar.currUrl,autopagerUtils.currentBrowser());
        return true;
    },
    openInOwnWin : function()
    {
        window.open("chrome://autopager/content/autopager-workshopWin.xul", "autopager","chrome,resizable,centerscreen,width=600,height=500");
        autopagerUtils.currentWindow().toggleSidebar('viewautopagerSidebar',false);
    },
    openInSidebar : function()
    {
        autopagerUtils.currentWindow().toggleSidebar('viewautopagerSidebar',true);
        window.close();
    },
    testSite : function()
    {
        var linkXPath =document.getElementById("xpath").value;
        if (linkXPath == null || linkXPath.length ==0)
        {
          alert(this.getString("LinkXPathcannotbenull"));
          document.getElementById("xpath").focus();
          return;
        }
        var contentXPath =document.getElementById("contentXPath").value;
        if (contentXPath == null || contentXPath.length ==0)
        {
          alert(this.getString("ContentXPathcannotbenull"));
          document.getElementById("contentXPath").focus();
          return;
        }
        var url = this.currentDoc.documentURI;

			var chkIsRegex = document.getElementById("chkIsRegex");
			var urlPattern = document.getElementById("urlPattern");

            var site = autopagerConfig.newSite(urlPattern.value,url
                ,linkXPath,contentXPath,[url]);
            site.createdByYou = true;
			site.isRegex = chkIsRegex.checked;
            site.owner = autopagerPref.loadMyName();
			site.guid=""
            while (site.owner.length == 0)
                site.owner = autopagerPref.changeMyName();
            //general link
            var targets = this.getXPathNodes(this.currentDoc,linkXPath);
            var target = targets[0];
//            if (target.tagName == "A" && target.hash!=null
//								&& target.hash.length>0 &&
//								target.onclick!=null && target.href.toLowerCase().indexOf("#") != -1)
//                site.ajax = true;

            //enable this by default for best compatibility
            site.enableJS = true;
            autopagerMain.testDoc(autopagerUtils.currentDocument(),site);

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

                  window.focus();
                  if (links.length>0)
                  {    
                    document.getElementById("xpath").value = links[0].xpath;
                    autopagerSidebar.searchXPath(links[0].xpath,document.getElementById("resultsFrame"),"status",autopagerSidebar.linkColor,false);
                  }
                  document.getElementById("xpath").focus();
                  document.getElementById("xpathDeck").selectedIndex = 0;

                
            })
			
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

                  window.focus();
                  if (links.length>0)
                  {    
                    document.getElementById("contentXPath").value = links[0].xpath;
                    autopagerSidebar.searchXPath(links[0].xpath,document.getElementById("resultsFrame2"),"status2",autopagerSidebar.contentColor,false);
                  }

                  document.getElementById("xpathDeck").selectedIndex = 0;
                  document.getElementById("contentXPath").focus();
                
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
        
//        document.getElementById("xpath").value = "";
//        document.getElementById("contentXPath").value = "";
        document.getElementById("xpathDeck").selectedIndex = 0;
		autopagerSelector.quit();
		autopagerHightlight.HideAll(autopagerSidebar.currentDoc);
    },
	changed: function(e)
	{
		if ((e.attrName == "hidden" && e.newValue == "true") ||
				(e.attrName == "src" && e.newValue != document.location.href))
			autopagerSidebar.quit();
    },
	quit: function()
	{
    window.removeEventListener("mouseover",autopagerSidebar.onMouseOver,false);
    window.removeEventListener("mouseout",autopagerSidebar.onMouseOut,false);

		var sidebar = window.top.document.getElementById("sidebar");
        autopagerMain.saveBoolPref("show-workshop-in-sidebar",sidebar!=null);
        if (sidebar)
        {
            sidebar.removeEventListener("DOMAttrModified",this.changed,false);

            //restore max-width
            autopagerSidebar.orgPriority = sidebar.style.setProperty  ("max-width",autopagerSidebar.maxWidth,autopagerSidebar.orgPriority);

            var sidebarBox = window.top.document.getElementById("sidebar-box");
            sidebarBox.removeEventListener("DOMAttrModified",this.changed,false);

            var sheets = window.top.document.styleSheets
            for(var i=0;i<sheets.length;i++)
            {
                    if('chrome://autopager/skin/autopager-toolbar.css' == sheets.item(i).href)
                    {
                            var sheet = sheets.item(i);
                            //sheet.insertRule("#sidebar-box { overflow-x: hidden !important;}",sheet.cssRules.length);
                            //sheet.insertRule("#sidebar {  min-width: 0px !important;    max-width: none !important;    overflow-x: hidden !important;}",sheet.cssRules.length);
                            sheet.deleteRule(sheet.cssRules.length-1)
                            sheet.deleteRule(sheet.cssRules.length-1)
                    }
            }
        }
		autopagerSelector.quit();
		autopagerHightlight.HideAll(autopagerSidebar.currentDoc);
		var workingAllSites = UpdateSites.loadAll();
		workingAllSites["testing.xml"]=null

//		var oldSmart = workingAllSites["smartpaging.xml"]
//		if (oldSmart!=null)
//			oldSmart.testing = false;
    }
};
autopagerUtils.log("loading window.js");

