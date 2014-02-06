// copied from node_modules\intern\lib\reporters\runner.js
/*

This reporter aims to create JUnit XML files from the results of a Jasmine
test which uses a modified jasmine.junit_reporter.js.

jasmine.junit_reporter.js is modified to attach the results of the tests to
the "jasmine" global and not write to file.

The intern test waits for these results to be ready, and then evals this
result object via webdriver, and attaches these results to the driver instance
itself.

This reporter then takes these results from the driver instance and writes
them to files.

*/
define([
    // requires packages to be set up correctly in your intern config file. e.g.:
    //   packages: [ { name: 'intern', location: './node_modules/intern' } ],
    //   packages: [ { name: 'dojo', location: './node_modules/intern/node_modules/dojo' } ]
    'module',
    'intern/lib/args',
    'intern/lib/util',
    'dojo/node!path',
    'dojo/node!fs',
    './mkdirp',
    './browser-detection'
], function (module, args, util, path, fs, mkdirp, browserDetection) {
    var MID = module.id,
        sessions = {},
        hasErrors = false;

    function envWithRealOperatingSystem(env, navigator) {
        var browser = browserDetection(navigator);
        //console.log(MID, "browser", browser);

        var fakeEnv = {
            //platform: env.platform,
            platform: browser.os + browser.osVersion,
            browserName: env.browserName,
            version: env.version
        };

        return fakeEnv;
    }










    function FileHelper(dir) {
        this.dir = dir || './reports';
    }

    FileHelper.makeFilename = function (filename, dir, env) {
        // jasmine.junit_reporter.js passes filename with xml extension.
        // We want to preserve that extension, so we remove it to add it
        // again after the wnv details.
        var idx = filename.lastIndexOf(".");
        var extension = null;
        if (idx > -1) {
            extension = filename.substring(idx);
            filename = filename.substring(0, idx);
        }

        var file = filename + "-" + env.platform + "-" + env.browserName + "-" + env.version + (extension ? extension : "");
        return path.join(dir, file);
    };

    FileHelper.saveResult = function (filename, dir, env, content) {
        //console.log(MID, filename, dir);

        try {
            mkdirp.sync(dir);
        } catch (e) {
            if (e.code !== "EEXIST") {
                // already exists is ok, anything else is not
                throw e;
            }
        }

        filename = FileHelper.makeFilename(filename, dir, env);
        //console.log(MID, p);

        fs.writeFileSync(filename, content, {
            encoding: 'utf8',
            flags: 'w+'
        });

        console.log(MID, filename + " written");
    };

    FileHelper.prototype.saveResults = function (session, remotePropertyToSave) {
        remotePropertyToSave = remotePropertyToSave || "xmlResults";
        var results = session.remote[remotePropertyToSave];
        //console.log("\n\n", MID, results);

        var navigator = session.remote["__navigator"];

        var env = session.remote.environmentType;
        for (sessionid in results) {
            var paths = results[sessionid];
            var nav = navigator[sessionid];
            var fakeEnv = envWithRealOperatingSystem(env, nav);

            for (testpath in paths) {
                // testpath will always be blank for our jasmine reporter
                var filenames = paths[testpath];
                for (filename in filenames) {
                    try {
                        var content = filenames[filename];
                        //console.log(MID, content);
                        var contentStr = ("string" === typeof content) ? content : JSON.stringify(content);

                        FileHelper.saveResult(filename, this.dir, fakeEnv, contentStr);
                    } catch (e) {
                        console.log(MID, filename, this.dir, e);
                    }
                }
            }
        }
    };

    /**
     * README!
     *
     * The mvn site tool that processes the XML doesn't like spaces or dots in
     * the test suites and test case names.
     *
     * So we turn the names from names like:
     *   "Adventures List"
     * to names like:
     *   "WINDOWS.internet_explorer.10.Adventures_List", or
     *   "XP.firefox.3_6_28.Units_Required"
     *
     * Maybe there is a better way of post-processing the XML that comes from
     * "jasmine.JUnitXMLReporter"?
     */
    function fixJUnitXmlForReporting(session) {
        // Very simple regex that 'does enough' in terms of fixing a string for java name compatibility.
        var JAVA_NAME_RE = /\s+|[:;.\-]/gi;

        // Capture both the name and the bit before the name, for ease of replacement.
        // Simplistic regex for matching test suite or test case names.
        // e.g. if there is a ">" in the attribute value, it won't work.
        var TESTSUITE_NAME_RE = /(<testsuite[^>]name=")([^"]*)"/gi;
        var TESTCASE_NAME_RE = /(<testcase[^>]classname=")([^"]*)"/gi;

        function javaName(s) {
            return s.replace(JAVA_NAME_RE, "_");
        }

        function processXmlStr(xml, env) {
            [TESTSUITE_NAME_RE, TESTCASE_NAME_RE].forEach(function(re) {
                xml = xml.replace(re, function(match, $1, $2, offset, original) {
                    // synthesize a Java package name + class name.
                    var newSuiteName = javaName(env.platform) + "." + javaName(env.browserName) + "." + javaName(env.version) + "." + javaName($2);
                    return $1 + newSuiteName + '"';
                });
            });
            return xml;
        }

        var results = session.remote.xmlResults;
        //console.log(MID, "results", results);

        var navigator = session.remote["__navigator"];
        console.log(MID, "navigator", navigator);

        var env = session.remote.environmentType;

        for (sessionid in results) {
            var paths = results[sessionid];
            var nav = navigator[sessionid];
            var fakeEnv = envWithRealOperatingSystem(env, nav);

            for (testpath in paths) {
                // testpath will always be blank for our jasmine reporter
                var filenames = paths[testpath];
                for (filename in filenames) {
                    var xml = filenames[filename];
                    filenames[filename] = processXmlStr(xml, fakeEnv);
                }
            }
        }
    }

    return {
        '/session/start': function (remote) {
            console.log(MID, '/session/start - ' + remote.sessionId + ' - ' + remote.environmentType);
            sessions[remote.sessionId] = {
                remote: remote
            };
        },

        '/test/fail': function (test) {
            console.error(MID, 'Test ' + test.id + ' FAILED on ' + sessions[test.sessionId].remote.environmentType + ':');
            util.logError(test.error);
        },

        '/error': function (error) {
            util.logError(error);
            hasErrors = true;
        },

        '/suite/end': function (suite) {
            if (suite.name === 'main') {
                if (!sessions[suite.sessionId]) {
                    args.proxyOnly || console.warn('BUG: /suite/end was received for session ' + suite.sessionId + ' without a /session/start');
                    return;
                }

                sessions[suite.sessionId].suite = suite;
            }
        },

        '/session/end': function (remote) {
            var session = sessions[remote.sessionId],
                suite = session.suite;

            // noop
        },

        '/runner/end': function () {
            console.log(MID, '/runner/end', 'enter');
            var numEnvironments = 0,
                numTests = 0,
                numFailedTests = 0;

            try{
                for (var k in sessions) {
                    //console.log(MID, k);
                    var session = sessions[k];
                    ++numEnvironments;
                    numTests += session.suite.numTests;
                    numFailedTests += session.suite.numFailedTests;

                    // Save the JUnit XML as it is used by mvn site
                    fixJUnitXmlForReporting(session);
                    new FileHelper('./reports/junit').saveResults(session);

                    // Save the JSON results, although we don't use them yet.
                    new FileHelper('./reports/junit').saveResults(session, "jsonResults");

                    //console.log(MID, session.remote.jsonResults);
                }
            } catch (e) {
                console.log(MID, e);
            }

            console.log(MID, '/runner/end', 'exit');
        }
    };
});
