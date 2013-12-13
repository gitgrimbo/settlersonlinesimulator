// NOTE! This code uses pipe() and not then() to pipe Deferreds, as the host page is jQuery 1.6.4
// (i.e. less than 1.8, when then() becomes replacement for pipe()).

/*jslint browser: true*/
/*global jQuery, console*/
define([

"module",

"../deferred-utils", "../console", "../ajax", "../ui-utils",

"../adventures-model", "../units-required/model", "../units-required/ui-app", "../units-required/Service", "../adventures-page", "../thesettlersonline-wiki"

], function(module, deferredUtils, _console, ajax, uiUtils, adventuresModel, unitsRequiredModel, unitsRequired, UnitsRequiredService, adventuresPage, wiki) {

    var $ = jQuery;

    var DEBUG = false;
    var log = _console.createLog(module.id, DEBUG);

    var AdventuresPage = adventuresPage.AdventuresPage;
    var UnitList = unitsRequiredModel.UnitList;
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





    // UI class for an Adventure Box
    // All the UI handling for the enhancements to each adventure <li>

    function AdventureBox(li, adventureInfo) {
        this.li = li;
        this.adventureInfo = adventureInfo;
    }

    AdventureBox.prototype.showResults = function(details) {
        var li = $(this.li);
        if (details.attackPlan) {
            // Guess at the max calculatedXP/tuv ratio
            var MAX_XP_TUV_RATIO = 40;
            var info = handleDetails(li, details);
            var ratioStr = toNdp("" + (info.calculatedXP / info.tuv), 2);
            var arr = [info.totalLosses, info.calculatedXP, info.tuv, ratioStr];
            var bar = uiUtils.createBar({
                width: "100px"
            }, {
                width: 100 * (info.calculatedXP / info.tuv) / MAX_XP_TUV_RATIO + "px"
            });
            var ratioStrEl = $("<div>").css({
                "display": "inline-block",
                "width": "100%",
                "text-align": "center"
            }).append(ratioStr);
            var ratioEl = $("<div>").css("display", "inline-block").append(bar).append("<br>").append(ratioStrEl);
            var lossesEl = $("<div>").attr("style", "padding: 2px;").append(info.totalLosses.toHtmlString()).append("Total Losses: " + info.tuv);
            li.find(".wiki-link").before(lossesEl);
            li.find(".camp-ep").append(ratioEl);
            log([info.title].concat(arr).join("\t"));
            return info;
        }
        return null;
    };

    AdventureBox.prototype.addWikiLink = function(title) {
        var link = $("<a>").addClass("wiki-link btn-link").attr("href", wiki.getLink(title)).html("wiki");
        this.li.append(link);
        return link;
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
        var box = new AdventureBox(li);
        var results = box.showResults(details);
        if (results) {
            // Mixin the new data.
            $.extend(info, results);
            link.remove();
        }
    };

    AdventureBox.updateAllAttackPlans = function(adventureBoxes, progressCallback) {
        var count = 0;
        var size = adventureBoxes.length;
        var dfds = adventureBoxes.map(function(box) {
            var adventureInfo = box.adventureInfo;
            return AdventureBox.loadAttackPlan(adventureInfo).then(function(status, details) {
                progressCallback({
                    item: ++count,
                    size: size
                });
                box.updateWithAttackPlan(status, details);
            });
        });
        var dfd = $.when.apply($, dfds);
        return dfd;
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