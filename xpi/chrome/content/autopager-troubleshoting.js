var autopagerTroubleShoting =
{
    autoFix : function (doc)
    {
        autopagerTroubleShoting.shoting(doc,true);
    },
    shoting : function (doc, autofix)
    {
        //check whether AutoPager enabled
        if (!autopagerMain.getGlobalEnabled())
        {
            if (autofix || autopagerTroubleShoting.prompt("AutoFix","EnableAutoPager"))
                autopagerMain.setGlobalEnabled(true);
        }

        var de = doc.defaultView.top.document.documentElement;
        //check whether AutoPager enabled on the site
        var matched = false;
        if (de.autopagerEnabledDoc != null)
        {
            for(var i=0;i<de.autopagerEnabledDoc.length;i++) {
                var d = de.autopagerEnabledDoc[i];
                if (d.location != null)
                {
                    matched = true;
                    var siteConfirm = autopagerConfig.findConfirm(autopagerConfig.getConfirm(),d.documentElement.autopagerGUID,d.location.host);
                    if (siteConfirm!=null && !siteConfirm.UserAllowed)
                    {
                        if (autofix || autopagerTroubleShoting.prompt("AutoFix","EnableAutoPagerOnSite"))
                        {
                            siteConfirm.UserAllowed = true;
                            document.autopagerConfirmDoc = d
                            autopagerMain.enabledInThisSession(siteConfirm.UserAllowed);
                            autopagerConfig.saveConfirm(autopagerConfig.getConfirm());
                        }
                    }
                }
            }
        }
        //if (autofix || autopagerTroubleShoting.prompt("AutoFix","UpdateRules"))
        {
            UpdateSites.updateOnline(true);
        }
        //check whether there is rules for this site
        if (!matched)
        {
            if (autopagerTroubleShoting.prompt("AutoFix","CreateANewRule"))
            {
                autopagerMain.sitewizard(doc);
            }
            else if (autofix || autopagerTroubleShoting.prompt("AutoFix","RequestHelpOnSite"))
            {
                autopagerMain.requestHelp(doc,doc);
            }
        }

    },
    prompt : function (titleKey,textKey)
    {
        var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
        .getService(Components.interfaces.nsIPromptService);
        return prompts.confirm(window,autopagerConfig.autopagerGetString(titleKey),autopagerConfig.autopagerGetString(textKey));

    }
}