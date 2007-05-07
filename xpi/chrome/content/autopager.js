/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is AutoPager code.
 *
 * The Initial Developer of the AutoPager is
 * Wind Li
 * Portions created by the Initial Developer are Copyright (C) 2007
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either of the GNU General Public License Version 2 or later (the "GPL"),
 * or the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */
var easy = false;
autopagerOnLoad();
var autopagerPrefs = null;
var debug= false;
function autopagerOnLoad() {
	// listen for tab switches
	window.addEventListener("load", onPageLoad, true);
	window.addEventListener("select", onSelect, false);
	
};

function sitewizard()
{
	alert(getString("selectlinkxpath"));
	document.autopagerXPathModel = "wizard";
	var doc = _content.document;
	if(!doc.autoPagerSelectorEnabled)
		enableSelector(doc,true);
}
function createXpath()
{
	document.autopagerXPathModel = "test";
	enableSelector(_content.document,true);
}
function enableSelector(doc,setMenuStatus)
{
	//alert(doc);
	if (doc.autoPagerSelectorEnabled)
	{
		doc.removeEventListener("mouseover", onXPathMouseOver, false);
		doc.autoPagerSelectorEnabled = false;
	}else
	{
		doc.addEventListener("mouseover", onXPathMouseOver, false);
		doc.autoPagerSelectorEnabled = true;
	}
	if (setMenuStatus)
	{
		document.getElementById("autoPagerCreateXPath").setAttribute ("checked", doc.autoPagerSelectorEnabled);
	}
	if (doc.defaultView.frames != null)
	{
		//alert(doc.defaultView.frames.length);
		var i=0;
		for(i=0;i<doc.defaultView.frames.length;++i)
		{
			enableSelector(doc.defaultView.frames[i].document,false);
		}
	}
};


function onPageLoad(event) {
	autoSites = loadConfig();
	
	//var target = event.target;
	//if(target != event.currentTarget)
	//	return false;
	//alert(event.target);
	//alert(event.currentTarget);
	//alert(event.originalTarget );
	if (!document.autoPagerInited)
	{
		document.autoPagerInited = true;
		setGlobalEnabled(loadEnableStat());

			
	}
	setGlobalImageByStatus(getGlobalEnabled());
	document.getElementById("autoPagerCreateXPath").setAttribute ("checked", false);	
	var doc = event.originalTarget;
	var url;
	try{
		url = doc.location.href;
	}catch(e)
	{
		//alert(e);
		doc = doc.ownerDocument;
		url = doc.location.href;
	}
	if (doc == null)
		return;
	//alert(url);
	
	onInitDoc(doc);
	if (doc.defaultView.frames != null)
	{
		//alert(doc.defaultView.frames.length);
		var i=0;
		for(i=0;i<doc.defaultView.frames.length;++i)
		{
			//alert(doc.defaultView.frames[i]);
			onInitDoc(doc.defaultView.frames[i].document);
			//doc.defaultView.frames[i].addEventListener("load", onPageLoad, true);
		}
	}
}

function getPrefs()
{
	if (autopagerPrefs == null)
	{
		autopagerPrefs = Components.classes["@mozilla.org/preferences-service;1"].
      		getService(Components.interfaces.nsIPrefService).getBranch("autopager");
		
	}
	return autopagerPrefs;
}

