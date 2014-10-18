define([
    "intern/chai!"
], function(chai) {
    function equalUsingEquals(expected) {
        var actual = this._obj;

        // not using #{act} and #{exp} in order to see the full toString of actual and expected
        // see "Composing Error Messages" at http://chaijs.com/guide/plugins/
        this.assert(
            actual.equals(expected),
            "expected " + actual + " to be " + expected,
            "expected " + actual + " to not be " + expected,
            expected,
            actual
        );
    }

    function sameLength(expected) {
        var actual = this._obj;

        // not using #{act} and #{exp} in order to see the full toString of actual and expected
        // see "Composing Error Messages" at http://chaijs.com/guide/plugins/
        this.assert(
            actual === expected,
            "expected " + actual + " to be " + expected,
            "expected " + actual + " to not be " + expected,
            expected,
            actual
        );
    }

    chai.use(function(_chai, utils) {
        var Assertion = _chai.Assertion;
        Assertion.addMethod("equalUsingEquals", equalUsingEquals);
        Assertion.addMethod("sameLength", sameLength);
    });
});
