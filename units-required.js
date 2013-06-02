/*jslint browser: true*/
/*global jQuery, console, yepnope, store*/
;
(function(window, document, $) {
    // Example URL:
    // http://settlersonlinesimulator.com/dso_kampfsimulator/en/adventures/die-schwarzen-priester/ */

    // Page already includes:
    //   jQuery 1.6.2
    //     This means we use 'delegate' and not 'on'.



    // IE fix
    var console = window['console'] || {
        log: function() {}
    };

    // Util



    var StringUtils = (function() {
        var NODE_TEXT = 3;
        /**
         * Outputs the hasOwnProperty name/values of "this".
         */
        function simpleToString() {
            var arr = [];
            forEachOwnProperty(this, function(ob, prop) {
                arr.push(prop + ": " + this[prop]);
            }, this);
            if (arr.length > 0) {
                return arr.join(", ");
            }
            return "";
        }

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
        return {
            simpleToString: simpleToString,
            $trim: $trim
        };
    }());



    function forEachOwnProperty(ob, fn, context) {
        for (var i in ob) {
            if (ob.hasOwnProperty(i)) {
                fn.call(context, ob, i);
            }
        }
    }




    // UnitList



    /**
     * Constructs a new UnitList, 'cloned' from "unitList" if provided.
     * A UnitList is a collection of units, where a unit is represented by a code,
     * e.g. {R: 100, S: 200}.
     */
    function UnitList(unitList) {
        if (unitList) {
            forEachOwnProperty(unitList, function(ob, prop) {
                this[prop] = unitList[prop];
            }, this);
        }
    }

    /**
     * Unit values. Scaled up by x1000.
     */
    UnitList.unitValues = {
        R: 1250,
        B: 1000,
        LB: 2875,
        M: 3375,
        C: 3375,
        S: 6000
    };

    /**
     * @return The total number of units.
     */
    UnitList.prototype.totalUnits = function() {
        var count = 0;
        forEachOwnProperty(this, function(ob, prop) {
            count += this[prop];
        }, this);
        return count;
    };

    /**
     * @return The total value of units.
     */
    UnitList.prototype.totalUnitValue = function() {
        var value = 0;
        forEachOwnProperty(this, function(ob, prop) {
            var unitValue = UnitList.unitValues[prop];
            if (unitValue) {
                // if not falsey
                value += (this[prop] * unitValue);
            }
        }, this);
        return value / 1000;
    };

    /**
     * @return a new UnitList.
     */
    UnitList.prototype.add = function(unitList) {
        var res = new UnitList(this);
        forEachOwnProperty(unitList, function(ob, prop) {
            var val = unitList[prop];
            res[prop] = this.hasOwnProperty(prop) ? res[prop] + val : val;
        }, this);
        return res;
    };

    /**
     * @return a new UnitList.
     */
    UnitList.prototype.subtract = function(unitList) {
        var res = new UnitList(this);
        forEachOwnProperty(unitList, function(ob, prop) {
            var val = unitList[prop];
            res[prop] = this.hasOwnProperty(prop) ? res[prop] - val : -val;
        }, this);
        return res;
    };

    /**
     * Ensure that the returned UnitList has enough units to satisfy the
     * "recruitmentUnitList" unit requirements. I.e., the returned UnitList may be
     * exactly the same as "this" if there are enough units to satisfy
     * "recruitmentUnitList".
     *
     * @return a new UnitList.
     */
    UnitList.prototype.recruit = function(recruitmentUnitList) {
        var res = new UnitList(this);
        forEachOwnProperty(recruitmentUnitList, function(ob, prop) {
            var val = recruitmentUnitList[prop];
            res[prop] = this.hasOwnProperty(prop) ? Math.max(val, this[prop]) : val;
        }, this);
        return res;
    };

    UnitList.prototype.toString = StringUtils.simpleToString;





    // SimTable
    // Utility operations to perform on a sim table DOM element.
    function Sim(campEnemies, exp, attackOptions) {
        this.campEnemies = campEnemies;
        this.exp = exp;
        this.attackOptions = attackOptions;
        this.chosenAttackOption = null;
        this.ignore = null;
    }

    Sim.getUnitsReqdUnitValueForAttack = function(attackOption) {
        // Count up the units required for this attack option.
        return attackOption.reduce(function(unitValue, wave) {
            return unitValue + wave.units.totalUnitValue();
        }, 0);
    };

    Sim.getMaxLossesForAttack = function(attackOption) {
        return attackOption.reduce(function(prev, wave) {
            // add this wave losses
            return prev.add(wave.maxLoss);
        }, new UnitList());
    };

    Sim.prototype.getMaxLossesForAttackOptions = function() {
        return this.attackOptions.map(Sim.getMaxLossesForAttack);
    };

    Sim.prototype.findLowestMaxLossAttackOption = function() {
        var opts = this.findLowestMaxLossAttackOptions();
        return opts[0].idx;
    };

    /**
     * Returns the attack options which have the lowest losses.
     * @return Array of {idx,unitValue}.
     */
    Sim.prototype.findLowestMaxLossAttackOptions = function() {
        var lowestCost = null;
        var costsAndIdxs = this.getMaxLossesForAttackOptions().map(function(cost, idx) {
            // map the costs to preserve index after sorting
            return {
                idx: idx,
                unitValue: cost.totalUnitValue()
            };
        }).sort(function(cost1, cost2) {
            // sort based on unitValue
            return cost1.unitValue - cost2.unitValue;
        }).filter(function(cost) {
            // remove all costs that aren't the lowest
            if (null === lowestCost) {
                lowestCost = cost;
            }
            // keep those costs that share the same lowest value.
            return (cost.unitValue <= lowestCost.unitValue);
        });
        return costsAndIdxs;
    };

    /**
     * @return The total number of units required for the specified attack.
     */
    Sim.prototype.fewestReqdUnitsStrategy = function(attackOption) {
        return attackOption.reduce(function(prev, wave) {
            return prev + wave.units.totalUnits();
        }, 0);
    };

    /**
     * @return The total unit value for the units required.
     */
    Sim.prototype.lowestReqdUnitsValueStrategy = function(attackOption) {
        return Sim.getUnitsReqdUnitValueForAttack(attackOption);
    };

    /**
     * Attempts to calculate the 'best' attack option based on a strategy.
     * The best option will always have fewest max losses, but the chosen
     * option can differ based on choices such as using fewest number of
     * units, or using an attack based on the total unit value of the option's
     * units.
     * @param strategy {string} The name of the strategy to use. Default "lowestReqdUnitsValue".
     */
    Sim.prototype.findBestAttackOption = function(strategy) {
        strategy = strategy || "lowestReqdUnitsValue";
        strategy = "fewestReqdUnits";
        var strategyFn = this[strategy + "Strategy"];
        var costsAndIdxs = this.findLowestMaxLossAttackOptions();
        var unitsReqdUnitValues = costsAndIdxs.map(function(costAndIdx) {
            var attackOption = this.attackOptions[costAndIdx.idx];
            return strategyFn(attackOption);
        }, this);
        var idxOfCheapest = -1;
        var cheapest = null;
        unitsReqdUnitValues.forEach(function(unitValue, idx) {
            if (null === cheapest || unitValue < cheapest) {
                idxOfCheapest = idx;
                cheapest = unitValue;
            }
        });
        return idxOfCheapest;
    };

    Sim.fromJSON = function(json) {
        var sim = new Sim(json.campEnemies, json.exp, json.attackOptions);
        sim.chosenAttackOption = json.chosenAttackOption;
        sim.ignore = json.ignore;
        return sim;
    };





    /**
     * Represents the chosen Sims. This should be the model of what is on screen.
     */
    function AttackPlan(sims) {
        this.sims = sims;
    }

    AttackPlan.prototype.ignore = function(simIndex, ignore) {
        // normalise in case ignore is undefined or falsey rather than false.
        ignore = false !== ignore;
        this.sims[simIndex].ignore = ignore;
    };

    AttackPlan.prototype.isIgnored = function(simIndex) {
        return this.sims[simIndex].ignore;
    };

    AttackPlan.prototype.save = function() {
        var name = "attackPlan";
        store.set(name, this);
    };

    AttackPlan.prototype.load = function() {
        var name = "attackPlan";
        var attackPlan = store.get(name);
        this.sims = [];
        for (var i = 0; i < attackPlan.sims.length; i++) {
            this.sims[i] = Sim.fromJSON(attackPlan.sims[i]);
        }
    };





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

        // Remove attack wave prefix, e.g. "1: ".
        // So remove everything before first ':'.
        match = str.match(/.*?\:(.*)/);
        if (match) {
            str = StringUtils.$trim(match[1]);
        }

        str = str.split(/\s+/);
        for (var i = 0; i < str.length; i++) {
            match = str[i].match(/([\d.]+)(.*)/);
            units[match[2]] = parseFloat(match[1]);
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
            console.log(tr);
            var $td = $(tr).find("td");
            if (!$td || $td.length < 1) {
                console.log("parseSimTable: tds not found");
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
            //console.log(i, tr);
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
            throw e;
        }

        //console.log(sim);
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
        var $tr1 = createRow("grimbo summary wave-losses", ["Wave losses: [" + thisWaveLosses.totalUnits() + "]", thisWaveLosses + " [" + thisWaveLosses.totalUnitValue() + "]"]);
        var $tr2 = createRow("grimbo summary total-losses", ["Total losses: [" + totalLosses.totalUnits() + "]", totalLosses + " [" + totalLosses.totalUnitValue() + "]"]);
        var totalRequired = totalActive.add(totalLosses);
        //console.log(totalActive, totalLosses, totalRequired);
        var $tr3 = createRow("grimbo summary total-required", ["Total required: [" + totalRequired.totalUnits() + "]", totalRequired]);
        var $tr4 = createRow("grimbo summary total-exp", ["Total XP:", totalXP]);
        var $trs = $tr1.add($tr2).add($tr3).add($tr4).css("border", "solid black 1px");
        $simTable.append($trs);
    };

    SimTable.removeSummaryRows = function($simTable) {
        $simTable.find("tr.grimbo.summary").remove();
    };

    // Create 'instance' methods for each of the specified 'static' methods.
    // All the 'static' methods take $simTable as the first parameter.
    $.each([

    "parseToSim", "parseSimTable", "getSimHeader", "showTableAndHeader", "hideTableAndHeader",

    "getChosenAttackOption", "addSummaryRows", "removeSummaryRows", "getSimIndex", "setSimIndex", "setAttackOptionIndex"

    ], function(i, methodName) {
        SimTable.prototype[methodName] = function() {
            var meth = SimTable[methodName];
            var args = [this.$simTable].concat(Array.prototype.slice.call(arguments));
            // null === no execution context as this method is 'static'.
            return meth.apply(null, args);
        };
    });




    // Main



    function execute(simTables) {
        var attackPlan = buildAttackPlan(simTables);

        function buildAttackPlan(simTables) {
            var sims = [];
            var totalLosses = new UnitList();
            var totalActive = new UnitList();
            var totalXP = 0;

            simTables.each(function(tableIdx, table) {
                var $table = $(table);

                var simTable = new SimTable($table);

                var sim = simTable.parseToSim();
                sims.push(sim);

                var chosenAttackOption = sim.findBestAttackOption();
                console.log("best", chosenAttackOption);

                sim.chosenAttackOption = Math.max(chosenAttackOption, 0);
                console.log("sim", tableIdx, "chosenAttackOption", chosenAttackOption);
            });

            return new AttackPlan(sims);
        }

        function doCalcs() {
            var totalLosses = new UnitList();
            var totalActive = new UnitList();
            var totalXP = 0;

            simTables.each(function(tableIdx, table) {
                var $table = $(table);

                var simTable = new SimTable($table);
                simTable.setSimIndex(tableIdx);

                // hide by default
                simTable.hideTableAndHeader();

                // clear previous summary rows (if any)
                simTable.removeSummaryRows();

                var sim = attackPlan.sims[tableIdx];
                console.log("tableIdx", tableIdx, "sim", sim);

                if (attackPlan.isIgnored(tableIdx)) {
                    return;
                }

                simTable.showTableAndHeader();

                var chosenAttackOption = sim.chosenAttackOption;
                simTable.setAttackOptionIndex(chosenAttackOption);
                //console.log("sim", tableIdx, "chosenAttackOption", chosenAttackOption);

                var option1waves = sim.attackOptions[chosenAttackOption];
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

                // Reset generals after each camp attack.
                // The loss of general(s) has been taken into account above in totalWaveLosses.
                totalActive.G = 0;

                totalLosses = totalLosses.add(thisWaveLosses);
                totalXP += sim.exp;

                simTable.addSummaryRows(thisWaveLosses, totalLosses, totalActive, totalXP);
            });

            return attackPlan;
        }

        function addSimControls() {
            simTables.each(function(i, table) {
                var $h = SimTable.getSimHeader($(table));
                var $checkbox = $("<input id=ignore_sim_" + i + " type=checkbox class='grimbo include-sim' checked=checked title='Ignore this'></input>");
                $h.prepend($checkbox);
                var $repeat = $("<input id=repeat_sim_" + i + " type=input class='grimbo repeat-sim' title='Repeat sim' value='1' size='2'></input>");
                $h.prepend($repeat);
                var $button = $("<button class='grimbo ignore-prev-sims' title='Ignore all previous'>&uarr;</button>");
                $h.prepend($button);
            });
        }

        function addAttackOptionClasses() {
            simTables.each(function(i, table) {
                SimTable.addAttackOptionClasses($(table));
            });
        }

        function addStyles(addTo) {
            addTo = addTo || document.body;
            var css = [ //
            "tr.grimbo.attack-option.selected {", //
            "  border-left: solid red 4px;", //
            "}", //
            "input.grimbo.repeat-sim {", //
            "  width: 2em;", //
            "}"];
            var $style = $("<style/>").html(css.join("\n"));
            $(addTo).append($style);
        }

        // Ignore-sim checkbox click
        $(document).delegate("input.include-sim", "click", function(evt) {
            var simIndex = SimTable.getSimIndexForHeading($(this));
            console.log(this.checked);
            attackPlan.ignore(simIndex, this.checked);
            doCalcs();
        });

        // Ignore-prev-sims button click
        $(document).delegate("button.ignore-prev-sims", "click", function(evt) {
            var simIndex = SimTable.getSimIndexForHeading($(this));
            console.log("simIndex", simIndex);
            for (var i = 0; i < simIndex; i++) {
                attackPlan.ignore(i);
            }
            doCalcs();
        });

        // Choose attack option
        $(simTables).delegate("tr.grimbo.attack-option", "click", function(evt) {
            var $simTable = $(this).closest("table");
            var chosenAttackOption = SimTable.getRowAttackOptionIndex(this);
            var simIndex = SimTable.getSimIndex($simTable);
            attackPlan.sims[simIndex].chosenAttackOption = chosenAttackOption;
            console.log("chosenAttackOption", chosenAttackOption, "simIndex", simIndex);

            // doCalcs will refresh the UI
            // a bit inefficient to do all the calcs again?
            doCalcs();
        });

        addStyles();
        addAttackOptionClasses();
        addSimControls();
        doCalcs();
        window["grimbo_attackPlan"] = attackPlan;
    }

    /**
     * VERY simple script loader to bootstrap yepnode.js,
     * which is then used as the actual script loader.
     * @param {string[]} scripts Array of script srcs.
     * @return A Deferred that is resolved when all the scripts are loaded.
     */
    function importScripts(scripts) {
        function importScript(src) {
            var dfd = $.Deferred();
            var s = $("<script>").load(function(evt) {
                dfd.resolve(this);
                s.remove();
            }).attr("type", "text/javascript").attr("src", src);
            var parent = document.head || document.body;
            parent.appendChild(s[0]);
            return dfd;
        }
        var dfds = [];
        for (var i = 0; i < scripts.length; i++) {
            dfds.push(importScript(scripts[i]));
        }
        return $.when.apply(null, dfds);
    }

    /**
     * Deferred wrapper for yepnope.
     */
    function yepNopeDeferred(opts) {
        var dfd = $.Deferred();

        if (typeof opts === "string") {
            var src = opts;
            opts = {
                load: src
            };
        }

        var complete = opts.complete;
        opts.complete = function() {
            if (complete) {
                complete.apply(this, arguments);
            }
            dfd.resolve.apply(dfd, arguments);
        };

        yepnope(opts);
        return dfd;
    }

    var js = {
        json3: "//cdnjs.cloudflare.com/ajax/libs/json3/3.2.4/json3.min.js",
        yepNope: "//cdnjs.cloudflare.com/ajax/libs/yepnope/1.5.4/yepnope.min.js",
        storeJs: "//cdnjs.cloudflare.com/ajax/libs/store.js/1.3.7/store.min.js"
    };

    importScripts([js.yepNope]).done(function() {
        return yepnope({
            test: window.JSON,
            nope: js.json3
        });
    }).done(function() {
        return yepnope(js.storeJs);
    }).done(function() {
        try {
            execute($("table.example-sim"));
        } catch (e) {
            console.log(typeof e, e);
        }
    }).fail(function() {
        console.log(arguments);
    });

}(window, document, jQuery));