function onInitDoc(doc) {
	try{
		debug=getPrefs().getBoolPref(".debug");
	}catch(e)
	{
		alert(e);
	}
	if(doc.body.attachEvent){
      doc.body.attachEvent(
        'ondblclick',function(){
        	setGlobalEnabled(!getGlobalEnabled());
        }
      );
    }else{
      doc.body.addEventListener(
        'dblclick',function(){
        	setGlobalEnabled(!getGlobalEnabled());
        },true
      );
    }	
	var url = doc.location.href;
	var i=0;
	for(i=0;i<autoSites.length;++i)
	{
		var pattern = convert2RegExp(autoSites[i].urlPattern);
      	if (pattern.test(url)) {
      		var msg="";
      		var info = "";
      		if (getGlobalEnabled())
      		{
	      		msg = formatString("enableurl",[ url ]);
	      		info = formatString("enableinfo",[url,autoSites[i].linkXPath,autoSites[i].contentXPath]);
      		}
      		else
      		{
      			msg = formatString("globaldisabled",[url]);
      			info = msg;
      		}
      		logInfo(msg, info);
			
		    if (!doc.autoPagerRunning)
		    {
		    	var insertPoint = null;
				var nextUrl = null;

				doc.autoPagerRunning = true;
				var oldNodes = findNodeInDoc(doc.documentElement,autoSites[i].contentXPath);
				
				doc.contentXPath = autoSites[i].contentXPath;
				doc.margin = autoSites[i].margin;
				doc.linkXPath = autoSites[i].linkXPath;
				doc.enabled = autoSites[i].enabled;
				doc.enableJS = autoSites[i].enableJS;
				
				if (oldNodes!= null && oldNodes.length >0)
					insertPoint = oldNodes[oldNodes.length - 1].nextSibling;
				if(insertPoint == null)
					insertPoint = getLastDiv(doc);
				//alert(oldNodes[oldNodes.length - 1]);
				if (debug)
					logInfo(insertPoint, "go");
				var urlNodes = findNodeInDoc(doc.documentElement,doc.linkXPath);
			  	//alert(urlNodes);
				if (urlNodes != null && urlNodes.length >0)
				{
					nextUrl = fixUrl(doc,urlNodes[0].href);
				}else
					nextUrl = null;
				//alert(insertPoint);
				//alert(nextUrl);
				doc.autopagerEnabled = (insertPoint != null) && (nextUrl != null) && doc.enabled;
				//alert(doc.autopagerEnabled);
				doc.autoPagerPage = 1;
				doc.autopagerinsertPoint = insertPoint;
				doc.autopagernextUrl = nextUrl;
				//alert(doc.autopagerEnabled);
				if (doc.autopagerEnabled)
				{
					if (!_content.document.autopagerEnabledDoc)
						_content.document.autopagerEnabledDoc = new Array();
					_content.document.autopagerEnabledDoc[_content.document.autopagerEnabledDoc.length] = doc;
					if (!_content.document.autopagerWatcherRunning)
					{
						_content.document.autopagerWatcherRunning = true;
						scrollWatcher();
					}
				}
	      	  	return true;
		    }
      	}
    }
	
};
function onSelect(event) {
	if (!_content.document.pagerInited)
	{
	  	if (_content.document.autopagerEnabledDoc.length >0)
	  	{
	  		scrollWatcher();
	  	}
	  	document.getElementById("autoPagerCreateXPath").setAttribute ("checked", doc.autoPagerSelectorEnabled);
	}    
};
function init_autopager(doc)
{
	doc.addEventListener("mouseover", onXPathMouseOver, false);
	var index;
	for(index = 0; index <doc.documentElement.childNodes;++index)
	{
		var node = doc.documentElement.childNodes[index];
		
		//node.addEventListener("mouseover", onmouseover, false);
		//node.addEventListener("mouseclick", onmouseover, false);
	}
};
  function do_request (doc){
  	var nextUrl = doc.autopagernextUrl;
  	if (nextUrl != null && nextUrl.length >0)
  	{
  		onStartPaging(doc);
		parserUrl(doc,nextUrl);
  	}
  };

    function getEnabled(doc)
  {
	var enabled =doc.autopagerEnabled && getGlobalEnabled();
	return  enabled;
  };
  var count=0;
  function  scrollWatcher()
  {
  	var i =0;
  	if (debug)
  		logInfo(count,"Enter scrollWatcher");
  	for(i=0;i<_content.document.autopagerEnabledDoc.length;i++)
  	{
  		doc = content.document.autopagerEnabledDoc[i];
    	var Enable = getEnabled(doc);
	    if (Enable)
	    {
		    try{
		    	var scroolDoc =doc; 
		    	
		  	  var sc = (scroolDoc.documentElement && scroolDoc.documentElement.scrollTop)
		  	  				? scroolDoc.documentElement.scrollTop : scroolDoc.body.scrollTop;
		  	  var sh = (scroolDoc.documentElement && scroolDoc.documentElement.scrollHeight)
		  	  				? scroolDoc.documentElement.scrollHeight : scroolDoc.body.scrollHeight;
		  	  
		      var wh = window.innerHeight ? window.innerHeight : scroolDoc.documentElement.clientHeight;
		      var remain = sh - sc - wh;
		      // window.status = remain;
		      count++;
		      if (debug)
       		  	logInfo(count + ": Auto pager wh:" + wh+ " sc:" + sc + " remain: " + remain, "Auto pager remain: " + remain + ".\nremain < " + wh+" will auto page.");

		      //alert(wh);
       		  	if (debug)
       		  		wh = wh * (doc.margin*1 + 1.5);
       		  	else
       		  		wh = wh * (doc.margin * 1);
       		  //alert(wh);
       		  	
		      if(remain < wh ){
		        doc.autopagerEnabled = false;
		        do_request(doc)
		      }
		    }catch(e){
		    	alert("Exception:" + e);
		    }
		}
	}
	var self = arguments.callee;
	setTimeout(self,1000);
	
};

