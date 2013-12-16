define([
    'intern!object',
    'intern/chai!assert',
    'require',
    './JasmineFunctionalHelper'
], function (registerSuite, assert, require, Helper) {

    registerSuite({
        name: 'Functional',
        'SpecRunner.html': function() {
            var helper = new Helper(this.remote);
            return helper.runJasmineSpecRunner(require.toUrl("../test/SpecRunner.html"), this);
        }
    });

});
