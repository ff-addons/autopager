
// source code begin here -------------------------------------------------------------------

// key code
const KEY_CODE_PGUP = 33;
const KEY_CODE_PGDN = 34;

// method
const METHOD_FIND_NUM_SERIES = 1; // page(main method)
const METHOD_FIND_NEXT_PREV_TEXT = 2;  // thread
const METHOD_FIND_NEXT_PREV_JAVA_FUNC = 3; // thread
const METHOD_COMPARE_CURRENT_URL = 4; // thread(main method)
const METHOD_COMPARE_NEIGHBOUR_URL = 5; // thread

const TOO_BIG_NUMBER = 99999;

var gStatusbar;
var gTimerStatusbar;
var gNextPrev; // next or prev page? or specific page?
var gSmartNextNum; // candidate of next/prev page parameter value
var gSmartNextPage; // candidate of next/prev page
var gTargetWindow; // the window where the next page is loaded

var gRightMouseClick = false; // for rightmouse+wheel
var gWheelOrder = 0;
var gWheelDown = 0;
var gWheelUp = 0;
var gMethodSelect = 0;

// these are used as local variable
// I don't want to 'New' in every recursive function.
var gTextNodes; // text node list
var gTextNodesNum; // index of gTextNodes
const MAX_TEXT_NODES_NUM = 1000;
var gKeyAttrArray; // important attribute (color, class, style...)
const MAX_KEY_ATTR_NUM = 4;

var gNextKeywordArray;// keyword for 'next'
var gPrevKeywordArray;// keyword for 'prev'
const MAX_NEXTPREV_KEYWORD_NUM = 2;

var gpJavaFuncKeyword;

// trim space in both end
String.prototype.trim = function()
{
  return this.replace(/(^\s*)|(\s*$)/gi, "");
}

function wait_statusbar_timeout() {  
  window.clearInterval(gTimerStatusbar);
  gStatusbar.collapsed = true;
}

function show_statusbar() {
  gStatusbar.collapsed = false;
  window.clearInterval(gTimerStatusbar);  
  gTimerStatusbar = window.setInterval(wait_statusbar_timeout, 3000);
}

// key down handler
function onKeyDown(event) {
  if (event.keyCode == KEY_CODE_PGDN && event.altKey) {
    if (event.ctrlKey) gMethodSelect = 0;
    else  gMethodSelect = 1;
    mainSmartPager(-1);
  }
  else if (event.keyCode == KEY_CODE_PGUP && event.altKey) {
    if (event.ctrlKey) gMethodSelect = 0;
    else  gMethodSelect = 1;
    mainSmartPager(-2);
  }
}

// disable rightmouse up
function disableContextMenu(event) {
  event.preventDefault();
  event.stopPropagation();
  window.removeEventListener("contextmenu", disableContextMenu, true);
}
  

// wheel handler
function onWheel(event) {
  if (gRightMouseClick) {    
    window.addEventListener("contextmenu", disableContextMenu, true);
    event.preventDefault();
    event.stopPropagation();
    
    // wheel gesture
    if (gWheelOrder == 0) gWheelOrder = event.detail;
    if (event.detail > 0) gWheelDown++;
    else gWheelUp++;
  }
//  else if (event.altKey) {
//    gMethodSelect = 0;
//    if (event.detail > 0)
//      mainSmartPager(-1);
//    else
//      mainSmartPager(-2);
//  }  
}

function onMouseDown(event) {
  if (event.button == 2) gRightMouseClick = true;
  else gRightMouseClick = false;
  
  gWheelOrder = 0;
  gWheelDown = 0;
  gWheelUp = 0;  
}

function onMouseUp(event) {
  if (event.button == 2) {
    if (gWheelOrder > 0) {
      //alert("-1 Down="+gWheelDown+", gWheelUp="+gWheelUp);
      if (gWheelDown > 0 && gWheelUp > 0) gMethodSelect = 0;
      else gMethodSelect = 1;
      mainSmartPager(-1);
    }
    else if (gWheelOrder < 0) {
      //alert("-2 Down="+gWheelDown+", gWheelUp="+gWheelUp);
      if (gWheelDown > 0 && gWheelUp > 0) gMethodSelect = 0;
      else gMethodSelect = 1;
      mainSmartPager(-2);
    }
  }
  gRightMouseClick = false;
}
  

