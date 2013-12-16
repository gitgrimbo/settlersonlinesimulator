define([
    'dojo/node!istanbul/lib/collector',
    'dojo/node!istanbul/lib/report/html',
    'dojo/node!istanbul/index'
], function (Collector, Reporter) {
    var collector = new Collector(),
        reporter = new Reporter({
            dir: './target/site/reports/istanbulhtml'
        });

    return {
        '/coverage': function (sessionId, coverage) {
            collector.add(coverage);
        },

        stop: function () {
            reporter.writeReport(collector, true);
        }
    };
});
