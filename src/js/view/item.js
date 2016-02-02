/**
 * @fileoverview ItemView make element to display added file information. It has attached file ID to request for remove.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';
var consts = require('../consts'),
    utils = require('../utils');

var REMOVE_BUTTON_CLASS = consts.CONF.REMOVE_BUTTON_CLASS;

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
var Item = tui.util.defineClass(/** @lends Item.prototype **/ {
    init: function(options) {
        /**
         * Item: LI element
         * @type {jQuery}
         * @private
         */
        this.$el = null;

        /**
         * Item: remove button
         * @type {jQuery}
         */
        this.$removeBtn = null;

        /**
         * Item name
         * @type {string}
         */
        this.name = options.name;

        /**
         * Item id
         * @type {string}
         */
        this.id = options.id || options.name;

        /**
         * Item size
         * @type {number|string}
         */
        this.size = options.size || '';

        /**
         * Item type
         * @type {string}
         * @private
         */
        this.type = this._extractExtension();

        this.render(options.root.$el);
    },

    /**
     * Render making form padding with deletable item
     * @param {jQuery} $target - Target List element
     */
    render: function($target) {
        var html = this._getHtml(),
            removeButtonHTML = utils.template({
                text: 'Remove'
            }, consts.HTML.button),
            $removeBtn = $(removeButtonHTML);

        this.$removeBtn = $removeBtn
            .addClass(REMOVE_BUTTON_CLASS);

        this.$el = $(html)
            .append($removeBtn)
            .appendTo($target);

        this._addEvent();
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
     * Get listItem element HTML
     * @returns {string} HTML
     * @private
     */
    _getHtml: function() {
        var map = {
            filetype: this.type,
            filename: this.name,
            filesize: this.size ? utils.getFileSizeWithUnit(this.size) : ''
        };

        return utils.template(map, consts.HTML.listItem);
    },

    /**
     * Add event handler on delete button.
     * @private
     */
    _addEvent: function() {
        this.$removeBtn.on('click', $.proxy(this._onClickEvent, this));
    },

    /**
     * Event-handle for delete button clicked.
     * @private
     */
    _onClickEvent: function() {
        this.fire('remove', {
            name : this.name,
            id : this.id,
            type: 'remove'
        });
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
