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
        var tests = action.tests;
        for (var i = 0; i < action.tests.length; i++) {
            if (action.tests[i].re.test(location[action.tests[i].prop])) {
                return true;
            }
        }

        return false;
    }

    function Test(prop, re) {
        this.prop = prop;
        this.re = re;
    }

    // data structure to let us execute some code when a URL match is found
    var actions = [];
    actions.push({
        tests: [
            new Test("href", /\/\/localhost\/.*\/adventures.html$/),
            new Test("pathname", /\/dso_kampfsimulator\/en\/adventures\/$/)
        ],
        execute: function() {
            fai.execute();
        }
    }, {
        tests: [
            new Test("href", /\/\/localhost\/.*\/adventures\/.+$/),
            new Test("pathname", /\/dso_kampfsimulator\/en\/adventures\/.+$/)
        ],
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
