/*jslint browser: true*/
/*global jQuery, console*/
define(function() {
    var $ = jQuery;

    function Page(html) {
        this.html = html;
    }

    Page.prototype.getRewardsImageSrc = function() {
        var el = $("<div>" + this.html + "</div>");
        // el will be a <div> followed by extracted <script> tags.
        el = el.first();
        // The page is quite dynamic, so we are restricted in what to look for,
        // unless we actually allow the scripts to execute (which we are trying not to).
        var anchors = el.find("a[href*=rewards]");
        return anchors.first().attr("href");
    };

    return Page;

});