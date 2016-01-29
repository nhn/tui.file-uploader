/**
 * @fileoverview This file contain utility methods for uploader.
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */

'use strict';
/**
 * @namespace utils
 */
var IS_SUPPORT_FILE_SYSTEM = !!(window.File && window.FileReader && window.FileList && window.Blob),
    IS_SUPPORT_FORM_DATA = !!(window.FormData || null);


function parseURL(url) {
    var a = document.createElement('a');
    a.href = url;
    return {
        href:     a.href,
        host:     a.host || location.host,
        port:     ('0' === a.port || '' === a.port) ? port(a.protocol) : a.port,
        hash:     a.hash,
        hostname: a.hostname || location.hostname,
        pathname: a.pathname.charAt(0) != '/' ? '/' + a.pathname : a.pathname,
        protocol: !a.protocol || ':' == a.protocol ? location.protocol : a.protocol,
        search:   a.search,
        query:    a.search.slice(1)
    };
}


/**
 * Extract unit for file size
 * @param {number} bytes A usage of file
 * @memberof utils
 */
function getFileSizeWithUnit(bytes) {
    var units = ['B', 'KB', 'MB', 'GB', 'TB'],
        bytes = parseInt(bytes, 10),
        exp = Math.log(bytes) / Math.log(1024) | 0,
        result = (bytes / Math.pow(1024, exp)).toFixed(2);

    return result + units[exp];
}

/**
 * Whether the browser support FormData or not
 * @memberof utils
 */
function isSupportFormData() {
    return IS_SUPPORT_FORM_DATA;
}

/**
 * Get item elements HTML
 * @param {string} html HTML template
 * @returns {string}
 * @memberof utils
 */
function template(map, html) {
    html = html.replace(/\{\{([^\}]+)\}\}/g, function (mstr, name) {
        return map[name];
    });
    return html;
}

/**
 * Check whether support file api or not
 * @returns {boolean}
 * @memberof utils
 */
function isSupportFileSystem() {
    return IS_SUPPORT_FILE_SYSTEM;
}

function isCrossDomain(url) {
    var location = parseURL(window.location.href);
    url = parseURL(url);
    return url.hostname !== location.hostname
        || url.port !== location.port
        || url.protocol !== location.protocol;
}

module.exports = {
    getFileSizeWithUnit: getFileSizeWithUnit,
    isSupportFileSystem: isSupportFileSystem,
    isSupportFormData: isSupportFormData,
    template: template,
    isCrossDomain: isCrossDomain
};
