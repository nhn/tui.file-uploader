/*!
 * tui-file-uploader.js
 * @version 3.1.2
 * @author NHNEnt FE Development Lab <dl_javascript@nhnent.com>
 * @license MIT
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("jquery"), require("tui-code-snippet"));
	else if(typeof define === 'function' && define.amd)
		define(["jquery", "tui-code-snippet"], factory);
	else if(typeof exports === 'object')
		exports["FileUploader"] = factory(require("jquery"), require("tui-code-snippet"));
	else
		root["tui"] = root["tui"] || {}, root["tui"]["FileUploader"] = factory(root["$"], (root["tui"] && root["tui"]["util"]));
})(this, function(__WEBPACK_EXTERNAL_MODULE_2__, __WEBPACK_EXTERNAL_MODULE_3__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "dist";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview The entry file of FileUploader components
	 * @author NHN Ent. FE Development Team
	 */

	'use strict';

	var FileUploader = __webpack_require__(1);

	__webpack_require__(13);

	module.exports = FileUploader;


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview FileUploader is core of file uploader component.
	 *               FileManager manage connector to connect server and update FileListView.
	 * @author NHN Ent. FE Development Lab <dl_javascript@nhnent.com>
	 */

	'use strict';

	var $ = __webpack_require__(2);
	var snippet = __webpack_require__(3);

	var consts = __webpack_require__(4);
	var utils = __webpack_require__(5);
	var Form = __webpack_require__(6);
	var List = __webpack_require__(7);
	var DragAndDrop = __webpack_require__(9);
	var OldRequester = __webpack_require__(10);
	var ModernRequester = __webpack_require__(12);

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


