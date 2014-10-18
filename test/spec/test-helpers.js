/**
 * AMD plugin that aims to present the same test API for jasmine and chai.
 * Hasn't seemed to work so far!
 */
define([], function() {
    function setupChai(req, load) {
        req(["intern!bdd", "intern/chai!expect", "./chai-helpers"], function(bdd, expect, chaiHelpers) {
            // make jasmine-like globals
            this.describe = bdd.describe;
            this.it = bdd.it;
            this.expect = expect;
            return load.call(this);
        });
    }

    function setupJasmine(req, load) {
        // doesn't work yet!
        req(["./jasmine-matchers"], function(customJasmineMatchers) {
            customJasmineMatchers.addMatchers(this);
            return load.call(this);
        });
    }

    return {
        load: function (name, req, load, config) {
            if ("undefined" === typeof jasmine) {
                setupChai(req, load);
            } else {
                setupJasmine(req, load);
            }
        }
    };
});
