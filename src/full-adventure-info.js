// NOTE! This code uses pipe() and not then() to pipe Deferreds, as the host page is jQuery 1.6.4
// (i.e. less than 1.8, when then() becomes replacement for pipe()).

/*jslint browser: true*/
/*global jQuery, console*/
define([

"module",

"./deferred-utils", "./console", "./ajax", "./ui-utils", "./adventures-page/AdventureBox",

"./adventures-model", "./units-required/model", "./units-required/ui-app", "./units-required/Service", "./adventures-page", "./thesettlersonline-wiki"

], function(module, deferredUtils, _console, ajax, uiUtils, AdventureBox, adventuresModel, unitsRequiredModel, unitsRequired, UnitsRequiredService, adventuresPage, wiki) {
    var $ = jQuery;
    if ("1.6.4" !== jQuery.fn.jquery) {
        throw new Error("Expected jQuery 1.6.4!");
    }

    var DEBUG = false;
    var log = _console.createLog(module.id, DEBUG);

    var AdventuresPage = adventuresPage.AdventuresPage;
    var UnitList = unitsRequiredModel.UnitList;
    var AdventuresModel = adventuresModel;





    function reorderLis(ul, lis) {
        lis.forEach(function(li) {
            li.remove();
        });
        lis.forEach(function(li) {
            ul.append(li);
        });
    }

    function whenAllAdventuresProcessed(ads, adventureBoxes, adventureInfoList) {
        var UP_ARROW = "\u25B2";
        var DOWN_ARROW = "\u25BC";
        var arrowSpans = null;
        var clone = adventureBoxes.slice();

        function createButtonBar(btns) {
            var div = $("<div>").html("[ ");
            for (var i = 0; i < btns.length; i++) {
                if (i > 0) {
                    div.append(" | ");
                }
                div.append(btns[i]);
            }
            div.append(" ]");

            var style = div[0].style;
            style.padding = "2px";
            style.borderTop = "solid 2px green";
            style.borderBottom = "solid 2px green";

            return div;
        }

        function createSortBtnHandler(sortInfoFn) {
            return function(evt) {
                // this === anchor
                evt.preventDefault();
                var reverseSort = !! this.reverseSort;

                AdventuresModel.sortInfo(adventureInfoList, reverseSort, sortInfoFn);

                for (var i = 0; i < adventureInfoList.length; i++) {
                    adventureBoxes[i] = clone[adventureInfoList[i].idx];
                }

                var lis = adventureBoxes.map(function(box) {
                    return box.li;
                });
                reorderLis(ads, lis);
                this.reverseSort = !reverseSort;
                // Clear the arrows from all sort links
                arrowSpans.empty();
                $(this).find("span").html(reverseSort ? UP_ARROW : DOWN_ARROW);
            };
        }

        function createSortLink(text, sortInfoFn) {
            // for the arrow
            var span = $("<span>");
            return $("<a>").attr("href", "#").html(text).append(span).click(createSortBtnHandler(sortInfoFn))[0];
        }

        var sortByRatio = createSortLink("Sort by ratio", AdventuresModel.sortInfoByRatio);
        var sortByXp = createSortLink("Sort by XP", AdventuresModel.sortInfoByXP);
        var sortByTotalLosses = createSortLink("Sort by total losses", AdventuresModel.sortInfoByTotalLosses);
        var btns = [sortByRatio, sortByXp, sortByTotalLosses];

        arrowSpans = $(btns).find("span");

        ads.prepend(createButtonBar(btns));
    }

    function execute() {
        var css = [];
        css.push("a.btn-link { font-family: Tahoma; background: green; color: white; border-radius: 6px; padding: 2px; padding-left: 4px; padding-right: 4px; }");
        css.push(".bar-outer { display: inline-block; background: white; border: solid 1px black; }");
        css.push(".bar-inner { display: inline-block; background: green; }");
        uiUtils.addStyles(css);

        var adventureInfoList = [];
        // GLOBAL!
        window["adventureInfoList"] = adventureInfoList;

        var allDfds = [];

        var page = new AdventuresPage(document);
        var ads = page.findAdventuresElement();

        // For each adventure, load the adventure page, and process it.
        var lis = page.findAdventureLis().toArray();
        var adventureBoxes = lis.map(function(li, i) {
            li = $(li);

            AdventuresPage.idx(li, i);
            var xp = AdventuresPage.liXp(li);
            xp = AdventuresPage.xp(li, xp);
            li[0].style.border = "solid lightgray 1px";

            var href = AdventuresPage.liAdventureHref(li);

            var adventureInfo = {
                idx: i,
                href: href,
                xp: xp
            };

            var adventureBox = new AdventureBox(li, adventureInfo);
            adventureBox.addWikiLink(AdventuresPage.liTitle(li));
            var unitsRequiredLink = adventureBox.addUnitsRequiredLink();
            var allUnitsRequiredLink = adventureBox.addAllUnitsRequiredLink();
            var rewardsLink = adventureBox.addRewardsLink(href);

            //log(i, href);

            // Sparsely populate the adventure info with the basics.
            // If we click the adventure info link then we will add more details.
            adventureInfoList.push(adventureInfo);

            return adventureBox;
        });

        // A callback that is fired for each adventure that is loaded, when we're finding out the units required
        var allUnitsRequiredProgressCallback = (function() {
            var bar = uiUtils.createBar({
                width: "100%",
                fontSize: "4px",
                marginBottom: "2px"
            }, {
                width: "0%"
            });
            var inner = bar.find("div").first();

            return function(info) {
                $(ads).prepend(bar);
                var msg = info.item + " of " + info.size;
                inner.css("width", (info.item / info.size) * 100 + "%");
            };
        }());

        // jQuery 1.6.4 does not have 'on'.
        ads.delegate(".all-units-required-link", "click", AdventureBox.onAllUnitsRequiredClicked.bind(null, adventureBoxes, allUnitsRequiredProgressCallback));
        ads.delegate(".units-required-link", "click", AdventureBox.onUnitsRequiredClicked.bind(null, adventureBoxes));
        ads.delegate(".rewards-link", "click", AdventureBox.onRewardsClicked.bind(null, adventureBoxes));

        whenAllAdventuresProcessed(ads, adventureBoxes, adventureInfoList);
    }

    return {
        execute: execute
    };
});