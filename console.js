define(function() {
    var console = window.console;

    function noop() {}

    function getApplyableLog(console) {
        if ("undefined" !== typeof console.log.apply) {
            return console.log;
        }

        // http://stackoverflow.com/a/5539378/319878
        // IE patch
        return Function.prototype.bind.call(console.log, console);
    }

    function createLog(name, on) {
        on = (false !== on);
        if (!on) {
            return noop;
        }

        // Return a log function that prepends the logger name to the arguments.
        return function() {
            var args = Array.prototype.slice.call(arguments);
            args = [name].concat(args);
            var log = getApplyableLog(console);
            log.apply(console, args);
        };
    }

    return {
        createLog: createLog
    };
});