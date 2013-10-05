/*global yepnope */
define(["jquery"], function($) {

    /**
     * Deferred wrapper for yepnope.
     */
    function yepNopeDeferred(opts) {
        var dfd = $.Deferred();

        if (typeof opts === "string") {
            var src = opts;
            opts = {
                load: src
            };
        }

        var complete = opts.complete;
        opts.complete = function() {
            if (complete) {
                complete.apply(this, arguments);
            }
            dfd.resolve.apply(dfd, arguments);
        };

        yepnope(opts);
        return dfd;
    }

    function Loader(opts) {
        opts = opts || {};
        this.yepNopeSrc = opts.yepNopeSrc || "//cdnjs.cloudflare.com/ajax/libs/yepnope/1.5.4/yepnope.min.js";
    }

    Loader.prototype.loadLoader = function() {
        var loader = this;
        var dfd = this.importScripts([this.yepNopeSrc]);
        dfd.then(function() {
            loader.yepnope = yepnope;
        });
        return dfd;
    };

    Loader.prototype.yepNopeDeferred = function() {
        return yepNopeDeferred.apply(null, arguments);
    };

    /**
     * VERY simple script loader to bootstrap yepnode.js,
     * which is then used as the actual script loader.
     * @param {string[]} scripts Array of script srcs.
     * @return A Deferred that is resolved when all the scripts are loaded.
     */
    Loader.prototype.importScripts = function(scripts) {
        function importScript(src) {
            var dfd = $.Deferred();
            var s = $("<script>").load(function(evt) {
                dfd.resolve(this);
                s.remove();
            }).attr("type", "text/javascript").attr("src", src);
            var parent = document.head || document.body;
            parent.appendChild(s[0]);
            return dfd;
        }
        var dfds = [];
        for (var i = 0; i < scripts.length; i++) {
            dfds.push(importScript(scripts[i]));
        }
        return $.when.apply(null, dfds);
    };

    return Loader;

});