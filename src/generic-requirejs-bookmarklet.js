(function() {

function addScript(src, attrs, callback) {
    var s = document.createElement('script');
    s.setAttribute("type", "text/javascript");
    s.setAttribute("src", src);
    if (attrs) {
        for (var name in attrs) {
            s.setAttribute(name, attrs[name]);
        }
    }
    s.addEventListener("load", function() {
        console.log("remove", s.parentElement.removeChild(s));
        callback && callback(s);
    }, false);
    document.body.appendChild(s);
}

var scripts = document.querySelectorAll("script[data-config]");
console.log(scripts);
var script = scripts[scripts.length - 1];
var thisSrc = script.src;
var configSrc = script.getAttribute("data-config");
var mainModule = script.getAttribute("data-mainModule");
var mainSrc = script.getAttribute("data-main");
var id = script.getAttribute("data-bookmarklet-id");
console.log(thisSrc, configSrc, mainModule, mainSrc, id);

if (configSrc && mainModule && !id) {
    addScript('http://requirejs.org/docs/release/2.1.8/comments/require.js', {
        "data-main": configSrc
    }, function() {
        setTimeout(function() {
            require([mainModule]);
        }, 2000);
    });
}

}());
