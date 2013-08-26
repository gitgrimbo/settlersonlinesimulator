/*jslint browser: true*/
/*global chrome, console*/ (function() {

    function addScript(src) {
        var s = document.createElement('script');
        s.src = src;
        s.onload = function() {
            this.parentNode.removeChild(this);
        };
        (document.head || document.documentElement).appendChild(s);
    }

    addScript(chrome.extension.getURL("all.js"));


    // MAIN

    console.log(chrome, chrome.runtime);

    chrome.runtime.onConnect.addListener(function(port) {
        console.log("onConnect", arguments);
        port.onMessage.addListener(function(message) {
            console.log("onMessage", arguments);
        });
    });

    function checkMessage(evt) {
        // We only accept messages from ourselves
        if (evt.source !== window) {
            return;
        }
        var EXPECTED_TYPE = "grimbo.xhr.request";
        var message = evt.data;
        if (!message.type || (message.type !== EXPECTED_TYPE)) {
            console.log('message.type !== "' + EXPECTED_TYPE + '"');
            return null;
        }
        if (!message.id) {
            throw new Error("message.id not provided");
        }
        return message;
    }

    var port = chrome.runtime.connect();
    window.addEventListener("message", function(evt) {
        var message = checkMessage(evt);
        if (!message) {
            return;
        }
        console.log("onMessage", arguments);
        xhr(message.url, function(xhr) {
            console.log("onMessage", "xhr callback", arguments);
            var response = {
                id: message.id,
                type: "grimbo.xhr.response",
                responseText: xhr.responseText
            };
            // Remember, (evt.source === evt.target === window) === true
            evt.source.postMessage(response, evt.origin);
        });
    }, false);

    // chrome.runtime.onMessageExternal is not available to content scripts

}());