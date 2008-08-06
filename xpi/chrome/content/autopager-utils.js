/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


const autopagerUtils = {
    log: (location.protocol=="chrome:") ? function(message) {
        if (autopagerPref.loadBoolPref("debug"))
        {
        var consoleService = Components.classes['@mozilla.org/consoleservice;1']
                .getService(Components.interfaces.nsIConsoleService);
        consoleService.logStringMessage(message)            
        }
      } : function(message) {
        if (autopagerPref.loadBoolPref("debug"))
           debug(message)
    },
    currentDocument: function()
    {
	return this.currentBrowser().contentDocument;  
    },
    currentBrowser: function()
    {
        var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
	var browserWindow = windowManager.getMostRecentWindow("navigator:browser").document.getElementById("content");


	return browserWindow;  
    },
    cloneBrowser: function(targetB, originalB)
  {
      var webNav = targetB.webNavigation;
    var newHistory = webNav.sessionHistory;

    if (newHistory == null)
        {
            newHistory = Components.classes["@mozilla.org/browser/shistory-internal;1"].getService(Components.interfaces.nsISHistory);
            webNav.sessionHistory = newHistory;
        }
    newHistory = newHistory.QueryInterface(Components.interfaces.nsISHistoryInternal);

    // delete history entries if they are present
    
    if (newHistory.count > 0)
      newHistory.PurgeHistory(newHistory.count);
    var originalHistory  = originalB.webNavigation.sessionHistory;
    originalHistory = originalHistory.QueryInterface(Components.interfaces.nsISHistoryInternal);


    var entry = originalHistory.getEntryAtIndex(originalHistory.index,false).QueryInterface(Components.interfaces.nsISHEntry);
     var newEntry = this.cloneHistoryEntry(entry);
     if (newEntry)
        newHistory.addEntry(newEntry, true);
    

    webNav.gotoIndex(0);
    
  },
  cloneHistoryEntry: function(aEntry) {
    if (!aEntry)
      return null;
    aEntry = aEntry.QueryInterface(Components.interfaces.nsISHContainer);
    var newEntry = aEntry.clone(true);
    newEntry = newEntry.QueryInterface(Components.interfaces.nsISHContainer);
    newEntry.loadType = Math.floor(aEntry.loadType);
    if (aEntry.childCount) {
      for (var j = 0; j < aEntry.childCount; j++) {
          var childEntry = this.cloneHistoryEntry(aEntry.GetChildAt(j));
          if (childEntry)
            newEntry.AddChild(childEntry, j);
      }
    }
    return newEntry;
  }
,  findContentWindow: function(doc) {
  	var ctx = doc;
    if(!ctx)
        return null;
    const ci = Components.interfaces;
    const lm = this.lookupMethod;
    if(!(ctx instanceof ci.nsIDOMWindow)) {
      if(ctx instanceof ci.nsIDOMDocument) {
        ctx = lm(ctx, "defaultView")();
      } else if(ctx instanceof ci.nsIDOMNode) {
        ctx = lm(lm(ctx, "ownerDocument")(), "defaultView")();
      } else return null; 
    }
    if(!ctx) return null;
    ctx = lm(ctx, "top")();
    
    return ctx;
  }

};