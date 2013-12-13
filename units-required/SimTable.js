/*

An abstraction over a 'SimTable' in the units required page.

The SimTable is represented on the page as a table with attack options.

This module provided utility functions for reading from and manipulating this table.

*/
define(["module", "jquery", "../context", "../console", "../string-utils", "./model"], function(module, $, GRIMBO, console, StringUtils, model) {

    var DEBUG = GRIMBO.debug;
    var log = console.createLog(module.id, DEBUG);
    var UnitList = model.UnitList;
    var Sim = model.Sim;
    var AttackPlan = model.AttackPlan;

    // SimTable
    // Utility operations to perform on a sim table DOM element.

    function SimTable($simTable) {
        this.$simTable = $simTable;
    }

    /**
     * Set a "sim-index" attribute on the table, so we know which Sim it is for.
     */
    SimTable.setSimIndex = function($simTable, simIndex) {
        var h = SimTable.getSimHeader($simTable);
        $simTable.add(h).attr("data-sim-index", simIndex);
    };

    /**
     * @return The "sim-index" attribute of the table, so we know which Sim it is for.
     */
    SimTable.getSimIndex = function($simTable) {
        return parseInt($simTable.attr("data-sim-index"), 10);
    };

    SimTable.getSimIndexForHeading = function($childOfHeading) {
        return parseInt($childOfHeading.closest("h3").attr("data-sim-index"), 10);
    };

    /**
     * Update the table UI to match "attackOptionIndex". 
     */
    SimTable.setAttackOptionIndex = function($simTable, attackOptionIndex) {
        // Get the row to be selected.
        var $tr = $simTable.find(".grimbo.attack-option").eq(attackOptionIndex);
        // Clear all rows of selected class.
        $tr.siblings().add($tr).removeClass("selected");
        // Select the chosen row.
        $tr.addClass("selected");
    };

    /**
     * @return The "attack-option-index" for the passed-in row.
     */
    SimTable.getRowAttackOptionIndex = function(tr) {
        return parseInt($(tr).attr("data-attack-option-index"), 10);
    };

    SimTable.parseUnitsStr = function(str) {
        var units = new UnitList(),
            match;

        if (!str) {
            return units;
        }

        // Remove attack wave prefix, e.g. "1: 145R".
        // So remove everything before first ':'.
        match = str.match(/.*?\:(.*)/);
        if (match) {
            str = StringUtils.$trim(match[1]);
        }

		// str will be like "47R 1S 80C 72B"
        str = str.split(/\s+/);

		// str will be array like ["47R", "1S", "80C", "72B"]
        for (var i = 0; i < str.length; i++) {
            match = str[i].match(/([\d.]+)(.*)/);
            var unitType = match[2];
            var unitNumber = match[1];
            units[unitType] = parseFloat(unitNumber);
        }
        return units;
    };

    SimTable.parseToSim = function($simTable) {
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
            sim.campEnemies = [];
            // -2 because the filter and experience <span>s are not enemies
            for (var i = 0; i < children.length - 2; i++) {
                var span = children[i];
                var enemy = {};
                enemy.count = StringUtils.$trim(span.previousSibling);
                enemy.type = $.trim($(span).attr("title"));
                sim.campEnemies.push(enemy);
            }
            var expStr = StringUtils.$trim(children.last().text());
            sim.exp = parseInt(expStr, 10);
        }

        function parseUnitsRequiredFromRow(tr) {
            /*
<tr><td>1: 134B<br />2: 23R 1S 44C 132LB</td><td>134B 1G<br />22.26R</td><td>134B 1G<br />23R</td><td>40KU 40SS 24DP<br />16DP 1DHP</td><td>40KU 40SS 40DP<br />16DP 1DHP</td><td>162.75</td></tr><tr><td>1: 135B<br />2: 23R 1S 44C 132LB</td><td>135B 1G<br />22.26R</td><td>135B 1G<br />23R</td><td>40KU 40SS 24DP<br />16DP 1DHP</td><td>40KU 40SS 40DP<br />16DP 1DHP</td><td>163.75</td></tr><tr><td>1: 136B<br />2: 23R 1S 44C 132LB</td><td>136B 1G<br />22.27R</td><td>136B 1G<br />23R</td><td>40KU 40SS 27DP<br />13DP 1DHP</td><td>40KU 40SS 40DP<br />13DP 1DHP</td><td>164.75</td></tr>
*/
            log(tr);
            var $td = $(tr).find("td");
            if (!$td || $td.length < 1) {
                log("parseSimTable: tds not found");
                return null;
            }

            // create some info objects that pair a stats header with its text as lines
            var unitInfo = $.map(["units", "avgLoss", "maxLoss", "minKill", "maxKill"], function(prop, i) {
                return {
                    prop: prop,
                    lines: StringUtils.$trim($td.eq(i)).split("\n")
                };
            });

            var waves = [];
            var numWaves = unitInfo[0].lines.length;
            for (var i = 0; i < numWaves; i++) {
                var option = {};
                for (var j = 0; j < unitInfo.length; j++) {
                    option[unitInfo[j].prop] = SimTable.parseUnitsStr(unitInfo[j].lines[i]);
                }
                waves.push(option);
            }

            if (waves.length < 1) {
                var e = new Error("No waves found");
                e.tr = tr;
                throw e;
            }

            return waves;
        }

        var sim = {};
        var $h = SimTable.getSimHeader($simTable);
        parseEnemiesFromHeader(sim, $h);
        sim.attackOptions = [];
        $simTable.find("tr").each(function(i, tr) {
            log(i, tr);
            if (0 === i) {
                return;
            }
            var option = parseUnitsRequiredFromRow(tr);
            if (option) {
                sim.attackOptions.push(option);
            }
        });

        if (sim.attackOptions.length < 1) {
            var e = new Error("No attack options found");
            e.table = $simTable[0];
            //throw e;
        }

        log(sim);
        return new Sim(sim.campEnemies, sim.exp, sim.attackOptions);
    };

    SimTable.getSimHeader = function($simTable) {
        return $simTable.prev("h3");
    };

    SimTable.showTableAndHeader = function($simTable, isShow) {
        // normalise in case ignore is undefined or falsey rather than false.
        isShow = false !== isShow;
        var $h = SimTable.getSimHeader($simTable);
        var func = isShow ? "show" : "hide";
        $h[func]();
        $simTable[func]();
    };

    SimTable.hideTableAndHeader = function($simTable) {
        SimTable.showTableAndHeader($simTable, false);
    };

    /**
     * @return int.
     */
    SimTable.getChosenAttackOption = function($simTable) {
        var $sel = $simTable.find("tr.attack-option.selected");
        if ($sel.length < 1) {
            return -1;
        }
        var idx = $sel.attr("data-attack-option-index");
        return parseInt(idx, 10);
    };

    SimTable.addAttackOptionClasses = function($simTable) {
        $simTable.find("tbody").each(function(i, tbody) {
            $(tbody).find("tr").each(function(i, tr) {
                var $tr = $(tr);
                $tr.addClass("grimbo attack-option");
                $tr.attr("data-attack-option-index", i);
            });
        });
    };

    SimTable.addSummaryRows = function($simTable, thisWaveLosses, totalLosses, totalActive, totalXP) {
        function createRow(cssClass, cells) {
            var $tr = $("<tr></tr>").addClass(cssClass);
            for (var i = 0; i < cells.length; i++) {
                // ensure a string ""+
                var $td = $("<td></td>").html("" + cells[i]);
                if (i === cells.length - 1) {
                    $td.attr("colspan", "99");
                }
                $tr.append($td);
            }
            return $tr;
        }
        var $tr1 = createRow("grimbo summary wave-losses", ["Wave losses: [" + thisWaveLosses.totalUnits() + "]", thisWaveLosses.toHtmlString() + " [" + thisWaveLosses.totalUnitValue() + "]"]);
        var $tr2 = createRow("grimbo summary total-losses", ["Total losses: [" + totalLosses.totalUnits() + "]", totalLosses.toHtmlString() + " [" + totalLosses.totalUnitValue() + "]"]);
        var totalRequired = totalActive.add(totalLosses);
        log(totalActive, totalLosses, totalRequired);
        var $tr3 = createRow("grimbo summary total-required", ["Total required: [" + totalRequired.totalUnits() + "]", totalRequired.toHtmlString()]);
        var $tr4 = createRow("grimbo summary total-exp", ["Total XP:", totalXP]);
        var $trs = $tr1.add($tr2).add($tr3).add($tr4).css("border", "solid black 1px");
        $simTable.append($trs);
    };

    SimTable.removeSummaryRows = function($simTable) {
        $simTable.find("tr.grimbo.summary").remove();
    };

    function createInstanceMethodsForStatics(constructor, firstArgPropertyName, methodNames) {
        // For each static method name provided, create an instance method (on the prototype).
        $.each(methodNames, function(i, methodName) {
            // Create a new 'instance' method on the prototype with the same name as the static method.
            constructor.prototype[methodName] = function() {
                var instance = this;
                var staticMeth = constructor[methodName];

                // The first argument to the static method is a property of the instance itself.
                var firstArg = instance[firstArgPropertyName];
                var args = [firstArg].concat(Array.prototype.slice.apply(arguments));

                return staticMeth.apply(null, args);
            };
        });
    }

    // Create 'instance' methods for each of the specified 'static' methods.
    // All the 'static' methods take $simTable as the first parameter.
    createInstanceMethodsForStatics(SimTable, "$simTable", [

    "parseToSim", "parseSimTable", "getSimHeader", "showTableAndHeader", "hideTableAndHeader",

    "getChosenAttackOption", "addSummaryRows", "removeSummaryRows", "getSimIndex", "setSimIndex", "setAttackOptionIndex"

    ]);

    return SimTable;

});