/*jslint browser: true*/
/*global jQuery, console*/
;
(function(window, document, $) {
    function xp(el, val) {
        el = $(el);
        if ("undefined" !== typeof val) {
            // parseInt on number just returns the number, so this is really for strings.
            val = parseInt(val, 10);
            return el.attr("data-xp", val);
        }
        return parseInt(el.attr("data-xp"), 10);
    }

    function xpSort(a, b) {
        return xp(a) - xp(b);
    }

    function title(el) {
        return el.find(".adventure-title").text().replace(/\s+/gi, " ").trim();
    }

    function addXpAttr(campEps) {
        // Map the campEps to their parent <li>, and set xp attr.
        return campEps.map(function() {
            var t = $(this);
            var _xp = parseInt(t.text().trim(), 10);
            return xp(t.closest("li").remove(), _xp);
        });
    }

    var ads = $("#adventures");
    // For each ".camp-ep" element (camp experience), set the xp on the containing <li>,
    // sort by xp, then re-add to the #adventures ul.
    addXpAttr($(".camp-ep")).get().sort(xpSort).forEach(function(it) {
        ads.append(it);
    });
})(window, document, jQuery);