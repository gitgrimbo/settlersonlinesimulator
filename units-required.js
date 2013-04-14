;(function($) {
/* http://settlersonlinesimulator.com/dso_kampfsimulator/en/adventures/die-schwarzen-priester/ */

var NODE_TEXT = 3;

function forEachOwnProperty(ob, fn, context) {
    for (var i in ob) {
        if (ob.hasOwnProperty(i)) {
            fn.call(context, ob, i);
        }
    }
}

function simpleToString() {
    var arr = [];
    forEachOwnProperty(this, function (ob, prop) {
        arr.push(prop + ": " + this[prop]);
    }, this);
    if (arr.length > 0) {
        return arr.join(", ");
    }
    return "";
}

function UnitList(unitList) {
    if (unitList) {
        forEachOwnProperty(unitList, function (ob, prop) {
            this[prop] = unitList[prop];
        }, this);
    }
};

UnitList.prototype.add = function (unitList) {
    var res = new UnitList(this);
    forEachOwnProperty(unitList, function (ob, prop) {
        var val = unitList[prop];
        if (this.hasOwnProperty(prop)) {
            res[prop] += val;
        } else {
            res[prop] = val;
        }
    }, this);
    return res;
};

UnitList.prototype.subtract = function (unitList) {
    var res = new UnitList(this);
    forEachOwnProperty(unitList, function (ob, prop) {
        var val = unitList[prop];
        if (this.hasOwnProperty(prop)) {
            res[prop] -= val;
        } else {
            res[prop] = -val;
        }
    }, this);
    return res;
};

UnitList.prototype.recruit = function (unitList) {
    var res = new UnitList(this);
    forEachOwnProperty(unitList, function (ob, prop) {
        var val = unitList[prop];
        if (this.hasOwnProperty(prop)) {
            res[prop] = Math.max(val, this[prop]);
        } else {
            res[prop] = val;
        }
    }, this);
    return res;
};

UnitList.prototype.toString = simpleToString;

function $trim(el) {
    var str = null;
    if ("string" === typeof el) {
        str = el;
    } else if (NODE_TEXT === el.nodeType) {
        str = el.nodeValue;
    } else {
        // assume a jQuery object or DOM element
        str = $(el).html();
    }
    str = str.replace(/<br>/gi, "\n");
    return $.trim(str);
}

function parseUnitsStr(str) {
    var units = new UnitList();

    if (!str) {
        return units;
    }

    // remove attack wave prefix, e.g. "1: "
    var match = str.match(/.*?\:(.*)/);
    if (match) {
        str = $trim(match[1]);
    }

    str = str.split(/\s+/);
    for (var i = 0; i < str.length; i++) {
        var match = str[i].match(/([\d.]+)(.*)/);
        units[match[2]] = parseFloat(match[1]);
    }
    return units;
}

function parseSimTable($simTable) {
    function parseEnemiesFromHeader(sim, $h) {
/*
      <h3 id="camp-58">
    10<span title="Thug (SL)" class="bandit_militia" style="display:inline;padding:2px 12px 2px 11px;">&#160;</span> 15<span title="Stone Thrower (SW)" class="bandit_bowman" style="display:inline;padding:2px 12px 2px 11px;">&#160;</span>    <span class="small-8">
      <a href="#optimised-army-proposals-unit-filter" onclick="document.getElementById('filter').action='#camp-58'"><span class="normal">(#filter)</span></a>
    </span>
    <span class="camp-ep">
      <span title="Experience">&#160;</span>
      75    </span>
  </h3>
*/
        var children = $h.children("span");
        sim.enemies = [];
        // -2 because the filter and experience <span>s are not enemies
        for (var i = 0; i < children.length-2; i++) {
            var span = children[i];
            var enemy = {};
            enemy.count = $trim(span.previousSibling);
            enemy.type = $.trim($(span).attr("title"));
            sim.enemies.push(enemy);
        }
        sim.exp = $trim(children.last().text());
    }
    function parseUnitsRequiredFromRow(tr) {
        var $td = $(tr).find("td");
        if (!$td || $td.length < 1) {
            console.log("parseSimTable: tds not found");
            return null;
        }

        var unitInfo = $.map(["units", "avgLoss", "maxLoss", "minKill", "maxKill"], function (prop, i) {
            return {
                prop: prop,
                lines: $trim($td.eq(i)).split("\n")
            };
        });

        var waves = [];
        var numWaves = unitInfo[0].lines.length;
        for (var i = 0; i < numWaves; i++) {
            var option = {};
            for (var j = 0; j < unitInfo.length; j++) {
                option[unitInfo[j].prop] = parseUnitsStr(unitInfo[j].lines[i]);
            }
            waves.push(option);
        }

        return waves;
    }
    var sim = {};
    var $h = $simTable.prev("h3");
    parseEnemiesFromHeader(sim, $h);
    sim.options = [];
    $simTable.find("tr").each(function (i, tr) {
        if (0 === i) {
            return;
        }
        var option = parseUnitsRequiredFromRow(tr);
        if (option) {
            sim.options.push(option);
        }
    });
    return sim;
}

var simTables = $("table.example-sim");
var sims = [];
var totalLosses = new UnitList();
var totalActive = new UnitList();
simTables.each(function (i, table) {
    var $table = $(table);

    var sim = parseSimTable($table);
    sim.table = table;
    sims.push(sim);

    var option1waves = sim.options[0];
    var thisWaveLosses = new UnitList();
    for (var i = 0; i < option1waves.length; i++) {
        var wave = option1waves[i];
        // add this wave losses
        thisWaveLosses = thisWaveLosses.add(wave.maxLoss);
        // recruit enough units for this wave (may already have them active)
        totalActive = totalActive.recruit(wave.units);
        // the dead are not active any more!
        totalActive = totalActive.subtract(wave.maxLoss);
    }
    totalLosses = totalLosses.add(thisWaveLosses);
    var $tr1 = $("<tr/>").html("<td>Wave losses:</td><td colspan=99>" + thisWaveLosses + "</td>");
    var $tr2 = $("<tr/>").html("<td>Total losses:</td><td colspan=99>" + totalLosses + "</td>");
    var $tr3 = $("<tr/>").html("<td>Total required:</td><td colspan=99>" + totalActive.add(totalLosses) + "</td>");
    var $trs = $tr1.add($tr2).add($tr3).css("border", "solid black 1px");
    $table.append($trs);
});
console.log(sims);

}(jQuery));
