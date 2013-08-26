// NOTE! This code uses pipe() and not then() to pipe Deferreds, as the host page is jQuery 1.6.4
// (i.e. less than 1.8, when then() becomes replacement for pipe()).

/*jslint browser: true*/
/*global jQuery, console*/
define([

"module",

"./deferred-utils", "./console", "./ajax",

"./units-required-model", "./units-required", "./adventures-page", "./thesettlersonline-wiki"

], function(module, deferredUtils, console, ajax, unitsRequiredModel, unitsRequired, adventuresPage, wiki) {
    var $ = jQuery;
    if ("1.6.4" !== jQuery.fn.jquery) {
        throw new Error("Expected jQuery 1.6.4!");
    }

    var DEBUG = true;
    var log = console.createLog(module.id, DEBUG);

    var AdventuresPage = adventuresPage.AdventuresPage;
    var UnitList = unitsRequiredModel.UnitList;

    function get(url) {
        return ajax.ajax(url);
    }

    function undef(o) {
        return "undefined" === typeof o;
    }

    /**
     * Remove the JS that tries to ensure the page is the top frame/window.
     */
    function preventNavigation(html) {
        var len = html.length;
        html = html.replace("if(top != self){top.location = self.location}", "");
        if (html.length === len) {
            log("Did not find 'top.location = self.location' code.");
        }
        return html;
    }

    function getAdventureDetails(iframe) {
        var doc = iframe.contentWindow.document,
            $doc = $(doc);
        try {
            var attackPlan = unitsRequired.getUnitsRequired($doc.find("table.example-sim"));
            var title = $doc.find("title").text().trim();
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
    function handleAdventure(idx, html) {
        log("handleAdventure.enter", arguments);

        var dfd = $.Deferred();

        var $iframe = createIFrame().attr("data-idx", idx);
        var iframe = $iframe[0];

        $(document.body).append($iframe);
        $iframe.load(function(evt) {
            log("handleAdventure.iframe.loaded", idx, arguments);
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

        log("handleAdventure.exit");

        return dfd.promise();
    }

    function getTotalLosses(attackPlan) {
        var lastSimIdx = attackPlan.sims.length - 1;
        var result = new UnitList();
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

    function mapHtmlToAttackPlan(idx, html, status, xhr) {
        log("processXhr", arguments);
        if ("success" === status) {
            return handleAdventure(idx, html).pipe(function(details) {
                log("processXhr.success", arguments);
                return deferredUtils.resolveWith(status, details).promise();
            });
        }
        return deferredUtils.rejectWith("xhr error", xhr).promise();
    }

    function handleDetails(li, details) {
        var xp = AdventuresPage.liXp(li);
        var title = AdventuresPage.liTitle(li);
        var totalLosses = getTotalLosses(details.attackPlan);
        var tuv = totalLosses.totalUnitValue();
        // XP as calculated is called xp2. xp remains as recorded from the adventures page.
        return {
            totalLosses: totalLosses,
            title: title,
            xp2: xp,
            tuv: tuv
        };
    }

    // Creates a bar chart effect
    function createBar(w1, w2) {
        var outer = $("<div>").css({
            "width": w1 + "px"
        }).addClass("bar-outer");
        var inner = $("<div>").css({
            "width": w2 + "px"
        }).addClass("bar-inner");
        return outer.append(inner.append("&nbsp;"));
    }

    function showResults(xhr, li, status, details) {
        li = $(li);
        log(new Date().getTime(), arguments, xhr.idx, xhr.href, details.title, details.error);
        if (details.attackPlan) {
            // Guess at the max xp2/tuv ratio
            var MAX_XP_TUV_RATIO = 40;
            var info = handleDetails(li, details);
            var ratioStr = toNdp("" + (info.xp2 / info.tuv), 2);
            var arr = [info.totalLosses, info.xp2, info.tuv, ratioStr];
            var bar = createBar(100, 100 * (info.xp2 / info.tuv) / MAX_XP_TUV_RATIO);
            var ratioStrEl = $("<div>").css({
                "display": "inline-block",
                "width": "100%",
                "text-align": "center"
            }).append(ratioStr);
            var ratioEl = $("<div>").css("display", "inline-block").append(bar).append("<br>").append(ratioStrEl);
            var lossesEl = $("<span>").append(info.totalLosses.toHtmlString()).append("Total Losses: " + info.tuv);
            li.find(".wiki-link").after(" ").after(lossesEl);
            li.find(".camp-ep").append(ratioEl);
            log([info.title].concat(arr).join("\t"));
            return info;
        }
        return null;
    }

    function checkUndef(a, b, prop) {
        if (prop) {
            a = a[prop];
            b = b[prop];
        }
        if (undef(a)) {
            return undef(b) ? 0 : 1;
        }
        if (undef(b)) {
            return -1;
        }
        return null;
    }

    function checkUndefWrapper(fn, prop) {
        return function(reverse, a, b) {
            var check = checkUndef(a, b, prop);
            if (null !== check) {
                return check;
            }
            return fn(reverse, a, b);
        };
    }

    function sortInfo(infos, reverse, fn) {
        infos.sort(fn.bind(null, reverse));
    }

    var sortInfoByRatio = checkUndefWrapper(function(reverse, a, b) {
        var val = (a.xp / a.tuv) - (b.xp / b.tuv);
        return (true === reverse) ? -val : val;
    }, "tuv");

    var sortInfoByXP = checkUndefWrapper(function(reverse, a, b) {
        var val = a.xp - b.xp;
        return (true === reverse) ? -val : val;
    }, "xp");

    var sortInfoByTotalLosses = checkUndefWrapper(function(reverse, a, b) {
        var val = a.tuv - b.tuv;
        return (true === reverse) ? -val : val;
    }, "tuv");

    function reorderLis(ul, lis, infos) {
        lis.remove();
        infos.forEach(function(info, i) {
            var li = lis[info.idx];
            ul.append(li);
        });
    }

    function whenAllAdventuresProcessed(ads, lis, infos) {
        var UP_ARROW = "\u25B2";
        var DOWN_ARROW = "\u25BC";
        var arrowSpans = null;

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
                sortInfo(infos, reverseSort, sortInfoFn);
                reorderLis(ads, lis, infos);
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

        var sortByRatio = createSortLink("Sort by ratio", sortInfoByRatio);
        var sortByXp = createSortLink("Sort by XP", sortInfoByXP);
        var sortByTotalLosses = createSortLink("Sort by total losses", sortInfoByTotalLosses);
        var btns = [sortByRatio, sortByXp, sortByTotalLosses];

        arrowSpans = $(btns).find("span");

        ads.prepend(createButtonBar(btns));
    }

    function addWikiLink(li, title) {
        var link = $("<a>").addClass("wiki-link").attr("href", wiki.getLink(title)).html("wiki");
        li.append(link);
        return link;
    }

    function addUnitsRequiredLink(li) {
        var link = $("<a>").addClass("units-required-link").attr("href", "#").html("Units Required");
        li.append(link);
        return link;
    }

    function onUnitsRequiredClicked(adventureInfo, evt) {
        evt.preventDefault();
        evt.stopPropagation();

        var link = $(evt.target);
        var li = link.closest("li");
        var i = AdventuresPage.idx(li);

        // Find the adventure info object with matching index.
        // Should only be one, hence the [0].
        var info = adventureInfo.filter(function(info) {
            return info.idx === i;
        })[0];
        //log(i, info);

        var adventureUrl = info.href;

        var xhr = get(adventureUrl);
        xhr.href = adventureUrl;
        xhr.idx = i;

        var dfd = xhr.pipe(mapHtmlToAttackPlan.bind(null, i)).then(function(status, details) {
            details.title = AdventuresPage.liTitle(li);
            var results = showResults(xhr, li, status, details);
            if (results) {
                // Mixin the new data.
                $.extend(info, results);
                link.remove();
            }
        });

        // Prevent default click action
        return false;
    }

    function addRewardsLink(li) {
        var link = $("<a>").addClass("rewards-link").attr("href", "#").html("Rewards");
        li.append(link);
        return link;
    }

    function onRewardsClicked(adventureInfo, evt) {
        evt.preventDefault();
        evt.stopPropagation();

        var link = $(evt.target);
        var li = link.closest("li");
        var title = AdventuresPage.liTitle(li);

        var rewardsImg = li.find("img.rewards").first();
        if (rewardsImg.length < 1) {
            wiki.getRewardsImageSrc(title).then(function(src) {
                var img = $("<img>").addClass("rewards").attr("src", src);
                li.find("p").first().append(img);
            });
        } else {
            rewardsImg.toggle();
        }
    }

    function addStyles(cssStr) {
        if (cssStr.join) {
            cssStr = cssStr.join("\n");
        }
        $("<style>").text(cssStr).appendTo(document.body);
    }

    function execute() {
        var css = [];
        css.push("a.wiki-link { font-family: Tahoma; background: green; color: white; border-radius: 6px; padding: 2px; padding-left: 4px; padding-right: 4px; }");
        css.push(".bar-outer { display: inline-block; background: white; border: solid 1px black; }");
        css.push(".bar-inner { display: inline-block; background: green; }");
        addStyles(css);

        var adventureInfo = [];
        // GLOBAL!
        window["adventureInfo"] = adventureInfo;

        var allDfds = [];

        var page = new AdventuresPage(document);
        var ads = page.findAdventuresElement();

        // For each adventure, load the adventure page, and process it.
        var lis = page.findAdventureLis();
        lis.each(function(i, li) {
            li = $(li);
            AdventuresPage.idx(li, i);
            var xp = AdventuresPage.liXp(li);
            xp = AdventuresPage.xp(li, xp);
            li[0].style.border = "solid lightgray 1px";

            addWikiLink(li, AdventuresPage.liTitle(li));

            var href = AdventuresPage.liAdventureHref(li);
            var unitsRequiredLink = addUnitsRequiredLink(li, href);
            var rewardsLink = addRewardsLink(li, href);

            //log(i, href);

            // Sparsely populate the adventure info with the basics.
            // If we click the adventure info link then we will add more details.
            adventureInfo.push({
                idx: i,
                href: href,
                xp: xp
            });
        });

        // jQuery 1.6.4 does not have 'on'.
        ads.delegate(".units-required-link", "click", onUnitsRequiredClicked.bind(null, adventureInfo));
        ads.delegate(".rewards-link", "click", onRewardsClicked.bind(null, adventureInfo));

        whenAllAdventuresProcessed(ads, lis, adventureInfo);
    }

    return {
        execute: execute
    };
});