function onXPathMouseOver(event) {
	var target = event.target;
    if (target == null)
    	target = event.explicitTarget;

    if(target.tagName=="BODY"||target.tagName=="HTML" 
    	||(target.offsetHeight<10&&target.offsetWidth<10)) {
        return true;
    }
    if (target.className == "autoPagerS")
    {
    	return true;
    }
	if (target.tagName != 'A' && target.parentNode.tagName == 'A')
		target = target.parentNode;
	
	var str = formatString("moveover",[target.tagName,getXPathForObject(target)]);
	logInfo(str,str);

    //event.target.addEventListener("click",onXPathClick,true);
    //event.target.addEventListener("contextmenu",onMyContextMenu,true);
    createPagerSelectorDivs(target.ownerDocument,target);
    return true;
};
function createDiv(doc,divHtml)
{
	var div = doc.createElement("div");
    div.innerHTML = divHtml;
    doc.body.appendChild(div);
    return div;
};
function getSelectorDiv(doc,divName)
{
	var div = doc.getElementById(divName);
	if (!div)
	{
		div = createDiv(doc,"<div  id='" + divName + "' class='autoPagerS'  style='border: 2px solid orange; margin: 0px; padding: 0px; position: absolute; width: 0px; display: block; z-index: 90; left: -100px; top: -100px; height: 0px; ' ></div>");
	}
	return div;
};
function getSelectorLoadFrame(doc)
{
	var divName = "autoPagerLoadDiv";
	var frameName = divName + "ifr";
	
	var frame = doc.getElementById(frameName);
	if (frame == null || !frame)
	{
		var div = null;
		if (debug)
		{
			div = createDiv(doc,"<div  id='" + divName + "' class='autoPagerS' " +
				"<iframe id='" + frameName + "' name='" + frameName + "' width='100%' height='100%' src=''></iframe></div>");
		}
		else
		{	
			div = createDiv(doc,"<div  id='" + divName + "' class='autoPagerS'  style='border: 0px; margin: 0px; padding: 0px; position: absolute; width: 0px; display: block; z-index: -90; left: -100px; top: -100px; height: 0px; '>" +
				"<iframe id='" + frameName + "' name='" + frameName + "' width='100%' height='100%' src=''></iframe></div>");
		}
				
		frame = doc.getElementById(frameName);
		frame.addEventListener("load", onframeLoad, false);
		frame.autoPagerInited = false;
		//create a empty div in target
		getLastDiv(doc);
	}
	return frame;
};


function getLastDiv(doc)
{
	var divName = "autoPagerLastDiv";
	var div = doc.getElementById(divName);
	if (div == null || !div)
	{
		var div = createDiv(doc,"<div class='autoPagerS'  style='border: 0px; margin: 0px; padding: 0px; position: absolute; width: 0px; display: block; z-index: -90; left: -100px; top: -100px; height: 0px;'><div id='" + divName + "'></div></div>");
		div = doc.getElementById(divName);
	}

	return div;
};

function enableClickOnNode(node,enabled)
{
	if (enabled)
	{
		if (node.tagName == "A")
		{
			node.autoPagerHref = node.href;
			node.href = "javascript:void(0);";
			node.oldtarget = node.target;
			node.target = "";
		}else if (node.tagName == "INPUT")
		{
			node.oldonclick = node.onclick;
			node.onclick = "javascript:void(0);";
		}
		node.addEventListener("click",onXPathClick,false);
			
	}else
	{
		node.removeEventListener("click",onXPathClick,false);
		if (node.tagName == "A")
		{
			node.href = node.autoPagerHref;
			node.target = node.oldtarget;
		}else if (node.tagName == "INPUT")
		{
			node.onclick = node.oldonclick;
			//node.onclick = "javascript:void(0);";
		}
	}
};
function enableClick(node,enabled)
{
	//if (node.parentNode.tagName == "A")
	enableClickOnNode(node.parentNode,enabled);
	enableClickOnNodes(node,enabled);
}
function enableClickOnNodes(node,enabled)
{
	enableClickOnNode(node,enabled);
	var childs = node.childNodes;
	var i=0;
	for(i=0;i<childs.length;++i)
		enableClickOnNodes(childs[i],enabled);
};

