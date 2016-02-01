(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
tui.util.defineNamespace('tui.component.Uploader', require('./src/js/uploader.js'));


},{"./src/js/uploader.js":6}],2:[function(require,module,exports){
/**
 * @fileoverview Configuration or default values.
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';

var REMOVE_BUTTON_CLASS = 'removeButton';

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
    REMOVE_BUTTON_CLASS: REMOVE_BUTTON_CLASS
};

/**
 * Default Htmls
 * @type {{input: string, item: string}}
 */
module.exports.HTML = {
    form: [
        '<form enctype="multipart/form-data" id="formData" method="post">',
        '</form>'
    ].join(''),
    submit: '<button class="batchSubmit" type="submit">SEND</button>',
    fileInput: '<input type="file" id="fileAttach" {{directory}} name="{{fileField}}" {{multiple}} />',
    hiddenInput: '<input type="hidden" name="{{name}}" value="{{value}}">',
    listItem: [
        '<li class="filetypeDisplayClass">',
            '<span class="fileicon {{filetype}}">{{filetype}}</span>',
            '<span class="file_name">{{filename}}</span>',
            '<span class="file_size">{{filesize}}</span>',
            '<button type="button" class="' + REMOVE_BUTTON_CLASS + '">Delete</button>',
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
var HIDDEN_FILE_INPUT_CLASS = require('./consts').CONF.HIDDEN_FILE_INPUT_CLASS,
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

var snippet = tui.util,
    REQUESTER_TYPE_MODERN = consts.CONF.REQUESTER_TYPE_MODERN,
    isSupportFormData = utils.isSupportFormData();

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
         * Whether the sending/removing urls are x-domain.
         * @type {boolean}
         */
        this.isCrossDomain = utils.isCrossDomain(this.url.send);

        /**
         * Whether the browser supports PostMessage API
         * @type {boolean}
         */
        this.isSupportPostMessage = !!(snippet.pick(this.$targetFrame, '0', 'contentWindow', 'postMessage'));

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
        if (isSupportFormData) {
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
                data = $.parseJSON(originalEvent.data);

            if (this.url.send.indexOf(originalEvent.origin) === -1) {
                return;
            }

            this.clear();
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
     * @api
     */
    submit: function(event) {
        if (event && this._requester.TYPE === REQUESTER_TYPE_MODERN) {
            event.preventDefault();
        }
        this._requester.upload();
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

        if (uploader.isCrossDomain) {
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

var DELETE_BUTTON_CLASS = consts.CONF.REMOVE_BUTTON_CLASS;

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
         * jQuery-element
         * @type {jQuery}
         * @private
         */
        this.$el = null;

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
        var html = this._getHtml();

        this.$el = $(html)
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
        var query = '.' + DELETE_BUTTON_CLASS,
            $delBtn = this.$el.find(query);
        $delBtn.on('click', $.proxy(this._onClickEvent, this));
    },

    /**
     * Remove event handler from delete button.
     * @private
     */
    _removeEvent: function() {
        var query = '.' + DELETE_BUTTON_CLASS,
            $delBtn = this.$el.find(query);
        $delBtn.off('click', this._onClickEvent);
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
        this._removeEvent();
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
        if (!tui.util.isArraySafe(target)) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25zdHMuanMiLCJzcmMvanMvcG9vbC5qcyIsInNyYy9qcy9yZXF1ZXN0ZXIvbW9kZXJuLmpzIiwic3JjL2pzL3JlcXVlc3Rlci9vbGQuanMiLCJzcmMvanMvdXBsb2FkZXIuanMiLCJzcmMvanMvdXRpbHMuanMiLCJzcmMvanMvdmlldy9kcmFnLmpzIiwic3JjL2pzL3ZpZXcvZm9ybS5qcyIsInNyYy9qcy92aWV3L2l0ZW0uanMiLCJzcmMvanMvdmlldy9saXN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInR1aS51dGlsLmRlZmluZU5hbWVzcGFjZSgndHVpLmNvbXBvbmVudC5VcGxvYWRlcicsIHJlcXVpcmUoJy4vc3JjL2pzL3VwbG9hZGVyLmpzJykpO1xuXG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29uZmlndXJhdGlvbiBvciBkZWZhdWx0IHZhbHVlcy5cbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSRU1PVkVfQlVUVE9OX0NMQVNTID0gJ3JlbW92ZUJ1dHRvbic7XG5cbi8qKlxuICogVXBsb2FkZXIgY29uZmlnXG4gKi9cbm1vZHVsZS5leHBvcnRzLkNPTkYgPSB7XG4gICAgRklMRV9GSUxFRF9OQU1FOiAndXNlcmZpbGVbXScsXG4gICAgRFJPUF9FTkFCTEVEX0NMQVNTOiAnZHJvcEVuYWJsZWQnLFxuICAgIEhJRERFTl9GSUxFX0lOUFVUX0NMQVNTOiAnaGlkZGVuRmlsZUlucHV0JyxcbiAgICBSRVFVRVNURVJfVFlQRV9NT0RFUk46ICdtb2Rlcm5SZXF1ZXN0ZXInLFxuICAgIFJFUVVFU1RFUl9UWVBFX09MRDogJ29sZFJlcXVlc3RlcicsXG4gICAgRk9STV9UQVJHRVRfTkFNRTogJ2hpZGRlbkZyYW1lJyxcbiAgICBSRU1PVkVfQlVUVE9OX0NMQVNTOiBSRU1PVkVfQlVUVE9OX0NMQVNTXG59O1xuXG4vKipcbiAqIERlZmF1bHQgSHRtbHNcbiAqIEB0eXBlIHt7aW5wdXQ6IHN0cmluZywgaXRlbTogc3RyaW5nfX1cbiAqL1xubW9kdWxlLmV4cG9ydHMuSFRNTCA9IHtcbiAgICBmb3JtOiBbXG4gICAgICAgICc8Zm9ybSBlbmN0eXBlPVwibXVsdGlwYXJ0L2Zvcm0tZGF0YVwiIGlkPVwiZm9ybURhdGFcIiBtZXRob2Q9XCJwb3N0XCI+JyxcbiAgICAgICAgJzwvZm9ybT4nXG4gICAgXS5qb2luKCcnKSxcbiAgICBzdWJtaXQ6ICc8YnV0dG9uIGNsYXNzPVwiYmF0Y2hTdWJtaXRcIiB0eXBlPVwic3VibWl0XCI+U0VORDwvYnV0dG9uPicsXG4gICAgZmlsZUlucHV0OiAnPGlucHV0IHR5cGU9XCJmaWxlXCIgaWQ9XCJmaWxlQXR0YWNoXCIge3tkaXJlY3Rvcnl9fSBuYW1lPVwie3tmaWxlRmllbGR9fVwiIHt7bXVsdGlwbGV9fSAvPicsXG4gICAgaGlkZGVuSW5wdXQ6ICc8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJ7e25hbWV9fVwiIHZhbHVlPVwie3t2YWx1ZX19XCI+JyxcbiAgICBsaXN0SXRlbTogW1xuICAgICAgICAnPGxpIGNsYXNzPVwiZmlsZXR5cGVEaXNwbGF5Q2xhc3NcIj4nLFxuICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwiZmlsZWljb24ge3tmaWxldHlwZX19XCI+e3tmaWxldHlwZX19PC9zcGFuPicsXG4gICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJmaWxlX25hbWVcIj57e2ZpbGVuYW1lfX08L3NwYW4+JyxcbiAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImZpbGVfc2l6ZVwiPnt7ZmlsZXNpemV9fTwvc3Bhbj4nLFxuICAgICAgICAgICAgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiJyArIFJFTU9WRV9CVVRUT05fQ0xBU1MgKyAnXCI+RGVsZXRlPC9idXR0b24+JyxcbiAgICAgICAgJzwvbGk+J1xuICAgIF0uam9pbignJyksXG4gICAgZHJhZ0FuZERyb3A6ICc8ZGl2IGNsYXNzPVwiZHJvcHpvbmVcIj48L2Rpdj4nXG59O1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgaXMgbWFuYWdlciBvZiBpbnB1dCBlbGVtZW50cyB0aGF0IGFjdCBsaWtlIGZpbGUgcG9vbC5cbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG52YXIgSElEREVOX0ZJTEVfSU5QVVRfQ0xBU1MgPSByZXF1aXJlKCcuL2NvbnN0cycpLkNPTkYuSElEREVOX0ZJTEVfSU5QVVRfQ0xBU1MsXG4gICAgZm9yRWFjaCA9IHR1aS51dGlsLmZvckVhY2gsXG4gICAgaGFzU3RhbXAgPSB0dWkudXRpbC5oYXNTdGFtcCxcbiAgICBzdGFtcCA9IHR1aS51dGlsLnN0YW1wO1xuXG4vKipcbiAqIFRoZSBwb29sIGZvciBzYXZlIGZpbGVzLlxuICogSXQncyBvbmx5IGZvciBpbnB1dFtmaWxlXSBlbGVtZW50IHNhdmUgYXQgYnJvd3NlciB0aGF0IGRvZXMgbm90IHN1cHBvcnQgZmlsZSBhcGkuXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBwbGFuZXQgLSBGb3JtIGVsZW1lbnRcbiAqIEBjbGFzcyBQb29sXG4gKi9cbnZhciBQb29sID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBQb29sLnByb3RvdHlwZSAqL3tcbiAgICBpbml0OiBmdW5jdGlvbihwbGFuZXQpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFN1Ym1pdHRlciBmb3IgZmlsZSBlbGVtZW50IHRvIHNlcnZlclxuICAgICAgICAgKiBGb3JtIGVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wbGFuZXQgPSBwbGFuZXQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZpbGUgZGF0YSBzdHJ1Y3R1cmUgb2JqZWN0XG4gICAgICAgICAqICBrZXk9bmFtZSA6IHZhbHVlPWl1cHV0W3R5cGU9ZmlsZV0oRWxlbWVudClcbiAgICAgICAgICogQHR5cGUge29iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZmlsZXMgPSB7fTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2F2ZSBhIGlucHV0IGVsZW1lbnRbdHlwZT1maWxlXSwgYXMgdmFsdWUgb2YgZmlsZSBuYW1lLlxuICAgICAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudH0gaW5wdXRGaWxlRWwgQSBpbnB1dCBlbGVtZW50IHRoYXQgaGF2ZSB0byBiZSBzYXZlZFxuICAgICAqL1xuICAgIHN0b3JlOiBmdW5jdGlvbihpbnB1dEZpbGVFbCkge1xuICAgICAgICB2YXIgaWQgPSBoYXNTdGFtcChpbnB1dEZpbGVFbCkgJiYgc3RhbXAoaW5wdXRGaWxlRWwpLFxuICAgICAgICAgICAgZmlsZW5hbWU7XG5cbiAgICAgICAgaWYgKCFpZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGZpbGVuYW1lID0gaW5wdXRGaWxlRWwudmFsdWU7XG4gICAgICAgIHRoaXMuZmlsZXNbaWQgKyBmaWxlbmFtZV0gPSBpbnB1dEZpbGVFbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgaW5wdXQgZWxlbWVudFt0eXBlPWZpbGVdIGZyb20gcG9vbC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIC0gQSBmaWxlIG5hbWUgdGhhdCBoYXZlIHRvIGJlIHJlbW92ZWQuXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gcmVzdWx0XG4gICAgICovXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICAgICAgdmFyIGtleSA9IHBhcmFtcy5pZCArIHBhcmFtcy5uYW1lLFxuICAgICAgICAgICAgZWxlbWVudCA9IHRoaXMuZmlsZXNba2V5XTtcblxuICAgICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlbGV0ZSB0aGlzLmZpbGVzW2tleV07XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFbXB0eSBwb29sXG4gICAgICovXG4gICAgZW1wdHk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmZpbGVzID0ge307XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFBsYW50IGZpbGVzIG9uIHBvb2wgdG8gZm9ybSBpbnB1dFxuICAgICAqL1xuICAgIHBsYW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHBsYW5ldCA9IHRoaXMucGxhbmV0O1xuICAgICAgICBmb3JFYWNoKHRoaXMuZmlsZXMsIGZ1bmN0aW9uKGVsZW1lbnQsIGtleSkge1xuICAgICAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgPSBISURERU5fRklMRV9JTlBVVF9DTEFTUztcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIHBsYW5ldC5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmZpbGVzW2tleV07XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBvb2w7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjb25zdHMgPSByZXF1aXJlKCcuLi9jb25zdHMnKTtcblxudmFyIFRZUEUgPSBjb25zdHMuQ09ORi5SRVFVRVNURVJfVFlQRV9NT0RFUk4sXG4gICAgZm9yRWFjaCA9IHR1aS51dGlsLmZvckVhY2g7XG5cbi8qKlxuICogTW9kZXJuIHJlcXVlc3RlclxuICogQHBhcmFtIHtVcGxvYWRlcn0gdXBsb2FkZXIgLSBVcGxvYWRlclxuICogQGNsYXNzXG4gKi9cbnZhciBNb2Rlcm4gPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIE1vZGVybi5wcm90b3R5cGUgKi97XG4gICAgaW5pdDogZnVuY3Rpb24odXBsb2FkZXIpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFVwbG9hZGVyXG4gICAgICAgICAqIEB0eXBlIHtVcGxvYWRlcn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudXBsb2FkZXIgPSB1cGxvYWRlcjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRnJvbSB2aWV3XG4gICAgICAgICAqIEB0eXBlIHtGb3JtfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5mb3JtVmlldyA9IHVwbG9hZGVyLmZvcm1WaWV3O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMb2NhbCBwb29sIGZvciBmaWxlc1xuICAgICAgICAgKiBAdHlwZSB7QXJyYXkuPEZpbGU+fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wb29sID0gW107XG5cbiAgICAgICAgaWYgKHVwbG9hZGVyLmlzQmF0Y2hUcmFuc2Zlcikge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBPdmVycmlkZSByZW1vdmUgZnVuY3Rpb24gZm9yIGJhdGNoIHRyYW5zZmVyXG4gICAgICAgICAgICAgKiBAdHlwZSB7T2xkLl9yZW1vdmVXaGVuQmF0Y2h9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMucmVtb3ZlID0gdGhpcy5fcmVtb3ZlV2hlbkJhdGNoO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtzdHJpbmd9IFJlcXVlc3RlciB0eXBlXG4gICAgICovXG4gICAgVFlQRTogVFlQRSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgZm9yIHVwbG9hZCBlcnJvclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBqcVhIUiAtIGpRdWVyeSBYSFJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdHVzIC0gQWpheCBTdGF0dXNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbXNnVGhyb3duIC0gRXJyb3IgbWVzc2FnZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwbG9hZEVycm9yOiBmdW5jdGlvbihqcVhIUiwgc3RhdHVzLCBtc2dUaHJvd24pIHtcbiAgICAgICAgdGhpcy5maXJlKCdlcnJvcicsIHtcbiAgICAgICAgICAgIHN0YXR1czogc3RhdHVzLFxuICAgICAgICAgICAgbWVzc2FnZTogbXNnVGhyb3duXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIGZvciB1cGxvYWQgc3VjY2Vzc1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gVXBsb2FkIHN1Y2Nlc3MgZGF0YVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwbG9hZFN1Y2Nlc3M6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdGhpcy5maXJlKCd1cGxvYWRlZCcsIEpTT04ucGFyc2UoZGF0YSkpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdG9yZSBmaWxlcyB0byBsb2NhbCBwb29sXG4gICAgICogQHBhcmFtIHtBcnJheS48RmlsZT4gfCBGaWxlfSBbZmlsZXNdIC0gQSBmaWxlIG9yIGZpbGVzXG4gICAgICovXG4gICAgc3RvcmU6IGZ1bmN0aW9uKGZpbGVzKSB7XG4gICAgICAgIHZhciBwb29sID0gdGhpcy5wb29sLFxuICAgICAgICAgICAgc3RhbXAgPSB0dWkudXRpbC5zdGFtcCxcbiAgICAgICAgICAgIGRhdGEgPSBbXTtcbiAgICAgICAgZmlsZXMgPSB0dWkudXRpbC50b0FycmF5KGZpbGVzIHx8IHRoaXMuZm9ybVZpZXcuJGZpbGVJbnB1dFswXS5maWxlcyk7XG5cbiAgICAgICAgZm9yRWFjaChmaWxlcywgZnVuY3Rpb24oZmlsZSkge1xuICAgICAgICAgICAgdmFyIGlkID0gc3RhbXAoZmlsZSk7XG4gICAgICAgICAgICBwb29sLnB1c2goZmlsZSk7XG4gICAgICAgICAgICBkYXRhLnB1c2goe1xuICAgICAgICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICAgICAgICBuYW1lOiBmaWxlLm5hbWUsXG4gICAgICAgICAgICAgICAgc2l6ZTogZmlsZS5zaXplXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5mb3JtVmlldy5yZXNldEZpbGVJbnB1dCgpO1xuICAgICAgICB0aGlzLmZpcmUoJ3N0b3JlZCcsIGRhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGxvYWQgYWpheFxuICAgICAqL1xuICAgIHVwbG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBmb3JtID0gdGhpcy5mb3JtVmlldy4kZWwuY2xvbmUoKSxcbiAgICAgICAgICAgIGZpZWxkID0gdGhpcy51cGxvYWRlci5maWxlRmllbGQsXG4gICAgICAgICAgICBmb3JtRGF0YTtcblxuICAgICAgICBmb3JtLmZpbmQoJ2lucHV0W3R5cGU9XCJmaWxlXCJdJykucmVtb3ZlKCk7XG4gICAgICAgIGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKGZvcm0pO1xuXG4gICAgICAgIGZvckVhY2godGhpcy5wb29sLCBmdW5jdGlvbihmaWxlKSB7XG4gICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoZmllbGQsIGZpbGUpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiB0aGlzLnVwbG9hZGVyLnVybC5zZW5kLFxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgZGF0YTogZm9ybURhdGEsXG4gICAgICAgICAgICBzdWNjZXNzOiAkLnByb3h5KHRoaXMuX3VwbG9hZFN1Y2Nlc3MsIHRoaXMpLFxuICAgICAgICAgICAgZXJyb3I6ICQucHJveHkodGhpcy5fdXBsb2FkRXJyb3IsIHRoaXMpLFxuICAgICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBmaWxlIChhamF4LWpzb25wKVxuICAgICAqIEl0IGlzIG5vdCB1c2VkIGZvciBiYXRjaCB0cmFuc2Zlci5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIC0gUGFyYW1ldGVycyB0byByZW1vdmUgZmlsZVxuICAgICAqL1xuICAgIHJlbW92ZTogZnVuY3Rpb24ocGFyYW1zKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHVwbG9hZGVyLnVybC5yZW1vdmUsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb25wJyxcbiAgICAgICAgICAgIGRhdGE6IHBhcmFtcyxcbiAgICAgICAgICAgIHN1Y2Nlc3M6ICQucHJveHkoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIGRhdGEudHlwZSA9ICdyZW1vdmUnO1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgncmVtb3ZlZCcsIGRhdGEpO1xuICAgICAgICAgICAgfSwgdGhpcylcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBmaWxlIChhamF4LWpzb25wKVxuICAgICAqIEl0IGlzIHVzZWQgZm9yIGJhdGNoIHRyYW5zZmVyLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgLSBQYXJhbWV0ZXJzIHRvIHJlbW92ZSBmaWxlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlV2hlbkJhdGNoOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICAgICAgdmFyIHBvb2wgPSB0aGlzLnBvb2wsXG4gICAgICAgICAgICBoYXNTdGFtcCA9IHR1aS51dGlsLmhhc1N0YW1wLFxuICAgICAgICAgICAgc3RhbXAgPSB0dWkudXRpbC5zdGFtcCxcbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbHNlO1xuXG4gICAgICAgIGZvckVhY2gocG9vbCwgZnVuY3Rpb24oZmlsZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmIChoYXNTdGFtcChmaWxlKSAmJiAoc3RhbXAoZmlsZSkgPT09IHBhcmFtcy5pZCkpIHtcbiAgICAgICAgICAgICAgICBwb29sLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuZmlyZSgncmVtb3ZlZCcsIHR1aS51dGlsLmV4dGVuZCh7XG4gICAgICAgICAgICBtZXNzYWdlOiByZXN1bHQgPyAnc3VjY2VzcycgOiAnZmFpbCdcbiAgICAgICAgfSwgcGFyYW1zKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENsZWFyIHRoZSBwb29sXG4gICAgICovXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnBvb2wubGVuZ3RoID0gMDtcbiAgICB9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKE1vZGVybik7XG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVybjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFBvb2wgPSByZXF1aXJlKCcuLi9wb29sJyksXG4gICAgY29uc3RzID0gcmVxdWlyZSgnLi4vY29uc3RzJyk7XG5cbnZhciBUWVBFID0gY29uc3RzLkNPTkYuUkVRVUVTVEVSX1RZUEVfT0xEO1xuXG4vKipcbiAqIE9sZCByZXF1ZXN0ZXJcbiAqIEBwYXJhbSB7VXBsb2FkZXJ9IHVwbG9hZGVyIC0gVXBsb2FkZXJcbiAqIEBjbGFzc1xuICovXG52YXIgT2xkID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBPbGQucHJvdG90eXBlICove1xuICAgIGluaXQ6IGZ1bmN0aW9uKHVwbG9hZGVyKSB7XG4gICAgICAgIHZhciAkaGlkZGVuRnJhbWUgPSB1cGxvYWRlci4kdGFyZ2V0RnJhbWUsXG4gICAgICAgICAgICBmb3JtVmlldyA9IHVwbG9hZGVyLmZvcm1WaWV3O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBVcGxvYWRlclxuICAgICAgICAgKiBAdHlwZSB7VXBsb2FkZXJ9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnVwbG9hZGVyID0gdXBsb2FkZXI7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZyb20gdmlld1xuICAgICAgICAgKiBAdHlwZSB7Rm9ybX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZm9ybVZpZXcgPSBmb3JtVmlldztcblxuICAgICAgICAvKipcbiAgICAgICAgICogTG9jYWwgcG9vbCBmb3IgZmlsZSBlbGVtZW50c1xuICAgICAgICAgKiBAdHlwZSB7UG9vbH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucG9vbCA9IG5ldyBQb29sKGZvcm1WaWV3LiRlbFswXSk7XG5cbiAgICAgICAgaWYgKHVwbG9hZGVyLmlzQmF0Y2hUcmFuc2Zlcikge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBPdmVycmlkZSBVcGxvYWQgZnVuY3Rpb24gZm9yIGJhdGNoIHRyYW5zZmVyXG4gICAgICAgICAgICAgKiBAdHlwZSB7T2xkLl91cGxvYWRXaGVuQmF0Y2h9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMudXBsb2FkID0gdGhpcy5fdXBsb2FkV2hlbkJhdGNoO1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE92ZXJyaWRlIHJlbW92ZSBmdW5jdGlvbiBmb3IgYmF0Y2ggdHJhbnNmZXJcbiAgICAgICAgICAgICAqIEB0eXBlIHtPbGQuX3JlbW92ZVdoZW5CYXRjaH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUgPSB0aGlzLl9yZW1vdmVXaGVuQmF0Y2g7XG4gICAgICAgIH1cblxuICAgICAgICAkaGlkZGVuRnJhbWUub24oJ2xvYWQnLCAkLnByb3h5KHRoaXMuX29uTG9hZEhpZGRlbkZyYW1lLCB0aGlzLCAkaGlkZGVuRnJhbWUpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge3N0cmluZ30gUmVxdWVzdGVyIHR5cGVcbiAgICAgKi9cbiAgICBUWVBFOiBUWVBFLFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlclxuICAgICAqIFwibG9hZFwiIG9mIGhpZGRlbiBmcmFtZS5cbiAgICAgKiBAcGFyYW0ge2pRdWVyeX0gJGhpZGRlbkZyYW1lIC0gSGlkZGVuIGlmcmFtZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uTG9hZEhpZGRlbkZyYW1lOiBmdW5jdGlvbigkaGlkZGVuRnJhbWUpIHtcbiAgICAgICAgdmFyIGZyYW1lQm9keSxcbiAgICAgICAgICAgIGRhdGE7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZyYW1lQm9keSA9ICRoaWRkZW5GcmFtZVswXS5jb250ZW50V2luZG93LmRvY3VtZW50LmJvZHk7XG4gICAgICAgICAgICBkYXRhID0gdHVpLnV0aWwucGljayhmcmFtZUJvZHksICdmaXJzdENoaWxkJywgJ2RhdGEnKTtcbiAgICAgICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCd1cGxvYWRlZCcsICQucGFyc2VKU09OKGRhdGEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhpcy5maXJlKCdlcnJvcicsIHtcbiAgICAgICAgICAgICAgICBzdGF0dXM6IGUubmFtZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBlLm1lc3NhZ2VcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN0b3JlIGZpbGUgaW5wdXQgZWxlbWVudCBmcm9tIHVwbG9hZCBmb3JtXG4gICAgICovXG4gICAgc3RvcmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZWwgPSB0aGlzLmZvcm1WaWV3LiRmaWxlSW5wdXRbMF0sXG4gICAgICAgICAgICBpZCA9IHR1aS51dGlsLnN0YW1wKGVsKTtcblxuICAgICAgICB0aGlzLnBvb2wuc3RvcmUoZWwpO1xuICAgICAgICB0aGlzLmZvcm1WaWV3LnJlc2V0RmlsZUlucHV0KCk7XG5cbiAgICAgICAgdGhpcy5maXJlKCdzdG9yZWQnLCBbe1xuICAgICAgICAgICAgaWQ6IGlkLFxuICAgICAgICAgICAgbmFtZTogZWwudmFsdWUsXG4gICAgICAgICAgICBzaXplOiAnJ1xuICAgICAgICB9XSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwbG9hZC5cbiAgICAgKiBJdCBpcyBub3QgdXNlZCBmb3IgYmF0Y2ggdHJhbnNmZXIuXG4gICAgICovXG4gICAgdXBsb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5wb29sLnBsYW50KCk7XG4gICAgICAgIHRoaXMuZm9ybVZpZXcuJGVsLnN1Ym1pdCgpO1xuICAgICAgICB0aGlzLmZvcm1WaWV3LmNsZWFyKCk7XG4gICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBsb2FkLlxuICAgICAqIEl0IGlzIHVzZWQgZm9yIGJhdGNoIHRyYW5zZmVyLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwbG9hZFdoZW5CYXRjaDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucG9vbC5wbGFudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZmlsZSAoYWpheC1qc29ucClcbiAgICAgKiBJdCBpcyBub3QgdXNlZCBmb3IgYmF0Y2ggdHJhbnNmZXIuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtcyAtIFBhcmFtZXRlcnMgdG8gcmVtb3ZlIGZpbGVcbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAgICB2YXIgdXBsb2FkZXIgPSB0aGlzLnVwbG9hZGVyO1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiB1cGxvYWRlci51cmwucmVtb3ZlLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29ucCcsXG4gICAgICAgICAgICBkYXRhOiBwYXJhbXMsXG4gICAgICAgICAgICBzdWNjZXNzOiAkLnByb3h5KGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBkYXRhLnR5cGUgPSAncmVtb3ZlJztcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZWQnLCBkYXRhKTtcbiAgICAgICAgICAgIH0sIHRoaXMpXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZmlsZSAoYWpheC1qc29ucClcbiAgICAgKiBJdCBpcyB1c2VkIGZvciBiYXRjaCB0cmFuc2Zlci5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIC0gUGFyYW1ldGVycyB0byByZW1vdmUgZmlsZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbW92ZVdoZW5CYXRjaDogZnVuY3Rpb24ocGFyYW1zKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSB0aGlzLnBvb2wucmVtb3ZlKHBhcmFtcyk7XG5cbiAgICAgICAgdGhpcy5maXJlKCdyZW1vdmVkJywgdHVpLnV0aWwuZXh0ZW5kKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IHJlc3VsdCA/ICdzdWNjZXNzJyA6ICdmYWlsJ1xuICAgICAgICB9LCBwYXJhbXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgdGhlIHBvb2xcbiAgICAgKi9cbiAgICBjbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucG9vbC5lbXB0eSgpO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oT2xkKTtcbm1vZHVsZS5leHBvcnRzID0gT2xkO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZpbGVVcGxvYWRlciBpcyBjb3JlIG9mIGZpbGUgdXBsb2FkZXIgY29tcG9uZW50Ljxicj5GaWxlTWFuYWdlciBtYW5hZ2UgY29ubmVjdG9yIHRvIGNvbm5lY3Qgc2VydmVyIGFuZCB1cGRhdGUgRmlsZUxpc3RWaWV3LlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcbnZhciBjb25zdHMgPSByZXF1aXJlKCcuL2NvbnN0cycpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIEZvcm0gPSByZXF1aXJlKCcuL3ZpZXcvZm9ybScpO1xudmFyIExpc3QgPSByZXF1aXJlKCcuL3ZpZXcvbGlzdCcpO1xudmFyIERyYWdBbmREcm9wID0gcmVxdWlyZSgnLi92aWV3L2RyYWcnKTtcbnZhciBPbGRSZXF1ZXN0ZXIgPSByZXF1aXJlKCcuL3JlcXVlc3Rlci9vbGQnKTtcbnZhciBNb2Rlcm5SZXF1ZXN0ZXIgPSByZXF1aXJlKCcuL3JlcXVlc3Rlci9tb2Rlcm4nKTtcblxudmFyIHNuaXBwZXQgPSB0dWkudXRpbCxcbiAgICBSRVFVRVNURVJfVFlQRV9NT0RFUk4gPSBjb25zdHMuQ09ORi5SRVFVRVNURVJfVFlQRV9NT0RFUk4sXG4gICAgaXNTdXBwb3J0Rm9ybURhdGEgPSB1dGlscy5pc1N1cHBvcnRGb3JtRGF0YSgpO1xuXG4vKipcbiAqIEZpbGVVcGxvYWRlciBhY3QgbGlrZSBicmlkZ2UgYmV0d2VlbiBjb25uZWN0b3IgYW5kIHZpZXcuXG4gKiBJdCBtYWtlcyBjb25uZWN0b3IgYW5kIHZpZXcgd2l0aCBvcHRpb24gYW5kIGVudmlyb25tZW50LlxuICogSXQgY29udHJvbCBhbmQgbWFrZSBjb25uZWN0aW9uIGFtb25nIG1vZHVsZXMuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFRoZSBvcHRpb25zIHRvIHNldCB1cCBmaWxlIHVwbG9hZGVyIG1vZHVsZXMuXG4gKiAgQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMudXJsIFRoZSB1cmwgaXMgZmlsZSBzZXJ2ZXIuXG4gKiAgICAgIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnVybC5zZW5kIFRoZSB1cmwgaXMgZm9yIGZpbGUgYXR0YWNoLlxuICogICAgICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy51cmwucmVtb3ZlIFRoZSB1cmwgaXMgZm9yIGZpbGUgZGV0YWNoLlxuICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmZvcm1UYXJnZXQgVGhlIHRhcmdldCBmb3IgeC1kb21haW4ganNvbnAgY2FzZS5cbiAqICBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy5saXN0SW5mbyBUaGUgZWxlbWVudCBpbmZvIHRvIGRpc3BsYXkgZmlsZSBsaXN0IGluZm9ybWF0aW9uLlxuICogIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5maWxlRmllbGQ9J3VzZXJGaWxlW10nXSBUaGUgZmllbGQgbmFtZSBvZiBpbnB1dCBmaWxlIGVsZW1lbnQuXG4gKiAgQHBhcmFtIHtib29sZWFufSBvcHRpb25zLnVzZUZvbGRlciBXaGV0aGVyIHNlbGVjdCB1bml0IGlzIGZvbGRlciBvZiBub3QuIElmIHRoaXMgaXMgdHVyZSwgbXVsdGlwbGUgd2lsbCBiZSBpZ25vcmVkLlxuICogIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy5pc011bHRpcGxlIFdoZXRoZXIgZW5hYmxlIG11bHRpcGxlIHNlbGVjdCBvciBub3QuXG4gKiBAcGFyYW0ge2pRdWVyeX0gJGVsIFJvb3QgRWxlbWVudCBvZiBVcGxvYWRlclxuICogQGV4YW1wbGVcbiAqIHZhciB1cGxvYWRlciA9IG5ldyB0dWkuY29tcG9uZW50LlVwbG9hZGVyKHtcbiAqICAgICB1cmw6IHtcbiAqICAgICAgICAgc2VuZDogXCJodHRwOi8vZmUubmhuZW50LmNvbS9ldGMvZXRjL3VwbG9hZGVyL3VwbG9hZGVyLnBocFwiLFxuICogICAgICAgICByZW1vdmU6IFwiaHR0cDovL2ZlLm5obmVudC5jb20vZXRjL2V0Yy91cGxvYWRlci9yZW1vdmUucGhwXCJcbiAqICAgICB9LFxuICogICAgIGZvcm1UYXJnZXQ6ICdoaWRkZW5GcmFtZScsXG4gKiAgICAgbGlzdEluZm86IHtcbiAqICAgICAgICAgbGlzdDogJCgnI2ZpbGVzJyksXG4gKiAgICAgICAgIGNvdW50OiAkKCcjZmlsZV9jb3VudCcpLFxuICogICAgICAgICBzaXplOiAkKCcjc2l6ZV9jb3VudCcpXG4gKiAgICAgfVxuICogfSwgJCgnI3VwbG9hZGVyJykpO1xuICovXG52YXIgVXBsb2FkZXIgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKipAbGVuZHMgVXBsb2FkZXIucHJvdG90eXBlICove1xuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMsICRlbCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogVXBsb2FkZXIgZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kZWwgPSAkZWw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNlbmQvUmVtb3ZlIHVybFxuICAgICAgICAgKiBAdHlwZSB7e3NlbmQ6IHN0cmluZywgcmVtb3ZlOiBzdHJpbmd9fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy51cmwgPSBvcHRpb25zLnVybDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVkaXJlY3QgVVJMIGZvciBDT1JTKHJlc3BvbnNlLCBJRTcpXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnJlZGlyZWN0VVJMID0gb3B0aW9ucy5yZWRpcmVjdFVSTDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRm9ybSB0YXJnZXQgbmFtZSBmb3IgQ09SUyAoSUU3LCA4LCA5KVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5mb3JtVGFyZ2V0ID0gb3B0aW9ucy5mb3JtVGFyZ2V0IHx8IGNvbnN0cy5DT05GLkZPUk1fVEFSR0VUX05BTUU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRhcmdldCBmcmFtZSBmb3IgQ09SUyAoSUU3LCA4LCA5KVxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kdGFyZ2V0RnJhbWUgPSB0aGlzLl9jcmVhdGVUYXJnZXRGcmFtZSgpXG4gICAgICAgICAgICAuYXBwZW5kVG8odGhpcy4kZWwpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJbnB1dCBmaWxlIC0gZmllbGQgbmFtZVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5maWxlRmllbGQgPSBvcHRpb25zLmZpbGVGaWVsZCB8fCBjb25zdHMuQ09ORi5GSUxFX0ZJTEVEX05BTUU7XG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciB0aGUgc2VuZGluZy9yZW1vdmluZyB1cmxzIGFyZSB4LWRvbWFpbi5cbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzQ3Jvc3NEb21haW4gPSB1dGlscy5pc0Nyb3NzRG9tYWluKHRoaXMudXJsLnNlbmQpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIFBvc3RNZXNzYWdlIEFQSVxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaXNTdXBwb3J0UG9zdE1lc3NhZ2UgPSAhIShzbmlwcGV0LnBpY2sodGhpcy4kdGFyZ2V0RnJhbWUsICcwJywgJ2NvbnRlbnRXaW5kb3cnLCAncG9zdE1lc3NhZ2UnKSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdoZXRoZXIgdGhlIHVzZXIgdXNlcyBtdWx0aXBsZSB1cGxvYWRcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmlzTXVsdGlwbGUgPSAhIShvcHRpb25zLmlzTXVsdGlwbGUpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHRoZSB1c2VyIHVzZXMgZHJhZyZkcm9wIHVwbG9hZFxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudXNlRHJhZyA9ICEhKG9wdGlvbnMudXNlRHJhZyk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdoZXRoZXIgdGhlIHVzZXIgdXNlcyBmb2xkZXIgdXBsb2FkXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy51c2VGb2xkZXIgPSAhIShvcHRpb25zLnVzZUZvbGRlcik7XG5cbiAgICAgICAgaWYgKHRoaXMudXNlRHJhZyAmJiAhdGhpcy51c2VGb2xkZXIgJiYgdXRpbHMuaXNTdXBwb3J0RmlsZVN5c3RlbSgpKSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIERyYWcgJiBEcm9wIFZpZXdcbiAgICAgICAgICAgICAqIEB0eXBlIHtEcmFnQW5kRHJvcH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5kcmFnVmlldyA9IG5ldyBEcmFnQW5kRHJvcCh0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGcm9tIFZpZXdcbiAgICAgICAgICogQHR5cGUge0Zvcm19XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZvcm1WaWV3ID0gbmV3IEZvcm0odGhpcyk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExpc3QgVmlld1xuICAgICAgICAgKiBAdHlwZSB7TGlzdH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubGlzdFZpZXcgPSBuZXcgTGlzdChvcHRpb25zLmxpc3RJbmZvKTtcblxuICAgICAgICB0aGlzLl9zZXRSZXF1ZXN0ZXIoKTtcbiAgICAgICAgdGhpcy5fYWRkRXZlbnQoKTtcbiAgICAgICAgaWYgKHRoaXMuaXNDcm9zc0RvbWFpbiAmJiB0aGlzLmlzU3VwcG9ydFBvc3RNZXNzYWdlKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRQb3N0TWVzc2FnZUV2ZW50KCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IENvbm5lY3RvclxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldFJlcXVlc3RlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChpc1N1cHBvcnRGb3JtRGF0YSkge1xuICAgICAgICAgICAgdGhpcy5fcmVxdWVzdGVyID0gbmV3IE1vZGVyblJlcXVlc3Rlcih0aGlzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3JlcXVlc3RlciA9IG5ldyBPbGRSZXF1ZXN0ZXIodGhpcyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHBvc3QtbWVzc2FnZSBldmVudCBpZiBzdXBwb3J0ZWQgYW5kIG5lZWRlZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldFBvc3RNZXNzYWdlRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiR0YXJnZXRGcmFtZS5vZmYoJ2xvYWQnKTtcbiAgICAgICAgJCh3aW5kb3cpLm9uKCdtZXNzYWdlJywgJC5wcm94eShmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgdmFyIG9yaWdpbmFsRXZlbnQgPSBldmVudC5vcmlnaW5hbEV2ZW50LFxuICAgICAgICAgICAgICAgIGRhdGEgPSAkLnBhcnNlSlNPTihvcmlnaW5hbEV2ZW50LmRhdGEpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy51cmwuc2VuZC5pbmRleE9mKG9yaWdpbmFsRXZlbnQub3JpZ2luKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgnc3VjY2VzcycsIGRhdGEpO1xuICAgICAgICB9LCB0aGlzKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2VzIGVsZW1lbnQgdG8gYmUgdGFyZ2V0IG9mIHN1Ym1pdCBmb3JtIGVsZW1lbnQuXG4gICAgICogQHJldHVybnMge2pRdWVyeX0gVGFyZ2V0IGZvcm06IGpxdWVyeS1lbGVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY3JlYXRlVGFyZ2V0RnJhbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHRhcmdldCA9ICQoJzxpZnJhbWUgbmFtZT1cIicgKyB0aGlzLmZvcm1UYXJnZXQgKyAnXCI+PC9pZnJhbWU+Jyk7XG4gICAgICAgICR0YXJnZXQuY3NzKHtcbiAgICAgICAgICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nLFxuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuICR0YXJnZXQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBsaXN0IHZpZXcgd2l0aCBjdXN0b20gb3Igb3JpZ2luYWwgZGF0YS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2luZm9dIFRoZSBkYXRhIGZvciB1cGRhdGUgbGlzdFxuICAgICAqL1xuICAgIHVwZGF0ZUxpc3Q6IGZ1bmN0aW9uKGluZm8pIHtcbiAgICAgICAgdGhpcy5saXN0Vmlldy51cGRhdGUoaW5mbyk7XG4gICAgICAgIGlmICh0aGlzLmlzQmF0Y2hUcmFuc2Zlcikge1xuICAgICAgICAgICAgdGhpcy5saXN0Vmlldy51cGRhdGVUb3RhbEluZm8oaW5mbyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RWaWV3LnVwZGF0ZVRvdGFsSW5mbygpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZvciBjdXN0b20gc2VuZCBldmVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IFtldmVudF0gLSBGb3JtIHN1Ym1pdCBldmVudFxuICAgICAqL1xuICAgIHNlbmRGaWxlOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB0aGlzLnN0b3JlKCk7XG4gICAgICAgIHRoaXMuc3VibWl0KGV2ZW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZm9yIGN1c3RvbSByZW1vdmUgZXZlbnRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBUaGUgZGF0YSBmb3IgcmVtb3ZlIGZpbGUuXG4gICAgICovXG4gICAgcmVtb3ZlRmlsZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB0aGlzLl9yZXF1ZXN0ZXIucmVtb3ZlKGRhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdWJtaXQgZm9yIGRhdGEgc3VibWl0IHRvIHNlcnZlclxuICAgICAqIEBwYXJhbSB7RXZlbnR9IFtldmVudF0gLSBGb3JtIHN1Ym1pdCBldmVudFxuICAgICAqIEBhcGlcbiAgICAgKi9cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudCAmJiB0aGlzLl9yZXF1ZXN0ZXIuVFlQRSA9PT0gUkVRVUVTVEVSX1RZUEVfTU9ERVJOKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3JlcXVlc3Rlci51cGxvYWQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50cyB0byB2aWV3cyBhbmQgZmlyZSB1cGxvYWRlciBldmVudHNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnVzZURyYWcgJiYgdGhpcy5kcmFnVmlldykge1xuICAgICAgICAgICAgdGhpcy5kcmFnVmlldy5vbignZHJvcCcsIHRoaXMuc3RvcmUsIHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGlzdFZpZXcub24oJ3JlbW92ZScsIHRoaXMucmVtb3ZlRmlsZSwgdGhpcyk7XG4gICAgICAgIGlmICh0aGlzLmlzQmF0Y2hUcmFuc2Zlcikge1xuICAgICAgICAgICAgdGhpcy5fYWRkRXZlbnRXaGVuQmF0Y2hUcmFuc2ZlcigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fYWRkRXZlbnRXaGVuTm9ybWFsVHJhbnNmZXIoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnQgd2hlbiB1cGxvYWRlciB1c2VzIGJhdGNoLXRyYW5zZmVyXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRXZlbnRXaGVuQmF0Y2hUcmFuc2ZlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZm9ybVZpZXcub24oe1xuICAgICAgICAgICAgY2hhbmdlOiB0aGlzLnN0b3JlLFxuICAgICAgICAgICAgc3VibWl0OiB0aGlzLnN1Ym1pdFxuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICB0aGlzLl9yZXF1ZXN0ZXIub24oe1xuICAgICAgICAgICAgcmVtb3ZlZDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGlzdChkYXRhKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZScsIGRhdGEpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdlcnJvcicsIGRhdGEpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVwbG9hZGVkOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgnc3VjY2VzcycsIGRhdGEpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0b3JlZDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGlzdChkYXRhKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3VwZGF0ZScsIGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IHdoZW4gdXBsb2FkZXIgdXNlcyBub3JtYWwtdHJhbnNmZXJcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRFdmVudFdoZW5Ob3JtYWxUcmFuc2ZlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZm9ybVZpZXcub24oJ2NoYW5nZScsIHRoaXMuc2VuZEZpbGUsIHRoaXMpO1xuICAgICAgICB0aGlzLl9yZXF1ZXN0ZXIub24oe1xuICAgICAgICAgICAgcmVtb3ZlZDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGlzdChkYXRhKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZScsIGRhdGEpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdlcnJvcicsIGRhdGEpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVwbG9hZGVkOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVMaXN0KGRhdGEuZmlsZWxpc3QpO1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgnc3VjY2VzcycsIGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgdXBsb2FkZXJcbiAgICAgKi9cbiAgICBjbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3JlcXVlc3Rlci5jbGVhcigpO1xuICAgICAgICB0aGlzLmZvcm1WaWV3LmNsZWFyKCk7XG4gICAgICAgIHRoaXMubGlzdFZpZXcuY2xlYXIoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RvcmUgaW5wdXQgZWxlbWVudCB0byBwb29sLlxuICAgICAqIEBwYXJhbSB7QXJyYXkuPEZpbGU+IHwgRmlsZX0gW2ZpbGVzXSAtIEEgZmlsZSBvciBmaWxlc1xuICAgICAqL1xuICAgIHN0b3JlOiBmdW5jdGlvbihmaWxlcykge1xuICAgICAgICB0aGlzLl9yZXF1ZXN0ZXIuc3RvcmUoZmlsZXMpO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oVXBsb2FkZXIpO1xubW9kdWxlLmV4cG9ydHMgPSBVcGxvYWRlcjtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIGZpbGUgY29udGFpbiB1dGlsaXR5IG1ldGhvZHMgZm9yIHVwbG9hZGVyLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuLyoqXG4gKiBAbmFtZXNwYWNlIHV0aWxzXG4gKi9cbnZhciBJU19TVVBQT1JUX0ZJTEVfU1lTVEVNID0gISEod2luZG93LkZpbGUgJiYgd2luZG93LkZpbGVSZWFkZXIgJiYgd2luZG93LkZpbGVMaXN0ICYmIHdpbmRvdy5CbG9iKSxcbiAgICBJU19TVVBQT1JUX0ZPUk1fREFUQSA9ICEhKHdpbmRvdy5Gb3JtRGF0YSB8fCBudWxsKTtcblxuLyoqXG4gKiBQYXJzZSB1cmxcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgLSB1cmwgZm9yIHBhcnNpbmdcbiAqIEByZXR1cm5zIHtPYmplY3R9IFVSTCBpbmZvcm1hdGlvblxuICovXG5mdW5jdGlvbiBwYXJzZVVSTCh1cmwpIHtcbiAgICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICBhLmhyZWYgPSB1cmw7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBocmVmOiBhLmhyZWYsXG4gICAgICAgIGhvc3Q6IGEuaG9zdCxcbiAgICAgICAgcG9ydDogYS5wb3J0LFxuICAgICAgICBoYXNoOiBhLmhhc2gsXG4gICAgICAgIGhvc3RuYW1lOiBhLmhvc3RuYW1lLFxuICAgICAgICBwYXRobmFtZTogYS5wYXRobmFtZSxcbiAgICAgICAgcHJvdG9jb2w6IGEucHJvdG9jb2wsXG4gICAgICAgIHNlYXJjaDogYS5zZWFyY2gsXG4gICAgICAgIHF1ZXJ5OiBhLnNlYXJjaC5zbGljZSgxKVxuICAgIH07XG59XG5cbi8qKlxuICogRXh0cmFjdCB1bml0IGZvciBmaWxlIHNpemVcbiAqIEBwYXJhbSB7bnVtYmVyfSBieXRlcyBBIHVzYWdlIG9mIGZpbGVcbiAqIEByZXR1cm5zIHtzdHJpbmd9IFNpemUtc3RyaW5nXG4gKiBAbWVtYmVyb2YgdXRpbHNcbiAqL1xuZnVuY3Rpb24gZ2V0RmlsZVNpemVXaXRoVW5pdChieXRlcykge1xuICAgIHZhciB1bml0cyA9IFsnQicsICdLQicsICdNQicsICdHQicsICdUQiddLFxuICAgICAgICBieXRlcyA9IHBhcnNlSW50KGJ5dGVzLCAxMCksXG4gICAgICAgIGV4cCA9IE1hdGgubG9nKGJ5dGVzKSAvIE1hdGgubG9nKDEwMjQpIHwgMCxcbiAgICAgICAgcmVzdWx0ID0gKGJ5dGVzIC8gTWF0aC5wb3coMTAyNCwgZXhwKSkudG9GaXhlZCgyKTtcblxuICAgIHJldHVybiByZXN1bHQgKyB1bml0c1tleHBdO1xufVxuXG4vKipcbiAqIFdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgRm9ybURhdGEgb3Igbm90XG4gKiBAbWVtYmVyb2YgdXRpbHNcbiAqIEByZXR1cm5zIHtib29sZWFufSB3aGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIEZvcm1EYXRhXG4gKi9cbmZ1bmN0aW9uIGlzU3VwcG9ydEZvcm1EYXRhKCkge1xuICAgIHJldHVybiBJU19TVVBQT1JUX0ZPUk1fREFUQTtcbn1cblxuLyoqXG4gKiBHZXQgaXRlbSBlbGVtZW50cyBIVE1MXG4gKiBAcGFyYW0ge09iamVjdH0gbWFwIC0gUHJvcGVydGllcyBmb3IgdGVtcGxhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBodG1sIEhUTUwgdGVtcGxhdGVcbiAqIEByZXR1cm5zIHtzdHJpbmd9IEhUTUxcbiAqIEBtZW1iZXJvZiB1dGlsc1xuICovXG5mdW5jdGlvbiB0ZW1wbGF0ZShtYXAsIGh0bWwpIHtcbiAgICBodG1sID0gaHRtbC5yZXBsYWNlKC9cXHtcXHsoW15cXH1dKylcXH1cXH0vZywgZnVuY3Rpb24gKG1zdHIsIG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIG1hcFtuYW1lXTtcbiAgICB9KTtcbiAgICByZXR1cm4gaHRtbDtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIGZpbGUgYXBpLlxuICogQHJldHVybnMge2Jvb2xlYW59IHdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgRmlsZUFQSVxuICogQG1lbWJlcm9mIHV0aWxzXG4gKi9cbmZ1bmN0aW9uIGlzU3VwcG9ydEZpbGVTeXN0ZW0oKSB7XG4gICAgcmV0dXJuIElTX1NVUFBPUlRfRklMRV9TWVNURU07XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgdXJsIGlzIHgtZG9tYWluXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsIC0gVVJMXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gV2hldGhlciB0aGUgdXJsIGlzIHgtZG9tYWluXG4gKiBAbWVtYmVyb2YgdXRpbHNcbiAqL1xuZnVuY3Rpb24gaXNDcm9zc0RvbWFpbih1cmwpIHtcbiAgICB2YXIgaGVyZSA9IHBhcnNlVVJMKHdpbmRvdy5sb2NhdGlvbi5ocmVmKSxcbiAgICAgICAgdGFyZ2V0ID0gcGFyc2VVUkwodXJsKTtcblxuICAgIHJldHVybiB0YXJnZXQuaG9zdG5hbWUgIT09IGhlcmUuaG9zdG5hbWVcbiAgICAgICAgfHwgdGFyZ2V0LnBvcnQgIT09IGhlcmUucG9ydFxuICAgICAgICB8fCB0YXJnZXQucHJvdG9jb2wgIT09IGhlcmUucHJvdG9jb2w7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldEZpbGVTaXplV2l0aFVuaXQ6IGdldEZpbGVTaXplV2l0aFVuaXQsXG4gICAgaXNTdXBwb3J0RmlsZVN5c3RlbTogaXNTdXBwb3J0RmlsZVN5c3RlbSxcbiAgICBpc1N1cHBvcnRGb3JtRGF0YTogaXNTdXBwb3J0Rm9ybURhdGEsXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxuICAgIGlzQ3Jvc3NEb21haW46IGlzQ3Jvc3NEb21haW5cbn07XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgVGhpcyBmaWxlIGlzIGFib3V0IGRyYWcgYW5kIGRyb3AgZmlsZSB0byBzZW5kLiBEcmFnIGFuZCBkcm9wIGlzIHJ1bm5pbmcgdmlhIGZpbGUgYXBpLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcbnZhciBjb25zdHMgPSByZXF1aXJlKCcuLi9jb25zdHMnKTtcblxuLyoqXG4gKiBNYWtlcyBkcmFnIGFuZCBkcm9wIGFyZWEsIHRoZSBkcm9wcGVkIGZpbGUgaXMgYWRkZWQgdmlhIGV2ZW50IGRyb3AgZXZlbnQuXG4gKiBAcGFyYW0ge1VwbG9hZGVyfSB1cGxvYWRlciAtIFVwbG9hZGVyXG4gKiBAY2xhc3MgRHJhZ0FuZERyb3BcbiAqL1xudmFyIERyYWdBbmREcm9wID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBEcmFnQW5kRHJvcC5wcm90b3R5cGUgKi97XG4gICAgaW5pdDogZnVuY3Rpb24odXBsb2FkZXIpIHtcbiAgICAgICAgdmFyIGh0bWwgPSBjb25zdHMuSFRNTC5kcmFnQW5kRHJvcDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRHJvcCB6b25lIGpRdWVyeS1lbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiRlbCA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENsYXNzIGZvciBkcm9wIGVuYWJsZWRcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2VuYWJsZUNsYXNzID0gY29uc3RzLkNPTkYuRFJPUF9FTkFCTEVEX0NMQVNTO1xuXG4gICAgICAgIHRoaXMuX3JlbmRlcihodG1sLCB1cGxvYWRlcik7XG4gICAgICAgIHRoaXMuX2FkZEV2ZW50KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbmRlcnMgZHJhZyBhbmQgZHJvcCBhcmVhXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGh0bWwgVGhlIGh0bWwgc3RyaW5nIHRvIG1ha2UgZGFyZyB6b25lXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHVwbG9hZGVyIFRoZSBjb3JlIGluc3RhbmNlIG9mIHRoaXMgY29tcG9uZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVuZGVyOiBmdW5jdGlvbihodG1sLCB1cGxvYWRlcikge1xuICAgICAgICB0aGlzLiRlbCA9ICQoaHRtbClcbiAgICAgICAgICAgIC5hcHBlbmRUbyh1cGxvYWRlci4kZWwpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGRyYWcgYW5kIGRyb3AgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsLm9uKCdkcmFnZW50ZXInLCAkLnByb3h5KHRoaXMub25EcmFnRW50ZXIsIHRoaXMpKTtcbiAgICAgICAgdGhpcy4kZWwub24oJ2RyYWdvdmVyJywgJC5wcm94eSh0aGlzLm9uRHJhZ092ZXIsIHRoaXMpKTtcbiAgICAgICAgdGhpcy4kZWwub24oJ2Ryb3AnLCAkLnByb3h5KHRoaXMub25Ecm9wLCB0aGlzKSk7XG4gICAgICAgIHRoaXMuJGVsLm9uKCdkcmFnbGVhdmUnLCAkLnByb3h5KHRoaXMub25EcmFnTGVhdmUsIHRoaXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlcyBkcmFnZW50ZXIgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBlIC0gRXZlbnRcbiAgICAgKi9cbiAgICBvbkRyYWdFbnRlcjogZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMuX2VuYWJsZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGVzIGRyYWdvdmVyIGV2ZW50XG4gICAgICogQHBhcmFtIHtFdmVudH0gZSAtIEV2ZW50XG4gICAgICovXG4gICAgb25EcmFnT3ZlcjogZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEhhbmRsZXMgZHJhZ2xlYXZlIGV2ZW50XG4gICAgICogQHBhcmFtIHtFdmVudH0gZSAtIEV2ZW50XG4gICAgICovXG4gICAgb25EcmFnTGVhdmU6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLl9kaXNhYmxlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEhhbmRsZXMgZHJvcCBldmVudFxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGUgLSBFdmVudFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBGYWxzZVxuICAgICAqL1xuICAgIG9uRHJvcDogZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgZmlsZXMgPSB0dWkudXRpbC5waWNrKGUsICdvcmlnaW5hbEV2ZW50JywgJ2RhdGFUcmFuc2ZlcicsICdmaWxlcycpO1xuXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5fZGlzYWJsZSgpO1xuICAgICAgICB0aGlzLmZpcmUoJ2Ryb3AnLCBmaWxlcyk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRW5hYmxlIGRyb3B6b25lXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZW5hYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwuYWRkQ2xhc3ModGhpcy5fZW5hYmxlQ2xhc3MpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlIGRyb3BvbnplXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZGlzYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsLnJlbW92ZUNsYXNzKHRoaXMuX2VuYWJsZUNsYXNzKTtcbiAgICB9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKERyYWdBbmREcm9wKTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcmFnQW5kRHJvcDtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBGcm9tLXZpZXcgbWFrZXMgYSBmb3JtIGJ5IHRlbXBsYXRlLiBBZGQgZXZlbnRzIGZvciBmaWxlIHVwbG9hZC5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG52YXIgY29uc3RzID0gcmVxdWlyZSgnLi4vY29uc3RzJyksXG4gICAgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG52YXIgaXNTdXBwb3J0Rm9ybURhdGEgPSB1dGlscy5pc1N1cHBvcnRGb3JtRGF0YSgpLFxuICAgIEhJRERFTl9GSUxFX0lOUFVUX0NMQVNTID0gY29uc3RzLkNPTkYuSElEREVOX0ZJTEVfSU5QVVRfQ0xBU1M7XG5cbi8qKlxuICogVGhpcyB2aWV3IGNvbnRyb2wgaW5wdXQgZWxlbWVudCB0eXBlZCBmaWxlLlxuICogQHBhcmFtIHtVcGxvYWRlcn0gdXBsb2FkZXIgLSBVcGxvYWRlciBpbnN0YW5jZVxuICogQGNvbnN0cnVjdG9yIFZpZXcuRm9ybVxuICovXG52YXIgRm9ybSA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKkBsZW5kcyBWaWV3LkZvcm0ucHJvdG90eXBlICoqL3tcbiAgICBpbml0OiBmdW5jdGlvbih1cGxvYWRlcikge1xuICAgICAgICAvKipcbiAgICAgICAgICogRmlsZSB1cGxvYWRlclxuICAgICAgICAgKiBAdHlwZSB7VXBsb2FkZXJ9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl91cGxvYWRlciA9IHVwbG9hZGVyO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBIdG1sIHRlbXBsYXRlc1xuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsIHN0cmluZz59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9odG1sID0gdGhpcy5fc2V0VGVtcGxhdGUodXBsb2FkZXIudGVtcGxhdGUpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGb3JtIGVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge2pRdWVyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJGVsID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRmlsZSBpbnB1dCBlbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiRmaWxlSW5wdXQgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTdWJtaXQgZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kc3VibWl0ID0gbnVsbDtcblxuICAgICAgICBpZiAoaXNTdXBwb3J0Rm9ybURhdGEpIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogV2hldGhlciB0aGUgZmlsZSBpbnB1dCBpcyBtdWx0aXBsZVxuICAgICAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLl9pc011bHRpcGxlID0gdXBsb2FkZXIuaXNNdWx0aXBsZTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBXaGV0aGVyIHRoZSBmaWxlIGlucHV0IGFjY2VwdHMgZm9sZGVyXG4gICAgICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuX3VzZUZvbGRlciA9IHVwbG9hZGVyLnVzZUZvbGRlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3JlbmRlcih7XG4gICAgICAgICAgICBhY3Rpb246IHVwbG9hZGVyLnVybC5zZW5kLFxuICAgICAgICAgICAgbWV0aG9kOiAncG9zdCcsXG4gICAgICAgICAgICBlbmN0eXBlOiAnbXVsdGlwYXJ0L2Zvcm0tZGF0YScsXG4gICAgICAgICAgICB0YXJnZXQ6IGlzU3VwcG9ydEZvcm1EYXRhID8gJycgOiB1cGxvYWRlci5mb3JtVGFyZ2V0XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgZm9ybSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtvYmplY3R9IGF0dHJpYnV0ZXMgLSBGb3JtIGF0dHJpYnV0ZXNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW5kZXI6IGZ1bmN0aW9uKGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgdmFyIHVwbG9hZGVyID0gdGhpcy5fdXBsb2FkZXIsXG4gICAgICAgICAgICAkZmlsZUlucHV0ID0gdGhpcy5fY3JlYXRlRmlsZUlucHV0KCksXG4gICAgICAgICAgICAkZWwgPSAkKHRoaXMuX2h0bWwuZm9ybSlcbiAgICAgICAgICAgICAgICAuYXBwZW5kKCRmaWxlSW5wdXQpXG4gICAgICAgICAgICAgICAgLmF0dHIoYXR0cmlidXRlcyk7XG5cbiAgICAgICAgdGhpcy4kZmlsZUlucHV0ID0gJGZpbGVJbnB1dDtcbiAgICAgICAgdGhpcy4kZWwgPSAkZWw7XG5cbiAgICAgICAgaWYgKHVwbG9hZGVyLmlzQmF0Y2hUcmFuc2Zlcikge1xuICAgICAgICAgICAgdGhpcy5fc2V0U3VibWl0RWxlbWVudCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHVwbG9hZGVyLmlzQ3Jvc3NEb21haW4pIHtcbiAgICAgICAgICAgIHRoaXMuX3NldEhpZGRlbklucHV0Rm9yQ09SUygpO1xuICAgICAgICB9XG4gICAgICAgIHVwbG9hZGVyLiRlbC5hcHBlbmQodGhpcy4kZWwpO1xuXG4gICAgICAgIHRoaXMuX2FkZEV2ZW50KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBzdWJtaXQgZWxlbWVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldFN1Ym1pdEVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRzdWJtaXQgPSAkKHRoaXMuX2h0bWwuc3VibWl0KTtcbiAgICAgICAgdGhpcy4kc3VibWl0LmFwcGVuZFRvKHRoaXMuJGVsKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGhpZGRlbiBpbnB1dCBlbGVtZW50IGZvciBDT1JTLlxuICAgICAqICBIaWRkZW4gaW5wdXQgb2YgUG9zdE1lc3NhZ2Ugb3IgUmVkaXJlY3RVUkwuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0SGlkZGVuSW5wdXRGb3JDT1JTOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHByb3BzLCAkaGlkZGVuSW5wdXQsXG4gICAgICAgICAgICB1cGxvYWRlciA9IHRoaXMuX3VwbG9hZGVyLFxuICAgICAgICAgICAgcmVkaXJlY3RVUkwgPSB1cGxvYWRlci5yZWRpcmVjdFVSTDtcblxuICAgICAgICBpZiAodXBsb2FkZXIuaXNTdXBwb3J0UG9zdE1lc3NhZ2UpIHsgLy8gZm9yIElFOCwgOVxuICAgICAgICAgICAgcHJvcHMgPSB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ21lc3NhZ2VUYXJnZXQnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBsb2NhdGlvbi5wcm90b2NvbCArICcvLycgKyBsb2NhdGlvbi5ob3N0XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKHJlZGlyZWN0VVJMKSB7IC8vIGZvciBJRTdcbiAgICAgICAgICAgIHByb3BzID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdyZWRpcmVjdFVSTCcsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHJlZGlyZWN0VVJMXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb3BzKSB7XG4gICAgICAgICAgICAkaGlkZGVuSW5wdXQgPSAkKHV0aWxzLnRlbXBsYXRlKHByb3BzLCB0aGlzLl9odG1sLmhpZGRlbklucHV0KSk7XG4gICAgICAgICAgICAkaGlkZGVuSW5wdXQuYXBwZW5kVG8odGhpcy4kZWwpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBhbGwgb2YgaW5wdXQgZWxlbWVudHMgaHRtbCBzdHJpbmdzLlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFt0ZW1wbGF0ZV0gVGhlIHRlbXBsYXRlIGlzIHNldCBmb3JtIGN1c3RvbWVyLlxuICAgICAqIEByZXR1cm4ge09iamVjdC48c3RyaW5nLCBzdHJpbmc+fSBUaGUgaHRtbCB0ZW1wbGF0ZSBzdHJpbmcgc2V0IGZvciBmb3JtLlxuICAgICAqL1xuICAgIF9zZXRUZW1wbGF0ZTogZnVuY3Rpb24odGVtcGxhdGUpIHtcbiAgICAgICAgcmV0dXJuIHR1aS51dGlsLmV4dGVuZCh7fSwgY29uc3RzLkhUTUwsIHRlbXBsYXRlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZXMgYW5kIHJldHVybnMganF1ZXJ5IGVsZW1lbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEByZXR1cm4ge2pRdWVyeX0gVGhlIGpxdWVyeSBvYmplY3Qgd3JhcHBpbmcgb3JpZ2luYWwgaW5wdXQgZWxlbWVudFxuICAgICAqL1xuICAgIF9jcmVhdGVGaWxlSW5wdXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbWFwID0ge1xuICAgICAgICAgICAgbXVsdGlwbGU6IHRoaXMuX2lzTXVsdGlwbGUgPyAnbXVsdGlwbGUnIDogJycsXG4gICAgICAgICAgICBmaWxlRmllbGQ6IHRoaXMuX3VwbG9hZGVyLmZpbGVGaWVsZCxcbiAgICAgICAgICAgIGRpcmVjdG9yeTogdGhpcy5fdXNlRm9sZGVyID8gJ2RpcmVjdG9yeSBtb3pkaXJlY3Rvcnkgd2Via2l0ZGlyZWN0b3J5JyA6ICcnXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuICQodXRpbHMudGVtcGxhdGUobWFwLCB0aGlzLl9odG1sLmZpbGVJbnB1dCkpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl91cGxvYWRlci5pc0JhdGNoVHJhbnNmZXIpIHtcbiAgICAgICAgICAgIHRoaXMuJGVsLm9uKCdzdWJtaXQnLCAkLnByb3h5KHRoaXMuZmlyZSwgdGhpcywgJ3N1Ym1pdCcpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hZGRJbnB1dEV2ZW50KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBjaGFuZ2UgZXZlbnQgdG8gZmlsZSBpbnB1dFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZElucHV0RXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRmaWxlSW5wdXQub24oJ2NoYW5nZScsICQucHJveHkodGhpcy5vbkNoYW5nZSwgdGhpcykpO1xuICAgICAgICB0aGlzLiRmaWxlSW5wdXQuYXR0cigndGl0bGUnLCAnICcpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudC1IYW5kbGUgZm9yIGlucHV0IGVsZW1lbnQgY2hhbmdlXG4gICAgICovXG4gICAgb25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuJGZpbGVJbnB1dFswXS52YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZmlyZSgnY2hhbmdlJyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlc2V0IElucHV0IGVsZW1lbnQgdG8gc2F2ZSB3aG9sZSBpbnB1dD1maWxlIGVsZW1lbnQuXG4gICAgICovXG4gICAgcmVzZXRGaWxlSW5wdXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRmaWxlSW5wdXQucmVtb3ZlKCk7XG4gICAgICAgIHRoaXMuJGZpbGVJbnB1dCA9IHRoaXMuX2NyZWF0ZUZpbGVJbnB1dCgpO1xuICAgICAgICBpZiAodGhpcy4kc3VibWl0KSB7XG4gICAgICAgICAgICB0aGlzLiRzdWJtaXQuYmVmb3JlKHRoaXMuJGZpbGVJbnB1dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiRlbC5hcHBlbmQodGhpcy4kZmlsZUlucHV0KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hZGRJbnB1dEV2ZW50KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENsZWFyIGZpbGUgaW5wdXQgZWxlbWVudHNcbiAgICAgKi9cbiAgICBjbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsLmZpbmQoJy4nICsgSElEREVOX0ZJTEVfSU5QVVRfQ0xBU1MpLnJlbW92ZSgpO1xuICAgICAgICB0aGlzLnJlc2V0RmlsZUlucHV0KCk7XG4gICAgfVxufSk7XG5cbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihGb3JtKTtcbm1vZHVsZS5leHBvcnRzID0gRm9ybTtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBJdGVtVmlldyBtYWtlIGVsZW1lbnQgdG8gZGlzcGxheSBhZGRlZCBmaWxlIGluZm9ybWF0aW9uLiBJdCBoYXMgYXR0YWNoZWQgZmlsZSBJRCB0byByZXF1ZXN0IGZvciByZW1vdmUuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIGNvbnN0cyA9IHJlcXVpcmUoJy4uL2NvbnN0cycpLFxuICAgIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxudmFyIERFTEVURV9CVVRUT05fQ0xBU1MgPSBjb25zdHMuQ09ORi5SRU1PVkVfQlVUVE9OX0NMQVNTO1xuXG4vKipcbiAqIENsYXNzIG9mIGl0ZW0gdGhhdCBpcyBtZW1iZXIgb2YgZmlsZSBsaXN0LlxuICogQGNsYXNzIEl0ZW1cbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMubmFtZSBGaWxlIG5hbWVcbiAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy50eXBlIEZpbGUgdHlwZVxuICogIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLnJvb3QgTGlzdCBpbnN0YW5jZVxuICogIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5pZF0gVW5pcXVlIGtleSwgd2hhdCBpZiB0aGUga2V5IGlzIG5vdCBleGlzdCBpZCB3aWxsIGJlIHRoZSBmaWxlIG5hbWUuXG4gKiAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmRlbGV0ZUJ1dHRvbkNsYXNzTmFtZT0ndXBsb2FkZXJfYnRuX2RlbGV0ZSddIFRoZSBjbGFzcyBuYW1lIGlzIGZvciBkZWxldGUgYnV0dG9uLlxuICogIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy50ZW1wbGF0ZV0gaXRlbSB0ZW1wbGF0ZVxuICogIEBwYXJhbSB7KHN0cmluZ3xudW1iZXIpfSBbb3B0aW9ucy5zaXplXSBGaWxlIHNpemUgKGJ1dCBpZSBsb3cgYnJvd3NlciwgeC1kb21haW4pXG4gKi9cbnZhciBJdGVtID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBJdGVtLnByb3RvdHlwZSAqKi8ge1xuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIGpRdWVyeS1lbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiRlbCA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEl0ZW0gbmFtZVxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5uYW1lID0gb3B0aW9ucy5uYW1lO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJdGVtIGlkXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmlkID0gb3B0aW9ucy5pZCB8fCBvcHRpb25zLm5hbWU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEl0ZW0gc2l6ZVxuICAgICAgICAgKiBAdHlwZSB7bnVtYmVyfHN0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuc2l6ZSA9IG9wdGlvbnMuc2l6ZSB8fCAnJztcblxuICAgICAgICAvKipcbiAgICAgICAgICogSXRlbSB0eXBlXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnR5cGUgPSB0aGlzLl9leHRyYWN0RXh0ZW5zaW9uKCk7XG5cbiAgICAgICAgdGhpcy5yZW5kZXIob3B0aW9ucy5yb290LiRlbCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbmRlciBtYWtpbmcgZm9ybSBwYWRkaW5nIHdpdGggZGVsZXRhYmxlIGl0ZW1cbiAgICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIFRhcmdldCBMaXN0IGVsZW1lbnRcbiAgICAgKi9cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCR0YXJnZXQpIHtcbiAgICAgICAgdmFyIGh0bWwgPSB0aGlzLl9nZXRIdG1sKCk7XG5cbiAgICAgICAgdGhpcy4kZWwgPSAkKGh0bWwpXG4gICAgICAgICAgICAuYXBwZW5kVG8oJHRhcmdldCk7XG4gICAgICAgIHRoaXMuX2FkZEV2ZW50KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV4dHJhY3QgZmlsZSBleHRlbnNpb24gYnkgbmFtZVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IEZpbGUgZXh0ZW5zaW9uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZXh0cmFjdEV4dGVuc2lvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5hbWUuc3BsaXQoJy4nKS5wb3AoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGxpc3RJdGVtIGVsZW1lbnQgSFRNTFxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IEhUTUxcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRIdG1sOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1hcCA9IHtcbiAgICAgICAgICAgIGZpbGV0eXBlOiB0aGlzLnR5cGUsXG4gICAgICAgICAgICBmaWxlbmFtZTogdGhpcy5uYW1lLFxuICAgICAgICAgICAgZmlsZXNpemU6IHRoaXMuc2l6ZSA/IHV0aWxzLmdldEZpbGVTaXplV2l0aFVuaXQodGhpcy5zaXplKSA6ICcnXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHV0aWxzLnRlbXBsYXRlKG1hcCwgY29uc3RzLkhUTUwubGlzdEl0ZW0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnQgaGFuZGxlciBvbiBkZWxldGUgYnV0dG9uLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZEV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHF1ZXJ5ID0gJy4nICsgREVMRVRFX0JVVFRPTl9DTEFTUyxcbiAgICAgICAgICAgICRkZWxCdG4gPSB0aGlzLiRlbC5maW5kKHF1ZXJ5KTtcbiAgICAgICAgJGRlbEJ0bi5vbignY2xpY2snLCAkLnByb3h5KHRoaXMuX29uQ2xpY2tFdmVudCwgdGhpcykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZXZlbnQgaGFuZGxlciBmcm9tIGRlbGV0ZSBidXR0b24uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcXVlcnkgPSAnLicgKyBERUxFVEVfQlVUVE9OX0NMQVNTLFxuICAgICAgICAgICAgJGRlbEJ0biA9IHRoaXMuJGVsLmZpbmQocXVlcnkpO1xuICAgICAgICAkZGVsQnRuLm9mZignY2xpY2snLCB0aGlzLl9vbkNsaWNrRXZlbnQpO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIEV2ZW50LWhhbmRsZSBmb3IgZGVsZXRlIGJ1dHRvbiBjbGlja2VkLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uQ2xpY2tFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZmlyZSgncmVtb3ZlJywge1xuICAgICAgICAgICAgbmFtZSA6IHRoaXMubmFtZSxcbiAgICAgICAgICAgIGlkIDogdGhpcy5pZCxcbiAgICAgICAgICAgIHR5cGU6ICdyZW1vdmUnXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEZXN0cm95IGl0ZW1cbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fcmVtb3ZlRXZlbnQoKTtcbiAgICAgICAgdGhpcy4kZWwucmVtb3ZlKCk7XG4gICAgfVxufSk7XG5cbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihJdGVtKTtcbm1vZHVsZS5leHBvcnRzID0gSXRlbTtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBGaWxlTGlzdFZpZXcgbGlzdGluZyBmaWxlcyBhbmQgZGlzcGxheSBzdGF0ZXMobGlrZSBzaXplLCBjb3VudCkuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcbnZhciBJdGVtID0gcmVxdWlyZSgnLi9pdGVtJyk7XG5cbi8qKlxuICogTGlzdCBoYXMgaXRlbXMuIEl0IGNhbiBhZGQgYW5kIHJlbW92ZSBpdGVtLCBhbmQgZ2V0IHRvdGFsIHVzYWdlLlxuICogQHBhcmFtIHtVcGxvYWRlcn0gdXBsb2FkZXIgLSBVcGxvYWRlclxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywgalF1ZXJ5Pn0gbGlzdEluZm9cbiAqICBAcGFyYW0ge2pRdWVyeX0gbGlzdEluZm8ubGlzdCAtIExpc3QganF1ZXJ5LWVsZW1lbnRcbiAqICBAcGFyYW0ge2pRdWVyeX0gbGlzdEluZm8uY291bnQgLSBDb3VudCBqcXVlcnktZWxlbWVudFxuICogIEBwYXJhbSB7alF1ZXJ5fSBsaXN0SW5mby5zaXplIC0gU2l6ZSBqcXVlcnktZWxlbWVudFxuICogQGNsYXNzIExpc3RcbiAqL1xudmFyIExpc3QgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIExpc3QucHJvdG90eXBlICove1xuICAgIGluaXQgOiBmdW5jdGlvbihsaXN0SW5mbykge1xuICAgICAgICAvKipcbiAgICAgICAgICogSXRlbXNcbiAgICAgICAgICogQHR5cGUge0FycmF5LjxJdGVtPn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogalF1ZXJ5LWVsZW1lbnQgb2YgTGlzdFxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kZWwgPSBsaXN0SW5mby5saXN0O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBqUXVlcnktZWxlbWVudCBvZiBjb3VudFxuICAgICAgICAgKiBAdHlwZSB7alF1ZXJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy4kY291bnRlciA9IGxpc3RJbmZvLmNvdW50O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBqUXVlcnktZWxlbWVudCBvZiB0b3RhbCBzaXplXG4gICAgICAgICAqIEB0eXBlIHtqUXVlcnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLiRzaXplID0gbGlzdEluZm8uc2l6ZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW0gbGlzdFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIC0gRmlsZSBpbmZvcm1hdGlvbihzKSB3aXRoIHR5cGVcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2RhdGEudHlwZV0gLSAncmVtb3ZlJyBvciBub3QuXG4gICAgICovXG4gICAgdXBkYXRlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGlmIChkYXRhLnR5cGUgPT09ICdyZW1vdmUnKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVGaWxlSXRlbShkYXRhLmlkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2FkZEZpbGVJdGVtcyhkYXRhKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgaXRlbXMgdG90YWwgY291bnQsIHRvdGFsIHNpemUgaW5mb3JtYXRpb24uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtpbmZvXSBBIGluZm9ybWF0aW9uIHRvIHVwZGF0ZSBsaXN0LlxuICAgICAqICBAcGFyYW0ge2FycmF5fSBpbmZvLml0ZW1zIFRoZSBsaXN0IG9mIGZpbGUgaW5mb3JtYXRpb24uXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBpbmZvLnNpemUgVGhlIHRvdGFsIHNpemUuXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBpbmZvLmNvdW50IFRoZSBjb3VudCBvZiBmaWxlcy5cbiAgICAgKi9cbiAgICB1cGRhdGVUb3RhbEluZm86IGZ1bmN0aW9uKGluZm8pIHtcbiAgICAgICAgaWYgKGluZm8pIHtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVRvdGFsQ291bnQoaW5mby5jb3VudCk7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVUb3RhbFVzYWdlKGluZm8uc2l6ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVUb3RhbENvdW50KCk7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVUb3RhbFVzYWdlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW1zIHRvdGFsIGNvdW50IGFuZCByZWZyZXNoIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0geyhudW1iZXJ8c3RyaW5nKX0gW2NvdW50XSBUb3RhbCBmaWxlIGNvdW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfdXBkYXRlVG90YWxDb3VudDogZnVuY3Rpb24oY291bnQpIHtcbiAgICAgICAgaWYgKCF0dWkudXRpbC5pc0V4aXN0eShjb3VudCkpIHtcbiAgICAgICAgICAgIGNvdW50ID0gdGhpcy5pdGVtcy5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiRjb3VudGVyLmh0bWwoY291bnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgaXRlbXMgdG90YWwgc2l6ZSBhbmQgcmVmcmVzaCBlbGVtZW50XG4gICAgICogQHBhcmFtIHsobnVtYmVyfHN0cmluZyl9IFtzaXplXSBUb3RhbCBmaWxlcyBzaXplc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwZGF0ZVRvdGFsVXNhZ2U6IGZ1bmN0aW9uKHNpemUpIHtcbiAgICAgICAgaWYgKCF0dWkudXRpbC5pc0V4aXN0eShzaXplKSkge1xuICAgICAgICAgICAgc2l6ZSA9IHRoaXMuX2dldFN1bUFsbEl0ZW1Vc2FnZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0dWkudXRpbC5pc051bWJlcihzaXplKSAmJiAhaXNOYU4oc2l6ZSkpIHtcbiAgICAgICAgICAgIHNpemUgPSB1dGlscy5nZXRGaWxlU2l6ZVdpdGhVbml0KHNpemUpO1xuICAgICAgICAgICAgdGhpcy4kc2l6ZS5odG1sKHNpemUpO1xuICAgICAgICAgICAgdGhpcy4kc2l6ZS5zaG93KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiRzaXplLmhpZGUoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdW0gc2l6ZXMgb2YgYWxsIGl0ZW1zLlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IHRvdGFsU2l6ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldFN1bUFsbEl0ZW1Vc2FnZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpdGVtcyA9IHRoaXMuaXRlbXMsXG4gICAgICAgICAgICB0b3RhbFVzYWdlID0gMDtcblxuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKGl0ZW1zLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICB0b3RhbFVzYWdlICs9IHBhcnNlRmxvYXQoaXRlbS5zaXplKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRvdGFsVXNhZ2U7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBmaWxlIGl0ZW1zXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHRhcmdldCBUYXJnZXQgaXRlbSBpbmZvcm1hdGlvbi5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRGaWxlSXRlbXM6IGZ1bmN0aW9uKHRhcmdldCkge1xuICAgICAgICBpZiAoIXR1aS51dGlsLmlzQXJyYXlTYWZlKHRhcmdldCkpIHtcbiAgICAgICAgICAgIHRhcmdldCA9IFt0YXJnZXRdO1xuICAgICAgICB9XG4gICAgICAgIHR1aS51dGlsLmZvckVhY2godGFyZ2V0LCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2godGhpcy5fY3JlYXRlSXRlbShkYXRhKSk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZmlsZSBpdGVtXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gVGhlIGl0ZW0gaWQgdG8gcmVtb3ZlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlRmlsZUl0ZW06IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHR1aS51dGlsLmZvckVhY2godGhpcy5pdGVtcywgZnVuY3Rpb24oaXRlbSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmIChpZCA9PT0gaXRlbS5pZCkge1xuICAgICAgICAgICAgICAgIGl0ZW0uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgaXRlbSBCeSBEYXRhXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgLSBEYXRhIGZvciBsaXN0IGl0ZW1zXG4gICAgICogQHJldHVybnMge0l0ZW19IEl0ZW1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jcmVhdGVJdGVtOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBpdGVtID0gbmV3IEl0ZW0oe1xuICAgICAgICAgICAgcm9vdDogdGhpcyxcbiAgICAgICAgICAgIG5hbWU6IGRhdGEubmFtZSxcbiAgICAgICAgICAgIHNpemU6IGRhdGEuc2l6ZSxcbiAgICAgICAgICAgIGlkOiBkYXRhLmlkXG4gICAgICAgIH0pO1xuICAgICAgICBpdGVtLm9uKCdyZW1vdmUnLCB0aGlzLl9yZW1vdmVGaWxlLCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIFJlbW92ZSBGaWxlXG4gICAgICogQHBhcmFtIHtJdGVtfSBpdGVtIC0gSXRlbVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbW92ZUZpbGU6IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgdGhpcy5maXJlKCdyZW1vdmUnLCBpdGVtKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgbGlzdFxuICAgICAqL1xuICAgIGNsZWFyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaCh0aGlzLml0ZW1zLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICBpdGVtLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuaXRlbXMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy51cGRhdGVUb3RhbEluZm8oKTtcbiAgICB9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKExpc3QpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IExpc3Q7XG4iXX0=
