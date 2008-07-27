    var allSites = null;
    var sites = null;
    var userModifiableTreeChildren=null;
    var treeSites,treebox, urlPattern,isRegex, description,lblOwner;
    var chkEnabled, chkEnableJS,chkFixOverflow,btnAdd,btnCopy, btnClone,btnDelete,btnPublic;
    var btnAddPath,btnEditPath,btnDeletePath,btnPickLinkPath;
    var btnUp,btnDown,btnSiteUp,btnSiteDown;
    var chkCtrl,chkAlt,chkShift,chkQuickLoad;
    var txtLoading,txtPagebreak,txtConfirmStyle,txtTimeout;
    var mnuUpdate;

    var mynameText,grpSmart,smarttext,smartlinks,discoverytext,smartenable,showtags,alwaysEnableJavaScript;
    var slectedListItem = null;;
    var margin,smartMargin;
    var selectedSite;
    var contentXPath;
	var xpath="";
	var siteSearch;
    
    window.addEventListener("DOMContentLoaded", function(ev) {
        var self = arguments.callee;
        window.removeEventListener("DOMContentLoaded",self,false);
        loadControls();
	 {
            populateChooser("",true);
            chooseSite(0);
            var url = window.opener.autopagerSelectUrl;
	        if (url != null )
	        {
                    window.autopagerSelectUrl = url;
                    //window.addEventListener("focus", function(ev) 
                    {
                        var self = arguments.callee;
                        window.removeEventListener("focus",self,false);
	          	var index = getMatchedIndex(window.autopagerSelectUrl);
        	        chooseSite(index);
                    }
                    //,false);
	        }
        }
    }, false);
    function getMatchedIndex(url)
    {
    	var index = -1;
		for(index=0; index<treeSites.view.rowCount; ++index)
	    {
		  var treerow = treeSites.view.getItemAtIndex(index);
                  if (treerow.site != null && treerow.site.urlPattern == url)
                      return index;
	    }
	    if(index>=treeSites.view.rowCount)
	    {
		    for(index=0; index<treeSites.view.rowCount; ++index)
		    {
                          var treerow = treeSites.view.getItemAtIndex(index);
                          if (treerow.site != null && getRegExp(treerow.site).test(url))
                              return index;
		    }
	      	
	    }
        if(index>=treeSites.view.rowCount)
        	 index =0;
	    return index;
    }

    function handleOkButton() {
       	saveConfig(sites);
		autoSites = loadConfig();

	saveMyName(mynameText.value);
        saveBoolPref("smartenable",smartenable.checked);
	saveUTF8Pref("smarttext",smarttext.value);
        savePref("smartlinks",smartlinks.value);
	savePref("smartMargin",smartMargin.value);

        savePref("discoverytext",discoverytext.value);
        saveBoolPref("showtags",showtags.checked);
        saveBoolPref("alwaysEnableJavaScript",alwaysEnableJavaScript.checked);
        
	        
		//savePref("timeout",txtTimeout.value);
         setCtrlKey(chkCtrl.checked);
         setAltKey(chkAlt.checked );
         setShiftKey(chkShift.checked);
         setLoadingStyle(txtLoading.value);
         saveUTF8Pref("pagebreak",txtPagebreak.value);
         saveUTF8Pref("optionstyle",txtConfirmStyle.value);
         savePref("update",mnuUpdate.value);
         
		return true;
    }
    function onSiteChange(treeitem,site)
    {
    	site.changedByYou = isChanged(site);
        var treerow = treeitem.childNodes[0];
        var treecell = treerow.childNodes[0];
        treecell.setAttribute("properties","status" + getColor(site));
        treecell = treerow.childNodes[1];
        treecell.setAttribute("properties","status" + getColor(site));

    }
    function loadControls() {
        treeSites = document.getElementById("treeSites");
        treebox = document.getElementById("siteContents");
        urlPattern = document.getElementById("urlPattern");
        isRegex = document.getElementById("chkIsRegex");
        margin = document.getElementById("margin");
        lblOwner = document.getElementById("lblOwner");
        description = document.getElementById("desc");
        btnAdd = document.getElementById("btnAdd");
        btnCopy = document.getElementById("btnCopy");
        btnClone = document.getElementById("btnCloneToEdit");
        btnDelete = document.getElementById("btnDelete");
        btnPublic = document.getElementById("btnPublic");
        
        btnAddPath = document.getElementById("btnAddPath");
        btnEditPath = document.getElementById("btnEditPath");
        btnUp = document.getElementById("btnUp");
        btnDown = document.getElementById("btnDown");
        btnSiteUp = document.getElementById("btnSiteUp");
        btnSiteDown = document.getElementById("btnSiteDown");
        btnDeletePath = document.getElementById("btnDeletePath");
        contentXPath = document.getElementById("lstContentXPath");
        chkEnabled = document.getElementById("chkEnabled");
        chkEnableJS = document.getElementById("chkEnableJS");
        chkQuickLoad = document.getElementById("chkQuickLoad");
        chkFixOverflow = document.getElementById("chkFixOverflow");
        linkXPath  = document.getElementById("linkXPath");
        btnPickLinkPath  = document.getElementById("pickLinkPath");
        
        siteSearch  = document.getElementById("siteSearch");
        
        mynameText = document.getElementById("myname");
        mynameText.value = loadMyName();
        txtLoading = document.getElementById("loading");
        txtLoading.value = getLoadingStyle();
        mnuUpdate = document.getElementById("updatePeriod");
        mnuUpdate.value = loadPref("update");
        txtPagebreak = document.getElementById("pagebreak");
        txtPagebreak.value = loadUTF8Pref("pagebreak");
        
        txtConfirmStyle = document.getElementById("confirm");
        txtConfirmStyle.value = loadUTF8Pref("optionstyle");
        //var chkCtrl,chkAlt,chkShift;
        chkCtrl = document.getElementById("chkCtrl");
        chkAlt = document.getElementById("chkAlt");
        chkShift = document.getElementById("chkShift");
        chkCtrl.checked = getCtrlKey();
        chkAlt.checked = getAltKey();
        chkShift.checked = getShiftKey();
        
        showtags = document.getElementById("showtags");
        showtags.checked = loadBoolPref("showtags");
        
        alwaysEnableJavaScript = document.getElementById("alwaysEnableJavaScript");
        alwaysEnableJavaScript.checked = loadBoolPref("alwaysEnableJavaScript");
        
        smartenable = document.getElementById("smartenable");
        smartenable.checked = loadBoolPref("smartenable");

		grpSmart = document.getElementById("grpSmart");
		
		smarttext = document.getElementById("smarttext");
        smarttext.value = loadUTF8Pref("smarttext");
        
        smartlinks = document.getElementById("smartlinks");
        smartlinks.value = loadPref("smartlinks");
        
        discoverytext = document.getElementById("discoverytext");
        discoverytext.value = loadPref("discoverytext");
        
        smartMargin = document.getElementById("smartMargin");
        smartMargin.value = loadPref("smartMargin");
        
        //txtTimeout = document.getElementById("timeout");
        //txtTimeout.value = loadPref("timeout");

        enableSmartControl(smartenable.checked);
        
        treeSites.addEventListener("select", updateDetails, false);
        treeSites.filterIng=false;
        
        btnAdd.addEventListener("command", handleAddSiteButton, false);
        btnCopy.addEventListener("command", handleCopySiteButton, false);
        btnClone.addEventListener("command", handleCopySiteButton, false);
        btnDelete.addEventListener("command", handleDeleteSiteButton, false);
        btnPublic.addEventListener("command", handlePublicSiteButton, false);
        chkEnabled.addEventListener("command", function() {
           if (selectedSite != null) {
             selectedSite.enabled = chkEnabled.checked;
             onSiteChange(slectedListItem,selectedSite);
           }
        }, false);
        
        smartenable.addEventListener("command", function() {
           enableSmartControl(smartenable.checked);
        }, false);
        
        chkEnableJS.addEventListener("command", function() {
           if (selectedSite != null) {
             selectedSite.enableJS = chkEnableJS.checked;
             onSiteChange(slectedListItem,selectedSite);
           }
        }, false);
        chkQuickLoad.addEventListener("command", function() {
           if (selectedSite != null) {
             selectedSite.quickLoad = chkQuickLoad.checked;
             onSiteChange(slectedListItem,selectedSite);
           }
        }, false);
        chkFixOverflow.addEventListener("command", function() {
           if (selectedSite != null) {
             selectedSite.fixOverflow = chkFixOverflow.checked;
             onSiteChange(slectedListItem,selectedSite);
           }
        }, false);
        linkXPath.addEventListener("change", function() {
           if (selectedSite != null) {
             selectedSite.linkXPath = linkXPath.value;
             onSiteChange(slectedListItem,selectedSite);
           }
        }, false);
        siteSearch.addEventListener("change", function() {
           onSiteFilter(siteSearch.value,false);
        }, false);
        siteSearch.addEventListener("keyup", function() {
           onSiteFilter(siteSearch.value,false);
           siteSearch.focus();
        }, false);
        description.addEventListener("change", function() {
           if (selectedSite != null) {
             selectedSite.desc = description.value;
             onSiteChange(slectedListItem,selectedSite);
           }
        }, false);
        urlPattern.addEventListener("change", function() {
           if (selectedSite != null) {
           	
             selectedSite.urlPattern = urlPattern.value;
             var treerow = slectedListItem.childNodes[0];
             var treecell = treerow.childNodes[0];
             treecell.setAttribute("label",urlPattern.value);
             onSiteChange(slectedListItem,selectedSite);
           }
        }, false);
        isRegex.addEventListener("command", function() {
           if (selectedSite != null) {
           	
             selectedSite.isRegex = isRegex.checked;
             onSiteChange(slectedListItem,selectedSite);
           }
        }, false);
        margin.addEventListener("change", function() {
           if (selectedSite != null) {
           	if (!isNumeric( margin.value))
           	{
           		alert(autopagerGetString("inputnumber"));
           		margin.focus();
           		return;
           	}
             selectedSite.margin = margin.value;
             onSiteChange(slectedListItem,selectedSite);
           }
        }, false);
        contentXPath.addEventListener("change", function() {
           if (selectedSite != null) {
           	 onPathChange();
           }
        }, false);
		
        btnAddPath.addEventListener("command", function() {
           xpath = prompt(autopagerGetString("inputxpath"),xpath);
           if (xpath!=null && xpath.length>0)
           {
           		addContentXPath(xpath);
           		onPathChange();
           }
        }, false);
        btnSiteUp.addEventListener("command", function() {
           if (treeSites.currentIndex > 0) {
               var treeitem = treeSites.view.getItemAtIndex(treeSites.currentIndex);
               if (treeitem.updateSite != null)
                   return;
               var itemParent = treeitem.parentNode.parentNode;
               var updateSite = itemParent.updateSite;
               if (updateSite.url.length > 0)
                   return;
               //todo:notify users that he can't modify these online imported configurations
               if (treeitem.previousSibling == null || treeitem.previousSibling.localName.toLowerCase() != "treeitem")
                   return;
               var siteIndex = treeitem.siteIndex;
               var node = treeitem.previousSibling;
               treeitem.siteIndex = node.siteIndex;
               node.siteIndex = siteIndex;
               sites[node.siteIndex] = node.site;
               sites[treeitem.siteIndex] = treeitem.site;
               
               node.parentNode.insertBefore(treeitem,node);
               chooseTreeItem(treeitem);
           }
        }, false);
        btnSiteDown.addEventListener("command", function() {
           if (treeSites.currentIndex > 0) {
               var treeitem = treeSites.view.getItemAtIndex(treeSites.currentIndex);
               if (treeitem.updateSite != null)
                   return;
               var itemParent = treeitem.parentNode.parentNode;
               var updateSite = itemParent.updateSite;
               if (updateSite.url.length > 0)
                   return;
               //todo:notify users that he can't modify these online imported configurations
               if (treeitem.nextSibling == null || treeitem.nextSibling.localName.toLowerCase() != "treeitem")
                   return;
               var siteIndex = treeitem.siteIndex;
               var node = treeitem.nextSibling;
               treeitem.siteIndex = node.siteIndex;
               node.siteIndex = siteIndex;
               sites[node.siteIndex] = node.site;
               sites[treeitem.siteIndex] = treeitem.site;
               
               node.parentNode.insertBefore(node,treeitem);
               chooseTreeItem(treeitem);
           }
        }, false);
        btnUp.addEventListener("command", function() {
           if (contentXPath.selectedIndex > 0) {
               var treeitem = contentXPath.getSelectedItem(0);
               var path = treeitem.label;
               var newitem = contentXPath.childNodes[contentXPath.selectedIndex  -1];
               treeitem.label = newitem.label;
               newitem.label = path;
               contentXPath.selectedIndex = contentXPath.selectedIndex -1;
               onPathChange();
           }
        }, false);
        btnDown.addEventListener("command", function() {
           if (contentXPath.selectedIndex >= 0 && contentXPath.selectedIndex <contentXPath.childNodes.length-1 ) {
               var treeitem = contentXPath.getSelectedItem(0);
               var path = treeitem.label;
               var newitem = contentXPath.childNodes[contentXPath.selectedIndex  +1];
               treeitem.label = newitem.label;
               newitem.label = path;
               contentXPath.selectedIndex = contentXPath.selectedIndex +1;
               onPathChange();
           }
        }, false);
        btnEditPath.addEventListener("command", function() {
			if (contentXPath.selectedCount > 0) {
                            treeitem = contentXPath.getSelectedItem(0);
                            xpath = treeitem.label;
                            xpath = prompt(autopagerGetString("inputxpath"),xpath);
                            if (btnAddPath.disabled)
                                return;
                            if (xpath!=null && xpath.length>0)
                            {
                                    treeitem.label = xpath;
                                    onPathChange();
                            }
           	}
        }, false);
        btnDeletePath.addEventListener("command", function() {
			if (contentXPath.selectedCount > 0) {
				contentXPath.removeChild(contentXPath.childNodes[contentXPath.selectedIndex]);
				onPathChange();
           	}
        }, false);

    }
    function enableSmartControl(enabled)
    {
    	grpSmart.disabled = !enabled;
    	smarttext.disabled = !enabled;
		smartlinks.disabled = !enabled;
        smartMargin.disabled = !enabled;
    }
    function onPathChange()
    {
		if (selectedSite != null) {
           	 selectedSite.contentXPath = new Array();
           	 for(var i =0;i<contentXPath.childNodes.length;++i)
           	 {
             	selectedSite.contentXPath.push(contentXPath.childNodes[i].label);
           	 }
             onSiteChange(slectedListItem,selectedSite);
           }    	
    }
    function clearInfo()
    {
    	selectedSite = null;
            slectedListItem = null;
            urlPattern.value = " ";
            margin.value = "2";
            description.value = " ";
            chkEnabled.checked = true;
            chkEnableJS.checked = false;
            chkQuickLoad.checked = false;
            chkFixOverflow.checked = true;
            lblOwner.value = "";
            btnClone.hidden = true;
    }
	function updateDetails(event) {
            if(treeSites.filterIng)
			return;
            if (treeSites.view.selection.getRangeCount() == 0) {
                clearInfo();
            }
            else {
                
                slectedListItem = treeSites.view.getItemAtIndex (treeSites.currentIndex);
                var itemParent = slectedListItem.parentNode.parentNode;
               var updateSite = itemParent.updateSite;
               if (updateSite == null)
               {
                   enableSiteEditControls(false);
                   clearInfo();
                   return;
               }
               var enableEdit =  (updateSite.url.length == 0);
               if (enableEdit)
                    selectedSite = sites[slectedListItem.siteIndex];
                else
                    selectedSite = slectedListItem.site;
               
               enableSiteEditControls(enableEdit);
                if (selectedSite == null)
                {
                    slectedListItem = null;
                    return;
                }
                urlPattern.value = selectedSite.urlPattern;

                isRegex.checked = selectedSite.isRegex;
                margin.value = selectedSite.margin;
                description.value = selectedSite.desc;
                chkEnabled.checked = selectedSite.enabled;
                chkEnableJS.checked = selectedSite.enableJS;
                chkQuickLoad.checked = selectedSite.quickLoad;
                chkFixOverflow.checked = selectedSite.fixOverflow;

                populateXPath(selectedSite.contentXPath);
                linkXPath.value    = selectedSite.linkXPath;
                lblOwner.value = selectedSite.owner;
            
        }
    }
      function enableSiteEditControls(enableEdit)
      {
          var disabled = !enableEdit;
        urlPattern.readOnly =disabled;
        isRegex.disabled =disabled;
        margin.readOnly =disabled;
        description.readOnly =disabled;
        btnAddPath.disabled =disabled;
        //btnEditPath.disabled =disabled;
        btnDeletePath.disabled =disabled;
        btnUp.disabled =disabled;
        btnDown.disabled =disabled;
        btnSiteUp.disabled =disabled;
        btnSiteDown.disabled =disabled;
        btnDelete.disabled =disabled;
        btnPublic.disabled =disabled;
        contentXPath.readOnly =disabled;
        chkEnabled.disabled =disabled;
        chkEnableJS.disabled =disabled;
        chkQuickLoad.disabled =disabled;
        chkFixOverflow.disabled =disabled;
        linkXPath.readOnly =disabled;
        btnPickLinkPath.disabled = disabled;
        btnClone.hidden = enableEdit;
      }
	function populateXPath(paths)
	{
		//clear
		while (contentXPath.hasChildNodes()) {
        	contentXPath.removeChild(contentXPath.childNodes[0]);
        }
		for (var i = 0, path = null; (path = paths[i]); i++) {
	        addContentXPath( path);
		}
	}
	function addContentXPath(path)
	{
	    var listitem = document.createElement("listitem");
	    listitem.setAttribute("label", path);
	    contentXPath.appendChild(listitem);
	}
	function checkMyName()
	{
		var myname = mynameText.value;
    	if (myname==null || myname.length == 0)
    	{
    		myname = changeMyName();
    		if (myname==null || myname.length == 0)
    		{
    			alert(autopagerGetString("mustinput"));
    			return "";
    		}
    	}
    	mynameText.value = myname;
    	return myname;
	}
    function handleAddSiteButton() {
    	var myname = checkMyName();
    	if (myname==null || myname.length == 0)
    		return;
    		
        var site = newSite("http://yourhost/*","your desc"
  				,"//a[contains(.//text(),'Next')]","//body/*");
		site.createdByYou = true;
		site.owner = myname;
		addSite(site,sites.length -1);
                insertAt(sites,0,site);
                onSiteFilter(siteSearch.value,false);
	}
    function handleCopySiteButton() {
    	if (treeSites.currentIndex >= 0) {
            var myname = checkMyName();
            if (myname==null || myname.length == 0)
                    return;

            selectedSite = treeSites.view.getItemAtIndex(treeSites.currentIndex).site;
            if (selectedSite == null)
                return;
            var site = cloneSite(selectedSite);
            
            insertAt(sites,0,site);
            onSiteFilter(siteSearch.value,false);
        }
    }
	

    function exportSelectedSetting(exportToClipboard)
    {
        var exportSites = new Array();
        var start = new Object();
        var end = new Object();
        var numRanges = treeSites.view.selection.getRangeCount();

        for (var t = 0; t < numRanges; t++){
          treeSites.view.selection.getRangeAt(t,start,end);
          for (var v = start.value; v <= end.value; v++){
            var treeitem = treeSites.view.getItemAtIndex(v);
            if (treeitem.site != null)
                exportSites.push(treeitem.site);
          }
        }

            if (exportSites.length > 0) {
                var file = null;
                if (!exportToClipboard)
                    file = selectFile(autopagerGetString("outputfile"),Components.interfaces.nsIFilePicker.modeSave);
                else
                {
                    file = Components.classes["@mozilla.org/file/directory_service;1"]
                     .getService(Components.interfaces.nsIProperties)
                     .get("TmpD", Components.interfaces.nsIFile);
                    file.append("autopager.tmp");
                    file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0664);
                    // do whatever you need to the created file
                    //alert(file.path);
                }
                
                
                if (file)
                {
                     saveConfigToFile(exportSites,file,false);
                      if (exportToClipboard)
                      {
                          var contentStr = autopagerGetContents(Components.classes["@mozilla.org/network/io-service;1"]
                                            .getService(Components.interfaces.nsIIOService)
                                             .newFileURI(file));
                          
                          file.remove(true);
                          var gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].
                                    getService(Components.interfaces.nsIClipboardHelper);
                           gClipboardHelper.copyString(contentStr);
                      }
                 }
            }

    }
    function handlePublicSiteButton() {
        var start = new Object();
        var end = new Object();
        var numRanges = treeSites.view.selection.getRangeCount();
        var items = new Array();
        for (var t = 0; t < numRanges; t++){
          treeSites.view.selection.getRangeAt(t,start,end);
          for (var v = start.value; v <= end.value; v++){
              items.push(treeSites.view.getItemAtIndex(v));
          }
        }
        if (items.length ==0)
            return;
        //public the first one
        
        var treeitem = items[0];
        if (treeitem.updateSite != null)
          return;
        var site = sites[treeitem.siteIndex];
      
        window.autopagerPublicSite=site;
        //
        
        //var browser = window.open("http://localhost:8080/WebApplication1/");
        var browser = window.open("http://www.teesoft.info/component/option,com_autopager/Itemid,47/");


    }
    
    function handleDeleteSiteButton() {
        var start = new Object();
        var end = new Object();
        var numRanges = treeSites.view.selection.getRangeCount();
        var items = new Array();
        for (var t = 0; t < numRanges; t++){
          treeSites.view.selection.getRangeAt(t,start,end);
          for (var v = start.value; v <= end.value; v++){
              items.push(treeSites.view.getItemAtIndex(v));
          }
        }
        if (items.length ==0)
            return;
        var treeitem = items[items.length-1];
       var node = treeitem.nextSibling;
       if (node==null)
           node = treeitem.previousSibling;
       if (node==null)
           node = treeitem.parentNode.parentNode;
       for(var i=items.length-1;i>=0;i--)
       {
           var item = items[i];
            deleteItem(item);
       };
        chooseTreeItem(node);

    }
    function deleteItem(item)
    {
            {
               var treeitem = item;
               if (treeitem.updateSite != null)
                   return;
               var itemParent = treeitem.parentNode.parentNode;
               var updateSite = itemParent.updateSite;
               if (updateSite.url.length > 0)
                   return;
               //todo:notify users that he can't modify these online imported configurations
               var node = treeitem.nextSibling;
               if (node==null)
                   node = treeitem.previousSibling;
               if (node==null)
                   node = treeitem.parentNode.parentNode;
               //var site = treeitem.site;
               removeFromArrayByIndex(sites,treeitem.siteIndex);
               treeitem.parentNode.removeChild(treeitem);
           }

    }
    function onSiteFilter(filter,reload)
    {
    	treeSites.filterIng = true;
    	var url = urlPattern.value;
    	while(treebox.childNodes.length>0)
    	{
    		//remove from end
    		treebox.removeChild(treebox.childNodes[treebox.childNodes.length-1]);
    	}
        populateChooser(filter,reload);
    	treeSites.filterIng = false;
	    var index = getMatchedIndex(url);
	    if ( treeSites.view.rowCount > 0)
	    	chooseSite(index);
	    else
	    {
	    	//alert("clear");
	    	clearInfo();
	    }
	    
    }

    function addTreeParent(treebox,updateSite)
    {
            var treeitem = addNode(treebox,"treeitem");
            treeitem.updateSite = updateSite;
            
            treeitem.setAttribute("container", "true");
            treeitem.setAttribute("open","true");// (updateSite.url.length==0));
            var treerow = addNode(treeitem,"treerow");
            var treecell = addNode(treerow,"treecell");
            treecell.setAttribute("label", updateSite.filename);
            treecell = addNode(treerow,"treecell");
            treecell.setAttribute("label", updateSite.desc);
            return addNode(treeitem,"treechildren");
    }
    function addTreeItem(treebox,site,siteIndex)
    {
            var treeitem = addNode(treebox,"treeitem");
            var treerow = addNode(treeitem,"treerow");
            var treecell = addNode(treerow,"treecell");
            treecell.setAttribute("label", site.urlPattern);
            treecell.setAttribute("properties","status" + getColor(site));
            treecell = addNode(treerow,"treecell");
            treecell.setAttribute("label", site.desc);
            treecell.setAttribute("properties","status" + getColor(site));
 
            treeitem.site = site;
            treeitem.siteIndex = siteIndex;
            //treerow.setAttribute("properties","statusgreen");
            return treeitem;
    }
    function populateChooser(filter,reload) {

        var userSites = null;
        if(reload)
        {
            allSites = UpdateSites.loadAll();
            try{
                userSites = allSites["autopager.xml"] ;
            }catch(e)
            {
            }
            if (userSites == null)
                userSites = new Array();
            sites = cloneSites(userSites);
            sites.updateSite = userSites.updateSite;
            allSites["autopager.xml"] = sites;
                
         }
        else
            userSites = allSites["autopager.xml"] ;

        var key;
        for ( key in allSites){
                    tmpsites = allSites[key];
                    var treechildren = addTreeParent(treebox,tmpsites.updateSite);
                    if (userSites.updateSite == tmpsites.updateSite)
                        userModifiableTreeChildren = treechildren;
                    for (var i = 0; i < tmpsites.length; i++) {
                            var site = tmpsites[i];
                            if (site.urlPattern.toLowerCase().indexOf(filter) != -1
	        		|| site.desc.toLowerCase().indexOf(filter) != -1)
                                addTreeItem(treechildren,site,i);    
                    }
            };
    }
    function addNode(pNode,name)
    {
            var node = document.createElement(name);
            pNode.appendChild(node);
            return node;
    }
    function addSite(site,siteIndex)
    {
        var treebox = userModifiableTreeChildren;
        var addedItem = addTreeItem(treebox,site,siteIndex);
        chooseTreeItem(addedItem);
     }
	function getColor(site)
	{	var color='';
		if (!site.enabled) {
            color = 'gray';
        }else if(site.createdByYou)
        {
        	color = "green";
        }else if(site.changedByYou)
        {
        	color = "blue";
        }
        return color;
	}
    function chooseSite(index) {
        //treeSites.boxObject.ensureRowIsVisible(index);
        var boxobject = treeSites.boxObject;
        boxobject.QueryInterface(Components.interfaces.nsITreeBoxObject);
        //boxobject.scrollToRow(index);
        boxobject.ensureRowIsVisible(index);
        treeSites.view.selection.select(index);
        treeSites.focus();
    }
    function chooseTreeItem(treeitem) {
        var index = treeSites.view.getIndexOfItem(treeitem);
        chooseSite(index);
    }
