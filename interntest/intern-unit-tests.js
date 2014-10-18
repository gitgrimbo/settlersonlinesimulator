define(["./intern"], function(config) {
    // filter out all the tests that need the dom
    config.suites = config.suites.filter(function(suite) {
        return config.suitesNeedingDom.indexOf(suite) < 0;
    });
    return config;
});
