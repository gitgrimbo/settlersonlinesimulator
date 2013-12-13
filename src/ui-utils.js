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

    // Creates a bar chart effect
    function createBar(css1, css2) {
        var outer = $("<div>").css(css1).addClass("bar-outer");
        var inner = $("<div>").css(css2).addClass("bar-inner");
        return outer.append(inner.append("&nbsp;"));
    }

    return {
        addStyles: addStyles,
        createBar: createBar
    };
});