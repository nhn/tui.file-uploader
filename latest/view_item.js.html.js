tui.util.defineNamespace("fedoc.content", {});
fedoc.content["view_item.js.html"] = "      <div id=\"main\" class=\"main\">\n\n\n\n    \n    <section>\n        <article>\n            <pre class=\"prettyprint source linenums\"><code>/**\n * @fileoverview ItemView make element to display added file information. It has attached file ID to request for remove.\n * @dependency ne-code-snippet 1.0.3, jquery1.8.3\n * @author NHN Ent. FE Development Team &lt;dl_javascript@nhnent.com>\n */\n'use strict';\nvar consts = require('../consts');\nvar utils = require('../utils');\n\n/**\n * Class of item that is member of file list.\n * @class View.Item\n */\nvar Item = tui.util.defineClass(/** @lends View.Item.prototype **/ {\n    /**\n     * Initialize item\n     * @param {object} options\n     *  @param {string} options.name File name\n     *  @param {string} options.type File type\n     *  @param {object} options.root List object\n     *  @param {string} options.hiddenFrame The iframe name will be target of form submit.\n     *  @param {string} options.url The url for form action to submet.\n     *  @param {string} [options.id] Unique key, what if the key is not exist id will be the file name.\n     *  @param {string} [options.hiddenFieldName] The name of hidden filed. The hidden field is for connecting x-domian.\n     *  @param {string} [options.deleteButtonClassName='uploader_btn_delete'] The class name is for delete button.\n     *  @param {(string|number)} [options.size] File size (but ie low browser, x-domain)\n     *  @param {object} [options.helper] The helper page info.\n     */\n    init: function(options) {\n\n        this._setRoot(options);\n        this._setItemInfo(options);\n        this._setConnectInfo(options);\n\n        this.render(options.template || consts.HTML.item);\n\n        if (options.helper) {\n            this._makeBridgeInfoElement(options.helper);\n        }\n    },\n\n    /**\n     * Set root(List object) information.\n     * @param {object} options Same with init options parameter.\n     * @private\n     */\n    _setRoot: function(options) {\n        this._root = options.root;\n        this._$root = options.root.$el;\n    },\n\n    /**\n     * Set file information.\n     * @param {object} options Same with init options parameter.\n     * @private\n     */\n    _setItemInfo: function(options) {\n        this.name = options.name;\n        this._type = options.type || this._extractExtension();\n        this._id = options.id || options.name;\n        this.size = options.size || '';\n        this._btnClass = options.deleteButtonClassName || 'uploader_btn_delete';\n        this._unit = options.unit || 'KB';\n    },\n\n    /**\n     * Set connect element information.\n     * @param {object} options Same with init options parameter.\n     * @private\n     */\n    _setConnectInfo: function(options) {\n        this._url = options.url;\n        this._hiddenInputName = options.hiddenFieldName || 'filename';\n    },\n\n    /**\n     * Render making form padding with deletable item\n     * @param template\n     */\n    render: function(template) {\n        var html = this._getHtml(template);\n        this._$el = $(html);\n        this._$root.append(this._$el);\n        this._addEvent();\n    },\n\n    /**\n     * Extract file extension by name\n     * @returns {string}\n     * @private\n     */\n    _extractExtension: function() {\n        return this.name.split('.').pop();\n    },\n\n    /**\n     * Make element that has redirect page information used by Server side.\n     * @param {object} helper Redirection helper page information for clear x-domain problem.\n     * @private\n     */\n    _makeBridgeInfoElement: function(helper) {\n        this.$helper = $('&lt;input />');\n        this.$helper.attr({\n            'name' : helper.name,\n            'value': helper.url\n        });\n    },\n\n    /**\n     * Get item elemen HTML\n     * @param {string} html HTML template\n     * @returns {string}\n     * @private\n     */\n    _getHtml: function(html) {\n        var map = {\n            filetype: this._type,\n            filename: this.name,\n            filesize: this.size ? utils.getFileSizeWithUnit(this.size) : '',\n            deleteButtonClassName: this._btnClass\n        };\n\n        return utils.template(map, html);\n    },\n\n    /**\n     * Destory item\n     */\n    destroy: function() {\n        this._removeEvent();\n        this._$el.remove();\n    },\n\n    /**\n     * Add event handler on delete button.\n     * @private\n     */\n    _addEvent: function() {\n        var query = '.' + this._btnClass,\n            $delBtn = this._$el.find(query);\n        $delBtn.on('click', tui.util.bind(this._onClickEvent, this));\n    },\n\n    /**\n     * Remove event handler from delete button.\n     * @private\n     */\n    _removeEvent: function() {\n        var query = '.' + this._btnClass,\n            $delBtn = this._$el.find(query);\n        $delBtn.off('click');\n    },\n\n\n    /**\n     * Event-handle for delete button clicked.\n     * @private\n     */\n    _onClickEvent: function() {\n        this.fire('remove', {\n            filename : this.name,\n            id : this._id,\n            type: 'remove'\n        });\n    }\n});\n\ntui.util.CustomEvents.mixin(Item);\n\nmodule.exports = Item;\n</code></pre>\n        </article>\n    </section>\n\n\n\n</div>\n\n"