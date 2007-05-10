    autoSites = loadConfig();
	
    var sites = cloneSites(autoSites);
    
    var listbox, urlPattern, description,lblOwner, chkEnabled, chkEnableJS,chkFixOverflow,btnAdd,btnCopy, btnDelete;
    var btnAddPath,btnEditPath,btnDeletePath;
    var mynameText,grpSmart,smarttext,smartlinks;
    var slectedListItem = null;;
    var margin,smartMargin;
    var selectedSite;
    var contentXPath;
	var xpath="";
	var siteSearch;
    
    window.addEventListener("load", function(ev) {
        loadControls();
		if (sites.length >= 0) {
            populateChooser();
            var index=0;
            var url = window.opener.autopagerSelectUrl;
	        if (url != null )
	        {
	          	index = getMatchedIndex(url);
	        }
	        chooseSite(index);
        }
    }, false);
    function getMatchedIndex(url)
    {
    	var index = -1;
		for(index=0; index<listbox.childNodes.length && 
				listbox.childNodes[index].site.urlPattern != url; ++index)
	    {
	    }
	    if(index>=sites.length)
	    {
		    for(index=0; index<listbox.childNodes.length && 
		          !(convert2RegExp(listbox.childNodes[index].site.urlPattern).test(url)); ++index)
		    {
		    }
	      	
	    }
        if(index>=listbox.childNodes.length)
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

		return true;
    }
    function onSiteChange(listitem,site)
    {
    	site.changedByYou = isChanged(site);
    	listitem.style.color = getColor(site);
    }
    function loadControls() {
        listbox = document.getElementById("lstSites");
        urlPattern = document.getElementById("urlPattern");
        margin = document.getElementById("margin");
        lblOwner = document.getElementById("lblOwner");
        description = document.getElementById("desc");
        btnAdd = document.getElementById("btnAdd");
        btnCopy = document.getElementById("btnCopy");
        btnDelete = document.getElementById("btnDelete");
        btnAddPath = document.getElementById("btnAddPath");
        btnEditPath = document.getElementById("btnEditPath");
        btnDeletePath = document.getElementById("btnDeletePath");
        contentXPath = document.getElementById("lstContentXPath");
        chkEnabled = document.getElementById("chkEnabled");
        chkEnableJS = document.getElementById("chkEnableJS");
        chkFixOverflow = document.getElementById("chkFixOverflow");
        linkXPath  = document.getElementById("linkXPath");
        siteSearch  = document.getElementById("siteSearch");
        
        mynameText = document.getElementById("myname");
        mynameText.value = loadMyName();

        smartenable = document.getElementById("smartenable");
        smartenable.checked = loadBoolPref("smartenable");

		grpSmart = document.getElementById("grpSmart");
		
		smarttext = document.getElementById("smarttext");
        smarttext.value = loadUTF8Pref("smarttext");
        
        smartlinks = document.getElementById("smartlinks");
        smartlinks.value = loadPref("smartlinks");
        
        smartMargin = document.getElementById("smartMargin");
        smartMargin.value = loadPref("smartMargin");
        
        enableSmartControl(smartenable.checked);
        
        listbox.addEventListener("select", updateDetails, false);
        listbox.filterIng=false;
        
        btnAdd.addEventListener("command", handleAddSiteButton, false);
        btnCopy.addEventListener("command", handleCopySiteButton, false);
        btnDelete.addEventListener("command", handleDeleteSiteButton, false);
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
           onSiteFilter(siteSearch.value);
        }, false);
        siteSearch.addEventListener("keyup", function() {
           onSiteFilter(siteSearch.value);
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
             listbox.childNodes[listbox.selectedIndex].label 
             		= selectedSite.urlPattern;
             onSiteChange(slectedListItem,selectedSite);
           }
        }, false);
        margin.addEventListener("change", function() {
           if (selectedSite != null) {
           	if (!isNumeric( margin.value))
           	{
           		alert(getString("inputnumber"));
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
		
		//var btnAddPath,btnEditPath,btnDeletePath;
        btnAddPath.addEventListener("command", function() {
           xpath = prompt(getString("inputxpath"),xpath);
           if (xpath!=null && xpath.length>0)
           {
           		addContentXPath(xpath);
           		onPathChange();
           }
        }, false);
        btnEditPath.addEventListener("command", function() {
			if (contentXPath.selectedCount > 0) {
            	listitm = contentXPath.getSelectedItem(0);
	    		xpath = listitm.label;
        		xpath = prompt(getString("inputxpath"),xpath);
           		if (xpath!=null && xpath.length>0)
           		{
           			listitm.label = (xpath);
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
            chkFixOverflow.checked = true;
            lblOwner.value = "";
    }
	function updateDetails() {
		if(listbox.filterIng)
			return;
    	if (listbox.selectedCount == 0) {
            clearInfo();
        }
        else {
        	slectedListItem = listbox.getSelectedItem(0);
            
        	selectedSite = slectedListItem.site;
			
            urlPattern.value = selectedSite.urlPattern;
            margin.value = selectedSite.margin;
            description.value = selectedSite.desc;
            chkEnabled.checked = selectedSite.enabled;
            chkEnableJS.checked = selectedSite.enableJS;
            chkFixOverflow.checked = selectedSite.fixOverflow;
            
            populateXPath(selectedSite.contentXPath);
            linkXPath.value    = selectedSite.linkXPath;
            lblOwner.value = selectedSite.owner;
            
        }
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
    			alert(getString("mustinputname"));
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
		sites.push(site);
		addSite(site);    
		chooseSite(getMatchedIndex(site.urlPattern));
	}
    function handleCopySiteButton() {
    	if (listbox.selectedCount > 0) {
    		var myname = checkMyName();
    		if (myname==null || myname.length == 0)
    			return;
    	
            selectedSite = listbox.getSelectedItem(0).site;
	    	var site = newSite(selectedSite.urlPattern,selectedSite.desc,
	    			selectedSite.linkXPath,selectedSite.contentXPath);
			site.createdByYou = true;
			site.owner = myname;
			sites.push(site);
			addSite(site);    
			chooseSite(listbox.childNodes.length-1);
		}
    }
	

    function handleDeleteSiteButton() {
        if (listbox.selectedCount > 0) {
        	var index = listbox.selectedIndex;
            selectedSite = listbox.getSelectedItem(0).site;
	    	//alert(index);
        	removeFromArray(sites,selectedSite);
        	listbox.removeChild(listbox.childNodes[index]);

        	if (listbox.childNodes.length > 0) {
            	chooseSite(Math.max(Math.min(index, listbox.childNodes.length - 1), 0));
        	}
        }
    }

    function onSiteFilter(filter)
    {
    	listbox.filterIng = true;
    	var url = urlPattern.value;
    	while(listbox.childNodes.length>0)
    	{
    		//remove from end
    		listbox.removeChild(listbox.childNodes[listbox.childNodes.length-1]);
    	}
    	if (filter.length == 0)
    	{
    		populateChooser();
    	}
    	else
    	{
	    	for (var i = 0; i < sites.length; i++) {
	        	var site = sites[i];
	        	if (site.urlPattern.toLowerCase().indexOf(filter) != -1
	        		|| site.desc.toLowerCase().indexOf(filter) != -1)
	        	{
	        		addSite(site);
	        	}
	        }
	    }
	    listbox.filterIng = false;
	    var index = getMatchedIndex(url);
	    //alert(listbox.childNodes.length);
	    if ( listbox.childNodes.length > 0)
	    	chooseSite(index);
	    else
	    {
	    	//alert("clear");
	    	clearInfo();
	    }
	    
    }

    function populateChooser() {

    	for (var i = 0; i < sites.length; i++) {
        	var site = sites[i];
        	addSite(site);    
        }
    }
    function addSite(site)
    {
    	selectedSite = null;
		var listitem = document.createElement("listitem");
		listitem.setAttribute("label", site.urlPattern);
        listitem.setAttribute("crop", "end");
        listitem.site = site;
        listitem.style.color = getColor(site);
        listbox.appendChild(listitem);
		//listitem.setAttribute("tooltiptext", 
		//	"created by " + selectedSite.owner + " for " + selectedSite.desc);
                
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
    	
        listbox.selectedIndex = index;
        listbox.focus();
    }