/***/ }),
/* 2 */
/***/ (function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_2__;

/***/ }),
/* 3 */
/***/ (function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_3__;

/***/ }),
/* 4 */
/***/ (function(module, exports) {

	/**
	 * @fileoverview Configuration or default values.
	 * @author NHN Ent. FE Development Lab <dl_javascript@nhnent.com>
	 */

	'use strict';

	/**
	 * Uploader config
	 * @type {object}
	 * @ignore
	 */
	module.exports.conf = {
	    REQUESTER_TYPE_MODERN: 'modernRequester',
	    REQUESTER_TYPE_OLD: 'oldRequester',
	    FORM_TARGET_NAME: 'tuiUploaderHiddenFrame'
	};

	/**
	 * Class names
	 * @type {object}
	 * @ignore
	 */
	module.exports.className = {
	    HIDDEN_FILE_INPUT: 'tui-js-hidden-file-input',
	    LIST_CONTAINER: 'tui-js-file-uploader-list',
	    LIST_ITEMS_CONTAINER: 'tui-js-file-uploader-list-items',
	    DROPZONE: 'tui-js-file-uploader-dropzone',
	    SUPPORT_DROPZONE: 'tui-dropzone-support',
	    DROP_ENABLED: 'tui-dropzone-enabled',
	    HAS_ITEMS: 'tui-has-items',
	    HAS_SCROLL: 'tui-has-scroll',
	    IS_CHECKED: 'tui-is-checked'
	};

	/*eslint-disable*/
	/**
	 * Default Htmls
	 * @type {object}
	 * @ignore
	 */
	module.exports.html = {
	    FORM: '<form enctype="multipart/form-data" id="tui-uploader-form" method="post"></form>',
	    HIDDEN_INPUT: '<input type="hidden" name="{{name}}" value="{{value}}">',
	    CHECKBOX: [
	        '<label class="tui-checkbox">',
	            '<span class="tui-ico-check"><input type="checkbox"></span>',
	        '</label>'
	    ].join(''),
	    REMOVE_BUTTON: '<button type="button" class="tui-btn-delete">Remove</button>'
	};

	/**
	 * Simple list template
	 * @type {object}
	 * @ignore
	 */
	module.exports.listTemplate = {
	    CONTAINER: '<ul class="tui-upload-lst {{listItemsClassName}}"></ul>',
	    LIST_ITEM: [
	        '<li class="tui-upload-item">',
	            '<span class="tui-filename-area">',
	                '<span class="tui-file-name">{{filename}}</span>',
	                '<span class="tui-file-tail"> ({{filesize}})</span>',
	            '</span>',
	            '{{removeButton}}',
	        '</li>'
	    ].join('')
	};

	/**
	 * Table list template
	 * @type {object}
	 * @ignore
	 */
	module.exports.tableTemplate = {
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
	                    '<th scope="col" width="32" style="border-right:0;">{{checkbox}}</th>',
	                    '<th scope="col" width="156">File Type</th>',
	                    '<th scope="col" width="362">File Name</th>',
	                    '<th scope="col" width="146" style="border-right:0">File Size</th>',
	                '</tr>',
	            '</thead>',
	            '<tbody class="tui-form-body {{listItemsClassName}}"></tbody>',
	        '</table>'
	    ].join(''),
	    LIST_ITEM: [
	        '<tr>',
	            '<td width="32">',
	                '<label class="tui-checkbox">{{checkbox}}</td>',
	            '<td width="156">{{filetype}}</td>',
	            '<td width="362">',
	                '<span class="tui-filename-area">',
	                    '<span class="tui-file-name">{{filename}}</span>',
	                '</span>',
	            '</td>',
	            '<td width="146">{{filesize}}</td>',
	        '</tr>'
	    ].join('')
	};


/***/ }),
/* 5 */
/***/ (function(module, exports) {

	/**
	 * @fileoverview This file contain utility methods for uploader.
	 * @author NHN Ent. FE Development Lab <dl_javascript@nhnent.com>
	 */

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
	 * @memberof utils
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
	    html = html.replace(/{{([^}]+)}}/g, function(mstr, name) {
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
	    var here = parseURL(window.location.href);
	    var target = parseURL(url);

	    return target.hostname !== here.hostname
	        || target.port !== here.port
	        || target.protocol !== here.protocol;
	}

	/**
	 * Remove first specified item from array, if it exists
	 * @param {*} item Item to look for
	 * @param {Array} arr Array to query
	 * @memberof utils
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
	 * @memberof utils
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


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview From-view makes a form by template. Add events for file upload.
	 * @author NHN Ent. FE Development Lab <dl_javascript@nhnent.com>
	 */

	'use strict';

	var $ = __webpack_require__(2);
	var snippet = __webpack_require__(3);

	var consts = __webpack_require__(4);
	var utils = __webpack_require__(5);

	var isSupportFormData = utils.isSupportFormData();
	var HIDDEN_FILE_INPUT_CLASS = consts.className.HIDDEN_FILE_INPUT;
	var STAMP_ID = '__fe_id';

	/**
	 * This view control input element typed file.
	 * @class Form
	 * @param {Uploader} uploader - Uploader instance
	 * @ignore
	 */
	var Form = snippet.defineClass(/** @lends View.Form.prototype **/{
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
	        var $fileInput = uploader.$container.find(':file');
	        var $el = $(this._html.FORM)
	            .append(uploader.$container.children())
	            .attr(attributes);

	        this.$el = $el;
	        this.$fileInput = $fileInput;

	        this._setFileInput();

	        if (uploader.isBatchTransfer) {
	            this.$submit = uploader.$container.find(':submit');
	        }

	        if (uploader.isCrossDomain && !isSupportFormData) {
	            this._setHiddenInputForCORS();
	        }

	        uploader.$container.append(this.$el);

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
	        return snippet.extend({}, consts.html, template);
	    },

	    /**
	     * Set property value to file input element
	     * @private
	     */
	    _setFileInput: function() {
	        var isMultiple = this._isMultiple;
	        var useFolder = this._useFolder;

	        this.$fileInput.attr('multiple', isMultiple);

	        this.$fileInput.prop({
	            multiple: isMultiple,
	            directory: useFolder,
	            mozdirectory: useFolder,
	            webkitdirectory: useFolder
	        });
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
	        var $newFileInput = $(this.$fileInput[0].outerHTML);

	        this.$fileInput.after($newFileInput);
	        this.$fileInput.remove();
	        this.$fileInput = $newFileInput;

	        if (snippet.hasStamp(this.$fileInput[0])) { // for old browser
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

	snippet.CustomEvents.mixin(Form);
	module.exports = Form;


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview FileListView listing files and display states(like size, count).
	 * @author NHN Ent. FE Development Lab <dl_javascript@nhnent.com>
	 */

	'use strict';

	var $ = __webpack_require__(2);
	var snippet = __webpack_require__(3);

	var utils = __webpack_require__(5);
	var Item = __webpack_require__(8);
	var consts = __webpack_require__(4);

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


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview ItemView make element to display added file information. It has attached file ID to request for remove.
	 * @author NHN Ent. FE Development Lab <dl_javascript@nhnent.com>
	 */

	'use strict';

	var $ = __webpack_require__(2);
	var snippet = __webpack_require__(3);

	var consts = __webpack_require__(4);
	var utils = __webpack_require__(5);

	var classNames = consts.className;
	var htmls = consts.html;

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
	var Item = snippet.defineClass(/** @lends Item.prototype **/{
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
	        this.id = data.id;

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
	        this.$checkbox.on('change', $.proxy(this._onChange, this));
	        this.$removeButton.on('click', $.proxy(this._onClickEvent, this));
	    },

	    /**
	     * Change event handler
	     * @private
	     */
	    _onChange: function() {
	        var state = !!this.$checkbox.prop('checked');
	        this._changeCheckbox(state);
	        this.fire('check', {
	            id: this.id,
	            name: this.name,
	            size: this.size,
	            state: state
	        });
	    },

	    /**
	     * Event-handle for delete button clicked.
	     * @private
	     */
	    _onClickEvent: function() {
	        var data = {};
	        data[this.id] = true;
	        this.fire('remove', data);
	    },

	    /**
	     * Change checkbox view state
	     * @param {boolean} state - Checked state
	     * @private
	     */
	    _changeCheckbox: function(state) {
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
	     * Change checkbox state
	     * @param {boolean} state - Checked state
	     */
	    changeCheckboxState: function(state) {
	        this.$checkbox.prop('checked', state);
	        this._changeCheckbox(state);
	    },

	    /**
	     * Get state of checkbox
	     * @returns {boolean} Checkbox state
	     */
	    getCheckedState: function() {
	        return this.$checkbox.prop('checked');
	    },

	    /**
	     * Destroy item
	     */
	    destroy: function() {
	        this.$el.remove();
	    }
	});

	snippet.CustomEvents.mixin(Item);
	module.exports = Item;


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview This file is about drag and drop file to send. Drag and drop is running via file api.
	 * @author NHN Ent. FE Development Lab <dl_javascript@nhnent.com>
	 */

	'use strict';

	var $ = __webpack_require__(2);
	var snippet = __webpack_require__(3);

	var consts = __webpack_require__(4);

	var SUPPORT_DROPZONE_CLASS = consts.className.SUPPORT_DROPZONE;
	var DROP_ENABLED_CLASS = consts.className.DROP_ENABLED;

	/**
	 * Makes drag and drop area, the dropped file is added via event drop event.
	 * @class DragAndDrop
	 * @param {jQuery} $el - Dropzone element
	 * @ignore
	 */
	var DragAndDrop = snippet.defineClass(/** @lends DragAndDrop.prototype */{
	    init: function($el) {
	        /**
	         * Drop zone jQuery-element
	         * @type {jQuery}
	         */
	        this.$el = $el.addClass(SUPPORT_DROPZONE_CLASS);

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
	        var files = snippet.pick(e, 'originalEvent', 'dataTransfer', 'files');

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

	snippet.CustomEvents.mixin(DragAndDrop);

	module.exports = DragAndDrop;


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview Requester for old browsers.
	 * @author NHN Ent. FE Development Lab <dl_javascript@nhnent.com>
	 */

	'use strict';

	var $ = __webpack_require__(2);
	var snippet = __webpack_require__(3);

	var Pool = __webpack_require__(11);
	var consts = __webpack_require__(4);

	var TYPE = consts.conf.REQUESTER_TYPE_OLD;

	/**
	 * Old requester
	 * @param {Uploader} uploader - Uploader
	 * @class
	 * @ignore
	 */
	var Old = snippet.defineClass(/** @lends Old.prototype */{
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
	            data = snippet.pick(frameBody, 'firstChild', 'data');
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
	        var id = snippet.stamp(el);

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
	     * @param {Object} params - Removed item's id list (idList: [])
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
	     * Remove file
	     * It is used for batch transfer.
	     * @param {Object} removedItems - Removed items info
	     * @private
	     */
	    _removeWhenBatch: function(removedItems) {
	        snippet.forEach(removedItems, function(id, name) {
	            this.pool.remove(id, name);
	        }, this);

	        this.fire('removed', removedItems);
	    },

	    /**
	     * Clear the pool
	     */
	    clear: function() {
	        this.pool.empty();
	    }
	});

	snippet.CustomEvents.mixin(Old);
	module.exports = Old;


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview This is manager of input elements that act like file pool.
	 * @author NHN Ent. FE Development Lab <dl_javascript@nhnent.com>
	 */

	'use strict';

	var snippet = __webpack_require__(3);

	var consts = __webpack_require__(4);

	var forEach = snippet.forEach;
	var hasStamp = snippet.hasStamp;
	var stamp = snippet.stamp;

	var HIDDEN_FILE_INPUT_CLASS = consts.className.HIDDEN_FILE_INPUT;

	/**
	 * The pool for save files.
	 * It's only for input[file] element save at browser that does not support file api.
	 * @param {HTMLElement} planet - Form element
	 * @class Pool
	 * @ignore
	 */
	var Pool = snippet.defineClass(/** @lends Pool.prototype */{
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

	        if (!id) {
	            return;
	        }

	        this.files[id] = inputFileEl;
	    },

	    /**
	     * Remove a input element[type=file] from pool.
	     * @param {string} id - File's id
	     * @returns {boolean} result
	     */
	    remove: function(id) {
	        var element = this.files[id];

	        if (!element) {
	            return false;
	        }

	        delete this.files[id];

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


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview Requester for modern browsers.
	 * @author NHN Ent. FE Development Lab <dl_javascript@nhnent.com>
	 */

	'use strict';

	var $ = __webpack_require__(2);
	var snippet = __webpack_require__(3);

	var consts = __webpack_require__(4);

	var TYPE = consts.conf.REQUESTER_TYPE_MODERN;
	var forEach = snippet.forEach;

	/**
	 * Modern requester
	 * @param {Uploader} uploader - Uploader
	 * @class
	 * @ignore
	 */
	var Modern = snippet.defineClass(/** @lends Modern.prototype */{
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
	        this.fire('uploaded', data);
	    },

	    /**
	     * Store files to local pool
	     * @param {Array.<File> | File} [files] - A file or files
	     */
	    store: function(files) {
	        var pool = this.pool;
	        var stamp = snippet.stamp;
	        var data = [];

	        files = snippet.toArray(files || this.formView.$fileInput[0].files);
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
	            dataType: 'json',
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
	     * @param {Object} params - Removed item's id list (idList: [])
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
	     * Remove file
	     * It is used for batch transfer.
	     * @param {Object} removedItems - Removed items info
	     * @private
	     */
	    _removeWhenBatch: function(removedItems) {
	        this.pool = snippet.filter(this.pool, function(file) {
	            var id = snippet.hasStamp(file) ? snippet.stamp(file) : file.id;

	            return !removedItems[id];
	        });

	        this.fire('removed', removedItems);
	    },

	    /**
	     * Clear the pool
	     */
	    clear: function() {
	        this.pool.length = 0;
	    }
	});

	snippet.CustomEvents.mixin(Modern);
	module.exports = Modern;


/***/ }),
/* 13 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ })
/******/ ])
});
;