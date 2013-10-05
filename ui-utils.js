define(["jquery"], function($) {
    var NO_OPTS = {};

    function addStyles(cssStr, opts) {
        opts = opts || NO_OPTS;

        if (cssStr.join) {
            cssStr = cssStr.join("\n");
        }

        var appendTo = opts.appendTo || document.body;
        $("<style>").text(cssStr).appendTo(appendTo);
    }

    return {
        addStyles: addStyles
    };
});