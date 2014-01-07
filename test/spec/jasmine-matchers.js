define([], function() {

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
        toEqualUnitList: toEqualUnitList
    };

});
