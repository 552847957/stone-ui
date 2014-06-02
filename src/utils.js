/**
 * STONE (Javascript Extension Tools) 
 *
 * @version    1.0
 * @author   langhsu(<a href="mailto:langhsu@gmail.com">langhsu@gmail.com</a>)
 * 
 */

/**
 * @description
 * Package: Base
 *
 * Dependencies:
 * jQuery.
 * 
 */
var stone = (typeof this.stone === 'undefined') ? {} : this.stone;

(function ($) {
    
    // Define
    var isUndefined,
    isNull,
    isNumber,
    isString,
    isBoolean,
    isObject,
    isArray,
    isArguments,
    isFunction,
    
    // Include
    math = Math;
    
    /**
     * 判断变量的值是否是 undefined
     * 
     * @param {Mixed} o 传入被检测变量的名称
     * @return {Boolean} 当 o 的值是 undefined 时返回 true
     */
    isUndefined = function(o) {
        return typeof(o) === 'undefined';
    };
        
    /**
     * 判断变量的值是否是 null
     * 
     * @param {Mixed} o 传入被检测变量的名称
     * @return {Boolean} 当 o 的值是 null 时返回 true
     */
    isNull = function(o) {
        return o === null;
    };
    
    /**
     * 判断变量的类型是否是 Number
     *
     * @param {Mixed} o 传入被检测变量的名称
     * @return {Boolean} 当 o 的类型是 number 时返回 true
     */
    isNumber = function(o) {
        return (o === 0 || o) && o.constructor === Number;
    };
    
    /**
     * 判断变量的类型是否是 Boolean
     *
     * @param {Mixed} o 传入被检测变量的名称
     * @return {Boolean} 当 o 的类型是 boolean 时返回 true
     */
    isBoolean = function(o) {
        return (o === false || o) && (o.constructor === Boolean);
    };
    
    /**
     * 判断变量的类型是否是 String
     *
     * @param {Mixed} o 传入被检测变量的名称
     * @return {Boolean} 当 o 的类型是 string 时返回 true
     */
    isString = function(o) {
        return (o === "" || o) && (o.constructor === String);
    };
    
    /**
     * 判断变量的类型是否是 Object
     * 
     * @param {Mixed} o 传入被检测变量的名称
     * @return {Boolean} 当 o 的类型是 object 时返回 true
     */
    isObject = function(o) {
        return o && (o.constructor === Object || Object.prototype.toString.call(o) === "[object Object]");
    };
    
    /**
     * 判断变量的类型是否是 Array
     * 
     * @param {Mixed} o 传入被检测变量的名称
     * @return {Boolean} 当 o 的类型是 array 时返回 true
     */
    isArray = function(o) {
        return o && (o.constructor === Array || Object.prototype.toString.call(o) === "[object Array]");
    };
    
    /**
     * 判断变量的类型是否是 Arguments
     * 
     * @param {Mixed} o 传入被检测变量的名称
     * @return {Boolean} 当 o 的类型是 arguments 时返回 true
     */
    isArguments = function(o) {
        return o && o.callee && isNumber(o.length) ? true : false;
    };
    
    /**
     * 判断变量的类型是否是 Function
     * 
     * @param {Mixed} o 传入被检测变量的名称
     * @return {Boolean} 当 o 的类型是 function 时返回 true
     */
    isFunction = function(o) {
        return o && (o.constructor === Function);
    };
    
    /**
     * 全局唯一标识符 (GUID)
     */
    var guid = function () {
        var id = "", i, random;
        
        // 生成又连字符分隔的 32 位数字
        for (i = 0; i < 32; i++) {
            random = math.random() * 16 | 0;

            if (i == 8 || i == 12 || i == 16 || i == 20) {
                id += "-";
            }
            id += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
        }

        return id;
    };
    
    /**
     * 浏览器支持
     */
    var support = {};
    support.prototype = {
        hasHW3D : ("WebKitCSSMatrix" in window && "m11" in new window.WebKitCSSMatrix()) || "MozPerspective" in document.documentElement.style || "msPerspective" in document.documentElement.stylem,
        detectBrowser : function(ua) {
            var browser = false, match = [],
                browserRxs = {
                    webkit: /(chrome)[ \/]([\w.]+)/i,
                    safari: /(webkit)[ \/]([\w.]+)/i,
                    opera: /(opera)(?:.*version|)[ \/]([\w.]+)/i,
                    msie: /(msie\s|trident.*? rv:)([\w.]+)/i,
                    mozilla: /(mozilla)(?:.*? rv:([\w.]+)|)/i
                };

            for (var agent in browserRxs) {
                if (browserRxs.hasOwnProperty(agent)) {
                    match = ua.match(browserRxs[agent]);
                    if (match) {
                        browser = {};
                        browser[agent] = true;
                        browser[match[1].toLowerCase()] = true;
                        browser.version = parseInt(document.documentMode || match[2], 10);

                        break;
                    }
                }
            }

            return browser;
        },
        browser: function() {
            return this.detectBrowser(navigator.userAgent);
        },
        msPointers : navigator.msPointerEnabled,
        pointers : navigator.pointerEnabled
    };
    
    stone.isUndefined = isUndefined;
    stone.isNull = isNull;
    stone.isNumber = isNumber;
    stone.isString = isString;
    stone.isBoolean = isBoolean;
    stone.isObject = isObject;
    stone.isArray = isArray;
    stone.isArguments = isArguments;
    stone.isFunction = isFunction;
    stone.guid = guid;
    
})(jQuery);