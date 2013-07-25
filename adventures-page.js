/*jslint browser: true*/
/*global jQuery, console*/
define(function() {
    var $ = jQuery;

    function AdventuresPage(container) {
        this.container = $(container || document);
    }

    function intAttr(el, name, val) {
        if ("undefined" !== typeof val) {
            // parseInt on number just returns the number, so this is really for strings.
            val = parseInt(val, 10);
            el.attr(name, val);
            return val;
        }
        return parseInt(el.attr(name), 10);
    }

    AdventuresPage.xp = function(el, val) {
        return intAttr(el, "data-xp", val);
    };

    AdventuresPage.idx = function(el, val) {
        return intAttr(el, "data-idx", val);
    };

    AdventuresPage.prototype.findAdventuresElement = function() {
        return this.container.find("#adventures");
    };

    AdventuresPage.prototype.findAdventureLis = function(li) {
        return this.findAdventuresElement().find("li");
    };

    AdventuresPage.liTitle = function(li) {
        return li.find(".adventure-title a:first").text().replace(/\s+/gi, " ").trim();
    };

    AdventuresPage.liAdventureHref = function(li) {
        return li.find(".adventure-title a:first").attr("href");
    };

    AdventuresPage.liXp = function(li) {
        return AdventuresPage.campEp(li.find(".camp-ep"));
    };

    AdventuresPage.campEp = function(campEp) {
        return parseInt(campEp.text().trim(), 10);
    };

    AdventuresPage.prototype.enhanceLis = function() {
        return this.container.find(".camp-ep").map(function() {
            var t = $(this);
            var li = t.closest("li");
            AdventuresPage.xp(li, AdventuresPage.campEp(t));
            return li;
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