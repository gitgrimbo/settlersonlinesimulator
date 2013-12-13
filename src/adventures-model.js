define(function() {

    function undef(o) {
        return "undefined" === typeof o || null === o;
    }

    var AdventuresModel = {};

    AdventuresModel.sortInfo = function(infos, reverse, fn) {
        infos.sort(fn.bind(null, reverse));
    };

    AdventuresModel.sortInfoByRatio = function(reverse, a, b) {
        // why the (0 === x.tuv) check? So we don't divide by zero.
        if (undef(a.xp) || undef(a.tuv) || (0 === a.tuv)) return 1;
        if (undef(b.xp) || undef(b.tuv) || (0 === b.tuv)) return -1;
        var val = (a.xp / a.tuv) - (b.xp / b.tuv);
        return (true === reverse) ? -val : val;
    };

    AdventuresModel.sortInfoByXP = function(reverse, a, b) {
        if (undef(a.xp)) return 1;
        if (undef(b.xp)) return -1;
        var val = a.xp - b.xp;
        return (true === reverse) ? -val : val;
    };

    AdventuresModel.sortInfoByTotalLosses = function(reverse, a, b) {
        if (undef(a.tuv)) return 1;
        if (undef(b.tuv)) return -1;
        var val = a.tuv - b.tuv;
        return (true === reverse) ? -val : val;
    };

    return AdventuresModel;

});