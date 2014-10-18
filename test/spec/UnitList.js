define([
    "units-required/model/UnitList",
    "./test-helpers!"
], function(UnitList) {

    describe("UnitList.equals", function() {

        it("*.equals(null) is false", function() {
            expect(new UnitList().equals(null)).equal(false);
        });

        it("*.equals() is false", function() {
            expect(new UnitList().equals()).equal(false);
        });

        it("x.equals(x) is true", function() {
            var u = new UnitList();
            expect(u.equals(u)).equal(true);
        });

        it("[].equals([]) is true", function() {
            var u1 = new UnitList();
            var u2 = new UnitList();
            expect(u1.equals(u2)).equal(true);
        });

        it("[R99].equals([R99]) is true", function() {
            var u1 = UnitList.fromUnits("R", 99);
            var u2 = UnitList.fromUnits("R", 99);
            expect(u1.equals(u2)).equal(true);
        });

        it("[R99].equals([]) is false", function() {
            var u1 = UnitList.fromUnits("R", 99);
            var u2 = new UnitList();
            expect(u1.equals(u2)).equal(false);
        });

        it("[].equals([R99]) is false", function() {
            var u1 = new UnitList();
            var u2 = UnitList.fromUnits("R", 99);
            expect(u1.equals(u2)).equal(false);
        });

    });

    describe("UnitList.missing", function() {

        it("[] missing [] == []", function() {
            var u1 = new UnitList();
            var u2 = new UnitList();
            var u3 = u2.missing(u1);
            expect(u3.totalUnits()).equal(0);
        });

        it("[R10] missing [] == []", function() {
            var u1 = UnitList.fromUnits("R", 10);
            var u2 = new UnitList();
            var u3 = u1.missing(u2);
            expect(u3.count("R")).equal(0);
        });

        it("[R99, C11] missing [R99, C11] == []", function() {
            var u1 = UnitList.fromUnits("R", 99, "C", 11);
            var u2 = u1.copy();
            var u3 = u1.missing(u2);
            expect(u3.count("R")).equal(0);
            expect(u3.count("C")).equal(0);
            expect(u3.totalUnits()).equal(0);
        });

        it("[] missing [R99, C11] == [R99, C11]", function() {
            var u1 = new UnitList();
            var u2 = UnitList.fromUnits("R", 99, "C", 11);
            var u3 = u1.missing(u2);
            expect(u3.count("R")).equal(99);
            expect(u3.count("C")).equal(11);
            expect(u3.totalUnits()).equal(110);
        });

        it("[R99, C11] missing [] == []", function() {
            var u1 = UnitList.fromUnits("R", 99, "C", 11);
            var u2 = new UnitList();
            var u3 = u1.missing(u2);
            expect(u3.count("R")).equal(0);
            expect(u3.count("C")).equal(0);
            expect(u3.totalUnits()).equal(0);
        });

    });

    describe("UnitList.addUnits", function() {

        it("[R, 99, C, 11]", function() {
            var u1 = new UnitList().addUnits("R", 99, "C", 11);
            var u2 = UnitList.fromUnits("R", 99, "C", 11);
            expect(u1).to.be.equalUsingEquals(u2);
            expect(u1.count("R")).equal(99);
            expect(u1.count("C")).equal(11);
        });

    });

});
