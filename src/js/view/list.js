/**
 * @fileoverview FileListView listing files and display states(like size, count).
 * @author NHN. FE Development Lab <dl_javascript@nhn.com>
 */

'use strict';

var $ = require('jquery');
var snippet = require('tui-code-snippet');

var utils = require('../utils');
var Item = require('./item');
var consts = require('../consts');

var classNames = consts.className;
var forEach = snippet.forEach;
var isUndefined = snippet.isUndefined;
var isArraySafe = snippet.isArraySafe;

/**
 * List view
 * @class List
 * @param {jQuery} $el - Container element to generate list view
 * @param {object} options - Options to set list view
 *     @param {object} options.listType - List type ('simple' or 'table')
 *     @param {string} [options.item] - To customize item contents when list type is 'simple'
 *     @param {array.<object>} [options.columnList] - To customize row contents when list type is 'table'
 * @ignore
 */
var List = snippet.defineClass(/** @lends List.prototype */{
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
            this._setTableWidth($listContainer);
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
        if (this.$checkbox) {
            this.$checkbox.on('change', $.proxy(this._onChange, this));
        }
    },

    /**
     * Change event handler
     * @private
     */
    _onChange: function() {
        var state = !!this.$checkbox.prop('checked');

        this._changeCheckboxInItem(state);
        this._changeCheckboxInHeader(state);

        this.fire('checkAll', {
            filelist: this.getCheckedItems()
        });
    },

    /**
     * Get container element of list
     * @param {boolean} isTableList - Whether list type is "table" or not
     * @returns {jQuery} List container
     * @private
     */
    _getListContainer: function(isTableList) {
        var template = isTableList ? consts.tableTemplate : consts.listTemplate;

        return $(utils.template({
            listItemsClassName: classNames.LIST_ITEMS_CONTAINER,
            checkbox: consts.html.CHECKBOX
        }, template.CONTAINER));
    },

    /**
     * Set width of table
     * @param {jQuery} $listContainer - List container element
     * @private
     */
    _setTableWidth: function($listContainer) {
        var columns = this.columnList;
        var totalWidth = parseInt($listContainer.width(), 10);
        var sumWidth = 0;
        var emptyCount = 0;

        forEach(columns, function(column) {
            if (column.width) {
                sumWidth += column.width;
            } else {
                emptyCount += 1;
            }
        });

        if (columns) {
            this._setEmptyWidth(totalWidth - sumWidth, emptyCount);
        }
    },

    /**
     * Set empty width value
     * @param {number} extraWidth - Extra width value
     * @param {number} emptyCount - Empty width count
     * @private
     */
    _setEmptyWidth: function(extraWidth, emptyCount) {
        var columns = this.columnList;
        var eachWidth = Math.floor(extraWidth / emptyCount);
        var lastWidth = eachWidth + (extraWidth % emptyCount);

        forEach(columns, function(column, index) {
            if (!column.width) {
                column.width = ((columns.length - 1) === index) ? lastWidth : eachWidth;
            }
        });
    },

    /**
     * Set column group in table
     * @private
     */
    _setColumnGroup: function() {
        var $colgroup = this.$el.find('colgroup');
        var columns = this.columnList;
        var html = '';

        forEach(columns, function(column) {
            html += '<col width="' + column.width + '">';
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
        var headerCount = 0;

        forEach(columns, function(column) {
            if (!isUndefined(column.header)) {
                html += '<th scope="col" width="' + column.width + '">' + column.header + '</th>';
                headerCount += 1;
            }
        });

        if (columns) {
            this._setHeaderElement(html, (headerCount === columns.length));
        }
    },

    /**
     * Set header element
     * @param {string} html - Template of header
     * @param {boolean} hasHeader - Whether has header or not
     * @private
     */
    _setHeaderElement: function(html, hasHeader) {
        var $thead = this.$el.find('thead');

        if (hasHeader) {
            html = utils.template({
                checkbox: consts.html.CHECKBOX
            }, html);
            $thead.html('<tr>' + html + '</tr>');
            $thead.find('th').first().css('border-right', 0);
            $thead.find('th').last().css('border-right', 0);
        } else {
            $thead.hide();
        }
    },

    /**
     * Set row's template of table
     * @private
     */
    _setTableRowTemplate: function() {
        var columns = this.columnList;
        var html = '';

        forEach(columns, function(column) {
            html += '<td width="' + column.width + '">' + column.body + '</td>';
        });

        if (html) {
            html = '<tr>' + html + '</tr>';
        } else {
            html = consts.tableTemplate.LIST_ITEM;
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
            html = consts.listTemplate.LIST_ITEM;
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
     * Set last column's width value
     */
    _setLastColumnWidth: function() {
        var lastTheadWidth = this.$el.find('th').last()[0].width;
        var scrollWidth = this.$list.width() - this.$list[0].scrollWidth;
        var lastColumWidth = lastTheadWidth - scrollWidth;

        forEach(this.items, function(item) {
            item.$el.find('td').last().attr('width', lastColumWidth);
        });
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
     * @param {object} data - Removed item's
     * @private
     */
    _removeFileItems: function(data) {
        var removedItem;

        this.items = snippet.filter(this.items, function(item) {
            removedItem = data[item.id];

            if (removedItem) {
                item.destroy();
            }

            return !removedItem;
        }, this);
    },

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
     * Remove event handler on each item
     * @param {Item} data - Remove item's data
     * @private
     */
    _onRemove: function(data) {
        this.fire('remove', data);
    },

    /**
     * Check event handler fired on each list item
     * @param {string} data - Current selected item's data
     * @private
     */
    _onCheck: function(data) {
        this._setCheckedAll();

        this.fire('check', data);
    },

    /**
     * Set checked all state
     * @private
     */
    _setCheckedAll: function() {
        var checkedItems = this.getCheckedItems();
        var isCheckedAll = (checkedItems.length === this.items.length) &&
                            !!(this.items.length);

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
        var $target = $label ? $label : $checkbox;
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
        forEach(this.items, function(item) {
            item.changeCheckboxState(state);
        });
    },

    /**
     * Get checked items
     * @returns {Array.<object>} Checked item data
     */
    getCheckedItems: function() {
        var checkedItems = [];

        snippet.forEach(this.items, function(item) {
            if (item.getCheckedState()) {
                checkedItems.push({
                    id: item.id,
                    name: item.name,
                    size: item.size
                });
            }
        });

        return checkedItems;
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

        if (this.listType === 'table') {
            this._setHasItemsClassName();
            this._setCheckedAll();
            this._setLastColumnWidth();
        }
    },

    /**
     * Clear list
     */
    clear: function() {
        forEach(this.items, function(item) {
            item.destroy();
        });
        this.items.length = 0;
        this._setHasItemsClassName();
        this._setCheckedAll();
    }
});

snippet.CustomEvents.mixin(List);

module.exports = List;
