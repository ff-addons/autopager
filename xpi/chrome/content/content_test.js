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
        window.addEventListener("DOMContentLoaded", autopagerMain.onContentLoad, true);
    },
    onContentLoad : function (event)
    {
        test.consoleError("Test DOMContentLoaded:" + event);
    }

}

test.init();