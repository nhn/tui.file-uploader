/**
 * @fileoverview This is manager of input elements that act like file pool.
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */

/**
 * The pool for save files.
 * It's only for input[file] element save at browser that does not support file api.
 * @type {*}
 */
var Pool = ne.util.defineClass(/** @lends ne.component.Uploader.Pool.prototype */{
    /**
     * initialize
     */
    init: function(planet) {
        /**
         * Submitter for file element to server
         * @type {HTMLElement}
         */
        this.planet = planet;
        /**
         * File data structure object(key=name : value=iuput elmeent);
         * @type {object}
         */
        this.files = {};
        /**
         * Acts pool to save input element
         * @type {DocumentFragment}
         */
        this.frag = document.createDocumentFragment();
    },

    /**
     * Save a input element[type=file], as value of file name.
     * @param {object} file A input element that have to be saved
     */
    store: function(file) {
        this.files[file.file_name] = file;
        this.frag.appendChild(file);
    },

    /**
     * Remove a input element[type=file] from pool.
     * @param {string} name A file name that have to be removed.
     */
    remove: function(name) {
        this.frag.removeChild(this.files[name]);
        delete this.files[name];
    },

    /**
     * Empty pool
     */
    empty: function() {
        ne.util.forEach(this.files, function(data) {
            this.remove(data.file_name);
        }, this);
    },

    /**
     * Plant files on pool to form input
     */
    plant: function() {
        var planet = this.planet;
        ne.util.forEach(this.files, function(data) {
            planet.appendChild(data);
            delete this.files[data.file_name];
        }, this);
    }
});

module.exports = Pool;