window.addEventListener('DOMMouseScroll', onWheel, false);
window.addEventListener('keydown', onKeyDown, false);
window.addEventListener('mousedown', onMouseDown, true); // if false, right mouse is not recognized
window.addEventListener('mouseup', onMouseUp, true); // if false, right mouse is not recognized

function findPosX(obj) {
  var curleft = 0;
  if(obj.offsetParent) {
    while(1) {
      curleft += obj.offsetLeft;
      if(!obj.offsetParent)
        break;
      obj = obj.offsetParent;
    }
  }
  return curleft;
}

function findPosY(obj) {
  var curtop = 0;
  if(obj.offsetParent) {
    while(1) {
      curtop += obj.offsetTop;
      if(!obj.offsetParent)
        break;
      obj = obj.offsetParent;
    }
  }
  return curtop;
}

// not used
// remove non-number
function str2PageNum(str) {
  var strn, str2, str3;
  str2 = str.replace(/(^[^\d]*)|([^\d]*$)/g, "");
  //if (str2 == "") return 0; // space is acceptable
  strn = Number(str2);
  if (isNaN(strn) || strn == 0) return -1; // non-number
  else return strn; // number
//  else {
//    str3 = str.replace(/([\s\|\[\]\{\}\(\)\-\/.]*)/g,"");
//    if (str3.length == str2.length || str3.indexOf(str2) == str3.length-1) return strn; // The number is in the end? It's accepted. (Ex. "Jump to pages : 1")
//    else return -1; // The number is in the middle. It's rejected. (Ex. "[Next 10 Pages]")
//  }
}

// remove space tab | [ ] ( ) - / ��
function str2PageNum2(str) {
  var strn, str2;
  //str2 = str.replace(/([\s\t\|\[\]\(\)\-\/\u00b7]*)/g,"");
  str2 = str.replace(/(^[\s\t\|\[\]\(\)\-\/\u00b7]*)|([\s\t\|\[\]\(\)\-\/\u00b7]*$)/g,"");
  strn = Number(str2);
  if (isNaN(strn) || strn == 0) return -1; // non-number
  else return strn; // number
}

// go up recursively to find clickable parent node
function findClickableParent(aNode) {
  var str;  
  while (aNode != null) {
    if (aNode.nodeName == "BODY") return null;
    else if (aNode.hasAttribute("onclick")) { // onclick event first
      return aNode; // don't have to have numbers
      //str = String(aNode.getAttribute("onclick"));
      //if (str.match(/\d+/g) != null) return aNode; // must have numbers
    }
    else if (aNode.nodeName == "A" && aNode.href.length > 0) { // anchor second
      return aNode; // don't have to have numbers
      //str = String(aNode.href);
      //if (str.match(/\d+/g) != null) return aNode; // must have numbers
    }
    aNode = aNode.parentNode;
  }
  return null;
}

// go down recursively to find all text nodes // very important but expensive function
function findNumberNode(aNode) {
  var i;
  var str;
  if (aNode.nodeName == "#text") {
    //str = aNode.data.trim();
    //if (str.length > 0 && str.length < 10 && str2PageNum2(str) > 0) // �̷��� �ϸ� �������� ���ڵ� ���̿� ���ڵ��� ���Ƶ� �Ȳ�� �׳� �Ѱܹ��..����;��..
    str = aNode.data;
    if (str2PageNum2(str) > 0) // str.length�� ��� ��8��...
      gTextNodes[gTextNodesNum++] = aNode;
  }
  else {
    // pruning first
    if (aNode.nodeName == "SCRIPT" || aNode.nodeName == "OPTION") { // <option> and <script> don't have page number. moreover <script> text is too long for string-replace. <option> has number series very likely.
      //alert(aNode.nodeName + " has children "+aNode.childNodes.length);
    }
    else {
      for (i=0; i<aNode.childNodes.length; i++) {
        //alert("parent:"+aNode.nodeName+", child["+i+"]:"+aNode.childNodes[i].nodeName);
        findNumberNode(aNode.childNodes[i]);
      }
    }
  }
}

