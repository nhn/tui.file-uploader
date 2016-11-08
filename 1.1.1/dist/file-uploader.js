/**
 * tui-component-file-uploader
 * @author NHNEnt FE Development lab <dl_javascript@nhnent.com>
 * @version v1.1.1
 * @license 
 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
tui.util.defineNamespace('tui.component', {
    Uploader: require('./src/js/uploader.js')
});


},{"./src/js/uploader.js":6}],2:[function(require,module,exports){
/**
 * @fileoverview Configuration or default values.
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';

/**
 * Uploader config
 * @type {object}
 * @ignore
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
 * @ignore
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
 * @ignore
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
 * @constructor
 * @param {object} options To set up uploader modules.
 *  @param {object} options.url File server urls.
 *      @param {string} options.url.send Send url.
 *      @param {string} options.url.remove Delete url.
 *  @param {string} [options.formTarget='tuiUploaderHiddenFrame'] The target name(iframe) for CORS.
 *  @param {object} options.listInfo To display files information.
 *  @param {string} [options.fileField='userFile[]'] The field name of input file element.
 *  @param {boolean} options.useFolder Use directory upload. If ture, 'isMultiple' option will be ignored.
 *  @param {boolean} options.isMultiple Use multiple files upload.
 * @param {jQuery} $el Root Element of Uploader
 * @example
 * // HTML
 * //  <div id="uploader"></div>
 * //  <div id="list">
 * //    <div class="count">count : <strong id="file_count"></strong></div>
 * //    <div class="size">size : <strong id="size_count"></strong></div>
 * //    <ul id="files"></ul>
 * //  </div>
 *
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
         * @private
         */
        this.$el = $el;

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
         * Input file - field name
         * @private
         * @type {string}
         */
        this.fileField = options.fileField || consts.CONF.FILE_FILED_NAME;

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

        if (this.useDrag && !this.useFolder && utils.isSupportFileSystem()) {
            /**
             * Drag & Drop View
             * @private
             * @type {DragAndDrop}
             */
            this.dragView = new DragAndDrop(this);
        }

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
                this.updateList(data);
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
     * @param {object} [info] The data for update list
     * @private
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
     * @private
     */
    store: function(files) {
        this._requester.store(files);
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
/**
 * @fileoverview This file contain utility methods for uploader.
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */

'use strict';
/**
 * @namespace utils
 * @ignore
 */
var IS_SUPPORT_FILE_SYSTEM = !!(window.File && window.FileReader && window.FileList && window.Blob),
    IS_SUPPORT_FORM_DATA = !!(window.FormData || null);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25zdHMuanMiLCJzcmMvanMvcG9vbC5qcyIsInNyYy9qcy9yZXF1ZXN0ZXIvbW9kZXJuLmpzIiwic3JjL2pzL3JlcXVlc3Rlci9vbGQuanMiLCJzcmMvanMvdXBsb2FkZXIuanMiLCJzcmMvanMvdXRpbHMuanMiLCJzcmMvanMvdmlldy9kcmFnLmpzIiwic3JjL2pzL3ZpZXcvZm9ybS5qcyIsInNyYy9qcy92aWV3L2l0ZW0uanMiLCJzcmMvanMvdmlldy9saXN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcbnR1aS51dGlsLmRlZmluZU5hbWVzcGFjZSgndHVpLmNvbXBvbmVudCcsIHtcbiAgICBVcGxvYWRlcjogcmVxdWlyZSgnLi9zcmMvanMvdXBsb2FkZXIuanMnKVxufSk7XG5cbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBDb25maWd1cmF0aW9uIG9yIGRlZmF1bHQgdmFsdWVzLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBVcGxvYWRlciBjb25maWdcbiAqIEB0eXBlIHtvYmplY3R9XG4gKiBAaWdub3JlXG4gKi9cbm1vZHVsZS5leHBvcnRzLkNPTkYgPSB7XG4gICAgRklMRV9GSUxFRF9OQU1FOiAndXNlcmZpbGVbXScsXG4gICAgRFJPUF9FTkFCTEVEX0NMQVNTOiAnZHJvcEVuYWJsZWQnLFxuICAgIEhJRERFTl9GSUxFX0lOUFVUX0NMQVNTOiAnaGlkZGVuRmlsZUlucHV0JyxcbiAgICBSRVFVRVNURVJfVFlQRV9NT0RFUk46ICdtb2Rlcm5SZXF1ZXN0ZXInLFxuICAgIFJFUVVFU1RFUl9UWVBFX09MRDogJ29sZFJlcXVlc3RlcicsXG4gICAgRk9STV9UQVJHRVRfTkFNRTogJ3R1aVVwbG9hZGVySGlkZGVuRnJhbWUnLFxuICAgIFJFTU9WRV9CVVRUT05fQ0xBU1M6ICdyZW1vdmVCdXR0b24nXG59O1xuXG4vKipcbiAqIERlZmF1bHQgSHRtbHNcbiAqIEB0eXBlIHt7aW5wdXQ6IHN0cmluZywgaXRlbTogc3RyaW5nfX1cbiAqIEBpZ25vcmVcbiAqL1xubW9kdWxlLmV4cG9ydHMuSFRNTCA9IHtcbiAgICBmb3JtOiBbXG4gICAgICAgICc8Zm9ybSBlbmN0eXBlPVwibXVsdGlwYXJ0L2Zvcm0tZGF0YVwiIGlkPVwidHVpLXVwbG9hZGVyLWZvcm1cIiBtZXRob2Q9XCJwb3N0XCI+JyxcbiAgICAgICAgJzwvZm9ybT4nXG4gICAgXS5qb2luKCcnKSxcbiAgICBzdWJtaXQ6ICc8YnV0dG9uIGNsYXNzPVwiYmF0Y2hTdWJtaXRcIiB0eXBlPVwic3VibWl0XCI+U0VORDwvYnV0dG9uPicsXG4gICAgZmlsZUlucHV0OiAnPGlucHV0IHR5cGU9XCJmaWxlXCIgaWQ9XCJmaWxlQXR0YWNoXCIge3tkaXJlY3Rvcnl9fSBuYW1lPVwie3tmaWxlRmllbGR9fVwiIHt7bXVsdGlwbGV9fSAvPicsXG4gICAgaGlkZGVuSW5wdXQ6ICc8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJ7e25hbWV9fVwiIHZhbHVlPVwie3t2YWx1ZX19XCI+JyxcbiAgICBidXR0b246ICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIj57e3RleHR9fTwvYnV0dG9uPicsXG4gICAgbGlzdEl0ZW06IFtcbiAgICAgICAgJzxsaSBjbGFzcz1cImZpbGV0eXBlRGlzcGxheUNsYXNzXCI+JyxcbiAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImZpbGVpY29uIHt7ZmlsZXR5cGV9fVwiPnt7ZmlsZXR5cGV9fTwvc3Bhbj4nLFxuICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwiZmlsZV9uYW1lXCI+e3tmaWxlbmFtZX19PC9zcGFuPicsXG4gICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJmaWxlX3NpemVcIj57e2ZpbGVzaXplfX08L3NwYW4+JyxcbiAgICAgICAgJzwvbGk+J1xuICAgIF0uam9pbignJyksXG4gICAgZHJhZ0FuZERyb3A6ICc8ZGl2IGNsYXNzPVwiZHJvcHpvbmVcIj48L2Rpdj4nXG59O1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgaXMgbWFuYWdlciBvZiBpbnB1dCBlbGVtZW50cyB0aGF0IGFjdCBsaWtlIGZpbGUgcG9vbC5cbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBjb25zdHMgPSByZXF1aXJlKCcuL2NvbnN0cycpO1xuXG52YXIgSElEREVOX0ZJTEVfSU5QVVRfQ0xBU1MgPSBjb25zdHMuQ09ORi5ISURERU5fRklMRV9JTlBVVF9DTEFTUyxcbiAgICBmb3JFYWNoID0gdHVpLnV0aWwuZm9yRWFjaCxcbiAgICBoYXNTdGFtcCA9IHR1aS51dGlsLmhhc1N0YW1wLFxuICAgIHN0YW1wID0gdHVpLnV0aWwuc3RhbXA7XG5cbi8qKlxuICogVGhlIHBvb2wgZm9yIHNhdmUgZmlsZXMuXG4gKiBJdCdzIG9ubHkgZm9yIGlucHV0W2ZpbGVdIGVsZW1lbnQgc2F2ZSBhdCBicm93c2VyIHRoYXQgZG9lcyBub3Qgc3VwcG9ydCBmaWxlIGFwaS5cbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHBsYW5ldCAtIEZvcm0gZWxlbWVudFxuICogQGNsYXNzIFBvb2xcbiAqIEBpZ25vcmVcbiAqL1xudmFyIFBvb2wgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFBvb2wucHJvdG90eXBlICovey8qZXNsaW50LWRpc2FibGUqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKHBsYW5ldCkgey8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTdWJtaXR0ZXIgZm9yIGZpbGUgZWxlbWVudCB0byBzZXJ2ZXJcbiAgICAgICAgICogRm9ybSBlbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtIVE1MRWxlbWVudH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucGxhbmV0ID0gcGxhbmV0O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGaWxlIGRhdGEgc3RydWN0dXJlIG9iamVjdFxuICAgICAgICAgKiAga2V5PW5hbWUgOiB2YWx1ZT1pdXB1dFt0eXBlPWZpbGVdKEVsZW1lbnQpXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZpbGVzID0ge307XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNhdmUgYSBpbnB1dCBlbGVtZW50W3R5cGU9ZmlsZV0sIGFzIHZhbHVlIG9mIGZpbGUgbmFtZS5cbiAgICAgKiBAcGFyYW0ge0hUTUxJbnB1dEVsZW1lbnR9IGlucHV0RmlsZUVsIEEgaW5wdXQgZWxlbWVudCB0aGF0IGhhdmUgdG8gYmUgc2F2ZWRcbiAgICAgKi9cbiAgICBzdG9yZTogZnVuY3Rpb24oaW5wdXRGaWxlRWwpIHtcbiAgICAgICAgdmFyIGlkID0gaGFzU3RhbXAoaW5wdXRGaWxlRWwpICYmIHN0YW1wKGlucHV0RmlsZUVsKSxcbiAgICAgICAgICAgIGZpbGVuYW1lLCBrZXk7XG5cbiAgICAgICAgaWYgKCFpZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGZpbGVuYW1lID0gaW5wdXRGaWxlRWwudmFsdWU7XG4gICAgICAgIGtleSA9IGlkICsgZmlsZW5hbWU7XG4gICAgICAgIHRoaXMuZmlsZXNba2V5XSA9IGlucHV0RmlsZUVsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBpbnB1dCBlbGVtZW50W3R5cGU9ZmlsZV0gZnJvbSBwb29sLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgLSBBIGZpbGUgbmFtZSB0aGF0IGhhdmUgdG8gYmUgcmVtb3ZlZC5cbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSByZXN1bHRcbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAgICB2YXIga2V5ID0gcGFyYW1zLmlkICsgcGFyYW1zLm5hbWUsXG4gICAgICAgICAgICBlbGVtZW50ID0gdGhpcy5maWxlc1trZXldO1xuXG4gICAgICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVsZXRlIHRoaXMuZmlsZXNba2V5XTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEVtcHR5IHBvb2xcbiAgICAgKi9cbiAgICBlbXB0eTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZmlsZXMgPSB7fTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUGxhbnQgZmlsZXMgb24gcG9vbCB0byBmb3JtIGlucHV0XG4gICAgICovXG4gICAgcGxhbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcGxhbmV0ID0gdGhpcy5wbGFuZXQ7XG4gICAgICAgIGZvckVhY2godGhpcy5maWxlcywgZnVuY3Rpb24oZWxlbWVudCwga2V5KSB7XG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTmFtZSA9IEhJRERFTl9GSUxFX0lOUFVUX0NMQVNTO1xuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgcGxhbmV0LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuZmlsZXNba2V5XTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUG9vbDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNvbnN0cyA9IHJlcXVpcmUoJy4uL2NvbnN0cycpO1xuXG52YXIgVFlQRSA9IGNvbnN0cy5DT05GLlJFUVVFU1RFUl9UWVBFX01PREVSTixcbiAgICBmb3JFYWNoID0gdHVpLnV0aWwuZm9yRWFjaDtcblxuLyoqXG4gKiBNb2Rlcm4gcmVxdWVzdGVyXG4gKiBAcGFyYW0ge1VwbG9hZGVyfSB1cGxvYWRlciAtIFVwbG9hZGVyXG4gKiBAY2xhc3NcbiAqL1xudmFyIE1vZGVybiA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgTW9kZXJuLnByb3RvdHlwZSAqL3svKmVzbGludC1kaXNhYmxlKi9cbiAgICBpbml0OiBmdW5jdGlvbih1cGxvYWRlcikgey8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBVcGxvYWRlclxuICAgICAgICAgKiBAdHlwZSB7VXBsb2FkZXJ9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnVwbG9hZGVyID0gdXBsb2FkZXI7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZyb20gdmlld1xuICAgICAgICAgKiBAdHlwZSB7Rm9ybX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZm9ybVZpZXcgPSB1cGxvYWRlci5mb3JtVmlldztcblxuICAgICAgICAvKipcbiAgICAgICAgICogTG9jYWwgcG9vbCBmb3IgZmlsZXNcbiAgICAgICAgICogQHR5cGUge0FycmF5LjxGaWxlPn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucG9vbCA9IFtdO1xuXG4gICAgICAgIGlmICh1cGxvYWRlci5pc0JhdGNoVHJhbnNmZXIpIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogT3ZlcnJpZGUgcmVtb3ZlIGZ1bmN0aW9uIGZvciBiYXRjaCB0cmFuc2ZlclxuICAgICAgICAgICAgICogQHR5cGUge09sZC5fcmVtb3ZlV2hlbkJhdGNofVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLnJlbW92ZSA9IHRoaXMuX3JlbW92ZVdoZW5CYXRjaDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0ZXIgdHlwZVxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgVFlQRTogVFlQRSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgZm9yIHVwbG9hZCBlcnJvclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBqcVhIUiAtIGpRdWVyeSBYSFJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdHVzIC0gQWpheCBTdGF0dXNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbXNnVGhyb3duIC0gRXJyb3IgbWVzc2FnZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwbG9hZEVycm9yOiBmdW5jdGlvbihqcVhIUiwgc3RhdHVzLCBtc2dUaHJvd24pIHtcbiAgICAgICAgdGhpcy5maXJlKCdlcnJvcicsIHtcbiAgICAgICAgICAgIHN0YXR1czogc3RhdHVzLFxuICAgICAgICAgICAgbWVzc2FnZTogbXNnVGhyb3duXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIGZvciB1cGxvYWQgc3VjY2Vzc1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gVXBsb2FkIHN1Y2Nlc3MgZGF0YVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwbG9hZFN1Y2Nlc3M6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdGhpcy5maXJlKCd1cGxvYWRlZCcsIEpTT04ucGFyc2UoZGF0YSkpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdG9yZSBmaWxlcyB0byBsb2NhbCBwb29sXG4gICAgICogQHBhcmFtIHtBcnJheS48RmlsZT4gfCBGaWxlfSBbZmlsZXNdIC0gQSBmaWxlIG9yIGZpbGVzXG4gICAgICovXG4gICAgc3RvcmU6IGZ1bmN0aW9uKGZpbGVzKSB7XG4gICAgICAgIHZhciBwb29sID0gdGhpcy5wb29sLFxuICAgICAgICAgICAgc3RhbXAgPSB0dWkudXRpbC5zdGFtcCxcbiAgICAgICAgICAgIGRhdGEgPSBbXTtcblxuICAgICAgICBmaWxlcyA9IHR1aS51dGlsLnRvQXJyYXkoZmlsZXMgfHwgdGhpcy5mb3JtVmlldy4kZmlsZUlucHV0WzBdLmZpbGVzKTtcbiAgICAgICAgZm9yRWFjaChmaWxlcywgZnVuY3Rpb24oZmlsZSkge1xuICAgICAgICAgICAgdmFyIGlkID0gc3RhbXAoZmlsZSk7XG4gICAgICAgICAgICBwb29sLnB1c2goZmlsZSk7XG4gICAgICAgICAgICBkYXRhLnB1c2goe1xuICAgICAgICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICAgICAgICBuYW1lOiBmaWxlLm5hbWUsXG4gICAgICAgICAgICAgICAgc2l6ZTogZmlsZS5zaXplXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5mb3JtVmlldy5yZXNldEZpbGVJbnB1dCgpO1xuICAgICAgICB0aGlzLmZpcmUoJ3N0b3JlZCcsIGRhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGxvYWQgYWpheFxuICAgICAqL1xuICAgIHVwbG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBmaWVsZCA9IHRoaXMudXBsb2FkZXIuZmlsZUZpZWxkLFxuICAgICAgICAgICAgJGZvcm0gPSB0aGlzLmZvcm1WaWV3LiRlbC5jbG9uZSgpLFxuICAgICAgICAgICAgZm9ybURhdGE7XG5cbiAgICAgICAgJGZvcm0uZmluZCgnaW5wdXRbdHlwZT1cImZpbGVcIl0nKS5yZW1vdmUoKTtcbiAgICAgICAgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoJGZvcm1bMF0pO1xuXG4gICAgICAgIGZvckVhY2godGhpcy5wb29sLCBmdW5jdGlvbihmaWxlKSB7XG4gICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoZmllbGQsIGZpbGUpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiB0aGlzLnVwbG9hZGVyLnVybC5zZW5kLFxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgZGF0YTogZm9ybURhdGEsXG4gICAgICAgICAgICBzdWNjZXNzOiAkLnByb3h5KHRoaXMuX3VwbG9hZFN1Y2Nlc3MsIHRoaXMpLFxuICAgICAgICAgICAgZXJyb3I6ICQucHJveHkodGhpcy5fdXBsb2FkRXJyb3IsIHRoaXMpLFxuICAgICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBmaWxlIChhamF4LWpzb25wKVxuICAgICAqIEl0IGlzIG5vdCB1c2VkIGZvciBiYXRjaCB0cmFuc2Zlci5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIC0gUGFyYW1ldGVycyB0byByZW1vdmUgZmlsZVxuICAgICAqL1xuICAgIHJlbW92ZTogZnVuY3Rpb24ocGFyYW1zKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHVwbG9hZGVyLnVybC5yZW1vdmUsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb25wJyxcbiAgICAgICAgICAgIGRhdGE6IHBhcmFtcyxcbiAgICAgICAgICAgIHN1Y2Nlc3M6ICQucHJveHkoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIGRhdGEudHlwZSA9ICdyZW1vdmUnO1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgncmVtb3ZlZCcsIGRhdGEpO1xuICAgICAgICAgICAgfSwgdGhpcylcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBmaWxlIChhamF4LWpzb25wKVxuICAgICAqIEl0IGlzIHVzZWQgZm9yIGJhdGNoIHRyYW5zZmVyLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgLSBQYXJhbWV0ZXJzIHRvIHJlbW92ZSBmaWxlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlV2hlbkJhdGNoOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICAgICAgdmFyIHBvb2wgPSB0aGlzLnBvb2wsXG4gICAgICAgICAgICBoYXNTdGFtcCA9IHR1aS51dGlsLmhhc1N0YW1wLFxuICAgICAgICAgICAgc3RhbXAgPSB0dWkudXRpbC5zdGFtcCxcbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbHNlO1xuXG4gICAgICAgIGZvckVhY2gocG9vbCwgZnVuY3Rpb24oZmlsZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmIChoYXNTdGFtcChmaWxlKSAmJiAoc3RhbXAoZmlsZSkgPT09IHBhcmFtcy5pZCkpIHtcbiAgICAgICAgICAgICAgICBwb29sLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuZmlyZSgncmVtb3ZlZCcsIHR1aS51dGlsLmV4dGVuZCh7XG4gICAgICAgICAgICBtZXNzYWdlOiByZXN1bHQgPyAnc3VjY2VzcycgOiAnZmFpbCdcbiAgICAgICAgfSwgcGFyYW1zKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENsZWFyIHRoZSBwb29sXG4gICAgICovXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnBvb2wubGVuZ3RoID0gMDtcbiAgICB9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKE1vZGVybik7XG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVybjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFBvb2wgPSByZXF1aXJlKCcuLi9wb29sJyksXG4gICAgY29uc3RzID0gcmVxdWlyZSgnLi4vY29uc3RzJyk7XG5cbnZhciBUWVBFID0gY29uc3RzLkNPTkYuUkVRVUVTVEVSX1RZUEVfT0xEO1xuXG4vKipcbiAqIE9sZCByZXF1ZXN0ZXJcbiAqIEBwYXJhbSB7VXBsb2FkZXJ9IHVwbG9hZGVyIC0gVXBsb2FkZXJcbiAqIEBjbGFzc1xuICovXG52YXIgT2xkID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBPbGQucHJvdG90eXBlICovey8qZXNsaW50LWRpc2FibGUqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKHVwbG9hZGVyKSB7Lyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgdmFyICRoaWRkZW5GcmFtZSA9IHVwbG9hZGVyLiR0YXJnZXRGcmFtZSxcbiAgICAgICAgICAgIGZvcm1WaWV3ID0gdXBsb2FkZXIuZm9ybVZpZXc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFVwbG9hZGVyXG4gICAgICAgICAqIEB0eXBlIHtVcGxvYWRlcn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudXBsb2FkZXIgPSB1cGxvYWRlcjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRnJvbSB2aWV3XG4gICAgICAgICAqIEB0eXBlIHtGb3JtfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5mb3JtVmlldyA9IGZvcm1WaWV3O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMb2NhbCBwb29sIGZvciBmaWxlIGVsZW1lbnRzXG4gICAgICAgICAqIEB0eXBlIHtQb29sfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wb29sID0gbmV3IFBvb2woZm9ybVZpZXcuJGVsWzBdKTtcblxuICAgICAgICBpZiAodXBsb2FkZXIuaXNCYXRjaFRyYW5zZmVyKSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE92ZXJyaWRlIFVwbG9hZCBmdW5jdGlvbiBmb3IgYmF0Y2ggdHJhbnNmZXJcbiAgICAgICAgICAgICAqIEB0eXBlIHtPbGQuX3VwbG9hZFdoZW5CYXRjaH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy51cGxvYWQgPSB0aGlzLl91cGxvYWRXaGVuQmF0Y2g7XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogT3ZlcnJpZGUgcmVtb3ZlIGZ1bmN0aW9uIGZvciBiYXRjaCB0cmFuc2ZlclxuICAgICAgICAgICAgICogQHR5cGUge09sZC5fcmVtb3ZlV2hlbkJhdGNofVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLnJlbW92ZSA9IHRoaXMuX3JlbW92ZVdoZW5CYXRjaDtcbiAgICAgICAgfVxuXG4gICAgICAgICRoaWRkZW5GcmFtZS5vbignbG9hZCcsICQucHJveHkodGhpcy5fb25Mb2FkSGlkZGVuRnJhbWUsIHRoaXMsICRoaWRkZW5GcmFtZSkpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0ZXIgdHlwZVxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgVFlQRTogVFlQRSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXJcbiAgICAgKiBcImxvYWRcIiBvZiBoaWRkZW4gZnJhbWUuXG4gICAgICogQHBhcmFtIHtqUXVlcnl9ICRoaWRkZW5GcmFtZSAtIEhpZGRlbiBpZnJhbWVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vbkxvYWRIaWRkZW5GcmFtZTogZnVuY3Rpb24oJGhpZGRlbkZyYW1lKSB7XG4gICAgICAgIHZhciBmcmFtZUJvZHksXG4gICAgICAgICAgICBkYXRhO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBmcmFtZUJvZHkgPSAkaGlkZGVuRnJhbWVbMF0uY29udGVudFdpbmRvdy5kb2N1bWVudC5ib2R5O1xuICAgICAgICAgICAgZGF0YSA9IHR1aS51dGlsLnBpY2soZnJhbWVCb2R5LCAnZmlyc3RDaGlsZCcsICdkYXRhJyk7XG4gICAgICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgndXBsb2FkZWQnLCAkLnBhcnNlSlNPTihkYXRhKSk7XG4gICAgICAgICAgICAgICAgZnJhbWVCb2R5LmlubmVySFRNTCA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ2Vycm9yJywge1xuICAgICAgICAgICAgICAgIHN0YXR1czogZS5uYW1lLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGUubWVzc2FnZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RvcmUgZmlsZSBpbnB1dCBlbGVtZW50IGZyb20gdXBsb2FkIGZvcm1cbiAgICAgKi9cbiAgICBzdG9yZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbCA9IHRoaXMuZm9ybVZpZXcuJGZpbGVJbnB1dFswXSxcbiAgICAgICAgICAgIGlkID0gdHVpLnV0aWwuc3RhbXAoZWwpO1xuXG4gICAgICAgIHRoaXMucG9vbC5zdG9yZShlbCk7XG4gICAgICAgIHRoaXMuZm9ybVZpZXcucmVzZXRGaWxlSW5wdXQoKTtcblxuICAgICAgICB0aGlzLmZpcmUoJ3N0b3JlZCcsIFt7XG4gICAgICAgICAgICBpZDogaWQsXG4gICAgICAgICAgICBuYW1lOiBlbC52YWx1ZSxcbiAgICAgICAgICAgIHNpemU6ICcnXG4gICAgICAgIH1dKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBsb2FkLlxuICAgICAqIEl0IGlzIG5vdCB1c2VkIGZvciBiYXRjaCB0cmFuc2Zlci5cbiAgICAgKi9cbiAgICB1cGxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnBvb2wucGxhbnQoKTtcbiAgICAgICAgdGhpcy5mb3JtVmlldy4kZWwuc3VibWl0KCk7XG4gICAgICAgIHRoaXMuZm9ybVZpZXcuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGxvYWQuXG4gICAgICogSXQgaXMgdXNlZCBmb3IgYmF0Y2ggdHJhbnNmZXIuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfdXBsb2FkV2hlbkJhdGNoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5wb29sLnBsYW50KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBmaWxlIChhamF4LWpzb25wKVxuICAgICAqIEl0IGlzIG5vdCB1c2VkIGZvciBiYXRjaCB0cmFuc2Zlci5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIC0gUGFyYW1ldGVycyB0byByZW1vdmUgZmlsZVxuICAgICAqL1xuICAgIHJlbW92ZTogZnVuY3Rpb24ocGFyYW1zKSB7XG4gICAgICAgIHZhciB1cGxvYWRlciA9IHRoaXMudXBsb2FkZXI7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHVwbG9hZGVyLnVybC5yZW1vdmUsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb25wJyxcbiAgICAgICAgICAgIGRhdGE6IHBhcmFtcyxcbiAgICAgICAgICAgIHN1Y2Nlc3M6ICQucHJveHkoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIGRhdGEudHlwZSA9ICdyZW1vdmUnO1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgncmVtb3ZlZCcsIGRhdGEpO1xuICAgICAgICAgICAgfSwgdGhpcylcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBmaWxlIChhamF4LWpzb25wKVxuICAgICAqIEl0IGlzIHVzZWQgZm9yIGJhdGNoIHRyYW5zZmVyLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgLSBQYXJhbWV0ZXJzIHRvIHJlbW92ZSBmaWxlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlV2hlbkJhdGNoOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHRoaXMucG9vbC5yZW1vdmUocGFyYW1zKTtcblxuICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZWQnLCB0dWkudXRpbC5leHRlbmQoe1xuICAgICAgICAgICAgbWVzc2FnZTogcmVzdWx0ID8gJ3N1Y2Nlc3MnIDogJ2ZhaWwnXG4gICAgICAgIH0sIHBhcmFtcykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDbGVhciB0aGUgcG9vbFxuICAgICAqL1xuICAgIGNsZWFyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5wb29sLmVtcHR5KCk7XG4gICAgfVxufSk7XG5cbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihPbGQpO1xubW9kdWxlLmV4cG9ydHMgPSBPbGQ7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmlsZVVwbG9hZGVyIGlzIGNvcmUgb2YgZmlsZSB1cGxvYWRlciBjb21wb25lbnQuPGJyPkZpbGVNYW5hZ2VyIG1hbmFnZSBjb25uZWN0b3IgdG8gY29ubmVjdCBzZXJ2ZXIgYW5kIHVwZGF0ZSBGaWxlTGlzdFZpZXcuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIGNvbnN0cyA9IHJlcXVpcmUoJy4vY29uc3RzJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgRm9ybSA9IHJlcXVpcmUoJy4vdmlldy9mb3JtJyk7XG52YXIgTGlzdCA9IHJlcXVpcmUoJy4vdmlldy9saXN0Jyk7XG52YXIgRHJhZ0FuZERyb3AgPSByZXF1aXJlKCcuL3ZpZXcvZHJhZycpO1xudmFyIE9sZFJlcXVlc3RlciA9IHJlcXVpcmUoJy4vcmVxdWVzdGVyL29sZCcpO1xudmFyIE1vZGVyblJlcXVlc3RlciA9IHJlcXVpcmUoJy4vcmVxdWVzdGVyL21vZGVybicpO1xuXG52YXIgUkVRVUVTVEVSX1RZUEVfTU9ERVJOID0gY29uc3RzLkNPTkYuUkVRVUVTVEVSX1RZUEVfTU9ERVJOO1xuLyoqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFRvIHNldCB1cCB1cGxvYWRlciBtb2R1bGVzLlxuICogIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLnVybCBGaWxlIHNlcnZlciB1cmxzLlxuICogICAgICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy51cmwuc2VuZCBTZW5kIHVybC5cbiAqICAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMudXJsLnJlbW92ZSBEZWxldGUgdXJsLlxuICogIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5mb3JtVGFyZ2V0PSd0dWlVcGxvYWRlckhpZGRlbkZyYW1lJ10gVGhlIHRhcmdldCBuYW1lKGlmcmFtZSkgZm9yIENPUlMuXG4gKiAgQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMubGlzdEluZm8gVG8gZGlzcGxheSBmaWxlcyBpbmZvcm1hdGlvbi5cbiAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZmlsZUZpZWxkPSd1c2VyRmlsZVtdJ10gVGhlIGZpZWxkIG5hbWUgb2YgaW5wdXQgZmlsZSBlbGVtZW50LlxuICogIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy51c2VGb2xkZXIgVXNlIGRpcmVjdG9yeSB1cGxvYWQuIElmIHR1cmUsICdpc011bHRpcGxlJyBvcHRpb24gd2lsbCBiZSBpZ25vcmVkLlxuICogIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy5pc011bHRpcGxlIFVzZSBtdWx0aXBsZSBmaWxlcyB1cGxvYWQuXG4gKiBAcGFyYW0ge2pRdWVyeX0gJGVsIFJvb3QgRWxlbWVudCBvZiBVcGxvYWRlclxuICogQGV4YW1wbGVcbiAqIC8vIEhUTUxcbiAqIC8vICA8ZGl2IGlkPVwidXBsb2FkZXJcIj48L2Rpdj5cbiAqIC8vICA8ZGl2IGlkPVwibGlzdFwiPlxuICogLy8gICAgPGRpdiBjbGFzcz1cImNvdW50XCI+Y291bnQgOiA8c3Ryb25nIGlkPVwiZmlsZV9jb3VudFwiPjwvc3Ryb25nPjwvZGl2PlxuICogLy8gICAgPGRpdiBjbGFzcz1cInNpemVcIj5zaXplIDogPHN0cm9uZyBpZD1cInNpemVfY291bnRcIj48L3N0cm9uZz48L2Rpdj5cbiAqIC8vICAgIDx1bCBpZD1cImZpbGVzXCI+PC91bD5cbiAqIC8vICA8L2Rpdj5cbiAqXG4gKiB2YXIgdXBsb2FkZXIgPSBuZXcgdHVpLmNvbXBvbmVudC5VcGxvYWRlcih7XG4gKiAgICAgdXJsOiB7XG4gKiAgICAgICAgIHNlbmQ6IFwiaHR0cDovL2ZlLm5obmVudC5jb20vZXRjL2V0Yy91cGxvYWRlci91cGxvYWRlci5waHBcIixcbiAqICAgICAgICAgcmVtb3ZlOiBcImh0dHA6Ly9mZS5uaG5lbnQuY29tL2V0Yy9ldGMvdXBsb2FkZXIvcmVtb3ZlLnBocFwiXG4gKiAgICAgfSxcbiAqICAgICBsaXN0SW5mbzoge1xuICogICAgICAgICBsaXN0OiAkKCcjZmlsZXMnKSxcbiAqICAgICAgICAgY291bnQ6ICQoJyNmaWxlX2NvdW50JyksXG4gKiAgICAgICAgIHNpemU6ICQoJyNzaXplX2NvdW50JylcbiAqICAgICB9XG4gKiB9LCAkKCcjdXBsb2FkZXInKSk7XG4gKi9cbnZhciBVcGxvYWRlciA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKkBsZW5kcyBVcGxvYWRlci5wcm90b3R5cGUgKi97Lyplc2xpbnQtZGlzYWJsZSovXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucywgJGVsKSB7Lyplc2xpbnQtZW5hYmxlKi9cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFVwbG9hZGVyIGVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJGVsID0gJGVsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZW5kL1JlbW92ZSB1cmxcbiAgICAgICAgICogQHR5cGUge3tzZW5kOiBzdHJpbmcsIHJlbW92ZTogc3RyaW5nfX1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudXJsID0gb3B0aW9ucy51cmw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlZGlyZWN0IFVSTCBmb3IgQ09SUyhyZXNwb25zZSwgSUU3KVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZWRpcmVjdFVSTCA9IG9wdGlvbnMucmVkaXJlY3RVUkw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZvcm0gdGFyZ2V0IG5hbWUgZm9yIENPUlMgKElFNywgOCwgOSlcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZm9ybVRhcmdldCA9IGNvbnN0cy5DT05GLkZPUk1fVEFSR0VUX05BTUU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRhcmdldCBmcmFtZSBmb3IgQ09SUyAoSUU3LCA4LCA5KVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kdGFyZ2V0RnJhbWUgPSB0aGlzLl9jcmVhdGVUYXJnZXRGcmFtZSgpXG4gICAgICAgICAgICAuYXBwZW5kVG8odGhpcy4kZWwpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJbnB1dCBmaWxlIC0gZmllbGQgbmFtZVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5maWxlRmllbGQgPSBvcHRpb25zLmZpbGVGaWVsZCB8fCBjb25zdHMuQ09ORi5GSUxFX0ZJTEVEX05BTUU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdoZXRoZXIgdGhlIHVwbG9hZGVyIHVzZXMgYmF0Y2gtdHJhbnNmZXJcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzQmF0Y2hUcmFuc2ZlciA9ICEhKG9wdGlvbnMuaXNCYXRjaFRyYW5zZmVyKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciB0aGUgc2VuZGluZy9yZW1vdmluZyB1cmxzIGFyZSB4LWRvbWFpbi5cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzQ3Jvc3NEb21haW4gPSB1dGlscy5pc0Nyb3NzRG9tYWluKHRoaXMudXJsLnNlbmQpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIFBvc3RNZXNzYWdlIEFQSVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaXNTdXBwb3J0UG9zdE1lc3NhZ2UgPSAhISh0dWkudXRpbC5waWNrKHRoaXMuJHRhcmdldEZyYW1lLCAnMCcsICdjb250ZW50V2luZG93JywgJ3Bvc3RNZXNzYWdlJykpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHRoZSB1c2VyIHVzZXMgbXVsdGlwbGUgdXBsb2FkXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc011bHRpcGxlID0gISEob3B0aW9ucy5pc011bHRpcGxlKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciB0aGUgdXNlciB1c2VzIGRyYWcmZHJvcCB1cGxvYWRcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnVzZURyYWcgPSAhIShvcHRpb25zLnVzZURyYWcpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHRoZSB1c2VyIHVzZXMgZm9sZGVyIHVwbG9hZFxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudXNlRm9sZGVyID0gISEob3B0aW9ucy51c2VGb2xkZXIpO1xuXG4gICAgICAgIGlmICh0aGlzLnVzZURyYWcgJiYgIXRoaXMudXNlRm9sZGVyICYmIHV0aWxzLmlzU3VwcG9ydEZpbGVTeXN0ZW0oKSkge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBEcmFnICYgRHJvcCBWaWV3XG4gICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICogQHR5cGUge0RyYWdBbmREcm9wfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLmRyYWdWaWV3ID0gbmV3IERyYWdBbmREcm9wKHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZyb20gVmlld1xuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKiBAdHlwZSB7Rm9ybX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZm9ybVZpZXcgPSBuZXcgRm9ybSh0aGlzKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTGlzdCBWaWV3XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEB0eXBlIHtMaXN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5saXN0VmlldyA9IG5ldyBMaXN0KG9wdGlvbnMubGlzdEluZm8pO1xuXG4gICAgICAgIHRoaXMuX3NldFJlcXVlc3RlcigpO1xuICAgICAgICB0aGlzLl9hZGRFdmVudCgpO1xuICAgICAgICBpZiAodGhpcy5pc0Nyb3NzRG9tYWluICYmIHRoaXMuaXNTdXBwb3J0UG9zdE1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldFBvc3RNZXNzYWdlRXZlbnQoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgQ29ubmVjdG9yXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0UmVxdWVzdGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHV0aWxzLmlzU3VwcG9ydEZvcm1EYXRhKCkpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlcXVlc3RlciA9IG5ldyBNb2Rlcm5SZXF1ZXN0ZXIodGhpcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9yZXF1ZXN0ZXIgPSBuZXcgT2xkUmVxdWVzdGVyKHRoaXMpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBwb3N0LW1lc3NhZ2UgZXZlbnQgaWYgc3VwcG9ydGVkIGFuZCBuZWVkZWRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRQb3N0TWVzc2FnZUV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kdGFyZ2V0RnJhbWUub2ZmKCdsb2FkJyk7XG4gICAgICAgICQod2luZG93KS5vbignbWVzc2FnZScsICQucHJveHkoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIHZhciBvcmlnaW5hbEV2ZW50ID0gZXZlbnQub3JpZ2luYWxFdmVudCxcbiAgICAgICAgICAgICAgICBkYXRhO1xuXG4gICAgICAgICAgICBpZiAodGhpcy51cmwuc2VuZC5pbmRleE9mKG9yaWdpbmFsRXZlbnQub3JpZ2luKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkYXRhID0gJC5wYXJzZUpTT04ob3JpZ2luYWxFdmVudC5kYXRhKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNCYXRjaFRyYW5zZmVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxpc3QoZGF0YS5maWxlbGlzdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3N1Y2Nlc3MnLCBkYXRhKTtcbiAgICAgICAgfSwgdGhpcykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIHRhcmdldCBmcmFtZSB0byBiZSB0YXJnZXQgb2YgZm9ybSBlbGVtZW50LlxuICAgICAqIEByZXR1cm5zIHtqUXVlcnl9IFRhcmdldCBmcmFtZToganF1ZXJ5LWVsZW1lbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jcmVhdGVUYXJnZXRGcmFtZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkdGFyZ2V0ID0gJCgnPGlmcmFtZSBuYW1lPVwiJyArIHRoaXMuZm9ybVRhcmdldCArICdcIj48L2lmcmFtZT4nKTtcbiAgICAgICAgJHRhcmdldC5jc3Moe1xuICAgICAgICAgICAgdmlzaWJpbGl0eTogJ2hpZGRlbicsXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJ1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gJHRhcmdldDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50cyB0byB2aWV3cyBhbmQgZmlyZSB1cGxvYWRlciBldmVudHNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMubGlzdFZpZXcub24oJ3JlbW92ZScsIHRoaXMucmVtb3ZlRmlsZSwgdGhpcyk7XG4gICAgICAgIGlmICh0aGlzLmlzQmF0Y2hUcmFuc2Zlcikge1xuICAgICAgICAgICAgdGhpcy5fYWRkRXZlbnRXaGVuQmF0Y2hUcmFuc2ZlcigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fYWRkRXZlbnRXaGVuTm9ybWFsVHJhbnNmZXIoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnQgd2hlbiB1cGxvYWRlciB1c2VzIGJhdGNoLXRyYW5zZmVyXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRXZlbnRXaGVuQmF0Y2hUcmFuc2ZlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZm9ybVZpZXcub24oe1xuICAgICAgICAgICAgY2hhbmdlOiB0aGlzLnN0b3JlLFxuICAgICAgICAgICAgc3VibWl0OiB0aGlzLnN1Ym1pdFxuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICB0aGlzLl9yZXF1ZXN0ZXIub24oe1xuICAgICAgICAgICAgcmVtb3ZlZDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGlzdChkYXRhKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZScsIGRhdGEpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdlcnJvcicsIGRhdGEpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVwbG9hZGVkOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgnc3VjY2VzcycsIGRhdGEpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0b3JlZDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGlzdChkYXRhKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3VwZGF0ZScsIGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICBpZiAodGhpcy51c2VEcmFnICYmIHRoaXMuZHJhZ1ZpZXcpIHtcbiAgICAgICAgICAgIHRoaXMuZHJhZ1ZpZXcub24oJ2Ryb3AnLCB0aGlzLnN0b3JlLCB0aGlzKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnQgd2hlbiB1cGxvYWRlciB1c2VzIG5vcm1hbC10cmFuc2ZlclxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZEV2ZW50V2hlbk5vcm1hbFRyYW5zZmVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5mb3JtVmlldy5vbignY2hhbmdlJywgdGhpcy5zZW5kRmlsZSwgdGhpcyk7XG5cbiAgICAgICAgdGhpcy5fcmVxdWVzdGVyLm9uKHtcbiAgICAgICAgICAgIHJlbW92ZWQ6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxpc3QoZGF0YSk7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdyZW1vdmUnLCBkYXRhKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgnZXJyb3InLCBkYXRhKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1cGxvYWRlZDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGlzdChkYXRhLmZpbGVsaXN0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3N1Y2Nlc3MnLCBkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgaWYgKHRoaXMudXNlRHJhZyAmJiB0aGlzLmRyYWdWaWV3KSB7XG4gICAgICAgICAgICB0aGlzLmRyYWdWaWV3Lm9uKCdkcm9wJywgZnVuY3Rpb24oZmlsZXMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0b3JlKGZpbGVzKTtcbiAgICAgICAgICAgICAgICB0aGlzLnN1Ym1pdCgpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGxpc3QgdmlldyB3aXRoIGN1c3RvbSBvciBvcmlnaW5hbCBkYXRhLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbaW5mb10gVGhlIGRhdGEgZm9yIHVwZGF0ZSBsaXN0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICB1cGRhdGVMaXN0OiBmdW5jdGlvbihpbmZvKSB7XG4gICAgICAgIHRoaXMubGlzdFZpZXcudXBkYXRlKGluZm8pO1xuICAgICAgICBpZiAodGhpcy5pc0JhdGNoVHJhbnNmZXIpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdFZpZXcudXBkYXRlVG90YWxJbmZvKGluZm8pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5saXN0Vmlldy51cGRhdGVUb3RhbEluZm8oKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmb3IgY3VzdG9tIHNlbmQgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBbZXZlbnRdIC0gRm9ybSBzdWJtaXQgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHNlbmRGaWxlOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB0aGlzLnN0b3JlKCk7XG4gICAgICAgIHRoaXMuc3VibWl0KGV2ZW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZm9yIGN1c3RvbSByZW1vdmUgZXZlbnRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBUaGUgZGF0YSBmb3IgcmVtb3ZlIGZpbGUuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICByZW1vdmVGaWxlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHRoaXMuX3JlcXVlc3Rlci5yZW1vdmUoZGF0YSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN1Ym1pdCBmb3IgZGF0YSBzdWJtaXQgdG8gc2VydmVyXG4gICAgICogQHBhcmFtIHtFdmVudH0gW2V2ZW50XSAtIEZvcm0gc3VibWl0IGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudCAmJiB0aGlzLl9yZXF1ZXN0ZXIuVFlQRSA9PT0gUkVRVUVTVEVSX1RZUEVfTU9ERVJOKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3JlcXVlc3Rlci51cGxvYWQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgdXBsb2FkZXJcbiAgICAgKi9cbiAgICBjbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3JlcXVlc3Rlci5jbGVhcigpO1xuICAgICAgICB0aGlzLmZvcm1WaWV3LmNsZWFyKCk7XG4gICAgICAgIHRoaXMubGlzdFZpZXcuY2xlYXIoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RvcmUgaW5wdXQgZWxlbWVudCB0byBwb29sLlxuICAgICAqIEBwYXJhbSB7QXJyYXkuPEZpbGU+IHwgRmlsZX0gW2ZpbGVzXSAtIEEgZmlsZSBvciBmaWxlc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc3RvcmU6IGZ1bmN0aW9uKGZpbGVzKSB7XG4gICAgICAgIHRoaXMuX3JlcXVlc3Rlci5zdG9yZShmaWxlcyk7XG4gICAgfVxufSk7XG5cbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihVcGxvYWRlcik7XG5tb2R1bGUuZXhwb3J0cyA9IFVwbG9hZGVyO1xuXG4vKipcbiAqIFJlbW92ZSBldmVudFxuICogQGV2ZW50IFVwbG9hZGVyI3JlbW92ZVxuICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSBSZW1vdmUgZGF0YSBmcm9tIHRoaXMgY29tcG9uZW50XG4gKiAgQHBhcmFtIHtzdHJpbmd9IGRhdGEubWVzc2FnZSAtICdzdWNjZXNzJyBvciAnZmFpbCdcbiAqICBAcGFyYW0ge3N0cmluZ30gZGF0YS5uYW1lIC0gZmlsZSBuYW1lXG4gKiAgQHBhcmFtIHtzdHJpbmd9IGRhdGEuaWQgLSBmaWxlIGlkXG4gKi9cblxuLyoqXG4gKiBFcnJvciBldmVudFxuICogQGV2ZW50IFVwbG9hZGVyI2Vycm9yXG4gKiBAcGFyYW0ge0Vycm9yfSBkYXRhIC0gRXJyb3IgZGF0YVxuICogIEBwYXJhbSB7c3RyaW5nfSBkYXRhLnN0YXR1cyAtIEVycm9yIHN0YXR1c1xuICogIEBwYXJhbSB7c3RyaW5nfSBkYXRhLm1lc3NhZ2UgLSBFcnJvciBtZXNzYWdlXG4gKi9cblxuLyoqXG4gKiBTdWNjZXNzIGV2ZW50XG4gKiBAZXZlbnQgVXBsb2FkZXIjc3VjY2Vzc1xuICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSBTZXJ2ZXIgcmVzcG9uc2UgZGF0YVxuICogIEBwYXJhbSB7QXJyYXl9IGRhdGEuZmlsZWxpc3QgLSBVcGxvYWRlZCBmaWxlIGxpc3RcbiAqICBAcGFyYW0ge251bWJlcn0gW2RhdGEuc3VjY2Vzc10gLSBVcGxvYWRlZCBmaWxlIGNvdW50XG4gKiAgQHBhcmFtIHtudW1iZXJ9IFtkYXRhLmZhaWxlZF0gLSBGYWlsZWQgZmlsZSBjb3VudFxuICogIEBwYXJhbSB7bnVtYmVyfSBbZGF0YS5jb3VudF0gLSBUb3RhbCBjb3VudFxuICovXG5cbi8qKlxuICogVXBkYXRlIGV2ZW50XG4gKiBAZXZlbnQgVXBsb2FkZXIjdXBkYXRlXG4gKiBAcGFyYW0ge0FycmF5LjxvYmplY3Q+fSBkYXRhIC0gRmlsZSBsaXN0IGRhdGFcbiAqIEFycmF5IGhhdmluZyBvYmplY3RzPGJyPntpZDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIHNpemU6IG51bWJlcn1cbiAqL1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgZmlsZSBjb250YWluIHV0aWxpdHkgbWV0aG9kcyBmb3IgdXBsb2FkZXIuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG4vKipcbiAqIEBuYW1lc3BhY2UgdXRpbHNcbiAqIEBpZ25vcmVcbiAqL1xudmFyIElTX1NVUFBPUlRfRklMRV9TWVNURU0gPSAhISh3aW5kb3cuRmlsZSAmJiB3aW5kb3cuRmlsZVJlYWRlciAmJiB3aW5kb3cuRmlsZUxpc3QgJiYgd2luZG93LkJsb2IpLFxuICAgIElTX1NVUFBPUlRfRk9STV9EQVRBID0gISEod2luZG93LkZvcm1EYXRhIHx8IG51bGwpO1xuXG4vKipcbiAqIFBhcnNlIHVybFxuICogQHBhcmFtIHtzdHJpbmd9IHVybCAtIHVybCBmb3IgcGFyc2luZ1xuICogQHJldHVybnMge09iamVjdH0gVVJMIGluZm9ybWF0aW9uXG4gKiBAaWdub3JlXG4gKi9cbmZ1bmN0aW9uIHBhcnNlVVJMKHVybCkge1xuICAgIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgIGEuaHJlZiA9IHVybDtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGhyZWY6IGEuaHJlZixcbiAgICAgICAgaG9zdDogYS5ob3N0LFxuICAgICAgICBwb3J0OiBhLnBvcnQsXG4gICAgICAgIGhhc2g6IGEuaGFzaCxcbiAgICAgICAgaG9zdG5hbWU6IGEuaG9zdG5hbWUsXG4gICAgICAgIHBhdGhuYW1lOiBhLnBhdGhuYW1lLFxuICAgICAgICBwcm90b2NvbDogYS5wcm90b2NvbCxcbiAgICAgICAgc2VhcmNoOiBhLnNlYXJjaCxcbiAgICAgICAgcXVlcnk6IGEuc2VhcmNoLnNsaWNlKDEpXG4gICAgfTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHVuaXQgZm9yIGZpbGUgc2l6ZVxuICogQHBhcmFtIHtudW1iZXJ9IGJ5dGVzIEEgdXNhZ2Ugb2YgZmlsZVxuICogQHJldHVybnMge3N0cmluZ30gU2l6ZS1zdHJpbmdcbiAqIEBtZW1iZXJvZiB1dGlsc1xuICovXG5mdW5jdGlvbiBnZXRGaWxlU2l6ZVdpdGhVbml0KGJ5dGVzKSB7XG4gICAgdmFyIHVuaXRzID0gWydCJywgJ0tCJywgJ01CJywgJ0dCJywgJ1RCJ10sXG4gICAgICAgIGJ5dGVzID0gcGFyc2VJbnQoYnl0ZXMsIDEwKSxcbiAgICAgICAgZXhwID0gTWF0aC5sb2coYnl0ZXMpIC8gTWF0aC5sb2coMTAyNCkgfCAwLFxuICAgICAgICByZXN1bHQgPSAoYnl0ZXMgLyBNYXRoLnBvdygxMDI0LCBleHApKS50b0ZpeGVkKDIpO1xuXG4gICAgcmV0dXJuIHJlc3VsdCArIHVuaXRzW2V4cF07XG59XG5cbi8qKlxuICogV2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0cyBGb3JtRGF0YSBvciBub3RcbiAqIEBtZW1iZXJvZiB1dGlsc1xuICogQHJldHVybnMge2Jvb2xlYW59IHdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgRm9ybURhdGFcbiAqL1xuZnVuY3Rpb24gaXNTdXBwb3J0Rm9ybURhdGEoKSB7XG4gICAgcmV0dXJuIElTX1NVUFBPUlRfRk9STV9EQVRBO1xufVxuXG4vKipcbiAqIEdldCBpdGVtIGVsZW1lbnRzIEhUTUxcbiAqIEBwYXJhbSB7T2JqZWN0fSBtYXAgLSBQcm9wZXJ0aWVzIGZvciB0ZW1wbGF0ZVxuICogQHBhcmFtIHtzdHJpbmd9IGh0bWwgSFRNTCB0ZW1wbGF0ZVxuICogQHJldHVybnMge3N0cmluZ30gSFRNTFxuICogQG1lbWJlcm9mIHV0aWxzXG4gKi9cbmZ1bmN0aW9uIHRlbXBsYXRlKG1hcCwgaHRtbCkge1xuICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoL1xce1xceyhbXlxcfV0rKVxcfVxcfS9nLCBmdW5jdGlvbiAobXN0ciwgbmFtZSkge1xuICAgICAgICByZXR1cm4gbWFwW25hbWVdO1xuICAgIH0pO1xuICAgIHJldHVybiBodG1sO1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgZmlsZSBhcGkuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gd2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0cyBGaWxlQVBJXG4gKiBAbWVtYmVyb2YgdXRpbHNcbiAqL1xuZnVuY3Rpb24gaXNTdXBwb3J0RmlsZVN5c3RlbSgpIHtcbiAgICByZXR1cm4gSVNfU1VQUE9SVF9GSUxFX1NZU1RFTTtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSB1cmwgaXMgeC1kb21haW5cbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgLSBVUkxcbiAqIEByZXR1cm5zIHtib29sZWFufSBXaGV0aGVyIHRoZSB1cmwgaXMgeC1kb21haW5cbiAqIEBtZW1iZXJvZiB1dGlsc1xuICovXG5mdW5jdGlvbiBpc0Nyb3NzRG9tYWluKHVybCkge1xuICAgIHZhciBoZXJlID0gcGFyc2VVUkwod2luZG93LmxvY2F0aW9uLmhyZWYpLFxuICAgICAgICB0YXJnZXQgPSBwYXJzZVVSTCh1cmwpO1xuXG4gICAgcmV0dXJuIHRhcmdldC5ob3N0bmFtZSAhPT0gaGVyZS5ob3N0bmFtZVxuICAgICAgICB8fCB0YXJnZXQucG9ydCAhPT0gaGVyZS5wb3J0XG4gICAgICAgIHx8IHRhcmdldC5wcm90b2NvbCAhPT0gaGVyZS5wcm90b2NvbDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0RmlsZVNpemVXaXRoVW5pdDogZ2V0RmlsZVNpemVXaXRoVW5pdCxcbiAgICBpc1N1cHBvcnRGaWxlU3lzdGVtOiBpc1N1cHBvcnRGaWxlU3lzdGVtLFxuICAgIGlzU3VwcG9ydEZvcm1EYXRhOiBpc1N1cHBvcnRGb3JtRGF0YSxcbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXG4gICAgaXNDcm9zc0RvbWFpbjogaXNDcm9zc0RvbWFpblxufTtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIGZpbGUgaXMgYWJvdXQgZHJhZyBhbmQgZHJvcCBmaWxlIHRvIHNlbmQuIERyYWcgYW5kIGRyb3AgaXMgcnVubmluZyB2aWEgZmlsZSBhcGkuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIGNvbnN0cyA9IHJlcXVpcmUoJy4uL2NvbnN0cycpO1xuXG4vKipcbiAqIE1ha2VzIGRyYWcgYW5kIGRyb3AgYXJlYSwgdGhlIGRyb3BwZWQgZmlsZSBpcyBhZGRlZCB2aWEgZXZlbnQgZHJvcCBldmVudC5cbiAqIEBjbGFzcyBEcmFnQW5kRHJvcFxuICogQHBhcmFtIHtVcGxvYWRlcn0gdXBsb2FkZXIgLSBVcGxvYWRlclxuICovXG52YXIgRHJhZ0FuZERyb3AgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIERyYWdBbmREcm9wLnByb3RvdHlwZSAqL3svKmVzbGludC1kaXNhYmxlKi9cbiAgICBpbml0OiBmdW5jdGlvbih1cGxvYWRlcikgey8qZXNsaW50LWVuYWJsZSovXG4gICAgICAgIHZhciBodG1sID0gY29uc3RzLkhUTUwuZHJhZ0FuZERyb3A7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERyb3Agem9uZSBqUXVlcnktZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kZWwgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDbGFzcyBmb3IgZHJvcCBlbmFibGVkXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9lbmFibGVDbGFzcyA9IGNvbnN0cy5DT05GLkRST1BfRU5BQkxFRF9DTEFTUztcblxuICAgICAgICB0aGlzLl9yZW5kZXIoaHRtbCwgdXBsb2FkZXIpO1xuICAgICAgICB0aGlzLl9hZGRFdmVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXJzIGRyYWcgYW5kIGRyb3AgYXJlYVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBodG1sIFRoZSBodG1sIHN0cmluZyB0byBtYWtlIGRhcmcgem9uZVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB1cGxvYWRlciBUaGUgY29yZSBpbnN0YW5jZSBvZiB0aGlzIGNvbXBvbmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbmRlcjogZnVuY3Rpb24oaHRtbCwgdXBsb2FkZXIpIHtcbiAgICAgICAgdGhpcy4kZWwgPSAkKGh0bWwpXG4gICAgICAgICAgICAuYXBwZW5kVG8odXBsb2FkZXIuJGVsKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkcyBkcmFnIGFuZCBkcm9wIGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbC5vbih7XG4gICAgICAgICAgICBkcmFnZW50ZXI6ICQucHJveHkodGhpcy5vbkRyYWdFbnRlciwgdGhpcyksXG4gICAgICAgICAgICBkcmFnb3ZlcjogJC5wcm94eSh0aGlzLm9uRHJhZ092ZXIsIHRoaXMpLFxuICAgICAgICAgICAgZHJvcDogJC5wcm94eSh0aGlzLm9uRHJvcCwgdGhpcyksXG4gICAgICAgICAgICBkcmFnbGVhdmU6ICQucHJveHkodGhpcy5vbkRyYWdMZWF2ZSwgdGhpcylcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEhhbmRsZXMgZHJhZ2VudGVyIGV2ZW50XG4gICAgICogQHBhcmFtIHtFdmVudH0gZSAtIEV2ZW50XG4gICAgICovXG4gICAgb25EcmFnRW50ZXI6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLl9lbmFibGUoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlcyBkcmFnb3ZlciBldmVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGUgLSBFdmVudFxuICAgICAqL1xuICAgIG9uRHJhZ092ZXI6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGVzIGRyYWdsZWF2ZSBldmVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGUgLSBFdmVudFxuICAgICAqL1xuICAgIG9uRHJhZ0xlYXZlOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgdGhpcy5fZGlzYWJsZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGVzIGRyb3AgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBlIC0gRXZlbnRcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gRmFsc2VcbiAgICAgKi9cbiAgICBvbkRyb3A6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIGZpbGVzID0gdHVpLnV0aWwucGljayhlLCAnb3JpZ2luYWxFdmVudCcsICdkYXRhVHJhbnNmZXInLCAnZmlsZXMnKTtcblxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuX2Rpc2FibGUoKTtcbiAgICAgICAgdGhpcy5maXJlKCdkcm9wJywgZmlsZXMpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEVuYWJsZSBkcm9wem9uZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2VuYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsLmFkZENsYXNzKHRoaXMuX2VuYWJsZUNsYXNzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGlzYWJsZSBkcm9wb256ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2Rpc2FibGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbC5yZW1vdmVDbGFzcyh0aGlzLl9lbmFibGVDbGFzcyk7XG4gICAgfVxufSk7XG5cbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihEcmFnQW5kRHJvcCk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJhZ0FuZERyb3A7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgRnJvbS12aWV3IG1ha2VzIGEgZm9ybSBieSB0ZW1wbGF0ZS4gQWRkIGV2ZW50cyBmb3IgZmlsZSB1cGxvYWQuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIGNvbnN0cyA9IHJlcXVpcmUoJy4uL2NvbnN0cycpLFxuICAgIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxudmFyIGlzU3VwcG9ydEZvcm1EYXRhID0gdXRpbHMuaXNTdXBwb3J0Rm9ybURhdGEoKSxcbiAgICBISURERU5fRklMRV9JTlBVVF9DTEFTUyA9IGNvbnN0cy5DT05GLkhJRERFTl9GSUxFX0lOUFVUX0NMQVNTO1xuXG4vKipcbiAqIFRoaXMgdmlldyBjb250cm9sIGlucHV0IGVsZW1lbnQgdHlwZWQgZmlsZS5cbiAqIEBwYXJhbSB7VXBsb2FkZXJ9IHVwbG9hZGVyIC0gVXBsb2FkZXIgaW5zdGFuY2VcbiAqIEBjb25zdHJ1Y3RvciBWaWV3LkZvcm1cbiAqL1xudmFyIEZvcm0gPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKipAbGVuZHMgVmlldy5Gb3JtLnByb3RvdHlwZSAqKi97Lyplc2xpbnQtZGlzYWJsZSovXG4gICAgaW5pdDogZnVuY3Rpb24odXBsb2FkZXIpIHsvKmVzbGludC1lbmFibGUqL1xuICAgICAgICAvKipcbiAgICAgICAgICogRmlsZSB1cGxvYWRlclxuICAgICAgICAgKiBAdHlwZSB7VXBsb2FkZXJ9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl91cGxvYWRlciA9IHVwbG9hZGVyO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBIdG1sIHRlbXBsYXRlc1xuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsIHN0cmluZz59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9odG1sID0gdGhpcy5fc2V0VGVtcGxhdGUodXBsb2FkZXIudGVtcGxhdGUpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGb3JtIGVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJGVsID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRmlsZSBpbnB1dCBlbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiRmaWxlSW5wdXQgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTdWJtaXQgZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kc3VibWl0ID0gbnVsbDtcblxuICAgICAgICBpZiAoaXNTdXBwb3J0Rm9ybURhdGEpIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogV2hldGhlciB0aGUgZmlsZSBpbnB1dCBpcyBtdWx0aXBsZVxuICAgICAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLl9pc011bHRpcGxlID0gdXBsb2FkZXIuaXNNdWx0aXBsZTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBXaGV0aGVyIHRoZSBmaWxlIGlucHV0IGFjY2VwdHMgZm9sZGVyXG4gICAgICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuX3VzZUZvbGRlciA9IHVwbG9hZGVyLnVzZUZvbGRlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3JlbmRlcih7XG4gICAgICAgICAgICBhY3Rpb246IHVwbG9hZGVyLnVybC5zZW5kLFxuICAgICAgICAgICAgbWV0aG9kOiAncG9zdCcsXG4gICAgICAgICAgICBlbmN0eXBlOiAnbXVsdGlwYXJ0L2Zvcm0tZGF0YScsXG4gICAgICAgICAgICB0YXJnZXQ6IGlzU3VwcG9ydEZvcm1EYXRhID8gJycgOiB1cGxvYWRlci5mb3JtVGFyZ2V0XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgZm9ybSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtvYmplY3R9IGF0dHJpYnV0ZXMgLSBGb3JtIGF0dHJpYnV0ZXNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW5kZXI6IGZ1bmN0aW9uKGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgdmFyIHVwbG9hZGVyID0gdGhpcy5fdXBsb2FkZXIsXG4gICAgICAgICAgICAkZmlsZUlucHV0ID0gdGhpcy5fY3JlYXRlRmlsZUlucHV0KCksXG4gICAgICAgICAgICAkZWwgPSAkKHRoaXMuX2h0bWwuZm9ybSlcbiAgICAgICAgICAgICAgICAuYXBwZW5kKCRmaWxlSW5wdXQpXG4gICAgICAgICAgICAgICAgLmF0dHIoYXR0cmlidXRlcyk7XG5cbiAgICAgICAgdGhpcy4kZmlsZUlucHV0ID0gJGZpbGVJbnB1dDtcbiAgICAgICAgdGhpcy4kZWwgPSAkZWw7XG5cbiAgICAgICAgaWYgKHVwbG9hZGVyLmlzQmF0Y2hUcmFuc2Zlcikge1xuICAgICAgICAgICAgdGhpcy5fc2V0U3VibWl0RWxlbWVudCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHVwbG9hZGVyLmlzQ3Jvc3NEb21haW4gJiYgIWlzU3VwcG9ydEZvcm1EYXRhKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRIaWRkZW5JbnB1dEZvckNPUlMoKTtcbiAgICAgICAgfVxuICAgICAgICB1cGxvYWRlci4kZWwuYXBwZW5kKHRoaXMuJGVsKTtcblxuICAgICAgICB0aGlzLl9hZGRFdmVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgc3VibWl0IGVsZW1lbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRTdWJtaXRFbGVtZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kc3VibWl0ID0gJCh0aGlzLl9odG1sLnN1Ym1pdCk7XG4gICAgICAgIHRoaXMuJHN1Ym1pdC5hcHBlbmRUbyh0aGlzLiRlbCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBoaWRkZW4gaW5wdXQgZWxlbWVudCBmb3IgQ09SUy5cbiAgICAgKiAgSGlkZGVuIGlucHV0IG9mIFBvc3RNZXNzYWdlIG9yIFJlZGlyZWN0VVJMLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldEhpZGRlbklucHV0Rm9yQ09SUzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBwcm9wcywgJGhpZGRlbklucHV0LFxuICAgICAgICAgICAgdXBsb2FkZXIgPSB0aGlzLl91cGxvYWRlcixcbiAgICAgICAgICAgIHJlZGlyZWN0VVJMID0gdXBsb2FkZXIucmVkaXJlY3RVUkw7XG5cbiAgICAgICAgaWYgKHVwbG9hZGVyLmlzU3VwcG9ydFBvc3RNZXNzYWdlKSB7IC8vIGZvciBJRTgsIDlcbiAgICAgICAgICAgIHByb3BzID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdtZXNzYWdlVGFyZ2V0JyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogbG9jYXRpb24ucHJvdG9jb2wgKyAnLy8nICsgbG9jYXRpb24uaG9zdFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmIChyZWRpcmVjdFVSTCkgeyAvLyBmb3IgSUU3XG4gICAgICAgICAgICBwcm9wcyA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAncmVkaXJlY3RVUkwnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiByZWRpcmVjdFVSTFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9wcykge1xuICAgICAgICAgICAgJGhpZGRlbklucHV0ID0gJCh1dGlscy50ZW1wbGF0ZShwcm9wcywgdGhpcy5faHRtbC5oaWRkZW5JbnB1dCkpO1xuICAgICAgICAgICAgJGhpZGRlbklucHV0LmFwcGVuZFRvKHRoaXMuJGVsKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgYWxsIG9mIGlucHV0IGVsZW1lbnRzIGh0bWwgc3RyaW5ncy5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbdGVtcGxhdGVdIFRoZSB0ZW1wbGF0ZSBpcyBzZXQgZm9ybSBjdXN0b21lci5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3QuPHN0cmluZywgc3RyaW5nPn0gVGhlIGh0bWwgdGVtcGxhdGUgc3RyaW5nIHNldCBmb3IgZm9ybS5cbiAgICAgKi9cbiAgICBfc2V0VGVtcGxhdGU6IGZ1bmN0aW9uKHRlbXBsYXRlKSB7XG4gICAgICAgIHJldHVybiB0dWkudXRpbC5leHRlbmQoe30sIGNvbnN0cy5IVE1MLCB0ZW1wbGF0ZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2VzIGFuZCByZXR1cm5zIGpxdWVyeSBlbGVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcmV0dXJuIHtqUXVlcnl9IFRoZSBqcXVlcnkgb2JqZWN0IHdyYXBwaW5nIG9yaWdpbmFsIGlucHV0IGVsZW1lbnRcbiAgICAgKi9cbiAgICBfY3JlYXRlRmlsZUlucHV0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1hcCA9IHtcbiAgICAgICAgICAgIG11bHRpcGxlOiB0aGlzLl9pc011bHRpcGxlID8gJ211bHRpcGxlJyA6ICcnLFxuICAgICAgICAgICAgZmlsZUZpZWxkOiB0aGlzLl91cGxvYWRlci5maWxlRmllbGQsXG4gICAgICAgICAgICBkaXJlY3Rvcnk6IHRoaXMuX3VzZUZvbGRlciA/ICdkaXJlY3RvcnkgbW96ZGlyZWN0b3J5IHdlYmtpdGRpcmVjdG9yeScgOiAnJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiAkKHV0aWxzLnRlbXBsYXRlKG1hcCwgdGhpcy5faHRtbC5maWxlSW5wdXQpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5fdXBsb2FkZXIuaXNCYXRjaFRyYW5zZmVyKSB7XG4gICAgICAgICAgICB0aGlzLiRlbC5vbignc3VibWl0JywgJC5wcm94eSh0aGlzLmZpcmUsIHRoaXMsICdzdWJtaXQnKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fYWRkSW5wdXRFdmVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgY2hhbmdlIGV2ZW50IHRvIGZpbGUgaW5wdXRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRJbnB1dEV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZmlsZUlucHV0Lm9uKCdjaGFuZ2UnLCAkLnByb3h5KHRoaXMub25DaGFuZ2UsIHRoaXMpKTtcbiAgICAgICAgdGhpcy4kZmlsZUlucHV0LmF0dHIoJ3RpdGxlJywgJyAnKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQtSGFuZGxlIGZvciBpbnB1dCBlbGVtZW50IGNoYW5nZVxuICAgICAqL1xuICAgIG9uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLiRmaWxlSW5wdXRbMF0udmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZpcmUoJ2NoYW5nZScpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXNldCBJbnB1dCBlbGVtZW50IHRvIHNhdmUgd2hvbGUgaW5wdXQ9ZmlsZSBlbGVtZW50LlxuICAgICAqL1xuICAgIHJlc2V0RmlsZUlucHV0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZmlsZUlucHV0LnJlbW92ZSgpO1xuICAgICAgICB0aGlzLiRmaWxlSW5wdXQgPSB0aGlzLl9jcmVhdGVGaWxlSW5wdXQoKTtcbiAgICAgICAgaWYgKHRoaXMuJHN1Ym1pdCkge1xuICAgICAgICAgICAgdGhpcy4kc3VibWl0LmJlZm9yZSh0aGlzLiRmaWxlSW5wdXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kZWwuYXBwZW5kKHRoaXMuJGZpbGVJbnB1dCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fYWRkSW5wdXRFdmVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDbGVhciBmaWxlIGlucHV0IGVsZW1lbnRzXG4gICAgICovXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbC5maW5kKCcuJyArIEhJRERFTl9GSUxFX0lOUFVUX0NMQVNTKS5yZW1vdmUoKTtcbiAgICAgICAgdGhpcy5yZXNldEZpbGVJbnB1dCgpO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oRm9ybSk7XG5tb2R1bGUuZXhwb3J0cyA9IEZvcm07XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgSXRlbVZpZXcgbWFrZSBlbGVtZW50IHRvIGRpc3BsYXkgYWRkZWQgZmlsZSBpbmZvcm1hdGlvbi4gSXQgaGFzIGF0dGFjaGVkIGZpbGUgSUQgdG8gcmVxdWVzdCBmb3IgcmVtb3ZlLlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcbnZhciBjb25zdHMgPSByZXF1aXJlKCcuLi9jb25zdHMnKSxcbiAgICB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cbnZhciBSRU1PVkVfQlVUVE9OX0NMQVNTID0gY29uc3RzLkNPTkYuUkVNT1ZFX0JVVFRPTl9DTEFTUztcblxuLyoqXG4gKiBDbGFzcyBvZiBpdGVtIHRoYXQgaXMgbWVtYmVyIG9mIGZpbGUgbGlzdC5cbiAqIEBjbGFzcyBJdGVtXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xuICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLm5hbWUgRmlsZSBuYW1lXG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMudHlwZSBGaWxlIHR5cGVcbiAqICBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy5yb290IExpc3QgaW5zdGFuY2VcbiAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuaWRdIFVuaXF1ZSBrZXksIHdoYXQgaWYgdGhlIGtleSBpcyBub3QgZXhpc3QgaWQgd2lsbCBiZSB0aGUgZmlsZSBuYW1lLlxuICogIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5kZWxldGVCdXR0b25DbGFzc05hbWU9J3VwbG9hZGVyX2J0bl9kZWxldGUnXSBUaGUgY2xhc3MgbmFtZSBpcyBmb3IgZGVsZXRlIGJ1dHRvbi5cbiAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMudGVtcGxhdGVdIGl0ZW0gdGVtcGxhdGVcbiAqICBAcGFyYW0geyhzdHJpbmd8bnVtYmVyKX0gW29wdGlvbnMuc2l6ZV0gRmlsZSBzaXplIChidXQgaWUgbG93IGJyb3dzZXIsIHgtZG9tYWluKVxuICovXG52YXIgSXRlbSA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgSXRlbS5wcm90b3R5cGUgKiovey8qZXNsaW50LWRpc2FibGUqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHsvKmVzbGludC1lbmFibGUqL1xuICAgICAgICAvKipcbiAgICAgICAgICogSXRlbTogTEkgZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kZWwgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJdGVtOiByZW1vdmUgYnV0dG9uXG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiRyZW1vdmVCdG4gPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJdGVtIG5hbWVcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubmFtZSA9IG9wdGlvbnMubmFtZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSXRlbSBpZFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pZCA9IG9wdGlvbnMuaWQgfHwgb3B0aW9ucy5uYW1lO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJdGVtIHNpemVcbiAgICAgICAgICogQHR5cGUge251bWJlcnxzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnNpemUgPSBvcHRpb25zLnNpemUgfHwgJyc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEl0ZW0gdHlwZVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy50eXBlID0gdGhpcy5fZXh0cmFjdEV4dGVuc2lvbigpO1xuXG4gICAgICAgIHRoaXMucmVuZGVyKG9wdGlvbnMucm9vdC4kZWwpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgbWFraW5nIGZvcm0gcGFkZGluZyB3aXRoIGRlbGV0YWJsZSBpdGVtXG4gICAgICogQHBhcmFtIHtqUXVlcnl9ICR0YXJnZXQgLSBUYXJnZXQgTGlzdCBlbGVtZW50XG4gICAgICovXG4gICAgcmVuZGVyOiBmdW5jdGlvbigkdGFyZ2V0KSB7XG4gICAgICAgIHZhciBodG1sID0gdGhpcy5fZ2V0SHRtbCgpLFxuICAgICAgICAgICAgcmVtb3ZlQnV0dG9uSFRNTCA9IHV0aWxzLnRlbXBsYXRlKHtcbiAgICAgICAgICAgICAgICB0ZXh0OiAnUmVtb3ZlJ1xuICAgICAgICAgICAgfSwgY29uc3RzLkhUTUwuYnV0dG9uKSxcbiAgICAgICAgICAgICRyZW1vdmVCdG4gPSAkKHJlbW92ZUJ1dHRvbkhUTUwpO1xuXG4gICAgICAgIHRoaXMuJHJlbW92ZUJ0biA9ICRyZW1vdmVCdG5cbiAgICAgICAgICAgIC5hZGRDbGFzcyhSRU1PVkVfQlVUVE9OX0NMQVNTKTtcblxuICAgICAgICB0aGlzLiRlbCA9ICQoaHRtbClcbiAgICAgICAgICAgIC5hcHBlbmQoJHJlbW92ZUJ0bilcbiAgICAgICAgICAgIC5hcHBlbmRUbygkdGFyZ2V0KTtcblxuICAgICAgICB0aGlzLl9hZGRFdmVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFeHRyYWN0IGZpbGUgZXh0ZW5zaW9uIGJ5IG5hbWVcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBGaWxlIGV4dGVuc2lvblxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2V4dHJhY3RFeHRlbnNpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5uYW1lLnNwbGl0KCcuJykucG9wKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBsaXN0SXRlbSBlbGVtZW50IEhUTUxcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBIVE1MXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0SHRtbDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtYXAgPSB7XG4gICAgICAgICAgICBmaWxldHlwZTogdGhpcy50eXBlLFxuICAgICAgICAgICAgZmlsZW5hbWU6IHRoaXMubmFtZSxcbiAgICAgICAgICAgIGZpbGVzaXplOiB0aGlzLnNpemUgPyB1dGlscy5nZXRGaWxlU2l6ZVdpdGhVbml0KHRoaXMuc2l6ZSkgOiAnJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB1dGlscy50ZW1wbGF0ZShtYXAsIGNvbnN0cy5IVE1MLmxpc3RJdGVtKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IGhhbmRsZXIgb24gZGVsZXRlIGJ1dHRvbi5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJHJlbW92ZUJ0bi5vbignY2xpY2snLCAkLnByb3h5KHRoaXMuX29uQ2xpY2tFdmVudCwgdGhpcykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudC1oYW5kbGUgZm9yIGRlbGV0ZSBidXR0b24gY2xpY2tlZC5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vbkNsaWNrRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZScsIHtcbiAgICAgICAgICAgIG5hbWUgOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICBpZCA6IHRoaXMuaWQsXG4gICAgICAgICAgICB0eXBlOiAncmVtb3ZlJ1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGVzdHJveSBpdGVtXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsLnJlbW92ZSgpO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oSXRlbSk7XG5tb2R1bGUuZXhwb3J0cyA9IEl0ZW07XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmlsZUxpc3RWaWV3IGxpc3RpbmcgZmlsZXMgYW5kIGRpc3BsYXkgc3RhdGVzKGxpa2Ugc2l6ZSwgY291bnQpLlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG52YXIgSXRlbSA9IHJlcXVpcmUoJy4vaXRlbScpO1xuXG4vKipcbiAqIExpc3QgaGFzIGl0ZW1zLiBJdCBjYW4gYWRkIGFuZCByZW1vdmUgaXRlbSwgYW5kIGdldCB0b3RhbCB1c2FnZS5cbiAqIEBwYXJhbSB7VXBsb2FkZXJ9IHVwbG9hZGVyIC0gVXBsb2FkZXJcbiAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsIGpRdWVyeT59IGxpc3RJbmZvXG4gKiAgQHBhcmFtIHtqUXVlcnl9IGxpc3RJbmZvLmxpc3QgLSBMaXN0IGpxdWVyeS1lbGVtZW50XG4gKiAgQHBhcmFtIHtqUXVlcnl9IGxpc3RJbmZvLmNvdW50IC0gQ291bnQganF1ZXJ5LWVsZW1lbnRcbiAqICBAcGFyYW0ge2pRdWVyeX0gbGlzdEluZm8uc2l6ZSAtIFNpemUganF1ZXJ5LWVsZW1lbnRcbiAqIEBjbGFzcyBMaXN0XG4gKi9cbnZhciBMaXN0ID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBMaXN0LnByb3RvdHlwZSAqL3svKmVzbGludC1kaXNhYmxlKi9cbiAgICBpbml0IDogZnVuY3Rpb24obGlzdEluZm8pIHsvKmVzbGludC1lbmFibGUqL1xuICAgICAgICAvKipcbiAgICAgICAgICogSXRlbXNcbiAgICAgICAgICogQHR5cGUge0FycmF5LjxJdGVtPn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogalF1ZXJ5LWVsZW1lbnQgb2YgTGlzdFxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kZWwgPSBsaXN0SW5mby5saXN0O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBqUXVlcnktZWxlbWVudCBvZiBjb3VudFxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kY291bnRlciA9IGxpc3RJbmZvLmNvdW50O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBqUXVlcnktZWxlbWVudCBvZiB0b3RhbCBzaXplXG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiRzaXplID0gbGlzdEluZm8uc2l6ZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW0gbGlzdFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIC0gRmlsZSBpbmZvcm1hdGlvbihzKSB3aXRoIHR5cGVcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2RhdGEudHlwZV0gLSAncmVtb3ZlJyBvciBub3QuXG4gICAgICovXG4gICAgdXBkYXRlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGlmIChkYXRhLnR5cGUgPT09ICdyZW1vdmUnKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVGaWxlSXRlbShkYXRhLmlkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2FkZEZpbGVJdGVtcyhkYXRhKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgaXRlbXMgdG90YWwgY291bnQsIHRvdGFsIHNpemUgaW5mb3JtYXRpb24uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtpbmZvXSBBIGluZm9ybWF0aW9uIHRvIHVwZGF0ZSBsaXN0LlxuICAgICAqICBAcGFyYW0ge2FycmF5fSBpbmZvLml0ZW1zIFRoZSBsaXN0IG9mIGZpbGUgaW5mb3JtYXRpb24uXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBpbmZvLnNpemUgVGhlIHRvdGFsIHNpemUuXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBpbmZvLmNvdW50IFRoZSBjb3VudCBvZiBmaWxlcy5cbiAgICAgKi9cbiAgICB1cGRhdGVUb3RhbEluZm86IGZ1bmN0aW9uKGluZm8pIHtcbiAgICAgICAgaWYgKGluZm8pIHtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVRvdGFsQ291bnQoaW5mby5jb3VudCk7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVUb3RhbFVzYWdlKGluZm8uc2l6ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVUb3RhbENvdW50KCk7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVUb3RhbFVzYWdlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW1zIHRvdGFsIGNvdW50IGFuZCByZWZyZXNoIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0geyhudW1iZXJ8c3RyaW5nKX0gW2NvdW50XSBUb3RhbCBmaWxlIGNvdW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfdXBkYXRlVG90YWxDb3VudDogZnVuY3Rpb24oY291bnQpIHtcbiAgICAgICAgaWYgKCF0dWkudXRpbC5pc0V4aXN0eShjb3VudCkpIHtcbiAgICAgICAgICAgIGNvdW50ID0gdGhpcy5pdGVtcy5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiRjb3VudGVyLmh0bWwoY291bnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgaXRlbXMgdG90YWwgc2l6ZSBhbmQgcmVmcmVzaCBlbGVtZW50XG4gICAgICogQHBhcmFtIHsobnVtYmVyfHN0cmluZyl9IFtzaXplXSBUb3RhbCBmaWxlcyBzaXplc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwZGF0ZVRvdGFsVXNhZ2U6IGZ1bmN0aW9uKHNpemUpIHtcbiAgICAgICAgaWYgKCF0dWkudXRpbC5pc0V4aXN0eShzaXplKSkge1xuICAgICAgICAgICAgc2l6ZSA9IHRoaXMuX2dldFN1bUFsbEl0ZW1Vc2FnZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0dWkudXRpbC5pc051bWJlcihzaXplKSAmJiAhaXNOYU4oc2l6ZSkpIHtcbiAgICAgICAgICAgIHNpemUgPSB1dGlscy5nZXRGaWxlU2l6ZVdpdGhVbml0KHNpemUpO1xuICAgICAgICAgICAgdGhpcy4kc2l6ZS5odG1sKHNpemUpO1xuICAgICAgICAgICAgdGhpcy4kc2l6ZS5zaG93KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiRzaXplLmhpZGUoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdW0gc2l6ZXMgb2YgYWxsIGl0ZW1zLlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IHRvdGFsU2l6ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldFN1bUFsbEl0ZW1Vc2FnZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpdGVtcyA9IHRoaXMuaXRlbXMsXG4gICAgICAgICAgICB0b3RhbFVzYWdlID0gMDtcblxuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKGl0ZW1zLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICB0b3RhbFVzYWdlICs9IHBhcnNlRmxvYXQoaXRlbS5zaXplKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRvdGFsVXNhZ2U7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBmaWxlIGl0ZW1zXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHRhcmdldCBUYXJnZXQgaXRlbSBpbmZvcm1hdGlvbi5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRGaWxlSXRlbXM6IGZ1bmN0aW9uKHRhcmdldCkge1xuICAgICAgICBpZiAoIXR1aS51dGlsLmlzQXJyYXlTYWZlKHRhcmdldCkpIHsgLy8gZm9yIHRhcmdldCBmcm9tIGlmcmFtZSwgdXNlIFwiaXNBcnJheVNhZmVcIlxuICAgICAgICAgICAgdGFyZ2V0ID0gW3RhcmdldF07XG4gICAgICAgIH1cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaCh0YXJnZXQsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCh0aGlzLl9jcmVhdGVJdGVtKGRhdGEpKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBmaWxlIGl0ZW1cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBUaGUgaXRlbSBpZCB0byByZW1vdmVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW1vdmVGaWxlSXRlbTogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaCh0aGlzLml0ZW1zLCBmdW5jdGlvbihpdGVtLCBpbmRleCkge1xuICAgICAgICAgICAgaWYgKGlkID09PSBpdGVtLmlkKSB7XG4gICAgICAgICAgICAgICAgaXRlbS5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBpdGVtIEJ5IERhdGFcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSAtIERhdGEgZm9yIGxpc3QgaXRlbXNcbiAgICAgKiBAcmV0dXJucyB7SXRlbX0gSXRlbVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NyZWF0ZUl0ZW06IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIGl0ZW0gPSBuZXcgSXRlbSh7XG4gICAgICAgICAgICByb290OiB0aGlzLFxuICAgICAgICAgICAgbmFtZTogZGF0YS5uYW1lLFxuICAgICAgICAgICAgc2l6ZTogZGF0YS5zaXplLFxuICAgICAgICAgICAgaWQ6IGRhdGEuaWRcbiAgICAgICAgfSk7XG4gICAgICAgIGl0ZW0ub24oJ3JlbW92ZScsIHRoaXMuX3JlbW92ZUZpbGUsIHRoaXMpO1xuICAgICAgICByZXR1cm4gaXRlbTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgUmVtb3ZlIEZpbGVcbiAgICAgKiBAcGFyYW0ge0l0ZW19IGl0ZW0gLSBJdGVtXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlRmlsZTogZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZScsIGl0ZW0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDbGVhciBsaXN0XG4gICAgICovXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKHRoaXMuaXRlbXMsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIGl0ZW0uZGVzdHJveSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5pdGVtcy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLnVwZGF0ZVRvdGFsSW5mbygpO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oTGlzdCk7XG5cbm1vZHVsZS5leHBvcnRzID0gTGlzdDtcbiJdfQ==
