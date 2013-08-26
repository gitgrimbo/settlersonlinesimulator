define(["module", "./console", "./string-utils"], function(module, console, StringUtils) {
    var DEBUG = true;
    var log = console.createLog(module.id, DEBUG);

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
        "R": 1250,
        "B": 1000,
        "LB": 2875,
        "M": 3375,
        "C": 3375,
        "S": 6000,
        "E": 11875,
        "A": 21875,
        "K": 26875
    };

    /**
     *
     */
    UnitList.unitNames = {
        "G": "General",
        "R": "Recruit",
        "B": "Bowman",
        "LB": "Longbowman",
        "M": "Militia",
        "C": "Cavalry",
        "S": "Soldier",
        "E": "Elite Soldier",
        "A": "Crossbowman",
        "K": "Cannoneer"
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

    /**
     * Returns a HTML string that has a sprited span followed by a unit count for each unit type in the UnitList.
     */
    UnitList.prototype.toHtmlString = (function() {
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

        return function() {
            var items = [];
            forEachOwnProperty(this, function(ob, prop) {
                var css = cssMappings[prop];
                if (ob[prop]) {
                    items.push({
                        value: UnitList.unitValues[prop],
                        html: '<span class="' + css + ' unit-sprite" title="' + UnitList.unitNames[prop] + '">&nbsp;</span><span style=padding-right:1em;>' + ob[prop] + '</span>'
                    });
                }
            }, this);
            var s = '<div style="display:inline-block;padding:0;margin:0;height:30px;">';
            items.sort(sortByValue).forEach(function(it) {
                s += it.html;
            });
            return s + "</div>";
        };
    }());





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

    AttackPlan.prototype.doCalcs = function(callback) {
        var totalLosses = new UnitList();
        var totalActive = new UnitList();
        var totalXP = 0;

        this.sims.forEach(function(sim, idx) {
            var chosenAttackOption = sim.chosenAttackOption;
            log("sim", idx, "chosenAttackOption", chosenAttackOption);

            var option1waves = sim.attackOptions[chosenAttackOption];
            if (!option1waves) {
                // There are no waves for this sim for some reason.
                // Probably because no data has been logged for this sim and the chosen unit types.
                return;
            }

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

            callback(sim, idx, totalLosses, totalActive, totalXP);
        });

        return this;
    };


    AttackPlan.prototype.ignore = function(simIndex, ignore) {
        // normalise in case ignore is undefined or falsey rather than false.
        ignore = false !== ignore;
        this.sims[simIndex].ignore = ignore;
    };

    AttackPlan.prototype.isIgnored = function(simIndex) {
        return this.sims[simIndex].ignore;
    };

    AttackPlan.prototype.save = function(store) {
        var name = "attackPlan";
        store.set(name, this);
    };

    AttackPlan.prototype.load = function(store) {
        var name = "attackPlan";
        var attackPlan = store.get(name);
        this.sims = [];
        for (var i = 0; i < attackPlan.sims.length; i++) {
            this.sims[i] = Sim.fromJSON(attackPlan.sims[i]);
        }
    };

    return {
        UnitList: UnitList,
        Sim: Sim,
        AttackPlan: AttackPlan
    };
});