define([
    "module"
], function(module) {
    console.log("Loading intern config", module.id);

    var config = {
        loader: {
            // These paths are for modules that are accessed via a top-level module id.
            paths: {
                text: "./lib/text",
                amdjquery: "./src/amdjquery",
                sos: "./src",
                jquery: "./lib/jquery-1.6.4"
            },
            map: {
                "*": {
                    "jquery": "amdjquery"
                },
                "amdjquery": {
                    "jquery": "jquery"
                }
            }
        },

        // Non-functional test suite(s) to run in each browser
        suites: [
            'test/spec/UnitList',
            'test/spec/AdventuresModel',
            'test/spec/AttackPlan'
        ],

        suitesNeedingDom: [
            'test/spec/UnitsRequiredPageParser'
        ],

        // Functional test suite(s) to run in each browser once non-functional tests are completed
        functionalSuites: [
            'test/func/Empty'
        ],

        // A regular expression matching URLs to files that should not be included in code coverage analysis
        // Exclude any path with a path part ending in 'test' or 'tests',
        // or any path part of 'lib'.
        // E.g. excluding 'interntest', 'test', 'tests', 'lib', etc.
        //excludeInstrumentation: /interntest|(test)s?\/|^lib\//
        excludeInstrumentation: /^(test|interntest|node_modules|lib)/
    };

    // the suitesNeedingDom should be removed by the unit-test only config
    config.suites = config.suites.concat(config.suitesNeedingDom);

    return config;
});
