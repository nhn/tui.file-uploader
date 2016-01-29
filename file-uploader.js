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
    SIZE_UNIT: 'SIZE_UNIT',
    ERROR: {
        DEFAULT: 'Unknown error.'
    },
    DRAG_DEFAULT_ENABLE_CLASS: 'enableClass',
    FILE_FILED_NAME: 'userfile[]',
    FOLDER_INFO: 'folderName',
    HIDDEN_FILE_INPUT_CLASS: 'uploader-hidden-file-input',
    X_DOMAIN_GLOBAL_CALLBACK_NAME: '__uploaderXDomainCallback'
};

/**
 * Default Htmls
 * @type {{input: string, item: string}}
 */
module.exports.HTML = {
    form: ['<form enctype="multipart/form-data" id="formData" method="post">',
        '<input type="hidden" name="MAX_FILE_SIZE" value="3000000" />',
        '</form>'].join(''),
    input: ['<input type="file" id="fileAttach" {{webkitdirectory}} name="{{fileField}}" {{multiple}} />'].join(''),
    submit: ['<button class="batchSubmit" type="submit">SEND</button>'].join(''),
    item: ['<li class="filetypeDisplayClass">',
        '<spna class="fileicon {{filetype}}">{{filetype}}</spna>',
        '<span class="file_name">{{filename}}</span>',
        '<span class="file_size">{{filesize}}</span>',
        '<button type="button" class="{{deleteButtonClassName}}">Delete</button>',
        '</li>'].join(''),
    drag: ['<div class="dragzone"></div>'].join('')
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
 * @class View.Pool
 */
var Pool = tui.util.defineClass(/** @lends View.Pool.prototype */{
    /**
     * initialize
     */
    init: function(planet) {
        /**
         * Submitter for file element to server
         * @type {HTMLElement}
         */
        this.planet = planet;
        /**
         * File data structure object(key=name : value=iuput[type=file]-Element);
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

var Modern = tui.util.defineClass({
    init: function(uploader) {
        this.uploader = uploader;
        this.inputView = uploader.inputView;
        this.pool = [];
        if (uploader.isBatchTransfer) {
            this.remove = this._removeWhenBatch;
        }
    },

    TYPE: 'modern',

    store: function() {
        var pool = this.pool,
            files = tui.util.toArray(this.inputView.$fileInput[0].files),
            stamp = tui.util.stamp,
            data = [];

        tui.util.forEach(files, function(file) {
            var id = stamp(file);
            pool.push(file);
            data.push({
                id: id,
                name: file.name,
                size: file.size
            });
        });

        this.inputView.resetFileInput();
        this.fire('stored', data);
    },

    upload: function() {
        var form = this.inputView.$el.clone(),
            field = this.uploader.fileField,
            formData;

        form.find('input[type="file"]').remove();
        formData = new FormData(form);
        tui.util.forEach(this.pool, function(file) {
            formData.append(field, file);
        });

        $.ajax({
            url: this.uploader.url.send,
            type: 'POST',
            data: formData,
            success: tui.util.bind(this._uploadSuccess, this),
            error: tui.util.bind(this._uploadError, this),
            processData: false,
            contentType: false
        });
        this.pool.length = 0;
    },

    clear: function() {
        this.pool.length = 0;
    },

    _removeWhenBatch: function(params) {
        var pool = this.pool,
            hasStamp = tui.util.hasStamp,
            stamp = tui.util.stamp,
            result = false;

        tui.util.forEach(pool, function(file, index) {
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

    remove: function(params) {
        $.ajax({
            url: uploader.url.remove,
            dataType: 'jsonp',
            data: params,
            success: tui.util.bind(function(data) {
                data.type = 'remove';
                this.fire('removed', data);
            }, this)
        });
    },

    _uploadError: function(jqXHR, status, msgThrown) {
        this.fire('error', {
            status: status,
            message: msgThrown
        });
    },

    _uploadSuccess: function(data) {
        this.fire('uploaded', JSON.parse(data));
    }
});

tui.util.CustomEvents.mixin(Modern);
module.exports = Modern;

},{}],5:[function(require,module,exports){
'use strict';

var Pool = require('../pool'),
    X_DOMAIN_GLOBAL_CALLBACK_NAME = require('../consts').CONF.X_DOMAIN_GLOBAL_CALLBACK_NAME;

var Old = tui.util.defineClass({
    init: function(uploader) {
        var $hiddenFrame = uploader.$target;

        this.pool = new Pool(uploader.inputView.$el[0]);
        this.uploader = uploader;
        this.inputView = uploader.inputView;
        $hiddenFrame.on('load', tui.util.bind(this._onUpload, this, $hiddenFrame));

        if (uploader.isBatchTransfer) {
            this.upload = this._uploadWhenBatch;
            this.remove = this._removeWhenBatch;
        }

        if (uploader.isCrossDomain) {
            window[X_DOMAIN_GLOBAL_CALLBACK_NAME] = tui.util.bind(function(data) {
                this.fire('uploaded', data);
            }, this);

            this.inputView.$el.append(
                '<input type="hidden" name="callbackName" value="' + X_DOMAIN_GLOBAL_CALLBACK_NAME + '">'
            );
        }
    },

    TYPE: 'old',

    store: function() {
        var el = this.inputView.$fileInput[0],
            id = tui.util.stamp(el);

        this.pool.store(el);
        this.inputView.resetFileInput();

        this.fire('stored', [{
            id: id,
            name: el.value,
            size: ''
        }]);
    },

    upload: function() {
        this.pool.plant();
        this.inputView.$el.submit();
        this.inputView.clear();
        this.clear();
    },

    _uploadWhenBatch: function() {
        this.pool.plant();
    },

    remove: function(params) {
        var uploader = this.uploader;
        $.ajax({
            url: uploader.url.remove,
            dataType: 'jsonp',
            data: params,
            success: tui.util.bind(function(data) {
                data.type = 'remove';
                this.fire('removed', data);
            }, this)
        });
    },

    clear: function() {
        this.pool.empty();
    },

    _removeWhenBatch: function(params) {
        var result = this.pool.remove(params);

        this.fire('removed', tui.util.extend({
            message: result ? 'success' : 'fail'
        }, params));
    },

    _onUpload: function($hiddenFrame) {
        var data;

        this.uploader.clear();
        try {
            data = $hiddenFrame[0].contentWindow.document.body.innerHTML;
            if (data) {
                this.fire('uploaded', $.parseJSON(data));
            }
        } catch (e) {
            this.fire('error', {
                status: e.name,
                message: e.message
            });
        }
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
var Input = require('./view/input');
var List = require('./view/list');
var DragAndDrop = require('./view/drag');
var OldRequester = require('./requester/old');
var ModernRequester = require('./requester/modern');

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
    /**
     * initialize
     */
    init: function(options, $el) {
        this._setData(options);
        this.$el = $el;
        this.fileField = this.fileField || consts.CONF.FILE_FILED_NAME;
        if (this.useDrag && !this.useFolder && utils.isSupportFileSystem()) {
            this.dragView = new DragAndDrop(options, this);
        }
        this.inputView = new Input(this, options);
        this.listView = new List(options, this);
        this._setConnector();
        this._addEvent();
        this.isCrossDomain = utils.isCrossDomain(this.url.send);
    },

    /**
     * Set Connector
     * @private
     */
    _setConnector: function() {
        if (utils.isSupportFormData()) {
            this._requester = new ModernRequester(this);
        } else {
            this.$target = this._createTargetFrame();
            this.$el.append(this.$target);
            this._requester = new OldRequester(this);
        }
    },

    /**
     * Makes element to be target of submit form element.
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
     * @param {object} info The data for update list
     *  @param {string} info.action The action name to execute method
     */
    updateList: function(info) {
        this.listView.update(info);
        this.listView.updateTotalInfo(info);
    },

    /**
     * Set field data by option values.
     * @param options
     * @private
     */
    _setData: function(options) {
        tui.util.extend(this, options);
    },

    /**
     * Extract protocol + domain from url to find out whether cross-domain or not.
     * @returns {boolean}
     */
    isCrossDomain: function() {
        var pageDomain = document.domain;
        return this.url.send.indexOf(pageDomain) === -1;
    },

    /**
     * Callback for error
     * @param {object} response Error response
     */
    errorCallback: function(response) {
        var message;
        if (response && response.msg) {
            message = response.msg;
        } else {
            message = consts.CONF.ERROR.DEFAULT;
        }
        alert(message);
    },

    /**
     * Callback for custom send event
     */
    sendFile: function() {
        this._requester.store();
        this._requester.upload();
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
     * @api
     */
    submit: function() {
        this._requester.upload();
    },

    /**
     * Get file info locally
     * @param {HtmlElement} element Input element
     * @private
     */
    _getFileInfo: function(element) {
        var files;
        if (utils.isSupportFileSystem()) {
            files = this._getFileList(element.files);
        } else {
            files = {
                name: element.value,
                id: element.value
            };
        }
        return files;
    },

    /**
     * Get file list from FileList object
     * @param {FileList} files A FileList object
     * @returns {Array}
     * @private
     */
    _getFileList: function(files) {
        return tui.util.map(files, function(file) {
            return {
                name: file.name,
                size: file.size,
                id: file.name
            };
        });
    },

    /**
     * Add event to listview and inputview
     * @private
     */
    _addEvent: function() {
        this._requester.on('removed', function(data) {
            this.listView.update(data);
            this.fire('remove', data);
        }, this);

        this._requester.on('error', function(data) {
            this.fire('error', data);
        }, this);

        if (this.useDrag && this.dragView) {
            // @todo top 처리가 따로 필요함, sendFile 사용 안됨
            this.dragView.on('drop', this._store, this);
        }

        if (this.isBatchTransfer) {
            this.inputView.on('change', this._store, this);
            this.listView.on('remove', this.removeFile, this);
            this._requester.on({
                uploaded: function(data) {
                    this.clear();
                    this.fire('success', data);
                },
                stored: function(data) {
                    this.updateList(data);
                    this.fire('update', data);
                }
            }, this);
        } else {
            this.inputView.on('change', this.sendFile, this);
            this.listView.on('remove', this.removeFile, this);
            this._requester.on({
                uploaded: function(data) {
                    this.updateList(data.filelist);
                    this.fire('success', data);
                }
            }, this);
        }
    },

    clear: function() {
        this._requester.clear();
        this.inputView.clear();
        this.listView.clear();
    },

    /**
     * Store input element to pool.
     //* @param {HTMLElement} input A input element[type=file] for store pool
     */
    _store: function() {
        this._requester.store();
    }
});

tui.util.CustomEvents.mixin(Uploader);
module.exports = Uploader;

},{"./consts":2,"./requester/modern":4,"./requester/old":5,"./utils":7,"./view/drag":8,"./view/input":9,"./view/list":11}],7:[function(require,module,exports){
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


function parseURL(url) {
    var a = document.createElement('a');
    a.href = url;
    return {
        href:     a.href,
        host:     a.host || location.host,
        port:     ('0' === a.port || '' === a.port) ? port(a.protocol) : a.port,
        hash:     a.hash,
        hostname: a.hostname || location.hostname,
        pathname: a.pathname.charAt(0) != '/' ? '/' + a.pathname : a.pathname,
        protocol: !a.protocol || ':' == a.protocol ? location.protocol : a.protocol,
        search:   a.search,
        query:    a.search.slice(1)
    };
}


/**
 * Extract unit for file size
 * @param {number} bytes A usage of file
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
 * Whether the browser support FormData or not
 * @memberof utils
 */
function isSupportFormData() {
    return IS_SUPPORT_FORM_DATA;
}

/**
 * Get item elements HTML
 * @param {string} html HTML template
 * @returns {string}
 * @memberof utils
 */
function template(map, html) {
    html = html.replace(/\{\{([^\}]+)\}\}/g, function (mstr, name) {
        return map[name];
    });
    return html;
}

/**
 * Check whether support file api or not
 * @returns {boolean}
 * @memberof utils
 */
function isSupportFileSystem() {
    return IS_SUPPORT_FILE_SYSTEM;
}

function isCrossDomain(url) {
    var location = parseURL(window.location.href);
    url = parseURL(url);
    return url.hostname !== location.hostname
        || url.port !== location.port
        || url.protocol !== location.protocol;
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
var utils = require('../utils');

/**
 * Makes drag and drop area, the dropped file is added via event drop event.
 * @class View.DragAndDrop
 */
var DragAndDrop = tui.util.defineClass(/** @lends View.DragAndDrop.prototype */{
    /**
     * initialize DragAndDrop
     */
    init: function(options, uploader) {
        var html = options.template && options.template.drag || consts.HTML.drag;
        this._enableClass = options.drag && options.drag.enableClass || consts.CONF.DRAG_DEFAULT_ENABLE_CLASS;
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
        this.$el = $(html);
        uploader.$el.append(this.$el);
    },

    /**
     * Adds drag and drop event
     * @private
     */
    _addEvent: function() {
        this.$el.on('dragenter', tui.util.bind(this.onDragEnter, this));
        this.$el.on('dragover', tui.util.bind(this.onDragOver, this));
        this.$el.on('drop', tui.util.bind(this.onDrop, this));
        this.$el.on('dragleave', tui.util.bind(this.onDragLeave, this));
    },

    /**
     * Handles dragenter event
     */
    onDragEnter: function(e) {
        e.preventDefault();
        e.stopPropagation();
        this._enable();
    },

    /**
     * Handles dragover event
     */
    onDragOver: function(e) {
        e.preventDefault();
        e.stopPropagation();
    },

    /**
     * Handles dragleave event
     */
    onDragLeave: function(e) {
        e.preventDefault();
        e.stopPropagation();
        this._disable();
    },

    /**
     * Handles drop event
     */
    onDrop: function(e) {
        e.preventDefault();
        this._disable();
        this.fire('drop', {
            files: e.originalEvent.dataTransfer.files
        });
        return false;
    },

    _enable: function() {
        this.$el.addClass(this._enableClass);
    },

    _disable: function() {
        this.$el.removeClass(this._enableClass);
    }
});

tui.util.CustomEvents.mixin(DragAndDrop);

module.exports = DragAndDrop;

},{"../consts":2,"../utils":7}],9:[function(require,module,exports){
/**
 * @fileoverview InputView make input form by template. Add event file upload event.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';
var consts = require('../consts'),
    HIDDEN_FILE_INPUT_CLASS = consts.CONF.HIDDEN_FILE_INPUT_CLASS,
    utils = require('../utils');

var isSupportFormData = utils.isSupportFormData();

/**
 * This view control input element typed file.
 * @constructor View.InputView
 */
var Input = tui.util.defineClass(/**@lends View.Input.prototype **/{
    /**
     * Initialize input element.
     * @param {Uploader} uploader - Uploader instance
     * @param {object} [options] - Options
     */
    init: function(uploader, options) {
        this._uploader = uploader;
        this._target = options.formTarget;
        this._url = options.url;
        this._isBatchTransfer = options.isBatchTransfer;
        this._html = this._setHTML(options.template);

        if (isSupportFormData) {
            this._isMultiple = options.isMultiple;
            this._useFolder = options.useFolder;
        }
        this._render();
    },

    /**
     * Render input area
     */
    _render: function() {
        this.$el = $(this._html.form);
        this.$el.attr({
            action: this._url.send,
            method: 'post',
            enctype: 'multipart/form-data',
            target: isSupportFormData ? '' : this._target
        });

        this.$fileInput = this._createFileInput();
        this.$fileInput.appendTo(this.$el);
        if (this._isBatchTransfer) {
            this.$submit = this._createSubmitElement();
            this.$submit.appendTo(this.$el);
        }
        this._uploader.$el.append(this.$el);
        this._addEvent();
    },

    /**
     * Set all of input elements html strings.
     * @param {object} [template] The template is set form customer.
     * @return {object} The html string set for inputView
     */
    _setHTML: function(template) {
        if (!template) {
            template = {};
        }

        return {
            input: template.input || consts.HTML.input,
            submit: template.submit || consts.HTML.submit,
            form: template.form || consts.HTML.form
        }
    },

    /**
     * Makes and returns jquery element
     * @return {jQuery} The jquery object wrapping original input element
     */
    _createFileInput: function() {
        var map = {
            multiple: this._isMultiple ? 'multiple' : '',
            fileField: this._uploader.fileField,
            webkitdirectory: this._useFolder ? 'webkitdirectory' : ''
        };

        return $(utils.template(map, this._html.input));
    },

    /**
     * Makes and returns jquery element
     * @return {jQuery} The jquery object wrapping sumbit button element
     */
    _createSubmitElement: function() {
        return $(this._html.submit);
    },

    /**
     * Add event
     * @private
     */
    _addEvent: function() {
        var onSubmitHandler;
        if (this._isBatchTransfer) {
            if (isSupportFormData) {
                onSubmitHandler = tui.util.bind(function(event) {
                    event.preventDefault();
                    this._uploader.submit();
                }, this);
            } else {
                onSubmitHandler = tui.util.bind(function() {
                    this._uploader.submit();
                }, this);
            }

            this.$el.on('submit', onSubmitHandler);
        }
        this._addInputEvent();
    },

    /**
     * Add input element change event by sending type
     * @private
     */
    _addInputEvent: function() {
        this.$fileInput.on('change', tui.util.bind(this.onChange, this));
    },

    /**
     * Event-Handle for input element change
     */
    onChange: function() {
        if (!this.$fileInput[0].value) {
            return;
        }
        this.fire('change', {
            target: this
        });
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

    clear: function() {
        this.$el.find('.' + HIDDEN_FILE_INPUT_CLASS).remove();
        this.resetFileInput();
    }
});

tui.util.CustomEvents.mixin(Input);

module.exports = Input;

},{"../consts":2,"../utils":7}],10:[function(require,module,exports){
/**
 * @fileoverview ItemView make element to display added file information. It has attached file ID to request for remove.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';
var consts = require('../consts');
var utils = require('../utils');

/**
 * Class of item that is member of file list.
 * @class View.Item
 */
var Item = tui.util.defineClass(/** @lends View.Item.prototype **/ {
    /**
     * Initialize item
     * @param {object} options
     *  @param {string} options.name File name
     *  @param {string} options.type File type
     *  @param {object} options.root List object
     *  @param {string} [options.id] Unique key, what if the key is not exist id will be the file name.
     *  @param {string} [options.deleteButtonClassName='uploader_btn_delete'] The class name is for delete button.
     *  @param {string} [options.template] item template
     *  @param {(string|number)} [options.size] File size (but ie low browser, x-domain)
     */
    init: function(options) {
        this._setRoot(options);
        this._setItemInfo(options);

        this.render(options.template || consts.HTML.item);
    },

    /**
     * Set root(List object) information.
     * @param {object} options Same with init options parameter.
     * @private
     */
    _setRoot: function(options) {
        this._root = options.root;
        this._$root = options.root.$el;
    },

    /**
     * Set file information.
     * @param {object} options Same with init options parameter.
     * @private
     */
    _setItemInfo: function(options) {
        this.name = options.name;
        this.id = options.id || options.name;
        this._type = options.type || this._extractExtension();
        this.size = options.size || '';
        this._btnClass = 'uploader_btn_delete';
        this._unit = options.unit || 'KB';
    },

    /**
     * Render making form padding with deletable item
     * @param template
     */
    render: function(template) {
        var html = this._getHtml(template);
        this._$el = $(html);
        this._$root.append(this._$el);
        this._addEvent();
    },

    /**
     * Extract file extension by name
     * @returns {string}
     * @private
     */
    _extractExtension: function() {
        return this.name.split('.').pop();
    },

    /**
     * Get item elemen HTML
     * @param {string} html HTML template
     * @returns {string}
     * @private
     */
    _getHtml: function(html) {
        var map = {
            filetype: this._type,
            filename: this.name,
            filesize: this.size ? utils.getFileSizeWithUnit(this.size) : '',
            deleteButtonClassName: this._btnClass
        };

        return utils.template(map, html);
    },

    /**
     * Destroy item
     */
    destroy: function() {
        this._removeEvent();
        this._$el.remove();
    },

    /**
     * Add event handler on delete button.
     * @private
     */
    _addEvent: function() {
        var query = '.' + this._btnClass,
            $delBtn = this._$el.find(query);
        $delBtn.on('click', tui.util.bind(this._onClickEvent, this));
    },

    /**
     * Remove event handler from delete button.
     * @private
     */
    _removeEvent: function() {
        var query = '.' + this._btnClass,
            $delBtn = this._$el.find(query);
        $delBtn.off('click');
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
    }
});

tui.util.CustomEvents.mixin(Item);

module.exports = Item;

},{"../consts":2,"../utils":7}],11:[function(require,module,exports){
/**
 * @fileoverview FileListView manage and display files state(like size, count) and list.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';
var utils = require('../utils');
var Item = require('./item');

/**
 * List has items. It can add and remove item, and get total usage.
 * @class View.List
 */
var List = tui.util.defineClass(/** @lends View.List.prototype */{
    init : function(options, uploader) {
        var listInfo = options.listInfo;
        this.items = [];
        this.$el = listInfo.list;
        this.$counter = listInfo.count;
        this.$size = listInfo.size;
        this._uploader = uploader;

        tui.util.extend(this, options);
    },

    /**
     * Update item list
     * @param {object} data - File information(s) with type
     * @param {object} [data.type] - 'remove' or not.
     */
    update: function(data) {
        if (data.type === 'remove') {
            this._removeFileItem(data);
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
     * @returns {*}
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
        if (!tui.util.isArray(target)) {
            target = [target];
        }
        tui.util.forEach(target, function(data) {
            this.items.push(this._createItem(data));
        }, this);
    },

    /**
     * Remove file item
     * @param {string} name The file name to remove
     * @private
     */
    _removeFileItem: function(data) {
        var id = data.id;

        tui.util.forEach(this.items, function(item, index) {
            if (id === item.id) {
                item.destroy();
                this.items.splice(index, 1);
                return false;
            }
        }, this);
        this.updateTotalInfo();
    },

    /**
     * Create item By Data
     * @param {object} data
     * @returns {Item}
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
     * @param data
     * @private
     */
    _removeFile: function(data) {
        this.fire('remove', data);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25zdHMuanMiLCJzcmMvanMvcG9vbC5qcyIsInNyYy9qcy9yZXF1ZXN0ZXIvbW9kZXJuLmpzIiwic3JjL2pzL3JlcXVlc3Rlci9vbGQuanMiLCJzcmMvanMvdXBsb2FkZXIuanMiLCJzcmMvanMvdXRpbHMuanMiLCJzcmMvanMvdmlldy9kcmFnLmpzIiwic3JjL2pzL3ZpZXcvaW5wdXQuanMiLCJzcmMvanMvdmlldy9pdGVtLmpzIiwic3JjL2pzL3ZpZXcvbGlzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ0dWkudXRpbC5kZWZpbmVOYW1lc3BhY2UoJ3R1aS5jb21wb25lbnQuVXBsb2FkZXInLCByZXF1aXJlKCcuL3NyYy9qcy91cGxvYWRlci5qcycpKTtcblxuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbmZpZ3VyYXRpb24gb3IgZGVmYXVsdCB2YWx1ZXMuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuLyoqXG4gKiBVcGxvYWRlciBjb25maWdcbiAqL1xubW9kdWxlLmV4cG9ydHMuQ09ORiA9IHtcbiAgICBTSVpFX1VOSVQ6ICdTSVpFX1VOSVQnLFxuICAgIEVSUk9SOiB7XG4gICAgICAgIERFRkFVTFQ6ICdVbmtub3duIGVycm9yLidcbiAgICB9LFxuICAgIERSQUdfREVGQVVMVF9FTkFCTEVfQ0xBU1M6ICdlbmFibGVDbGFzcycsXG4gICAgRklMRV9GSUxFRF9OQU1FOiAndXNlcmZpbGVbXScsXG4gICAgRk9MREVSX0lORk86ICdmb2xkZXJOYW1lJyxcbiAgICBISURERU5fRklMRV9JTlBVVF9DTEFTUzogJ3VwbG9hZGVyLWhpZGRlbi1maWxlLWlucHV0JyxcbiAgICBYX0RPTUFJTl9HTE9CQUxfQ0FMTEJBQ0tfTkFNRTogJ19fdXBsb2FkZXJYRG9tYWluQ2FsbGJhY2snXG59O1xuXG4vKipcbiAqIERlZmF1bHQgSHRtbHNcbiAqIEB0eXBlIHt7aW5wdXQ6IHN0cmluZywgaXRlbTogc3RyaW5nfX1cbiAqL1xubW9kdWxlLmV4cG9ydHMuSFRNTCA9IHtcbiAgICBmb3JtOiBbJzxmb3JtIGVuY3R5cGU9XCJtdWx0aXBhcnQvZm9ybS1kYXRhXCIgaWQ9XCJmb3JtRGF0YVwiIG1ldGhvZD1cInBvc3RcIj4nLFxuICAgICAgICAnPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwiTUFYX0ZJTEVfU0laRVwiIHZhbHVlPVwiMzAwMDAwMFwiIC8+JyxcbiAgICAgICAgJzwvZm9ybT4nXS5qb2luKCcnKSxcbiAgICBpbnB1dDogWyc8aW5wdXQgdHlwZT1cImZpbGVcIiBpZD1cImZpbGVBdHRhY2hcIiB7e3dlYmtpdGRpcmVjdG9yeX19IG5hbWU9XCJ7e2ZpbGVGaWVsZH19XCIge3ttdWx0aXBsZX19IC8+J10uam9pbignJyksXG4gICAgc3VibWl0OiBbJzxidXR0b24gY2xhc3M9XCJiYXRjaFN1Ym1pdFwiIHR5cGU9XCJzdWJtaXRcIj5TRU5EPC9idXR0b24+J10uam9pbignJyksXG4gICAgaXRlbTogWyc8bGkgY2xhc3M9XCJmaWxldHlwZURpc3BsYXlDbGFzc1wiPicsXG4gICAgICAgICc8c3BuYSBjbGFzcz1cImZpbGVpY29uIHt7ZmlsZXR5cGV9fVwiPnt7ZmlsZXR5cGV9fTwvc3BuYT4nLFxuICAgICAgICAnPHNwYW4gY2xhc3M9XCJmaWxlX25hbWVcIj57e2ZpbGVuYW1lfX08L3NwYW4+JyxcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiZmlsZV9zaXplXCI+e3tmaWxlc2l6ZX19PC9zcGFuPicsXG4gICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cInt7ZGVsZXRlQnV0dG9uQ2xhc3NOYW1lfX1cIj5EZWxldGU8L2J1dHRvbj4nLFxuICAgICAgICAnPC9saT4nXS5qb2luKCcnKSxcbiAgICBkcmFnOiBbJzxkaXYgY2xhc3M9XCJkcmFnem9uZVwiPjwvZGl2PiddLmpvaW4oJycpXG59O1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgaXMgbWFuYWdlciBvZiBpbnB1dCBlbGVtZW50cyB0aGF0IGFjdCBsaWtlIGZpbGUgcG9vbC5cbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG52YXIgSElEREVOX0ZJTEVfSU5QVVRfQ0xBU1MgPSByZXF1aXJlKCcuL2NvbnN0cycpLkNPTkYuSElEREVOX0ZJTEVfSU5QVVRfQ0xBU1MsXG4gICAgZm9yRWFjaCA9IHR1aS51dGlsLmZvckVhY2gsXG4gICAgaGFzU3RhbXAgPSB0dWkudXRpbC5oYXNTdGFtcCxcbiAgICBzdGFtcCA9IHR1aS51dGlsLnN0YW1wO1xuXG4vKipcbiAqIFRoZSBwb29sIGZvciBzYXZlIGZpbGVzLlxuICogSXQncyBvbmx5IGZvciBpbnB1dFtmaWxlXSBlbGVtZW50IHNhdmUgYXQgYnJvd3NlciB0aGF0IGRvZXMgbm90IHN1cHBvcnQgZmlsZSBhcGkuXG4gKiBAY2xhc3MgVmlldy5Qb29sXG4gKi9cbnZhciBQb29sID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBWaWV3LlBvb2wucHJvdG90eXBlICove1xuICAgIC8qKlxuICAgICAqIGluaXRpYWxpemVcbiAgICAgKi9cbiAgICBpbml0OiBmdW5jdGlvbihwbGFuZXQpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFN1Ym1pdHRlciBmb3IgZmlsZSBlbGVtZW50IHRvIHNlcnZlclxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnBsYW5ldCA9IHBsYW5ldDtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZpbGUgZGF0YSBzdHJ1Y3R1cmUgb2JqZWN0KGtleT1uYW1lIDogdmFsdWU9aXVwdXRbdHlwZT1maWxlXS1FbGVtZW50KTtcbiAgICAgICAgICogQHR5cGUge29iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZmlsZXMgPSB7fTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2F2ZSBhIGlucHV0IGVsZW1lbnRbdHlwZT1maWxlXSwgYXMgdmFsdWUgb2YgZmlsZSBuYW1lLlxuICAgICAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudH0gaW5wdXRGaWxlRWwgQSBpbnB1dCBlbGVtZW50IHRoYXQgaGF2ZSB0byBiZSBzYXZlZFxuICAgICAqL1xuICAgIHN0b3JlOiBmdW5jdGlvbihpbnB1dEZpbGVFbCkge1xuICAgICAgICB2YXIgaWQgPSBoYXNTdGFtcChpbnB1dEZpbGVFbCkgJiYgc3RhbXAoaW5wdXRGaWxlRWwpLFxuICAgICAgICAgICAgZmlsZW5hbWU7XG5cbiAgICAgICAgaWYgKCFpZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGZpbGVuYW1lID0gaW5wdXRGaWxlRWwudmFsdWU7XG4gICAgICAgIHRoaXMuZmlsZXNbaWQgKyBmaWxlbmFtZV0gPSBpbnB1dEZpbGVFbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgaW5wdXQgZWxlbWVudFt0eXBlPWZpbGVdIGZyb20gcG9vbC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIC0gQSBmaWxlIG5hbWUgdGhhdCBoYXZlIHRvIGJlIHJlbW92ZWQuXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gcmVzdWx0XG4gICAgICovXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICAgICAgdmFyIGtleSA9IHBhcmFtcy5pZCArIHBhcmFtcy5uYW1lLFxuICAgICAgICAgICAgZWxlbWVudCA9IHRoaXMuZmlsZXNba2V5XTtcblxuICAgICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlbGV0ZSB0aGlzLmZpbGVzW2tleV07XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFbXB0eSBwb29sXG4gICAgICovXG4gICAgZW1wdHk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmZpbGVzID0ge307XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFBsYW50IGZpbGVzIG9uIHBvb2wgdG8gZm9ybSBpbnB1dFxuICAgICAqL1xuICAgIHBsYW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHBsYW5ldCA9IHRoaXMucGxhbmV0O1xuICAgICAgICBmb3JFYWNoKHRoaXMuZmlsZXMsIGZ1bmN0aW9uKGVsZW1lbnQsIGtleSkge1xuICAgICAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgPSBISURERU5fRklMRV9JTlBVVF9DTEFTUztcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIHBsYW5ldC5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmZpbGVzW2tleV07XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBvb2w7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBNb2Rlcm4gPSB0dWkudXRpbC5kZWZpbmVDbGFzcyh7XG4gICAgaW5pdDogZnVuY3Rpb24odXBsb2FkZXIpIHtcbiAgICAgICAgdGhpcy51cGxvYWRlciA9IHVwbG9hZGVyO1xuICAgICAgICB0aGlzLmlucHV0VmlldyA9IHVwbG9hZGVyLmlucHV0VmlldztcbiAgICAgICAgdGhpcy5wb29sID0gW107XG4gICAgICAgIGlmICh1cGxvYWRlci5pc0JhdGNoVHJhbnNmZXIpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlID0gdGhpcy5fcmVtb3ZlV2hlbkJhdGNoO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIFRZUEU6ICdtb2Rlcm4nLFxuXG4gICAgc3RvcmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcG9vbCA9IHRoaXMucG9vbCxcbiAgICAgICAgICAgIGZpbGVzID0gdHVpLnV0aWwudG9BcnJheSh0aGlzLmlucHV0Vmlldy4kZmlsZUlucHV0WzBdLmZpbGVzKSxcbiAgICAgICAgICAgIHN0YW1wID0gdHVpLnV0aWwuc3RhbXAsXG4gICAgICAgICAgICBkYXRhID0gW107XG5cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChmaWxlcywgZnVuY3Rpb24oZmlsZSkge1xuICAgICAgICAgICAgdmFyIGlkID0gc3RhbXAoZmlsZSk7XG4gICAgICAgICAgICBwb29sLnB1c2goZmlsZSk7XG4gICAgICAgICAgICBkYXRhLnB1c2goe1xuICAgICAgICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICAgICAgICBuYW1lOiBmaWxlLm5hbWUsXG4gICAgICAgICAgICAgICAgc2l6ZTogZmlsZS5zaXplXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5pbnB1dFZpZXcucmVzZXRGaWxlSW5wdXQoKTtcbiAgICAgICAgdGhpcy5maXJlKCdzdG9yZWQnLCBkYXRhKTtcbiAgICB9LFxuXG4gICAgdXBsb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGZvcm0gPSB0aGlzLmlucHV0Vmlldy4kZWwuY2xvbmUoKSxcbiAgICAgICAgICAgIGZpZWxkID0gdGhpcy51cGxvYWRlci5maWxlRmllbGQsXG4gICAgICAgICAgICBmb3JtRGF0YTtcblxuICAgICAgICBmb3JtLmZpbmQoJ2lucHV0W3R5cGU9XCJmaWxlXCJdJykucmVtb3ZlKCk7XG4gICAgICAgIGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKGZvcm0pO1xuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKHRoaXMucG9vbCwgZnVuY3Rpb24oZmlsZSkge1xuICAgICAgICAgICAgZm9ybURhdGEuYXBwZW5kKGZpZWxkLCBmaWxlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogdGhpcy51cGxvYWRlci51cmwuc2VuZCxcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgIGRhdGE6IGZvcm1EYXRhLFxuICAgICAgICAgICAgc3VjY2VzczogdHVpLnV0aWwuYmluZCh0aGlzLl91cGxvYWRTdWNjZXNzLCB0aGlzKSxcbiAgICAgICAgICAgIGVycm9yOiB0dWkudXRpbC5iaW5kKHRoaXMuX3VwbG9hZEVycm9yLCB0aGlzKSxcbiAgICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBmYWxzZVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5wb29sLmxlbmd0aCA9IDA7XG4gICAgfSxcblxuICAgIGNsZWFyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5wb29sLmxlbmd0aCA9IDA7XG4gICAgfSxcblxuICAgIF9yZW1vdmVXaGVuQmF0Y2g6IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAgICB2YXIgcG9vbCA9IHRoaXMucG9vbCxcbiAgICAgICAgICAgIGhhc1N0YW1wID0gdHVpLnV0aWwuaGFzU3RhbXAsXG4gICAgICAgICAgICBzdGFtcCA9IHR1aS51dGlsLnN0YW1wLFxuICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XG5cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChwb29sLCBmdW5jdGlvbihmaWxlLCBpbmRleCkge1xuICAgICAgICAgICAgaWYgKGhhc1N0YW1wKGZpbGUpICYmIChzdGFtcChmaWxlKSA9PT0gcGFyYW1zLmlkKSkge1xuICAgICAgICAgICAgICAgIHBvb2wuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5maXJlKCdyZW1vdmVkJywgdHVpLnV0aWwuZXh0ZW5kKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IHJlc3VsdCA/ICdzdWNjZXNzJyA6ICdmYWlsJ1xuICAgICAgICB9LCBwYXJhbXMpKTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogdXBsb2FkZXIudXJsLnJlbW92ZSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbnAnLFxuICAgICAgICAgICAgZGF0YTogcGFyYW1zLFxuICAgICAgICAgICAgc3VjY2VzczogdHVpLnV0aWwuYmluZChmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgZGF0YS50eXBlID0gJ3JlbW92ZSc7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdyZW1vdmVkJywgZGF0YSk7XG4gICAgICAgICAgICB9LCB0aGlzKVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX3VwbG9hZEVycm9yOiBmdW5jdGlvbihqcVhIUiwgc3RhdHVzLCBtc2dUaHJvd24pIHtcbiAgICAgICAgdGhpcy5maXJlKCdlcnJvcicsIHtcbiAgICAgICAgICAgIHN0YXR1czogc3RhdHVzLFxuICAgICAgICAgICAgbWVzc2FnZTogbXNnVGhyb3duXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfdXBsb2FkU3VjY2VzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB0aGlzLmZpcmUoJ3VwbG9hZGVkJywgSlNPTi5wYXJzZShkYXRhKSk7XG4gICAgfVxufSk7XG5cbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihNb2Rlcm4pO1xubW9kdWxlLmV4cG9ydHMgPSBNb2Rlcm47XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBQb29sID0gcmVxdWlyZSgnLi4vcG9vbCcpLFxuICAgIFhfRE9NQUlOX0dMT0JBTF9DQUxMQkFDS19OQU1FID0gcmVxdWlyZSgnLi4vY29uc3RzJykuQ09ORi5YX0RPTUFJTl9HTE9CQUxfQ0FMTEJBQ0tfTkFNRTtcblxudmFyIE9sZCA9IHR1aS51dGlsLmRlZmluZUNsYXNzKHtcbiAgICBpbml0OiBmdW5jdGlvbih1cGxvYWRlcikge1xuICAgICAgICB2YXIgJGhpZGRlbkZyYW1lID0gdXBsb2FkZXIuJHRhcmdldDtcblxuICAgICAgICB0aGlzLnBvb2wgPSBuZXcgUG9vbCh1cGxvYWRlci5pbnB1dFZpZXcuJGVsWzBdKTtcbiAgICAgICAgdGhpcy51cGxvYWRlciA9IHVwbG9hZGVyO1xuICAgICAgICB0aGlzLmlucHV0VmlldyA9IHVwbG9hZGVyLmlucHV0VmlldztcbiAgICAgICAgJGhpZGRlbkZyYW1lLm9uKCdsb2FkJywgdHVpLnV0aWwuYmluZCh0aGlzLl9vblVwbG9hZCwgdGhpcywgJGhpZGRlbkZyYW1lKSk7XG5cbiAgICAgICAgaWYgKHVwbG9hZGVyLmlzQmF0Y2hUcmFuc2Zlcikge1xuICAgICAgICAgICAgdGhpcy51cGxvYWQgPSB0aGlzLl91cGxvYWRXaGVuQmF0Y2g7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZSA9IHRoaXMuX3JlbW92ZVdoZW5CYXRjaDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1cGxvYWRlci5pc0Nyb3NzRG9tYWluKSB7XG4gICAgICAgICAgICB3aW5kb3dbWF9ET01BSU5fR0xPQkFMX0NBTExCQUNLX05BTUVdID0gdHVpLnV0aWwuYmluZChmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCd1cGxvYWRlZCcsIGRhdGEpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgICAgIHRoaXMuaW5wdXRWaWV3LiRlbC5hcHBlbmQoXG4gICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cImNhbGxiYWNrTmFtZVwiIHZhbHVlPVwiJyArIFhfRE9NQUlOX0dMT0JBTF9DQUxMQkFDS19OQU1FICsgJ1wiPidcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgVFlQRTogJ29sZCcsXG5cbiAgICBzdG9yZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbCA9IHRoaXMuaW5wdXRWaWV3LiRmaWxlSW5wdXRbMF0sXG4gICAgICAgICAgICBpZCA9IHR1aS51dGlsLnN0YW1wKGVsKTtcblxuICAgICAgICB0aGlzLnBvb2wuc3RvcmUoZWwpO1xuICAgICAgICB0aGlzLmlucHV0Vmlldy5yZXNldEZpbGVJbnB1dCgpO1xuXG4gICAgICAgIHRoaXMuZmlyZSgnc3RvcmVkJywgW3tcbiAgICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICAgIG5hbWU6IGVsLnZhbHVlLFxuICAgICAgICAgICAgc2l6ZTogJydcbiAgICAgICAgfV0pO1xuICAgIH0sXG5cbiAgICB1cGxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnBvb2wucGxhbnQoKTtcbiAgICAgICAgdGhpcy5pbnB1dFZpZXcuJGVsLnN1Ym1pdCgpO1xuICAgICAgICB0aGlzLmlucHV0Vmlldy5jbGVhcigpO1xuICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgfSxcblxuICAgIF91cGxvYWRXaGVuQmF0Y2g6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnBvb2wucGxhbnQoKTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICAgICAgdmFyIHVwbG9hZGVyID0gdGhpcy51cGxvYWRlcjtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogdXBsb2FkZXIudXJsLnJlbW92ZSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbnAnLFxuICAgICAgICAgICAgZGF0YTogcGFyYW1zLFxuICAgICAgICAgICAgc3VjY2VzczogdHVpLnV0aWwuYmluZChmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgZGF0YS50eXBlID0gJ3JlbW92ZSc7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdyZW1vdmVkJywgZGF0YSk7XG4gICAgICAgICAgICB9LCB0aGlzKVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnBvb2wuZW1wdHkoKTtcbiAgICB9LFxuXG4gICAgX3JlbW92ZVdoZW5CYXRjaDogZnVuY3Rpb24ocGFyYW1zKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSB0aGlzLnBvb2wucmVtb3ZlKHBhcmFtcyk7XG5cbiAgICAgICAgdGhpcy5maXJlKCdyZW1vdmVkJywgdHVpLnV0aWwuZXh0ZW5kKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IHJlc3VsdCA/ICdzdWNjZXNzJyA6ICdmYWlsJ1xuICAgICAgICB9LCBwYXJhbXMpKTtcbiAgICB9LFxuXG4gICAgX29uVXBsb2FkOiBmdW5jdGlvbigkaGlkZGVuRnJhbWUpIHtcbiAgICAgICAgdmFyIGRhdGE7XG5cbiAgICAgICAgdGhpcy51cGxvYWRlci5jbGVhcigpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZGF0YSA9ICRoaWRkZW5GcmFtZVswXS5jb250ZW50V2luZG93LmRvY3VtZW50LmJvZHkuaW5uZXJIVE1MO1xuICAgICAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3VwbG9hZGVkJywgJC5wYXJzZUpTT04oZGF0YSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ2Vycm9yJywge1xuICAgICAgICAgICAgICAgIHN0YXR1czogZS5uYW1lLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGUubWVzc2FnZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKE9sZCk7XG5tb2R1bGUuZXhwb3J0cyA9IE9sZDtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBGaWxlVXBsb2FkZXIgaXMgY29yZSBvZiBmaWxlIHVwbG9hZGVyIGNvbXBvbmVudC48YnI+RmlsZU1hbmFnZXIgbWFuYWdlIGNvbm5lY3RvciB0byBjb25uZWN0IHNlcnZlciBhbmQgdXBkYXRlIEZpbGVMaXN0Vmlldy5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG52YXIgY29uc3RzID0gcmVxdWlyZSgnLi9jb25zdHMnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBJbnB1dCA9IHJlcXVpcmUoJy4vdmlldy9pbnB1dCcpO1xudmFyIExpc3QgPSByZXF1aXJlKCcuL3ZpZXcvbGlzdCcpO1xudmFyIERyYWdBbmREcm9wID0gcmVxdWlyZSgnLi92aWV3L2RyYWcnKTtcbnZhciBPbGRSZXF1ZXN0ZXIgPSByZXF1aXJlKCcuL3JlcXVlc3Rlci9vbGQnKTtcbnZhciBNb2Rlcm5SZXF1ZXN0ZXIgPSByZXF1aXJlKCcuL3JlcXVlc3Rlci9tb2Rlcm4nKTtcblxuLyoqXG4gKiBGaWxlVXBsb2FkZXIgYWN0IGxpa2UgYnJpZGdlIGJldHdlZW4gY29ubmVjdG9yIGFuZCB2aWV3LlxuICogSXQgbWFrZXMgY29ubmVjdG9yIGFuZCB2aWV3IHdpdGggb3B0aW9uIGFuZCBlbnZpcm9ubWVudC5cbiAqIEl0IGNvbnRyb2wgYW5kIG1ha2UgY29ubmVjdGlvbiBhbW9uZyBtb2R1bGVzLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBUaGUgb3B0aW9ucyB0byBzZXQgdXAgZmlsZSB1cGxvYWRlciBtb2R1bGVzLlxuICogIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLnVybCBUaGUgdXJsIGlzIGZpbGUgc2VydmVyLlxuICogICAgICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy51cmwuc2VuZCBUaGUgdXJsIGlzIGZvciBmaWxlIGF0dGFjaC5cbiAqICAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMudXJsLnJlbW92ZSBUaGUgdXJsIGlzIGZvciBmaWxlIGRldGFjaC5cbiAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5mb3JtVGFyZ2V0IFRoZSB0YXJnZXQgZm9yIHgtZG9tYWluIGpzb25wIGNhc2UuXG4gKiAgQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMubGlzdEluZm8gVGhlIGVsZW1lbnQgaW5mbyB0byBkaXNwbGF5IGZpbGUgbGlzdCBpbmZvcm1hdGlvbi5cbiAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZmlsZUZpZWxkPSd1c2VyRmlsZVtdJ10gVGhlIGZpZWxkIG5hbWUgb2YgaW5wdXQgZmlsZSBlbGVtZW50LlxuICogIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy51c2VGb2xkZXIgV2hldGhlciBzZWxlY3QgdW5pdCBpcyBmb2xkZXIgb2Ygbm90LiBJZiB0aGlzIGlzIHR1cmUsIG11bHRpcGxlIHdpbGwgYmUgaWdub3JlZC5cbiAqICBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMuaXNNdWx0aXBsZSBXaGV0aGVyIGVuYWJsZSBtdWx0aXBsZSBzZWxlY3Qgb3Igbm90LlxuICogQHBhcmFtIHtqUXVlcnl9ICRlbCBSb290IEVsZW1lbnQgb2YgVXBsb2FkZXJcbiAqIEBleGFtcGxlXG4gKiB2YXIgdXBsb2FkZXIgPSBuZXcgdHVpLmNvbXBvbmVudC5VcGxvYWRlcih7XG4gKiAgICAgdXJsOiB7XG4gKiAgICAgICAgIHNlbmQ6IFwiaHR0cDovL2ZlLm5obmVudC5jb20vZXRjL2V0Yy91cGxvYWRlci91cGxvYWRlci5waHBcIixcbiAqICAgICAgICAgcmVtb3ZlOiBcImh0dHA6Ly9mZS5uaG5lbnQuY29tL2V0Yy9ldGMvdXBsb2FkZXIvcmVtb3ZlLnBocFwiXG4gKiAgICAgfSxcbiAqICAgICBmb3JtVGFyZ2V0OiAnaGlkZGVuRnJhbWUnLFxuICogICAgIGxpc3RJbmZvOiB7XG4gKiAgICAgICAgIGxpc3Q6ICQoJyNmaWxlcycpLFxuICogICAgICAgICBjb3VudDogJCgnI2ZpbGVfY291bnQnKSxcbiAqICAgICAgICAgc2l6ZTogJCgnI3NpemVfY291bnQnKVxuICogICAgIH1cbiAqIH0sICQoJyN1cGxvYWRlcicpKTtcbiAqL1xudmFyIFVwbG9hZGVyID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqQGxlbmRzIFVwbG9hZGVyLnByb3RvdHlwZSAqL3tcbiAgICAvKipcbiAgICAgKiBpbml0aWFsaXplXG4gICAgICovXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucywgJGVsKSB7XG4gICAgICAgIHRoaXMuX3NldERhdGEob3B0aW9ucyk7XG4gICAgICAgIHRoaXMuJGVsID0gJGVsO1xuICAgICAgICB0aGlzLmZpbGVGaWVsZCA9IHRoaXMuZmlsZUZpZWxkIHx8IGNvbnN0cy5DT05GLkZJTEVfRklMRURfTkFNRTtcbiAgICAgICAgaWYgKHRoaXMudXNlRHJhZyAmJiAhdGhpcy51c2VGb2xkZXIgJiYgdXRpbHMuaXNTdXBwb3J0RmlsZVN5c3RlbSgpKSB7XG4gICAgICAgICAgICB0aGlzLmRyYWdWaWV3ID0gbmV3IERyYWdBbmREcm9wKG9wdGlvbnMsIHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5wdXRWaWV3ID0gbmV3IElucHV0KHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLmxpc3RWaWV3ID0gbmV3IExpc3Qob3B0aW9ucywgdGhpcyk7XG4gICAgICAgIHRoaXMuX3NldENvbm5lY3RvcigpO1xuICAgICAgICB0aGlzLl9hZGRFdmVudCgpO1xuICAgICAgICB0aGlzLmlzQ3Jvc3NEb21haW4gPSB1dGlscy5pc0Nyb3NzRG9tYWluKHRoaXMudXJsLnNlbmQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgQ29ubmVjdG9yXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0Q29ubmVjdG9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHV0aWxzLmlzU3VwcG9ydEZvcm1EYXRhKCkpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlcXVlc3RlciA9IG5ldyBNb2Rlcm5SZXF1ZXN0ZXIodGhpcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiR0YXJnZXQgPSB0aGlzLl9jcmVhdGVUYXJnZXRGcmFtZSgpO1xuICAgICAgICAgICAgdGhpcy4kZWwuYXBwZW5kKHRoaXMuJHRhcmdldCk7XG4gICAgICAgICAgICB0aGlzLl9yZXF1ZXN0ZXIgPSBuZXcgT2xkUmVxdWVzdGVyKHRoaXMpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2VzIGVsZW1lbnQgdG8gYmUgdGFyZ2V0IG9mIHN1Ym1pdCBmb3JtIGVsZW1lbnQuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY3JlYXRlVGFyZ2V0RnJhbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHRhcmdldCA9ICQoJzxpZnJhbWUgbmFtZT1cIicgKyB0aGlzLmZvcm1UYXJnZXQgKyAnXCI+PC9pZnJhbWU+Jyk7XG4gICAgICAgICR0YXJnZXQuY3NzKHtcbiAgICAgICAgICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nLFxuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuICR0YXJnZXQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBsaXN0IHZpZXcgd2l0aCBjdXN0b20gb3Igb3JpZ2luYWwgZGF0YS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gaW5mbyBUaGUgZGF0YSBmb3IgdXBkYXRlIGxpc3RcbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IGluZm8uYWN0aW9uIFRoZSBhY3Rpb24gbmFtZSB0byBleGVjdXRlIG1ldGhvZFxuICAgICAqL1xuICAgIHVwZGF0ZUxpc3Q6IGZ1bmN0aW9uKGluZm8pIHtcbiAgICAgICAgdGhpcy5saXN0Vmlldy51cGRhdGUoaW5mbyk7XG4gICAgICAgIHRoaXMubGlzdFZpZXcudXBkYXRlVG90YWxJbmZvKGluZm8pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgZmllbGQgZGF0YSBieSBvcHRpb24gdmFsdWVzLlxuICAgICAqIEBwYXJhbSBvcHRpb25zXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0RGF0YTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB0dWkudXRpbC5leHRlbmQodGhpcywgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV4dHJhY3QgcHJvdG9jb2wgKyBkb21haW4gZnJvbSB1cmwgdG8gZmluZCBvdXQgd2hldGhlciBjcm9zcy1kb21haW4gb3Igbm90LlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqL1xuICAgIGlzQ3Jvc3NEb21haW46IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcGFnZURvbWFpbiA9IGRvY3VtZW50LmRvbWFpbjtcbiAgICAgICAgcmV0dXJuIHRoaXMudXJsLnNlbmQuaW5kZXhPZihwYWdlRG9tYWluKSA9PT0gLTE7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZvciBlcnJvclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSBFcnJvciByZXNwb25zZVxuICAgICAqL1xuICAgIGVycm9yQ2FsbGJhY2s6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciBtZXNzYWdlO1xuICAgICAgICBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UubXNnKSB7XG4gICAgICAgICAgICBtZXNzYWdlID0gcmVzcG9uc2UubXNnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWVzc2FnZSA9IGNvbnN0cy5DT05GLkVSUk9SLkRFRkFVTFQ7XG4gICAgICAgIH1cbiAgICAgICAgYWxlcnQobWVzc2FnZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZvciBjdXN0b20gc2VuZCBldmVudFxuICAgICAqL1xuICAgIHNlbmRGaWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fcmVxdWVzdGVyLnN0b3JlKCk7XG4gICAgICAgIHRoaXMuX3JlcXVlc3Rlci51cGxvYWQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZm9yIGN1c3RvbSByZW1vdmUgZXZlbnRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBUaGUgZGF0YSBmb3IgcmVtb3ZlIGZpbGUuXG4gICAgICovXG4gICAgcmVtb3ZlRmlsZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB0aGlzLl9yZXF1ZXN0ZXIucmVtb3ZlKGRhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdWJtaXQgZm9yIGRhdGEgc3VibWl0IHRvIHNlcnZlclxuICAgICAqIEBhcGlcbiAgICAgKi9cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9yZXF1ZXN0ZXIudXBsb2FkKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBmaWxlIGluZm8gbG9jYWxseVxuICAgICAqIEBwYXJhbSB7SHRtbEVsZW1lbnR9IGVsZW1lbnQgSW5wdXQgZWxlbWVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldEZpbGVJbmZvOiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAgIHZhciBmaWxlcztcbiAgICAgICAgaWYgKHV0aWxzLmlzU3VwcG9ydEZpbGVTeXN0ZW0oKSkge1xuICAgICAgICAgICAgZmlsZXMgPSB0aGlzLl9nZXRGaWxlTGlzdChlbGVtZW50LmZpbGVzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpbGVzID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6IGVsZW1lbnQudmFsdWUsXG4gICAgICAgICAgICAgICAgaWQ6IGVsZW1lbnQudmFsdWVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZpbGVzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgZmlsZSBsaXN0IGZyb20gRmlsZUxpc3Qgb2JqZWN0XG4gICAgICogQHBhcmFtIHtGaWxlTGlzdH0gZmlsZXMgQSBGaWxlTGlzdCBvYmplY3RcbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0RmlsZUxpc3Q6IGZ1bmN0aW9uKGZpbGVzKSB7XG4gICAgICAgIHJldHVybiB0dWkudXRpbC5tYXAoZmlsZXMsIGZ1bmN0aW9uKGZpbGUpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogZmlsZS5uYW1lLFxuICAgICAgICAgICAgICAgIHNpemU6IGZpbGUuc2l6ZSxcbiAgICAgICAgICAgICAgICBpZDogZmlsZS5uYW1lXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IHRvIGxpc3R2aWV3IGFuZCBpbnB1dHZpZXdcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3JlcXVlc3Rlci5vbigncmVtb3ZlZCcsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdFZpZXcudXBkYXRlKGRhdGEpO1xuICAgICAgICAgICAgdGhpcy5maXJlKCdyZW1vdmUnLCBkYXRhKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgdGhpcy5fcmVxdWVzdGVyLm9uKCdlcnJvcicsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgnZXJyb3InLCBkYXRhKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgaWYgKHRoaXMudXNlRHJhZyAmJiB0aGlzLmRyYWdWaWV3KSB7XG4gICAgICAgICAgICAvLyBAdG9kbyB0b3Ag7LKY66as6rCAIOuUsOuhnCDtlYTsmpTtlagsIHNlbmRGaWxlIOyCrOyaqSDslYjrkKhcbiAgICAgICAgICAgIHRoaXMuZHJhZ1ZpZXcub24oJ2Ryb3AnLCB0aGlzLl9zdG9yZSwgdGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5pc0JhdGNoVHJhbnNmZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRWaWV3Lm9uKCdjaGFuZ2UnLCB0aGlzLl9zdG9yZSwgdGhpcyk7XG4gICAgICAgICAgICB0aGlzLmxpc3RWaWV3Lm9uKCdyZW1vdmUnLCB0aGlzLnJlbW92ZUZpbGUsIHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5fcmVxdWVzdGVyLm9uKHtcbiAgICAgICAgICAgICAgICB1cGxvYWRlZDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgnc3VjY2VzcycsIGRhdGEpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc3RvcmVkOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGlzdChkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maXJlKCd1cGRhdGUnLCBkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRWaWV3Lm9uKCdjaGFuZ2UnLCB0aGlzLnNlbmRGaWxlLCB0aGlzKTtcbiAgICAgICAgICAgIHRoaXMubGlzdFZpZXcub24oJ3JlbW92ZScsIHRoaXMucmVtb3ZlRmlsZSwgdGhpcyk7XG4gICAgICAgICAgICB0aGlzLl9yZXF1ZXN0ZXIub24oe1xuICAgICAgICAgICAgICAgIHVwbG9hZGVkOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTGlzdChkYXRhLmZpbGVsaXN0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maXJlKCdzdWNjZXNzJywgZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9yZXF1ZXN0ZXIuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5pbnB1dFZpZXcuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5saXN0Vmlldy5jbGVhcigpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdG9yZSBpbnB1dCBlbGVtZW50IHRvIHBvb2wuXG4gICAgIC8vKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBpbnB1dCBBIGlucHV0IGVsZW1lbnRbdHlwZT1maWxlXSBmb3Igc3RvcmUgcG9vbFxuICAgICAqL1xuICAgIF9zdG9yZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3JlcXVlc3Rlci5zdG9yZSgpO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oVXBsb2FkZXIpO1xubW9kdWxlLmV4cG9ydHMgPSBVcGxvYWRlcjtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIGZpbGUgY29udGFpbiB1dGlsaXR5IG1ldGhvZHMgZm9yIHVwbG9hZGVyLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuLyoqXG4gKiBAbmFtZXNwYWNlIHV0aWxzXG4gKi9cbnZhciBJU19TVVBQT1JUX0ZJTEVfU1lTVEVNID0gISEod2luZG93LkZpbGUgJiYgd2luZG93LkZpbGVSZWFkZXIgJiYgd2luZG93LkZpbGVMaXN0ICYmIHdpbmRvdy5CbG9iKSxcbiAgICBJU19TVVBQT1JUX0ZPUk1fREFUQSA9ICEhKHdpbmRvdy5Gb3JtRGF0YSB8fCBudWxsKTtcblxuXG5mdW5jdGlvbiBwYXJzZVVSTCh1cmwpIHtcbiAgICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICBhLmhyZWYgPSB1cmw7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgaHJlZjogICAgIGEuaHJlZixcbiAgICAgICAgaG9zdDogICAgIGEuaG9zdCB8fCBsb2NhdGlvbi5ob3N0LFxuICAgICAgICBwb3J0OiAgICAgKCcwJyA9PT0gYS5wb3J0IHx8ICcnID09PSBhLnBvcnQpID8gcG9ydChhLnByb3RvY29sKSA6IGEucG9ydCxcbiAgICAgICAgaGFzaDogICAgIGEuaGFzaCxcbiAgICAgICAgaG9zdG5hbWU6IGEuaG9zdG5hbWUgfHwgbG9jYXRpb24uaG9zdG5hbWUsXG4gICAgICAgIHBhdGhuYW1lOiBhLnBhdGhuYW1lLmNoYXJBdCgwKSAhPSAnLycgPyAnLycgKyBhLnBhdGhuYW1lIDogYS5wYXRobmFtZSxcbiAgICAgICAgcHJvdG9jb2w6ICFhLnByb3RvY29sIHx8ICc6JyA9PSBhLnByb3RvY29sID8gbG9jYXRpb24ucHJvdG9jb2wgOiBhLnByb3RvY29sLFxuICAgICAgICBzZWFyY2g6ICAgYS5zZWFyY2gsXG4gICAgICAgIHF1ZXJ5OiAgICBhLnNlYXJjaC5zbGljZSgxKVxuICAgIH07XG59XG5cblxuLyoqXG4gKiBFeHRyYWN0IHVuaXQgZm9yIGZpbGUgc2l6ZVxuICogQHBhcmFtIHtudW1iZXJ9IGJ5dGVzIEEgdXNhZ2Ugb2YgZmlsZVxuICogQG1lbWJlcm9mIHV0aWxzXG4gKi9cbmZ1bmN0aW9uIGdldEZpbGVTaXplV2l0aFVuaXQoYnl0ZXMpIHtcbiAgICB2YXIgdW5pdHMgPSBbJ0InLCAnS0InLCAnTUInLCAnR0InLCAnVEInXSxcbiAgICAgICAgYnl0ZXMgPSBwYXJzZUludChieXRlcywgMTApLFxuICAgICAgICBleHAgPSBNYXRoLmxvZyhieXRlcykgLyBNYXRoLmxvZygxMDI0KSB8IDAsXG4gICAgICAgIHJlc3VsdCA9IChieXRlcyAvIE1hdGgucG93KDEwMjQsIGV4cCkpLnRvRml4ZWQoMik7XG5cbiAgICByZXR1cm4gcmVzdWx0ICsgdW5pdHNbZXhwXTtcbn1cblxuLyoqXG4gKiBXaGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnQgRm9ybURhdGEgb3Igbm90XG4gKiBAbWVtYmVyb2YgdXRpbHNcbiAqL1xuZnVuY3Rpb24gaXNTdXBwb3J0Rm9ybURhdGEoKSB7XG4gICAgcmV0dXJuIElTX1NVUFBPUlRfRk9STV9EQVRBO1xufVxuXG4vKipcbiAqIEdldCBpdGVtIGVsZW1lbnRzIEhUTUxcbiAqIEBwYXJhbSB7c3RyaW5nfSBodG1sIEhUTUwgdGVtcGxhdGVcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKiBAbWVtYmVyb2YgdXRpbHNcbiAqL1xuZnVuY3Rpb24gdGVtcGxhdGUobWFwLCBodG1sKSB7XG4gICAgaHRtbCA9IGh0bWwucmVwbGFjZSgvXFx7XFx7KFteXFx9XSspXFx9XFx9L2csIGZ1bmN0aW9uIChtc3RyLCBuYW1lKSB7XG4gICAgICAgIHJldHVybiBtYXBbbmFtZV07XG4gICAgfSk7XG4gICAgcmV0dXJuIGh0bWw7XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBzdXBwb3J0IGZpbGUgYXBpIG9yIG5vdFxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKiBAbWVtYmVyb2YgdXRpbHNcbiAqL1xuZnVuY3Rpb24gaXNTdXBwb3J0RmlsZVN5c3RlbSgpIHtcbiAgICByZXR1cm4gSVNfU1VQUE9SVF9GSUxFX1NZU1RFTTtcbn1cblxuZnVuY3Rpb24gaXNDcm9zc0RvbWFpbih1cmwpIHtcbiAgICB2YXIgbG9jYXRpb24gPSBwYXJzZVVSTCh3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgdXJsID0gcGFyc2VVUkwodXJsKTtcbiAgICByZXR1cm4gdXJsLmhvc3RuYW1lICE9PSBsb2NhdGlvbi5ob3N0bmFtZVxuICAgICAgICB8fCB1cmwucG9ydCAhPT0gbG9jYXRpb24ucG9ydFxuICAgICAgICB8fCB1cmwucHJvdG9jb2wgIT09IGxvY2F0aW9uLnByb3RvY29sO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRGaWxlU2l6ZVdpdGhVbml0OiBnZXRGaWxlU2l6ZVdpdGhVbml0LFxuICAgIGlzU3VwcG9ydEZpbGVTeXN0ZW06IGlzU3VwcG9ydEZpbGVTeXN0ZW0sXG4gICAgaXNTdXBwb3J0Rm9ybURhdGE6IGlzU3VwcG9ydEZvcm1EYXRhLFxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcbiAgICBpc0Nyb3NzRG9tYWluOiBpc0Nyb3NzRG9tYWluXG59O1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgZmlsZSBpcyBhYm91dCBkcmFnIGFuZCBkcm9wIGZpbGUgdG8gc2VuZC4gRHJhZyBhbmQgZHJvcCBpcyBydW5uaW5nIHZpYSBmaWxlIGFwaS5cbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG4ndXNlIHN0cmljdCc7XG52YXIgY29uc3RzID0gcmVxdWlyZSgnLi4vY29uc3RzJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG4vKipcbiAqIE1ha2VzIGRyYWcgYW5kIGRyb3AgYXJlYSwgdGhlIGRyb3BwZWQgZmlsZSBpcyBhZGRlZCB2aWEgZXZlbnQgZHJvcCBldmVudC5cbiAqIEBjbGFzcyBWaWV3LkRyYWdBbmREcm9wXG4gKi9cbnZhciBEcmFnQW5kRHJvcCA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgVmlldy5EcmFnQW5kRHJvcC5wcm90b3R5cGUgKi97XG4gICAgLyoqXG4gICAgICogaW5pdGlhbGl6ZSBEcmFnQW5kRHJvcFxuICAgICAqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMsIHVwbG9hZGVyKSB7XG4gICAgICAgIHZhciBodG1sID0gb3B0aW9ucy50ZW1wbGF0ZSAmJiBvcHRpb25zLnRlbXBsYXRlLmRyYWcgfHwgY29uc3RzLkhUTUwuZHJhZztcbiAgICAgICAgdGhpcy5fZW5hYmxlQ2xhc3MgPSBvcHRpb25zLmRyYWcgJiYgb3B0aW9ucy5kcmFnLmVuYWJsZUNsYXNzIHx8IGNvbnN0cy5DT05GLkRSQUdfREVGQVVMVF9FTkFCTEVfQ0xBU1M7XG4gICAgICAgIHRoaXMuX3JlbmRlcihodG1sLCB1cGxvYWRlcik7XG4gICAgICAgIHRoaXMuX2FkZEV2ZW50KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbmRlcnMgZHJhZyBhbmQgZHJvcCBhcmVhXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGh0bWwgVGhlIGh0bWwgc3RyaW5nIHRvIG1ha2UgZGFyZyB6b25lXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHVwbG9hZGVyIFRoZSBjb3JlIGluc3RhbmNlIG9mIHRoaXMgY29tcG9uZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVuZGVyOiBmdW5jdGlvbihodG1sLCB1cGxvYWRlcikge1xuICAgICAgICB0aGlzLiRlbCA9ICQoaHRtbCk7XG4gICAgICAgIHVwbG9hZGVyLiRlbC5hcHBlbmQodGhpcy4kZWwpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGRyYWcgYW5kIGRyb3AgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsLm9uKCdkcmFnZW50ZXInLCB0dWkudXRpbC5iaW5kKHRoaXMub25EcmFnRW50ZXIsIHRoaXMpKTtcbiAgICAgICAgdGhpcy4kZWwub24oJ2RyYWdvdmVyJywgdHVpLnV0aWwuYmluZCh0aGlzLm9uRHJhZ092ZXIsIHRoaXMpKTtcbiAgICAgICAgdGhpcy4kZWwub24oJ2Ryb3AnLCB0dWkudXRpbC5iaW5kKHRoaXMub25Ecm9wLCB0aGlzKSk7XG4gICAgICAgIHRoaXMuJGVsLm9uKCdkcmFnbGVhdmUnLCB0dWkudXRpbC5iaW5kKHRoaXMub25EcmFnTGVhdmUsIHRoaXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlcyBkcmFnZW50ZXIgZXZlbnRcbiAgICAgKi9cbiAgICBvbkRyYWdFbnRlcjogZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMuX2VuYWJsZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGVzIGRyYWdvdmVyIGV2ZW50XG4gICAgICovXG4gICAgb25EcmFnT3ZlcjogZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEhhbmRsZXMgZHJhZ2xlYXZlIGV2ZW50XG4gICAgICovXG4gICAgb25EcmFnTGVhdmU6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLl9kaXNhYmxlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEhhbmRsZXMgZHJvcCBldmVudFxuICAgICAqL1xuICAgIG9uRHJvcDogZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuX2Rpc2FibGUoKTtcbiAgICAgICAgdGhpcy5maXJlKCdkcm9wJywge1xuICAgICAgICAgICAgZmlsZXM6IGUub3JpZ2luYWxFdmVudC5kYXRhVHJhbnNmZXIuZmlsZXNcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgX2VuYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsLmFkZENsYXNzKHRoaXMuX2VuYWJsZUNsYXNzKTtcbiAgICB9LFxuXG4gICAgX2Rpc2FibGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbC5yZW1vdmVDbGFzcyh0aGlzLl9lbmFibGVDbGFzcyk7XG4gICAgfVxufSk7XG5cbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihEcmFnQW5kRHJvcCk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJhZ0FuZERyb3A7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgSW5wdXRWaWV3IG1ha2UgaW5wdXQgZm9ybSBieSB0ZW1wbGF0ZS4gQWRkIGV2ZW50IGZpbGUgdXBsb2FkIGV2ZW50LlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcbnZhciBjb25zdHMgPSByZXF1aXJlKCcuLi9jb25zdHMnKSxcbiAgICBISURERU5fRklMRV9JTlBVVF9DTEFTUyA9IGNvbnN0cy5DT05GLkhJRERFTl9GSUxFX0lOUFVUX0NMQVNTLFxuICAgIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxudmFyIGlzU3VwcG9ydEZvcm1EYXRhID0gdXRpbHMuaXNTdXBwb3J0Rm9ybURhdGEoKTtcblxuLyoqXG4gKiBUaGlzIHZpZXcgY29udHJvbCBpbnB1dCBlbGVtZW50IHR5cGVkIGZpbGUuXG4gKiBAY29uc3RydWN0b3IgVmlldy5JbnB1dFZpZXdcbiAqL1xudmFyIElucHV0ID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqQGxlbmRzIFZpZXcuSW5wdXQucHJvdG90eXBlICoqL3tcbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplIGlucHV0IGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtVcGxvYWRlcn0gdXBsb2FkZXIgLSBVcGxvYWRlciBpbnN0YW5jZVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gLSBPcHRpb25zXG4gICAgICovXG4gICAgaW5pdDogZnVuY3Rpb24odXBsb2FkZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fdXBsb2FkZXIgPSB1cGxvYWRlcjtcbiAgICAgICAgdGhpcy5fdGFyZ2V0ID0gb3B0aW9ucy5mb3JtVGFyZ2V0O1xuICAgICAgICB0aGlzLl91cmwgPSBvcHRpb25zLnVybDtcbiAgICAgICAgdGhpcy5faXNCYXRjaFRyYW5zZmVyID0gb3B0aW9ucy5pc0JhdGNoVHJhbnNmZXI7XG4gICAgICAgIHRoaXMuX2h0bWwgPSB0aGlzLl9zZXRIVE1MKG9wdGlvbnMudGVtcGxhdGUpO1xuXG4gICAgICAgIGlmIChpc1N1cHBvcnRGb3JtRGF0YSkge1xuICAgICAgICAgICAgdGhpcy5faXNNdWx0aXBsZSA9IG9wdGlvbnMuaXNNdWx0aXBsZTtcbiAgICAgICAgICAgIHRoaXMuX3VzZUZvbGRlciA9IG9wdGlvbnMudXNlRm9sZGVyO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3JlbmRlcigpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgaW5wdXQgYXJlYVxuICAgICAqL1xuICAgIF9yZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbCA9ICQodGhpcy5faHRtbC5mb3JtKTtcbiAgICAgICAgdGhpcy4kZWwuYXR0cih7XG4gICAgICAgICAgICBhY3Rpb246IHRoaXMuX3VybC5zZW5kLFxuICAgICAgICAgICAgbWV0aG9kOiAncG9zdCcsXG4gICAgICAgICAgICBlbmN0eXBlOiAnbXVsdGlwYXJ0L2Zvcm0tZGF0YScsXG4gICAgICAgICAgICB0YXJnZXQ6IGlzU3VwcG9ydEZvcm1EYXRhID8gJycgOiB0aGlzLl90YXJnZXRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy4kZmlsZUlucHV0ID0gdGhpcy5fY3JlYXRlRmlsZUlucHV0KCk7XG4gICAgICAgIHRoaXMuJGZpbGVJbnB1dC5hcHBlbmRUbyh0aGlzLiRlbCk7XG4gICAgICAgIGlmICh0aGlzLl9pc0JhdGNoVHJhbnNmZXIpIHtcbiAgICAgICAgICAgIHRoaXMuJHN1Ym1pdCA9IHRoaXMuX2NyZWF0ZVN1Ym1pdEVsZW1lbnQoKTtcbiAgICAgICAgICAgIHRoaXMuJHN1Ym1pdC5hcHBlbmRUbyh0aGlzLiRlbCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fdXBsb2FkZXIuJGVsLmFwcGVuZCh0aGlzLiRlbCk7XG4gICAgICAgIHRoaXMuX2FkZEV2ZW50KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBhbGwgb2YgaW5wdXQgZWxlbWVudHMgaHRtbCBzdHJpbmdzLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbdGVtcGxhdGVdIFRoZSB0ZW1wbGF0ZSBpcyBzZXQgZm9ybSBjdXN0b21lci5cbiAgICAgKiBAcmV0dXJuIHtvYmplY3R9IFRoZSBodG1sIHN0cmluZyBzZXQgZm9yIGlucHV0Vmlld1xuICAgICAqL1xuICAgIF9zZXRIVE1MOiBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuICAgICAgICBpZiAoIXRlbXBsYXRlKSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZSA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlucHV0OiB0ZW1wbGF0ZS5pbnB1dCB8fCBjb25zdHMuSFRNTC5pbnB1dCxcbiAgICAgICAgICAgIHN1Ym1pdDogdGVtcGxhdGUuc3VibWl0IHx8IGNvbnN0cy5IVE1MLnN1Ym1pdCxcbiAgICAgICAgICAgIGZvcm06IHRlbXBsYXRlLmZvcm0gfHwgY29uc3RzLkhUTUwuZm9ybVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2VzIGFuZCByZXR1cm5zIGpxdWVyeSBlbGVtZW50XG4gICAgICogQHJldHVybiB7alF1ZXJ5fSBUaGUganF1ZXJ5IG9iamVjdCB3cmFwcGluZyBvcmlnaW5hbCBpbnB1dCBlbGVtZW50XG4gICAgICovXG4gICAgX2NyZWF0ZUZpbGVJbnB1dDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtYXAgPSB7XG4gICAgICAgICAgICBtdWx0aXBsZTogdGhpcy5faXNNdWx0aXBsZSA/ICdtdWx0aXBsZScgOiAnJyxcbiAgICAgICAgICAgIGZpbGVGaWVsZDogdGhpcy5fdXBsb2FkZXIuZmlsZUZpZWxkLFxuICAgICAgICAgICAgd2Via2l0ZGlyZWN0b3J5OiB0aGlzLl91c2VGb2xkZXIgPyAnd2Via2l0ZGlyZWN0b3J5JyA6ICcnXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuICQodXRpbHMudGVtcGxhdGUobWFwLCB0aGlzLl9odG1sLmlucHV0KSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2VzIGFuZCByZXR1cm5zIGpxdWVyeSBlbGVtZW50XG4gICAgICogQHJldHVybiB7alF1ZXJ5fSBUaGUganF1ZXJ5IG9iamVjdCB3cmFwcGluZyBzdW1iaXQgYnV0dG9uIGVsZW1lbnRcbiAgICAgKi9cbiAgICBfY3JlYXRlU3VibWl0RWxlbWVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAkKHRoaXMuX2h0bWwuc3VibWl0KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgb25TdWJtaXRIYW5kbGVyO1xuICAgICAgICBpZiAodGhpcy5faXNCYXRjaFRyYW5zZmVyKSB7XG4gICAgICAgICAgICBpZiAoaXNTdXBwb3J0Rm9ybURhdGEpIHtcbiAgICAgICAgICAgICAgICBvblN1Ym1pdEhhbmRsZXIgPSB0dWkudXRpbC5iaW5kKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3VwbG9hZGVyLnN1Ym1pdCgpO1xuICAgICAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvblN1Ym1pdEhhbmRsZXIgPSB0dWkudXRpbC5iaW5kKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl91cGxvYWRlci5zdWJtaXQoKTtcbiAgICAgICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy4kZWwub24oJ3N1Ym1pdCcsIG9uU3VibWl0SGFuZGxlcik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fYWRkSW5wdXRFdmVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgaW5wdXQgZWxlbWVudCBjaGFuZ2UgZXZlbnQgYnkgc2VuZGluZyB0eXBlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkSW5wdXRFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGZpbGVJbnB1dC5vbignY2hhbmdlJywgdHVpLnV0aWwuYmluZCh0aGlzLm9uQ2hhbmdlLCB0aGlzKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50LUhhbmRsZSBmb3IgaW5wdXQgZWxlbWVudCBjaGFuZ2VcbiAgICAgKi9cbiAgICBvbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy4kZmlsZUlucHV0WzBdLnZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5maXJlKCdjaGFuZ2UnLCB7XG4gICAgICAgICAgICB0YXJnZXQ6IHRoaXNcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlc2V0IElucHV0IGVsZW1lbnQgdG8gc2F2ZSB3aG9sZSBpbnB1dD1maWxlIGVsZW1lbnQuXG4gICAgICovXG4gICAgcmVzZXRGaWxlSW5wdXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRmaWxlSW5wdXQucmVtb3ZlKCk7XG4gICAgICAgIHRoaXMuJGZpbGVJbnB1dCA9IHRoaXMuX2NyZWF0ZUZpbGVJbnB1dCgpO1xuICAgICAgICBpZiAodGhpcy4kc3VibWl0KSB7XG4gICAgICAgICAgICB0aGlzLiRzdWJtaXQuYmVmb3JlKHRoaXMuJGZpbGVJbnB1dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiRlbC5hcHBlbmQodGhpcy4kZmlsZUlucHV0KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hZGRJbnB1dEV2ZW50KCk7XG4gICAgfSxcblxuICAgIGNsZWFyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwuZmluZCgnLicgKyBISURERU5fRklMRV9JTlBVVF9DTEFTUykucmVtb3ZlKCk7XG4gICAgICAgIHRoaXMucmVzZXRGaWxlSW5wdXQoKTtcbiAgICB9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKElucHV0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbnB1dDtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBJdGVtVmlldyBtYWtlIGVsZW1lbnQgdG8gZGlzcGxheSBhZGRlZCBmaWxlIGluZm9ybWF0aW9uLiBJdCBoYXMgYXR0YWNoZWQgZmlsZSBJRCB0byByZXF1ZXN0IGZvciByZW1vdmUuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIGNvbnN0cyA9IHJlcXVpcmUoJy4uL2NvbnN0cycpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuLyoqXG4gKiBDbGFzcyBvZiBpdGVtIHRoYXQgaXMgbWVtYmVyIG9mIGZpbGUgbGlzdC5cbiAqIEBjbGFzcyBWaWV3Lkl0ZW1cbiAqL1xudmFyIEl0ZW0gPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFZpZXcuSXRlbS5wcm90b3R5cGUgKiovIHtcbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplIGl0ZW1cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xuICAgICAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5uYW1lIEZpbGUgbmFtZVxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy50eXBlIEZpbGUgdHlwZVxuICAgICAqICBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy5yb290IExpc3Qgb2JqZWN0XG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5pZF0gVW5pcXVlIGtleSwgd2hhdCBpZiB0aGUga2V5IGlzIG5vdCBleGlzdCBpZCB3aWxsIGJlIHRoZSBmaWxlIG5hbWUuXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5kZWxldGVCdXR0b25DbGFzc05hbWU9J3VwbG9hZGVyX2J0bl9kZWxldGUnXSBUaGUgY2xhc3MgbmFtZSBpcyBmb3IgZGVsZXRlIGJ1dHRvbi5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnRlbXBsYXRlXSBpdGVtIHRlbXBsYXRlXG4gICAgICogIEBwYXJhbSB7KHN0cmluZ3xudW1iZXIpfSBbb3B0aW9ucy5zaXplXSBGaWxlIHNpemUgKGJ1dCBpZSBsb3cgYnJvd3NlciwgeC1kb21haW4pXG4gICAgICovXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB0aGlzLl9zZXRSb290KG9wdGlvbnMpO1xuICAgICAgICB0aGlzLl9zZXRJdGVtSW5mbyhvcHRpb25zKTtcblxuICAgICAgICB0aGlzLnJlbmRlcihvcHRpb25zLnRlbXBsYXRlIHx8IGNvbnN0cy5IVE1MLml0ZW0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgcm9vdChMaXN0IG9iamVjdCkgaW5mb3JtYXRpb24uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgU2FtZSB3aXRoIGluaXQgb3B0aW9ucyBwYXJhbWV0ZXIuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0Um9vdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB0aGlzLl9yb290ID0gb3B0aW9ucy5yb290O1xuICAgICAgICB0aGlzLl8kcm9vdCA9IG9wdGlvbnMucm9vdC4kZWw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBmaWxlIGluZm9ybWF0aW9uLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFNhbWUgd2l0aCBpbml0IG9wdGlvbnMgcGFyYW1ldGVyLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldEl0ZW1JbmZvOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG9wdGlvbnMubmFtZTtcbiAgICAgICAgdGhpcy5pZCA9IG9wdGlvbnMuaWQgfHwgb3B0aW9ucy5uYW1lO1xuICAgICAgICB0aGlzLl90eXBlID0gb3B0aW9ucy50eXBlIHx8IHRoaXMuX2V4dHJhY3RFeHRlbnNpb24oKTtcbiAgICAgICAgdGhpcy5zaXplID0gb3B0aW9ucy5zaXplIHx8ICcnO1xuICAgICAgICB0aGlzLl9idG5DbGFzcyA9ICd1cGxvYWRlcl9idG5fZGVsZXRlJztcbiAgICAgICAgdGhpcy5fdW5pdCA9IG9wdGlvbnMudW5pdCB8fCAnS0InO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgbWFraW5nIGZvcm0gcGFkZGluZyB3aXRoIGRlbGV0YWJsZSBpdGVtXG4gICAgICogQHBhcmFtIHRlbXBsYXRlXG4gICAgICovXG4gICAgcmVuZGVyOiBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuICAgICAgICB2YXIgaHRtbCA9IHRoaXMuX2dldEh0bWwodGVtcGxhdGUpO1xuICAgICAgICB0aGlzLl8kZWwgPSAkKGh0bWwpO1xuICAgICAgICB0aGlzLl8kcm9vdC5hcHBlbmQodGhpcy5fJGVsKTtcbiAgICAgICAgdGhpcy5fYWRkRXZlbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXh0cmFjdCBmaWxlIGV4dGVuc2lvbiBieSBuYW1lXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9leHRyYWN0RXh0ZW5zaW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZS5zcGxpdCgnLicpLnBvcCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgaXRlbSBlbGVtZW4gSFRNTFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBodG1sIEhUTUwgdGVtcGxhdGVcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldEh0bWw6IGZ1bmN0aW9uKGh0bWwpIHtcbiAgICAgICAgdmFyIG1hcCA9IHtcbiAgICAgICAgICAgIGZpbGV0eXBlOiB0aGlzLl90eXBlLFxuICAgICAgICAgICAgZmlsZW5hbWU6IHRoaXMubmFtZSxcbiAgICAgICAgICAgIGZpbGVzaXplOiB0aGlzLnNpemUgPyB1dGlscy5nZXRGaWxlU2l6ZVdpdGhVbml0KHRoaXMuc2l6ZSkgOiAnJyxcbiAgICAgICAgICAgIGRlbGV0ZUJ1dHRvbkNsYXNzTmFtZTogdGhpcy5fYnRuQ2xhc3NcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdXRpbHMudGVtcGxhdGUobWFwLCBodG1sKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGVzdHJveSBpdGVtXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3JlbW92ZUV2ZW50KCk7XG4gICAgICAgIHRoaXMuXyRlbC5yZW1vdmUoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IGhhbmRsZXIgb24gZGVsZXRlIGJ1dHRvbi5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBxdWVyeSA9ICcuJyArIHRoaXMuX2J0bkNsYXNzLFxuICAgICAgICAgICAgJGRlbEJ0biA9IHRoaXMuXyRlbC5maW5kKHF1ZXJ5KTtcbiAgICAgICAgJGRlbEJ0bi5vbignY2xpY2snLCB0dWkudXRpbC5iaW5kKHRoaXMuX29uQ2xpY2tFdmVudCwgdGhpcykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZXZlbnQgaGFuZGxlciBmcm9tIGRlbGV0ZSBidXR0b24uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcXVlcnkgPSAnLicgKyB0aGlzLl9idG5DbGFzcyxcbiAgICAgICAgICAgICRkZWxCdG4gPSB0aGlzLl8kZWwuZmluZChxdWVyeSk7XG4gICAgICAgICRkZWxCdG4ub2ZmKCdjbGljaycpO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIEV2ZW50LWhhbmRsZSBmb3IgZGVsZXRlIGJ1dHRvbiBjbGlja2VkLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uQ2xpY2tFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZmlyZSgncmVtb3ZlJywge1xuICAgICAgICAgICAgbmFtZSA6IHRoaXMubmFtZSxcbiAgICAgICAgICAgIGlkIDogdGhpcy5pZCxcbiAgICAgICAgICAgIHR5cGU6ICdyZW1vdmUnXG4gICAgICAgIH0pO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oSXRlbSk7XG5cbm1vZHVsZS5leHBvcnRzID0gSXRlbTtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBGaWxlTGlzdFZpZXcgbWFuYWdlIGFuZCBkaXNwbGF5IGZpbGVzIHN0YXRlKGxpa2Ugc2l6ZSwgY291bnQpIGFuZCBsaXN0LlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbid1c2Ugc3RyaWN0JztcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG52YXIgSXRlbSA9IHJlcXVpcmUoJy4vaXRlbScpO1xuXG4vKipcbiAqIExpc3QgaGFzIGl0ZW1zLiBJdCBjYW4gYWRkIGFuZCByZW1vdmUgaXRlbSwgYW5kIGdldCB0b3RhbCB1c2FnZS5cbiAqIEBjbGFzcyBWaWV3Lkxpc3RcbiAqL1xudmFyIExpc3QgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFZpZXcuTGlzdC5wcm90b3R5cGUgKi97XG4gICAgaW5pdCA6IGZ1bmN0aW9uKG9wdGlvbnMsIHVwbG9hZGVyKSB7XG4gICAgICAgIHZhciBsaXN0SW5mbyA9IG9wdGlvbnMubGlzdEluZm87XG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTtcbiAgICAgICAgdGhpcy4kZWwgPSBsaXN0SW5mby5saXN0O1xuICAgICAgICB0aGlzLiRjb3VudGVyID0gbGlzdEluZm8uY291bnQ7XG4gICAgICAgIHRoaXMuJHNpemUgPSBsaXN0SW5mby5zaXplO1xuICAgICAgICB0aGlzLl91cGxvYWRlciA9IHVwbG9hZGVyO1xuXG4gICAgICAgIHR1aS51dGlsLmV4dGVuZCh0aGlzLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW0gbGlzdFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIC0gRmlsZSBpbmZvcm1hdGlvbihzKSB3aXRoIHR5cGVcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2RhdGEudHlwZV0gLSAncmVtb3ZlJyBvciBub3QuXG4gICAgICovXG4gICAgdXBkYXRlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGlmIChkYXRhLnR5cGUgPT09ICdyZW1vdmUnKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVGaWxlSXRlbShkYXRhKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2FkZEZpbGVJdGVtcyhkYXRhKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgaXRlbXMgdG90YWwgY291bnQsIHRvdGFsIHNpemUgaW5mb3JtYXRpb24uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtpbmZvXSBBIGluZm9ybWF0aW9uIHRvIHVwZGF0ZSBsaXN0LlxuICAgICAqICBAcGFyYW0ge2FycmF5fSBpbmZvLml0ZW1zIFRoZSBsaXN0IG9mIGZpbGUgaW5mb3JtYXRpb24uXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBpbmZvLnNpemUgVGhlIHRvdGFsIHNpemUuXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBpbmZvLmNvdW50IFRoZSBjb3VudCBvZiBmaWxlcy5cbiAgICAgKi9cbiAgICB1cGRhdGVUb3RhbEluZm86IGZ1bmN0aW9uKGluZm8pIHtcbiAgICAgICAgaWYgKGluZm8pIHtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVRvdGFsQ291bnQoaW5mby5jb3VudCk7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVUb3RhbFVzYWdlKGluZm8uc2l6ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVUb3RhbENvdW50KCk7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVUb3RhbFVzYWdlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW1zIHRvdGFsIGNvdW50IGFuZCByZWZyZXNoIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0geyhudW1iZXJ8c3RyaW5nKX0gW2NvdW50XSBUb3RhbCBmaWxlIGNvdW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfdXBkYXRlVG90YWxDb3VudDogZnVuY3Rpb24oY291bnQpIHtcbiAgICAgICAgaWYgKCF0dWkudXRpbC5pc0V4aXN0eShjb3VudCkpIHtcbiAgICAgICAgICAgIGNvdW50ID0gdGhpcy5pdGVtcy5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiRjb3VudGVyLmh0bWwoY291bnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgaXRlbXMgdG90YWwgc2l6ZSBhbmQgcmVmcmVzaCBlbGVtZW50XG4gICAgICogQHBhcmFtIHsobnVtYmVyfHN0cmluZyl9IFtzaXplXSBUb3RhbCBmaWxlcyBzaXplc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwZGF0ZVRvdGFsVXNhZ2U6IGZ1bmN0aW9uKHNpemUpIHtcbiAgICAgICAgaWYgKCF0dWkudXRpbC5pc0V4aXN0eShzaXplKSkge1xuICAgICAgICAgICAgc2l6ZSA9IHRoaXMuX2dldFN1bUFsbEl0ZW1Vc2FnZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0dWkudXRpbC5pc051bWJlcihzaXplKSAmJiAhaXNOYU4oc2l6ZSkpIHtcbiAgICAgICAgICAgIHNpemUgPSB1dGlscy5nZXRGaWxlU2l6ZVdpdGhVbml0KHNpemUpO1xuICAgICAgICAgICAgdGhpcy4kc2l6ZS5odG1sKHNpemUpO1xuICAgICAgICAgICAgdGhpcy4kc2l6ZS5zaG93KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiRzaXplLmhpZGUoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdW0gc2l6ZXMgb2YgYWxsIGl0ZW1zLlxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldFN1bUFsbEl0ZW1Vc2FnZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpdGVtcyA9IHRoaXMuaXRlbXMsXG4gICAgICAgICAgICB0b3RhbFVzYWdlID0gMDtcblxuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKGl0ZW1zLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICB0b3RhbFVzYWdlICs9IHBhcnNlRmxvYXQoaXRlbS5zaXplKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRvdGFsVXNhZ2U7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBmaWxlIGl0ZW1zXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHRhcmdldCBUYXJnZXQgaXRlbSBpbmZvcm1hdGlvbi5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRGaWxlSXRlbXM6IGZ1bmN0aW9uKHRhcmdldCkge1xuICAgICAgICBpZiAoIXR1aS51dGlsLmlzQXJyYXkodGFyZ2V0KSkge1xuICAgICAgICAgICAgdGFyZ2V0ID0gW3RhcmdldF07XG4gICAgICAgIH1cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaCh0YXJnZXQsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCh0aGlzLl9jcmVhdGVJdGVtKGRhdGEpKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBmaWxlIGl0ZW1cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgZmlsZSBuYW1lIHRvIHJlbW92ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbW92ZUZpbGVJdGVtOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBpZCA9IGRhdGEuaWQ7XG5cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaCh0aGlzLml0ZW1zLCBmdW5jdGlvbihpdGVtLCBpbmRleCkge1xuICAgICAgICAgICAgaWYgKGlkID09PSBpdGVtLmlkKSB7XG4gICAgICAgICAgICAgICAgaXRlbS5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIHRoaXMudXBkYXRlVG90YWxJbmZvKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBpdGVtIEJ5IERhdGFcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YVxuICAgICAqIEByZXR1cm5zIHtJdGVtfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NyZWF0ZUl0ZW06IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIGl0ZW0gPSBuZXcgSXRlbSh7XG4gICAgICAgICAgICByb290OiB0aGlzLFxuICAgICAgICAgICAgbmFtZTogZGF0YS5uYW1lLFxuICAgICAgICAgICAgc2l6ZTogZGF0YS5zaXplLFxuICAgICAgICAgICAgaWQ6IGRhdGEuaWRcbiAgICAgICAgfSk7XG4gICAgICAgIGl0ZW0ub24oJ3JlbW92ZScsIHRoaXMuX3JlbW92ZUZpbGUsIHRoaXMpO1xuICAgICAgICByZXR1cm4gaXRlbTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgUmVtb3ZlIEZpbGVcbiAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbW92ZUZpbGU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdGhpcy5maXJlKCdyZW1vdmUnLCBkYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgbGlzdFxuICAgICAqL1xuICAgIGNsZWFyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaCh0aGlzLml0ZW1zLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICBpdGVtLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuaXRlbXMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy51cGRhdGVUb3RhbEluZm8oKTtcbiAgICB9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKExpc3QpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IExpc3Q7XG4iXX0=
