define(["module", "jquery", "./console", "./adventures-page"], function(module, $, console, adventuresPage) {
    var log = console.createLog(module.id);
    var AdventuresPage = adventuresPage.AdventuresPage;

    function xpSort(a, b) {
        return AdventuresPage.xp(a) - AdventuresPage.xp(b);
    }

    function sort() {
        var ads = $("#adventures");
        var page = new AdventuresPage(ads);
        var lis = page.enhanceLis();
        // For each ".camp-ep" element (camp experience), set the xp on the containing <li>,
        // sort by xp, then re-add to the #adventures ul.
        lis.remove().get().sort(xpSort).forEach(function(it) {
            ads.append(it);
        });
    }

    return {
        sort: sort
    };
});