var selectedObj = null;
function createPagerSelectorDivs(doc,target)
{
	if (selectedObj)
	{
		enableClick(selectedObj,false);
	}
	selectedObj = target;
	enableClick(selectedObj,true);

	var margin = 2;
	var leftDiv =getSelectorDiv(doc,"autoPagerBorderLeft");
	var rightDiv =getSelectorDiv(doc,"autoPagerBorderRight");
	var topDiv =getSelectorDiv(doc,"autoPagerBorderTop");
	var bottomDiv =getSelectorDiv(doc,"autoPagerBorderBottom");
	var left = getOffsetLeft(target);
	var top = getOffsetTop(target);

	var height = target.offsetHeight;
	if (!height)
		height = target.parentNode.offsetHeight;
	var width = target.offsetWidth;
	if (!width)
		width = target.parentNode.offsetWidth;
		
	leftDiv.style.left = (left - margin) + "px";
	leftDiv.style.top = (top - margin) + "px";
	leftDiv.style.height = (height + margin) + "px";

	rightDiv.style.left = (left + width) + "px";
	rightDiv.style.top = (top - margin) + "px";
	rightDiv.style.height = (height + margin) + "px";

	topDiv.style.left = left + "px";
	topDiv.style.top = (top - margin) + "px";
	topDiv.style.width = width + "px";
	
	bottomDiv.style.left = left + "px";
	bottomDiv.style.top = (top + height) + "px";
	bottomDiv.style.width = width + "px";

	
//	doc.body.appendChild(leftDiv);
//	alert(leftDiv.style.height);
	//target.offsetWidth;
	
};
function appendCondition(base,newStr)
{
	if (base.length > 0)
	{
		if (newStr.length > 0)
			return base + " and " + newStr;
		else
			return base;
	}
	return newStr;
}
function getXIdetify(node,dir)
{
	var xi = "";
	try{
		if ((node.className != null) && (node.className.length >0))
		{
			xi = appendCondition(xi,dir + "@class='" + node.className + "'");
		}
		if (node.getAttribute("id") != null && node.getAttribute("id").length >0)
		{
			xi = appendCondition(xi,dir + "@id='" + node.getAttribute("id") + "'");
		}
		if (node.textContent != null && node.childNodes.length ==1 && node.textContent.length >0 && node.textContent.length < 10)
		{
			//only if child is #text
			var child = node.childNodes[0];

			if(child.nodeType == 3)
				xi = appendCondition(xi, "contains(" +dir + "text(),'" + child.textContent + "')");
		}
		if(node.tagName == "INPUT")
		{
			if (node.getAttribute("type") != null && node.getAttribute("type").length >0)
			{
				xi = appendCondition(xi,dir + "@type='" + node.getAttribute("type") + "'");
			}
			if (node.getAttribute("name") != null && node.getAttribute("name").length >0)
			{
				xi = appendCondition(xi,dir + "@name='" + node.getAttribute("name") + "'");
			}
		}
		else if(node.tagName == "IMG")
		{
			if (node.getAttribute("src") != null && node.getAttribute("src").length >0)
			{
				xi = appendCondition(xi,dir + "@src='" + node.getAttribute("src") + "'");
			}
			if (node.getAttribute("alt") != null && node.getAttribute("alt").length >0)
			{
				xi = appendCondition(xi,dir + "@alt='" + node.getAttribute("alt") + "'");
			}
		}
	}catch(e)
	{
		alert(e);
	}
	return xi;
}
function getTagCount(childs,index)
{
	var tagCount = 0;
	var tagname = childs[index].tagName;
	var i;
	for(i=childs.length-1;i>=0;--i)
	{
		if (childs[i].tagName == tagname)
			tagCount ++;
	}
	return tagCount;
};

function getTagIndex(childs,index)
{
	var tagIndex = 1;
	var tagname = childs[index].tagName;
	var i;
	for( i=index-1;i>=0;--i)
	{
		if (childs[i].tagName == tagname)
			tagIndex ++;
	}
	return tagIndex;
}
function getXPath(node,dir,deep)
{
	var xi = getXIdetify(node,dir);
	if (deep >0 && node.hasChildNodes() &&  (node.childNodes != null) && (node.childNodes.length > 0))
	{
		var i=0;
		var childs = node.childNodes;
		for(i=0;i<childs.length;++i)
		{
			if (childs[i].nodeType == 1)
			{
				var tagname = childs[i].tagName.toLowerCase();
				if (getTagCount(childs,i) > 1)
					tagname = tagname + "[" + getTagIndex(childs,i) + "]";
				xi = appendCondition(xi,
				getXPath(childs[i], dir + tagname +"/" ,deep-1));
			}
		}
	}
	return xi;
}
function getTagName(node)
{
	var tagname = node.tagName.toLowerCase();
	if (tagname == 'td' || tagname == 'th' || tagname == 'tr' || tagname == 'tbody')
		tagname = "table";
	return tagname;
}
function getPathDir(root,child)
{
	var dir="";
	if (root != child)
	{
		if (root == 'table')
		{
			if (child == 'td' || child == 'th')
				dir = "/" + child;
			if (child != "tbody")
				dir = "/tr" + dir;
			dir = "tbody" + dir;
		}
		if (dir.length >0)
			dir = dir +"/";
	}
	return dir;
}
function getXPathForObject(target)
{
	var tagname = getTagName(target);
	var dir = getPathDir(tagname,target.tagName.toLowerCase());
	var path="//" + tagname;
	var xi = getXPath(target,dir,1);
	if (xi.length >0)
		path = path +  "[" + xi + "]";
	return path;	
}
function onXPathClick(event)
{
	var target = event.target;
	if(target != event.currentTarget)
		return false;
	if (target.tagName != 'A' && target.parentNode.tagName == 'A')
		target = target.parentNode;
	var path = getXPathForObject(target);
	_content.document.xTestLastDoc = target.ownerDocument;
	xTestXPath(target.ownerDocument,path);
	if (document.autopagerXPathModel == "wizard")
	{
		var doc = content.document.xTestLastDoc;
		if (confirm(getString("xpathconfirm")))
		{
			var url = doc.location.href;
			var site = newSite(url,url
	  				,path,"//body/*");
			site.createdByYou = true;
			site.owner = loadMyName();
			autoSites.push(site);
			saveConfig(autoSites);
			document.autopagerXPathModel = "";
			openSetting(url);
			if(doc.autoPagerSelectorEnabled)
				enableSelector(_content.document,true);
		}else if(!confirm(getString("tryagain")))
		{
			if(doc.autoPagerSelectorEnabled)
				enableSelector(_content.document,true);
		}
		else
			if(!doc.autoPagerSelectorEnabled)
				enableSelector(_content.document,true);
	}
//	if (target.tagName == 'A')
//		parserUrl(target.autoPagerHref);
	
	return true;
};
function getOffsetTop(target) {
    var node=target;
    var top=0;
    while(node&&node.tagName!="BODY") {
        top+=node.offsetTop;
        node=node.offsetParent;
    }
    return top;
};

