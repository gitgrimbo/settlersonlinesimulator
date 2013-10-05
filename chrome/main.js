/*jslint browser: true*/
/*global console*/

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

require(["adventures-page", "full-adventure-info", "sort-adventures", "units-required/ui-app"], function(adventuresPage, fai, sortAdventures, unitsRequired) {
	function match(action, location) {
		var r = action.re.test(location[action.match]);
		return r;
	}

	var actions = [];
	actions.push({
		match: "pathname",
		re: new RegExp("^/dso_kampfsimulator/en/adventures/$"),
		execute: function() {
			fai.execute();
		}
	}, {
		match: "pathname",
		re: new RegExp("^/dso_kampfsimulator/en/adventures/.+$"),
		execute: function() {
			unitsRequired.execute();
		}
	});

	actions.forEach(function(action) {
		if (match(action, window.location)) {
			action.execute();
		}
	});
});