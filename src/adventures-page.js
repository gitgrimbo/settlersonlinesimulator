define([
    "jquery"
], function($) {
    function AdventuresPage(container) {
        this.container = $(container || document);
    }

    function intOrUndef(s) {
        return s ? parseInt(s, 10) : undefined;
    }

    function intAttr(el, name, val) {
        if ("undefined" !== typeof val) {
            // parseInt on number just returns the number, so this is really for strings.
            if ("string" === typeof val) {
                val = intOrUndef(val);
            }
            el.attr(name, val);
            return val;
        }
        return intOrUndef(el.attr(name));
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
        return intOrUndef(campEp.text().trim());
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
