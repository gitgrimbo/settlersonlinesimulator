define([
    "module", "../../console", "./UnitList"
], function(module, _console, UnitList) {
    var DEBUG = true;
    var log = _console.createLog(module.id, DEBUG);


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
        function copy(from, to, props) {
            props.forEach(function(prop) {
                to[prop] = from[prop];
            });
            return to;
        }

        function attackOptionFromJSON(json) {
            // TODO - Maybe make AttackOption a top-level 'class'.
            var attackOption = {
                "units": UnitList.fromJSON(json.units),
                "maxLoss": UnitList.fromJSON(json.maxLoss)
            };
            return copy(json, attackOption, ["avgLoss", "minKill", "maxKill"]);
        }

        var attackOptions = json.attackOptions.map(function(waves) {
            return waves.map(attackOptionFromJSON);
        });

        var sim = new Sim(json.campEnemies, json.exp, attackOptions);
        sim.chosenAttackOption = json.chosenAttackOption;
        sim.ignore = json.ignore;
        return sim;
    };

    return Sim;

});
