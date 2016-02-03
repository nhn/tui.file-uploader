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
    FORM_TARGET_NAME: 'hiddenFrame',
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
     * @type {string} Requester type
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
        var form = this.formView.$el.clone(),
            field = this.uploader.fileField,
            formData;

        form.find('input[type="file"]').remove();
        formData = new FormData(form);

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
var Old = tui.util.defineClass(/** @lends Old.prototype */{
    init: function(uploader) {
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
     * @type {string} Requester type
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
 *     formTarget: 'hiddenFrame',
 *     listInfo: {
 *         list: $('#files'),
 *         count: $('#file_count'),
 *         size: $('#size_count')
 *     }
 * }, $('#uploader'));
 */
var Uploader = tui.util.defineClass(/**@lends Uploader.prototype */{
    init: function(options, $el) {
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
        this.formTarget = options.formTarget || consts.CONF.FORM_TARGET_NAME;

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
        if (this.useDrag && this.dragView) {
            this.dragView.on('drop', this.store, this);
        }
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
 * @param {Uploader} uploader - Uploader
 * @class DragAndDrop
 */
var DragAndDrop = tui.util.defineClass(/** @lends DragAndDrop.prototype */{
    init: function(uploader) {
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
        this.$el.on('dragenter', $.proxy(this.onDragEnter, this));
        this.$el.on('dragover', $.proxy(this.onDragOver, this));
        this.$el.on('drop', $.proxy(this.onDrop, this));
        this.$el.on('dragleave', $.proxy(this.onDragLeave, this));
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
var Item = tui.util.defineClass(/** @lends Item.prototype **/ {
    init: function(options) {
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
var List = tui.util.defineClass(/** @lends List.prototype */{
    init : function(listInfo) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25zdHMuanMiLCJzcmMvanMvcG9vbC5qcyIsInNyYy9qcy9yZXF1ZXN0ZXIvbW9kZXJuLmpzIiwic3JjL2pzL3JlcXVlc3Rlci9vbGQuanMiLCJzcmMvanMvdXBsb2FkZXIuanMiLCJzcmMvanMvdXRpbHMuanMiLCJzcmMvanMvdmlldy9kcmFnLmpzIiwic3JjL2pzL3ZpZXcvZm9ybS5qcyIsInNyYy9qcy92aWV3L2l0ZW0uanMiLCJzcmMvanMvdmlldy9saXN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMU5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ0dWkudXRpbC5kZWZpbmVOYW1lc3BhY2UoJ3R1aS5jb21wb25lbnQuVXBsb2FkZXInLCByZXF1aXJlKCcuL3NyYy9qcy91cGxvYWRlci5qcycpKTtcblxuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbmZpZ3VyYXRpb24gb3IgZGVmYXVsdCB2YWx1ZXMuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFVwbG9hZGVyIGNvbmZpZ1xuICovXG5tb2R1bGUuZXhwb3J0cy5DT05GID0ge1xuICAgIEZJTEVfRklMRURfTkFNRTogJ3VzZXJmaWxlW10nLFxuICAgIERST1BfRU5BQkxFRF9DTEFTUzogJ2Ryb3BFbmFibGVkJyxcbiAgICBISURERU5fRklMRV9JTlBVVF9DTEFTUzogJ2hpZGRlbkZpbGVJbnB1dCcsXG4gICAgUkVRVUVTVEVSX1RZUEVfTU9ERVJOOiAnbW9kZXJuUmVxdWVzdGVyJyxcbiAgICBSRVFVRVNURVJfVFlQRV9PTEQ6ICdvbGRSZXF1ZXN0ZXInLFxuICAgIEZPUk1fVEFSR0VUX05BTUU6ICdoaWRkZW5GcmFtZScsXG4gICAgUkVNT1ZFX0JVVFRPTl9DTEFTUzogJ3JlbW92ZUJ1dHRvbidcbn07XG5cbi8qKlxuICogRGVmYXVsdCBIdG1sc1xuICogQHR5cGUge3tpbnB1dDogc3RyaW5nLCBpdGVtOiBzdHJpbmd9fVxuICovXG5tb2R1bGUuZXhwb3J0cy5IVE1MID0ge1xuICAgIGZvcm06IFtcbiAgICAgICAgJzxmb3JtIGVuY3R5cGU9XCJtdWx0aXBhcnQvZm9ybS1kYXRhXCIgaWQ9XCJ0dWktdXBsb2FkZXItZm9ybVwiIG1ldGhvZD1cInBvc3RcIj4nLFxuICAgICAgICAnPC9mb3JtPidcbiAgICBdLmpvaW4oJycpLFxuICAgIHN1Ym1pdDogJzxidXR0b24gY2xhc3M9XCJiYXRjaFN1Ym1pdFwiIHR5cGU9XCJzdWJtaXRcIj5TRU5EPC9idXR0b24+JyxcbiAgICBmaWxlSW5wdXQ6ICc8aW5wdXQgdHlwZT1cImZpbGVcIiBpZD1cImZpbGVBdHRhY2hcIiB7e2RpcmVjdG9yeX19IG5hbWU9XCJ7e2ZpbGVGaWVsZH19XCIge3ttdWx0aXBsZX19IC8+JyxcbiAgICBoaWRkZW5JbnB1dDogJzxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cInt7bmFtZX19XCIgdmFsdWU9XCJ7e3ZhbHVlfX1cIj4nLFxuICAgIGJ1dHRvbjogJzxidXR0b24gdHlwZT1cImJ1dHRvblwiPnt7dGV4dH19PC9idXR0b24+JyxcbiAgICBsaXN0SXRlbTogW1xuICAgICAgICAnPGxpIGNsYXNzPVwiZmlsZXR5cGVEaXNwbGF5Q2xhc3NcIj4nLFxuICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwiZmlsZWljb24ge3tmaWxldHlwZX19XCI+e3tmaWxldHlwZX19PC9zcGFuPicsXG4gICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJmaWxlX25hbWVcIj57e2ZpbGVuYW1lfX08L3NwYW4+JyxcbiAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImZpbGVfc2l6ZVwiPnt7ZmlsZXNpemV9fTwvc3Bhbj4nLFxuICAgICAgICAnPC9saT4nXG4gICAgXS5qb2luKCcnKSxcbiAgICBkcmFnQW5kRHJvcDogJzxkaXYgY2xhc3M9XCJkcm9wem9uZVwiPjwvZGl2Pidcbn07XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgVGhpcyBpcyBtYW5hZ2VyIG9mIGlucHV0IGVsZW1lbnRzIHRoYXQgYWN0IGxpa2UgZmlsZSBwb29sLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIGNvbnN0cyA9IHJlcXVpcmUoJy4vY29uc3RzJyk7XG5cbnZhciBISURERU5fRklMRV9JTlBVVF9DTEFTUyA9IGNvbnN0cy5DT05GLkhJRERFTl9GSUxFX0lOUFVUX0NMQVNTLFxuICAgIGZvckVhY2ggPSB0dWkudXRpbC5mb3JFYWNoLFxuICAgIGhhc1N0YW1wID0gdHVpLnV0aWwuaGFzU3RhbXAsXG4gICAgc3RhbXAgPSB0dWkudXRpbC5zdGFtcDtcblxuLyoqXG4gKiBUaGUgcG9vbCBmb3Igc2F2ZSBmaWxlcy5cbiAqIEl0J3Mgb25seSBmb3IgaW5wdXRbZmlsZV0gZWxlbWVudCBzYXZlIGF0IGJyb3dzZXIgdGhhdCBkb2VzIG5vdCBzdXBwb3J0IGZpbGUgYXBpLlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gcGxhbmV0IC0gRm9ybSBlbGVtZW50XG4gKiBAY2xhc3MgUG9vbFxuICovXG52YXIgUG9vbCA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgUG9vbC5wcm90b3R5cGUgKi97XG4gICAgaW5pdDogZnVuY3Rpb24ocGxhbmV0KSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTdWJtaXR0ZXIgZm9yIGZpbGUgZWxlbWVudCB0byBzZXJ2ZXJcbiAgICAgICAgICogRm9ybSBlbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtIVE1MRWxlbWVudH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucGxhbmV0ID0gcGxhbmV0O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGaWxlIGRhdGEgc3RydWN0dXJlIG9iamVjdFxuICAgICAgICAgKiAga2V5PW5hbWUgOiB2YWx1ZT1pdXB1dFt0eXBlPWZpbGVdKEVsZW1lbnQpXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZpbGVzID0ge307XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNhdmUgYSBpbnB1dCBlbGVtZW50W3R5cGU9ZmlsZV0sIGFzIHZhbHVlIG9mIGZpbGUgbmFtZS5cbiAgICAgKiBAcGFyYW0ge0hUTUxJbnB1dEVsZW1lbnR9IGlucHV0RmlsZUVsIEEgaW5wdXQgZWxlbWVudCB0aGF0IGhhdmUgdG8gYmUgc2F2ZWRcbiAgICAgKi9cbiAgICBzdG9yZTogZnVuY3Rpb24oaW5wdXRGaWxlRWwpIHtcbiAgICAgICAgdmFyIGlkID0gaGFzU3RhbXAoaW5wdXRGaWxlRWwpICYmIHN0YW1wKGlucHV0RmlsZUVsKSxcbiAgICAgICAgICAgIGZpbGVuYW1lLCBrZXk7XG5cbiAgICAgICAgaWYgKCFpZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGZpbGVuYW1lID0gaW5wdXRGaWxlRWwudmFsdWU7XG4gICAgICAgIGtleSA9IGlkICsgZmlsZW5hbWU7XG4gICAgICAgIHRoaXMuZmlsZXNba2V5XSA9IGlucHV0RmlsZUVsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBpbnB1dCBlbGVtZW50W3R5cGU9ZmlsZV0gZnJvbSBwb29sLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgLSBBIGZpbGUgbmFtZSB0aGF0IGhhdmUgdG8gYmUgcmVtb3ZlZC5cbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSByZXN1bHRcbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAgICB2YXIga2V5ID0gcGFyYW1zLmlkICsgcGFyYW1zLm5hbWUsXG4gICAgICAgICAgICBlbGVtZW50ID0gdGhpcy5maWxlc1trZXldO1xuXG4gICAgICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVsZXRlIHRoaXMuZmlsZXNba2V5XTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEVtcHR5IHBvb2xcbiAgICAgKi9cbiAgICBlbXB0eTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZmlsZXMgPSB7fTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUGxhbnQgZmlsZXMgb24gcG9vbCB0byBmb3JtIGlucHV0XG4gICAgICovXG4gICAgcGxhbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcGxhbmV0ID0gdGhpcy5wbGFuZXQ7XG4gICAgICAgIGZvckVhY2godGhpcy5maWxlcywgZnVuY3Rpb24oZWxlbWVudCwga2V5KSB7XG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTmFtZSA9IEhJRERFTl9GSUxFX0lOUFVUX0NMQVNTO1xuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgcGxhbmV0LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuZmlsZXNba2V5XTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUG9vbDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNvbnN0cyA9IHJlcXVpcmUoJy4uL2NvbnN0cycpO1xuXG52YXIgVFlQRSA9IGNvbnN0cy5DT05GLlJFUVVFU1RFUl9UWVBFX01PREVSTixcbiAgICBmb3JFYWNoID0gdHVpLnV0aWwuZm9yRWFjaDtcblxuLyoqXG4gKiBNb2Rlcm4gcmVxdWVzdGVyXG4gKiBAcGFyYW0ge1VwbG9hZGVyfSB1cGxvYWRlciAtIFVwbG9hZGVyXG4gKiBAY2xhc3NcbiAqL1xudmFyIE1vZGVybiA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgTW9kZXJuLnByb3RvdHlwZSAqL3tcbiAgICBpbml0OiBmdW5jdGlvbih1cGxvYWRlcikge1xuICAgICAgICAvKipcbiAgICAgICAgICogVXBsb2FkZXJcbiAgICAgICAgICogQHR5cGUge1VwbG9hZGVyfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy51cGxvYWRlciA9IHVwbG9hZGVyO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGcm9tIHZpZXdcbiAgICAgICAgICogQHR5cGUge0Zvcm19XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZvcm1WaWV3ID0gdXBsb2FkZXIuZm9ybVZpZXc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExvY2FsIHBvb2wgZm9yIGZpbGVzXG4gICAgICAgICAqIEB0eXBlIHtBcnJheS48RmlsZT59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnBvb2wgPSBbXTtcblxuICAgICAgICBpZiAodXBsb2FkZXIuaXNCYXRjaFRyYW5zZmVyKSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE92ZXJyaWRlIHJlbW92ZSBmdW5jdGlvbiBmb3IgYmF0Y2ggdHJhbnNmZXJcbiAgICAgICAgICAgICAqIEB0eXBlIHtPbGQuX3JlbW92ZVdoZW5CYXRjaH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUgPSB0aGlzLl9yZW1vdmVXaGVuQmF0Y2g7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge3N0cmluZ30gUmVxdWVzdGVyIHR5cGVcbiAgICAgKi9cbiAgICBUWVBFOiBUWVBFLFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciBmb3IgdXBsb2FkIGVycm9yXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGpxWEhSIC0galF1ZXJ5IFhIUlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0dXMgLSBBamF4IFN0YXR1c1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtc2dUaHJvd24gLSBFcnJvciBtZXNzYWdlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfdXBsb2FkRXJyb3I6IGZ1bmN0aW9uKGpxWEhSLCBzdGF0dXMsIG1zZ1Rocm93bikge1xuICAgICAgICB0aGlzLmZpcmUoJ2Vycm9yJywge1xuICAgICAgICAgICAgc3RhdHVzOiBzdGF0dXMsXG4gICAgICAgICAgICBtZXNzYWdlOiBtc2dUaHJvd25cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgZm9yIHVwbG9hZCBzdWNjZXNzXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBVcGxvYWQgc3VjY2VzcyBkYXRhXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfdXBsb2FkU3VjY2VzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB0aGlzLmZpcmUoJ3VwbG9hZGVkJywgSlNPTi5wYXJzZShkYXRhKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN0b3JlIGZpbGVzIHRvIGxvY2FsIHBvb2xcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxGaWxlPiB8IEZpbGV9IFtmaWxlc10gLSBBIGZpbGUgb3IgZmlsZXNcbiAgICAgKi9cbiAgICBzdG9yZTogZnVuY3Rpb24oZmlsZXMpIHtcbiAgICAgICAgdmFyIHBvb2wgPSB0aGlzLnBvb2wsXG4gICAgICAgICAgICBzdGFtcCA9IHR1aS51dGlsLnN0YW1wLFxuICAgICAgICAgICAgZGF0YSA9IFtdO1xuICAgICAgICBmaWxlcyA9IHR1aS51dGlsLnRvQXJyYXkoZmlsZXMgfHwgdGhpcy5mb3JtVmlldy4kZmlsZUlucHV0WzBdLmZpbGVzKTtcblxuICAgICAgICBmb3JFYWNoKGZpbGVzLCBmdW5jdGlvbihmaWxlKSB7XG4gICAgICAgICAgICB2YXIgaWQgPSBzdGFtcChmaWxlKTtcbiAgICAgICAgICAgIHBvb2wucHVzaChmaWxlKTtcbiAgICAgICAgICAgIGRhdGEucHVzaCh7XG4gICAgICAgICAgICAgICAgaWQ6IGlkLFxuICAgICAgICAgICAgICAgIG5hbWU6IGZpbGUubmFtZSxcbiAgICAgICAgICAgICAgICBzaXplOiBmaWxlLnNpemVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmZvcm1WaWV3LnJlc2V0RmlsZUlucHV0KCk7XG4gICAgICAgIHRoaXMuZmlyZSgnc3RvcmVkJywgZGF0YSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwbG9hZCBhamF4XG4gICAgICovXG4gICAgdXBsb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGZvcm0gPSB0aGlzLmZvcm1WaWV3LiRlbC5jbG9uZSgpLFxuICAgICAgICAgICAgZmllbGQgPSB0aGlzLnVwbG9hZGVyLmZpbGVGaWVsZCxcbiAgICAgICAgICAgIGZvcm1EYXRhO1xuXG4gICAgICAgIGZvcm0uZmluZCgnaW5wdXRbdHlwZT1cImZpbGVcIl0nKS5yZW1vdmUoKTtcbiAgICAgICAgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoZm9ybSk7XG5cbiAgICAgICAgZm9yRWFjaCh0aGlzLnBvb2wsIGZ1bmN0aW9uKGZpbGUpIHtcbiAgICAgICAgICAgIGZvcm1EYXRhLmFwcGVuZChmaWVsZCwgZmlsZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHRoaXMudXBsb2FkZXIudXJsLnNlbmQsXG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICBkYXRhOiBmb3JtRGF0YSxcbiAgICAgICAgICAgIHN1Y2Nlc3M6ICQucHJveHkodGhpcy5fdXBsb2FkU3VjY2VzcywgdGhpcyksXG4gICAgICAgICAgICBlcnJvcjogJC5wcm94eSh0aGlzLl91cGxvYWRFcnJvciwgdGhpcyksXG4gICAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgICBjb250ZW50VHlwZTogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpbGUgKGFqYXgtanNvbnApXG4gICAgICogSXQgaXMgbm90IHVzZWQgZm9yIGJhdGNoIHRyYW5zZmVyLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgLSBQYXJhbWV0ZXJzIHRvIHJlbW92ZSBmaWxlXG4gICAgICovXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogdXBsb2FkZXIudXJsLnJlbW92ZSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbnAnLFxuICAgICAgICAgICAgZGF0YTogcGFyYW1zLFxuICAgICAgICAgICAgc3VjY2VzczogJC5wcm94eShmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgZGF0YS50eXBlID0gJ3JlbW92ZSc7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdyZW1vdmVkJywgZGF0YSk7XG4gICAgICAgICAgICB9LCB0aGlzKVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpbGUgKGFqYXgtanNvbnApXG4gICAgICogSXQgaXMgdXNlZCBmb3IgYmF0Y2ggdHJhbnNmZXIuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyAtIFBhcmFtZXRlcnMgdG8gcmVtb3ZlIGZpbGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW1vdmVXaGVuQmF0Y2g6IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAgICB2YXIgcG9vbCA9IHRoaXMucG9vbCxcbiAgICAgICAgICAgIGhhc1N0YW1wID0gdHVpLnV0aWwuaGFzU3RhbXAsXG4gICAgICAgICAgICBzdGFtcCA9IHR1aS51dGlsLnN0YW1wLFxuICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XG5cbiAgICAgICAgZm9yRWFjaChwb29sLCBmdW5jdGlvbihmaWxlLCBpbmRleCkge1xuICAgICAgICAgICAgaWYgKGhhc1N0YW1wKGZpbGUpICYmIChzdGFtcChmaWxlKSA9PT0gcGFyYW1zLmlkKSkge1xuICAgICAgICAgICAgICAgIHBvb2wuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5maXJlKCdyZW1vdmVkJywgdHVpLnV0aWwuZXh0ZW5kKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IHJlc3VsdCA/ICdzdWNjZXNzJyA6ICdmYWlsJ1xuICAgICAgICB9LCBwYXJhbXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgdGhlIHBvb2xcbiAgICAgKi9cbiAgICBjbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucG9vbC5sZW5ndGggPSAwO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oTW9kZXJuKTtcbm1vZHVsZS5leHBvcnRzID0gTW9kZXJuO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUG9vbCA9IHJlcXVpcmUoJy4uL3Bvb2wnKSxcbiAgICBjb25zdHMgPSByZXF1aXJlKCcuLi9jb25zdHMnKTtcblxudmFyIFRZUEUgPSBjb25zdHMuQ09ORi5SRVFVRVNURVJfVFlQRV9PTEQ7XG5cbi8qKlxuICogT2xkIHJlcXVlc3RlclxuICogQHBhcmFtIHtVcGxvYWRlcn0gdXBsb2FkZXIgLSBVcGxvYWRlclxuICogQGNsYXNzXG4gKi9cbnZhciBPbGQgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIE9sZC5wcm90b3R5cGUgKi97XG4gICAgaW5pdDogZnVuY3Rpb24odXBsb2FkZXIpIHtcbiAgICAgICAgdmFyICRoaWRkZW5GcmFtZSA9IHVwbG9hZGVyLiR0YXJnZXRGcmFtZSxcbiAgICAgICAgICAgIGZvcm1WaWV3ID0gdXBsb2FkZXIuZm9ybVZpZXc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFVwbG9hZGVyXG4gICAgICAgICAqIEB0eXBlIHtVcGxvYWRlcn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudXBsb2FkZXIgPSB1cGxvYWRlcjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRnJvbSB2aWV3XG4gICAgICAgICAqIEB0eXBlIHtGb3JtfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5mb3JtVmlldyA9IGZvcm1WaWV3O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMb2NhbCBwb29sIGZvciBmaWxlIGVsZW1lbnRzXG4gICAgICAgICAqIEB0eXBlIHtQb29sfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wb29sID0gbmV3IFBvb2woZm9ybVZpZXcuJGVsWzBdKTtcblxuICAgICAgICBpZiAodXBsb2FkZXIuaXNCYXRjaFRyYW5zZmVyKSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE92ZXJyaWRlIFVwbG9hZCBmdW5jdGlvbiBmb3IgYmF0Y2ggdHJhbnNmZXJcbiAgICAgICAgICAgICAqIEB0eXBlIHtPbGQuX3VwbG9hZFdoZW5CYXRjaH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy51cGxvYWQgPSB0aGlzLl91cGxvYWRXaGVuQmF0Y2g7XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogT3ZlcnJpZGUgcmVtb3ZlIGZ1bmN0aW9uIGZvciBiYXRjaCB0cmFuc2ZlclxuICAgICAgICAgICAgICogQHR5cGUge09sZC5fcmVtb3ZlV2hlbkJhdGNofVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLnJlbW92ZSA9IHRoaXMuX3JlbW92ZVdoZW5CYXRjaDtcbiAgICAgICAgfVxuXG4gICAgICAgICRoaWRkZW5GcmFtZS5vbignbG9hZCcsICQucHJveHkodGhpcy5fb25Mb2FkSGlkZGVuRnJhbWUsIHRoaXMsICRoaWRkZW5GcmFtZSkpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7c3RyaW5nfSBSZXF1ZXN0ZXIgdHlwZVxuICAgICAqL1xuICAgIFRZUEU6IFRZUEUsXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyXG4gICAgICogXCJsb2FkXCIgb2YgaGlkZGVuIGZyYW1lLlxuICAgICAqIEBwYXJhbSB7alF1ZXJ5fSAkaGlkZGVuRnJhbWUgLSBIaWRkZW4gaWZyYW1lXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25Mb2FkSGlkZGVuRnJhbWU6IGZ1bmN0aW9uKCRoaWRkZW5GcmFtZSkge1xuICAgICAgICB2YXIgZnJhbWVCb2R5LFxuICAgICAgICAgICAgZGF0YTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZnJhbWVCb2R5ID0gJGhpZGRlbkZyYW1lWzBdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQuYm9keTtcbiAgICAgICAgICAgIGRhdGEgPSB0dWkudXRpbC5waWNrKGZyYW1lQm9keSwgJ2ZpcnN0Q2hpbGQnLCAnZGF0YScpO1xuICAgICAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3VwbG9hZGVkJywgJC5wYXJzZUpTT04oZGF0YSkpO1xuICAgICAgICAgICAgICAgIGZyYW1lQm9keS5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhpcy5maXJlKCdlcnJvcicsIHtcbiAgICAgICAgICAgICAgICBzdGF0dXM6IGUubmFtZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBlLm1lc3NhZ2VcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN0b3JlIGZpbGUgaW5wdXQgZWxlbWVudCBmcm9tIHVwbG9hZCBmb3JtXG4gICAgICovXG4gICAgc3RvcmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZWwgPSB0aGlzLmZvcm1WaWV3LiRmaWxlSW5wdXRbMF0sXG4gICAgICAgICAgICBpZCA9IHR1aS51dGlsLnN0YW1wKGVsKTtcblxuICAgICAgICB0aGlzLnBvb2wuc3RvcmUoZWwpO1xuICAgICAgICB0aGlzLmZvcm1WaWV3LnJlc2V0RmlsZUlucHV0KCk7XG5cbiAgICAgICAgdGhpcy5maXJlKCdzdG9yZWQnLCBbe1xuICAgICAgICAgICAgaWQ6IGlkLFxuICAgICAgICAgICAgbmFtZTogZWwudmFsdWUsXG4gICAgICAgICAgICBzaXplOiAnJ1xuICAgICAgICB9XSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwbG9hZC5cbiAgICAgKiBJdCBpcyBub3QgdXNlZCBmb3IgYmF0Y2ggdHJhbnNmZXIuXG4gICAgICovXG4gICAgdXBsb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5wb29sLnBsYW50KCk7XG4gICAgICAgIHRoaXMuZm9ybVZpZXcuJGVsLnN1Ym1pdCgpO1xuICAgICAgICB0aGlzLmZvcm1WaWV3LmNsZWFyKCk7XG4gICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBsb2FkLlxuICAgICAqIEl0IGlzIHVzZWQgZm9yIGJhdGNoIHRyYW5zZmVyLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwbG9hZFdoZW5CYXRjaDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucG9vbC5wbGFudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZmlsZSAoYWpheC1qc29ucClcbiAgICAgKiBJdCBpcyBub3QgdXNlZCBmb3IgYmF0Y2ggdHJhbnNmZXIuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyAtIFBhcmFtZXRlcnMgdG8gcmVtb3ZlIGZpbGVcbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAgICB2YXIgdXBsb2FkZXIgPSB0aGlzLnVwbG9hZGVyO1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiB1cGxvYWRlci51cmwucmVtb3ZlLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29ucCcsXG4gICAgICAgICAgICBkYXRhOiBwYXJhbXMsXG4gICAgICAgICAgICBzdWNjZXNzOiAkLnByb3h5KGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBkYXRhLnR5cGUgPSAncmVtb3ZlJztcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZWQnLCBkYXRhKTtcbiAgICAgICAgICAgIH0sIHRoaXMpXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZmlsZSAoYWpheC1qc29ucClcbiAgICAgKiBJdCBpcyB1c2VkIGZvciBiYXRjaCB0cmFuc2Zlci5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIC0gUGFyYW1ldGVycyB0byByZW1vdmUgZmlsZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbW92ZVdoZW5CYXRjaDogZnVuY3Rpb24ocGFyYW1zKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSB0aGlzLnBvb2wucmVtb3ZlKHBhcmFtcyk7XG5cbiAgICAgICAgdGhpcy5maXJlKCdyZW1vdmVkJywgdHVpLnV0aWwuZXh0ZW5kKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IHJlc3VsdCA/ICdzdWNjZXNzJyA6ICdmYWlsJ1xuICAgICAgICB9LCBwYXJhbXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgdGhlIHBvb2xcbiAgICAgKi9cbiAgICBjbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucG9vbC5lbXB0eSgpO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oT2xkKTtcbm1vZHVsZS5leHBvcnRzID0gT2xkO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZpbGVVcGxvYWRlciBpcyBjb3JlIG9mIGZpbGUgdXBsb2FkZXIgY29tcG9uZW50Ljxicj5GaWxlTWFuYWdlciBtYW5hZ2UgY29ubmVjdG9yIHRvIGNvbm5lY3Qgc2VydmVyIGFuZCB1cGRhdGUgRmlsZUxpc3RWaWV3LlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcbnZhciBjb25zdHMgPSByZXF1aXJlKCcuL2NvbnN0cycpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIEZvcm0gPSByZXF1aXJlKCcuL3ZpZXcvZm9ybScpO1xudmFyIExpc3QgPSByZXF1aXJlKCcuL3ZpZXcvbGlzdCcpO1xudmFyIERyYWdBbmREcm9wID0gcmVxdWlyZSgnLi92aWV3L2RyYWcnKTtcbnZhciBPbGRSZXF1ZXN0ZXIgPSByZXF1aXJlKCcuL3JlcXVlc3Rlci9vbGQnKTtcbnZhciBNb2Rlcm5SZXF1ZXN0ZXIgPSByZXF1aXJlKCcuL3JlcXVlc3Rlci9tb2Rlcm4nKTtcblxudmFyIFJFUVVFU1RFUl9UWVBFX01PREVSTiA9IGNvbnN0cy5DT05GLlJFUVVFU1RFUl9UWVBFX01PREVSTjtcblxuLyoqXG4gKiBGaWxlVXBsb2FkZXIgYWN0IGxpa2UgYnJpZGdlIGJldHdlZW4gY29ubmVjdG9yIGFuZCB2aWV3LlxuICogSXQgbWFrZXMgY29ubmVjdG9yIGFuZCB2aWV3IHdpdGggb3B0aW9uIGFuZCBlbnZpcm9ubWVudC5cbiAqIEl0IGNvbnRyb2wgYW5kIG1ha2UgY29ubmVjdGlvbiBhbW9uZyBtb2R1bGVzLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBUaGUgb3B0aW9ucyB0byBzZXQgdXAgZmlsZSB1cGxvYWRlciBtb2R1bGVzLlxuICogIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLnVybCBUaGUgdXJsIGlzIGZpbGUgc2VydmVyLlxuICogICAgICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy51cmwuc2VuZCBUaGUgdXJsIGlzIGZvciBmaWxlIGF0dGFjaC5cbiAqICAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMudXJsLnJlbW92ZSBUaGUgdXJsIGlzIGZvciBmaWxlIGRldGFjaC5cbiAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5mb3JtVGFyZ2V0IFRoZSB0YXJnZXQgZm9yIHgtZG9tYWluIGpzb25wIGNhc2UuXG4gKiAgQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMubGlzdEluZm8gVGhlIGVsZW1lbnQgaW5mbyB0byBkaXNwbGF5IGZpbGUgbGlzdCBpbmZvcm1hdGlvbi5cbiAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZmlsZUZpZWxkPSd1c2VyRmlsZVtdJ10gVGhlIGZpZWxkIG5hbWUgb2YgaW5wdXQgZmlsZSBlbGVtZW50LlxuICogIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy51c2VGb2xkZXIgV2hldGhlciBzZWxlY3QgdW5pdCBpcyBmb2xkZXIgb2Ygbm90LiBJZiB0aGlzIGlzIHR1cmUsIG11bHRpcGxlIHdpbGwgYmUgaWdub3JlZC5cbiAqICBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMuaXNNdWx0aXBsZSBXaGV0aGVyIGVuYWJsZSBtdWx0aXBsZSBzZWxlY3Qgb3Igbm90LlxuICogQHBhcmFtIHtqUXVlcnl9ICRlbCBSb290IEVsZW1lbnQgb2YgVXBsb2FkZXJcbiAqIEBleGFtcGxlXG4gKiB2YXIgdXBsb2FkZXIgPSBuZXcgdHVpLmNvbXBvbmVudC5VcGxvYWRlcih7XG4gKiAgICAgdXJsOiB7XG4gKiAgICAgICAgIHNlbmQ6IFwiaHR0cDovL2ZlLm5obmVudC5jb20vZXRjL2V0Yy91cGxvYWRlci91cGxvYWRlci5waHBcIixcbiAqICAgICAgICAgcmVtb3ZlOiBcImh0dHA6Ly9mZS5uaG5lbnQuY29tL2V0Yy9ldGMvdXBsb2FkZXIvcmVtb3ZlLnBocFwiXG4gKiAgICAgfSxcbiAqICAgICBmb3JtVGFyZ2V0OiAnaGlkZGVuRnJhbWUnLFxuICogICAgIGxpc3RJbmZvOiB7XG4gKiAgICAgICAgIGxpc3Q6ICQoJyNmaWxlcycpLFxuICogICAgICAgICBjb3VudDogJCgnI2ZpbGVfY291bnQnKSxcbiAqICAgICAgICAgc2l6ZTogJCgnI3NpemVfY291bnQnKVxuICogICAgIH1cbiAqIH0sICQoJyN1cGxvYWRlcicpKTtcbiAqL1xudmFyIFVwbG9hZGVyID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqQGxlbmRzIFVwbG9hZGVyLnByb3RvdHlwZSAqL3tcbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zLCAkZWwpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFVwbG9hZGVyIGVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJGVsID0gJGVsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZW5kL1JlbW92ZSB1cmxcbiAgICAgICAgICogQHR5cGUge3tzZW5kOiBzdHJpbmcsIHJlbW92ZTogc3RyaW5nfX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudXJsID0gb3B0aW9ucy51cmw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlZGlyZWN0IFVSTCBmb3IgQ09SUyhyZXNwb25zZSwgSUU3KVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZWRpcmVjdFVSTCA9IG9wdGlvbnMucmVkaXJlY3RVUkw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZvcm0gdGFyZ2V0IG5hbWUgZm9yIENPUlMgKElFNywgOCwgOSlcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZm9ybVRhcmdldCA9IG9wdGlvbnMuZm9ybVRhcmdldCB8fCBjb25zdHMuQ09ORi5GT1JNX1RBUkdFVF9OQU1FO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUYXJnZXQgZnJhbWUgZm9yIENPUlMgKElFNywgOCwgOSlcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJHRhcmdldEZyYW1lID0gdGhpcy5fY3JlYXRlVGFyZ2V0RnJhbWUoKVxuICAgICAgICAgICAgLmFwcGVuZFRvKHRoaXMuJGVsKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSW5wdXQgZmlsZSAtIGZpZWxkIG5hbWVcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZmlsZUZpZWxkID0gb3B0aW9ucy5maWxlRmllbGQgfHwgY29uc3RzLkNPTkYuRklMRV9GSUxFRF9OQU1FO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHRoZSB1cGxvYWRlciB1c2VzIGJhdGNoLXRyYW5zZmVyXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc0JhdGNoVHJhbnNmZXIgPSAhIShvcHRpb25zLmlzQmF0Y2hUcmFuc2Zlcik7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdoZXRoZXIgdGhlIHNlbmRpbmcvcmVtb3ZpbmcgdXJscyBhcmUgeC1kb21haW4uXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc0Nyb3NzRG9tYWluID0gdXRpbHMuaXNDcm9zc0RvbWFpbih0aGlzLnVybC5zZW5kKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0cyBQb3N0TWVzc2FnZSBBUElcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzU3VwcG9ydFBvc3RNZXNzYWdlID0gISEodHVpLnV0aWwucGljayh0aGlzLiR0YXJnZXRGcmFtZSwgJzAnLCAnY29udGVudFdpbmRvdycsICdwb3N0TWVzc2FnZScpKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciB0aGUgdXNlciB1c2VzIG11bHRpcGxlIHVwbG9hZFxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaXNNdWx0aXBsZSA9ICEhKG9wdGlvbnMuaXNNdWx0aXBsZSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdoZXRoZXIgdGhlIHVzZXIgdXNlcyBkcmFnJmRyb3AgdXBsb2FkXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy51c2VEcmFnID0gISEob3B0aW9ucy51c2VEcmFnKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciB0aGUgdXNlciB1c2VzIGZvbGRlciB1cGxvYWRcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnVzZUZvbGRlciA9ICEhKG9wdGlvbnMudXNlRm9sZGVyKTtcblxuICAgICAgICBpZiAodGhpcy51c2VEcmFnICYmICF0aGlzLnVzZUZvbGRlciAmJiB1dGlscy5pc1N1cHBvcnRGaWxlU3lzdGVtKCkpIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogRHJhZyAmIERyb3AgVmlld1xuICAgICAgICAgICAgICogQHR5cGUge0RyYWdBbmREcm9wfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLmRyYWdWaWV3ID0gbmV3IERyYWdBbmREcm9wKHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZyb20gVmlld1xuICAgICAgICAgKiBAdHlwZSB7Rm9ybX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZm9ybVZpZXcgPSBuZXcgRm9ybSh0aGlzKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTGlzdCBWaWV3XG4gICAgICAgICAqIEB0eXBlIHtMaXN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5saXN0VmlldyA9IG5ldyBMaXN0KG9wdGlvbnMubGlzdEluZm8pO1xuXG4gICAgICAgIHRoaXMuX3NldFJlcXVlc3RlcigpO1xuICAgICAgICB0aGlzLl9hZGRFdmVudCgpO1xuICAgICAgICBpZiAodGhpcy5pc0Nyb3NzRG9tYWluICYmIHRoaXMuaXNTdXBwb3J0UG9zdE1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldFBvc3RNZXNzYWdlRXZlbnQoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgQ29ubmVjdG9yXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0UmVxdWVzdGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHV0aWxzLmlzU3VwcG9ydEZvcm1EYXRhKCkpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlcXVlc3RlciA9IG5ldyBNb2Rlcm5SZXF1ZXN0ZXIodGhpcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9yZXF1ZXN0ZXIgPSBuZXcgT2xkUmVxdWVzdGVyKHRoaXMpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBwb3N0LW1lc3NhZ2UgZXZlbnQgaWYgc3VwcG9ydGVkIGFuZCBuZWVkZWRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRQb3N0TWVzc2FnZUV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kdGFyZ2V0RnJhbWUub2ZmKCdsb2FkJyk7XG4gICAgICAgICQod2luZG93KS5vbignbWVzc2FnZScsICQucHJveHkoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIHZhciBvcmlnaW5hbEV2ZW50ID0gZXZlbnQub3JpZ2luYWxFdmVudCxcbiAgICAgICAgICAgICAgICBkYXRhO1xuXG4gICAgICAgICAgICBpZiAodGhpcy51cmwuc2VuZC5pbmRleE9mKG9yaWdpbmFsRXZlbnQub3JpZ2luKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkYXRhID0gJC5wYXJzZUpTT04ob3JpZ2luYWxFdmVudC5kYXRhKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNCYXRjaFRyYW5zZmVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxpc3QoZGF0YS5maWxlbGlzdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3N1Y2Nlc3MnLCBkYXRhKTtcbiAgICAgICAgfSwgdGhpcykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIHRhcmdldCBmcmFtZSB0byBiZSB0YXJnZXQgb2YgZm9ybSBlbGVtZW50LlxuICAgICAqIEByZXR1cm5zIHtqUXVlcnl9IFRhcmdldCBmcmFtZToganF1ZXJ5LWVsZW1lbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jcmVhdGVUYXJnZXRGcmFtZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkdGFyZ2V0ID0gJCgnPGlmcmFtZSBuYW1lPVwiJyArIHRoaXMuZm9ybVRhcmdldCArICdcIj48L2lmcmFtZT4nKTtcbiAgICAgICAgJHRhcmdldC5jc3Moe1xuICAgICAgICAgICAgdmlzaWJpbGl0eTogJ2hpZGRlbicsXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJ1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gJHRhcmdldDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50cyB0byB2aWV3cyBhbmQgZmlyZSB1cGxvYWRlciBldmVudHNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnVzZURyYWcgJiYgdGhpcy5kcmFnVmlldykge1xuICAgICAgICAgICAgdGhpcy5kcmFnVmlldy5vbignZHJvcCcsIHRoaXMuc3RvcmUsIHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGlzdFZpZXcub24oJ3JlbW92ZScsIHRoaXMucmVtb3ZlRmlsZSwgdGhpcyk7XG4gICAgICAgIGlmICh0aGlzLmlzQmF0Y2hUcmFuc2Zlcikge1xuICAgICAgICAgICAgdGhpcy5fYWRkRXZlbnRXaGVuQmF0Y2hUcmFuc2ZlcigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fYWRkRXZlbnRXaGVuTm9ybWFsVHJhbnNmZXIoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnQgd2hlbiB1cGxvYWRlciB1c2VzIGJhdGNoLXRyYW5zZmVyXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRXZlbnRXaGVuQmF0Y2hUcmFuc2ZlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZm9ybVZpZXcub24oe1xuICAgICAgICAgICAgY2hhbmdlOiB0aGlzLnN0b3JlLFxuICAgICAgICAgICAgc3VibWl0OiB0aGlzLnN1Ym1pdFxuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICB0aGlzLl9yZXF1ZXN0ZXIub24oe1xuICAgICAgICAgICAgcmVtb3ZlZDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGlzdChkYXRhKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZScsIGRhdGEpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdlcnJvcicsIGRhdGEpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVwbG9hZGVkOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgnc3VjY2VzcycsIGRhdGEpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0b3JlZDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGlzdChkYXRhKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3VwZGF0ZScsIGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IHdoZW4gdXBsb2FkZXIgdXNlcyBub3JtYWwtdHJhbnNmZXJcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRFdmVudFdoZW5Ob3JtYWxUcmFuc2ZlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZm9ybVZpZXcub24oJ2NoYW5nZScsIHRoaXMuc2VuZEZpbGUsIHRoaXMpO1xuICAgICAgICB0aGlzLl9yZXF1ZXN0ZXIub24oe1xuICAgICAgICAgICAgcmVtb3ZlZDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGlzdChkYXRhKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZScsIGRhdGEpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdlcnJvcicsIGRhdGEpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVwbG9hZGVkOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMaXN0KGRhdGEuZmlsZWxpc3QpO1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgnc3VjY2VzcycsIGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGxpc3QgdmlldyB3aXRoIGN1c3RvbSBvciBvcmlnaW5hbCBkYXRhLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbaW5mb10gVGhlIGRhdGEgZm9yIHVwZGF0ZSBsaXN0XG4gICAgICovXG4gICAgdXBkYXRlTGlzdDogZnVuY3Rpb24oaW5mbykge1xuICAgICAgICB0aGlzLmxpc3RWaWV3LnVwZGF0ZShpbmZvKTtcbiAgICAgICAgaWYgKHRoaXMuaXNCYXRjaFRyYW5zZmVyKSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RWaWV3LnVwZGF0ZVRvdGFsSW5mbyhpbmZvKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubGlzdFZpZXcudXBkYXRlVG90YWxJbmZvKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZm9yIGN1c3RvbSBzZW5kIGV2ZW50XG4gICAgICogQHBhcmFtIHtFdmVudH0gW2V2ZW50XSAtIEZvcm0gc3VibWl0IGV2ZW50XG4gICAgICovXG4gICAgc2VuZEZpbGU6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHRoaXMuc3RvcmUoKTtcbiAgICAgICAgdGhpcy5zdWJtaXQoZXZlbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmb3IgY3VzdG9tIHJlbW92ZSBldmVudFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIFRoZSBkYXRhIGZvciByZW1vdmUgZmlsZS5cbiAgICAgKi9cbiAgICByZW1vdmVGaWxlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHRoaXMuX3JlcXVlc3Rlci5yZW1vdmUoZGF0YSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN1Ym1pdCBmb3IgZGF0YSBzdWJtaXQgdG8gc2VydmVyXG4gICAgICogQHBhcmFtIHtFdmVudH0gW2V2ZW50XSAtIEZvcm0gc3VibWl0IGV2ZW50XG4gICAgICovXG4gICAgc3VibWl0OiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQgJiYgdGhpcy5fcmVxdWVzdGVyLlRZUEUgPT09IFJFUVVFU1RFUl9UWVBFX01PREVSTikge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yZXF1ZXN0ZXIudXBsb2FkKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENsZWFyIHVwbG9hZGVyXG4gICAgICovXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9yZXF1ZXN0ZXIuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5mb3JtVmlldy5jbGVhcigpO1xuICAgICAgICB0aGlzLmxpc3RWaWV3LmNsZWFyKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN0b3JlIGlucHV0IGVsZW1lbnQgdG8gcG9vbC5cbiAgICAgKiBAcGFyYW0ge0FycmF5LjxGaWxlPiB8IEZpbGV9IFtmaWxlc10gLSBBIGZpbGUgb3IgZmlsZXNcbiAgICAgKi9cbiAgICBzdG9yZTogZnVuY3Rpb24oZmlsZXMpIHtcbiAgICAgICAgdGhpcy5fcmVxdWVzdGVyLnN0b3JlKGZpbGVzKTtcbiAgICB9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKFVwbG9hZGVyKTtcbm1vZHVsZS5leHBvcnRzID0gVXBsb2FkZXI7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgVGhpcyBmaWxlIGNvbnRhaW4gdXRpbGl0eSBtZXRob2RzIGZvciB1cGxvYWRlci5cbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbid1c2Ugc3RyaWN0Jztcbi8qKlxuICogQG5hbWVzcGFjZSB1dGlsc1xuICovXG52YXIgSVNfU1VQUE9SVF9GSUxFX1NZU1RFTSA9ICEhKHdpbmRvdy5GaWxlICYmIHdpbmRvdy5GaWxlUmVhZGVyICYmIHdpbmRvdy5GaWxlTGlzdCAmJiB3aW5kb3cuQmxvYiksXG4gICAgSVNfU1VQUE9SVF9GT1JNX0RBVEEgPSAhISh3aW5kb3cuRm9ybURhdGEgfHwgbnVsbCk7XG5cbi8qKlxuICogUGFyc2UgdXJsXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsIC0gdXJsIGZvciBwYXJzaW5nXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBVUkwgaW5mb3JtYXRpb25cbiAqL1xuZnVuY3Rpb24gcGFyc2VVUkwodXJsKSB7XG4gICAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgYS5ocmVmID0gdXJsO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgaHJlZjogYS5ocmVmLFxuICAgICAgICBob3N0OiBhLmhvc3QsXG4gICAgICAgIHBvcnQ6IGEucG9ydCxcbiAgICAgICAgaGFzaDogYS5oYXNoLFxuICAgICAgICBob3N0bmFtZTogYS5ob3N0bmFtZSxcbiAgICAgICAgcGF0aG5hbWU6IGEucGF0aG5hbWUsXG4gICAgICAgIHByb3RvY29sOiBhLnByb3RvY29sLFxuICAgICAgICBzZWFyY2g6IGEuc2VhcmNoLFxuICAgICAgICBxdWVyeTogYS5zZWFyY2guc2xpY2UoMSlcbiAgICB9O1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdW5pdCBmb3IgZmlsZSBzaXplXG4gKiBAcGFyYW0ge251bWJlcn0gYnl0ZXMgQSB1c2FnZSBvZiBmaWxlXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBTaXplLXN0cmluZ1xuICogQG1lbWJlcm9mIHV0aWxzXG4gKi9cbmZ1bmN0aW9uIGdldEZpbGVTaXplV2l0aFVuaXQoYnl0ZXMpIHtcbiAgICB2YXIgdW5pdHMgPSBbJ0InLCAnS0InLCAnTUInLCAnR0InLCAnVEInXSxcbiAgICAgICAgYnl0ZXMgPSBwYXJzZUludChieXRlcywgMTApLFxuICAgICAgICBleHAgPSBNYXRoLmxvZyhieXRlcykgLyBNYXRoLmxvZygxMDI0KSB8IDAsXG4gICAgICAgIHJlc3VsdCA9IChieXRlcyAvIE1hdGgucG93KDEwMjQsIGV4cCkpLnRvRml4ZWQoMik7XG5cbiAgICByZXR1cm4gcmVzdWx0ICsgdW5pdHNbZXhwXTtcbn1cblxuLyoqXG4gKiBXaGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIEZvcm1EYXRhIG9yIG5vdFxuICogQG1lbWJlcm9mIHV0aWxzXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gd2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0cyBGb3JtRGF0YVxuICovXG5mdW5jdGlvbiBpc1N1cHBvcnRGb3JtRGF0YSgpIHtcbiAgICByZXR1cm4gSVNfU1VQUE9SVF9GT1JNX0RBVEE7XG59XG5cbi8qKlxuICogR2V0IGl0ZW0gZWxlbWVudHMgSFRNTFxuICogQHBhcmFtIHtPYmplY3R9IG1hcCAtIFByb3BlcnRpZXMgZm9yIHRlbXBsYXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gaHRtbCBIVE1MIHRlbXBsYXRlXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBIVE1MXG4gKiBAbWVtYmVyb2YgdXRpbHNcbiAqL1xuZnVuY3Rpb24gdGVtcGxhdGUobWFwLCBodG1sKSB7XG4gICAgaHRtbCA9IGh0bWwucmVwbGFjZSgvXFx7XFx7KFteXFx9XSspXFx9XFx9L2csIGZ1bmN0aW9uIChtc3RyLCBuYW1lKSB7XG4gICAgICAgIHJldHVybiBtYXBbbmFtZV07XG4gICAgfSk7XG4gICAgcmV0dXJuIGh0bWw7XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0cyBmaWxlIGFwaS5cbiAqIEByZXR1cm5zIHtib29sZWFufSB3aGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIEZpbGVBUElcbiAqIEBtZW1iZXJvZiB1dGlsc1xuICovXG5mdW5jdGlvbiBpc1N1cHBvcnRGaWxlU3lzdGVtKCkge1xuICAgIHJldHVybiBJU19TVVBQT1JUX0ZJTEVfU1lTVEVNO1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIHVybCBpcyB4LWRvbWFpblxuICogQHBhcmFtIHtzdHJpbmd9IHVybCAtIFVSTFxuICogQHJldHVybnMge2Jvb2xlYW59IFdoZXRoZXIgdGhlIHVybCBpcyB4LWRvbWFpblxuICogQG1lbWJlcm9mIHV0aWxzXG4gKi9cbmZ1bmN0aW9uIGlzQ3Jvc3NEb21haW4odXJsKSB7XG4gICAgdmFyIGhlcmUgPSBwYXJzZVVSTCh3aW5kb3cubG9jYXRpb24uaHJlZiksXG4gICAgICAgIHRhcmdldCA9IHBhcnNlVVJMKHVybCk7XG5cbiAgICByZXR1cm4gdGFyZ2V0Lmhvc3RuYW1lICE9PSBoZXJlLmhvc3RuYW1lXG4gICAgICAgIHx8IHRhcmdldC5wb3J0ICE9PSBoZXJlLnBvcnRcbiAgICAgICAgfHwgdGFyZ2V0LnByb3RvY29sICE9PSBoZXJlLnByb3RvY29sO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRGaWxlU2l6ZVdpdGhVbml0OiBnZXRGaWxlU2l6ZVdpdGhVbml0LFxuICAgIGlzU3VwcG9ydEZpbGVTeXN0ZW06IGlzU3VwcG9ydEZpbGVTeXN0ZW0sXG4gICAgaXNTdXBwb3J0Rm9ybURhdGE6IGlzU3VwcG9ydEZvcm1EYXRhLFxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcbiAgICBpc0Nyb3NzRG9tYWluOiBpc0Nyb3NzRG9tYWluXG59O1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgZmlsZSBpcyBhYm91dCBkcmFnIGFuZCBkcm9wIGZpbGUgdG8gc2VuZC4gRHJhZyBhbmQgZHJvcCBpcyBydW5uaW5nIHZpYSBmaWxlIGFwaS5cbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG52YXIgY29uc3RzID0gcmVxdWlyZSgnLi4vY29uc3RzJyk7XG5cbi8qKlxuICogTWFrZXMgZHJhZyBhbmQgZHJvcCBhcmVhLCB0aGUgZHJvcHBlZCBmaWxlIGlzIGFkZGVkIHZpYSBldmVudCBkcm9wIGV2ZW50LlxuICogQHBhcmFtIHtVcGxvYWRlcn0gdXBsb2FkZXIgLSBVcGxvYWRlclxuICogQGNsYXNzIERyYWdBbmREcm9wXG4gKi9cbnZhciBEcmFnQW5kRHJvcCA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgRHJhZ0FuZERyb3AucHJvdG90eXBlICove1xuICAgIGluaXQ6IGZ1bmN0aW9uKHVwbG9hZGVyKSB7XG4gICAgICAgIHZhciBodG1sID0gY29uc3RzLkhUTUwuZHJhZ0FuZERyb3A7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERyb3Agem9uZSBqUXVlcnktZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kZWwgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDbGFzcyBmb3IgZHJvcCBlbmFibGVkXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9lbmFibGVDbGFzcyA9IGNvbnN0cy5DT05GLkRST1BfRU5BQkxFRF9DTEFTUztcblxuICAgICAgICB0aGlzLl9yZW5kZXIoaHRtbCwgdXBsb2FkZXIpO1xuICAgICAgICB0aGlzLl9hZGRFdmVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXJzIGRyYWcgYW5kIGRyb3AgYXJlYVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBodG1sIFRoZSBodG1sIHN0cmluZyB0byBtYWtlIGRhcmcgem9uZVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB1cGxvYWRlciBUaGUgY29yZSBpbnN0YW5jZSBvZiB0aGlzIGNvbXBvbmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbmRlcjogZnVuY3Rpb24oaHRtbCwgdXBsb2FkZXIpIHtcbiAgICAgICAgdGhpcy4kZWwgPSAkKGh0bWwpXG4gICAgICAgICAgICAuYXBwZW5kVG8odXBsb2FkZXIuJGVsKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkcyBkcmFnIGFuZCBkcm9wIGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbC5vbignZHJhZ2VudGVyJywgJC5wcm94eSh0aGlzLm9uRHJhZ0VudGVyLCB0aGlzKSk7XG4gICAgICAgIHRoaXMuJGVsLm9uKCdkcmFnb3ZlcicsICQucHJveHkodGhpcy5vbkRyYWdPdmVyLCB0aGlzKSk7XG4gICAgICAgIHRoaXMuJGVsLm9uKCdkcm9wJywgJC5wcm94eSh0aGlzLm9uRHJvcCwgdGhpcykpO1xuICAgICAgICB0aGlzLiRlbC5vbignZHJhZ2xlYXZlJywgJC5wcm94eSh0aGlzLm9uRHJhZ0xlYXZlLCB0aGlzKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEhhbmRsZXMgZHJhZ2VudGVyIGV2ZW50XG4gICAgICogQHBhcmFtIHtFdmVudH0gZSAtIEV2ZW50XG4gICAgICovXG4gICAgb25EcmFnRW50ZXI6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLl9lbmFibGUoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlcyBkcmFnb3ZlciBldmVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGUgLSBFdmVudFxuICAgICAqL1xuICAgIG9uRHJhZ092ZXI6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGVzIGRyYWdsZWF2ZSBldmVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGUgLSBFdmVudFxuICAgICAqL1xuICAgIG9uRHJhZ0xlYXZlOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgdGhpcy5fZGlzYWJsZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGVzIGRyb3AgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBlIC0gRXZlbnRcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gRmFsc2VcbiAgICAgKi9cbiAgICBvbkRyb3A6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIGZpbGVzID0gdHVpLnV0aWwucGljayhlLCAnb3JpZ2luYWxFdmVudCcsICdkYXRhVHJhbnNmZXInLCAnZmlsZXMnKTtcblxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuX2Rpc2FibGUoKTtcbiAgICAgICAgdGhpcy5maXJlKCdkcm9wJywgZmlsZXMpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEVuYWJsZSBkcm9wem9uZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2VuYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsLmFkZENsYXNzKHRoaXMuX2VuYWJsZUNsYXNzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGlzYWJsZSBkcm9wb256ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2Rpc2FibGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbC5yZW1vdmVDbGFzcyh0aGlzLl9lbmFibGVDbGFzcyk7XG4gICAgfVxufSk7XG5cbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihEcmFnQW5kRHJvcCk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJhZ0FuZERyb3A7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgRnJvbS12aWV3IG1ha2VzIGEgZm9ybSBieSB0ZW1wbGF0ZS4gQWRkIGV2ZW50cyBmb3IgZmlsZSB1cGxvYWQuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIGNvbnN0cyA9IHJlcXVpcmUoJy4uL2NvbnN0cycpLFxuICAgIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxudmFyIGlzU3VwcG9ydEZvcm1EYXRhID0gdXRpbHMuaXNTdXBwb3J0Rm9ybURhdGEoKSxcbiAgICBISURERU5fRklMRV9JTlBVVF9DTEFTUyA9IGNvbnN0cy5DT05GLkhJRERFTl9GSUxFX0lOUFVUX0NMQVNTO1xuXG4vKipcbiAqIFRoaXMgdmlldyBjb250cm9sIGlucHV0IGVsZW1lbnQgdHlwZWQgZmlsZS5cbiAqIEBwYXJhbSB7VXBsb2FkZXJ9IHVwbG9hZGVyIC0gVXBsb2FkZXIgaW5zdGFuY2VcbiAqIEBjb25zdHJ1Y3RvciBWaWV3LkZvcm1cbiAqL1xudmFyIEZvcm0gPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKipAbGVuZHMgVmlldy5Gb3JtLnByb3RvdHlwZSAqKi97XG4gICAgaW5pdDogZnVuY3Rpb24odXBsb2FkZXIpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZpbGUgdXBsb2FkZXJcbiAgICAgICAgICogQHR5cGUge1VwbG9hZGVyfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fdXBsb2FkZXIgPSB1cGxvYWRlcjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSHRtbCB0ZW1wbGF0ZXNcbiAgICAgICAgICogQHR5cGUge09iamVjdC48c3RyaW5nLCBzdHJpbmc+fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5faHRtbCA9IHRoaXMuX3NldFRlbXBsYXRlKHVwbG9hZGVyLnRlbXBsYXRlKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRm9ybSBlbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiRlbCA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZpbGUgaW5wdXQgZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kZmlsZUlucHV0ID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU3VibWl0IGVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJHN1Ym1pdCA9IG51bGw7XG5cbiAgICAgICAgaWYgKGlzU3VwcG9ydEZvcm1EYXRhKSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFdoZXRoZXIgdGhlIGZpbGUgaW5wdXQgaXMgbXVsdGlwbGVcbiAgICAgICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5faXNNdWx0aXBsZSA9IHVwbG9hZGVyLmlzTXVsdGlwbGU7XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogV2hldGhlciB0aGUgZmlsZSBpbnB1dCBhY2NlcHRzIGZvbGRlclxuICAgICAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLl91c2VGb2xkZXIgPSB1cGxvYWRlci51c2VGb2xkZXI7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9yZW5kZXIoe1xuICAgICAgICAgICAgYWN0aW9uOiB1cGxvYWRlci51cmwuc2VuZCxcbiAgICAgICAgICAgIG1ldGhvZDogJ3Bvc3QnLFxuICAgICAgICAgICAgZW5jdHlwZTogJ211bHRpcGFydC9mb3JtLWRhdGEnLFxuICAgICAgICAgICAgdGFyZ2V0OiBpc1N1cHBvcnRGb3JtRGF0YSA/ICcnIDogdXBsb2FkZXIuZm9ybVRhcmdldFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVuZGVyIGZvcm0gZWxlbWVudFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBhdHRyaWJ1dGVzIC0gRm9ybSBhdHRyaWJ1dGVzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVuZGVyOiBmdW5jdGlvbihhdHRyaWJ1dGVzKSB7XG4gICAgICAgIHZhciB1cGxvYWRlciA9IHRoaXMuX3VwbG9hZGVyLFxuICAgICAgICAgICAgJGZpbGVJbnB1dCA9IHRoaXMuX2NyZWF0ZUZpbGVJbnB1dCgpLFxuICAgICAgICAgICAgJGVsID0gJCh0aGlzLl9odG1sLmZvcm0pXG4gICAgICAgICAgICAgICAgLmFwcGVuZCgkZmlsZUlucHV0KVxuICAgICAgICAgICAgICAgIC5hdHRyKGF0dHJpYnV0ZXMpO1xuXG4gICAgICAgIHRoaXMuJGZpbGVJbnB1dCA9ICRmaWxlSW5wdXQ7XG4gICAgICAgIHRoaXMuJGVsID0gJGVsO1xuXG4gICAgICAgIGlmICh1cGxvYWRlci5pc0JhdGNoVHJhbnNmZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldFN1Ym1pdEVsZW1lbnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1cGxvYWRlci5pc0Nyb3NzRG9tYWluICYmICFpc1N1cHBvcnRGb3JtRGF0YSkge1xuICAgICAgICAgICAgdGhpcy5fc2V0SGlkZGVuSW5wdXRGb3JDT1JTKCk7XG4gICAgICAgIH1cbiAgICAgICAgdXBsb2FkZXIuJGVsLmFwcGVuZCh0aGlzLiRlbCk7XG5cbiAgICAgICAgdGhpcy5fYWRkRXZlbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHN1Ym1pdCBlbGVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0U3VibWl0RWxlbWVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJHN1Ym1pdCA9ICQodGhpcy5faHRtbC5zdWJtaXQpO1xuICAgICAgICB0aGlzLiRzdWJtaXQuYXBwZW5kVG8odGhpcy4kZWwpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgaGlkZGVuIGlucHV0IGVsZW1lbnQgZm9yIENPUlMuXG4gICAgICogIEhpZGRlbiBpbnB1dCBvZiBQb3N0TWVzc2FnZSBvciBSZWRpcmVjdFVSTC5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRIaWRkZW5JbnB1dEZvckNPUlM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcHJvcHMsICRoaWRkZW5JbnB1dCxcbiAgICAgICAgICAgIHVwbG9hZGVyID0gdGhpcy5fdXBsb2FkZXIsXG4gICAgICAgICAgICByZWRpcmVjdFVSTCA9IHVwbG9hZGVyLnJlZGlyZWN0VVJMO1xuXG4gICAgICAgIGlmICh1cGxvYWRlci5pc1N1cHBvcnRQb3N0TWVzc2FnZSkgeyAvLyBmb3IgSUU4LCA5XG4gICAgICAgICAgICBwcm9wcyA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnbWVzc2FnZVRhcmdldCcsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGxvY2F0aW9uLnByb3RvY29sICsgJy8vJyArIGxvY2F0aW9uLmhvc3RcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAocmVkaXJlY3RVUkwpIHsgLy8gZm9yIElFN1xuICAgICAgICAgICAgcHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3JlZGlyZWN0VVJMJyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogcmVkaXJlY3RVUkxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvcHMpIHtcbiAgICAgICAgICAgICRoaWRkZW5JbnB1dCA9ICQodXRpbHMudGVtcGxhdGUocHJvcHMsIHRoaXMuX2h0bWwuaGlkZGVuSW5wdXQpKTtcbiAgICAgICAgICAgICRoaWRkZW5JbnB1dC5hcHBlbmRUbyh0aGlzLiRlbCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGFsbCBvZiBpbnB1dCBlbGVtZW50cyBodG1sIHN0cmluZ3MuXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW3RlbXBsYXRlXSBUaGUgdGVtcGxhdGUgaXMgc2V0IGZvcm0gY3VzdG9tZXIuXG4gICAgICogQHJldHVybiB7T2JqZWN0LjxzdHJpbmcsIHN0cmluZz59IFRoZSBodG1sIHRlbXBsYXRlIHN0cmluZyBzZXQgZm9yIGZvcm0uXG4gICAgICovXG4gICAgX3NldFRlbXBsYXRlOiBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuICAgICAgICByZXR1cm4gdHVpLnV0aWwuZXh0ZW5kKHt9LCBjb25zdHMuSFRNTCwgdGVtcGxhdGUpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlcyBhbmQgcmV0dXJucyBqcXVlcnkgZWxlbWVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHJldHVybiB7alF1ZXJ5fSBUaGUganF1ZXJ5IG9iamVjdCB3cmFwcGluZyBvcmlnaW5hbCBpbnB1dCBlbGVtZW50XG4gICAgICovXG4gICAgX2NyZWF0ZUZpbGVJbnB1dDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtYXAgPSB7XG4gICAgICAgICAgICBtdWx0aXBsZTogdGhpcy5faXNNdWx0aXBsZSA/ICdtdWx0aXBsZScgOiAnJyxcbiAgICAgICAgICAgIGZpbGVGaWVsZDogdGhpcy5fdXBsb2FkZXIuZmlsZUZpZWxkLFxuICAgICAgICAgICAgZGlyZWN0b3J5OiB0aGlzLl91c2VGb2xkZXIgPyAnZGlyZWN0b3J5IG1vemRpcmVjdG9yeSB3ZWJraXRkaXJlY3RvcnknIDogJydcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gJCh1dGlscy50ZW1wbGF0ZShtYXAsIHRoaXMuX2h0bWwuZmlsZUlucHV0KSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZEV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX3VwbG9hZGVyLmlzQmF0Y2hUcmFuc2Zlcikge1xuICAgICAgICAgICAgdGhpcy4kZWwub24oJ3N1Ym1pdCcsICQucHJveHkodGhpcy5maXJlLCB0aGlzLCAnc3VibWl0JykpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2FkZElucHV0RXZlbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGNoYW5nZSBldmVudCB0byBmaWxlIGlucHV0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkSW5wdXRFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGZpbGVJbnB1dC5vbignY2hhbmdlJywgJC5wcm94eSh0aGlzLm9uQ2hhbmdlLCB0aGlzKSk7XG4gICAgICAgIHRoaXMuJGZpbGVJbnB1dC5hdHRyKCd0aXRsZScsICcgJyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50LUhhbmRsZSBmb3IgaW5wdXQgZWxlbWVudCBjaGFuZ2VcbiAgICAgKi9cbiAgICBvbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy4kZmlsZUlucHV0WzBdLnZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5maXJlKCdjaGFuZ2UnKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVzZXQgSW5wdXQgZWxlbWVudCB0byBzYXZlIHdob2xlIGlucHV0PWZpbGUgZWxlbWVudC5cbiAgICAgKi9cbiAgICByZXNldEZpbGVJbnB1dDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGZpbGVJbnB1dC5yZW1vdmUoKTtcbiAgICAgICAgdGhpcy4kZmlsZUlucHV0ID0gdGhpcy5fY3JlYXRlRmlsZUlucHV0KCk7XG4gICAgICAgIGlmICh0aGlzLiRzdWJtaXQpIHtcbiAgICAgICAgICAgIHRoaXMuJHN1Ym1pdC5iZWZvcmUodGhpcy4kZmlsZUlucHV0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuJGVsLmFwcGVuZCh0aGlzLiRmaWxlSW5wdXQpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2FkZElucHV0RXZlbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgZmlsZSBpbnB1dCBlbGVtZW50c1xuICAgICAqL1xuICAgIGNsZWFyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwuZmluZCgnLicgKyBISURERU5fRklMRV9JTlBVVF9DTEFTUykucmVtb3ZlKCk7XG4gICAgICAgIHRoaXMucmVzZXRGaWxlSW5wdXQoKTtcbiAgICB9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKEZvcm0pO1xubW9kdWxlLmV4cG9ydHMgPSBGb3JtO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEl0ZW1WaWV3IG1ha2UgZWxlbWVudCB0byBkaXNwbGF5IGFkZGVkIGZpbGUgaW5mb3JtYXRpb24uIEl0IGhhcyBhdHRhY2hlZCBmaWxlIElEIHRvIHJlcXVlc3QgZm9yIHJlbW92ZS5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG52YXIgY29uc3RzID0gcmVxdWlyZSgnLi4vY29uc3RzJyksXG4gICAgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG52YXIgUkVNT1ZFX0JVVFRPTl9DTEFTUyA9IGNvbnN0cy5DT05GLlJFTU9WRV9CVVRUT05fQ0xBU1M7XG5cbi8qKlxuICogQ2xhc3Mgb2YgaXRlbSB0aGF0IGlzIG1lbWJlciBvZiBmaWxlIGxpc3QuXG4gKiBAY2xhc3MgSXRlbVxuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnNcbiAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5uYW1lIEZpbGUgbmFtZVxuICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnR5cGUgRmlsZSB0eXBlXG4gKiAgQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMucm9vdCBMaXN0IGluc3RhbmNlXG4gKiAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmlkXSBVbmlxdWUga2V5LCB3aGF0IGlmIHRoZSBrZXkgaXMgbm90IGV4aXN0IGlkIHdpbGwgYmUgdGhlIGZpbGUgbmFtZS5cbiAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGVsZXRlQnV0dG9uQ2xhc3NOYW1lPSd1cGxvYWRlcl9idG5fZGVsZXRlJ10gVGhlIGNsYXNzIG5hbWUgaXMgZm9yIGRlbGV0ZSBidXR0b24uXG4gKiAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnRlbXBsYXRlXSBpdGVtIHRlbXBsYXRlXG4gKiAgQHBhcmFtIHsoc3RyaW5nfG51bWJlcil9IFtvcHRpb25zLnNpemVdIEZpbGUgc2l6ZSAoYnV0IGllIGxvdyBicm93c2VyLCB4LWRvbWFpbilcbiAqL1xudmFyIEl0ZW0gPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIEl0ZW0ucHJvdG90eXBlICoqLyB7XG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICAvKipcbiAgICAgICAgICogSXRlbTogTEkgZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kZWwgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJdGVtOiByZW1vdmUgYnV0dG9uXG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiRyZW1vdmVCdG4gPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJdGVtIG5hbWVcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubmFtZSA9IG9wdGlvbnMubmFtZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSXRlbSBpZFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pZCA9IG9wdGlvbnMuaWQgfHwgb3B0aW9ucy5uYW1lO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJdGVtIHNpemVcbiAgICAgICAgICogQHR5cGUge251bWJlcnxzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnNpemUgPSBvcHRpb25zLnNpemUgfHwgJyc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEl0ZW0gdHlwZVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy50eXBlID0gdGhpcy5fZXh0cmFjdEV4dGVuc2lvbigpO1xuXG4gICAgICAgIHRoaXMucmVuZGVyKG9wdGlvbnMucm9vdC4kZWwpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgbWFraW5nIGZvcm0gcGFkZGluZyB3aXRoIGRlbGV0YWJsZSBpdGVtXG4gICAgICogQHBhcmFtIHtqUXVlcnl9ICR0YXJnZXQgLSBUYXJnZXQgTGlzdCBlbGVtZW50XG4gICAgICovXG4gICAgcmVuZGVyOiBmdW5jdGlvbigkdGFyZ2V0KSB7XG4gICAgICAgIHZhciBodG1sID0gdGhpcy5fZ2V0SHRtbCgpLFxuICAgICAgICAgICAgcmVtb3ZlQnV0dG9uSFRNTCA9IHV0aWxzLnRlbXBsYXRlKHtcbiAgICAgICAgICAgICAgICB0ZXh0OiAnUmVtb3ZlJ1xuICAgICAgICAgICAgfSwgY29uc3RzLkhUTUwuYnV0dG9uKSxcbiAgICAgICAgICAgICRyZW1vdmVCdG4gPSAkKHJlbW92ZUJ1dHRvbkhUTUwpO1xuXG4gICAgICAgIHRoaXMuJHJlbW92ZUJ0biA9ICRyZW1vdmVCdG5cbiAgICAgICAgICAgIC5hZGRDbGFzcyhSRU1PVkVfQlVUVE9OX0NMQVNTKTtcblxuICAgICAgICB0aGlzLiRlbCA9ICQoaHRtbClcbiAgICAgICAgICAgIC5hcHBlbmQoJHJlbW92ZUJ0bilcbiAgICAgICAgICAgIC5hcHBlbmRUbygkdGFyZ2V0KTtcblxuICAgICAgICB0aGlzLl9hZGRFdmVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFeHRyYWN0IGZpbGUgZXh0ZW5zaW9uIGJ5IG5hbWVcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBGaWxlIGV4dGVuc2lvblxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2V4dHJhY3RFeHRlbnNpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5uYW1lLnNwbGl0KCcuJykucG9wKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBsaXN0SXRlbSBlbGVtZW50IEhUTUxcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBIVE1MXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0SHRtbDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtYXAgPSB7XG4gICAgICAgICAgICBmaWxldHlwZTogdGhpcy50eXBlLFxuICAgICAgICAgICAgZmlsZW5hbWU6IHRoaXMubmFtZSxcbiAgICAgICAgICAgIGZpbGVzaXplOiB0aGlzLnNpemUgPyB1dGlscy5nZXRGaWxlU2l6ZVdpdGhVbml0KHRoaXMuc2l6ZSkgOiAnJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB1dGlscy50ZW1wbGF0ZShtYXAsIGNvbnN0cy5IVE1MLmxpc3RJdGVtKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IGhhbmRsZXIgb24gZGVsZXRlIGJ1dHRvbi5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJHJlbW92ZUJ0bi5vbignY2xpY2snLCAkLnByb3h5KHRoaXMuX29uQ2xpY2tFdmVudCwgdGhpcykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudC1oYW5kbGUgZm9yIGRlbGV0ZSBidXR0b24gY2xpY2tlZC5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vbkNsaWNrRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZScsIHtcbiAgICAgICAgICAgIG5hbWUgOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICBpZCA6IHRoaXMuaWQsXG4gICAgICAgICAgICB0eXBlOiAncmVtb3ZlJ1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGVzdHJveSBpdGVtXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsLnJlbW92ZSgpO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oSXRlbSk7XG5tb2R1bGUuZXhwb3J0cyA9IEl0ZW07XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmlsZUxpc3RWaWV3IGxpc3RpbmcgZmlsZXMgYW5kIGRpc3BsYXkgc3RhdGVzKGxpa2Ugc2l6ZSwgY291bnQpLlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG52YXIgSXRlbSA9IHJlcXVpcmUoJy4vaXRlbScpO1xuXG4vKipcbiAqIExpc3QgaGFzIGl0ZW1zLiBJdCBjYW4gYWRkIGFuZCByZW1vdmUgaXRlbSwgYW5kIGdldCB0b3RhbCB1c2FnZS5cbiAqIEBwYXJhbSB7VXBsb2FkZXJ9IHVwbG9hZGVyIC0gVXBsb2FkZXJcbiAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsIGpRdWVyeT59IGxpc3RJbmZvXG4gKiAgQHBhcmFtIHtqUXVlcnl9IGxpc3RJbmZvLmxpc3QgLSBMaXN0IGpxdWVyeS1lbGVtZW50XG4gKiAgQHBhcmFtIHtqUXVlcnl9IGxpc3RJbmZvLmNvdW50IC0gQ291bnQganF1ZXJ5LWVsZW1lbnRcbiAqICBAcGFyYW0ge2pRdWVyeX0gbGlzdEluZm8uc2l6ZSAtIFNpemUganF1ZXJ5LWVsZW1lbnRcbiAqIEBjbGFzcyBMaXN0XG4gKi9cbnZhciBMaXN0ID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBMaXN0LnByb3RvdHlwZSAqL3tcbiAgICBpbml0IDogZnVuY3Rpb24obGlzdEluZm8pIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEl0ZW1zXG4gICAgICAgICAqIEB0eXBlIHtBcnJheS48SXRlbT59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLml0ZW1zID0gW107XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGpRdWVyeS1lbGVtZW50IG9mIExpc3RcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJGVsID0gbGlzdEluZm8ubGlzdDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogalF1ZXJ5LWVsZW1lbnQgb2YgY291bnRcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJGNvdW50ZXIgPSBsaXN0SW5mby5jb3VudDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogalF1ZXJ5LWVsZW1lbnQgb2YgdG90YWwgc2l6ZVxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kc2l6ZSA9IGxpc3RJbmZvLnNpemU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBpdGVtIGxpc3RcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSAtIEZpbGUgaW5mb3JtYXRpb24ocykgd2l0aCB0eXBlXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtkYXRhLnR5cGVdIC0gJ3JlbW92ZScgb3Igbm90LlxuICAgICAqL1xuICAgIHVwZGF0ZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBpZiAoZGF0YS50eXBlID09PSAncmVtb3ZlJykge1xuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlRmlsZUl0ZW0oZGF0YS5pZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9hZGRGaWxlSXRlbXMoZGF0YSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW1zIHRvdGFsIGNvdW50LCB0b3RhbCBzaXplIGluZm9ybWF0aW9uLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbaW5mb10gQSBpbmZvcm1hdGlvbiB0byB1cGRhdGUgbGlzdC5cbiAgICAgKiAgQHBhcmFtIHthcnJheX0gaW5mby5pdGVtcyBUaGUgbGlzdCBvZiBmaWxlIGluZm9ybWF0aW9uLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gaW5mby5zaXplIFRoZSB0b3RhbCBzaXplLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gaW5mby5jb3VudCBUaGUgY291bnQgb2YgZmlsZXMuXG4gICAgICovXG4gICAgdXBkYXRlVG90YWxJbmZvOiBmdW5jdGlvbihpbmZvKSB7XG4gICAgICAgIGlmIChpbmZvKSB7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVUb3RhbENvdW50KGluZm8uY291bnQpO1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlVG90YWxVc2FnZShpbmZvLnNpemUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlVG90YWxDb3VudCgpO1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlVG90YWxVc2FnZSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBpdGVtcyB0b3RhbCBjb3VudCBhbmQgcmVmcmVzaCBlbGVtZW50XG4gICAgICogQHBhcmFtIHsobnVtYmVyfHN0cmluZyl9IFtjb3VudF0gVG90YWwgZmlsZSBjb3VudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwZGF0ZVRvdGFsQ291bnQ6IGZ1bmN0aW9uKGNvdW50KSB7XG4gICAgICAgIGlmICghdHVpLnV0aWwuaXNFeGlzdHkoY291bnQpKSB7XG4gICAgICAgICAgICBjb3VudCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4kY291bnRlci5odG1sKGNvdW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW1zIHRvdGFsIHNpemUgYW5kIHJlZnJlc2ggZWxlbWVudFxuICAgICAqIEBwYXJhbSB7KG51bWJlcnxzdHJpbmcpfSBbc2l6ZV0gVG90YWwgZmlsZXMgc2l6ZXNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF91cGRhdGVUb3RhbFVzYWdlOiBmdW5jdGlvbihzaXplKSB7XG4gICAgICAgIGlmICghdHVpLnV0aWwuaXNFeGlzdHkoc2l6ZSkpIHtcbiAgICAgICAgICAgIHNpemUgPSB0aGlzLl9nZXRTdW1BbGxJdGVtVXNhZ2UoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHVpLnV0aWwuaXNOdW1iZXIoc2l6ZSkgJiYgIWlzTmFOKHNpemUpKSB7XG4gICAgICAgICAgICBzaXplID0gdXRpbHMuZ2V0RmlsZVNpemVXaXRoVW5pdChzaXplKTtcbiAgICAgICAgICAgIHRoaXMuJHNpemUuaHRtbChzaXplKTtcbiAgICAgICAgICAgIHRoaXMuJHNpemUuc2hvdygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kc2l6ZS5oaWRlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3VtIHNpemVzIG9mIGFsbCBpdGVtcy5cbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSB0b3RhbFNpemVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRTdW1BbGxJdGVtVXNhZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaXRlbXMgPSB0aGlzLml0ZW1zLFxuICAgICAgICAgICAgdG90YWxVc2FnZSA9IDA7XG5cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChpdGVtcywgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgdG90YWxVc2FnZSArPSBwYXJzZUZsb2F0KGl0ZW0uc2l6ZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0b3RhbFVzYWdlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZmlsZSBpdGVtc1xuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXQgVGFyZ2V0IGl0ZW0gaW5mb3JtYXRpb24uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRmlsZUl0ZW1zOiBmdW5jdGlvbih0YXJnZXQpIHtcbiAgICAgICAgaWYgKCF0dWkudXRpbC5pc0FycmF5U2FmZSh0YXJnZXQpKSB7IC8vIGZvciB0YXJnZXQgZnJvbSBpZnJhbWUsIHVzZSBcImlzQXJyYXlTYWZlXCJcbiAgICAgICAgICAgIHRhcmdldCA9IFt0YXJnZXRdO1xuICAgICAgICB9XG4gICAgICAgIHR1aS51dGlsLmZvckVhY2godGFyZ2V0LCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2godGhpcy5fY3JlYXRlSXRlbShkYXRhKSk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZmlsZSBpdGVtXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gVGhlIGl0ZW0gaWQgdG8gcmVtb3ZlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlRmlsZUl0ZW06IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHR1aS51dGlsLmZvckVhY2godGhpcy5pdGVtcywgZnVuY3Rpb24oaXRlbSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmIChpZCA9PT0gaXRlbS5pZCkge1xuICAgICAgICAgICAgICAgIGl0ZW0uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgaXRlbSBCeSBEYXRhXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSBEYXRhIGZvciBsaXN0IGl0ZW1zXG4gICAgICogQHJldHVybnMge0l0ZW19IEl0ZW1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jcmVhdGVJdGVtOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBpdGVtID0gbmV3IEl0ZW0oe1xuICAgICAgICAgICAgcm9vdDogdGhpcyxcbiAgICAgICAgICAgIG5hbWU6IGRhdGEubmFtZSxcbiAgICAgICAgICAgIHNpemU6IGRhdGEuc2l6ZSxcbiAgICAgICAgICAgIGlkOiBkYXRhLmlkXG4gICAgICAgIH0pO1xuICAgICAgICBpdGVtLm9uKCdyZW1vdmUnLCB0aGlzLl9yZW1vdmVGaWxlLCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIFJlbW92ZSBGaWxlXG4gICAgICogQHBhcmFtIHtJdGVtfSBpdGVtIC0gSXRlbVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbW92ZUZpbGU6IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgdGhpcy5maXJlKCdyZW1vdmUnLCBpdGVtKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgbGlzdFxuICAgICAqL1xuICAgIGNsZWFyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaCh0aGlzLml0ZW1zLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICBpdGVtLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuaXRlbXMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy51cGRhdGVUb3RhbEluZm8oKTtcbiAgICB9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKExpc3QpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IExpc3Q7XG4iXX0=
