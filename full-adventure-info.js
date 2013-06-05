// NOTE! This code uses pipe() and not then() to pipe Deferreds, as the host page is jQuery 1.6.4
// (i.e. less than 1.8, when then() becomes replacement for pipe()).

/*jslint browser: true*/
/*global jQuery, console*/
define(["./units-required", "./adventures-page"], function(unitsRequired, adventuresPage) {
    var DEBUG = true;
    var console = window.console;

    var $ = jQuery;
    var AdventuresPage = adventuresPage.AdventuresPage;
    var UnitList = unitsRequired.UnitList;

    if ("1.6.4" !== jQuery.fn.jquery) {
        throw new Error("Expected jQuery 1.6.4!");
    }

    if (!DEBUG) {
        console = {
            log: function() {}
        };
    }

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
        console.log("handleAdventure.enter", arguments);

        var dfd = $.Deferred();

        var $iframe = createIFrame().attr("data-idx", idx);
        var iframe = $iframe[0];

        $(document.body).append($iframe);
        $iframe.load(function(evt) {
            console.log("handleAdventure.iframe.loaded", idx, arguments);
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

        console.log("handleAdventure.exit");

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

    function rejectWith() {
        var dfd = $.Deferred();
        dfd.reject.apply(dfd, arguments);
        return dfd;
    }

    function resolveWith() {
        var dfd = $.Deferred();
        dfd.resolve.apply(dfd, arguments);
        return dfd;
    }

    function mapHtmlToAttackPlan(idx, html, status, xhr) {
        console.log("processXhr", arguments);
        if ("success" === status) {
            return handleAdventure(idx, html).pipe(function(details) {
                console.log("processXhr.success", arguments);
                return resolveWith(status, details).promise();
            });
        }
        return rejectWith("xhr error", xhr).promise();
    }

    function handleDetails(li, details) {
        var xp = AdventuresPage.liXp(li);
        var title = AdventuresPage.liTitle(li);
        var totalLosses = getTotalLosses(details.attackPlan);
        var tuv = totalLosses.totalUnitValue();
        return {
            totalLosses: totalLosses,
            title: title,
            xp: xp,
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

    var getWikiLink = (function() {
        var wikiMappings = {
            "Island of the Pirates": "The Island of the Pirates",
            "Stealing from the rich": "Stealing from the Rich",
            "The Dark Priests": "Dark Priests",
            "Sons of the veldt": "Sons of the Veld",
            "Victor the vicious": "Victor the Vicious",
            "Mother Love": "Motherly Love",
            "The end of the earth": "The End of the World"
        };

        function getWikiLink(title) {
            // See if we need to map the page name, before replacing spaces with underscores.
            var pageName = (wikiMappings[title] || title).replace(/\s/gi, "_");
            return "http://thesettlersonline.wikia.com/wiki/" + pageName;
        }
        return getWikiLink;
    }());

    function showResults(xhr, li, status, details) {
        li = $(li);
        console.log(new Date().getTime(), arguments, xhr.idx, xhr.href, details.title, details.error);
        if (details.attackPlan) {
            // Guess at the max xp/tuv ratio
            var MAX_XP_TUV_RATIO = 30;
            var info = handleDetails(li, details);
            var ratioStr = toNdp("" + (info.xp / info.tuv), 2);
            var arr = [info.totalLosses, info.xp, info.tuv, ratioStr];
            var bar = createBar(100, 100 * (info.xp / info.tuv) / MAX_XP_TUV_RATIO);
            var ratioStrEl = $("<div>").css({
                "display": "inline-block",
                "width": "100%",
                "text-align": "center"
            }).append(ratioStr);
            var ratioEl = $("<div>").css("display", "inline-block").append(bar).append("<br>").append(ratioStrEl);
            var wikiLink = $("<a>").addClass("wiki-link").attr("href", getWikiLink(details.title)).html("wiki");
            li.append($("<div>").append([info.totalLosses, info.tuv].join(" -- ")).append(" ").append(wikiLink));
            li.find(".camp-ep").append(ratioEl);
            console.log([info.title].concat(arr).join("\t"));
            return info;
        }
        return null;
    }

    function sortInfoByRatio(infos, reverse) {
        infos.sort(function(a, b) {
            var val = (a.xp / a.tuv) - (b.xp / b.tuv);
            return (true === reverse) ? -val : val;
        });
    }

    function sortInfoByXP(infos, reverse) {
        infos.sort(function(a, b) {
            var val = a.xp - b.xp;
            return (true === reverse) ? -val : val;
        });
    }

    function sortInfoByTotalLosses(infos, reverse) {
        infos.sort(function(a, b) {
            var val = a.tuv - b.tuv;
            return (true === reverse) ? -val : val;
        });
    }

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
                sortInfoFn(infos, reverseSort);
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

        var allInfo = window["allInfo"] = [];
        var allDfds = [];

        var ads = $("#adventures");
        // For each adventure, load the adventure page, and process it.
        var lis = ads.find(".adventure-title").find("a:first").map(function(i) {
            var href = this.href;
            var li = $(this).closest("li").attr("data-idx", i)[0];
            //console.log(i, href);
            //if (i > 1) return li;
            // XP from adventures page is sometimes different to that calculated on the specific
            // adventure page. Not sure why.
            var xhr = get(href);
            xhr.href = href;
            xhr.idx = i;
            var dfd = xhr.pipe(mapHtmlToAttackPlan.bind(null, i)).then(function(status, details) {
                details.title = $(li).find(".adventure-title").find("a:first").text().trim();
                var info = showResults(xhr, li, status, details);
                if (info) {
                    info.idx = i;
                    allInfo.push(info);
                }
            });
            allDfds.push(dfd);
            return li;
        });

        $.when.apply($, allDfds).then(function() {
            whenAllAdventuresProcessed(ads, lis, allInfo);
        });
    }

    return {
        execute: execute
    };
});