define([
    "sos/units-required/model/UnitList",
    "sos/units-required/PageParser",
    "text!html/adventures/der-schamane.html",
    "text!html/adventures/sattelfest.html",
    "text!html/adventures/verraeter-with-mma.html",
    "text!html/adventures/the-valiant-little-tailor.html",
    "./test-helpers!"
], function(UnitList, UnitsRequiredPageParser, derSchamaneHtml, sattelfestHtml, verraeterWithMMAHtml, theValiantLittleTailorHtml) {

    function enemy(count, type) {
        return {
            count: count,
            type: type
        };
    }

    describe("UnitsRequiredPageParser.getAttackPlanFromHtml", function() {

        it("parses der-schamane.html", function() {
            var attackPlan = UnitsRequiredPageParser.getAttackPlanFromHtml(derSchamaneHtml);
            expect(attackPlan).to.not.be.undefined;

            var sims = attackPlan.sims;
            expect(sims.length).to.be.equal(17);

            var sim0 = sims[0];
            expect(sim0).to.not.be.undefined;

            expect(sim0.campEnemies).to.be.eql([enemy("100", "Scavenger (PL)"), enemy("50", "Ranger (WL)")]);
        });

        it("parses sattelfest.html", function() {
            var attackPlan = UnitsRequiredPageParser.getAttackPlanFromHtml(sattelfestHtml);
            expect(attackPlan).to.not.be.undefined;

            var sims = attackPlan.sims;
            expect(sims.length).to.be.equal(20);

            var sim0 = sims[0];
            expect(sim0).to.not.be.undefined;

            expect(sim0.campEnemies).to.be.eql([enemy("70", "Nomad (NO)")]);
        });

        it("parses verraeter-with-mma.html", function() {
            var attackPlan = UnitsRequiredPageParser.getAttackPlanFromHtml(verraeterWithMMAHtml);
            expect(attackPlan).to.not.be.undefined;

            var sims = attackPlan.sims;
            expect(sims.length).to.be.equal(11);

            var sim0 = sims[0];
            expect(sim0).to.not.be.undefined;

            expect(sim0.campEnemies).to.be.eql([enemy("40", "Militia Deserter (DM)"), enemy("60", "Longbow Deserter (DLB)")]);
        });

        it("parses the-valiant-little-tailor.html", function() {
            var attackPlan = UnitsRequiredPageParser.getAttackPlanFromHtml(theValiantLittleTailorHtml);
            expect(attackPlan).to.not.be.undefined;

            var sims = attackPlan.sims;
            expect(sims.length).to.be.equal(39);

            var sim0 = sims[0];
            expect(sim0).to.not.be.undefined;

            expect(sim0.campEnemies).to.be.eql([enemy("120", "Boar (BO)")]);

            expect(sim0.attackOptions).to.not.be.undefined;
            expect(sim0.attackOptions.length).to.be.equal(3);

            var attackOption0 = sim0.attackOptions[0];
            expect(attackOption0).to.not.be.undefined;
            expect(attackOption0.length).to.be.equal(1);
            var unitList0 = attackOption0[0].units;
            expect(unitList0).to.be.equalUsingEquals(UnitList.fromUnits("R", 147, "E", 1, "A", 72));
        });

    });

});
