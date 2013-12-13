/*global:describe,beforeEach,it,expect,spyOn*/
define(["adventures-model", "text!html/adventures/der-schamane.html"], function(adventuresModel, adventureHtml) {
    var AdventuresModel = adventuresModel;

    var NORMAL_ORDER = false;
    var REVERSE_ORDER = true;

    describe("Adventures List", function() {

        var jsonStr = '[{"idx":0,"xp":14960,"totalLosses":{"R":1039,"S":268,"M":2,"G":1},"xp2":14960,"tuv":2913.5},{"idx":1,"xp":null,"totalLosses":{"R":414,"B":1,"C":85,"G":1,"S":45},"xp2":null,"tuv":1075.375},{"idx":2,"xp":null,"totalLosses":{"B":6268,"G":34,"S":608,"R":2474,"C":152,"LB":678,"M":292},"xp2":null,"tuv":16456.25},{"idx":3,"xp":26612,"totalLosses":{"R":2251,"G":48,"C":475,"S":455,"LB":200,"B":74},"xp2":26612,"tuv":7795.875},{"idx":4,"xp":2752},{"idx":5,"xp":5663},{"idx":6,"xp":7230},{"idx":7,"xp":8710},{"idx":8,"xp":11870},{"idx":9,"xp":5975},{"idx":10,"xp":14020},{"idx":11,"xp":6810},{"idx":12,"xp":33440},{"idx":13,"xp":9880},{"idx":14,"xp":38265},{"idx":15,"xp":3320},{"idx":16,"xp":6110},{"idx":17,"xp":27482},{"idx":18,"xp":3050},{"idx":19,"xp":27530},{"idx":20,"xp":39935},{"idx":21,"xp":19290},{"idx":22,"xp":41820},{"idx":23,"xp":51978},{"idx":24,"xp":28175},{"idx":25,"xp":37580},{"idx":26,"xp":10250},{"idx":27,"xp":12150},{"idx":28,"xp":9300},{"idx":29,"xp":11200},{"idx":30,"xp":10250},{"idx":31,"xp":12800},{"idx":32,"xp":3610},{"idx":33,"xp":4890},{"idx":34,"xp":8120}]';
        var adventures = JSON.parse(jsonStr);

        it("checks the adventures length", function() {
            expect(adventures.length).toBe(35);
        });

        it("sorts by ratio", function() {
            var clone = adventures.slice();
            AdventuresModel.sortInfo(clone, REVERSE_ORDER, AdventuresModel.sortInfoByRatio);
            // only first and second items have xp and tuv defined, and therefore a valid ratio
            expect(clone[0].idx).toBe(0);
            expect(clone[1].idx).toBe(3);

            var clone = adventures.slice();
            AdventuresModel.sortInfo(clone, NORMAL_ORDER, AdventuresModel.sortInfoByRatio);
            // only first and second items have xp and tuv defined, and therefore a valid ratio
            expect(clone[0].idx).toBe(3);
            expect(clone[1].idx).toBe(0);
        });

        it("sorts by xp", function() {
            var clone = adventures.slice();
            console.log(clone.map(function(it,i){return i + ": " + it.tuv + "," + it.xp + "," + it.calculatedXP; }).join("\n"));
            AdventuresModel.sortInfo(clone, REVERSE_ORDER, AdventuresModel.sortInfoByXP);
            expect(clone[0].idx).toBe(23);
            expect(clone[1].idx).toBe(22);

            var clone = adventures.slice();
            AdventuresModel.sortInfo(clone, NORMAL_ORDER, AdventuresModel.sortInfoByXP);
            expect(clone[0].idx).toBe(4);
            expect(clone[1].idx).toBe(18);
        });

        it("sorts by total losses", function() {
            var clone = adventures.slice();
            AdventuresModel.sortInfo(clone, REVERSE_ORDER, AdventuresModel.sortInfoByTotalLosses);
            // only the first 4 items have total losses defined
            expect(clone[0].idx).toBe(2);
            expect(clone[1].idx).toBe(3);
            expect(clone[2].idx).toBe(0);
            expect(clone[3].idx).toBe(1);

            var clone = adventures.slice();
            AdventuresModel.sortInfo(clone, NORMAL_ORDER, AdventuresModel.sortInfoByTotalLosses);
            // only the first 4 items have total losses defined
            expect(clone[0].idx).toBe(1);
            expect(clone[1].idx).toBe(0);
            expect(clone[2].idx).toBe(3);
            expect(clone[3].idx).toBe(2);
        });

    });

});