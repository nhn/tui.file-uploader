(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
tui.util.defineNamespace('tui.component.Uploader', require('./src/js/uploader.js'));


},{"./src/js/uploader.js":6}],2:[function(require,module,exports){
/**
 * @fileoverview Configuration or default values.
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';

/**
 * Uploader config
 */
module.exports.CONF = {
    FILE_FILED_NAME: 'userfile[]',
    DROP_ENABLED_CLASS: 'dropEnabled',
    HIDDEN_FILE_INPUT_CLASS: 'hiddenFileInput',
    REQUESTER_TYPE_MODERN: 'modernRequester',
    REQUESTER_TYPE_OLD: 'oldRequester',
    FORM_TARGET_NAME: 'tuiUploaderHiddenFrame',
    REMOVE_BUTTON_CLASS: 'removeButton'
};

/**
 * Default Htmls
 * @type {{input: string, item: string}}
 */
module.exports.HTML = {
    form: [
        '<form enctype="multipart/form-data" id="tui-uploader-form" method="post">',
        '</form>'
    ].join(''),
    submit: '<button class="batchSubmit" type="submit">SEND</button>',
    fileInput: '<input type="file" id="fileAttach" {{directory}} name="{{fileField}}" {{multiple}} />',
    hiddenInput: '<input type="hidden" name="{{name}}" value="{{value}}">',
    button: '<button type="button">{{text}}</button>',
    listItem: [
        '<li class="filetypeDisplayClass">',
            '<span class="fileicon {{filetype}}">{{filetype}}</span>',
            '<span class="file_name">{{filename}}</span>',
            '<span class="file_size">{{filesize}}</span>',
        '</li>'
    ].join(''),
    dragAndDrop: '<div class="dropzone"></div>'
};

},{}],3:[function(require,module,exports){
/**
 * @fileoverview This is manager of input elements that act like file pool.
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';

var consts = require('./consts');

var HIDDEN_FILE_INPUT_CLASS = consts.CONF.HIDDEN_FILE_INPUT_CLASS,
    forEach = tui.util.forEach,
    hasStamp = tui.util.hasStamp,
    stamp = tui.util.stamp;

/**
 * The pool for save files.
 * It's only for input[file] element save at browser that does not support file api.
 * @param {HTMLElement} planet - Form element
 * @class Pool
 */
var Pool = tui.util.defineClass(/** @lends Pool.prototype */{/*eslint-disable*/
    init: function(planet) {/*eslint-enable*/
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
        var id = hasStamp(inputFileEl) && stamp(inputFileEl),
            filename, key;

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
     * @return {boolean} result
     */
    remove: function(params) {
        var key = params.id + params.name,
            element = this.files[key];

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

var TYPE = consts.CONF.REQUESTER_TYPE_MODERN,
    forEach = tui.util.forEach;

/**
 * Modern requester
 * @param {Uploader} uploader - Uploader
 * @class
 */
var Modern = tui.util.defineClass(/** @lends Modern.prototype */{/*eslint-disable*/
    init: function(uploader) {/*eslint-enable*/
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
        var pool = this.pool,
            stamp = tui.util.stamp,
            data = [];

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
        var field = this.uploader.fileField,
            $form = this.formView.$el.clone(),
            formData;

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
            url: uploader.url.remove,
            dataType: 'jsonp',
            data: params,
            success: $.proxy(function(data) {
                data.type = 'remove';
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
        var pool = this.pool,
            hasStamp = tui.util.hasStamp,
            stamp = tui.util.stamp,
            result = false;

        forEach(pool, function(file, index) {
            if (hasStamp(file) && (stamp(file) === params.id)) {
                pool.splice(index, 1);
                result = true;
                return false;
            }
        });

        this.fire('removed', tui.util.extend({
            message: result ? 'success' : 'fail'
        }, params));
    },

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
 */
var Old = tui.util.defineClass(/** @lends Old.prototype */{/*eslint-disable*/
    init: function(uploader) {/*eslint-enable*/
        var $hiddenFrame = uploader.$targetFrame,
            formView = uploader.formView;

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
        var frameBody,
            data;

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
        var el = this.formView.$fileInput[0],
            id = tui.util.stamp(el);

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
                data.type = 'remove';
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
        var result = this.pool.remove(params);

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
/**
 * @fileoverview FileUploader is core of file uploader component.<br>FileManager manage connector to connect server and update FileListView.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';
var consts = require('./consts');
var utils = require('./utils');
var Form = require('./view/form');
var List = require('./view/list');
var DragAndDrop = require('./view/drag');
var OldRequester = require('./requester/old');
var ModernRequester = require('./requester/modern');

var REQUESTER_TYPE_MODERN = consts.CONF.REQUESTER_TYPE_MODERN;
/**
 * FileUploader act like bridge between connector and view.
 * It makes connector and view with option and environment.
 * It control and make connection among modules.
 * @constructor
 * @param {object} options The options to set up file uploader modules.
 *  @param {object} options.url The url is file server.
 *      @param {string} options.url.send The url is for file attach.
 *      @param {string} options.url.remove The url is for file detach.
 *  @param {string} options.formTarget The target for x-domain jsonp case.
 *  @param {object} options.listInfo The element info to display file list information.
 *  @param {string} [options.fileField='userFile[]'] The field name of input file element.
 *  @param {boolean} options.useFolder Whether select unit is folder of not. If this is ture, multiple will be ignored.
 *  @param {boolean} options.isMultiple Whether enable multiple select or not.
 * @param {jQuery} $el Root Element of Uploader
 * @example
 * var uploader = new tui.component.Uploader({
 *     url: {
 *         send: "http://fe.nhnent.com/etc/etc/uploader/uploader.php",
 *         remove: "http://fe.nhnent.com/etc/etc/uploader/remove.php"
 *     },
 *     listInfo: {
 *         list: $('#files'),
 *         count: $('#file_count'),
 *         size: $('#size_count')
 *     }
 * }, $('#uploader'));
 */
var Uploader = tui.util.defineClass(/**@lends Uploader.prototype */{/*eslint-disable*/
    init: function(options, $el) {/*eslint-enable*/
        /**
         * Uploader element
         * @type {jQuery}
         */
        this.$el = $el;

        /**
         * Send/Remove url
         * @type {{send: string, remove: string}}
         */
        this.url = options.url;

        /**
         * Redirect URL for CORS(response, IE7)
         * @type {string}
         */
        this.redirectURL = options.redirectURL;

        /**
         * Form target name for CORS (IE7, 8, 9)
         * @type {string}
         */
        this.formTarget = consts.CONF.FORM_TARGET_NAME;

        /**
         * Target frame for CORS (IE7, 8, 9)
         * @type {jQuery}
         */
        this.$targetFrame = this._createTargetFrame()
            .appendTo(this.$el);

        /**
         * Input file - field name
         * @type {string}
         */
        this.fileField = options.fileField || consts.CONF.FILE_FILED_NAME;

        /**
         * Whether the uploader uses batch-transfer
         * @type {boolean}
         */
        this.isBatchTransfer = !!(options.isBatchTransfer);

        /**
         * Whether the sending/removing urls are x-domain.
         * @type {boolean}
         */
        this.isCrossDomain = utils.isCrossDomain(this.url.send);

        /**
         * Whether the browser supports PostMessage API
         * @type {boolean}
         */
        this.isSupportPostMessage = !!(tui.util.pick(this.$targetFrame, '0', 'contentWindow', 'postMessage'));

        /**
         * Whether the user uses multiple upload
         * @type {boolean}
         */
        this.isMultiple = !!(options.isMultiple);

        /**
         * Whether the user uses drag&drop upload
         * @type {boolean}
         */
        this.useDrag = !!(options.useDrag);

        /**
         * Whether the user uses folder upload
         * @type {boolean}
         */
        this.useFolder = !!(options.useFolder);

        if (this.useDrag && !this.useFolder && utils.isSupportFileSystem()) {
            /**
             * Drag & Drop View
             * @type {DragAndDrop}
             */
            this.dragView = new DragAndDrop(this);
        }

        /**
         * From View
         * @type {Form}
         */
        this.formView = new Form(this);

        /**
         * List View
         * @type {List}
         */
        this.listView = new List(options.listInfo);

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
            /**
             * Success event
             *  in IE8, 9 - using PostMessageAPI for CORS
             * @api
             * @event Uploader#success
             * @param {object} data - Server response data
             *  @param {Array} data.filelist - Uploaded file list
             *  @param {number} [data.success] - Uploaded file count
             *  @param {number} [data.failed] - Failed file count
             *  @param {number} [data.count] - Total count
             */
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
                this.updateList(data);
                /**
                 * Remove event
                 *  in batchTransfer
                 * @api
                 * @event Uploader#remove
                 * @param {object} data - Remove data from this component
                 *  @param {string} data.message - 'success' or 'fail'
                 *  @param {string} data.name - file name
                 *  @param {string} data.id - file id
                 */
                this.fire('remove', data);
            },
            error: function(data) {
                /**
                 * Error event
                 *  in batchTransfer
                 * @api
                 * @event Uploader#error
                 * @param {Error} data - Error data
                 *  @param {string} data.status - Error status
                 *  @param {string} data.message - Error message
                 */
                this.fire('error', data);
            },
            uploaded: function(data) {
                this.clear();
                /**
                 * Success event
                 *  in batchTransfer
                 * @api
                 * @event Uploader#success
                 * @param {object} data - Server response data
                 *  @param {Array} data.filelist - Uploaded file list
                 *  @param {number} [data.success] - Uploaded file count
                 *  @param {number} [data.failed] - Failed file count
                 *  @param {number} [data.count] - Total count
                 */
                this.fire('success', data);
            },
            stored: function(data) {
                this.updateList(data);
                /**
                 * Update event
                 *  in batchTransfer
                 * @api
                 * @event Uploader#update
                 * @param {Array.<object>} data - File list data
                 * Array having objects<br>{id: string, name: string, size: number}
                 */
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
                this.updateList(data);
                /**
                 * Remove event
                 *  in normalTransfer
                 * @api
                 * @event Uploader#remove
                 * @param {object} data - Remove data from server response
                 *  @param {string} data.message - 'success' or 'fail'
                 *  @param {string} data.name - file name
                 *  @param {string} data.id - file id
                 */
                this.fire('remove', data);
            },
            error: function(data) {
                /**
                 * Error event
                 *  in normalTransfer
                 * @api
                 * @event Uploader#error
                 * @param {Error} data - Error data
                 *  @param {string} data.status - Error status
                 *  @param {string} data.message - Error message
                 */
                this.fire('error', data);
            },
            uploaded: function(data) {
                this.updateList(data.filelist);
                /**
                 * Success event
                 *  in normalTransfer
                 * @api
                 * @event Uploader#success
                 * @param {object} data - Server response data
                 *  @param {Array} data.filelist - Uploaded file list
                 *  @param {number} [data.success] - Uploaded file count
                 *  @param {number} [data.failed] - Failed file count
                 *  @param {number} [data.count] - Total count
                 */
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
     * @param {object} [info] The data for update list
     */
    updateList: function(info) {
        this.listView.update(info);
        if (this.isBatchTransfer) {
            this.listView.updateTotalInfo(info);
        } else {
            this.listView.updateTotalInfo();
        }
    },

    /**
     * Callback for custom send event
     * @param {Event} [event] - Form submit event
     */
    sendFile: function(event) {
        this.store();
        this.submit(event);
    },

    /**
     * Callback for custom remove event
     * @param {object} data The data for remove file.
     */
    removeFile: function(data) {
        this._requester.remove(data);
    },

    /**
     * Submit for data submit to server
     * @param {Event} [event] - Form submit event
     */
    submit: function(event) {
        if (event && this._requester.TYPE === REQUESTER_TYPE_MODERN) {
            event.preventDefault();
        }
        this._requester.upload();
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
     * Store input element to pool.
     * @param {Array.<File> | File} [files] - A file or files
     */
    store: function(files) {
        this._requester.store(files);
    }
});

tui.util.CustomEvents.mixin(Uploader);
module.exports = Uploader;

},{"./consts":2,"./requester/modern":4,"./requester/old":5,"./utils":7,"./view/drag":8,"./view/form":9,"./view/list":11}],7:[function(require,module,exports){
/**
 * @fileoverview This file contain utility methods for uploader.
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */

'use strict';
/**
 * @namespace utils
 */
var IS_SUPPORT_FILE_SYSTEM = !!(window.File && window.FileReader && window.FileList && window.Blob),
    IS_SUPPORT_FORM_DATA = !!(window.FormData || null);

/**
 * Parse url
 * @param {string} url - url for parsing
 * @returns {Object} URL information
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
    var units = ['B', 'KB', 'MB', 'GB', 'TB'],
        bytes = parseInt(bytes, 10),
        exp = Math.log(bytes) / Math.log(1024) | 0,
        result = (bytes / Math.pow(1024, exp)).toFixed(2);

    return result + units[exp];
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
    html = html.replace(/\{\{([^\}]+)\}\}/g, function (mstr, name) {
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

module.exports = {
    getFileSizeWithUnit: getFileSizeWithUnit,
    isSupportFileSystem: isSupportFileSystem,
    isSupportFormData: isSupportFormData,
    template: template,
    isCrossDomain: isCrossDomain
};

},{}],8:[function(require,module,exports){
/**
 * @fileoverview This file is about drag and drop file to send. Drag and drop is running via file api.
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';
var consts = require('../consts');

/**
 * Makes drag and drop area, the dropped file is added via event drop event.
 * @class DragAndDrop
 * @param {Uploader} uploader - Uploader
 */
var DragAndDrop = tui.util.defineClass(/** @lends DragAndDrop.prototype */{/*eslint-disable*/
    init: function(uploader) {/*eslint-enable*/
        var html = consts.HTML.dragAndDrop;

        /**
         * Drop zone jQuery-element
         * @type {jQuery}
         */
        this.$el = null;

        /**
         * Class for drop enabled
         * @type {string}
         * @private
         */
        this._enableClass = consts.CONF.DROP_ENABLED_CLASS;

        this._render(html, uploader);
        this._addEvent();
    },

    /**
     * Renders drag and drop area
     * @param {string} html The html string to make darg zone
     * @param {object} uploader The core instance of this component
     * @private
     */
    _render: function(html, uploader) {
        this.$el = $(html)
            .appendTo(uploader.$el);
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
/**
 * @fileoverview From-view makes a form by template. Add events for file upload.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';
var consts = require('../consts'),
    utils = require('../utils');

var isSupportFormData = utils.isSupportFormData(),
    HIDDEN_FILE_INPUT_CLASS = consts.CONF.HIDDEN_FILE_INPUT_CLASS;

/**
 * This view control input element typed file.
 * @param {Uploader} uploader - Uploader instance
 * @constructor View.Form
 */
var Form = tui.util.defineClass(/**@lends View.Form.prototype **/{/*eslint-disable*/
    init: function(uploader) {/*eslint-enable*/
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
        var uploader = this._uploader,
            $fileInput = this._createFileInput(),
            $el = $(this._html.form)
                .append($fileInput)
                .attr(attributes);

        this.$fileInput = $fileInput;
        this.$el = $el;

        if (uploader.isBatchTransfer) {
            this._setSubmitElement();
        }

        if (uploader.isCrossDomain && !isSupportFormData) {
            this._setHiddenInputForCORS();
        }
        uploader.$el.append(this.$el);

        this._addEvent();
    },

    /**
     * Set submit element
     * @private
     */
    _setSubmitElement: function() {
        this.$submit = $(this._html.submit);
        this.$submit.appendTo(this.$el);
    },

    /**
     * Set hidden input element for CORS.
     *  Hidden input of PostMessage or RedirectURL.
     * @private
     */
    _setHiddenInputForCORS: function() {
        var props, $hiddenInput,
            uploader = this._uploader,
            redirectURL = uploader.redirectURL;

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
            $hiddenInput = $(utils.template(props, this._html.hiddenInput));
            $hiddenInput.appendTo(this.$el);
        }
    },

    /**
     * Set all of input elements html strings.
     * @private
     * @param {object} [template] The template is set form customer.
     * @return {Object.<string, string>} The html template string set for form.
     */
    _setTemplate: function(template) {
        return tui.util.extend({}, consts.HTML, template);
    },

    /**
     * Makes and returns jquery element
     * @private
     * @return {jQuery} The jquery object wrapping original input element
     */
    _createFileInput: function() {
        var map = {
            multiple: this._isMultiple ? 'multiple' : '',
            fileField: this._uploader.fileField,
            directory: this._useFolder ? 'directory mozdirectory webkitdirectory' : ''
        };

        return $(utils.template(map, this._html.fileInput));
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
        this.$fileInput.attr('title', ' ');
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
        this.$fileInput.remove();
        this.$fileInput = this._createFileInput();
        if (this.$submit) {
            this.$submit.before(this.$fileInput);
        } else {
            this.$el.append(this.$fileInput);
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
var Item = tui.util.defineClass(/** @lends Item.prototype **/{/*eslint-disable*/
    init: function(options) {/*eslint-enable*/
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

},{"../consts":2,"../utils":7}],11:[function(require,module,exports){
/**
 * @fileoverview FileListView listing files and display states(like size, count).
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';
var utils = require('../utils');
var Item = require('./item');

/**
 * List has items. It can add and remove item, and get total usage.
 * @param {Uploader} uploader - Uploader
 * @param {Object.<string, jQuery>} listInfo
 *  @param {jQuery} listInfo.list - List jquery-element
 *  @param {jQuery} listInfo.count - Count jquery-element
 *  @param {jQuery} listInfo.size - Size jquery-element
 * @class List
 */
var List = tui.util.defineClass(/** @lends List.prototype */{/*eslint-disable*/
    init : function(listInfo) {/*eslint-enable*/
        /**
         * Items
         * @type {Array.<Item>}
         */
        this.items = [];

        /**
         * jQuery-element of List
         * @type {jQuery}
         */
        this.$el = listInfo.list;

        /**
         * jQuery-element of count
         * @type {jQuery}
         */
        this.$counter = listInfo.count;

        /**
         * jQuery-element of total size
         * @type {jQuery}
         */
        this.$size = listInfo.size;
    },

    /**
     * Update item list
     * @param {object} data - File information(s) with type
     * @param {object} [data.type] - 'remove' or not.
     */
    update: function(data) {
        if (data.type === 'remove') {
            this._removeFileItem(data.id);
        } else {
            this._addFileItems(data);
        }
    },

    /**
     * Update items total count, total size information.
     * @param {object} [info] A information to update list.
     *  @param {array} info.items The list of file information.
     *  @param {string} info.size The total size.
     *  @param {string} info.count The count of files.
     */
    updateTotalInfo: function(info) {
        if (info) {
            this._updateTotalCount(info.count);
            this._updateTotalUsage(info.size);
        } else {
            this._updateTotalCount();
            this._updateTotalUsage();
        }
    },

    /**
     * Update items total count and refresh element
     * @param {(number|string)} [count] Total file count
     * @private
     */
    _updateTotalCount: function(count) {
        if (!tui.util.isExisty(count)) {
            count = this.items.length;
        }

        this.$counter.html(count);
    },

    /**
     * Update items total size and refresh element
     * @param {(number|string)} [size] Total files sizes
     * @private
     */
    _updateTotalUsage: function(size) {
        if (!tui.util.isExisty(size)) {
            size = this._getSumAllItemUsage();
        }
        if (tui.util.isNumber(size) && !isNaN(size)) {
            size = utils.getFileSizeWithUnit(size);
            this.$size.html(size);
            this.$size.show();
        } else {
            this.$size.hide();
        }
    },

    /**
     * Sum sizes of all items.
     * @returns {number} totalSize
     * @private
     */
    _getSumAllItemUsage: function() {
        var items = this.items,
            totalUsage = 0;

        tui.util.forEach(items, function(item) {
            totalUsage += parseFloat(item.size);
        });

        return totalUsage;
    },

    /**
     * Add file items
     * @param {object} target Target item information.
     * @private
     */
    _addFileItems: function(target) {
        if (!tui.util.isArraySafe(target)) { // for target from iframe, use "isArraySafe"
            target = [target];
        }
        tui.util.forEach(target, function(data) {
            this.items.push(this._createItem(data));
        }, this);
    },

    /**
     * Remove file item
     * @param {string} id - The item id to remove
     * @private
     */
    _removeFileItem: function(id) {
        tui.util.forEach(this.items, function(item, index) {
            if (id === item.id) {
                item.destroy();
                this.items.splice(index, 1);
                return false;
            }
        }, this);
    },

    /**
     * Create item By Data
     * @param {object} data - Data for list items
     * @returns {Item} Item
     * @private
     */
    _createItem: function(data) {
        var item = new Item({
            root: this,
            name: data.name,
            size: data.size,
            id: data.id
        });
        item.on('remove', this._removeFile, this);
        return item;
    },

    /**
     * Callback Remove File
     * @param {Item} item - Item
     * @private
     */
    _removeFile: function(item) {
        this.fire('remove', item);
    },

    /**
     * Clear list
     */
    clear: function() {
        tui.util.forEach(this.items, function(item) {
            item.destroy();
        });
        this.items.length = 0;
        this.updateTotalInfo();
    }
});

tui.util.CustomEvents.mixin(List);

module.exports = List;

},{"../utils":7,"./item":10}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25zdHMuanMiLCJzcmMvanMvcG9vbC5qcyIsInNyYy9qcy9yZXF1ZXN0ZXIvbW9kZXJuLmpzIiwic3JjL2pzL3JlcXVlc3Rlci9vbGQuanMiLCJzcmMvanMvdXBsb2FkZXIuanMiLCJzcmMvanMvdXRpbHMuanMiLCJzcmMvanMvdmlldy9kcmFnLmpzIiwic3JjL2pzL3ZpZXcvZm9ybS5qcyIsInNyYy9qcy92aWV3L2l0ZW0uanMiLCJzcmMvanMvdmlldy9saXN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMU5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ0dWkudXRpbC5kZWZpbmVOYW1lc3BhY2UoJ3R1aS5jb21wb25lbnQuVXBsb2FkZXInLCByZXF1aXJlKCcuL3NyYy9qcy91cGxvYWRlci5qcycpKTtcblxuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbmZpZ3VyYXRpb24gb3IgZGVmYXVsdCB2YWx1ZXMuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFVwbG9hZGVyIGNvbmZpZ1xuICovXG5tb2R1bGUuZXhwb3J0cy5DT05GID0ge1xuICAgIEZJTEVfRklMRURfTkFNRTogJ3VzZXJmaWxlW10nLFxuICAgIERST1BfRU5BQkxFRF9DTEFTUzogJ2Ryb3BFbmFibGVkJyxcbiAgICBISURERU5fRklMRV9JTlBVVF9DTEFTUzogJ2hpZGRlbkZpbGVJbnB1dCcsXG4gICAgUkVRVUVTVEVSX1RZUEVfTU9ERVJOOiAnbW9kZXJuUmVxdWVzdGVyJyxcbiAgICBSRVFVRVNURVJfVFlQRV9PTEQ6ICdvbGRSZXF1ZXN0ZXInLFxuICAgIEZPUk1fVEFSR0VUX05BTUU6ICd0dWlVcGxvYWRlckhpZGRlbkZyYW1lJyxcbiAgICBSRU1PVkVfQlVUVE9OX0NMQVNTOiAncmVtb3ZlQnV0dG9uJ1xufTtcblxuLyoqXG4gKiBEZWZhdWx0IEh0bWxzXG4gKiBAdHlwZSB7e2lucHV0OiBzdHJpbmcsIGl0ZW06IHN0cmluZ319XG4gKi9cbm1vZHVsZS5leHBvcnRzLkhUTUwgPSB7XG4gICAgZm9ybTogW1xuICAgICAgICAnPGZvcm0gZW5jdHlwZT1cIm11bHRpcGFydC9mb3JtLWRhdGFcIiBpZD1cInR1aS11cGxvYWRlci1mb3JtXCIgbWV0aG9kPVwicG9zdFwiPicsXG4gICAgICAgICc8L2Zvcm0+J1xuICAgIF0uam9pbignJyksXG4gICAgc3VibWl0OiAnPGJ1dHRvbiBjbGFzcz1cImJhdGNoU3VibWl0XCIgdHlwZT1cInN1Ym1pdFwiPlNFTkQ8L2J1dHRvbj4nLFxuICAgIGZpbGVJbnB1dDogJzxpbnB1dCB0eXBlPVwiZmlsZVwiIGlkPVwiZmlsZUF0dGFjaFwiIHt7ZGlyZWN0b3J5fX0gbmFtZT1cInt7ZmlsZUZpZWxkfX1cIiB7e211bHRpcGxlfX0gLz4nLFxuICAgIGhpZGRlbklucHV0OiAnPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwie3tuYW1lfX1cIiB2YWx1ZT1cInt7dmFsdWV9fVwiPicsXG4gICAgYnV0dG9uOiAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCI+e3t0ZXh0fX08L2J1dHRvbj4nLFxuICAgIGxpc3RJdGVtOiBbXG4gICAgICAgICc8bGkgY2xhc3M9XCJmaWxldHlwZURpc3BsYXlDbGFzc1wiPicsXG4gICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJmaWxlaWNvbiB7e2ZpbGV0eXBlfX1cIj57e2ZpbGV0eXBlfX08L3NwYW4+JyxcbiAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImZpbGVfbmFtZVwiPnt7ZmlsZW5hbWV9fTwvc3Bhbj4nLFxuICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwiZmlsZV9zaXplXCI+e3tmaWxlc2l6ZX19PC9zcGFuPicsXG4gICAgICAgICc8L2xpPidcbiAgICBdLmpvaW4oJycpLFxuICAgIGRyYWdBbmREcm9wOiAnPGRpdiBjbGFzcz1cImRyb3B6b25lXCI+PC9kaXY+J1xufTtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIGlzIG1hbmFnZXIgb2YgaW5wdXQgZWxlbWVudHMgdGhhdCBhY3QgbGlrZSBmaWxlIHBvb2wuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgY29uc3RzID0gcmVxdWlyZSgnLi9jb25zdHMnKTtcblxudmFyIEhJRERFTl9GSUxFX0lOUFVUX0NMQVNTID0gY29uc3RzLkNPTkYuSElEREVOX0ZJTEVfSU5QVVRfQ0xBU1MsXG4gICAgZm9yRWFjaCA9IHR1aS51dGlsLmZvckVhY2gsXG4gICAgaGFzU3RhbXAgPSB0dWkudXRpbC5oYXNTdGFtcCxcbiAgICBzdGFtcCA9IHR1aS51dGlsLnN0YW1wO1xuXG4vKipcbiAqIFRoZSBwb29sIGZvciBzYXZlIGZpbGVzLlxuICogSXQncyBvbmx5IGZvciBpbnB1dFtmaWxlXSBlbGVtZW50IHNhdmUgYXQgYnJvd3NlciB0aGF0IGRvZXMgbm90IHN1cHBvcnQgZmlsZSBhcGkuXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBwbGFuZXQgLSBGb3JtIGVsZW1lbnRcbiAqIEBjbGFzcyBQb29sXG4gKi9cbnZhciBQb29sID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBQb29sLnByb3RvdHlwZSAqL3svKmVzbGludC1kaXNhYmxlKi9cbiAgICBpbml0OiBmdW5jdGlvbihwbGFuZXQpIHsvKmVzbGludC1lbmFibGUqL1xuICAgICAgICAvKipcbiAgICAgICAgICogU3VibWl0dGVyIGZvciBmaWxlIGVsZW1lbnQgdG8gc2VydmVyXG4gICAgICAgICAqIEZvcm0gZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnBsYW5ldCA9IHBsYW5ldDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRmlsZSBkYXRhIHN0cnVjdHVyZSBvYmplY3RcbiAgICAgICAgICogIGtleT1uYW1lIDogdmFsdWU9aXVwdXRbdHlwZT1maWxlXShFbGVtZW50KVxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5maWxlcyA9IHt9O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTYXZlIGEgaW5wdXQgZWxlbWVudFt0eXBlPWZpbGVdLCBhcyB2YWx1ZSBvZiBmaWxlIG5hbWUuXG4gICAgICogQHBhcmFtIHtIVE1MSW5wdXRFbGVtZW50fSBpbnB1dEZpbGVFbCBBIGlucHV0IGVsZW1lbnQgdGhhdCBoYXZlIHRvIGJlIHNhdmVkXG4gICAgICovXG4gICAgc3RvcmU6IGZ1bmN0aW9uKGlucHV0RmlsZUVsKSB7XG4gICAgICAgIHZhciBpZCA9IGhhc1N0YW1wKGlucHV0RmlsZUVsKSAmJiBzdGFtcChpbnB1dEZpbGVFbCksXG4gICAgICAgICAgICBmaWxlbmFtZSwga2V5O1xuXG4gICAgICAgIGlmICghaWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBmaWxlbmFtZSA9IGlucHV0RmlsZUVsLnZhbHVlO1xuICAgICAgICBrZXkgPSBpZCArIGZpbGVuYW1lO1xuICAgICAgICB0aGlzLmZpbGVzW2tleV0gPSBpbnB1dEZpbGVFbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgaW5wdXQgZWxlbWVudFt0eXBlPWZpbGVdIGZyb20gcG9vbC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIC0gQSBmaWxlIG5hbWUgdGhhdCBoYXZlIHRvIGJlIHJlbW92ZWQuXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gcmVzdWx0XG4gICAgICovXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICAgICAgdmFyIGtleSA9IHBhcmFtcy5pZCArIHBhcmFtcy5uYW1lLFxuICAgICAgICAgICAgZWxlbWVudCA9IHRoaXMuZmlsZXNba2V5XTtcblxuICAgICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlbGV0ZSB0aGlzLmZpbGVzW2tleV07XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFbXB0eSBwb29sXG4gICAgICovXG4gICAgZW1wdHk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmZpbGVzID0ge307XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFBsYW50IGZpbGVzIG9uIHBvb2wgdG8gZm9ybSBpbnB1dFxuICAgICAqL1xuICAgIHBsYW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHBsYW5ldCA9IHRoaXMucGxhbmV0O1xuICAgICAgICBmb3JFYWNoKHRoaXMuZmlsZXMsIGZ1bmN0aW9uKGVsZW1lbnQsIGtleSkge1xuICAgICAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgPSBISURERU5fRklMRV9JTlBVVF9DTEFTUztcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIHBsYW5ldC5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmZpbGVzW2tleV07XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBvb2w7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjb25zdHMgPSByZXF1aXJlKCcuLi9jb25zdHMnKTtcblxudmFyIFRZUEUgPSBjb25zdHMuQ09ORi5SRVFVRVNURVJfVFlQRV9NT0RFUk4sXG4gICAgZm9yRWFjaCA9IHR1aS51dGlsLmZvckVhY2g7XG5cbi8qKlxuICogTW9kZXJuIHJlcXVlc3RlclxuICogQHBhcmFtIHtVcGxvYWRlcn0gdXBsb2FkZXIgLSBVcGxvYWRlclxuICogQGNsYXNzXG4gKi9cbnZhciBNb2Rlcm4gPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIE1vZGVybi5wcm90b3R5cGUgKi97Lyplc2xpbnQtZGlzYWJsZSovXG4gICAgaW5pdDogZnVuY3Rpb24odXBsb2FkZXIpIHsvKmVzbGludC1lbmFibGUqL1xuICAgICAgICAvKipcbiAgICAgICAgICogVXBsb2FkZXJcbiAgICAgICAgICogQHR5cGUge1VwbG9hZGVyfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy51cGxvYWRlciA9IHVwbG9hZGVyO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGcm9tIHZpZXdcbiAgICAgICAgICogQHR5cGUge0Zvcm19XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZvcm1WaWV3ID0gdXBsb2FkZXIuZm9ybVZpZXc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExvY2FsIHBvb2wgZm9yIGZpbGVzXG4gICAgICAgICAqIEB0eXBlIHtBcnJheS48RmlsZT59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnBvb2wgPSBbXTtcblxuICAgICAgICBpZiAodXBsb2FkZXIuaXNCYXRjaFRyYW5zZmVyKSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE92ZXJyaWRlIHJlbW92ZSBmdW5jdGlvbiBmb3IgYmF0Y2ggdHJhbnNmZXJcbiAgICAgICAgICAgICAqIEB0eXBlIHtPbGQuX3JlbW92ZVdoZW5CYXRjaH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUgPSB0aGlzLl9yZW1vdmVXaGVuQmF0Y2g7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVxdWVzdGVyIHR5cGVcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIFRZUEU6IFRZUEUsXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIGZvciB1cGxvYWQgZXJyb3JcbiAgICAgKiBAcGFyYW0ge09iamVjdH0ganFYSFIgLSBqUXVlcnkgWEhSXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0YXR1cyAtIEFqYXggU3RhdHVzXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG1zZ1Rocm93biAtIEVycm9yIG1lc3NhZ2VcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF91cGxvYWRFcnJvcjogZnVuY3Rpb24oanFYSFIsIHN0YXR1cywgbXNnVGhyb3duKSB7XG4gICAgICAgIHRoaXMuZmlyZSgnZXJyb3InLCB7XG4gICAgICAgICAgICBzdGF0dXM6IHN0YXR1cyxcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1zZ1Rocm93blxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciBmb3IgdXBsb2FkIHN1Y2Nlc3NcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIFVwbG9hZCBzdWNjZXNzIGRhdGFcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF91cGxvYWRTdWNjZXNzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHRoaXMuZmlyZSgndXBsb2FkZWQnLCBKU09OLnBhcnNlKGRhdGEpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RvcmUgZmlsZXMgdG8gbG9jYWwgcG9vbFxuICAgICAqIEBwYXJhbSB7QXJyYXkuPEZpbGU+IHwgRmlsZX0gW2ZpbGVzXSAtIEEgZmlsZSBvciBmaWxlc1xuICAgICAqL1xuICAgIHN0b3JlOiBmdW5jdGlvbihmaWxlcykge1xuICAgICAgICB2YXIgcG9vbCA9IHRoaXMucG9vbCxcbiAgICAgICAgICAgIHN0YW1wID0gdHVpLnV0aWwuc3RhbXAsXG4gICAgICAgICAgICBkYXRhID0gW107XG5cbiAgICAgICAgZmlsZXMgPSB0dWkudXRpbC50b0FycmF5KGZpbGVzIHx8IHRoaXMuZm9ybVZpZXcuJGZpbGVJbnB1dFswXS5maWxlcyk7XG4gICAgICAgIGZvckVhY2goZmlsZXMsIGZ1bmN0aW9uKGZpbGUpIHtcbiAgICAgICAgICAgIHZhciBpZCA9IHN0YW1wKGZpbGUpO1xuICAgICAgICAgICAgcG9vbC5wdXNoKGZpbGUpO1xuICAgICAgICAgICAgZGF0YS5wdXNoKHtcbiAgICAgICAgICAgICAgICBpZDogaWQsXG4gICAgICAgICAgICAgICAgbmFtZTogZmlsZS5uYW1lLFxuICAgICAgICAgICAgICAgIHNpemU6IGZpbGUuc2l6ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuZm9ybVZpZXcucmVzZXRGaWxlSW5wdXQoKTtcbiAgICAgICAgdGhpcy5maXJlKCdzdG9yZWQnLCBkYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBsb2FkIGFqYXhcbiAgICAgKi9cbiAgICB1cGxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZmllbGQgPSB0aGlzLnVwbG9hZGVyLmZpbGVGaWVsZCxcbiAgICAgICAgICAgICRmb3JtID0gdGhpcy5mb3JtVmlldy4kZWwuY2xvbmUoKSxcbiAgICAgICAgICAgIGZvcm1EYXRhO1xuXG4gICAgICAgICRmb3JtLmZpbmQoJ2lucHV0W3R5cGU9XCJmaWxlXCJdJykucmVtb3ZlKCk7XG4gICAgICAgIGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCRmb3JtWzBdKTtcblxuICAgICAgICBmb3JFYWNoKHRoaXMucG9vbCwgZnVuY3Rpb24oZmlsZSkge1xuICAgICAgICAgICAgZm9ybURhdGEuYXBwZW5kKGZpZWxkLCBmaWxlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogdGhpcy51cGxvYWRlci51cmwuc2VuZCxcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgIGRhdGE6IGZvcm1EYXRhLFxuICAgICAgICAgICAgc3VjY2VzczogJC5wcm94eSh0aGlzLl91cGxvYWRTdWNjZXNzLCB0aGlzKSxcbiAgICAgICAgICAgIGVycm9yOiAkLnByb3h5KHRoaXMuX3VwbG9hZEVycm9yLCB0aGlzKSxcbiAgICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBmYWxzZVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZmlsZSAoYWpheC1qc29ucClcbiAgICAgKiBJdCBpcyBub3QgdXNlZCBmb3IgYmF0Y2ggdHJhbnNmZXIuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyAtIFBhcmFtZXRlcnMgdG8gcmVtb3ZlIGZpbGVcbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiB1cGxvYWRlci51cmwucmVtb3ZlLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29ucCcsXG4gICAgICAgICAgICBkYXRhOiBwYXJhbXMsXG4gICAgICAgICAgICBzdWNjZXNzOiAkLnByb3h5KGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBkYXRhLnR5cGUgPSAncmVtb3ZlJztcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZWQnLCBkYXRhKTtcbiAgICAgICAgICAgIH0sIHRoaXMpXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZmlsZSAoYWpheC1qc29ucClcbiAgICAgKiBJdCBpcyB1c2VkIGZvciBiYXRjaCB0cmFuc2Zlci5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIC0gUGFyYW1ldGVycyB0byByZW1vdmUgZmlsZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbW92ZVdoZW5CYXRjaDogZnVuY3Rpb24ocGFyYW1zKSB7XG4gICAgICAgIHZhciBwb29sID0gdGhpcy5wb29sLFxuICAgICAgICAgICAgaGFzU3RhbXAgPSB0dWkudXRpbC5oYXNTdGFtcCxcbiAgICAgICAgICAgIHN0YW1wID0gdHVpLnV0aWwuc3RhbXAsXG4gICAgICAgICAgICByZXN1bHQgPSBmYWxzZTtcblxuICAgICAgICBmb3JFYWNoKHBvb2wsIGZ1bmN0aW9uKGZpbGUsIGluZGV4KSB7XG4gICAgICAgICAgICBpZiAoaGFzU3RhbXAoZmlsZSkgJiYgKHN0YW1wKGZpbGUpID09PSBwYXJhbXMuaWQpKSB7XG4gICAgICAgICAgICAgICAgcG9vbC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZWQnLCB0dWkudXRpbC5leHRlbmQoe1xuICAgICAgICAgICAgbWVzc2FnZTogcmVzdWx0ID8gJ3N1Y2Nlc3MnIDogJ2ZhaWwnXG4gICAgICAgIH0sIHBhcmFtcykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDbGVhciB0aGUgcG9vbFxuICAgICAqL1xuICAgIGNsZWFyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5wb29sLmxlbmd0aCA9IDA7XG4gICAgfVxufSk7XG5cbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihNb2Rlcm4pO1xubW9kdWxlLmV4cG9ydHMgPSBNb2Rlcm47XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBQb29sID0gcmVxdWlyZSgnLi4vcG9vbCcpLFxuICAgIGNvbnN0cyA9IHJlcXVpcmUoJy4uL2NvbnN0cycpO1xuXG52YXIgVFlQRSA9IGNvbnN0cy5DT05GLlJFUVVFU1RFUl9UWVBFX09MRDtcblxuLyoqXG4gKiBPbGQgcmVxdWVzdGVyXG4gKiBAcGFyYW0ge1VwbG9hZGVyfSB1cGxvYWRlciAtIFVwbG9hZGVyXG4gKiBAY2xhc3NcbiAqL1xudmFyIE9sZCA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgT2xkLnByb3RvdHlwZSAqL3svKmVzbGludC1kaXNhYmxlKi9cbiAgICBpbml0OiBmdW5jdGlvbih1cGxvYWRlcikgey8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIHZhciAkaGlkZGVuRnJhbWUgPSB1cGxvYWRlci4kdGFyZ2V0RnJhbWUsXG4gICAgICAgICAgICBmb3JtVmlldyA9IHVwbG9hZGVyLmZvcm1WaWV3O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBVcGxvYWRlclxuICAgICAgICAgKiBAdHlwZSB7VXBsb2FkZXJ9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnVwbG9hZGVyID0gdXBsb2FkZXI7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZyb20gdmlld1xuICAgICAgICAgKiBAdHlwZSB7Rm9ybX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZm9ybVZpZXcgPSBmb3JtVmlldztcblxuICAgICAgICAvKipcbiAgICAgICAgICogTG9jYWwgcG9vbCBmb3IgZmlsZSBlbGVtZW50c1xuICAgICAgICAgKiBAdHlwZSB7UG9vbH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucG9vbCA9IG5ldyBQb29sKGZvcm1WaWV3LiRlbFswXSk7XG5cbiAgICAgICAgaWYgKHVwbG9hZGVyLmlzQmF0Y2hUcmFuc2Zlcikge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBPdmVycmlkZSBVcGxvYWQgZnVuY3Rpb24gZm9yIGJhdGNoIHRyYW5zZmVyXG4gICAgICAgICAgICAgKiBAdHlwZSB7T2xkLl91cGxvYWRXaGVuQmF0Y2h9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMudXBsb2FkID0gdGhpcy5fdXBsb2FkV2hlbkJhdGNoO1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE92ZXJyaWRlIHJlbW92ZSBmdW5jdGlvbiBmb3IgYmF0Y2ggdHJhbnNmZXJcbiAgICAgICAgICAgICAqIEB0eXBlIHtPbGQuX3JlbW92ZVdoZW5CYXRjaH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUgPSB0aGlzLl9yZW1vdmVXaGVuQmF0Y2g7XG4gICAgICAgIH1cblxuICAgICAgICAkaGlkZGVuRnJhbWUub24oJ2xvYWQnLCAkLnByb3h5KHRoaXMuX29uTG9hZEhpZGRlbkZyYW1lLCB0aGlzLCAkaGlkZGVuRnJhbWUpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVxdWVzdGVyIHR5cGVcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIFRZUEU6IFRZUEUsXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyXG4gICAgICogXCJsb2FkXCIgb2YgaGlkZGVuIGZyYW1lLlxuICAgICAqIEBwYXJhbSB7alF1ZXJ5fSAkaGlkZGVuRnJhbWUgLSBIaWRkZW4gaWZyYW1lXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25Mb2FkSGlkZGVuRnJhbWU6IGZ1bmN0aW9uKCRoaWRkZW5GcmFtZSkge1xuICAgICAgICB2YXIgZnJhbWVCb2R5LFxuICAgICAgICAgICAgZGF0YTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZnJhbWVCb2R5ID0gJGhpZGRlbkZyYW1lWzBdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQuYm9keTtcbiAgICAgICAgICAgIGRhdGEgPSB0dWkudXRpbC5waWNrKGZyYW1lQm9keSwgJ2ZpcnN0Q2hpbGQnLCAnZGF0YScpO1xuICAgICAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3VwbG9hZGVkJywgJC5wYXJzZUpTT04oZGF0YSkpO1xuICAgICAgICAgICAgICAgIGZyYW1lQm9keS5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhpcy5maXJlKCdlcnJvcicsIHtcbiAgICAgICAgICAgICAgICBzdGF0dXM6IGUubmFtZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBlLm1lc3NhZ2VcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN0b3JlIGZpbGUgaW5wdXQgZWxlbWVudCBmcm9tIHVwbG9hZCBmb3JtXG4gICAgICovXG4gICAgc3RvcmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZWwgPSB0aGlzLmZvcm1WaWV3LiRmaWxlSW5wdXRbMF0sXG4gICAgICAgICAgICBpZCA9IHR1aS51dGlsLnN0YW1wKGVsKTtcblxuICAgICAgICB0aGlzLnBvb2wuc3RvcmUoZWwpO1xuICAgICAgICB0aGlzLmZvcm1WaWV3LnJlc2V0RmlsZUlucHV0KCk7XG5cbiAgICAgICAgdGhpcy5maXJlKCdzdG9yZWQnLCBbe1xuICAgICAgICAgICAgaWQ6IGlkLFxuICAgICAgICAgICAgbmFtZTogZWwudmFsdWUsXG4gICAgICAgICAgICBzaXplOiAnJ1xuICAgICAgICB9XSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwbG9hZC5cbiAgICAgKiBJdCBpcyBub3QgdXNlZCBmb3IgYmF0Y2ggdHJhbnNmZXIuXG4gICAgICovXG4gICAgdXBsb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5wb29sLnBsYW50KCk7XG4gICAgICAgIHRoaXMuZm9ybVZpZXcuJGVsLnN1Ym1pdCgpO1xuICAgICAgICB0aGlzLmZvcm1WaWV3LmNsZWFyKCk7XG4gICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBsb2FkLlxuICAgICAqIEl0IGlzIHVzZWQgZm9yIGJhdGNoIHRyYW5zZmVyLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwbG9hZFdoZW5CYXRjaDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucG9vbC5wbGFudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZmlsZSAoYWpheC1qc29ucClcbiAgICAgKiBJdCBpcyBub3QgdXNlZCBmb3IgYmF0Y2ggdHJhbnNmZXIuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyAtIFBhcmFtZXRlcnMgdG8gcmVtb3ZlIGZpbGVcbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAgICB2YXIgdXBsb2FkZXIgPSB0aGlzLnVwbG9hZGVyO1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiB1cGxvYWRlci51cmwucmVtb3ZlLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29ucCcsXG4gICAgICAgICAgICBkYXRhOiBwYXJhbXMsXG4gICAgICAgICAgICBzdWNjZXNzOiAkLnByb3h5KGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBkYXRhLnR5cGUgPSAncmVtb3ZlJztcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZWQnLCBkYXRhKTtcbiAgICAgICAgICAgIH0sIHRoaXMpXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZmlsZSAoYWpheC1qc29ucClcbiAgICAgKiBJdCBpcyB1c2VkIGZvciBiYXRjaCB0cmFuc2Zlci5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIC0gUGFyYW1ldGVycyB0byByZW1vdmUgZmlsZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbW92ZVdoZW5CYXRjaDogZnVuY3Rpb24ocGFyYW1zKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSB0aGlzLnBvb2wucmVtb3ZlKHBhcmFtcyk7XG5cbiAgICAgICAgdGhpcy5maXJlKCdyZW1vdmVkJywgdHVpLnV0aWwuZXh0ZW5kKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IHJlc3VsdCA/ICdzdWNjZXNzJyA6ICdmYWlsJ1xuICAgICAgICB9LCBwYXJhbXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgdGhlIHBvb2xcbiAgICAgKi9cbiAgICBjbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucG9vbC5lbXB0eSgpO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oT2xkKTtcbm1vZHVsZS5leHBvcnRzID0gT2xkO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZpbGVVcGxvYWRlciBpcyBjb3JlIG9mIGZpbGUgdXBsb2FkZXIgY29tcG9uZW50Ljxicj5GaWxlTWFuYWdlciBtYW5hZ2UgY29ubmVjdG9yIHRvIGNvbm5lY3Qgc2VydmVyIGFuZCB1cGRhdGUgRmlsZUxpc3RWaWV3LlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcbnZhciBjb25zdHMgPSByZXF1aXJlKCcuL2NvbnN0cycpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIEZvcm0gPSByZXF1aXJlKCcuL3ZpZXcvZm9ybScpO1xudmFyIExpc3QgPSByZXF1aXJlKCcuL3ZpZXcvbGlzdCcpO1xudmFyIERyYWdBbmREcm9wID0gcmVxdWlyZSgnLi92aWV3L2RyYWcnKTtcbnZhciBPbGRSZXF1ZXN0ZXIgPSByZXF1aXJlKCcuL3JlcXVlc3Rlci9vbGQnKTtcbnZhciBNb2Rlcm5SZXF1ZXN0ZXIgPSByZXF1aXJlKCcuL3JlcXVlc3Rlci9tb2Rlcm4nKTtcblxudmFyIFJFUVVFU1RFUl9UWVBFX01PREVSTiA9IGNvbnN0cy5DT05GLlJFUVVFU1RFUl9UWVBFX01PREVSTjtcbi8qKlxuICogRmlsZVVwbG9hZGVyIGFjdCBsaWtlIGJyaWRnZSBiZXR3ZWVuIGNvbm5lY3RvciBhbmQgdmlldy5cbiAqIEl0IG1ha2VzIGNvbm5lY3RvciBhbmQgdmlldyB3aXRoIG9wdGlvbiBhbmQgZW52aXJvbm1lbnQuXG4gKiBJdCBjb250cm9sIGFuZCBtYWtlIGNvbm5lY3Rpb24gYW1vbmcgbW9kdWxlcy5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgVGhlIG9wdGlvbnMgdG8gc2V0IHVwIGZpbGUgdXBsb2FkZXIgbW9kdWxlcy5cbiAqICBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy51cmwgVGhlIHVybCBpcyBmaWxlIHNlcnZlci5cbiAqICAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMudXJsLnNlbmQgVGhlIHVybCBpcyBmb3IgZmlsZSBhdHRhY2guXG4gKiAgICAgIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnVybC5yZW1vdmUgVGhlIHVybCBpcyBmb3IgZmlsZSBkZXRhY2guXG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuZm9ybVRhcmdldCBUaGUgdGFyZ2V0IGZvciB4LWRvbWFpbiBqc29ucCBjYXNlLlxuICogIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLmxpc3RJbmZvIFRoZSBlbGVtZW50IGluZm8gdG8gZGlzcGxheSBmaWxlIGxpc3QgaW5mb3JtYXRpb24uXG4gKiAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmZpbGVGaWVsZD0ndXNlckZpbGVbXSddIFRoZSBmaWVsZCBuYW1lIG9mIGlucHV0IGZpbGUgZWxlbWVudC5cbiAqICBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMudXNlRm9sZGVyIFdoZXRoZXIgc2VsZWN0IHVuaXQgaXMgZm9sZGVyIG9mIG5vdC4gSWYgdGhpcyBpcyB0dXJlLCBtdWx0aXBsZSB3aWxsIGJlIGlnbm9yZWQuXG4gKiAgQHBhcmFtIHtib29sZWFufSBvcHRpb25zLmlzTXVsdGlwbGUgV2hldGhlciBlbmFibGUgbXVsdGlwbGUgc2VsZWN0IG9yIG5vdC5cbiAqIEBwYXJhbSB7alF1ZXJ5fSAkZWwgUm9vdCBFbGVtZW50IG9mIFVwbG9hZGVyXG4gKiBAZXhhbXBsZVxuICogdmFyIHVwbG9hZGVyID0gbmV3IHR1aS5jb21wb25lbnQuVXBsb2FkZXIoe1xuICogICAgIHVybDoge1xuICogICAgICAgICBzZW5kOiBcImh0dHA6Ly9mZS5uaG5lbnQuY29tL2V0Yy9ldGMvdXBsb2FkZXIvdXBsb2FkZXIucGhwXCIsXG4gKiAgICAgICAgIHJlbW92ZTogXCJodHRwOi8vZmUubmhuZW50LmNvbS9ldGMvZXRjL3VwbG9hZGVyL3JlbW92ZS5waHBcIlxuICogICAgIH0sXG4gKiAgICAgbGlzdEluZm86IHtcbiAqICAgICAgICAgbGlzdDogJCgnI2ZpbGVzJyksXG4gKiAgICAgICAgIGNvdW50OiAkKCcjZmlsZV9jb3VudCcpLFxuICogICAgICAgICBzaXplOiAkKCcjc2l6ZV9jb3VudCcpXG4gKiAgICAgfVxuICogfSwgJCgnI3VwbG9hZGVyJykpO1xuICovXG52YXIgVXBsb2FkZXIgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKipAbGVuZHMgVXBsb2FkZXIucHJvdG90eXBlICovey8qZXNsaW50LWRpc2FibGUqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMsICRlbCkgey8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBVcGxvYWRlciBlbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiRlbCA9ICRlbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2VuZC9SZW1vdmUgdXJsXG4gICAgICAgICAqIEB0eXBlIHt7c2VuZDogc3RyaW5nLCByZW1vdmU6IHN0cmluZ319XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnVybCA9IG9wdGlvbnMudXJsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZWRpcmVjdCBVUkwgZm9yIENPUlMocmVzcG9uc2UsIElFNylcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucmVkaXJlY3RVUkwgPSBvcHRpb25zLnJlZGlyZWN0VVJMO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGb3JtIHRhcmdldCBuYW1lIGZvciBDT1JTIChJRTcsIDgsIDkpXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZvcm1UYXJnZXQgPSBjb25zdHMuQ09ORi5GT1JNX1RBUkdFVF9OQU1FO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUYXJnZXQgZnJhbWUgZm9yIENPUlMgKElFNywgOCwgOSlcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJHRhcmdldEZyYW1lID0gdGhpcy5fY3JlYXRlVGFyZ2V0RnJhbWUoKVxuICAgICAgICAgICAgLmFwcGVuZFRvKHRoaXMuJGVsKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSW5wdXQgZmlsZSAtIGZpZWxkIG5hbWVcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZmlsZUZpZWxkID0gb3B0aW9ucy5maWxlRmllbGQgfHwgY29uc3RzLkNPTkYuRklMRV9GSUxFRF9OQU1FO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHRoZSB1cGxvYWRlciB1c2VzIGJhdGNoLXRyYW5zZmVyXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc0JhdGNoVHJhbnNmZXIgPSAhIShvcHRpb25zLmlzQmF0Y2hUcmFuc2Zlcik7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdoZXRoZXIgdGhlIHNlbmRpbmcvcmVtb3ZpbmcgdXJscyBhcmUgeC1kb21haW4uXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc0Nyb3NzRG9tYWluID0gdXRpbHMuaXNDcm9zc0RvbWFpbih0aGlzLnVybC5zZW5kKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0cyBQb3N0TWVzc2FnZSBBUElcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzU3VwcG9ydFBvc3RNZXNzYWdlID0gISEodHVpLnV0aWwucGljayh0aGlzLiR0YXJnZXRGcmFtZSwgJzAnLCAnY29udGVudFdpbmRvdycsICdwb3N0TWVzc2FnZScpKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciB0aGUgdXNlciB1c2VzIG11bHRpcGxlIHVwbG9hZFxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaXNNdWx0aXBsZSA9ICEhKG9wdGlvbnMuaXNNdWx0aXBsZSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdoZXRoZXIgdGhlIHVzZXIgdXNlcyBkcmFnJmRyb3AgdXBsb2FkXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy51c2VEcmFnID0gISEob3B0aW9ucy51c2VEcmFnKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciB0aGUgdXNlciB1c2VzIGZvbGRlciB1cGxvYWRcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnVzZUZvbGRlciA9ICEhKG9wdGlvbnMudXNlRm9sZGVyKTtcblxuICAgICAgICBpZiAodGhpcy51c2VEcmFnICYmICF0aGlzLnVzZUZvbGRlciAmJiB1dGlscy5pc1N1cHBvcnRGaWxlU3lzdGVtKCkpIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogRHJhZyAmIERyb3AgVmlld1xuICAgICAgICAgICAgICogQHR5cGUge0RyYWdBbmREcm9wfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLmRyYWdWaWV3ID0gbmV3IERyYWdBbmREcm9wKHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZyb20gVmlld1xuICAgICAgICAgKiBAdHlwZSB7Rm9ybX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZm9ybVZpZXcgPSBuZXcgRm9ybSh0aGlzKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTGlzdCBWaWV3XG4gICAgICAgICAqIEB0eXBlIHtMaXN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5saXN0VmlldyA9IG5ldyBMaXN0KG9wdGlvbnMubGlzdEluZm8pO1xuXG4gICAgICAgIHRoaXMuX3NldFJlcXVlc3RlcigpO1xuICAgICAgICB0aGlzLl9hZGRFdmVudCgpO1xuICAgICAgICBpZiAodGhpcy5pc0Nyb3NzRG9tYWluICYmIHRoaXMuaXNTdXBwb3J0UG9zdE1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldFBvc3RNZXNzYWdlRXZlbnQoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgQ29ubmVjdG9yXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0UmVxdWVzdGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHV0aWxzLmlzU3VwcG9ydEZvcm1EYXRhKCkpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlcXVlc3RlciA9IG5ldyBNb2Rlcm5SZXF1ZXN0ZXIodGhpcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9yZXF1ZXN0ZXIgPSBuZXcgT2xkUmVxdWVzdGVyKHRoaXMpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBwb3N0LW1lc3NhZ2UgZXZlbnQgaWYgc3VwcG9ydGVkIGFuZCBuZWVkZWRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRQb3N0TWVzc2FnZUV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kdGFyZ2V0RnJhbWUub2ZmKCdsb2FkJyk7XG4gICAgICAgICQod2luZG93KS5vbignbWVzc2FnZScsICQucHJveHkoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIHZhciBvcmlnaW5hbEV2ZW50ID0gZXZlbnQub3JpZ2luYWxFdmVudCxcbiAgICAgICAgICAgICAgICBkYXRhO1xuXG4gICAgICAgICAgICBpZiAodGhpcy51cmwuc2VuZC5pbmRleE9mKG9yaWdpbmFsRXZlbnQub3JpZ2luKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkYXRhID0gJC5wYXJzZUpTT04ob3JpZ2luYWxFdmVudC5kYXRhKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNCYXRjaFRyYW5zZmVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxpc3QoZGF0YS5maWxlbGlzdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFN1Y2Nlc3MgZXZlbnRcbiAgICAgICAgICAgICAqICBpbiBJRTgsIDkgLSB1c2luZyBQb3N0TWVzc2FnZUFQSSBmb3IgQ09SU1xuICAgICAgICAgICAgICogQGFwaVxuICAgICAgICAgICAgICogQGV2ZW50IFVwbG9hZGVyI3N1Y2Nlc3NcbiAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIC0gU2VydmVyIHJlc3BvbnNlIGRhdGFcbiAgICAgICAgICAgICAqICBAcGFyYW0ge0FycmF5fSBkYXRhLmZpbGVsaXN0IC0gVXBsb2FkZWQgZmlsZSBsaXN0XG4gICAgICAgICAgICAgKiAgQHBhcmFtIHtudW1iZXJ9IFtkYXRhLnN1Y2Nlc3NdIC0gVXBsb2FkZWQgZmlsZSBjb3VudFxuICAgICAgICAgICAgICogIEBwYXJhbSB7bnVtYmVyfSBbZGF0YS5mYWlsZWRdIC0gRmFpbGVkIGZpbGUgY291bnRcbiAgICAgICAgICAgICAqICBAcGFyYW0ge251bWJlcn0gW2RhdGEuY291bnRdIC0gVG90YWwgY291bnRcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5maXJlKCdzdWNjZXNzJywgZGF0YSk7XG4gICAgICAgIH0sIHRoaXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSB0YXJnZXQgZnJhbWUgdG8gYmUgdGFyZ2V0IG9mIGZvcm0gZWxlbWVudC5cbiAgICAgKiBAcmV0dXJucyB7alF1ZXJ5fSBUYXJnZXQgZnJhbWU6IGpxdWVyeS1lbGVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY3JlYXRlVGFyZ2V0RnJhbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHRhcmdldCA9ICQoJzxpZnJhbWUgbmFtZT1cIicgKyB0aGlzLmZvcm1UYXJnZXQgKyAnXCI+PC9pZnJhbWU+Jyk7XG4gICAgICAgICR0YXJnZXQuY3NzKHtcbiAgICAgICAgICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nLFxuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuICR0YXJnZXQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudHMgdG8gdmlld3MgYW5kIGZpcmUgdXBsb2FkZXIgZXZlbnRzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmxpc3RWaWV3Lm9uKCdyZW1vdmUnLCB0aGlzLnJlbW92ZUZpbGUsIHRoaXMpO1xuICAgICAgICBpZiAodGhpcy5pc0JhdGNoVHJhbnNmZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX2FkZEV2ZW50V2hlbkJhdGNoVHJhbnNmZXIoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2FkZEV2ZW50V2hlbk5vcm1hbFRyYW5zZmVyKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IHdoZW4gdXBsb2FkZXIgdXNlcyBiYXRjaC10cmFuc2ZlclxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZEV2ZW50V2hlbkJhdGNoVHJhbnNmZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmZvcm1WaWV3Lm9uKHtcbiAgICAgICAgICAgIGNoYW5nZTogdGhpcy5zdG9yZSxcbiAgICAgICAgICAgIHN1Ym1pdDogdGhpcy5zdWJtaXRcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgdGhpcy5fcmVxdWVzdGVyLm9uKHtcbiAgICAgICAgICAgIHJlbW92ZWQ6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxpc3QoZGF0YSk7XG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogUmVtb3ZlIGV2ZW50XG4gICAgICAgICAgICAgICAgICogIGluIGJhdGNoVHJhbnNmZXJcbiAgICAgICAgICAgICAgICAgKiBAYXBpXG4gICAgICAgICAgICAgICAgICogQGV2ZW50IFVwbG9hZGVyI3JlbW92ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIC0gUmVtb3ZlIGRhdGEgZnJvbSB0aGlzIGNvbXBvbmVudFxuICAgICAgICAgICAgICAgICAqICBAcGFyYW0ge3N0cmluZ30gZGF0YS5tZXNzYWdlIC0gJ3N1Y2Nlc3MnIG9yICdmYWlsJ1xuICAgICAgICAgICAgICAgICAqICBAcGFyYW0ge3N0cmluZ30gZGF0YS5uYW1lIC0gZmlsZSBuYW1lXG4gICAgICAgICAgICAgICAgICogIEBwYXJhbSB7c3RyaW5nfSBkYXRhLmlkIC0gZmlsZSBpZFxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgncmVtb3ZlJywgZGF0YSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBFcnJvciBldmVudFxuICAgICAgICAgICAgICAgICAqICBpbiBiYXRjaFRyYW5zZmVyXG4gICAgICAgICAgICAgICAgICogQGFwaVxuICAgICAgICAgICAgICAgICAqIEBldmVudCBVcGxvYWRlciNlcnJvclxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7RXJyb3J9IGRhdGEgLSBFcnJvciBkYXRhXG4gICAgICAgICAgICAgICAgICogIEBwYXJhbSB7c3RyaW5nfSBkYXRhLnN0YXR1cyAtIEVycm9yIHN0YXR1c1xuICAgICAgICAgICAgICAgICAqICBAcGFyYW0ge3N0cmluZ30gZGF0YS5tZXNzYWdlIC0gRXJyb3IgbWVzc2FnZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgnZXJyb3InLCBkYXRhKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1cGxvYWRlZDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBTdWNjZXNzIGV2ZW50XG4gICAgICAgICAgICAgICAgICogIGluIGJhdGNoVHJhbnNmZXJcbiAgICAgICAgICAgICAgICAgKiBAYXBpXG4gICAgICAgICAgICAgICAgICogQGV2ZW50IFVwbG9hZGVyI3N1Y2Nlc3NcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSAtIFNlcnZlciByZXNwb25zZSBkYXRhXG4gICAgICAgICAgICAgICAgICogIEBwYXJhbSB7QXJyYXl9IGRhdGEuZmlsZWxpc3QgLSBVcGxvYWRlZCBmaWxlIGxpc3RcbiAgICAgICAgICAgICAgICAgKiAgQHBhcmFtIHtudW1iZXJ9IFtkYXRhLnN1Y2Nlc3NdIC0gVXBsb2FkZWQgZmlsZSBjb3VudFxuICAgICAgICAgICAgICAgICAqICBAcGFyYW0ge251bWJlcn0gW2RhdGEuZmFpbGVkXSAtIEZhaWxlZCBmaWxlIGNvdW50XG4gICAgICAgICAgICAgICAgICogIEBwYXJhbSB7bnVtYmVyfSBbZGF0YS5jb3VudF0gLSBUb3RhbCBjb3VudFxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgnc3VjY2VzcycsIGRhdGEpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0b3JlZDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGlzdChkYXRhKTtcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBVcGRhdGUgZXZlbnRcbiAgICAgICAgICAgICAgICAgKiAgaW4gYmF0Y2hUcmFuc2ZlclxuICAgICAgICAgICAgICAgICAqIEBhcGlcbiAgICAgICAgICAgICAgICAgKiBAZXZlbnQgVXBsb2FkZXIjdXBkYXRlXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtBcnJheS48b2JqZWN0Pn0gZGF0YSAtIEZpbGUgbGlzdCBkYXRhXG4gICAgICAgICAgICAgICAgICogQXJyYXkgaGF2aW5nIG9iamVjdHM8YnI+e2lkOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgc2l6ZTogbnVtYmVyfVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgndXBkYXRlJywgZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIGlmICh0aGlzLnVzZURyYWcgJiYgdGhpcy5kcmFnVmlldykge1xuICAgICAgICAgICAgdGhpcy5kcmFnVmlldy5vbignZHJvcCcsIHRoaXMuc3RvcmUsIHRoaXMpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudCB3aGVuIHVwbG9hZGVyIHVzZXMgbm9ybWFsLXRyYW5zZmVyXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRXZlbnRXaGVuTm9ybWFsVHJhbnNmZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmZvcm1WaWV3Lm9uKCdjaGFuZ2UnLCB0aGlzLnNlbmRGaWxlLCB0aGlzKTtcblxuICAgICAgICB0aGlzLl9yZXF1ZXN0ZXIub24oe1xuICAgICAgICAgICAgcmVtb3ZlZDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGlzdChkYXRhKTtcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBSZW1vdmUgZXZlbnRcbiAgICAgICAgICAgICAgICAgKiAgaW4gbm9ybWFsVHJhbnNmZXJcbiAgICAgICAgICAgICAgICAgKiBAYXBpXG4gICAgICAgICAgICAgICAgICogQGV2ZW50IFVwbG9hZGVyI3JlbW92ZVxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIC0gUmVtb3ZlIGRhdGEgZnJvbSBzZXJ2ZXIgcmVzcG9uc2VcbiAgICAgICAgICAgICAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IGRhdGEubWVzc2FnZSAtICdzdWNjZXNzJyBvciAnZmFpbCdcbiAgICAgICAgICAgICAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IGRhdGEubmFtZSAtIGZpbGUgbmFtZVxuICAgICAgICAgICAgICAgICAqICBAcGFyYW0ge3N0cmluZ30gZGF0YS5pZCAtIGZpbGUgaWRcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZScsIGRhdGEpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogRXJyb3IgZXZlbnRcbiAgICAgICAgICAgICAgICAgKiAgaW4gbm9ybWFsVHJhbnNmZXJcbiAgICAgICAgICAgICAgICAgKiBAYXBpXG4gICAgICAgICAgICAgICAgICogQGV2ZW50IFVwbG9hZGVyI2Vycm9yXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtFcnJvcn0gZGF0YSAtIEVycm9yIGRhdGFcbiAgICAgICAgICAgICAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IGRhdGEuc3RhdHVzIC0gRXJyb3Igc3RhdHVzXG4gICAgICAgICAgICAgICAgICogIEBwYXJhbSB7c3RyaW5nfSBkYXRhLm1lc3NhZ2UgLSBFcnJvciBtZXNzYWdlXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdlcnJvcicsIGRhdGEpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVwbG9hZGVkOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMaXN0KGRhdGEuZmlsZWxpc3QpO1xuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFN1Y2Nlc3MgZXZlbnRcbiAgICAgICAgICAgICAgICAgKiAgaW4gbm9ybWFsVHJhbnNmZXJcbiAgICAgICAgICAgICAgICAgKiBAYXBpXG4gICAgICAgICAgICAgICAgICogQGV2ZW50IFVwbG9hZGVyI3N1Y2Nlc3NcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSAtIFNlcnZlciByZXNwb25zZSBkYXRhXG4gICAgICAgICAgICAgICAgICogIEBwYXJhbSB7QXJyYXl9IGRhdGEuZmlsZWxpc3QgLSBVcGxvYWRlZCBmaWxlIGxpc3RcbiAgICAgICAgICAgICAgICAgKiAgQHBhcmFtIHtudW1iZXJ9IFtkYXRhLnN1Y2Nlc3NdIC0gVXBsb2FkZWQgZmlsZSBjb3VudFxuICAgICAgICAgICAgICAgICAqICBAcGFyYW0ge251bWJlcn0gW2RhdGEuZmFpbGVkXSAtIEZhaWxlZCBmaWxlIGNvdW50XG4gICAgICAgICAgICAgICAgICogIEBwYXJhbSB7bnVtYmVyfSBbZGF0YS5jb3VudF0gLSBUb3RhbCBjb3VudFxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgnc3VjY2VzcycsIGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICBpZiAodGhpcy51c2VEcmFnICYmIHRoaXMuZHJhZ1ZpZXcpIHtcbiAgICAgICAgICAgIHRoaXMuZHJhZ1ZpZXcub24oJ2Ryb3AnLCBmdW5jdGlvbihmaWxlcykge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RvcmUoZmlsZXMpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3VibWl0KCk7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgbGlzdCB2aWV3IHdpdGggY3VzdG9tIG9yIG9yaWdpbmFsIGRhdGEuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtpbmZvXSBUaGUgZGF0YSBmb3IgdXBkYXRlIGxpc3RcbiAgICAgKi9cbiAgICB1cGRhdGVMaXN0OiBmdW5jdGlvbihpbmZvKSB7XG4gICAgICAgIHRoaXMubGlzdFZpZXcudXBkYXRlKGluZm8pO1xuICAgICAgICBpZiAodGhpcy5pc0JhdGNoVHJhbnNmZXIpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdFZpZXcudXBkYXRlVG90YWxJbmZvKGluZm8pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5saXN0Vmlldy51cGRhdGVUb3RhbEluZm8oKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmb3IgY3VzdG9tIHNlbmQgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBbZXZlbnRdIC0gRm9ybSBzdWJtaXQgZXZlbnRcbiAgICAgKi9cbiAgICBzZW5kRmlsZTogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdGhpcy5zdG9yZSgpO1xuICAgICAgICB0aGlzLnN1Ym1pdChldmVudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZvciBjdXN0b20gcmVtb3ZlIGV2ZW50XG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgVGhlIGRhdGEgZm9yIHJlbW92ZSBmaWxlLlxuICAgICAqL1xuICAgIHJlbW92ZUZpbGU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdGhpcy5fcmVxdWVzdGVyLnJlbW92ZShkYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3VibWl0IGZvciBkYXRhIHN1Ym1pdCB0byBzZXJ2ZXJcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBbZXZlbnRdIC0gRm9ybSBzdWJtaXQgZXZlbnRcbiAgICAgKi9cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudCAmJiB0aGlzLl9yZXF1ZXN0ZXIuVFlQRSA9PT0gUkVRVUVTVEVSX1RZUEVfTU9ERVJOKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3JlcXVlc3Rlci51cGxvYWQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgdXBsb2FkZXJcbiAgICAgKi9cbiAgICBjbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3JlcXVlc3Rlci5jbGVhcigpO1xuICAgICAgICB0aGlzLmZvcm1WaWV3LmNsZWFyKCk7XG4gICAgICAgIHRoaXMubGlzdFZpZXcuY2xlYXIoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RvcmUgaW5wdXQgZWxlbWVudCB0byBwb29sLlxuICAgICAqIEBwYXJhbSB7QXJyYXkuPEZpbGU+IHwgRmlsZX0gW2ZpbGVzXSAtIEEgZmlsZSBvciBmaWxlc1xuICAgICAqL1xuICAgIHN0b3JlOiBmdW5jdGlvbihmaWxlcykge1xuICAgICAgICB0aGlzLl9yZXF1ZXN0ZXIuc3RvcmUoZmlsZXMpO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oVXBsb2FkZXIpO1xubW9kdWxlLmV4cG9ydHMgPSBVcGxvYWRlcjtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIGZpbGUgY29udGFpbiB1dGlsaXR5IG1ldGhvZHMgZm9yIHVwbG9hZGVyLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuLyoqXG4gKiBAbmFtZXNwYWNlIHV0aWxzXG4gKi9cbnZhciBJU19TVVBQT1JUX0ZJTEVfU1lTVEVNID0gISEod2luZG93LkZpbGUgJiYgd2luZG93LkZpbGVSZWFkZXIgJiYgd2luZG93LkZpbGVMaXN0ICYmIHdpbmRvdy5CbG9iKSxcbiAgICBJU19TVVBQT1JUX0ZPUk1fREFUQSA9ICEhKHdpbmRvdy5Gb3JtRGF0YSB8fCBudWxsKTtcblxuLyoqXG4gKiBQYXJzZSB1cmxcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgLSB1cmwgZm9yIHBhcnNpbmdcbiAqIEByZXR1cm5zIHtPYmplY3R9IFVSTCBpbmZvcm1hdGlvblxuICovXG5mdW5jdGlvbiBwYXJzZVVSTCh1cmwpIHtcbiAgICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICBhLmhyZWYgPSB1cmw7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBocmVmOiBhLmhyZWYsXG4gICAgICAgIGhvc3Q6IGEuaG9zdCxcbiAgICAgICAgcG9ydDogYS5wb3J0LFxuICAgICAgICBoYXNoOiBhLmhhc2gsXG4gICAgICAgIGhvc3RuYW1lOiBhLmhvc3RuYW1lLFxuICAgICAgICBwYXRobmFtZTogYS5wYXRobmFtZSxcbiAgICAgICAgcHJvdG9jb2w6IGEucHJvdG9jb2wsXG4gICAgICAgIHNlYXJjaDogYS5zZWFyY2gsXG4gICAgICAgIHF1ZXJ5OiBhLnNlYXJjaC5zbGljZSgxKVxuICAgIH07XG59XG5cbi8qKlxuICogRXh0cmFjdCB1bml0IGZvciBmaWxlIHNpemVcbiAqIEBwYXJhbSB7bnVtYmVyfSBieXRlcyBBIHVzYWdlIG9mIGZpbGVcbiAqIEByZXR1cm5zIHtzdHJpbmd9IFNpemUtc3RyaW5nXG4gKiBAbWVtYmVyb2YgdXRpbHNcbiAqL1xuZnVuY3Rpb24gZ2V0RmlsZVNpemVXaXRoVW5pdChieXRlcykge1xuICAgIHZhciB1bml0cyA9IFsnQicsICdLQicsICdNQicsICdHQicsICdUQiddLFxuICAgICAgICBieXRlcyA9IHBhcnNlSW50KGJ5dGVzLCAxMCksXG4gICAgICAgIGV4cCA9IE1hdGgubG9nKGJ5dGVzKSAvIE1hdGgubG9nKDEwMjQpIHwgMCxcbiAgICAgICAgcmVzdWx0ID0gKGJ5dGVzIC8gTWF0aC5wb3coMTAyNCwgZXhwKSkudG9GaXhlZCgyKTtcblxuICAgIHJldHVybiByZXN1bHQgKyB1bml0c1tleHBdO1xufVxuXG4vKipcbiAqIFdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgRm9ybURhdGEgb3Igbm90XG4gKiBAbWVtYmVyb2YgdXRpbHNcbiAqIEByZXR1cm5zIHtib29sZWFufSB3aGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIEZvcm1EYXRhXG4gKi9cbmZ1bmN0aW9uIGlzU3VwcG9ydEZvcm1EYXRhKCkge1xuICAgIHJldHVybiBJU19TVVBQT1JUX0ZPUk1fREFUQTtcbn1cblxuLyoqXG4gKiBHZXQgaXRlbSBlbGVtZW50cyBIVE1MXG4gKiBAcGFyYW0ge09iamVjdH0gbWFwIC0gUHJvcGVydGllcyBmb3IgdGVtcGxhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBodG1sIEhUTUwgdGVtcGxhdGVcbiAqIEByZXR1cm5zIHtzdHJpbmd9IEhUTUxcbiAqIEBtZW1iZXJvZiB1dGlsc1xuICovXG5mdW5jdGlvbiB0ZW1wbGF0ZShtYXAsIGh0bWwpIHtcbiAgICBodG1sID0gaHRtbC5yZXBsYWNlKC9cXHtcXHsoW15cXH1dKylcXH1cXH0vZywgZnVuY3Rpb24gKG1zdHIsIG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIG1hcFtuYW1lXTtcbiAgICB9KTtcbiAgICByZXR1cm4gaHRtbDtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIGZpbGUgYXBpLlxuICogQHJldHVybnMge2Jvb2xlYW59IHdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgRmlsZUFQSVxuICogQG1lbWJlcm9mIHV0aWxzXG4gKi9cbmZ1bmN0aW9uIGlzU3VwcG9ydEZpbGVTeXN0ZW0oKSB7XG4gICAgcmV0dXJuIElTX1NVUFBPUlRfRklMRV9TWVNURU07XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgdXJsIGlzIHgtZG9tYWluXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsIC0gVVJMXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gV2hldGhlciB0aGUgdXJsIGlzIHgtZG9tYWluXG4gKiBAbWVtYmVyb2YgdXRpbHNcbiAqL1xuZnVuY3Rpb24gaXNDcm9zc0RvbWFpbih1cmwpIHtcbiAgICB2YXIgaGVyZSA9IHBhcnNlVVJMKHdpbmRvdy5sb2NhdGlvbi5ocmVmKSxcbiAgICAgICAgdGFyZ2V0ID0gcGFyc2VVUkwodXJsKTtcblxuICAgIHJldHVybiB0YXJnZXQuaG9zdG5hbWUgIT09IGhlcmUuaG9zdG5hbWVcbiAgICAgICAgfHwgdGFyZ2V0LnBvcnQgIT09IGhlcmUucG9ydFxuICAgICAgICB8fCB0YXJnZXQucHJvdG9jb2wgIT09IGhlcmUucHJvdG9jb2w7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldEZpbGVTaXplV2l0aFVuaXQ6IGdldEZpbGVTaXplV2l0aFVuaXQsXG4gICAgaXNTdXBwb3J0RmlsZVN5c3RlbTogaXNTdXBwb3J0RmlsZVN5c3RlbSxcbiAgICBpc1N1cHBvcnRGb3JtRGF0YTogaXNTdXBwb3J0Rm9ybURhdGEsXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxuICAgIGlzQ3Jvc3NEb21haW46IGlzQ3Jvc3NEb21haW5cbn07XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgVGhpcyBmaWxlIGlzIGFib3V0IGRyYWcgYW5kIGRyb3AgZmlsZSB0byBzZW5kLiBEcmFnIGFuZCBkcm9wIGlzIHJ1bm5pbmcgdmlhIGZpbGUgYXBpLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcbnZhciBjb25zdHMgPSByZXF1aXJlKCcuLi9jb25zdHMnKTtcblxuLyoqXG4gKiBNYWtlcyBkcmFnIGFuZCBkcm9wIGFyZWEsIHRoZSBkcm9wcGVkIGZpbGUgaXMgYWRkZWQgdmlhIGV2ZW50IGRyb3AgZXZlbnQuXG4gKiBAY2xhc3MgRHJhZ0FuZERyb3BcbiAqIEBwYXJhbSB7VXBsb2FkZXJ9IHVwbG9hZGVyIC0gVXBsb2FkZXJcbiAqL1xudmFyIERyYWdBbmREcm9wID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBEcmFnQW5kRHJvcC5wcm90b3R5cGUgKi97Lyplc2xpbnQtZGlzYWJsZSovXG4gICAgaW5pdDogZnVuY3Rpb24odXBsb2FkZXIpIHsvKmVzbGludC1lbmFibGUqL1xuICAgICAgICB2YXIgaHRtbCA9IGNvbnN0cy5IVE1MLmRyYWdBbmREcm9wO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEcm9wIHpvbmUgalF1ZXJ5LWVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJGVsID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2xhc3MgZm9yIGRyb3AgZW5hYmxlZFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fZW5hYmxlQ2xhc3MgPSBjb25zdHMuQ09ORi5EUk9QX0VOQUJMRURfQ0xBU1M7XG5cbiAgICAgICAgdGhpcy5fcmVuZGVyKGh0bWwsIHVwbG9hZGVyKTtcbiAgICAgICAgdGhpcy5fYWRkRXZlbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVuZGVycyBkcmFnIGFuZCBkcm9wIGFyZWFcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaHRtbCBUaGUgaHRtbCBzdHJpbmcgdG8gbWFrZSBkYXJnIHpvbmVcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdXBsb2FkZXIgVGhlIGNvcmUgaW5zdGFuY2Ugb2YgdGhpcyBjb21wb25lbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW5kZXI6IGZ1bmN0aW9uKGh0bWwsIHVwbG9hZGVyKSB7XG4gICAgICAgIHRoaXMuJGVsID0gJChodG1sKVxuICAgICAgICAgICAgLmFwcGVuZFRvKHVwbG9hZGVyLiRlbCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZHMgZHJhZyBhbmQgZHJvcCBldmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZEV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwub24oe1xuICAgICAgICAgICAgZHJhZ2VudGVyOiAkLnByb3h5KHRoaXMub25EcmFnRW50ZXIsIHRoaXMpLFxuICAgICAgICAgICAgZHJhZ292ZXI6ICQucHJveHkodGhpcy5vbkRyYWdPdmVyLCB0aGlzKSxcbiAgICAgICAgICAgIGRyb3A6ICQucHJveHkodGhpcy5vbkRyb3AsIHRoaXMpLFxuICAgICAgICAgICAgZHJhZ2xlYXZlOiAkLnByb3h5KHRoaXMub25EcmFnTGVhdmUsIHRoaXMpXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGVzIGRyYWdlbnRlciBldmVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGUgLSBFdmVudFxuICAgICAqL1xuICAgIG9uRHJhZ0VudGVyOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgdGhpcy5fZW5hYmxlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEhhbmRsZXMgZHJhZ292ZXIgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBlIC0gRXZlbnRcbiAgICAgKi9cbiAgICBvbkRyYWdPdmVyOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlcyBkcmFnbGVhdmUgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBlIC0gRXZlbnRcbiAgICAgKi9cbiAgICBvbkRyYWdMZWF2ZTogZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMuX2Rpc2FibGUoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlcyBkcm9wIGV2ZW50XG4gICAgICogQHBhcmFtIHtFdmVudH0gZSAtIEV2ZW50XG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IEZhbHNlXG4gICAgICovXG4gICAgb25Ecm9wOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBmaWxlcyA9IHR1aS51dGlsLnBpY2soZSwgJ29yaWdpbmFsRXZlbnQnLCAnZGF0YVRyYW5zZmVyJywgJ2ZpbGVzJyk7XG5cbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLl9kaXNhYmxlKCk7XG4gICAgICAgIHRoaXMuZmlyZSgnZHJvcCcsIGZpbGVzKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFbmFibGUgZHJvcHpvbmVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9lbmFibGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbC5hZGRDbGFzcyh0aGlzLl9lbmFibGVDbGFzcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERpc2FibGUgZHJvcG9uemVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9kaXNhYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwucmVtb3ZlQ2xhc3ModGhpcy5fZW5hYmxlQ2xhc3MpO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oRHJhZ0FuZERyb3ApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyYWdBbmREcm9wO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZyb20tdmlldyBtYWtlcyBhIGZvcm0gYnkgdGVtcGxhdGUuIEFkZCBldmVudHMgZm9yIGZpbGUgdXBsb2FkLlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcbnZhciBjb25zdHMgPSByZXF1aXJlKCcuLi9jb25zdHMnKSxcbiAgICB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cbnZhciBpc1N1cHBvcnRGb3JtRGF0YSA9IHV0aWxzLmlzU3VwcG9ydEZvcm1EYXRhKCksXG4gICAgSElEREVOX0ZJTEVfSU5QVVRfQ0xBU1MgPSBjb25zdHMuQ09ORi5ISURERU5fRklMRV9JTlBVVF9DTEFTUztcblxuLyoqXG4gKiBUaGlzIHZpZXcgY29udHJvbCBpbnB1dCBlbGVtZW50IHR5cGVkIGZpbGUuXG4gKiBAcGFyYW0ge1VwbG9hZGVyfSB1cGxvYWRlciAtIFVwbG9hZGVyIGluc3RhbmNlXG4gKiBAY29uc3RydWN0b3IgVmlldy5Gb3JtXG4gKi9cbnZhciBGb3JtID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqQGxlbmRzIFZpZXcuRm9ybS5wcm90b3R5cGUgKiovey8qZXNsaW50LWRpc2FibGUqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKHVwbG9hZGVyKSB7Lyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZpbGUgdXBsb2FkZXJcbiAgICAgICAgICogQHR5cGUge1VwbG9hZGVyfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fdXBsb2FkZXIgPSB1cGxvYWRlcjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSHRtbCB0ZW1wbGF0ZXNcbiAgICAgICAgICogQHR5cGUge09iamVjdC48c3RyaW5nLCBzdHJpbmc+fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5faHRtbCA9IHRoaXMuX3NldFRlbXBsYXRlKHVwbG9hZGVyLnRlbXBsYXRlKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRm9ybSBlbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiRlbCA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZpbGUgaW5wdXQgZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kZmlsZUlucHV0ID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU3VibWl0IGVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJHN1Ym1pdCA9IG51bGw7XG5cbiAgICAgICAgaWYgKGlzU3VwcG9ydEZvcm1EYXRhKSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFdoZXRoZXIgdGhlIGZpbGUgaW5wdXQgaXMgbXVsdGlwbGVcbiAgICAgICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5faXNNdWx0aXBsZSA9IHVwbG9hZGVyLmlzTXVsdGlwbGU7XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogV2hldGhlciB0aGUgZmlsZSBpbnB1dCBhY2NlcHRzIGZvbGRlclxuICAgICAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLl91c2VGb2xkZXIgPSB1cGxvYWRlci51c2VGb2xkZXI7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9yZW5kZXIoe1xuICAgICAgICAgICAgYWN0aW9uOiB1cGxvYWRlci51cmwuc2VuZCxcbiAgICAgICAgICAgIG1ldGhvZDogJ3Bvc3QnLFxuICAgICAgICAgICAgZW5jdHlwZTogJ211bHRpcGFydC9mb3JtLWRhdGEnLFxuICAgICAgICAgICAgdGFyZ2V0OiBpc1N1cHBvcnRGb3JtRGF0YSA/ICcnIDogdXBsb2FkZXIuZm9ybVRhcmdldFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVuZGVyIGZvcm0gZWxlbWVudFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBhdHRyaWJ1dGVzIC0gRm9ybSBhdHRyaWJ1dGVzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVuZGVyOiBmdW5jdGlvbihhdHRyaWJ1dGVzKSB7XG4gICAgICAgIHZhciB1cGxvYWRlciA9IHRoaXMuX3VwbG9hZGVyLFxuICAgICAgICAgICAgJGZpbGVJbnB1dCA9IHRoaXMuX2NyZWF0ZUZpbGVJbnB1dCgpLFxuICAgICAgICAgICAgJGVsID0gJCh0aGlzLl9odG1sLmZvcm0pXG4gICAgICAgICAgICAgICAgLmFwcGVuZCgkZmlsZUlucHV0KVxuICAgICAgICAgICAgICAgIC5hdHRyKGF0dHJpYnV0ZXMpO1xuXG4gICAgICAgIHRoaXMuJGZpbGVJbnB1dCA9ICRmaWxlSW5wdXQ7XG4gICAgICAgIHRoaXMuJGVsID0gJGVsO1xuXG4gICAgICAgIGlmICh1cGxvYWRlci5pc0JhdGNoVHJhbnNmZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldFN1Ym1pdEVsZW1lbnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1cGxvYWRlci5pc0Nyb3NzRG9tYWluICYmICFpc1N1cHBvcnRGb3JtRGF0YSkge1xuICAgICAgICAgICAgdGhpcy5fc2V0SGlkZGVuSW5wdXRGb3JDT1JTKCk7XG4gICAgICAgIH1cbiAgICAgICAgdXBsb2FkZXIuJGVsLmFwcGVuZCh0aGlzLiRlbCk7XG5cbiAgICAgICAgdGhpcy5fYWRkRXZlbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHN1Ym1pdCBlbGVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0U3VibWl0RWxlbWVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJHN1Ym1pdCA9ICQodGhpcy5faHRtbC5zdWJtaXQpO1xuICAgICAgICB0aGlzLiRzdWJtaXQuYXBwZW5kVG8odGhpcy4kZWwpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgaGlkZGVuIGlucHV0IGVsZW1lbnQgZm9yIENPUlMuXG4gICAgICogIEhpZGRlbiBpbnB1dCBvZiBQb3N0TWVzc2FnZSBvciBSZWRpcmVjdFVSTC5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRIaWRkZW5JbnB1dEZvckNPUlM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcHJvcHMsICRoaWRkZW5JbnB1dCxcbiAgICAgICAgICAgIHVwbG9hZGVyID0gdGhpcy5fdXBsb2FkZXIsXG4gICAgICAgICAgICByZWRpcmVjdFVSTCA9IHVwbG9hZGVyLnJlZGlyZWN0VVJMO1xuXG4gICAgICAgIGlmICh1cGxvYWRlci5pc1N1cHBvcnRQb3N0TWVzc2FnZSkgeyAvLyBmb3IgSUU4LCA5XG4gICAgICAgICAgICBwcm9wcyA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnbWVzc2FnZVRhcmdldCcsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGxvY2F0aW9uLnByb3RvY29sICsgJy8vJyArIGxvY2F0aW9uLmhvc3RcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAocmVkaXJlY3RVUkwpIHsgLy8gZm9yIElFN1xuICAgICAgICAgICAgcHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3JlZGlyZWN0VVJMJyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogcmVkaXJlY3RVUkxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvcHMpIHtcbiAgICAgICAgICAgICRoaWRkZW5JbnB1dCA9ICQodXRpbHMudGVtcGxhdGUocHJvcHMsIHRoaXMuX2h0bWwuaGlkZGVuSW5wdXQpKTtcbiAgICAgICAgICAgICRoaWRkZW5JbnB1dC5hcHBlbmRUbyh0aGlzLiRlbCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGFsbCBvZiBpbnB1dCBlbGVtZW50cyBodG1sIHN0cmluZ3MuXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW3RlbXBsYXRlXSBUaGUgdGVtcGxhdGUgaXMgc2V0IGZvcm0gY3VzdG9tZXIuXG4gICAgICogQHJldHVybiB7T2JqZWN0LjxzdHJpbmcsIHN0cmluZz59IFRoZSBodG1sIHRlbXBsYXRlIHN0cmluZyBzZXQgZm9yIGZvcm0uXG4gICAgICovXG4gICAgX3NldFRlbXBsYXRlOiBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuICAgICAgICByZXR1cm4gdHVpLnV0aWwuZXh0ZW5kKHt9LCBjb25zdHMuSFRNTCwgdGVtcGxhdGUpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlcyBhbmQgcmV0dXJucyBqcXVlcnkgZWxlbWVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHJldHVybiB7alF1ZXJ5fSBUaGUganF1ZXJ5IG9iamVjdCB3cmFwcGluZyBvcmlnaW5hbCBpbnB1dCBlbGVtZW50XG4gICAgICovXG4gICAgX2NyZWF0ZUZpbGVJbnB1dDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtYXAgPSB7XG4gICAgICAgICAgICBtdWx0aXBsZTogdGhpcy5faXNNdWx0aXBsZSA/ICdtdWx0aXBsZScgOiAnJyxcbiAgICAgICAgICAgIGZpbGVGaWVsZDogdGhpcy5fdXBsb2FkZXIuZmlsZUZpZWxkLFxuICAgICAgICAgICAgZGlyZWN0b3J5OiB0aGlzLl91c2VGb2xkZXIgPyAnZGlyZWN0b3J5IG1vemRpcmVjdG9yeSB3ZWJraXRkaXJlY3RvcnknIDogJydcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gJCh1dGlscy50ZW1wbGF0ZShtYXAsIHRoaXMuX2h0bWwuZmlsZUlucHV0KSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZEV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX3VwbG9hZGVyLmlzQmF0Y2hUcmFuc2Zlcikge1xuICAgICAgICAgICAgdGhpcy4kZWwub24oJ3N1Ym1pdCcsICQucHJveHkodGhpcy5maXJlLCB0aGlzLCAnc3VibWl0JykpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2FkZElucHV0RXZlbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGNoYW5nZSBldmVudCB0byBmaWxlIGlucHV0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkSW5wdXRFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGZpbGVJbnB1dC5vbignY2hhbmdlJywgJC5wcm94eSh0aGlzLm9uQ2hhbmdlLCB0aGlzKSk7XG4gICAgICAgIHRoaXMuJGZpbGVJbnB1dC5hdHRyKCd0aXRsZScsICcgJyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50LUhhbmRsZSBmb3IgaW5wdXQgZWxlbWVudCBjaGFuZ2VcbiAgICAgKi9cbiAgICBvbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy4kZmlsZUlucHV0WzBdLnZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5maXJlKCdjaGFuZ2UnKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVzZXQgSW5wdXQgZWxlbWVudCB0byBzYXZlIHdob2xlIGlucHV0PWZpbGUgZWxlbWVudC5cbiAgICAgKi9cbiAgICByZXNldEZpbGVJbnB1dDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGZpbGVJbnB1dC5yZW1vdmUoKTtcbiAgICAgICAgdGhpcy4kZmlsZUlucHV0ID0gdGhpcy5fY3JlYXRlRmlsZUlucHV0KCk7XG4gICAgICAgIGlmICh0aGlzLiRzdWJtaXQpIHtcbiAgICAgICAgICAgIHRoaXMuJHN1Ym1pdC5iZWZvcmUodGhpcy4kZmlsZUlucHV0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuJGVsLmFwcGVuZCh0aGlzLiRmaWxlSW5wdXQpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2FkZElucHV0RXZlbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgZmlsZSBpbnB1dCBlbGVtZW50c1xuICAgICAqL1xuICAgIGNsZWFyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwuZmluZCgnLicgKyBISURERU5fRklMRV9JTlBVVF9DTEFTUykucmVtb3ZlKCk7XG4gICAgICAgIHRoaXMucmVzZXRGaWxlSW5wdXQoKTtcbiAgICB9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKEZvcm0pO1xubW9kdWxlLmV4cG9ydHMgPSBGb3JtO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEl0ZW1WaWV3IG1ha2UgZWxlbWVudCB0byBkaXNwbGF5IGFkZGVkIGZpbGUgaW5mb3JtYXRpb24uIEl0IGhhcyBhdHRhY2hlZCBmaWxlIElEIHRvIHJlcXVlc3QgZm9yIHJlbW92ZS5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG52YXIgY29uc3RzID0gcmVxdWlyZSgnLi4vY29uc3RzJyksXG4gICAgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG52YXIgUkVNT1ZFX0JVVFRPTl9DTEFTUyA9IGNvbnN0cy5DT05GLlJFTU9WRV9CVVRUT05fQ0xBU1M7XG5cbi8qKlxuICogQ2xhc3Mgb2YgaXRlbSB0aGF0IGlzIG1lbWJlciBvZiBmaWxlIGxpc3QuXG4gKiBAY2xhc3MgSXRlbVxuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnNcbiAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5uYW1lIEZpbGUgbmFtZVxuICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnR5cGUgRmlsZSB0eXBlXG4gKiAgQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMucm9vdCBMaXN0IGluc3RhbmNlXG4gKiAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmlkXSBVbmlxdWUga2V5LCB3aGF0IGlmIHRoZSBrZXkgaXMgbm90IGV4aXN0IGlkIHdpbGwgYmUgdGhlIGZpbGUgbmFtZS5cbiAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGVsZXRlQnV0dG9uQ2xhc3NOYW1lPSd1cGxvYWRlcl9idG5fZGVsZXRlJ10gVGhlIGNsYXNzIG5hbWUgaXMgZm9yIGRlbGV0ZSBidXR0b24uXG4gKiAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnRlbXBsYXRlXSBpdGVtIHRlbXBsYXRlXG4gKiAgQHBhcmFtIHsoc3RyaW5nfG51bWJlcil9IFtvcHRpb25zLnNpemVdIEZpbGUgc2l6ZSAoYnV0IGllIGxvdyBicm93c2VyLCB4LWRvbWFpbilcbiAqL1xudmFyIEl0ZW0gPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIEl0ZW0ucHJvdG90eXBlICoqL3svKmVzbGludC1kaXNhYmxlKi9cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7Lyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEl0ZW06IExJIGVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJGVsID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSXRlbTogcmVtb3ZlIGJ1dHRvblxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kcmVtb3ZlQnRuID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSXRlbSBuYW1lXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm5hbWUgPSBvcHRpb25zLm5hbWU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEl0ZW0gaWRcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaWQgPSBvcHRpb25zLmlkIHx8IG9wdGlvbnMubmFtZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSXRlbSBzaXplXG4gICAgICAgICAqIEB0eXBlIHtudW1iZXJ8c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5zaXplID0gb3B0aW9ucy5zaXplIHx8ICcnO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJdGVtIHR5cGVcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudHlwZSA9IHRoaXMuX2V4dHJhY3RFeHRlbnNpb24oKTtcblxuICAgICAgICB0aGlzLnJlbmRlcihvcHRpb25zLnJvb3QuJGVsKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVuZGVyIG1ha2luZyBmb3JtIHBhZGRpbmcgd2l0aCBkZWxldGFibGUgaXRlbVxuICAgICAqIEBwYXJhbSB7alF1ZXJ5fSAkdGFyZ2V0IC0gVGFyZ2V0IExpc3QgZWxlbWVudFxuICAgICAqL1xuICAgIHJlbmRlcjogZnVuY3Rpb24oJHRhcmdldCkge1xuICAgICAgICB2YXIgaHRtbCA9IHRoaXMuX2dldEh0bWwoKSxcbiAgICAgICAgICAgIHJlbW92ZUJ1dHRvbkhUTUwgPSB1dGlscy50ZW1wbGF0ZSh7XG4gICAgICAgICAgICAgICAgdGV4dDogJ1JlbW92ZSdcbiAgICAgICAgICAgIH0sIGNvbnN0cy5IVE1MLmJ1dHRvbiksXG4gICAgICAgICAgICAkcmVtb3ZlQnRuID0gJChyZW1vdmVCdXR0b25IVE1MKTtcblxuICAgICAgICB0aGlzLiRyZW1vdmVCdG4gPSAkcmVtb3ZlQnRuXG4gICAgICAgICAgICAuYWRkQ2xhc3MoUkVNT1ZFX0JVVFRPTl9DTEFTUyk7XG5cbiAgICAgICAgdGhpcy4kZWwgPSAkKGh0bWwpXG4gICAgICAgICAgICAuYXBwZW5kKCRyZW1vdmVCdG4pXG4gICAgICAgICAgICAuYXBwZW5kVG8oJHRhcmdldCk7XG5cbiAgICAgICAgdGhpcy5fYWRkRXZlbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXh0cmFjdCBmaWxlIGV4dGVuc2lvbiBieSBuYW1lXG4gICAgICogQHJldHVybnMge3N0cmluZ30gRmlsZSBleHRlbnNpb25cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9leHRyYWN0RXh0ZW5zaW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZS5zcGxpdCgnLicpLnBvcCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgbGlzdEl0ZW0gZWxlbWVudCBIVE1MXG4gICAgICogQHJldHVybnMge3N0cmluZ30gSFRNTFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldEh0bWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbWFwID0ge1xuICAgICAgICAgICAgZmlsZXR5cGU6IHRoaXMudHlwZSxcbiAgICAgICAgICAgIGZpbGVuYW1lOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICBmaWxlc2l6ZTogdGhpcy5zaXplID8gdXRpbHMuZ2V0RmlsZVNpemVXaXRoVW5pdCh0aGlzLnNpemUpIDogJydcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdXRpbHMudGVtcGxhdGUobWFwLCBjb25zdHMuSFRNTC5saXN0SXRlbSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudCBoYW5kbGVyIG9uIGRlbGV0ZSBidXR0b24uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRyZW1vdmVCdG4ub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLl9vbkNsaWNrRXZlbnQsIHRoaXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQtaGFuZGxlIGZvciBkZWxldGUgYnV0dG9uIGNsaWNrZWQuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25DbGlja0V2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5maXJlKCdyZW1vdmUnLCB7XG4gICAgICAgICAgICBuYW1lIDogdGhpcy5uYW1lLFxuICAgICAgICAgICAgaWQgOiB0aGlzLmlkLFxuICAgICAgICAgICAgdHlwZTogJ3JlbW92ZSdcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERlc3Ryb3kgaXRlbVxuICAgICAqL1xuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbC5yZW1vdmUoKTtcbiAgICB9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKEl0ZW0pO1xubW9kdWxlLmV4cG9ydHMgPSBJdGVtO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZpbGVMaXN0VmlldyBsaXN0aW5nIGZpbGVzIGFuZCBkaXNwbGF5IHN0YXRlcyhsaWtlIHNpemUsIGNvdW50KS5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xudmFyIEl0ZW0gPSByZXF1aXJlKCcuL2l0ZW0nKTtcblxuLyoqXG4gKiBMaXN0IGhhcyBpdGVtcy4gSXQgY2FuIGFkZCBhbmQgcmVtb3ZlIGl0ZW0sIGFuZCBnZXQgdG90YWwgdXNhZ2UuXG4gKiBAcGFyYW0ge1VwbG9hZGVyfSB1cGxvYWRlciAtIFVwbG9hZGVyXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCBqUXVlcnk+fSBsaXN0SW5mb1xuICogIEBwYXJhbSB7alF1ZXJ5fSBsaXN0SW5mby5saXN0IC0gTGlzdCBqcXVlcnktZWxlbWVudFxuICogIEBwYXJhbSB7alF1ZXJ5fSBsaXN0SW5mby5jb3VudCAtIENvdW50IGpxdWVyeS1lbGVtZW50XG4gKiAgQHBhcmFtIHtqUXVlcnl9IGxpc3RJbmZvLnNpemUgLSBTaXplIGpxdWVyeS1lbGVtZW50XG4gKiBAY2xhc3MgTGlzdFxuICovXG52YXIgTGlzdCA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgTGlzdC5wcm90b3R5cGUgKi97Lyplc2xpbnQtZGlzYWJsZSovXG4gICAgaW5pdCA6IGZ1bmN0aW9uKGxpc3RJbmZvKSB7Lyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEl0ZW1zXG4gICAgICAgICAqIEB0eXBlIHtBcnJheS48SXRlbT59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLml0ZW1zID0gW107XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGpRdWVyeS1lbGVtZW50IG9mIExpc3RcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJGVsID0gbGlzdEluZm8ubGlzdDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogalF1ZXJ5LWVsZW1lbnQgb2YgY291bnRcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJGNvdW50ZXIgPSBsaXN0SW5mby5jb3VudDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogalF1ZXJ5LWVsZW1lbnQgb2YgdG90YWwgc2l6ZVxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kc2l6ZSA9IGxpc3RJbmZvLnNpemU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBpdGVtIGxpc3RcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSAtIEZpbGUgaW5mb3JtYXRpb24ocykgd2l0aCB0eXBlXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtkYXRhLnR5cGVdIC0gJ3JlbW92ZScgb3Igbm90LlxuICAgICAqL1xuICAgIHVwZGF0ZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBpZiAoZGF0YS50eXBlID09PSAncmVtb3ZlJykge1xuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlRmlsZUl0ZW0oZGF0YS5pZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9hZGRGaWxlSXRlbXMoZGF0YSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW1zIHRvdGFsIGNvdW50LCB0b3RhbCBzaXplIGluZm9ybWF0aW9uLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbaW5mb10gQSBpbmZvcm1hdGlvbiB0byB1cGRhdGUgbGlzdC5cbiAgICAgKiAgQHBhcmFtIHthcnJheX0gaW5mby5pdGVtcyBUaGUgbGlzdCBvZiBmaWxlIGluZm9ybWF0aW9uLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gaW5mby5zaXplIFRoZSB0b3RhbCBzaXplLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gaW5mby5jb3VudCBUaGUgY291bnQgb2YgZmlsZXMuXG4gICAgICovXG4gICAgdXBkYXRlVG90YWxJbmZvOiBmdW5jdGlvbihpbmZvKSB7XG4gICAgICAgIGlmIChpbmZvKSB7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVUb3RhbENvdW50KGluZm8uY291bnQpO1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlVG90YWxVc2FnZShpbmZvLnNpemUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlVG90YWxDb3VudCgpO1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlVG90YWxVc2FnZSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBpdGVtcyB0b3RhbCBjb3VudCBhbmQgcmVmcmVzaCBlbGVtZW50XG4gICAgICogQHBhcmFtIHsobnVtYmVyfHN0cmluZyl9IFtjb3VudF0gVG90YWwgZmlsZSBjb3VudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwZGF0ZVRvdGFsQ291bnQ6IGZ1bmN0aW9uKGNvdW50KSB7XG4gICAgICAgIGlmICghdHVpLnV0aWwuaXNFeGlzdHkoY291bnQpKSB7XG4gICAgICAgICAgICBjb3VudCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4kY291bnRlci5odG1sKGNvdW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW1zIHRvdGFsIHNpemUgYW5kIHJlZnJlc2ggZWxlbWVudFxuICAgICAqIEBwYXJhbSB7KG51bWJlcnxzdHJpbmcpfSBbc2l6ZV0gVG90YWwgZmlsZXMgc2l6ZXNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF91cGRhdGVUb3RhbFVzYWdlOiBmdW5jdGlvbihzaXplKSB7XG4gICAgICAgIGlmICghdHVpLnV0aWwuaXNFeGlzdHkoc2l6ZSkpIHtcbiAgICAgICAgICAgIHNpemUgPSB0aGlzLl9nZXRTdW1BbGxJdGVtVXNhZ2UoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHVpLnV0aWwuaXNOdW1iZXIoc2l6ZSkgJiYgIWlzTmFOKHNpemUpKSB7XG4gICAgICAgICAgICBzaXplID0gdXRpbHMuZ2V0RmlsZVNpemVXaXRoVW5pdChzaXplKTtcbiAgICAgICAgICAgIHRoaXMuJHNpemUuaHRtbChzaXplKTtcbiAgICAgICAgICAgIHRoaXMuJHNpemUuc2hvdygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kc2l6ZS5oaWRlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3VtIHNpemVzIG9mIGFsbCBpdGVtcy5cbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSB0b3RhbFNpemVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRTdW1BbGxJdGVtVXNhZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaXRlbXMgPSB0aGlzLml0ZW1zLFxuICAgICAgICAgICAgdG90YWxVc2FnZSA9IDA7XG5cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChpdGVtcywgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgdG90YWxVc2FnZSArPSBwYXJzZUZsb2F0KGl0ZW0uc2l6ZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0b3RhbFVzYWdlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZmlsZSBpdGVtc1xuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXQgVGFyZ2V0IGl0ZW0gaW5mb3JtYXRpb24uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRmlsZUl0ZW1zOiBmdW5jdGlvbih0YXJnZXQpIHtcbiAgICAgICAgaWYgKCF0dWkudXRpbC5pc0FycmF5U2FmZSh0YXJnZXQpKSB7IC8vIGZvciB0YXJnZXQgZnJvbSBpZnJhbWUsIHVzZSBcImlzQXJyYXlTYWZlXCJcbiAgICAgICAgICAgIHRhcmdldCA9IFt0YXJnZXRdO1xuICAgICAgICB9XG4gICAgICAgIHR1aS51dGlsLmZvckVhY2godGFyZ2V0LCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2godGhpcy5fY3JlYXRlSXRlbShkYXRhKSk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZmlsZSBpdGVtXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gVGhlIGl0ZW0gaWQgdG8gcmVtb3ZlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlRmlsZUl0ZW06IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHR1aS51dGlsLmZvckVhY2godGhpcy5pdGVtcywgZnVuY3Rpb24oaXRlbSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmIChpZCA9PT0gaXRlbS5pZCkge1xuICAgICAgICAgICAgICAgIGl0ZW0uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgaXRlbSBCeSBEYXRhXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSBEYXRhIGZvciBsaXN0IGl0ZW1zXG4gICAgICogQHJldHVybnMge0l0ZW19IEl0ZW1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jcmVhdGVJdGVtOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBpdGVtID0gbmV3IEl0ZW0oe1xuICAgICAgICAgICAgcm9vdDogdGhpcyxcbiAgICAgICAgICAgIG5hbWU6IGRhdGEubmFtZSxcbiAgICAgICAgICAgIHNpemU6IGRhdGEuc2l6ZSxcbiAgICAgICAgICAgIGlkOiBkYXRhLmlkXG4gICAgICAgIH0pO1xuICAgICAgICBpdGVtLm9uKCdyZW1vdmUnLCB0aGlzLl9yZW1vdmVGaWxlLCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIFJlbW92ZSBGaWxlXG4gICAgICogQHBhcmFtIHtJdGVtfSBpdGVtIC0gSXRlbVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbW92ZUZpbGU6IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgdGhpcy5maXJlKCdyZW1vdmUnLCBpdGVtKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgbGlzdFxuICAgICAqL1xuICAgIGNsZWFyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaCh0aGlzLml0ZW1zLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICBpdGVtLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuaXRlbXMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy51cGRhdGVUb3RhbEluZm8oKTtcbiAgICB9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKExpc3QpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IExpc3Q7XG4iXX0=
