/*

Parser for a single adventure page.

*/
define(["module", "jquery", "context", "console", "./SimTable", "./model/AttackPlan"], function(module, $, GRIMBO, _console, SimTable, AttackPlan) {
    var DEBUG = GRIMBO.debug;
    var log = _console.createLog(module.id, DEBUG);

    function getAttackPlanFromHtml(html) {
        // non-greedy regex to capture the table container
        var re = /<div class="infobox">[\s\S]*?id="proposals"[\s\S]*?<\/div>/g;

        var match = re.exec(html);
        if (match.length < 1) {
            throw new Error("Could not parse Adventure page.");
        }

        var container = $(match[0]);

        var tables = container.find("table.example-sim");
        if (tables.length < 1) {
            throw new Error("Found no Sim tables.");
        }

        return getAttackPlanFromSimTables(tables);
    }

    /**
     * @param {jQuery} simTables
     *    A jQuery collection of <table class="example-sim"> elements.
     */
    function getAttackPlanFromSimTables(simTables) {
        var sims = [];

        simTables.each(function(tableIdx, table) {
            var $table = $(table);

            var simTable = new SimTable($table);

            var sim = simTable.parseToSim();
            sims.push(sim);

            var chosenAttackOption = sim.findBestAttackOption();
            log("best", chosenAttackOption);

            sim.chosenAttackOption = Math.max(chosenAttackOption, 0);
            log("sim", tableIdx, "chosenAttackOption", chosenAttackOption);
        });

        return new AttackPlan(sims);
    }

    return {
        getAttackPlanFromHtml: getAttackPlanFromHtml,
        getAttackPlanFromSimTables: getAttackPlanFromSimTables
    };

});