// find current page number in clickable number series
function findCurrentPageNum(curWindow) {
  var i,j,k;
  var y1f, y1t, y2f, y2t;
  var tmptext, tmptext0;
  var cpn2, cpi, iFrom, iTo;
  var found, search_end;
  var listNode, edgeNode;
  var bodyNode = curWindow.document.getElementsByTagName("BODY"); // root node
  if (bodyNode.length == 0) return; // no <BODY>
  for (i=0; i<MAX_TEXT_NODES_NUM; i++) gTextNodes[i] = null; // initialize text node list
  gTextNodesNum = 0;
  findNumberNode(bodyNode[0]); // find text(number) node under <body>

  iFrom = iTo = -1;
  found = 0;
  for (i=gTextNodesNum-1; i>=0; i--) { // search backward. page numbers are usually at the end  
    tmptext = str2PageNum2(gTextNodes[i].data);
    //alert("aaaaaaa "+i+" textnode:"+gTextNodes[i].data+"==>"+tmptext+"/"+iFrom+"~"+iTo);
    search_end = 0;
    if (iFrom == -1) { // found number first
      iFrom = iTo = i;
    }
    else { // not the first time
      //alert("prev:"+str2PageNum2(gTextNodes[iFrom].data)+", cur:"+tmptext);
     if (tmptext0 - tmptext == 1) { // if difference is 1 (not generalize it yet.)
      iFrom = i; // update iFrom
     }
     else if (iFrom == iTo) { // not number series. clear prev and start again
      iFrom = iTo = i;
     }
     else { // search end.
       //alert("search end "+i+"textnode:"+gTextNodes[i].data+"==>"+tmptext+"/"+iFrom+"~"+iTo+" from:"+gTextNodes[iFrom].data+",to:"+gTextNodes[iTo].data);
       search_end = 1;
      }
    }
    tmptext0 = tmptext;
    
    if (iTo > iFrom && (i == 0 || search_end == 1)) { // search end. found number series!! Go deeper.  
      // Is there only one non-clickable node?
      cpn2 = 0;
      cpi = 0;
      for (j=iFrom; j<=iTo; j++) {
        if (findClickableParent(gTextNodes[j].parentNode) == null) { // because current page is usually non-clickable
          cpn2++;
          cpi = j;
        }
      }
      
      found = 0;
      if (cpn2 >= 2) {
        //alert(cpn2+" non-clickable nodes. these number series are not page numbers.");
      }
      else if (cpn2 == 1) {
        //alert("Only one non-clickable node. "+gTextNodes[cpi].data);
        found = 1; // Nicely, there is only one non-clickable node.
      }
      else if (cpn2 == 0) { // Damn it, all are clickable. Compare nodes with the first node.
        //alert("Damn it! All are clickable node.");
        
        // find only one different style node (style, color, size, class...)
        cpn2 = 0; // number of the different nodes
        cpi = 0; // index of the different node (This is what I want!!!)
        // not going up yet    
        for (j=iFrom+1; j<=iTo; j++) {
          if (gTextNodes[j].data.trim() == "") continue;
          //alert(gTextNodes[j].data+"("+gTextNodes[j].parentNode.nodeName+") vs "+gTextNodes[iFrom].data+"("+gTextNodes[iFrom].parentNode.nodeName+")");
          if (gTextNodes[j].parentNode.nodeName != gTextNodes[iFrom].parentNode.nodeName) // nodename(tag) difference
          {
            cpn2++;
            cpi = j;
          }
        }
        if (cpn2 == 0) { // tags are all same. let's go deeper.
          //alert("tags are all same.");
          for (j=iFrom+1; j<=iTo; j++) {            
            for (k=0; k<MAX_KEY_ATTR_NUM; k++) {
              if (gTextNodes[j].parentNode.hasAttribute(gKeyAttrArray[k]) != gTextNodes[iFrom].parentNode.hasAttribute(gKeyAttrArray[k])) { // attribute existence
                cpn2++;
                cpi = j;
                break;
              }
              else if (gTextNodes[iFrom].parentNode.hasAttribute(gKeyAttrArray[k]) && (gTextNodes[j].parentNode.getAttribute(gKeyAttrArray[k]) != gTextNodes[iFrom].parentNode.getAttribute(gKeyAttrArray[k]))) { // attribute value difference
                //alert(gTextNodes[j].data+"("+gTextNodes[j].parentNode.getAttribute(gKeyAttrArray[k])+") vs "+gTextNodes[iFrom].data+"("+gTextNodes[iFrom].parentNode.getAttribute(gKeyAttrArray[k])+")");
                cpn2++;
                cpi = j;
                break;
              }
            }
          }
        }
        if (cpn2 == 1) { // found it. it is not the first one.
          //alert("Found different node nicely1.");
          found = 1;
        }
        else if (cpn2 == iTo - iFrom) { // found it. it is the first one.    
          //alert("Found different node nicely2.");
          cpi = iFrom;
          found = 1;
        }
        else { // failed. couldn't found it.
          //alert("Oh, No. It's not here. "+cpn2);
        }
      }
      
      if (found == 1) {
        //alert("cpi="+cpi+",iFrom="+iFrom+":"+gTextNodes[iFrom].data+",iTo="+iTo+":"+gTextNodes[iTo].data);
        if (gNextPrev == -1) { // next          
          if (cpi < iTo) { // in the list
            gStatusbar.label = "Page "+str2PageNum2(gTextNodes[cpi].data)+"->"+str2PageNum2(gTextNodes[cpi+1].data);
            gSmartNextPage = gTextNodes[cpi+1].parentNode;
            gTargetWindow = curWindow;
          }
          else { // last page num in the list
            //alert("Uh. This is the last of the current list.");
            listNode = curWindow.document.getElementsByTagName("*");
            // find the next clickable node
            if (findClickableParent(gTextNodes[cpi].parentNode) == null) edgeNode = gTextNodes[cpi-1].parentNode;
            else edgeNode = gTextNodes[cpi].parentNode;
            for (k=0; k<listNode.length; k++) // find the index of edge node
              if (listNode[k] == edgeNode) break;
            //alert("listNode.length="+listNode.length+" and edgenode="+k);
            for (j=k+1; j<listNode.length; j++) {
              //alert(j+" node "+listNode[j].nodeName+" has "+listNode[j].childNodes.length + " children");
              if (listNode[j].childNodes.length == 0) {
                //alert("no child:"+listNode[j].nodeName);
                if (findClickableParent(listNode[j]) != null) // next node is not text (ex.img)
                  break;
              }
              else if (listNode[j].childNodes[0].nodeName == "#text") {  // if it is text
                //alert("text data "+listNode[j].childNodes[0].data+"->"+str2PageNum2(listNode[j].childNodes[0].data));
                if (listNode[j].childNodes[0].data.trim().length > 0 && // should not be space
                    str2PageNum2(listNode[j].childNodes[0].data) < 0 && // should not be page number
                    findClickableParent(listNode[j]) != null)
                  break;
              }
            }
            if (j < listNode.length) {
              y1f = findPosY(gTextNodes[cpi].parentNode);
              y1t = y1f + gTextNodes[cpi].parentNode.offsetHeight;
              y2f = findPosY(listNode[j]);
              y2t = y2f + listNode[j].offsetHeight;              
              if (findPosX(gTextNodes[cpi].parentNode) >= findPosX(listNode[j])) { // next link should be at right side
                //alert("posX is wrong");
                return -1;
              }
              else if (y2f > y1t) { // their y position should be similar. (share vertical area)
                //alert("posY is wrong. cur:"+y1f+"-"+y1t+", nex:"+y2f+"-"+y2t);
                return -1;
              }
              gStatusbar.label = "Page "+str2PageNum2(gTextNodes[cpi].data)+"->Next";
              gSmartNextPage = listNode[j];
              gTargetWindow = curWindow;
            }
            else {
              //alert("No next page");
            }
          }
        }
        else if (gNextPrev == -2) { // prev
          if (cpi > iFrom) { // in the list
            gStatusbar.label = "Page "+str2PageNum2(gTextNodes[cpi].data)+"->"+str2PageNum2(gTextNodes[cpi-1].data);
            gSmartNextPage = gTextNodes[cpi-1].parentNode;
            gTargetWindow = curWindow;
          }
          else { // first page num in the list
            if (str2PageNum2(gTextNodes[cpi].data) == 1) {
              //alert("This is the first page");
              return -1;
            }
            //alert("Uh. This is the first of the current list.");
            listNode = curWindow.document.getElementsByTagName("*");
            // find the next clickable node
            if (findClickableParent(gTextNodes[cpi].parentNode) == null)
              edgeNode = gTextNodes[cpi+1].parentNode;
            else edgeNode = gTextNodes[cpi].parentNode;
            for (k=0; k<listNode.length; k++) // find the index of edge node
              if (listNode[k] == edgeNode) break;
            //alert("listNode.length="+listNode.length+" and edgenode="+k);
            for (j=k-1; j>=0; j--) {
              //alert(j+" node "+listNode[j].nodeName+" has "+listNode[j].childNodes.length + " children");
              if (listNode[j].childNodes.length == 0) {
                if (findClickableParent(listNode[j]) != null) // next node is not text (ex.img)
                  break;
              }
              else if (listNode[j].childNodes[0].nodeName == "#text") {  // if it is text
                //alert("text data "+listNode[j].childNodes[0].data+", length:"+listNode[j].childNodes[0].data.trim().length);
                if (listNode[j].childNodes[0].data.trim().length > 0 && // should not be space
                    str2PageNum2(listNode[j].childNodes[0].data) < 0 && // should not be page number
                    findClickableParent(listNode[j]) != null)
                  break;
              }
            }
            if (j >= 0) {
              y1f = findPosY(gTextNodes[cpi].parentNode);
              y1t = y1f + gTextNodes[cpi].parentNode.offsetHeight;
              y2f = findPosY(listNode[j]);
              y2t = y2f + listNode[j].offsetHeight;
              if (findPosX(gTextNodes[cpi].parentNode) <= findPosX(listNode[j])) { // prev link should be at left side
                //alert("posX is wrong");
                return -1;
              }
              else if (y2t < y1f) { // their y position should be similar. (share vertical area)
                //alert("posY is wrong. cur:"+y1f+"-"+y1t+", nex:"+y2f+"-"+y2t);
                return -1;
              }
              gStatusbar.label = "Page "+str2PageNum2(gTextNodes[cpi].data)+"->Prev";
              gSmartNextPage = listNode[j];
              gTargetWindow = curWindow;
            }
            else {
              //alert("No prev page");
            }
          }
        }
        return 1;
      }
      else {
        iFrom = iTo = -1; // it was waste of time. start all over again.
        i++; // roll back
      }
    }
  }
  return -1;
}

