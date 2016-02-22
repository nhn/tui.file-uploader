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
            stored: function() {
                this.submit();
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
 * @class DragAndDrop
 * @param {Uploader} uploader - Uploader
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25zdHMuanMiLCJzcmMvanMvcG9vbC5qcyIsInNyYy9qcy9yZXF1ZXN0ZXIvbW9kZXJuLmpzIiwic3JjL2pzL3JlcXVlc3Rlci9vbGQuanMiLCJzcmMvanMvdXBsb2FkZXIuanMiLCJzcmMvanMvdXRpbHMuanMiLCJzcmMvanMvdmlldy9kcmFnLmpzIiwic3JjL2pzL3ZpZXcvZm9ybS5qcyIsInNyYy9qcy92aWV3L2l0ZW0uanMiLCJzcmMvanMvdmlldy9saXN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidHVpLnV0aWwuZGVmaW5lTmFtZXNwYWNlKCd0dWkuY29tcG9uZW50LlVwbG9hZGVyJywgcmVxdWlyZSgnLi9zcmMvanMvdXBsb2FkZXIuanMnKSk7XG5cbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBDb25maWd1cmF0aW9uIG9yIGRlZmF1bHQgdmFsdWVzLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBVcGxvYWRlciBjb25maWdcbiAqL1xubW9kdWxlLmV4cG9ydHMuQ09ORiA9IHtcbiAgICBGSUxFX0ZJTEVEX05BTUU6ICd1c2VyZmlsZVtdJyxcbiAgICBEUk9QX0VOQUJMRURfQ0xBU1M6ICdkcm9wRW5hYmxlZCcsXG4gICAgSElEREVOX0ZJTEVfSU5QVVRfQ0xBU1M6ICdoaWRkZW5GaWxlSW5wdXQnLFxuICAgIFJFUVVFU1RFUl9UWVBFX01PREVSTjogJ21vZGVyblJlcXVlc3RlcicsXG4gICAgUkVRVUVTVEVSX1RZUEVfT0xEOiAnb2xkUmVxdWVzdGVyJyxcbiAgICBGT1JNX1RBUkdFVF9OQU1FOiAnaGlkZGVuRnJhbWUnLFxuICAgIFJFTU9WRV9CVVRUT05fQ0xBU1M6ICdyZW1vdmVCdXR0b24nXG59O1xuXG4vKipcbiAqIERlZmF1bHQgSHRtbHNcbiAqIEB0eXBlIHt7aW5wdXQ6IHN0cmluZywgaXRlbTogc3RyaW5nfX1cbiAqL1xubW9kdWxlLmV4cG9ydHMuSFRNTCA9IHtcbiAgICBmb3JtOiBbXG4gICAgICAgICc8Zm9ybSBlbmN0eXBlPVwibXVsdGlwYXJ0L2Zvcm0tZGF0YVwiIGlkPVwidHVpLXVwbG9hZGVyLWZvcm1cIiBtZXRob2Q9XCJwb3N0XCI+JyxcbiAgICAgICAgJzwvZm9ybT4nXG4gICAgXS5qb2luKCcnKSxcbiAgICBzdWJtaXQ6ICc8YnV0dG9uIGNsYXNzPVwiYmF0Y2hTdWJtaXRcIiB0eXBlPVwic3VibWl0XCI+U0VORDwvYnV0dG9uPicsXG4gICAgZmlsZUlucHV0OiAnPGlucHV0IHR5cGU9XCJmaWxlXCIgaWQ9XCJmaWxlQXR0YWNoXCIge3tkaXJlY3Rvcnl9fSBuYW1lPVwie3tmaWxlRmllbGR9fVwiIHt7bXVsdGlwbGV9fSAvPicsXG4gICAgaGlkZGVuSW5wdXQ6ICc8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJ7e25hbWV9fVwiIHZhbHVlPVwie3t2YWx1ZX19XCI+JyxcbiAgICBidXR0b246ICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIj57e3RleHR9fTwvYnV0dG9uPicsXG4gICAgbGlzdEl0ZW06IFtcbiAgICAgICAgJzxsaSBjbGFzcz1cImZpbGV0eXBlRGlzcGxheUNsYXNzXCI+JyxcbiAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImZpbGVpY29uIHt7ZmlsZXR5cGV9fVwiPnt7ZmlsZXR5cGV9fTwvc3Bhbj4nLFxuICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwiZmlsZV9uYW1lXCI+e3tmaWxlbmFtZX19PC9zcGFuPicsXG4gICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJmaWxlX3NpemVcIj57e2ZpbGVzaXplfX08L3NwYW4+JyxcbiAgICAgICAgJzwvbGk+J1xuICAgIF0uam9pbignJyksXG4gICAgZHJhZ0FuZERyb3A6ICc8ZGl2IGNsYXNzPVwiZHJvcHpvbmVcIj48L2Rpdj4nXG59O1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgaXMgbWFuYWdlciBvZiBpbnB1dCBlbGVtZW50cyB0aGF0IGFjdCBsaWtlIGZpbGUgcG9vbC5cbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBjb25zdHMgPSByZXF1aXJlKCcuL2NvbnN0cycpO1xuXG52YXIgSElEREVOX0ZJTEVfSU5QVVRfQ0xBU1MgPSBjb25zdHMuQ09ORi5ISURERU5fRklMRV9JTlBVVF9DTEFTUyxcbiAgICBmb3JFYWNoID0gdHVpLnV0aWwuZm9yRWFjaCxcbiAgICBoYXNTdGFtcCA9IHR1aS51dGlsLmhhc1N0YW1wLFxuICAgIHN0YW1wID0gdHVpLnV0aWwuc3RhbXA7XG5cbi8qKlxuICogVGhlIHBvb2wgZm9yIHNhdmUgZmlsZXMuXG4gKiBJdCdzIG9ubHkgZm9yIGlucHV0W2ZpbGVdIGVsZW1lbnQgc2F2ZSBhdCBicm93c2VyIHRoYXQgZG9lcyBub3Qgc3VwcG9ydCBmaWxlIGFwaS5cbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHBsYW5ldCAtIEZvcm0gZWxlbWVudFxuICogQGNsYXNzIFBvb2xcbiAqL1xudmFyIFBvb2wgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFBvb2wucHJvdG90eXBlICove1xuICAgIGluaXQ6IGZ1bmN0aW9uKHBsYW5ldCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogU3VibWl0dGVyIGZvciBmaWxlIGVsZW1lbnQgdG8gc2VydmVyXG4gICAgICAgICAqIEZvcm0gZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnBsYW5ldCA9IHBsYW5ldDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRmlsZSBkYXRhIHN0cnVjdHVyZSBvYmplY3RcbiAgICAgICAgICogIGtleT1uYW1lIDogdmFsdWU9aXVwdXRbdHlwZT1maWxlXShFbGVtZW50KVxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5maWxlcyA9IHt9O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTYXZlIGEgaW5wdXQgZWxlbWVudFt0eXBlPWZpbGVdLCBhcyB2YWx1ZSBvZiBmaWxlIG5hbWUuXG4gICAgICogQHBhcmFtIHtIVE1MSW5wdXRFbGVtZW50fSBpbnB1dEZpbGVFbCBBIGlucHV0IGVsZW1lbnQgdGhhdCBoYXZlIHRvIGJlIHNhdmVkXG4gICAgICovXG4gICAgc3RvcmU6IGZ1bmN0aW9uKGlucHV0RmlsZUVsKSB7XG4gICAgICAgIHZhciBpZCA9IGhhc1N0YW1wKGlucHV0RmlsZUVsKSAmJiBzdGFtcChpbnB1dEZpbGVFbCksXG4gICAgICAgICAgICBmaWxlbmFtZSwga2V5O1xuXG4gICAgICAgIGlmICghaWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBmaWxlbmFtZSA9IGlucHV0RmlsZUVsLnZhbHVlO1xuICAgICAgICBrZXkgPSBpZCArIGZpbGVuYW1lO1xuICAgICAgICB0aGlzLmZpbGVzW2tleV0gPSBpbnB1dEZpbGVFbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgaW5wdXQgZWxlbWVudFt0eXBlPWZpbGVdIGZyb20gcG9vbC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIC0gQSBmaWxlIG5hbWUgdGhhdCBoYXZlIHRvIGJlIHJlbW92ZWQuXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gcmVzdWx0XG4gICAgICovXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICAgICAgdmFyIGtleSA9IHBhcmFtcy5pZCArIHBhcmFtcy5uYW1lLFxuICAgICAgICAgICAgZWxlbWVudCA9IHRoaXMuZmlsZXNba2V5XTtcblxuICAgICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlbGV0ZSB0aGlzLmZpbGVzW2tleV07XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFbXB0eSBwb29sXG4gICAgICovXG4gICAgZW1wdHk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmZpbGVzID0ge307XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFBsYW50IGZpbGVzIG9uIHBvb2wgdG8gZm9ybSBpbnB1dFxuICAgICAqL1xuICAgIHBsYW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHBsYW5ldCA9IHRoaXMucGxhbmV0O1xuICAgICAgICBmb3JFYWNoKHRoaXMuZmlsZXMsIGZ1bmN0aW9uKGVsZW1lbnQsIGtleSkge1xuICAgICAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgPSBISURERU5fRklMRV9JTlBVVF9DTEFTUztcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIHBsYW5ldC5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmZpbGVzW2tleV07XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBvb2w7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjb25zdHMgPSByZXF1aXJlKCcuLi9jb25zdHMnKTtcblxudmFyIFRZUEUgPSBjb25zdHMuQ09ORi5SRVFVRVNURVJfVFlQRV9NT0RFUk4sXG4gICAgZm9yRWFjaCA9IHR1aS51dGlsLmZvckVhY2g7XG5cbi8qKlxuICogTW9kZXJuIHJlcXVlc3RlclxuICogQHBhcmFtIHtVcGxvYWRlcn0gdXBsb2FkZXIgLSBVcGxvYWRlclxuICogQGNsYXNzXG4gKi9cbnZhciBNb2Rlcm4gPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIE1vZGVybi5wcm90b3R5cGUgKi97XG4gICAgaW5pdDogZnVuY3Rpb24odXBsb2FkZXIpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFVwbG9hZGVyXG4gICAgICAgICAqIEB0eXBlIHtVcGxvYWRlcn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudXBsb2FkZXIgPSB1cGxvYWRlcjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRnJvbSB2aWV3XG4gICAgICAgICAqIEB0eXBlIHtGb3JtfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5mb3JtVmlldyA9IHVwbG9hZGVyLmZvcm1WaWV3O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMb2NhbCBwb29sIGZvciBmaWxlc1xuICAgICAgICAgKiBAdHlwZSB7QXJyYXkuPEZpbGU+fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wb29sID0gW107XG5cbiAgICAgICAgaWYgKHVwbG9hZGVyLmlzQmF0Y2hUcmFuc2Zlcikge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBPdmVycmlkZSByZW1vdmUgZnVuY3Rpb24gZm9yIGJhdGNoIHRyYW5zZmVyXG4gICAgICAgICAgICAgKiBAdHlwZSB7T2xkLl9yZW1vdmVXaGVuQmF0Y2h9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMucmVtb3ZlID0gdGhpcy5fcmVtb3ZlV2hlbkJhdGNoO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtzdHJpbmd9IFJlcXVlc3RlciB0eXBlXG4gICAgICovXG4gICAgVFlQRTogVFlQRSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgZm9yIHVwbG9hZCBlcnJvclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBqcVhIUiAtIGpRdWVyeSBYSFJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdHVzIC0gQWpheCBTdGF0dXNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbXNnVGhyb3duIC0gRXJyb3IgbWVzc2FnZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwbG9hZEVycm9yOiBmdW5jdGlvbihqcVhIUiwgc3RhdHVzLCBtc2dUaHJvd24pIHtcbiAgICAgICAgdGhpcy5maXJlKCdlcnJvcicsIHtcbiAgICAgICAgICAgIHN0YXR1czogc3RhdHVzLFxuICAgICAgICAgICAgbWVzc2FnZTogbXNnVGhyb3duXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIGZvciB1cGxvYWQgc3VjY2Vzc1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gVXBsb2FkIHN1Y2Nlc3MgZGF0YVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwbG9hZFN1Y2Nlc3M6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdGhpcy5maXJlKCd1cGxvYWRlZCcsIEpTT04ucGFyc2UoZGF0YSkpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdG9yZSBmaWxlcyB0byBsb2NhbCBwb29sXG4gICAgICogQHBhcmFtIHtBcnJheS48RmlsZT4gfCBGaWxlfSBbZmlsZXNdIC0gQSBmaWxlIG9yIGZpbGVzXG4gICAgICovXG4gICAgc3RvcmU6IGZ1bmN0aW9uKGZpbGVzKSB7XG4gICAgICAgIHZhciBwb29sID0gdGhpcy5wb29sLFxuICAgICAgICAgICAgc3RhbXAgPSB0dWkudXRpbC5zdGFtcCxcbiAgICAgICAgICAgIGRhdGEgPSBbXTtcblxuICAgICAgICBmaWxlcyA9IHR1aS51dGlsLnRvQXJyYXkoZmlsZXMgfHwgdGhpcy5mb3JtVmlldy4kZmlsZUlucHV0WzBdLmZpbGVzKTtcbiAgICAgICAgZm9yRWFjaChmaWxlcywgZnVuY3Rpb24oZmlsZSkge1xuICAgICAgICAgICAgdmFyIGlkID0gc3RhbXAoZmlsZSk7XG4gICAgICAgICAgICBwb29sLnB1c2goZmlsZSk7XG4gICAgICAgICAgICBkYXRhLnB1c2goe1xuICAgICAgICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICAgICAgICBuYW1lOiBmaWxlLm5hbWUsXG4gICAgICAgICAgICAgICAgc2l6ZTogZmlsZS5zaXplXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5mb3JtVmlldy5yZXNldEZpbGVJbnB1dCgpO1xuICAgICAgICB0aGlzLmZpcmUoJ3N0b3JlZCcsIGRhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGxvYWQgYWpheFxuICAgICAqL1xuICAgIHVwbG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBmaWVsZCA9IHRoaXMudXBsb2FkZXIuZmlsZUZpZWxkLFxuICAgICAgICAgICAgJGZvcm0gPSB0aGlzLmZvcm1WaWV3LiRlbC5jbG9uZSgpLFxuICAgICAgICAgICAgZm9ybURhdGE7XG5cbiAgICAgICAgJGZvcm0uZmluZCgnaW5wdXRbdHlwZT1cImZpbGVcIl0nKS5yZW1vdmUoKTtcbiAgICAgICAgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoJGZvcm1bMF0pO1xuXG4gICAgICAgIGZvckVhY2godGhpcy5wb29sLCBmdW5jdGlvbihmaWxlKSB7XG4gICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoZmllbGQsIGZpbGUpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiB0aGlzLnVwbG9hZGVyLnVybC5zZW5kLFxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgZGF0YTogZm9ybURhdGEsXG4gICAgICAgICAgICBzdWNjZXNzOiAkLnByb3h5KHRoaXMuX3VwbG9hZFN1Y2Nlc3MsIHRoaXMpLFxuICAgICAgICAgICAgZXJyb3I6ICQucHJveHkodGhpcy5fdXBsb2FkRXJyb3IsIHRoaXMpLFxuICAgICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBmaWxlIChhamF4LWpzb25wKVxuICAgICAqIEl0IGlzIG5vdCB1c2VkIGZvciBiYXRjaCB0cmFuc2Zlci5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIC0gUGFyYW1ldGVycyB0byByZW1vdmUgZmlsZVxuICAgICAqL1xuICAgIHJlbW92ZTogZnVuY3Rpb24ocGFyYW1zKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHVwbG9hZGVyLnVybC5yZW1vdmUsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb25wJyxcbiAgICAgICAgICAgIGRhdGE6IHBhcmFtcyxcbiAgICAgICAgICAgIHN1Y2Nlc3M6ICQucHJveHkoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIGRhdGEudHlwZSA9ICdyZW1vdmUnO1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgncmVtb3ZlZCcsIGRhdGEpO1xuICAgICAgICAgICAgfSwgdGhpcylcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBmaWxlIChhamF4LWpzb25wKVxuICAgICAqIEl0IGlzIHVzZWQgZm9yIGJhdGNoIHRyYW5zZmVyLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgLSBQYXJhbWV0ZXJzIHRvIHJlbW92ZSBmaWxlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlV2hlbkJhdGNoOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICAgICAgdmFyIHBvb2wgPSB0aGlzLnBvb2wsXG4gICAgICAgICAgICBoYXNTdGFtcCA9IHR1aS51dGlsLmhhc1N0YW1wLFxuICAgICAgICAgICAgc3RhbXAgPSB0dWkudXRpbC5zdGFtcCxcbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbHNlO1xuXG4gICAgICAgIGZvckVhY2gocG9vbCwgZnVuY3Rpb24oZmlsZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmIChoYXNTdGFtcChmaWxlKSAmJiAoc3RhbXAoZmlsZSkgPT09IHBhcmFtcy5pZCkpIHtcbiAgICAgICAgICAgICAgICBwb29sLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuZmlyZSgncmVtb3ZlZCcsIHR1aS51dGlsLmV4dGVuZCh7XG4gICAgICAgICAgICBtZXNzYWdlOiByZXN1bHQgPyAnc3VjY2VzcycgOiAnZmFpbCdcbiAgICAgICAgfSwgcGFyYW1zKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENsZWFyIHRoZSBwb29sXG4gICAgICovXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnBvb2wubGVuZ3RoID0gMDtcbiAgICB9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKE1vZGVybik7XG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVybjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFBvb2wgPSByZXF1aXJlKCcuLi9wb29sJyksXG4gICAgY29uc3RzID0gcmVxdWlyZSgnLi4vY29uc3RzJyk7XG5cbnZhciBUWVBFID0gY29uc3RzLkNPTkYuUkVRVUVTVEVSX1RZUEVfT0xEO1xuXG4vKipcbiAqIE9sZCByZXF1ZXN0ZXJcbiAqIEBwYXJhbSB7VXBsb2FkZXJ9IHVwbG9hZGVyIC0gVXBsb2FkZXJcbiAqIEBjbGFzc1xuICovXG52YXIgT2xkID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBPbGQucHJvdG90eXBlICove1xuICAgIGluaXQ6IGZ1bmN0aW9uKHVwbG9hZGVyKSB7XG4gICAgICAgIHZhciAkaGlkZGVuRnJhbWUgPSB1cGxvYWRlci4kdGFyZ2V0RnJhbWUsXG4gICAgICAgICAgICBmb3JtVmlldyA9IHVwbG9hZGVyLmZvcm1WaWV3O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBVcGxvYWRlclxuICAgICAgICAgKiBAdHlwZSB7VXBsb2FkZXJ9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnVwbG9hZGVyID0gdXBsb2FkZXI7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZyb20gdmlld1xuICAgICAgICAgKiBAdHlwZSB7Rm9ybX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZm9ybVZpZXcgPSBmb3JtVmlldztcblxuICAgICAgICAvKipcbiAgICAgICAgICogTG9jYWwgcG9vbCBmb3IgZmlsZSBlbGVtZW50c1xuICAgICAgICAgKiBAdHlwZSB7UG9vbH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucG9vbCA9IG5ldyBQb29sKGZvcm1WaWV3LiRlbFswXSk7XG5cbiAgICAgICAgaWYgKHVwbG9hZGVyLmlzQmF0Y2hUcmFuc2Zlcikge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBPdmVycmlkZSBVcGxvYWQgZnVuY3Rpb24gZm9yIGJhdGNoIHRyYW5zZmVyXG4gICAgICAgICAgICAgKiBAdHlwZSB7T2xkLl91cGxvYWRXaGVuQmF0Y2h9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMudXBsb2FkID0gdGhpcy5fdXBsb2FkV2hlbkJhdGNoO1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE92ZXJyaWRlIHJlbW92ZSBmdW5jdGlvbiBmb3IgYmF0Y2ggdHJhbnNmZXJcbiAgICAgICAgICAgICAqIEB0eXBlIHtPbGQuX3JlbW92ZVdoZW5CYXRjaH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUgPSB0aGlzLl9yZW1vdmVXaGVuQmF0Y2g7XG4gICAgICAgIH1cblxuICAgICAgICAkaGlkZGVuRnJhbWUub24oJ2xvYWQnLCAkLnByb3h5KHRoaXMuX29uTG9hZEhpZGRlbkZyYW1lLCB0aGlzLCAkaGlkZGVuRnJhbWUpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge3N0cmluZ30gUmVxdWVzdGVyIHR5cGVcbiAgICAgKi9cbiAgICBUWVBFOiBUWVBFLFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlclxuICAgICAqIFwibG9hZFwiIG9mIGhpZGRlbiBmcmFtZS5cbiAgICAgKiBAcGFyYW0ge2pRdWVyeX0gJGhpZGRlbkZyYW1lIC0gSGlkZGVuIGlmcmFtZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uTG9hZEhpZGRlbkZyYW1lOiBmdW5jdGlvbigkaGlkZGVuRnJhbWUpIHtcbiAgICAgICAgdmFyIGZyYW1lQm9keSxcbiAgICAgICAgICAgIGRhdGE7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZyYW1lQm9keSA9ICRoaWRkZW5GcmFtZVswXS5jb250ZW50V2luZG93LmRvY3VtZW50LmJvZHk7XG4gICAgICAgICAgICBkYXRhID0gdHVpLnV0aWwucGljayhmcmFtZUJvZHksICdmaXJzdENoaWxkJywgJ2RhdGEnKTtcbiAgICAgICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCd1cGxvYWRlZCcsICQucGFyc2VKU09OKGRhdGEpKTtcbiAgICAgICAgICAgICAgICBmcmFtZUJvZHkuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgnZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgc3RhdHVzOiBlLm5hbWUsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogZS5tZXNzYWdlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdG9yZSBmaWxlIGlucHV0IGVsZW1lbnQgZnJvbSB1cGxvYWQgZm9ybVxuICAgICAqL1xuICAgIHN0b3JlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGVsID0gdGhpcy5mb3JtVmlldy4kZmlsZUlucHV0WzBdLFxuICAgICAgICAgICAgaWQgPSB0dWkudXRpbC5zdGFtcChlbCk7XG5cbiAgICAgICAgdGhpcy5wb29sLnN0b3JlKGVsKTtcbiAgICAgICAgdGhpcy5mb3JtVmlldy5yZXNldEZpbGVJbnB1dCgpO1xuXG4gICAgICAgIHRoaXMuZmlyZSgnc3RvcmVkJywgW3tcbiAgICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICAgIG5hbWU6IGVsLnZhbHVlLFxuICAgICAgICAgICAgc2l6ZTogJydcbiAgICAgICAgfV0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGxvYWQuXG4gICAgICogSXQgaXMgbm90IHVzZWQgZm9yIGJhdGNoIHRyYW5zZmVyLlxuICAgICAqL1xuICAgIHVwbG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucG9vbC5wbGFudCgpO1xuICAgICAgICB0aGlzLmZvcm1WaWV3LiRlbC5zdWJtaXQoKTtcbiAgICAgICAgdGhpcy5mb3JtVmlldy5jbGVhcigpO1xuICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwbG9hZC5cbiAgICAgKiBJdCBpcyB1c2VkIGZvciBiYXRjaCB0cmFuc2Zlci5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF91cGxvYWRXaGVuQmF0Y2g6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnBvb2wucGxhbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpbGUgKGFqYXgtanNvbnApXG4gICAgICogSXQgaXMgbm90IHVzZWQgZm9yIGJhdGNoIHRyYW5zZmVyLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgLSBQYXJhbWV0ZXJzIHRvIHJlbW92ZSBmaWxlXG4gICAgICovXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICAgICAgdmFyIHVwbG9hZGVyID0gdGhpcy51cGxvYWRlcjtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogdXBsb2FkZXIudXJsLnJlbW92ZSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbnAnLFxuICAgICAgICAgICAgZGF0YTogcGFyYW1zLFxuICAgICAgICAgICAgc3VjY2VzczogJC5wcm94eShmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgZGF0YS50eXBlID0gJ3JlbW92ZSc7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdyZW1vdmVkJywgZGF0YSk7XG4gICAgICAgICAgICB9LCB0aGlzKVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpbGUgKGFqYXgtanNvbnApXG4gICAgICogSXQgaXMgdXNlZCBmb3IgYmF0Y2ggdHJhbnNmZXIuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyAtIFBhcmFtZXRlcnMgdG8gcmVtb3ZlIGZpbGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW1vdmVXaGVuQmF0Y2g6IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy5wb29sLnJlbW92ZShwYXJhbXMpO1xuXG4gICAgICAgIHRoaXMuZmlyZSgncmVtb3ZlZCcsIHR1aS51dGlsLmV4dGVuZCh7XG4gICAgICAgICAgICBtZXNzYWdlOiByZXN1bHQgPyAnc3VjY2VzcycgOiAnZmFpbCdcbiAgICAgICAgfSwgcGFyYW1zKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENsZWFyIHRoZSBwb29sXG4gICAgICovXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnBvb2wuZW1wdHkoKTtcbiAgICB9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKE9sZCk7XG5tb2R1bGUuZXhwb3J0cyA9IE9sZDtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBGaWxlVXBsb2FkZXIgaXMgY29yZSBvZiBmaWxlIHVwbG9hZGVyIGNvbXBvbmVudC48YnI+RmlsZU1hbmFnZXIgbWFuYWdlIGNvbm5lY3RvciB0byBjb25uZWN0IHNlcnZlciBhbmQgdXBkYXRlIEZpbGVMaXN0Vmlldy5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG52YXIgY29uc3RzID0gcmVxdWlyZSgnLi9jb25zdHMnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBGb3JtID0gcmVxdWlyZSgnLi92aWV3L2Zvcm0nKTtcbnZhciBMaXN0ID0gcmVxdWlyZSgnLi92aWV3L2xpc3QnKTtcbnZhciBEcmFnQW5kRHJvcCA9IHJlcXVpcmUoJy4vdmlldy9kcmFnJyk7XG52YXIgT2xkUmVxdWVzdGVyID0gcmVxdWlyZSgnLi9yZXF1ZXN0ZXIvb2xkJyk7XG52YXIgTW9kZXJuUmVxdWVzdGVyID0gcmVxdWlyZSgnLi9yZXF1ZXN0ZXIvbW9kZXJuJyk7XG5cbnZhciBSRVFVRVNURVJfVFlQRV9NT0RFUk4gPSBjb25zdHMuQ09ORi5SRVFVRVNURVJfVFlQRV9NT0RFUk47XG5cbi8qKlxuICogRmlsZVVwbG9hZGVyIGFjdCBsaWtlIGJyaWRnZSBiZXR3ZWVuIGNvbm5lY3RvciBhbmQgdmlldy5cbiAqIEl0IG1ha2VzIGNvbm5lY3RvciBhbmQgdmlldyB3aXRoIG9wdGlvbiBhbmQgZW52aXJvbm1lbnQuXG4gKiBJdCBjb250cm9sIGFuZCBtYWtlIGNvbm5lY3Rpb24gYW1vbmcgbW9kdWxlcy5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgVGhlIG9wdGlvbnMgdG8gc2V0IHVwIGZpbGUgdXBsb2FkZXIgbW9kdWxlcy5cbiAqICBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy51cmwgVGhlIHVybCBpcyBmaWxlIHNlcnZlci5cbiAqICAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMudXJsLnNlbmQgVGhlIHVybCBpcyBmb3IgZmlsZSBhdHRhY2guXG4gKiAgICAgIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnVybC5yZW1vdmUgVGhlIHVybCBpcyBmb3IgZmlsZSBkZXRhY2guXG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuZm9ybVRhcmdldCBUaGUgdGFyZ2V0IGZvciB4LWRvbWFpbiBqc29ucCBjYXNlLlxuICogIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLmxpc3RJbmZvIFRoZSBlbGVtZW50IGluZm8gdG8gZGlzcGxheSBmaWxlIGxpc3QgaW5mb3JtYXRpb24uXG4gKiAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmZpbGVGaWVsZD0ndXNlckZpbGVbXSddIFRoZSBmaWVsZCBuYW1lIG9mIGlucHV0IGZpbGUgZWxlbWVudC5cbiAqICBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMudXNlRm9sZGVyIFdoZXRoZXIgc2VsZWN0IHVuaXQgaXMgZm9sZGVyIG9mIG5vdC4gSWYgdGhpcyBpcyB0dXJlLCBtdWx0aXBsZSB3aWxsIGJlIGlnbm9yZWQuXG4gKiAgQHBhcmFtIHtib29sZWFufSBvcHRpb25zLmlzTXVsdGlwbGUgV2hldGhlciBlbmFibGUgbXVsdGlwbGUgc2VsZWN0IG9yIG5vdC5cbiAqIEBwYXJhbSB7alF1ZXJ5fSAkZWwgUm9vdCBFbGVtZW50IG9mIFVwbG9hZGVyXG4gKiBAZXhhbXBsZVxuICogdmFyIHVwbG9hZGVyID0gbmV3IHR1aS5jb21wb25lbnQuVXBsb2FkZXIoe1xuICogICAgIHVybDoge1xuICogICAgICAgICBzZW5kOiBcImh0dHA6Ly9mZS5uaG5lbnQuY29tL2V0Yy9ldGMvdXBsb2FkZXIvdXBsb2FkZXIucGhwXCIsXG4gKiAgICAgICAgIHJlbW92ZTogXCJodHRwOi8vZmUubmhuZW50LmNvbS9ldGMvZXRjL3VwbG9hZGVyL3JlbW92ZS5waHBcIlxuICogICAgIH0sXG4gKiAgICAgZm9ybVRhcmdldDogJ2hpZGRlbkZyYW1lJyxcbiAqICAgICBsaXN0SW5mbzoge1xuICogICAgICAgICBsaXN0OiAkKCcjZmlsZXMnKSxcbiAqICAgICAgICAgY291bnQ6ICQoJyNmaWxlX2NvdW50JyksXG4gKiAgICAgICAgIHNpemU6ICQoJyNzaXplX2NvdW50JylcbiAqICAgICB9XG4gKiB9LCAkKCcjdXBsb2FkZXInKSk7XG4gKi9cbnZhciBVcGxvYWRlciA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKkBsZW5kcyBVcGxvYWRlci5wcm90b3R5cGUgKi97XG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucywgJGVsKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBVcGxvYWRlciBlbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiRlbCA9ICRlbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2VuZC9SZW1vdmUgdXJsXG4gICAgICAgICAqIEB0eXBlIHt7c2VuZDogc3RyaW5nLCByZW1vdmU6IHN0cmluZ319XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnVybCA9IG9wdGlvbnMudXJsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZWRpcmVjdCBVUkwgZm9yIENPUlMocmVzcG9uc2UsIElFNylcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucmVkaXJlY3RVUkwgPSBvcHRpb25zLnJlZGlyZWN0VVJMO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGb3JtIHRhcmdldCBuYW1lIGZvciBDT1JTIChJRTcsIDgsIDkpXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZvcm1UYXJnZXQgPSBvcHRpb25zLmZvcm1UYXJnZXQgfHwgY29uc3RzLkNPTkYuRk9STV9UQVJHRVRfTkFNRTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGFyZ2V0IGZyYW1lIGZvciBDT1JTIChJRTcsIDgsIDkpXG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiR0YXJnZXRGcmFtZSA9IHRoaXMuX2NyZWF0ZVRhcmdldEZyYW1lKClcbiAgICAgICAgICAgIC5hcHBlbmRUbyh0aGlzLiRlbCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElucHV0IGZpbGUgLSBmaWVsZCBuYW1lXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZpbGVGaWVsZCA9IG9wdGlvbnMuZmlsZUZpZWxkIHx8IGNvbnN0cy5DT05GLkZJTEVfRklMRURfTkFNRTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciB0aGUgdXBsb2FkZXIgdXNlcyBiYXRjaC10cmFuc2ZlclxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaXNCYXRjaFRyYW5zZmVyID0gISEob3B0aW9ucy5pc0JhdGNoVHJhbnNmZXIpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHRoZSBzZW5kaW5nL3JlbW92aW5nIHVybHMgYXJlIHgtZG9tYWluLlxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaXNDcm9zc0RvbWFpbiA9IHV0aWxzLmlzQ3Jvc3NEb21haW4odGhpcy51cmwuc2VuZCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgUG9zdE1lc3NhZ2UgQVBJXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc1N1cHBvcnRQb3N0TWVzc2FnZSA9ICEhKHR1aS51dGlsLnBpY2sodGhpcy4kdGFyZ2V0RnJhbWUsICcwJywgJ2NvbnRlbnRXaW5kb3cnLCAncG9zdE1lc3NhZ2UnKSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdoZXRoZXIgdGhlIHVzZXIgdXNlcyBtdWx0aXBsZSB1cGxvYWRcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzTXVsdGlwbGUgPSAhIShvcHRpb25zLmlzTXVsdGlwbGUpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHRoZSB1c2VyIHVzZXMgZHJhZyZkcm9wIHVwbG9hZFxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudXNlRHJhZyA9ICEhKG9wdGlvbnMudXNlRHJhZyk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdoZXRoZXIgdGhlIHVzZXIgdXNlcyBmb2xkZXIgdXBsb2FkXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy51c2VGb2xkZXIgPSAhIShvcHRpb25zLnVzZUZvbGRlcik7XG5cbiAgICAgICAgaWYgKHRoaXMudXNlRHJhZyAmJiAhdGhpcy51c2VGb2xkZXIgJiYgdXRpbHMuaXNTdXBwb3J0RmlsZVN5c3RlbSgpKSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIERyYWcgJiBEcm9wIFZpZXdcbiAgICAgICAgICAgICAqIEB0eXBlIHtEcmFnQW5kRHJvcH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5kcmFnVmlldyA9IG5ldyBEcmFnQW5kRHJvcCh0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGcm9tIFZpZXdcbiAgICAgICAgICogQHR5cGUge0Zvcm19XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZvcm1WaWV3ID0gbmV3IEZvcm0odGhpcyk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExpc3QgVmlld1xuICAgICAgICAgKiBAdHlwZSB7TGlzdH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubGlzdFZpZXcgPSBuZXcgTGlzdChvcHRpb25zLmxpc3RJbmZvKTtcblxuICAgICAgICB0aGlzLl9zZXRSZXF1ZXN0ZXIoKTtcbiAgICAgICAgdGhpcy5fYWRkRXZlbnQoKTtcbiAgICAgICAgaWYgKHRoaXMuaXNDcm9zc0RvbWFpbiAmJiB0aGlzLmlzU3VwcG9ydFBvc3RNZXNzYWdlKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRQb3N0TWVzc2FnZUV2ZW50KCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IENvbm5lY3RvclxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldFJlcXVlc3RlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh1dGlscy5pc1N1cHBvcnRGb3JtRGF0YSgpKSB7XG4gICAgICAgICAgICB0aGlzLl9yZXF1ZXN0ZXIgPSBuZXcgTW9kZXJuUmVxdWVzdGVyKHRoaXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fcmVxdWVzdGVyID0gbmV3IE9sZFJlcXVlc3Rlcih0aGlzKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgcG9zdC1tZXNzYWdlIGV2ZW50IGlmIHN1cHBvcnRlZCBhbmQgbmVlZGVkXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0UG9zdE1lc3NhZ2VFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJHRhcmdldEZyYW1lLm9mZignbG9hZCcpO1xuICAgICAgICAkKHdpbmRvdykub24oJ21lc3NhZ2UnLCAkLnByb3h5KGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgb3JpZ2luYWxFdmVudCA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQsXG4gICAgICAgICAgICAgICAgZGF0YTtcblxuICAgICAgICAgICAgaWYgKHRoaXMudXJsLnNlbmQuaW5kZXhPZihvcmlnaW5hbEV2ZW50Lm9yaWdpbikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGF0YSA9ICQucGFyc2VKU09OKG9yaWdpbmFsRXZlbnQuZGF0YSk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQmF0Y2hUcmFuc2Zlcikge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMaXN0KGRhdGEuZmlsZWxpc3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5maXJlKCdzdWNjZXNzJywgZGF0YSk7XG4gICAgICAgIH0sIHRoaXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSB0YXJnZXQgZnJhbWUgdG8gYmUgdGFyZ2V0IG9mIGZvcm0gZWxlbWVudC5cbiAgICAgKiBAcmV0dXJucyB7alF1ZXJ5fSBUYXJnZXQgZnJhbWU6IGpxdWVyeS1lbGVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY3JlYXRlVGFyZ2V0RnJhbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHRhcmdldCA9ICQoJzxpZnJhbWUgbmFtZT1cIicgKyB0aGlzLmZvcm1UYXJnZXQgKyAnXCI+PC9pZnJhbWU+Jyk7XG4gICAgICAgICR0YXJnZXQuY3NzKHtcbiAgICAgICAgICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nLFxuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuICR0YXJnZXQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudHMgdG8gdmlld3MgYW5kIGZpcmUgdXBsb2FkZXIgZXZlbnRzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy51c2VEcmFnICYmIHRoaXMuZHJhZ1ZpZXcpIHtcbiAgICAgICAgICAgIHRoaXMuZHJhZ1ZpZXcub24oJ2Ryb3AnLCB0aGlzLnN0b3JlLCB0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxpc3RWaWV3Lm9uKCdyZW1vdmUnLCB0aGlzLnJlbW92ZUZpbGUsIHRoaXMpO1xuICAgICAgICBpZiAodGhpcy5pc0JhdGNoVHJhbnNmZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX2FkZEV2ZW50V2hlbkJhdGNoVHJhbnNmZXIoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2FkZEV2ZW50V2hlbk5vcm1hbFRyYW5zZmVyKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IHdoZW4gdXBsb2FkZXIgdXNlcyBiYXRjaC10cmFuc2ZlclxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZEV2ZW50V2hlbkJhdGNoVHJhbnNmZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmZvcm1WaWV3Lm9uKHtcbiAgICAgICAgICAgIGNoYW5nZTogdGhpcy5zdG9yZSxcbiAgICAgICAgICAgIHN1Ym1pdDogdGhpcy5zdWJtaXRcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgdGhpcy5fcmVxdWVzdGVyLm9uKHtcbiAgICAgICAgICAgIHJlbW92ZWQ6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxpc3QoZGF0YSk7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdyZW1vdmUnLCBkYXRhKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgnZXJyb3InLCBkYXRhKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1cGxvYWRlZDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3N1Y2Nlc3MnLCBkYXRhKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yZWQ6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxpc3QoZGF0YSk7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCd1cGRhdGUnLCBkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudCB3aGVuIHVwbG9hZGVyIHVzZXMgbm9ybWFsLXRyYW5zZmVyXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRXZlbnRXaGVuTm9ybWFsVHJhbnNmZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmZvcm1WaWV3Lm9uKCdjaGFuZ2UnLCB0aGlzLnNlbmRGaWxlLCB0aGlzKTtcbiAgICAgICAgdGhpcy5fcmVxdWVzdGVyLm9uKHtcbiAgICAgICAgICAgIHJlbW92ZWQ6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxpc3QoZGF0YSk7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdyZW1vdmUnLCBkYXRhKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgnZXJyb3InLCBkYXRhKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3VibWl0KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXBsb2FkZWQ6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUxpc3QoZGF0YS5maWxlbGlzdCk7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdzdWNjZXNzJywgZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgbGlzdCB2aWV3IHdpdGggY3VzdG9tIG9yIG9yaWdpbmFsIGRhdGEuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtpbmZvXSBUaGUgZGF0YSBmb3IgdXBkYXRlIGxpc3RcbiAgICAgKi9cbiAgICB1cGRhdGVMaXN0OiBmdW5jdGlvbihpbmZvKSB7XG4gICAgICAgIHRoaXMubGlzdFZpZXcudXBkYXRlKGluZm8pO1xuICAgICAgICBpZiAodGhpcy5pc0JhdGNoVHJhbnNmZXIpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdFZpZXcudXBkYXRlVG90YWxJbmZvKGluZm8pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5saXN0Vmlldy51cGRhdGVUb3RhbEluZm8oKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmb3IgY3VzdG9tIHNlbmQgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBbZXZlbnRdIC0gRm9ybSBzdWJtaXQgZXZlbnRcbiAgICAgKi9cbiAgICBzZW5kRmlsZTogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdGhpcy5zdG9yZSgpO1xuICAgICAgICB0aGlzLnN1Ym1pdChldmVudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZvciBjdXN0b20gcmVtb3ZlIGV2ZW50XG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgVGhlIGRhdGEgZm9yIHJlbW92ZSBmaWxlLlxuICAgICAqL1xuICAgIHJlbW92ZUZpbGU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdGhpcy5fcmVxdWVzdGVyLnJlbW92ZShkYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3VibWl0IGZvciBkYXRhIHN1Ym1pdCB0byBzZXJ2ZXJcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBbZXZlbnRdIC0gRm9ybSBzdWJtaXQgZXZlbnRcbiAgICAgKi9cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudCAmJiB0aGlzLl9yZXF1ZXN0ZXIuVFlQRSA9PT0gUkVRVUVTVEVSX1RZUEVfTU9ERVJOKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3JlcXVlc3Rlci51cGxvYWQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgdXBsb2FkZXJcbiAgICAgKi9cbiAgICBjbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3JlcXVlc3Rlci5jbGVhcigpO1xuICAgICAgICB0aGlzLmZvcm1WaWV3LmNsZWFyKCk7XG4gICAgICAgIHRoaXMubGlzdFZpZXcuY2xlYXIoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RvcmUgaW5wdXQgZWxlbWVudCB0byBwb29sLlxuICAgICAqIEBwYXJhbSB7QXJyYXkuPEZpbGU+IHwgRmlsZX0gW2ZpbGVzXSAtIEEgZmlsZSBvciBmaWxlc1xuICAgICAqL1xuICAgIHN0b3JlOiBmdW5jdGlvbihmaWxlcykge1xuICAgICAgICB0aGlzLl9yZXF1ZXN0ZXIuc3RvcmUoZmlsZXMpO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oVXBsb2FkZXIpO1xubW9kdWxlLmV4cG9ydHMgPSBVcGxvYWRlcjtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIGZpbGUgY29udGFpbiB1dGlsaXR5IG1ldGhvZHMgZm9yIHVwbG9hZGVyLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuLyoqXG4gKiBAbmFtZXNwYWNlIHV0aWxzXG4gKi9cbnZhciBJU19TVVBQT1JUX0ZJTEVfU1lTVEVNID0gISEod2luZG93LkZpbGUgJiYgd2luZG93LkZpbGVSZWFkZXIgJiYgd2luZG93LkZpbGVMaXN0ICYmIHdpbmRvdy5CbG9iKSxcbiAgICBJU19TVVBQT1JUX0ZPUk1fREFUQSA9ICEhKHdpbmRvdy5Gb3JtRGF0YSB8fCBudWxsKTtcblxuLyoqXG4gKiBQYXJzZSB1cmxcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgLSB1cmwgZm9yIHBhcnNpbmdcbiAqIEByZXR1cm5zIHtPYmplY3R9IFVSTCBpbmZvcm1hdGlvblxuICovXG5mdW5jdGlvbiBwYXJzZVVSTCh1cmwpIHtcbiAgICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICBhLmhyZWYgPSB1cmw7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBocmVmOiBhLmhyZWYsXG4gICAgICAgIGhvc3Q6IGEuaG9zdCxcbiAgICAgICAgcG9ydDogYS5wb3J0LFxuICAgICAgICBoYXNoOiBhLmhhc2gsXG4gICAgICAgIGhvc3RuYW1lOiBhLmhvc3RuYW1lLFxuICAgICAgICBwYXRobmFtZTogYS5wYXRobmFtZSxcbiAgICAgICAgcHJvdG9jb2w6IGEucHJvdG9jb2wsXG4gICAgICAgIHNlYXJjaDogYS5zZWFyY2gsXG4gICAgICAgIHF1ZXJ5OiBhLnNlYXJjaC5zbGljZSgxKVxuICAgIH07XG59XG5cbi8qKlxuICogRXh0cmFjdCB1bml0IGZvciBmaWxlIHNpemVcbiAqIEBwYXJhbSB7bnVtYmVyfSBieXRlcyBBIHVzYWdlIG9mIGZpbGVcbiAqIEByZXR1cm5zIHtzdHJpbmd9IFNpemUtc3RyaW5nXG4gKiBAbWVtYmVyb2YgdXRpbHNcbiAqL1xuZnVuY3Rpb24gZ2V0RmlsZVNpemVXaXRoVW5pdChieXRlcykge1xuICAgIHZhciB1bml0cyA9IFsnQicsICdLQicsICdNQicsICdHQicsICdUQiddLFxuICAgICAgICBieXRlcyA9IHBhcnNlSW50KGJ5dGVzLCAxMCksXG4gICAgICAgIGV4cCA9IE1hdGgubG9nKGJ5dGVzKSAvIE1hdGgubG9nKDEwMjQpIHwgMCxcbiAgICAgICAgcmVzdWx0ID0gKGJ5dGVzIC8gTWF0aC5wb3coMTAyNCwgZXhwKSkudG9GaXhlZCgyKTtcblxuICAgIHJldHVybiByZXN1bHQgKyB1bml0c1tleHBdO1xufVxuXG4vKipcbiAqIFdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgRm9ybURhdGEgb3Igbm90XG4gKiBAbWVtYmVyb2YgdXRpbHNcbiAqIEByZXR1cm5zIHtib29sZWFufSB3aGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIEZvcm1EYXRhXG4gKi9cbmZ1bmN0aW9uIGlzU3VwcG9ydEZvcm1EYXRhKCkge1xuICAgIHJldHVybiBJU19TVVBQT1JUX0ZPUk1fREFUQTtcbn1cblxuLyoqXG4gKiBHZXQgaXRlbSBlbGVtZW50cyBIVE1MXG4gKiBAcGFyYW0ge09iamVjdH0gbWFwIC0gUHJvcGVydGllcyBmb3IgdGVtcGxhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBodG1sIEhUTUwgdGVtcGxhdGVcbiAqIEByZXR1cm5zIHtzdHJpbmd9IEhUTUxcbiAqIEBtZW1iZXJvZiB1dGlsc1xuICovXG5mdW5jdGlvbiB0ZW1wbGF0ZShtYXAsIGh0bWwpIHtcbiAgICBodG1sID0gaHRtbC5yZXBsYWNlKC9cXHtcXHsoW15cXH1dKylcXH1cXH0vZywgZnVuY3Rpb24gKG1zdHIsIG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIG1hcFtuYW1lXTtcbiAgICB9KTtcbiAgICByZXR1cm4gaHRtbDtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIGZpbGUgYXBpLlxuICogQHJldHVybnMge2Jvb2xlYW59IHdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgRmlsZUFQSVxuICogQG1lbWJlcm9mIHV0aWxzXG4gKi9cbmZ1bmN0aW9uIGlzU3VwcG9ydEZpbGVTeXN0ZW0oKSB7XG4gICAgcmV0dXJuIElTX1NVUFBPUlRfRklMRV9TWVNURU07XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgdXJsIGlzIHgtZG9tYWluXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsIC0gVVJMXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gV2hldGhlciB0aGUgdXJsIGlzIHgtZG9tYWluXG4gKiBAbWVtYmVyb2YgdXRpbHNcbiAqL1xuZnVuY3Rpb24gaXNDcm9zc0RvbWFpbih1cmwpIHtcbiAgICB2YXIgaGVyZSA9IHBhcnNlVVJMKHdpbmRvdy5sb2NhdGlvbi5ocmVmKSxcbiAgICAgICAgdGFyZ2V0ID0gcGFyc2VVUkwodXJsKTtcblxuICAgIHJldHVybiB0YXJnZXQuaG9zdG5hbWUgIT09IGhlcmUuaG9zdG5hbWVcbiAgICAgICAgfHwgdGFyZ2V0LnBvcnQgIT09IGhlcmUucG9ydFxuICAgICAgICB8fCB0YXJnZXQucHJvdG9jb2wgIT09IGhlcmUucHJvdG9jb2w7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldEZpbGVTaXplV2l0aFVuaXQ6IGdldEZpbGVTaXplV2l0aFVuaXQsXG4gICAgaXNTdXBwb3J0RmlsZVN5c3RlbTogaXNTdXBwb3J0RmlsZVN5c3RlbSxcbiAgICBpc1N1cHBvcnRGb3JtRGF0YTogaXNTdXBwb3J0Rm9ybURhdGEsXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxuICAgIGlzQ3Jvc3NEb21haW46IGlzQ3Jvc3NEb21haW5cbn07XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgVGhpcyBmaWxlIGlzIGFib3V0IGRyYWcgYW5kIGRyb3AgZmlsZSB0byBzZW5kLiBEcmFnIGFuZCBkcm9wIGlzIHJ1bm5pbmcgdmlhIGZpbGUgYXBpLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcbnZhciBjb25zdHMgPSByZXF1aXJlKCcuLi9jb25zdHMnKTtcblxuLyoqXG4gKiBNYWtlcyBkcmFnIGFuZCBkcm9wIGFyZWEsIHRoZSBkcm9wcGVkIGZpbGUgaXMgYWRkZWQgdmlhIGV2ZW50IGRyb3AgZXZlbnQuXG4gKiBAY2xhc3MgRHJhZ0FuZERyb3BcbiAqIEBwYXJhbSB7VXBsb2FkZXJ9IHVwbG9hZGVyIC0gVXBsb2FkZXJcbiAqL1xudmFyIERyYWdBbmREcm9wID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBEcmFnQW5kRHJvcC5wcm90b3R5cGUgKi97XG4gICAgaW5pdDogZnVuY3Rpb24odXBsb2FkZXIpIHtcbiAgICAgICAgdmFyIGh0bWwgPSBjb25zdHMuSFRNTC5kcmFnQW5kRHJvcDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRHJvcCB6b25lIGpRdWVyeS1lbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiRlbCA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENsYXNzIGZvciBkcm9wIGVuYWJsZWRcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2VuYWJsZUNsYXNzID0gY29uc3RzLkNPTkYuRFJPUF9FTkFCTEVEX0NMQVNTO1xuXG4gICAgICAgIHRoaXMuX3JlbmRlcihodG1sLCB1cGxvYWRlcik7XG4gICAgICAgIHRoaXMuX2FkZEV2ZW50KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbmRlcnMgZHJhZyBhbmQgZHJvcCBhcmVhXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGh0bWwgVGhlIGh0bWwgc3RyaW5nIHRvIG1ha2UgZGFyZyB6b25lXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHVwbG9hZGVyIFRoZSBjb3JlIGluc3RhbmNlIG9mIHRoaXMgY29tcG9uZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVuZGVyOiBmdW5jdGlvbihodG1sLCB1cGxvYWRlcikge1xuICAgICAgICB0aGlzLiRlbCA9ICQoaHRtbClcbiAgICAgICAgICAgIC5hcHBlbmRUbyh1cGxvYWRlci4kZWwpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGRyYWcgYW5kIGRyb3AgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsLm9uKHtcbiAgICAgICAgICAgIGRyYWdlbnRlcjogJC5wcm94eSh0aGlzLm9uRHJhZ0VudGVyLCB0aGlzKSxcbiAgICAgICAgICAgIGRyYWdvdmVyOiAkLnByb3h5KHRoaXMub25EcmFnT3ZlciwgdGhpcyksXG4gICAgICAgICAgICBkcm9wOiAkLnByb3h5KHRoaXMub25Ecm9wLCB0aGlzKSxcbiAgICAgICAgICAgIGRyYWdsZWF2ZTogJC5wcm94eSh0aGlzLm9uRHJhZ0xlYXZlLCB0aGlzKVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlcyBkcmFnZW50ZXIgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBlIC0gRXZlbnRcbiAgICAgKi9cbiAgICBvbkRyYWdFbnRlcjogZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMuX2VuYWJsZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGVzIGRyYWdvdmVyIGV2ZW50XG4gICAgICogQHBhcmFtIHtFdmVudH0gZSAtIEV2ZW50XG4gICAgICovXG4gICAgb25EcmFnT3ZlcjogZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEhhbmRsZXMgZHJhZ2xlYXZlIGV2ZW50XG4gICAgICogQHBhcmFtIHtFdmVudH0gZSAtIEV2ZW50XG4gICAgICovXG4gICAgb25EcmFnTGVhdmU6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLl9kaXNhYmxlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEhhbmRsZXMgZHJvcCBldmVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGUgLSBFdmVudFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBGYWxzZVxuICAgICAqL1xuICAgIG9uRHJvcDogZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgZmlsZXMgPSB0dWkudXRpbC5waWNrKGUsICdvcmlnaW5hbEV2ZW50JywgJ2RhdGFUcmFuc2ZlcicsICdmaWxlcycpO1xuXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5fZGlzYWJsZSgpO1xuICAgICAgICB0aGlzLmZpcmUoJ2Ryb3AnLCBmaWxlcyk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRW5hYmxlIGRyb3B6b25lXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZW5hYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwuYWRkQ2xhc3ModGhpcy5fZW5hYmxlQ2xhc3MpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlIGRyb3BvbnplXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZGlzYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsLnJlbW92ZUNsYXNzKHRoaXMuX2VuYWJsZUNsYXNzKTtcbiAgICB9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKERyYWdBbmREcm9wKTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcmFnQW5kRHJvcDtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBGcm9tLXZpZXcgbWFrZXMgYSBmb3JtIGJ5IHRlbXBsYXRlLiBBZGQgZXZlbnRzIGZvciBmaWxlIHVwbG9hZC5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG52YXIgY29uc3RzID0gcmVxdWlyZSgnLi4vY29uc3RzJyksXG4gICAgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG52YXIgaXNTdXBwb3J0Rm9ybURhdGEgPSB1dGlscy5pc1N1cHBvcnRGb3JtRGF0YSgpLFxuICAgIEhJRERFTl9GSUxFX0lOUFVUX0NMQVNTID0gY29uc3RzLkNPTkYuSElEREVOX0ZJTEVfSU5QVVRfQ0xBU1M7XG5cbi8qKlxuICogVGhpcyB2aWV3IGNvbnRyb2wgaW5wdXQgZWxlbWVudCB0eXBlZCBmaWxlLlxuICogQHBhcmFtIHtVcGxvYWRlcn0gdXBsb2FkZXIgLSBVcGxvYWRlciBpbnN0YW5jZVxuICogQGNvbnN0cnVjdG9yIFZpZXcuRm9ybVxuICovXG52YXIgRm9ybSA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKkBsZW5kcyBWaWV3LkZvcm0ucHJvdG90eXBlICoqL3tcbiAgICBpbml0OiBmdW5jdGlvbih1cGxvYWRlcikge1xuICAgICAgICAvKipcbiAgICAgICAgICogRmlsZSB1cGxvYWRlclxuICAgICAgICAgKiBAdHlwZSB7VXBsb2FkZXJ9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl91cGxvYWRlciA9IHVwbG9hZGVyO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBIdG1sIHRlbXBsYXRlc1xuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsIHN0cmluZz59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9odG1sID0gdGhpcy5fc2V0VGVtcGxhdGUodXBsb2FkZXIudGVtcGxhdGUpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGb3JtIGVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJGVsID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRmlsZSBpbnB1dCBlbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiRmaWxlSW5wdXQgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTdWJtaXQgZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kc3VibWl0ID0gbnVsbDtcblxuICAgICAgICBpZiAoaXNTdXBwb3J0Rm9ybURhdGEpIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogV2hldGhlciB0aGUgZmlsZSBpbnB1dCBpcyBtdWx0aXBsZVxuICAgICAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLl9pc011bHRpcGxlID0gdXBsb2FkZXIuaXNNdWx0aXBsZTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBXaGV0aGVyIHRoZSBmaWxlIGlucHV0IGFjY2VwdHMgZm9sZGVyXG4gICAgICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuX3VzZUZvbGRlciA9IHVwbG9hZGVyLnVzZUZvbGRlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3JlbmRlcih7XG4gICAgICAgICAgICBhY3Rpb246IHVwbG9hZGVyLnVybC5zZW5kLFxuICAgICAgICAgICAgbWV0aG9kOiAncG9zdCcsXG4gICAgICAgICAgICBlbmN0eXBlOiAnbXVsdGlwYXJ0L2Zvcm0tZGF0YScsXG4gICAgICAgICAgICB0YXJnZXQ6IGlzU3VwcG9ydEZvcm1EYXRhID8gJycgOiB1cGxvYWRlci5mb3JtVGFyZ2V0XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgZm9ybSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtvYmplY3R9IGF0dHJpYnV0ZXMgLSBGb3JtIGF0dHJpYnV0ZXNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW5kZXI6IGZ1bmN0aW9uKGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgdmFyIHVwbG9hZGVyID0gdGhpcy5fdXBsb2FkZXIsXG4gICAgICAgICAgICAkZmlsZUlucHV0ID0gdGhpcy5fY3JlYXRlRmlsZUlucHV0KCksXG4gICAgICAgICAgICAkZWwgPSAkKHRoaXMuX2h0bWwuZm9ybSlcbiAgICAgICAgICAgICAgICAuYXBwZW5kKCRmaWxlSW5wdXQpXG4gICAgICAgICAgICAgICAgLmF0dHIoYXR0cmlidXRlcyk7XG5cbiAgICAgICAgdGhpcy4kZmlsZUlucHV0ID0gJGZpbGVJbnB1dDtcbiAgICAgICAgdGhpcy4kZWwgPSAkZWw7XG5cbiAgICAgICAgaWYgKHVwbG9hZGVyLmlzQmF0Y2hUcmFuc2Zlcikge1xuICAgICAgICAgICAgdGhpcy5fc2V0U3VibWl0RWxlbWVudCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHVwbG9hZGVyLmlzQ3Jvc3NEb21haW4gJiYgIWlzU3VwcG9ydEZvcm1EYXRhKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRIaWRkZW5JbnB1dEZvckNPUlMoKTtcbiAgICAgICAgfVxuICAgICAgICB1cGxvYWRlci4kZWwuYXBwZW5kKHRoaXMuJGVsKTtcblxuICAgICAgICB0aGlzLl9hZGRFdmVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgc3VibWl0IGVsZW1lbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRTdWJtaXRFbGVtZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kc3VibWl0ID0gJCh0aGlzLl9odG1sLnN1Ym1pdCk7XG4gICAgICAgIHRoaXMuJHN1Ym1pdC5hcHBlbmRUbyh0aGlzLiRlbCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBoaWRkZW4gaW5wdXQgZWxlbWVudCBmb3IgQ09SUy5cbiAgICAgKiAgSGlkZGVuIGlucHV0IG9mIFBvc3RNZXNzYWdlIG9yIFJlZGlyZWN0VVJMLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldEhpZGRlbklucHV0Rm9yQ09SUzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBwcm9wcywgJGhpZGRlbklucHV0LFxuICAgICAgICAgICAgdXBsb2FkZXIgPSB0aGlzLl91cGxvYWRlcixcbiAgICAgICAgICAgIHJlZGlyZWN0VVJMID0gdXBsb2FkZXIucmVkaXJlY3RVUkw7XG5cbiAgICAgICAgaWYgKHVwbG9hZGVyLmlzU3VwcG9ydFBvc3RNZXNzYWdlKSB7IC8vIGZvciBJRTgsIDlcbiAgICAgICAgICAgIHByb3BzID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdtZXNzYWdlVGFyZ2V0JyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogbG9jYXRpb24ucHJvdG9jb2wgKyAnLy8nICsgbG9jYXRpb24uaG9zdFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmIChyZWRpcmVjdFVSTCkgeyAvLyBmb3IgSUU3XG4gICAgICAgICAgICBwcm9wcyA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAncmVkaXJlY3RVUkwnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiByZWRpcmVjdFVSTFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9wcykge1xuICAgICAgICAgICAgJGhpZGRlbklucHV0ID0gJCh1dGlscy50ZW1wbGF0ZShwcm9wcywgdGhpcy5faHRtbC5oaWRkZW5JbnB1dCkpO1xuICAgICAgICAgICAgJGhpZGRlbklucHV0LmFwcGVuZFRvKHRoaXMuJGVsKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgYWxsIG9mIGlucHV0IGVsZW1lbnRzIGh0bWwgc3RyaW5ncy5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbdGVtcGxhdGVdIFRoZSB0ZW1wbGF0ZSBpcyBzZXQgZm9ybSBjdXN0b21lci5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3QuPHN0cmluZywgc3RyaW5nPn0gVGhlIGh0bWwgdGVtcGxhdGUgc3RyaW5nIHNldCBmb3IgZm9ybS5cbiAgICAgKi9cbiAgICBfc2V0VGVtcGxhdGU6IGZ1bmN0aW9uKHRlbXBsYXRlKSB7XG4gICAgICAgIHJldHVybiB0dWkudXRpbC5leHRlbmQoe30sIGNvbnN0cy5IVE1MLCB0ZW1wbGF0ZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2VzIGFuZCByZXR1cm5zIGpxdWVyeSBlbGVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcmV0dXJuIHtqUXVlcnl9IFRoZSBqcXVlcnkgb2JqZWN0IHdyYXBwaW5nIG9yaWdpbmFsIGlucHV0IGVsZW1lbnRcbiAgICAgKi9cbiAgICBfY3JlYXRlRmlsZUlucHV0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1hcCA9IHtcbiAgICAgICAgICAgIG11bHRpcGxlOiB0aGlzLl9pc011bHRpcGxlID8gJ211bHRpcGxlJyA6ICcnLFxuICAgICAgICAgICAgZmlsZUZpZWxkOiB0aGlzLl91cGxvYWRlci5maWxlRmllbGQsXG4gICAgICAgICAgICBkaXJlY3Rvcnk6IHRoaXMuX3VzZUZvbGRlciA/ICdkaXJlY3RvcnkgbW96ZGlyZWN0b3J5IHdlYmtpdGRpcmVjdG9yeScgOiAnJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiAkKHV0aWxzLnRlbXBsYXRlKG1hcCwgdGhpcy5faHRtbC5maWxlSW5wdXQpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5fdXBsb2FkZXIuaXNCYXRjaFRyYW5zZmVyKSB7XG4gICAgICAgICAgICB0aGlzLiRlbC5vbignc3VibWl0JywgJC5wcm94eSh0aGlzLmZpcmUsIHRoaXMsICdzdWJtaXQnKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fYWRkSW5wdXRFdmVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgY2hhbmdlIGV2ZW50IHRvIGZpbGUgaW5wdXRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRJbnB1dEV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZmlsZUlucHV0Lm9uKCdjaGFuZ2UnLCAkLnByb3h5KHRoaXMub25DaGFuZ2UsIHRoaXMpKTtcbiAgICAgICAgdGhpcy4kZmlsZUlucHV0LmF0dHIoJ3RpdGxlJywgJyAnKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQtSGFuZGxlIGZvciBpbnB1dCBlbGVtZW50IGNoYW5nZVxuICAgICAqL1xuICAgIG9uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLiRmaWxlSW5wdXRbMF0udmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZpcmUoJ2NoYW5nZScpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXNldCBJbnB1dCBlbGVtZW50IHRvIHNhdmUgd2hvbGUgaW5wdXQ9ZmlsZSBlbGVtZW50LlxuICAgICAqL1xuICAgIHJlc2V0RmlsZUlucHV0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZmlsZUlucHV0LnJlbW92ZSgpO1xuICAgICAgICB0aGlzLiRmaWxlSW5wdXQgPSB0aGlzLl9jcmVhdGVGaWxlSW5wdXQoKTtcbiAgICAgICAgaWYgKHRoaXMuJHN1Ym1pdCkge1xuICAgICAgICAgICAgdGhpcy4kc3VibWl0LmJlZm9yZSh0aGlzLiRmaWxlSW5wdXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kZWwuYXBwZW5kKHRoaXMuJGZpbGVJbnB1dCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fYWRkSW5wdXRFdmVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDbGVhciBmaWxlIGlucHV0IGVsZW1lbnRzXG4gICAgICovXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbC5maW5kKCcuJyArIEhJRERFTl9GSUxFX0lOUFVUX0NMQVNTKS5yZW1vdmUoKTtcbiAgICAgICAgdGhpcy5yZXNldEZpbGVJbnB1dCgpO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oRm9ybSk7XG5tb2R1bGUuZXhwb3J0cyA9IEZvcm07XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgSXRlbVZpZXcgbWFrZSBlbGVtZW50IHRvIGRpc3BsYXkgYWRkZWQgZmlsZSBpbmZvcm1hdGlvbi4gSXQgaGFzIGF0dGFjaGVkIGZpbGUgSUQgdG8gcmVxdWVzdCBmb3IgcmVtb3ZlLlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcbnZhciBjb25zdHMgPSByZXF1aXJlKCcuLi9jb25zdHMnKSxcbiAgICB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cbnZhciBSRU1PVkVfQlVUVE9OX0NMQVNTID0gY29uc3RzLkNPTkYuUkVNT1ZFX0JVVFRPTl9DTEFTUztcblxuLyoqXG4gKiBDbGFzcyBvZiBpdGVtIHRoYXQgaXMgbWVtYmVyIG9mIGZpbGUgbGlzdC5cbiAqIEBjbGFzcyBJdGVtXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xuICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLm5hbWUgRmlsZSBuYW1lXG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMudHlwZSBGaWxlIHR5cGVcbiAqICBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy5yb290IExpc3QgaW5zdGFuY2VcbiAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuaWRdIFVuaXF1ZSBrZXksIHdoYXQgaWYgdGhlIGtleSBpcyBub3QgZXhpc3QgaWQgd2lsbCBiZSB0aGUgZmlsZSBuYW1lLlxuICogIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5kZWxldGVCdXR0b25DbGFzc05hbWU9J3VwbG9hZGVyX2J0bl9kZWxldGUnXSBUaGUgY2xhc3MgbmFtZSBpcyBmb3IgZGVsZXRlIGJ1dHRvbi5cbiAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMudGVtcGxhdGVdIGl0ZW0gdGVtcGxhdGVcbiAqICBAcGFyYW0geyhzdHJpbmd8bnVtYmVyKX0gW29wdGlvbnMuc2l6ZV0gRmlsZSBzaXplIChidXQgaWUgbG93IGJyb3dzZXIsIHgtZG9tYWluKVxuICovXG52YXIgSXRlbSA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgSXRlbS5wcm90b3R5cGUgKiovIHtcbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJdGVtOiBMSSBlbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiRlbCA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEl0ZW06IHJlbW92ZSBidXR0b25cbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJHJlbW92ZUJ0biA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEl0ZW0gbmFtZVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5uYW1lID0gb3B0aW9ucy5uYW1lO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJdGVtIGlkXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmlkID0gb3B0aW9ucy5pZCB8fCBvcHRpb25zLm5hbWU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEl0ZW0gc2l6ZVxuICAgICAgICAgKiBAdHlwZSB7bnVtYmVyfHN0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuc2l6ZSA9IG9wdGlvbnMuc2l6ZSB8fCAnJztcblxuICAgICAgICAvKipcbiAgICAgICAgICogSXRlbSB0eXBlXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnR5cGUgPSB0aGlzLl9leHRyYWN0RXh0ZW5zaW9uKCk7XG5cbiAgICAgICAgdGhpcy5yZW5kZXIob3B0aW9ucy5yb290LiRlbCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbmRlciBtYWtpbmcgZm9ybSBwYWRkaW5nIHdpdGggZGVsZXRhYmxlIGl0ZW1cbiAgICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIFRhcmdldCBMaXN0IGVsZW1lbnRcbiAgICAgKi9cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCR0YXJnZXQpIHtcbiAgICAgICAgdmFyIGh0bWwgPSB0aGlzLl9nZXRIdG1sKCksXG4gICAgICAgICAgICByZW1vdmVCdXR0b25IVE1MID0gdXRpbHMudGVtcGxhdGUoe1xuICAgICAgICAgICAgICAgIHRleHQ6ICdSZW1vdmUnXG4gICAgICAgICAgICB9LCBjb25zdHMuSFRNTC5idXR0b24pLFxuICAgICAgICAgICAgJHJlbW92ZUJ0biA9ICQocmVtb3ZlQnV0dG9uSFRNTCk7XG5cbiAgICAgICAgdGhpcy4kcmVtb3ZlQnRuID0gJHJlbW92ZUJ0blxuICAgICAgICAgICAgLmFkZENsYXNzKFJFTU9WRV9CVVRUT05fQ0xBU1MpO1xuXG4gICAgICAgIHRoaXMuJGVsID0gJChodG1sKVxuICAgICAgICAgICAgLmFwcGVuZCgkcmVtb3ZlQnRuKVxuICAgICAgICAgICAgLmFwcGVuZFRvKCR0YXJnZXQpO1xuXG4gICAgICAgIHRoaXMuX2FkZEV2ZW50KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV4dHJhY3QgZmlsZSBleHRlbnNpb24gYnkgbmFtZVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IEZpbGUgZXh0ZW5zaW9uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZXh0cmFjdEV4dGVuc2lvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5hbWUuc3BsaXQoJy4nKS5wb3AoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGxpc3RJdGVtIGVsZW1lbnQgSFRNTFxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IEhUTUxcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRIdG1sOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1hcCA9IHtcbiAgICAgICAgICAgIGZpbGV0eXBlOiB0aGlzLnR5cGUsXG4gICAgICAgICAgICBmaWxlbmFtZTogdGhpcy5uYW1lLFxuICAgICAgICAgICAgZmlsZXNpemU6IHRoaXMuc2l6ZSA/IHV0aWxzLmdldEZpbGVTaXplV2l0aFVuaXQodGhpcy5zaXplKSA6ICcnXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHV0aWxzLnRlbXBsYXRlKG1hcCwgY29uc3RzLkhUTUwubGlzdEl0ZW0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnQgaGFuZGxlciBvbiBkZWxldGUgYnV0dG9uLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZEV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kcmVtb3ZlQnRuLm9uKCdjbGljaycsICQucHJveHkodGhpcy5fb25DbGlja0V2ZW50LCB0aGlzKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50LWhhbmRsZSBmb3IgZGVsZXRlIGJ1dHRvbiBjbGlja2VkLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uQ2xpY2tFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZmlyZSgncmVtb3ZlJywge1xuICAgICAgICAgICAgbmFtZSA6IHRoaXMubmFtZSxcbiAgICAgICAgICAgIGlkIDogdGhpcy5pZCxcbiAgICAgICAgICAgIHR5cGU6ICdyZW1vdmUnXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEZXN0cm95IGl0ZW1cbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwucmVtb3ZlKCk7XG4gICAgfVxufSk7XG5cbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihJdGVtKTtcbm1vZHVsZS5leHBvcnRzID0gSXRlbTtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBGaWxlTGlzdFZpZXcgbGlzdGluZyBmaWxlcyBhbmQgZGlzcGxheSBzdGF0ZXMobGlrZSBzaXplLCBjb3VudCkuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcbnZhciBJdGVtID0gcmVxdWlyZSgnLi9pdGVtJyk7XG5cbi8qKlxuICogTGlzdCBoYXMgaXRlbXMuIEl0IGNhbiBhZGQgYW5kIHJlbW92ZSBpdGVtLCBhbmQgZ2V0IHRvdGFsIHVzYWdlLlxuICogQHBhcmFtIHtVcGxvYWRlcn0gdXBsb2FkZXIgLSBVcGxvYWRlclxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywgalF1ZXJ5Pn0gbGlzdEluZm9cbiAqICBAcGFyYW0ge2pRdWVyeX0gbGlzdEluZm8ubGlzdCAtIExpc3QganF1ZXJ5LWVsZW1lbnRcbiAqICBAcGFyYW0ge2pRdWVyeX0gbGlzdEluZm8uY291bnQgLSBDb3VudCBqcXVlcnktZWxlbWVudFxuICogIEBwYXJhbSB7alF1ZXJ5fSBsaXN0SW5mby5zaXplIC0gU2l6ZSBqcXVlcnktZWxlbWVudFxuICogQGNsYXNzIExpc3RcbiAqL1xudmFyIExpc3QgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIExpc3QucHJvdG90eXBlICove1xuICAgIGluaXQgOiBmdW5jdGlvbihsaXN0SW5mbykge1xuICAgICAgICAvKipcbiAgICAgICAgICogSXRlbXNcbiAgICAgICAgICogQHR5cGUge0FycmF5LjxJdGVtPn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogalF1ZXJ5LWVsZW1lbnQgb2YgTGlzdFxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kZWwgPSBsaXN0SW5mby5saXN0O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBqUXVlcnktZWxlbWVudCBvZiBjb3VudFxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kY291bnRlciA9IGxpc3RJbmZvLmNvdW50O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBqUXVlcnktZWxlbWVudCBvZiB0b3RhbCBzaXplXG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiRzaXplID0gbGlzdEluZm8uc2l6ZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW0gbGlzdFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIC0gRmlsZSBpbmZvcm1hdGlvbihzKSB3aXRoIHR5cGVcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2RhdGEudHlwZV0gLSAncmVtb3ZlJyBvciBub3QuXG4gICAgICovXG4gICAgdXBkYXRlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGlmIChkYXRhLnR5cGUgPT09ICdyZW1vdmUnKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVGaWxlSXRlbShkYXRhLmlkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2FkZEZpbGVJdGVtcyhkYXRhKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgaXRlbXMgdG90YWwgY291bnQsIHRvdGFsIHNpemUgaW5mb3JtYXRpb24uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtpbmZvXSBBIGluZm9ybWF0aW9uIHRvIHVwZGF0ZSBsaXN0LlxuICAgICAqICBAcGFyYW0ge2FycmF5fSBpbmZvLml0ZW1zIFRoZSBsaXN0IG9mIGZpbGUgaW5mb3JtYXRpb24uXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBpbmZvLnNpemUgVGhlIHRvdGFsIHNpemUuXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBpbmZvLmNvdW50IFRoZSBjb3VudCBvZiBmaWxlcy5cbiAgICAgKi9cbiAgICB1cGRhdGVUb3RhbEluZm86IGZ1bmN0aW9uKGluZm8pIHtcbiAgICAgICAgaWYgKGluZm8pIHtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVRvdGFsQ291bnQoaW5mby5jb3VudCk7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVUb3RhbFVzYWdlKGluZm8uc2l6ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVUb3RhbENvdW50KCk7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVUb3RhbFVzYWdlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW1zIHRvdGFsIGNvdW50IGFuZCByZWZyZXNoIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0geyhudW1iZXJ8c3RyaW5nKX0gW2NvdW50XSBUb3RhbCBmaWxlIGNvdW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfdXBkYXRlVG90YWxDb3VudDogZnVuY3Rpb24oY291bnQpIHtcbiAgICAgICAgaWYgKCF0dWkudXRpbC5pc0V4aXN0eShjb3VudCkpIHtcbiAgICAgICAgICAgIGNvdW50ID0gdGhpcy5pdGVtcy5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiRjb3VudGVyLmh0bWwoY291bnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgaXRlbXMgdG90YWwgc2l6ZSBhbmQgcmVmcmVzaCBlbGVtZW50XG4gICAgICogQHBhcmFtIHsobnVtYmVyfHN0cmluZyl9IFtzaXplXSBUb3RhbCBmaWxlcyBzaXplc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwZGF0ZVRvdGFsVXNhZ2U6IGZ1bmN0aW9uKHNpemUpIHtcbiAgICAgICAgaWYgKCF0dWkudXRpbC5pc0V4aXN0eShzaXplKSkge1xuICAgICAgICAgICAgc2l6ZSA9IHRoaXMuX2dldFN1bUFsbEl0ZW1Vc2FnZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0dWkudXRpbC5pc051bWJlcihzaXplKSAmJiAhaXNOYU4oc2l6ZSkpIHtcbiAgICAgICAgICAgIHNpemUgPSB1dGlscy5nZXRGaWxlU2l6ZVdpdGhVbml0KHNpemUpO1xuICAgICAgICAgICAgdGhpcy4kc2l6ZS5odG1sKHNpemUpO1xuICAgICAgICAgICAgdGhpcy4kc2l6ZS5zaG93KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiRzaXplLmhpZGUoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdW0gc2l6ZXMgb2YgYWxsIGl0ZW1zLlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IHRvdGFsU2l6ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldFN1bUFsbEl0ZW1Vc2FnZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpdGVtcyA9IHRoaXMuaXRlbXMsXG4gICAgICAgICAgICB0b3RhbFVzYWdlID0gMDtcblxuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKGl0ZW1zLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICB0b3RhbFVzYWdlICs9IHBhcnNlRmxvYXQoaXRlbS5zaXplKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRvdGFsVXNhZ2U7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBmaWxlIGl0ZW1zXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHRhcmdldCBUYXJnZXQgaXRlbSBpbmZvcm1hdGlvbi5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRGaWxlSXRlbXM6IGZ1bmN0aW9uKHRhcmdldCkge1xuICAgICAgICBpZiAoIXR1aS51dGlsLmlzQXJyYXlTYWZlKHRhcmdldCkpIHsgLy8gZm9yIHRhcmdldCBmcm9tIGlmcmFtZSwgdXNlIFwiaXNBcnJheVNhZmVcIlxuICAgICAgICAgICAgdGFyZ2V0ID0gW3RhcmdldF07XG4gICAgICAgIH1cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaCh0YXJnZXQsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCh0aGlzLl9jcmVhdGVJdGVtKGRhdGEpKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBmaWxlIGl0ZW1cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgLSBUaGUgaXRlbSBpZCB0byByZW1vdmVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW1vdmVGaWxlSXRlbTogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaCh0aGlzLml0ZW1zLCBmdW5jdGlvbihpdGVtLCBpbmRleCkge1xuICAgICAgICAgICAgaWYgKGlkID09PSBpdGVtLmlkKSB7XG4gICAgICAgICAgICAgICAgaXRlbS5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBpdGVtIEJ5IERhdGFcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSAtIERhdGEgZm9yIGxpc3QgaXRlbXNcbiAgICAgKiBAcmV0dXJucyB7SXRlbX0gSXRlbVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NyZWF0ZUl0ZW06IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIGl0ZW0gPSBuZXcgSXRlbSh7XG4gICAgICAgICAgICByb290OiB0aGlzLFxuICAgICAgICAgICAgbmFtZTogZGF0YS5uYW1lLFxuICAgICAgICAgICAgc2l6ZTogZGF0YS5zaXplLFxuICAgICAgICAgICAgaWQ6IGRhdGEuaWRcbiAgICAgICAgfSk7XG4gICAgICAgIGl0ZW0ub24oJ3JlbW92ZScsIHRoaXMuX3JlbW92ZUZpbGUsIHRoaXMpO1xuICAgICAgICByZXR1cm4gaXRlbTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgUmVtb3ZlIEZpbGVcbiAgICAgKiBAcGFyYW0ge0l0ZW19IGl0ZW0gLSBJdGVtXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlRmlsZTogZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZScsIGl0ZW0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDbGVhciBsaXN0XG4gICAgICovXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKHRoaXMuaXRlbXMsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIGl0ZW0uZGVzdHJveSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5pdGVtcy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLnVwZGF0ZVRvdGFsSW5mbygpO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oTGlzdCk7XG5cbm1vZHVsZS5leHBvcnRzID0gTGlzdDtcbiJdfQ==
