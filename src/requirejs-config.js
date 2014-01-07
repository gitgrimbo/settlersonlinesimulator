// Actual requirejs config
// baseUrl is NOT used here, as this file is used as data-main in the bookmarklets,
// and so all module paths are relative to THIS script.
require.config({
    paths: {
        "domReady": "../lib/domReady",
        "text": "../lib/text"
    }
});
