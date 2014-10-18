define([
    "module"
], function(module) {

    function getName() {
        return "www.settlersonlinewiki.eu";
    }

    function getIcon() {
        return "http://www.settlersonlinewiki.eu/images/favicon.ico";
    }

    function getHrefForAdventure(title) {
        // See if we need to map the page name, before replacing spaces with underscores.
        var pageName = title.toLowerCase();
        pageName = pageName.replace(/\s/gi, "-");
        return "http://www.settlersonlinewiki.eu/adventures/" + pageName;
    }

    return {
        getName: getName,
        getIcon: getIcon,
        getHrefForAdventure: getHrefForAdventure
    };

});
