/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var autopagerXPath = {
    MAXTextLength : 20,
    MAXLevel: 6,
    discovery:function(doc,xpathes)
    {
        var url = doc.documentURI;
        return new autopagerDiscoveryResult(doc,xpathes);
    },
    discoveryLink:function(doc,xpathes)
    {
        var url = doc.documentURI;        
        
        var smarttext = autopagerPref.loadUTF8Pref("smarttext");
        var discoverytext = autopagerPref.loadUTF8Pref("discoverytext");
        
        var body = doc.documentElement.innerHTML
        var strs = (smarttext + "|" + discoverytext).split("|");
        var texts = "|";
        var ignoredTexts = "|";
        for(var k=0;k<strs.length;++k)
            strs[k] = strs[k].toLowerCase().replace(new RegExp(" ","gm"),"");
        for(var k=0;k<strs.length;++k)
        {
            if (strs[k].length==0)
                continue;
            if (texts.indexOf("|" + strs[k] + "|")==-1 && ignoredTexts.indexOf("|" + strs[k] + "|")==-1)
            {
                if (body.indexOf(strs[k])!=-1)
                    texts = texts + strs[k] + "|";
                else
                    ignoredTexts = ignoredTexts + strs[k] + "|";
            }
        }
        var tmpPaths =  this.convertToXpath(texts);
        //var tmpPaths2 =  this.convertToXpath(discoverytext);
        
        //tmpPaths = this.merge(tmpPaths,tmpPaths2);
        var links = [];//this.evaluate(doc,"//a[@href]");
        var item = null;
        for(var i in tmpPaths)
        {
            //get the nodes
            var urlNodes = this.evaluate(doc,tmpPaths[i]);
            if (urlNodes!=null && urlNodes.length !=0)
            {
                for(var level=1;level<this.MAXLevel;level+=1)
                {
                    var items = this.getLinkXPathItemFromNodes(doc,urlNodes,level);
                    for(var l in items)
                    {
                        item = items[l];
                        if (item!=null)
                            this.addItem(doc,links,item);                
                    }
                }
            }          
        }
        //get others
        //
        
        var existingSites = UpdateSites.getMatchedSiteConfig(UpdateSites.loadAll(),url,10);
        for (var i in existingSites)
        {
            var site = existingSites[i];
            //try the existing site settings
            var nodes = this.evaluate(doc,site.linkXPath,true,10);
            if (nodes != null && nodes.length >0)
            {
                item = new autopagerXPathItem();
                item.authority = 4;
                item.xpath = site.linkXPath
                item.matchCount = nodes.length
                this.addItem(doc,links,item);
            }
        }
        var knowLinks = [];
        for(var n in xpathes)
        {
            var site = xpathes[n];
            //try the existing site settings
            var nodes = this.evaluate(doc,site.n,true,10);
            if (nodes != null && nodes.length >0)
            {
                item = new autopagerXPathItem();
                item.authority = Math.sqrt(site.c);
                item.matchCount = nodes.length

                if (site.n!="//a[contains(text(),'Next')]" && site.n!="//a[contains(text(),'next')]")
                {
                    nodes = this.evaluate(doc,site.x,true,2);
                    if (nodes != null && nodes.length >0)
                        item.authority = item.authority *3;
                }
                item.xpath = site.n
                knowLinks.push(item)
            //this.addItem(doc,links,item);
            //site.xpathItem = item
            }
        }
        knowLinks = this.sortItems(knowLinks);
        for(var i=0;i<knowLinks.length;i++)
        {
            var l = knowLinks[i]
            var ignore = false;
            for(var n=0;n<i;n++)
            {
                if (l.xpath == knowLinks[n].xpath)
                {
                    ignore = true;
                    break;
                }
            }
            if (!ignore)
                this.addItem(doc,links,l);
        }


        //try the links next to this page
        item = new autopagerXPathItem();
        item.authority = 0.2;
        item.xpath = "(//a[@href and @href = %href%]/following-sibling::a[1])[translate(text(),'0123456789','')='']";
        this.addItem(doc,links,item);

        //		item = new autopagerXPathItem();
        //        item.authority = 1;
        //        item.xpath = "//a[@href and @href = %href%]/following-sibling::a[1]";
        //        this.addItem(doc,links,item);

        //try the links next to this page
        item = new autopagerXPathItem();
        item.authority = 0.1;
        item.xpath = "(//a[@href and %href% = concat(%pathname%,@href) ]/following-sibling::a[1])[translate(text(),'0123456789','')='']";
        this.addItem(doc,links,item);

        //		//try the links next to this page
        //        item = new autopagerXPathItem();
        //        item.authority = 0.6;
        //        item.xpath = "//a[@href and %href% = concat(%pathname%,@href) ]/following-sibling::a[1]";
        //        this.addItem(doc,links,item);
        //
        //        //try the links next to this page
        //        item = new autopagerXPathItem();
        //        item.authority = 0.6;
        //        item.xpath = "//a[@href and contains(@href , concat(%pathname% , %search%))]/following-sibling::a[1]";
        //        this.addItem(doc,links,item);

        //try the links next to this page
        item = new autopagerXPathItem();
        item.authority = 0.1;
        item.xpath = "(//a[@href and contains(@href , concat(%pathname% , %search%))]/following-sibling::a[1])[translate(text(),'0123456789','')='']";
        this.addItem(doc,links,item);

        //        //try the links next to this page
        //        item = new autopagerXPathItem();
        //        item.authority = 0.6;
        //        item.xpath = "//a[@href and contains(concat(%pathname% , %search%),@href)]/following-sibling::a[1]";
        //        this.addItem(doc,links,item);

        //try the links next to this page
        item = new autopagerXPathItem();
        item.authority = 0.1;
        item.xpath = "(//a[@href and contains(concat(%pathname% , %search%),@href)]/following-sibling::a[1])[translate(text(),'0123456789','')='']";
        this.addItem(doc,links,item);

        //        //try the links next to this page
        //        item = new autopagerXPathItem();
        //        item.authority = 0.6;
        //        item.xpath = "//a[@href and contains(@href , %href%)]/following-sibling::a[1]";
        //        this.addItem(doc,links,item);
        
        //try the links next to this page
        item = new autopagerXPathItem();
        item.authority = 0.12;
        item.xpath = "(//a[@href and contains(@href , %href%)]/following-sibling::a[1])[translate(text(),'0123456789','')='']";
        this.addItem(doc,links,item);

        //        //try the links next to this page
        //        item = new autopagerXPathItem();
        //        item.authority = 0.1;
        //        item.xpath = "//a[@href and contains(@href , %filename%)]/following-sibling::a[1]";
        //        this.addItem(doc,links,item);
        //try the links next to this page
        item = new autopagerXPathItem();
        item.authority = 0.1;
        item.xpath = "(//a[@href and contains(@href , %filename%)]/following-sibling::a[1])[translate(text(),'0123456789','')='']";
        this.addItem(doc,links,item);

        //try to find the page navigator, then find next links
        var navBars = this.evaluate(doc,"//*[count(a[text() != '' and translate(text(),'0123456789','')=''])>=2]/a[text() != '' and translate(text(),'0123456789','')='']");
        if (navBars && navBars.length !=0)
        {
            for(var level=1;level<this.MAXLevel;level+=1)
            {
                var paths = this.anaLyzeNavbar(doc,navBars,level);
                for(var i in paths)
                {
                    item = new autopagerXPathItem();
                    item.authority = (this.MAXLevel  / level);
                    item.xpath = paths[i];
                    if (item.xpath.indexOf("//input") !=-1)
                        item.authority = item.authority/2;
                    this.addItem(doc,links,item);
                }
            }
        }
            
        item = new autopagerXPathItem();
        item.xpath = "//*[count(a[text() != '' and translate(text(),'0123456789','')=''])>=2 ]/*[name()='STRONG' or name()='B']/following-sibling::a[1]";
        item.authority = 4;    
        this.addItem(doc,links,item);

        
        links = this.mergeXPath(links);
        var newlinks = [];
        for(var i=0;i<links.length;++i)
        {
            if (links[i].authority > 0.5 && links[i].matchCount<20)
                newlinks.push(links[i])
        }
        links = this.sortItems(newlinks);
        return links;
    },
    discoveryMoreLinks:function(doc,links,nodes)
    {

        for(var level=1;level<this.MAXLevel;level+=1)
        {
            var items = this.getLinkXPathItemFromNodes(doc,nodes,level);
            for(var i in items)
            {
                var item = items[i];                  
                if (item!=null)
                    this.addItem(doc,links,item);                
            }
        }
        links = this.mergeXPath(links);
        links = this.sortItems(links);
        var newLinks = [];
        //filter it again
        for(var i=0;i<links.length;i++)
        {
            var item = links[i]
            if(this.isMatchNodes(doc,item.xpath,nodes))
                newLinks.push(item);
        }
        return newLinks;
    },
    isMatchNodes : function (doc,xpath,nodes)
    {
        var matchNodes = this.evaluate(doc,xpath);
        if (matchNodes != null && matchNodes.length >0)
        {
            for(var n=0;n<nodes.length;n++)
                for(var i=0;i<matchNodes.length;i++)
                {
                    if (nodes[n].isEqualNode (matchNodes[i]))
                        return true;
                }
        }
        return false;
    },
    sortItems : function(links)
    {
        links.sort(function authority(a,b){
            if (b.authority == a.authority)
            {
                if (a.xpath.length == b.xpath.length)
                    return a.matchCount - b.matchCount;                
                return a.xpath.length - b.xpath.length;
            }
            return b.authority - a.authority;
        });
        return links;
    },
    modifyAuthoryByDeep : function(item)
    {
        var reg = /\/\/|\//g;
        var count = 0;
        while (reg.exec(item.xpath))
        {
            count ++;                
        }
        if (count >=2)
            count = count /1.5;
        else if(count ==0)
            count = 1;
        return item.authority/count;
    },
    mergeXPath : function (links)
    {
        //return links;
        for(var i=0;i<links.length;++i)
        {
            var item = links[i];
            item.authority = this.modifyAuthoryByDeep(item);
        }
        
        for(var i=0;i<links.length;++i)
        {
            var item = links[i];
            for(var j=i+1;j<links.length;++j)
            {
                if (links[i].matchCount == links[j].matchCount)
                {
                    var left=-1;
                    var right = -1;
                    if (this.xpathContain(links[i],links[j]))
                    {
                        left = j
                        right = i;
                    }
                    else if (this.xpathContain(links[j],links[i]))
                    {
                        left = i
                        right = j;
                    }
                    if (left>=0)
                    {
                        if (links[left].authority < links[right].authority)
                            links[left].authority = links[right].authority;
                        if (links[right].matchCount>2)
                            links[left].authority = links[left].authority + 1 / links[right].matchCount;
                        else
                            links[left].authority = links[left].authority + 1;
                    }
                }
            }
        }
        var newlinks = [];
        for(var i=0;i<links.length;++i)
        {
            if (links[i].xpath.length<128)
                newlinks.push(links[i])
        }        
        return newlinks;
    },
    xpathContain : function (item1, item2)
    {
        if (item2.xpath.substring(0,2)=='//')
        {
            return item1.xpath.indexOf(item2.xpath.substring(1))>=0;
        }
        return item1.xpath.indexOf(item2.xpath)>=0;
    },
    merge : function (array1,array2)
    {
        for(var i in array2)
        {
            if (array1.indexOf(array2[i]) == -1)
                array1.push(array2[i]);
        }
        return array1;
    },
    addItem : function(doc,links,item)
    {
        //ignore
        if (!item.xpath || item.xpath == "//a")
            return;

        autopagerUtils.log("Start " + item.xpath + " " + item.authority);
        item.authority = this.modifyAuthoryByDeep(item);
        for(var i in links)
        {
            if (links[i].xpath == item.xpath)
            {
                if (links[i].matchCount>1)
                {
                    if (item.xpath[0] != item.xpath[item.xpath.length-1])
                    {
                        item.authority = item.authority / item.xpath.length;
                    }
                }
                if (links[i].matchCount>2)
                    links[i].authority = links[i].authority + (item.authority /links[i].matchCount);
                else
                    links[i].authority = links[i].authority + item.authority ;
                return;
            }
        }
        var nodes = this.evaluate(doc,item.xpath);
        if (nodes != null && nodes.length >0)
        {
            item.matchCount = nodes.length;
            if (nodes.length>1)
            {
                if (nodes[0] != nodes[nodes.length-1])
                {
                    item.authority = item.authority / nodes.length;
                }
            }
            if (item.matchCount>2)
                item.authority = item.authority/item.matchCount;
            
            
            //if the xpath use possion, lower it's 'authority
            if (/\d( )*]/.test(item.xpath.replace("following-sibling\:\:a\[1\]","")))
            {
                item.authority = item.authority /2;
            }
            links.push(item);            
        }
        autopagerUtils.log("End " + item.xpath + " " + item.authority);
      
      
    },
    getLinkXPathItemFromNodes : function (node,urlNodes,level)
    {
        var items = [];
        var item = null;
        //if we only get one node
        if (urlNodes.length == 1)
        {
            item = new autopagerXPathItem();
            item.xpath = this.getLinkXpathFromNode(node,urlNodes[0],level);
            item.authority = (this.MAXLevel  / level) ;
            if(urlNodes[0].tagName != 'A')
                item.authority = item.authority  / 3;
            items.push(item);
            item = new autopagerXPathItem();
            item.xpath = this.getXPathForObjectByParent(urlNodes[0],3,level);
            item.authority = (this.MAXLevel  / level) ;
            if(urlNodes[0].tagName != 'A')
                item.authority = item.authority  / 3;
            items.push(item);
            item = new autopagerXPathItem();
            item.xpath = this.getXPathForObjectBySibling(urlNodes[0],3,level);
            item.authority = (this.MAXLevel  / level) ;
            if(urlNodes[0].tagName != 'A')
                item.authority = item.authority  / 3;
            items.push(item);
            item = new autopagerXPathItem();
            item.xpath = this.getXPathForObjectBySibling2(urlNodes[0],3,level);
            item.authority = (this.MAXLevel  / level) + 0.2 ;
            if(urlNodes[0].tagName != 'A')
                item.authority = item.authority  / 3;
            items.push(item);
            
            item = new autopagerXPathItem();
            item.xpath = this.getXPathForObjectByPosition(urlNodes[0],3,level);
            item.authority = (this.MAXLevel  / level) /1.2;
            if(urlNodes[0].tagName != 'A')
                item.authority = item.authority  / 3;
            items.push(item);
        }
        else if (urlNodes.length <= 4)
        {
            item = new autopagerXPathItem();
            item.authority = (this.MAXLevel  / level) ;
            if(urlNodes[0].tagName != 'A')
                item.authority = item.authority  / 3;
            item.xpath = this.getLinkXpathFromTwoNodes(node,urlNodes[0],urlNodes[1],level);
            items.push(item);
        }
        else // too many links, ignore this
        {
            var paths = this.anaLyzeNavbar(node,urlNodes,level);
            for(var i in paths)
            {
                item = new autopagerXPathItem();
                item.authority = (this.MAXLevel  / level);
                if(urlNodes[0].tagName != 'A')
                    item.authority = item.authority  / 3;
                item.xpath = paths[i];
                items.push(item);                
            }
        }
        return items;
        
    },
    getLinkXpathFromTwoNodes : function (parents,node1,node2,level)
    {
        //find the similar thing in node1 and node2
        //todo
        return this.getXPathForObjectByChild(node1,3,level);
    },
    getText : function (x)
    {
        if (x.nodeValue !=null && String(x.nodeValue) != "")
            return String(x.nodeValue);
        if (x.lastChild!=null && x.lastChild.nodeValue!=null)
            return String(x.lastChild.nodeValue);
        return "";
    },
    anaLyzeNavbar : function (node,urlNodes,level)
    {
        var nodes = [];
        for(var i=0;i<urlNodes.length;++i)
        {
            var num = parseInt(autopagerXPath.getText(urlNodes[i]));
            if (num!= NaN)
            {
                nodes.push(urlNodes[i]);
            }
        }
            
        nodes.sort(function (x,y){
            var txt1= parseInt (autopagerXPath.getText(x));
            var txt2= parseInt (autopagerXPath.getText(y));
            return txt1 - txt2;
        });
        var xpaths = [];
        for(var i=0;i<nodes.length -1; i++)
        {
            if (parseInt (this.getText(nodes[i+1])) == 2 + parseInt (this.getText(nodes[i])))
            {
                var xpath = this.getXPathForObjectByChild(nodes[i+1],3,level);
                if (xpath!= null && xpath.length>0)
                    xpaths.push (xpath );
                xpath = this.getXPathForObjectByParent(nodes[i+1],3,level);
                if (xpath!= null && xpath.length>0)
                    xpaths.push (xpath );
                xpath = this.getXPathForObjectBySibling(nodes[i+1],3,level);
                if (xpath!= null && xpath.length>0)
                    xpaths.push (xpath );
                xpath = this.getXPathForObjectBySibling2(nodes[i+1],3,level);
                if (xpath!= null && xpath.length>0)
                    xpaths.push (xpath );
            }
        }
        if (xpaths.length==0 && nodes.length>0)
        {
            xpath = this.getXPathForObjectBySibling(nodes[0],3,level);
            if (xpath!= null && xpath.length>0)
                xpaths.push (xpath );
            xpath = this.getXPathForObjectBySibling2(nodes[0],3,level);
            if (xpath!= null && xpath.length>0)
                xpaths.push (xpath );
        }
        return xpaths;     
    },
    getLinkXpathFromNode : function (parents,node,level)
    {
        return this.getXPathForObjectByChild(node,3,level);
    },
    
    appendAndCondition: function(base,newStr) {
        if (base.length > 0) {
            if (newStr.length > 0)
                return base + " and " + newStr;
            else
                return base;
        }
        return newStr;
    },
    getClearText : function (str)
    {
        return str.replace(new RegExp("^[  \t \n \r]*","gm"),"").replace(new RegExp("([  \t \n \r]*)$","gm"),"");
    },
    getXIdetify: function(node,dir,level) {
        var xi = "";
        try{
            if (level>=1 && node.getAttribute("id") != null && node.getAttribute("id").length >0) {
                xi = this.appendAndCondition(xi,dir + "@id='" + node.getAttribute("id") + "'");
            }
            if (level>=2 &&(node.className != null) && (node.className.length >0)) {
                xi = this.appendAndCondition(xi,dir + "@class='" + node.className + "'");
            }
            if (level>=3 && node.getAttribute("title") != null && node.getAttribute("title").length >0) {
                xi = this.appendAndCondition(xi,dir + "@title='" + node.getAttribute("title") + "'");
            }
            if (level>=3 && level<5 && node.textContent != null && node.childNodes.length ==1 && node.textContent.length >0 && node.textContent.length < this.MAXTextLength) {
                //only if child is #text
                var child = node.childNodes[0];

                if(child.nodeType == 3)
                    xi = this.appendAndCondition(xi, "(" +dir + "text()='" + this.getClearText(child.textContent) + "')");
            }
            if (level>=5 && node.textContent != null && node.childNodes.length ==1 && node.textContent.length >0 && node.textContent.length < this.MAXTextLength) {
                //only if child is #text
                var child = node.childNodes[0];

                if(child.nodeType == 3)
                    xi = this.appendAndCondition(xi, "contains(" +dir + "text(),'" + this.getClearText(child.textContent) + "')");
            }
            if(node.tagName == "INPUT") {
                if (level>=3 && node.getAttribute("type") != null && node.getAttribute("type").length >0) {
                    xi = this.appendAndCondition(xi,dir + "@type='" + node.getAttribute("type") + "'");
                }
                if (level>=1 && node.getAttribute("name") != null && node.getAttribute("name").length >0) {
                    xi = this.appendAndCondition(xi,dir + "@name='" + node.getAttribute("name") + "'");
                }
                if (level>=3 && node.getAttribute("value") != null && node.getAttribute("value").length >0) {
                    xi = this.appendAndCondition(xi,dir + "@value='" + node.getAttribute("value") + "'");
                }
                if (level>=3 && node.getAttribute("src") != null && node.getAttribute("src").length >0) {
                    xi = this.appendAndCondition(xi,dir + "@src='" + node.getAttribute("src") + "'");
                }
            }
            else if(node.tagName == "IMG") {
                if (level>=3 && node.getAttribute("src") != null && node.getAttribute("src").length >0) {
                    xi = this.appendAndCondition(xi,dir + "@src='" + node.getAttribute("src") + "'");
                }
                if (level>=3 && node.getAttribute("alt") != null && node.getAttribute("alt").length >0) {
                    xi = this.appendAndCondition(xi,dir + "@alt='" + node.getAttribute("alt") + "'");
                }
            }
        }catch(e) {
            autopagerMain.alertErr(e);
        }
        return xi;
    },
    getTagCount: function(childs,index) {
        var tagCount = 0;
        var tagname = childs[index].tagName;
        for(var i=childs.length-1;i>=0;--i) {
            if (childs[i].tagName == tagname)
                tagCount ++;
        }
        return tagCount;
    },

    getTagIndex: function(childs,index) {
        var tagIndex = 1;
        var tagname = childs[index].tagName;
        for(var i=index-1;i>=0;--i) {
            if (childs[i].tagName == tagname)
                tagIndex ++;
        }
        return tagIndex;
    },
    getXPath: function(node,dir,deep,maxChildCount,level) {
        var xi = this.getXIdetify(node,dir,level);
        if (deep >0 && node.hasChildNodes() &&  (node.childNodes != null) && (node.childNodes.length > 0)) {
            var childs = node.childNodes;
            for(var i=0;i<childs.length;++i) {
                if (childs[i].nodeType == 1) {
                    var tagname = childs[i].tagName.toLowerCase();
                    if (maxChildCount >= this.getTagIndex(childs,i))
                    {
                        if (this.getTagCount(childs,i) > 1)
                            tagname = tagname + "[" + this.getTagIndex(childs,i) + "]";
                        xi = this.appendAndCondition(xi,
                            this.getXPath(childs[i], dir + tagname +"/" ,deep-1,maxChildCount,level));
                    }
                }
            }
        }
        return xi;
    },
    getTagName : function(node) {
        var tagname = node.tagName.toLowerCase();
        if (tagname == 'td' || tagname == 'th' || tagname == 'tr' || tagname == 'tbody')
            tagname = "table";
        return tagname;
    },
    getTarget: function(node) {
        var target = node;
        var tagname = target.tagName.toLowerCase();
        
        while (tagname == 'td' || tagname == 'th' || tagname == 'tr' || tagname == 'tbody')
        {
            target = target.parentNode;
            tagname = target.tagName.toLowerCase();
        }
        return target;
    },
    getPathDir: function(root,child) {
        var dir="";
        if (root != child) {
            if (root == 'table') {
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
    },
    
    getXPathForObjectByChild : function(target,maxChildCount,level) {
        var tagname = this.getTagName(target);
        var dir = this.getPathDir(tagname,target.tagName.toLowerCase());
        var path="//" + tagname;
        var xi = this.getXPath(target,dir,1,maxChildCount,level);
        if (xi.length >0)
            path = path +  "[" + xi + "]";
        return path;	
    },
    getXPathForObjectByParent : function(target,maxChildCount,level) {

        var nodePath = this.getNodeParents(target)
        var dir = "";
        var path="/";
        for (var i in nodePath) {
            var node = nodePath[i]
            var xi = this.getXPath(node,dir,0,maxChildCount,level);
            path = path + "/" + node.tagName.toLowerCase();
            if (xi.length >0)
                path = path + "[" + xi + "]";

        }
        return path;	
    },
    getXPathForObjectBySibling : function(target,maxChildCount,level) {

        if (target.nodeType != 1)
            return "";
        var nodePath = this.getPreviousNodes(target)
        var dir = "";
        var path= this.getXPathForObjectByParent(target.parentNode,maxChildCount,level);
        for (var i in nodePath) {
            var node = nodePath[i]
            var xi = this.getXPath(node,dir,0,maxChildCount,level);
            if (i==0)
                path = path + "/" + node.tagName.toLowerCase();
            else
                path = path + "/following-sibling::" + node.tagName.toLowerCase();
            if (xi.length >0)
                path = path + "[" + xi + "]";
            else
                path = path + "[1]";

        }
        return path;	
    },
    getXPathForObjectBySibling2 : function(target,maxChildCount,level) {

        if (target.nodeType != 1)
            return "";
        var nodePath = this.getPrecedingDifferentNode(target)
        var count = nodePath[0]
        var node = nodePath[1]
        if (node==null || !node.tagName)
            return null;
        
        var dir = "";
        var path= this.getXPathForObjectByParent(target.parentNode,maxChildCount,level);
        {
            var xi = this.getXPath(node,dir,0,maxChildCount,level);
            path = path + "/*";// + target.tagName.toLowerCase();
            var prepath = node.tagName.toLowerCase();
            if (xi.length >0)
                prepath += "[" + xi + "]";
            else
                prepath += "[last()]";
                
            
            path += "[(position()=count(../" + prepath + "/preceding-sibling::*)+" + count +") and name()='" + target.tagName.toUpperCase() + "']"
            
            xi = this.getXPath(target,dir,0,maxChildCount,level);
            if (xi.length >0)
                path = path + "[" + xi + "]";
            

        }
        return path;	
    },
    getXPathForObjectByPosition : function(target,maxChildCount,level) {

        if (target==null || target.nodeType != 1)
            return "";
        var pos = this.getNodePosition(target)
        var path= this.getXPathForObjectByParent(target.parentNode,maxChildCount,level);
        path = path + "/" + target.tagName.toLowerCase() + "[" + pos +"]";
        return path;	
    },
    getPreviousNodes : function(node) {
        var result = []
        var tagname = node.tagName;
        while (node !=null && node.nodeType == 1 || node.nodeType == 3) {
            if (node.nodeType == 1)
            {
                result.unshift(node)
                if (node.nodeType == 1 && node.hasAttribute("id")) return result
                if (node.nodeType == 1 && tagname != node.tagName) return result
            }
            node = node.previousSibling
            if (node == null)
                break;
        }
        return result
    },
    getPrecedingDifferentNode : function(node) {
        var result = []
        var count = 0;
        var tagname = node.tagName;
        while (node !=null && node.nodeType == 1 || node.nodeType == 3) {
            count ++;
            if (node.nodeType == 1)
            {
                if (node.nodeType == 1 && node.hasAttribute("id"))
                    break;
                if (node.nodeType == 1 && tagname != node.tagName)
                    break;
            }
            node = node.previousSibling
            if (node == null)
                break;
        }
        result.push(count);
        result.push(node);
        return result
    },
    getNodePosition : function(node) {
        var pos = 0;
        var tagname = node.tagName;
        while (node !=null) {
            if (node.nodeType == 1 && tagname == node.tagName)
            {
                pos=pos+1;
            }
            node = node.previousSibling
            if (node == null)
                break;
        }
        return pos;
    },
    getNodeParents : function(node) {
        var result = []

        while (node !=null && node.nodeType == 1 || node.nodeType == 3) {
            result.unshift(node)
            if (node.nodeType == 1 && node.hasAttribute("id")) return result
            if (node.nodeType == 1 && node.tagName=='BODY') return result
            node = node.parentNode
        }
        return result
    },
    discoveryBigContent : function(node,items)
    {
        var contentNode = null;
        var len = 0;
        for(var i=0;i<node.childNodes.length;i++)
        {
            var child = node.childNodes[i];
            if (child.nodeType == 1 && child.innerHTML.length > len)
            {
                contentNode = child;
                len = child.innerHTML.length;
            }
        }
        var item = null;
        for(var level=1;level<this.MAXLevel;level+=1)
        {

            item = new autopagerXPathItem();
            item.xpath = this.getLinkXpathFromNode(node,contentNode,level);
            item.authority = (this.MAXLevel  / level);
            items.push(item);
            item = new autopagerXPathItem();
            item.xpath = this.getXPathForObjectByParent(contentNode,3,level);
            item.authority = (this.MAXLevel  / level);
            items.push(item);

        }
        return contentNode;
    },
    discoveryContent:function(doc,xpathes)
    {
        var node = doc.body;
        var url = doc.documentURI;
        var items = [];
        var links = [];//this.evaluate(doc,"//a[@href]");
        var item = null;

        var existingSites = UpdateSites.getMatchedSiteConfig(UpdateSites.loadAll(),url,10);
        for (var i in existingSites)
        {
            var site = existingSites[i];
            //try the existing site settings
            var nodes = this.evaluate(doc,site.contentXPath.join(" | "),true,10);
            if (nodes != null && nodes.length >0)
            {
                item = new autopagerXPathItem();
                item.authority = 4;
                item.xpath = site.contentXPath.join(" | ")
                item.matchCount = nodes.length
                this.addItem(doc,links,item);
            }
        }
        var knowLinks = [];
        for(var n in xpathes)
        {
            var site = xpathes[n];
            //try the existing site settings
            var nodes = this.evaluate(doc,site.x,true,10);
            if (nodes != null && nodes.length >0)
            {
                item = new autopagerXPathItem();
                item.authority = site.c;
                item.matchCount = nodes.length

                if (site.x!="//body" && site.x!="//body/*" && site.x!="//body/table")
                {
                    nodes = this.evaluate(doc,site.n,true,2);
                    if (nodes != null && nodes.length >0)
                        item.authority = item.authority *3;
                }
                item.xpath = site.x
                knowLinks.push(item)
            //this.addItem(doc,links,item);
            //site.xpathItem = item
            }
        }
        knowLinks = this.sortItems(knowLinks);
        for(var i=0;i<knowLinks.length;i++)
        {
            var l = knowLinks[i]
            var ignore = false;
            for(var n=0;n<i;n++)
            {
                if (l.xpath == knowLinks[n].xpath)
                {
                    ignore = true;
                    break;
                }
            }
            if (!ignore)
                this.addItem(doc,links,l);
        }


        var contentNode = this.discoveryBigContent(node,items);
        contentNode = this.discoveryBigContent(contentNode,items);

        for(var i in items)
        {
            item = items[i];
            if (item!=null)
                this.addItem(doc,links,item);
        }

        item = new autopagerXPathItem();
        item.authority = 1;
        item.xpath = "//body/*";
        links.push(item)
        
        links = this.mergeXPath(links);
        //get others
        
        links = this.sortItems(links);
        return links;
        
    },
    isValidXPath:function(xpath,doc) {
        var evaluator = new XPathEvaluator()
        var expr = this.preparePath(doc,xpath,true);
        try {
            evaluator.createExpression(expr, evaluator.createNSResolver(doc))
        } catch(e) {
            autopagerUtils.log("xpath exception: "+e)
            return false;
        }

        if(xpath=='/' || xpath=='.') return false;

        return true;
    },    
    evaluate : function(node,expr,enableJS,max)
    {
        var doc = (node.ownerDocument == null) ? node : node.ownerDocument;
        var found = [];
        var aExpr = this.preparePath(doc,expr,enableJS);
        var xpe = new XPathEvaluator();
        var defaultNSResolver = xpe.createNSResolver(doc.documentElement);
        function nsResolver(prefix) {
            var ns = {
                'xhtml' : 'http://www.w3.org/1999/xhtml',
                'mathml': 'http://www.w3.org/1998/Math/MathML'
            };
            return ns[prefix] || defaultNSResolver(prefix);
        }
        try{
            var result = xpe.evaluate(aExpr, node, nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

            found = this.dumpResult(result,max);
        }catch(e) {
            //[not (@class='autoPagerS')]
            try{
                aExpr = aExpr.replace("[not (@class='autoPagerS')]",'');
                var result2 = xpe.evaluate(aExpr, node, nsResolver, XPathResult.ANY_TYPE, null);
                found = this.dumpResult(result2,max);
            }catch(ex) {
                autopagerUtils.log("unableevaluator");//TODO: autopagerUtils.autopagerFormatString("unableevaluator",[aExpr,e]));
            }
        }
        return found;
    },
    dumpResult : function (result,max)
    {
        var found = [];
        var res;
        switch (result.resultType)
        {
            case XPathResult.NUMBER_TYPE:
                found.push(String(result.numberValue));
                break;
            case XPathResult.STRING_TYPE:
                found.push(result.stringValue);
                break;
            case XPathResult.BOOLEAN_TYPE:
                found.push(String(result.booleanValue));
                break;
            default:
            {
                while ((res = result.iterateNext()) && (typeof(max)=='undefined' || found.length<max))
                    found.push(res);
            }
        }
        return found;
    },
    convertToXpath  : function(str) {
        var xpaths = new Array();
        var strs = str.split("|");
        for(var k=0;k<strs.length;++k)
            strs[k] = strs[k].toLowerCase().replace(new RegExp(" ","gm"),"");
        for(var i=0;i<strs.length;++i) {
            if (strs[i].length==0)
                continue;
            var strCon =  this.convertStringToXPath(strs[i],"");
            if (strCon.length >0)
            {
                xpaths.push( "//a[" + strCon + "] | //input[(@type='submit' or @type='button' or @type='image') and " + strCon + "]");
                xpaths.push( "//*[" + strCon + "][count(a)=1]/a | //*[" + strCon + "][count(input)=1]/input");
            }
        }
        return xpaths;
    },
    xpathToLowerCase : function(path,str) {
        return "translate(normalize-space(" + path +"),'" + str.toUpperCase() +"', " + "'" + str +"')";
    },
    xpathContains : function(path,chars,str) {
        return "contains(translate(normalize-space(" + path +"),'" + chars.toUpperCase() +"', " + "'" + chars +"'),'" + str + "')";
    },
    convertStringToXPath : function(str,dir) {
        var xi="";
        var chars = this.getChars(str);
        if (str.length>0) {
            xi = this.appendOrCondition(xi,  dir + this.xpathContains("@id",chars,str) );
            xi = this.appendOrCondition(xi,  dir + this.xpathContains("@name",chars,str));
            xi = this.appendOrCondition(xi,  dir + this.xpathContains("@title",chars,str));
            xi = this.appendOrCondition(xi,  dir + this.xpathContains("@class",chars,str));
            xi = this.appendOrCondition(xi,  dir + this.xpathContains("img/@src",chars,str));
            xi = this.appendOrCondition(xi,  dir + "img[" + this.xpathContains("@src",chars,str) + "]" );
            xi = this.appendOrCondition(xi,  dir + this.xpathContains("text()",chars,str) );
            xi = this.appendOrCondition(xi,  dir + "span[" + this.xpathContains("text()",chars,str) + "]" );
            xi = this.appendOrCondition(xi,  dir + "font[" + this.xpathContains("text()",chars,str) + "]" );
            xi = this.appendOrCondition(xi,  dir + "b[" + this.xpathContains("text()",chars,str) + "]" );
            xi = this.appendOrCondition(xi,  dir + "strong[" + this.xpathContains("text()",chars,str) + "]" );
            xi = this.appendOrCondition(xi,  dir + this.xpathContains("substring(img/@src,string-length(img/@src) - "
                + str.length + ")",chars,str));
        }
        return xi;
    },
    getChars : function(str)
    {
        var chars = "";
        for(var i=0;i<str.length;++i)
        {
            if (chars.indexOf(str.charAt(i))==-1)
            {
                chars = chars + str.charAt(i);
            }
        }
        return chars;
    },
    appendOrCondition: function(base,newStr) {
        if (base.length > 0) {
            if (newStr.length > 0)
                return base + " or " + newStr;
            else
                return base;
        }
        return newStr;
    },
    modifyXPath : function(id)
    {
        var box = document.getElementById(id);

        window.openDialog("chrome://autopager/content/xpath-exprestion.xul",
            "autopagerAbout",
            "chrome,centerscreen,modal",
            box.value,
            autopagerUtils.currentDocument(),box);
    },
    preparePath : function(doc,path,enableJS) {
        //host
        //href
        //hostname
        //pathname
        //port
        //protocol
        //search
        //title
        if (typeof(enableJS)=='undefined')
            enableJS = true;
        var newPath = autopagerBwUtil.processXPath(path);
        if (newPath.indexOf("%") == -1)
            return newPath;
        try{
            var href = "";
            var host= "";
            var port = "";
            if (enableJS) {
                host = doc.location.host;
                href = doc.location.href;
            }
            else {
                href = doc.baseURI;
                host= href;
            
                //remove prototol
                host = host.substring(doc.location.protocol.length + 2);
                port = doc.location.port + "";
                host = host.substring(0,host.indexOf("/"));
            
                if (port.length > 0)
                    host = host.substring(0,host.length - port.length -1);
            }
            newPath = newPath.replace(/\%href\%/g,"'" + href+ "'");
            newPath = newPath.replace(/\%host\%/g,"'" + host + "'");
            newPath = newPath.replace(/\%hostname\%/g,"'" + host+ "'");
            newPath = newPath.replace(/\%pathname\%/g,"'" + doc.location.pathname+ "'");
            var pathname = doc.location.pathname;
            var filename = pathname.substr(pathname.lastIndexOf(pathname,"/"))
            newPath = newPath.replace(/\%filename\%/g,"'" + filename+ "'");
            if (!doc.location.port)
                port = doc.location.port;
            newPath = newPath.replace(/\%port\%/g,			port);
            newPath = newPath.replace(/\%protocol\%/g,"'" + doc.location.protocol+ "'");
            newPath = newPath.replace(/\%search\%/g,"'" + doc.location.search+ "'");
            newPath = newPath.replace(/\%title\%/g,"'" + doc.title+ "'");
        //newPath = newPath.replace(/\%referrer\%/g,"'" + doc.referrer+ "'");
        //newPath = newPath.replace(/\%baseURI\%/g,"'" + doc.baseURI+ "'");
        }catch(e) {
            autopagerMain.alertErr(e);
        }
        return newPath;
    
    }
   
};
function autopagerDiscoveryResult(doc,xpathes)
{
    this.linkXPaths = autopagerXPath.discoveryLink(doc,xpathes);
    this.contentXPaths = autopagerXPath.discoveryContent(doc,xpathes);
}
function autopagerXPathItem()
{
    this.xpath = "";
    this.authority = 0;
    this.matchCount = 0;
    this.tmpCount = 1;
}
function autopagerNode()
{
    this.node = null;
    this.matchCount = 0;
    this.tmpCount = 1;
}