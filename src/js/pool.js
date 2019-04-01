/**
 * @fileoverview This is manager of input elements that act like file pool.
 * @author NHN. FE Development Lab <dl_javascript@nhn.com>
 */

'use strict';

var snippet = require('tui-code-snippet');

var consts = require('./consts');

var forEach = snippet.forEach;
var hasStamp = snippet.hasStamp;
var stamp = snippet.stamp;

var HIDDEN_FILE_INPUT_CLASS = consts.className.HIDDEN_FILE_INPUT;

/**
 * The pool for save files.
 * It's only for input[file] element save at browser that does not support file api.
 * @param {HTMLElement} planet - Form element
 * @class Pool
 * @ignore
 */
var Pool = snippet.defineClass(/** @lends Pool.prototype */{
    init: function(planet) {
        /**
         * Submitter for file element to server
         * Form element
         * @type {HTMLElement}
         */
        this.planet = planet;

        /**
         * File data structure object
         *  key=name : value=iuput[type=file](Element)
         * @type {object}
         */
        this.files = {};
    },

    /**
     * Save a input element[type=file], as value of file name.
     * @param {HTMLInputElement} inputFileEl A input element that have to be saved
     */
    store: function(inputFileEl) {
        var id = hasStamp(inputFileEl) && stamp(inputFileEl);

        if (!id) {
            return;
        }

        this.files[id] = inputFileEl;
    },

    /**
     * Remove a input element[type=file] from pool.
     * @param {string} id - File's id
     * @returns {boolean} result
     */
    remove: function(id) {
        var element = this.files[id];

        if (!element) {
            return false;
        }

        delete this.files[id];

        return true;
    },

    /**
     * Empty pool
     */
    empty: function() {
        this.files = {};
    },

    /**
     * Plant files on pool to form input
     */
    plant: function() {
        var planet = this.planet;
        forEach(this.files, function(element, key) {
            element.className = HIDDEN_FILE_INPUT_CLASS;
            element.style.display = 'none';
            planet.appendChild(element);
            delete this.files[key];
        }, this);
    }
});

module.exports = Pool;
