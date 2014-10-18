define(["./intern"], function(config) {
    config.suites = config.suites.concat(config.suitesNeedingDom);
    return config;
});
