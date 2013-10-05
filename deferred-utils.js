define(["jquery"], function($) {
    function rejectWith() {
        var dfd = $.Deferred();
        dfd.reject.apply(dfd, arguments);
        return dfd;
    }

    function resolveWith() {
        var dfd = $.Deferred();
        dfd.resolve.apply(dfd, arguments);
        return dfd;
    }

    return {
        rejectWith: rejectWith,
        resolveWith: resolveWith
    };
});