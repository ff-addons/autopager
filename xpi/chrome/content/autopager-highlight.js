/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


const autopagerHightlight =
    {
    
    count : 0,
    HighlightNodes : function(doc,nodes,selected )
    {
        var first = true;
        if (nodes == null || nodes.length == 0)
            return;
        for(var i=0;i<nodes.length;i++)
        {
            var node = nodes[i];
            this.createRegionDivs(doc,node,i);
            if (selected == -1 || selected == i)
            {
                var left = this.getOffsetLeft(node);
                var top = this.getOffsetTop(node);
                if (first)
                {
                    first = false;
                    doc.defaultView.scrollTo(left,top);
                    node.focus();
                }
    
            }
        }
        for(var i=nodes.length; i<this.count;i++)
        {
            this.hiddenRegionDivs(doc,i);
        }
        this.count = nodes.length;

    },
    createRegionDivs : function(doc,target,subfix) {
        var margin = 2;
        var leftDiv = this.getSelectorDiv(doc,"autoPagerBorderLeft" + subfix);
        var rightDiv =this.getSelectorDiv(doc,"autoPagerBorderRight" + subfix);
        var topDiv =this.getSelectorDiv(doc,"autoPagerBorderTop" + subfix);
        var bottomDiv =this.getSelectorDiv(doc,"autoPagerBorderBottom" + subfix);
        var left = this.getOffsetLeft(target);
        var top = this.getOffsetTop(target);
    
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
    
        this.hiddenDiv(leftDiv,false);
        this.hiddenDiv(rightDiv,false);
        this.hiddenDiv(topDiv,false);
        this.hiddenDiv(bottomDiv,false);
    
    },
    createDiv : function(doc,id,style) {
        var div = doc.createElement("div");
        //div.innerHTML = divHtml;
        doc.documentElement.appendChild(div);
        div.className="autoPagerS";
        if (id.length>0)
            div.id = id;
    
        if (style.length>0)
            div.style.cssText = style;
        return div;
    },
    getSelectorDiv :function (doc,divName) {
        var div = doc.getElementById(divName);
        if (!div) {
            var style ="border: 2px solid orange; margin: 0px; padding: 0px; position: absolute; width: 0px; display: block; z-index: 65534; left: -100px; top: -100px; height: 0px;"; 
            div = this.createDiv(doc,divName,style);
        }
        return div;
    },
    hiddenRegionDivs : function (doc,subfix) {
        var leftDiv =this.getSelectorDiv(doc,"autoPagerBorderLeft" + subfix);
        var rightDiv =this.getSelectorDiv(doc,"autoPagerBorderRight" + subfix);
        var topDiv =this.getSelectorDiv(doc,"autoPagerBorderTop" + subfix);
        var bottomDiv =this.getSelectorDiv(doc,"autoPagerBorderBottom" + subfix);
        this.hiddenDiv(leftDiv,true);
        this.hiddenDiv(rightDiv,true);
        this.hiddenDiv(topDiv,true);
        this.hiddenDiv(bottomDiv,true);
    },
    hiddenDiv : function (div,hidden) {
        if (div)
        {
            if (hidden) {
                div.style.display = "none";
            }else {
                div.style.display = "block";
            }
        }
        //div.hidden = hidden;
    },
    getOffsetTop : function(target) {
        var node=target;
        var top=0;
        while(node&&node.tagName!="BODY") {
            top+=node.offsetTop;
            node=node.offsetParent;
        }
        return top;
    },

    getOffsetLeft : function(target) {
        var node=target;
        var left=0;
        while(node&&node.tagName!="BODY") {
            left+=node.offsetLeft;
            node=node.offsetParent;
        }
        return left;
    }
}