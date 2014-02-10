/*global:describe,beforeEach,it,expect,spyOn*/
define(["./jasmine-matchers", "units-required/model/UnitList"], function(customJasmineMatchers, UnitList) {

    describe("UnitList.equals", function() {

        it("*.equals(null) is false", function() {
            expect(new UnitList().equals(null)).toBe(false);
        });

        it("*.equals() is false", function() {
            expect(new UnitList().equals()).toBe(false);
        });

        it("x.equals(x) is true", function() {
            var u = new UnitList();
            expect(u.equals(u)).toBe(true);
        });

        it("[].equals([]) is true", function() {
            var u1 = new UnitList();
            var u2 = new UnitList();
            expect(u1.equals(u2)).toBe(true);
        });

        it("[R99].equals([R99]) is true", function() {
            var u1 = UnitList.fromUnits("R", 99);
            var u2 = UnitList.fromUnits("R", 99);
            expect(u1.equals(u2)).toBe(true);
        });

        it("[R99].equals([]) is false", function() {
            var u1 = UnitList.fromUnits("R", 99);
            var u2 = new UnitList();
            expect(u1.equals(u2)).toBe(false);
        });

        it("[].equals([R99]) is false", function() {
            var u1 = new UnitList();
            var u2 = UnitList.fromUnits("R", 99);
            expect(u1.equals(u2)).toBe(false);
        });

    });

    describe("UnitList.missing", function() {

        it("[] missing [] == []", function() {
            var u1 = new UnitList();
            var u2 = new UnitList();
            var u3 = u2.missing(u1);
            expect(u3.totalUnits()).toBe(0);
        });

        it("[R10] missing [] == []", function() {
            var u1 = UnitList.fromUnits("R", 10);
            var u2 = new UnitList();
            var u3 = u1.missing(u2);
            expect(u3.count("R")).toBe(0);
        });

        it("[R99, C11] missing [R99, C11] == []", function() {
            var u1 = UnitList.fromUnits("R", 99, "C", 11);
            var u2 = u1.copy();
            var u3 = u1.missing(u2);
            expect(u3.count("R")).toBe(0);
            expect(u3.count("C")).toBe(0);
            expect(u3.totalUnits()).toBe(0);
        });

        it("[] missing [R99, C11] == [R99, C11]", function() {
            var u1 = new UnitList();
            var u2 = UnitList.fromUnits("R", 99, "C", 11);
            var u3 = u1.missing(u2);
            expect(u3.count("R")).toBe(99);
            expect(u3.count("C")).toBe(11);
            expect(u3.totalUnits()).toBe(110);
        });

        it("[R99, C11] missing [] == []", function() {
            var u1 = UnitList.fromUnits("R", 99, "C", 11);
            var u2 = new UnitList();
            var u3 = u1.missing(u2);
            expect(u3.count("R")).toBe(0);
            expect(u3.count("C")).toBe(0);
            expect(u3.totalUnits()).toBe(0);
        });

    });

    describe("UnitList.addUnits", function() {

        beforeEach(function() {
            // adds toEqualUnitList()
            customJasmineMatchers.addMatchers(this);
        });

        it("[R, 99, C, 11]", function() {
            var u1 = new UnitList().addUnits("R", 99, "C", 11);
            var u2 = UnitList.fromUnits("R", 99, "C", 11);
            expect(u1).toEqualUnitList(u2);
            expect(u1.count("R")).toBe(99);
            expect(u1.count("C")).toBe(11);
        });

    });

});
