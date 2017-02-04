/**
 * tui-component-file-uploader
 * @author NHNEnt FE Development lab <dl_javascript@nhnent.com>
 * @version v1.1.1
 * @license MIT
 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
tui.util.defineNamespace('tui.component', {
    FileUploader: require('./src/js/uploader.js')
});

},{"./src/js/uploader.js":6}],2:[function(require,module,exports){
'use strict';

/*eslint-disable*/
/**
 * Uploader config
 * @type {object}
 * @ignore
 */
module.exports.CONF = {
    REQUESTER_TYPE_MODERN: 'modernRequester',
    REQUESTER_TYPE_OLD: 'oldRequester',
    FORM_TARGET_NAME: 'tuiUploaderHiddenFrame'
};

/**
 * Class names
 * @type {object}
 * @ignore
 */
module.exports.CLASSNAME = {
    HIDDEN_FILE_INPUT: 'tui-js-hidden-file-input',
    LIST_CONTAINER: 'tui-js-file-uploader-list',
    LIST_ITEMS_CONTAINER: 'tui-js-file-uploader-list-items',
    DROPZONE: 'tui-js-file-uploader-dropzone',
    USE_DROPZONE: 'tui-dropzone-using',
    DROP_ENABLED: 'tui-dropzone-enabled',
    HAS_ITEMS: 'tui-has-items',
    IS_CHECKED: 'tui-is-checked',
    THEAD_STYLE: 'tui-col-name'
};

/**
 * Default Htmls
 * @type {object}
 * @ignore
 */
module.exports.HTML = {
    FORM: '<form enctype="multipart/form-data" id="tui-uploader-form" method="post"></form>',
    HIDDEN_INPUT: '<input type="hidden" name="{{name}}" value="{{value}}">',
    CHECKBOX: [
        '<label class="tui-checkbox">',
            '<span class="tui-ico-check"><input type="checkbox"></span>',
        '</label>',
    ].join(''),
    REMOVE_BUTTON: '<button type="button" class="tui-btn-delete">Remove</button>'
};

/**
 * Simple list template
 * @type {object}
 * @ignore
 */
module.exports.LIST_TEMPLATE = {
    CONTAINER: '<ul class="tui-upload-lst {{listItemsClassName}}"></ul>',
    LIST_ITEM: [
        '<li class="tui-upload-item">',
            '<span class="tui-filename-area">',
                '<span class="tui-file-name">{{filename}} ({{filesize}})</span>',
            '</span>',
            '<button type="button" class="tui-btn-delete">remove</button>',
        '</li>'
    ].join('')
};

/**
 * Table list template
 * @type {object}
 * @ignore
 */
