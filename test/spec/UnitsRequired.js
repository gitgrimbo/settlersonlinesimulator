/*global:describe,beforeEach,it,expect,spyOn*/
define(["units-required/PageParser", "text!html/adventures/der-schamane.html"], function(UnitsRequiredPageParser, adventureHtml) {

    describe("Units Required", function() {

        beforeEach(function() {
            // nothing
        });

        it("parses the html", function() {
            var unitsRequired = UnitsRequiredPageParser.getAttackPlanFromHtml(adventureHtml);
            expect(unitsRequired).not.toBeUndefined();
            expect(unitsRequired.sims.length).toEqual(17);
        });

    });

});