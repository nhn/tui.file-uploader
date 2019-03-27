/**
 * @fileoverview This file contain utility methods for uploader.
 * @author NHN. FE Development Lab <dl_javascript@nhn.com>
 */

'use strict';

/**
 * @namespace utils
 * @ignore
 */
var IS_SUPPORT_FILE_SYSTEM = !!(window.File && window.FileReader && window.FileList && window.Blob);
var IS_SUPPORT_FORM_DATA = !!(window.FormData || null);

/**
 * Parse url
 * @param {string} url - url for parsing
 * @returns {Object} URL information
 * @memberof utils
 */
function parseURL(url) {
    var a = document.createElement('a');
    a.href = url;

    return {
        href: a.href,
        host: a.host,
        port: a.port,
        hash: a.hash,
        hostname: a.hostname,
        pathname: a.pathname,
        protocol: a.protocol,
        search: a.search,
        query: a.search.slice(1)
    };
}

/**
 * Extract unit for file size
 * @param {number} bytes A usage of file
 * @returns {string} Size-string
 * @memberof utils
 */
function getFileSizeWithUnit(bytes) {
    var units = ['B', 'KB', 'MB', 'GB', 'TB'];
    var exp, result;

    bytes = parseInt(bytes, 10);
    exp = Math.log(bytes) / Math.log(1024) | 0;
    result = (bytes / Math.pow(1024, exp)).toFixed(2);

    return result + ' ' + units[exp];
}

/**
 * Whether the browser supports FormData or not
 * @memberof utils
 * @returns {boolean} whether the browser supports FormData
 */
function isSupportFormData() {
    return IS_SUPPORT_FORM_DATA;
}

/**
 * Get item elements HTML
 * @param {Object} map - Properties for template
 * @param {string} html HTML template
 * @returns {string} HTML
 * @memberof utils
 */
function template(map, html) {
    html = html.replace(/{{([^}]+)}}/g, function(mstr, name) {
        return map[name];
    });

    return html;
}

/**
 * Check whether the browser supports file api.
 * @returns {boolean} whether the browser supports FileAPI
 * @memberof utils
 */
function isSupportFileSystem() {
    return IS_SUPPORT_FILE_SYSTEM;
}

/**
 * Check whether the url is x-domain
 * @param {string} url - URL
 * @returns {boolean} Whether the url is x-domain
 * @memberof utils
 */
function isCrossDomain(url) {
    var here = parseURL(window.location.href);
    var target = parseURL(url);

    return target.hostname !== here.hostname
        || target.port !== here.port
        || target.protocol !== here.protocol;
}

/**
 * Remove first specified item from array, if it exists
 * @param {*} item Item to look for
 * @param {Array} arr Array to query
 * @memberof utils
 */
function removeItemFromArray(item, arr) {
    var index = arr.length - 1;

    while (index > -1) {
        if (item === arr[index]) {
            arr.splice(index, 1);
        }
        index -= 1;
    }
}

/**
 * Get label element
 * @param {jQuery} $target - Target element
 * @returns {jQuery|null} Label element
 * @memberof utils
 */
function getLabelElement($target) {
    var $labels = $target.parents('label');
    var hasLabel = $labels.length;

    if (hasLabel) {
        return $labels.eq(0);
    }

    return null;
}

module.exports = {
    getFileSizeWithUnit: getFileSizeWithUnit,
    isSupportFileSystem: isSupportFileSystem,
    isSupportFormData: isSupportFormData,
    template: template,
    isCrossDomain: isCrossDomain,
    removeItemFromArray: removeItemFromArray,
    getLabelElement: getLabelElement
};
