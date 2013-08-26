define(function() {
    var wikiMappings = {
        "Island of the Pirates": "The Island of the Pirates",
        "Stealing from the rich": "Stealing from the Rich",
        "The Dark Priests": "Dark Priests",
        "Sons of the veldt": "Sons of the Veld",
        "Victor the vicious": "Victor the Vicious",
        "Mother Love": "Motherly Love",
        "The end of the earth": "The End of the World"
    };

    function getLink(title) {
        // See if we need to map the page name, before replacing spaces with underscores.
        var pageName = (wikiMappings[title] || title).replace(/\s/gi, "_");
        return "http://thesettlersonline.wikia.com/wiki/" + pageName;
    }

    function getRewardsImg(title) {
        throw new Error("Need to parse the wiki page to get the rewards image link");
    }

    return {
        getLink: getLink,
        getRewardsImg: getRewardsImg
    };
});