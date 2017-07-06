System.register(['knockout'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var ko;
    var Utils;
    return {
        setters:[
            function (ko_1) {
                ko = ko_1;
            }],
        execute: function() {
            Utils = (function () {
                function Utils() {
                }
                Utils.fileSize = function (a) {
                    var e = Math.log(a) / Math.log(1024) | 0;
                    return (a / Math.pow(1024, e)).toFixed(2)
                        + ' ' + (e ? 'KMGTPEZY'[--e] + 'iB' : 'Bytes');
                };
                Utils.push_and_remove = function (array, data, plot_size) {
                    array = ko.unwrap(array);
                    array.push(data);
                    if (array.length > plot_size)
                        array.shift();
                };
                return Utils;
            }());
            exports_1("Utils", Utils);
            ;
        }
    }
});
//# sourceMappingURL=utils.js.map