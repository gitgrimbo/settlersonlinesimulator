// Learn more about configuring this file at <https://github.com/theintern/intern/wiki/Configuring-Intern>.
// These default settings work OK for most people. The options that *must* be changed below are the
// packages, suites, excludeInstrumentation, and (if you want functional tests) functionalSuites.
define(["./intern-grid"], function(config) {
    config.proxyUrl = 'http://localhost:9001/';
    config.environments = [
        { browserName: 'chrome' }
        , { browserName: 'firefox' }
        , { browserName: 'internet explorer' }
    ];
    return config;
});
