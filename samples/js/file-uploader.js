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
            filename;

        if (!id) {
            return;
        }
        filename = inputFileEl.value;
        this.files[id + filename] = inputFileEl;
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
        this.isBatchTransfer = options.isBatchTransfer;

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
     * Makes element to be target of submit form element.
     * @returns {jQuery} Target form: jquery-element
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25zdHMuanMiLCJzcmMvanMvcG9vbC5qcyIsInNyYy9qcy9yZXF1ZXN0ZXIvbW9kZXJuLmpzIiwic3JjL2pzL3JlcXVlc3Rlci9vbGQuanMiLCJzcmMvanMvdXBsb2FkZXIuanMiLCJzcmMvanMvdXRpbHMuanMiLCJzcmMvanMvdmlldy9kcmFnLmpzIiwic3JjL2pzL3ZpZXcvZm9ybS5qcyIsInNyYy9qcy92aWV3L2l0ZW0uanMiLCJzcmMvanMvdmlldy9saXN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidHVpLnV0aWwuZGVmaW5lTmFtZXNwYWNlKCd0dWkuY29tcG9uZW50LlVwbG9hZGVyJywgcmVxdWlyZSgnLi9zcmMvanMvdXBsb2FkZXIuanMnKSk7XG5cbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBDb25maWd1cmF0aW9uIG9yIGRlZmF1bHQgdmFsdWVzLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBVcGxvYWRlciBjb25maWdcbiAqL1xubW9kdWxlLmV4cG9ydHMuQ09ORiA9IHtcbiAgICBGSUxFX0ZJTEVEX05BTUU6ICd1c2VyZmlsZVtdJyxcbiAgICBEUk9QX0VOQUJMRURfQ0xBU1M6ICdkcm9wRW5hYmxlZCcsXG4gICAgSElEREVOX0ZJTEVfSU5QVVRfQ0xBU1M6ICdoaWRkZW5GaWxlSW5wdXQnLFxuICAgIFJFUVVFU1RFUl9UWVBFX01PREVSTjogJ21vZGVyblJlcXVlc3RlcicsXG4gICAgUkVRVUVTVEVSX1RZUEVfT0xEOiAnb2xkUmVxdWVzdGVyJyxcbiAgICBGT1JNX1RBUkdFVF9OQU1FOiAnaGlkZGVuRnJhbWUnLFxuICAgIFJFTU9WRV9CVVRUT05fQ0xBU1M6ICdyZW1vdmVCdXR0b24nXG59O1xuXG4vKipcbiAqIERlZmF1bHQgSHRtbHNcbiAqIEB0eXBlIHt7aW5wdXQ6IHN0cmluZywgaXRlbTogc3RyaW5nfX1cbiAqL1xubW9kdWxlLmV4cG9ydHMuSFRNTCA9IHtcbiAgICBmb3JtOiBbXG4gICAgICAgICc8Zm9ybSBlbmN0eXBlPVwibXVsdGlwYXJ0L2Zvcm0tZGF0YVwiIGlkPVwidHVpLXVwbG9hZGVyLWZvcm1cIiBtZXRob2Q9XCJwb3N0XCI+JyxcbiAgICAgICAgJzwvZm9ybT4nXG4gICAgXS5qb2luKCcnKSxcbiAgICBzdWJtaXQ6ICc8YnV0dG9uIGNsYXNzPVwiYmF0Y2hTdWJtaXRcIiB0eXBlPVwic3VibWl0XCI+U0VORDwvYnV0dG9uPicsXG4gICAgZmlsZUlucHV0OiAnPGlucHV0IHR5cGU9XCJmaWxlXCIgaWQ9XCJmaWxlQXR0YWNoXCIge3tkaXJlY3Rvcnl9fSBuYW1lPVwie3tmaWxlRmllbGR9fVwiIHt7bXVsdGlwbGV9fSAvPicsXG4gICAgaGlkZGVuSW5wdXQ6ICc8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJ7e25hbWV9fVwiIHZhbHVlPVwie3t2YWx1ZX19XCI+JyxcbiAgICBidXR0b246ICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIj57e3RleHR9fTwvYnV0dG9uPicsXG4gICAgbGlzdEl0ZW06IFtcbiAgICAgICAgJzxsaSBjbGFzcz1cImZpbGV0eXBlRGlzcGxheUNsYXNzXCI+JyxcbiAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImZpbGVpY29uIHt7ZmlsZXR5cGV9fVwiPnt7ZmlsZXR5cGV9fTwvc3Bhbj4nLFxuICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwiZmlsZV9uYW1lXCI+e3tmaWxlbmFtZX19PC9zcGFuPicsXG4gICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJmaWxlX3NpemVcIj57e2ZpbGVzaXplfX08L3NwYW4+JyxcbiAgICAgICAgJzwvbGk+J1xuICAgIF0uam9pbignJyksXG4gICAgZHJhZ0FuZERyb3A6ICc8ZGl2IGNsYXNzPVwiZHJvcHpvbmVcIj48L2Rpdj4nXG59O1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgaXMgbWFuYWdlciBvZiBpbnB1dCBlbGVtZW50cyB0aGF0IGFjdCBsaWtlIGZpbGUgcG9vbC5cbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBjb25zdHMgPSByZXF1aXJlKCcuL2NvbnN0cycpO1xuXG52YXIgSElEREVOX0ZJTEVfSU5QVVRfQ0xBU1MgPSBjb25zdHMuQ09ORi5ISURERU5fRklMRV9JTlBVVF9DTEFTUyxcbiAgICBmb3JFYWNoID0gdHVpLnV0aWwuZm9yRWFjaCxcbiAgICBoYXNTdGFtcCA9IHR1aS51dGlsLmhhc1N0YW1wLFxuICAgIHN0YW1wID0gdHVpLnV0aWwuc3RhbXA7XG5cbi8qKlxuICogVGhlIHBvb2wgZm9yIHNhdmUgZmlsZXMuXG4gKiBJdCdzIG9ubHkgZm9yIGlucHV0W2ZpbGVdIGVsZW1lbnQgc2F2ZSBhdCBicm93c2VyIHRoYXQgZG9lcyBub3Qgc3VwcG9ydCBmaWxlIGFwaS5cbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHBsYW5ldCAtIEZvcm0gZWxlbWVudFxuICogQGNsYXNzIFBvb2xcbiAqL1xudmFyIFBvb2wgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFBvb2wucHJvdG90eXBlICove1xuICAgIGluaXQ6IGZ1bmN0aW9uKHBsYW5ldCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogU3VibWl0dGVyIGZvciBmaWxlIGVsZW1lbnQgdG8gc2VydmVyXG4gICAgICAgICAqIEZvcm0gZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnBsYW5ldCA9IHBsYW5ldDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRmlsZSBkYXRhIHN0cnVjdHVyZSBvYmplY3RcbiAgICAgICAgICogIGtleT1uYW1lIDogdmFsdWU9aXVwdXRbdHlwZT1maWxlXShFbGVtZW50KVxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5maWxlcyA9IHt9O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTYXZlIGEgaW5wdXQgZWxlbWVudFt0eXBlPWZpbGVdLCBhcyB2YWx1ZSBvZiBmaWxlIG5hbWUuXG4gICAgICogQHBhcmFtIHtIVE1MSW5wdXRFbGVtZW50fSBpbnB1dEZpbGVFbCBBIGlucHV0IGVsZW1lbnQgdGhhdCBoYXZlIHRvIGJlIHNhdmVkXG4gICAgICovXG4gICAgc3RvcmU6IGZ1bmN0aW9uKGlucHV0RmlsZUVsKSB7XG4gICAgICAgIHZhciBpZCA9IGhhc1N0YW1wKGlucHV0RmlsZUVsKSAmJiBzdGFtcChpbnB1dEZpbGVFbCksXG4gICAgICAgICAgICBmaWxlbmFtZTtcblxuICAgICAgICBpZiAoIWlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZmlsZW5hbWUgPSBpbnB1dEZpbGVFbC52YWx1ZTtcbiAgICAgICAgdGhpcy5maWxlc1tpZCArIGZpbGVuYW1lXSA9IGlucHV0RmlsZUVsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBpbnB1dCBlbGVtZW50W3R5cGU9ZmlsZV0gZnJvbSBwb29sLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgLSBBIGZpbGUgbmFtZSB0aGF0IGhhdmUgdG8gYmUgcmVtb3ZlZC5cbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSByZXN1bHRcbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAgICB2YXIga2V5ID0gcGFyYW1zLmlkICsgcGFyYW1zLm5hbWUsXG4gICAgICAgICAgICBlbGVtZW50ID0gdGhpcy5maWxlc1trZXldO1xuXG4gICAgICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVsZXRlIHRoaXMuZmlsZXNba2V5XTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEVtcHR5IHBvb2xcbiAgICAgKi9cbiAgICBlbXB0eTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZmlsZXMgPSB7fTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUGxhbnQgZmlsZXMgb24gcG9vbCB0byBmb3JtIGlucHV0XG4gICAgICovXG4gICAgcGxhbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcGxhbmV0ID0gdGhpcy5wbGFuZXQ7XG4gICAgICAgIGZvckVhY2godGhpcy5maWxlcywgZnVuY3Rpb24oZWxlbWVudCwga2V5KSB7XG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTmFtZSA9IEhJRERFTl9GSUxFX0lOUFVUX0NMQVNTO1xuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgcGxhbmV0LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuZmlsZXNba2V5XTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUG9vbDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNvbnN0cyA9IHJlcXVpcmUoJy4uL2NvbnN0cycpO1xuXG52YXIgVFlQRSA9IGNvbnN0cy5DT05GLlJFUVVFU1RFUl9UWVBFX01PREVSTixcbiAgICBmb3JFYWNoID0gdHVpLnV0aWwuZm9yRWFjaDtcblxuLyoqXG4gKiBNb2Rlcm4gcmVxdWVzdGVyXG4gKiBAcGFyYW0ge1VwbG9hZGVyfSB1cGxvYWRlciAtIFVwbG9hZGVyXG4gKiBAY2xhc3NcbiAqL1xudmFyIE1vZGVybiA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgTW9kZXJuLnByb3RvdHlwZSAqL3tcbiAgICBpbml0OiBmdW5jdGlvbih1cGxvYWRlcikge1xuICAgICAgICAvKipcbiAgICAgICAgICogVXBsb2FkZXJcbiAgICAgICAgICogQHR5cGUge1VwbG9hZGVyfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy51cGxvYWRlciA9IHVwbG9hZGVyO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGcm9tIHZpZXdcbiAgICAgICAgICogQHR5cGUge0Zvcm19XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZvcm1WaWV3ID0gdXBsb2FkZXIuZm9ybVZpZXc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExvY2FsIHBvb2wgZm9yIGZpbGVzXG4gICAgICAgICAqIEB0eXBlIHtBcnJheS48RmlsZT59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnBvb2wgPSBbXTtcblxuICAgICAgICBpZiAodXBsb2FkZXIuaXNCYXRjaFRyYW5zZmVyKSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE92ZXJyaWRlIHJlbW92ZSBmdW5jdGlvbiBmb3IgYmF0Y2ggdHJhbnNmZXJcbiAgICAgICAgICAgICAqIEB0eXBlIHtPbGQuX3JlbW92ZVdoZW5CYXRjaH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUgPSB0aGlzLl9yZW1vdmVXaGVuQmF0Y2g7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge3N0cmluZ30gUmVxdWVzdGVyIHR5cGVcbiAgICAgKi9cbiAgICBUWVBFOiBUWVBFLFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciBmb3IgdXBsb2FkIGVycm9yXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGpxWEhSIC0galF1ZXJ5IFhIUlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0dXMgLSBBamF4IFN0YXR1c1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtc2dUaHJvd24gLSBFcnJvciBtZXNzYWdlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfdXBsb2FkRXJyb3I6IGZ1bmN0aW9uKGpxWEhSLCBzdGF0dXMsIG1zZ1Rocm93bikge1xuICAgICAgICB0aGlzLmZpcmUoJ2Vycm9yJywge1xuICAgICAgICAgICAgc3RhdHVzOiBzdGF0dXMsXG4gICAgICAgICAgICBtZXNzYWdlOiBtc2dUaHJvd25cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgZm9yIHVwbG9hZCBzdWNjZXNzXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBVcGxvYWQgc3VjY2VzcyBkYXRhXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfdXBsb2FkU3VjY2VzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB0aGlzLmZpcmUoJ3VwbG9hZGVkJywgSlNPTi5wYXJzZShkYXRhKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN0b3JlIGZpbGVzIHRvIGxvY2FsIHBvb2xcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxGaWxlPiB8IEZpbGV9IFtmaWxlc10gLSBBIGZpbGUgb3IgZmlsZXNcbiAgICAgKi9cbiAgICBzdG9yZTogZnVuY3Rpb24oZmlsZXMpIHtcbiAgICAgICAgdmFyIHBvb2wgPSB0aGlzLnBvb2wsXG4gICAgICAgICAgICBzdGFtcCA9IHR1aS51dGlsLnN0YW1wLFxuICAgICAgICAgICAgZGF0YSA9IFtdO1xuICAgICAgICBmaWxlcyA9IHR1aS51dGlsLnRvQXJyYXkoZmlsZXMgfHwgdGhpcy5mb3JtVmlldy4kZmlsZUlucHV0WzBdLmZpbGVzKTtcblxuICAgICAgICBmb3JFYWNoKGZpbGVzLCBmdW5jdGlvbihmaWxlKSB7XG4gICAgICAgICAgICB2YXIgaWQgPSBzdGFtcChmaWxlKTtcbiAgICAgICAgICAgIHBvb2wucHVzaChmaWxlKTtcbiAgICAgICAgICAgIGRhdGEucHVzaCh7XG4gICAgICAgICAgICAgICAgaWQ6IGlkLFxuICAgICAgICAgICAgICAgIG5hbWU6IGZpbGUubmFtZSxcbiAgICAgICAgICAgICAgICBzaXplOiBmaWxlLnNpemVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmZvcm1WaWV3LnJlc2V0RmlsZUlucHV0KCk7XG4gICAgICAgIHRoaXMuZmlyZSgnc3RvcmVkJywgZGF0YSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwbG9hZCBhamF4XG4gICAgICovXG4gICAgdXBsb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGZvcm0gPSB0aGlzLmZvcm1WaWV3LiRlbC5jbG9uZSgpLFxuICAgICAgICAgICAgZmllbGQgPSB0aGlzLnVwbG9hZGVyLmZpbGVGaWVsZCxcbiAgICAgICAgICAgIGZvcm1EYXRhO1xuXG4gICAgICAgIGZvcm0uZmluZCgnaW5wdXRbdHlwZT1cImZpbGVcIl0nKS5yZW1vdmUoKTtcbiAgICAgICAgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoZm9ybSk7XG5cbiAgICAgICAgZm9yRWFjaCh0aGlzLnBvb2wsIGZ1bmN0aW9uKGZpbGUpIHtcbiAgICAgICAgICAgIGZvcm1EYXRhLmFwcGVuZChmaWVsZCwgZmlsZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHRoaXMudXBsb2FkZXIudXJsLnNlbmQsXG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICBkYXRhOiBmb3JtRGF0YSxcbiAgICAgICAgICAgIHN1Y2Nlc3M6ICQucHJveHkodGhpcy5fdXBsb2FkU3VjY2VzcywgdGhpcyksXG4gICAgICAgICAgICBlcnJvcjogJC5wcm94eSh0aGlzLl91cGxvYWRFcnJvciwgdGhpcyksXG4gICAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgICBjb250ZW50VHlwZTogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpbGUgKGFqYXgtanNvbnApXG4gICAgICogSXQgaXMgbm90IHVzZWQgZm9yIGJhdGNoIHRyYW5zZmVyLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgLSBQYXJhbWV0ZXJzIHRvIHJlbW92ZSBmaWxlXG4gICAgICovXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogdXBsb2FkZXIudXJsLnJlbW92ZSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbnAnLFxuICAgICAgICAgICAgZGF0YTogcGFyYW1zLFxuICAgICAgICAgICAgc3VjY2VzczogJC5wcm94eShmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgZGF0YS50eXBlID0gJ3JlbW92ZSc7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdyZW1vdmVkJywgZGF0YSk7XG4gICAgICAgICAgICB9LCB0aGlzKVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpbGUgKGFqYXgtanNvbnApXG4gICAgICogSXQgaXMgdXNlZCBmb3IgYmF0Y2ggdHJhbnNmZXIuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyAtIFBhcmFtZXRlcnMgdG8gcmVtb3ZlIGZpbGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW1vdmVXaGVuQmF0Y2g6IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAgICB2YXIgcG9vbCA9IHRoaXMucG9vbCxcbiAgICAgICAgICAgIGhhc1N0YW1wID0gdHVpLnV0aWwuaGFzU3RhbXAsXG4gICAgICAgICAgICBzdGFtcCA9IHR1aS51dGlsLnN0YW1wLFxuICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XG5cbiAgICAgICAgZm9yRWFjaChwb29sLCBmdW5jdGlvbihmaWxlLCBpbmRleCkge1xuICAgICAgICAgICAgaWYgKGhhc1N0YW1wKGZpbGUpICYmIChzdGFtcChmaWxlKSA9PT0gcGFyYW1zLmlkKSkge1xuICAgICAgICAgICAgICAgIHBvb2wuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5maXJlKCdyZW1vdmVkJywgdHVpLnV0aWwuZXh0ZW5kKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IHJlc3VsdCA/ICdzdWNjZXNzJyA6ICdmYWlsJ1xuICAgICAgICB9LCBwYXJhbXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgdGhlIHBvb2xcbiAgICAgKi9cbiAgICBjbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucG9vbC5sZW5ndGggPSAwO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oTW9kZXJuKTtcbm1vZHVsZS5leHBvcnRzID0gTW9kZXJuO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUG9vbCA9IHJlcXVpcmUoJy4uL3Bvb2wnKSxcbiAgICBjb25zdHMgPSByZXF1aXJlKCcuLi9jb25zdHMnKTtcblxudmFyIFRZUEUgPSBjb25zdHMuQ09ORi5SRVFVRVNURVJfVFlQRV9PTEQ7XG5cbi8qKlxuICogT2xkIHJlcXVlc3RlclxuICogQHBhcmFtIHtVcGxvYWRlcn0gdXBsb2FkZXIgLSBVcGxvYWRlclxuICogQGNsYXNzXG4gKi9cbnZhciBPbGQgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIE9sZC5wcm90b3R5cGUgKi97XG4gICAgaW5pdDogZnVuY3Rpb24odXBsb2FkZXIpIHtcbiAgICAgICAgdmFyICRoaWRkZW5GcmFtZSA9IHVwbG9hZGVyLiR0YXJnZXRGcmFtZSxcbiAgICAgICAgICAgIGZvcm1WaWV3ID0gdXBsb2FkZXIuZm9ybVZpZXc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFVwbG9hZGVyXG4gICAgICAgICAqIEB0eXBlIHtVcGxvYWRlcn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudXBsb2FkZXIgPSB1cGxvYWRlcjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRnJvbSB2aWV3XG4gICAgICAgICAqIEB0eXBlIHtGb3JtfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5mb3JtVmlldyA9IGZvcm1WaWV3O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMb2NhbCBwb29sIGZvciBmaWxlIGVsZW1lbnRzXG4gICAgICAgICAqIEB0eXBlIHtQb29sfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wb29sID0gbmV3IFBvb2woZm9ybVZpZXcuJGVsWzBdKTtcblxuICAgICAgICBpZiAodXBsb2FkZXIuaXNCYXRjaFRyYW5zZmVyKSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE92ZXJyaWRlIFVwbG9hZCBmdW5jdGlvbiBmb3IgYmF0Y2ggdHJhbnNmZXJcbiAgICAgICAgICAgICAqIEB0eXBlIHtPbGQuX3VwbG9hZFdoZW5CYXRjaH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy51cGxvYWQgPSB0aGlzLl91cGxvYWRXaGVuQmF0Y2g7XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogT3ZlcnJpZGUgcmVtb3ZlIGZ1bmN0aW9uIGZvciBiYXRjaCB0cmFuc2ZlclxuICAgICAgICAgICAgICogQHR5cGUge09sZC5fcmVtb3ZlV2hlbkJhdGNofVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLnJlbW92ZSA9IHRoaXMuX3JlbW92ZVdoZW5CYXRjaDtcbiAgICAgICAgfVxuXG4gICAgICAgICRoaWRkZW5GcmFtZS5vbignbG9hZCcsICQucHJveHkodGhpcy5fb25Mb2FkSGlkZGVuRnJhbWUsIHRoaXMsICRoaWRkZW5GcmFtZSkpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7c3RyaW5nfSBSZXF1ZXN0ZXIgdHlwZVxuICAgICAqL1xuICAgIFRZUEU6IFRZUEUsXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyXG4gICAgICogXCJsb2FkXCIgb2YgaGlkZGVuIGZyYW1lLlxuICAgICAqIEBwYXJhbSB7alF1ZXJ5fSAkaGlkZGVuRnJhbWUgLSBIaWRkZW4gaWZyYW1lXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25Mb2FkSGlkZGVuRnJhbWU6IGZ1bmN0aW9uKCRoaWRkZW5GcmFtZSkge1xuICAgICAgICB2YXIgZnJhbWVCb2R5LFxuICAgICAgICAgICAgZGF0YTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZnJhbWVCb2R5ID0gJGhpZGRlbkZyYW1lWzBdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQuYm9keTtcbiAgICAgICAgICAgIGRhdGEgPSB0dWkudXRpbC5waWNrKGZyYW1lQm9keSwgJ2ZpcnN0Q2hpbGQnLCAnZGF0YScpO1xuICAgICAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3VwbG9hZGVkJywgJC5wYXJzZUpTT04oZGF0YSkpO1xuICAgICAgICAgICAgICAgIGZyYW1lQm9keS5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhpcy5maXJlKCdlcnJvcicsIHtcbiAgICAgICAgICAgICAgICBzdGF0dXM6IGUubmFtZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBlLm1lc3NhZ2VcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN0b3JlIGZpbGUgaW5wdXQgZWxlbWVudCBmcm9tIHVwbG9hZCBmb3JtXG4gICAgICovXG4gICAgc3RvcmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZWwgPSB0aGlzLmZvcm1WaWV3LiRmaWxlSW5wdXRbMF0sXG4gICAgICAgICAgICBpZCA9IHR1aS51dGlsLnN0YW1wKGVsKTtcblxuICAgICAgICB0aGlzLnBvb2wuc3RvcmUoZWwpO1xuICAgICAgICB0aGlzLmZvcm1WaWV3LnJlc2V0RmlsZUlucHV0KCk7XG5cbiAgICAgICAgdGhpcy5maXJlKCdzdG9yZWQnLCBbe1xuICAgICAgICAgICAgaWQ6IGlkLFxuICAgICAgICAgICAgbmFtZTogZWwudmFsdWUsXG4gICAgICAgICAgICBzaXplOiAnJ1xuICAgICAgICB9XSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwbG9hZC5cbiAgICAgKiBJdCBpcyBub3QgdXNlZCBmb3IgYmF0Y2ggdHJhbnNmZXIuXG4gICAgICovXG4gICAgdXBsb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5wb29sLnBsYW50KCk7XG4gICAgICAgIHRoaXMuZm9ybVZpZXcuJGVsLnN1Ym1pdCgpO1xuICAgICAgICB0aGlzLmZvcm1WaWV3LmNsZWFyKCk7XG4gICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBsb2FkLlxuICAgICAqIEl0IGlzIHVzZWQgZm9yIGJhdGNoIHRyYW5zZmVyLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwbG9hZFdoZW5CYXRjaDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucG9vbC5wbGFudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZmlsZSAoYWpheC1qc29ucClcbiAgICAgKiBJdCBpcyBub3QgdXNlZCBmb3IgYmF0Y2ggdHJhbnNmZXIuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyAtIFBhcmFtZXRlcnMgdG8gcmVtb3ZlIGZpbGVcbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAgICB2YXIgdXBsb2FkZXIgPSB0aGlzLnVwbG9hZGVyO1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiB1cGxvYWRlci51cmwucmVtb3ZlLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29ucCcsXG4gICAgICAgICAgICBkYXRhOiBwYXJhbXMsXG4gICAgICAgICAgICBzdWNjZXNzOiAkLnByb3h5KGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBkYXRhLnR5cGUgPSAncmVtb3ZlJztcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZWQnLCBkYXRhKTtcbiAgICAgICAgICAgIH0sIHRoaXMpXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZmlsZSAoYWpheC1qc29ucClcbiAgICAgKiBJdCBpcyB1c2VkIGZvciBiYXRjaCB0cmFuc2Zlci5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIC0gUGFyYW1ldGVycyB0byByZW1vdmUgZmlsZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbW92ZVdoZW5CYXRjaDogZnVuY3Rpb24ocGFyYW1zKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSB0aGlzLnBvb2wucmVtb3ZlKHBhcmFtcyk7XG5cbiAgICAgICAgdGhpcy5maXJlKCdyZW1vdmVkJywgdHVpLnV0aWwuZXh0ZW5kKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IHJlc3VsdCA/ICdzdWNjZXNzJyA6ICdmYWlsJ1xuICAgICAgICB9LCBwYXJhbXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgdGhlIHBvb2xcbiAgICAgKi9cbiAgICBjbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucG9vbC5lbXB0eSgpO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oT2xkKTtcbm1vZHVsZS5leHBvcnRzID0gT2xkO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZpbGVVcGxvYWRlciBpcyBjb3JlIG9mIGZpbGUgdXBsb2FkZXIgY29tcG9uZW50Ljxicj5GaWxlTWFuYWdlciBtYW5hZ2UgY29ubmVjdG9yIHRvIGNvbm5lY3Qgc2VydmVyIGFuZCB1cGRhdGUgRmlsZUxpc3RWaWV3LlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcbnZhciBjb25zdHMgPSByZXF1aXJlKCcuL2NvbnN0cycpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIEZvcm0gPSByZXF1aXJlKCcuL3ZpZXcvZm9ybScpO1xudmFyIExpc3QgPSByZXF1aXJlKCcuL3ZpZXcvbGlzdCcpO1xudmFyIERyYWdBbmREcm9wID0gcmVxdWlyZSgnLi92aWV3L2RyYWcnKTtcbnZhciBPbGRSZXF1ZXN0ZXIgPSByZXF1aXJlKCcuL3JlcXVlc3Rlci9vbGQnKTtcbnZhciBNb2Rlcm5SZXF1ZXN0ZXIgPSByZXF1aXJlKCcuL3JlcXVlc3Rlci9tb2Rlcm4nKTtcblxudmFyIFJFUVVFU1RFUl9UWVBFX01PREVSTiA9IGNvbnN0cy5DT05GLlJFUVVFU1RFUl9UWVBFX01PREVSTjtcblxuLyoqXG4gKiBGaWxlVXBsb2FkZXIgYWN0IGxpa2UgYnJpZGdlIGJldHdlZW4gY29ubmVjdG9yIGFuZCB2aWV3LlxuICogSXQgbWFrZXMgY29ubmVjdG9yIGFuZCB2aWV3IHdpdGggb3B0aW9uIGFuZCBlbnZpcm9ubWVudC5cbiAqIEl0IGNvbnRyb2wgYW5kIG1ha2UgY29ubmVjdGlvbiBhbW9uZyBtb2R1bGVzLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBUaGUgb3B0aW9ucyB0byBzZXQgdXAgZmlsZSB1cGxvYWRlciBtb2R1bGVzLlxuICogIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLnVybCBUaGUgdXJsIGlzIGZpbGUgc2VydmVyLlxuICogICAgICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy51cmwuc2VuZCBUaGUgdXJsIGlzIGZvciBmaWxlIGF0dGFjaC5cbiAqICAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMudXJsLnJlbW92ZSBUaGUgdXJsIGlzIGZvciBmaWxlIGRldGFjaC5cbiAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5mb3JtVGFyZ2V0IFRoZSB0YXJnZXQgZm9yIHgtZG9tYWluIGpzb25wIGNhc2UuXG4gKiAgQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMubGlzdEluZm8gVGhlIGVsZW1lbnQgaW5mbyB0byBkaXNwbGF5IGZpbGUgbGlzdCBpbmZvcm1hdGlvbi5cbiAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZmlsZUZpZWxkPSd1c2VyRmlsZVtdJ10gVGhlIGZpZWxkIG5hbWUgb2YgaW5wdXQgZmlsZSBlbGVtZW50LlxuICogIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy51c2VGb2xkZXIgV2hldGhlciBzZWxlY3QgdW5pdCBpcyBmb2xkZXIgb2Ygbm90LiBJZiB0aGlzIGlzIHR1cmUsIG11bHRpcGxlIHdpbGwgYmUgaWdub3JlZC5cbiAqICBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMuaXNNdWx0aXBsZSBXaGV0aGVyIGVuYWJsZSBtdWx0aXBsZSBzZWxlY3Qgb3Igbm90LlxuICogQHBhcmFtIHtqUXVlcnl9ICRlbCBSb290IEVsZW1lbnQgb2YgVXBsb2FkZXJcbiAqIEBleGFtcGxlXG4gKiB2YXIgdXBsb2FkZXIgPSBuZXcgdHVpLmNvbXBvbmVudC5VcGxvYWRlcih7XG4gKiAgICAgdXJsOiB7XG4gKiAgICAgICAgIHNlbmQ6IFwiaHR0cDovL2ZlLm5obmVudC5jb20vZXRjL2V0Yy91cGxvYWRlci91cGxvYWRlci5waHBcIixcbiAqICAgICAgICAgcmVtb3ZlOiBcImh0dHA6Ly9mZS5uaG5lbnQuY29tL2V0Yy9ldGMvdXBsb2FkZXIvcmVtb3ZlLnBocFwiXG4gKiAgICAgfSxcbiAqICAgICBmb3JtVGFyZ2V0OiAnaGlkZGVuRnJhbWUnLFxuICogICAgIGxpc3RJbmZvOiB7XG4gKiAgICAgICAgIGxpc3Q6ICQoJyNmaWxlcycpLFxuICogICAgICAgICBjb3VudDogJCgnI2ZpbGVfY291bnQnKSxcbiAqICAgICAgICAgc2l6ZTogJCgnI3NpemVfY291bnQnKVxuICogICAgIH1cbiAqIH0sICQoJyN1cGxvYWRlcicpKTtcbiAqL1xudmFyIFVwbG9hZGVyID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqQGxlbmRzIFVwbG9hZGVyLnByb3RvdHlwZSAqL3tcbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zLCAkZWwpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFVwbG9hZGVyIGVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJGVsID0gJGVsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZW5kL1JlbW92ZSB1cmxcbiAgICAgICAgICogQHR5cGUge3tzZW5kOiBzdHJpbmcsIHJlbW92ZTogc3RyaW5nfX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudXJsID0gb3B0aW9ucy51cmw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlZGlyZWN0IFVSTCBmb3IgQ09SUyhyZXNwb25zZSwgSUU3KVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZWRpcmVjdFVSTCA9IG9wdGlvbnMucmVkaXJlY3RVUkw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZvcm0gdGFyZ2V0IG5hbWUgZm9yIENPUlMgKElFNywgOCwgOSlcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZm9ybVRhcmdldCA9IG9wdGlvbnMuZm9ybVRhcmdldCB8fCBjb25zdHMuQ09ORi5GT1JNX1RBUkdFVF9OQU1FO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUYXJnZXQgZnJhbWUgZm9yIENPUlMgKElFNywgOCwgOSlcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJHRhcmdldEZyYW1lID0gdGhpcy5fY3JlYXRlVGFyZ2V0RnJhbWUoKVxuICAgICAgICAgICAgLmFwcGVuZFRvKHRoaXMuJGVsKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSW5wdXQgZmlsZSAtIGZpZWxkIG5hbWVcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZmlsZUZpZWxkID0gb3B0aW9ucy5maWxlRmllbGQgfHwgY29uc3RzLkNPTkYuRklMRV9GSUxFRF9OQU1FO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHRoZSB1cGxvYWRlciB1c2VzIGJhdGNoLXRyYW5zZmVyXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc0JhdGNoVHJhbnNmZXIgPSBvcHRpb25zLmlzQmF0Y2hUcmFuc2ZlcjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciB0aGUgc2VuZGluZy9yZW1vdmluZyB1cmxzIGFyZSB4LWRvbWFpbi5cbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzQ3Jvc3NEb21haW4gPSB1dGlscy5pc0Nyb3NzRG9tYWluKHRoaXMudXJsLnNlbmQpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIFBvc3RNZXNzYWdlIEFQSVxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaXNTdXBwb3J0UG9zdE1lc3NhZ2UgPSAhISh0dWkudXRpbC5waWNrKHRoaXMuJHRhcmdldEZyYW1lLCAnMCcsICdjb250ZW50V2luZG93JywgJ3Bvc3RNZXNzYWdlJykpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHRoZSB1c2VyIHVzZXMgbXVsdGlwbGUgdXBsb2FkXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc011bHRpcGxlID0gISEob3B0aW9ucy5pc011bHRpcGxlKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciB0aGUgdXNlciB1c2VzIGRyYWcmZHJvcCB1cGxvYWRcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnVzZURyYWcgPSAhIShvcHRpb25zLnVzZURyYWcpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHRoZSB1c2VyIHVzZXMgZm9sZGVyIHVwbG9hZFxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudXNlRm9sZGVyID0gISEob3B0aW9ucy51c2VGb2xkZXIpO1xuXG4gICAgICAgIGlmICh0aGlzLnVzZURyYWcgJiYgIXRoaXMudXNlRm9sZGVyICYmIHV0aWxzLmlzU3VwcG9ydEZpbGVTeXN0ZW0oKSkge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBEcmFnICYgRHJvcCBWaWV3XG4gICAgICAgICAgICAgKiBAdHlwZSB7RHJhZ0FuZERyb3B9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuZHJhZ1ZpZXcgPSBuZXcgRHJhZ0FuZERyb3AodGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogRnJvbSBWaWV3XG4gICAgICAgICAqIEB0eXBlIHtGb3JtfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5mb3JtVmlldyA9IG5ldyBGb3JtKHRoaXMpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMaXN0IFZpZXdcbiAgICAgICAgICogQHR5cGUge0xpc3R9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmxpc3RWaWV3ID0gbmV3IExpc3Qob3B0aW9ucy5saXN0SW5mbyk7XG5cbiAgICAgICAgdGhpcy5fc2V0UmVxdWVzdGVyKCk7XG4gICAgICAgIHRoaXMuX2FkZEV2ZW50KCk7XG4gICAgICAgIGlmICh0aGlzLmlzQ3Jvc3NEb21haW4gJiYgdGhpcy5pc1N1cHBvcnRQb3N0TWVzc2FnZSkge1xuICAgICAgICAgICAgdGhpcy5fc2V0UG9zdE1lc3NhZ2VFdmVudCgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBDb25uZWN0b3JcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRSZXF1ZXN0ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodXRpbHMuaXNTdXBwb3J0Rm9ybURhdGEoKSkge1xuICAgICAgICAgICAgdGhpcy5fcmVxdWVzdGVyID0gbmV3IE1vZGVyblJlcXVlc3Rlcih0aGlzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3JlcXVlc3RlciA9IG5ldyBPbGRSZXF1ZXN0ZXIodGhpcyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHBvc3QtbWVzc2FnZSBldmVudCBpZiBzdXBwb3J0ZWQgYW5kIG5lZWRlZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldFBvc3RNZXNzYWdlRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiR0YXJnZXRGcmFtZS5vZmYoJ2xvYWQnKTtcbiAgICAgICAgJCh3aW5kb3cpLm9uKCdtZXNzYWdlJywgJC5wcm94eShmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgdmFyIG9yaWdpbmFsRXZlbnQgPSBldmVudC5vcmlnaW5hbEV2ZW50LFxuICAgICAgICAgICAgICAgIGRhdGE7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnVybC5zZW5kLmluZGV4T2Yob3JpZ2luYWxFdmVudC5vcmlnaW4pID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRhdGEgPSAkLnBhcnNlSlNPTihvcmlnaW5hbEV2ZW50LmRhdGEpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0JhdGNoVHJhbnNmZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGlzdChkYXRhLmZpbGVsaXN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZmlyZSgnc3VjY2VzcycsIGRhdGEpO1xuICAgICAgICB9LCB0aGlzKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2VzIGVsZW1lbnQgdG8gYmUgdGFyZ2V0IG9mIHN1Ym1pdCBmb3JtIGVsZW1lbnQuXG4gICAgICogQHJldHVybnMge2pRdWVyeX0gVGFyZ2V0IGZvcm06IGpxdWVyeS1lbGVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY3JlYXRlVGFyZ2V0RnJhbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHRhcmdldCA9ICQoJzxpZnJhbWUgbmFtZT1cIicgKyB0aGlzLmZvcm1UYXJnZXQgKyAnXCI+PC9pZnJhbWU+Jyk7XG4gICAgICAgICR0YXJnZXQuY3NzKHtcbiAgICAgICAgICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nLFxuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuICR0YXJnZXQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudHMgdG8gdmlld3MgYW5kIGZpcmUgdXBsb2FkZXIgZXZlbnRzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy51c2VEcmFnICYmIHRoaXMuZHJhZ1ZpZXcpIHtcbiAgICAgICAgICAgIHRoaXMuZHJhZ1ZpZXcub24oJ2Ryb3AnLCB0aGlzLnN0b3JlLCB0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxpc3RWaWV3Lm9uKCdyZW1vdmUnLCB0aGlzLnJlbW92ZUZpbGUsIHRoaXMpO1xuICAgICAgICBpZiAodGhpcy5pc0JhdGNoVHJhbnNmZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX2FkZEV2ZW50V2hlbkJhdGNoVHJhbnNmZXIoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2FkZEV2ZW50V2hlbk5vcm1hbFRyYW5zZmVyKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IHdoZW4gdXBsb2FkZXIgdXNlcyBiYXRjaC10cmFuc2ZlclxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZEV2ZW50V2hlbkJhdGNoVHJhbnNmZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmZvcm1WaWV3Lm9uKHtcbiAgICAgICAgICAgIGNoYW5nZTogdGhpcy5zdG9yZSxcbiAgICAgICAgICAgIHN1Ym1pdDogdGhpcy5zdWJtaXRcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgdGhpcy5fcmVxdWVzdGVyLm9uKHtcbiAgICAgICAgICAgIHJlbW92ZWQ6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxpc3QoZGF0YSk7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdyZW1vdmUnLCBkYXRhKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgnZXJyb3InLCBkYXRhKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1cGxvYWRlZDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3N1Y2Nlc3MnLCBkYXRhKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yZWQ6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxpc3QoZGF0YSk7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCd1cGRhdGUnLCBkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudCB3aGVuIHVwbG9hZGVyIHVzZXMgbm9ybWFsLXRyYW5zZmVyXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRXZlbnRXaGVuTm9ybWFsVHJhbnNmZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmZvcm1WaWV3Lm9uKCdjaGFuZ2UnLCB0aGlzLnNlbmRGaWxlLCB0aGlzKTtcbiAgICAgICAgdGhpcy5fcmVxdWVzdGVyLm9uKHtcbiAgICAgICAgICAgIHJlbW92ZWQ6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxpc3QoZGF0YSk7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdyZW1vdmUnLCBkYXRhKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgnZXJyb3InLCBkYXRhKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1cGxvYWRlZDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGlzdChkYXRhLmZpbGVsaXN0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3N1Y2Nlc3MnLCBkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBsaXN0IHZpZXcgd2l0aCBjdXN0b20gb3Igb3JpZ2luYWwgZGF0YS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2luZm9dIFRoZSBkYXRhIGZvciB1cGRhdGUgbGlzdFxuICAgICAqL1xuICAgIHVwZGF0ZUxpc3Q6IGZ1bmN0aW9uKGluZm8pIHtcbiAgICAgICAgdGhpcy5saXN0Vmlldy51cGRhdGUoaW5mbyk7XG4gICAgICAgIGlmICh0aGlzLmlzQmF0Y2hUcmFuc2Zlcikge1xuICAgICAgICAgICAgdGhpcy5saXN0Vmlldy51cGRhdGVUb3RhbEluZm8oaW5mbyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RWaWV3LnVwZGF0ZVRvdGFsSW5mbygpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZvciBjdXN0b20gc2VuZCBldmVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IFtldmVudF0gLSBGb3JtIHN1Ym1pdCBldmVudFxuICAgICAqL1xuICAgIHNlbmRGaWxlOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB0aGlzLnN0b3JlKCk7XG4gICAgICAgIHRoaXMuc3VibWl0KGV2ZW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZm9yIGN1c3RvbSByZW1vdmUgZXZlbnRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBUaGUgZGF0YSBmb3IgcmVtb3ZlIGZpbGUuXG4gICAgICovXG4gICAgcmVtb3ZlRmlsZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB0aGlzLl9yZXF1ZXN0ZXIucmVtb3ZlKGRhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdWJtaXQgZm9yIGRhdGEgc3VibWl0IHRvIHNlcnZlclxuICAgICAqIEBwYXJhbSB7RXZlbnR9IFtldmVudF0gLSBGb3JtIHN1Ym1pdCBldmVudFxuICAgICAqL1xuICAgIHN1Ym1pdDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50ICYmIHRoaXMuX3JlcXVlc3Rlci5UWVBFID09PSBSRVFVRVNURVJfVFlQRV9NT0RFUk4pIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcmVxdWVzdGVyLnVwbG9hZCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDbGVhciB1cGxvYWRlclxuICAgICAqL1xuICAgIGNsZWFyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fcmVxdWVzdGVyLmNsZWFyKCk7XG4gICAgICAgIHRoaXMuZm9ybVZpZXcuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5saXN0Vmlldy5jbGVhcigpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdG9yZSBpbnB1dCBlbGVtZW50IHRvIHBvb2wuXG4gICAgICogQHBhcmFtIHtBcnJheS48RmlsZT4gfCBGaWxlfSBbZmlsZXNdIC0gQSBmaWxlIG9yIGZpbGVzXG4gICAgICovXG4gICAgc3RvcmU6IGZ1bmN0aW9uKGZpbGVzKSB7XG4gICAgICAgIHRoaXMuX3JlcXVlc3Rlci5zdG9yZShmaWxlcyk7XG4gICAgfVxufSk7XG5cbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihVcGxvYWRlcik7XG5tb2R1bGUuZXhwb3J0cyA9IFVwbG9hZGVyO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgZmlsZSBjb250YWluIHV0aWxpdHkgbWV0aG9kcyBmb3IgdXBsb2FkZXIuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG4vKipcbiAqIEBuYW1lc3BhY2UgdXRpbHNcbiAqL1xudmFyIElTX1NVUFBPUlRfRklMRV9TWVNURU0gPSAhISh3aW5kb3cuRmlsZSAmJiB3aW5kb3cuRmlsZVJlYWRlciAmJiB3aW5kb3cuRmlsZUxpc3QgJiYgd2luZG93LkJsb2IpLFxuICAgIElTX1NVUFBPUlRfRk9STV9EQVRBID0gISEod2luZG93LkZvcm1EYXRhIHx8IG51bGwpO1xuXG4vKipcbiAqIFBhcnNlIHVybFxuICogQHBhcmFtIHtzdHJpbmd9IHVybCAtIHVybCBmb3IgcGFyc2luZ1xuICogQHJldHVybnMge09iamVjdH0gVVJMIGluZm9ybWF0aW9uXG4gKi9cbmZ1bmN0aW9uIHBhcnNlVVJMKHVybCkge1xuICAgIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgIGEuaHJlZiA9IHVybDtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGhyZWY6IGEuaHJlZixcbiAgICAgICAgaG9zdDogYS5ob3N0LFxuICAgICAgICBwb3J0OiBhLnBvcnQsXG4gICAgICAgIGhhc2g6IGEuaGFzaCxcbiAgICAgICAgaG9zdG5hbWU6IGEuaG9zdG5hbWUsXG4gICAgICAgIHBhdGhuYW1lOiBhLnBhdGhuYW1lLFxuICAgICAgICBwcm90b2NvbDogYS5wcm90b2NvbCxcbiAgICAgICAgc2VhcmNoOiBhLnNlYXJjaCxcbiAgICAgICAgcXVlcnk6IGEuc2VhcmNoLnNsaWNlKDEpXG4gICAgfTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHVuaXQgZm9yIGZpbGUgc2l6ZVxuICogQHBhcmFtIHtudW1iZXJ9IGJ5dGVzIEEgdXNhZ2Ugb2YgZmlsZVxuICogQHJldHVybnMge3N0cmluZ30gU2l6ZS1zdHJpbmdcbiAqIEBtZW1iZXJvZiB1dGlsc1xuICovXG5mdW5jdGlvbiBnZXRGaWxlU2l6ZVdpdGhVbml0KGJ5dGVzKSB7XG4gICAgdmFyIHVuaXRzID0gWydCJywgJ0tCJywgJ01CJywgJ0dCJywgJ1RCJ10sXG4gICAgICAgIGJ5dGVzID0gcGFyc2VJbnQoYnl0ZXMsIDEwKSxcbiAgICAgICAgZXhwID0gTWF0aC5sb2coYnl0ZXMpIC8gTWF0aC5sb2coMTAyNCkgfCAwLFxuICAgICAgICByZXN1bHQgPSAoYnl0ZXMgLyBNYXRoLnBvdygxMDI0LCBleHApKS50b0ZpeGVkKDIpO1xuXG4gICAgcmV0dXJuIHJlc3VsdCArIHVuaXRzW2V4cF07XG59XG5cbi8qKlxuICogV2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0cyBGb3JtRGF0YSBvciBub3RcbiAqIEBtZW1iZXJvZiB1dGlsc1xuICogQHJldHVybnMge2Jvb2xlYW59IHdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgRm9ybURhdGFcbiAqL1xuZnVuY3Rpb24gaXNTdXBwb3J0Rm9ybURhdGEoKSB7XG4gICAgcmV0dXJuIElTX1NVUFBPUlRfRk9STV9EQVRBO1xufVxuXG4vKipcbiAqIEdldCBpdGVtIGVsZW1lbnRzIEhUTUxcbiAqIEBwYXJhbSB7T2JqZWN0fSBtYXAgLSBQcm9wZXJ0aWVzIGZvciB0ZW1wbGF0ZVxuICogQHBhcmFtIHtzdHJpbmd9IGh0bWwgSFRNTCB0ZW1wbGF0ZVxuICogQHJldHVybnMge3N0cmluZ30gSFRNTFxuICogQG1lbWJlcm9mIHV0aWxzXG4gKi9cbmZ1bmN0aW9uIHRlbXBsYXRlKG1hcCwgaHRtbCkge1xuICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoL1xce1xceyhbXlxcfV0rKVxcfVxcfS9nLCBmdW5jdGlvbiAobXN0ciwgbmFtZSkge1xuICAgICAgICByZXR1cm4gbWFwW25hbWVdO1xuICAgIH0pO1xuICAgIHJldHVybiBodG1sO1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgZmlsZSBhcGkuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gd2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0cyBGaWxlQVBJXG4gKiBAbWVtYmVyb2YgdXRpbHNcbiAqL1xuZnVuY3Rpb24gaXNTdXBwb3J0RmlsZVN5c3RlbSgpIHtcbiAgICByZXR1cm4gSVNfU1VQUE9SVF9GSUxFX1NZU1RFTTtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSB1cmwgaXMgeC1kb21haW5cbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgLSBVUkxcbiAqIEByZXR1cm5zIHtib29sZWFufSBXaGV0aGVyIHRoZSB1cmwgaXMgeC1kb21haW5cbiAqIEBtZW1iZXJvZiB1dGlsc1xuICovXG5mdW5jdGlvbiBpc0Nyb3NzRG9tYWluKHVybCkge1xuICAgIHZhciBoZXJlID0gcGFyc2VVUkwod2luZG93LmxvY2F0aW9uLmhyZWYpLFxuICAgICAgICB0YXJnZXQgPSBwYXJzZVVSTCh1cmwpO1xuXG4gICAgcmV0dXJuIHRhcmdldC5ob3N0bmFtZSAhPT0gaGVyZS5ob3N0bmFtZVxuICAgICAgICB8fCB0YXJnZXQucG9ydCAhPT0gaGVyZS5wb3J0XG4gICAgICAgIHx8IHRhcmdldC5wcm90b2NvbCAhPT0gaGVyZS5wcm90b2NvbDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0RmlsZVNpemVXaXRoVW5pdDogZ2V0RmlsZVNpemVXaXRoVW5pdCxcbiAgICBpc1N1cHBvcnRGaWxlU3lzdGVtOiBpc1N1cHBvcnRGaWxlU3lzdGVtLFxuICAgIGlzU3VwcG9ydEZvcm1EYXRhOiBpc1N1cHBvcnRGb3JtRGF0YSxcbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXG4gICAgaXNDcm9zc0RvbWFpbjogaXNDcm9zc0RvbWFpblxufTtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIGZpbGUgaXMgYWJvdXQgZHJhZyBhbmQgZHJvcCBmaWxlIHRvIHNlbmQuIERyYWcgYW5kIGRyb3AgaXMgcnVubmluZyB2aWEgZmlsZSBhcGkuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIGNvbnN0cyA9IHJlcXVpcmUoJy4uL2NvbnN0cycpO1xuXG4vKipcbiAqIE1ha2VzIGRyYWcgYW5kIGRyb3AgYXJlYSwgdGhlIGRyb3BwZWQgZmlsZSBpcyBhZGRlZCB2aWEgZXZlbnQgZHJvcCBldmVudC5cbiAqIEBwYXJhbSB7VXBsb2FkZXJ9IHVwbG9hZGVyIC0gVXBsb2FkZXJcbiAqIEBjbGFzcyBEcmFnQW5kRHJvcFxuICovXG52YXIgRHJhZ0FuZERyb3AgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIERyYWdBbmREcm9wLnByb3RvdHlwZSAqL3tcbiAgICBpbml0OiBmdW5jdGlvbih1cGxvYWRlcikge1xuICAgICAgICB2YXIgaHRtbCA9IGNvbnN0cy5IVE1MLmRyYWdBbmREcm9wO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEcm9wIHpvbmUgalF1ZXJ5LWVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJGVsID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2xhc3MgZm9yIGRyb3AgZW5hYmxlZFxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fZW5hYmxlQ2xhc3MgPSBjb25zdHMuQ09ORi5EUk9QX0VOQUJMRURfQ0xBU1M7XG5cbiAgICAgICAgdGhpcy5fcmVuZGVyKGh0bWwsIHVwbG9hZGVyKTtcbiAgICAgICAgdGhpcy5fYWRkRXZlbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVuZGVycyBkcmFnIGFuZCBkcm9wIGFyZWFcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaHRtbCBUaGUgaHRtbCBzdHJpbmcgdG8gbWFrZSBkYXJnIHpvbmVcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdXBsb2FkZXIgVGhlIGNvcmUgaW5zdGFuY2Ugb2YgdGhpcyBjb21wb25lbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW5kZXI6IGZ1bmN0aW9uKGh0bWwsIHVwbG9hZGVyKSB7XG4gICAgICAgIHRoaXMuJGVsID0gJChodG1sKVxuICAgICAgICAgICAgLmFwcGVuZFRvKHVwbG9hZGVyLiRlbCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZHMgZHJhZyBhbmQgZHJvcCBldmVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZEV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwub24oJ2RyYWdlbnRlcicsICQucHJveHkodGhpcy5vbkRyYWdFbnRlciwgdGhpcykpO1xuICAgICAgICB0aGlzLiRlbC5vbignZHJhZ292ZXInLCAkLnByb3h5KHRoaXMub25EcmFnT3ZlciwgdGhpcykpO1xuICAgICAgICB0aGlzLiRlbC5vbignZHJvcCcsICQucHJveHkodGhpcy5vbkRyb3AsIHRoaXMpKTtcbiAgICAgICAgdGhpcy4kZWwub24oJ2RyYWdsZWF2ZScsICQucHJveHkodGhpcy5vbkRyYWdMZWF2ZSwgdGhpcykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGVzIGRyYWdlbnRlciBldmVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGUgLSBFdmVudFxuICAgICAqL1xuICAgIG9uRHJhZ0VudGVyOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgdGhpcy5fZW5hYmxlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEhhbmRsZXMgZHJhZ292ZXIgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBlIC0gRXZlbnRcbiAgICAgKi9cbiAgICBvbkRyYWdPdmVyOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlcyBkcmFnbGVhdmUgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBlIC0gRXZlbnRcbiAgICAgKi9cbiAgICBvbkRyYWdMZWF2ZTogZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMuX2Rpc2FibGUoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlcyBkcm9wIGV2ZW50XG4gICAgICogQHBhcmFtIHtFdmVudH0gZSAtIEV2ZW50XG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IEZhbHNlXG4gICAgICovXG4gICAgb25Ecm9wOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBmaWxlcyA9IHR1aS51dGlsLnBpY2soZSwgJ29yaWdpbmFsRXZlbnQnLCAnZGF0YVRyYW5zZmVyJywgJ2ZpbGVzJyk7XG5cbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLl9kaXNhYmxlKCk7XG4gICAgICAgIHRoaXMuZmlyZSgnZHJvcCcsIGZpbGVzKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFbmFibGUgZHJvcHpvbmVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9lbmFibGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbC5hZGRDbGFzcyh0aGlzLl9lbmFibGVDbGFzcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERpc2FibGUgZHJvcG9uemVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9kaXNhYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwucmVtb3ZlQ2xhc3ModGhpcy5fZW5hYmxlQ2xhc3MpO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oRHJhZ0FuZERyb3ApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyYWdBbmREcm9wO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZyb20tdmlldyBtYWtlcyBhIGZvcm0gYnkgdGVtcGxhdGUuIEFkZCBldmVudHMgZm9yIGZpbGUgdXBsb2FkLlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcbnZhciBjb25zdHMgPSByZXF1aXJlKCcuLi9jb25zdHMnKSxcbiAgICB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cbnZhciBpc1N1cHBvcnRGb3JtRGF0YSA9IHV0aWxzLmlzU3VwcG9ydEZvcm1EYXRhKCksXG4gICAgSElEREVOX0ZJTEVfSU5QVVRfQ0xBU1MgPSBjb25zdHMuQ09ORi5ISURERU5fRklMRV9JTlBVVF9DTEFTUztcblxuLyoqXG4gKiBUaGlzIHZpZXcgY29udHJvbCBpbnB1dCBlbGVtZW50IHR5cGVkIGZpbGUuXG4gKiBAcGFyYW0ge1VwbG9hZGVyfSB1cGxvYWRlciAtIFVwbG9hZGVyIGluc3RhbmNlXG4gKiBAY29uc3RydWN0b3IgVmlldy5Gb3JtXG4gKi9cbnZhciBGb3JtID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqQGxlbmRzIFZpZXcuRm9ybS5wcm90b3R5cGUgKiove1xuICAgIGluaXQ6IGZ1bmN0aW9uKHVwbG9hZGVyKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGaWxlIHVwbG9hZGVyXG4gICAgICAgICAqIEB0eXBlIHtVcGxvYWRlcn1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3VwbG9hZGVyID0gdXBsb2FkZXI7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEh0bWwgdGVtcGxhdGVzXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3QuPHN0cmluZywgc3RyaW5nPn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2h0bWwgPSB0aGlzLl9zZXRUZW1wbGF0ZSh1cGxvYWRlci50ZW1wbGF0ZSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZvcm0gZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kZWwgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGaWxlIGlucHV0IGVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJGZpbGVJbnB1dCA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFN1Ym1pdCBlbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiRzdWJtaXQgPSBudWxsO1xuXG4gICAgICAgIGlmIChpc1N1cHBvcnRGb3JtRGF0YSkge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBXaGV0aGVyIHRoZSBmaWxlIGlucHV0IGlzIG11bHRpcGxlXG4gICAgICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuX2lzTXVsdGlwbGUgPSB1cGxvYWRlci5pc011bHRpcGxlO1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFdoZXRoZXIgdGhlIGZpbGUgaW5wdXQgYWNjZXB0cyBmb2xkZXJcbiAgICAgICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5fdXNlRm9sZGVyID0gdXBsb2FkZXIudXNlRm9sZGVyO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fcmVuZGVyKHtcbiAgICAgICAgICAgIGFjdGlvbjogdXBsb2FkZXIudXJsLnNlbmQsXG4gICAgICAgICAgICBtZXRob2Q6ICdwb3N0JyxcbiAgICAgICAgICAgIGVuY3R5cGU6ICdtdWx0aXBhcnQvZm9ybS1kYXRhJyxcbiAgICAgICAgICAgIHRhcmdldDogaXNTdXBwb3J0Rm9ybURhdGEgPyAnJyA6IHVwbG9hZGVyLmZvcm1UYXJnZXRcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbmRlciBmb3JtIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gYXR0cmlidXRlcyAtIEZvcm0gYXR0cmlidXRlc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbmRlcjogZnVuY3Rpb24oYXR0cmlidXRlcykge1xuICAgICAgICB2YXIgdXBsb2FkZXIgPSB0aGlzLl91cGxvYWRlcixcbiAgICAgICAgICAgICRmaWxlSW5wdXQgPSB0aGlzLl9jcmVhdGVGaWxlSW5wdXQoKSxcbiAgICAgICAgICAgICRlbCA9ICQodGhpcy5faHRtbC5mb3JtKVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoJGZpbGVJbnB1dClcbiAgICAgICAgICAgICAgICAuYXR0cihhdHRyaWJ1dGVzKTtcblxuICAgICAgICB0aGlzLiRmaWxlSW5wdXQgPSAkZmlsZUlucHV0O1xuICAgICAgICB0aGlzLiRlbCA9ICRlbDtcblxuICAgICAgICBpZiAodXBsb2FkZXIuaXNCYXRjaFRyYW5zZmVyKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdWJtaXRFbGVtZW50KCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodXBsb2FkZXIuaXNDcm9zc0RvbWFpbiAmJiAhaXNTdXBwb3J0Rm9ybURhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldEhpZGRlbklucHV0Rm9yQ09SUygpO1xuICAgICAgICB9XG4gICAgICAgIHVwbG9hZGVyLiRlbC5hcHBlbmQodGhpcy4kZWwpO1xuXG4gICAgICAgIHRoaXMuX2FkZEV2ZW50KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBzdWJtaXQgZWxlbWVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldFN1Ym1pdEVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRzdWJtaXQgPSAkKHRoaXMuX2h0bWwuc3VibWl0KTtcbiAgICAgICAgdGhpcy4kc3VibWl0LmFwcGVuZFRvKHRoaXMuJGVsKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGhpZGRlbiBpbnB1dCBlbGVtZW50IGZvciBDT1JTLlxuICAgICAqICBIaWRkZW4gaW5wdXQgb2YgUG9zdE1lc3NhZ2Ugb3IgUmVkaXJlY3RVUkwuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0SGlkZGVuSW5wdXRGb3JDT1JTOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHByb3BzLCAkaGlkZGVuSW5wdXQsXG4gICAgICAgICAgICB1cGxvYWRlciA9IHRoaXMuX3VwbG9hZGVyLFxuICAgICAgICAgICAgcmVkaXJlY3RVUkwgPSB1cGxvYWRlci5yZWRpcmVjdFVSTDtcblxuICAgICAgICBpZiAodXBsb2FkZXIuaXNTdXBwb3J0UG9zdE1lc3NhZ2UpIHsgLy8gZm9yIElFOCwgOVxuICAgICAgICAgICAgcHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ21lc3NhZ2VUYXJnZXQnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBsb2NhdGlvbi5wcm90b2NvbCArICcvLycgKyBsb2NhdGlvbi5ob3N0XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKHJlZGlyZWN0VVJMKSB7IC8vIGZvciBJRTdcbiAgICAgICAgICAgIHByb3BzID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdyZWRpcmVjdFVSTCcsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHJlZGlyZWN0VVJMXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb3BzKSB7XG4gICAgICAgICAgICAkaGlkZGVuSW5wdXQgPSAkKHV0aWxzLnRlbXBsYXRlKHByb3BzLCB0aGlzLl9odG1sLmhpZGRlbklucHV0KSk7XG4gICAgICAgICAgICAkaGlkZGVuSW5wdXQuYXBwZW5kVG8odGhpcy4kZWwpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBhbGwgb2YgaW5wdXQgZWxlbWVudHMgaHRtbCBzdHJpbmdzLlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFt0ZW1wbGF0ZV0gVGhlIHRlbXBsYXRlIGlzIHNldCBmb3JtIGN1c3RvbWVyLlxuICAgICAqIEByZXR1cm4ge09iamVjdC48c3RyaW5nLCBzdHJpbmc+fSBUaGUgaHRtbCB0ZW1wbGF0ZSBzdHJpbmcgc2V0IGZvciBmb3JtLlxuICAgICAqL1xuICAgIF9zZXRUZW1wbGF0ZTogZnVuY3Rpb24odGVtcGxhdGUpIHtcbiAgICAgICAgcmV0dXJuIHR1aS51dGlsLmV4dGVuZCh7fSwgY29uc3RzLkhUTUwsIHRlbXBsYXRlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZXMgYW5kIHJldHVybnMganF1ZXJ5IGVsZW1lbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEByZXR1cm4ge2pRdWVyeX0gVGhlIGpxdWVyeSBvYmplY3Qgd3JhcHBpbmcgb3JpZ2luYWwgaW5wdXQgZWxlbWVudFxuICAgICAqL1xuICAgIF9jcmVhdGVGaWxlSW5wdXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbWFwID0ge1xuICAgICAgICAgICAgbXVsdGlwbGU6IHRoaXMuX2lzTXVsdGlwbGUgPyAnbXVsdGlwbGUnIDogJycsXG4gICAgICAgICAgICBmaWxlRmllbGQ6IHRoaXMuX3VwbG9hZGVyLmZpbGVGaWVsZCxcbiAgICAgICAgICAgIGRpcmVjdG9yeTogdGhpcy5fdXNlRm9sZGVyID8gJ2RpcmVjdG9yeSBtb3pkaXJlY3Rvcnkgd2Via2l0ZGlyZWN0b3J5JyA6ICcnXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuICQodXRpbHMudGVtcGxhdGUobWFwLCB0aGlzLl9odG1sLmZpbGVJbnB1dCkpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl91cGxvYWRlci5pc0JhdGNoVHJhbnNmZXIpIHtcbiAgICAgICAgICAgIHRoaXMuJGVsLm9uKCdzdWJtaXQnLCAkLnByb3h5KHRoaXMuZmlyZSwgdGhpcywgJ3N1Ym1pdCcpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hZGRJbnB1dEV2ZW50KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBjaGFuZ2UgZXZlbnQgdG8gZmlsZSBpbnB1dFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZElucHV0RXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRmaWxlSW5wdXQub24oJ2NoYW5nZScsICQucHJveHkodGhpcy5vbkNoYW5nZSwgdGhpcykpO1xuICAgICAgICB0aGlzLiRmaWxlSW5wdXQuYXR0cigndGl0bGUnLCAnICcpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudC1IYW5kbGUgZm9yIGlucHV0IGVsZW1lbnQgY2hhbmdlXG4gICAgICovXG4gICAgb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuJGZpbGVJbnB1dFswXS52YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZmlyZSgnY2hhbmdlJyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlc2V0IElucHV0IGVsZW1lbnQgdG8gc2F2ZSB3aG9sZSBpbnB1dD1maWxlIGVsZW1lbnQuXG4gICAgICovXG4gICAgcmVzZXRGaWxlSW5wdXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRmaWxlSW5wdXQucmVtb3ZlKCk7XG4gICAgICAgIHRoaXMuJGZpbGVJbnB1dCA9IHRoaXMuX2NyZWF0ZUZpbGVJbnB1dCgpO1xuICAgICAgICBpZiAodGhpcy4kc3VibWl0KSB7XG4gICAgICAgICAgICB0aGlzLiRzdWJtaXQuYmVmb3JlKHRoaXMuJGZpbGVJbnB1dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiRlbC5hcHBlbmQodGhpcy4kZmlsZUlucHV0KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hZGRJbnB1dEV2ZW50KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENsZWFyIGZpbGUgaW5wdXQgZWxlbWVudHNcbiAgICAgKi9cbiAgICBjbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsLmZpbmQoJy4nICsgSElEREVOX0ZJTEVfSU5QVVRfQ0xBU1MpLnJlbW92ZSgpO1xuICAgICAgICB0aGlzLnJlc2V0RmlsZUlucHV0KCk7XG4gICAgfVxufSk7XG5cbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihGb3JtKTtcbm1vZHVsZS5leHBvcnRzID0gRm9ybTtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBJdGVtVmlldyBtYWtlIGVsZW1lbnQgdG8gZGlzcGxheSBhZGRlZCBmaWxlIGluZm9ybWF0aW9uLiBJdCBoYXMgYXR0YWNoZWQgZmlsZSBJRCB0byByZXF1ZXN0IGZvciByZW1vdmUuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIGNvbnN0cyA9IHJlcXVpcmUoJy4uL2NvbnN0cycpLFxuICAgIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxudmFyIFJFTU9WRV9CVVRUT05fQ0xBU1MgPSBjb25zdHMuQ09ORi5SRU1PVkVfQlVUVE9OX0NMQVNTO1xuXG4vKipcbiAqIENsYXNzIG9mIGl0ZW0gdGhhdCBpcyBtZW1iZXIgb2YgZmlsZSBsaXN0LlxuICogQGNsYXNzIEl0ZW1cbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMubmFtZSBGaWxlIG5hbWVcbiAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy50eXBlIEZpbGUgdHlwZVxuICogIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLnJvb3QgTGlzdCBpbnN0YW5jZVxuICogIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5pZF0gVW5pcXVlIGtleSwgd2hhdCBpZiB0aGUga2V5IGlzIG5vdCBleGlzdCBpZCB3aWxsIGJlIHRoZSBmaWxlIG5hbWUuXG4gKiAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmRlbGV0ZUJ1dHRvbkNsYXNzTmFtZT0ndXBsb2FkZXJfYnRuX2RlbGV0ZSddIFRoZSBjbGFzcyBuYW1lIGlzIGZvciBkZWxldGUgYnV0dG9uLlxuICogIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy50ZW1wbGF0ZV0gaXRlbSB0ZW1wbGF0ZVxuICogIEBwYXJhbSB7KHN0cmluZ3xudW1iZXIpfSBbb3B0aW9ucy5zaXplXSBGaWxlIHNpemUgKGJ1dCBpZSBsb3cgYnJvd3NlciwgeC1kb21haW4pXG4gKi9cbnZhciBJdGVtID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBJdGVtLnByb3RvdHlwZSAqKi8ge1xuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEl0ZW06IExJIGVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJGVsID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSXRlbTogcmVtb3ZlIGJ1dHRvblxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kcmVtb3ZlQnRuID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSXRlbSBuYW1lXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm5hbWUgPSBvcHRpb25zLm5hbWU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEl0ZW0gaWRcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaWQgPSBvcHRpb25zLmlkIHx8IG9wdGlvbnMubmFtZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSXRlbSBzaXplXG4gICAgICAgICAqIEB0eXBlIHtudW1iZXJ8c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5zaXplID0gb3B0aW9ucy5zaXplIHx8ICcnO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJdGVtIHR5cGVcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudHlwZSA9IHRoaXMuX2V4dHJhY3RFeHRlbnNpb24oKTtcblxuICAgICAgICB0aGlzLnJlbmRlcihvcHRpb25zLnJvb3QuJGVsKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVuZGVyIG1ha2luZyBmb3JtIHBhZGRpbmcgd2l0aCBkZWxldGFibGUgaXRlbVxuICAgICAqIEBwYXJhbSB7alF1ZXJ5fSAkdGFyZ2V0IC0gVGFyZ2V0IExpc3QgZWxlbWVudFxuICAgICAqL1xuICAgIHJlbmRlcjogZnVuY3Rpb24oJHRhcmdldCkge1xuICAgICAgICB2YXIgaHRtbCA9IHRoaXMuX2dldEh0bWwoKSxcbiAgICAgICAgICAgIHJlbW92ZUJ1dHRvbkhUTUwgPSB1dGlscy50ZW1wbGF0ZSh7XG4gICAgICAgICAgICAgICAgdGV4dDogJ1JlbW92ZSdcbiAgICAgICAgICAgIH0sIGNvbnN0cy5IVE1MLmJ1dHRvbiksXG4gICAgICAgICAgICAkcmVtb3ZlQnRuID0gJChyZW1vdmVCdXR0b25IVE1MKTtcblxuICAgICAgICB0aGlzLiRyZW1vdmVCdG4gPSAkcmVtb3ZlQnRuXG4gICAgICAgICAgICAuYWRkQ2xhc3MoUkVNT1ZFX0JVVFRPTl9DTEFTUyk7XG5cbiAgICAgICAgdGhpcy4kZWwgPSAkKGh0bWwpXG4gICAgICAgICAgICAuYXBwZW5kKCRyZW1vdmVCdG4pXG4gICAgICAgICAgICAuYXBwZW5kVG8oJHRhcmdldCk7XG5cbiAgICAgICAgdGhpcy5fYWRkRXZlbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXh0cmFjdCBmaWxlIGV4dGVuc2lvbiBieSBuYW1lXG4gICAgICogQHJldHVybnMge3N0cmluZ30gRmlsZSBleHRlbnNpb25cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9leHRyYWN0RXh0ZW5zaW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZS5zcGxpdCgnLicpLnBvcCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgbGlzdEl0ZW0gZWxlbWVudCBIVE1MXG4gICAgICogQHJldHVybnMge3N0cmluZ30gSFRNTFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldEh0bWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbWFwID0ge1xuICAgICAgICAgICAgZmlsZXR5cGU6IHRoaXMudHlwZSxcbiAgICAgICAgICAgIGZpbGVuYW1lOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICBmaWxlc2l6ZTogdGhpcy5zaXplID8gdXRpbHMuZ2V0RmlsZVNpemVXaXRoVW5pdCh0aGlzLnNpemUpIDogJydcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdXRpbHMudGVtcGxhdGUobWFwLCBjb25zdHMuSFRNTC5saXN0SXRlbSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudCBoYW5kbGVyIG9uIGRlbGV0ZSBidXR0b24uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRyZW1vdmVCdG4ub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLl9vbkNsaWNrRXZlbnQsIHRoaXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQtaGFuZGxlIGZvciBkZWxldGUgYnV0dG9uIGNsaWNrZWQuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25DbGlja0V2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5maXJlKCdyZW1vdmUnLCB7XG4gICAgICAgICAgICBuYW1lIDogdGhpcy5uYW1lLFxuICAgICAgICAgICAgaWQgOiB0aGlzLmlkLFxuICAgICAgICAgICAgdHlwZTogJ3JlbW92ZSdcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERlc3Ryb3kgaXRlbVxuICAgICAqL1xuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbC5yZW1vdmUoKTtcbiAgICB9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKEl0ZW0pO1xubW9kdWxlLmV4cG9ydHMgPSBJdGVtO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZpbGVMaXN0VmlldyBsaXN0aW5nIGZpbGVzIGFuZCBkaXNwbGF5IHN0YXRlcyhsaWtlIHNpemUsIGNvdW50KS5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xudmFyIEl0ZW0gPSByZXF1aXJlKCcuL2l0ZW0nKTtcblxuLyoqXG4gKiBMaXN0IGhhcyBpdGVtcy4gSXQgY2FuIGFkZCBhbmQgcmVtb3ZlIGl0ZW0sIGFuZCBnZXQgdG90YWwgdXNhZ2UuXG4gKiBAcGFyYW0ge1VwbG9hZGVyfSB1cGxvYWRlciAtIFVwbG9hZGVyXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCBqUXVlcnk+fSBsaXN0SW5mb1xuICogIEBwYXJhbSB7alF1ZXJ5fSBsaXN0SW5mby5saXN0IC0gTGlzdCBqcXVlcnktZWxlbWVudFxuICogIEBwYXJhbSB7alF1ZXJ5fSBsaXN0SW5mby5jb3VudCAtIENvdW50IGpxdWVyeS1lbGVtZW50XG4gKiAgQHBhcmFtIHtqUXVlcnl9IGxpc3RJbmZvLnNpemUgLSBTaXplIGpxdWVyeS1lbGVtZW50XG4gKiBAY2xhc3MgTGlzdFxuICovXG52YXIgTGlzdCA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgTGlzdC5wcm90b3R5cGUgKi97XG4gICAgaW5pdCA6IGZ1bmN0aW9uKGxpc3RJbmZvKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJdGVtc1xuICAgICAgICAgKiBAdHlwZSB7QXJyYXkuPEl0ZW0+fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBqUXVlcnktZWxlbWVudCBvZiBMaXN0XG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiRlbCA9IGxpc3RJbmZvLmxpc3Q7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGpRdWVyeS1lbGVtZW50IG9mIGNvdW50XG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiRjb3VudGVyID0gbGlzdEluZm8uY291bnQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGpRdWVyeS1lbGVtZW50IG9mIHRvdGFsIHNpemVcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJHNpemUgPSBsaXN0SW5mby5zaXplO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgaXRlbSBsaXN0XG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSBGaWxlIGluZm9ybWF0aW9uKHMpIHdpdGggdHlwZVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbZGF0YS50eXBlXSAtICdyZW1vdmUnIG9yIG5vdC5cbiAgICAgKi9cbiAgICB1cGRhdGU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgaWYgKGRhdGEudHlwZSA9PT0gJ3JlbW92ZScpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZUZpbGVJdGVtKGRhdGEuaWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fYWRkRmlsZUl0ZW1zKGRhdGEpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBpdGVtcyB0b3RhbCBjb3VudCwgdG90YWwgc2l6ZSBpbmZvcm1hdGlvbi5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2luZm9dIEEgaW5mb3JtYXRpb24gdG8gdXBkYXRlIGxpc3QuXG4gICAgICogIEBwYXJhbSB7YXJyYXl9IGluZm8uaXRlbXMgVGhlIGxpc3Qgb2YgZmlsZSBpbmZvcm1hdGlvbi5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IGluZm8uc2l6ZSBUaGUgdG90YWwgc2l6ZS5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IGluZm8uY291bnQgVGhlIGNvdW50IG9mIGZpbGVzLlxuICAgICAqL1xuICAgIHVwZGF0ZVRvdGFsSW5mbzogZnVuY3Rpb24oaW5mbykge1xuICAgICAgICBpZiAoaW5mbykge1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlVG90YWxDb3VudChpbmZvLmNvdW50KTtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVRvdGFsVXNhZ2UoaW5mby5zaXplKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVRvdGFsQ291bnQoKTtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVRvdGFsVXNhZ2UoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgaXRlbXMgdG90YWwgY291bnQgYW5kIHJlZnJlc2ggZWxlbWVudFxuICAgICAqIEBwYXJhbSB7KG51bWJlcnxzdHJpbmcpfSBbY291bnRdIFRvdGFsIGZpbGUgY291bnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF91cGRhdGVUb3RhbENvdW50OiBmdW5jdGlvbihjb3VudCkge1xuICAgICAgICBpZiAoIXR1aS51dGlsLmlzRXhpc3R5KGNvdW50KSkge1xuICAgICAgICAgICAgY291bnQgPSB0aGlzLml0ZW1zLmxlbmd0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuJGNvdW50ZXIuaHRtbChjb3VudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBpdGVtcyB0b3RhbCBzaXplIGFuZCByZWZyZXNoIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0geyhudW1iZXJ8c3RyaW5nKX0gW3NpemVdIFRvdGFsIGZpbGVzIHNpemVzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfdXBkYXRlVG90YWxVc2FnZTogZnVuY3Rpb24oc2l6ZSkge1xuICAgICAgICBpZiAoIXR1aS51dGlsLmlzRXhpc3R5KHNpemUpKSB7XG4gICAgICAgICAgICBzaXplID0gdGhpcy5fZ2V0U3VtQWxsSXRlbVVzYWdlKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR1aS51dGlsLmlzTnVtYmVyKHNpemUpICYmICFpc05hTihzaXplKSkge1xuICAgICAgICAgICAgc2l6ZSA9IHV0aWxzLmdldEZpbGVTaXplV2l0aFVuaXQoc2l6ZSk7XG4gICAgICAgICAgICB0aGlzLiRzaXplLmh0bWwoc2l6ZSk7XG4gICAgICAgICAgICB0aGlzLiRzaXplLnNob3coKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuJHNpemUuaGlkZSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN1bSBzaXplcyBvZiBhbGwgaXRlbXMuXG4gICAgICogQHJldHVybnMge251bWJlcn0gdG90YWxTaXplXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0U3VtQWxsSXRlbVVzYWdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGl0ZW1zID0gdGhpcy5pdGVtcyxcbiAgICAgICAgICAgIHRvdGFsVXNhZ2UgPSAwO1xuXG4gICAgICAgIHR1aS51dGlsLmZvckVhY2goaXRlbXMsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIHRvdGFsVXNhZ2UgKz0gcGFyc2VGbG9hdChpdGVtLnNpemUpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdG90YWxVc2FnZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGZpbGUgaXRlbXNcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdGFyZ2V0IFRhcmdldCBpdGVtIGluZm9ybWF0aW9uLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZEZpbGVJdGVtczogZnVuY3Rpb24odGFyZ2V0KSB7XG4gICAgICAgIGlmICghdHVpLnV0aWwuaXNBcnJheVNhZmUodGFyZ2V0KSkgeyAvLyBmb3IgdGFyZ2V0IGZyb20gaWZyYW1lLCB1c2UgXCJpc0FycmF5U2FmZVwiXG4gICAgICAgICAgICB0YXJnZXQgPSBbdGFyZ2V0XTtcbiAgICAgICAgfVxuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKHRhcmdldCwgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKHRoaXMuX2NyZWF0ZUl0ZW0oZGF0YSkpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpbGUgaXRlbVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIFRoZSBpdGVtIGlkIHRvIHJlbW92ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbW92ZUZpbGVJdGVtOiBmdW5jdGlvbihpZCkge1xuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKHRoaXMuaXRlbXMsIGZ1bmN0aW9uKGl0ZW0sIGluZGV4KSB7XG4gICAgICAgICAgICBpZiAoaWQgPT09IGl0ZW0uaWQpIHtcbiAgICAgICAgICAgICAgICBpdGVtLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICB0aGlzLml0ZW1zLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGl0ZW0gQnkgRGF0YVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIC0gRGF0YSBmb3IgbGlzdCBpdGVtc1xuICAgICAqIEByZXR1cm5zIHtJdGVtfSBJdGVtXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY3JlYXRlSXRlbTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgaXRlbSA9IG5ldyBJdGVtKHtcbiAgICAgICAgICAgIHJvb3Q6IHRoaXMsXG4gICAgICAgICAgICBuYW1lOiBkYXRhLm5hbWUsXG4gICAgICAgICAgICBzaXplOiBkYXRhLnNpemUsXG4gICAgICAgICAgICBpZDogZGF0YS5pZFxuICAgICAgICB9KTtcbiAgICAgICAgaXRlbS5vbigncmVtb3ZlJywgdGhpcy5fcmVtb3ZlRmlsZSwgdGhpcyk7XG4gICAgICAgIHJldHVybiBpdGVtO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBSZW1vdmUgRmlsZVxuICAgICAqIEBwYXJhbSB7SXRlbX0gaXRlbSAtIEl0ZW1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW1vdmVGaWxlOiBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIHRoaXMuZmlyZSgncmVtb3ZlJywgaXRlbSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENsZWFyIGxpc3RcbiAgICAgKi9cbiAgICBjbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHR1aS51dGlsLmZvckVhY2godGhpcy5pdGVtcywgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgaXRlbS5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLml0ZW1zLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMudXBkYXRlVG90YWxJbmZvKCk7XG4gICAgfVxufSk7XG5cbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihMaXN0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBMaXN0O1xuIl19
