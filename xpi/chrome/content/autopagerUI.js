    autoSites = loadConfig();
	
    var sites = cloneSites(autoSites);
    
    var listbox, urlPattern, description,lblOwner, chkEnabled, chkEnableJS,btnAdd,btnCopy, btnDelete;
    var btnAddPath,btnEditPath,btnDeletePath;
    var slectedListItem = null;;
    var margin;
    var selectedSite;
    var contentXPath;
	var xpath="";
    
    window.addEventListener("load", function(ev) {
        loadControls();
		if (sites.length >= 0) {
            populateChooser();
            chooseSite(0);
        }
    }, false);

    function handleOkButton() {
       	saveConfig(sites);
		autoSites = loadConfig();
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
        linkXPath  = document.getElementById("linkXPath");
        
        listbox.addEventListener("select", updateDetails, false);
        btnAdd.addEventListener("command", handleAddSiteButton, false);
        btnCopy.addEventListener("command", handleCopySiteButton, false);
        btnDelete.addEventListener("command", handleDeleteSiteButton, false);
        chkEnabled.addEventListener("command", function() {
           if (selectedSite) {
             selectedSite.enabled = chkEnabled.checked;
             onSiteChange(slectedListItem,selectedSite);
           }
        }, false);
        chkEnableJS.addEventListener("command", function() {
           if (selectedSite) {
             selectedSite.enableJS = chkEnableJS.checked;
             onSiteChange(slectedListItem,selectedSite);
           }
        }, false);
        linkXPath.addEventListener("change", function() {
           if (selectedSite) {
             selectedSite.linkXPath = linkXPath.value;
             onSiteChange(slectedListItem,selectedSite);
           }
        }, false);
        description.addEventListener("change", function() {
           if (selectedSite) {
             selectedSite.desc = description.value;
             onSiteChange(slectedListItem,selectedSite);
           }
        }, false);
        urlPattern.addEventListener("change", function() {
           if (selectedSite) {
           	
             selectedSite.urlPattern = urlPattern.value;
             listbox.childNodes[listbox.selectedIndex].label 
             		= selectedSite.urlPattern;
             onSiteChange(slectedListItem,selectedSite);
           }
        }, false);
        margin.addEventListener("change", function() {
           if (selectedSite) {
           	if (!isNumeric( margin.value))
           	{
           		alert(getString("inputnumber"));
           		margin.focus();
           		return;
           	}
             selectedSite.margin = margin.value;
             listbox.childNodes[listbox.selectedIndex].label 
             		= selectedSite.margin;
             onSiteChange(slectedListItem,selectedSite);
           }
        }, false);
        contentXPath.addEventListener("change", function() {
           if (selectedSite) {
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
    function onPathChange()
    {
		if (selectedSite) {
           	 selectedSite.contentXPath = new Array();
           	 for(var i =0;i<contentXPath.childNodes.length;++i)
           	 {
             	selectedSite.contentXPath.push(contentXPath.childNodes[i].label);
           	 }
             onSiteChange(slectedListItem,selectedSite);
           }    	
    }
	function updateDetails() {
    	if (listbox.selectedCount == 0) {
            selectedSite = null;
            slectedListItem = null;
            urlPattern.textContent = " ";
            margin.textContent = "1.5";
            description.textContent = " ";
            chkEnabled.checked = true;
            chkEnableJS.checked = true;
            lblOwner.value = "";
        }
        else {
        	slectedListItem = listbox.getSelectedItem(0);
            
        	selectedSite = slectedListItem.site;
			
            urlPattern.value = selectedSite.urlPattern;
            margin.value = selectedSite.margin;
            description.value = selectedSite.desc;
            chkEnabled.checked = selectedSite.enabled;
            chkEnableJS.checked = selectedSite.enableJS;
            
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
		var myname = loadMyName();
    	if (myname==null || myname.length == 0)
    	{
    		myname = changeMyName();
    		if (myname==null || myname.length == 0)
    		{
    			alert(getString("mustinputname"));
    			return "";
    		}
    	}
    	return myname;
	}
    function handleAddSiteButton() {
    	var myname = checkMyName();
    	if (myname==null || myname.length == 0)
    		return;
    		
        var site = newSite("http://yourhost/*","your desc"
  				,"//a[contains(.//text(),'Next')]","//body/*[position() != last()]");
		site.createdByYou = true;
		site.owner = myname;
		sites.push(site);
		addSite(site);    
		chooseSite(sites.length-1);
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
			chooseSite(sites.length-1);
		}
    }
	

    function handleDeleteSiteButton() {
        if (listbox.selectedCount > 0) {
        	var index = listbox.selectedIndex;
            selectedSite = listbox.getSelectedItem(0).site;
	    	//alert(index);
        	removeFromArray(sites,index);
        	listbox.removeChild(listbox.childNodes[index]);

        	if (listbox.childNodes.length > 0) {
            	chooseSite(Math.max(Math.min(index, listbox.childNodes.length - 1), 0));
        	}
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
