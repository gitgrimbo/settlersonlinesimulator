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
    './mkdirp'
], function (module, args, util, path, fs, mkdirp) {
    var MID = module.id,
        sessions = {},
        hasErrors = false;

    function FileHelper(dir) {
        this.dir = dir || './reports';
    }

    FileHelper.makeFilename = function (filename, dir, env) {
        // jasmine.junit_reporter.js passes filename with xml extension.
        // We want to preserve that extension, so we remove it to add it
        // again after the wnv details.
        var idx = filename.indexOf(".xml");
        if (idx > -1) {
            filename = filename.substring(0, idx);
        }

        var file = filename + "-" + env.platform + "-" + env.browserName + "-" + env.version + ".xml";
        return path.join(dir, file);
    };

    FileHelper.saveResult = function (filename, dir, env, xml) {
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

        fs.writeFileSync(filename, xml, {
            encoding: 'utf8',
            flags: 'w+'
        });

        console.log(MID, filename + " written");
    };

    FileHelper.prototype.saveResults = function (session) {
        var results = session.remote.xmlResults;
        //console.log(MID, results);
        var env = session.remote.environmentType;
        for (sessionid in results) {
            var paths = results[sessionid];
            for (testpath in paths) {
                // testpath will always be blank for our jasmine reporter
                var filenames = paths[testpath];
                for (filename in filenames) {
                    try {
                        var xml = filenames[filename];
                        //console.log(MID, xml);
                        FileHelper.saveResult(filename, this.dir, env, xml);
                    } catch (e) {
                        console.log(MID, filename, this.dir, e);
                    }
                }
            }
        }
    };

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
            console.log(MID, '/runner/end');
            var numEnvironments = 0,
                numTests = 0,
                numFailedTests = 0;

            for (var k in sessions) {
                //console.log(MID, k);
                var session = sessions[k];
                ++numEnvironments;
                numTests += session.suite.numTests;
                numFailedTests += session.suite.numFailedTests;
                new FileHelper('./reports/junit').saveResults(session);
                //console.log(MID, session.remote.jsonResults);
            }
        }
    };
});
