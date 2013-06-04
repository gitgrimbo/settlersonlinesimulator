/*jslint browser: true*/
/*global jQuery, console*/
define(function() {
    var $ = jQuery;

    function AdventuresPage(container) {
        this.container = $(container || document);
    }

    AdventuresPage.xp = function(el, val) {
        el = $(el);
        if ("undefined" !== typeof val) {
            // parseInt on number just returns the number, so this is really for strings.
            val = parseInt(val, 10);
            return el.attr("data-xp", val);
        }
        return parseInt(el.attr("data-xp"), 10);
    };

    AdventuresPage.liTitle = function(li) {
        return li.find(".adventure-title").text().replace(/\s+/gi, " ").trim();
    };

    AdventuresPage.liXp = function(li) {
        return AdventuresPage.campEp(li.find(".camp-ep"));
    };

    AdventuresPage.campEp = function(campEp) {
        return parseInt(campEp.text().trim(), 10);
    };

    AdventuresPage.prototype.enhanceLis = function() {
        return $(".camp-ep").map(function() {
            var t = $(this);
            return AdventuresPage.xp(t.closest("li"), AdventuresPage.campEp(t));
        });
    };

    function Adventure(title, xp) {
        this.title = title;
        this.xp = xp;
    }

    return {
        Adventure: Adventure,
        AdventuresPage: AdventuresPage
    };
});