// text can be handled easily. how about image? or javascript:click?
function findNextText(curWindow) {
  var i,j,k;
  var targetIdx = -1, candIdx = -1;
  var nodetext;
  var listNode = curWindow.document.getElementsByTagName("*");
  for (i=0; i<listNode.length; i++) { // every node
    if (listNode[i].nodeName == "SCRIPT") continue; // long and useless
    for (k=0; k<listNode[i].childNodes.length; k++) { // every child
      if (listNode[i].childNodes[k].nodeName == "#text") { // text node
        nodetext = listNode[i].childNodes[k].data.trim().toLowerCase();
        if (nodetext.length > 20) continue;
        for (j=0; j<MAX_NEXTPREV_KEYWORD_NUM; j++) { // compare to the keywords
          if (gNextPrev == -1) {
            if (nodetext.indexOf(gNextKeywordArray[j]) > -1 && nodetext.indexOf(gPrevKeywordArray[0]) == -1) {
              candIdx = i;
              if (findClickableParent(listNode[i]) != null) {
                targetIdx = i;
                break; // found it!
              }
            }
          } else {
            if (nodetext.indexOf(gPrevKeywordArray[j]) > -1 && nodetext.indexOf(gNextKeywordArray[0]) == -1) {
              candIdx = i;
              if (findClickableParent(listNode[i]) != null) {
                targetIdx = i;
                break; // found it!
              }
            }
          }
        }
        if (targetIdx > -1) break;
      }
    }
    if (targetIdx > -1) break;
  }
  if (i<listNode.length) { // found clickable keyword.
    gStatusbar.label = listNode[i].childNodes[k].data.trim();
    gSmartNextPage = listNode[i];
    gTargetWindow = curWindow;
    return 1;
  }
//  else if (candIdx >= 0) { // found keyword. but not clickable. maybe close.
//    //alert(listNode[candIdx].nodeName);
//    gSmartNextPage = listNode[candIdx+1];
//    gTargetWindow = curWindow;
//  }
  return -1;
}

