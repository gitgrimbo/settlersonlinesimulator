define([
    "module", "console", "./UnitList", "./UnitListArr", "./Sim"
], function(module, _console, UnitList, UnitListArr, Sim) {
    var DEBUG = false;
    var log = _console.createLog(module.id, DEBUG);

    function pluck(prop) {
        return function(ob) {
            return ob[prop];
        };
    }

    function arrToStr(arr) {
        return arr.map(function(it) {
            return ""+it;
        });
    }





    /**
     * Internal class.
     * @param {Array.{{units: UnitList, maxLoss: UnitList}}} battles
     * @param {UnitList} army
     */
    function BattleSim(battles, army) {
        this.battles = battles;
        this.army = army;
    }

    /**
     * Simulates an army fighting battles.
     */
    BattleSim.prototype.fight = function() {
        var battles = this.battles;
        var army = this.army;

        while (battles.length > 0) {
            var battle = battles[0];
            log("battle", ""+battle.units);

            var missing = army.missing(battle.units);
            log("missing", ""+missing);

            if (0 === missing.totalUnits()) {
                // fight
                log("fighting with ", ""+battle.units, " from ", ""+army);
                army = army.subtract(battle.maxLoss);
                battles = battles.slice(1);
            } else {
                // can't fight any more because we are lacking the necessary units.
                break;
            }
        }

        this.battles = battles;
        this.army = army;
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

    AttackPlan.prototype.getTotalLosses = function() {
        var lastSimIdx = this.sims.length - 1;
        var result = new UnitList();
        this.doCalcs(function(sim, idx, totalLosses, totalActive, totalXP) {
            if (lastSimIdx === idx) {
                result = totalLosses;
            }
        });
        return result;
    };

    AttackPlan.prototype.getBattles = function() {
        var battles = [];
        this.sims.forEach(function(sim, idx) {
            var attack = sim.attackOptions[sim.chosenAttackOption];
            battles = battles.concat(attack);
        });
        return battles;
    };

    AttackPlan.prototype.calculateTransportRequired = function(generals) {
        generals = generals || [{
            capacity: 200
        }];

        var len = generals.length;
        var generalIdx = 0;
        var general = generals[generalIdx];

        var transportRequired = [];

        var battles = this.getBattles();
        log("battles", battles);

        var onIsland = new UnitList();
        var unfoughtBattles = [];
        var waitingToBoard = new UnitListArr();

        battles.forEach(function(battle, battleIdx) {
            unfoughtBattles.push(battle);

            var battleSim = new BattleSim(unfoughtBattles, onIsland);
            battleSim.fight();
            unfoughtBattles = battleSim.battles;
            onIsland = battleSim.army;

            var pendingLosses = new UnitList();
            if (unfoughtBattles.length > 0) {
                pendingLosses = new UnitListArr(unfoughtBattles.map(pluck("maxLoss"))).toUnitList();
                // don't count this battle's losses towards the units we need to send
                pendingLosses = pendingLosses.subtract(battle.maxLoss);
            }
            log("pendingLosses", ""+pendingLosses);

            waitingToBoard.add(waitingToBoard.toUnitList().add(onIsland).subtract(pendingLosses).missing(battle.units));
            log("waitingToBoard", arrToStr(waitingToBoard.unitListArr));

            while (waitingToBoard.totalUnits() >= general.capacity) {
                var nextBoat = waitingToBoard.removeFromStart(general.capacity);
                nextBoat.battleIdx = battleIdx;
                log("nextBoat", ""+nextBoat);
                transportRequired.push(nextBoat);
                onIsland = onIsland.add(nextBoat);
            }

            log("waitingToBoard", arrToStr(waitingToBoard.unitListArr));
        });

        if (waitingToBoard.totalUnits() > 0) {
            var nextBoat = waitingToBoard.removeFromStart(general.capacity);
            log("nextBoat", ""+nextBoat);
            transportRequired.push(nextBoat);
        }

        _P = this;
        _T = transportRequired;
        log(new UnitListArr(transportRequired).totalUnits());
        return transportRequired;
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

    return AttackPlan;

});