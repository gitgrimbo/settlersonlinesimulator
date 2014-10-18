define([
    "module"
], function(module) {
console.log(module.id);
    var hasWindow = ('undefined' !== typeof window);

    // If hasWindow (running in client.html, then use absolute path,
    // otherwise it's running from client.js and path is relative to current working directory.
    var baseUrl = (hasWindow ? '/src/' : './src/');

    // Remember that baseUrl is a property of loader!
    var config = {
        loader: {
            baseUrl: baseUrl,
            // relative to baseUrl
            paths: {
                text: "../lib/text",
                test: "../test",
                html: "../test/html"
            },
            packages: [
                { name: "jquery", location: "../lib", main: "jquery-1.6.4" }
            ],
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
        excludeInstrumentation: /^node_modules/
    };
    return config;
});
