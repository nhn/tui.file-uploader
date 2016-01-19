/**
 * @fileoverview This is manager of input elements that act like file pool.
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';
var forEach = tui.util.forEach;

/**
 * The pool for save files.
 * It's only for input[file] element save at browser that does not support file api.
 * @class View.Pool
 */
var Pool = tui.util.defineClass(/** @lends View.Pool.prototype */{
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
     * @todo rename variable: "file_name"
     */
    store: function(file) {
        var filename = file.file_name,
            fileElements = this.files[filename] = this.files[filename] || [];
        fileElements.push(file);
        this.frag.appendChild(file);
    },

    /**
     * Remove a input element[type=file] from pool.
     * @param {string} name A file name that have to be removed.
     */
    remove: function(name) {
        var elements = this.files[name];

        if (!elements) {
            return;
        }

        this.frag.removeChild(elements.pop());
        if (!elements.length) {
            delete this.files[name];
        }
    },

    /**
     * Empty pool
     */
    empty: function() {
        this.frag = document.createDocumentFragment();
        this.files = {};
    },

    /**
     * Plant files on pool to form input
     */
    plant: function() {
        var planet = this.planet;
        forEach(this.files, function(elements, filename) {
            forEach(elements, function(element) {
                planet.appendChild(element);
            });
            delete this.files[filename];
        }, this);
    }
});

module.exports = Pool;