function getOffsetLeft(target) {
    var node=target;
    var left=0;
    while(node&&node.tagName!="BODY") {
        left+=node.offsetLeft;
        node=node.offsetParent;
    }
    return left;
};
function parserResponse(xmlhttp)
{
	if (xmlhttp.responseXML != null)
		return xmlhttp.responseXML;
	var type= xmlhttp.getResponseHeader("Content-Type");
	var ind = type.indexOf(";");
	if (ind>0)
		type = type.substring(0,ind);
	if (!type)
		type = "text/html";
	try{
		var parser = new DOMParser();
		var doc = parser.parseFromString(xmlhttp.responseText, type);
	}catch (e){
		doc = parser.parseFromString(xmlhttp.responseText, "text/xhtml");
    }
	return doc;
};
function onframeLoad(event)
{
	//alert(event.currentTarget);
	//alert(event.target);
	//alert(event.originalTarget);

	var target = null;
	if (event.originalTarget != null)
		target = event.originalTarget;
	else if (event.target != null)
		target = event.target;
	else
		target = event.currentTarget;
	//alert(target);
	var frame=null;
	try{
		frame = getSelectorLoadFrame(target);
	}catch(e)
	{
		frame = target;
	}
	if (!frame.autoPagerInited)
	{
		//alert("onframeLoad");
		
		frame.autoPagerInited = true;
		var doc = frame.contentDocument;
		try{
			doc = doc.documentElement;
		
		}catch(e)
		{alert(e);}
		scrollWindow(frame.ownerDocument,doc);
	}
};

