define([
    'module',
    'intern/chai!assert',
], function (module, assert) {
    var MID = module.id;

    function Helper(remote, timeout) {
        this.remote = remote;
        this.timeout = timeout || 20 * 1000;
    }

    /**
     * This method facilitates evaluating an expression in the browser (using
     * eval), and storing the result of it as a property on test.remote, keyed
     * by the test's sessionId.
     * An intern reporter, for example, can then pick up these results to
     * generate JUnit XML, for example.
     */
    Helper.prototype.saveBrowserObjectToRemote = function(promise, test, jsExpression, remotePropName) {

        // NOTE[1] - I am not sure the following commented section actually
        // applies, as all browsers are now working without stringify.

        // Note this uses JSON.stringify to pass the data from the browser to
        // the server (this code).
        // The iedriver always seemed to error if I tried to pass a JSON
        // object, whereas firefox and chrome were fine.
        // The browser needs JSON for this to work (so IE may need a shim, or
        // be in standards mode).
        jsExpression = 'JSON.stringify(' + jsExpression + ')';
        // NOTE[1] - end

        return promise.eval(jsExpression, this.timeout)
            .then(function(results) {
                //console.log(MID, typeof results, results);

                // Convert the stringified expression back to JSON
                results = JSON.parse(results);
                // @NOTE[1]

                // Create the holder if it does not exist
                var remoteOb = test.remote[remotePropName] || {};
                // Add the results, keyed by sessionId
                remoteOb[test.sessionId] = results;
                // Set the holder
                test.remote[remotePropName] = remoteOb;

                //console.log(MID, remotePropName, results);

                assert.ok(true);
            }, function(e) {
                console.error(MID, test.name, e);
                assert.ok(false, MID + ": " + test.name + ": " + e);
            });
    }

    // Do not have final semi-colon in this function,
    // as it will be toString'd and then the source eval'd in parens.
    // So "(CODE;)" is not valid to be eval'd.
    // The file containing this function MUST be in the "excludeInstrumentation" property of intern config otherwise a
    // semicolon will be inserted and this function will break.
    function navigatorToJSON() {
        (function(o) {
            var val = null, t = null;
            for (var i = 1; i < arguments.length; i++) {
                for (var k in arguments[i]) {
                    val = arguments[i][k];
                    t = typeof val;
                    if ("string" === t || "number" === t || "boolean" === t) o[k] = val;
                }
            }
            return o;
        }({}, window.navigator))
    }

    Helper.prototype.runJasmineSpecRunner = function(url, test) {
        var promise = this.remote.get(url)
            .waitForCondition('"undefined" !== typeof jasmine', this.timeout)
            .waitForCondition('"undefined" !== typeof jasmine.JUnitXMLReporter', this.timeout)
            .waitForCondition('"undefined" !== typeof jasmine.JUnitXMLReporter.results', this.timeout)
            .waitForCondition('"undefined" !== typeof jasmine.JUnitJSONReporter', this.timeout)
            .waitForCondition('"undefined" !== typeof jasmine.JUnitJSONReporter.results', this.timeout);
        promise = this.saveBrowserObjectToRemote(promise, test, 'jasmine.JUnitXMLReporter.results', 'xmlResults');
        promise = this.saveBrowserObjectToRemote(promise, test, 'jasmine.JUnitJSONReporter.results', 'jsonResults');

        var nav1 = navigatorToJSON.toString();
        console.log(nav1);
        nav1 = /\{([\s\S]*)\}/.exec(nav1)[1].trim();
        console.log(nav1);

        promise = this.saveBrowserObjectToRemote(promise, test, nav1, '__navigator');
        promise = this.saveBrowserObjectToRemote(promise, test, 'navigator.userAgent', '__userAgent');
        return promise;
    };

    return Helper;

});
