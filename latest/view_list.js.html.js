tui.util.defineNamespace("fedoc.content", {});
fedoc.content["view_list.js.html"] = "      <div id=\"main\" class=\"main\">\n\n\n\n    \n    <section>\n        <article>\n            <pre class=\"prettyprint source linenums\"><code>/**\n * @fileoverview FileListView manage and display files state(like size, count) and list.\n * @dependency ne-code-snippet 1.0.3, jquery1.8.3\n * @author NHN Ent. FE Development Team &lt;dl_javascript@nhnent.com>\n */\n'use strict';\nvar utils = require('../utils');\nvar Item = require('./item');\n\n/**\n * List has items. It can add and remove item, and get total usage.\n * @class View.List\n */\nvar List = tui.util.defineClass(/** @lends View.List.prototype */{\n    init : function(options, uploader) {\n        var listInfo = options.listInfo;\n        this.items = [];\n        this.$el = listInfo.list;\n        this.$counter = listInfo.count;\n        this.$size = listInfo.size;\n        this._uploader = uploader;\n\n        tui.util.extend(this, options);\n    },\n\n    /**\n     * Update item list\n     * @param {object} info A information to update list.\n     *  @param {array} info.items The list of file information.\n     *  @param {string} [info.action] The action to do.\n     */\n    update: function(info) {\n        if (info.action === 'remove') {\n            this._removeFileItem(info.name);\n        } else {\n            this._addFileItems(info.items);\n        }\n    },\n\n    /**\n     * Update items total count, total size information.\n     * @param {object} info A information to update list.\n     *  @param {array} info.items The list of file information.\n     *  @param {string} info.size The total size.\n     *  @param {string} info.count The count of files.\n     */\n    updateTotalInfo: function(info) {\n        this._updateTotalCount(info.count);\n        this._updateTotalUsage(info.size);\n    },\n\n    /**\n     * Update items total count and refresh element\n     * @param {(number|string)} [count] Total file count\n     * @private\n     */\n    _updateTotalCount: function(count) {\n\n        if (!tui.util.isExisty(count)) {\n            count = this.items.length;\n        }\n\n        this.$counter.html(count);\n    },\n\n    /**\n     * Update items total size and refresh element\n     * @param {(number|string)} size Total files sizes\n     * @private\n     */\n    _updateTotalUsage: function(size) {\n\n        if (!tui.util.isExisty(size)) {\n            size = this._getSumAllItemUsage();\n        }\n        if (tui.util.isNumber(size) &amp;&amp; !isNaN(size)) {\n            size = utils.getFileSizeWithUnit(size);\n            this.$size.html(size);\n            this.$size.show();\n        } else {\n            this.$size.hide();\n        }\n    },\n\n    /**\n     * Sum sizes of all items.\n     * @returns {*}\n     * @private\n     */\n    _getSumAllItemUsage: function() {\n        var items = this.items,\n            totalUsage = 0;\n\n        tui.util.forEach(items, function(item) {\n            totalUsage += parseFloat(item.size);\n        });\n\n        return totalUsage;\n    },\n\n    /**\n     * Add file items\n     * @param {object} target Target item information.\n     * @private\n     */\n    _addFileItems: function(target) {\n        if (!tui.util.isArray(target)) {\n            target = [target];\n        }\n        tui.util.forEach(target, function(data) {\n            this.items.push(this._createItem(data));\n        }, this);\n\n        this.fire('fileAdded', {\n            target: target\n        });\n    },\n\n    /**\n     * Remove file item\n     * @param {string} name The file name to remove\n     * @private\n     */\n    _removeFileItem: function(name) {\n        name = decodeURIComponent(name);\n        tui.util.forEach(this.items, function(item, index) {\n            if (name === decodeURIComponent(item.name)) {\n                item.destroy();\n                this._uploader.remove(name);\n                this.fire('fileRemoved', {\n                    name: name\n                });\n                this.items.splice(index, 1);\n                return false;\n            }\n        }, this);\n    },\n\n    /**\n     * Create item By Data\n     * @param {object} data\n     * @returns {Item}\n     * @private\n     */\n    _createItem: function(data) {\n        var item = new Item({\n            root: this,\n            name: data.name,\n            size: data.size,\n            deleteButtonClassName: this.deleteButtonClassName,\n            url: this.url,\n            hiddenFrame: this.formTarget,\n            hiddenFieldName: this.hiddenFieldName,\n            template: this.template &amp;&amp; this.template.item\n        });\n        item.on('remove', this._removeFile, this);\n        return item;\n    },\n\n    /**\n     * Callback Remove File\n     * @param data\n     * @private\n     */\n    _removeFile: function(data) {\n        this.fire('remove', data);\n    }\n});\n\ntui.util.CustomEvents.mixin(List);\n\nmodule.exports = List;\n</code></pre>\n        </article>\n    </section>\n\n\n\n</div>\n\n"