// find javascript function such as javascript:goNext()
function findNextJavaFunc(curWindow) {
  var nodelink;
  var listNode = curWindow.document.getElementsByTagName("A");
  for (i=listNode.length-1; i>=0; i--) { // every <A> node
    nodelink = listNode[i].href.toLowerCase();
    if (nodelink.indexOf("javascript:") > -1 && nodelink.indexOf(gpJavaFuncKeyword) > -1) {
      break;
    }
  }
  if (i >= 0) { // found it.
    if (gNextPrev == -1) gStatusbar.label = "next()";
    else gStatusbar.label = "prev()";
    gSmartNextPage = listNode[i];
    gTargetWindow = curWindow;
    return 1;
  }
  return -1;
}

// If u1 and u2 are same string except one number, return the difference
function diffNumBtwStr(u1, u2) {
  var i, j, n;
  var u1_num, u2_num;
  var diff_point = -1;
  
//  u1 = u1.substring(0, u1.indexOf("#"));
//  u2 = u2.substring(0, u2.indexOf("#"));

  if (u1 == u2) return 0;
  
  if (u1.length < u2.length) n = u1.length;
  else n = u2.length;
  
  // find the end of difference
  for (i=1; i<=n; i++) {
    if (u1[u1.length-i] != u2[u2.length-i]) {
      diff_point = i;
      break;
    }
  }
  
  // get the number of u1
  for (i=diff_point; i<=u1.length; i++) {
    if (u1.charAt(u1.length-i) == '=')
      break;
  }
  u1_num = Number(u1.substring(u1.length-i+1, u1.length-diff_point+1));
  
  // get the number of u2
  for (j=diff_point; j<=u2.length; j++) {
    if (u2.charAt(u2.length-j) == '=')
      break;
  }
  u2_num = Number(u2.substring(u2.length-j+1, u2.length-diff_point+1));
    
  if (isNaN(u1_num) || isNaN(u2_num))
    return TOO_BIG_NUMBER;
  else if (u1.substring(0, u1.length-i+1) != u2.substring(0, u2.length-j+1))
    return TOO_BIG_NUMBER;
  //alert("u1_num="+u1_num+", u2_num="+u2_num);  
  return u1_num-u2_num;
}

