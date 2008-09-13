    var allSites = null;
    var sites = null;
    var userModifiableTreeChildren=null;
    var treeSites,treebox, urlPattern,isRegex, description,lblOwner;
    var chkEnabled, chkEnableJS,chkAjax
    var chkFixOverflow,btnAdd,btnCopy, btnClone,btnDelete,btnPublic;
    var btnAddPath,btnEditPath,btnDeletePath,btnPickLinkPath;
    var btnUp,btnDown,btnSiteUp,btnSiteDown;
    var chkCtrl,chkAlt,chkShift,chkQuickLoad;
    var txtLoading,txtPagebreak,txtConfirmStyle,txtTimeout;
    var mnuUpdate;
    var linkXPath,containerXPath;

    var chkSettingEnabled,lbSettinglOwner,settingurl
    var settingtype,settingUpdatePeriod,settingxpath,settingdesc

    var selectedSource;
    
    var mynameText,grpSmart,smarttext,smartlinks,discoverytext,smartenable,showtags,alwaysEnableJavaScript,showPrompt;
    var slectedListItem = null;
    var margin,smartMargin;
    var selectedSite;
    var contentXPath;
    var xpath="";
    var siteSearch;

    var settingDeck;
    window.addEventListener("DOMContentLoaded", function(ev) {
        var self = arguments.callee;
        window.removeEventListener("DOMContentLoaded",self,false);
        loadControls();     
	{
            
            setTimeout(function (){
            populateChooser("",true);
            var url = window.opener.autopagerSelectUrl;
            //window.autopagerSelectUrl = url;
            if (url != null )
            {
                    var index = getMatchedIndex(url);
        	        chooseSite(index);
            }else
                chooseSite(0);
            },60);
            
//	        
//	        if (url != null )
//	        {
//                    window.autopagerSelectUrl = url;
//                    //window.addEventListener("focus", function(ev) 
//                    {
//                        var self = arguments.callee;
//                        window.removeEventListener("focus",self,false);

//                    }
//                    //,false);
//	        }
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
                          if (treerow.site != null && autopagerMain.getRegExp(treerow.site).test(url))
                              return index;
		    }
	      	
	    }
        if(index>=treeSites.view.rowCount)
        	 index =0;
	    return index;
    }

    function handleOkButton() {
       	autopagerConfig.saveConfig(sites);      
        //autopagerConfig.autoSites = autopagerConfig.loadConfig();

	autopagerMain.saveMyName(mynameText.value);
        autopagerMain.saveBoolPref("smartenable",smartenable.checked);
	autopagerMain.saveUTF8Pref("smarttext",smarttext.value);
        autopagerMain.savePref("smartlinks",smartlinks.value);
	autopagerMain.savePref("smartMargin",smartMargin.value);

        autopagerMain.savePref("discoverytext",discoverytext.value);
        autopagerMain.saveBoolPref("showtags",showtags.checked);
        autopagerMain.saveBoolPref("alwaysEnableJavaScript",alwaysEnableJavaScript.checked);
        autopagerMain.saveBoolPref("noprompt",!showPrompt.checked);
        
        
	        
		//autopagerMain.savePref("timeout",txtTimeout.value);
         autopagerMain.setCtrlKey(chkCtrl.checked);
         autopagerMain.setAltKey(chkAlt.checked );
         autopagerMain.setShiftKey(chkShift.checked);
         autopagerMain.setLoadingStyle(txtLoading.value);
         autopagerMain.saveUTF8Pref("pagebreak",txtPagebreak.value);
         autopagerMain.saveUTF8Pref("optionstyle",txtConfirmStyle.value);
         autopagerMain.savePref("update",mnuUpdate.value);
         
         AutoPagerUpdateTypes.saveAllSettingSiteConfig();
         
//        // Step 1: Create new event which has detail of the command.
//        var newCmdEvent = document.createEvent('Events');
//        newCmdEvent.initEvent('AutoPagerRefreshPage',true, true);         
//        var newEvent = document.createEvent('XULCommandEvents');
//        newEvent.initCommandEvent('AutoPagerRefreshPage', true, true,window.opener, 0, false, false, false, false,  newCmdEvent);
//        window.opener.document.dispatchEvent(newEvent);
//        //         autopagerMain.onContentLoad(parentWindow.gBrowser.contentDocument);

          if (window.opener.getBrowser)
            window.opener.getBrowser().contentDocument.location.reload();
          else if (window.opener.gBrowser)
              window.opener.gBrowser.contentDocument.location.reload();
        return true;
    }
    function onSiteChange(treeitem,site)
    {
    	site.changedByYou = autopagerConfig.isChanged(site);
        var treerow = treeitem.childNodes[0];
        var treecell = treerow.childNodes[0];
        treecell.setAttribute("properties","status" + getColor(site));
        treecell = treerow.childNodes[1];
        treecell.setAttribute("properties","status" + getColor(site));

    }
    function onSourceChange(treeitem,site)
    {
    	site.changedByYou = autopagerConfig.isChanged(site);
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
        chkAjax = document.getElementById("chkAjax");
        chkQuickLoad = document.getElementById("chkQuickLoad");
        chkFixOverflow = document.getElementById("chkFixOverflow");
        linkXPath  = document.getElementById("linkXPath");
        containerXPath  = document.getElementById("containerXPath");
        btnPickLinkPath  = document.getElementById("pickLinkPath");
        
        settingDeck = document.getElementById("settingDeck");
        
        siteSearch  = document.getElementById("siteSearch");
        
        chkSettingEnabled = document.getElementById("chkSettingEnabled");
        lbSettinglOwner = document.getElementById("lbSettinglOwner");
        settingurl = document.getElementById("settingurl");
        settingtype = document.getElementById("settingtype");
        settingUpdatePeriod = document.getElementById("settingUpdatePeriod");
        settingxpath = document.getElementById("settingxpath");
        settingdesc  = document.getElementById("settingdesc");
        
        mynameText = document.getElementById("myname");
        mynameText.value = autopagerMain.loadMyName();
        txtLoading = document.getElementById("loading");
        txtLoading.value = autopagerMain.getLoadingStyle();
        mnuUpdate = document.getElementById("updatePeriod");
        mnuUpdate.value = autopagerMain.loadPref("update");
        txtPagebreak = document.getElementById("pagebreak");
        txtPagebreak.value = autopagerMain.loadUTF8Pref("pagebreak");
        
        txtConfirmStyle = document.getElementById("confirm");
        txtConfirmStyle.value = autopagerMain.loadUTF8Pref("optionstyle");
        //var chkCtrl,chkAlt,chkShift;
        chkCtrl = document.getElementById("chkCtrl");
        chkAlt = document.getElementById("chkAlt");
        chkShift = document.getElementById("chkShift");
        chkCtrl.checked = autopagerMain.getCtrlKey();
        chkAlt.checked = autopagerMain.getAltKey();
        chkShift.checked = autopagerMain.getShiftKey();
        
        showtags = document.getElementById("showtags");
        showtags.checked = autopagerMain.loadBoolPref("showtags");
        
        alwaysEnableJavaScript = document.getElementById("alwaysEnableJavaScript");
        alwaysEnableJavaScript.checked = autopagerMain.loadBoolPref("alwaysEnableJavaScript");
        
        showPrompt = document.getElementById("showPrompt");
        showPrompt.checked = !autopagerMain.loadBoolPref("noprompt");
        
        smartenable = document.getElementById("smartenable");
        smartenable.checked = autopagerMain.loadBoolPref("smartenable");

		grpSmart = document.getElementById("grpSmart");
		
		smarttext = document.getElementById("smarttext");
        smarttext.value = autopagerMain.loadUTF8Pref("smarttext");
        
        smartlinks = document.getElementById("smartlinks");
        smartlinks.value = autopagerMain.loadPref("smartlinks");
        
        discoverytext = document.getElementById("discoverytext");
        discoverytext.value = autopagerMain.loadPref("discoverytext");
        
        smartMargin = document.getElementById("smartMargin");
        smartMargin.value = autopagerMain.loadPref("smartMargin");
        
        //txtTimeout = document.getElementById("timeout");
        //txtTimeout.value = autopagerMain.loadPref("timeout");

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
        
        chkSettingEnabled.addEventListener("command", function() {
           if (selectedSource != null) {
             selectedSource.enabled = chkSettingEnabled.checked;
             onSourceChange(slectedListItem,selectedSource);
           }
        }, false);
        
        settingtype.addEventListener("command", function() {
           if (selectedSource != null) {
             selectedSource.updateType = AutoPagerUpdateTypes.getType( settingtype.value);
             onSourceChange(slectedListItem,selectedSource);
           }
        }, false);
        settingUpdatePeriod.addEventListener("command", function() {
           if (selectedSource != null) {
             selectedSource.updateperiod = settingUpdatePeriod.value;
             onSourceChange(slectedListItem,selectedSource);
           }
        }, false);

        lbSettinglOwner.addEventListener("change", function() {
           if (selectedSite != null) {
             selectedSite.owner = lbSettinglOwner.value;
             onSiteChange(slectedListItem,selectedSite);
           }
        }, false);
        settingurl.addEventListener("change", function() {
           if (selectedSite != null) {
             selectedSite.url = settingurl.value;
             onSiteChange(slectedListItem,selectedSite);
           }
        }, false);
        settingxpath.addEventListener("change", function() {
           if (selectedSite != null) {
             selectedSite.xpath = settingxpath.value;
             onSiteChange(slectedListItem,selectedSite);
           }
        }, false);

        settingdesc.addEventListener("change", function() {
           if (selectedSite != null) {
             selectedSite.desc = settingdesc.value;
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
        chkAjax.addEventListener("command", function() {
           if (selectedSite != null) {
             selectedSite.ajax = chkAjax.checked;
             if (selectedSite.ajax)
                 chkEnableJS.checked = true;
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
        containerXPath.addEventListener("change", function() {
           if (selectedSite != null) {
             selectedSite.containerXPath = containerXPath.value;
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
             selectedSite.regex=null;
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
           	if (!autopagerConfig.isNumeric( margin.value))
           	{
           		alert(autopagerConfig.autopagerGetString("inputnumber"));
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
           xpath = prompt(autopagerConfig.autopagerGetString("inputxpath"),xpath);
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
                            xpath = prompt(autopagerConfig.autopagerGetString("inputxpath"),xpath);
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
            chkAjax.checked = false;
            chkQuickLoad.checked = false;
            chkFixOverflow.checked = true;
            lblOwner.value = "";
            btnClone.hidden = true;
    }
    function updateSourceDetail(updateSite)
    {
        selectedSource = updateSite
        chkSettingEnabled.checked = updateSite.enabled;
        lbSettinglOwner.value = updateSite.owner;
        settingurl.value = updateSite.url;
        settingtype.value = updateSite.updateType.type;
        settingUpdatePeriod.value = updateSite.updateperiod;
        settingxpath.value = updateSite.xpath;
        settingdesc.value =  updateSite.desc;
        
        var readOnly = updateSite.defaulted;
        chkSettingEnabled.readOnly = readOnly;
        lbSettinglOwner.readOnly = readOnly;
        settingurl.readOnly = readOnly;
        settingtype.disabled = readOnly;
        //settingUpdatePeriod.disabled = readOnly;
        settingxpath.readOnly = readOnly;
        settingdesc.readOnly = readOnly;
        
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
                   switchDeck(1);
                   updateSourceDetail(slectedListItem.updateSite);
                   enableSiteEditControls(false);
                   clearInfo();
                   return;
               }
               switchDeck(0);
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
                chkAjax.checked = selectedSite.ajax
                chkQuickLoad.checked = selectedSite.quickLoad;
                chkFixOverflow.checked = selectedSite.fixOverflow;

                populateXPath(selectedSite.contentXPath);
                linkXPath.value    = selectedSite.linkXPath;
                containerXPath.value    = selectedSite.containerXPath;
                lblOwner.value = selectedSite.owner;
            
        }
    }
    function switchDeck(index)
    {
        settingDeck.selectedIndex = index;
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
        chkAjax.disabled =disabled;
        chkQuickLoad.disabled =disabled;
        chkFixOverflow.disabled =disabled;
        linkXPath.readOnly =disabled;
        containerXPath.readOnly =disabled;
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
    		myname = autopagerMain.changeMyName();
    		if (myname==null || myname.length == 0)
    		{
    			alert(autopagerConfig.autopagerGetString("mustinput"));
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
    		
        var site = autopagerConfig.newSite("http://yourhost/*","your desc"
  				,"//a[contains(.//text(),'Next')]","//body/*");
		site.createdByYou = true;
		site.owner = myname;
		addSite(site,sites.length -1);
                autopagerConfig.insertAt(sites,0,site);
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
            var site = autopagerConfig.cloneSite(selectedSite);
            
            autopagerConfig.insertAt(sites,0,site);
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
                    file = autopagerConfig.selectFile(autopagerConfig.autopagerGetString("outputfile"),Components.interfaces.nsIFilePicker.modeSave);
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
                     autopagerConfig.saveConfigToFile(exportSites,file,false);
                      if (exportToClipboard)
                      {
                          var contentStr = autopagerConfig.autopagerGetContents(Components.classes["@mozilla.org/network/io-service;1"]
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
               autopagerConfig.removeFromArray(sites,treeitem.site);
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
            sites = autopagerConfig.cloneSites(userSites);
            sites.updateSite = userSites.updateSite;
            allSites["autopager.xml"] = sites;
                
         }
        else
            userSites = allSites["autopager.xml"] ;

        var key;
        for ( key in allSites){
            if (key=="smartpaging.xml")
                continue;
                    tmpsites = allSites[key];
                    var treechildren = addTreeParent(treebox,tmpsites.updateSite);
                    if (userSites.updateSite == tmpsites.updateSite)
                        userModifiableTreeChildren = treechildren;
                    for (var i = 0; i < tmpsites.length; i++) {
                            var site = tmpsites[i];
                            if (filter == "" ||( site.urlPattern.toLowerCase().indexOf(filter) != -1
	        		||  (site.desc != null && site.desc.toLowerCase().indexOf(filter) != -1)))
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
