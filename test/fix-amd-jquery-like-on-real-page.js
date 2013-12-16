/*

This script tries to make a pre-existing jQuery object into a "jquery" module.

This has to happen on a real page
  (such as http://settlersonlinesimulator.com/dso_kampfsimulator/en/adventures/)
because the page has already defined jQuery, but we want to use it in our code
as a module.

*/
(function() {
    function maybeDefine(moduleName, scope, property) {
        var ob = scope[property];
        if (ob) {
            define(moduleName, [], function() {
                return ob;
            });
        }
    }
    maybeDefine("jquery", window, "jQuery");
}());