//// Do they have same parent and same depth?
//function haveSameParent(node1, node2) {
//  // go up until <BODY>
//  while(node1.nodeName != "BODY" && node2.nodeName != "BODY") {
//    node1 = node1.parentNode;
//    node2 = node2.parentNode;
//    //alert("node1.name="+node1.nodeName+", node2.name="+node2.nodeName);
//    if (node1 == node2) {
//      return node1;
//    }    
//  }
//  // return <BODY>
//  if (node1.nodeName == "BODY") return node1;
//  else return node2;
//}

// Do they have same parent?
function haveSameParent(node1, node2, parentName) {
  var p1 = node1, p2 = node2;
  while (p1 != null) {
    if (p1.nodeName == parentName) break;
    p1 = p1.parentNode;
  }
  while (p2 != null) {
    if (p2.nodeName == parentName) break;
    p2 = p2.parentNode;
  }
  if (p1 == p2) return p1;
  else if (p1 != null && p2 != null) {
    return haveSameParent(p1.parentNode, p2.parentNode, parentName);
  }
  else {
    //alert("have different parent");
    return null;
  }
}

var gCurUrlNode;
function compareCurURL(curWindow) {
  var cur_url;
  var nodelink;
  var found = 0;
  var listNode = curWindow.document.getElementsByTagName("A");
  var difference;
  var shared_parent;
  var i, j;
  
  cur_url = curWindow.location.href;  
  gCurUrlNode = null;
  
  if (cur_url.length < 50) return -1; // usually long.
  
  for (i=listNode.length-1; i>=0; i--) { // find the self-url node to know the current thread
    nodelink = listNode[i].href;
    //alert("node : "+nodelink+"\n"+"curr : "+cur_url);
    if (nodelink.length == cur_url.length && nodelink == cur_url) { // exactly same
      found = 1;
      j = i;
      break;
    }
    else { // not exactly same. find the closest link.
      //alert(nodelink);
    }
  }
  
  if (found == 1) { // found the self-url.
    gCurUrlNode = listNode[i];
    if (gNextPrev == -1) {
      for (i=i+1; i<listNode.length; i++) { // search forward from the current url
        nodelink = listNode[i].href;
        if (nodelink.length < cur_url.length+2 && nodelink.length > cur_url.length-2) { // assume next thread number is close to current number
          if (findPosY(listNode[j]) >= findPosY(listNode[i])) { // next link should be at down side. posX can be different(ex. [Re])
            //alert("posY is wrong");
            return -1;
          }
          found = 2;
          break;
        }
      }
      gStatusbar.label = "Next/Down";
    }
    else if (gNextPrev == -2) {
      for (i=i-1; i>=0; i--) { // search backward from the current url
        nodelink = listNode[i].href;
        if (nodelink.length < cur_url.length+2 && nodelink.length > cur_url.length-2) { // assume previous thread number is close to current number
          if (findPosY(listNode[j]) <= findPosY(listNode[i])) { // next link should be at up side. posX can be different(ex. [Re])
            //alert("posY is wrong");
            return -1;
          }
          found = 2;
          break;
        }
      }
      gStatusbar.label = "Prev/Up";      
    }
    if (found == 2) {
      difference = diffNumBtwStr(cur_url, listNode[i].href);
      if (difference != TOO_BIG_NUMBER && difference != 0 && haveSameParent(listNode[j], listNode[i], "TBODY") != null) { // close number && same parent        
        gSmartNextPage = listNode[i];
        gTargetWindow = curWindow;
        return 1;
      }
    }
  }
  
  return -1;
}

