/*jslint browser: true*/
/*global jQuery, console*/
define(["./units-required", "./adventures-page"], function(unitsRequired, adventuresPage) {
    var $ = jQuery;
    var AdventuresPage = adventuresPage.AdventuresPage;

    function get(url) {
        return $.ajax(url);
    }

    /**
     * Remove the JS that tries to ensure the page is the top frame/window.
     */
    function preventNavigation(html) {
        return html.replace("if(top != self){top.location = self.location}", "");
    }

    function getAdventureDetails(iframe) {
        var doc = iframe.contentWindow.document,
            $doc = $(doc);
        var attackPlan, title, error;
        try {
            attackPlan = unitsRequired.getUnitsRequired($doc.find("table.example-sim"));
            title = $doc.find("title").text().trim();
        } catch (e) {
            error = e;
        }
        return {
            attackPlan: attackPlan,
            title: title,
            error: error
        };
    }

    function createIFrame() {
        // w=1, h=1 so the iframe is visible, and thus capable of load events.
        return $("<iframe>").attr({
            width: 1,
            height: 1
        });
    }

    /**
     * Processes the adventure page by returning a Deferred that is resolved with the adventure's
     * details.
     */
    function handleAdventure(html) {
        var dfd = $.Deferred();

        var $iframe = createIFrame();
        var iframe = $iframe[0];

        $(document.body).append($iframe);
        $iframe.load(function(evt) {
            var details = getAdventureDetails(iframe);
            $iframe.remove();
            dfd.resolve(details);
        });

        // Write the processed html to the iframe, which will trigger the load event, and therefore
        // trigger our callback.
        var html2 = preventNavigation(html);
        var doc = iframe.contentWindow.document;
        doc.open();
        doc.write(html2);
        doc.close();

        return dfd;
    }

    function getTotalLosses(attackPlan) {
        var lastSimIdx = attackPlan.sims.length - 1;
        var result;
        attackPlan.doCalcs(function(sim, idx, totalLosses, totalActive, totalXP) {
            if (lastSimIdx === idx) {
                result = totalLosses;
            }
        });
        return result;
    }

    function toNdp(s, n) {
        var i = s.indexOf(".");
        if (i < 0) {
            return s;
        }
        return s.substring(0, i + n + 1);
    }

    function processXhr(li, html, status, xhr) {
        if ("success" === status) {
            handleAdventure(html).then(function(details) {
                console.log(new Date().getTime(), xhr.idx, xhr.href, details.title, details.error);
                if (!details.error) {
                    var xp = AdventuresPage.liXp(li);
                    var title = AdventuresPage.liTitle(li);
                    var totalLosses = getTotalLosses(details.attackPlan);
                    var tuv = totalLosses.totalUnitValue();
                    var ratio = toNdp("" + (xp / tuv), 2);
                    var arr = [totalLosses, xp, tuv, ratio];
                    li.append($("<div>").html(arr.join("\t")));
                    console.log([title].concat(arr).join("\t"));
                }
            });
        }
    }

    function execute() {
        var ads = $("#adventures");
        // For each adventure, load the adventure page, and process it.
        ads.find(".adventure-title").find("a:first").each(function(i) {
            var href = this.href;
            //console.log(i, href);
            // XP from adventures page is sometimes different to that calculated on the specific
            // adventure page. Not sure why.
            var li = $(this).closest("li");
            var dfd = get(href).then(processXhr.bind(null, li));
            dfd.href = href;
            dfd.idx = i;
        });
    }

    return {
        execute: execute
    };
});