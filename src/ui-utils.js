define(["jquery", "./units-required/model/UnitList"], function($, UnitList) {
    var NO_OPTS = {};

    function forEachOwnProperty(ob, fn, context) {
        for (var i in ob) {
            if (ob.hasOwnProperty(i)) {
                fn.call(context, ob, i);
            }
        }
    }

    function addStyles(cssStr, opts) {
        opts = opts || NO_OPTS;

        if (cssStr.join) {
            cssStr = cssStr.join("\n");
        }

        var appendTo = opts.appendTo || document.body;
        $("<style>").text(cssStr).appendTo(appendTo);
    }

    // Creates a bar chart effect
    function createBar(css1, css2) {
        var outer = $("<div>").css(css1).addClass("bar-outer");
        var inner = $("<div>").css(css2).addClass("bar-inner");
        return outer.append(inner.append("&nbsp;"));
    }

    /**
     * Returns a HTML string that has a sprited span followed by a unit count for each unit type in the UnitList.
     */
    var unitListToHtml = (function() {
        // CSS defined in
        // http://settlersonlinesimulator.com/min/b=dso_kampfsimulator&f=css/style.min.css,js/fancybox/jquery.fancybox-1.3.4.css
        var cssMappings = {
            "G": "general",
            "R": "recruit",
            "M": "militia",
            "C": "cavalry",
            "S": "soldier",
            "E": "elitesoldier",
            "B": "bowman",
            "LB": "longbowman",
            "A": "crossbowman",
            "K": "cannoneer"
        };

        function sortByValue(a, b) {
            return a.value - b.value;
        }

        return function(unitList) {
            var items = [];
            forEachOwnProperty(unitList, function(ob, prop) {
                var css = cssMappings[prop];
                if (ob[prop]) {
                    items.push({
                        value: UnitList.unitValues[prop],
                        html: '<span style="display: inline-block" class="' + css + ' unit-sprite" title="' + UnitList.unitNames[prop] + '">&nbsp;</span><span style=padding-right:1em;>' + ob[prop] + '</span>'
                    });
                }
            }, unitList);
            var s = '<div style="display:inline-block;padding:0;margin:0;height:30px;">';
            items.sort(sortByValue).forEach(function(it) {
                s += it.html;
            });
            return s + "</div>";
        };
    }());

    return {
        addStyles: addStyles,
        createBar: createBar,
        unitListToHtml: unitListToHtml
    };
});