// compare neighbour urls and find consecutive numbers
// this function must be run after compareCurURL()
function compareNeighURL(curWindow) {
  var nodelink, neighlink;
  var listNode = curWindow.document.getElementsByTagName("A");
  var difference;
  var shared_parent;
  var i, j;

  for (i=listNode.length-1; i>0; i--) {
    nodelink = listNode[i].href;
    neighlink = listNode[i-1].href;
    if (nodelink.length-neighlink.length < 2 && nodelink.length-neighlink.length > -2) { // length should be similar
      if (gCurUrlNode != null) { // this node shouldn't be in the table where the current link node is.
        if (listNode[i] == gCurUrlNode) { // this node is the current link node.
          continue;
        }
        if (haveSameParent(listNode[i], gCurUrlNode, "TBODY") != null) { // this node is part of the table.
          //alert("haveSameParent");
          continue;
        }
      }
      if (findPosX(listNode[i]) != findPosX(listNode[i-1])) {
        //alert("posX is different"+findPosX(listNode[i])+","+findPosX(listNode[i-1]));
        continue;
      }
      difference = diffNumBtwStr(nodelink, neighlink);
      if (difference != TOO_BIG_NUMBER && difference != 0) { // found a pair.
        nodelink = listNode[i-1].href;
        neighlink = listNode[i-2].href;
        difference = diffNumBtwStr(nodelink, neighlink);
        if (difference == TOO_BIG_NUMBER || difference == 0) { // make sure it is not a series.
          if (gNextPrev == -1) {
            gStatusbar.label = "Down/Next";
            gSmartNextPage = listNode[i];            
          }
          else if (gNextPrev == -2) {
            gStatusbar.label = "Up/Prev";
            gSmartNextPage = listNode[i-1];            
          }        
          gTargetWindow = curWindow;
          return 1;
        }
        else {
          return -1;
        }
      }
    }
  }
  
  return -1;
}

var gPageParam;
var gPageStep;

// recursive search through frames
function recursiveSearchWindows(curWindow, methodNum) {
  var i, ret = 0;

  switch(methodNum) {
    case METHOD_FIND_NUM_SERIES:
      findCurrentPageNum(curWindow);
      break;
    case METHOD_FIND_NEXT_PREV_TEXT:
      findNextText(curWindow);
      break;
    case METHOD_FIND_NEXT_PREV_JAVA_FUNC:
      findNextJavaFunc(curWindow);
      break;
    case METHOD_COMPARE_CURRENT_URL:
      compareCurURL(curWindow);
      break;
    case METHOD_COMPARE_NEIGHBOUR_URL:
      compareNeighURL(curWindow);
    default:
      break;
  }
  
  if (gSmartNextPage != null) return 1; // return if already found
  
  // traverse child windows
  for (i=0; i<curWindow.frames.length; i++) {
    ret = recursiveSearchWindows(curWindow.frames[i], methodNum);
    if (ret == 1) break;
  }
  return ret;
}

// click the node. (a href="http://...", onclick="f()", a href="javascript:f()")
function clickNode(aNode) {
  var e;
  var cNode = findClickableParent(aNode);
  if (cNode == null) {
    //alert("This is not clickable.");
  }
  else if (cNode.hasAttribute("onclick")) {
    //alert("execute onclick event.");
    e = document.createEvent("MouseEvents");
    e.initMouseEvent("click", 1, 1, window, 1, 0,0,0,0,0,0,0,0,0,cNode);
    cNode.dispatchEvent(e);
    return 1;
  }
  else if (cNode.nodeName == "A") {
    gTargetWindow.location.href = cNode.href;
    return 1;
  }
  else {
    //alert("This is not clickable..."+cNode.nodeName);
  }
  return -1;
}

