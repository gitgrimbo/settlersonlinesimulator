/*

Module to provide an abstraction for loading an adventure attack plan details.

*/
define([
    "module", "jquery", "../context", "../console", "../deferred-utils", "./PageParser"
], function(module, $, GRIMBO, _console, deferredUtils, UnitsRequiredPageParser) {
    var DEBUG = GRIMBO.debug;
    var log = _console.createLog(module.id, DEBUG);

    function get() {
        return $.ajax.apply($, arguments);
    }

    function loadAttackPlan(adventureInfo, troopOptions) {
        troopOptions = troopOptions || {
            "general": "GII",
            "my_r": 200,
            "my_m": 200,
            "my_s": 200,
            "my_e": 0,
            "my_c": 200,
            "my_b": 200,
            "my_lb": 200,
            "my_a": 0,
            "my_k": 0,
            "wave": 3,
            "limit_user_units": 220
        };

        var href = adventureInfo.href;
        href += "?" + $.param(troopOptions);

        var xhr = get(href);

        xhr.href = href;
        xhr.idx = adventureInfo.idx;

        return xhr.pipe(mapHtmlToAttackPlan.bind(null, adventureInfo.idx));
    }

    function getAdventureDetails(html) {
        try {
            var attackPlan = UnitsRequiredPageParser.getAttackPlanFromHtml(html);
            var title = "FAKE"; //$doc.find("title").text().trim();
            return {
                attackPlan: attackPlan,
                title: title
            };
        } catch (e) {
            return {
                error: e
            };
        }
    }

    function mapHtmlToAttackPlan(idx, html, status, xhr) {
        log("processXhr", arguments);
        if ("success" === status) {
            var details = getAdventureDetails(html);
            return deferredUtils.resolveWith(status, details).promise();
        }

        return deferredUtils.rejectWith("xhr error", xhr).promise();
    }

    return {
        loadAttackPlan: loadAttackPlan,
        getAdventureDetails: getAdventureDetails
    };

});