define([
    'intern!object',
    'require',
    './JasmineFunctionalHelper'
], function (registerSuite, require, Helper) {

    registerSuite({
        name: 'Functional',
        'SpecRunner.html': function() {
            var helper = new Helper(this.remote);
            return helper.runJasmineSpecRunner(require.toUrl("../test/SpecRunner.html"), this);
        }
    });

});
