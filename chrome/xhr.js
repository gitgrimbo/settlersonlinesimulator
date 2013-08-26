/*global chrome, console*/

// Note that any URL fetched here must be matched by a permission in
// the manifest.json file!

function xhr(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(data) {
        if (xhr.readyState == 4) {
            console.log("xhr", "calling callback", arguments);
            callback(xhr);
        }
    };
    xhr.open('GET', url, true);
    xhr.send();
}
