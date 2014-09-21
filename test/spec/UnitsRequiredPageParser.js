/*global:describe,beforeEach,it,expect,spyOn*/
define([
    "./jasmine-matchers",
    "units-required/model/UnitList",
    "units-required/PageParser",
    "text!html/adventures/der-schamane.html",
    "text!html/adventures/sattelfest.html",
    "text!html/adventures/verraeter-with-mma.html",
    "text!html/adventures/the-valiant-little-tailor.html"
], function(customJasmineMatchers, UnitList, UnitsRequiredPageParser, derSchamaneHtml, sattelfestHtml, verraeterWithMMAHtml, theValiantLittleTailorHtml) {

    function enemy(count, type) {
        return {
            count: count,
            type: type
        };
    }

    describe("UnitsRequiredPageParser.getAttackPlanFromHtml", function() {

        beforeEach(function() {
            // adds toEqualUnitList()
            customJasmineMatchers.addMatchers(this);
        });

        it("parses der-schamane.html", function() {
            var attackPlan = UnitsRequiredPageParser.getAttackPlanFromHtml(derSchamaneHtml);
            expect(attackPlan).not.toBeUndefined();

            var sims = attackPlan.sims;
            expect(sims.length).toEqual(17);

            var sim0 = sims[0];
            expect(sim0).not.toBeUndefined();

            expect(sim0.campEnemies).toEqual([enemy("100", "Scavenger (PL)"), enemy("50", "Ranger (WL)")]);
        });

        it("parses sattelfest.html", function() {
            var attackPlan = UnitsRequiredPageParser.getAttackPlanFromHtml(sattelfestHtml);
            expect(attackPlan).not.toBeUndefined();

            var sims = attackPlan.sims;
            expect(sims.length).toEqual(20);

            var sim0 = sims[0];
            expect(sim0).not.toBeUndefined();

            expect(sim0.campEnemies).toEqual([enemy("70", "Nomad (NO)")]);
        });

        it("parses verraeter-with-mma.html", function() {
            var attackPlan = UnitsRequiredPageParser.getAttackPlanFromHtml(verraeterWithMMAHtml);
            expect(attackPlan).not.toBeUndefined();

            var sims = attackPlan.sims;
            expect(sims.length).toEqual(11);

            var sim0 = sims[0];
            expect(sim0).not.toBeUndefined();

            expect(sim0.campEnemies).toEqual([enemy("40", "Militia Deserter (DM)"), enemy("60", "Longbow Deserter (DLB)")]);
        });

        it("parses the-valiant-little-tailor.html", function() {
            var attackPlan = UnitsRequiredPageParser.getAttackPlanFromHtml(theValiantLittleTailorHtml);
            expect(attackPlan).not.toBeUndefined();

            var sims = attackPlan.sims;
            expect(sims.length).toEqual(39);

            var sim0 = sims[0];
            expect(sim0).not.toBeUndefined();

            expect(sim0.campEnemies).toEqual([enemy("120", "Boar (BO)")]);

            expect(sim0.attackOptions).not.toBeUndefined();
            expect(sim0.attackOptions.length).toBe(3);

            var attackOption0 = sim0.attackOptions[0];
            expect(attackOption0).not.toBeUndefined();
            expect(attackOption0.length).toBe(1);
            var unitList0 = attackOption0[0].units;
            expect(unitList0).toEqualUnitList(UnitList.fromUnits("R", 147, "E", 1, "A", 72));
        });

    });

});
