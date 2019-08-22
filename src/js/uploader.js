/**
 * @fileoverview FileUploader is core of file uploader component.
 *               FileManager manage connector to connect server and update FileListView.
 * @author NHN. FE Development Lab <dl_javascript@nhn.com>
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
 *     @param {object} options.url - Server request urls
 *         @param {string} options.url.send - To send files to server
 *         @param {string} [options.url.remove] - To remove files on server (Using when transfer type is normal)
 *     @param {string} [options.redirectURL] - This option is only used in IE7 for CORS
 *     @param {boolean} [options.isMultiple] - Whether selecting multiple file or not
 *     @param {boolean} [options.isBatchTransfer] - Whether using batch transfer or not
 *     @param {boolean} [options.useFolder] - Whether the folder can be selected or not. If it is ture, 'isMultiple' option will be ignored
 *     @param {object} options.listUI - To set a list view
 *         @param {object} options.listUI.type - List type ('simple' or 'table')
 *         @param {string} [options.listUI.item] - List item's template when using list type is 'simple'
 *         @param {Array.<object>} [options.listUI.columnList] - List item's template when using list type is 'table'
 *     @param {boolean} [options.usageStatistics=true] Send the hostname to google analytics.
 *         If you do not want to send the hostname, this option set to false.
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
            snippet.sendHostname('file-uploader', 'UA-129987462-1');
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
            position: 'absolute',
            width: '0px',
            height: '0px'
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
                 * @type {object} evt - Check event data
                 * @property {string} id - File id
                 * @property {string} name - File name
                 * @property {string} size - File size
                 * @property {boolean} state - Checked state
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
                 * @event Uploader#checkAll
                 * @type {object} evt - Check event data
                 * @property {string} filelist - Checked file list
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
 * @type {object} evt - Removed item's data (ex: {id: state})
 * @example
 * fileUploader.on('remove', function(evt) {
 *     console.log('state: ' + evt['fileId']);
 * });
 */

/**
 * Error event
 * @event Uploader#error
 * @type {object} evt - Error data
 * @property {string} status - Error status
 * @property {string} message - Error message
 * @example
 * fileUploader.on('error', function(evt) {
 *     console.log(evt.status);
 * });
 */

/**
 * Success event
 * @event Uploader#success
 * @type {object} evt - Server response data
 * @property {Array} filelist - Uploaded file list
 * @property {number} [success] - Uploaded file count
 * @property {number} [failed] - Failed file count
 * @property {number} [count] - Total count
 * @example
 * fileUploader.on('success', function(evt) {
 *     console.log(evt.filelist);
 * });
 */

/**
 * Update event when using batch transfer
 * @event Uploader#update
 * @type {object} evt - Updated file list
 * @property {Array} filelist - Updated file list
 * @example
 * fileUploader.on('update', function(evt) {
 *     console.log(evt.filelist);
 * });
 */
