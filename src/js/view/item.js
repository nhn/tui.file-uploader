/**
 * @fileoverview ItemView make element to display added file information. It has attached file ID to request for remove.
 * @author NHN. FE Development Lab <dl_javascript@nhn.com>
 */

'use strict';

var $ = require('jquery');
var snippet = require('tui-code-snippet');

var consts = require('../consts');
var utils = require('../utils');

var classNames = consts.className;
var htmls = consts.html;

/**
 * List item view
 * @class Item
 * @param {jQuery} $root - List element to append item view
 * @param {object} data - Item's data (file info)
 *     @param {string} data.name - File name
 *     @param {string} data.type - File type
 *     @param {string} [data.id] - Unique key, what if the key is not exist id will be the file name
 *     @param {(string|number)} [options.size] File size (but ie low browser, x-domain)
 *  @param {string} options.template - Item template
 *  @ignore
 */
var Item = snippet.defineClass(/** @lends Item.prototype **/{
    init: function($root, data, template) {
        /**
         * Item: LI element
         * @type {jQuery}
         * @private
         */
        this.$el = null;

        /**
         * Item: checkbox
         * @type {jQuery}
         * @private
         */
        this.$checkbox = null;

        /**
         * Item: remove button
         * @type {jQuery}
         * @private
         */
        this.$removeButton = null;

        /**
         * Item name
         * @type {string}
         * @private
         */
        this.name = data.name;

        /**
         * Item id
         * @type {string}
         * @private
         */
        this.id = data.id;

        /**
         * Item size
         * @type {number|string}
         * @private
         */
        this.size = data.size || '';

        /**
         * Item type
         * @type {string}
         * @private
         */
        this.type = this._extractExtension();

        /**
         * Template to create list item
         * @type {object}
         * @private
         */
        this.template = template;

        this._render($root);
    },

    /**
     * Render item
     * @param {jQuery} $root - List area view
     * @private
     */
    _render: function($root) {
        var html = this._getHTML();

        this.$el = $(html).appendTo($root);
        this.$checkbox = this.$el.find(':checkbox');
        this.$removeButton = this.$el.find('button');

        this._addEvent();
    },

    /**
     * Get html string of item
     * @returns {string} Html string
     * @private
     */
    _getHTML: function() {
        var template = this.template;
        var map = {
            filetype: this.type,
            filename: this.name,
            filesize: this.size ? utils.getFileSizeWithUnit(this.size) : '',
            checkbox: htmls.CHECKBOX,
            removeButton: htmls.REMOVE_BUTTON
        };

        return utils.template(map, template);
    },

    /**
     * Extract file extension by name
     * @returns {string} File extension
     * @private
     */
    _extractExtension: function() {
        return this.name.split('.').pop();
    },

    /**
     * Add event handler on delete button.
     * @private
     */
    _addEvent: function() {
        this.$checkbox.on('change', $.proxy(this._onChange, this));
        this.$removeButton.on('click', $.proxy(this._onClickEvent, this));
    },

    /**
     * Change event handler
     * @private
     */
    _onChange: function() {
        var state = !!this.$checkbox.prop('checked');
        this._changeCheckbox(state);
        this.fire('check', {
            id: this.id,
            name: this.name,
            size: this.size,
            state: state
        });
    },

    /**
     * Event-handle for delete button clicked.
     * @private
     */
    _onClickEvent: function() {
        var data = {};
        data[this.id] = true;
        this.fire('remove', data);
    },

    /**
     * Change checkbox view state
     * @param {boolean} state - Checked state
     * @private
     */
    _changeCheckbox: function(state) {
        var $checkbox = this.$checkbox;
        var $label = utils.getLabelElement($checkbox);
        var $target = $label ? $label : $checkbox;
        var className = classNames.IS_CHECKED;

        if (state) {
            $target.addClass(className);
        } else {
            $target.removeClass(className);
        }
    },

    /**
     * Change checkbox state
     * @param {boolean} state - Checked state
     */
    changeCheckboxState: function(state) {
        this.$checkbox.prop('checked', state);
        this._changeCheckbox(state);
    },

    /**
     * Get state of checkbox
     * @returns {boolean} Checkbox state
     */
    getCheckedState: function() {
        return this.$checkbox.prop('checked');
    },

    /**
     * Destroy item
     */
    destroy: function() {
        this.$el.remove();
    }
});

snippet.CustomEvents.mixin(Item);
module.exports = Item;
