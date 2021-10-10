var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "knockout"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Utils = void 0;
    var ko = __importStar(require("knockout"));
    var Utils = /** @class */ (function () {
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
    exports.Utils = Utils;
    ;
});
