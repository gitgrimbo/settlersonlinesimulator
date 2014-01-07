define(["./UnitList"], function(UnitList) {

    function UnitListArr(unitListArr) {
        this.unitListArr = unitListArr || [];
    }

    UnitListArr.prototype.add = function(unitList) {
        this.unitListArr.push(unitList);
    };

    UnitListArr.prototype.toUnitList = function() {
        return UnitList.addAll(this.unitListArr);
    };

    UnitListArr.prototype.totalUnits = function() {
        return this.toUnitList().totalUnits();
    };

    /**
     * Removes 'size' number of units from the start of the UnitListArr.
     * E.g. [[R5], [R5, S10]].removeFromStart(15) would leave [S5].
     * Why? Because the entire first item would be removed, and the R5 of the
     * second item would be removed (because units are removed in
     * least-unit-value-first order).
     */
    UnitListArr.prototype.removeFromStart = function(size) {
        var res = new UnitList();
        for (var i = 0; i < this.unitListArr.length; i++) {
            var unitList = this.unitListArr[i];
            var singleSize = unitList.totalUnits();
            var curTotal = res.totalUnits();
            var excess = curTotal + singleSize - size;
            if (excess >= 0) {
                // trim the last unit list so that in total we have 'size'.
                // trim obeys least-unit-value-first removal order.
                var trimmed = unitList.trim(singleSize - excess);

                // adding trimmed to res should give us 'size'
                res = res.add(trimmed);

                var newArr = this.unitListArr.slice(i + 1);
                if (excess > 0) {
                    // if there were 'leftovers', leave them in at the start,
                    // as these are the next priority,
                    newArr = [unitList.subtract(trimmed)].concat(newArr);
                }
                this.unitListArr = newArr;
                return res;
            }
            res = res.add(unitList);
        }
        return res;
    };

    return UnitListArr;

});
