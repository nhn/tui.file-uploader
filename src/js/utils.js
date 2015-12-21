/**
 * @fileoverview This file contain utility methods for uploader.
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */


/**
 * @namespace utils
 */

/**
 * Extract unit for file size
 * @param {number} bytes A usage of file
 * @memberof utils
 */
var getFileSizeWithUnit = function(bytes) {
    var units = ['B', 'KB', 'MB', 'GB', 'TB'],
        bytes = parseInt(bytes, 10),
        exp = Math.log(bytes) / Math.log(1024) | 0,
        result = (bytes / Math.pow(1024, exp)).toFixed(2);

    return result + units[exp];
};

/**
 * Whether the browser support FormData or not
 * @memberof utils
 */
var isSupportFormData = function() {
    var FormData = (window.FormData || null);
    return !!FormData;
};

/**
 * Get item elemen HTML
 * @param {string} html HTML template
 * @returns {string}
 * @memberof utils
 */
var template = function(map, html) {
    html = html.replace(/\{\{([^\}]+)\}\}/g, function(mstr, name) {
        return map[name];
    });
    return html;
};

/**
 * Check whether support file api or not
 * @returns {boolean}
 * @memberof utils
 */
var isSupportFileSystem = function() {
    return !!(window.File && window.FileReader && window.FileList && window.Blob);
};

module.exports = {
    getFileSizeWithUnit: getFileSizeWithUnit,
    isSupportFileSystem: isSupportFileSystem,
    isSupportFormData: isSupportFormData,
    template: template
};