// gNextPrev = -1(next page), -2(prev page), others(go to page)
function mainSmartPager(param) {
  //alert("Start!!!!!!!");  
  gNextPrev = param;
  if (gNextPrev == -1) gSmartNextNum = 999999;
  else if (gNextPrev == -2) gSmartNextNum = -1;
  else gSmartNextNum = 1;
  gStatusbar = document.getElementById("smartpager_status");
  gPageParam = null;
  gPageStep = 0;
  gSmartNextPage = null;
  gTargetWindow = null;
  
  ////// Method 4. Let's compare numbers in url with current url.
  if (gMethodSelect > 0) {
    gStatusbar.style.color = '#0022DD'
    recursiveSearchWindows(gBrowser.contentWindow, METHOD_COMPARE_CURRENT_URL);
    if (gSmartNextPage == null) {
      //alert("Method 4 Failed.");
    }
    else if (gNextPrev < 0) { // next/prev page
      clickNode(gSmartNextPage);
      show_statusbar();
      return 1;
    }
  }
  
  ////// Method 1. Let's find number series.
  if (gMethodSelect >= 0) {
    gTextNodes = new Array(MAX_TEXT_NODES_NUM);
    gKeyAttrArray = new Array(MAX_KEY_ATTR_NUM);
    gKeyAttrArray[0] = "color";
    gKeyAttrArray[1] = "class";
    gKeyAttrArray[2] = "style";
    gKeyAttrArray[3] = "size";
  
    gStatusbar.style.color = '#FF0000'
    recursiveSearchWindows(gBrowser.contentWindow, METHOD_FIND_NUM_SERIES);
    if (gSmartNextPage == null) { // can't find page parameter
      //alert("Method 1 Failed.");
    }
    else if (gNextPrev < 0) { // next/prev page
      clickNode(gSmartNextPage);
      show_statusbar();
      return 1;
    }
    else { // go to specific page
      //alert("Not supported in this version.");
      return 1;
    }
  }
  
  ////// Method 5. Let's compare neighbour urls and find consecutive numbers.
  if (gMethodSelect > 0) {
    gStatusbar.style.color = '#0000FF'
    recursiveSearchWindows(gBrowser.contentWindow, METHOD_COMPARE_NEIGHBOUR_URL);
    if (gSmartNextPage == null) {
      //alert("Method 5 Failed.");
    }
    else if (gNextPrev < 0) { // next/prev page
      clickNode(gSmartNextPage);
      show_statusbar();
      return 1;
    }
  }
  
  ////// Method 2. Let's find keyword(next, prev...)
  if (gMethodSelect > 0) {
    gNextKeywordArray = new Array(MAX_NEXTPREV_KEYWORD_NUM);
    gPrevKeywordArray = new Array(MAX_NEXTPREV_KEYWORD_NUM);
    gNextKeywordArray[0] = "next newest";
    gNextKeywordArray[1] = "next";
    gPrevKeywordArray[0] = "next oldest";
    gPrevKeywordArray[1] = "prev";
    
    gStatusbar.style.color = '#0044BB'
    recursiveSearchWindows(gBrowser.contentWindow, METHOD_FIND_NEXT_PREV_TEXT);
    if (gSmartNextPage == null) { // can't find page parameter
      //alert("Method 2 Failed.");
    }
    else if (gNextPrev < 0) { // next/prev page
      clickNode(gSmartNextPage);
      show_statusbar();
      return 1;
    }
  }
  
  ////// Method 3. Let's find javascript fuction with keywords
  if (gMethodSelect > 0) {
    if (gNextPrev == -1) gpJavaFuncKeyword = "next";
    else if (gNextPrev == -2) gpJavaFuncKeyword = "prev";
    else gpJavaFuncKeyword = "...";
    
    gStatusbar.style.color = '#006699'
    recursiveSearchWindows(gBrowser.contentWindow, METHOD_FIND_NEXT_PREV_JAVA_FUNC);
    if (gSmartNextPage == null) {
      //alert("Method 3 Failed.");
    }
    else if (gNextPrev < 0) {
      clickNode(gSmartNextPage);
      show_statusbar();
      return 1;
    }
  }
  
  return 1;
}