function parserUrl(doc,url)
{
	window.status = "Loading " + url;

	parserUrlXMLHttpRequest(doc,url);
	return;
	var frame = getSelectorLoadFrame(doc);
	frame.src = url;
};
function getHtmlInnerHTML(html,enableJS,url)
{
	var s= html.replace(/top\.location(\.href)*[ ]*\=/g,"atoplocationhref=");
	if (!enableJS)
	{
		//<base href="http://bbs.chinaunix.net/forumdisplay.php?fid=46">
		
		var headEnd = s.indexOf("</head>");
		if (headEnd == -1)
			headEnd = s.toLowerCase().indexOf("</head>");
		if (headEnd >0)
			s = "<html><head><base href='" + url +
					"'></head> "+ s.slice(headEnd + "</head>".length);
		//s = s.replace(/<script/g,"<!-- script");
		s = s.replace(/<[ ]*[Ss][Cc][Rr][Ii][Pp][Tt]/g,"<! -- script");
		s = s.replace(/ -- script/g,"-- script");
		
		s = s.replace(/<[ ]*\/[ ]*[Ss][Cc][Rr][Ii][Pp][Tt]>/g,"<\/script -->");
	}
	//alert(s);
	return s;
}
function getHtmlBody(html,enableJS)
{
	var s= html.replace(/top\.location(\.href)*[ ]*\=/g,"atoplocationhref=");
	if (!enableJS)
	{
		
		var bodyStart = s.indexOf("<body");
		if (bodyStart == -1)
			bodyStart = s.toLowerCase().indexOf("<body");
		if (bodyStart >0)
			s = "<div" +  s.slice(bodyStart + "<body".length);
		var bodyEnd = s.indexOf("body>");
		if (bodyEnd == -1)
			bodyEnd = s.toLowerCase().indexOf("body>");
		if (bodyEnd >0)
			s = s.slice(0,bodyEnd) + "div>";
		
		
	}
	//alert(s);
	return s;
}
function getContentType(doc)
{
//look like this:	<meta http-equiv="content-type" content="text/html;charset=gb2312">
	var nodes = doc.getElementsByTagName("meta");
	var type= doc.contentType + "; charset=" + doc.characterSet;
/*	for(i=0;i<nodes.length;++i)
	{
		//alert(nodes[i]);
		if (nodes[i].getAttribute("http-equiv")== "content-type")
		{
			type  = nodes[i].getAttribute("content");
		}
	}
*/	
	return type;
}
function parserUrlXMLHttpRequest(doc,url){
	var xmlhttp=null;
	        		//alert(doc.location.href);
	try{
	      try{
	        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	      }catch(e){
	        xmlhttp = new XMLHttpRequest();
	      }
	    xmlhttp.overrideMimeType(getContentType(doc));
	   xmlhttp.onreadystatechange = function (aEvt) {
       	if (debug)
       		logInfo(xmlhttp.readyState + " " + xmlhttp.status,
       				xmlhttp.readyState + " " + xmlhttp.status);
        if(xmlhttp.readyState == 4) 
        {
        	if(xmlhttp.status == 200)
        	{
        		
			if (easy)
			{			
				var body = getHtmlBody(xmlhttp.responseText,doc.enableJS);
	        		var div = getLastDiv(doc);
	        		div.innerHTML = "";
	        		div.innerHTML = "<div>" + body + "</div>";
	        		alert(doc.location.href);
				scrollWindow(doc,div);
			}
			else
			{
				var frame = getSelectorLoadFrame(doc);
        			frame.autoPagerInited = false;
        			frame.contentDocument.clear();
        			//alert(xmlhttp.responseText);
					frame.contentDocument.write(getHtmlInnerHTML(xmlhttp.responseText,doc.enableJS,url));
					frame.contentDocument.close();
        		setTimeout(function (){
					if (!frame.autoPagerInited)
				    {
						var newDoc = frame.contentDocument;
						//alert(newDoc);
						try{
							newDoc = newDoc.documentElement;
						}catch(e)
						{alert(e);}
		        		frame.autoPagerInited = true;
						scrollWindow(doc,newDoc);
					}
        		}
        		,6000);
			}
			
			//alert(div.childNodes.length);
        		//frame.contentDocument.ownerDocument.baseURI = url;
        		//frame.contentDocument.ownerDocument.setAttribute("baseURI") = url;
        	
        		//
				//var doc=parserResponse(xmlhttp );
        		//doc = doc.documentElement;
				//openInNewWindow(doc);
        	}
        	else
        		alert("Error loading page:" + url);
        }
      };
      xmlhttp.open("GET", url, true);
      window.content.status = "loading ... " + url;
      xmlhttp.send(null);

    }catch (e){
    	alert("unable to load url:" + url);
    }
	
};

// Evaluate an XPath expression aExpression against a given DOM node
// or Document object (aNode), returning the results as an array
// thanks wanderingstan at morethanwarm dot mail dot com for the
// initial work.
function evaluateXPath(aNode, aExpr) {
	var found = new Array();
	try{
		//var doc = aNode.ownerDocument == null ?
		//		aNode.documentElement : aNode.ownerDocument.documentElement;
		//var result = doc.evaluate(aExpr, aNode, null, 0, null);
		
	  var xpe = new XPathEvaluator();
	  var nsResolver = xpe.createNSResolver(aNode.ownerDocument == null ?
	  aNode.documentElement : aNode.ownerDocument.documentElement);
	  var result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);
	  
	  var res;
	  while (res = result.iterateNext())
	    found.push(res);
	  //alert(found.length);
  	}catch(e)
	{
		alert(formatString("unableevaluator",[aExpr,e]));
	}
	return found;
};
var xpath="//table[tbody/tr/td/@class='f']";
////a[contains(font/text(),'Next')]
///a[.//text() = '下一页']
var className = "res";
var tagName   = "DIV";


