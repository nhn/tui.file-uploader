/**
 * @fileoverview FileUploader is core of file uploader component.
 *               FileManager manage connector to connect server and update FileListView.
 * @author NHN Ent. FE Development Lab <dl_javascript@nhnent.com>
 */

'use strict';

var $ = require('jquery');
var snippet = require('tui-code-snippet');

var consts = require('./consts');
var utils = require('./utils');
var Form = require('./view/form');
var List = require('./view/list');
var DragAndDrop = require('./view/drag');
var OldRequester = require('./requester/old');
var ModernRequester = require('./requester/modern');

var keys = snippet.keys;
var forEach = snippet.forEach;
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
 *     @param {boolean} [options.usageStatistics=true] Send the host name to google analytics.
 *         If you do not want to send the host name, this option set to false.
 * @example
 * // Case 1: Using normal transfer & simple list
 * //
 * // <!-- HTML -->
 * // <div id="uploader">
 * //     <input type="file" name="userfile[]">
 * //     <div class="tui-js-file-uploader-list"></div>
 * // </div>
 * //
 * var FileUploader = tui.FileUploader; // require('tui-file-uploader');
 * var instance = new FileUploader($('#uploader'), {
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
 * var FileUploader = tui.FileUploader; // require('tui-file-uploader');
 * var instance = new FileUploader($('#uploader'), {
 *     url: {
 *         send: 'http://localhost:3000/upload'
 *     },
 *     isBatchTransfer: true,
 *     listUI: {
 *         type: 'table'
 *     }
 * });
 */
var Uploader = snippet.defineClass(/** @lends Uploader.prototype */{
    init: function($container, options) { // eslint-disable-line complexity
        var $dropzone = $container.find('.' + classNames.DROPZONE);

        options = snippet.extend({
            usageStatistics: true
        }, options);

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
        this.isSupportPostMessage = !!(snippet.pick(this.$targetFrame, '0', 'contentWindow', 'postMessage'));

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

        if (options.usageStatistics) {
            utils.sendHostNameToGA();
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
        this.listView.on({
            remove: this.removeFile,
            check: function(data) {
                /**
                 * Check event
                 * @event Uploader#check
                 * @param {object} evt - Check event data
                 *     @param {string} evt.id - File id
                 *     @param {string} evt.name - File name
                 *     @param {string} evt.size - File size
                 *     @param {boolean} evt.state - Checked state
                 * @example
                 * FileUploader.on('check', function(evt) {
                 *     console.log(evt.id + ' checked state is ' + evt.state);
                 * });
                 */
                this.fire('check', data);
            },
            checkAll: function(data) {
                /**
                 * Check event
                 * @api
                 * @event Uploader#checkAll
                 * @param {object} evt - Check event data
                 *     @param {string} evt.filelist - Checked file list
                 * @example
                 * FileUploader.on('checkAll', function(evt) {
                 *     console.log(evt.filelist);
                 * });
                 */
                this.fire('checkAll', data);
            }
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
                this.fire('update', {filelist: data});
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
                idList: keys(data)
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
     * @private
     */
    clear: function() {
        this._requester.clear();
        this.formView.clear();
        this.listView.clear();
    },

    /**
     * Get checked list items
     * @returns {object} Checked items
     */
    getCheckedList: function() {
        return this.listView.getCheckedItems();
    },

    /**
     * Remove file list
     * @param {object} items - Removed file's data
     */
    removeList: function(items) {
        var checkedItems = {};

        forEach(items, function(item) {
            checkedItems[item.id] = true;
        });

        this.removeFile(checkedItems);
    },

    /**
     * Get file's total size
     * @param {object} items - File data list to get total size
     * @returns {string} Total size with unit
     */
    getTotalSize: function(items) {
        var totalSize = 0;

        forEach(items, function(item) {
            totalSize += parseFloat(item.size);
        });

        return utils.getFileSizeWithUnit(totalSize);
    }
});

snippet.CustomEvents.mixin(Uploader);
module.exports = Uploader;

/**
 * Remove event
 * @event Uploader#remove
 * @param {object} evt - Removed item's data (ex: {id: state})
 * @example
 * fileUploader.on('remove', function(evt) {
 *     console.log('state: ' + evt['fileId']);
 * });
 */

/**
 * Error event
 * @event Uploader#error
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
 * @event Uploader#success
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
 * @event Uploader#update
 * @param {object} evt - Updated file list
 *     @param {Array} evt.filelist - Updated file list
 * @example
 * fileUploader.on('update', function(evt) {
 *     console.log(evt.filelist);
 * });
 */
