define([
    "jquery", "./env", "./units-required/model/UnitList"
], function($, env, UnitList) {
    var NO_OPTS = {};
    var env = env.defaultEnv;
    var imgRoot = env.isLive() ? "https://rawgithub.com/gitgrimbo/settlersonlinesimulator/master/" : "/";

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

        function mapUnitListToViewData(unitList) {
            var items = [];
            UnitList.forEachUnit(unitList, function(unitCode) {
                var css = cssMappings[unitCode];
                var unitHtml = '<span style="display: inline-block" class="' + css + ' unit-sprite" title="' + UnitList.unitNames[unitCode] + '">&nbsp;</span>';
                var countHtml = '<span style=padding-right:1em;>' + unitList[unitCode] + '</span>';
                items.push({
                    value: UnitList.unitValues[unitCode],
                    html: unitHtml + countHtml
                });
            }, unitList);
            return items;
        }

        return function(unitList) {
            if (!unitList) {
                throw new Error("unitList not provided");
            }
            var viewData = mapUnitListToViewData(unitList);
            var s = '<div style="display:inline-block;padding:0;margin:0;height:30px;">';
            viewData.sort(sortByValue).forEach(function(it) {
                s += it.html;
            });
            return s + "</div>";
        };
    }());

    /**
     * Represents a view of trasporting units. Has a boat icon and a UnitList.
     * @param {UnitList} boat
     */
    function BoatWidget(boat) {
        this.boat = boat;
    }

    BoatWidget.prototype.toJQEl = function() {
        var boatHtml = '<span style="display: inline-block; width: 30px; height: 30px; background: url(' + imgRoot + 'src/img/boat.png) 0 0 no-repeat; padding-right: 1em;">&nbsp;</span>';
        var el = $(unitListToHtml(this.boat));
        el.prepend(boatHtml);
        el.css("margin-top", "1em");
        el.css("height", "48px");
        el.css("background", "url(" + imgRoot + "src/img/wave.png) repeat-x left bottom");
        return el;
    }

    return {
        addStyles: addStyles,
        createBar: createBar,
        unitListToHtml: unitListToHtml,
        BoatWidget: BoatWidget
    };
});
