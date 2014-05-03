define([], function() {
    var liveDomain = "settlersonlinesimulator.com";

    /**
     * The default Env (when location is not provided) reflects the current
     * window.location.
     */
    function Env(location) {
        this.location = location || window.location;
        this.href = this.location.href;
        this.hostname = this.location.hostname;
    }

    Env.prototype.isLive = function() {
        return this.hostname === liveDomain;
    }

    var defaultEnv = new Env();

    return {
        Env: Env,
        defaultEnv: defaultEnv
    };

});
