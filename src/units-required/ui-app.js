/*jslint browser: true*/
/*global console, store*/
define([

"module", "jquery",

"../context", "../console", "../conditional-script-loader",

"../ui-utils", "./PageParser", "./SimTable", "./model"

], function(module, $, GRIMBO, console, ScriptLoader, uiUtils, UnitsRequiredPageParser, SimTable, model) {
    var DEBUG = GRIMBO.debug;
    var log = console.createLog(module.id, DEBUG);
    var UnitList = model.UnitList;
    var Sim = model.Sim;
    var AttackPlan = model.AttackPlan;

    // Example URL:
    // http://settlersonlinesimulator.com/dso_kampfsimulator/en/adventures/die-schwarzen-priester/ */

    // Page already includes:
    //   jQuery 1.6.2
    //     This means we use 'delegate' and not 'on'.



    // Main



    function doCalcs(simTables, attackPlan) {
        var M = "doCalcs";

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
            log("tableIdx", tableIdx, "sim", sim);

            var ignore = attackPlan.isIgnored(tableIdx);
            log(M, "ignore", tableIdx, ignore);
            if (ignore) {
                return;
            }

            simTable.showTableAndHeader();

            var chosenAttackOption = sim.chosenAttackOption;
            simTable.setAttackOptionIndex(chosenAttackOption);
            log("sim", tableIdx, "chosenAttackOption", chosenAttackOption);

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

            simTable.addSummaryRows(thisWaveLosses, totalLosses, totalActive, totalXP);
        });

        return attackPlan;
    }

    function doUnitsRequiredUI(simTables) {
        var attackPlan = UnitsRequiredPageParser.getAttackPlanFromSimTables(simTables);

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

        // Ignore-sim checkbox click
        $(document).delegate("input.include-sim", "click", function(evt) {
            var simIndex = SimTable.getSimIndexForHeading($(this));
            // checkbox has already changed value, so reverse.
            var ignore = !this.checked;
            log("ignore", simIndex, ignore);
            attackPlan.ignore(simIndex, ignore);
            doCalcs(simTables, attackPlan);
        });

        // Ignore-prev-sims button click
        $(document).delegate("button.ignore-prev-sims", "click", function(evt) {
            var simIndex = SimTable.getSimIndexForHeading($(this));
            log("simIndex", simIndex);
            for (var i = 0; i < simIndex; i++) {
                attackPlan.ignore(i);
            }
            doCalcs(simTables, attackPlan);
        });

        // Choose attack option
        $(simTables).delegate("tr.grimbo.attack-option", "click", function(evt) {
            var $simTable = $(this).closest("table");
            var chosenAttackOption = SimTable.getRowAttackOptionIndex(this);
            var simIndex = SimTable.getSimIndex($simTable);
            attackPlan.sims[simIndex].chosenAttackOption = chosenAttackOption;
            log("chosenAttackOption", chosenAttackOption, "simIndex", simIndex);

            // doCalcs will refresh the UI
            // a bit inefficient to do all the calcs again?
            doCalcs(simTables, attackPlan);
        });

        uiUtils.addStyles([ //
        "tr.grimbo.attack-option.selected {", //
        "  border-left: solid red 4px;", //
        "}", //
        "input.grimbo.repeat-sim {", //
        "  width: 2em;", //
        "}"]);

        addAttackOptionClasses();
        addSimControls();
        doCalcs(simTables, attackPlan);

        // GLOBAL!
        GRIMBO.attackPlan = attackPlan;

        return attackPlan;
    }

    function execute() {
        var js = {
            json3: "//cdnjs.cloudflare.com/ajax/libs/json3/3.2.5/json3.min.js",
            storeJs: "//cdnjs.cloudflare.com/ajax/libs/store.js/1.3.7/store.min.js"
        };

        var loader = new ScriptLoader();

        loader.loadLoader().then(function() {
            return loader.yepNopeDeferred({
                test: window.JSON,
                nope: js.json3
            });
        }).done(function() {
            return loader.yepNopeDeferred(js.storeJs);
        }).done(function() {
            try {
                doUnitsRequiredUI($("table.example-sim"));
            } catch (e) {
                log(typeof e, e.message, e);
            }
        }).fail(function() {
            log(arguments);
        });
    }

    return {
        doUnitsRequiredUI: doUnitsRequiredUI,
        execute: execute
    };
});