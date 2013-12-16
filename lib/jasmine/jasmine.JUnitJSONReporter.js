// Modied from https://raw.github.com/larrymyers/jasmine-reporters/aa432e08b2414e82bc5ac8f8e031981d537a733e/src/jasmine.junit_reporter.js
(function() {

    if (typeof jasmine == 'undefined') {
        throw new Error("jasmine library does not exist in global namespace!");
    }

    function elapsed(startTime, endTime) {
        return (endTime - startTime)/1000;
    }

    function ISODateString(d) {
        function pad(n) { return n < 10 ? '0'+n : n; }

        return d.getFullYear() + '-' +
            pad(d.getMonth()+1) + '-' +
            pad(d.getDate()) + 'T' +
            pad(d.getHours()) + ':' +
            pad(d.getMinutes()) + ':' +
            pad(d.getSeconds());
    }

    function trim(str) {
        return str.replace(/^\s+/, "" ).replace(/\s+$/, "" );
    }

    function escapeInvalidXmlChars(str) {
        return str.replace(/\&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/\>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/\'/g, "&apos;");
    }

    /**
     * Generates JUnit XML for the given spec run.
     * Allows the test results to be used in java based CI
     * systems like CruiseControl and Hudson.
     *
     * @param {string} savePath where to save the files
     * @param {boolean} consolidate whether to save nested describes within the
     *                  same file as their parent; default: true
     * @param {boolean} useDotNotation whether to separate suite names with
     *                  dots rather than spaces (ie "Class.init" not
     *                  "Class init"); default: true
     */
    var JUnitJSONReporter = function(savePath, consolidate, useDotNotation) {
        this.savePath = savePath || '';
        this.consolidate = consolidate === jasmine.undefined ? true : consolidate;
        this.useDotNotation = useDotNotation === jasmine.undefined ? true : useDotNotation;
    };
    JUnitJSONReporter.finished_at = null; // will be updated after all files have been written

    JUnitJSONReporter.prototype = {
        reportSpecStarting: function(spec) {
            spec.startTime = new Date();

            if (!spec.suite.startTime) {
                spec.suite.startTime = spec.startTime;
            }
        },

        reportSpecResults: function(spec) {
            var results = spec.results();
            spec.didFail = !results.passed();
            spec.duration = elapsed(spec.startTime, new Date());
            spec.jsonOutput = {
                classname: this.getFullName(spec.suite),
                name: escapeInvalidXmlChars(spec.description),
                time: spec.duration
            };
            if (results.skipped) {
                spec.jsonOutput.skipped = true;
            }

            var failure = [];
            var failures = 0;
            var resultItems = results.getItems();
            for (var i = 0; i < resultItems.length; i++) {
                var result = resultItems[i];

                if (result.type == 'expect' && result.passed && !result.passed()) {
                    failures += 1;
                    failure.push({
                        type: result.type,
                        message: trim(escapeInvalidXmlChars(result.message)),
                        body: escapeInvalidXmlChars(result.trace.stack || result.message)
                    });
                }
            }
            if (failure.length > 0) {
                spec.jsonOutput.failures = failure;
            }
        },

        reportSuiteResults: function(suite) {
            var results = suite.results();
            var specs = suite.specs();
            var specOutput = {};
            // for JUnit results, let's only include directly failed tests (not nested suites')
            var failedCount = 0;

            suite.status = results.passed() ? 'Passed.' : 'Failed.';
            if (results.totalCount === 0) { // todo: change this to check results.skipped
                suite.status = 'Skipped.';
            }

            // if a suite has no (active?) specs, reportSpecStarting is never called
            // and thus the suite has no startTime -- account for that here
            suite.startTime = suite.startTime || new Date();
            suite.duration = elapsed(suite.startTime, new Date());

            for (var i = 0; i < specs.length; i++) {
                failedCount += specs[i].didFail ? 1 : 0;
                (specOutput.testcases = specOutput.testcases || []).push(specs[i].jsonOutput);
            }
            suite.jsonOutput = {
                name: this.getFullName(suite),
                errors: 0,
                tests: specs.length,
                failures: failedCount,
                time: suite.duration,
                timestamp: ISODateString(suite.startTime),
                testcases: specOutput.testcases
            };
        },

        reportRunnerResults: function(runner) {
            var results = {};
            results.suites = runner.suites().map(function(suite) {
                return suite.jsonOutput;
            });
            // When all done, make it known on JUnitJSONReporter
            JUnitJSONReporter.finished_at = (new Date()).getTime();
            JUnitJSONReporter.results = results;
        },

        getFullName: function(suite, isFilename) {
            var fullName;
            if (this.useDotNotation) {
                fullName = suite.description;
                for (var parentSuite = suite.parentSuite; parentSuite; parentSuite = parentSuite.parentSuite) {
                    fullName = parentSuite.description + '.' + fullName;
                }
            }
            else {
                fullName = suite.getFullName();
            }

            // Either remove or escape invalid XML characters
            if (isFilename) {
                return fullName.replace(/[^\w]/g, "");
            }
            return escapeInvalidXmlChars(fullName);
        },

        log: function(str) {
            var console = jasmine.getGlobal().console;

            if (console && console.log) {
                console.log(str);
            }
        }
    };

    // export public
    jasmine.JUnitJSONReporter = JUnitJSONReporter;
})();