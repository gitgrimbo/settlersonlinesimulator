/*

Module to provide an abstraction for loading an adventure attack plan details.

*/
define(["module", "jquery", "../context", "../console", "../deferred-utils", "./UnitsRequiredPageParser"], function(module, $, GRIMBO, _console, deferredUtils, UnitsRequiredPageParser) {
    var DEBUG = GRIMBO.debug;
    var log = _console.createLog(module.id, DEBUG);

    function get() {
        return $.ajax.apply($, arguments);
    }

    function loadAttackPlan(adventureInfo) {
        var xhr = get(adventureInfo.href);
        xhr.href = adventureInfo.href;
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