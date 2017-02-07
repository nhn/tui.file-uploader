/**
 * @fileoverview FileUploader is core of file uploader component.
 *               FileManager manage connector to connect server and update FileListView.
 * @author NHN Ent. FE Development Lab <dl_javascript@nhnent.com>
 */
'use strict';

var consts = require('./consts');
var utils = require('./utils');
var Form = require('./view/form');
var List = require('./view/list');
var DragAndDrop = require('./view/drag');
var OldRequester = require('./requester/old');
var ModernRequester = require('./requester/modern');

var keys = tui.util.keys;
var classNames = consts.className;
var REQUESTER_TYPE_MODERN = consts.conf.REQUESTER_TYPE_MODERN;

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
 *     @param {object} options.listUI - List area preset
 *         @param {object} options.listUI.type - List type ('simple' or 'table')
 *         @param {string} [options.listUI.item] - To customize item contents when list type is 'simple'
 *         @param {Array.<object>} [options.listUI.columnList] - To customize row contents when list type is 'table'
 * @example
 * // Case 1: Using normal transfer & simple list
 * //
 * // <!-- HTML -->
 * // <div id="uploader">
 * //     <input type="file" name="userfile[]">
 * //     <div class="tui-js-file-uploader-list"></div>
 * // </div>
 * //
 * var fileUploader = new tui.component.FileUploader($('#uploader'), {
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
 * var fileUploader = new tui.component.FileUploader($('#uploader'), {
 *     url: {
 *         send: 'http://localhost:3000/upload',
 *         remove: 'http://localhost:3000/remove'
 *     },
 *     isBatchTransfer: true,
 *     listUI: {
 *         type: 'table'
 *     }
 * });
 */
var Uploader = tui.util.defineClass(/**@lends Uploader.prototype */{
    init: function($container, options) {
        var $dropzone = $container.find('.' + classNames.DROPZONE);

        /**
         * Uploader element
         * @type {jQuery}
         * @private
         */
        this.$container = $container;

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
        this.formTarget = consts.conf.FORM_TARGET_NAME;

        /**
         * Target frame for CORS (IE7, 8, 9)
         * @private
         * @type {jQuery}
         */
        this.$targetFrame = this._createTargetFrame()
            .appendTo(this.$container);

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
         * Whether the user uses folder upload
         * @private
         * @type {boolean}
         */
        this.useFolder = !!(options.useFolder);

        /**
         * Whether the user uses drag&drop upload
         * @private
         * @type {boolean}
         */
        this.useDropzone = !!($dropzone);

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
        this.listView = new List(this.$container.find('.' + classNames.LIST_CONTAINER), options.listUI);

        if (this.useDropzone && !this.useFolder && utils.isSupportFileSystem()) {
            /**
             * Drag & Drop View
             * @private
             * @type {DragAndDrop}
             */
            this.dragView = new DragAndDrop($dropzone);
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
             * @event FileUploader#check
             * @param {object} evt - Check event data
             *     @param {string} evt.id - File id
             *     @param {string} evt.name - File name
             *     @param {string} evt.size - File size
             *     @param {boolean} evt.isChecked - Checked state
             * @example
             * FileUploader.on('check', function(evt) {
             *     console.log(evt.id + ' checked state is ' + evt.isChecked);
             * });
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
                this.updateList(data, 'remove');
                this.fire('remove', {
                    idList: keys(data)
                });
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

        if (this.useDropzone && this.dragView) {
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
                this.updateList(data, 'remove');
                this.fire('remove', {
                    idList: keys(data)
                });
            },
            error: function(data) {
                this.fire('error', data);
            },
            uploaded: function(data) {
                this.updateList(data.filelist);
                this.fire('success', data);
            }
        }, this);

        if (this.useDropzone && this.dragView) {
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
     * @param {object} data The data for remove files.
     * @private
     */
    removeFile: function(data) {
        if (!this.isBatchTransfer) {
            data = {
                idList: tui.util.keys(data)
            };
        }
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
        var checkedItems = {};

        tui.util.forEach(listView.items, function(item) {
            if (item.getCheckedState()) {
                checkedItems[item.id] = true;
            }
        });

        this.removeFile(checkedItems);
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
        return this.listView.getCheckedItemsId().length;
    },

    /**
     * Get checked file's total size
     * @returns {string} Total size with unit
     */
    getCheckedTotalSize: function() {
        var listView = this.listView;
        var totalSize = 0;

        tui.util.forEach(listView.items, function(item) {
            if (item.getCheckedState()) {
                totalSize += parseFloat(item.size);
            }
        });

        return utils.getFileSizeWithUnit(totalSize);
    }
});

tui.util.CustomEvents.mixin(Uploader);
module.exports = Uploader;

/**
 * Remove event
 * @event FileUploader#remove
 * @param {object} evt - Remove event data
 *     @param {Array.<string>} evt.idList - Removed item's id list
 * @example
 * @example
 * fileUploader.on('remove', function(evt) {
 *     console.log(evt.idList);
 * });
 */

/**
 * Error event
 * @event FileUploader#error
 * @param {Error} evt - Error data
 *     @param {string} evt.status - Error status
 *     @param {string} evt.message - Error message
 * @example
 * fileUploader.on('error', function(evt) {
 *     console.log(evt.status);
 * });
 */

/**
 * Success event
 * @event FileUploader#success
 * @param {object} evt - Server response data
 *     @param {Array} evt.filelist - Uploaded file list
 *     @param {number} [evt.success] - Uploaded file count
 *     @param {number} [evt.failed] - Failed file count
 *     @param {number} [evt.count] - Total count
 * @example
 * fileUploader.on('success', function(evt) {
 *     console.log(evt.filelist);
 * });
 */

/**
 * Update event when using batch transfer
 * @event FileUploader#update
 * @param {Array.<object>} evt - File list data
 *     @param {string} evt.id - File id
 *     @param {string} evt.name - File name
 *     @param {number} evt.size - File size
 * @example
 * fileUploader.on('update', function(evt) {
 *     console.log(evt.id);
 *     console.log(evt.name);
 *     console.log(evt.size);
 * });
 */
