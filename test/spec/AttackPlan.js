/*global:describe,beforeEach,it,expect,spyOn*/
define(["./jasmine-matchers", "units-required/model/UnitList", "units-required/model/AttackPlan", "./adventure/der-shamane"], function(customJasmineMatchers, UnitList, AttackPlan, derShamane) {

    expect = (function(expect) {
        return function() {
            try {
                return expect.apply(null, arguments);
            } catch (e) {
                //throw e;
            }
        };
    }(expect));

    /**
     * Create an AttackPlan of an optional subset of the "attackJson".
     */
    function newAttackPlan(attackJson, numSims) {
        var copy = JSON.parse(JSON.stringify(attackJson));
        if ("number" === typeof numSims) {
            copy.sims.length = numSims;
        }
        var a = new AttackPlan();
        // frig the store that AttakPlan uses.
        a.load({
            get: function() {
                return copy;
            }
        });
        return a;
    }

    describe("derShamane - calculateTransportRequired", function() {

        beforeEach(function() {
            // adds toEqualUnitList()
            customJasmineMatchers.addMatchers(this);
        });

        function checkTransportRequired(expected, actual) {
            expect(actual.length).toBe(expected.length);
            expected.forEach(function(expected, i) {
                expect(actual[i]).toEqualUnitList(expected, i);
            });
        }

        it("2 sims", function() {
            var attackPlan = newAttackPlan(derShamane, 2);

            var transportRequired = attackPlan.calculateTransportRequired();

            var expected = [];
            expected.push(UnitList.fromUnits("R", 47, "S", 1, "C", 80, "B", 72));
            expected.push(UnitList.fromUnits("R", 21,         "C", 97));

            checkTransportRequired(expected, transportRequired);
        });

        it("4 sims", function() {
            var attackPlan = newAttackPlan(derShamane, 4);

            var transportRequired = attackPlan.calculateTransportRequired();

            var expected = [];
            expected.push(UnitList.fromUnits("R", 47, "S",  1, "C", 80, "B", 72));
            expected.push(UnitList.fromUnits("R", 21, "S", 82, "C", 97));
            expected.push(UnitList.fromUnits("R", 38, "S", 79,                   "LB", 83));
            expected.push(UnitList.fromUnits("R", 34,                            "LB",  3));

            checkTransportRequired(expected, transportRequired);
        });

        it("all sims", function() {
            var attackPlan = newAttackPlan(derShamane);

            var transportRequired = attackPlan.calculateTransportRequired();

            var expected = [];
            expected.push(UnitList.fromUnits("R",  47, "S",  1, "C", 80, "B", 72));
            expected.push(UnitList.fromUnits("R",  21, "S", 82, "C", 97));
            expected.push(UnitList.fromUnits("R",  38, "S", 79,                   "LB", 83));
            expected.push(UnitList.fromUnits("R", 155, "S", 34,                   "LB", 3, "M", 8));
            expected.push(UnitList.fromUnits("R", 183, "S", 17));
            expected.push(UnitList.fromUnits("R", 128, "S", 20,                   "LB", 52));
            expected.push(UnitList.fromUnits("R", 191, "S", 9));
            expected.push(UnitList.fromUnits("R", 200));
            expected.push(UnitList.fromUnits("R", 76,  "S", 86,                   "LB", 38));
            expected.push(UnitList.fromUnits(          "S", 62));

            checkTransportRequired(expected, transportRequired);
        });

    });

});