'use strict';

var consts = require('../consts');
var utils = require('../utils');

var classNames = consts.CLASSNAME;
var htmls = consts.HTML;

/**
 * Class of item that is member of file list.
 * @class Item
 * @param {object} options
 *  @param {string} options.name File name
 *  @param {string} options.type File type
 *  @param {object} options.root List instance
 *  @param {string} [options.id] Unique key, what if the key is not exist id will be the file name.
 *  @param {string} [options.deleteButtonClassName='uploader_btn_delete'] The class name is for delete button.
 *  @param {string} [options.template] item template
 *  @param {(string|number)} [options.size] File size (but ie low browser, x-domain)
 */
var Item = tui.util.defineClass(/** @lends Item.prototype **/{
    init: function(data, $root, template) {
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
        this.id = data.id || data.name;

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
        this.$checkbox.on('change', $.proxy(this.onChange, this));
        this.$removeButton.on('click', $.proxy(this._onClickEvent, this));
    },

    /**
     * Event-handle for delete button clicked.
     * @private
     */
    _onClickEvent: function() {
        this.fire('remove', {
            name: this.name,
            id: this.id
        });
    },

    /**
     * Change checkbox view state
     * @param {boolean} state - Checked state
     * @private
     */
    _changeCheckbox: function(state) {
        var $checkbox = this.$checkbox;
        var $label = utils.getLabelElement($checkbox);
        var $target = ($label) ? $label : $checkbox;
        var className = classNames.IS_CHECKED;

        if (state) {
            $target.addClass(className);
        } else {
            $target.removeClass(className);
        }
    },

    /**
     * Change event handler
     */
    onChange: function() {
        var state = !!this.$checkbox.attr('checked');
        this._changeCheckbox(state);
        this.fire('check', {
            id: this.id,
            name: this.name,
            size: this.size
        }, state);
    },

    /**
     * Destroy item
     */
    destroy: function() {
        this.$el.remove();
    }
});

tui.util.CustomEvents.mixin(Item);
module.exports = Item;
