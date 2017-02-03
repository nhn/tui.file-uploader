'use strict';
var utils = require('../utils');
var Item = require('./item');
var consts = require('../consts');

var classNames = consts.CLASSNAME;
var snippet = tui.util;
var forEach = snippet.forEach;
var isUndefined = snippet.isUndefined;
var isArraySafe = snippet.isArraySafe;

/**
 * List view
 * @class List
 * @param {jQuery} $el - Container element to generate list view
 * @param {object} options - Options to set list view
 *     @param {object} options.listType - List type ('simple' or 'table')
 *     @param {object} [options.item] - To customize item contents when list type is 'simple'
 *     @param {object} [options.columnList] - To customize row contents when list type is 'table'
 * @ignore
 */
var List = tui.util.defineClass(/** @lends List.prototype */{
    init: function($el, options) {
        /**
         * jQuery-element of list container
         * @type {jQuery}
         */
        this.$el = $el;

        /**
         * jQuery-element of list
         * @type {jQuery}
         */
        this.$list = null;

        /**
         * jQuery-element of checkbox in header
         * @type {jQuery}
         */
        this.$checkbox = null;

        /**
         * List type
         * @type {string}
         */
        this.listType = options.type;

        /**
         * Item template preset of simple list
         * @type {string}
         */
        this.item = options.item;

        /**
         * Item template preset of table
         * @type {Array.<Object>}
         */
        this.columnList = options.columnList;

        /**
         * Item's template in list
         * @type {string}
         */
        this.itemTemplate = null;

        /**
         * Items
         * @type {Array.<Item>}
         */
        this.items = [];

        /**
         * List of checked item's index
         * @type {Array.<number>}
         */
        this.checkedIndexList = [];

        this._render();
        this._addEvent();
    },

    /**
     * Render list view
     * @private
     */
    _render: function() {
        var isTableList = (this.listType === 'table');
        var $listContainer = this._getListContainer(isTableList);

        this.$el.append($listContainer);

        if (isTableList) {
            this._setColumnGroup();
            this._setTableHeader();
            this._setTableRowTemplate();
        } else {
            this._setListItemTemplate();
        }

        this.$list = this.$el.find('.' + classNames.LIST_ITEMS_CONTAINER);
        this.$checkbox = this.$el.find(':checkbox');
    },

    /**
     * Add event on checkbox
     * @private
     */
    _addEvent: function() {
        if (!this.$checkbox) {
            return;
        }
        this.$checkbox.on('change', $.proxy(this._onChange, this));
    },

    /**
     * Change event handler
     * @private
     */
    _onChange: function() {
        var state = !!this.$checkbox.attr('checked');

        this._changeCheckboxInItem(state);
        this._changeCheckboxInHeader(state);
    },

    /**
     * Get container element of list
     * @param {boolean} isTableList - Whether list type is "table" or not
     * @returns {jQuery} List container
     * @private
     */
    _getListContainer: function(isTableList) {
        var template = isTableList ? consts.TABLE_TEMPLATE : consts.LIST_TEMPLATE;

        return $(utils.template({
            listItemsClassName: classNames.LIST_ITEMS_CONTAINER
        }, template.CONTAINER));
    },

    /**
     * Set column group in table
     * @private
     */
    _setColumnGroup: function() {
        var $colgroup = this.$el.find('colgroup');
        var columns = this.columnList;
        var html = '';
        var width;

        forEach(columns, function(column) {
            width = column.width;

            if (width) {
                html += '<col width="' + column.width + '">';
            } else {
                html += '<col>';
            }
        });

        if (columns) {
            $colgroup.html(html);
        }
    },

    /**
     * Set table header
     * @private
     */
    _setTableHeader: function() {
        var columns = this.columnList;
        var html = '';
        var header;

        forEach(columns, function(column) {
            header = column.header;

            if (!isUndefined(header)) {
                html += '<th scope="col">' + header + '</th>';
            }
        });

        this._setHeaderElement(html);
    },

    /**
     * Set header element
     * @param {string} html - Template of header
     * @private
     */
    _setHeaderElement: function(html) {
        var $thead = this.$el.find('thead');
        var theadClassName = classNames.THEAD_STYLE;

        if (html) {
            html = utils.template({
                checkbox: consts.HTML.CHECKBOX
            }, html);
            $thead.html('<tr>' + html + '</tr>');
        }
        $thead.find('th').first().addClass(theadClassName);
        $thead.find('th').last().addClass(theadClassName);
    },

    /**
     * Set row's template of table
     * @private
     */
    _setTableRowTemplate: function() {
        var columns = this.columnList;
        var html = '';

        forEach(columns, function(column) {
            html += '<td>' + column.body + '</td>';
        });

        if (html) {
            html = '<tr>' + html + '</tr>';
        } else {
            html = consts.TABLE_TEMPLATE.LIST_ITEM;
        }

        this.itemTemplate = html;
    },

    /**
     * Set item's template of list
     * @private
     */
    _setListItemTemplate: function() {
        var item = this.item;
        var html;

        if (item) {
            html = '<li>' + item + '</li>';
        } else {
            html = consts.LIST_TEMPLATE.LIST_ITEM;
        }

        this.itemTemplate = html;
    },

    /**
     * Set class name to list
     * @private
     */
    _setHasItemsClassName: function() {
        var className = classNames.HAS_ITEMS;
        var hasItems = !!this.items.length;

        if (hasItems) {
            this.$el.addClass(className);
        } else {
            this.$el.removeClass(className);
        }
    },

    /**
     * Add file items
     * @param {object} files - Added file list
     * @private
     */
    _addFileItems: function(files) {
        if (!isArraySafe(files)) { // for target from iframe, use "isArraySafe"
            files = [files];
        }
        forEach(files, function(file) {
            this.items.push(this._createItem(file));
        }, this);
    },

    /**
     * Remove file items
     * @param {Array.<object>} files - Removed file list
     * @private
     */
    _removeFileItems: function(files) {
        var index;

        this.checkedIndexList.length = 0;

        forEach(files, function(file) {
            index = this._findIndexOfItem(file.id);
            if (file.state) {
                this.items[index].destroy();
                this.items.splice(index, 1);
            } else {
                this.checkedIndexList.push(index);
            }
        }, this);
    },

    /**
     * Find index of checked item
     * @param {string} id - Item's id to find
     * @returns {number} item's index
     * @private
     */
    /*eslint-disable consistent-return*/
    _findIndexOfItem: function(id) {
        var itemIndex;

        forEach(this.items, function(item, index) {
            if (item.id === id) {
                itemIndex = index;

                return false;
            }
        });

        return itemIndex;
    },
    /*eslint-enable consistent-return*/

    /**
     * Create item By Data
     * @param {object} data - Data for list items
     * @returns {Item} Item
     * @private
     */
    _createItem: function(data) {
        var item = new Item(this.$list, data, this.itemTemplate);
        item.on('remove', this._onRemove, this);
        item.on('check', this._onCheck, this);

        return item;
    },

    /**
     * Remove event handler
     * @param {Item} item - Item
     * @private
     */
    _onRemove: function(item) {
        this.fire('remove', {
            filelist: [item]
        });
    },

    /**
     * Check event handler
     * @param {string} data - Current selected item's data
     * @param {boolean} isChecked - Checked state
     * @private
     */
    _onCheck: function(data, isChecked) {
        this._setCheckedItemsIndex(data.id, isChecked);
        this._setCheckedAll();

        this.fire('check', {
            id: data.id,
            name: data.name,
            size: data.size,
            isChecked: isChecked
        });
    },

    /**
     * Set list of checked item's index
     * @param {string} id - File id
     * @param {boolean} isChecked - Checked state
     * @private
     */
    _setCheckedItemsIndex: function(id, isChecked) {
        var checkedIndexList = this.checkedIndexList;
        var checkedIndex = this._findIndexOfItem(id);

        if (isChecked) {
            checkedIndexList.push(checkedIndex);
        } else {
            utils.removeItemFromArray(checkedIndex, checkedIndexList);
        }
    },

    /**
     * Set checked all state
     * @private
     */
    _setCheckedAll: function() {
        var isCheckedAll = (this.checkedIndexList.length === this.items.length) &&
                            !!this.checkedIndexList.length;

        this.$checkbox.prop('checked', isCheckedAll);
        this._changeCheckboxInHeader(isCheckedAll);
    },

    /**
     * Change checkbox in table header
     * @param {boolean} state - Checked state
     * @private
     */
    _changeCheckboxInHeader: function(state) {
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
     * Change checkbox in list item
     * @param {boolean} state - Checked state
     * @private
     */
    _changeCheckboxInItem: function(state) {
        this.checkedIndexList = [];

        forEach(this.items, function(item) {
            item.$checkbox.prop('checked', state);
            item.onChange();
        });
    },

    /**
     * Update item list
     * @param {object} data - File information(s) with type
     * @param {*} type - Update type
     */
    update: function(data, type) {
        if (type === 'remove') {
            this._removeFileItems(data);
        } else {
            this._addFileItems(data);
        }
        this._setHasItemsClassName();
        this._setCheckedAll();
    },

    /**
     * Clear list
     */
    clear: function() {
        forEach(this.items, function(item) {
            item.destroy();
        });
        this.items.length = 0;
        this.checkedIndexList.length = 0;
        this._setHasItemsClassName();
        this._setCheckedAll();
    }
});

tui.util.CustomEvents.mixin(List);

module.exports = List;
