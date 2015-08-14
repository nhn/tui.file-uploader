(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
ne.util.defineNamespace('ne.component.Uploader', require('./src/js/uploader.js'));


},{"./src/js/uploader.js":7}],2:[function(require,module,exports){
/**
 * @fileoverview This Connector make connection between FileManager and file server api at modern browser.<br>
 *     This Connector use ajax.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */

/**
 * The modules will be mixed in connector by type.
 */
var Ajax = {/** @lends ne.component.Uploader.Ajax */
    type: 'POST',
    /**
     * Request ajax by config to add files.
     * @param {object} config The configuration for ajax request
     *  @param {string} config.url Request url(upload url or remove url)
     *  @param {function} config.success Callback function when request suceess.
     *  @param {function} config.error Callback function when request faild.
     */
    addRequest: function(config, files) {
        var uploader = this._uploader,
				$form = uploader.inputView.$el,
            callback = ne.util.bind(this.successPadding, this, config.success);
    
		if (files) {
			this.formData = new FormData();
			this.formData.append(uploader.fileField, files);
		} else {
			this.formData = new FormData($form[0]);
		}
		$.ajax({
            url: this._uploader.url.send,
            type: this.type,
            data: this.formData,
            success: callback,
            processData: false,
            contentType: false,
            error: config.error
        });
    },

    /**
     * Preprocessing callback before callback run.
     * @param {function} callback Request Callback function
     * @param {object} response Response from server
     */
    successPadding: function(callback, response) {
        var json = JSON.parse(response),
            result = {};

        result.items = json.filelist;
        callback(result);
    },

    /**
     * Request ajax by config to remove file.
     * @param {object} config
     */
    removeRequest: function(config) {
        var callback = ne.util.bind(this.removePadding, this, config.success);
        $.ajax({
            url: this._uploader.url.remove,
            data: config.data,
            success: callback,
            error: config.error
        });
    },

    /**
     * Preprocessing response before callback run.
     * @param {function} callback Request Callback function
     * @param {object} response Response from server
     */
    removePadding: function(callback, response) {
        var json = JSON.parse(response),
            result = {};

        result.action = 'remove';
        result.name = decodeURIComponent(json.name);

        callback(result);
    }
};

module.exports = Ajax;
},{}],3:[function(require,module,exports){
/**
 * @fileoverview A Connector make connection between FileManager and file server API.<br> The Connector is interface.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */

var Ajax = require('./ajax');
var Jsonp = require('./jsonp');
var Local = require('./local');

/**
 * The connector class could connect with server and return server response to callback.
 */
var ModuleSets = {
    'ajax': Ajax,
    'jsonp': Jsonp,
    'local': Local
};

/**
 * This is Interface to be implemented by connectors
 */
var Connector = {
    /**
     * A interface removeRequest to implement
     * @param {object} options A information for delete file
     */
    removeRequest: function(options) {
        throw new Error('The interface removeRequest does not exist');
    },

    /**
     * A interface addRequest to implement
     * @param {object} options A information for add file
     */
    addRequest: function(options) {
        throw new Error('The interface addRequest does not exist');
    }

};

/**
 * The factory module for connectors.
 * Get each connector by each type.
 */
var Factory = {
    /**
     * Choose connector
     * @param uploader
     * @returns {{_uploader: *}}
     */
    getConnector: function(uploader) {
        var type = uploader.type.toLowerCase(),
            conn = {
                _uploader: uploader
            };
        ne.util.extend(conn, Connector, ModuleSets[type] || Local);
        return conn;
    }
};

module.exports = Factory;

},{"./ajax":2,"./jsonp":4,"./local":5}],4:[function(require,module,exports){
/**
 * @fileoverview This Connector make connection between FileManager and file server api at old browser.<br>
 *     This Connector use hidden iframe.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */

/**
 * The modules will be mixed in connector by type.
 */
var Jsonp = {/** @lends ne.component.Uploader.Jsonp */
    /**
     * Request by form submit.
     * @param {object} config Configuration for submit form.
     *  @param {function} config.success Callback when post submit complate.
     */
    addRequest: function(config) {
        var callbackName = this._uploader.callbackName,
        callback = config.success;
        ne.util.defineNamespace(callbackName,  ne.util.bind(this.successPadding, this, callback));

        this._uploader.inputView.$el.submit();
    },

    /**
     * Preprocessing response before callback run.
     * @param {function} callback Request Callback function
     * @param {object} response Response from server
     */
    successPadding: function(callback, response) {
        var result = {};

        if (this._uploader.isCrossDomain()) {
            result.items = this._getSplitItems(response);
        } else {
            result.items = response.filelist;
        }

        callback(result);
    },

    /**
     * Make query data to array
     * @param {object} data The Data extracted from querystring separated by '&'
     * @private
     */
    _getSplitItems: function(data) {
        var sep = this._uploader.separator,
            status = data.status.split(sep),
            names = data.names.split(sep),
            sizes = data.sizes.split(sep),
            ids = ne.util.isString(data.ids) ? data.ids.split(sep) : names,
            items = [];

        ne.util.forEach(status, function(item, index) {
            if (item === 'success') {
                var nItem = {
                    name: names[index],
                    status: status[index],
                    size: sizes[index],
                    id: ids[index]
                };
                items.push(nItem);
            }
        });
        return items;
    },

    /**
     * Request ajax by config to remove file.
     * @param {object} config
     */
    removeRequest: function(config) {
        var callbackName = this._uploader.callbackName,
            data = {
                callback: callbackName
            },
            callback = config.success;

        ne.util.defineNamespace(callbackName, ne.util.bind(this.removePadding, this, callback), true);

        $.ajax({
            url: this._uploader.url.remove,
            dataType: 'jsonp',
            jsonp: callbackName,
            data: ne.util.extend(data, config.data)
        });

    },

    /**
     * Preprocessing response before callback run.
     * @param {function} callback Request Callback function
     * @param {object} response Response from server
     */
    removePadding: function(callback, response) {
        var result = {};
        result.action = 'remove';
        result.name = decodeURIComponent(response.name);

        callback(result);
    }
};

module.exports = Jsonp;

},{}],5:[function(require,module,exports){
/**
 * @fileoveview This Connector make connection between Uploader and html5 file api.
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
var utils = require('../utils');

/**
 * The modules will be mixed in connector by type.
 */
var Local = {/** @lends ne.component.Uploader.Local */
    /**
     * A result array to save file to send.
     */
    _result : null,
    /**
     * Add Request, save files to array.
     * @param {object} data The data of connection for server
		 * @param {object} [files] The files to save
     */
    addRequest: function(data, files) {
        var isValidPool = utils.isSupportFormData(),
            result = this._saveFile(isValidPool, files);
        data.success({
            items: result
        });
    },

    /**
     * Save file to pool
     * @param {boolean} isSupportAjax Whether FormData is supported or not
		 * @param {object} [files] The files to save
     * @private
     */
    _saveFile: function(isSupportAjax, files) {
        var uploader = this._uploader,
            inputView = uploader.inputView,
            fileEl = inputView.$input[0],
						result = [];

        if (!this._result) {
            this._result = [];
        }

        if (isSupportAjax) {
					files = files || fileEl.fiels;
            ne.util.forEach(files, function(item) {
                if (ne.util.isObject(item)) {
                    result.push(item);
                }
            }, this);
        } else {
            result.push({
                name: fileEl.value,
                element: fileEl
            });
        }

        this._result = this._result.concat(result);

        return result;
    },

    /**
     * Make form data to send POST(FormDate supported case)
     * @returns {*}
     * @private
     */
    _makeFormData : function() {
        var field = this._uploader.fileField,
            form = new window.FormData();

        ne.util.forEach(this._result, function(item) {
            form.append(field, item);
        });
        return form;
    },

    /**
     * Remove file form result array
     * @param {object} info The information set to remove file
     */
    removeRequest: function(info) {
        var data = info.data;
        this._result = ne.util.filter(this._result, function(el) {
            return el.name !== data.filename;
        });

        info.success({
            action: 'remove',
            name: data.filename
        });
    },

    /**
     * Send files in a batch.
     * @param callback
     */
    submit: function(callback) {
        var form = this._makeFormData();
        $.ajax({
            url: this._uploader.url.send,
            type: 'POST',
            data: form,
            success: callback,
            processData: false,
            contentType: false
        });
    }
};

module.exports = Local;
},{"../utils":8}],6:[function(require,module,exports){
/**
 * @fileoverview Configuration or default values.
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */

/**
 * Configuration of connection with server.
  * @type {{RESPONSE_TYPE: string, REDIRECT_URL: string}}
 */
module.exports.CONF = {
    RESPONSE_TYPE: 'RESPONSE_TYPE',
    REDIRECT_URL: 'REDIRECT_URL',
    JSONPCALLBACK_NAME: 'CALLBACK_NAME',
    SIZE_UNIT: 'SIZE_UNIT',
    REMOVE_CALLBACK : 'responseRemoveCallback',
    ERROR: {
        DEFAULT: 'Unknown error.',
        NOT_SURPPORT: 'This is x-domain connection, you have to make helper page.'
    },
		DRAG_DEFAULT_ENABLE_CLASS: 'enableClass',
    FILE_FILED_NAME: 'userfile[]'
};

/**
 * Default Htmls
 * @type {{input: string, item: string}}
 */
module.exports.HTML = {
    form : ['<form enctype="multipart/form-data" id="formData" method="post">',
                '<input type="hidden" name="MAX_FILE_SIZE" value="3000000" />',
                '<input type="file" id="fileAttach" {{webkitdirectory}} name="{{fileField}}" {{multiple}} />',
                '<button class="batchSubmit" type="submit">SEND</button>',
            '</form>'].join(''),
    input: ['<input type="file" id="fileAttach" {{webkitdirectory}} name="{{fileField}}" {{multiple}}} />'].join(''),
    item : ['<li class="filetypeDisplayClass">',
                '<spna class="fileicon {{filetype}}">{{filetype}}</spna>',
                '<span class="file_name">{{filename}}</span>',
                '<span class="file_size">{{filesize}}</span>',
                '<button type="button" class="{{deleteButtonClassName}}">Delete</button>',
            '</li>'].join(''),
	drag: ['<div class="dragzone"></div>'].join('')
};

},{}],7:[function(require,module,exports){
/**
 * @fileoverview FileUploader is core of file uploader component.<br>FileManager manage connector to connect server and update FileListView.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */

var statics = require('./statics');
var utils = require('./utils');
var conn = require('./connector/connector');
var Input = require('./view/input');
var List = require('./view/list');
var Pool = require('./view/pool');
var DragAndDrop = require('./view/drag');

/**
 * FileUploader act like bridge between connector and view.
 * It makes connector and view with option and environment.
 * It control and make connection among modules.
 * @constructor ne.component.Uploader
 * @example
 * var uploader = new ne.component.Uploader({
 *     url: {
 *         send: "http://fe.nhnent.com/etc/etc/uploader/uploader.php",
 *         remove: "http://fe.nhnent.com/etc/etc/uploader/remove.php"
 *     },
 *     helper: {
 *         url: 'http://10.77.34.126:8009/samples/response.html',
 *         name: 'REDIRECT_URL'
 *     },
 *     resultTypeElementName: 'RESPONSE_TYPE',
 *     formTarget: 'hiddenFrame',
 *     callbackName: 'responseCallback',
 *     listInfo: {
 *         list: $('#files'),
 *         count: $('#file_count'),
 *         size: $('#size_count')
 *     },
 *     separator: ';'
 * }, $('#uploader'));
 */
var Uploader = ne.util.defineClass(/**@lends ne.component.Uploader.prototype */{

    /**
     * initialize options
     * @param {object} options The options to set up file uploader modules.
     *  @param {object} options.url The url is file server.
     *      @param {string} options.url.send The url is for file attach.
     *      @param {string} options.url.remove The url is for file detach.
     *  @param {object} options.helper The helper object info is for x-domain.
     *      @param {string} options.helper.url The url is helper page url.
     *      @param {string} options.helper.name The name of hidden element for sending server helper page information.
     *  @param {string} options.resultTypeElementName The type of hidden element for sending server response type information.
     *  @param {string} options.formTarget The target for x-domain jsonp case.
     *  @param {string} options.callbackName The name of jsonp callback function.
     *  @param {object} opitons.listInfo The element info to display file list information.
     *  @param {string} options.separator The separator for jsonp helper response.
     *  @param {string} [options.fileField=userFile] The field name of input file element.
     *  @param {boolean} options.useFolder Whether select unit is folder of not. If this is ture, multiple will be ignored.
     *  @param {boolean} options.isMultiple Whether enable multiple select or not.
     * @param {JqueryObject} $el Root Element of Uploader
     */
    init: function(options, $el) {
        this._setData(options);
        this._setConnector();

        this.$el = $el;

        if(this.useDrag && utils.isSupportFileSystem()) {
            this.dragView = new DragAndDrop(options, this);
        }

        this.inputView = new Input(options, this);
        this.listView = new List(options, this);

				this.fileField = this.fileField || statics.CONF.FILE_FILED_NAME;
        this._pool = new Pool(this.listView.$el[0]);
        this._addEvent();
    },

    /**
     * Set Connector by useJsonp flag and whether.
     * @private
     */
    _setConnector: function() {
        if (this.isBatchTransfer) {
            this.type = 'local';
        } else if (this.isCrossDomain()) {
            if (this.helper) {
                this.type = 'jsonp';
            } else {
                alert(statics.CONF.ERROR.NOT_SURPPORT);
            }
        } else {
            if (this.useJsonp || !utils.isSupportFormData()) {
                this.type = 'jsonp';
            } else {
                this.type = 'ajax';
            }
        }
        this._connector = conn.getConnector(this);
    },

    /**
     * Update list view with custom or original data.
     * @param {object} info The data for update list
     *  @param {string} info.action The action name to execute method
     */
    notify: function(info) {
        this.listView.update(info);
        this.listView.updateTotalInfo(info);
    },

    /**
     * Set field data by option values.
     * @param options
     */
    _setData: function(options) {
        ne.util.extend(this, options);
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
            message = statics.CONF.ERROR.DEFAULT;
        }
        alert(message);
    },

    /**
     * Callback for custom send event
     * @param {object} [data] The data include callback function for file clone
     */
    sendFile: function(data) {
        var callback = ne.util.bind(this.notify, this),
				files = data && data.files;

        this._connector.addRequest({
            type: 'add',
            success: function(result) {
                if (data && data.callback) {
                    data.callback(result);
                }
                callback(result);
            },
            error: this.errorCallback
        }, files);
    },

    /**
     * Callback for custom remove event
     * @param {object} data The data for remove file.
     */
    removeFile: function(data) {
        var callback = ne.util.bind(this.notify, this);
        this._connector.removeRequest({
            type: 'remove',
            data: data,
            success: callback
        });
    },

    /**
     * Submit for data submit to server
     */
    submit: function() {
        this._connector.submit(function() {
            // todo submit preprocess
        });
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
        return ne.util.map(files, function(file) {
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

        if(this.useDrag && this.dragView) {

            // @todo top 처리가 따로 필요함, sendFile 사용 안됨
            this.dragView.on('drop', this.sendFile, this);
        }
        if (this.isBatchTransfer) {
            this.inputView.on('save', this.sendFile, this);
            this.listView.on('remove', this.removeFile, this);
        } else {
            this.inputView.on('change', this.sendFile, this);
            this.listView.on('remove', this.removeFile, this);
        }
    },

    /**
     * Store input element to pool.
     * @param {HTMLElement} input A input element[type=file] for store pool
     */
    store: function(input) {
        this._pool.store(input);
    },

    /**
     * Remove input element form pool.
     * @param {string} name The file name to remove
     */
    remove: function(name) {
        if (!utils.isSupportFormData()) {
            this._pool.remove(name);
        }
    }
});

ne.util.CustomEvents.mixin(Uploader);
module.exports = Uploader;
},{"./connector/connector":3,"./statics":6,"./utils":8,"./view/drag":9,"./view/input":10,"./view/list":12,"./view/pool":13}],8:[function(require,module,exports){
/**
 * @fileoverview This file contain utility methods for uploader.
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */

/**
 * Extract unit for file size
 * @param {number} bytes A usage of file
 */
module.exports.getFileSizeWithUnit = function(bytes) {
    var units = ['B', 'KB', 'MB', 'GB', 'TB'],
        bytes = parseInt(bytes, 10),
        exp = Math.log(bytes) / Math.log(1024) | 0,
        result = (bytes / Math.pow(1024, exp)).toFixed(2);

    return result + units[exp];
};

/**
 * Whether the browser support FormData or not
 */
module.exports.isSupportFormData = function() {
    var FormData = (window.FormData || null);
    return !!FormData;
};

/**
 * Get item elemen HTML
 * @param {string} html HTML template
 * @returns {string}
 */
module.exports.template = function(map, html) {
    html = html.replace(/\{\{([^\}]+)\}\}/g, function(mstr, name) {
        return map[name];
    });
    return html;
};

/**
 * Check whether support file api or not
 * @returns {boolean}
 */
module.exports.isSupportFileSystem = function() {
    return !!(window.File && window.FileReader && window.FileList && window.Blob);
};
},{}],9:[function(require,module,exports){
/**
 * @fileoverview This file is about drag and drop file to send. Drag and drop is running via file api.
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */

var statics = require('../statics');
var utils = require('../utils');

/**
 * Makes drag and drop area, the dropped file is added via event drop event.
 * @class DragAndDrop
 */
var DragAndDrop = ne.util.defineClass({
	/**
	 * initialize DragAndDrop
	 */
	init: function(options, uploader) {
		var html = options.template && options.template.drag || statics.HTML.drag;
		this._enableClass = options.drag && options.drag.enableClass || statics.CONF.DRAG_DEFAULT_ENABLE_CLASS;
		this._render(html, uploader);
		this._addEvent();
	},

	/**
	 * Renders drag and drop area
	 * @param {string} html The html string to make darg zone
	 * @param {object} uploader The core instance of this component
	 */
	_render: function(html, uploader) {
		this.$el = $(html);
		uploader.$el.append(this.$el);
	},

	/**
	 * Adds drag and drop event
	 */
	_addEvent: function() {
		this.$el.on('dragenter', ne.util.bind(this.onDragEnter, this));
		this.$el.on('dragover', ne.util.bind(this.onDragOver, this));
		this.$el.on('drop', ne.util.bind(this.onDrop, this));
		this.$el.on('dragleave', ne.util.bind(this.onDragLeave, this));
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

ne.util.CustomEvents.mixin(DragAndDrop);

module.exports = DragAndDrop;

},{"../statics":6,"../utils":8}],10:[function(require,module,exports){
/**
 * @fileoverview InputView make input form by template. Add event file upload event.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */

var statics = require('../statics');
var utils = require('../utils');

/**
 * This view control input element typed file.
 * @constructor ne.component.FileUploader.InputView
 */
var Input = ne.util.defineClass(/**@lends ne.component.Uploader.Input.prototype **/{
    /**
     * Initialize input element.
     * @param {object} [options]
     */
    init: function(options, uploader) {

        this._uploader = uploader;
        this._target = options.formTarget;
        this._url = options.url;
        this._isBatchTransfer = options.isBatchTransfer;
        this._inputHTML = (options.template && options.template.input) || statics.HTML.input;
        this.html = (options.template && options.template.form) || statics.HTML.form;
        this._isMultiple = !!(utils.isSupportFormData() && options.isMultiple);
        this._useFolder = !!(utils.isSupportFormData() && options.useFolder);

        this._render();
        this._renderHiddenElements();

        if (options.helper) {
            this._makeBridgeInfoElement(options.helper);
        }

        this.$input = this.$el.find('input:file');
        this.$button = $('button[type=submit]');
        this._addEvent();
    },

    /**
     * Render input area
     * @private
     */
    _render: function() {
        this.$el = $(this._getHtml(this.html));
        this.$el.attr({
            action: this._url.send,
            method: 'post',
            enctype: "multipart/form-data",
            target: this._target
        });
        this._uploader.$el.append(this.$el);
    },

    /**
     * Get html string from template
     * @param {string} html The html to be converted.
     * @returns {string}
     * @private
     */
    _getHtml: function(html) {
        var map = {
            fileField: this._uploader.fileField,
            multiple: this._isMultiple ? 'multiple' : '',
            webkitdirectory: this._useFolder ? 'webkitdirectory' : ''
        };
        return utils.template(map, html);
    },

    /**
     * Call methods those make each hidden element.
     * @private
     */
    _renderHiddenElements: function() {
        this._makeTargetFrame();
        this._makeResultTypeElement();
        this._makeCallbackElement();
    },

    /**
     * Add event
     * @private
     */
    _addEvent: function() {
        var submit = this.$el.find('button:submit'),
            self = this;
        this.$el.on('submit', function() {
            self._uploader.submit();
            return false;
        });
        this._addInputEvent();
    },

    /**
     * Add input element change event by sending type
     * @private
     */
    _addInputEvent: function() {
        if (this._isBatchTransfer) {
            this.$input.on('change', ne.util.bind(this.onSave, this));
        } else {
            this.$input.on('change', ne.util.bind(this.onChange, this));
        }
    },

    /**
     * Event-Handle for input element change
     */
    onChange: function() {
        this.fire('change', {
            target: this
        });
    },

    /**
     * Event-Handle for save input element
     */
    onSave: function() {
        var saveCallback = !utils.isSupportFormData() ? ne.util.bind(this._resetInputElement, this) : null;
        this.fire('save', {
            element: this.$input[0],
            callback: saveCallback
        });
    },

    /**
     * Reset Input element to save whole input=file element.
     */
    _resetInputElement: function() {
        this.$input.off();
        this._clone(this.$input[0]);
        this.$input = $(this._getHtml(this._inputHTML));

        if (this.$button.length) {
            this.$button.before(this.$input);
        } else {
            this.$el.append(this.$input);
        }
        this._addInputEvent();
    },

    /**
     * Make element to be target of submit form form element.
     * @private
     */
    _makeTargetFrame: function() {
        this._$target = $('<iframe name="' + this._target + '"></iframe>');
        this._$target.css({
            visibility: 'hidden',
            position: 'absolute'
        });
        this._uploader.$el.append(this._$target);
    },

    /**
     * Make element to be callback function name
     * @private
     */
    _makeCallbackElement: function() {
        this._$callback = this._makeHiddenElement({
            'name': statics.CONF.JSONPCALLBACK_NAME,
            'value': this._uploader.callbackName
        });
        this.$el.append(this._$callback);
    },

    /**
     * Make element to know which type request
     * @private
     */
    _makeResultTypeElement: function() {
        this._$resType = this._makeHiddenElement({
            'name' : this._uploader.resultTypeElementName || statics.CONF.RESPONSE_TYPE,
            'value': this._uploader.type
        });
        this.$el.append(this._$resType);
    },

    /**
     * Make element that has redirect page information used by Server side.
     * @param {object} helper Redirection information for clear x-domain problem.
     * @private
     */
    _makeBridgeInfoElement: function(helper) {
        this._$helper = this._makeHiddenElement({
            'name' : helper.name || statics.CONF.REDIRECT_URL,
            'value': helper.url
        });
        this.$el.append(this._$helper);
    },

    /**
     * Make hidden input element with options
     * @param {object} options The opitons to be attribute of input
     * @returns {*|jQuery}
     * @private
     */
    _makeHiddenElement: function(options) {
        ne.util.extend(options, {
            type: 'hidden'
        });
        return $('<input />').attr(options);
    },

    /**
     * Ask uploader to save input element to pool
     * @param {HTMLElement} input A input element[type=file] for store pool
     */
    _clone: function(input) {
        input.file_name = input.value;
        this._uploader.store(input);
    }

});

ne.util.CustomEvents.mixin(Input);

module.exports = Input;
},{"../statics":6,"../utils":8}],11:[function(require,module,exports){
/**
 * @fileoverview ItemView make element to display added file information. It has attached file ID to request for remove.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */

var statics = require('../statics');
var utils = require('../utils');

/**
 * Class of item that is member of file list.
 * @constructor
 */
var Item = ne.util.defineClass(/** @lends ne.component.Uploader.Item.prototype **/ {
    /**
     * Initialize item
     * @param {object} options
     *  @param {string} options.name File name
     *  @param {string} options.type File type
     *  @param {object} options.root List object
     *  @param {string} options.hiddenFrame The iframe name will be target of form submit.
     *  @param {string} options.url The url for form action to submet.
     *  @param {string} [options.id] Unique key, what if the key is not exist id will be the file name.
     *  @param {string} [options.hiddenFieldName] The name of hidden filed. The hidden field is for connecting x-domian.
     *  @param {string} [options.deleteButtonClassName='uploader_btn_delete'] The class name is for delete button.
     *  @param {(string|number)} [options.size] File size (but ie low browser, x-domain)
     *  @param {object} [options.helper] The helper page info.
     */
    init: function(options) {

        this._setRoot(options);
        this._setItemInfo(options);
        this._setConnectInfo(options);

        this.render(options.template || statics.HTML.item);

        if (options.helper) {
            this._makeBridgeInfoElement(options.helper);
        }
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
     */
    _setItemInfo: function(options) {
        this.name = options.name;
        this._type = options.type || this._extractExtension();
        this._id = options.id || options.name;
        this.size = options.size || '';
        this._btnClass = options.deleteButtonClassName || 'uploader_btn_delete';
        this._unit = options.unit || 'KB';
    },

    /**
     * Set connect element information.
     * @param {object} options Same with init options parameter.
     * @private
     */
    _setConnectInfo: function(options) {
        this._url = options.url;
        this._hiddenInputName = options.hiddenFieldName || 'filename';
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
     * Make element that has redirect page information used by Server side.
     * @param {object} helper Redirection helper page information for clear x-domain problem.
     * @private
     */
    _makeBridgeInfoElement: function(helper) {
        this.$helper = $('<input />');
        this.$helper.attr({
            'name' : helper.name,
            'value': helper.url
        });
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
     * Destory item
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
        $delBtn.on('click', ne.util.bind(this._onClickEvent, this));
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
            filename : this.name,
            id : this._id,
            type: 'remove'
        });
    }
});

ne.util.CustomEvents.mixin(Item);

module.exports = Item;
},{"../statics":6,"../utils":8}],12:[function(require,module,exports){
/**
 * @fileoverview FileListView manage and display files state(like size, count) and list.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */

var utils = require('../utils');
var Item = require('./item');

/**
 * List has items. It can add and remove item, and get total usage.
 * @constructor
 */
var List = ne.util.defineClass(/** @lends ne.component.Uploader.List.prototype */{
    init : function(options, uploader) {
        var listInfo = options.listInfo;
        this.items = [];
        this.$el = listInfo.list;
        this.$counter = listInfo.count;
        this.$size = listInfo.size;
        this._uploader = uploader;

        ne.util.extend(this, options);
    },

    /**
     * Update item list
     * @param {object} info A information to update list.
     *  @param {array} info.items The list of file information.
     *  @param {string} [info.action] The action to do.
     */
    update: function(info) {
        if (info.action === 'remove') {
            this._removeFileItem(info.name);
        } else {
            this._addFileItems(info.items);
        }
    },

    /**
     * Update items total count, total size information.
     * @param {object} info A information to update list.
     *  @param {array} info.items The list of file information.
     *  @param {string} info.size The total size.
     *  @param {string} info.count The count of files.
     */
    updateTotalInfo: function(info) {
        this._updateTotalCount(info.count);
        if (utils.isSupportFormData()) {
            this._updateTotalUsage(info.size);
        }
    },

    /**
     * Update items total count and refresh element
     * @param {(number|string)} [count] Total file count
     * @private
     */
    _updateTotalCount: function(count) {

        if (!ne.util.isExisty(count)) {
            count = this.items.length;
        }

        this.$counter.html(count);
    },

    /**
     * Update items total size and refresh element
     * @param {(number|string)} size Total files sizes
     * @private
     */
    _updateTotalUsage: function(size) {

        if (!ne.util.isExisty(size)) {
            size = this._getSumAllItemUsage();
        }
        size = utils.getFileSizeWithUnit(size);
        this.$size.html(size);
    },

    /**
     * Sum sizes of all items.
     * @returns {*}
     * @private
     */
    _getSumAllItemUsage: function() {
        var items = this.items,
            totalUsage = 0;

        ne.util.forEach(items, function(item) {
            totalUsage += parseFloat(item.size);
        });

        return totalUsage;
    },

    /**
     * Add file items
     * @param {object} target Target item infomations.
     * @private
     */
    _addFileItems: function(target) {
        if (!ne.util.isArray(target)) {
            target = [target];
        }
        ne.util.forEach(target, function(data) {
            this.items.push(this._createItem(data));
        }, this);
    },

    /**
     * Remove file item
     * @param {string} name The file name to remove
     * @private
     */
    _removeFileItem: function(name) {
        name = decodeURIComponent(name);
        this.items = ne.util.filter(this.items, function(item) {
            var isMatch = name === decodeURIComponent(item.name);
            if (isMatch) {
                item.destroy();
                this._uploader.remove(name);
            }
            return !isMatch;
        }, this);
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
            deleteButtonClassName: this.deleteButtonClassName,
            url: this.url,
            hiddenFrame: this.formTarget,
            hiddenFieldName: this.hiddenFieldName,
            template: this.template && this.template.item
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
    }
});

ne.util.CustomEvents.mixin(List);

module.exports = List;
},{"../utils":8,"./item":11}],13:[function(require,module,exports){
/**
 * @fileoverview This is manager of input elements that act like file pool.
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */

/**
 * The pool for save files.
 * It's only for input[file] element save at browser that does not support file api.
 * @type {*}
 */
var Pool = ne.util.defineClass(/** @lends ne.component.Uploader.Pool.prototype */{
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
         * File data structure object(key=name : value=iuput elmeent);
         * @type {object}
         */
        this.files = {};
        /**
         * Acts pool to save input element
         * @type {DocumentFragment}
         */
        this.frag = document.createDocumentFragment();
    },

    /**
     * Save a input element[type=file], as value of file name.
     * @param {object} file A input element that have to be saved
     */
    store: function(file) {
        this.files[file.file_name] = file;
        this.frag.appendChild(file);
    },

    /**
     * Remove a input element[type=file] from pool.
     * @param {string} name A file name that have to be removed.
     */
    remove: function(name) {
        this.frag.removeChild(this.files[name]);
        delete this.files[name];
    },

    /**
     * Empty pool
     */
    empty: function() {
        ne.util.forEach(this.files, function(data) {
            this.remove(data.file_name);
        }, this);
    },

    /**
     * Plant files on pool to form input
     */
    plant: function() {
        var planet = this.planet;
        ne.util.forEach(this.files, function(data) {
            planet.appendChild(data);
            delete this.files[data.file_name];
        }, this);
    }
});

module.exports = Pool;
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25uZWN0b3IvYWpheC5qcyIsInNyYy9qcy9jb25uZWN0b3IvY29ubmVjdG9yLmpzIiwic3JjL2pzL2Nvbm5lY3Rvci9qc29ucC5qcyIsInNyYy9qcy9jb25uZWN0b3IvbG9jYWwuanMiLCJzcmMvanMvc3RhdGljcy5qcyIsInNyYy9qcy91cGxvYWRlci5qcyIsInNyYy9qcy91dGlscy5qcyIsInNyYy9qcy92aWV3L2RyYWcuanMiLCJzcmMvanMvdmlldy9pbnB1dC5qcyIsInNyYy9qcy92aWV3L2l0ZW0uanMiLCJzcmMvanMvdmlldy9saXN0LmpzIiwic3JjL2pzL3ZpZXcvcG9vbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJuZS51dGlsLmRlZmluZU5hbWVzcGFjZSgnbmUuY29tcG9uZW50LlVwbG9hZGVyJywgcmVxdWlyZSgnLi9zcmMvanMvdXBsb2FkZXIuanMnKSk7XG5cbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIENvbm5lY3RvciBtYWtlIGNvbm5lY3Rpb24gYmV0d2VlbiBGaWxlTWFuYWdlciBhbmQgZmlsZSBzZXJ2ZXIgYXBpIGF0IG1vZGVybiBicm93c2VyLjxicj5cbiAqICAgICBUaGlzIENvbm5lY3RvciB1c2UgYWpheC5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbi8qKlxuICogVGhlIG1vZHVsZXMgd2lsbCBiZSBtaXhlZCBpbiBjb25uZWN0b3IgYnkgdHlwZS5cbiAqL1xudmFyIEFqYXggPSB7LyoqIEBsZW5kcyBuZS5jb21wb25lbnQuVXBsb2FkZXIuQWpheCAqL1xuICAgIHR5cGU6ICdQT1NUJyxcbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGFqYXggYnkgY29uZmlnIHRvIGFkZCBmaWxlcy5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gY29uZmlnIFRoZSBjb25maWd1cmF0aW9uIGZvciBhamF4IHJlcXVlc3RcbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy51cmwgUmVxdWVzdCB1cmwodXBsb2FkIHVybCBvciByZW1vdmUgdXJsKVxuICAgICAqICBAcGFyYW0ge2Z1bmN0aW9ufSBjb25maWcuc3VjY2VzcyBDYWxsYmFjayBmdW5jdGlvbiB3aGVuIHJlcXVlc3Qgc3VjZWVzcy5cbiAgICAgKiAgQHBhcmFtIHtmdW5jdGlvbn0gY29uZmlnLmVycm9yIENhbGxiYWNrIGZ1bmN0aW9uIHdoZW4gcmVxdWVzdCBmYWlsZC5cbiAgICAgKi9cbiAgICBhZGRSZXF1ZXN0OiBmdW5jdGlvbihjb25maWcsIGZpbGVzKSB7XG4gICAgICAgIHZhciB1cGxvYWRlciA9IHRoaXMuX3VwbG9hZGVyLFxuXHRcdFx0XHQkZm9ybSA9IHVwbG9hZGVyLmlucHV0Vmlldy4kZWwsXG4gICAgICAgICAgICBjYWxsYmFjayA9IG5lLnV0aWwuYmluZCh0aGlzLnN1Y2Nlc3NQYWRkaW5nLCB0aGlzLCBjb25maWcuc3VjY2Vzcyk7XG4gICAgXG5cdFx0aWYgKGZpbGVzKSB7XG5cdFx0XHR0aGlzLmZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG5cdFx0XHR0aGlzLmZvcm1EYXRhLmFwcGVuZCh1cGxvYWRlci5maWxlRmllbGQsIGZpbGVzKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5mb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgkZm9ybVswXSk7XG5cdFx0fVxuXHRcdCQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHRoaXMuX3VwbG9hZGVyLnVybC5zZW5kLFxuICAgICAgICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgICAgICAgZGF0YTogdGhpcy5mb3JtRGF0YSxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGNhbGxiYWNrLFxuICAgICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6IGNvbmZpZy5lcnJvclxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJlcHJvY2Vzc2luZyBjYWxsYmFjayBiZWZvcmUgY2FsbGJhY2sgcnVuLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFJlcXVlc3QgQ2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgUmVzcG9uc2UgZnJvbSBzZXJ2ZXJcbiAgICAgKi9cbiAgICBzdWNjZXNzUGFkZGluZzogZnVuY3Rpb24oY2FsbGJhY2ssIHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciBqc29uID0gSlNPTi5wYXJzZShyZXNwb25zZSksXG4gICAgICAgICAgICByZXN1bHQgPSB7fTtcblxuICAgICAgICByZXN1bHQuaXRlbXMgPSBqc29uLmZpbGVsaXN0O1xuICAgICAgICBjYWxsYmFjayhyZXN1bHQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGFqYXggYnkgY29uZmlnIHRvIHJlbW92ZSBmaWxlLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWdcbiAgICAgKi9cbiAgICByZW1vdmVSZXF1ZXN0OiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gbmUudXRpbC5iaW5kKHRoaXMucmVtb3ZlUGFkZGluZywgdGhpcywgY29uZmlnLnN1Y2Nlc3MpO1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiB0aGlzLl91cGxvYWRlci51cmwucmVtb3ZlLFxuICAgICAgICAgICAgZGF0YTogY29uZmlnLmRhdGEsXG4gICAgICAgICAgICBzdWNjZXNzOiBjYWxsYmFjayxcbiAgICAgICAgICAgIGVycm9yOiBjb25maWcuZXJyb3JcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByZXByb2Nlc3NpbmcgcmVzcG9uc2UgYmVmb3JlIGNhbGxiYWNrIHJ1bi5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBSZXF1ZXN0IENhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIFJlc3BvbnNlIGZyb20gc2VydmVyXG4gICAgICovXG4gICAgcmVtb3ZlUGFkZGluZzogZnVuY3Rpb24oY2FsbGJhY2ssIHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciBqc29uID0gSlNPTi5wYXJzZShyZXNwb25zZSksXG4gICAgICAgICAgICByZXN1bHQgPSB7fTtcblxuICAgICAgICByZXN1bHQuYWN0aW9uID0gJ3JlbW92ZSc7XG4gICAgICAgIHJlc3VsdC5uYW1lID0gZGVjb2RlVVJJQ29tcG9uZW50KGpzb24ubmFtZSk7XG5cbiAgICAgICAgY2FsbGJhY2socmVzdWx0KTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFqYXg7IiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEEgQ29ubmVjdG9yIG1ha2UgY29ubmVjdGlvbiBiZXR3ZWVuIEZpbGVNYW5hZ2VyIGFuZCBmaWxlIHNlcnZlciBBUEkuPGJyPiBUaGUgQ29ubmVjdG9yIGlzIGludGVyZmFjZS5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbnZhciBBamF4ID0gcmVxdWlyZSgnLi9hamF4Jyk7XG52YXIgSnNvbnAgPSByZXF1aXJlKCcuL2pzb25wJyk7XG52YXIgTG9jYWwgPSByZXF1aXJlKCcuL2xvY2FsJyk7XG5cbi8qKlxuICogVGhlIGNvbm5lY3RvciBjbGFzcyBjb3VsZCBjb25uZWN0IHdpdGggc2VydmVyIGFuZCByZXR1cm4gc2VydmVyIHJlc3BvbnNlIHRvIGNhbGxiYWNrLlxuICovXG52YXIgTW9kdWxlU2V0cyA9IHtcbiAgICAnYWpheCc6IEFqYXgsXG4gICAgJ2pzb25wJzogSnNvbnAsXG4gICAgJ2xvY2FsJzogTG9jYWxcbn07XG5cbi8qKlxuICogVGhpcyBpcyBJbnRlcmZhY2UgdG8gYmUgaW1wbGVtZW50ZWQgYnkgY29ubmVjdG9yc1xuICovXG52YXIgQ29ubmVjdG9yID0ge1xuICAgIC8qKlxuICAgICAqIEEgaW50ZXJmYWNlIHJlbW92ZVJlcXVlc3QgdG8gaW1wbGVtZW50XG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgQSBpbmZvcm1hdGlvbiBmb3IgZGVsZXRlIGZpbGVcbiAgICAgKi9cbiAgICByZW1vdmVSZXF1ZXN0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGludGVyZmFjZSByZW1vdmVSZXF1ZXN0IGRvZXMgbm90IGV4aXN0Jyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEEgaW50ZXJmYWNlIGFkZFJlcXVlc3QgdG8gaW1wbGVtZW50XG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgQSBpbmZvcm1hdGlvbiBmb3IgYWRkIGZpbGVcbiAgICAgKi9cbiAgICBhZGRSZXF1ZXN0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGludGVyZmFjZSBhZGRSZXF1ZXN0IGRvZXMgbm90IGV4aXN0Jyk7XG4gICAgfVxuXG59O1xuXG4vKipcbiAqIFRoZSBmYWN0b3J5IG1vZHVsZSBmb3IgY29ubmVjdG9ycy5cbiAqIEdldCBlYWNoIGNvbm5lY3RvciBieSBlYWNoIHR5cGUuXG4gKi9cbnZhciBGYWN0b3J5ID0ge1xuICAgIC8qKlxuICAgICAqIENob29zZSBjb25uZWN0b3JcbiAgICAgKiBAcGFyYW0gdXBsb2FkZXJcbiAgICAgKiBAcmV0dXJucyB7e191cGxvYWRlcjogKn19XG4gICAgICovXG4gICAgZ2V0Q29ubmVjdG9yOiBmdW5jdGlvbih1cGxvYWRlcikge1xuICAgICAgICB2YXIgdHlwZSA9IHVwbG9hZGVyLnR5cGUudG9Mb3dlckNhc2UoKSxcbiAgICAgICAgICAgIGNvbm4gPSB7XG4gICAgICAgICAgICAgICAgX3VwbG9hZGVyOiB1cGxvYWRlclxuICAgICAgICAgICAgfTtcbiAgICAgICAgbmUudXRpbC5leHRlbmQoY29ubiwgQ29ubmVjdG9yLCBNb2R1bGVTZXRzW3R5cGVdIHx8IExvY2FsKTtcbiAgICAgICAgcmV0dXJuIGNvbm47XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBGYWN0b3J5O1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgQ29ubmVjdG9yIG1ha2UgY29ubmVjdGlvbiBiZXR3ZWVuIEZpbGVNYW5hZ2VyIGFuZCBmaWxlIHNlcnZlciBhcGkgYXQgb2xkIGJyb3dzZXIuPGJyPlxuICogICAgIFRoaXMgQ29ubmVjdG9yIHVzZSBoaWRkZW4gaWZyYW1lLlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxuLyoqXG4gKiBUaGUgbW9kdWxlcyB3aWxsIGJlIG1peGVkIGluIGNvbm5lY3RvciBieSB0eXBlLlxuICovXG52YXIgSnNvbnAgPSB7LyoqIEBsZW5kcyBuZS5jb21wb25lbnQuVXBsb2FkZXIuSnNvbnAgKi9cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGJ5IGZvcm0gc3VibWl0LlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWcgQ29uZmlndXJhdGlvbiBmb3Igc3VibWl0IGZvcm0uXG4gICAgICogIEBwYXJhbSB7ZnVuY3Rpb259IGNvbmZpZy5zdWNjZXNzIENhbGxiYWNrIHdoZW4gcG9zdCBzdWJtaXQgY29tcGxhdGUuXG4gICAgICovXG4gICAgYWRkUmVxdWVzdDogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICAgIHZhciBjYWxsYmFja05hbWUgPSB0aGlzLl91cGxvYWRlci5jYWxsYmFja05hbWUsXG4gICAgICAgIGNhbGxiYWNrID0gY29uZmlnLnN1Y2Nlc3M7XG4gICAgICAgIG5lLnV0aWwuZGVmaW5lTmFtZXNwYWNlKGNhbGxiYWNrTmFtZSwgIG5lLnV0aWwuYmluZCh0aGlzLnN1Y2Nlc3NQYWRkaW5nLCB0aGlzLCBjYWxsYmFjaykpO1xuXG4gICAgICAgIHRoaXMuX3VwbG9hZGVyLmlucHV0Vmlldy4kZWwuc3VibWl0KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByZXByb2Nlc3NpbmcgcmVzcG9uc2UgYmVmb3JlIGNhbGxiYWNrIHJ1bi5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBSZXF1ZXN0IENhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIFJlc3BvbnNlIGZyb20gc2VydmVyXG4gICAgICovXG4gICAgc3VjY2Vzc1BhZGRpbmc6IGZ1bmN0aW9uKGNhbGxiYWNrLCByZXNwb25zZSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0ge307XG5cbiAgICAgICAgaWYgKHRoaXMuX3VwbG9hZGVyLmlzQ3Jvc3NEb21haW4oKSkge1xuICAgICAgICAgICAgcmVzdWx0Lml0ZW1zID0gdGhpcy5fZ2V0U3BsaXRJdGVtcyhyZXNwb25zZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQuaXRlbXMgPSByZXNwb25zZS5maWxlbGlzdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNhbGxiYWNrKHJlc3VsdCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2UgcXVlcnkgZGF0YSB0byBhcnJheVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIFRoZSBEYXRhIGV4dHJhY3RlZCBmcm9tIHF1ZXJ5c3RyaW5nIHNlcGFyYXRlZCBieSAnJidcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRTcGxpdEl0ZW1zOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBzZXAgPSB0aGlzLl91cGxvYWRlci5zZXBhcmF0b3IsXG4gICAgICAgICAgICBzdGF0dXMgPSBkYXRhLnN0YXR1cy5zcGxpdChzZXApLFxuICAgICAgICAgICAgbmFtZXMgPSBkYXRhLm5hbWVzLnNwbGl0KHNlcCksXG4gICAgICAgICAgICBzaXplcyA9IGRhdGEuc2l6ZXMuc3BsaXQoc2VwKSxcbiAgICAgICAgICAgIGlkcyA9IG5lLnV0aWwuaXNTdHJpbmcoZGF0YS5pZHMpID8gZGF0YS5pZHMuc3BsaXQoc2VwKSA6IG5hbWVzLFxuICAgICAgICAgICAgaXRlbXMgPSBbXTtcblxuICAgICAgICBuZS51dGlsLmZvckVhY2goc3RhdHVzLCBmdW5jdGlvbihpdGVtLCBpbmRleCkge1xuICAgICAgICAgICAgaWYgKGl0ZW0gPT09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgICAgIHZhciBuSXRlbSA9IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogbmFtZXNbaW5kZXhdLFxuICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IHN0YXR1c1tpbmRleF0sXG4gICAgICAgICAgICAgICAgICAgIHNpemU6IHNpemVzW2luZGV4XSxcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGlkc1tpbmRleF1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGl0ZW1zLnB1c2gobkl0ZW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGl0ZW1zO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGFqYXggYnkgY29uZmlnIHRvIHJlbW92ZSBmaWxlLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWdcbiAgICAgKi9cbiAgICByZW1vdmVSZXF1ZXN0OiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrTmFtZSA9IHRoaXMuX3VwbG9hZGVyLmNhbGxiYWNrTmFtZSxcbiAgICAgICAgICAgIGRhdGEgPSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrTmFtZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNhbGxiYWNrID0gY29uZmlnLnN1Y2Nlc3M7XG5cbiAgICAgICAgbmUudXRpbC5kZWZpbmVOYW1lc3BhY2UoY2FsbGJhY2tOYW1lLCBuZS51dGlsLmJpbmQodGhpcy5yZW1vdmVQYWRkaW5nLCB0aGlzLCBjYWxsYmFjayksIHRydWUpO1xuXG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHRoaXMuX3VwbG9hZGVyLnVybC5yZW1vdmUsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb25wJyxcbiAgICAgICAgICAgIGpzb25wOiBjYWxsYmFja05hbWUsXG4gICAgICAgICAgICBkYXRhOiBuZS51dGlsLmV4dGVuZChkYXRhLCBjb25maWcuZGF0YSlcbiAgICAgICAgfSk7XG5cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJlcHJvY2Vzc2luZyByZXNwb25zZSBiZWZvcmUgY2FsbGJhY2sgcnVuLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFJlcXVlc3QgQ2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgUmVzcG9uc2UgZnJvbSBzZXJ2ZXJcbiAgICAgKi9cbiAgICByZW1vdmVQYWRkaW5nOiBmdW5jdGlvbihjYWxsYmFjaywgcmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgICByZXN1bHQuYWN0aW9uID0gJ3JlbW92ZSc7XG4gICAgICAgIHJlc3VsdC5uYW1lID0gZGVjb2RlVVJJQ29tcG9uZW50KHJlc3BvbnNlLm5hbWUpO1xuXG4gICAgICAgIGNhbGxiYWNrKHJlc3VsdCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBKc29ucDtcbiIsIi8qKlxuICogQGZpbGVvdmV2aWV3IFRoaXMgQ29ubmVjdG9yIG1ha2UgY29ubmVjdGlvbiBiZXR3ZWVuIFVwbG9hZGVyIGFuZCBodG1sNSBmaWxlIGFwaS5cbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG4vKipcbiAqIFRoZSBtb2R1bGVzIHdpbGwgYmUgbWl4ZWQgaW4gY29ubmVjdG9yIGJ5IHR5cGUuXG4gKi9cbnZhciBMb2NhbCA9IHsvKiogQGxlbmRzIG5lLmNvbXBvbmVudC5VcGxvYWRlci5Mb2NhbCAqL1xuICAgIC8qKlxuICAgICAqIEEgcmVzdWx0IGFycmF5IHRvIHNhdmUgZmlsZSB0byBzZW5kLlxuICAgICAqL1xuICAgIF9yZXN1bHQgOiBudWxsLFxuICAgIC8qKlxuICAgICAqIEFkZCBSZXF1ZXN0LCBzYXZlIGZpbGVzIHRvIGFycmF5LlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIFRoZSBkYXRhIG9mIGNvbm5lY3Rpb24gZm9yIHNlcnZlclxuXHRcdCAqIEBwYXJhbSB7b2JqZWN0fSBbZmlsZXNdIFRoZSBmaWxlcyB0byBzYXZlXG4gICAgICovXG4gICAgYWRkUmVxdWVzdDogZnVuY3Rpb24oZGF0YSwgZmlsZXMpIHtcbiAgICAgICAgdmFyIGlzVmFsaWRQb29sID0gdXRpbHMuaXNTdXBwb3J0Rm9ybURhdGEoKSxcbiAgICAgICAgICAgIHJlc3VsdCA9IHRoaXMuX3NhdmVGaWxlKGlzVmFsaWRQb29sLCBmaWxlcyk7XG4gICAgICAgIGRhdGEuc3VjY2Vzcyh7XG4gICAgICAgICAgICBpdGVtczogcmVzdWx0XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTYXZlIGZpbGUgdG8gcG9vbFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNTdXBwb3J0QWpheCBXaGV0aGVyIEZvcm1EYXRhIGlzIHN1cHBvcnRlZCBvciBub3Rcblx0XHQgKiBAcGFyYW0ge29iamVjdH0gW2ZpbGVzXSBUaGUgZmlsZXMgdG8gc2F2ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NhdmVGaWxlOiBmdW5jdGlvbihpc1N1cHBvcnRBamF4LCBmaWxlcykge1xuICAgICAgICB2YXIgdXBsb2FkZXIgPSB0aGlzLl91cGxvYWRlcixcbiAgICAgICAgICAgIGlucHV0VmlldyA9IHVwbG9hZGVyLmlucHV0VmlldyxcbiAgICAgICAgICAgIGZpbGVFbCA9IGlucHV0Vmlldy4kaW5wdXRbMF0sXG5cdFx0XHRcdFx0XHRyZXN1bHQgPSBbXTtcblxuICAgICAgICBpZiAoIXRoaXMuX3Jlc3VsdCkge1xuICAgICAgICAgICAgdGhpcy5fcmVzdWx0ID0gW107XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNTdXBwb3J0QWpheCkge1xuXHRcdFx0XHRcdGZpbGVzID0gZmlsZXMgfHwgZmlsZUVsLmZpZWxzO1xuICAgICAgICAgICAgbmUudXRpbC5mb3JFYWNoKGZpbGVzLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5lLnV0aWwuaXNPYmplY3QoaXRlbSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goaXRlbSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaCh7XG4gICAgICAgICAgICAgICAgbmFtZTogZmlsZUVsLnZhbHVlLFxuICAgICAgICAgICAgICAgIGVsZW1lbnQ6IGZpbGVFbFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9yZXN1bHQgPSB0aGlzLl9yZXN1bHQuY29uY2F0KHJlc3VsdCk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSBmb3JtIGRhdGEgdG8gc2VuZCBQT1NUKEZvcm1EYXRlIHN1cHBvcnRlZCBjYXNlKVxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX21ha2VGb3JtRGF0YSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZmllbGQgPSB0aGlzLl91cGxvYWRlci5maWxlRmllbGQsXG4gICAgICAgICAgICBmb3JtID0gbmV3IHdpbmRvdy5Gb3JtRGF0YSgpO1xuXG4gICAgICAgIG5lLnV0aWwuZm9yRWFjaCh0aGlzLl9yZXN1bHQsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIGZvcm0uYXBwZW5kKGZpZWxkLCBpdGVtKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBmb3JtO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZmlsZSBmb3JtIHJlc3VsdCBhcnJheVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBpbmZvIFRoZSBpbmZvcm1hdGlvbiBzZXQgdG8gcmVtb3ZlIGZpbGVcbiAgICAgKi9cbiAgICByZW1vdmVSZXF1ZXN0OiBmdW5jdGlvbihpbmZvKSB7XG4gICAgICAgIHZhciBkYXRhID0gaW5mby5kYXRhO1xuICAgICAgICB0aGlzLl9yZXN1bHQgPSBuZS51dGlsLmZpbHRlcih0aGlzLl9yZXN1bHQsIGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICAgICByZXR1cm4gZWwubmFtZSAhPT0gZGF0YS5maWxlbmFtZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaW5mby5zdWNjZXNzKHtcbiAgICAgICAgICAgIGFjdGlvbjogJ3JlbW92ZScsXG4gICAgICAgICAgICBuYW1lOiBkYXRhLmZpbGVuYW1lXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZW5kIGZpbGVzIGluIGEgYmF0Y2guXG4gICAgICogQHBhcmFtIGNhbGxiYWNrXG4gICAgICovXG4gICAgc3VibWl0OiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB2YXIgZm9ybSA9IHRoaXMuX21ha2VGb3JtRGF0YSgpO1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiB0aGlzLl91cGxvYWRlci51cmwuc2VuZCxcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgIGRhdGE6IGZvcm0sXG4gICAgICAgICAgICBzdWNjZXNzOiBjYWxsYmFjayxcbiAgICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBmYWxzZVxuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IExvY2FsOyIsIi8qKlxuICogQGZpbGVvdmVydmlldyBDb25maWd1cmF0aW9uIG9yIGRlZmF1bHQgdmFsdWVzLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIG9mIGNvbm5lY3Rpb24gd2l0aCBzZXJ2ZXIuXG4gICogQHR5cGUge3tSRVNQT05TRV9UWVBFOiBzdHJpbmcsIFJFRElSRUNUX1VSTDogc3RyaW5nfX1cbiAqL1xubW9kdWxlLmV4cG9ydHMuQ09ORiA9IHtcbiAgICBSRVNQT05TRV9UWVBFOiAnUkVTUE9OU0VfVFlQRScsXG4gICAgUkVESVJFQ1RfVVJMOiAnUkVESVJFQ1RfVVJMJyxcbiAgICBKU09OUENBTExCQUNLX05BTUU6ICdDQUxMQkFDS19OQU1FJyxcbiAgICBTSVpFX1VOSVQ6ICdTSVpFX1VOSVQnLFxuICAgIFJFTU9WRV9DQUxMQkFDSyA6ICdyZXNwb25zZVJlbW92ZUNhbGxiYWNrJyxcbiAgICBFUlJPUjoge1xuICAgICAgICBERUZBVUxUOiAnVW5rbm93biBlcnJvci4nLFxuICAgICAgICBOT1RfU1VSUFBPUlQ6ICdUaGlzIGlzIHgtZG9tYWluIGNvbm5lY3Rpb24sIHlvdSBoYXZlIHRvIG1ha2UgaGVscGVyIHBhZ2UuJ1xuICAgIH0sXG5cdFx0RFJBR19ERUZBVUxUX0VOQUJMRV9DTEFTUzogJ2VuYWJsZUNsYXNzJyxcbiAgICBGSUxFX0ZJTEVEX05BTUU6ICd1c2VyZmlsZVtdJ1xufTtcblxuLyoqXG4gKiBEZWZhdWx0IEh0bWxzXG4gKiBAdHlwZSB7e2lucHV0OiBzdHJpbmcsIGl0ZW06IHN0cmluZ319XG4gKi9cbm1vZHVsZS5leHBvcnRzLkhUTUwgPSB7XG4gICAgZm9ybSA6IFsnPGZvcm0gZW5jdHlwZT1cIm11bHRpcGFydC9mb3JtLWRhdGFcIiBpZD1cImZvcm1EYXRhXCIgbWV0aG9kPVwicG9zdFwiPicsXG4gICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cIk1BWF9GSUxFX1NJWkVcIiB2YWx1ZT1cIjMwMDAwMDBcIiAvPicsXG4gICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwiZmlsZVwiIGlkPVwiZmlsZUF0dGFjaFwiIHt7d2Via2l0ZGlyZWN0b3J5fX0gbmFtZT1cInt7ZmlsZUZpZWxkfX1cIiB7e211bHRpcGxlfX0gLz4nLFxuICAgICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPVwiYmF0Y2hTdWJtaXRcIiB0eXBlPVwic3VibWl0XCI+U0VORDwvYnV0dG9uPicsXG4gICAgICAgICAgICAnPC9mb3JtPiddLmpvaW4oJycpLFxuICAgIGlucHV0OiBbJzxpbnB1dCB0eXBlPVwiZmlsZVwiIGlkPVwiZmlsZUF0dGFjaFwiIHt7d2Via2l0ZGlyZWN0b3J5fX0gbmFtZT1cInt7ZmlsZUZpZWxkfX1cIiB7e211bHRpcGxlfX19IC8+J10uam9pbignJyksXG4gICAgaXRlbSA6IFsnPGxpIGNsYXNzPVwiZmlsZXR5cGVEaXNwbGF5Q2xhc3NcIj4nLFxuICAgICAgICAgICAgICAgICc8c3BuYSBjbGFzcz1cImZpbGVpY29uIHt7ZmlsZXR5cGV9fVwiPnt7ZmlsZXR5cGV9fTwvc3BuYT4nLFxuICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImZpbGVfbmFtZVwiPnt7ZmlsZW5hbWV9fTwvc3Bhbj4nLFxuICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImZpbGVfc2l6ZVwiPnt7ZmlsZXNpemV9fTwvc3Bhbj4nLFxuICAgICAgICAgICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cInt7ZGVsZXRlQnV0dG9uQ2xhc3NOYW1lfX1cIj5EZWxldGU8L2J1dHRvbj4nLFxuICAgICAgICAgICAgJzwvbGk+J10uam9pbignJyksXG5cdGRyYWc6IFsnPGRpdiBjbGFzcz1cImRyYWd6b25lXCI+PC9kaXY+J10uam9pbignJylcbn07XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmlsZVVwbG9hZGVyIGlzIGNvcmUgb2YgZmlsZSB1cGxvYWRlciBjb21wb25lbnQuPGJyPkZpbGVNYW5hZ2VyIG1hbmFnZSBjb25uZWN0b3IgdG8gY29ubmVjdCBzZXJ2ZXIgYW5kIHVwZGF0ZSBGaWxlTGlzdFZpZXcuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG52YXIgc3RhdGljcyA9IHJlcXVpcmUoJy4vc3RhdGljcycpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIGNvbm4gPSByZXF1aXJlKCcuL2Nvbm5lY3Rvci9jb25uZWN0b3InKTtcbnZhciBJbnB1dCA9IHJlcXVpcmUoJy4vdmlldy9pbnB1dCcpO1xudmFyIExpc3QgPSByZXF1aXJlKCcuL3ZpZXcvbGlzdCcpO1xudmFyIFBvb2wgPSByZXF1aXJlKCcuL3ZpZXcvcG9vbCcpO1xudmFyIERyYWdBbmREcm9wID0gcmVxdWlyZSgnLi92aWV3L2RyYWcnKTtcblxuLyoqXG4gKiBGaWxlVXBsb2FkZXIgYWN0IGxpa2UgYnJpZGdlIGJldHdlZW4gY29ubmVjdG9yIGFuZCB2aWV3LlxuICogSXQgbWFrZXMgY29ubmVjdG9yIGFuZCB2aWV3IHdpdGggb3B0aW9uIGFuZCBlbnZpcm9ubWVudC5cbiAqIEl0IGNvbnRyb2wgYW5kIG1ha2UgY29ubmVjdGlvbiBhbW9uZyBtb2R1bGVzLlxuICogQGNvbnN0cnVjdG9yIG5lLmNvbXBvbmVudC5VcGxvYWRlclxuICogQGV4YW1wbGVcbiAqIHZhciB1cGxvYWRlciA9IG5ldyBuZS5jb21wb25lbnQuVXBsb2FkZXIoe1xuICogICAgIHVybDoge1xuICogICAgICAgICBzZW5kOiBcImh0dHA6Ly9mZS5uaG5lbnQuY29tL2V0Yy9ldGMvdXBsb2FkZXIvdXBsb2FkZXIucGhwXCIsXG4gKiAgICAgICAgIHJlbW92ZTogXCJodHRwOi8vZmUubmhuZW50LmNvbS9ldGMvZXRjL3VwbG9hZGVyL3JlbW92ZS5waHBcIlxuICogICAgIH0sXG4gKiAgICAgaGVscGVyOiB7XG4gKiAgICAgICAgIHVybDogJ2h0dHA6Ly8xMC43Ny4zNC4xMjY6ODAwOS9zYW1wbGVzL3Jlc3BvbnNlLmh0bWwnLFxuICogICAgICAgICBuYW1lOiAnUkVESVJFQ1RfVVJMJ1xuICogICAgIH0sXG4gKiAgICAgcmVzdWx0VHlwZUVsZW1lbnROYW1lOiAnUkVTUE9OU0VfVFlQRScsXG4gKiAgICAgZm9ybVRhcmdldDogJ2hpZGRlbkZyYW1lJyxcbiAqICAgICBjYWxsYmFja05hbWU6ICdyZXNwb25zZUNhbGxiYWNrJyxcbiAqICAgICBsaXN0SW5mbzoge1xuICogICAgICAgICBsaXN0OiAkKCcjZmlsZXMnKSxcbiAqICAgICAgICAgY291bnQ6ICQoJyNmaWxlX2NvdW50JyksXG4gKiAgICAgICAgIHNpemU6ICQoJyNzaXplX2NvdW50JylcbiAqICAgICB9LFxuICogICAgIHNlcGFyYXRvcjogJzsnXG4gKiB9LCAkKCcjdXBsb2FkZXInKSk7XG4gKi9cbnZhciBVcGxvYWRlciA9IG5lLnV0aWwuZGVmaW5lQ2xhc3MoLyoqQGxlbmRzIG5lLmNvbXBvbmVudC5VcGxvYWRlci5wcm90b3R5cGUgKi97XG5cbiAgICAvKipcbiAgICAgKiBpbml0aWFsaXplIG9wdGlvbnNcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBUaGUgb3B0aW9ucyB0byBzZXQgdXAgZmlsZSB1cGxvYWRlciBtb2R1bGVzLlxuICAgICAqICBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy51cmwgVGhlIHVybCBpcyBmaWxlIHNlcnZlci5cbiAgICAgKiAgICAgIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnVybC5zZW5kIFRoZSB1cmwgaXMgZm9yIGZpbGUgYXR0YWNoLlxuICAgICAqICAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMudXJsLnJlbW92ZSBUaGUgdXJsIGlzIGZvciBmaWxlIGRldGFjaC5cbiAgICAgKiAgQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMuaGVscGVyIFRoZSBoZWxwZXIgb2JqZWN0IGluZm8gaXMgZm9yIHgtZG9tYWluLlxuICAgICAqICAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuaGVscGVyLnVybCBUaGUgdXJsIGlzIGhlbHBlciBwYWdlIHVybC5cbiAgICAgKiAgICAgIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmhlbHBlci5uYW1lIFRoZSBuYW1lIG9mIGhpZGRlbiBlbGVtZW50IGZvciBzZW5kaW5nIHNlcnZlciBoZWxwZXIgcGFnZSBpbmZvcm1hdGlvbi5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMucmVzdWx0VHlwZUVsZW1lbnROYW1lIFRoZSB0eXBlIG9mIGhpZGRlbiBlbGVtZW50IGZvciBzZW5kaW5nIHNlcnZlciByZXNwb25zZSB0eXBlIGluZm9ybWF0aW9uLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5mb3JtVGFyZ2V0IFRoZSB0YXJnZXQgZm9yIHgtZG9tYWluIGpzb25wIGNhc2UuXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmNhbGxiYWNrTmFtZSBUaGUgbmFtZSBvZiBqc29ucCBjYWxsYmFjayBmdW5jdGlvbi5cbiAgICAgKiAgQHBhcmFtIHtvYmplY3R9IG9waXRvbnMubGlzdEluZm8gVGhlIGVsZW1lbnQgaW5mbyB0byBkaXNwbGF5IGZpbGUgbGlzdCBpbmZvcm1hdGlvbi5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuc2VwYXJhdG9yIFRoZSBzZXBhcmF0b3IgZm9yIGpzb25wIGhlbHBlciByZXNwb25zZS5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmZpbGVGaWVsZD11c2VyRmlsZV0gVGhlIGZpZWxkIG5hbWUgb2YgaW5wdXQgZmlsZSBlbGVtZW50LlxuICAgICAqICBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMudXNlRm9sZGVyIFdoZXRoZXIgc2VsZWN0IHVuaXQgaXMgZm9sZGVyIG9mIG5vdC4gSWYgdGhpcyBpcyB0dXJlLCBtdWx0aXBsZSB3aWxsIGJlIGlnbm9yZWQuXG4gICAgICogIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy5pc011bHRpcGxlIFdoZXRoZXIgZW5hYmxlIG11bHRpcGxlIHNlbGVjdCBvciBub3QuXG4gICAgICogQHBhcmFtIHtKcXVlcnlPYmplY3R9ICRlbCBSb290IEVsZW1lbnQgb2YgVXBsb2FkZXJcbiAgICAgKi9cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zLCAkZWwpIHtcbiAgICAgICAgdGhpcy5fc2V0RGF0YShvcHRpb25zKTtcbiAgICAgICAgdGhpcy5fc2V0Q29ubmVjdG9yKCk7XG5cbiAgICAgICAgdGhpcy4kZWwgPSAkZWw7XG5cbiAgICAgICAgaWYodGhpcy51c2VEcmFnICYmIHV0aWxzLmlzU3VwcG9ydEZpbGVTeXN0ZW0oKSkge1xuICAgICAgICAgICAgdGhpcy5kcmFnVmlldyA9IG5ldyBEcmFnQW5kRHJvcChvcHRpb25zLCB0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaW5wdXRWaWV3ID0gbmV3IElucHV0KG9wdGlvbnMsIHRoaXMpO1xuICAgICAgICB0aGlzLmxpc3RWaWV3ID0gbmV3IExpc3Qob3B0aW9ucywgdGhpcyk7XG5cblx0XHRcdFx0dGhpcy5maWxlRmllbGQgPSB0aGlzLmZpbGVGaWVsZCB8fCBzdGF0aWNzLkNPTkYuRklMRV9GSUxFRF9OQU1FO1xuICAgICAgICB0aGlzLl9wb29sID0gbmV3IFBvb2wodGhpcy5saXN0Vmlldy4kZWxbMF0pO1xuICAgICAgICB0aGlzLl9hZGRFdmVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgQ29ubmVjdG9yIGJ5IHVzZUpzb25wIGZsYWcgYW5kIHdoZXRoZXIuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0Q29ubmVjdG9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNCYXRjaFRyYW5zZmVyKSB7XG4gICAgICAgICAgICB0aGlzLnR5cGUgPSAnbG9jYWwnO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuaXNDcm9zc0RvbWFpbigpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5oZWxwZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnR5cGUgPSAnanNvbnAnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhbGVydChzdGF0aWNzLkNPTkYuRVJST1IuTk9UX1NVUlBQT1JUKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnVzZUpzb25wIHx8ICF1dGlscy5pc1N1cHBvcnRGb3JtRGF0YSgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50eXBlID0gJ2pzb25wJztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy50eXBlID0gJ2FqYXgnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2Nvbm5lY3RvciA9IGNvbm4uZ2V0Q29ubmVjdG9yKHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgbGlzdCB2aWV3IHdpdGggY3VzdG9tIG9yIG9yaWdpbmFsIGRhdGEuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGluZm8gVGhlIGRhdGEgZm9yIHVwZGF0ZSBsaXN0XG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBpbmZvLmFjdGlvbiBUaGUgYWN0aW9uIG5hbWUgdG8gZXhlY3V0ZSBtZXRob2RcbiAgICAgKi9cbiAgICBub3RpZnk6IGZ1bmN0aW9uKGluZm8pIHtcbiAgICAgICAgdGhpcy5saXN0Vmlldy51cGRhdGUoaW5mbyk7XG4gICAgICAgIHRoaXMubGlzdFZpZXcudXBkYXRlVG90YWxJbmZvKGluZm8pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgZmllbGQgZGF0YSBieSBvcHRpb24gdmFsdWVzLlxuICAgICAqIEBwYXJhbSBvcHRpb25zXG4gICAgICovXG4gICAgX3NldERhdGE6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgbmUudXRpbC5leHRlbmQodGhpcywgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV4dHJhY3QgcHJvdG9jb2wgKyBkb21haW4gZnJvbSB1cmwgdG8gZmluZCBvdXQgd2hldGhlciBjcm9zcy1kb21haW4gb3Igbm90LlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqL1xuICAgIGlzQ3Jvc3NEb21haW46IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcGFnZURvbWFpbiA9IGRvY3VtZW50LmRvbWFpbjtcbiAgICAgICAgcmV0dXJuIHRoaXMudXJsLnNlbmQuaW5kZXhPZihwYWdlRG9tYWluKSA9PT0gLTE7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZvciBlcnJvclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSBFcnJvciByZXNwb25zZVxuICAgICAqL1xuICAgIGVycm9yQ2FsbGJhY2s6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciBtZXNzYWdlO1xuICAgICAgICBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UubXNnKSB7XG4gICAgICAgICAgICBtZXNzYWdlID0gcmVzcG9uc2UubXNnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWVzc2FnZSA9IHN0YXRpY3MuQ09ORi5FUlJPUi5ERUZBVUxUO1xuICAgICAgICB9XG4gICAgICAgIGFsZXJ0KG1lc3NhZ2UpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmb3IgY3VzdG9tIHNlbmQgZXZlbnRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2RhdGFdIFRoZSBkYXRhIGluY2x1ZGUgY2FsbGJhY2sgZnVuY3Rpb24gZm9yIGZpbGUgY2xvbmVcbiAgICAgKi9cbiAgICBzZW5kRmlsZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBuZS51dGlsLmJpbmQodGhpcy5ub3RpZnksIHRoaXMpLFxuXHRcdFx0XHRmaWxlcyA9IGRhdGEgJiYgZGF0YS5maWxlcztcblxuICAgICAgICB0aGlzLl9jb25uZWN0b3IuYWRkUmVxdWVzdCh7XG4gICAgICAgICAgICB0eXBlOiAnYWRkJyxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIGlmIChkYXRhICYmIGRhdGEuY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5jYWxsYmFjayhyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYWxsYmFjayhyZXN1bHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yOiB0aGlzLmVycm9yQ2FsbGJhY2tcbiAgICAgICAgfSwgZmlsZXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmb3IgY3VzdG9tIHJlbW92ZSBldmVudFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIFRoZSBkYXRhIGZvciByZW1vdmUgZmlsZS5cbiAgICAgKi9cbiAgICByZW1vdmVGaWxlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IG5lLnV0aWwuYmluZCh0aGlzLm5vdGlmeSwgdGhpcyk7XG4gICAgICAgIHRoaXMuX2Nvbm5lY3Rvci5yZW1vdmVSZXF1ZXN0KHtcbiAgICAgICAgICAgIHR5cGU6ICdyZW1vdmUnLFxuICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGNhbGxiYWNrXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdWJtaXQgZm9yIGRhdGEgc3VibWl0IHRvIHNlcnZlclxuICAgICAqL1xuICAgIHN1Ym1pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX2Nvbm5lY3Rvci5zdWJtaXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyB0b2RvIHN1Ym1pdCBwcmVwcm9jZXNzXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgZmlsZSBpbmZvIGxvY2FsbHlcbiAgICAgKiBAcGFyYW0ge0h0bWxFbGVtZW50fSBlbGVtZW50IElucHV0IGVsZW1lbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRGaWxlSW5mbzogZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICB2YXIgZmlsZXM7XG4gICAgICAgIGlmICh1dGlscy5pc1N1cHBvcnRGaWxlU3lzdGVtKCkpIHtcbiAgICAgICAgICAgIGZpbGVzID0gdGhpcy5fZ2V0RmlsZUxpc3QoZWxlbWVudC5maWxlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmaWxlcyA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBlbGVtZW50LnZhbHVlLFxuICAgICAgICAgICAgICAgIGlkOiBlbGVtZW50LnZhbHVlXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmaWxlcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGZpbGUgbGlzdCBmcm9tIEZpbGVMaXN0IG9iamVjdFxuICAgICAqIEBwYXJhbSB7RmlsZUxpc3R9IGZpbGVzIEEgRmlsZUxpc3Qgb2JqZWN0XG4gICAgICogQHJldHVybnMge0FycmF5fVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldEZpbGVMaXN0OiBmdW5jdGlvbihmaWxlcykge1xuICAgICAgICByZXR1cm4gbmUudXRpbC5tYXAoZmlsZXMsIGZ1bmN0aW9uKGZpbGUpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogZmlsZS5uYW1lLFxuICAgICAgICAgICAgICAgIHNpemU6IGZpbGUuc2l6ZSxcbiAgICAgICAgICAgICAgICBpZDogZmlsZS5uYW1lXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IHRvIGxpc3R2aWV3IGFuZCBpbnB1dHZpZXdcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgaWYodGhpcy51c2VEcmFnICYmIHRoaXMuZHJhZ1ZpZXcpIHtcblxuICAgICAgICAgICAgLy8gQHRvZG8gdG9wIOyymOumrOqwgCDrlLDroZwg7ZWE7JqU7ZWoLCBzZW5kRmlsZSDsgqzsmqkg7JWI65CoXG4gICAgICAgICAgICB0aGlzLmRyYWdWaWV3Lm9uKCdkcm9wJywgdGhpcy5zZW5kRmlsZSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuaXNCYXRjaFRyYW5zZmVyKSB7XG4gICAgICAgICAgICB0aGlzLmlucHV0Vmlldy5vbignc2F2ZScsIHRoaXMuc2VuZEZpbGUsIHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5saXN0Vmlldy5vbigncmVtb3ZlJywgdGhpcy5yZW1vdmVGaWxlLCB0aGlzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRWaWV3Lm9uKCdjaGFuZ2UnLCB0aGlzLnNlbmRGaWxlLCB0aGlzKTtcbiAgICAgICAgICAgIHRoaXMubGlzdFZpZXcub24oJ3JlbW92ZScsIHRoaXMucmVtb3ZlRmlsZSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RvcmUgaW5wdXQgZWxlbWVudCB0byBwb29sLlxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGlucHV0IEEgaW5wdXQgZWxlbWVudFt0eXBlPWZpbGVdIGZvciBzdG9yZSBwb29sXG4gICAgICovXG4gICAgc3RvcmU6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHRoaXMuX3Bvb2wuc3RvcmUoaW5wdXQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgaW5wdXQgZWxlbWVudCBmb3JtIHBvb2wuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGZpbGUgbmFtZSB0byByZW1vdmVcbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgaWYgKCF1dGlscy5pc1N1cHBvcnRGb3JtRGF0YSgpKSB7XG4gICAgICAgICAgICB0aGlzLl9wb29sLnJlbW92ZShuYW1lKTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG5uZS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihVcGxvYWRlcik7XG5tb2R1bGUuZXhwb3J0cyA9IFVwbG9hZGVyOyIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIGZpbGUgY29udGFpbiB1dGlsaXR5IG1ldGhvZHMgZm9yIHVwbG9hZGVyLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxuLyoqXG4gKiBFeHRyYWN0IHVuaXQgZm9yIGZpbGUgc2l6ZVxuICogQHBhcmFtIHtudW1iZXJ9IGJ5dGVzIEEgdXNhZ2Ugb2YgZmlsZVxuICovXG5tb2R1bGUuZXhwb3J0cy5nZXRGaWxlU2l6ZVdpdGhVbml0ID0gZnVuY3Rpb24oYnl0ZXMpIHtcbiAgICB2YXIgdW5pdHMgPSBbJ0InLCAnS0InLCAnTUInLCAnR0InLCAnVEInXSxcbiAgICAgICAgYnl0ZXMgPSBwYXJzZUludChieXRlcywgMTApLFxuICAgICAgICBleHAgPSBNYXRoLmxvZyhieXRlcykgLyBNYXRoLmxvZygxMDI0KSB8IDAsXG4gICAgICAgIHJlc3VsdCA9IChieXRlcyAvIE1hdGgucG93KDEwMjQsIGV4cCkpLnRvRml4ZWQoMik7XG5cbiAgICByZXR1cm4gcmVzdWx0ICsgdW5pdHNbZXhwXTtcbn07XG5cbi8qKlxuICogV2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0IEZvcm1EYXRhIG9yIG5vdFxuICovXG5tb2R1bGUuZXhwb3J0cy5pc1N1cHBvcnRGb3JtRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBGb3JtRGF0YSA9ICh3aW5kb3cuRm9ybURhdGEgfHwgbnVsbCk7XG4gICAgcmV0dXJuICEhRm9ybURhdGE7XG59O1xuXG4vKipcbiAqIEdldCBpdGVtIGVsZW1lbiBIVE1MXG4gKiBAcGFyYW0ge3N0cmluZ30gaHRtbCBIVE1MIHRlbXBsYXRlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5tb2R1bGUuZXhwb3J0cy50ZW1wbGF0ZSA9IGZ1bmN0aW9uKG1hcCwgaHRtbCkge1xuICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoL1xce1xceyhbXlxcfV0rKVxcfVxcfS9nLCBmdW5jdGlvbihtc3RyLCBuYW1lKSB7XG4gICAgICAgIHJldHVybiBtYXBbbmFtZV07XG4gICAgfSk7XG4gICAgcmV0dXJuIGh0bWw7XG59O1xuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgc3VwcG9ydCBmaWxlIGFwaSBvciBub3RcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5tb2R1bGUuZXhwb3J0cy5pc1N1cHBvcnRGaWxlU3lzdGVtID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICEhKHdpbmRvdy5GaWxlICYmIHdpbmRvdy5GaWxlUmVhZGVyICYmIHdpbmRvdy5GaWxlTGlzdCAmJiB3aW5kb3cuQmxvYik7XG59OyIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIGZpbGUgaXMgYWJvdXQgZHJhZyBhbmQgZHJvcCBmaWxlIHRvIHNlbmQuIERyYWcgYW5kIGRyb3AgaXMgcnVubmluZyB2aWEgZmlsZSBhcGkuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG52YXIgc3RhdGljcyA9IHJlcXVpcmUoJy4uL3N0YXRpY3MnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cbi8qKlxuICogTWFrZXMgZHJhZyBhbmQgZHJvcCBhcmVhLCB0aGUgZHJvcHBlZCBmaWxlIGlzIGFkZGVkIHZpYSBldmVudCBkcm9wIGV2ZW50LlxuICogQGNsYXNzIERyYWdBbmREcm9wXG4gKi9cbnZhciBEcmFnQW5kRHJvcCA9IG5lLnV0aWwuZGVmaW5lQ2xhc3Moe1xuXHQvKipcblx0ICogaW5pdGlhbGl6ZSBEcmFnQW5kRHJvcFxuXHQgKi9cblx0aW5pdDogZnVuY3Rpb24ob3B0aW9ucywgdXBsb2FkZXIpIHtcblx0XHR2YXIgaHRtbCA9IG9wdGlvbnMudGVtcGxhdGUgJiYgb3B0aW9ucy50ZW1wbGF0ZS5kcmFnIHx8IHN0YXRpY3MuSFRNTC5kcmFnO1xuXHRcdHRoaXMuX2VuYWJsZUNsYXNzID0gb3B0aW9ucy5kcmFnICYmIG9wdGlvbnMuZHJhZy5lbmFibGVDbGFzcyB8fCBzdGF0aWNzLkNPTkYuRFJBR19ERUZBVUxUX0VOQUJMRV9DTEFTUztcblx0XHR0aGlzLl9yZW5kZXIoaHRtbCwgdXBsb2FkZXIpO1xuXHRcdHRoaXMuX2FkZEV2ZW50KCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJlbmRlcnMgZHJhZyBhbmQgZHJvcCBhcmVhXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBodG1sIFRoZSBodG1sIHN0cmluZyB0byBtYWtlIGRhcmcgem9uZVxuXHQgKiBAcGFyYW0ge29iamVjdH0gdXBsb2FkZXIgVGhlIGNvcmUgaW5zdGFuY2Ugb2YgdGhpcyBjb21wb25lbnRcblx0ICovXG5cdF9yZW5kZXI6IGZ1bmN0aW9uKGh0bWwsIHVwbG9hZGVyKSB7XG5cdFx0dGhpcy4kZWwgPSAkKGh0bWwpO1xuXHRcdHVwbG9hZGVyLiRlbC5hcHBlbmQodGhpcy4kZWwpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBZGRzIGRyYWcgYW5kIGRyb3AgZXZlbnRcblx0ICovXG5cdF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwub24oJ2RyYWdlbnRlcicsIG5lLnV0aWwuYmluZCh0aGlzLm9uRHJhZ0VudGVyLCB0aGlzKSk7XG5cdFx0dGhpcy4kZWwub24oJ2RyYWdvdmVyJywgbmUudXRpbC5iaW5kKHRoaXMub25EcmFnT3ZlciwgdGhpcykpO1xuXHRcdHRoaXMuJGVsLm9uKCdkcm9wJywgbmUudXRpbC5iaW5kKHRoaXMub25Ecm9wLCB0aGlzKSk7XG5cdFx0dGhpcy4kZWwub24oJ2RyYWdsZWF2ZScsIG5lLnV0aWwuYmluZCh0aGlzLm9uRHJhZ0xlYXZlLCB0aGlzKSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEhhbmRsZXMgZHJhZ2VudGVyIGV2ZW50XG5cdCAqL1xuXHRvbkRyYWdFbnRlcjogZnVuY3Rpb24oZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdHRoaXMuX2VuYWJsZSgpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBIYW5kbGVzIGRyYWdvdmVyIGV2ZW50XG5cdCAqL1xuXHRvbkRyYWdPdmVyOiBmdW5jdGlvbihlKSB7XG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEhhbmRsZXMgZHJhZ2xlYXZlIGV2ZW50XG5cdCAqL1xuXHRvbkRyYWdMZWF2ZTogZnVuY3Rpb24oZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdHRoaXMuX2Rpc2FibGUoKTtcblx0fSxcblxuXHQvKipcblx0ICogSGFuZGxlcyBkcm9wIGV2ZW50XG5cdCAqL1xuXHRvbkRyb3A6IGZ1bmN0aW9uKGUpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0dGhpcy5fZGlzYWJsZSgpO1xuXHRcdHRoaXMuZmlyZSgnZHJvcCcsIHtcblx0XHRcdGZpbGVzOiBlLm9yaWdpbmFsRXZlbnQuZGF0YVRyYW5zZmVyLmZpbGVzXG5cdFx0fSk7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9LFxuXG5cdF9lbmFibGU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmFkZENsYXNzKHRoaXMuX2VuYWJsZUNsYXNzKTtcblx0fSxcblxuXHRfZGlzYWJsZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3ModGhpcy5fZW5hYmxlQ2xhc3MpO1xuXHR9XG59KTtcblxubmUudXRpbC5DdXN0b21FdmVudHMubWl4aW4oRHJhZ0FuZERyb3ApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyYWdBbmREcm9wO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IElucHV0VmlldyBtYWtlIGlucHV0IGZvcm0gYnkgdGVtcGxhdGUuIEFkZCBldmVudCBmaWxlIHVwbG9hZCBldmVudC5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbnZhciBzdGF0aWNzID0gcmVxdWlyZSgnLi4vc3RhdGljcycpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuLyoqXG4gKiBUaGlzIHZpZXcgY29udHJvbCBpbnB1dCBlbGVtZW50IHR5cGVkIGZpbGUuXG4gKiBAY29uc3RydWN0b3IgbmUuY29tcG9uZW50LkZpbGVVcGxvYWRlci5JbnB1dFZpZXdcbiAqL1xudmFyIElucHV0ID0gbmUudXRpbC5kZWZpbmVDbGFzcygvKipAbGVuZHMgbmUuY29tcG9uZW50LlVwbG9hZGVyLklucHV0LnByb3RvdHlwZSAqKi97XG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBpbnB1dCBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cbiAgICAgKi9cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zLCB1cGxvYWRlcikge1xuXG4gICAgICAgIHRoaXMuX3VwbG9hZGVyID0gdXBsb2FkZXI7XG4gICAgICAgIHRoaXMuX3RhcmdldCA9IG9wdGlvbnMuZm9ybVRhcmdldDtcbiAgICAgICAgdGhpcy5fdXJsID0gb3B0aW9ucy51cmw7XG4gICAgICAgIHRoaXMuX2lzQmF0Y2hUcmFuc2ZlciA9IG9wdGlvbnMuaXNCYXRjaFRyYW5zZmVyO1xuICAgICAgICB0aGlzLl9pbnB1dEhUTUwgPSAob3B0aW9ucy50ZW1wbGF0ZSAmJiBvcHRpb25zLnRlbXBsYXRlLmlucHV0KSB8fCBzdGF0aWNzLkhUTUwuaW5wdXQ7XG4gICAgICAgIHRoaXMuaHRtbCA9IChvcHRpb25zLnRlbXBsYXRlICYmIG9wdGlvbnMudGVtcGxhdGUuZm9ybSkgfHwgc3RhdGljcy5IVE1MLmZvcm07XG4gICAgICAgIHRoaXMuX2lzTXVsdGlwbGUgPSAhISh1dGlscy5pc1N1cHBvcnRGb3JtRGF0YSgpICYmIG9wdGlvbnMuaXNNdWx0aXBsZSk7XG4gICAgICAgIHRoaXMuX3VzZUZvbGRlciA9ICEhKHV0aWxzLmlzU3VwcG9ydEZvcm1EYXRhKCkgJiYgb3B0aW9ucy51c2VGb2xkZXIpO1xuXG4gICAgICAgIHRoaXMuX3JlbmRlcigpO1xuICAgICAgICB0aGlzLl9yZW5kZXJIaWRkZW5FbGVtZW50cygpO1xuXG4gICAgICAgIGlmIChvcHRpb25zLmhlbHBlcikge1xuICAgICAgICAgICAgdGhpcy5fbWFrZUJyaWRnZUluZm9FbGVtZW50KG9wdGlvbnMuaGVscGVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuJGlucHV0ID0gdGhpcy4kZWwuZmluZCgnaW5wdXQ6ZmlsZScpO1xuICAgICAgICB0aGlzLiRidXR0b24gPSAkKCdidXR0b25bdHlwZT1zdWJtaXRdJyk7XG4gICAgICAgIHRoaXMuX2FkZEV2ZW50KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbmRlciBpbnB1dCBhcmVhXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwgPSAkKHRoaXMuX2dldEh0bWwodGhpcy5odG1sKSk7XG4gICAgICAgIHRoaXMuJGVsLmF0dHIoe1xuICAgICAgICAgICAgYWN0aW9uOiB0aGlzLl91cmwuc2VuZCxcbiAgICAgICAgICAgIG1ldGhvZDogJ3Bvc3QnLFxuICAgICAgICAgICAgZW5jdHlwZTogXCJtdWx0aXBhcnQvZm9ybS1kYXRhXCIsXG4gICAgICAgICAgICB0YXJnZXQ6IHRoaXMuX3RhcmdldFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fdXBsb2FkZXIuJGVsLmFwcGVuZCh0aGlzLiRlbCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBodG1sIHN0cmluZyBmcm9tIHRlbXBsYXRlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGh0bWwgVGhlIGh0bWwgdG8gYmUgY29udmVydGVkLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0SHRtbDogZnVuY3Rpb24oaHRtbCkge1xuICAgICAgICB2YXIgbWFwID0ge1xuICAgICAgICAgICAgZmlsZUZpZWxkOiB0aGlzLl91cGxvYWRlci5maWxlRmllbGQsXG4gICAgICAgICAgICBtdWx0aXBsZTogdGhpcy5faXNNdWx0aXBsZSA/ICdtdWx0aXBsZScgOiAnJyxcbiAgICAgICAgICAgIHdlYmtpdGRpcmVjdG9yeTogdGhpcy5fdXNlRm9sZGVyID8gJ3dlYmtpdGRpcmVjdG9yeScgOiAnJ1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gdXRpbHMudGVtcGxhdGUobWFwLCBodG1sKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbCBtZXRob2RzIHRob3NlIG1ha2UgZWFjaCBoaWRkZW4gZWxlbWVudC5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW5kZXJIaWRkZW5FbGVtZW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX21ha2VUYXJnZXRGcmFtZSgpO1xuICAgICAgICB0aGlzLl9tYWtlUmVzdWx0VHlwZUVsZW1lbnQoKTtcbiAgICAgICAgdGhpcy5fbWFrZUNhbGxiYWNrRWxlbWVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzdWJtaXQgPSB0aGlzLiRlbC5maW5kKCdidXR0b246c3VibWl0JyksXG4gICAgICAgICAgICBzZWxmID0gdGhpcztcbiAgICAgICAgdGhpcy4kZWwub24oJ3N1Ym1pdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5fdXBsb2FkZXIuc3VibWl0KCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9hZGRJbnB1dEV2ZW50KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBpbnB1dCBlbGVtZW50IGNoYW5nZSBldmVudCBieSBzZW5kaW5nIHR5cGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRJbnB1dEV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX2lzQmF0Y2hUcmFuc2Zlcikge1xuICAgICAgICAgICAgdGhpcy4kaW5wdXQub24oJ2NoYW5nZScsIG5lLnV0aWwuYmluZCh0aGlzLm9uU2F2ZSwgdGhpcykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kaW5wdXQub24oJ2NoYW5nZScsIG5lLnV0aWwuYmluZCh0aGlzLm9uQ2hhbmdlLCB0aGlzKSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQtSGFuZGxlIGZvciBpbnB1dCBlbGVtZW50IGNoYW5nZVxuICAgICAqL1xuICAgIG9uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5maXJlKCdjaGFuZ2UnLCB7XG4gICAgICAgICAgICB0YXJnZXQ6IHRoaXNcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50LUhhbmRsZSBmb3Igc2F2ZSBpbnB1dCBlbGVtZW50XG4gICAgICovXG4gICAgb25TYXZlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNhdmVDYWxsYmFjayA9ICF1dGlscy5pc1N1cHBvcnRGb3JtRGF0YSgpID8gbmUudXRpbC5iaW5kKHRoaXMuX3Jlc2V0SW5wdXRFbGVtZW50LCB0aGlzKSA6IG51bGw7XG4gICAgICAgIHRoaXMuZmlyZSgnc2F2ZScsIHtcbiAgICAgICAgICAgIGVsZW1lbnQ6IHRoaXMuJGlucHV0WzBdLFxuICAgICAgICAgICAgY2FsbGJhY2s6IHNhdmVDYWxsYmFja1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVzZXQgSW5wdXQgZWxlbWVudCB0byBzYXZlIHdob2xlIGlucHV0PWZpbGUgZWxlbWVudC5cbiAgICAgKi9cbiAgICBfcmVzZXRJbnB1dEVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRpbnB1dC5vZmYoKTtcbiAgICAgICAgdGhpcy5fY2xvbmUodGhpcy4kaW5wdXRbMF0pO1xuICAgICAgICB0aGlzLiRpbnB1dCA9ICQodGhpcy5fZ2V0SHRtbCh0aGlzLl9pbnB1dEhUTUwpKTtcblxuICAgICAgICBpZiAodGhpcy4kYnV0dG9uLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy4kYnV0dG9uLmJlZm9yZSh0aGlzLiRpbnB1dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiRlbC5hcHBlbmQodGhpcy4kaW5wdXQpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2FkZElucHV0RXZlbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSBlbGVtZW50IHRvIGJlIHRhcmdldCBvZiBzdWJtaXQgZm9ybSBmb3JtIGVsZW1lbnQuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbWFrZVRhcmdldEZyYW1lOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fJHRhcmdldCA9ICQoJzxpZnJhbWUgbmFtZT1cIicgKyB0aGlzLl90YXJnZXQgKyAnXCI+PC9pZnJhbWU+Jyk7XG4gICAgICAgIHRoaXMuXyR0YXJnZXQuY3NzKHtcbiAgICAgICAgICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nLFxuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX3VwbG9hZGVyLiRlbC5hcHBlbmQodGhpcy5fJHRhcmdldCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2UgZWxlbWVudCB0byBiZSBjYWxsYmFjayBmdW5jdGlvbiBuYW1lXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbWFrZUNhbGxiYWNrRWxlbWVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuXyRjYWxsYmFjayA9IHRoaXMuX21ha2VIaWRkZW5FbGVtZW50KHtcbiAgICAgICAgICAgICduYW1lJzogc3RhdGljcy5DT05GLkpTT05QQ0FMTEJBQ0tfTkFNRSxcbiAgICAgICAgICAgICd2YWx1ZSc6IHRoaXMuX3VwbG9hZGVyLmNhbGxiYWNrTmFtZVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy4kZWwuYXBwZW5kKHRoaXMuXyRjYWxsYmFjayk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2UgZWxlbWVudCB0byBrbm93IHdoaWNoIHR5cGUgcmVxdWVzdFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX21ha2VSZXN1bHRUeXBlRWxlbWVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuXyRyZXNUeXBlID0gdGhpcy5fbWFrZUhpZGRlbkVsZW1lbnQoe1xuICAgICAgICAgICAgJ25hbWUnIDogdGhpcy5fdXBsb2FkZXIucmVzdWx0VHlwZUVsZW1lbnROYW1lIHx8IHN0YXRpY3MuQ09ORi5SRVNQT05TRV9UWVBFLFxuICAgICAgICAgICAgJ3ZhbHVlJzogdGhpcy5fdXBsb2FkZXIudHlwZVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy4kZWwuYXBwZW5kKHRoaXMuXyRyZXNUeXBlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSBlbGVtZW50IHRoYXQgaGFzIHJlZGlyZWN0IHBhZ2UgaW5mb3JtYXRpb24gdXNlZCBieSBTZXJ2ZXIgc2lkZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gaGVscGVyIFJlZGlyZWN0aW9uIGluZm9ybWF0aW9uIGZvciBjbGVhciB4LWRvbWFpbiBwcm9ibGVtLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX21ha2VCcmlkZ2VJbmZvRWxlbWVudDogZnVuY3Rpb24oaGVscGVyKSB7XG4gICAgICAgIHRoaXMuXyRoZWxwZXIgPSB0aGlzLl9tYWtlSGlkZGVuRWxlbWVudCh7XG4gICAgICAgICAgICAnbmFtZScgOiBoZWxwZXIubmFtZSB8fCBzdGF0aWNzLkNPTkYuUkVESVJFQ1RfVVJMLFxuICAgICAgICAgICAgJ3ZhbHVlJzogaGVscGVyLnVybFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy4kZWwuYXBwZW5kKHRoaXMuXyRoZWxwZXIpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIGhpZGRlbiBpbnB1dCBlbGVtZW50IHdpdGggb3B0aW9uc1xuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFRoZSBvcGl0b25zIHRvIGJlIGF0dHJpYnV0ZSBvZiBpbnB1dFxuICAgICAqIEByZXR1cm5zIHsqfGpRdWVyeX1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9tYWtlSGlkZGVuRWxlbWVudDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICBuZS51dGlsLmV4dGVuZChvcHRpb25zLCB7XG4gICAgICAgICAgICB0eXBlOiAnaGlkZGVuJ1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuICQoJzxpbnB1dCAvPicpLmF0dHIob3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFzayB1cGxvYWRlciB0byBzYXZlIGlucHV0IGVsZW1lbnQgdG8gcG9vbFxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGlucHV0IEEgaW5wdXQgZWxlbWVudFt0eXBlPWZpbGVdIGZvciBzdG9yZSBwb29sXG4gICAgICovXG4gICAgX2Nsb25lOiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICBpbnB1dC5maWxlX25hbWUgPSBpbnB1dC52YWx1ZTtcbiAgICAgICAgdGhpcy5fdXBsb2FkZXIuc3RvcmUoaW5wdXQpO1xuICAgIH1cblxufSk7XG5cbm5lLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKElucHV0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbnB1dDsiLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgSXRlbVZpZXcgbWFrZSBlbGVtZW50IHRvIGRpc3BsYXkgYWRkZWQgZmlsZSBpbmZvcm1hdGlvbi4gSXQgaGFzIGF0dGFjaGVkIGZpbGUgSUQgdG8gcmVxdWVzdCBmb3IgcmVtb3ZlLlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxudmFyIHN0YXRpY3MgPSByZXF1aXJlKCcuLi9zdGF0aWNzJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG4vKipcbiAqIENsYXNzIG9mIGl0ZW0gdGhhdCBpcyBtZW1iZXIgb2YgZmlsZSBsaXN0LlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZhciBJdGVtID0gbmUudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIG5lLmNvbXBvbmVudC5VcGxvYWRlci5JdGVtLnByb3RvdHlwZSAqKi8ge1xuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgaXRlbVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLm5hbWUgRmlsZSBuYW1lXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnR5cGUgRmlsZSB0eXBlXG4gICAgICogIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLnJvb3QgTGlzdCBvYmplY3RcbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuaGlkZGVuRnJhbWUgVGhlIGlmcmFtZSBuYW1lIHdpbGwgYmUgdGFyZ2V0IG9mIGZvcm0gc3VibWl0LlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy51cmwgVGhlIHVybCBmb3IgZm9ybSBhY3Rpb24gdG8gc3VibWV0LlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuaWRdIFVuaXF1ZSBrZXksIHdoYXQgaWYgdGhlIGtleSBpcyBub3QgZXhpc3QgaWQgd2lsbCBiZSB0aGUgZmlsZSBuYW1lLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuaGlkZGVuRmllbGROYW1lXSBUaGUgbmFtZSBvZiBoaWRkZW4gZmlsZWQuIFRoZSBoaWRkZW4gZmllbGQgaXMgZm9yIGNvbm5lY3RpbmcgeC1kb21pYW4uXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5kZWxldGVCdXR0b25DbGFzc05hbWU9J3VwbG9hZGVyX2J0bl9kZWxldGUnXSBUaGUgY2xhc3MgbmFtZSBpcyBmb3IgZGVsZXRlIGJ1dHRvbi5cbiAgICAgKiAgQHBhcmFtIHsoc3RyaW5nfG51bWJlcil9IFtvcHRpb25zLnNpemVdIEZpbGUgc2l6ZSAoYnV0IGllIGxvdyBicm93c2VyLCB4LWRvbWFpbilcbiAgICAgKiAgQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zLmhlbHBlcl0gVGhlIGhlbHBlciBwYWdlIGluZm8uXG4gICAgICovXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuXG4gICAgICAgIHRoaXMuX3NldFJvb3Qob3B0aW9ucyk7XG4gICAgICAgIHRoaXMuX3NldEl0ZW1JbmZvKG9wdGlvbnMpO1xuICAgICAgICB0aGlzLl9zZXRDb25uZWN0SW5mbyhvcHRpb25zKTtcblxuICAgICAgICB0aGlzLnJlbmRlcihvcHRpb25zLnRlbXBsYXRlIHx8IHN0YXRpY3MuSFRNTC5pdGVtKTtcblxuICAgICAgICBpZiAob3B0aW9ucy5oZWxwZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX21ha2VCcmlkZ2VJbmZvRWxlbWVudChvcHRpb25zLmhlbHBlcik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHJvb3QoTGlzdCBvYmplY3QpIGluZm9ybWF0aW9uLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFNhbWUgd2l0aCBpbml0IG9wdGlvbnMgcGFyYW1ldGVyLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldFJvb3Q6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fcm9vdCA9IG9wdGlvbnMucm9vdDtcbiAgICAgICAgdGhpcy5fJHJvb3QgPSBvcHRpb25zLnJvb3QuJGVsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgZmlsZSBpbmZvcm1hdGlvbi5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBTYW1lIHdpdGggaW5pdCBvcHRpb25zIHBhcmFtZXRlci5cbiAgICAgKi9cbiAgICBfc2V0SXRlbUluZm86IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gb3B0aW9ucy5uYW1lO1xuICAgICAgICB0aGlzLl90eXBlID0gb3B0aW9ucy50eXBlIHx8IHRoaXMuX2V4dHJhY3RFeHRlbnNpb24oKTtcbiAgICAgICAgdGhpcy5faWQgPSBvcHRpb25zLmlkIHx8IG9wdGlvbnMubmFtZTtcbiAgICAgICAgdGhpcy5zaXplID0gb3B0aW9ucy5zaXplIHx8ICcnO1xuICAgICAgICB0aGlzLl9idG5DbGFzcyA9IG9wdGlvbnMuZGVsZXRlQnV0dG9uQ2xhc3NOYW1lIHx8ICd1cGxvYWRlcl9idG5fZGVsZXRlJztcbiAgICAgICAgdGhpcy5fdW5pdCA9IG9wdGlvbnMudW5pdCB8fCAnS0InO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgY29ubmVjdCBlbGVtZW50IGluZm9ybWF0aW9uLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFNhbWUgd2l0aCBpbml0IG9wdGlvbnMgcGFyYW1ldGVyLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldENvbm5lY3RJbmZvOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX3VybCA9IG9wdGlvbnMudXJsO1xuICAgICAgICB0aGlzLl9oaWRkZW5JbnB1dE5hbWUgPSBvcHRpb25zLmhpZGRlbkZpZWxkTmFtZSB8fCAnZmlsZW5hbWUnO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgbWFraW5nIGZvcm0gcGFkZGluZyB3aXRoIGRlbGV0YWJsZSBpdGVtXG4gICAgICogQHBhcmFtIHRlbXBsYXRlXG4gICAgICovXG4gICAgcmVuZGVyOiBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuICAgICAgICB2YXIgaHRtbCA9IHRoaXMuX2dldEh0bWwodGVtcGxhdGUpO1xuICAgICAgICB0aGlzLl8kZWwgPSAkKGh0bWwpO1xuICAgICAgICB0aGlzLl8kcm9vdC5hcHBlbmQodGhpcy5fJGVsKTtcbiAgICAgICAgdGhpcy5fYWRkRXZlbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXh0cmFjdCBmaWxlIGV4dGVuc2lvbiBieSBuYW1lXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9leHRyYWN0RXh0ZW5zaW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZS5zcGxpdCgnLicpLnBvcCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIGVsZW1lbnQgdGhhdCBoYXMgcmVkaXJlY3QgcGFnZSBpbmZvcm1hdGlvbiB1c2VkIGJ5IFNlcnZlciBzaWRlLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBoZWxwZXIgUmVkaXJlY3Rpb24gaGVscGVyIHBhZ2UgaW5mb3JtYXRpb24gZm9yIGNsZWFyIHgtZG9tYWluIHByb2JsZW0uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbWFrZUJyaWRnZUluZm9FbGVtZW50OiBmdW5jdGlvbihoZWxwZXIpIHtcbiAgICAgICAgdGhpcy4kaGVscGVyID0gJCgnPGlucHV0IC8+Jyk7XG4gICAgICAgIHRoaXMuJGhlbHBlci5hdHRyKHtcbiAgICAgICAgICAgICduYW1lJyA6IGhlbHBlci5uYW1lLFxuICAgICAgICAgICAgJ3ZhbHVlJzogaGVscGVyLnVybFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGl0ZW0gZWxlbWVuIEhUTUxcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaHRtbCBIVE1MIHRlbXBsYXRlXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRIdG1sOiBmdW5jdGlvbihodG1sKSB7XG4gICAgICAgIHZhciBtYXAgPSB7XG4gICAgICAgICAgICBmaWxldHlwZTogdGhpcy5fdHlwZSxcbiAgICAgICAgICAgIGZpbGVuYW1lOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICBmaWxlc2l6ZTogdGhpcy5zaXplID8gdXRpbHMuZ2V0RmlsZVNpemVXaXRoVW5pdCh0aGlzLnNpemUpIDogJycsXG4gICAgICAgICAgICBkZWxldGVCdXR0b25DbGFzc05hbWU6IHRoaXMuX2J0bkNsYXNzXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHV0aWxzLnRlbXBsYXRlKG1hcCwgaHRtbCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERlc3RvcnkgaXRlbVxuICAgICAqL1xuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9yZW1vdmVFdmVudCgpO1xuICAgICAgICB0aGlzLl8kZWwucmVtb3ZlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudCBoYW5kbGVyIG9uIGRlbGV0ZSBidXR0b24uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcXVlcnkgPSAnLicgKyB0aGlzLl9idG5DbGFzcyxcbiAgICAgICAgICAgICRkZWxCdG4gPSB0aGlzLl8kZWwuZmluZChxdWVyeSk7XG4gICAgICAgICRkZWxCdG4ub24oJ2NsaWNrJywgbmUudXRpbC5iaW5kKHRoaXMuX29uQ2xpY2tFdmVudCwgdGhpcykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZXZlbnQgaGFuZGxlciBmcm9tIGRlbGV0ZSBidXR0b24uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcXVlcnkgPSAnLicgKyB0aGlzLl9idG5DbGFzcyxcbiAgICAgICAgICAgICRkZWxCdG4gPSB0aGlzLl8kZWwuZmluZChxdWVyeSk7XG4gICAgICAgICRkZWxCdG4ub2ZmKCdjbGljaycpO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIEV2ZW50LWhhbmRsZSBmb3IgZGVsZXRlIGJ1dHRvbiBjbGlja2VkLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uQ2xpY2tFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZmlyZSgncmVtb3ZlJywge1xuICAgICAgICAgICAgZmlsZW5hbWUgOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICBpZCA6IHRoaXMuX2lkLFxuICAgICAgICAgICAgdHlwZTogJ3JlbW92ZSdcbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG5cbm5lLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKEl0ZW0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEl0ZW07IiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZpbGVMaXN0VmlldyBtYW5hZ2UgYW5kIGRpc3BsYXkgZmlsZXMgc3RhdGUobGlrZSBzaXplLCBjb3VudCkgYW5kIGxpc3QuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xudmFyIEl0ZW0gPSByZXF1aXJlKCcuL2l0ZW0nKTtcblxuLyoqXG4gKiBMaXN0IGhhcyBpdGVtcy4gSXQgY2FuIGFkZCBhbmQgcmVtb3ZlIGl0ZW0sIGFuZCBnZXQgdG90YWwgdXNhZ2UuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmFyIExpc3QgPSBuZS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgbmUuY29tcG9uZW50LlVwbG9hZGVyLkxpc3QucHJvdG90eXBlICove1xuICAgIGluaXQgOiBmdW5jdGlvbihvcHRpb25zLCB1cGxvYWRlcikge1xuICAgICAgICB2YXIgbGlzdEluZm8gPSBvcHRpb25zLmxpc3RJbmZvO1xuICAgICAgICB0aGlzLml0ZW1zID0gW107XG4gICAgICAgIHRoaXMuJGVsID0gbGlzdEluZm8ubGlzdDtcbiAgICAgICAgdGhpcy4kY291bnRlciA9IGxpc3RJbmZvLmNvdW50O1xuICAgICAgICB0aGlzLiRzaXplID0gbGlzdEluZm8uc2l6ZTtcbiAgICAgICAgdGhpcy5fdXBsb2FkZXIgPSB1cGxvYWRlcjtcblxuICAgICAgICBuZS51dGlsLmV4dGVuZCh0aGlzLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW0gbGlzdFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBpbmZvIEEgaW5mb3JtYXRpb24gdG8gdXBkYXRlIGxpc3QuXG4gICAgICogIEBwYXJhbSB7YXJyYXl9IGluZm8uaXRlbXMgVGhlIGxpc3Qgb2YgZmlsZSBpbmZvcm1hdGlvbi5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IFtpbmZvLmFjdGlvbl0gVGhlIGFjdGlvbiB0byBkby5cbiAgICAgKi9cbiAgICB1cGRhdGU6IGZ1bmN0aW9uKGluZm8pIHtcbiAgICAgICAgaWYgKGluZm8uYWN0aW9uID09PSAncmVtb3ZlJykge1xuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlRmlsZUl0ZW0oaW5mby5uYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2FkZEZpbGVJdGVtcyhpbmZvLml0ZW1zKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgaXRlbXMgdG90YWwgY291bnQsIHRvdGFsIHNpemUgaW5mb3JtYXRpb24uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGluZm8gQSBpbmZvcm1hdGlvbiB0byB1cGRhdGUgbGlzdC5cbiAgICAgKiAgQHBhcmFtIHthcnJheX0gaW5mby5pdGVtcyBUaGUgbGlzdCBvZiBmaWxlIGluZm9ybWF0aW9uLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gaW5mby5zaXplIFRoZSB0b3RhbCBzaXplLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gaW5mby5jb3VudCBUaGUgY291bnQgb2YgZmlsZXMuXG4gICAgICovXG4gICAgdXBkYXRlVG90YWxJbmZvOiBmdW5jdGlvbihpbmZvKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVRvdGFsQ291bnQoaW5mby5jb3VudCk7XG4gICAgICAgIGlmICh1dGlscy5pc1N1cHBvcnRGb3JtRGF0YSgpKSB7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVUb3RhbFVzYWdlKGluZm8uc2l6ZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW1zIHRvdGFsIGNvdW50IGFuZCByZWZyZXNoIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0geyhudW1iZXJ8c3RyaW5nKX0gW2NvdW50XSBUb3RhbCBmaWxlIGNvdW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfdXBkYXRlVG90YWxDb3VudDogZnVuY3Rpb24oY291bnQpIHtcblxuICAgICAgICBpZiAoIW5lLnV0aWwuaXNFeGlzdHkoY291bnQpKSB7XG4gICAgICAgICAgICBjb3VudCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4kY291bnRlci5odG1sKGNvdW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW1zIHRvdGFsIHNpemUgYW5kIHJlZnJlc2ggZWxlbWVudFxuICAgICAqIEBwYXJhbSB7KG51bWJlcnxzdHJpbmcpfSBzaXplIFRvdGFsIGZpbGVzIHNpemVzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfdXBkYXRlVG90YWxVc2FnZTogZnVuY3Rpb24oc2l6ZSkge1xuXG4gICAgICAgIGlmICghbmUudXRpbC5pc0V4aXN0eShzaXplKSkge1xuICAgICAgICAgICAgc2l6ZSA9IHRoaXMuX2dldFN1bUFsbEl0ZW1Vc2FnZSgpO1xuICAgICAgICB9XG4gICAgICAgIHNpemUgPSB1dGlscy5nZXRGaWxlU2l6ZVdpdGhVbml0KHNpemUpO1xuICAgICAgICB0aGlzLiRzaXplLmh0bWwoc2l6ZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN1bSBzaXplcyBvZiBhbGwgaXRlbXMuXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0U3VtQWxsSXRlbVVzYWdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGl0ZW1zID0gdGhpcy5pdGVtcyxcbiAgICAgICAgICAgIHRvdGFsVXNhZ2UgPSAwO1xuXG4gICAgICAgIG5lLnV0aWwuZm9yRWFjaChpdGVtcywgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgdG90YWxVc2FnZSArPSBwYXJzZUZsb2F0KGl0ZW0uc2l6ZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0b3RhbFVzYWdlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZmlsZSBpdGVtc1xuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXQgVGFyZ2V0IGl0ZW0gaW5mb21hdGlvbnMuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRmlsZUl0ZW1zOiBmdW5jdGlvbih0YXJnZXQpIHtcbiAgICAgICAgaWYgKCFuZS51dGlsLmlzQXJyYXkodGFyZ2V0KSkge1xuICAgICAgICAgICAgdGFyZ2V0ID0gW3RhcmdldF07XG4gICAgICAgIH1cbiAgICAgICAgbmUudXRpbC5mb3JFYWNoKHRhcmdldCwgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKHRoaXMuX2NyZWF0ZUl0ZW0oZGF0YSkpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpbGUgaXRlbVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBmaWxlIG5hbWUgdG8gcmVtb3ZlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlRmlsZUl0ZW06IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgbmFtZSA9IGRlY29kZVVSSUNvbXBvbmVudChuYW1lKTtcbiAgICAgICAgdGhpcy5pdGVtcyA9IG5lLnV0aWwuZmlsdGVyKHRoaXMuaXRlbXMsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIHZhciBpc01hdGNoID0gbmFtZSA9PT0gZGVjb2RlVVJJQ29tcG9uZW50KGl0ZW0ubmFtZSk7XG4gICAgICAgICAgICBpZiAoaXNNYXRjaCkge1xuICAgICAgICAgICAgICAgIGl0ZW0uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3VwbG9hZGVyLnJlbW92ZShuYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAhaXNNYXRjaDtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBpdGVtIEJ5IERhdGFcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YVxuICAgICAqIEByZXR1cm5zIHtJdGVtfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NyZWF0ZUl0ZW06IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIGl0ZW0gPSBuZXcgSXRlbSh7XG4gICAgICAgICAgICByb290OiB0aGlzLFxuICAgICAgICAgICAgbmFtZTogZGF0YS5uYW1lLFxuICAgICAgICAgICAgc2l6ZTogZGF0YS5zaXplLFxuICAgICAgICAgICAgZGVsZXRlQnV0dG9uQ2xhc3NOYW1lOiB0aGlzLmRlbGV0ZUJ1dHRvbkNsYXNzTmFtZSxcbiAgICAgICAgICAgIHVybDogdGhpcy51cmwsXG4gICAgICAgICAgICBoaWRkZW5GcmFtZTogdGhpcy5mb3JtVGFyZ2V0LFxuICAgICAgICAgICAgaGlkZGVuRmllbGROYW1lOiB0aGlzLmhpZGRlbkZpZWxkTmFtZSxcbiAgICAgICAgICAgIHRlbXBsYXRlOiB0aGlzLnRlbXBsYXRlICYmIHRoaXMudGVtcGxhdGUuaXRlbVxuICAgICAgICB9KTtcbiAgICAgICAgaXRlbS5vbigncmVtb3ZlJywgdGhpcy5fcmVtb3ZlRmlsZSwgdGhpcyk7XG4gICAgICAgIHJldHVybiBpdGVtO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBSZW1vdmUgRmlsZVxuICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlRmlsZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZScsIGRhdGEpO1xuICAgIH1cbn0pO1xuXG5uZS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihMaXN0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBMaXN0OyIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIGlzIG1hbmFnZXIgb2YgaW5wdXQgZWxlbWVudHMgdGhhdCBhY3QgbGlrZSBmaWxlIHBvb2wuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG4vKipcbiAqIFRoZSBwb29sIGZvciBzYXZlIGZpbGVzLlxuICogSXQncyBvbmx5IGZvciBpbnB1dFtmaWxlXSBlbGVtZW50IHNhdmUgYXQgYnJvd3NlciB0aGF0IGRvZXMgbm90IHN1cHBvcnQgZmlsZSBhcGkuXG4gKiBAdHlwZSB7Kn1cbiAqL1xudmFyIFBvb2wgPSBuZS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgbmUuY29tcG9uZW50LlVwbG9hZGVyLlBvb2wucHJvdG90eXBlICove1xuICAgIC8qKlxuICAgICAqIGluaXRpYWxpemVcbiAgICAgKi9cbiAgICBpbml0OiBmdW5jdGlvbihwbGFuZXQpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFN1Ym1pdHRlciBmb3IgZmlsZSBlbGVtZW50IHRvIHNlcnZlclxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnBsYW5ldCA9IHBsYW5ldDtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZpbGUgZGF0YSBzdHJ1Y3R1cmUgb2JqZWN0KGtleT1uYW1lIDogdmFsdWU9aXVwdXQgZWxtZWVudCk7XG4gICAgICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZpbGVzID0ge307XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBY3RzIHBvb2wgdG8gc2F2ZSBpbnB1dCBlbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtEb2N1bWVudEZyYWdtZW50fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5mcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTYXZlIGEgaW5wdXQgZWxlbWVudFt0eXBlPWZpbGVdLCBhcyB2YWx1ZSBvZiBmaWxlIG5hbWUuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGZpbGUgQSBpbnB1dCBlbGVtZW50IHRoYXQgaGF2ZSB0byBiZSBzYXZlZFxuICAgICAqL1xuICAgIHN0b3JlOiBmdW5jdGlvbihmaWxlKSB7XG4gICAgICAgIHRoaXMuZmlsZXNbZmlsZS5maWxlX25hbWVdID0gZmlsZTtcbiAgICAgICAgdGhpcy5mcmFnLmFwcGVuZENoaWxkKGZpbGUpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBpbnB1dCBlbGVtZW50W3R5cGU9ZmlsZV0gZnJvbSBwb29sLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIEEgZmlsZSBuYW1lIHRoYXQgaGF2ZSB0byBiZSByZW1vdmVkLlxuICAgICAqL1xuICAgIHJlbW92ZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICB0aGlzLmZyYWcucmVtb3ZlQ2hpbGQodGhpcy5maWxlc1tuYW1lXSk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmZpbGVzW25hbWVdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFbXB0eSBwb29sXG4gICAgICovXG4gICAgZW1wdHk6IGZ1bmN0aW9uKCkge1xuICAgICAgICBuZS51dGlsLmZvckVhY2godGhpcy5maWxlcywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUoZGF0YS5maWxlX25hbWUpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUGxhbnQgZmlsZXMgb24gcG9vbCB0byBmb3JtIGlucHV0XG4gICAgICovXG4gICAgcGxhbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcGxhbmV0ID0gdGhpcy5wbGFuZXQ7XG4gICAgICAgIG5lLnV0aWwuZm9yRWFjaCh0aGlzLmZpbGVzLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBwbGFuZXQuYXBwZW5kQ2hpbGQoZGF0YSk7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5maWxlc1tkYXRhLmZpbGVfbmFtZV07XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBvb2w7Il19
