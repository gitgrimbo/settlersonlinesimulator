/*jslint browser: true*/
/*global console*/
require(["adventures-page", "full-adventure-info", "sort-adventures", "units-required"], function(adventuresPage, fai, sortAdventures, unitsRequired) {
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