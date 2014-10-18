define([
    "jquery"
], function($) {

    function forEachOwnProperty(ob, fn, context) {
        for (var i in ob) {
            if (ob.hasOwnProperty(i)) {
                fn.call(context, ob, i);
            }
        }
    }

    var StringUtils = (function() {
        var NODE_TEXT = 3;
        /**
         * Outputs the hasOwnProperty name/values of "this".
         */
        function simpleToString() {
            var arr = [];
            forEachOwnProperty(this, function(ob, prop) {
                arr.push(prop + ": " + this[prop]);
            }, this);
            if (arr.length > 0) {
                return arr.join(", ");
            }
            return "";
        }

        function $trim(el) {
            var str = null;
            if ("string" === typeof el) {
                str = el;
            } else if (NODE_TEXT === el.nodeType) {
                str = el.nodeValue;
            } else {
                // assume a jQuery object or DOM element
                str = $(el).html();
            }
            str = str.replace(/<br>/gi, "\n");
            return $.trim(str);
        }
        return {
            simpleToString: simpleToString,
            $trim: $trim
        };
    }());

    return StringUtils;
});