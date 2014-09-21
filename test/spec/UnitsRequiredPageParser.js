/*global:describe,beforeEach,it,expect,spyOn*/
define([
    "units-required/model/UnitList",
    "units-required/PageParser",
    "text!html/adventures/der-schamane.html",
    "text!html/adventures/sattelfest.html",
    "text!html/adventures/verraeter-with-mma.html"
], function(UnitList, UnitsRequiredPageParser, derSchamaneHtml, sattelfestHtml, verraeterWithMMAHtml) {

    function enemy(count, type) {
        return {
            count: count,
            type: type
        };
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

    });

});