module.exports.TABLE_TEMPLATE = {
    CONTAINER: [
        '<table class="tui-file-uploader-tbl">',
            '<caption><span>File Uploader List</span></caption>',
            '<colgroup>',
                '<col width="32">',
                '<col width="156">',
                '<col width="362">',
                '<col width="">',
            '</colgroup>',
            '<thead class="tui-form-header">',
                '<tr>',
                    '<th scope="col">',
                        '<label class="tui-checkbox">',
                            '<span class="tui-ico-check"><input type="checkbox"></span>',
                        '</label>',
                    '</th>',
                    '<th scope="col">File Type</th>',
                    '<th scope="col">File Name</th>',
                    '<th scope="col">File Size</th>',
                '</tr>',
            '</thead>',
            '<tbody class="tui-form-body {{listItemsClassName}}"></tbody>',
        '</table>'
    ].join(''),
    LIST_ITEM: [
        '<tr>',
            '<td>',
                '<label class="tui-checkbox">',
                    '<span class="tui-ico-check"><input type="checkbox"></span>',
                '</label>',
            '</td>',
            '<td>{{filetype}}</td>',
            '<td>{{filename}}</td>',
            '<td>{{filesize}}</td>',
        '</tr>'
    ].join('')
};

},{}],3:[function(require,module,exports){
'use strict';

var consts = require('./consts');

var snippet = tui.util;
var forEach = snippet.forEach;
var hasStamp = snippet.hasStamp;
var stamp = snippet.stamp;

var HIDDEN_FILE_INPUT_CLASS = consts.CLASSNAME.HIDDEN_FILE_INPUT;

/**
 * The pool for save files.
 * It's only for input[file] element save at browser that does not support file api.
 * @param {HTMLElement} planet - Form element
 * @class Pool
 * @ignore
 */
var Pool = tui.util.defineClass(/** @lends Pool.prototype */{
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
        var filename, key;

        if (!id) {
            return;
        }
        filename = inputFileEl.value;
        key = id + filename;

        this.files[key] = inputFileEl;
    },

    /**
     * Remove a input element[type=file] from pool.
     * @param {object} params - A file name that have to be removed.
     * @returns {boolean} result
     */
    remove: function(params) {
        var key = params.id + params.name;
        var element = this.files[key];

        if (!element) {
            return false;
        }

        delete this.files[key];

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

},{"./consts":2}],4:[function(require,module,exports){
'use strict';

var consts = require('../consts');

var TYPE = consts.CONF.REQUESTER_TYPE_MODERN;
var forEach = tui.util.forEach;

/**
 * Modern requester
 * @param {Uploader} uploader - Uploader
 * @class
 * @ignore
 */
var Modern = tui.util.defineClass(/** @lends Modern.prototype */{
    init: function(uploader) {
        /**
         * Uploader
         * @type {Uploader}
         */
        this.uploader = uploader;

        /**
         * From view
         * @type {Form}
         */
        this.formView = uploader.formView;

        /**
         * Local pool for files
         * @type {Array.<File>}
         */
        this.pool = [];

        if (uploader.isBatchTransfer) {
            /**
             * Override remove function for batch transfer
             * @type {Old._removeWhenBatch}
             */
            this.remove = this._removeWhenBatch;
        }
    },

    /**
     * Requester type
     * @type {string}
     */
    TYPE: TYPE,

    /**
     * Event handler for upload error
     * @param {Object} jqXHR - jQuery XHR
     * @param {string} status - Ajax Status
     * @param {string} msgThrown - Error message
     * @private
     */
    _uploadError: function(jqXHR, status, msgThrown) {
        this.fire('error', {
            status: status,
            message: msgThrown
        });
    },

    /**
     * Event handler for upload success
     * @param {Object} data - Upload success data
     * @private
     */
    _uploadSuccess: function(data) {
        this.fire('uploaded', JSON.parse(data));
    },

    /**
     * Store files to local pool
     * @param {Array.<File> | File} [files] - A file or files
     */
    store: function(files) {
        var pool = this.pool;
        var stamp = tui.util.stamp;
        var data = [];

        files = tui.util.toArray(files || this.formView.$fileInput[0].files);
        forEach(files, function(file) {
            var id = stamp(file);
            pool.push(file);
            data.push({
                id: id,
                name: file.name,
                size: file.size
            });
        });

        this.formView.resetFileInput();
        this.fire('stored', data);
    },

    /**
     * Upload ajax
     */
    upload: function() {
        var field = this.formView.$fileInput.attr('name');
        var $form = this.formView.$el.clone();
        var formData;

        $form.find('input[type="file"]').remove();
        formData = new FormData($form[0]);

        forEach(this.pool, function(file) {
            formData.append(field, file);
        });

        $.ajax({
            url: this.uploader.url.send,
            type: 'POST',
            data: formData,
            success: $.proxy(this._uploadSuccess, this),
            error: $.proxy(this._uploadError, this),
            processData: false,
            contentType: false
        });
        this.clear();
    },

    /**
     * Remove file (ajax-jsonp)
     * It is not used for batch transfer.
     * @param {Object} params - Parameters to remove file
     */
    remove: function(params) {
        $.ajax({
            url: this.uploader.url.remove,
            dataType: 'jsonp',
            data: params,
            success: $.proxy(function(data) {
                this.fire('removed', data);
            }, this)
        });
    },

    /**
     * Remove file (ajax-jsonp)
     * It is used for batch transfer.
     * @param {Object} params - Parameters to remove file
     * @private
     */
    _removeWhenBatch: function(params) {
        var result = false;

        forEach(params.filelist, function(file) {
            result = this._removeFileInPool(file);
            file.state = result;
        }, this);

        this.fire('removed', tui.util.extend({
            message: result ? 'success' : 'fail'
        }, params));
    },

    /**
     * Remove file in pool
     * @param {object} data - File data
     * @returns {boolean} Removed state
     * @private
     */
    /*eslint-disable consistent-return*/
    _removeFileInPool: function(data) {
        var pool = this.pool;
        var hasStamp = tui.util.hasStamp;
        var stamp = tui.util.stamp;
        var result = false;

        forEach(pool, function(file, index) {
            if (hasStamp(file) && (stamp(file) === data.id)) {
                pool.splice(index, 1);
                result = true;

                return false;
            }
        });

        return result;
    },
    /*eslint-enable consistent-return*/

    /**
     * Clear the pool
     */
    clear: function() {
        this.pool.length = 0;
    }
});

tui.util.CustomEvents.mixin(Modern);
module.exports = Modern;

},{"../consts":2}],5:[function(require,module,exports){
'use strict';

var Pool = require('../pool'),
    consts = require('../consts');

var TYPE = consts.CONF.REQUESTER_TYPE_OLD;

/**
 * Old requester
 * @param {Uploader} uploader - Uploader
 * @class
 * @ignore
 */
var Old = tui.util.defineClass(/** @lends Old.prototype */{
    init: function(uploader) {
        var $hiddenFrame = uploader.$targetFrame;
        var formView = uploader.formView;

        /**
         * Uploader
         * @type {Uploader}
         */
        this.uploader = uploader;

        /**
         * From view
         * @type {Form}
         */
        this.formView = formView;

        /**
         * Local pool for file elements
         * @type {Pool}
         */
        this.pool = new Pool(formView.$el[0]);

        if (uploader.isBatchTransfer) {
            /**
             * Override Upload function for batch transfer
             * @type {Old._uploadWhenBatch}
             */
            this.upload = this._uploadWhenBatch;

            /**
             * Override remove function for batch transfer
             * @type {Old._removeWhenBatch}
             */
            this.remove = this._removeWhenBatch;
        }

        $hiddenFrame.on('load', $.proxy(this._onLoadHiddenFrame, this, $hiddenFrame));
    },

    /**
     * Requester type
     * @type {string}
     */
    TYPE: TYPE,

    /**
     * Event handler
     * "load" of hidden frame.
     * @param {jQuery} $hiddenFrame - Hidden iframe
     * @private
     */
    _onLoadHiddenFrame: function($hiddenFrame) {
        var frameBody;
        var data;

        try {
            frameBody = $hiddenFrame[0].contentWindow.document.body;
            data = tui.util.pick(frameBody, 'firstChild', 'data');
            if (data) {
                this.fire('uploaded', $.parseJSON(data));
                frameBody.innerHTML = '';
            }
        } catch (e) {
            this.fire('error', {
                status: e.name,
                message: e.message
            });
        }
    },

    /**
     * Store file input element from upload form
     */
    store: function() {
        var el = this.formView.$fileInput[0];
        var id = tui.util.stamp(el);

        this.pool.store(el);
        this.formView.resetFileInput();

        this.fire('stored', [{
            id: id,
            name: el.value,
            size: ''
        }]);
    },

    /**
     * Upload.
     * It is not used for batch transfer.
     */
    upload: function() {
        this.pool.plant();
        this.formView.$el.submit();
        this.formView.clear();
        this.clear();
    },

    /**
     * Upload.
     * It is used for batch transfer.
     * @private
     */
    _uploadWhenBatch: function() {
        this.pool.plant();
    },

    /**
     * Remove file (ajax-jsonp)
     * It is not used for batch transfer.
     * @param {Object} params - Parameters to remove file
     */
    remove: function(params) {
        var uploader = this.uploader;
        $.ajax({
            url: uploader.url.remove,
            dataType: 'jsonp',
            data: params,
            success: $.proxy(function(data) {
                this.fire('removed', data);
            }, this)
        });
    },

    /**
     * Remove file (ajax-jsonp)
     * It is used for batch transfer.
     * @param {Object} params - Parameters to remove file
     * @private
     */
    _removeWhenBatch: function(params) {
        var result = false;

        tui.util.forEach(params.filelist, function(file) {
            result = this.pool.remove(file);
            file.state = result;
        }, this);

        this.fire('removed', tui.util.extend({
            message: result ? 'success' : 'fail'
        }, params));
    },

    /**
     * Clear the pool
     */
    clear: function() {
        this.pool.empty();
    }
});

tui.util.CustomEvents.mixin(Old);
module.exports = Old;

},{"../consts":2,"../pool":3}],6:[function(require,module,exports){
'use strict';

var consts = require('./consts');
var utils = require('./utils');
var Form = require('./view/form');
var List = require('./view/list');
var DragAndDrop = require('./view/drag');
var OldRequester = require('./requester/old');
var ModernRequester = require('./requester/modern');

var REQUESTER_TYPE_MODERN = consts.CONF.REQUESTER_TYPE_MODERN;
var classNames = consts.CLASSNAME;

/**
 * FileUploader component controller
 * @class Uploader
 * @param {jQuery} container - Container element to generate component
 * @param {object} options - Options
 *     @param {object} options.url - File server urls
 *         @param {string} options.url.send - Send files url
 *         @param {string} options.url.remove - Remove files url
 *     @param {boolean} [options.isMultiple] Use multiple files upload
 *     @param {boolean} [options.useFolder] - Use directory upload. If ture, 'isMultiple' option will be ignored
 *     @param {boolean} [options.useDrag] - Use file drag and drop
 *     @param {object} options.listUI - List area preset
 *         @param {object} options.listUI.type - List type ('simple' or 'table')
 *         @param {object} [options.listUI.item] - To customize item contents when list type is 'simple'
 *         @param {object} [options.listUI.columnList] - To customize row contents when list type is 'table'
 * @example
 * // Case 1: Using normal transfer & simple list
 * //
 * // <!-- HTML -->
 * // <div id="uploader">
 * //     <input type="file" name="userfile[]">
 * //     <div class="tui-js-file-uploader-list"></div>
 * // </div>
 * //
 * var uploader = new tui.component.FileUploader($('#uploader'), {
 *     url: {
 *         send: 'http://localhost:3000/upload',
 *         remove: 'http://localhost:3000/remove'
 *     },
 *     isBatchTransfer: false,
 *     listUI: {
 *         type: 'simple'
 *     }
 * });
 *
 * // Case 2: Using batch transfer & table list & make dropzone
 * //
 * // <!-- HTML -->
 * // <div id="uploader">
 * //     <input type="file" name="userfile[]">
 * //     <div class="tui-js-file-uploader-list tui-js-file-uploader-dropzone"></div>
 * //     <button type="submit">Upload</button>
 * // </div>
 * //
 * var uploader = new tui.component.FileUploader($('#uploader'), {
 *     url: {
 *         send: 'http://localhost:3000/upload',
 *         remove: 'http://localhost:3000/remove'
 *     },
 *     isBatchTransfer: true,
 *     useDrag: true,
 *     listUI: {
 *         type: 'table'
 *     }
 * });
 */
var Uploader = tui.util.defineClass(/**@lends Uploader.prototype */{
    init: function($container, options) {
        /**
         * Uploader element
         * @type {jQuery}
         * @private
         */
        this.$el = $container;

        /**
         * Send/Remove url
         * @type {{send: string, remove: string}}
         * @private
         */
        this.url = options.url;

        /**
         * Redirect URL for CORS(response, IE7)
         * @private
         * @type {string}
         */
        this.redirectURL = options.redirectURL;

        /**
         * Form target name for CORS (IE7, 8, 9)
         * @private
         * @type {string}
         */
        this.formTarget = consts.CONF.FORM_TARGET_NAME;

        /**
         * Target frame for CORS (IE7, 8, 9)
         * @private
         * @type {jQuery}
         */
        this.$targetFrame = this._createTargetFrame()
            .appendTo(this.$el);

        /**
         * Whether the uploader uses batch-transfer
         * @private
         * @type {boolean}
         */
        this.isBatchTransfer = !!(options.isBatchTransfer);

        /**
         * Whether the sending/removing urls are x-domain.
         * @private
         * @type {boolean}
         */
        this.isCrossDomain = utils.isCrossDomain(this.url.send);

        /**
         * Whether the browser supports PostMessage API
         * @private
         * @type {boolean}
         */
        this.isSupportPostMessage = !!(tui.util.pick(this.$targetFrame, '0', 'contentWindow', 'postMessage'));

        /**
         * Whether the user uses multiple upload
         * @private
         * @type {boolean}
         */
        this.isMultiple = !!(options.isMultiple);

        /**
         * Whether the user uses drag&drop upload
         * @private
         * @type {boolean}
         */
        this.useDrag = !!(options.useDrag);

        /**
         * Whether the user uses folder upload
         * @private
         * @type {boolean}
         */
        this.useFolder = !!(options.useFolder);

        /**
         * From View
         * @private
         * @type {Form}
         */
        this.formView = new Form(this);

        /**
         * List View
         * @private
         * @type {List}
         */
        this.listView = new List(this.$el.find('.' + classNames.LIST_CONTAINER), options.listUI);

        if (this.useDrag && !this.useFolder && utils.isSupportFileSystem()) {
            /**
             * Drag & Drop View
             * @private
             * @type {DragAndDrop}
             */
            this.dragView = new DragAndDrop(this.$el.find('.' + classNames.DROPZONE));
        }

        this._setRequester();
        this._addEvent();

        if (this.isCrossDomain && this.isSupportPostMessage) {
            this._setPostMessageEvent();
        }
    },

    /**
     * Set Connector
     * @private
     */
    _setRequester: function() {
        if (utils.isSupportFormData()) {
            this._requester = new ModernRequester(this);
        } else {
            this._requester = new OldRequester(this);
        }
    },

    /**
     * Set post-message event if supported and needed
     * @private
     */
    _setPostMessageEvent: function() {
        this.$targetFrame.off('load');
        $(window).on('message', $.proxy(function(event) {
            var originalEvent = event.originalEvent,
                data;

            if (this.url.send.indexOf(originalEvent.origin) === -1) {
                return;
            }
            data = $.parseJSON(originalEvent.data);

            if (this.isBatchTransfer) {
                this.clear();
            } else {
                this.updateList(data.filelist);
            }
            this.fire('success', data);
        }, this));
    },

    /**
     * Make target frame to be target of form element.
     * @returns {jQuery} Target frame: jquery-element
     * @private
     */
    _createTargetFrame: function() {
        var $target = $('<iframe name="' + this.formTarget + '"></iframe>');
        $target.css({
            visibility: 'hidden',
            position: 'absolute'
        });

        return $target;
    },

    /**
     * Add events to views and fire uploader events
     * @private
     */
    _addEvent: function() {
        this.listView.on('remove', this.removeFile, this);
        this.listView.on('check', function(data) {
            /**
             * Check event
             * @event Uploader#check
             * @param {object} evt - Event object
             *  @param {string} evt.id - File id
             *  @param {string} evt.name - File name
             *  @param {string} evt.size - File size
             *  @param {boolean} evt.isChecked - Checked state
             */
            this.fire('check', data);
        }, this);
        if (this.isBatchTransfer) {
            this._addEventWhenBatchTransfer();
        } else {
            this._addEventWhenNormalTransfer();
        }
    },

    /**
     * Add event when uploader uses batch-transfer
     * @private
     */
    _addEventWhenBatchTransfer: function() {
        this.formView.on({
            change: this.store,
            submit: this.submit
        }, this);

        this._requester.on({
            removed: function(data) {
                this.updateList(data.filelist, 'remove');
                this.fire('remove', data);
            },
            error: function(data) {
                this.fire('error', data);
            },
            uploaded: function(data) {
                this.clear();
                this.fire('success', data);
            },
            stored: function(data) {
                this.updateList(data);
                this.fire('update', data);
            }
        }, this);

        if (this.useDrag && this.dragView) {
            this.dragView.on('drop', this.store, this);
        }
    },

    /**
     * Add event when uploader uses normal-transfer
     * @private
     */
    _addEventWhenNormalTransfer: function() {
        this.formView.on('change', this.sendFile, this);

        this._requester.on({
            removed: function(data) {
                this.updateList(data.filelist, 'remove');
                this.fire('remove', data);
            },
            error: function(data) {
                this.fire('error', data);
            },
            uploaded: function(data) {
                this.updateList(data.filelist);
                this.fire('success', data);
            }
        }, this);

        if (this.useDrag && this.dragView) {
            this.dragView.on('drop', function(files) {
                this.store(files);
                this.submit();
            }, this);
        }
    },

    /**
     * Update list view with custom or original data.
     * @param {object} info - The data for update list
     * @param {*} type - Update type
     * @private
     */
    updateList: function(info, type) {
        this.listView.update(info, type);
    },

    /**
     * Callback for custom send event
     * @param {Event} [event] - Form submit event
     * @private
     */
    sendFile: function(event) {
        this.store();
        this.submit(event);
    },

    /**
     * Callback for custom remove event
     * @param {object} data The data for remove file.
     * @private
     */
    removeFile: function(data) {
        this._requester.remove(data);
    },

    /**
     * Submit for data submit to server
     * @param {Event} [event] - Form submit event
     * @private
     */
    submit: function(event) {
        if (event && this._requester.TYPE === REQUESTER_TYPE_MODERN) {
            event.preventDefault();
        }
        this._requester.upload();
    },

    /**
     * Store input element to pool.
     * @param {Array.<File> | File} [files] - A file or files
     * @private
     */
    store: function(files) {
        this._requester.store(files);
    },

    /**
     * Clear uploader
     */
    clear: function() {
        this._requester.clear();
        this.formView.clear();
        this.listView.clear();
    },

    /**
     * Remove checked file list
     */
    removeCheckedList: function() {
        var listView = this.listView;
        var chekcedIndexList = listView.checkedIndexList;
        var files = listView.items;
        var checkedFiles = [];
        var file;

        tui.util.forEach(chekcedIndexList, function(index) {
            file = files[index];

            checkedFiles.push({
                id: file.id,
                name: file.name
            });
        }, this);

        if (checkedFiles.length) {
            this.removeFile({filelist: checkedFiles});
        }
    },

    /**
     * Get uploaded file's total count
     * @returns {number} Total count
     */
    getUploadedTotalCount: function() {
        return this.listView.items.length;
    },

    /**
     * Get uploaded file's total size
     * @returns {string} Total size with unit
     */
    getUploadedTotalSize: function() {
        var items = this.listView.items;
        var totalSize = 0;

        tui.util.forEach(items, function(item) {
            totalSize += parseFloat(item.size);
        });

        return utils.getFileSizeWithUnit(totalSize);
    },

    /**
     * Get checked file's total count
     * @returns {number} Total count
     */
    getCheckedTotalCount: function() {
        return this.listView.checkedIndexList.length;
    },

    /**
     * Get checked file's total size
     * @returns {string} Total size with unit
     */
    getCheckedTotalSize: function() {
        var listView = this.listView;
        var checkedItemsIndex = listView.checkedIndexList;
        var totalSize = 0;
        var item;

        tui.util.forEach(checkedItemsIndex, function(index) {
            item = listView.items[index];
            totalSize += parseFloat(item.size);
        });

        return utils.getFileSizeWithUnit(totalSize);
    }
});

tui.util.CustomEvents.mixin(Uploader);
module.exports = Uploader;

/**
 * Remove event
 * @event Uploader#remove
 * @param {object} data - Remove data from this component
 *  @param {string} data.message - 'success' or 'fail'
 *  @param {string} data.name - file name
 *  @param {string} data.id - file id
 */

/**
 * Error event
 * @event Uploader#error
 * @param {Error} data - Error data
 *  @param {string} data.status - Error status
 *  @param {string} data.message - Error message
 */

/**
 * Success event
 * @event Uploader#success
 * @param {object} data - Server response data
 *  @param {Array} data.filelist - Uploaded file list
 *  @param {number} [data.success] - Uploaded file count
 *  @param {number} [data.failed] - Failed file count
 *  @param {number} [data.count] - Total count
 */

/**
 * Update event
 * @event Uploader#update
 * @param {Array.<object>} data - File list data
 * Array having objects<br>{id: string, name: string, size: number}
 */

},{"./consts":2,"./requester/modern":4,"./requester/old":5,"./utils":7,"./view/drag":8,"./view/form":9,"./view/list":11}],7:[function(require,module,exports){
'use strict';

/**
 * @namespace utils
 * @ignore
 */
var IS_SUPPORT_FILE_SYSTEM = !!(window.File && window.FileReader && window.FileList && window.Blob);
var IS_SUPPORT_FORM_DATA = !!(window.FormData || null);

/**
 * Parse url
 * @param {string} url - url for parsing
 * @returns {Object} URL information
 * @ignore
 */
function parseURL(url) {
    var a = document.createElement('a');
    a.href = url;

    return {
        href: a.href,
        host: a.host,
        port: a.port,
        hash: a.hash,
        hostname: a.hostname,
        pathname: a.pathname,
        protocol: a.protocol,
        search: a.search,
        query: a.search.slice(1)
    };
}

/**
 * Extract unit for file size
 * @param {number} bytes A usage of file
 * @returns {string} Size-string
 * @memberof utils
 */
function getFileSizeWithUnit(bytes) {
    var units = ['B', 'KB', 'MB', 'GB', 'TB'];
    var exp, result;

    bytes = parseInt(bytes, 10);
    exp = Math.log(bytes) / Math.log(1024) | 0;
    result = (bytes / Math.pow(1024, exp)).toFixed(2);

    return result + ' ' + units[exp];
}

/**
 * Whether the browser supports FormData or not
 * @memberof utils
 * @returns {boolean} whether the browser supports FormData
 */
function isSupportFormData() {
    return IS_SUPPORT_FORM_DATA;
}

/**
 * Get item elements HTML
 * @param {Object} map - Properties for template
 * @param {string} html HTML template
 * @returns {string} HTML
 * @memberof utils
 */
function template(map, html) {
    html = html.replace(/\{\{([^\}]+)\}\}/g, function(mstr, name) {
        return map[name];
    });

    return html;
}

/**
 * Check whether the browser supports file api.
 * @returns {boolean} whether the browser supports FileAPI
 * @memberof utils
 */
function isSupportFileSystem() {
    return IS_SUPPORT_FILE_SYSTEM;
}

/**
 * Check whether the url is x-domain
 * @param {string} url - URL
 * @returns {boolean} Whether the url is x-domain
 * @memberof utils
 */
function isCrossDomain(url) {
    var here = parseURL(window.location.href),
        target = parseURL(url);

    return target.hostname !== here.hostname
        || target.port !== here.port
        || target.protocol !== here.protocol;
}

/**
 * Remove first specified item from array, if it exists
 * @param {*} item Item to look for
 * @param {Array} arr Array to query
 */
function removeItemFromArray(item, arr) {
    var index = arr.length - 1;

    while (index > -1) {
        if (item === arr[index]) {
            arr.splice(index, 1);
        }
        index -= 1;
    }
}

/**
 * Get label element
 * @param {jQuery} $target - Target element
 * @returns {jQuery|null} Label element
 */
function getLabelElement($target) {
    var $labels = $target.parents('label');
    var hasLabel = $labels.length;

    if (hasLabel) {
        return $labels.eq(0);
    }

    return null;
}

module.exports = {
    getFileSizeWithUnit: getFileSizeWithUnit,
    isSupportFileSystem: isSupportFileSystem,
    isSupportFormData: isSupportFormData,
    template: template,
    isCrossDomain: isCrossDomain,
    removeItemFromArray: removeItemFromArray,
    getLabelElement: getLabelElement
};

},{}],8:[function(require,module,exports){
'use strict';

var consts = require('../consts');

var USE_DROPZONE_CLASS = consts.CLASSNAME.USE_DROPZONE;
var DROP_ENABLED_CLASS = consts.CLASSNAME.DROP_ENABLED;

/**
 * Makes drag and drop area, the dropped file is added via event drop event.
 * @class DragAndDrop
 * @param {jQuery} $el - Dropzone element
 * @ignore
 */
var DragAndDrop = tui.util.defineClass(/** @lends DragAndDrop.prototype */{
    init: function($el) {
        /**
         * Drop zone jQuery-element
         * @type {jQuery}
         */
        this.$el = $el.addClass(USE_DROPZONE_CLASS);

        /**
         * Class for drop enabled
         * @type {string}
         * @private
         */
        this._enableClass = DROP_ENABLED_CLASS;

        this._addEvent();
    },

    /**
     * Adds drag and drop event
     * @private
     */
    _addEvent: function() {
        this.$el.on({
            dragenter: $.proxy(this.onDragEnter, this),
            dragover: $.proxy(this.onDragOver, this),
            drop: $.proxy(this.onDrop, this),
            dragleave: $.proxy(this.onDragLeave, this)
        });
    },

    /**
     * Handles dragenter event
     * @param {Event} e - Event
     */
    onDragEnter: function(e) {
        e.preventDefault();
        e.stopPropagation();
        this._enable();
    },

    /**
     * Handles dragover event
     * @param {Event} e - Event
     */
    onDragOver: function(e) {
        e.preventDefault();
        e.stopPropagation();
    },

    /**
     * Handles dragleave event
     * @param {Event} e - Event
     */
    onDragLeave: function(e) {
        e.preventDefault();
        e.stopPropagation();
        this._disable();
    },

    /**
     * Handles drop event
     * @param {Event} e - Event
     * @returns {boolean} False
     */
    onDrop: function(e) {
        var files = tui.util.pick(e, 'originalEvent', 'dataTransfer', 'files');

        e.preventDefault();
        this._disable();
        this.fire('drop', files);

        return false;
    },

    /**
     * Enable dropzone
     * @private
     */
    _enable: function() {
        this.$el.addClass(this._enableClass);
    },

    /**
     * Disable droponze
     * @private
     */
    _disable: function() {
        this.$el.removeClass(this._enableClass);
    }
});

tui.util.CustomEvents.mixin(DragAndDrop);

module.exports = DragAndDrop;

},{"../consts":2}],9:[function(require,module,exports){
'use strict';

var consts = require('../consts');
var utils = require('../utils');

var isSupportFormData = utils.isSupportFormData();
var HIDDEN_FILE_INPUT_CLASS = consts.CLASSNAME.HIDDEN_FILE_INPUT;
var STAMP_ID = '__fe_id';

/**
 * This view control input element typed file.
 * @class Form
 * @param {Uploader} uploader - Uploader instance
 * @ignore
 */
var Form = tui.util.defineClass(/**@lends View.Form.prototype **/{
    init: function(uploader) {
        /**
         * File uploader
         * @type {Uploader}
         * @private
         */
        this._uploader = uploader;

        /**
         * Html templates
         * @type {Object.<string, string>}
         */
        this._html = this._setTemplate(uploader.template);

        /**
         * Form element
         * @type {jQuery}
         */
        this.$el = null;

        /**
         * File input element
         * @type {jQuery}
         */
        this.$fileInput = null;

        /**
         * Submit element
         * @type {jQuery}
         */
        this.$submit = null;

        if (isSupportFormData) {
            /**
             * Whether the file input is multiple
             * @type {boolean}
             * @private
             */
            this._isMultiple = uploader.isMultiple;

            /**
             * Whether the file input accepts folder
             * @type {boolean}
             * @private
             */
            this._useFolder = uploader.useFolder;
        }

        this._render({
            action: uploader.url.send,
            method: 'post',
            enctype: 'multipart/form-data',
            target: isSupportFormData ? '' : uploader.formTarget
        });
    },

    /**
     * Render form element
     * @param {object} attributes - Form attributes
     * @private
     */
    _render: function(attributes) {
        var uploader = this._uploader;
        var $fileInput = this._getFileInput();
        var $el = $(this._html.FORM)
                .append(uploader.$el.children())
                .attr(attributes);

        this.$el = $el;
        this.$fileInput = $fileInput;

        if (uploader.isBatchTransfer) {
            this.$submit = uploader.$el.find(':submit');
        }

        if (uploader.isCrossDomain && !isSupportFormData) {
            this._setHiddenInputForCORS();
        }

        uploader.$el.append(this.$el);

        this._addEvent();
    },

    /**
     * Set hidden input element for CORS.
     *  Hidden input of PostMessage or RedirectURL.
     * @private
     */
    _setHiddenInputForCORS: function() {
        var props, $hiddenInput;
        var uploader = this._uploader;
        var redirectURL = uploader.redirectURL;

        if (uploader.isSupportPostMessage) { // for IE8, 9
            props = {
                name: 'messageTarget',
                value: location.protocol + '//' + location.host
            };
        } else if (redirectURL) { // for IE7
            props = {
                name: 'redirectURL',
                value: redirectURL
            };
        }

        if (props) {
            $hiddenInput = $(utils.template(props, this._html.HIDDEN_INPUT));
            $hiddenInput.appendTo(this.$el);
        }
    },

    /**
     * Set all of input elements html strings.
     * @private
     * @param {object} [template] The template is set form customer.
     * @returns {Object.<string, string>} The html template string set for form.
     */
    _setTemplate: function(template) {
        return tui.util.extend({}, consts.HTML, template);
    },

    /**
     * Makes and returns jquery element
     * @private
     * @returns {jQuery} The jquery object wrapping original input element
     */
    _getFileInput: function() {
        var $fileInput = this._uploader.$el.find(':file');
        var isMultiple = this._isMultiple;
        var useFolder = this._useFolder;

        $fileInput.prop({
            multiple: isMultiple,
            directory: useFolder,
            mozdirectory: useFolder,
            webkitdirectory: useFolder
        });

        return $fileInput;
    },

    /**
     * Add event
     * @private
     */
    _addEvent: function() {
        if (this._uploader.isBatchTransfer) {
            this.$el.on('submit', $.proxy(this.fire, this, 'submit'));
        }

        this._addInputEvent();
    },

    /**
     * Add change event to file input
     * @private
     */
    _addInputEvent: function() {
        this.$fileInput.on('change', $.proxy(this.onChange, this));
    },

    /**
     * Event-Handle for input element change
     */
    onChange: function() {
        if (!this.$fileInput[0].value) {
            return;
        }
        this.fire('change');
    },

    /**
     * Reset Input element to save whole input=file element.
     */
    resetFileInput: function() {
        var $clonedFileInput = this.$fileInput.clone();
        this.$fileInput.after($clonedFileInput);
        this.$fileInput.remove();
        this.$fileInput = $clonedFileInput;

        if (tui.util.hasStamp(this.$fileInput[0])) { // for old browser
            delete this.$fileInput[0][STAMP_ID];
        }

        this._addInputEvent();
    },

    /**
     * Clear file input elements
     */
    clear: function() {
        this.$el.find('.' + HIDDEN_FILE_INPUT_CLASS).remove();
        this.resetFileInput();
    }
});

tui.util.CustomEvents.mixin(Form);
module.exports = Form;

},{"../consts":2,"../utils":7}],10:[function(require,module,exports){
'use strict';

var consts = require('../consts');
var utils = require('../utils');

var classNames = consts.CLASSNAME;
var htmls = consts.HTML;

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
var Item = tui.util.defineClass(/** @lends Item.prototype **/{
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

},{"../consts":2,"../utils":7}],11:[function(require,module,exports){
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

},{"../consts":2,"../utils":7,"./item":10}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25zdHMuanMiLCJzcmMvanMvcG9vbC5qcyIsInNyYy9qcy9yZXF1ZXN0ZXIvbW9kZXJuLmpzIiwic3JjL2pzL3JlcXVlc3Rlci9vbGQuanMiLCJzcmMvanMvdXBsb2FkZXIuanMiLCJzcmMvanMvdXRpbHMuanMiLCJzcmMvanMvdmlldy9kcmFnLmpzIiwic3JjL2pzL3ZpZXcvZm9ybS5qcyIsInNyYy9qcy92aWV3L2l0ZW0uanMiLCJzcmMvanMvdmlldy9saXN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcbnR1aS51dGlsLmRlZmluZU5hbWVzcGFjZSgndHVpLmNvbXBvbmVudCcsIHtcbiAgICBGaWxlVXBsb2FkZXI6IHJlcXVpcmUoJy4vc3JjL2pzL3VwbG9hZGVyLmpzJylcbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKmVzbGludC1kaXNhYmxlKi9cbi8qKlxuICogVXBsb2FkZXIgY29uZmlnXG4gKiBAdHlwZSB7b2JqZWN0fVxuICogQGlnbm9yZVxuICovXG5tb2R1bGUuZXhwb3J0cy5DT05GID0ge1xuICAgIFJFUVVFU1RFUl9UWVBFX01PREVSTjogJ21vZGVyblJlcXVlc3RlcicsXG4gICAgUkVRVUVTVEVSX1RZUEVfT0xEOiAnb2xkUmVxdWVzdGVyJyxcbiAgICBGT1JNX1RBUkdFVF9OQU1FOiAndHVpVXBsb2FkZXJIaWRkZW5GcmFtZSdcbn07XG5cbi8qKlxuICogQ2xhc3MgbmFtZXNcbiAqIEB0eXBlIHtvYmplY3R9XG4gKiBAaWdub3JlXG4gKi9cbm1vZHVsZS5leHBvcnRzLkNMQVNTTkFNRSA9IHtcbiAgICBISURERU5fRklMRV9JTlBVVDogJ3R1aS1qcy1oaWRkZW4tZmlsZS1pbnB1dCcsXG4gICAgTElTVF9DT05UQUlORVI6ICd0dWktanMtZmlsZS11cGxvYWRlci1saXN0JyxcbiAgICBMSVNUX0lURU1TX0NPTlRBSU5FUjogJ3R1aS1qcy1maWxlLXVwbG9hZGVyLWxpc3QtaXRlbXMnLFxuICAgIERST1BaT05FOiAndHVpLWpzLWZpbGUtdXBsb2FkZXItZHJvcHpvbmUnLFxuICAgIFVTRV9EUk9QWk9ORTogJ3R1aS1kcm9wem9uZS11c2luZycsXG4gICAgRFJPUF9FTkFCTEVEOiAndHVpLWRyb3B6b25lLWVuYWJsZWQnLFxuICAgIEhBU19JVEVNUzogJ3R1aS1oYXMtaXRlbXMnLFxuICAgIElTX0NIRUNLRUQ6ICd0dWktaXMtY2hlY2tlZCcsXG4gICAgVEhFQURfU1RZTEU6ICd0dWktY29sLW5hbWUnXG59O1xuXG4vKipcbiAqIERlZmF1bHQgSHRtbHNcbiAqIEB0eXBlIHtvYmplY3R9XG4gKiBAaWdub3JlXG4gKi9cbm1vZHVsZS5leHBvcnRzLkhUTUwgPSB7XG4gICAgRk9STTogJzxmb3JtIGVuY3R5cGU9XCJtdWx0aXBhcnQvZm9ybS1kYXRhXCIgaWQ9XCJ0dWktdXBsb2FkZXItZm9ybVwiIG1ldGhvZD1cInBvc3RcIj48L2Zvcm0+JyxcbiAgICBISURERU5fSU5QVVQ6ICc8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJ7e25hbWV9fVwiIHZhbHVlPVwie3t2YWx1ZX19XCI+JyxcbiAgICBDSEVDS0JPWDogW1xuICAgICAgICAnPGxhYmVsIGNsYXNzPVwidHVpLWNoZWNrYm94XCI+JyxcbiAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cInR1aS1pY28tY2hlY2tcIj48aW5wdXQgdHlwZT1cImNoZWNrYm94XCI+PC9zcGFuPicsXG4gICAgICAgICc8L2xhYmVsPicsXG4gICAgXS5qb2luKCcnKSxcbiAgICBSRU1PVkVfQlVUVE9OOiAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJ0dWktYnRuLWRlbGV0ZVwiPlJlbW92ZTwvYnV0dG9uPidcbn07XG5cbi8qKlxuICogU2ltcGxlIGxpc3QgdGVtcGxhdGVcbiAqIEB0eXBlIHtvYmplY3R9XG4gKiBAaWdub3JlXG4gKi9cbm1vZHVsZS5leHBvcnRzLkxJU1RfVEVNUExBVEUgPSB7XG4gICAgQ09OVEFJTkVSOiAnPHVsIGNsYXNzPVwidHVpLXVwbG9hZC1sc3Qge3tsaXN0SXRlbXNDbGFzc05hbWV9fVwiPjwvdWw+JyxcbiAgICBMSVNUX0lURU06IFtcbiAgICAgICAgJzxsaSBjbGFzcz1cInR1aS11cGxvYWQtaXRlbVwiPicsXG4gICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ0dWktZmlsZW5hbWUtYXJlYVwiPicsXG4gICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwidHVpLWZpbGUtbmFtZVwiPnt7ZmlsZW5hbWV9fSAoe3tmaWxlc2l6ZX19KTwvc3Bhbj4nLFxuICAgICAgICAgICAgJzwvc3Bhbj4nLFxuICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwidHVpLWJ0bi1kZWxldGVcIj5yZW1vdmU8L2J1dHRvbj4nLFxuICAgICAgICAnPC9saT4nXG4gICAgXS5qb2luKCcnKVxufTtcblxuLyoqXG4gKiBUYWJsZSBsaXN0IHRlbXBsYXRlXG4gKiBAdHlwZSB7b2JqZWN0fVxuICogQGlnbm9yZVxuICovXG5tb2R1bGUuZXhwb3J0cy5UQUJMRV9URU1QTEFURSA9IHtcbiAgICBDT05UQUlORVI6IFtcbiAgICAgICAgJzx0YWJsZSBjbGFzcz1cInR1aS1maWxlLXVwbG9hZGVyLXRibFwiPicsXG4gICAgICAgICAgICAnPGNhcHRpb24+PHNwYW4+RmlsZSBVcGxvYWRlciBMaXN0PC9zcGFuPjwvY2FwdGlvbj4nLFxuICAgICAgICAgICAgJzxjb2xncm91cD4nLFxuICAgICAgICAgICAgICAgICc8Y29sIHdpZHRoPVwiMzJcIj4nLFxuICAgICAgICAgICAgICAgICc8Y29sIHdpZHRoPVwiMTU2XCI+JyxcbiAgICAgICAgICAgICAgICAnPGNvbCB3aWR0aD1cIjM2MlwiPicsXG4gICAgICAgICAgICAgICAgJzxjb2wgd2lkdGg9XCJcIj4nLFxuICAgICAgICAgICAgJzwvY29sZ3JvdXA+JyxcbiAgICAgICAgICAgICc8dGhlYWQgY2xhc3M9XCJ0dWktZm9ybS1oZWFkZXJcIj4nLFxuICAgICAgICAgICAgICAgICc8dHI+JyxcbiAgICAgICAgICAgICAgICAgICAgJzx0aCBzY29wZT1cImNvbFwiPicsXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwidHVpLWNoZWNrYm94XCI+JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ0dWktaWNvLWNoZWNrXCI+PGlucHV0IHR5cGU9XCJjaGVja2JveFwiPjwvc3Bhbj4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvbGFiZWw+JyxcbiAgICAgICAgICAgICAgICAgICAgJzwvdGg+JyxcbiAgICAgICAgICAgICAgICAgICAgJzx0aCBzY29wZT1cImNvbFwiPkZpbGUgVHlwZTwvdGg+JyxcbiAgICAgICAgICAgICAgICAgICAgJzx0aCBzY29wZT1cImNvbFwiPkZpbGUgTmFtZTwvdGg+JyxcbiAgICAgICAgICAgICAgICAgICAgJzx0aCBzY29wZT1cImNvbFwiPkZpbGUgU2l6ZTwvdGg+JyxcbiAgICAgICAgICAgICAgICAnPC90cj4nLFxuICAgICAgICAgICAgJzwvdGhlYWQ+JyxcbiAgICAgICAgICAgICc8dGJvZHkgY2xhc3M9XCJ0dWktZm9ybS1ib2R5IHt7bGlzdEl0ZW1zQ2xhc3NOYW1lfX1cIj48L3Rib2R5PicsXG4gICAgICAgICc8L3RhYmxlPidcbiAgICBdLmpvaW4oJycpLFxuICAgIExJU1RfSVRFTTogW1xuICAgICAgICAnPHRyPicsXG4gICAgICAgICAgICAnPHRkPicsXG4gICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cInR1aS1jaGVja2JveFwiPicsXG4gICAgICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cInR1aS1pY28tY2hlY2tcIj48aW5wdXQgdHlwZT1cImNoZWNrYm94XCI+PC9zcGFuPicsXG4gICAgICAgICAgICAgICAgJzwvbGFiZWw+JyxcbiAgICAgICAgICAgICc8L3RkPicsXG4gICAgICAgICAgICAnPHRkPnt7ZmlsZXR5cGV9fTwvdGQ+JyxcbiAgICAgICAgICAgICc8dGQ+e3tmaWxlbmFtZX19PC90ZD4nLFxuICAgICAgICAgICAgJzx0ZD57e2ZpbGVzaXplfX08L3RkPicsXG4gICAgICAgICc8L3RyPidcbiAgICBdLmpvaW4oJycpXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY29uc3RzID0gcmVxdWlyZSgnLi9jb25zdHMnKTtcblxudmFyIHNuaXBwZXQgPSB0dWkudXRpbDtcbnZhciBmb3JFYWNoID0gc25pcHBldC5mb3JFYWNoO1xudmFyIGhhc1N0YW1wID0gc25pcHBldC5oYXNTdGFtcDtcbnZhciBzdGFtcCA9IHNuaXBwZXQuc3RhbXA7XG5cbnZhciBISURERU5fRklMRV9JTlBVVF9DTEFTUyA9IGNvbnN0cy5DTEFTU05BTUUuSElEREVOX0ZJTEVfSU5QVVQ7XG5cbi8qKlxuICogVGhlIHBvb2wgZm9yIHNhdmUgZmlsZXMuXG4gKiBJdCdzIG9ubHkgZm9yIGlucHV0W2ZpbGVdIGVsZW1lbnQgc2F2ZSBhdCBicm93c2VyIHRoYXQgZG9lcyBub3Qgc3VwcG9ydCBmaWxlIGFwaS5cbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHBsYW5ldCAtIEZvcm0gZWxlbWVudFxuICogQGNsYXNzIFBvb2xcbiAqIEBpZ25vcmVcbiAqL1xudmFyIFBvb2wgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFBvb2wucHJvdG90eXBlICove1xuICAgIGluaXQ6IGZ1bmN0aW9uKHBsYW5ldCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogU3VibWl0dGVyIGZvciBmaWxlIGVsZW1lbnQgdG8gc2VydmVyXG4gICAgICAgICAqIEZvcm0gZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnBsYW5ldCA9IHBsYW5ldDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRmlsZSBkYXRhIHN0cnVjdHVyZSBvYmplY3RcbiAgICAgICAgICogIGtleT1uYW1lIDogdmFsdWU9aXVwdXRbdHlwZT1maWxlXShFbGVtZW50KVxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5maWxlcyA9IHt9O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTYXZlIGEgaW5wdXQgZWxlbWVudFt0eXBlPWZpbGVdLCBhcyB2YWx1ZSBvZiBmaWxlIG5hbWUuXG4gICAgICogQHBhcmFtIHtIVE1MSW5wdXRFbGVtZW50fSBpbnB1dEZpbGVFbCBBIGlucHV0IGVsZW1lbnQgdGhhdCBoYXZlIHRvIGJlIHNhdmVkXG4gICAgICovXG4gICAgc3RvcmU6IGZ1bmN0aW9uKGlucHV0RmlsZUVsKSB7XG4gICAgICAgIHZhciBpZCA9IGhhc1N0YW1wKGlucHV0RmlsZUVsKSAmJiBzdGFtcChpbnB1dEZpbGVFbCk7XG4gICAgICAgIHZhciBmaWxlbmFtZSwga2V5O1xuXG4gICAgICAgIGlmICghaWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBmaWxlbmFtZSA9IGlucHV0RmlsZUVsLnZhbHVlO1xuICAgICAgICBrZXkgPSBpZCArIGZpbGVuYW1lO1xuXG4gICAgICAgIHRoaXMuZmlsZXNba2V5XSA9IGlucHV0RmlsZUVsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBpbnB1dCBlbGVtZW50W3R5cGU9ZmlsZV0gZnJvbSBwb29sLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgLSBBIGZpbGUgbmFtZSB0aGF0IGhhdmUgdG8gYmUgcmVtb3ZlZC5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gcmVzdWx0XG4gICAgICovXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICAgICAgdmFyIGtleSA9IHBhcmFtcy5pZCArIHBhcmFtcy5uYW1lO1xuICAgICAgICB2YXIgZWxlbWVudCA9IHRoaXMuZmlsZXNba2V5XTtcblxuICAgICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlbGV0ZSB0aGlzLmZpbGVzW2tleV07XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEVtcHR5IHBvb2xcbiAgICAgKi9cbiAgICBlbXB0eTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZmlsZXMgPSB7fTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUGxhbnQgZmlsZXMgb24gcG9vbCB0byBmb3JtIGlucHV0XG4gICAgICovXG4gICAgcGxhbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcGxhbmV0ID0gdGhpcy5wbGFuZXQ7XG4gICAgICAgIGZvckVhY2godGhpcy5maWxlcywgZnVuY3Rpb24oZWxlbWVudCwga2V5KSB7XG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTmFtZSA9IEhJRERFTl9GSUxFX0lOUFVUX0NMQVNTO1xuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgcGxhbmV0LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuZmlsZXNba2V5XTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUG9vbDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNvbnN0cyA9IHJlcXVpcmUoJy4uL2NvbnN0cycpO1xuXG52YXIgVFlQRSA9IGNvbnN0cy5DT05GLlJFUVVFU1RFUl9UWVBFX01PREVSTjtcbnZhciBmb3JFYWNoID0gdHVpLnV0aWwuZm9yRWFjaDtcblxuLyoqXG4gKiBNb2Rlcm4gcmVxdWVzdGVyXG4gKiBAcGFyYW0ge1VwbG9hZGVyfSB1cGxvYWRlciAtIFVwbG9hZGVyXG4gKiBAY2xhc3NcbiAqIEBpZ25vcmVcbiAqL1xudmFyIE1vZGVybiA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgTW9kZXJuLnByb3RvdHlwZSAqL3tcbiAgICBpbml0OiBmdW5jdGlvbih1cGxvYWRlcikge1xuICAgICAgICAvKipcbiAgICAgICAgICogVXBsb2FkZXJcbiAgICAgICAgICogQHR5cGUge1VwbG9hZGVyfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy51cGxvYWRlciA9IHVwbG9hZGVyO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGcm9tIHZpZXdcbiAgICAgICAgICogQHR5cGUge0Zvcm19XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZvcm1WaWV3ID0gdXBsb2FkZXIuZm9ybVZpZXc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExvY2FsIHBvb2wgZm9yIGZpbGVzXG4gICAgICAgICAqIEB0eXBlIHtBcnJheS48RmlsZT59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnBvb2wgPSBbXTtcblxuICAgICAgICBpZiAodXBsb2FkZXIuaXNCYXRjaFRyYW5zZmVyKSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE92ZXJyaWRlIHJlbW92ZSBmdW5jdGlvbiBmb3IgYmF0Y2ggdHJhbnNmZXJcbiAgICAgICAgICAgICAqIEB0eXBlIHtPbGQuX3JlbW92ZVdoZW5CYXRjaH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUgPSB0aGlzLl9yZW1vdmVXaGVuQmF0Y2g7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVxdWVzdGVyIHR5cGVcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIFRZUEU6IFRZUEUsXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIGZvciB1cGxvYWQgZXJyb3JcbiAgICAgKiBAcGFyYW0ge09iamVjdH0ganFYSFIgLSBqUXVlcnkgWEhSXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0YXR1cyAtIEFqYXggU3RhdHVzXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG1zZ1Rocm93biAtIEVycm9yIG1lc3NhZ2VcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF91cGxvYWRFcnJvcjogZnVuY3Rpb24oanFYSFIsIHN0YXR1cywgbXNnVGhyb3duKSB7XG4gICAgICAgIHRoaXMuZmlyZSgnZXJyb3InLCB7XG4gICAgICAgICAgICBzdGF0dXM6IHN0YXR1cyxcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1zZ1Rocm93blxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciBmb3IgdXBsb2FkIHN1Y2Nlc3NcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIFVwbG9hZCBzdWNjZXNzIGRhdGFcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF91cGxvYWRTdWNjZXNzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHRoaXMuZmlyZSgndXBsb2FkZWQnLCBKU09OLnBhcnNlKGRhdGEpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RvcmUgZmlsZXMgdG8gbG9jYWwgcG9vbFxuICAgICAqIEBwYXJhbSB7QXJyYXkuPEZpbGU+IHwgRmlsZX0gW2ZpbGVzXSAtIEEgZmlsZSBvciBmaWxlc1xuICAgICAqL1xuICAgIHN0b3JlOiBmdW5jdGlvbihmaWxlcykge1xuICAgICAgICB2YXIgcG9vbCA9IHRoaXMucG9vbDtcbiAgICAgICAgdmFyIHN0YW1wID0gdHVpLnV0aWwuc3RhbXA7XG4gICAgICAgIHZhciBkYXRhID0gW107XG5cbiAgICAgICAgZmlsZXMgPSB0dWkudXRpbC50b0FycmF5KGZpbGVzIHx8IHRoaXMuZm9ybVZpZXcuJGZpbGVJbnB1dFswXS5maWxlcyk7XG4gICAgICAgIGZvckVhY2goZmlsZXMsIGZ1bmN0aW9uKGZpbGUpIHtcbiAgICAgICAgICAgIHZhciBpZCA9IHN0YW1wKGZpbGUpO1xuICAgICAgICAgICAgcG9vbC5wdXNoKGZpbGUpO1xuICAgICAgICAgICAgZGF0YS5wdXNoKHtcbiAgICAgICAgICAgICAgICBpZDogaWQsXG4gICAgICAgICAgICAgICAgbmFtZTogZmlsZS5uYW1lLFxuICAgICAgICAgICAgICAgIHNpemU6IGZpbGUuc2l6ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuZm9ybVZpZXcucmVzZXRGaWxlSW5wdXQoKTtcbiAgICAgICAgdGhpcy5maXJlKCdzdG9yZWQnLCBkYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBsb2FkIGFqYXhcbiAgICAgKi9cbiAgICB1cGxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZmllbGQgPSB0aGlzLmZvcm1WaWV3LiRmaWxlSW5wdXQuYXR0cignbmFtZScpO1xuICAgICAgICB2YXIgJGZvcm0gPSB0aGlzLmZvcm1WaWV3LiRlbC5jbG9uZSgpO1xuICAgICAgICB2YXIgZm9ybURhdGE7XG5cbiAgICAgICAgJGZvcm0uZmluZCgnaW5wdXRbdHlwZT1cImZpbGVcIl0nKS5yZW1vdmUoKTtcbiAgICAgICAgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoJGZvcm1bMF0pO1xuXG4gICAgICAgIGZvckVhY2godGhpcy5wb29sLCBmdW5jdGlvbihmaWxlKSB7XG4gICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoZmllbGQsIGZpbGUpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiB0aGlzLnVwbG9hZGVyLnVybC5zZW5kLFxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgZGF0YTogZm9ybURhdGEsXG4gICAgICAgICAgICBzdWNjZXNzOiAkLnByb3h5KHRoaXMuX3VwbG9hZFN1Y2Nlc3MsIHRoaXMpLFxuICAgICAgICAgICAgZXJyb3I6ICQucHJveHkodGhpcy5fdXBsb2FkRXJyb3IsIHRoaXMpLFxuICAgICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBmaWxlIChhamF4LWpzb25wKVxuICAgICAqIEl0IGlzIG5vdCB1c2VkIGZvciBiYXRjaCB0cmFuc2Zlci5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIC0gUGFyYW1ldGVycyB0byByZW1vdmUgZmlsZVxuICAgICAqL1xuICAgIHJlbW92ZTogZnVuY3Rpb24ocGFyYW1zKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHRoaXMudXBsb2FkZXIudXJsLnJlbW92ZSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbnAnLFxuICAgICAgICAgICAgZGF0YTogcGFyYW1zLFxuICAgICAgICAgICAgc3VjY2VzczogJC5wcm94eShmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdyZW1vdmVkJywgZGF0YSk7XG4gICAgICAgICAgICB9LCB0aGlzKVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpbGUgKGFqYXgtanNvbnApXG4gICAgICogSXQgaXMgdXNlZCBmb3IgYmF0Y2ggdHJhbnNmZXIuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyAtIFBhcmFtZXRlcnMgdG8gcmVtb3ZlIGZpbGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW1vdmVXaGVuQmF0Y2g6IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAgICB2YXIgcmVzdWx0ID0gZmFsc2U7XG5cbiAgICAgICAgZm9yRWFjaChwYXJhbXMuZmlsZWxpc3QsIGZ1bmN0aW9uKGZpbGUpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHRoaXMuX3JlbW92ZUZpbGVJblBvb2woZmlsZSk7XG4gICAgICAgICAgICBmaWxlLnN0YXRlID0gcmVzdWx0O1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZWQnLCB0dWkudXRpbC5leHRlbmQoe1xuICAgICAgICAgICAgbWVzc2FnZTogcmVzdWx0ID8gJ3N1Y2Nlc3MnIDogJ2ZhaWwnXG4gICAgICAgIH0sIHBhcmFtcykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZmlsZSBpbiBwb29sXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSBGaWxlIGRhdGFcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmVtb3ZlZCBzdGF0ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgLyplc2xpbnQtZGlzYWJsZSBjb25zaXN0ZW50LXJldHVybiovXG4gICAgX3JlbW92ZUZpbGVJblBvb2w6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIHBvb2wgPSB0aGlzLnBvb2w7XG4gICAgICAgIHZhciBoYXNTdGFtcCA9IHR1aS51dGlsLmhhc1N0YW1wO1xuICAgICAgICB2YXIgc3RhbXAgPSB0dWkudXRpbC5zdGFtcDtcbiAgICAgICAgdmFyIHJlc3VsdCA9IGZhbHNlO1xuXG4gICAgICAgIGZvckVhY2gocG9vbCwgZnVuY3Rpb24oZmlsZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmIChoYXNTdGFtcChmaWxlKSAmJiAoc3RhbXAoZmlsZSkgPT09IGRhdGEuaWQpKSB7XG4gICAgICAgICAgICAgICAgcG9vbC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcbiAgICAvKmVzbGludC1lbmFibGUgY29uc2lzdGVudC1yZXR1cm4qL1xuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgdGhlIHBvb2xcbiAgICAgKi9cbiAgICBjbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucG9vbC5sZW5ndGggPSAwO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oTW9kZXJuKTtcbm1vZHVsZS5leHBvcnRzID0gTW9kZXJuO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUG9vbCA9IHJlcXVpcmUoJy4uL3Bvb2wnKSxcbiAgICBjb25zdHMgPSByZXF1aXJlKCcuLi9jb25zdHMnKTtcblxudmFyIFRZUEUgPSBjb25zdHMuQ09ORi5SRVFVRVNURVJfVFlQRV9PTEQ7XG5cbi8qKlxuICogT2xkIHJlcXVlc3RlclxuICogQHBhcmFtIHtVcGxvYWRlcn0gdXBsb2FkZXIgLSBVcGxvYWRlclxuICogQGNsYXNzXG4gKiBAaWdub3JlXG4gKi9cbnZhciBPbGQgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIE9sZC5wcm90b3R5cGUgKi97XG4gICAgaW5pdDogZnVuY3Rpb24odXBsb2FkZXIpIHtcbiAgICAgICAgdmFyICRoaWRkZW5GcmFtZSA9IHVwbG9hZGVyLiR0YXJnZXRGcmFtZTtcbiAgICAgICAgdmFyIGZvcm1WaWV3ID0gdXBsb2FkZXIuZm9ybVZpZXc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFVwbG9hZGVyXG4gICAgICAgICAqIEB0eXBlIHtVcGxvYWRlcn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudXBsb2FkZXIgPSB1cGxvYWRlcjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRnJvbSB2aWV3XG4gICAgICAgICAqIEB0eXBlIHtGb3JtfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5mb3JtVmlldyA9IGZvcm1WaWV3O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMb2NhbCBwb29sIGZvciBmaWxlIGVsZW1lbnRzXG4gICAgICAgICAqIEB0eXBlIHtQb29sfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wb29sID0gbmV3IFBvb2woZm9ybVZpZXcuJGVsWzBdKTtcblxuICAgICAgICBpZiAodXBsb2FkZXIuaXNCYXRjaFRyYW5zZmVyKSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE92ZXJyaWRlIFVwbG9hZCBmdW5jdGlvbiBmb3IgYmF0Y2ggdHJhbnNmZXJcbiAgICAgICAgICAgICAqIEB0eXBlIHtPbGQuX3VwbG9hZFdoZW5CYXRjaH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy51cGxvYWQgPSB0aGlzLl91cGxvYWRXaGVuQmF0Y2g7XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogT3ZlcnJpZGUgcmVtb3ZlIGZ1bmN0aW9uIGZvciBiYXRjaCB0cmFuc2ZlclxuICAgICAgICAgICAgICogQHR5cGUge09sZC5fcmVtb3ZlV2hlbkJhdGNofVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLnJlbW92ZSA9IHRoaXMuX3JlbW92ZVdoZW5CYXRjaDtcbiAgICAgICAgfVxuXG4gICAgICAgICRoaWRkZW5GcmFtZS5vbignbG9hZCcsICQucHJveHkodGhpcy5fb25Mb2FkSGlkZGVuRnJhbWUsIHRoaXMsICRoaWRkZW5GcmFtZSkpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0ZXIgdHlwZVxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgVFlQRTogVFlQRSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXJcbiAgICAgKiBcImxvYWRcIiBvZiBoaWRkZW4gZnJhbWUuXG4gICAgICogQHBhcmFtIHtqUXVlcnl9ICRoaWRkZW5GcmFtZSAtIEhpZGRlbiBpZnJhbWVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vbkxvYWRIaWRkZW5GcmFtZTogZnVuY3Rpb24oJGhpZGRlbkZyYW1lKSB7XG4gICAgICAgIHZhciBmcmFtZUJvZHk7XG4gICAgICAgIHZhciBkYXRhO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBmcmFtZUJvZHkgPSAkaGlkZGVuRnJhbWVbMF0uY29udGVudFdpbmRvdy5kb2N1bWVudC5ib2R5O1xuICAgICAgICAgICAgZGF0YSA9IHR1aS51dGlsLnBpY2soZnJhbWVCb2R5LCAnZmlyc3RDaGlsZCcsICdkYXRhJyk7XG4gICAgICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgndXBsb2FkZWQnLCAkLnBhcnNlSlNPTihkYXRhKSk7XG4gICAgICAgICAgICAgICAgZnJhbWVCb2R5LmlubmVySFRNTCA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ2Vycm9yJywge1xuICAgICAgICAgICAgICAgIHN0YXR1czogZS5uYW1lLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGUubWVzc2FnZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RvcmUgZmlsZSBpbnB1dCBlbGVtZW50IGZyb20gdXBsb2FkIGZvcm1cbiAgICAgKi9cbiAgICBzdG9yZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbCA9IHRoaXMuZm9ybVZpZXcuJGZpbGVJbnB1dFswXTtcbiAgICAgICAgdmFyIGlkID0gdHVpLnV0aWwuc3RhbXAoZWwpO1xuXG4gICAgICAgIHRoaXMucG9vbC5zdG9yZShlbCk7XG4gICAgICAgIHRoaXMuZm9ybVZpZXcucmVzZXRGaWxlSW5wdXQoKTtcblxuICAgICAgICB0aGlzLmZpcmUoJ3N0b3JlZCcsIFt7XG4gICAgICAgICAgICBpZDogaWQsXG4gICAgICAgICAgICBuYW1lOiBlbC52YWx1ZSxcbiAgICAgICAgICAgIHNpemU6ICcnXG4gICAgICAgIH1dKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBsb2FkLlxuICAgICAqIEl0IGlzIG5vdCB1c2VkIGZvciBiYXRjaCB0cmFuc2Zlci5cbiAgICAgKi9cbiAgICB1cGxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnBvb2wucGxhbnQoKTtcbiAgICAgICAgdGhpcy5mb3JtVmlldy4kZWwuc3VibWl0KCk7XG4gICAgICAgIHRoaXMuZm9ybVZpZXcuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGxvYWQuXG4gICAgICogSXQgaXMgdXNlZCBmb3IgYmF0Y2ggdHJhbnNmZXIuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfdXBsb2FkV2hlbkJhdGNoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5wb29sLnBsYW50KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBmaWxlIChhamF4LWpzb25wKVxuICAgICAqIEl0IGlzIG5vdCB1c2VkIGZvciBiYXRjaCB0cmFuc2Zlci5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIC0gUGFyYW1ldGVycyB0byByZW1vdmUgZmlsZVxuICAgICAqL1xuICAgIHJlbW92ZTogZnVuY3Rpb24ocGFyYW1zKSB7XG4gICAgICAgIHZhciB1cGxvYWRlciA9IHRoaXMudXBsb2FkZXI7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHVwbG9hZGVyLnVybC5yZW1vdmUsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb25wJyxcbiAgICAgICAgICAgIGRhdGE6IHBhcmFtcyxcbiAgICAgICAgICAgIHN1Y2Nlc3M6ICQucHJveHkoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgncmVtb3ZlZCcsIGRhdGEpO1xuICAgICAgICAgICAgfSwgdGhpcylcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBmaWxlIChhamF4LWpzb25wKVxuICAgICAqIEl0IGlzIHVzZWQgZm9yIGJhdGNoIHRyYW5zZmVyLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgLSBQYXJhbWV0ZXJzIHRvIHJlbW92ZSBmaWxlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlV2hlbkJhdGNoOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IGZhbHNlO1xuXG4gICAgICAgIHR1aS51dGlsLmZvckVhY2gocGFyYW1zLmZpbGVsaXN0LCBmdW5jdGlvbihmaWxlKSB7XG4gICAgICAgICAgICByZXN1bHQgPSB0aGlzLnBvb2wucmVtb3ZlKGZpbGUpO1xuICAgICAgICAgICAgZmlsZS5zdGF0ZSA9IHJlc3VsdDtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgdGhpcy5maXJlKCdyZW1vdmVkJywgdHVpLnV0aWwuZXh0ZW5kKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IHJlc3VsdCA/ICdzdWNjZXNzJyA6ICdmYWlsJ1xuICAgICAgICB9LCBwYXJhbXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgdGhlIHBvb2xcbiAgICAgKi9cbiAgICBjbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucG9vbC5lbXB0eSgpO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oT2xkKTtcbm1vZHVsZS5leHBvcnRzID0gT2xkO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY29uc3RzID0gcmVxdWlyZSgnLi9jb25zdHMnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBGb3JtID0gcmVxdWlyZSgnLi92aWV3L2Zvcm0nKTtcbnZhciBMaXN0ID0gcmVxdWlyZSgnLi92aWV3L2xpc3QnKTtcbnZhciBEcmFnQW5kRHJvcCA9IHJlcXVpcmUoJy4vdmlldy9kcmFnJyk7XG52YXIgT2xkUmVxdWVzdGVyID0gcmVxdWlyZSgnLi9yZXF1ZXN0ZXIvb2xkJyk7XG52YXIgTW9kZXJuUmVxdWVzdGVyID0gcmVxdWlyZSgnLi9yZXF1ZXN0ZXIvbW9kZXJuJyk7XG5cbnZhciBSRVFVRVNURVJfVFlQRV9NT0RFUk4gPSBjb25zdHMuQ09ORi5SRVFVRVNURVJfVFlQRV9NT0RFUk47XG52YXIgY2xhc3NOYW1lcyA9IGNvbnN0cy5DTEFTU05BTUU7XG5cbi8qKlxuICogRmlsZVVwbG9hZGVyIGNvbXBvbmVudCBjb250cm9sbGVyXG4gKiBAY2xhc3MgVXBsb2FkZXJcbiAqIEBwYXJhbSB7alF1ZXJ5fSBjb250YWluZXIgLSBDb250YWluZXIgZWxlbWVudCB0byBnZW5lcmF0ZSBjb21wb25lbnRcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIC0gT3B0aW9uc1xuICogICAgIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLnVybCAtIEZpbGUgc2VydmVyIHVybHNcbiAqICAgICAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMudXJsLnNlbmQgLSBTZW5kIGZpbGVzIHVybFxuICogICAgICAgICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy51cmwucmVtb3ZlIC0gUmVtb3ZlIGZpbGVzIHVybFxuICogICAgIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuaXNNdWx0aXBsZV0gVXNlIG11bHRpcGxlIGZpbGVzIHVwbG9hZFxuICogICAgIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudXNlRm9sZGVyXSAtIFVzZSBkaXJlY3RvcnkgdXBsb2FkLiBJZiB0dXJlLCAnaXNNdWx0aXBsZScgb3B0aW9uIHdpbGwgYmUgaWdub3JlZFxuICogICAgIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudXNlRHJhZ10gLSBVc2UgZmlsZSBkcmFnIGFuZCBkcm9wXG4gKiAgICAgQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMubGlzdFVJIC0gTGlzdCBhcmVhIHByZXNldFxuICogICAgICAgICBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy5saXN0VUkudHlwZSAtIExpc3QgdHlwZSAoJ3NpbXBsZScgb3IgJ3RhYmxlJylcbiAqICAgICAgICAgQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zLmxpc3RVSS5pdGVtXSAtIFRvIGN1c3RvbWl6ZSBpdGVtIGNvbnRlbnRzIHdoZW4gbGlzdCB0eXBlIGlzICdzaW1wbGUnXG4gKiAgICAgICAgIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucy5saXN0VUkuY29sdW1uTGlzdF0gLSBUbyBjdXN0b21pemUgcm93IGNvbnRlbnRzIHdoZW4gbGlzdCB0eXBlIGlzICd0YWJsZSdcbiAqIEBleGFtcGxlXG4gKiAvLyBDYXNlIDE6IFVzaW5nIG5vcm1hbCB0cmFuc2ZlciAmIHNpbXBsZSBsaXN0XG4gKiAvL1xuICogLy8gPCEtLSBIVE1MIC0tPlxuICogLy8gPGRpdiBpZD1cInVwbG9hZGVyXCI+XG4gKiAvLyAgICAgPGlucHV0IHR5cGU9XCJmaWxlXCIgbmFtZT1cInVzZXJmaWxlW11cIj5cbiAqIC8vICAgICA8ZGl2IGNsYXNzPVwidHVpLWpzLWZpbGUtdXBsb2FkZXItbGlzdFwiPjwvZGl2PlxuICogLy8gPC9kaXY+XG4gKiAvL1xuICogdmFyIHVwbG9hZGVyID0gbmV3IHR1aS5jb21wb25lbnQuRmlsZVVwbG9hZGVyKCQoJyN1cGxvYWRlcicpLCB7XG4gKiAgICAgdXJsOiB7XG4gKiAgICAgICAgIHNlbmQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDAvdXBsb2FkJyxcbiAqICAgICAgICAgcmVtb3ZlOiAnaHR0cDovL2xvY2FsaG9zdDozMDAwL3JlbW92ZSdcbiAqICAgICB9LFxuICogICAgIGlzQmF0Y2hUcmFuc2ZlcjogZmFsc2UsXG4gKiAgICAgbGlzdFVJOiB7XG4gKiAgICAgICAgIHR5cGU6ICdzaW1wbGUnXG4gKiAgICAgfVxuICogfSk7XG4gKlxuICogLy8gQ2FzZSAyOiBVc2luZyBiYXRjaCB0cmFuc2ZlciAmIHRhYmxlIGxpc3QgJiBtYWtlIGRyb3B6b25lXG4gKiAvL1xuICogLy8gPCEtLSBIVE1MIC0tPlxuICogLy8gPGRpdiBpZD1cInVwbG9hZGVyXCI+XG4gKiAvLyAgICAgPGlucHV0IHR5cGU9XCJmaWxlXCIgbmFtZT1cInVzZXJmaWxlW11cIj5cbiAqIC8vICAgICA8ZGl2IGNsYXNzPVwidHVpLWpzLWZpbGUtdXBsb2FkZXItbGlzdCB0dWktanMtZmlsZS11cGxvYWRlci1kcm9wem9uZVwiPjwvZGl2PlxuICogLy8gICAgIDxidXR0b24gdHlwZT1cInN1Ym1pdFwiPlVwbG9hZDwvYnV0dG9uPlxuICogLy8gPC9kaXY+XG4gKiAvL1xuICogdmFyIHVwbG9hZGVyID0gbmV3IHR1aS5jb21wb25lbnQuRmlsZVVwbG9hZGVyKCQoJyN1cGxvYWRlcicpLCB7XG4gKiAgICAgdXJsOiB7XG4gKiAgICAgICAgIHNlbmQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDAvdXBsb2FkJyxcbiAqICAgICAgICAgcmVtb3ZlOiAnaHR0cDovL2xvY2FsaG9zdDozMDAwL3JlbW92ZSdcbiAqICAgICB9LFxuICogICAgIGlzQmF0Y2hUcmFuc2ZlcjogdHJ1ZSxcbiAqICAgICB1c2VEcmFnOiB0cnVlLFxuICogICAgIGxpc3RVSToge1xuICogICAgICAgICB0eXBlOiAndGFibGUnXG4gKiAgICAgfVxuICogfSk7XG4gKi9cbnZhciBVcGxvYWRlciA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKkBsZW5kcyBVcGxvYWRlci5wcm90b3R5cGUgKi97XG4gICAgaW5pdDogZnVuY3Rpb24oJGNvbnRhaW5lciwgb3B0aW9ucykge1xuICAgICAgICAvKipcbiAgICAgICAgICogVXBsb2FkZXIgZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kZWwgPSAkY29udGFpbmVyO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZW5kL1JlbW92ZSB1cmxcbiAgICAgICAgICogQHR5cGUge3tzZW5kOiBzdHJpbmcsIHJlbW92ZTogc3RyaW5nfX1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudXJsID0gb3B0aW9ucy51cmw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlZGlyZWN0IFVSTCBmb3IgQ09SUyhyZXNwb25zZSwgSUU3KVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZWRpcmVjdFVSTCA9IG9wdGlvbnMucmVkaXJlY3RVUkw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZvcm0gdGFyZ2V0IG5hbWUgZm9yIENPUlMgKElFNywgOCwgOSlcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZm9ybVRhcmdldCA9IGNvbnN0cy5DT05GLkZPUk1fVEFSR0VUX05BTUU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRhcmdldCBmcmFtZSBmb3IgQ09SUyAoSUU3LCA4LCA5KVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kdGFyZ2V0RnJhbWUgPSB0aGlzLl9jcmVhdGVUYXJnZXRGcmFtZSgpXG4gICAgICAgICAgICAuYXBwZW5kVG8odGhpcy4kZWwpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHRoZSB1cGxvYWRlciB1c2VzIGJhdGNoLXRyYW5zZmVyXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc0JhdGNoVHJhbnNmZXIgPSAhIShvcHRpb25zLmlzQmF0Y2hUcmFuc2Zlcik7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdoZXRoZXIgdGhlIHNlbmRpbmcvcmVtb3ZpbmcgdXJscyBhcmUgeC1kb21haW4uXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc0Nyb3NzRG9tYWluID0gdXRpbHMuaXNDcm9zc0RvbWFpbih0aGlzLnVybC5zZW5kKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0cyBQb3N0TWVzc2FnZSBBUElcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzU3VwcG9ydFBvc3RNZXNzYWdlID0gISEodHVpLnV0aWwucGljayh0aGlzLiR0YXJnZXRGcmFtZSwgJzAnLCAnY29udGVudFdpbmRvdycsICdwb3N0TWVzc2FnZScpKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciB0aGUgdXNlciB1c2VzIG11bHRpcGxlIHVwbG9hZFxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaXNNdWx0aXBsZSA9ICEhKG9wdGlvbnMuaXNNdWx0aXBsZSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdoZXRoZXIgdGhlIHVzZXIgdXNlcyBkcmFnJmRyb3AgdXBsb2FkXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy51c2VEcmFnID0gISEob3B0aW9ucy51c2VEcmFnKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciB0aGUgdXNlciB1c2VzIGZvbGRlciB1cGxvYWRcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnVzZUZvbGRlciA9ICEhKG9wdGlvbnMudXNlRm9sZGVyKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRnJvbSBWaWV3XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEB0eXBlIHtGb3JtfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5mb3JtVmlldyA9IG5ldyBGb3JtKHRoaXMpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMaXN0IFZpZXdcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICogQHR5cGUge0xpc3R9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmxpc3RWaWV3ID0gbmV3IExpc3QodGhpcy4kZWwuZmluZCgnLicgKyBjbGFzc05hbWVzLkxJU1RfQ09OVEFJTkVSKSwgb3B0aW9ucy5saXN0VUkpO1xuXG4gICAgICAgIGlmICh0aGlzLnVzZURyYWcgJiYgIXRoaXMudXNlRm9sZGVyICYmIHV0aWxzLmlzU3VwcG9ydEZpbGVTeXN0ZW0oKSkge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBEcmFnICYgRHJvcCBWaWV3XG4gICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICogQHR5cGUge0RyYWdBbmREcm9wfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLmRyYWdWaWV3ID0gbmV3IERyYWdBbmREcm9wKHRoaXMuJGVsLmZpbmQoJy4nICsgY2xhc3NOYW1lcy5EUk9QWk9ORSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc2V0UmVxdWVzdGVyKCk7XG4gICAgICAgIHRoaXMuX2FkZEV2ZW50KCk7XG5cbiAgICAgICAgaWYgKHRoaXMuaXNDcm9zc0RvbWFpbiAmJiB0aGlzLmlzU3VwcG9ydFBvc3RNZXNzYWdlKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRQb3N0TWVzc2FnZUV2ZW50KCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IENvbm5lY3RvclxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldFJlcXVlc3RlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh1dGlscy5pc1N1cHBvcnRGb3JtRGF0YSgpKSB7XG4gICAgICAgICAgICB0aGlzLl9yZXF1ZXN0ZXIgPSBuZXcgTW9kZXJuUmVxdWVzdGVyKHRoaXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fcmVxdWVzdGVyID0gbmV3IE9sZFJlcXVlc3Rlcih0aGlzKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgcG9zdC1tZXNzYWdlIGV2ZW50IGlmIHN1cHBvcnRlZCBhbmQgbmVlZGVkXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0UG9zdE1lc3NhZ2VFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJHRhcmdldEZyYW1lLm9mZignbG9hZCcpO1xuICAgICAgICAkKHdpbmRvdykub24oJ21lc3NhZ2UnLCAkLnByb3h5KGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgb3JpZ2luYWxFdmVudCA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQsXG4gICAgICAgICAgICAgICAgZGF0YTtcblxuICAgICAgICAgICAgaWYgKHRoaXMudXJsLnNlbmQuaW5kZXhPZihvcmlnaW5hbEV2ZW50Lm9yaWdpbikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGF0YSA9ICQucGFyc2VKU09OKG9yaWdpbmFsRXZlbnQuZGF0YSk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQmF0Y2hUcmFuc2Zlcikge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMaXN0KGRhdGEuZmlsZWxpc3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5maXJlKCdzdWNjZXNzJywgZGF0YSk7XG4gICAgICAgIH0sIHRoaXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSB0YXJnZXQgZnJhbWUgdG8gYmUgdGFyZ2V0IG9mIGZvcm0gZWxlbWVudC5cbiAgICAgKiBAcmV0dXJucyB7alF1ZXJ5fSBUYXJnZXQgZnJhbWU6IGpxdWVyeS1lbGVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY3JlYXRlVGFyZ2V0RnJhbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHRhcmdldCA9ICQoJzxpZnJhbWUgbmFtZT1cIicgKyB0aGlzLmZvcm1UYXJnZXQgKyAnXCI+PC9pZnJhbWU+Jyk7XG4gICAgICAgICR0YXJnZXQuY3NzKHtcbiAgICAgICAgICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nLFxuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuICR0YXJnZXQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudHMgdG8gdmlld3MgYW5kIGZpcmUgdXBsb2FkZXIgZXZlbnRzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmxpc3RWaWV3Lm9uKCdyZW1vdmUnLCB0aGlzLnJlbW92ZUZpbGUsIHRoaXMpO1xuICAgICAgICB0aGlzLmxpc3RWaWV3Lm9uKCdjaGVjaycsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2hlY2sgZXZlbnRcbiAgICAgICAgICAgICAqIEBldmVudCBVcGxvYWRlciNjaGVja1xuICAgICAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IGV2dCAtIEV2ZW50IG9iamVjdFxuICAgICAgICAgICAgICogIEBwYXJhbSB7c3RyaW5nfSBldnQuaWQgLSBGaWxlIGlkXG4gICAgICAgICAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IGV2dC5uYW1lIC0gRmlsZSBuYW1lXG4gICAgICAgICAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IGV2dC5zaXplIC0gRmlsZSBzaXplXG4gICAgICAgICAgICAgKiAgQHBhcmFtIHtib29sZWFufSBldnQuaXNDaGVja2VkIC0gQ2hlY2tlZCBzdGF0ZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLmZpcmUoJ2NoZWNrJywgZGF0YSk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICBpZiAodGhpcy5pc0JhdGNoVHJhbnNmZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX2FkZEV2ZW50V2hlbkJhdGNoVHJhbnNmZXIoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2FkZEV2ZW50V2hlbk5vcm1hbFRyYW5zZmVyKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IHdoZW4gdXBsb2FkZXIgdXNlcyBiYXRjaC10cmFuc2ZlclxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZEV2ZW50V2hlbkJhdGNoVHJhbnNmZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmZvcm1WaWV3Lm9uKHtcbiAgICAgICAgICAgIGNoYW5nZTogdGhpcy5zdG9yZSxcbiAgICAgICAgICAgIHN1Ym1pdDogdGhpcy5zdWJtaXRcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgdGhpcy5fcmVxdWVzdGVyLm9uKHtcbiAgICAgICAgICAgIHJlbW92ZWQ6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxpc3QoZGF0YS5maWxlbGlzdCwgJ3JlbW92ZScpO1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgncmVtb3ZlJywgZGF0YSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ2Vycm9yJywgZGF0YSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXBsb2FkZWQ6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdzdWNjZXNzJywgZGF0YSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RvcmVkOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMaXN0KGRhdGEpO1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgndXBkYXRlJywgZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIGlmICh0aGlzLnVzZURyYWcgJiYgdGhpcy5kcmFnVmlldykge1xuICAgICAgICAgICAgdGhpcy5kcmFnVmlldy5vbignZHJvcCcsIHRoaXMuc3RvcmUsIHRoaXMpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudCB3aGVuIHVwbG9hZGVyIHVzZXMgbm9ybWFsLXRyYW5zZmVyXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRXZlbnRXaGVuTm9ybWFsVHJhbnNmZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmZvcm1WaWV3Lm9uKCdjaGFuZ2UnLCB0aGlzLnNlbmRGaWxlLCB0aGlzKTtcblxuICAgICAgICB0aGlzLl9yZXF1ZXN0ZXIub24oe1xuICAgICAgICAgICAgcmVtb3ZlZDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGlzdChkYXRhLmZpbGVsaXN0LCAncmVtb3ZlJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdyZW1vdmUnLCBkYXRhKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgnZXJyb3InLCBkYXRhKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1cGxvYWRlZDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGlzdChkYXRhLmZpbGVsaXN0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3N1Y2Nlc3MnLCBkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgaWYgKHRoaXMudXNlRHJhZyAmJiB0aGlzLmRyYWdWaWV3KSB7XG4gICAgICAgICAgICB0aGlzLmRyYWdWaWV3Lm9uKCdkcm9wJywgZnVuY3Rpb24oZmlsZXMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0b3JlKGZpbGVzKTtcbiAgICAgICAgICAgICAgICB0aGlzLnN1Ym1pdCgpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGxpc3QgdmlldyB3aXRoIGN1c3RvbSBvciBvcmlnaW5hbCBkYXRhLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBpbmZvIC0gVGhlIGRhdGEgZm9yIHVwZGF0ZSBsaXN0XG4gICAgICogQHBhcmFtIHsqfSB0eXBlIC0gVXBkYXRlIHR5cGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHVwZGF0ZUxpc3Q6IGZ1bmN0aW9uKGluZm8sIHR5cGUpIHtcbiAgICAgICAgdGhpcy5saXN0Vmlldy51cGRhdGUoaW5mbywgdHlwZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZvciBjdXN0b20gc2VuZCBldmVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IFtldmVudF0gLSBGb3JtIHN1Ym1pdCBldmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc2VuZEZpbGU6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHRoaXMuc3RvcmUoKTtcbiAgICAgICAgdGhpcy5zdWJtaXQoZXZlbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmb3IgY3VzdG9tIHJlbW92ZSBldmVudFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIFRoZSBkYXRhIGZvciByZW1vdmUgZmlsZS5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHJlbW92ZUZpbGU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdGhpcy5fcmVxdWVzdGVyLnJlbW92ZShkYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3VibWl0IGZvciBkYXRhIHN1Ym1pdCB0byBzZXJ2ZXJcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBbZXZlbnRdIC0gRm9ybSBzdWJtaXQgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN1Ym1pdDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50ICYmIHRoaXMuX3JlcXVlc3Rlci5UWVBFID09PSBSRVFVRVNURVJfVFlQRV9NT0RFUk4pIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcmVxdWVzdGVyLnVwbG9hZCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdG9yZSBpbnB1dCBlbGVtZW50IHRvIHBvb2wuXG4gICAgICogQHBhcmFtIHtBcnJheS48RmlsZT4gfCBGaWxlfSBbZmlsZXNdIC0gQSBmaWxlIG9yIGZpbGVzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzdG9yZTogZnVuY3Rpb24oZmlsZXMpIHtcbiAgICAgICAgdGhpcy5fcmVxdWVzdGVyLnN0b3JlKGZpbGVzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgdXBsb2FkZXJcbiAgICAgKi9cbiAgICBjbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3JlcXVlc3Rlci5jbGVhcigpO1xuICAgICAgICB0aGlzLmZvcm1WaWV3LmNsZWFyKCk7XG4gICAgICAgIHRoaXMubGlzdFZpZXcuY2xlYXIoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGNoZWNrZWQgZmlsZSBsaXN0XG4gICAgICovXG4gICAgcmVtb3ZlQ2hlY2tlZExpc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbGlzdFZpZXcgPSB0aGlzLmxpc3RWaWV3O1xuICAgICAgICB2YXIgY2hla2NlZEluZGV4TGlzdCA9IGxpc3RWaWV3LmNoZWNrZWRJbmRleExpc3Q7XG4gICAgICAgIHZhciBmaWxlcyA9IGxpc3RWaWV3Lml0ZW1zO1xuICAgICAgICB2YXIgY2hlY2tlZEZpbGVzID0gW107XG4gICAgICAgIHZhciBmaWxlO1xuXG4gICAgICAgIHR1aS51dGlsLmZvckVhY2goY2hla2NlZEluZGV4TGlzdCwgZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgICAgIGZpbGUgPSBmaWxlc1tpbmRleF07XG5cbiAgICAgICAgICAgIGNoZWNrZWRGaWxlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBpZDogZmlsZS5pZCxcbiAgICAgICAgICAgICAgICBuYW1lOiBmaWxlLm5hbWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICBpZiAoY2hlY2tlZEZpbGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVGaWxlKHtmaWxlbGlzdDogY2hlY2tlZEZpbGVzfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHVwbG9hZGVkIGZpbGUncyB0b3RhbCBjb3VudFxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFRvdGFsIGNvdW50XG4gICAgICovXG4gICAgZ2V0VXBsb2FkZWRUb3RhbENvdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdFZpZXcuaXRlbXMubGVuZ3RoO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdXBsb2FkZWQgZmlsZSdzIHRvdGFsIHNpemVcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBUb3RhbCBzaXplIHdpdGggdW5pdFxuICAgICAqL1xuICAgIGdldFVwbG9hZGVkVG90YWxTaXplOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGl0ZW1zID0gdGhpcy5saXN0Vmlldy5pdGVtcztcbiAgICAgICAgdmFyIHRvdGFsU2l6ZSA9IDA7XG5cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChpdGVtcywgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgdG90YWxTaXplICs9IHBhcnNlRmxvYXQoaXRlbS5zaXplKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHV0aWxzLmdldEZpbGVTaXplV2l0aFVuaXQodG90YWxTaXplKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGNoZWNrZWQgZmlsZSdzIHRvdGFsIGNvdW50XG4gICAgICogQHJldHVybnMge251bWJlcn0gVG90YWwgY291bnRcbiAgICAgKi9cbiAgICBnZXRDaGVja2VkVG90YWxDb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxpc3RWaWV3LmNoZWNrZWRJbmRleExpc3QubGVuZ3RoO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY2hlY2tlZCBmaWxlJ3MgdG90YWwgc2l6ZVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFRvdGFsIHNpemUgd2l0aCB1bml0XG4gICAgICovXG4gICAgZ2V0Q2hlY2tlZFRvdGFsU2l6ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBsaXN0VmlldyA9IHRoaXMubGlzdFZpZXc7XG4gICAgICAgIHZhciBjaGVja2VkSXRlbXNJbmRleCA9IGxpc3RWaWV3LmNoZWNrZWRJbmRleExpc3Q7XG4gICAgICAgIHZhciB0b3RhbFNpemUgPSAwO1xuICAgICAgICB2YXIgaXRlbTtcblxuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKGNoZWNrZWRJdGVtc0luZGV4LCBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAgICAgaXRlbSA9IGxpc3RWaWV3Lml0ZW1zW2luZGV4XTtcbiAgICAgICAgICAgIHRvdGFsU2l6ZSArPSBwYXJzZUZsb2F0KGl0ZW0uc2l6ZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB1dGlscy5nZXRGaWxlU2l6ZVdpdGhVbml0KHRvdGFsU2l6ZSk7XG4gICAgfVxufSk7XG5cbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihVcGxvYWRlcik7XG5tb2R1bGUuZXhwb3J0cyA9IFVwbG9hZGVyO1xuXG4vKipcbiAqIFJlbW92ZSBldmVudFxuICogQGV2ZW50IFVwbG9hZGVyI3JlbW92ZVxuICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSBSZW1vdmUgZGF0YSBmcm9tIHRoaXMgY29tcG9uZW50XG4gKiAgQHBhcmFtIHtzdHJpbmd9IGRhdGEubWVzc2FnZSAtICdzdWNjZXNzJyBvciAnZmFpbCdcbiAqICBAcGFyYW0ge3N0cmluZ30gZGF0YS5uYW1lIC0gZmlsZSBuYW1lXG4gKiAgQHBhcmFtIHtzdHJpbmd9IGRhdGEuaWQgLSBmaWxlIGlkXG4gKi9cblxuLyoqXG4gKiBFcnJvciBldmVudFxuICogQGV2ZW50IFVwbG9hZGVyI2Vycm9yXG4gKiBAcGFyYW0ge0Vycm9yfSBkYXRhIC0gRXJyb3IgZGF0YVxuICogIEBwYXJhbSB7c3RyaW5nfSBkYXRhLnN0YXR1cyAtIEVycm9yIHN0YXR1c1xuICogIEBwYXJhbSB7c3RyaW5nfSBkYXRhLm1lc3NhZ2UgLSBFcnJvciBtZXNzYWdlXG4gKi9cblxuLyoqXG4gKiBTdWNjZXNzIGV2ZW50XG4gKiBAZXZlbnQgVXBsb2FkZXIjc3VjY2Vzc1xuICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSBTZXJ2ZXIgcmVzcG9uc2UgZGF0YVxuICogIEBwYXJhbSB7QXJyYXl9IGRhdGEuZmlsZWxpc3QgLSBVcGxvYWRlZCBmaWxlIGxpc3RcbiAqICBAcGFyYW0ge251bWJlcn0gW2RhdGEuc3VjY2Vzc10gLSBVcGxvYWRlZCBmaWxlIGNvdW50XG4gKiAgQHBhcmFtIHtudW1iZXJ9IFtkYXRhLmZhaWxlZF0gLSBGYWlsZWQgZmlsZSBjb3VudFxuICogIEBwYXJhbSB7bnVtYmVyfSBbZGF0YS5jb3VudF0gLSBUb3RhbCBjb3VudFxuICovXG5cbi8qKlxuICogVXBkYXRlIGV2ZW50XG4gKiBAZXZlbnQgVXBsb2FkZXIjdXBkYXRlXG4gKiBAcGFyYW0ge0FycmF5LjxvYmplY3Q+fSBkYXRhIC0gRmlsZSBsaXN0IGRhdGFcbiAqIEFycmF5IGhhdmluZyBvYmplY3RzPGJyPntpZDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIHNpemU6IG51bWJlcn1cbiAqL1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgdXRpbHNcbiAqIEBpZ25vcmVcbiAqL1xudmFyIElTX1NVUFBPUlRfRklMRV9TWVNURU0gPSAhISh3aW5kb3cuRmlsZSAmJiB3aW5kb3cuRmlsZVJlYWRlciAmJiB3aW5kb3cuRmlsZUxpc3QgJiYgd2luZG93LkJsb2IpO1xudmFyIElTX1NVUFBPUlRfRk9STV9EQVRBID0gISEod2luZG93LkZvcm1EYXRhIHx8IG51bGwpO1xuXG4vKipcbiAqIFBhcnNlIHVybFxuICogQHBhcmFtIHtzdHJpbmd9IHVybCAtIHVybCBmb3IgcGFyc2luZ1xuICogQHJldHVybnMge09iamVjdH0gVVJMIGluZm9ybWF0aW9uXG4gKiBAaWdub3JlXG4gKi9cbmZ1bmN0aW9uIHBhcnNlVVJMKHVybCkge1xuICAgIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgIGEuaHJlZiA9IHVybDtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGhyZWY6IGEuaHJlZixcbiAgICAgICAgaG9zdDogYS5ob3N0LFxuICAgICAgICBwb3J0OiBhLnBvcnQsXG4gICAgICAgIGhhc2g6IGEuaGFzaCxcbiAgICAgICAgaG9zdG5hbWU6IGEuaG9zdG5hbWUsXG4gICAgICAgIHBhdGhuYW1lOiBhLnBhdGhuYW1lLFxuICAgICAgICBwcm90b2NvbDogYS5wcm90b2NvbCxcbiAgICAgICAgc2VhcmNoOiBhLnNlYXJjaCxcbiAgICAgICAgcXVlcnk6IGEuc2VhcmNoLnNsaWNlKDEpXG4gICAgfTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHVuaXQgZm9yIGZpbGUgc2l6ZVxuICogQHBhcmFtIHtudW1iZXJ9IGJ5dGVzIEEgdXNhZ2Ugb2YgZmlsZVxuICogQHJldHVybnMge3N0cmluZ30gU2l6ZS1zdHJpbmdcbiAqIEBtZW1iZXJvZiB1dGlsc1xuICovXG5mdW5jdGlvbiBnZXRGaWxlU2l6ZVdpdGhVbml0KGJ5dGVzKSB7XG4gICAgdmFyIHVuaXRzID0gWydCJywgJ0tCJywgJ01CJywgJ0dCJywgJ1RCJ107XG4gICAgdmFyIGV4cCwgcmVzdWx0O1xuXG4gICAgYnl0ZXMgPSBwYXJzZUludChieXRlcywgMTApO1xuICAgIGV4cCA9IE1hdGgubG9nKGJ5dGVzKSAvIE1hdGgubG9nKDEwMjQpIHwgMDtcbiAgICByZXN1bHQgPSAoYnl0ZXMgLyBNYXRoLnBvdygxMDI0LCBleHApKS50b0ZpeGVkKDIpO1xuXG4gICAgcmV0dXJuIHJlc3VsdCArICcgJyArIHVuaXRzW2V4cF07XG59XG5cbi8qKlxuICogV2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0cyBGb3JtRGF0YSBvciBub3RcbiAqIEBtZW1iZXJvZiB1dGlsc1xuICogQHJldHVybnMge2Jvb2xlYW59IHdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgRm9ybURhdGFcbiAqL1xuZnVuY3Rpb24gaXNTdXBwb3J0Rm9ybURhdGEoKSB7XG4gICAgcmV0dXJuIElTX1NVUFBPUlRfRk9STV9EQVRBO1xufVxuXG4vKipcbiAqIEdldCBpdGVtIGVsZW1lbnRzIEhUTUxcbiAqIEBwYXJhbSB7T2JqZWN0fSBtYXAgLSBQcm9wZXJ0aWVzIGZvciB0ZW1wbGF0ZVxuICogQHBhcmFtIHtzdHJpbmd9IGh0bWwgSFRNTCB0ZW1wbGF0ZVxuICogQHJldHVybnMge3N0cmluZ30gSFRNTFxuICogQG1lbWJlcm9mIHV0aWxzXG4gKi9cbmZ1bmN0aW9uIHRlbXBsYXRlKG1hcCwgaHRtbCkge1xuICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoL1xce1xceyhbXlxcfV0rKVxcfVxcfS9nLCBmdW5jdGlvbihtc3RyLCBuYW1lKSB7XG4gICAgICAgIHJldHVybiBtYXBbbmFtZV07XG4gICAgfSk7XG5cbiAgICByZXR1cm4gaHRtbDtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIGZpbGUgYXBpLlxuICogQHJldHVybnMge2Jvb2xlYW59IHdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgRmlsZUFQSVxuICogQG1lbWJlcm9mIHV0aWxzXG4gKi9cbmZ1bmN0aW9uIGlzU3VwcG9ydEZpbGVTeXN0ZW0oKSB7XG4gICAgcmV0dXJuIElTX1NVUFBPUlRfRklMRV9TWVNURU07XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgdXJsIGlzIHgtZG9tYWluXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsIC0gVVJMXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gV2hldGhlciB0aGUgdXJsIGlzIHgtZG9tYWluXG4gKiBAbWVtYmVyb2YgdXRpbHNcbiAqL1xuZnVuY3Rpb24gaXNDcm9zc0RvbWFpbih1cmwpIHtcbiAgICB2YXIgaGVyZSA9IHBhcnNlVVJMKHdpbmRvdy5sb2NhdGlvbi5ocmVmKSxcbiAgICAgICAgdGFyZ2V0ID0gcGFyc2VVUkwodXJsKTtcblxuICAgIHJldHVybiB0YXJnZXQuaG9zdG5hbWUgIT09IGhlcmUuaG9zdG5hbWVcbiAgICAgICAgfHwgdGFyZ2V0LnBvcnQgIT09IGhlcmUucG9ydFxuICAgICAgICB8fCB0YXJnZXQucHJvdG9jb2wgIT09IGhlcmUucHJvdG9jb2w7XG59XG5cbi8qKlxuICogUmVtb3ZlIGZpcnN0IHNwZWNpZmllZCBpdGVtIGZyb20gYXJyYXksIGlmIGl0IGV4aXN0c1xuICogQHBhcmFtIHsqfSBpdGVtIEl0ZW0gdG8gbG9vayBmb3JcbiAqIEBwYXJhbSB7QXJyYXl9IGFyciBBcnJheSB0byBxdWVyeVxuICovXG5mdW5jdGlvbiByZW1vdmVJdGVtRnJvbUFycmF5KGl0ZW0sIGFycikge1xuICAgIHZhciBpbmRleCA9IGFyci5sZW5ndGggLSAxO1xuXG4gICAgd2hpbGUgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgaWYgKGl0ZW0gPT09IGFycltpbmRleF0pIHtcbiAgICAgICAgICAgIGFyci5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgICAgIGluZGV4IC09IDE7XG4gICAgfVxufVxuXG4vKipcbiAqIEdldCBsYWJlbCBlbGVtZW50XG4gKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIFRhcmdldCBlbGVtZW50XG4gKiBAcmV0dXJucyB7alF1ZXJ5fG51bGx9IExhYmVsIGVsZW1lbnRcbiAqL1xuZnVuY3Rpb24gZ2V0TGFiZWxFbGVtZW50KCR0YXJnZXQpIHtcbiAgICB2YXIgJGxhYmVscyA9ICR0YXJnZXQucGFyZW50cygnbGFiZWwnKTtcbiAgICB2YXIgaGFzTGFiZWwgPSAkbGFiZWxzLmxlbmd0aDtcblxuICAgIGlmIChoYXNMYWJlbCkge1xuICAgICAgICByZXR1cm4gJGxhYmVscy5lcSgwKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0RmlsZVNpemVXaXRoVW5pdDogZ2V0RmlsZVNpemVXaXRoVW5pdCxcbiAgICBpc1N1cHBvcnRGaWxlU3lzdGVtOiBpc1N1cHBvcnRGaWxlU3lzdGVtLFxuICAgIGlzU3VwcG9ydEZvcm1EYXRhOiBpc1N1cHBvcnRGb3JtRGF0YSxcbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXG4gICAgaXNDcm9zc0RvbWFpbjogaXNDcm9zc0RvbWFpbixcbiAgICByZW1vdmVJdGVtRnJvbUFycmF5OiByZW1vdmVJdGVtRnJvbUFycmF5LFxuICAgIGdldExhYmVsRWxlbWVudDogZ2V0TGFiZWxFbGVtZW50XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY29uc3RzID0gcmVxdWlyZSgnLi4vY29uc3RzJyk7XG5cbnZhciBVU0VfRFJPUFpPTkVfQ0xBU1MgPSBjb25zdHMuQ0xBU1NOQU1FLlVTRV9EUk9QWk9ORTtcbnZhciBEUk9QX0VOQUJMRURfQ0xBU1MgPSBjb25zdHMuQ0xBU1NOQU1FLkRST1BfRU5BQkxFRDtcblxuLyoqXG4gKiBNYWtlcyBkcmFnIGFuZCBkcm9wIGFyZWEsIHRoZSBkcm9wcGVkIGZpbGUgaXMgYWRkZWQgdmlhIGV2ZW50IGRyb3AgZXZlbnQuXG4gKiBAY2xhc3MgRHJhZ0FuZERyb3BcbiAqIEBwYXJhbSB7alF1ZXJ5fSAkZWwgLSBEcm9wem9uZSBlbGVtZW50XG4gKiBAaWdub3JlXG4gKi9cbnZhciBEcmFnQW5kRHJvcCA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgRHJhZ0FuZERyb3AucHJvdG90eXBlICove1xuICAgIGluaXQ6IGZ1bmN0aW9uKCRlbCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogRHJvcCB6b25lIGpRdWVyeS1lbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiRlbCA9ICRlbC5hZGRDbGFzcyhVU0VfRFJPUFpPTkVfQ0xBU1MpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDbGFzcyBmb3IgZHJvcCBlbmFibGVkXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9lbmFibGVDbGFzcyA9IERST1BfRU5BQkxFRF9DTEFTUztcblxuICAgICAgICB0aGlzLl9hZGRFdmVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGRyYWcgYW5kIGRyb3AgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsLm9uKHtcbiAgICAgICAgICAgIGRyYWdlbnRlcjogJC5wcm94eSh0aGlzLm9uRHJhZ0VudGVyLCB0aGlzKSxcbiAgICAgICAgICAgIGRyYWdvdmVyOiAkLnByb3h5KHRoaXMub25EcmFnT3ZlciwgdGhpcyksXG4gICAgICAgICAgICBkcm9wOiAkLnByb3h5KHRoaXMub25Ecm9wLCB0aGlzKSxcbiAgICAgICAgICAgIGRyYWdsZWF2ZTogJC5wcm94eSh0aGlzLm9uRHJhZ0xlYXZlLCB0aGlzKVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlcyBkcmFnZW50ZXIgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBlIC0gRXZlbnRcbiAgICAgKi9cbiAgICBvbkRyYWdFbnRlcjogZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMuX2VuYWJsZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGVzIGRyYWdvdmVyIGV2ZW50XG4gICAgICogQHBhcmFtIHtFdmVudH0gZSAtIEV2ZW50XG4gICAgICovXG4gICAgb25EcmFnT3ZlcjogZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEhhbmRsZXMgZHJhZ2xlYXZlIGV2ZW50XG4gICAgICogQHBhcmFtIHtFdmVudH0gZSAtIEV2ZW50XG4gICAgICovXG4gICAgb25EcmFnTGVhdmU6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLl9kaXNhYmxlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEhhbmRsZXMgZHJvcCBldmVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGUgLSBFdmVudFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBGYWxzZVxuICAgICAqL1xuICAgIG9uRHJvcDogZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgZmlsZXMgPSB0dWkudXRpbC5waWNrKGUsICdvcmlnaW5hbEV2ZW50JywgJ2RhdGFUcmFuc2ZlcicsICdmaWxlcycpO1xuXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5fZGlzYWJsZSgpO1xuICAgICAgICB0aGlzLmZpcmUoJ2Ryb3AnLCBmaWxlcyk7XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFbmFibGUgZHJvcHpvbmVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9lbmFibGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbC5hZGRDbGFzcyh0aGlzLl9lbmFibGVDbGFzcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERpc2FibGUgZHJvcG9uemVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9kaXNhYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwucmVtb3ZlQ2xhc3ModGhpcy5fZW5hYmxlQ2xhc3MpO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oRHJhZ0FuZERyb3ApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyYWdBbmREcm9wO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY29uc3RzID0gcmVxdWlyZSgnLi4vY29uc3RzJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG52YXIgaXNTdXBwb3J0Rm9ybURhdGEgPSB1dGlscy5pc1N1cHBvcnRGb3JtRGF0YSgpO1xudmFyIEhJRERFTl9GSUxFX0lOUFVUX0NMQVNTID0gY29uc3RzLkNMQVNTTkFNRS5ISURERU5fRklMRV9JTlBVVDtcbnZhciBTVEFNUF9JRCA9ICdfX2ZlX2lkJztcblxuLyoqXG4gKiBUaGlzIHZpZXcgY29udHJvbCBpbnB1dCBlbGVtZW50IHR5cGVkIGZpbGUuXG4gKiBAY2xhc3MgRm9ybVxuICogQHBhcmFtIHtVcGxvYWRlcn0gdXBsb2FkZXIgLSBVcGxvYWRlciBpbnN0YW5jZVxuICogQGlnbm9yZVxuICovXG52YXIgRm9ybSA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKkBsZW5kcyBWaWV3LkZvcm0ucHJvdG90eXBlICoqL3tcbiAgICBpbml0OiBmdW5jdGlvbih1cGxvYWRlcikge1xuICAgICAgICAvKipcbiAgICAgICAgICogRmlsZSB1cGxvYWRlclxuICAgICAgICAgKiBAdHlwZSB7VXBsb2FkZXJ9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl91cGxvYWRlciA9IHVwbG9hZGVyO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBIdG1sIHRlbXBsYXRlc1xuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsIHN0cmluZz59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9odG1sID0gdGhpcy5fc2V0VGVtcGxhdGUodXBsb2FkZXIudGVtcGxhdGUpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGb3JtIGVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJGVsID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRmlsZSBpbnB1dCBlbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiRmaWxlSW5wdXQgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTdWJtaXQgZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kc3VibWl0ID0gbnVsbDtcblxuICAgICAgICBpZiAoaXNTdXBwb3J0Rm9ybURhdGEpIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogV2hldGhlciB0aGUgZmlsZSBpbnB1dCBpcyBtdWx0aXBsZVxuICAgICAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLl9pc011bHRpcGxlID0gdXBsb2FkZXIuaXNNdWx0aXBsZTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBXaGV0aGVyIHRoZSBmaWxlIGlucHV0IGFjY2VwdHMgZm9sZGVyXG4gICAgICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuX3VzZUZvbGRlciA9IHVwbG9hZGVyLnVzZUZvbGRlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3JlbmRlcih7XG4gICAgICAgICAgICBhY3Rpb246IHVwbG9hZGVyLnVybC5zZW5kLFxuICAgICAgICAgICAgbWV0aG9kOiAncG9zdCcsXG4gICAgICAgICAgICBlbmN0eXBlOiAnbXVsdGlwYXJ0L2Zvcm0tZGF0YScsXG4gICAgICAgICAgICB0YXJnZXQ6IGlzU3VwcG9ydEZvcm1EYXRhID8gJycgOiB1cGxvYWRlci5mb3JtVGFyZ2V0XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgZm9ybSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtvYmplY3R9IGF0dHJpYnV0ZXMgLSBGb3JtIGF0dHJpYnV0ZXNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW5kZXI6IGZ1bmN0aW9uKGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgdmFyIHVwbG9hZGVyID0gdGhpcy5fdXBsb2FkZXI7XG4gICAgICAgIHZhciAkZmlsZUlucHV0ID0gdGhpcy5fZ2V0RmlsZUlucHV0KCk7XG4gICAgICAgIHZhciAkZWwgPSAkKHRoaXMuX2h0bWwuRk9STSlcbiAgICAgICAgICAgICAgICAuYXBwZW5kKHVwbG9hZGVyLiRlbC5jaGlsZHJlbigpKVxuICAgICAgICAgICAgICAgIC5hdHRyKGF0dHJpYnV0ZXMpO1xuXG4gICAgICAgIHRoaXMuJGVsID0gJGVsO1xuICAgICAgICB0aGlzLiRmaWxlSW5wdXQgPSAkZmlsZUlucHV0O1xuXG4gICAgICAgIGlmICh1cGxvYWRlci5pc0JhdGNoVHJhbnNmZXIpIHtcbiAgICAgICAgICAgIHRoaXMuJHN1Ym1pdCA9IHVwbG9hZGVyLiRlbC5maW5kKCc6c3VibWl0Jyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodXBsb2FkZXIuaXNDcm9zc0RvbWFpbiAmJiAhaXNTdXBwb3J0Rm9ybURhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldEhpZGRlbklucHV0Rm9yQ09SUygpO1xuICAgICAgICB9XG5cbiAgICAgICAgdXBsb2FkZXIuJGVsLmFwcGVuZCh0aGlzLiRlbCk7XG5cbiAgICAgICAgdGhpcy5fYWRkRXZlbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGhpZGRlbiBpbnB1dCBlbGVtZW50IGZvciBDT1JTLlxuICAgICAqICBIaWRkZW4gaW5wdXQgb2YgUG9zdE1lc3NhZ2Ugb3IgUmVkaXJlY3RVUkwuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0SGlkZGVuSW5wdXRGb3JDT1JTOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHByb3BzLCAkaGlkZGVuSW5wdXQ7XG4gICAgICAgIHZhciB1cGxvYWRlciA9IHRoaXMuX3VwbG9hZGVyO1xuICAgICAgICB2YXIgcmVkaXJlY3RVUkwgPSB1cGxvYWRlci5yZWRpcmVjdFVSTDtcblxuICAgICAgICBpZiAodXBsb2FkZXIuaXNTdXBwb3J0UG9zdE1lc3NhZ2UpIHsgLy8gZm9yIElFOCwgOVxuICAgICAgICAgICAgcHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ21lc3NhZ2VUYXJnZXQnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBsb2NhdGlvbi5wcm90b2NvbCArICcvLycgKyBsb2NhdGlvbi5ob3N0XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKHJlZGlyZWN0VVJMKSB7IC8vIGZvciBJRTdcbiAgICAgICAgICAgIHByb3BzID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdyZWRpcmVjdFVSTCcsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHJlZGlyZWN0VVJMXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb3BzKSB7XG4gICAgICAgICAgICAkaGlkZGVuSW5wdXQgPSAkKHV0aWxzLnRlbXBsYXRlKHByb3BzLCB0aGlzLl9odG1sLkhJRERFTl9JTlBVVCkpO1xuICAgICAgICAgICAgJGhpZGRlbklucHV0LmFwcGVuZFRvKHRoaXMuJGVsKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgYWxsIG9mIGlucHV0IGVsZW1lbnRzIGh0bWwgc3RyaW5ncy5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbdGVtcGxhdGVdIFRoZSB0ZW1wbGF0ZSBpcyBzZXQgZm9ybSBjdXN0b21lci5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0LjxzdHJpbmcsIHN0cmluZz59IFRoZSBodG1sIHRlbXBsYXRlIHN0cmluZyBzZXQgZm9yIGZvcm0uXG4gICAgICovXG4gICAgX3NldFRlbXBsYXRlOiBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuICAgICAgICByZXR1cm4gdHVpLnV0aWwuZXh0ZW5kKHt9LCBjb25zdHMuSFRNTCwgdGVtcGxhdGUpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlcyBhbmQgcmV0dXJucyBqcXVlcnkgZWxlbWVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHJldHVybnMge2pRdWVyeX0gVGhlIGpxdWVyeSBvYmplY3Qgd3JhcHBpbmcgb3JpZ2luYWwgaW5wdXQgZWxlbWVudFxuICAgICAqL1xuICAgIF9nZXRGaWxlSW5wdXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGZpbGVJbnB1dCA9IHRoaXMuX3VwbG9hZGVyLiRlbC5maW5kKCc6ZmlsZScpO1xuICAgICAgICB2YXIgaXNNdWx0aXBsZSA9IHRoaXMuX2lzTXVsdGlwbGU7XG4gICAgICAgIHZhciB1c2VGb2xkZXIgPSB0aGlzLl91c2VGb2xkZXI7XG5cbiAgICAgICAgJGZpbGVJbnB1dC5wcm9wKHtcbiAgICAgICAgICAgIG11bHRpcGxlOiBpc011bHRpcGxlLFxuICAgICAgICAgICAgZGlyZWN0b3J5OiB1c2VGb2xkZXIsXG4gICAgICAgICAgICBtb3pkaXJlY3Rvcnk6IHVzZUZvbGRlcixcbiAgICAgICAgICAgIHdlYmtpdGRpcmVjdG9yeTogdXNlRm9sZGVyXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiAkZmlsZUlucHV0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl91cGxvYWRlci5pc0JhdGNoVHJhbnNmZXIpIHtcbiAgICAgICAgICAgIHRoaXMuJGVsLm9uKCdzdWJtaXQnLCAkLnByb3h5KHRoaXMuZmlyZSwgdGhpcywgJ3N1Ym1pdCcpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2FkZElucHV0RXZlbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGNoYW5nZSBldmVudCB0byBmaWxlIGlucHV0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkSW5wdXRFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGZpbGVJbnB1dC5vbignY2hhbmdlJywgJC5wcm94eSh0aGlzLm9uQ2hhbmdlLCB0aGlzKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50LUhhbmRsZSBmb3IgaW5wdXQgZWxlbWVudCBjaGFuZ2VcbiAgICAgKi9cbiAgICBvbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy4kZmlsZUlucHV0WzBdLnZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5maXJlKCdjaGFuZ2UnKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVzZXQgSW5wdXQgZWxlbWVudCB0byBzYXZlIHdob2xlIGlucHV0PWZpbGUgZWxlbWVudC5cbiAgICAgKi9cbiAgICByZXNldEZpbGVJbnB1dDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkY2xvbmVkRmlsZUlucHV0ID0gdGhpcy4kZmlsZUlucHV0LmNsb25lKCk7XG4gICAgICAgIHRoaXMuJGZpbGVJbnB1dC5hZnRlcigkY2xvbmVkRmlsZUlucHV0KTtcbiAgICAgICAgdGhpcy4kZmlsZUlucHV0LnJlbW92ZSgpO1xuICAgICAgICB0aGlzLiRmaWxlSW5wdXQgPSAkY2xvbmVkRmlsZUlucHV0O1xuXG4gICAgICAgIGlmICh0dWkudXRpbC5oYXNTdGFtcCh0aGlzLiRmaWxlSW5wdXRbMF0pKSB7IC8vIGZvciBvbGQgYnJvd3NlclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuJGZpbGVJbnB1dFswXVtTVEFNUF9JRF07XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9hZGRJbnB1dEV2ZW50KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENsZWFyIGZpbGUgaW5wdXQgZWxlbWVudHNcbiAgICAgKi9cbiAgICBjbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsLmZpbmQoJy4nICsgSElEREVOX0ZJTEVfSU5QVVRfQ0xBU1MpLnJlbW92ZSgpO1xuICAgICAgICB0aGlzLnJlc2V0RmlsZUlucHV0KCk7XG4gICAgfVxufSk7XG5cbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihGb3JtKTtcbm1vZHVsZS5leHBvcnRzID0gRm9ybTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNvbnN0cyA9IHJlcXVpcmUoJy4uL2NvbnN0cycpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxudmFyIGNsYXNzTmFtZXMgPSBjb25zdHMuQ0xBU1NOQU1FO1xudmFyIGh0bWxzID0gY29uc3RzLkhUTUw7XG5cbi8qKlxuICogTGlzdCBpdGVtIHZpZXdcbiAqIEBjbGFzcyBJdGVtXG4gKiBAcGFyYW0ge2pRdWVyeX0gJHJvb3QgLSBMaXN0IGVsZW1lbnQgdG8gYXBwZW5kIGl0ZW0gdmlld1xuICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSBJdGVtJ3MgZGF0YSAoZmlsZSBpbmZvKVxuICogICAgIEBwYXJhbSB7c3RyaW5nfSBkYXRhLm5hbWUgLSBGaWxlIG5hbWVcbiAqICAgICBAcGFyYW0ge3N0cmluZ30gZGF0YS50eXBlIC0gRmlsZSB0eXBlXG4gKiAgICAgQHBhcmFtIHtzdHJpbmd9IFtkYXRhLmlkXSAtIFVuaXF1ZSBrZXksIHdoYXQgaWYgdGhlIGtleSBpcyBub3QgZXhpc3QgaWQgd2lsbCBiZSB0aGUgZmlsZSBuYW1lXG4gKiAgICAgQHBhcmFtIHsoc3RyaW5nfG51bWJlcil9IFtvcHRpb25zLnNpemVdIEZpbGUgc2l6ZSAoYnV0IGllIGxvdyBicm93c2VyLCB4LWRvbWFpbilcbiAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy50ZW1wbGF0ZSAtIEl0ZW0gdGVtcGxhdGVcbiAqICBAaWdub3JlXG4gKi9cbnZhciBJdGVtID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBJdGVtLnByb3RvdHlwZSAqKi97XG4gICAgaW5pdDogZnVuY3Rpb24oJHJvb3QsIGRhdGEsIHRlbXBsYXRlKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJdGVtOiBMSSBlbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiRlbCA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEl0ZW06IGNoZWNrYm94XG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiRjaGVja2JveCA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEl0ZW06IHJlbW92ZSBidXR0b25cbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJHJlbW92ZUJ1dHRvbiA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEl0ZW0gbmFtZVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJdGVtIGlkXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmlkID0gZGF0YS5pZCB8fCBkYXRhLm5hbWU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEl0ZW0gc2l6ZVxuICAgICAgICAgKiBAdHlwZSB7bnVtYmVyfHN0cmluZ31cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuc2l6ZSA9IGRhdGEuc2l6ZSB8fCAnJztcblxuICAgICAgICAvKipcbiAgICAgICAgICogSXRlbSB0eXBlXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnR5cGUgPSB0aGlzLl9leHRyYWN0RXh0ZW5zaW9uKCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRlbXBsYXRlIHRvIGNyZWF0ZSBsaXN0IGl0ZW1cbiAgICAgICAgICogQHR5cGUge29iamVjdH1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudGVtcGxhdGUgPSB0ZW1wbGF0ZTtcblxuICAgICAgICB0aGlzLl9yZW5kZXIoJHJvb3QpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgaXRlbVxuICAgICAqIEBwYXJhbSB7alF1ZXJ5fSAkcm9vdCAtIExpc3QgYXJlYSB2aWV3XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVuZGVyOiBmdW5jdGlvbigkcm9vdCkge1xuICAgICAgICB2YXIgaHRtbCA9IHRoaXMuX2dldEhUTUwoKTtcblxuICAgICAgICB0aGlzLiRlbCA9ICQoaHRtbCkuYXBwZW5kVG8oJHJvb3QpO1xuICAgICAgICB0aGlzLiRjaGVja2JveCA9IHRoaXMuJGVsLmZpbmQoJzpjaGVja2JveCcpO1xuICAgICAgICB0aGlzLiRyZW1vdmVCdXR0b24gPSB0aGlzLiRlbC5maW5kKCdidXR0b24nKTtcblxuICAgICAgICB0aGlzLl9hZGRFdmVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgaHRtbCBzdHJpbmcgb2YgaXRlbVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IEh0bWwgc3RyaW5nXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0SFRNTDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0ZW1wbGF0ZSA9IHRoaXMudGVtcGxhdGU7XG4gICAgICAgIHZhciBtYXAgPSB7XG4gICAgICAgICAgICBmaWxldHlwZTogdGhpcy50eXBlLFxuICAgICAgICAgICAgZmlsZW5hbWU6IHRoaXMubmFtZSxcbiAgICAgICAgICAgIGZpbGVzaXplOiB0aGlzLnNpemUgPyB1dGlscy5nZXRGaWxlU2l6ZVdpdGhVbml0KHRoaXMuc2l6ZSkgOiAnJyxcbiAgICAgICAgICAgIGNoZWNrYm94OiBodG1scy5DSEVDS0JPWCxcbiAgICAgICAgICAgIHJlbW92ZUJ1dHRvbjogaHRtbHMuUkVNT1ZFX0JVVFRPTlxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB1dGlscy50ZW1wbGF0ZShtYXAsIHRlbXBsYXRlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXh0cmFjdCBmaWxlIGV4dGVuc2lvbiBieSBuYW1lXG4gICAgICogQHJldHVybnMge3N0cmluZ30gRmlsZSBleHRlbnNpb25cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9leHRyYWN0RXh0ZW5zaW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZS5zcGxpdCgnLicpLnBvcCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnQgaGFuZGxlciBvbiBkZWxldGUgYnV0dG9uLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZEV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kY2hlY2tib3gub24oJ2NoYW5nZScsICQucHJveHkodGhpcy5vbkNoYW5nZSwgdGhpcykpO1xuICAgICAgICB0aGlzLiRyZW1vdmVCdXR0b24ub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLl9vbkNsaWNrRXZlbnQsIHRoaXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQtaGFuZGxlIGZvciBkZWxldGUgYnV0dG9uIGNsaWNrZWQuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25DbGlja0V2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5maXJlKCdyZW1vdmUnLCB7XG4gICAgICAgICAgICBuYW1lOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICBpZDogdGhpcy5pZFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hhbmdlIGNoZWNrYm94IHZpZXcgc3RhdGVcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHN0YXRlIC0gQ2hlY2tlZCBzdGF0ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NoYW5nZUNoZWNrYm94OiBmdW5jdGlvbihzdGF0ZSkge1xuICAgICAgICB2YXIgJGNoZWNrYm94ID0gdGhpcy4kY2hlY2tib3g7XG4gICAgICAgIHZhciAkbGFiZWwgPSB1dGlscy5nZXRMYWJlbEVsZW1lbnQoJGNoZWNrYm94KTtcbiAgICAgICAgdmFyICR0YXJnZXQgPSAoJGxhYmVsKSA/ICRsYWJlbCA6ICRjaGVja2JveDtcbiAgICAgICAgdmFyIGNsYXNzTmFtZSA9IGNsYXNzTmFtZXMuSVNfQ0hFQ0tFRDtcblxuICAgICAgICBpZiAoc3RhdGUpIHtcbiAgICAgICAgICAgICR0YXJnZXQuYWRkQ2xhc3MoY2xhc3NOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICR0YXJnZXQucmVtb3ZlQ2xhc3MoY2xhc3NOYW1lKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGFuZ2UgZXZlbnQgaGFuZGxlclxuICAgICAqL1xuICAgIG9uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHN0YXRlID0gISF0aGlzLiRjaGVja2JveC5hdHRyKCdjaGVja2VkJyk7XG4gICAgICAgIHRoaXMuX2NoYW5nZUNoZWNrYm94KHN0YXRlKTtcbiAgICAgICAgdGhpcy5maXJlKCdjaGVjaycsIHtcbiAgICAgICAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgICAgICAgbmFtZTogdGhpcy5uYW1lLFxuICAgICAgICAgICAgc2l6ZTogdGhpcy5zaXplXG4gICAgICAgIH0sIHN0YXRlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGVzdHJveSBpdGVtXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsLnJlbW92ZSgpO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oSXRlbSk7XG5tb2R1bGUuZXhwb3J0cyA9IEl0ZW07XG4iLCIndXNlIHN0cmljdCc7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xudmFyIEl0ZW0gPSByZXF1aXJlKCcuL2l0ZW0nKTtcbnZhciBjb25zdHMgPSByZXF1aXJlKCcuLi9jb25zdHMnKTtcblxudmFyIGNsYXNzTmFtZXMgPSBjb25zdHMuQ0xBU1NOQU1FO1xudmFyIHNuaXBwZXQgPSB0dWkudXRpbDtcbnZhciBmb3JFYWNoID0gc25pcHBldC5mb3JFYWNoO1xudmFyIGlzVW5kZWZpbmVkID0gc25pcHBldC5pc1VuZGVmaW5lZDtcbnZhciBpc0FycmF5U2FmZSA9IHNuaXBwZXQuaXNBcnJheVNhZmU7XG5cbi8qKlxuICogTGlzdCB2aWV3XG4gKiBAY2xhc3MgTGlzdFxuICogQHBhcmFtIHtqUXVlcnl9ICRlbCAtIENvbnRhaW5lciBlbGVtZW50IHRvIGdlbmVyYXRlIGxpc3Qgdmlld1xuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgLSBPcHRpb25zIHRvIHNldCBsaXN0IHZpZXdcbiAqICAgICBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy5saXN0VHlwZSAtIExpc3QgdHlwZSAoJ3NpbXBsZScgb3IgJ3RhYmxlJylcbiAqICAgICBAcGFyYW0ge29iamVjdH0gW29wdGlvbnMuaXRlbV0gLSBUbyBjdXN0b21pemUgaXRlbSBjb250ZW50cyB3aGVuIGxpc3QgdHlwZSBpcyAnc2ltcGxlJ1xuICogICAgIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucy5jb2x1bW5MaXN0XSAtIFRvIGN1c3RvbWl6ZSByb3cgY29udGVudHMgd2hlbiBsaXN0IHR5cGUgaXMgJ3RhYmxlJ1xuICogQGlnbm9yZVxuICovXG52YXIgTGlzdCA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgTGlzdC5wcm90b3R5cGUgKi97XG4gICAgaW5pdDogZnVuY3Rpb24oJGVsLCBvcHRpb25zKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBqUXVlcnktZWxlbWVudCBvZiBsaXN0IGNvbnRhaW5lclxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kZWwgPSAkZWw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGpRdWVyeS1lbGVtZW50IG9mIGxpc3RcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJGxpc3QgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBqUXVlcnktZWxlbWVudCBvZiBjaGVja2JveCBpbiBoZWFkZXJcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJGNoZWNrYm94ID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTGlzdCB0eXBlXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmxpc3RUeXBlID0gb3B0aW9ucy50eXBlO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJdGVtIHRlbXBsYXRlIHByZXNldCBvZiBzaW1wbGUgbGlzdFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pdGVtID0gb3B0aW9ucy5pdGVtO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJdGVtIHRlbXBsYXRlIHByZXNldCBvZiB0YWJsZVxuICAgICAgICAgKiBAdHlwZSB7QXJyYXkuPE9iamVjdD59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmNvbHVtbkxpc3QgPSBvcHRpb25zLmNvbHVtbkxpc3Q7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEl0ZW0ncyB0ZW1wbGF0ZSBpbiBsaXN0XG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLml0ZW1UZW1wbGF0ZSA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEl0ZW1zXG4gICAgICAgICAqIEB0eXBlIHtBcnJheS48SXRlbT59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLml0ZW1zID0gW107XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExpc3Qgb2YgY2hlY2tlZCBpdGVtJ3MgaW5kZXhcbiAgICAgICAgICogQHR5cGUge0FycmF5LjxudW1iZXI+fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jaGVja2VkSW5kZXhMaXN0ID0gW107XG5cbiAgICAgICAgdGhpcy5fcmVuZGVyKCk7XG4gICAgICAgIHRoaXMuX2FkZEV2ZW50KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbmRlciBsaXN0IHZpZXdcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaXNUYWJsZUxpc3QgPSAodGhpcy5saXN0VHlwZSA9PT0gJ3RhYmxlJyk7XG4gICAgICAgIHZhciAkbGlzdENvbnRhaW5lciA9IHRoaXMuX2dldExpc3RDb250YWluZXIoaXNUYWJsZUxpc3QpO1xuXG4gICAgICAgIHRoaXMuJGVsLmFwcGVuZCgkbGlzdENvbnRhaW5lcik7XG5cbiAgICAgICAgaWYgKGlzVGFibGVMaXN0KSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRDb2x1bW5Hcm91cCgpO1xuICAgICAgICAgICAgdGhpcy5fc2V0VGFibGVIZWFkZXIoKTtcbiAgICAgICAgICAgIHRoaXMuX3NldFRhYmxlUm93VGVtcGxhdGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3NldExpc3RJdGVtVGVtcGxhdGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuJGxpc3QgPSB0aGlzLiRlbC5maW5kKCcuJyArIGNsYXNzTmFtZXMuTElTVF9JVEVNU19DT05UQUlORVIpO1xuICAgICAgICB0aGlzLiRjaGVja2JveCA9IHRoaXMuJGVsLmZpbmQoJzpjaGVja2JveCcpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnQgb24gY2hlY2tib3hcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy4kY2hlY2tib3gpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLiRjaGVja2JveC5vbignY2hhbmdlJywgJC5wcm94eSh0aGlzLl9vbkNoYW5nZSwgdGhpcykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGFuZ2UgZXZlbnQgaGFuZGxlclxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHN0YXRlID0gISF0aGlzLiRjaGVja2JveC5hdHRyKCdjaGVja2VkJyk7XG5cbiAgICAgICAgdGhpcy5fY2hhbmdlQ2hlY2tib3hJbkl0ZW0oc3RhdGUpO1xuICAgICAgICB0aGlzLl9jaGFuZ2VDaGVja2JveEluSGVhZGVyKHN0YXRlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGNvbnRhaW5lciBlbGVtZW50IG9mIGxpc3RcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzVGFibGVMaXN0IC0gV2hldGhlciBsaXN0IHR5cGUgaXMgXCJ0YWJsZVwiIG9yIG5vdFxuICAgICAqIEByZXR1cm5zIHtqUXVlcnl9IExpc3QgY29udGFpbmVyXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0TGlzdENvbnRhaW5lcjogZnVuY3Rpb24oaXNUYWJsZUxpc3QpIHtcbiAgICAgICAgdmFyIHRlbXBsYXRlID0gaXNUYWJsZUxpc3QgPyBjb25zdHMuVEFCTEVfVEVNUExBVEUgOiBjb25zdHMuTElTVF9URU1QTEFURTtcblxuICAgICAgICByZXR1cm4gJCh1dGlscy50ZW1wbGF0ZSh7XG4gICAgICAgICAgICBsaXN0SXRlbXNDbGFzc05hbWU6IGNsYXNzTmFtZXMuTElTVF9JVEVNU19DT05UQUlORVJcbiAgICAgICAgfSwgdGVtcGxhdGUuQ09OVEFJTkVSKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBjb2x1bW4gZ3JvdXAgaW4gdGFibGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRDb2x1bW5Hcm91cDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkY29sZ3JvdXAgPSB0aGlzLiRlbC5maW5kKCdjb2xncm91cCcpO1xuICAgICAgICB2YXIgY29sdW1ucyA9IHRoaXMuY29sdW1uTGlzdDtcbiAgICAgICAgdmFyIGh0bWwgPSAnJztcbiAgICAgICAgdmFyIHdpZHRoO1xuXG4gICAgICAgIGZvckVhY2goY29sdW1ucywgZnVuY3Rpb24oY29sdW1uKSB7XG4gICAgICAgICAgICB3aWR0aCA9IGNvbHVtbi53aWR0aDtcblxuICAgICAgICAgICAgaWYgKHdpZHRoKSB7XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnPGNvbCB3aWR0aD1cIicgKyBjb2x1bW4ud2lkdGggKyAnXCI+JztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnPGNvbD4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoY29sdW1ucykge1xuICAgICAgICAgICAgJGNvbGdyb3VwLmh0bWwoaHRtbCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHRhYmxlIGhlYWRlclxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldFRhYmxlSGVhZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNvbHVtbnMgPSB0aGlzLmNvbHVtbkxpc3Q7XG4gICAgICAgIHZhciBodG1sID0gJyc7XG4gICAgICAgIHZhciBoZWFkZXI7XG5cbiAgICAgICAgZm9yRWFjaChjb2x1bW5zLCBmdW5jdGlvbihjb2x1bW4pIHtcbiAgICAgICAgICAgIGhlYWRlciA9IGNvbHVtbi5oZWFkZXI7XG5cbiAgICAgICAgICAgIGlmICghaXNVbmRlZmluZWQoaGVhZGVyKSkge1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gJzx0aCBzY29wZT1cImNvbFwiPicgKyBoZWFkZXIgKyAnPC90aD4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl9zZXRIZWFkZXJFbGVtZW50KGh0bWwpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgaGVhZGVyIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaHRtbCAtIFRlbXBsYXRlIG9mIGhlYWRlclxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldEhlYWRlckVsZW1lbnQ6IGZ1bmN0aW9uKGh0bWwpIHtcbiAgICAgICAgdmFyICR0aGVhZCA9IHRoaXMuJGVsLmZpbmQoJ3RoZWFkJyk7XG4gICAgICAgIHZhciB0aGVhZENsYXNzTmFtZSA9IGNsYXNzTmFtZXMuVEhFQURfU1RZTEU7XG5cbiAgICAgICAgaWYgKGh0bWwpIHtcbiAgICAgICAgICAgIGh0bWwgPSB1dGlscy50ZW1wbGF0ZSh7XG4gICAgICAgICAgICAgICAgY2hlY2tib3g6IGNvbnN0cy5IVE1MLkNIRUNLQk9YXG4gICAgICAgICAgICB9LCBodG1sKTtcbiAgICAgICAgICAgICR0aGVhZC5odG1sKCc8dHI+JyArIGh0bWwgKyAnPC90cj4nKTtcbiAgICAgICAgfVxuICAgICAgICAkdGhlYWQuZmluZCgndGgnKS5maXJzdCgpLmFkZENsYXNzKHRoZWFkQ2xhc3NOYW1lKTtcbiAgICAgICAgJHRoZWFkLmZpbmQoJ3RoJykubGFzdCgpLmFkZENsYXNzKHRoZWFkQ2xhc3NOYW1lKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHJvdydzIHRlbXBsYXRlIG9mIHRhYmxlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0VGFibGVSb3dUZW1wbGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjb2x1bW5zID0gdGhpcy5jb2x1bW5MaXN0O1xuICAgICAgICB2YXIgaHRtbCA9ICcnO1xuXG4gICAgICAgIGZvckVhY2goY29sdW1ucywgZnVuY3Rpb24oY29sdW1uKSB7XG4gICAgICAgICAgICBodG1sICs9ICc8dGQ+JyArIGNvbHVtbi5ib2R5ICsgJzwvdGQ+JztcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGh0bWwpIHtcbiAgICAgICAgICAgIGh0bWwgPSAnPHRyPicgKyBodG1sICsgJzwvdHI+JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGh0bWwgPSBjb25zdHMuVEFCTEVfVEVNUExBVEUuTElTVF9JVEVNO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pdGVtVGVtcGxhdGUgPSBodG1sO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgaXRlbSdzIHRlbXBsYXRlIG9mIGxpc3RcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRMaXN0SXRlbVRlbXBsYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGl0ZW0gPSB0aGlzLml0ZW07XG4gICAgICAgIHZhciBodG1sO1xuXG4gICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgICBodG1sID0gJzxsaT4nICsgaXRlbSArICc8L2xpPic7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBodG1sID0gY29uc3RzLkxJU1RfVEVNUExBVEUuTElTVF9JVEVNO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pdGVtVGVtcGxhdGUgPSBodG1sO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgY2xhc3MgbmFtZSB0byBsaXN0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0SGFzSXRlbXNDbGFzc05hbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY2xhc3NOYW1lID0gY2xhc3NOYW1lcy5IQVNfSVRFTVM7XG4gICAgICAgIHZhciBoYXNJdGVtcyA9ICEhdGhpcy5pdGVtcy5sZW5ndGg7XG5cbiAgICAgICAgaWYgKGhhc0l0ZW1zKSB7XG4gICAgICAgICAgICB0aGlzLiRlbC5hZGRDbGFzcyhjbGFzc05hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kZWwucmVtb3ZlQ2xhc3MoY2xhc3NOYW1lKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZmlsZSBpdGVtc1xuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBmaWxlcyAtIEFkZGVkIGZpbGUgbGlzdFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZEZpbGVJdGVtczogZnVuY3Rpb24oZmlsZXMpIHtcbiAgICAgICAgaWYgKCFpc0FycmF5U2FmZShmaWxlcykpIHsgLy8gZm9yIHRhcmdldCBmcm9tIGlmcmFtZSwgdXNlIFwiaXNBcnJheVNhZmVcIlxuICAgICAgICAgICAgZmlsZXMgPSBbZmlsZXNdO1xuICAgICAgICB9XG4gICAgICAgIGZvckVhY2goZmlsZXMsIGZ1bmN0aW9uKGZpbGUpIHtcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCh0aGlzLl9jcmVhdGVJdGVtKGZpbGUpKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBmaWxlIGl0ZW1zXG4gICAgICogQHBhcmFtIHtBcnJheS48b2JqZWN0Pn0gZmlsZXMgLSBSZW1vdmVkIGZpbGUgbGlzdFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbW92ZUZpbGVJdGVtczogZnVuY3Rpb24oZmlsZXMpIHtcbiAgICAgICAgdmFyIGluZGV4O1xuXG4gICAgICAgIHRoaXMuY2hlY2tlZEluZGV4TGlzdC5sZW5ndGggPSAwO1xuXG4gICAgICAgIGZvckVhY2goZmlsZXMsIGZ1bmN0aW9uKGZpbGUpIHtcbiAgICAgICAgICAgIGluZGV4ID0gdGhpcy5fZmluZEluZGV4T2ZJdGVtKGZpbGUuaWQpO1xuICAgICAgICAgICAgaWYgKGZpbGUuc3RhdGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLml0ZW1zW2luZGV4XS5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrZWRJbmRleExpc3QucHVzaChpbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGluZGV4IG9mIGNoZWNrZWQgaXRlbVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIEl0ZW0ncyBpZCB0byBmaW5kXG4gICAgICogQHJldHVybnMge251bWJlcn0gaXRlbSdzIGluZGV4XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICAvKmVzbGludC1kaXNhYmxlIGNvbnNpc3RlbnQtcmV0dXJuKi9cbiAgICBfZmluZEluZGV4T2ZJdGVtOiBmdW5jdGlvbihpZCkge1xuICAgICAgICB2YXIgaXRlbUluZGV4O1xuXG4gICAgICAgIGZvckVhY2godGhpcy5pdGVtcywgZnVuY3Rpb24oaXRlbSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmIChpdGVtLmlkID09PSBpZCkge1xuICAgICAgICAgICAgICAgIGl0ZW1JbmRleCA9IGluZGV4O1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gaXRlbUluZGV4O1xuICAgIH0sXG4gICAgLyplc2xpbnQtZW5hYmxlIGNvbnNpc3RlbnQtcmV0dXJuKi9cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBpdGVtIEJ5IERhdGFcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSAtIERhdGEgZm9yIGxpc3QgaXRlbXNcbiAgICAgKiBAcmV0dXJucyB7SXRlbX0gSXRlbVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NyZWF0ZUl0ZW06IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIGl0ZW0gPSBuZXcgSXRlbSh0aGlzLiRsaXN0LCBkYXRhLCB0aGlzLml0ZW1UZW1wbGF0ZSk7XG4gICAgICAgIGl0ZW0ub24oJ3JlbW92ZScsIHRoaXMuX29uUmVtb3ZlLCB0aGlzKTtcbiAgICAgICAgaXRlbS5vbignY2hlY2snLCB0aGlzLl9vbkNoZWNrLCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gaXRlbTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGV2ZW50IGhhbmRsZXJcbiAgICAgKiBAcGFyYW0ge0l0ZW19IGl0ZW0gLSBJdGVtXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25SZW1vdmU6IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgdGhpcy5maXJlKCdyZW1vdmUnLCB7XG4gICAgICAgICAgICBmaWxlbGlzdDogW2l0ZW1dXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBldmVudCBoYW5kbGVyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGRhdGEgLSBDdXJyZW50IHNlbGVjdGVkIGl0ZW0ncyBkYXRhXG4gICAgICogQHBhcmFtIHtib29sZWFufSBpc0NoZWNrZWQgLSBDaGVja2VkIHN0YXRlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25DaGVjazogZnVuY3Rpb24oZGF0YSwgaXNDaGVja2VkKSB7XG4gICAgICAgIHRoaXMuX3NldENoZWNrZWRJdGVtc0luZGV4KGRhdGEuaWQsIGlzQ2hlY2tlZCk7XG4gICAgICAgIHRoaXMuX3NldENoZWNrZWRBbGwoKTtcblxuICAgICAgICB0aGlzLmZpcmUoJ2NoZWNrJywge1xuICAgICAgICAgICAgaWQ6IGRhdGEuaWQsXG4gICAgICAgICAgICBuYW1lOiBkYXRhLm5hbWUsXG4gICAgICAgICAgICBzaXplOiBkYXRhLnNpemUsXG4gICAgICAgICAgICBpc0NoZWNrZWQ6IGlzQ2hlY2tlZFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGxpc3Qgb2YgY2hlY2tlZCBpdGVtJ3MgaW5kZXhcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBGaWxlIGlkXG4gICAgICogQHBhcmFtIHtib29sZWFufSBpc0NoZWNrZWQgLSBDaGVja2VkIHN0YXRlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0Q2hlY2tlZEl0ZW1zSW5kZXg6IGZ1bmN0aW9uKGlkLCBpc0NoZWNrZWQpIHtcbiAgICAgICAgdmFyIGNoZWNrZWRJbmRleExpc3QgPSB0aGlzLmNoZWNrZWRJbmRleExpc3Q7XG4gICAgICAgIHZhciBjaGVja2VkSW5kZXggPSB0aGlzLl9maW5kSW5kZXhPZkl0ZW0oaWQpO1xuXG4gICAgICAgIGlmIChpc0NoZWNrZWQpIHtcbiAgICAgICAgICAgIGNoZWNrZWRJbmRleExpc3QucHVzaChjaGVja2VkSW5kZXgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXRpbHMucmVtb3ZlSXRlbUZyb21BcnJheShjaGVja2VkSW5kZXgsIGNoZWNrZWRJbmRleExpc3QpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBjaGVja2VkIGFsbCBzdGF0ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldENoZWNrZWRBbGw6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaXNDaGVja2VkQWxsID0gKHRoaXMuY2hlY2tlZEluZGV4TGlzdC5sZW5ndGggPT09IHRoaXMuaXRlbXMubGVuZ3RoKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICEhdGhpcy5jaGVja2VkSW5kZXhMaXN0Lmxlbmd0aDtcblxuICAgICAgICB0aGlzLiRjaGVja2JveC5wcm9wKCdjaGVja2VkJywgaXNDaGVja2VkQWxsKTtcbiAgICAgICAgdGhpcy5fY2hhbmdlQ2hlY2tib3hJbkhlYWRlcihpc0NoZWNrZWRBbGwpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGFuZ2UgY2hlY2tib3ggaW4gdGFibGUgaGVhZGVyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBzdGF0ZSAtIENoZWNrZWQgc3RhdGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jaGFuZ2VDaGVja2JveEluSGVhZGVyOiBmdW5jdGlvbihzdGF0ZSkge1xuICAgICAgICB2YXIgJGNoZWNrYm94ID0gdGhpcy4kY2hlY2tib3g7XG4gICAgICAgIHZhciAkbGFiZWwgPSB1dGlscy5nZXRMYWJlbEVsZW1lbnQoJGNoZWNrYm94KTtcbiAgICAgICAgdmFyICR0YXJnZXQgPSAoJGxhYmVsKSA/ICRsYWJlbCA6ICRjaGVja2JveDtcbiAgICAgICAgdmFyIGNsYXNzTmFtZSA9IGNsYXNzTmFtZXMuSVNfQ0hFQ0tFRDtcblxuICAgICAgICBpZiAoc3RhdGUpIHtcbiAgICAgICAgICAgICR0YXJnZXQuYWRkQ2xhc3MoY2xhc3NOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICR0YXJnZXQucmVtb3ZlQ2xhc3MoY2xhc3NOYW1lKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGFuZ2UgY2hlY2tib3ggaW4gbGlzdCBpdGVtXG4gICAgICogQHBhcmFtIHtib29sZWFufSBzdGF0ZSAtIENoZWNrZWQgc3RhdGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jaGFuZ2VDaGVja2JveEluSXRlbTogZnVuY3Rpb24oc3RhdGUpIHtcbiAgICAgICAgdGhpcy5jaGVja2VkSW5kZXhMaXN0ID0gW107XG5cbiAgICAgICAgZm9yRWFjaCh0aGlzLml0ZW1zLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICBpdGVtLiRjaGVja2JveC5wcm9wKCdjaGVja2VkJywgc3RhdGUpO1xuICAgICAgICAgICAgaXRlbS5vbkNoYW5nZSgpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW0gbGlzdFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIC0gRmlsZSBpbmZvcm1hdGlvbihzKSB3aXRoIHR5cGVcbiAgICAgKiBAcGFyYW0geyp9IHR5cGUgLSBVcGRhdGUgdHlwZVxuICAgICAqL1xuICAgIHVwZGF0ZTogZnVuY3Rpb24oZGF0YSwgdHlwZSkge1xuICAgICAgICBpZiAodHlwZSA9PT0gJ3JlbW92ZScpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZUZpbGVJdGVtcyhkYXRhKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2FkZEZpbGVJdGVtcyhkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zZXRIYXNJdGVtc0NsYXNzTmFtZSgpO1xuICAgICAgICB0aGlzLl9zZXRDaGVja2VkQWxsKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENsZWFyIGxpc3RcbiAgICAgKi9cbiAgICBjbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGZvckVhY2godGhpcy5pdGVtcywgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgaXRlbS5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLml0ZW1zLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuY2hlY2tlZEluZGV4TGlzdC5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLl9zZXRIYXNJdGVtc0NsYXNzTmFtZSgpO1xuICAgICAgICB0aGlzLl9zZXRDaGVja2VkQWxsKCk7XG4gICAgfVxufSk7XG5cbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihMaXN0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBMaXN0O1xuIl19
