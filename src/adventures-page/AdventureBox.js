// NOTE! This code uses pipe() and not then() to pipe Deferreds, as the host page is jQuery 1.6.4
// (i.e. less than 1.8, when then() becomes replacement for pipe()).

/*

The AdventureBox is the per-adventure UI element on the "Adventures"
page (http://settlersonlinesimulator.com/dso_kampfsimulator/en/adventures/).

*/
/*jslint browser: true*/
/*global jQuery, console*/
define([

"module",

"../deferred-utils", "../console", "../ajax", "../ui-utils",

"../adventures-model", "../units-required/model/UnitList", "../units-required/ui-app", "../units-required/Service", "../adventures-page", "../thesettlersonline-wikia-com"

], function(module, deferredUtils, _console, ajax, uiUtils, adventuresModel, UnitList, unitsRequired, UnitsRequiredService, adventuresPage, wiki) {

    var $ = jQuery;

    var DEBUG = false;
    var log = _console.createLog(module.id, DEBUG);

    var AdventuresPage = adventuresPage.AdventuresPage;
    var AdventuresModel = adventuresModel;





    function toNdp(s, n) {
        var i = s.indexOf(".");
        if (i < 0) {
            return s;
        }
        return s.substring(0, i + n + 1);
    }

    function handleDetails(li, details) {
        var xp = AdventuresPage.liXp(li);
        var title = AdventuresPage.liTitle(li);
        var totalLosses = details.attackPlan.getTotalLosses();
        var tuv = totalLosses.totalUnitValue();
        // XP as calculated is called calculatedXP. xp remains as recorded from the adventures page.
        return {
            totalLosses: totalLosses,
            title: title,
            calculatedXP: xp,
            tuv: tuv
        };
    }





    function RatioBar() {
    }

    RatioBar.prototype.create = function() {
        var bar = uiUtils.createBar({
            width: "100px"
        }, {
            width: "100%"
        });
        return (this.bar = bar);
    };

    RatioBar.prototype.update = function(percent) {
        var inner = this.bar.find(".bar-inner");
        inner.css({
            width: percent + "%"
        });
    };

    // UI class for an Adventure Box
    // All the UI handling for the enhancements to each adventure <li>

    function AdventureBox(li, adventureInfo, wikis) {
        this.li = li;
        this.adventureInfo = adventureInfo;
        this.wikis = wikis;
    }

    AdventureBox.prototype.updateRatioBar = function(ratio, maxRatio) {
        if (!this.ratioBar) {
            return;
        }
        var percent = 100 * (ratio / maxRatio);
        this.ratioBar.update(percent);
    };

    AdventureBox.prototype.showResults = function(details, maxRatio) {
        var li = $(this.li);
        if (details.attackPlan) {
            var info = handleDetails(li, details);

            var ratio = info.calculatedXP / info.tuv;

            var ratioStr = toNdp("" + ratio, 2);
            var arr = [info.totalLosses, info.calculatedXP, info.tuv, ratioStr];
            var ratioStrEl = $("<div>").css({
                "display": "inline-block",
                "width": "100%",
                "text-align": "center"
            }).append(ratioStr);

            this.ratioBar = new RatioBar();
            var bar = this.ratioBar.create();

            var ratioEl = $("<div>").css("display", "inline-block").append(bar).append("<br>").append(ratioStrEl);
            var lossesEl = $("<div>").attr("style", "padding: 2px;").append(uiUtils.unitListToHtml(info.totalLosses)).append("Total Losses: " + info.tuv);
            li.find(".wiki-link").first().before(lossesEl);
            li.find(".camp-ep").append(ratioEl);
            log([info.title].concat(arr).join("\t"));
            return info;
        } else if (details.error) {
            li.find(".wiki-link").first().before(details.error.message);
        }
        return null;
    };

    AdventureBox.prototype.addWikiLinks = function(title) {
        var box = this;
        var links = this.wikis.map(function(wiki, idx) {
            var href = wiki.getHrefForAdventure(title);

            var link = $("<a>").addClass("wiki-link btn-link");
            link.attr("href", href);
            link.attr("title", wiki.getName());
            link.html("").append("<img src='" + wiki.getIcon() + "'>").append(" wiki");

            if (idx > 0) {
                box.li.append(" ");
            }
            box.li.append(link);

            return link;
        });
        return links;
    };

    AdventureBox.prototype.addUnitsRequiredLink = function() {
        var link = $("<a>").addClass("units-required-link btn-link").attr("href", "#").html("Units Required");
        this.li.append("&nbsp;").append(link);
        return link;
    };

    AdventureBox.prototype.addAllUnitsRequiredLink = function() {
        var link = $("<a>").addClass("all-units-required-link btn-link").attr("href", "#").html("*");
        this.li.append("&nbsp;").append(link);
        return link;
    };

    AdventureBox.loadAttackPlan = function(adventureInfo) {
        return UnitsRequiredService.loadAttackPlan(adventureInfo);
    };

    AdventureBox.prototype.updateWithAttackPlan = function(status, details) {
        var li = this.li;
        var info = this.adventureInfo;
        var link = li.find(".units-required-link").first();
        details.title = AdventuresPage.liTitle(li);
        var results = this.showResults(details);
        if (results) {
            // Mixin the new data.
            $.extend(info, results);
            link.remove();
        }
        return results;
    };

    AdventureBox.updateAllAttackPlans = function(adventureBoxes, progressCallback) {
        function updateAdventureBoxRatioBars(maxRatio) {
            adventureBoxes.forEach(function(box) {
                var ratio = box.adventureInfo.calculatedXP / box.adventureInfo.tuv;
                box.updateRatioBar(ratio, maxRatio);
            });
        }

        var count = 0;
        var maxRatio = 0;
        var size = adventureBoxes.length;
        var dfds = adventureBoxes.map(function(box) {
            var adventureInfo = box.adventureInfo;
            return AdventureBox.loadAttackPlan(adventureInfo).then(function(status, details) {
                progressCallback({
                    item: ++count,
                    size: size
                });
                box.updateWithAttackPlan(status, details);
                var ratio = adventureInfo.calculatedXP / adventureInfo.tuv
                if (ratio > maxRatio) {
                    maxRatio = ratio;
                }
            });
        });
        return $.Deferred(function(dfd) {
            $.when.apply($, dfds).then(function(it) {
                updateAdventureBoxRatioBars(maxRatio);
                dfd.resolve(it);
            });
        });
    };

    AdventureBox.onAllUnitsRequiredClicked = function(adventureBoxes, progressCallback, evt) {
        evt.preventDefault();
        evt.stopPropagation();
        AdventureBox.updateAllAttackPlans(adventureBoxes, progressCallback);
    };

    AdventureBox.onUnitsRequiredClicked = function(adventureBoxes, evt) {
        evt.preventDefault();
        evt.stopPropagation();

        var link = $(evt.target);
        var li = link.closest("li");
        var i = AdventuresPage.idx(li);

        // Find the adventure info object with matching index.
        // Should only be one, hence the [0].
        var box = adventureBoxes.filter(function(box) {
            return box.adventureInfo.idx === i;
        })[0];

        AdventureBox.loadAttackPlan(box.adventureInfo).then(box.updateWithAttackPlan.bind(box));
    };

    AdventureBox.prototype.addRewardsLink = function() {
        var link = $("<a>").addClass("rewards-link btn-link").attr("href", "#").html("Rewards");
        this.li.append("&nbsp;").append(link);
        return link;
    };

    AdventureBox.onRewardsClicked = function(adventureInfoList, evt) {
        evt.preventDefault();
        evt.stopPropagation();

        var link = $(evt.target);
        var li = link.closest("li");
        var title = AdventuresPage.liTitle(li);

        var rewards = li.find(".rewards").first();
        if (rewards.length < 1) {
            wiki.getRewardsImageSrc(title).then(function(src) {
                var img = $("<img>").attr("src", src);
                var p = $("<p>").addClass("rewards");
                p.append(img);
                li.find("p").first().after(p);
            });
        } else {
            rewards.toggle();
        }
    };

	return AdventureBox;

});