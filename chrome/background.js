/*global chrome, console*/

// NOT USED

console.log("background.js");

chrome.runtime.getBackgroundPage(function() {
    console.log("getBackgroundPage", arguments);
});

chrome.runtime.onMessageExternal.addListener(function(message, sender, sendResponse) {
    console.log("onMessageExternal", arguments);
});
