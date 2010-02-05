/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var autopagerSiteSetting =
{
    onInit : function ()
    {
        // During initialisation
        //window.addEventListener("load", autopagerSiteSetting.onContentLoad, false);
        window.addEventListener("DOMContentLoaded", autopagerSiteSetting.onContentLoad, false);

//        try{
//            if (getBrowser && getBrowser() && getBrowser().mTabContainer)
//                {
//                    getBrowser().mTabContainer.addEventListener("TabSelect", autopagerSiteSetting.TabSelected, false);
//                }
//        }catch(e){}
    },
    TabSelected : function(event)
    {
        autopagerSiteSetting.onContentLoad(event);
    },
    onContentLoad : function (event)
    {
        var doc = event;

        if (doc == null || !(doc instanceof HTMLDocument))
        {
            if (autopagerUtils.isValidDoc(event.target))
                doc = event.target;
            else if (autopagerUtils.isValidDoc(event.explicitOriginalTarget))
                doc = event.explicitOriginalTarget;
            else if (autopagerUtils.isValidDoc(event.originalTarget))
                doc = event.originalTarget;
        }
        doc = autopagerUtils.getTopDoc(doc)
        if (!doc || !doc.location || !doc.location.href || !(doc.location.href.match(/\.teesoft\.info/)))
            return;
        var flag =doc.getElementById("autopagerRulesSubmitter");
        if (!flag)
            return;
        autopagerSiteSetting.loadfromclip(doc);
    },
loadfromclip : function(doc)
{
    //alert("loading");
    //if (window.opener!=null && window.opener.autopagerPublicSite != null)
    var site = autopagerRules.getPublishingSite();
    if (site!=null)
    {
        var guid =doc.getElementsByName("guid");
        if (guid && guid.length>0)
        {   
        //var site = window.opener.autopagerPublicSite;
        
        autopagerSiteSetting.autopagerSetField(doc,site,"guid");
        autopagerSiteSetting.autopagerSetField(doc,site,"urlPattern");
        autopagerSiteSetting.autopagerSetCheck(doc,site,"urlIsRegex","isRegex");
        autopagerSiteSetting.autopagerSetField(doc,site,"margin");
        autopagerSiteSetting.autopagerSetField(doc,site,"minipages");
        autopagerSiteSetting.autopagerSetField(doc,site,"delaymsecs");
        autopagerSiteSetting.autopagerSetField(doc,site,"linkXPath");
        autopagerSiteSetting.autopagerSetField(doc,site,"containerXPath");
        autopagerSiteSetting.autopagerSetField(doc,site,"monitorXPath");
        autopagerSiteSetting.autopagerSetFieldArray(doc,site,"contentXPath");
        autopagerSiteSetting.autopagerSetField(doc,site,"desc");
        autopagerSiteSetting.autopagerSetCheck(doc,site,"enableJS");
        autopagerSiteSetting.autopagerSetCheck2(doc,"forceJS",site.enableJS>1);
        autopagerSiteSetting.autopagerSetCheck(doc,site,"quickLoad");
        autopagerSiteSetting.autopagerSetCheck(doc,site,"fixOverflow");
        autopagerSiteSetting.autopagerSetCheck(doc,site,"ajax");
        autopagerSiteSetting.autopagerSetCheck(doc,site,"needMouseDown");
        //window.opener.autopagerPublicSite = null;
        autopagerRules.setPublishingSite(null);
        autopagerSiteSetting.autopagerSetFieldArray(doc,site,"removeXPath");
        autopagerSiteSetting.autopagerSetFieldArray(doc,site,"testLink");
        }
         
    }
    //  alert(window.opener.autopagerPublicSite);
    
},
autopagerSetCheck : function(doc,site,name,attr)
{
  if (!attr)
      attr = name;
    if (site[attr] == 1 || site[attr])
      doc.getElementsByName(name)[0].checked = true;
    else
       doc.getElementsByName(name)[0].checked = false;
},
autopagerSetCheck2 : function(doc,name,value)
{
    doc.getElementsByName(name)[0].checked = value;
}
,autopagerSetField : function(doc,site,name)
{
    if (site[name])
        doc.getElementsByName(name)[0].value = site[name];
}
,autopagerSetFieldArray:function(doc,site,name)
{
	try{
    var values = site[name];
    if (values==null)
    	return;
    for(var i=0 ;i<values.length;++i)
    {
        var el = name;
        var n = 1 + i;
        if (i!=0)
            el = el + n;
        doc.getElementsByName(el)[0].value = values[i];
    }
  }
  catch(e)
  {
  }
    
}
}
autopagerSiteSetting.onInit();