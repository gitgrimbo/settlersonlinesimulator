// Learn more about configuring this file at <https://github.com/theintern/intern/wiki/Configuring-Intern>.
// These default settings work OK for most people. The options that *must* be changed below are the
// packages, suites, excludeInstrumentation, and (if you want functional tests) functionalSuites.
define([
    "module",
    "./intern"
], function(module, config) {
    var cfg = {
        // The port on which the instrumenting proxy will listen
        // grimbo - Beware that this doesn't clash with Sonar, which also likes port 9000!
        proxyPort: 9001,

        // A fully qualified URL to the Intern proxy
        // Why not localhost? Because we're connecting VMs to this and they need a full address.
        // grimbo - Beware that this doesn't clash with Sonar, which also likes port 9000!
        //proxyUrl: 'http://localhost:9001/',
        proxyUrl: 'http://192.168.1.80:9001/',

        // Default desired capabilities for all environments. Individual capabilities can be overridden by any of the
        // specified browser environments in the `environments` array below as well. See
        // https://code.google.com/p/selenium/wiki/DesiredCapabilities for standard Selenium capabilities and
        // https://saucelabs.com/docs/additional-config#desired-capabilities for Sauce Labs capabilities.
        // Note that the `build` capability will be filled in with the current commit ID from the Travis CI environment
        // automatically
        capabilities: {
            'selenium-version': '2.43.1'
        },

        // Browsers to run integration testing against. Note that version numbers must be strings if used with Sauce
        // OnDemand. Options that will be permutated are browserName, version, platform, and platformVersion; any other
        // capabilities options specified for an environment will be copied as-is
        environments: [
            { browserName: 'chrome' }
            , { browserName: 'firefox', version: [ '33' ] }

            // version: version: ['9', ''] or ['', '9'] *seems* to work for 2 IEs,
            // when the IE9 node has a specific version '9' in its capability file,
            // and I also have an IE10 available
            // But when I omit version, I just get one IE running, rather than both.
            // IE9 is min supported for the bookmarklet
            , { browserName: 'internet explorer', version: [ '9', '10'] }

            //,{ browserName: 'internet explorer', version: '9' }
            // grimbo - can't get phantomjs to work (see pom-selenium.xml)
            //{ browserName: 'phantomjs' }
            //grimbo - comment out specific browsers
            //{ browserName: 'internet explorer', version: '11', platform: 'Windows 8.1' },
            //{ browserName: 'internet explorer', version: '10', platform: 'Windows 8' },
            //{ browserName: 'internet explorer', version: '9', platform: 'Windows 7' },
            //{ browserName: 'firefox', version: '25', platform: [ 'OS X 10.6', 'Windows 7' ] },
            //{ browserName: 'firefox', version: '24', platform: 'Linux' },
            //{ browserName: 'chrome', version: '', platform: [ 'Linux', 'OS X 10.6', 'Windows 7' ] },
            //{ browserName: 'safari', version: '6', platform: 'OS X 10.8' }
        ],

        // Maximum number of simultaneous integration tests that should be executed on the remote WebDriver service
        maxConcurrency: 3,

        // Whether or not to start Sauce Connect before running tests
        //grimbo - comment out sauce
        useSauceConnect: false,

        // Connection information for the remote WebDriver service. If using Sauce Labs, keep your username and password
        // in the SAUCE_USERNAME and SAUCE_ACCESS_KEY environment variables unless you are sure you will NEVER be
        // publishing this configuration file somewhere
        webdriver: {
            host: 'localhost',
            port: 4444
        },

        //reporters: [ 'runner', 'lcov', 'interntest/lcovhtml', 'interntest/ReporterToHandleJasmineJUnitReports.js' ]
        reporters: [ 'cobertura', 'console', 'lcov', 'lcovhtml' ]
    };

    for (var i in cfg) {
        config[i] = cfg[i];
    }

    return config;
});
