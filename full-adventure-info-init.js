// jQuery dance
// jQuery should be on the page already, but we want to use it as a module.
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

define(["./full-adventure-info"], function(fai) {
    fai.execute();
});
