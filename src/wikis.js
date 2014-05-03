define(["module", "./thesettlersonline-wikia-com", "settlersonlinewiki-eu"], function(module) {
    // return all arguments exception first (module)
    var wikis = Array.prototype.slice.call(arguments, 1);
    return wikis;
});
