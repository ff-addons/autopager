/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var test = {
    consoleError: function(message) {
        Components.utils.reportError(message)
    },
    init : function()
    {
        test.consoleError("init");
        window.addEventListener("DOMContentLoaded", test.onContentLoad, true);
        window.addEventListener("load", test.onContentLoad, true);
    },
    onContentLoad : function (event)
    {
        test.consoleError("Test DOMContentLoaded:" + event);
    }

}
try{
test.init();
}catch(e)
{
    test.consoleError(e);
}


// this is content.js

function domTitleChanged(e) {
  // Send the title to the main application process
  let title = content.document.title;
  test.consoleError("MyCode:TitleChanged:"+title );
}

function domLinkAdded(e) {
  // Send the link state to the main application process
  let link = e.originalTarget;
  let json = {
    type: link.type,
    rel: link.rel,
    href: link.href
  };
  test.consoleError("MyCode:LinkAdded"+ json);
}

addEventListener("DOMTitleChanged", domTitleChanged, false);
addEventListener("DOMLinkAdded", domLinkAdded, false);
