/*global:describe,beforeEach,it,expect,spyOn*/
define(["units-required/model/UnitList", "units-required/PageParser", "text!html/adventures/der-schamane.html", "text!html/adventures/sattelfest.html"], function(UnitList, UnitsRequiredPageParser, derSchamaneHtml, sattelfestHtml) {

    function enemy() {
        var result = {};
        for (var i = 0; i < arguments.length; i += 2) {
            result[arguments[i]] = arguments[i + 1];
        }
        return result;
    }

    describe("UnitsRequiredPageParser.getAttackPlanFromHtml", function() {

        beforeEach(function() {
            // nothing
        });

        it("parses der-schamane.html", function() {
            var attackPlan = UnitsRequiredPageParser.getAttackPlanFromHtml(derSchamaneHtml);
            expect(attackPlan).not.toBeUndefined();

            var sims = attackPlan.sims;
            expect(sims.length).toEqual(17);

            var sim0 = sims[0];
            expect(sim0).not.toBeUndefined();

            expect(sim0.campEnemies).toEqual([enemy("count", "100", "type", "Scavenger (PL)"), enemy("count", "50", "type", "Ranger (WL)")]);
        });

        it("parses sattelfest.html", function() {
            var attackPlan = UnitsRequiredPageParser.getAttackPlanFromHtml(sattelfestHtml);
            expect(attackPlan).not.toBeUndefined();

            var sims = attackPlan.sims;
            expect(sims.length).toEqual(20);

            var sim0 = sims[0];
            expect(sim0).not.toBeUndefined();

            expect(sim0.campEnemies).toEqual([enemy("count", "70", "type", "Nomad (NO)")]);
        });

    });

});
