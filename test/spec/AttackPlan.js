/*global:describe,beforeEach,it,expect,spyOn*/
define([
    "units-required/model/UnitList",
    "units-required/model/AttackPlan",
    "./adventure/der-shamane",
    "./test-helpers!"
], function(UnitList, AttackPlan, derShamane) {

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

    // These tests assume the following attack parameters:
    // general=G (normal general)
    //   recruit=200, militia=200, soldier=200, elite=0, cavalry=200, bowman=200, long bowman=200, crossbowman=0, cannoneer=0
    //   wave=0 (5+ waves)
    //   limit_user_units=200
    // E.g. URL:
    // http://settlersonlinesimulator.com/dso_kampfsimulator/en/adventures/der-schamane/?general=G&my_r=200&my_m=200&my_s=200&my_e=0&my_c=200&my_b=200&my_lb=200&my_a=0&my_k=0&wave=0&limit_user_units=200
    describe("derShamane - calculateTransportRequired", function() {

        function checkTransportRequired(expected, actual) {
            expect(actual.length).to.be.sameLength(expected.length);
            expected.forEach(function(expected, i) {
                expect(actual[i]).to.be.equalUsingEquals(expected, i);
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

        it("has the correct transport required when first sim is ignored", function() {
            // use the first two battles from the adventure
            var attackPlan = newAttackPlan(derShamane, 2);

            // ignore the first sim
            attackPlan.ignore(0);

            var transportRequired = attackPlan.calculateTransportRequired();

            // we only expect to need one set of soldiers
            var expected = [];
            expected.push(UnitList.fromUnits("R", 21, "S", 1, "C", 177));

            checkTransportRequired(expected, transportRequired);
        });
    });

});
