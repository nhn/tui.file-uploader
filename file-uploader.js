(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
tui.util.defineNamespace('tui.component.Uploader', require('./src/js/uploader.js'));


},{"./src/js/uploader.js":7}],2:[function(require,module,exports){
/**
 * @fileoverview This Connector make connection between FileManager and file server api at modern browser.<br>
 *     This Connector use ajax.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */

/**
 * The modules will be mixed in connector by type.
 * @namespace Connector.Ajax
 */
var Ajax = {/** @lends Connector.Ajax */
    type: 'POST',
    /**
     * Request ajax by config to add files.
     * @param {object} config The configuration for ajax request
     *  @param {string} config.url Request url(upload url or remove url)
     *  @param {function} config.success Callback function when request suceess.
     *  @param {function} config.error Callback function when request faild.
     *  @memberof Connector.Ajax
     */
    addRequest: function(config, files) {
        var uploader = this._uploader,
            $form = uploader.inputView.$el,
            callback = tui.util.bind(this.successPadding, this, config.success);
    
		if (files) {
			this.formData = new FormData();
			tui.util.forEach(files, function(e) {
				this.formData.append(uploader.fileField, e);
			}, this);
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
     * @memberof Connector.Ajax
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
     * @memberof Connector.Ajax
     */
    removeRequest: function(config) {
        var callback = tui.util.bind(this.removePadding, this, config.success);
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
     * @memberof Connector.Ajax
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

var ModuleSets = {
    'ajax': Ajax,
    'jsonp': Jsonp,
    'local': Local
};

/**
 * This is Interface to be implemented by connectors
 * @namespace Connector
 */
var Connector = {
    /**
     * A interface removeRequest to implement
     * @param {object} options A information for delete file
     * @memberof Connector
     */
    removeRequest: function(options) {
        throw new Error('The interface removeRequest does not exist');
    },

    /**
     * A interface addRequest to implement
     * @param {object} options A information for add file
     * @memberof Connector
     */
    addRequest: function(options) {
        throw new Error('The interface addRequest does not exist');
    }

};

/**
 * The factory module for connectors.
 * Get each connector by each type.
 * @namespace Factory
 */
var Factory = {
    /**
     * Choose connector
     * @param uploader
     * @returns {{_uploader: *}}
     * @memberof Factory
     */
    getConnector: function(uploader) {
        var type = uploader.type.toLowerCase(),
            conn = {
                _uploader: uploader
            };
        tui.util.extend(conn, Connector, ModuleSets[type] || Local);
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
 * @namespace Connector.Jsonp
 */
var Jsonp = {/** @lends Connector.Jsonp.prototype */
    /**
     * Request by form submit.
     * @param {object} config Configuration for submit form.
     *  @param {function} config.success Callback when post submit complate.
     * @memberof Connector.Jsonp
     */
    addRequest: function(config) {
        var callbackName = this._uploader.callbackName,
        callback = config.success;
        tui.util.defineNamespace(callbackName,  tui.util.bind(this.successPadding, this, callback));

		this._uploader.inputView.$el.submit();
    },

    /**
     * Preprocessing response before callback run.
     * @param {function} callback Request Callback function
     * @param {object} response Response from server
     * @memberof Connector.Jsonp
     */
    successPadding: function(callback, response) {
        var result = {};

		if (this._uploader.isCrossDomain()) {
            result.items = this._getSplitItems(response);
        } else {
            result.items = tui.util.toArray(response.filelist);
        }

        callback(result);
    },

    /**
     * Make query data to array
     * @param {object} data The Data extracted from querystring separated by '&'
     * @private
     * @memberof Connector.Jsonp
     */
    _getSplitItems: function(data) {
        var sep = this._uploader.separator,
            status = data.status.split(sep),
            names = data.names.split(sep),
            sizes = data.sizes.split(sep),
            ids = tui.util.isString(data.ids) ? data.ids.split(sep) : names,
            items = [];

        tui.util.forEach(status, function(item, index) {
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
     * @memberof Connector.Jsonp
     */
    removeRequest: function(config) {
        var callbackName = this._uploader.callbackName,
            data = {
                callback: callbackName
            },
            callback = config.success;

        tui.util.defineNamespace(callbackName, tui.util.bind(this.removePadding, this, callback), true);

        $.ajax({
            url: this._uploader.url.remove,
            dataType: 'jsonp',
            jsonp: callbackName,
            data: tui.util.extend(data, config.data)
        });

    },

    /**
     * Preprocessing response before callback run.
     * @param {function} callback Request Callback function
     * @param {object} response Response from server
     * @memberof Connector.Jsonp
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
 * @namespace Connector.Local
 */
var Local = {/** @lends Connector.Local.prototype */
    /**
     * A result array to save file to send.
     */
    _result : null,
    /**
     * Add Request, save files to array.
     * @param {object} data The data of connection for server
		 * @param {object} [files] The files to save
     * @memberof Connector.Local
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
     * @memberof Connector.Local
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
            files = files || fileEl.files;
            tui.util.forEach(files, function(item) {
                if (tui.util.isObject(item)) {
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
     * Makes form data to send POST(FormDate supported case)
     * @returns {*}
     * @private
     * @memberof Connector.Local
     */
    _makeFormData: function() {
        var uploader = this._uploader,
		field = uploader.fileField,
		input = uploader.inputView,
		form = new window.FormData(this._extractForm(input));

        tui.util.forEach(this._result, function(item) {
            form.append(field, item);
        });
        return form;
    },

	/**
	 * Extracts Form from inputView
	 * @param {object} input The input view for extracting 
     * @memberof Connector.Local
     * @private
     */
	_extractForm: function(input) {
	var form = input.$el.clone();
		// append to pool
		return form[0];
	},

    /**
     * Remove file form result array
     * @param {object} info The information set to remove file
     * @memberof Connector.Local
     */
    removeRequest: function(info) {
        var data = info.data;
        this._result = tui.util.filter(this._result, function(el) {
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
     * @memberof Connector.Local
     */
    submit: function(callback) {
        var form = this._makeFormData(inputView);
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
	FILE_FILED_NAME: 'userfile[]',
	FOLDER_INFO: 'folderName'
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
 * @constructor
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
 *  @param {object} options.listInfo The element info to display file list information.
 *  @param {string} options.separator The separator for jsonp helper response.
 *  @param {string} [options.fileField=userFile] The field name of input file element.
 *  @param {boolean} options.useFolder Whether select unit is folder of not. If this is ture, multiple will be ignored.
 *  @param {boolean} options.isMultiple Whether enable multiple select or not.
 * @param {jQuery} $el Root Element of Uploader
 * @example
 * var uploader = new tui.component.Uploader({
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
var Uploader = tui.util.defineClass(/**@lends Uploader.prototype */{

	/**
	 * initialize
	 */
	init: function(options, $el) {
		this._setData(options);
		this._setConnector();

		this.$el = $el;

		if(this.useDrag && !this.useFolder && utils.isSupportFileSystem()) {
			this.dragView = new DragAndDrop(options, this);
		}

		this.inputView = new Input(options, this);
		this.listView = new List(options, this);

		this.fileField = this.fileField || statics.CONF.FILE_FILED_NAME;
		this._pool = new Pool(this.inputView.$el[0]);
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
                this.type = 'local';    
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
			message = statics.CONF.ERROR.DEFAULT;
		}
		alert(message);
	},

	/**
	 * Callback for custom send event
	 * @param {object} [data] The data include callback function for file clone
	 */
	sendFile: function(data) {
		var callback = tui.util.bind(this.notify, this),
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
		var callback = tui.util.bind(this.notify, this);
		this._connector.removeRequest({
			type: 'remove',
			data: data,
			success: callback
		});
	},

	/**
	 * Submit for data submit to server
     * @api
	 */
	submit: function() {
		if (this._connector.submit) {
			if (utils.isSupportFormData()) {
				this._connector.submit(tui.util.bind(function() {
					/**
					 * @api
					 * @event Uploader#beforesubmit
                     * @param {Uploader} uploader - uploader instance
					 */
					this.fire('beforesubmit', this);
				}, this));
			} else {
				this._pool.plant();
			}
		} 
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
        var self = this;

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

        /**
         * Custom Events
         * @api
         * @event Uploader#fileAdded
         * @param {object} target - Target item information
         */
        this.listView.on('fileAdded', function(target) {
            self.fire(target);
        });

        /**
         * Custom Events
         * @api
         * @event Uploader#fileRemoved
         * @param {object} name - The file name to remove
         */
        this.listView.on('fileRemoved', function(name) {
            self.fire(name);
        });
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

tui.util.CustomEvents.mixin(Uploader);
module.exports = Uploader;

},{"./connector/connector":3,"./statics":6,"./utils":8,"./view/drag":9,"./view/input":10,"./view/list":12,"./view/pool":13}],8:[function(require,module,exports){
/**
 * @fileoverview This file contain utility methods for uploader.
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */


/**
 * @namespace utils
 */

/**
 * Extract unit for file size
 * @param {number} bytes A usage of file
 * @memberof utils
 */
var getFileSizeWithUnit = function(bytes) {
    var units = ['B', 'KB', 'MB', 'GB', 'TB'],
        bytes = parseInt(bytes, 10),
        exp = Math.log(bytes) / Math.log(1024) | 0,
        result = (bytes / Math.pow(1024, exp)).toFixed(2);

    return result + units[exp];
};

/**
 * Whether the browser support FormData or not
 * @memberof utils
 */
var isSupportFormData = function() {
    var FormData = (window.FormData || null);
    return !!FormData;
};

/**
 * Get item elemen HTML
 * @param {string} html HTML template
 * @returns {string}
 * @memberof utils
 */
var template = function(map, html) {
    html = html.replace(/\{\{([^\}]+)\}\}/g, function(mstr, name) {
        return map[name];
    });
    return html;
};

/**
 * Check whether support file api or not
 * @returns {boolean}
 * @memberof utils
 */
var isSupportFileSystem = function() {
    return !!(window.File && window.FileReader && window.FileList && window.Blob);
};

module.exports = {
    getFileSizeWithUnit: getFileSizeWithUnit,
    isSupportFileSystem: isSupportFileSystem,
    isSupportFormData: isSupportFormData,
    template: template
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
 * @class View.DragAndDrop
 */
var DragAndDrop = tui.util.defineClass(/** @lends View.DragAndDrop.prototype */{
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
 * @constructor View.InputView
 */
var Input = tui.util.defineClass(/**@lends View.Input.prototype **/{
	/**
	 * Initialize input element.
	 * @param {object} [options]
	 */
	init: function(options, uploader) {

		this._uploader = uploader;
		this._target = options.formTarget;
		this._url = options.url;
		this._isBatchTransfer = options.isBatchTransfer;
		this._isMultiple = !!(utils.isSupportFormData() && options.isMultiple);
		this._useFolder = !!(utils.isSupportFormData() && options.useFolder);

		this._html = this._setHTML(options.template);

		this._render();
		this._renderHiddenElements();

		if (options.helper) {
			this._makeBridgeInfoElement(options.helper);
		}

		this._addEvent();
	},

	/**
	 * Render input area
	 * @private
	 */
	_render: function() {
		this.$el = $(this._getHtml());
		this.$el.attr({
			action: this._url.send,
			method: 'post',
			enctype: "multipart/form-data",
			target: (!this._isBatchTransfer ? this._target : '')
		});
		this.$input = this._getInputElement();
		this.$submit = this._getSubmitElement();
		this.$input.appendTo(this.$el);
		if (this.$submit) {
			this.$submit.appendTo(this.$el);
		}
		this._uploader.$el.append(this.$el);
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
			input: template.input || statics.HTML.input,
			submit: template.submit || statics.HTML.submit,
			form: template.form || statics.HTML.form
		}
	},
	/**
	 * Get html string from template
	 * @return {object}
	 * @private
	 */
	_getHtml: function() {
		return this._html.form;
	},

	/**
	 * Makes and returns jquery element
	 * @return {object} The jquery object wrapping original input element
	 */
	_getInputElement: function() {
		var map = {
			multiple: this._isMultiple ? 'multiple' : '',
			fileField: this._uploader.fileField,
			webkitdirectory: this._useFolder ? 'webkitdirectory' : ''
		};

		return $(utils.template(map, this._html.input));
	},

	/**
	 * Makes and returns jquery element
	 * @return {object} The jquery object wrapping sumbit button element
	 */
	_getSubmitElement: function() {
		if (this._isBatchTransfer) {
			return $(this._html.submit);
		} else {
			return false;	
		}
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
		if (this._isBatchTransfer) {
			this.$el.on('submit', tui.util.bind(function() {
				this._uploader.submit();
			}, this));
		}
		this._addInputEvent();
	},

	/**
	 * Add input element change event by sending type
	 * @private
	 */
	_addInputEvent: function() {
		if (this._isBatchTransfer) {
			this.$input.on('change', tui.util.bind(this.onSave, this));
		} else {
			this.$input.on('change', tui.util.bind(this.onChange, this));
		}
	},

	/**
	 * Event-Handle for input element change
	 */
	onChange: function() {
		if (!this.$input[0].value) {
            return; 
        }
        this.fire('change', {
			target: this
		});
	},

	/**
	 * Event-Handle for save input element
	 */
	onSave: function() {
		if (!this.$input[0].value) {
            return;
        }
        var saveCallback = !utils.isSupportFormData() ? tui.util.bind(this._resetInputElement, this) : null;
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
		this.$input = this._getInputElement();
		if (this.$submit) {
			this.$submit.before(this.$input);
		} else {
			this.$el.append(this.$input);
		}
		this._addInputEvent();
	},

	/**
	 * Makes element to be target of submit form element.
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
	 * Makes element to know which type request
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
		tui.util.extend(options, {
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

tui.util.CustomEvents.mixin(Input);

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
 * @class View.Item
 */
var Item = tui.util.defineClass(/** @lends View.Item.prototype **/ {
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
     * @private
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
            filename : this.name,
            id : this._id,
            type: 'remove'
        });
    }
});

tui.util.CustomEvents.mixin(Item);

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
        this._updateTotalUsage(info.size);
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
     * @param {(number|string)} size Total files sizes
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

        this.fire('fileAdded', {
			target: target
		});
    },

    /**
     * Remove file item
     * @param {string} name The file name to remove
     * @private
     */
    _removeFileItem: function(name) {
        name = decodeURIComponent(name);
        this.items = tui.util.filter(this.items, function(item) {
            var isMatch = name === decodeURIComponent(item.name);
            if (isMatch) {
                item.destroy();
                this._uploader.remove(name);
                this.fire('fileRemoved', {
                    name: name
                });
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

tui.util.CustomEvents.mixin(List);

module.exports = List;

},{"../utils":8,"./item":11}],13:[function(require,module,exports){
/**
 * @fileoverview This is manager of input elements that act like file pool.
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */

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
        tui.util.forEach(this.files, function(data) {
            this.remove(data.file_name);
        }, this);
    },

    /**
     * Plant files on pool to form input
     */
    plant: function() {
        var planet = this.planet;
        tui.util.forEach(this.files, function(data) {
            planet.appendChild(data);
            delete this.files[data.file_name];
        }, this);
    }
});

module.exports = Pool;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25uZWN0b3IvYWpheC5qcyIsInNyYy9qcy9jb25uZWN0b3IvY29ubmVjdG9yLmpzIiwic3JjL2pzL2Nvbm5lY3Rvci9qc29ucC5qcyIsInNyYy9qcy9jb25uZWN0b3IvbG9jYWwuanMiLCJzcmMvanMvc3RhdGljcy5qcyIsInNyYy9qcy91cGxvYWRlci5qcyIsInNyYy9qcy91dGlscy5qcyIsInNyYy9qcy92aWV3L2RyYWcuanMiLCJzcmMvanMvdmlldy9pbnB1dC5qcyIsInNyYy9qcy92aWV3L2l0ZW0uanMiLCJzcmMvanMvdmlldy9saXN0LmpzIiwic3JjL2pzL3ZpZXcvcG9vbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidHVpLnV0aWwuZGVmaW5lTmFtZXNwYWNlKCd0dWkuY29tcG9uZW50LlVwbG9hZGVyJywgcmVxdWlyZSgnLi9zcmMvanMvdXBsb2FkZXIuanMnKSk7XG5cbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIENvbm5lY3RvciBtYWtlIGNvbm5lY3Rpb24gYmV0d2VlbiBGaWxlTWFuYWdlciBhbmQgZmlsZSBzZXJ2ZXIgYXBpIGF0IG1vZGVybiBicm93c2VyLjxicj5cbiAqICAgICBUaGlzIENvbm5lY3RvciB1c2UgYWpheC5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbi8qKlxuICogVGhlIG1vZHVsZXMgd2lsbCBiZSBtaXhlZCBpbiBjb25uZWN0b3IgYnkgdHlwZS5cbiAqIEBuYW1lc3BhY2UgQ29ubmVjdG9yLkFqYXhcbiAqL1xudmFyIEFqYXggPSB7LyoqIEBsZW5kcyBDb25uZWN0b3IuQWpheCAqL1xuICAgIHR5cGU6ICdQT1NUJyxcbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGFqYXggYnkgY29uZmlnIHRvIGFkZCBmaWxlcy5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gY29uZmlnIFRoZSBjb25maWd1cmF0aW9uIGZvciBhamF4IHJlcXVlc3RcbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy51cmwgUmVxdWVzdCB1cmwodXBsb2FkIHVybCBvciByZW1vdmUgdXJsKVxuICAgICAqICBAcGFyYW0ge2Z1bmN0aW9ufSBjb25maWcuc3VjY2VzcyBDYWxsYmFjayBmdW5jdGlvbiB3aGVuIHJlcXVlc3Qgc3VjZWVzcy5cbiAgICAgKiAgQHBhcmFtIHtmdW5jdGlvbn0gY29uZmlnLmVycm9yIENhbGxiYWNrIGZ1bmN0aW9uIHdoZW4gcmVxdWVzdCBmYWlsZC5cbiAgICAgKiAgQG1lbWJlcm9mIENvbm5lY3Rvci5BamF4XG4gICAgICovXG4gICAgYWRkUmVxdWVzdDogZnVuY3Rpb24oY29uZmlnLCBmaWxlcykge1xuICAgICAgICB2YXIgdXBsb2FkZXIgPSB0aGlzLl91cGxvYWRlcixcbiAgICAgICAgICAgICRmb3JtID0gdXBsb2FkZXIuaW5wdXRWaWV3LiRlbCxcbiAgICAgICAgICAgIGNhbGxiYWNrID0gdHVpLnV0aWwuYmluZCh0aGlzLnN1Y2Nlc3NQYWRkaW5nLCB0aGlzLCBjb25maWcuc3VjY2Vzcyk7XG4gICAgXG5cdFx0aWYgKGZpbGVzKSB7XG5cdFx0XHR0aGlzLmZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG5cdFx0XHR0dWkudXRpbC5mb3JFYWNoKGZpbGVzLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdHRoaXMuZm9ybURhdGEuYXBwZW5kKHVwbG9hZGVyLmZpbGVGaWVsZCwgZSk7XG5cdFx0XHR9LCB0aGlzKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5mb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgkZm9ybVswXSk7XG5cdFx0fVxuXHRcdCQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHRoaXMuX3VwbG9hZGVyLnVybC5zZW5kLFxuICAgICAgICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgICAgICAgZGF0YTogdGhpcy5mb3JtRGF0YSxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGNhbGxiYWNrLFxuICAgICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6IGNvbmZpZy5lcnJvclxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJlcHJvY2Vzc2luZyBjYWxsYmFjayBiZWZvcmUgY2FsbGJhY2sgcnVuLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFJlcXVlc3QgQ2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgUmVzcG9uc2UgZnJvbSBzZXJ2ZXJcbiAgICAgKiBAbWVtYmVyb2YgQ29ubmVjdG9yLkFqYXhcbiAgICAgKi9cbiAgICBzdWNjZXNzUGFkZGluZzogZnVuY3Rpb24oY2FsbGJhY2ssIHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciBqc29uID0gSlNPTi5wYXJzZShyZXNwb25zZSksXG4gICAgICAgICAgICByZXN1bHQgPSB7fTtcblxuICAgICAgICByZXN1bHQuaXRlbXMgPSBqc29uLmZpbGVsaXN0O1xuICAgICAgICBjYWxsYmFjayhyZXN1bHQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGFqYXggYnkgY29uZmlnIHRvIHJlbW92ZSBmaWxlLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWdcbiAgICAgKiBAbWVtYmVyb2YgQ29ubmVjdG9yLkFqYXhcbiAgICAgKi9cbiAgICByZW1vdmVSZXF1ZXN0OiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gdHVpLnV0aWwuYmluZCh0aGlzLnJlbW92ZVBhZGRpbmcsIHRoaXMsIGNvbmZpZy5zdWNjZXNzKTtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogdGhpcy5fdXBsb2FkZXIudXJsLnJlbW92ZSxcbiAgICAgICAgICAgIGRhdGE6IGNvbmZpZy5kYXRhLFxuICAgICAgICAgICAgc3VjY2VzczogY2FsbGJhY2ssXG4gICAgICAgICAgICBlcnJvcjogY29uZmlnLmVycm9yXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcmVwcm9jZXNzaW5nIHJlc3BvbnNlIGJlZm9yZSBjYWxsYmFjayBydW4uXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgUmVxdWVzdCBDYWxsYmFjayBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSBSZXNwb25zZSBmcm9tIHNlcnZlclxuICAgICAqIEBtZW1iZXJvZiBDb25uZWN0b3IuQWpheFxuICAgICAqL1xuICAgIHJlbW92ZVBhZGRpbmc6IGZ1bmN0aW9uKGNhbGxiYWNrLCByZXNwb25zZSkge1xuICAgICAgICB2YXIganNvbiA9IEpTT04ucGFyc2UocmVzcG9uc2UpLFxuICAgICAgICAgICAgcmVzdWx0ID0ge307XG5cbiAgICAgICAgcmVzdWx0LmFjdGlvbiA9ICdyZW1vdmUnO1xuICAgICAgICByZXN1bHQubmFtZSA9IGRlY29kZVVSSUNvbXBvbmVudChqc29uLm5hbWUpO1xuXG4gICAgICAgIGNhbGxiYWNrKHJlc3VsdCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBBamF4O1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEEgQ29ubmVjdG9yIG1ha2UgY29ubmVjdGlvbiBiZXR3ZWVuIEZpbGVNYW5hZ2VyIGFuZCBmaWxlIHNlcnZlciBBUEkuPGJyPiBUaGUgQ29ubmVjdG9yIGlzIGludGVyZmFjZS5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbnZhciBBamF4ID0gcmVxdWlyZSgnLi9hamF4Jyk7XG52YXIgSnNvbnAgPSByZXF1aXJlKCcuL2pzb25wJyk7XG52YXIgTG9jYWwgPSByZXF1aXJlKCcuL2xvY2FsJyk7XG5cbnZhciBNb2R1bGVTZXRzID0ge1xuICAgICdhamF4JzogQWpheCxcbiAgICAnanNvbnAnOiBKc29ucCxcbiAgICAnbG9jYWwnOiBMb2NhbFxufTtcblxuLyoqXG4gKiBUaGlzIGlzIEludGVyZmFjZSB0byBiZSBpbXBsZW1lbnRlZCBieSBjb25uZWN0b3JzXG4gKiBAbmFtZXNwYWNlIENvbm5lY3RvclxuICovXG52YXIgQ29ubmVjdG9yID0ge1xuICAgIC8qKlxuICAgICAqIEEgaW50ZXJmYWNlIHJlbW92ZVJlcXVlc3QgdG8gaW1wbGVtZW50XG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgQSBpbmZvcm1hdGlvbiBmb3IgZGVsZXRlIGZpbGVcbiAgICAgKiBAbWVtYmVyb2YgQ29ubmVjdG9yXG4gICAgICovXG4gICAgcmVtb3ZlUmVxdWVzdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBpbnRlcmZhY2UgcmVtb3ZlUmVxdWVzdCBkb2VzIG5vdCBleGlzdCcpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBIGludGVyZmFjZSBhZGRSZXF1ZXN0IHRvIGltcGxlbWVudFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIEEgaW5mb3JtYXRpb24gZm9yIGFkZCBmaWxlXG4gICAgICogQG1lbWJlcm9mIENvbm5lY3RvclxuICAgICAqL1xuICAgIGFkZFJlcXVlc3Q6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgaW50ZXJmYWNlIGFkZFJlcXVlc3QgZG9lcyBub3QgZXhpc3QnKTtcbiAgICB9XG5cbn07XG5cbi8qKlxuICogVGhlIGZhY3RvcnkgbW9kdWxlIGZvciBjb25uZWN0b3JzLlxuICogR2V0IGVhY2ggY29ubmVjdG9yIGJ5IGVhY2ggdHlwZS5cbiAqIEBuYW1lc3BhY2UgRmFjdG9yeVxuICovXG52YXIgRmFjdG9yeSA9IHtcbiAgICAvKipcbiAgICAgKiBDaG9vc2UgY29ubmVjdG9yXG4gICAgICogQHBhcmFtIHVwbG9hZGVyXG4gICAgICogQHJldHVybnMge3tfdXBsb2FkZXI6ICp9fVxuICAgICAqIEBtZW1iZXJvZiBGYWN0b3J5XG4gICAgICovXG4gICAgZ2V0Q29ubmVjdG9yOiBmdW5jdGlvbih1cGxvYWRlcikge1xuICAgICAgICB2YXIgdHlwZSA9IHVwbG9hZGVyLnR5cGUudG9Mb3dlckNhc2UoKSxcbiAgICAgICAgICAgIGNvbm4gPSB7XG4gICAgICAgICAgICAgICAgX3VwbG9hZGVyOiB1cGxvYWRlclxuICAgICAgICAgICAgfTtcbiAgICAgICAgdHVpLnV0aWwuZXh0ZW5kKGNvbm4sIENvbm5lY3RvciwgTW9kdWxlU2V0c1t0eXBlXSB8fCBMb2NhbCk7XG4gICAgICAgIHJldHVybiBjb25uO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRmFjdG9yeTtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIENvbm5lY3RvciBtYWtlIGNvbm5lY3Rpb24gYmV0d2VlbiBGaWxlTWFuYWdlciBhbmQgZmlsZSBzZXJ2ZXIgYXBpIGF0IG9sZCBicm93c2VyLjxicj5cbiAqICAgICBUaGlzIENvbm5lY3RvciB1c2UgaGlkZGVuIGlmcmFtZS5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbi8qKlxuICogVGhlIG1vZHVsZXMgd2lsbCBiZSBtaXhlZCBpbiBjb25uZWN0b3IgYnkgdHlwZS5cbiAqIEBuYW1lc3BhY2UgQ29ubmVjdG9yLkpzb25wXG4gKi9cbnZhciBKc29ucCA9IHsvKiogQGxlbmRzIENvbm5lY3Rvci5Kc29ucC5wcm90b3R5cGUgKi9cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGJ5IGZvcm0gc3VibWl0LlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWcgQ29uZmlndXJhdGlvbiBmb3Igc3VibWl0IGZvcm0uXG4gICAgICogIEBwYXJhbSB7ZnVuY3Rpb259IGNvbmZpZy5zdWNjZXNzIENhbGxiYWNrIHdoZW4gcG9zdCBzdWJtaXQgY29tcGxhdGUuXG4gICAgICogQG1lbWJlcm9mIENvbm5lY3Rvci5Kc29ucFxuICAgICAqL1xuICAgIGFkZFJlcXVlc3Q6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgICB2YXIgY2FsbGJhY2tOYW1lID0gdGhpcy5fdXBsb2FkZXIuY2FsbGJhY2tOYW1lLFxuICAgICAgICBjYWxsYmFjayA9IGNvbmZpZy5zdWNjZXNzO1xuICAgICAgICB0dWkudXRpbC5kZWZpbmVOYW1lc3BhY2UoY2FsbGJhY2tOYW1lLCAgdHVpLnV0aWwuYmluZCh0aGlzLnN1Y2Nlc3NQYWRkaW5nLCB0aGlzLCBjYWxsYmFjaykpO1xuXG5cdFx0dGhpcy5fdXBsb2FkZXIuaW5wdXRWaWV3LiRlbC5zdWJtaXQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJlcHJvY2Vzc2luZyByZXNwb25zZSBiZWZvcmUgY2FsbGJhY2sgcnVuLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFJlcXVlc3QgQ2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgUmVzcG9uc2UgZnJvbSBzZXJ2ZXJcbiAgICAgKiBAbWVtYmVyb2YgQ29ubmVjdG9yLkpzb25wXG4gICAgICovXG4gICAgc3VjY2Vzc1BhZGRpbmc6IGZ1bmN0aW9uKGNhbGxiYWNrLCByZXNwb25zZSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0ge307XG5cblx0XHRpZiAodGhpcy5fdXBsb2FkZXIuaXNDcm9zc0RvbWFpbigpKSB7XG4gICAgICAgICAgICByZXN1bHQuaXRlbXMgPSB0aGlzLl9nZXRTcGxpdEl0ZW1zKHJlc3BvbnNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdC5pdGVtcyA9IHR1aS51dGlsLnRvQXJyYXkocmVzcG9uc2UuZmlsZWxpc3QpO1xuICAgICAgICB9XG5cbiAgICAgICAgY2FsbGJhY2socmVzdWx0KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSBxdWVyeSBkYXRhIHRvIGFycmF5XG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgVGhlIERhdGEgZXh0cmFjdGVkIGZyb20gcXVlcnlzdHJpbmcgc2VwYXJhdGVkIGJ5ICcmJ1xuICAgICAqIEBwcml2YXRlXG4gICAgICogQG1lbWJlcm9mIENvbm5lY3Rvci5Kc29ucFxuICAgICAqL1xuICAgIF9nZXRTcGxpdEl0ZW1zOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBzZXAgPSB0aGlzLl91cGxvYWRlci5zZXBhcmF0b3IsXG4gICAgICAgICAgICBzdGF0dXMgPSBkYXRhLnN0YXR1cy5zcGxpdChzZXApLFxuICAgICAgICAgICAgbmFtZXMgPSBkYXRhLm5hbWVzLnNwbGl0KHNlcCksXG4gICAgICAgICAgICBzaXplcyA9IGRhdGEuc2l6ZXMuc3BsaXQoc2VwKSxcbiAgICAgICAgICAgIGlkcyA9IHR1aS51dGlsLmlzU3RyaW5nKGRhdGEuaWRzKSA/IGRhdGEuaWRzLnNwbGl0KHNlcCkgOiBuYW1lcyxcbiAgICAgICAgICAgIGl0ZW1zID0gW107XG5cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChzdGF0dXMsIGZ1bmN0aW9uKGl0ZW0sIGluZGV4KSB7XG4gICAgICAgICAgICBpZiAoaXRlbSA9PT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5JdGVtID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBuYW1lc1tpbmRleF0sXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czogc3RhdHVzW2luZGV4XSxcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogc2l6ZXNbaW5kZXhdLFxuICAgICAgICAgICAgICAgICAgICBpZDogaWRzW2luZGV4XVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaXRlbXMucHVzaChuSXRlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaXRlbXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlcXVlc3QgYWpheCBieSBjb25maWcgdG8gcmVtb3ZlIGZpbGUuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGNvbmZpZ1xuICAgICAqIEBtZW1iZXJvZiBDb25uZWN0b3IuSnNvbnBcbiAgICAgKi9cbiAgICByZW1vdmVSZXF1ZXN0OiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrTmFtZSA9IHRoaXMuX3VwbG9hZGVyLmNhbGxiYWNrTmFtZSxcbiAgICAgICAgICAgIGRhdGEgPSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrTmFtZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNhbGxiYWNrID0gY29uZmlnLnN1Y2Nlc3M7XG5cbiAgICAgICAgdHVpLnV0aWwuZGVmaW5lTmFtZXNwYWNlKGNhbGxiYWNrTmFtZSwgdHVpLnV0aWwuYmluZCh0aGlzLnJlbW92ZVBhZGRpbmcsIHRoaXMsIGNhbGxiYWNrKSwgdHJ1ZSk7XG5cbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogdGhpcy5fdXBsb2FkZXIudXJsLnJlbW92ZSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbnAnLFxuICAgICAgICAgICAganNvbnA6IGNhbGxiYWNrTmFtZSxcbiAgICAgICAgICAgIGRhdGE6IHR1aS51dGlsLmV4dGVuZChkYXRhLCBjb25maWcuZGF0YSlcbiAgICAgICAgfSk7XG5cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJlcHJvY2Vzc2luZyByZXNwb25zZSBiZWZvcmUgY2FsbGJhY2sgcnVuLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFJlcXVlc3QgQ2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgUmVzcG9uc2UgZnJvbSBzZXJ2ZXJcbiAgICAgKiBAbWVtYmVyb2YgQ29ubmVjdG9yLkpzb25wXG4gICAgICovXG4gICAgcmVtb3ZlUGFkZGluZzogZnVuY3Rpb24oY2FsbGJhY2ssIHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgICAgcmVzdWx0LmFjdGlvbiA9ICdyZW1vdmUnO1xuICAgICAgICByZXN1bHQubmFtZSA9IGRlY29kZVVSSUNvbXBvbmVudChyZXNwb25zZS5uYW1lKTtcblxuICAgICAgICBjYWxsYmFjayhyZXN1bHQpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSnNvbnA7XG4iLCIvKipcbiAqIEBmaWxlb3ZldmlldyBUaGlzIENvbm5lY3RvciBtYWtlIGNvbm5lY3Rpb24gYmV0d2VlbiBVcGxvYWRlciBhbmQgaHRtbDUgZmlsZSBhcGkuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuLyoqXG4gKiBUaGUgbW9kdWxlcyB3aWxsIGJlIG1peGVkIGluIGNvbm5lY3RvciBieSB0eXBlLlxuICogQG5hbWVzcGFjZSBDb25uZWN0b3IuTG9jYWxcbiAqL1xudmFyIExvY2FsID0gey8qKiBAbGVuZHMgQ29ubmVjdG9yLkxvY2FsLnByb3RvdHlwZSAqL1xuICAgIC8qKlxuICAgICAqIEEgcmVzdWx0IGFycmF5IHRvIHNhdmUgZmlsZSB0byBzZW5kLlxuICAgICAqL1xuICAgIF9yZXN1bHQgOiBudWxsLFxuICAgIC8qKlxuICAgICAqIEFkZCBSZXF1ZXN0LCBzYXZlIGZpbGVzIHRvIGFycmF5LlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIFRoZSBkYXRhIG9mIGNvbm5lY3Rpb24gZm9yIHNlcnZlclxuXHRcdCAqIEBwYXJhbSB7b2JqZWN0fSBbZmlsZXNdIFRoZSBmaWxlcyB0byBzYXZlXG4gICAgICogQG1lbWJlcm9mIENvbm5lY3Rvci5Mb2NhbFxuICAgICAqL1xuICAgIGFkZFJlcXVlc3Q6IGZ1bmN0aW9uKGRhdGEsIGZpbGVzKSB7XG4gICAgICAgIHZhciBpc1ZhbGlkUG9vbCA9IHV0aWxzLmlzU3VwcG9ydEZvcm1EYXRhKCksXG4gICAgICAgICAgICByZXN1bHQgPSB0aGlzLl9zYXZlRmlsZShpc1ZhbGlkUG9vbCwgZmlsZXMpO1xuICAgICAgICBkYXRhLnN1Y2Nlc3Moe1xuICAgICAgICAgICAgaXRlbXM6IHJlc3VsdFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2F2ZSBmaWxlIHRvIHBvb2xcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzU3VwcG9ydEFqYXggV2hldGhlciBGb3JtRGF0YSBpcyBzdXBwb3J0ZWQgb3Igbm90XG5cdFx0ICogQHBhcmFtIHtvYmplY3R9IFtmaWxlc10gVGhlIGZpbGVzIHRvIHNhdmVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBtZW1iZXJvZiBDb25uZWN0b3IuTG9jYWxcbiAgICAgKi9cbiAgICBfc2F2ZUZpbGU6IGZ1bmN0aW9uKGlzU3VwcG9ydEFqYXgsIGZpbGVzKSB7XG4gICAgICAgIHZhciB1cGxvYWRlciA9IHRoaXMuX3VwbG9hZGVyLFxuICAgICAgICAgICAgaW5wdXRWaWV3ID0gdXBsb2FkZXIuaW5wdXRWaWV3LFxuICAgICAgICAgICAgZmlsZUVsID0gaW5wdXRWaWV3LiRpbnB1dFswXSxcblx0XHRcdFx0XHRcdHJlc3VsdCA9IFtdO1xuXG4gICAgICAgIGlmICghdGhpcy5fcmVzdWx0KSB7XG4gICAgICAgICAgICB0aGlzLl9yZXN1bHQgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc1N1cHBvcnRBamF4KSB7XG4gICAgICAgICAgICBmaWxlcyA9IGZpbGVzIHx8IGZpbGVFbC5maWxlcztcbiAgICAgICAgICAgIHR1aS51dGlsLmZvckVhY2goZmlsZXMsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICBpZiAodHVpLnV0aWwuaXNPYmplY3QoaXRlbSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goaXRlbSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaCh7XG4gICAgICAgICAgICAgICAgbmFtZTogZmlsZUVsLnZhbHVlLFxuICAgICAgICAgICAgICAgIGVsZW1lbnQ6IGZpbGVFbFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuXHRcdHRoaXMuX3Jlc3VsdCA9IHRoaXMuX3Jlc3VsdC5jb25jYXQocmVzdWx0KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZXMgZm9ybSBkYXRhIHRvIHNlbmQgUE9TVChGb3JtRGF0ZSBzdXBwb3J0ZWQgY2FzZSlcbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBtZW1iZXJvZiBDb25uZWN0b3IuTG9jYWxcbiAgICAgKi9cbiAgICBfbWFrZUZvcm1EYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHVwbG9hZGVyID0gdGhpcy5fdXBsb2FkZXIsXG5cdFx0ZmllbGQgPSB1cGxvYWRlci5maWxlRmllbGQsXG5cdFx0aW5wdXQgPSB1cGxvYWRlci5pbnB1dFZpZXcsXG5cdFx0Zm9ybSA9IG5ldyB3aW5kb3cuRm9ybURhdGEodGhpcy5fZXh0cmFjdEZvcm0oaW5wdXQpKTtcblxuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKHRoaXMuX3Jlc3VsdCwgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgZm9ybS5hcHBlbmQoZmllbGQsIGl0ZW0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGZvcm07XG4gICAgfSxcblxuXHQvKipcblx0ICogRXh0cmFjdHMgRm9ybSBmcm9tIGlucHV0Vmlld1xuXHQgKiBAcGFyYW0ge29iamVjdH0gaW5wdXQgVGhlIGlucHV0IHZpZXcgZm9yIGV4dHJhY3RpbmcgXG4gICAgICogQG1lbWJlcm9mIENvbm5lY3Rvci5Mb2NhbFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG5cdF9leHRyYWN0Rm9ybTogZnVuY3Rpb24oaW5wdXQpIHtcblx0dmFyIGZvcm0gPSBpbnB1dC4kZWwuY2xvbmUoKTtcblx0XHQvLyBhcHBlbmQgdG8gcG9vbFxuXHRcdHJldHVybiBmb3JtWzBdO1xuXHR9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpbGUgZm9ybSByZXN1bHQgYXJyYXlcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gaW5mbyBUaGUgaW5mb3JtYXRpb24gc2V0IHRvIHJlbW92ZSBmaWxlXG4gICAgICogQG1lbWJlcm9mIENvbm5lY3Rvci5Mb2NhbFxuICAgICAqL1xuICAgIHJlbW92ZVJlcXVlc3Q6IGZ1bmN0aW9uKGluZm8pIHtcbiAgICAgICAgdmFyIGRhdGEgPSBpbmZvLmRhdGE7XG4gICAgICAgIHRoaXMuX3Jlc3VsdCA9IHR1aS51dGlsLmZpbHRlcih0aGlzLl9yZXN1bHQsIGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICAgICByZXR1cm4gZWwubmFtZSAhPT0gZGF0YS5maWxlbmFtZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaW5mby5zdWNjZXNzKHtcbiAgICAgICAgICAgIGFjdGlvbjogJ3JlbW92ZScsXG4gICAgICAgICAgICBuYW1lOiBkYXRhLmZpbGVuYW1lXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZW5kIGZpbGVzIGluIGEgYmF0Y2guXG4gICAgICogQHBhcmFtIGNhbGxiYWNrXG4gICAgICogQG1lbWJlcm9mIENvbm5lY3Rvci5Mb2NhbFxuICAgICAqL1xuICAgIHN1Ym1pdDogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGZvcm0gPSB0aGlzLl9tYWtlRm9ybURhdGEoaW5wdXRWaWV3KTtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogdGhpcy5fdXBsb2FkZXIudXJsLnNlbmQsXG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICBkYXRhOiBmb3JtLFxuICAgICAgICAgICAgc3VjY2VzczogY2FsbGJhY2ssXG4gICAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgICBjb250ZW50VHlwZTogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBMb2NhbDtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBDb25maWd1cmF0aW9uIG9yIGRlZmF1bHQgdmFsdWVzLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIG9mIGNvbm5lY3Rpb24gd2l0aCBzZXJ2ZXIuXG4gICogQHR5cGUge3tSRVNQT05TRV9UWVBFOiBzdHJpbmcsIFJFRElSRUNUX1VSTDogc3RyaW5nfX1cbiAqL1xubW9kdWxlLmV4cG9ydHMuQ09ORiA9IHtcblx0UkVTUE9OU0VfVFlQRTogJ1JFU1BPTlNFX1RZUEUnLFxuXHRSRURJUkVDVF9VUkw6ICdSRURJUkVDVF9VUkwnLFxuXHRKU09OUENBTExCQUNLX05BTUU6ICdDQUxMQkFDS19OQU1FJyxcblx0U0laRV9VTklUOiAnU0laRV9VTklUJyxcblx0UkVNT1ZFX0NBTExCQUNLIDogJ3Jlc3BvbnNlUmVtb3ZlQ2FsbGJhY2snLFxuXHRFUlJPUjoge1xuXHRcdERFRkFVTFQ6ICdVbmtub3duIGVycm9yLicsXG5cdFx0Tk9UX1NVUlBQT1JUOiAnVGhpcyBpcyB4LWRvbWFpbiBjb25uZWN0aW9uLCB5b3UgaGF2ZSB0byBtYWtlIGhlbHBlciBwYWdlLidcblx0fSxcblx0RFJBR19ERUZBVUxUX0VOQUJMRV9DTEFTUzogJ2VuYWJsZUNsYXNzJyxcblx0RklMRV9GSUxFRF9OQU1FOiAndXNlcmZpbGVbXScsXG5cdEZPTERFUl9JTkZPOiAnZm9sZGVyTmFtZSdcbn07XG5cbi8qKlxuKiBEZWZhdWx0IEh0bWxzXG4qIEB0eXBlIHt7aW5wdXQ6IHN0cmluZywgaXRlbTogc3RyaW5nfX1cbiovXG5tb2R1bGUuZXhwb3J0cy5IVE1MID0ge1xuXHRmb3JtOiBbJzxmb3JtIGVuY3R5cGU9XCJtdWx0aXBhcnQvZm9ybS1kYXRhXCIgaWQ9XCJmb3JtRGF0YVwiIG1ldGhvZD1cInBvc3RcIj4nLFxuXHRcdCc8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJNQVhfRklMRV9TSVpFXCIgdmFsdWU9XCIzMDAwMDAwXCIgLz4nLFxuXHQnPC9mb3JtPiddLmpvaW4oJycpLFxuXHRpbnB1dDogWyc8aW5wdXQgdHlwZT1cImZpbGVcIiBpZD1cImZpbGVBdHRhY2hcIiB7e3dlYmtpdGRpcmVjdG9yeX19IG5hbWU9XCJ7e2ZpbGVGaWVsZH19XCIge3ttdWx0aXBsZX19IC8+J10uam9pbignJyksXG5cdHN1Ym1pdDogWyc8YnV0dG9uIGNsYXNzPVwiYmF0Y2hTdWJtaXRcIiB0eXBlPVwic3VibWl0XCI+U0VORDwvYnV0dG9uPiddLmpvaW4oJycpLFxuXHRpdGVtOiBbJzxsaSBjbGFzcz1cImZpbGV0eXBlRGlzcGxheUNsYXNzXCI+Jyxcblx0XHQnPHNwbmEgY2xhc3M9XCJmaWxlaWNvbiB7e2ZpbGV0eXBlfX1cIj57e2ZpbGV0eXBlfX08L3NwbmE+Jyxcblx0XHQnPHNwYW4gY2xhc3M9XCJmaWxlX25hbWVcIj57e2ZpbGVuYW1lfX08L3NwYW4+Jyxcblx0XHQnPHNwYW4gY2xhc3M9XCJmaWxlX3NpemVcIj57e2ZpbGVzaXplfX08L3NwYW4+Jyxcblx0XHQnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJ7e2RlbGV0ZUJ1dHRvbkNsYXNzTmFtZX19XCI+RGVsZXRlPC9idXR0b24+Jyxcblx0XHQnPC9saT4nXS5qb2luKCcnKSxcblx0ZHJhZzogWyc8ZGl2IGNsYXNzPVwiZHJhZ3pvbmVcIj48L2Rpdj4nXS5qb2luKCcnKVxufTtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBGaWxlVXBsb2FkZXIgaXMgY29yZSBvZiBmaWxlIHVwbG9hZGVyIGNvbXBvbmVudC48YnI+RmlsZU1hbmFnZXIgbWFuYWdlIGNvbm5lY3RvciB0byBjb25uZWN0IHNlcnZlciBhbmQgdXBkYXRlIEZpbGVMaXN0Vmlldy5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbnZhciBzdGF0aWNzID0gcmVxdWlyZSgnLi9zdGF0aWNzJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgY29ubiA9IHJlcXVpcmUoJy4vY29ubmVjdG9yL2Nvbm5lY3RvcicpO1xudmFyIElucHV0ID0gcmVxdWlyZSgnLi92aWV3L2lucHV0Jyk7XG52YXIgTGlzdCA9IHJlcXVpcmUoJy4vdmlldy9saXN0Jyk7XG52YXIgUG9vbCA9IHJlcXVpcmUoJy4vdmlldy9wb29sJyk7XG52YXIgRHJhZ0FuZERyb3AgPSByZXF1aXJlKCcuL3ZpZXcvZHJhZycpO1xuXG4vKipcbiAqIEZpbGVVcGxvYWRlciBhY3QgbGlrZSBicmlkZ2UgYmV0d2VlbiBjb25uZWN0b3IgYW5kIHZpZXcuXG4gKiBJdCBtYWtlcyBjb25uZWN0b3IgYW5kIHZpZXcgd2l0aCBvcHRpb24gYW5kIGVudmlyb25tZW50LlxuICogSXQgY29udHJvbCBhbmQgbWFrZSBjb25uZWN0aW9uIGFtb25nIG1vZHVsZXMuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFRoZSBvcHRpb25zIHRvIHNldCB1cCBmaWxlIHVwbG9hZGVyIG1vZHVsZXMuXG4gKiAgQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMudXJsIFRoZSB1cmwgaXMgZmlsZSBzZXJ2ZXIuXG4gKiAgICAgIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnVybC5zZW5kIFRoZSB1cmwgaXMgZm9yIGZpbGUgYXR0YWNoLlxuICogICAgICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy51cmwucmVtb3ZlIFRoZSB1cmwgaXMgZm9yIGZpbGUgZGV0YWNoLlxuICogIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLmhlbHBlciBUaGUgaGVscGVyIG9iamVjdCBpbmZvIGlzIGZvciB4LWRvbWFpbi5cbiAqICAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuaGVscGVyLnVybCBUaGUgdXJsIGlzIGhlbHBlciBwYWdlIHVybC5cbiAqICAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuaGVscGVyLm5hbWUgVGhlIG5hbWUgb2YgaGlkZGVuIGVsZW1lbnQgZm9yIHNlbmRpbmcgc2VydmVyIGhlbHBlciBwYWdlIGluZm9ybWF0aW9uLlxuICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnJlc3VsdFR5cGVFbGVtZW50TmFtZSBUaGUgdHlwZSBvZiBoaWRkZW4gZWxlbWVudCBmb3Igc2VuZGluZyBzZXJ2ZXIgcmVzcG9uc2UgdHlwZSBpbmZvcm1hdGlvbi5cbiAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5mb3JtVGFyZ2V0IFRoZSB0YXJnZXQgZm9yIHgtZG9tYWluIGpzb25wIGNhc2UuXG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuY2FsbGJhY2tOYW1lIFRoZSBuYW1lIG9mIGpzb25wIGNhbGxiYWNrIGZ1bmN0aW9uLlxuICogIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLmxpc3RJbmZvIFRoZSBlbGVtZW50IGluZm8gdG8gZGlzcGxheSBmaWxlIGxpc3QgaW5mb3JtYXRpb24uXG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuc2VwYXJhdG9yIFRoZSBzZXBhcmF0b3IgZm9yIGpzb25wIGhlbHBlciByZXNwb25zZS5cbiAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZmlsZUZpZWxkPXVzZXJGaWxlXSBUaGUgZmllbGQgbmFtZSBvZiBpbnB1dCBmaWxlIGVsZW1lbnQuXG4gKiAgQHBhcmFtIHtib29sZWFufSBvcHRpb25zLnVzZUZvbGRlciBXaGV0aGVyIHNlbGVjdCB1bml0IGlzIGZvbGRlciBvZiBub3QuIElmIHRoaXMgaXMgdHVyZSwgbXVsdGlwbGUgd2lsbCBiZSBpZ25vcmVkLlxuICogIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy5pc011bHRpcGxlIFdoZXRoZXIgZW5hYmxlIG11bHRpcGxlIHNlbGVjdCBvciBub3QuXG4gKiBAcGFyYW0ge2pRdWVyeX0gJGVsIFJvb3QgRWxlbWVudCBvZiBVcGxvYWRlclxuICogQGV4YW1wbGVcbiAqIHZhciB1cGxvYWRlciA9IG5ldyB0dWkuY29tcG9uZW50LlVwbG9hZGVyKHtcbiAqICAgICB1cmw6IHtcbiAqICAgICAgICAgc2VuZDogXCJodHRwOi8vZmUubmhuZW50LmNvbS9ldGMvZXRjL3VwbG9hZGVyL3VwbG9hZGVyLnBocFwiLFxuICogICAgICAgICByZW1vdmU6IFwiaHR0cDovL2ZlLm5obmVudC5jb20vZXRjL2V0Yy91cGxvYWRlci9yZW1vdmUucGhwXCJcbiAqICAgICB9LFxuICogICAgIGhlbHBlcjoge1xuICogICAgICAgICB1cmw6ICdodHRwOi8vMTAuNzcuMzQuMTI2OjgwMDkvc2FtcGxlcy9yZXNwb25zZS5odG1sJyxcbiAqICAgICAgICAgbmFtZTogJ1JFRElSRUNUX1VSTCdcbiAqICAgICB9LFxuICogICAgIHJlc3VsdFR5cGVFbGVtZW50TmFtZTogJ1JFU1BPTlNFX1RZUEUnLFxuICogICAgIGZvcm1UYXJnZXQ6ICdoaWRkZW5GcmFtZScsXG4gKiAgICAgY2FsbGJhY2tOYW1lOiAncmVzcG9uc2VDYWxsYmFjaycsXG4gKiAgICAgbGlzdEluZm86IHtcbiAqICAgICAgICAgbGlzdDogJCgnI2ZpbGVzJyksXG4gKiAgICAgICAgIGNvdW50OiAkKCcjZmlsZV9jb3VudCcpLFxuICogICAgICAgICBzaXplOiAkKCcjc2l6ZV9jb3VudCcpXG4gKiAgICAgfSxcbiAqICAgICBzZXBhcmF0b3I6ICc7J1xuICogfSwgJCgnI3VwbG9hZGVyJykpO1xuICovXG52YXIgVXBsb2FkZXIgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKipAbGVuZHMgVXBsb2FkZXIucHJvdG90eXBlICove1xuXG5cdC8qKlxuXHQgKiBpbml0aWFsaXplXG5cdCAqL1xuXHRpbml0OiBmdW5jdGlvbihvcHRpb25zLCAkZWwpIHtcblx0XHR0aGlzLl9zZXREYXRhKG9wdGlvbnMpO1xuXHRcdHRoaXMuX3NldENvbm5lY3RvcigpO1xuXG5cdFx0dGhpcy4kZWwgPSAkZWw7XG5cblx0XHRpZih0aGlzLnVzZURyYWcgJiYgIXRoaXMudXNlRm9sZGVyICYmIHV0aWxzLmlzU3VwcG9ydEZpbGVTeXN0ZW0oKSkge1xuXHRcdFx0dGhpcy5kcmFnVmlldyA9IG5ldyBEcmFnQW5kRHJvcChvcHRpb25zLCB0aGlzKTtcblx0XHR9XG5cblx0XHR0aGlzLmlucHV0VmlldyA9IG5ldyBJbnB1dChvcHRpb25zLCB0aGlzKTtcblx0XHR0aGlzLmxpc3RWaWV3ID0gbmV3IExpc3Qob3B0aW9ucywgdGhpcyk7XG5cblx0XHR0aGlzLmZpbGVGaWVsZCA9IHRoaXMuZmlsZUZpZWxkIHx8IHN0YXRpY3MuQ09ORi5GSUxFX0ZJTEVEX05BTUU7XG5cdFx0dGhpcy5fcG9vbCA9IG5ldyBQb29sKHRoaXMuaW5wdXRWaWV3LiRlbFswXSk7XG5cdFx0dGhpcy5fYWRkRXZlbnQoKTtcblx0fSxcblx0XG5cdC8qKlxuXHQgKiBTZXQgQ29ubmVjdG9yIGJ5IHVzZUpzb25wIGZsYWcgYW5kIHdoZXRoZXIuXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfc2V0Q29ubmVjdG9yOiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5pc0JhdGNoVHJhbnNmZXIpIHtcblx0XHRcdHRoaXMudHlwZSA9ICdsb2NhbCc7XG5cdFx0fSBlbHNlIGlmICh0aGlzLmlzQ3Jvc3NEb21haW4oKSkge1xuXHRcdFx0aWYgKHRoaXMuaGVscGVyKSB7XG5cdFx0XHRcdHRoaXMudHlwZSA9ICdqc29ucCc7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhbGVydChzdGF0aWNzLkNPTkYuRVJST1IuTk9UX1NVUlBQT1JUKTtcbiAgICAgICAgICAgICAgICB0aGlzLnR5cGUgPSAnbG9jYWwnOyAgICBcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKHRoaXMudXNlSnNvbnAgfHwgIXV0aWxzLmlzU3VwcG9ydEZvcm1EYXRhKCkpIHtcblx0XHRcdFx0dGhpcy50eXBlID0gJ2pzb25wJztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMudHlwZSA9ICdhamF4Jztcblx0XHRcdH1cblx0XHR9XG5cdFx0dGhpcy5fY29ubmVjdG9yID0gY29ubi5nZXRDb25uZWN0b3IodGhpcyk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFVwZGF0ZSBsaXN0IHZpZXcgd2l0aCBjdXN0b20gb3Igb3JpZ2luYWwgZGF0YS5cblx0ICogQHBhcmFtIHtvYmplY3R9IGluZm8gVGhlIGRhdGEgZm9yIHVwZGF0ZSBsaXN0XG5cdCAqICBAcGFyYW0ge3N0cmluZ30gaW5mby5hY3Rpb24gVGhlIGFjdGlvbiBuYW1lIHRvIGV4ZWN1dGUgbWV0aG9kXG5cdCAqL1xuXHRub3RpZnk6IGZ1bmN0aW9uKGluZm8pIHtcblx0XHR0aGlzLmxpc3RWaWV3LnVwZGF0ZShpbmZvKTtcblx0XHR0aGlzLmxpc3RWaWV3LnVwZGF0ZVRvdGFsSW5mbyhpbmZvKTtcblx0fSxcblxuXHQvKipcblx0ICogU2V0IGZpZWxkIGRhdGEgYnkgb3B0aW9uIHZhbHVlcy5cblx0ICogQHBhcmFtIG9wdGlvbnNcblx0ICogQHByaXZhdGVcbiAgICAgKi9cblx0X3NldERhdGE6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0XHR0dWkudXRpbC5leHRlbmQodGhpcywgb3B0aW9ucyk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEV4dHJhY3QgcHJvdG9jb2wgKyBkb21haW4gZnJvbSB1cmwgdG8gZmluZCBvdXQgd2hldGhlciBjcm9zcy1kb21haW4gb3Igbm90LlxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdGlzQ3Jvc3NEb21haW46IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBwYWdlRG9tYWluID0gZG9jdW1lbnQuZG9tYWluO1xuXHRcdHJldHVybiB0aGlzLnVybC5zZW5kLmluZGV4T2YocGFnZURvbWFpbikgPT09IC0xO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBDYWxsYmFjayBmb3IgZXJyb3Jcblx0ICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIEVycm9yIHJlc3BvbnNlXG5cdCAqL1xuXHRlcnJvckNhbGxiYWNrOiBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdHZhciBtZXNzYWdlO1xuXHRcdGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5tc2cpIHtcblx0XHRcdG1lc3NhZ2UgPSByZXNwb25zZS5tc2c7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG1lc3NhZ2UgPSBzdGF0aWNzLkNPTkYuRVJST1IuREVGQVVMVDtcblx0XHR9XG5cdFx0YWxlcnQobWVzc2FnZSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIENhbGxiYWNrIGZvciBjdXN0b20gc2VuZCBldmVudFxuXHQgKiBAcGFyYW0ge29iamVjdH0gW2RhdGFdIFRoZSBkYXRhIGluY2x1ZGUgY2FsbGJhY2sgZnVuY3Rpb24gZm9yIGZpbGUgY2xvbmVcblx0ICovXG5cdHNlbmRGaWxlOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0dmFyIGNhbGxiYWNrID0gdHVpLnV0aWwuYmluZCh0aGlzLm5vdGlmeSwgdGhpcyksXG5cdFx0ZmlsZXMgPSBkYXRhICYmIGRhdGEuZmlsZXM7XG5cdFx0XG5cdFx0dGhpcy5fY29ubmVjdG9yLmFkZFJlcXVlc3Qoe1xuXHRcdFx0dHlwZTogJ2FkZCcsXG5cdFx0XHRzdWNjZXNzOiBmdW5jdGlvbihyZXN1bHQpIHtcblx0XHRcdFx0aWYgKGRhdGEgJiYgZGF0YS5jYWxsYmFjaykge1xuXHRcdFx0XHRcdGRhdGEuY2FsbGJhY2socmVzdWx0KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRjYWxsYmFjayhyZXN1bHQpO1xuXHRcdFx0fSxcblx0XHRcdGVycm9yOiB0aGlzLmVycm9yQ2FsbGJhY2tcblx0XHR9LCBmaWxlcyk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIENhbGxiYWNrIGZvciBjdXN0b20gcmVtb3ZlIGV2ZW50XG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIFRoZSBkYXRhIGZvciByZW1vdmUgZmlsZS5cblx0ICovXG5cdHJlbW92ZUZpbGU6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHR2YXIgY2FsbGJhY2sgPSB0dWkudXRpbC5iaW5kKHRoaXMubm90aWZ5LCB0aGlzKTtcblx0XHR0aGlzLl9jb25uZWN0b3IucmVtb3ZlUmVxdWVzdCh7XG5cdFx0XHR0eXBlOiAncmVtb3ZlJyxcblx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRzdWNjZXNzOiBjYWxsYmFja1xuXHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBTdWJtaXQgZm9yIGRhdGEgc3VibWl0IHRvIHNlcnZlclxuICAgICAqIEBhcGlcblx0ICovXG5cdHN1Ym1pdDogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMuX2Nvbm5lY3Rvci5zdWJtaXQpIHtcblx0XHRcdGlmICh1dGlscy5pc1N1cHBvcnRGb3JtRGF0YSgpKSB7XG5cdFx0XHRcdHRoaXMuX2Nvbm5lY3Rvci5zdWJtaXQodHVpLnV0aWwuYmluZChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHQvKipcblx0XHRcdFx0XHQgKiBAYXBpXG5cdFx0XHRcdFx0ICogQGV2ZW50IFVwbG9hZGVyI2JlZm9yZXN1Ym1pdFxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge1VwbG9hZGVyfSB1cGxvYWRlciAtIHVwbG9hZGVyIGluc3RhbmNlXG5cdFx0XHRcdFx0ICovXG5cdFx0XHRcdFx0dGhpcy5maXJlKCdiZWZvcmVzdWJtaXQnLCB0aGlzKTtcblx0XHRcdFx0fSwgdGhpcykpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5fcG9vbC5wbGFudCgpO1xuXHRcdFx0fVxuXHRcdH0gXG5cdH0sXG5cblx0LyoqXG5cdCAqIEdldCBmaWxlIGluZm8gbG9jYWxseVxuXHQgKiBAcGFyYW0ge0h0bWxFbGVtZW50fSBlbGVtZW50IElucHV0IGVsZW1lbnRcblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9nZXRGaWxlSW5mbzogZnVuY3Rpb24oZWxlbWVudCkge1xuXHRcdHZhciBmaWxlcztcblx0XHRpZiAodXRpbHMuaXNTdXBwb3J0RmlsZVN5c3RlbSgpKSB7XG5cdFx0XHRmaWxlcyA9IHRoaXMuX2dldEZpbGVMaXN0KGVsZW1lbnQuZmlsZXMpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmaWxlcyA9IHtcblx0XHRcdFx0bmFtZTogZWxlbWVudC52YWx1ZSxcblx0XHRcdFx0aWQ6IGVsZW1lbnQudmFsdWVcblx0XHRcdH07XG5cdFx0fVxuXHRcdHJldHVybiBmaWxlcztcblx0fSxcblxuXHQvKipcblx0ICogR2V0IGZpbGUgbGlzdCBmcm9tIEZpbGVMaXN0IG9iamVjdFxuXHQgKiBAcGFyYW0ge0ZpbGVMaXN0fSBmaWxlcyBBIEZpbGVMaXN0IG9iamVjdFxuXHQgKiBAcmV0dXJucyB7QXJyYXl9XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfZ2V0RmlsZUxpc3Q6IGZ1bmN0aW9uKGZpbGVzKSB7XG5cdFx0cmV0dXJuIHR1aS51dGlsLm1hcChmaWxlcywgZnVuY3Rpb24oZmlsZSkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0bmFtZTogZmlsZS5uYW1lLFxuXHRcdFx0XHRzaXplOiBmaWxlLnNpemUsXG5cdFx0XHRcdGlkOiBmaWxlLm5hbWVcblx0XHRcdH07XG5cdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEFkZCBldmVudCB0byBsaXN0dmlldyBhbmQgaW5wdXR2aWV3XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfYWRkRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHRpZih0aGlzLnVzZURyYWcgJiYgdGhpcy5kcmFnVmlldykge1xuXHRcdFx0Ly8gQHRvZG8gdG9wIOyymOumrOqwgCDrlLDroZwg7ZWE7JqU7ZWoLCBzZW5kRmlsZSDsgqzsmqkg7JWI65CoXG5cdFx0XHR0aGlzLmRyYWdWaWV3Lm9uKCdkcm9wJywgdGhpcy5zZW5kRmlsZSwgdGhpcyk7XG5cdFx0fVxuXHRcdGlmICh0aGlzLmlzQmF0Y2hUcmFuc2Zlcikge1xuXHRcdFx0dGhpcy5pbnB1dFZpZXcub24oJ3NhdmUnLCB0aGlzLnNlbmRGaWxlLCB0aGlzKTtcblx0XHRcdHRoaXMubGlzdFZpZXcub24oJ3JlbW92ZScsIHRoaXMucmVtb3ZlRmlsZSwgdGhpcyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuaW5wdXRWaWV3Lm9uKCdjaGFuZ2UnLCB0aGlzLnNlbmRGaWxlLCB0aGlzKTtcblx0XHRcdHRoaXMubGlzdFZpZXcub24oJ3JlbW92ZScsIHRoaXMucmVtb3ZlRmlsZSwgdGhpcyk7XG5cdFx0fVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDdXN0b20gRXZlbnRzXG4gICAgICAgICAqIEBhcGlcbiAgICAgICAgICogQGV2ZW50IFVwbG9hZGVyI2ZpbGVBZGRlZFxuICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gdGFyZ2V0IC0gVGFyZ2V0IGl0ZW0gaW5mb3JtYXRpb25cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubGlzdFZpZXcub24oJ2ZpbGVBZGRlZCcsIGZ1bmN0aW9uKHRhcmdldCkge1xuICAgICAgICAgICAgc2VsZi5maXJlKHRhcmdldCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDdXN0b20gRXZlbnRzXG4gICAgICAgICAqIEBhcGlcbiAgICAgICAgICogQGV2ZW50IFVwbG9hZGVyI2ZpbGVSZW1vdmVkXG4gICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBuYW1lIC0gVGhlIGZpbGUgbmFtZSB0byByZW1vdmVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubGlzdFZpZXcub24oJ2ZpbGVSZW1vdmVkJywgZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgICAgc2VsZi5maXJlKG5hbWUpO1xuICAgICAgICB9KTtcblx0fSxcblxuXHQvKipcblx0ICogU3RvcmUgaW5wdXQgZWxlbWVudCB0byBwb29sLlxuXHQgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBpbnB1dCBBIGlucHV0IGVsZW1lbnRbdHlwZT1maWxlXSBmb3Igc3RvcmUgcG9vbFxuXHQgKi9cblx0c3RvcmU6IGZ1bmN0aW9uKGlucHV0KSB7XG5cdFx0dGhpcy5fcG9vbC5zdG9yZShpbnB1dCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJlbW92ZSBpbnB1dCBlbGVtZW50IGZvcm0gcG9vbC5cblx0ICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGZpbGUgbmFtZSB0byByZW1vdmVcblx0ICovXG5cdHJlbW92ZTogZnVuY3Rpb24obmFtZSkge1xuXHRcdGlmICghdXRpbHMuaXNTdXBwb3J0Rm9ybURhdGEoKSkge1xuXHRcdFx0dGhpcy5fcG9vbC5yZW1vdmUobmFtZSk7XG5cdFx0fVxuXHR9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKFVwbG9hZGVyKTtcbm1vZHVsZS5leHBvcnRzID0gVXBsb2FkZXI7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgVGhpcyBmaWxlIGNvbnRhaW4gdXRpbGl0eSBtZXRob2RzIGZvciB1cGxvYWRlci5cbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cblxuLyoqXG4gKiBAbmFtZXNwYWNlIHV0aWxzXG4gKi9cblxuLyoqXG4gKiBFeHRyYWN0IHVuaXQgZm9yIGZpbGUgc2l6ZVxuICogQHBhcmFtIHtudW1iZXJ9IGJ5dGVzIEEgdXNhZ2Ugb2YgZmlsZVxuICogQG1lbWJlcm9mIHV0aWxzXG4gKi9cbnZhciBnZXRGaWxlU2l6ZVdpdGhVbml0ID0gZnVuY3Rpb24oYnl0ZXMpIHtcbiAgICB2YXIgdW5pdHMgPSBbJ0InLCAnS0InLCAnTUInLCAnR0InLCAnVEInXSxcbiAgICAgICAgYnl0ZXMgPSBwYXJzZUludChieXRlcywgMTApLFxuICAgICAgICBleHAgPSBNYXRoLmxvZyhieXRlcykgLyBNYXRoLmxvZygxMDI0KSB8IDAsXG4gICAgICAgIHJlc3VsdCA9IChieXRlcyAvIE1hdGgucG93KDEwMjQsIGV4cCkpLnRvRml4ZWQoMik7XG5cbiAgICByZXR1cm4gcmVzdWx0ICsgdW5pdHNbZXhwXTtcbn07XG5cbi8qKlxuICogV2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0IEZvcm1EYXRhIG9yIG5vdFxuICogQG1lbWJlcm9mIHV0aWxzXG4gKi9cbnZhciBpc1N1cHBvcnRGb3JtRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBGb3JtRGF0YSA9ICh3aW5kb3cuRm9ybURhdGEgfHwgbnVsbCk7XG4gICAgcmV0dXJuICEhRm9ybURhdGE7XG59O1xuXG4vKipcbiAqIEdldCBpdGVtIGVsZW1lbiBIVE1MXG4gKiBAcGFyYW0ge3N0cmluZ30gaHRtbCBIVE1MIHRlbXBsYXRlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICogQG1lbWJlcm9mIHV0aWxzXG4gKi9cbnZhciB0ZW1wbGF0ZSA9IGZ1bmN0aW9uKG1hcCwgaHRtbCkge1xuICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoL1xce1xceyhbXlxcfV0rKVxcfVxcfS9nLCBmdW5jdGlvbihtc3RyLCBuYW1lKSB7XG4gICAgICAgIHJldHVybiBtYXBbbmFtZV07XG4gICAgfSk7XG4gICAgcmV0dXJuIGh0bWw7XG59O1xuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgc3VwcG9ydCBmaWxlIGFwaSBvciBub3RcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICogQG1lbWJlcm9mIHV0aWxzXG4gKi9cbnZhciBpc1N1cHBvcnRGaWxlU3lzdGVtID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICEhKHdpbmRvdy5GaWxlICYmIHdpbmRvdy5GaWxlUmVhZGVyICYmIHdpbmRvdy5GaWxlTGlzdCAmJiB3aW5kb3cuQmxvYik7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRGaWxlU2l6ZVdpdGhVbml0OiBnZXRGaWxlU2l6ZVdpdGhVbml0LFxuICAgIGlzU3VwcG9ydEZpbGVTeXN0ZW06IGlzU3VwcG9ydEZpbGVTeXN0ZW0sXG4gICAgaXNTdXBwb3J0Rm9ybURhdGE6IGlzU3VwcG9ydEZvcm1EYXRhLFxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZVxufTtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIGZpbGUgaXMgYWJvdXQgZHJhZyBhbmQgZHJvcCBmaWxlIHRvIHNlbmQuIERyYWcgYW5kIGRyb3AgaXMgcnVubmluZyB2aWEgZmlsZSBhcGkuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG52YXIgc3RhdGljcyA9IHJlcXVpcmUoJy4uL3N0YXRpY3MnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cbi8qKlxuICogTWFrZXMgZHJhZyBhbmQgZHJvcCBhcmVhLCB0aGUgZHJvcHBlZCBmaWxlIGlzIGFkZGVkIHZpYSBldmVudCBkcm9wIGV2ZW50LlxuICogQGNsYXNzIFZpZXcuRHJhZ0FuZERyb3BcbiAqL1xudmFyIERyYWdBbmREcm9wID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBWaWV3LkRyYWdBbmREcm9wLnByb3RvdHlwZSAqL3tcblx0LyoqXG5cdCAqIGluaXRpYWxpemUgRHJhZ0FuZERyb3Bcblx0ICovXG5cdGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMsIHVwbG9hZGVyKSB7XG5cdFx0dmFyIGh0bWwgPSBvcHRpb25zLnRlbXBsYXRlICYmIG9wdGlvbnMudGVtcGxhdGUuZHJhZyB8fCBzdGF0aWNzLkhUTUwuZHJhZztcblx0XHR0aGlzLl9lbmFibGVDbGFzcyA9IG9wdGlvbnMuZHJhZyAmJiBvcHRpb25zLmRyYWcuZW5hYmxlQ2xhc3MgfHwgc3RhdGljcy5DT05GLkRSQUdfREVGQVVMVF9FTkFCTEVfQ0xBU1M7XG5cdFx0dGhpcy5fcmVuZGVyKGh0bWwsIHVwbG9hZGVyKTtcblx0XHR0aGlzLl9hZGRFdmVudCgpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZW5kZXJzIGRyYWcgYW5kIGRyb3AgYXJlYVxuXHQgKiBAcGFyYW0ge3N0cmluZ30gaHRtbCBUaGUgaHRtbCBzdHJpbmcgdG8gbWFrZSBkYXJnIHpvbmVcblx0ICogQHBhcmFtIHtvYmplY3R9IHVwbG9hZGVyIFRoZSBjb3JlIGluc3RhbmNlIG9mIHRoaXMgY29tcG9uZW50XG4gICAgICogQHByaXZhdGVcblx0ICovXG5cdF9yZW5kZXI6IGZ1bmN0aW9uKGh0bWwsIHVwbG9hZGVyKSB7XG5cdFx0dGhpcy4kZWwgPSAkKGh0bWwpO1xuXHRcdHVwbG9hZGVyLiRlbC5hcHBlbmQodGhpcy4kZWwpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBZGRzIGRyYWcgYW5kIGRyb3AgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X2FkZEV2ZW50OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5vbignZHJhZ2VudGVyJywgdHVpLnV0aWwuYmluZCh0aGlzLm9uRHJhZ0VudGVyLCB0aGlzKSk7XG5cdFx0dGhpcy4kZWwub24oJ2RyYWdvdmVyJywgdHVpLnV0aWwuYmluZCh0aGlzLm9uRHJhZ092ZXIsIHRoaXMpKTtcblx0XHR0aGlzLiRlbC5vbignZHJvcCcsIHR1aS51dGlsLmJpbmQodGhpcy5vbkRyb3AsIHRoaXMpKTtcblx0XHR0aGlzLiRlbC5vbignZHJhZ2xlYXZlJywgdHVpLnV0aWwuYmluZCh0aGlzLm9uRHJhZ0xlYXZlLCB0aGlzKSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEhhbmRsZXMgZHJhZ2VudGVyIGV2ZW50XG5cdCAqL1xuXHRvbkRyYWdFbnRlcjogZnVuY3Rpb24oZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdHRoaXMuX2VuYWJsZSgpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBIYW5kbGVzIGRyYWdvdmVyIGV2ZW50XG5cdCAqL1xuXHRvbkRyYWdPdmVyOiBmdW5jdGlvbihlKSB7XG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEhhbmRsZXMgZHJhZ2xlYXZlIGV2ZW50XG5cdCAqL1xuXHRvbkRyYWdMZWF2ZTogZnVuY3Rpb24oZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdHRoaXMuX2Rpc2FibGUoKTtcblx0fSxcblxuXHQvKipcblx0ICogSGFuZGxlcyBkcm9wIGV2ZW50XG5cdCAqL1xuXHRvbkRyb3A6IGZ1bmN0aW9uKGUpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0dGhpcy5fZGlzYWJsZSgpO1xuXHRcdHRoaXMuZmlyZSgnZHJvcCcsIHtcblx0XHRcdGZpbGVzOiBlLm9yaWdpbmFsRXZlbnQuZGF0YVRyYW5zZmVyLmZpbGVzXG5cdFx0fSk7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9LFxuXG5cdF9lbmFibGU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmFkZENsYXNzKHRoaXMuX2VuYWJsZUNsYXNzKTtcblx0fSxcblxuXHRfZGlzYWJsZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3ModGhpcy5fZW5hYmxlQ2xhc3MpO1xuXHR9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKERyYWdBbmREcm9wKTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcmFnQW5kRHJvcDtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBJbnB1dFZpZXcgbWFrZSBpbnB1dCBmb3JtIGJ5IHRlbXBsYXRlLiBBZGQgZXZlbnQgZmlsZSB1cGxvYWQgZXZlbnQuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG52YXIgc3RhdGljcyA9IHJlcXVpcmUoJy4uL3N0YXRpY3MnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cbi8qKlxuICogVGhpcyB2aWV3IGNvbnRyb2wgaW5wdXQgZWxlbWVudCB0eXBlZCBmaWxlLlxuICogQGNvbnN0cnVjdG9yIFZpZXcuSW5wdXRWaWV3XG4gKi9cbnZhciBJbnB1dCA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKkBsZW5kcyBWaWV3LklucHV0LnByb3RvdHlwZSAqKi97XG5cdC8qKlxuXHQgKiBJbml0aWFsaXplIGlucHV0IGVsZW1lbnQuXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cblx0ICovXG5cdGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMsIHVwbG9hZGVyKSB7XG5cblx0XHR0aGlzLl91cGxvYWRlciA9IHVwbG9hZGVyO1xuXHRcdHRoaXMuX3RhcmdldCA9IG9wdGlvbnMuZm9ybVRhcmdldDtcblx0XHR0aGlzLl91cmwgPSBvcHRpb25zLnVybDtcblx0XHR0aGlzLl9pc0JhdGNoVHJhbnNmZXIgPSBvcHRpb25zLmlzQmF0Y2hUcmFuc2Zlcjtcblx0XHR0aGlzLl9pc011bHRpcGxlID0gISEodXRpbHMuaXNTdXBwb3J0Rm9ybURhdGEoKSAmJiBvcHRpb25zLmlzTXVsdGlwbGUpO1xuXHRcdHRoaXMuX3VzZUZvbGRlciA9ICEhKHV0aWxzLmlzU3VwcG9ydEZvcm1EYXRhKCkgJiYgb3B0aW9ucy51c2VGb2xkZXIpO1xuXG5cdFx0dGhpcy5faHRtbCA9IHRoaXMuX3NldEhUTUwob3B0aW9ucy50ZW1wbGF0ZSk7XG5cblx0XHR0aGlzLl9yZW5kZXIoKTtcblx0XHR0aGlzLl9yZW5kZXJIaWRkZW5FbGVtZW50cygpO1xuXG5cdFx0aWYgKG9wdGlvbnMuaGVscGVyKSB7XG5cdFx0XHR0aGlzLl9tYWtlQnJpZGdlSW5mb0VsZW1lbnQob3B0aW9ucy5oZWxwZXIpO1xuXHRcdH1cblxuXHRcdHRoaXMuX2FkZEV2ZW50KCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJlbmRlciBpbnB1dCBhcmVhXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfcmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbCA9ICQodGhpcy5fZ2V0SHRtbCgpKTtcblx0XHR0aGlzLiRlbC5hdHRyKHtcblx0XHRcdGFjdGlvbjogdGhpcy5fdXJsLnNlbmQsXG5cdFx0XHRtZXRob2Q6ICdwb3N0Jyxcblx0XHRcdGVuY3R5cGU6IFwibXVsdGlwYXJ0L2Zvcm0tZGF0YVwiLFxuXHRcdFx0dGFyZ2V0OiAoIXRoaXMuX2lzQmF0Y2hUcmFuc2ZlciA/IHRoaXMuX3RhcmdldCA6ICcnKVxuXHRcdH0pO1xuXHRcdHRoaXMuJGlucHV0ID0gdGhpcy5fZ2V0SW5wdXRFbGVtZW50KCk7XG5cdFx0dGhpcy4kc3VibWl0ID0gdGhpcy5fZ2V0U3VibWl0RWxlbWVudCgpO1xuXHRcdHRoaXMuJGlucHV0LmFwcGVuZFRvKHRoaXMuJGVsKTtcblx0XHRpZiAodGhpcy4kc3VibWl0KSB7XG5cdFx0XHR0aGlzLiRzdWJtaXQuYXBwZW5kVG8odGhpcy4kZWwpO1xuXHRcdH1cblx0XHR0aGlzLl91cGxvYWRlci4kZWwuYXBwZW5kKHRoaXMuJGVsKTtcblx0fSxcblxuXHQvKipcblx0ICogU2V0IGFsbCBvZiBpbnB1dCBlbGVtZW50cyBodG1sIHN0cmluZ3MuXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBbdGVtcGxhdGVdIFRoZSB0ZW1wbGF0ZSBpcyBzZXQgZm9ybSBjdXN0b21lci5cblx0ICogQHJldHVybiB7b2JqZWN0fSBUaGUgaHRtbCBzdHJpbmcgc2V0IGZvciBpbnB1dFZpZXdcblx0ICovXG5cdF9zZXRIVE1MOiBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuXHRcdGlmICghdGVtcGxhdGUpIHtcblx0XHRcdHRlbXBsYXRlID0ge307XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGlucHV0OiB0ZW1wbGF0ZS5pbnB1dCB8fCBzdGF0aWNzLkhUTUwuaW5wdXQsXG5cdFx0XHRzdWJtaXQ6IHRlbXBsYXRlLnN1Ym1pdCB8fCBzdGF0aWNzLkhUTUwuc3VibWl0LFxuXHRcdFx0Zm9ybTogdGVtcGxhdGUuZm9ybSB8fCBzdGF0aWNzLkhUTUwuZm9ybVxuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIEdldCBodG1sIHN0cmluZyBmcm9tIHRlbXBsYXRlXG5cdCAqIEByZXR1cm4ge29iamVjdH1cblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9nZXRIdG1sOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5faHRtbC5mb3JtO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBNYWtlcyBhbmQgcmV0dXJucyBqcXVlcnkgZWxlbWVudFxuXHQgKiBAcmV0dXJuIHtvYmplY3R9IFRoZSBqcXVlcnkgb2JqZWN0IHdyYXBwaW5nIG9yaWdpbmFsIGlucHV0IGVsZW1lbnRcblx0ICovXG5cdF9nZXRJbnB1dEVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBtYXAgPSB7XG5cdFx0XHRtdWx0aXBsZTogdGhpcy5faXNNdWx0aXBsZSA/ICdtdWx0aXBsZScgOiAnJyxcblx0XHRcdGZpbGVGaWVsZDogdGhpcy5fdXBsb2FkZXIuZmlsZUZpZWxkLFxuXHRcdFx0d2Via2l0ZGlyZWN0b3J5OiB0aGlzLl91c2VGb2xkZXIgPyAnd2Via2l0ZGlyZWN0b3J5JyA6ICcnXG5cdFx0fTtcblxuXHRcdHJldHVybiAkKHV0aWxzLnRlbXBsYXRlKG1hcCwgdGhpcy5faHRtbC5pbnB1dCkpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBNYWtlcyBhbmQgcmV0dXJucyBqcXVlcnkgZWxlbWVudFxuXHQgKiBAcmV0dXJuIHtvYmplY3R9IFRoZSBqcXVlcnkgb2JqZWN0IHdyYXBwaW5nIHN1bWJpdCBidXR0b24gZWxlbWVudFxuXHQgKi9cblx0X2dldFN1Ym1pdEVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLl9pc0JhdGNoVHJhbnNmZXIpIHtcblx0XHRcdHJldHVybiAkKHRoaXMuX2h0bWwuc3VibWl0KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1x0XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBDYWxsIG1ldGhvZHMgdGhvc2UgbWFrZSBlYWNoIGhpZGRlbiBlbGVtZW50LlxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X3JlbmRlckhpZGRlbkVsZW1lbnRzOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLl9tYWtlVGFyZ2V0RnJhbWUoKTtcblx0XHR0aGlzLl9tYWtlUmVzdWx0VHlwZUVsZW1lbnQoKTtcblx0XHR0aGlzLl9tYWtlQ2FsbGJhY2tFbGVtZW50KCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEFkZCBldmVudFxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X2FkZEV2ZW50OiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5faXNCYXRjaFRyYW5zZmVyKSB7XG5cdFx0XHR0aGlzLiRlbC5vbignc3VibWl0JywgdHVpLnV0aWwuYmluZChmdW5jdGlvbigpIHtcblx0XHRcdFx0dGhpcy5fdXBsb2FkZXIuc3VibWl0KCk7XG5cdFx0XHR9LCB0aGlzKSk7XG5cdFx0fVxuXHRcdHRoaXMuX2FkZElucHV0RXZlbnQoKTtcblx0fSxcblxuXHQvKipcblx0ICogQWRkIGlucHV0IGVsZW1lbnQgY2hhbmdlIGV2ZW50IGJ5IHNlbmRpbmcgdHlwZVxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X2FkZElucHV0RXZlbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLl9pc0JhdGNoVHJhbnNmZXIpIHtcblx0XHRcdHRoaXMuJGlucHV0Lm9uKCdjaGFuZ2UnLCB0dWkudXRpbC5iaW5kKHRoaXMub25TYXZlLCB0aGlzKSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuJGlucHV0Lm9uKCdjaGFuZ2UnLCB0dWkudXRpbC5iaW5kKHRoaXMub25DaGFuZ2UsIHRoaXMpKTtcblx0XHR9XG5cdH0sXG5cblx0LyoqXG5cdCAqIEV2ZW50LUhhbmRsZSBmb3IgaW5wdXQgZWxlbWVudCBjaGFuZ2Vcblx0ICovXG5cdG9uQ2hhbmdlOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIXRoaXMuJGlucHV0WzBdLnZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm47IFxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZmlyZSgnY2hhbmdlJywge1xuXHRcdFx0dGFyZ2V0OiB0aGlzXG5cdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEV2ZW50LUhhbmRsZSBmb3Igc2F2ZSBpbnB1dCBlbGVtZW50XG5cdCAqL1xuXHRvblNhdmU6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICghdGhpcy4kaW5wdXRbMF0udmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc2F2ZUNhbGxiYWNrID0gIXV0aWxzLmlzU3VwcG9ydEZvcm1EYXRhKCkgPyB0dWkudXRpbC5iaW5kKHRoaXMuX3Jlc2V0SW5wdXRFbGVtZW50LCB0aGlzKSA6IG51bGw7XG5cdFx0dGhpcy5maXJlKCdzYXZlJywge1xuXHRcdFx0ZWxlbWVudDogdGhpcy4kaW5wdXRbMF0sXG5cdFx0XHRjYWxsYmFjazogc2F2ZUNhbGxiYWNrXG5cdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJlc2V0IElucHV0IGVsZW1lbnQgdG8gc2F2ZSB3aG9sZSBpbnB1dD1maWxlIGVsZW1lbnQuXG5cdCAqL1xuXHRfcmVzZXRJbnB1dEVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGlucHV0Lm9mZigpO1xuXHRcdHRoaXMuX2Nsb25lKHRoaXMuJGlucHV0WzBdKTtcblx0XHR0aGlzLiRpbnB1dCA9IHRoaXMuX2dldElucHV0RWxlbWVudCgpO1xuXHRcdGlmICh0aGlzLiRzdWJtaXQpIHtcblx0XHRcdHRoaXMuJHN1Ym1pdC5iZWZvcmUodGhpcy4kaW5wdXQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLiRlbC5hcHBlbmQodGhpcy4kaW5wdXQpO1xuXHRcdH1cblx0XHR0aGlzLl9hZGRJbnB1dEV2ZW50KCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIE1ha2VzIGVsZW1lbnQgdG8gYmUgdGFyZ2V0IG9mIHN1Ym1pdCBmb3JtIGVsZW1lbnQuXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfbWFrZVRhcmdldEZyYW1lOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLl8kdGFyZ2V0ID0gJCgnPGlmcmFtZSBuYW1lPVwiJyArIHRoaXMuX3RhcmdldCArICdcIj48L2lmcmFtZT4nKTtcblx0XHR0aGlzLl8kdGFyZ2V0LmNzcyh7XG5cdFx0XHR2aXNpYmlsaXR5OiAnaGlkZGVuJyxcblx0XHRcdHBvc2l0aW9uOiAnYWJzb2x1dGUnXG5cdFx0fSk7XG5cdFx0dGhpcy5fdXBsb2FkZXIuJGVsLmFwcGVuZCh0aGlzLl8kdGFyZ2V0KTtcblx0fSxcblxuXHQvKipcblx0ICogTWFrZSBlbGVtZW50IHRvIGJlIGNhbGxiYWNrIGZ1bmN0aW9uIG5hbWVcblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9tYWtlQ2FsbGJhY2tFbGVtZW50OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLl8kY2FsbGJhY2sgPSB0aGlzLl9tYWtlSGlkZGVuRWxlbWVudCh7XG5cdFx0XHQnbmFtZSc6IHN0YXRpY3MuQ09ORi5KU09OUENBTExCQUNLX05BTUUsXG5cdFx0XHQndmFsdWUnOiB0aGlzLl91cGxvYWRlci5jYWxsYmFja05hbWVcblx0XHR9KTtcblx0XHR0aGlzLiRlbC5hcHBlbmQodGhpcy5fJGNhbGxiYWNrKTtcblx0fSxcblxuXHQvKipcblx0ICogTWFrZXMgZWxlbWVudCB0byBrbm93IHdoaWNoIHR5cGUgcmVxdWVzdFxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X21ha2VSZXN1bHRUeXBlRWxlbWVudDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5fJHJlc1R5cGUgPSB0aGlzLl9tYWtlSGlkZGVuRWxlbWVudCh7XG5cdFx0XHQnbmFtZScgOiB0aGlzLl91cGxvYWRlci5yZXN1bHRUeXBlRWxlbWVudE5hbWUgfHwgc3RhdGljcy5DT05GLlJFU1BPTlNFX1RZUEUsXG5cdFx0XHQndmFsdWUnOiB0aGlzLl91cGxvYWRlci50eXBlXG5cdFx0fSk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKHRoaXMuXyRyZXNUeXBlKTtcblx0fSxcblxuXHQvKipcblx0ICogTWFrZSBlbGVtZW50IHRoYXQgaGFzIHJlZGlyZWN0IHBhZ2UgaW5mb3JtYXRpb24gdXNlZCBieSBTZXJ2ZXIgc2lkZS5cblx0ICogQHBhcmFtIHtvYmplY3R9IGhlbHBlciBSZWRpcmVjdGlvbiBpbmZvcm1hdGlvbiBmb3IgY2xlYXIgeC1kb21haW4gcHJvYmxlbS5cblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9tYWtlQnJpZGdlSW5mb0VsZW1lbnQ6IGZ1bmN0aW9uKGhlbHBlcikge1xuXHRcdHRoaXMuXyRoZWxwZXIgPSB0aGlzLl9tYWtlSGlkZGVuRWxlbWVudCh7XG5cdFx0XHQnbmFtZScgOiBoZWxwZXIubmFtZSB8fCBzdGF0aWNzLkNPTkYuUkVESVJFQ1RfVVJMLFxuXHRcdFx0J3ZhbHVlJzogaGVscGVyLnVybFxuXHRcdH0pO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCh0aGlzLl8kaGVscGVyKTtcblx0fSxcblxuXHQvKipcblx0ICogTWFrZSBoaWRkZW4gaW5wdXQgZWxlbWVudCB3aXRoIG9wdGlvbnNcblx0ICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgVGhlIG9waXRvbnMgdG8gYmUgYXR0cmlidXRlIG9mIGlucHV0XG5cdCAqIEByZXR1cm5zIHsqfGpRdWVyeX1cblx0ICogQHByaXZhdGVcbiAgICAgKi9cdFxuXHRfbWFrZUhpZGRlbkVsZW1lbnQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0XHR0dWkudXRpbC5leHRlbmQob3B0aW9ucywge1xuXHRcdFx0dHlwZTogJ2hpZGRlbidcblx0XHR9KTtcblx0XHRyZXR1cm4gJCgnPGlucHV0IC8+JykuYXR0cihvcHRpb25zKTtcblx0fSxcblxuXHQvKipcblx0ICogQXNrIHVwbG9hZGVyIHRvIHNhdmUgaW5wdXQgZWxlbWVudCB0byBwb29sXG5cdCAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGlucHV0IEEgaW5wdXQgZWxlbWVudFt0eXBlPWZpbGVdIGZvciBzdG9yZSBwb29sXG5cdCAqL1xuXHRfY2xvbmU6IGZ1bmN0aW9uKGlucHV0KSB7XG5cdFx0aW5wdXQuZmlsZV9uYW1lID0gaW5wdXQudmFsdWU7XG5cdFx0dGhpcy5fdXBsb2FkZXIuc3RvcmUoaW5wdXQpO1xuXHR9XG5cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oSW5wdXQpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IElucHV0O1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEl0ZW1WaWV3IG1ha2UgZWxlbWVudCB0byBkaXNwbGF5IGFkZGVkIGZpbGUgaW5mb3JtYXRpb24uIEl0IGhhcyBhdHRhY2hlZCBmaWxlIElEIHRvIHJlcXVlc3QgZm9yIHJlbW92ZS5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbnZhciBzdGF0aWNzID0gcmVxdWlyZSgnLi4vc3RhdGljcycpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuLyoqXG4gKiBDbGFzcyBvZiBpdGVtIHRoYXQgaXMgbWVtYmVyIG9mIGZpbGUgbGlzdC5cbiAqIEBjbGFzcyBWaWV3Lkl0ZW1cbiAqL1xudmFyIEl0ZW0gPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFZpZXcuSXRlbS5wcm90b3R5cGUgKiovIHtcbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplIGl0ZW1cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xuICAgICAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5uYW1lIEZpbGUgbmFtZVxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy50eXBlIEZpbGUgdHlwZVxuICAgICAqICBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy5yb290IExpc3Qgb2JqZWN0XG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmhpZGRlbkZyYW1lIFRoZSBpZnJhbWUgbmFtZSB3aWxsIGJlIHRhcmdldCBvZiBmb3JtIHN1Ym1pdC5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMudXJsIFRoZSB1cmwgZm9yIGZvcm0gYWN0aW9uIHRvIHN1Ym1ldC5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmlkXSBVbmlxdWUga2V5LCB3aGF0IGlmIHRoZSBrZXkgaXMgbm90IGV4aXN0IGlkIHdpbGwgYmUgdGhlIGZpbGUgbmFtZS5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmhpZGRlbkZpZWxkTmFtZV0gVGhlIG5hbWUgb2YgaGlkZGVuIGZpbGVkLiBUaGUgaGlkZGVuIGZpZWxkIGlzIGZvciBjb25uZWN0aW5nIHgtZG9taWFuLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGVsZXRlQnV0dG9uQ2xhc3NOYW1lPSd1cGxvYWRlcl9idG5fZGVsZXRlJ10gVGhlIGNsYXNzIG5hbWUgaXMgZm9yIGRlbGV0ZSBidXR0b24uXG4gICAgICogIEBwYXJhbSB7KHN0cmluZ3xudW1iZXIpfSBbb3B0aW9ucy5zaXplXSBGaWxlIHNpemUgKGJ1dCBpZSBsb3cgYnJvd3NlciwgeC1kb21haW4pXG4gICAgICogIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucy5oZWxwZXJdIFRoZSBoZWxwZXIgcGFnZSBpbmZvLlxuICAgICAqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuICAgICAgICB0aGlzLl9zZXRSb290KG9wdGlvbnMpO1xuICAgICAgICB0aGlzLl9zZXRJdGVtSW5mbyhvcHRpb25zKTtcbiAgICAgICAgdGhpcy5fc2V0Q29ubmVjdEluZm8ob3B0aW9ucyk7XG5cbiAgICAgICAgdGhpcy5yZW5kZXIob3B0aW9ucy50ZW1wbGF0ZSB8fCBzdGF0aWNzLkhUTUwuaXRlbSk7XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuaGVscGVyKSB7XG4gICAgICAgICAgICB0aGlzLl9tYWtlQnJpZGdlSW5mb0VsZW1lbnQob3B0aW9ucy5oZWxwZXIpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCByb290KExpc3Qgb2JqZWN0KSBpbmZvcm1hdGlvbi5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBTYW1lIHdpdGggaW5pdCBvcHRpb25zIHBhcmFtZXRlci5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRSb290OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX3Jvb3QgPSBvcHRpb25zLnJvb3Q7XG4gICAgICAgIHRoaXMuXyRyb290ID0gb3B0aW9ucy5yb290LiRlbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGZpbGUgaW5mb3JtYXRpb24uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgU2FtZSB3aXRoIGluaXQgb3B0aW9ucyBwYXJhbWV0ZXIuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0SXRlbUluZm86IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gb3B0aW9ucy5uYW1lO1xuICAgICAgICB0aGlzLl90eXBlID0gb3B0aW9ucy50eXBlIHx8IHRoaXMuX2V4dHJhY3RFeHRlbnNpb24oKTtcbiAgICAgICAgdGhpcy5faWQgPSBvcHRpb25zLmlkIHx8IG9wdGlvbnMubmFtZTtcbiAgICAgICAgdGhpcy5zaXplID0gb3B0aW9ucy5zaXplIHx8ICcnO1xuICAgICAgICB0aGlzLl9idG5DbGFzcyA9IG9wdGlvbnMuZGVsZXRlQnV0dG9uQ2xhc3NOYW1lIHx8ICd1cGxvYWRlcl9idG5fZGVsZXRlJztcbiAgICAgICAgdGhpcy5fdW5pdCA9IG9wdGlvbnMudW5pdCB8fCAnS0InO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgY29ubmVjdCBlbGVtZW50IGluZm9ybWF0aW9uLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFNhbWUgd2l0aCBpbml0IG9wdGlvbnMgcGFyYW1ldGVyLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldENvbm5lY3RJbmZvOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX3VybCA9IG9wdGlvbnMudXJsO1xuICAgICAgICB0aGlzLl9oaWRkZW5JbnB1dE5hbWUgPSBvcHRpb25zLmhpZGRlbkZpZWxkTmFtZSB8fCAnZmlsZW5hbWUnO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgbWFraW5nIGZvcm0gcGFkZGluZyB3aXRoIGRlbGV0YWJsZSBpdGVtXG4gICAgICogQHBhcmFtIHRlbXBsYXRlXG4gICAgICovXG4gICAgcmVuZGVyOiBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuICAgICAgICB2YXIgaHRtbCA9IHRoaXMuX2dldEh0bWwodGVtcGxhdGUpO1xuICAgICAgICB0aGlzLl8kZWwgPSAkKGh0bWwpO1xuICAgICAgICB0aGlzLl8kcm9vdC5hcHBlbmQodGhpcy5fJGVsKTtcbiAgICAgICAgdGhpcy5fYWRkRXZlbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXh0cmFjdCBmaWxlIGV4dGVuc2lvbiBieSBuYW1lXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9leHRyYWN0RXh0ZW5zaW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZS5zcGxpdCgnLicpLnBvcCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIGVsZW1lbnQgdGhhdCBoYXMgcmVkaXJlY3QgcGFnZSBpbmZvcm1hdGlvbiB1c2VkIGJ5IFNlcnZlciBzaWRlLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBoZWxwZXIgUmVkaXJlY3Rpb24gaGVscGVyIHBhZ2UgaW5mb3JtYXRpb24gZm9yIGNsZWFyIHgtZG9tYWluIHByb2JsZW0uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbWFrZUJyaWRnZUluZm9FbGVtZW50OiBmdW5jdGlvbihoZWxwZXIpIHtcbiAgICAgICAgdGhpcy4kaGVscGVyID0gJCgnPGlucHV0IC8+Jyk7XG4gICAgICAgIHRoaXMuJGhlbHBlci5hdHRyKHtcbiAgICAgICAgICAgICduYW1lJyA6IGhlbHBlci5uYW1lLFxuICAgICAgICAgICAgJ3ZhbHVlJzogaGVscGVyLnVybFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGl0ZW0gZWxlbWVuIEhUTUxcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaHRtbCBIVE1MIHRlbXBsYXRlXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRIdG1sOiBmdW5jdGlvbihodG1sKSB7XG4gICAgICAgIHZhciBtYXAgPSB7XG4gICAgICAgICAgICBmaWxldHlwZTogdGhpcy5fdHlwZSxcbiAgICAgICAgICAgIGZpbGVuYW1lOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICBmaWxlc2l6ZTogdGhpcy5zaXplID8gdXRpbHMuZ2V0RmlsZVNpemVXaXRoVW5pdCh0aGlzLnNpemUpIDogJycsXG4gICAgICAgICAgICBkZWxldGVCdXR0b25DbGFzc05hbWU6IHRoaXMuX2J0bkNsYXNzXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHV0aWxzLnRlbXBsYXRlKG1hcCwgaHRtbCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERlc3RvcnkgaXRlbVxuICAgICAqL1xuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9yZW1vdmVFdmVudCgpO1xuICAgICAgICB0aGlzLl8kZWwucmVtb3ZlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudCBoYW5kbGVyIG9uIGRlbGV0ZSBidXR0b24uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcXVlcnkgPSAnLicgKyB0aGlzLl9idG5DbGFzcyxcbiAgICAgICAgICAgICRkZWxCdG4gPSB0aGlzLl8kZWwuZmluZChxdWVyeSk7XG4gICAgICAgICRkZWxCdG4ub24oJ2NsaWNrJywgdHVpLnV0aWwuYmluZCh0aGlzLl9vbkNsaWNrRXZlbnQsIHRoaXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGV2ZW50IGhhbmRsZXIgZnJvbSBkZWxldGUgYnV0dG9uLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbW92ZUV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHF1ZXJ5ID0gJy4nICsgdGhpcy5fYnRuQ2xhc3MsXG4gICAgICAgICAgICAkZGVsQnRuID0gdGhpcy5fJGVsLmZpbmQocXVlcnkpO1xuICAgICAgICAkZGVsQnRuLm9mZignY2xpY2snKTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKiBFdmVudC1oYW5kbGUgZm9yIGRlbGV0ZSBidXR0b24gY2xpY2tlZC5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vbkNsaWNrRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZScsIHtcbiAgICAgICAgICAgIGZpbGVuYW1lIDogdGhpcy5uYW1lLFxuICAgICAgICAgICAgaWQgOiB0aGlzLl9pZCxcbiAgICAgICAgICAgIHR5cGU6ICdyZW1vdmUnXG4gICAgICAgIH0pO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oSXRlbSk7XG5cbm1vZHVsZS5leHBvcnRzID0gSXRlbTtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBGaWxlTGlzdFZpZXcgbWFuYWdlIGFuZCBkaXNwbGF5IGZpbGVzIHN0YXRlKGxpa2Ugc2l6ZSwgY291bnQpIGFuZCBsaXN0LlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcbnZhciBJdGVtID0gcmVxdWlyZSgnLi9pdGVtJyk7XG5cbi8qKlxuICogTGlzdCBoYXMgaXRlbXMuIEl0IGNhbiBhZGQgYW5kIHJlbW92ZSBpdGVtLCBhbmQgZ2V0IHRvdGFsIHVzYWdlLlxuICogQGNsYXNzIFZpZXcuTGlzdFxuICovXG52YXIgTGlzdCA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgVmlldy5MaXN0LnByb3RvdHlwZSAqL3tcbiAgICBpbml0IDogZnVuY3Rpb24ob3B0aW9ucywgdXBsb2FkZXIpIHtcbiAgICAgICAgdmFyIGxpc3RJbmZvID0gb3B0aW9ucy5saXN0SW5mbztcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdO1xuICAgICAgICB0aGlzLiRlbCA9IGxpc3RJbmZvLmxpc3Q7XG4gICAgICAgIHRoaXMuJGNvdW50ZXIgPSBsaXN0SW5mby5jb3VudDtcbiAgICAgICAgdGhpcy4kc2l6ZSA9IGxpc3RJbmZvLnNpemU7XG4gICAgICAgIHRoaXMuX3VwbG9hZGVyID0gdXBsb2FkZXI7XG5cbiAgICAgICAgdHVpLnV0aWwuZXh0ZW5kKHRoaXMsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgaXRlbSBsaXN0XG4gICAgICogQHBhcmFtIHtvYmplY3R9IGluZm8gQSBpbmZvcm1hdGlvbiB0byB1cGRhdGUgbGlzdC5cbiAgICAgKiAgQHBhcmFtIHthcnJheX0gaW5mby5pdGVtcyBUaGUgbGlzdCBvZiBmaWxlIGluZm9ybWF0aW9uLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gW2luZm8uYWN0aW9uXSBUaGUgYWN0aW9uIHRvIGRvLlxuICAgICAqL1xuICAgIHVwZGF0ZTogZnVuY3Rpb24oaW5mbykge1xuICAgICAgICBpZiAoaW5mby5hY3Rpb24gPT09ICdyZW1vdmUnKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVGaWxlSXRlbShpbmZvLm5hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fYWRkRmlsZUl0ZW1zKGluZm8uaXRlbXMpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBpdGVtcyB0b3RhbCBjb3VudCwgdG90YWwgc2l6ZSBpbmZvcm1hdGlvbi5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gaW5mbyBBIGluZm9ybWF0aW9uIHRvIHVwZGF0ZSBsaXN0LlxuICAgICAqICBAcGFyYW0ge2FycmF5fSBpbmZvLml0ZW1zIFRoZSBsaXN0IG9mIGZpbGUgaW5mb3JtYXRpb24uXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBpbmZvLnNpemUgVGhlIHRvdGFsIHNpemUuXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBpbmZvLmNvdW50IFRoZSBjb3VudCBvZiBmaWxlcy5cbiAgICAgKi9cbiAgICB1cGRhdGVUb3RhbEluZm86IGZ1bmN0aW9uKGluZm8pIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlVG90YWxDb3VudChpbmZvLmNvdW50KTtcbiAgICAgICAgdGhpcy5fdXBkYXRlVG90YWxVc2FnZShpbmZvLnNpemUpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgaXRlbXMgdG90YWwgY291bnQgYW5kIHJlZnJlc2ggZWxlbWVudFxuICAgICAqIEBwYXJhbSB7KG51bWJlcnxzdHJpbmcpfSBbY291bnRdIFRvdGFsIGZpbGUgY291bnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF91cGRhdGVUb3RhbENvdW50OiBmdW5jdGlvbihjb3VudCkge1xuXG4gICAgICAgIGlmICghdHVpLnV0aWwuaXNFeGlzdHkoY291bnQpKSB7XG4gICAgICAgICAgICBjb3VudCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4kY291bnRlci5odG1sKGNvdW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW1zIHRvdGFsIHNpemUgYW5kIHJlZnJlc2ggZWxlbWVudFxuICAgICAqIEBwYXJhbSB7KG51bWJlcnxzdHJpbmcpfSBzaXplIFRvdGFsIGZpbGVzIHNpemVzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfdXBkYXRlVG90YWxVc2FnZTogZnVuY3Rpb24oc2l6ZSkge1xuXG4gICAgICAgIGlmICghdHVpLnV0aWwuaXNFeGlzdHkoc2l6ZSkpIHtcbiAgICAgICAgICAgIHNpemUgPSB0aGlzLl9nZXRTdW1BbGxJdGVtVXNhZ2UoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHVpLnV0aWwuaXNOdW1iZXIoc2l6ZSkgJiYgIWlzTmFOKHNpemUpKSB7XG4gICAgICAgICAgICBzaXplID0gdXRpbHMuZ2V0RmlsZVNpemVXaXRoVW5pdChzaXplKTtcbiAgICAgICAgICAgIHRoaXMuJHNpemUuaHRtbChzaXplKTtcbiAgICAgICAgICAgIHRoaXMuJHNpemUuc2hvdygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kc2l6ZS5oaWRlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3VtIHNpemVzIG9mIGFsbCBpdGVtcy5cbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRTdW1BbGxJdGVtVXNhZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaXRlbXMgPSB0aGlzLml0ZW1zLFxuICAgICAgICAgICAgdG90YWxVc2FnZSA9IDA7XG5cbiAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChpdGVtcywgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgdG90YWxVc2FnZSArPSBwYXJzZUZsb2F0KGl0ZW0uc2l6ZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0b3RhbFVzYWdlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZmlsZSBpdGVtc1xuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXQgVGFyZ2V0IGl0ZW0gaW5mb3JtYXRpb24uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRmlsZUl0ZW1zOiBmdW5jdGlvbih0YXJnZXQpIHtcbiAgICAgICAgaWYgKCF0dWkudXRpbC5pc0FycmF5KHRhcmdldCkpIHtcbiAgICAgICAgICAgIHRhcmdldCA9IFt0YXJnZXRdO1xuICAgICAgICB9XG4gICAgICAgIHR1aS51dGlsLmZvckVhY2godGFyZ2V0LCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2godGhpcy5fY3JlYXRlSXRlbShkYXRhKSk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHRoaXMuZmlyZSgnZmlsZUFkZGVkJywge1xuXHRcdFx0dGFyZ2V0OiB0YXJnZXRcblx0XHR9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpbGUgaXRlbVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBmaWxlIG5hbWUgdG8gcmVtb3ZlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlRmlsZUl0ZW06IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgbmFtZSA9IGRlY29kZVVSSUNvbXBvbmVudChuYW1lKTtcbiAgICAgICAgdGhpcy5pdGVtcyA9IHR1aS51dGlsLmZpbHRlcih0aGlzLml0ZW1zLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICB2YXIgaXNNYXRjaCA9IG5hbWUgPT09IGRlY29kZVVSSUNvbXBvbmVudChpdGVtLm5hbWUpO1xuICAgICAgICAgICAgaWYgKGlzTWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBpdGVtLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICB0aGlzLl91cGxvYWRlci5yZW1vdmUobmFtZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdmaWxlUmVtb3ZlZCcsIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogbmFtZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICFpc01hdGNoO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGl0ZW0gQnkgRGF0YVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhXG4gICAgICogQHJldHVybnMge0l0ZW19XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY3JlYXRlSXRlbTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgaXRlbSA9IG5ldyBJdGVtKHtcbiAgICAgICAgICAgIHJvb3Q6IHRoaXMsXG4gICAgICAgICAgICBuYW1lOiBkYXRhLm5hbWUsXG4gICAgICAgICAgICBzaXplOiBkYXRhLnNpemUsXG4gICAgICAgICAgICBkZWxldGVCdXR0b25DbGFzc05hbWU6IHRoaXMuZGVsZXRlQnV0dG9uQ2xhc3NOYW1lLFxuICAgICAgICAgICAgdXJsOiB0aGlzLnVybCxcbiAgICAgICAgICAgIGhpZGRlbkZyYW1lOiB0aGlzLmZvcm1UYXJnZXQsXG4gICAgICAgICAgICBoaWRkZW5GaWVsZE5hbWU6IHRoaXMuaGlkZGVuRmllbGROYW1lLFxuICAgICAgICAgICAgdGVtcGxhdGU6IHRoaXMudGVtcGxhdGUgJiYgdGhpcy50ZW1wbGF0ZS5pdGVtXG4gICAgICAgIH0pO1xuICAgICAgICBpdGVtLm9uKCdyZW1vdmUnLCB0aGlzLl9yZW1vdmVGaWxlLCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIFJlbW92ZSBGaWxlXG4gICAgICogQHBhcmFtIGRhdGFcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW1vdmVGaWxlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHRoaXMuZmlyZSgncmVtb3ZlJywgZGF0YSk7XG4gICAgfVxufSk7XG5cbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihMaXN0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBMaXN0O1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgaXMgbWFuYWdlciBvZiBpbnB1dCBlbGVtZW50cyB0aGF0IGFjdCBsaWtlIGZpbGUgcG9vbC5cbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbi8qKlxuICogVGhlIHBvb2wgZm9yIHNhdmUgZmlsZXMuXG4gKiBJdCdzIG9ubHkgZm9yIGlucHV0W2ZpbGVdIGVsZW1lbnQgc2F2ZSBhdCBicm93c2VyIHRoYXQgZG9lcyBub3Qgc3VwcG9ydCBmaWxlIGFwaS5cbiAqIEBjbGFzcyBWaWV3LlBvb2xcbiAqL1xudmFyIFBvb2wgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFZpZXcuUG9vbC5wcm90b3R5cGUgKi97XG4gICAgLyoqXG4gICAgICogaW5pdGlhbGl6ZVxuICAgICAqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKHBsYW5ldCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogU3VibWl0dGVyIGZvciBmaWxlIGVsZW1lbnQgdG8gc2VydmVyXG4gICAgICAgICAqIEB0eXBlIHtIVE1MRWxlbWVudH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucGxhbmV0ID0gcGxhbmV0O1xuICAgICAgICAvKipcbiAgICAgICAgICogRmlsZSBkYXRhIHN0cnVjdHVyZSBvYmplY3Qoa2V5PW5hbWUgOiB2YWx1ZT1pdXB1dCBlbG1lZW50KTtcbiAgICAgICAgICogQHR5cGUge29iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZmlsZXMgPSB7fTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFjdHMgcG9vbCB0byBzYXZlIGlucHV0IGVsZW1lbnRcbiAgICAgICAgICogQHR5cGUge0RvY3VtZW50RnJhZ21lbnR9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNhdmUgYSBpbnB1dCBlbGVtZW50W3R5cGU9ZmlsZV0sIGFzIHZhbHVlIG9mIGZpbGUgbmFtZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZmlsZSBBIGlucHV0IGVsZW1lbnQgdGhhdCBoYXZlIHRvIGJlIHNhdmVkXG4gICAgICovXG4gICAgc3RvcmU6IGZ1bmN0aW9uKGZpbGUpIHtcbiAgICAgICAgdGhpcy5maWxlc1tmaWxlLmZpbGVfbmFtZV0gPSBmaWxlO1xuICAgICAgICB0aGlzLmZyYWcuYXBwZW5kQ2hpbGQoZmlsZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGlucHV0IGVsZW1lbnRbdHlwZT1maWxlXSBmcm9tIHBvb2wuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgQSBmaWxlIG5hbWUgdGhhdCBoYXZlIHRvIGJlIHJlbW92ZWQuXG4gICAgICovXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHRoaXMuZnJhZy5yZW1vdmVDaGlsZCh0aGlzLmZpbGVzW25hbWVdKTtcbiAgICAgICAgZGVsZXRlIHRoaXMuZmlsZXNbbmFtZV07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEVtcHR5IHBvb2xcbiAgICAgKi9cbiAgICBlbXB0eTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHR1aS51dGlsLmZvckVhY2godGhpcy5maWxlcywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUoZGF0YS5maWxlX25hbWUpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUGxhbnQgZmlsZXMgb24gcG9vbCB0byBmb3JtIGlucHV0XG4gICAgICovXG4gICAgcGxhbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcGxhbmV0ID0gdGhpcy5wbGFuZXQ7XG4gICAgICAgIHR1aS51dGlsLmZvckVhY2godGhpcy5maWxlcywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgcGxhbmV0LmFwcGVuZENoaWxkKGRhdGEpO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuZmlsZXNbZGF0YS5maWxlX25hbWVdO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQb29sO1xuIl19
