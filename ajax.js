/*jslint browser: true*/
/*global jQuery, chrome, console*/
define(function() {
    var $ = jQuery;
    var chromeExtensionId = "mecfbfajgmehbcpooblfiklipncfjcop";

    var REQ_TYPE = "grimbo.xhr.request";
    var RESP_TYPE = "grimbo.xhr.response";

    var count = 0;

    function newMessage(url, opts) {
        var rnd = "" + Math.random();
        rnd = rnd.substring(rnd.indexOf(".") + 1);
        var id = REQ_TYPE + "." + (count++) + "." + rnd;
        return {
            type: REQ_TYPE,
            id: id,
            url: url,
            opts: opts
        };
    }

    var dfds = {};

    function onMessage(evt) {
        // We only accept messages from ourselves
        if (evt.source !== window) {
            return;
        }
        var message = evt.data;
        if (!message.type || (message.type !== RESP_TYPE)) {
            console.log('message.type !== "' + RESP_TYPE + '"');
            return;
        }
        if (!message.id) {
            throw new Error("message.id not provided");
        }
        var dfd = dfds[message.id];
        if (!dfd) {
            throw new Error("Recieved '" + RESP_TYPE + "' message with unexpected id");
        }
        dfd.resolve(message.responseText);
    }

    function crossDomainAjax(url, opts) {
        return $.Deferred(function(dfd) {
            var ALL_HOSTS = "*";
            var message = newMessage(url, opts);
            dfds[message.id] = dfd;
            window.postMessage(message, ALL_HOSTS);
        }).promise();
    }

    window.addEventListener("message", onMessage, false);

    return {
        ajax: $.ajax.bind($),
        crossDomainAjax: crossDomainAjax
    };
});