function scrollWindow(container,doc)
{
	try{
		if (debug)
			logInfo("scrollWindow","scrollWindow");
		var nextUrl=container.autopagernextUrl;
		if (nextUrl == null || nextUrl.length == 0)
			return;
		var xpath = container.contentXPath;
		//alert(doc);
		//alert(doc.innerHTML);
		
		var nodes = findNodeInDoc(doc,xpath);
		if (debug)
			logInfo(nodes.toString(),nodes.toString());
		//alert(nodes);
		var i=0;
		var divStyle = "'clear:both; line-height:20px; background:#E6E6E6; text-align:center;'";
		var div= createDiv(container,"<div style=" + divStyle 
				+ "> <span>" + formatString("pagebreak",[nextUrl,++container.autoPagerPage]) + "</span></div>")
		var insertPoint =	container.autopagerinsertPoint;
				
		insertPoint.parentNode.insertBefore(div,insertPoint);
		for(i=0;i<nodes.length;++i)
		{
			try{
				var newNode = insertPoint.parentNode.insertBefore(nodes[i].cloneNode(true),insertPoint);
			}catch(e)
			{
				alert(e);
			}
		}
		//alert(nodes.length);
		var urlNodes = findNodeInDoc(doc,container.linkXPath);
 		//alert(urlNodes);
		if (urlNodes != null && urlNodes.length >0)
		{
			nextUrl = fixUrl(container,urlNodes[0].href);
		}else
			nextUrl = null;
		//alert(nextUrl);
		container.autopagernextUrl = nextUrl;
		container.close();
		if (!easy)
		{
	  		var frame = getSelectorLoadFrame(container);
	  		frame.contentDocument.clear();
			frame.contentDocument.close();
		}
		container.close();
		
	}catch(e)
	{
		alert(e);
	}
    
    container.autopagerEnabled = true;
    onStopPaging(container);
};
function onStartPaging(doc)
{
	doc.autoPagerPaging = true;
	try{
		logInfo(formatString("autopaging",[ doc.location.href]),
			formatString("autopaging",[ doc.location.href]));
	}catch(e)
	{		
	}
	if (!document.pagingWatcherRunning)
		pagingWatcher();
}
function onStopPaging(doc)
{
	try{
		logInfo(formatString("autopageOn",[doc.location.href]),
		formatString("autopageOnTip",[doc.location.href]));
	}catch(e)
	{		
	}
	doc.autoPagerPaging = false;
}
function  pagingWatcher()
{
  	document.pagingWatcherRunning = true;
  	var i =0;
  	var Enable = false;
  	for(i=0;i<!Enable && _content.document.autopagerEnabledDoc.length;i++)
  	{
  		doc = _content.document.autopagerEnabledDoc[i];
    	Enable = doc.autoPagerPaging;
	}
	if (Enable)
	{
		setGlobalImageByStatus(document.autoPagerImageShowStatus);
		document.autoPagerImageShowStatus = !document.autoPagerImageShowStatus;
	   	var self = arguments.callee;
		setTimeout(self,200);
	}
	else
	{
		setGlobalImageByStatus(getGlobalEnabled());
		document.pagingWatcherRunning = false;
	}
};
	
function fixUrl(doc,url)
{
	if(url.indexOf(doc.location.protocol) == 0)
		return url
	//alert(doc.location);
	var newStr=doc.location.protocol +"//"+ doc.location.host;
	if ( doc.location.port.length >0)
		newStr += ":" + doc.location.port;
	//
	if(url.substring(0,1) != "/")
		newStr += doc.location.pathname.substring(0, 
				doc.location.pathname.lastIndexOf("/")+1);
	newStr += url;
	//alert(newStr);
	return  newStr;
}
function openInNewWindow(doc)
{
	xpath = prompt(getString("inputxpath"),xpath);
	var nodes = findNodeInDoc(doc,xpath);
	var i=0;
	var oldNodes = findNodeInDoc(_content.document.documentElement,xpath);
	var insertPoint = null;
	if (oldNodes!= null && oldNodes.length >0)
		insertPoint = oldNodes[oldNodes.length - 1].nextSibling;
	var divStyle = "'clear:both; line-height:20px; background:#E6E6E6; text-align:center;'";
	var div= createDiv(_content.document,"<div style=" + divStyle + "> <span>Page break inserted by auto pager.</span></div>")
	insertPoint.parentNode.insertBefore(div,insertPoint);
	for(i=0;i<nodes.length;++i)
	{
		try{
			var newNode = insertPoint.parentNode.insertBefore(nodes[i].cloneNode(true),insertPoint);
		}catch(e)
		{
			alert(e);
		}
	}

};
function findNodeInDoc(doc,xpath)
{
	if (xpath[0].length == 1)
		return evaluateXPath(doc,xpath);
	else
	{
		var result = evaluateXPath(doc,xpath[0]);
		for(var i=1;i<xpath.length;i++)
		{
			var nodes = evaluateXPath(doc,xpath[1]);
			for(var k=0;k<nodes.length;++k)
			{
				result[result.length] = nodes[k];
			}
		}
		return result;
	}
	/*
	var result = new Array();
	var nodes = doc.getElementsByTagName(tagName);
	var i=0;
	var j=0;
	for(i=0;i<nodes.length;++i)
	{
		//alert(nodes[i]);
		if (nodes[i].id == className)
		{
			result[j++]  = nodes[i];
		}
	}
	return result;*/
};
function xPathTest()
{
	if (!_content.document.xTestLastDoc)
		_content.document.xTestLastDoc = _content.document;
	xTestXPath(_content.document.xTestLastDoc,xpath);
}
function xTestXPath(doc,path)
{
	newpath = prompt("Please input the xpath:",path);
	if (!newpath || newpath.length==0)
		return;
	xpath = newpath;
	var found = evaluateXPath(doc,xpath);
	if (found==null || found.length ==0)
	{
		alert("xpath return nothing");
		return;
	}
		
	var w=window.open();
	var newDoc = 	w.document;
	 createDiv(newDoc,"<div><h1>Result for XPath: " + xpath + "</h1></div><br/>" );
	for(var i=0;i<found.length;++i)
	{
		try{
			//alert(found[i].tagName);
			var div = createDiv(newDoc,"<div/>");
			div.appendChild(found[i].cloneNode(true));
		}catch(e)
		{
			alert(e);
		}
	}
	
}

  function showAutoPagerMenu() {
  	showMyName();
  
    var popup = document.getElementById("autopager-popup");
    popup.addEventListener("popuphidden", function(ev) {
            if(ev.currentTarget != ev.target) return;
            ev.target.removeEventListener("popuphidden", arguments.callee, false);
        }, false);    
  	popup.showPopup();
	
  }
  function onEnable()
  {
  	var enabled = !getGlobalEnabled();
	setGlobalEnabled( enabled);
  }
  function statusClicked(event)
  {
  	if(event.currentTarget != event.target) return;
  	if(event.button == 2) 
  	 {
  	 	showAutoPagerMenu();
  	 }
  	 else if(event.button == 0) 
  	 {
  	 	 var image = document.getElementById("autopager_image");
  	 	 var enabled = !getGlobalEnabled();
		 setGlobalEnabled( enabled);
	  }
  }
  function setGlobalImageByStatus(enabled)
  {
  	try{
	  	if (enabled)
	  		setGlobalStatusImage("chrome://autopager/skin/autopager-small.on.gif");
	  	else
	  		setGlobalStatusImage("chrome://autopager/skin/autopager-small.off.gif");
  	}catch(e)
  	{
  		//alert(e);
  	}
  }
  function setGlobalStatusImage(url)
  {
  	var image = document.getElementById("autopager_image");
  	image.src=url;
  }
