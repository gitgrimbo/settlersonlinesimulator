/**
 * Edited to try and provide compatibility between Jasmine 1 and Jasmine 2 custom matchers.
 */
define([], function() {

    var isJasmine2 = (jasmine.version || "").charAt(0) === "2";

    function jasmine2matchers() {
        return {
            toEqualUnitList: function(util, customEqualityTesters) {
                return {
                    compare: function(actual, expected) {
                        var result = {};
                        result.pass = actual.equals(expected);
                        return result;
                    }
                };
            }
        };
    }

    function jasmine1matchers() {
        return {
            toEqualUnitList: toEqualUnitList
        };
    }

    function addMatchers(self) {
        var matchers = isJasmine2 ? jasmine2matchers() : jasmine1matchers();
        self.addMatchers ? self.addMatchers(matchers) : jasmine.addMatchers(matchers);
    }

    /**
     * Jasmine matcher that tests UnitList equality, and can also be passed
     * an optional index in case we're comparing objects in an array.
     */
    function toEqualUnitList(expected, idx) {
        var result = this.actual.equals(expected);

        // Jasmine will look for this function and utilise it for custom error messages
        this.message = function () {
            var msg = "expected " + this.actual + " to equal " + expected;
            if ("number" === typeof idx) {
                msg += " [" + idx + "]";
            }
            return msg;
        };

        return result;
    }

    return {
        addMatchers: addMatchers
    };

});
