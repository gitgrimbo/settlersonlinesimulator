/*

Parser for a single adventure page.

*/
define(["module", "jquery", "../context", "../console", "./SimTable", "./model"], function(module, $, GRIMBO, _console, SimTable, model) {
    var DEBUG = GRIMBO.debug;
    var log = _console.createLog(module.id, DEBUG);
    var AttackPlan = model.AttackPlan;

    function getAttackPlanFromHtml(html) {
        // non-greedy regex to capture the tables
        var re = /<table class="example-sim">[\s\S]*?<\/table>/g;

        var tableHtmlList = [];
        var match = re.exec(html);
        while (match) {
            tableHtmlList.push(match[0]);
            match = re.exec(html);
        }

        var simTables = tableHtmlList.map(function(html) {
            return $("<div>").html(html).find("table").first();
        });

        return getAttackPlanFromSimTables($(simTables));
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