define(["module", "console"], function(module, _console) {
    var DEBUG = true;
    var log = _console.createLog(module.id, DEBUG);

    /**
     * General purpose property iteration.
     * For order-sensitive operations (i.e. where you want the iteration
     * order to be stable cross-browser) use UnitList.forEachUnit().
     * There is no return value. Returing a value from the callback is superfluous.
     */
    function forEachOwnProperty(ob, callback, context) {
        for (var i in ob) {
            if (ob.hasOwnProperty(i)) {
                callback.call(context, ob, i);
            }
        }
    }

    function undef(ob) {
        return "undefined" === typeof ob;
    }

    function undefCheck(val, name) {
        if (null === val || undef(val)) {
            throw new Error(name + " is undefined or null");
        }
    }

    function checkType(val, type, name) {
        if (!(val instanceof type)) {
            throw new Error(name + " is not of type " + type.name);
        }
    }


    // UnitList


    /**
     * Constructs a new UnitList.
     * A UnitList is a collection of units, where a unit is represented by a code,
     * e.g. {R: 100, S: 200}.
     */
    function UnitList() {
        if (arguments.length > 0) {
            throw new Error("Use copy()");
        }
    }

    /**
     * Unit values. Scaled up by x1000.
     */
    UnitList.unitValues = {
        "R": 1250,
        "B": 1000,
        "LB": 2875,
        "M": 3375,
        "C": 3375,
        "S": 6000,
        "E": 11875,
        "A": 21875,
        "K": 26875
    };

    /**
     * Unit array ordered by unitValue.
     */
    UnitList.unitValuesArray = (function(unitValues) {
        var arr = [];
        for (var code in unitValues) {
            arr.push({
                code: code,
                value: unitValues[code]
            });
        }
        arr = arr.sort(function(a, b) {
            return a.value - b.value;
        });
        return arr;
    }(UnitList.unitValues));

    /**
     *
     */
    UnitList.unitNames = {
        "G": "General",
        "R": "Recruit",
        "B": "Bowman",
        "LB": "Longbowman",
        "M": "Militia",
        "C": "Cavalry",
        "S": "Soldier",
        "E": "Elite Soldier",
        "A": "Crossbowman",
        "K": "Cannoneer"
    };

    /**
     * Iterate the UnitList units by unit value order.
     */
    UnitList.forEachUnit = function(unitList, callback, context) {
        UnitList.unitValuesArray.forEach(function(unit) {
            if (unitList.hasOwnProperty(unit.code)) {
                callback.call(context || unitList, unit.code, unitList);
            }
        });
    };

    /**
     * Iterate all standard UnitList units by unit value order.
     */
    UnitList.forAllUnits = function(callback, context) {
        UnitList.unitValuesArray.forEach(function(unit) {
            callback.call(context, unit.code);
        });
    };

    UnitList.fromJSON = function(json) {
        var res = new UnitList();
        for (var prop in json) {
            if (UnitList.unitNames[prop]) {
                res[prop] = json[prop];
            }
        }
        return res;
    };

    UnitList.prototype.copy = function() {
        var res = new UnitList();
        forEachOwnProperty(this, function(ob, prop) {
            res[prop] = this[prop];
        }, this);
        return res;
    };

    UnitList.prototype.equals = function(otherUnitList) {
        if (!(otherUnitList instanceof UnitList)) {
            // type check
            return false;
        }

        if (this === otherUnitList) {
            // same instance
            return true;
        }

        var equals = true;
        // We're only interested in testing the units for equality.
        // i.e. all other object properties are ignored.
        UnitList.forAllUnits(function(prop) {
            if (!equals) {
                return;
            }
            // UnitList.count() returns 0 for 0, null, undefined.
            // So {R:null}.equals({R:0}).equals({R:undefined}).equals({})
            equals = this.count(prop) === otherUnitList.count(prop);
        }, this);

        return equals;
    };

    UnitList.prototype.removeZeros = function() {
        var res = new UnitList();
        forEachOwnProperty(this, function(ob, prop) {
            // this[prop] is falsey if zero.
            if (this[prop]) {
                res[prop] = this[prop];
            }
        }, this);
        return res;
    };

    /**
     * Create a UnitList from a list of arguments, e.g. ["R", 100, "C", 99] etc.
     */
    UnitList.fromUnits = function() {
        var res = new UnitList();
        for (var i = 0; i < arguments.length; i += 2) {
            res[arguments[i]] = arguments[i + 1];
        }
        return res;
    };

    /**
     * @return The total number of units.
     */
    UnitList.prototype.totalUnits = function() {
        var count = 0;
        forEachOwnProperty(this, function(ob, prop) {
            count += this[prop];
        }, this);
        return count;
    };

    /**
     * @return The total value of units.
     */
    UnitList.prototype.totalUnitValue = function() {
        var value = 0;
        forEachOwnProperty(this, function(ob, prop) {
            var unitValue = UnitList.unitValues[prop];
            if (unitValue) {
                // if not falsey
                value += (this[prop] * unitValue);
            }
        }, this);
        return value / 1000;
    };

    /**
     * @return a new UnitList.
     */
    UnitList.prototype.add = function(unitList) {
        var res = this.copy();
        forEachOwnProperty(unitList, function(ob, prop) {
            var val = unitList[prop];
            res[prop] = this.hasOwnProperty(prop) ? res[prop] + val : val;
        }, this);
        return res;
    };

    UnitList.addAll = function(unitListArr) {
        return unitListArr.reduce(function(cur, item) {
            return cur.add(item);
        }, new UnitList());
    };

    /**
     * @return a new UnitList.
     */
    UnitList.prototype.addUnits = function() {
        var res = this.copy();
        for (var i = 0; i < arguments.length; i += 2) {
            var unit = arguments[i];
            var count = arguments[i + 1];
            var cur = res.count(unit);
            res[unit] = cur + count;
        }
        return res;
    };

    /**
     * @return a new UnitList.
     */
    UnitList.prototype.subtract = function(unitList) {
        var res = this.copy();
        forEachOwnProperty(unitList, function(ob, prop) {
            var val = unitList[prop];
            res[prop] = this.hasOwnProperty(prop) ? res[prop] - val : -val;
        }, this);
        return res;
    };

    /**
     * Ensure that the returned UnitList has enough units to satisfy the
     * "recruitmentUnitList" unit requirements. I.e., the returned UnitList may be
     * exactly the same as "this" if there are enough units to satisfy
     * "recruitmentUnitList".
     *
     * @return a new UnitList, with more units as required to fulfil "recruitmentUnitList".
     */
    UnitList.prototype.recruit = function(recruitmentUnitList) {
        var res = this.copy();
        forEachOwnProperty(recruitmentUnitList, function(ob, prop) {
            var val = recruitmentUnitList[prop];
            res[prop] = this.hasOwnProperty(prop) ? Math.max(val, this[prop]) : val;
        }, this);
        return res;
    };

    UnitList.prototype.recruitUpTo = function(nextUnitList, unitListSizeLimit) {
        var res = this.copy();
        UnitList.forEachUnit(nextUnitList, function(prop) {
            var remaining = unitListSizeLimit - res.totalUnits();
            var cur = res.hasOwnProperty(prop) ? res[prop] : 0;
            var increase = (nextUnitList[prop] - cur);
            if (increase >= remaining) {
                // Overwrite with the new value (this also works if res[prop] was undefined).
                res[prop] = (cur + remaining);
                return res;
            }
            res[prop] += increase;
        });
        return res;
    };

    UnitList.prototype.missing = function(requiredUnits) {
        undefCheck(requiredUnits, "requiredUnits");
        var res = new UnitList();
        UnitList.forEachUnit(requiredUnits, function(prop) {
            var reqd = requiredUnits[prop];
            var cur = this.count(prop);
            var diff = (reqd - cur);
            res[prop] = (diff > 0) ? diff : 0;
        }, this);
        return res;
    };

    UnitList.prototype.trim = function(unitListSizeLimit) {
        undefCheck(unitListSizeLimit, "unitListSizeLimit");
        var res = this.copy();
        UnitList.forEachUnit(res, function(prop) {
            var overLimit = res.totalUnits() - unitListSizeLimit;
            if (overLimit < 1) {
                // No more reduction required.
                return res;
            }
            var cur = res[prop];
            if (cur >= overLimit) {
                // This prop can satisfy ALL the reduction.
                res[prop] = (cur - overLimit);
                return res;
            }
            res[prop] = 0;
        });
        return res;
    };

    /**
     * @return The number of units, for the unit identified by code.
     *         (if there are no units for that code (e.g. undefined),
     *         then returns 0.
     */
    UnitList.prototype.count = function(code) {
        return this[code] || 0;
    };

    UnitList.prototype.toString = function() {
        var s = "";
        UnitList.forEachUnit(this, function(prop) {
            if (s.length > 0) {
                s += ", ";
            }
            s += (prop + ": " + this[prop]);
        }, this);
        return s + " (" + this.totalUnits() + ")";
    }

    return UnitList;

});