function getGlobalEnabled()
  {
 	 try{
	  if (!document.autoPagerEnabled)
	  	return false;
	  else
	  	return true;
 	 }catch(e)
 	 {
 	 	alert(e);
 	 	return false;
 	 }
  }
  function saveEnableStat(enabled)
  {
  	getPrefs().setBoolPref(".enabled", enabled); // set a pref
  }
  function loadEnableStat()
  {
  	return getPrefs().getBoolPref(".enabled"); // get a pref
  }
  function saveMyName(myname)
  {
  	getPrefs().setCharPref(".myname", myname); // set a pref
  }
  function loadMyName()
  {
  	try{
  	 
    return getPrefs().getCharPref(".myname"); // get a pref
  	}catch(e)
  	{
  		alert(e);
  	}
  	return "";
  }

  function setGlobalEnabled(enabled)
  {
  	  
  	if (document.autoPagerEnabled != enabled)
  	{
  		saveEnableStat(enabled);
  	}
 	  document.autoPagerEnabled = enabled;
	  setGlobalImageByStatus(enabled);
	  if (enabled)
		logInfo(getString("autopageenabled"),getString("autopageenabledTip"));
	  else
		logInfo(getString("autopagedisabled"),getString("autopagedisabledTip"));
	 var enableMenuItem = document.getElementById("autopager-enabled");
	  enableMenuItem.setAttribute("checked",enabled);	  		  
  }
  function logInfo(status,tip)
  {
  	window.content.status = status;
  	var tooltip = document.getElementById("autopager_tip");
  	var tips = tip.split("\n");
  	var i;
  	while(tooltip.childNodes.length < tips.length)
  		tooltip.appendChild(tooltip.childNodes[0].cloneNode(true));
  	for(i=0;i< tooltip.childNodes.length;++i)
  	{
  		tooltip.childNodes[i].hidden=(i >= tips.length);
  	}
  	
  	for(i=0;i<tips.length;i++)
  		tooltip.childNodes[i].value = tips[i];
  }
  
  function openSetting(url)
  {
  	window.autopagerSelectUrl=url;
	window.open("chrome://autopager/content/autopager.xul", "autopager",
    	"chrome,resizable,centerscreen");
  }
  
  function showMyName(){
  	 try{
    	var myname = document.getElementById("autopager-myname");
	  	myname.label = formatString("myname" ,[loadMyName()]);
  	 }catch(e)
  	 {
  	 	
  	 }
    }
    function changeMyName()
    {
    	var name = prompt(getString("inputname")
    		,loadMyName());
    	if (name!=null && name.length>0)
    	{
    		saveMyName(name);
    		showMyName();
    	}
    	return name;
    }
