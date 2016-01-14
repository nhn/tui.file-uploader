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

var consts = require('./consts');
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

		this.fileField = this.fileField || consts.CONF.FILE_FILED_NAME;
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
				alert(consts.CONF.ERROR.NOT_SURPPORT);
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
			message = consts.CONF.ERROR.DEFAULT;
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

},{"./connector/connector":3,"./consts":6,"./utils":8,"./view/drag":9,"./view/input":10,"./view/list":12,"./view/pool":13}],8:[function(require,module,exports){
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

},{"../consts":6,"../utils":8}],10:[function(require,module,exports){
/**
 * @fileoverview InputView make input form by template. Add event file upload event.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */

var consts = require('../consts');
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
			input: template.input || consts.HTML.input,
			submit: template.submit || consts.HTML.submit,
			form: template.form || consts.HTML.form
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
			'name': consts.CONF.JSONPCALLBACK_NAME,
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
			'name' : this._uploader.resultTypeElementName || consts.CONF.RESPONSE_TYPE,
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
			'name' : helper.name || consts.CONF.REDIRECT_URL,
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

},{"../consts":6,"../utils":8}],11:[function(require,module,exports){
/**
 * @fileoverview ItemView make element to display added file information. It has attached file ID to request for remove.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */

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

        this.render(options.template || consts.HTML.item);

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

},{"../consts":6,"../utils":8}],12:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25uZWN0b3IvYWpheC5qcyIsInNyYy9qcy9jb25uZWN0b3IvY29ubmVjdG9yLmpzIiwic3JjL2pzL2Nvbm5lY3Rvci9qc29ucC5qcyIsInNyYy9qcy9jb25uZWN0b3IvbG9jYWwuanMiLCJzcmMvanMvY29uc3RzLmpzIiwic3JjL2pzL3VwbG9hZGVyLmpzIiwic3JjL2pzL3V0aWxzLmpzIiwic3JjL2pzL3ZpZXcvZHJhZy5qcyIsInNyYy9qcy92aWV3L2lucHV0LmpzIiwic3JjL2pzL3ZpZXcvaXRlbS5qcyIsInNyYy9qcy92aWV3L2xpc3QuanMiLCJzcmMvanMvdmlldy9wb29sLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInR1aS51dGlsLmRlZmluZU5hbWVzcGFjZSgndHVpLmNvbXBvbmVudC5VcGxvYWRlcicsIHJlcXVpcmUoJy4vc3JjL2pzL3VwbG9hZGVyLmpzJykpO1xuXG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgVGhpcyBDb25uZWN0b3IgbWFrZSBjb25uZWN0aW9uIGJldHdlZW4gRmlsZU1hbmFnZXIgYW5kIGZpbGUgc2VydmVyIGFwaSBhdCBtb2Rlcm4gYnJvd3Nlci48YnI+XG4gKiAgICAgVGhpcyBDb25uZWN0b3IgdXNlIGFqYXguXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG4vKipcbiAqIFRoZSBtb2R1bGVzIHdpbGwgYmUgbWl4ZWQgaW4gY29ubmVjdG9yIGJ5IHR5cGUuXG4gKiBAbmFtZXNwYWNlIENvbm5lY3Rvci5BamF4XG4gKi9cbnZhciBBamF4ID0gey8qKiBAbGVuZHMgQ29ubmVjdG9yLkFqYXggKi9cbiAgICB0eXBlOiAnUE9TVCcsXG4gICAgLyoqXG4gICAgICogUmVxdWVzdCBhamF4IGJ5IGNvbmZpZyB0byBhZGQgZmlsZXMuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGNvbmZpZyBUaGUgY29uZmlndXJhdGlvbiBmb3IgYWpheCByZXF1ZXN0XG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBjb25maWcudXJsIFJlcXVlc3QgdXJsKHVwbG9hZCB1cmwgb3IgcmVtb3ZlIHVybClcbiAgICAgKiAgQHBhcmFtIHtmdW5jdGlvbn0gY29uZmlnLnN1Y2Nlc3MgQ2FsbGJhY2sgZnVuY3Rpb24gd2hlbiByZXF1ZXN0IHN1Y2Vlc3MuXG4gICAgICogIEBwYXJhbSB7ZnVuY3Rpb259IGNvbmZpZy5lcnJvciBDYWxsYmFjayBmdW5jdGlvbiB3aGVuIHJlcXVlc3QgZmFpbGQuXG4gICAgICogIEBtZW1iZXJvZiBDb25uZWN0b3IuQWpheFxuICAgICAqL1xuICAgIGFkZFJlcXVlc3Q6IGZ1bmN0aW9uKGNvbmZpZywgZmlsZXMpIHtcbiAgICAgICAgdmFyIHVwbG9hZGVyID0gdGhpcy5fdXBsb2FkZXIsXG4gICAgICAgICAgICAkZm9ybSA9IHVwbG9hZGVyLmlucHV0Vmlldy4kZWwsXG4gICAgICAgICAgICBjYWxsYmFjayA9IHR1aS51dGlsLmJpbmQodGhpcy5zdWNjZXNzUGFkZGluZywgdGhpcywgY29uZmlnLnN1Y2Nlc3MpO1xuICAgIFxuXHRcdGlmIChmaWxlcykge1xuXHRcdFx0dGhpcy5mb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuXHRcdFx0dHVpLnV0aWwuZm9yRWFjaChmaWxlcywgZnVuY3Rpb24oZSkge1xuXHRcdFx0XHR0aGlzLmZvcm1EYXRhLmFwcGVuZCh1cGxvYWRlci5maWxlRmllbGQsIGUpO1xuXHRcdFx0fSwgdGhpcyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoJGZvcm1bMF0pO1xuXHRcdH1cblx0XHQkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiB0aGlzLl91cGxvYWRlci51cmwuc2VuZCxcbiAgICAgICAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgICAgICAgIGRhdGE6IHRoaXMuZm9ybURhdGEsXG4gICAgICAgICAgICBzdWNjZXNzOiBjYWxsYmFjayxcbiAgICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiBjb25maWcuZXJyb3JcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByZXByb2Nlc3NpbmcgY2FsbGJhY2sgYmVmb3JlIGNhbGxiYWNrIHJ1bi5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBSZXF1ZXN0IENhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIFJlc3BvbnNlIGZyb20gc2VydmVyXG4gICAgICogQG1lbWJlcm9mIENvbm5lY3Rvci5BamF4XG4gICAgICovXG4gICAgc3VjY2Vzc1BhZGRpbmc6IGZ1bmN0aW9uKGNhbGxiYWNrLCByZXNwb25zZSkge1xuICAgICAgICB2YXIganNvbiA9IEpTT04ucGFyc2UocmVzcG9uc2UpLFxuICAgICAgICAgICAgcmVzdWx0ID0ge307XG5cbiAgICAgICAgcmVzdWx0Lml0ZW1zID0ganNvbi5maWxlbGlzdDtcbiAgICAgICAgY2FsbGJhY2socmVzdWx0KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVxdWVzdCBhamF4IGJ5IGNvbmZpZyB0byByZW1vdmUgZmlsZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gY29uZmlnXG4gICAgICogQG1lbWJlcm9mIENvbm5lY3Rvci5BamF4XG4gICAgICovXG4gICAgcmVtb3ZlUmVxdWVzdDogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IHR1aS51dGlsLmJpbmQodGhpcy5yZW1vdmVQYWRkaW5nLCB0aGlzLCBjb25maWcuc3VjY2Vzcyk7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHRoaXMuX3VwbG9hZGVyLnVybC5yZW1vdmUsXG4gICAgICAgICAgICBkYXRhOiBjb25maWcuZGF0YSxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGNhbGxiYWNrLFxuICAgICAgICAgICAgZXJyb3I6IGNvbmZpZy5lcnJvclxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJlcHJvY2Vzc2luZyByZXNwb25zZSBiZWZvcmUgY2FsbGJhY2sgcnVuLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFJlcXVlc3QgQ2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgUmVzcG9uc2UgZnJvbSBzZXJ2ZXJcbiAgICAgKiBAbWVtYmVyb2YgQ29ubmVjdG9yLkFqYXhcbiAgICAgKi9cbiAgICByZW1vdmVQYWRkaW5nOiBmdW5jdGlvbihjYWxsYmFjaywgcmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIGpzb24gPSBKU09OLnBhcnNlKHJlc3BvbnNlKSxcbiAgICAgICAgICAgIHJlc3VsdCA9IHt9O1xuXG4gICAgICAgIHJlc3VsdC5hY3Rpb24gPSAncmVtb3ZlJztcbiAgICAgICAgcmVzdWx0Lm5hbWUgPSBkZWNvZGVVUklDb21wb25lbnQoanNvbi5uYW1lKTtcblxuICAgICAgICBjYWxsYmFjayhyZXN1bHQpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQWpheDtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBBIENvbm5lY3RvciBtYWtlIGNvbm5lY3Rpb24gYmV0d2VlbiBGaWxlTWFuYWdlciBhbmQgZmlsZSBzZXJ2ZXIgQVBJLjxicj4gVGhlIENvbm5lY3RvciBpcyBpbnRlcmZhY2UuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG52YXIgQWpheCA9IHJlcXVpcmUoJy4vYWpheCcpO1xudmFyIEpzb25wID0gcmVxdWlyZSgnLi9qc29ucCcpO1xudmFyIExvY2FsID0gcmVxdWlyZSgnLi9sb2NhbCcpO1xuXG52YXIgTW9kdWxlU2V0cyA9IHtcbiAgICAnYWpheCc6IEFqYXgsXG4gICAgJ2pzb25wJzogSnNvbnAsXG4gICAgJ2xvY2FsJzogTG9jYWxcbn07XG5cbi8qKlxuICogVGhpcyBpcyBJbnRlcmZhY2UgdG8gYmUgaW1wbGVtZW50ZWQgYnkgY29ubmVjdG9yc1xuICogQG5hbWVzcGFjZSBDb25uZWN0b3JcbiAqL1xudmFyIENvbm5lY3RvciA9IHtcbiAgICAvKipcbiAgICAgKiBBIGludGVyZmFjZSByZW1vdmVSZXF1ZXN0IHRvIGltcGxlbWVudFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIEEgaW5mb3JtYXRpb24gZm9yIGRlbGV0ZSBmaWxlXG4gICAgICogQG1lbWJlcm9mIENvbm5lY3RvclxuICAgICAqL1xuICAgIHJlbW92ZVJlcXVlc3Q6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgaW50ZXJmYWNlIHJlbW92ZVJlcXVlc3QgZG9lcyBub3QgZXhpc3QnKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQSBpbnRlcmZhY2UgYWRkUmVxdWVzdCB0byBpbXBsZW1lbnRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBBIGluZm9ybWF0aW9uIGZvciBhZGQgZmlsZVxuICAgICAqIEBtZW1iZXJvZiBDb25uZWN0b3JcbiAgICAgKi9cbiAgICBhZGRSZXF1ZXN0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGludGVyZmFjZSBhZGRSZXF1ZXN0IGRvZXMgbm90IGV4aXN0Jyk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBUaGUgZmFjdG9yeSBtb2R1bGUgZm9yIGNvbm5lY3RvcnMuXG4gKiBHZXQgZWFjaCBjb25uZWN0b3IgYnkgZWFjaCB0eXBlLlxuICogQG5hbWVzcGFjZSBGYWN0b3J5XG4gKi9cbnZhciBGYWN0b3J5ID0ge1xuICAgIC8qKlxuICAgICAqIENob29zZSBjb25uZWN0b3JcbiAgICAgKiBAcGFyYW0gdXBsb2FkZXJcbiAgICAgKiBAcmV0dXJucyB7e191cGxvYWRlcjogKn19XG4gICAgICogQG1lbWJlcm9mIEZhY3RvcnlcbiAgICAgKi9cbiAgICBnZXRDb25uZWN0b3I6IGZ1bmN0aW9uKHVwbG9hZGVyKSB7XG4gICAgICAgIHZhciB0eXBlID0gdXBsb2FkZXIudHlwZS50b0xvd2VyQ2FzZSgpLFxuICAgICAgICAgICAgY29ubiA9IHtcbiAgICAgICAgICAgICAgICBfdXBsb2FkZXI6IHVwbG9hZGVyXG4gICAgICAgICAgICB9O1xuICAgICAgICB0dWkudXRpbC5leHRlbmQoY29ubiwgQ29ubmVjdG9yLCBNb2R1bGVTZXRzW3R5cGVdIHx8IExvY2FsKTtcbiAgICAgICAgcmV0dXJuIGNvbm47XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBGYWN0b3J5O1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgQ29ubmVjdG9yIG1ha2UgY29ubmVjdGlvbiBiZXR3ZWVuIEZpbGVNYW5hZ2VyIGFuZCBmaWxlIHNlcnZlciBhcGkgYXQgb2xkIGJyb3dzZXIuPGJyPlxuICogICAgIFRoaXMgQ29ubmVjdG9yIHVzZSBoaWRkZW4gaWZyYW1lLlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxuLyoqXG4gKiBUaGUgbW9kdWxlcyB3aWxsIGJlIG1peGVkIGluIGNvbm5lY3RvciBieSB0eXBlLlxuICogQG5hbWVzcGFjZSBDb25uZWN0b3IuSnNvbnBcbiAqL1xudmFyIEpzb25wID0gey8qKiBAbGVuZHMgQ29ubmVjdG9yLkpzb25wLnByb3RvdHlwZSAqL1xuICAgIC8qKlxuICAgICAqIFJlcXVlc3QgYnkgZm9ybSBzdWJtaXQuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGNvbmZpZyBDb25maWd1cmF0aW9uIGZvciBzdWJtaXQgZm9ybS5cbiAgICAgKiAgQHBhcmFtIHtmdW5jdGlvbn0gY29uZmlnLnN1Y2Nlc3MgQ2FsbGJhY2sgd2hlbiBwb3N0IHN1Ym1pdCBjb21wbGF0ZS5cbiAgICAgKiBAbWVtYmVyb2YgQ29ubmVjdG9yLkpzb25wXG4gICAgICovXG4gICAgYWRkUmVxdWVzdDogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICAgIHZhciBjYWxsYmFja05hbWUgPSB0aGlzLl91cGxvYWRlci5jYWxsYmFja05hbWUsXG4gICAgICAgIGNhbGxiYWNrID0gY29uZmlnLnN1Y2Nlc3M7XG4gICAgICAgIHR1aS51dGlsLmRlZmluZU5hbWVzcGFjZShjYWxsYmFja05hbWUsICB0dWkudXRpbC5iaW5kKHRoaXMuc3VjY2Vzc1BhZGRpbmcsIHRoaXMsIGNhbGxiYWNrKSk7XG5cblx0XHR0aGlzLl91cGxvYWRlci5pbnB1dFZpZXcuJGVsLnN1Ym1pdCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcmVwcm9jZXNzaW5nIHJlc3BvbnNlIGJlZm9yZSBjYWxsYmFjayBydW4uXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgUmVxdWVzdCBDYWxsYmFjayBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSBSZXNwb25zZSBmcm9tIHNlcnZlclxuICAgICAqIEBtZW1iZXJvZiBDb25uZWN0b3IuSnNvbnBcbiAgICAgKi9cbiAgICBzdWNjZXNzUGFkZGluZzogZnVuY3Rpb24oY2FsbGJhY2ssIHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSB7fTtcblxuXHRcdGlmICh0aGlzLl91cGxvYWRlci5pc0Nyb3NzRG9tYWluKCkpIHtcbiAgICAgICAgICAgIHJlc3VsdC5pdGVtcyA9IHRoaXMuX2dldFNwbGl0SXRlbXMocmVzcG9uc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0Lml0ZW1zID0gdHVpLnV0aWwudG9BcnJheShyZXNwb25zZS5maWxlbGlzdCk7XG4gICAgICAgIH1cblxuICAgICAgICBjYWxsYmFjayhyZXN1bHQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIHF1ZXJ5IGRhdGEgdG8gYXJyYXlcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBUaGUgRGF0YSBleHRyYWN0ZWQgZnJvbSBxdWVyeXN0cmluZyBzZXBhcmF0ZWQgYnkgJyYnXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAbWVtYmVyb2YgQ29ubmVjdG9yLkpzb25wXG4gICAgICovXG4gICAgX2dldFNwbGl0SXRlbXM6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIHNlcCA9IHRoaXMuX3VwbG9hZGVyLnNlcGFyYXRvcixcbiAgICAgICAgICAgIHN0YXR1cyA9IGRhdGEuc3RhdHVzLnNwbGl0KHNlcCksXG4gICAgICAgICAgICBuYW1lcyA9IGRhdGEubmFtZXMuc3BsaXQoc2VwKSxcbiAgICAgICAgICAgIHNpemVzID0gZGF0YS5zaXplcy5zcGxpdChzZXApLFxuICAgICAgICAgICAgaWRzID0gdHVpLnV0aWwuaXNTdHJpbmcoZGF0YS5pZHMpID8gZGF0YS5pZHMuc3BsaXQoc2VwKSA6IG5hbWVzLFxuICAgICAgICAgICAgaXRlbXMgPSBbXTtcblxuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKHN0YXR1cywgZnVuY3Rpb24oaXRlbSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmIChpdGVtID09PSAnc3VjY2VzcycpIHtcbiAgICAgICAgICAgICAgICB2YXIgbkl0ZW0gPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IG5hbWVzW2luZGV4XSxcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBzdGF0dXNbaW5kZXhdLFxuICAgICAgICAgICAgICAgICAgICBzaXplOiBzaXplc1tpbmRleF0sXG4gICAgICAgICAgICAgICAgICAgIGlkOiBpZHNbaW5kZXhdXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpdGVtcy5wdXNoKG5JdGVtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBpdGVtcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVxdWVzdCBhamF4IGJ5IGNvbmZpZyB0byByZW1vdmUgZmlsZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gY29uZmlnXG4gICAgICogQG1lbWJlcm9mIENvbm5lY3Rvci5Kc29ucFxuICAgICAqL1xuICAgIHJlbW92ZVJlcXVlc3Q6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgICB2YXIgY2FsbGJhY2tOYW1lID0gdGhpcy5fdXBsb2FkZXIuY2FsbGJhY2tOYW1lLFxuICAgICAgICAgICAgZGF0YSA9IHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjazogY2FsbGJhY2tOYW1lXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2FsbGJhY2sgPSBjb25maWcuc3VjY2VzcztcblxuICAgICAgICB0dWkudXRpbC5kZWZpbmVOYW1lc3BhY2UoY2FsbGJhY2tOYW1lLCB0dWkudXRpbC5iaW5kKHRoaXMucmVtb3ZlUGFkZGluZywgdGhpcywgY2FsbGJhY2spLCB0cnVlKTtcblxuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiB0aGlzLl91cGxvYWRlci51cmwucmVtb3ZlLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29ucCcsXG4gICAgICAgICAgICBqc29ucDogY2FsbGJhY2tOYW1lLFxuICAgICAgICAgICAgZGF0YTogdHVpLnV0aWwuZXh0ZW5kKGRhdGEsIGNvbmZpZy5kYXRhKVxuICAgICAgICB9KTtcblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcmVwcm9jZXNzaW5nIHJlc3BvbnNlIGJlZm9yZSBjYWxsYmFjayBydW4uXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgUmVxdWVzdCBDYWxsYmFjayBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSBSZXNwb25zZSBmcm9tIHNlcnZlclxuICAgICAqIEBtZW1iZXJvZiBDb25uZWN0b3IuSnNvbnBcbiAgICAgKi9cbiAgICByZW1vdmVQYWRkaW5nOiBmdW5jdGlvbihjYWxsYmFjaywgcmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgICByZXN1bHQuYWN0aW9uID0gJ3JlbW92ZSc7XG4gICAgICAgIHJlc3VsdC5uYW1lID0gZGVjb2RlVVJJQ29tcG9uZW50KHJlc3BvbnNlLm5hbWUpO1xuXG4gICAgICAgIGNhbGxiYWNrKHJlc3VsdCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBKc29ucDtcbiIsIi8qKlxuICogQGZpbGVvdmV2aWV3IFRoaXMgQ29ubmVjdG9yIG1ha2UgY29ubmVjdGlvbiBiZXR3ZWVuIFVwbG9hZGVyIGFuZCBodG1sNSBmaWxlIGFwaS5cbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG4vKipcbiAqIFRoZSBtb2R1bGVzIHdpbGwgYmUgbWl4ZWQgaW4gY29ubmVjdG9yIGJ5IHR5cGUuXG4gKiBAbmFtZXNwYWNlIENvbm5lY3Rvci5Mb2NhbFxuICovXG52YXIgTG9jYWwgPSB7LyoqIEBsZW5kcyBDb25uZWN0b3IuTG9jYWwucHJvdG90eXBlICovXG4gICAgLyoqXG4gICAgICogQSByZXN1bHQgYXJyYXkgdG8gc2F2ZSBmaWxlIHRvIHNlbmQuXG4gICAgICovXG4gICAgX3Jlc3VsdCA6IG51bGwsXG4gICAgLyoqXG4gICAgICogQWRkIFJlcXVlc3QsIHNhdmUgZmlsZXMgdG8gYXJyYXkuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgVGhlIGRhdGEgb2YgY29ubmVjdGlvbiBmb3Igc2VydmVyXG5cdFx0ICogQHBhcmFtIHtvYmplY3R9IFtmaWxlc10gVGhlIGZpbGVzIHRvIHNhdmVcbiAgICAgKiBAbWVtYmVyb2YgQ29ubmVjdG9yLkxvY2FsXG4gICAgICovXG4gICAgYWRkUmVxdWVzdDogZnVuY3Rpb24oZGF0YSwgZmlsZXMpIHtcbiAgICAgICAgdmFyIGlzVmFsaWRQb29sID0gdXRpbHMuaXNTdXBwb3J0Rm9ybURhdGEoKSxcbiAgICAgICAgICAgIHJlc3VsdCA9IHRoaXMuX3NhdmVGaWxlKGlzVmFsaWRQb29sLCBmaWxlcyk7XG4gICAgICAgIGRhdGEuc3VjY2Vzcyh7XG4gICAgICAgICAgICBpdGVtczogcmVzdWx0XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTYXZlIGZpbGUgdG8gcG9vbFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNTdXBwb3J0QWpheCBXaGV0aGVyIEZvcm1EYXRhIGlzIHN1cHBvcnRlZCBvciBub3Rcblx0XHQgKiBAcGFyYW0ge29iamVjdH0gW2ZpbGVzXSBUaGUgZmlsZXMgdG8gc2F2ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICogQG1lbWJlcm9mIENvbm5lY3Rvci5Mb2NhbFxuICAgICAqL1xuICAgIF9zYXZlRmlsZTogZnVuY3Rpb24oaXNTdXBwb3J0QWpheCwgZmlsZXMpIHtcbiAgICAgICAgdmFyIHVwbG9hZGVyID0gdGhpcy5fdXBsb2FkZXIsXG4gICAgICAgICAgICBpbnB1dFZpZXcgPSB1cGxvYWRlci5pbnB1dFZpZXcsXG4gICAgICAgICAgICBmaWxlRWwgPSBpbnB1dFZpZXcuJGlucHV0WzBdLFxuXHRcdFx0XHRcdFx0cmVzdWx0ID0gW107XG5cbiAgICAgICAgaWYgKCF0aGlzLl9yZXN1bHQpIHtcbiAgICAgICAgICAgIHRoaXMuX3Jlc3VsdCA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzU3VwcG9ydEFqYXgpIHtcbiAgICAgICAgICAgIGZpbGVzID0gZmlsZXMgfHwgZmlsZUVsLmZpbGVzO1xuICAgICAgICAgICAgdHVpLnV0aWwuZm9yRWFjaChmaWxlcywgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgICAgIGlmICh0dWkudXRpbC5pc09iamVjdChpdGVtKSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHtcbiAgICAgICAgICAgICAgICBuYW1lOiBmaWxlRWwudmFsdWUsXG4gICAgICAgICAgICAgICAgZWxlbWVudDogZmlsZUVsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG5cdFx0dGhpcy5fcmVzdWx0ID0gdGhpcy5fcmVzdWx0LmNvbmNhdChyZXN1bHQpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlcyBmb3JtIGRhdGEgdG8gc2VuZCBQT1NUKEZvcm1EYXRlIHN1cHBvcnRlZCBjYXNlKVxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqIEBwcml2YXRlXG4gICAgICogQG1lbWJlcm9mIENvbm5lY3Rvci5Mb2NhbFxuICAgICAqL1xuICAgIF9tYWtlRm9ybURhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdXBsb2FkZXIgPSB0aGlzLl91cGxvYWRlcixcblx0XHRmaWVsZCA9IHVwbG9hZGVyLmZpbGVGaWVsZCxcblx0XHRpbnB1dCA9IHVwbG9hZGVyLmlucHV0Vmlldyxcblx0XHRmb3JtID0gbmV3IHdpbmRvdy5Gb3JtRGF0YSh0aGlzLl9leHRyYWN0Rm9ybShpbnB1dCkpO1xuXG4gICAgICAgIHR1aS51dGlsLmZvckVhY2godGhpcy5fcmVzdWx0LCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICBmb3JtLmFwcGVuZChmaWVsZCwgaXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZm9ybTtcbiAgICB9LFxuXG5cdC8qKlxuXHQgKiBFeHRyYWN0cyBGb3JtIGZyb20gaW5wdXRWaWV3XG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBpbnB1dCBUaGUgaW5wdXQgdmlldyBmb3IgZXh0cmFjdGluZyBcbiAgICAgKiBAbWVtYmVyb2YgQ29ubmVjdG9yLkxvY2FsXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cblx0X2V4dHJhY3RGb3JtOiBmdW5jdGlvbihpbnB1dCkge1xuXHR2YXIgZm9ybSA9IGlucHV0LiRlbC5jbG9uZSgpO1xuXHRcdC8vIGFwcGVuZCB0byBwb29sXG5cdFx0cmV0dXJuIGZvcm1bMF07XG5cdH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZmlsZSBmb3JtIHJlc3VsdCBhcnJheVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBpbmZvIFRoZSBpbmZvcm1hdGlvbiBzZXQgdG8gcmVtb3ZlIGZpbGVcbiAgICAgKiBAbWVtYmVyb2YgQ29ubmVjdG9yLkxvY2FsXG4gICAgICovXG4gICAgcmVtb3ZlUmVxdWVzdDogZnVuY3Rpb24oaW5mbykge1xuICAgICAgICB2YXIgZGF0YSA9IGluZm8uZGF0YTtcbiAgICAgICAgdGhpcy5fcmVzdWx0ID0gdHVpLnV0aWwuZmlsdGVyKHRoaXMuX3Jlc3VsdCwgZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgICAgIHJldHVybiBlbC5uYW1lICE9PSBkYXRhLmZpbGVuYW1lO1xuICAgICAgICB9KTtcblxuICAgICAgICBpbmZvLnN1Y2Nlc3Moe1xuICAgICAgICAgICAgYWN0aW9uOiAncmVtb3ZlJyxcbiAgICAgICAgICAgIG5hbWU6IGRhdGEuZmlsZW5hbWVcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNlbmQgZmlsZXMgaW4gYSBiYXRjaC5cbiAgICAgKiBAcGFyYW0gY2FsbGJhY2tcbiAgICAgKiBAbWVtYmVyb2YgQ29ubmVjdG9yLkxvY2FsXG4gICAgICovXG4gICAgc3VibWl0OiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB2YXIgZm9ybSA9IHRoaXMuX21ha2VGb3JtRGF0YShpbnB1dFZpZXcpO1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiB0aGlzLl91cGxvYWRlci51cmwuc2VuZCxcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgIGRhdGE6IGZvcm0sXG4gICAgICAgICAgICBzdWNjZXNzOiBjYWxsYmFjayxcbiAgICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBmYWxzZVxuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IExvY2FsO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbmZpZ3VyYXRpb24gb3IgZGVmYXVsdCB2YWx1ZXMuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG4vKipcbiAqIENvbmZpZ3VyYXRpb24gb2YgY29ubmVjdGlvbiB3aXRoIHNlcnZlci5cbiAgKiBAdHlwZSB7e1JFU1BPTlNFX1RZUEU6IHN0cmluZywgUkVESVJFQ1RfVVJMOiBzdHJpbmd9fVxuICovXG5tb2R1bGUuZXhwb3J0cy5DT05GID0ge1xuXHRSRVNQT05TRV9UWVBFOiAnUkVTUE9OU0VfVFlQRScsXG5cdFJFRElSRUNUX1VSTDogJ1JFRElSRUNUX1VSTCcsXG5cdEpTT05QQ0FMTEJBQ0tfTkFNRTogJ0NBTExCQUNLX05BTUUnLFxuXHRTSVpFX1VOSVQ6ICdTSVpFX1VOSVQnLFxuXHRSRU1PVkVfQ0FMTEJBQ0sgOiAncmVzcG9uc2VSZW1vdmVDYWxsYmFjaycsXG5cdEVSUk9SOiB7XG5cdFx0REVGQVVMVDogJ1Vua25vd24gZXJyb3IuJyxcblx0XHROT1RfU1VSUFBPUlQ6ICdUaGlzIGlzIHgtZG9tYWluIGNvbm5lY3Rpb24sIHlvdSBoYXZlIHRvIG1ha2UgaGVscGVyIHBhZ2UuJ1xuXHR9LFxuXHREUkFHX0RFRkFVTFRfRU5BQkxFX0NMQVNTOiAnZW5hYmxlQ2xhc3MnLFxuXHRGSUxFX0ZJTEVEX05BTUU6ICd1c2VyZmlsZVtdJyxcblx0Rk9MREVSX0lORk86ICdmb2xkZXJOYW1lJ1xufTtcblxuLyoqXG4qIERlZmF1bHQgSHRtbHNcbiogQHR5cGUge3tpbnB1dDogc3RyaW5nLCBpdGVtOiBzdHJpbmd9fVxuKi9cbm1vZHVsZS5leHBvcnRzLkhUTUwgPSB7XG5cdGZvcm06IFsnPGZvcm0gZW5jdHlwZT1cIm11bHRpcGFydC9mb3JtLWRhdGFcIiBpZD1cImZvcm1EYXRhXCIgbWV0aG9kPVwicG9zdFwiPicsXG5cdFx0JzxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cIk1BWF9GSUxFX1NJWkVcIiB2YWx1ZT1cIjMwMDAwMDBcIiAvPicsXG5cdCc8L2Zvcm0+J10uam9pbignJyksXG5cdGlucHV0OiBbJzxpbnB1dCB0eXBlPVwiZmlsZVwiIGlkPVwiZmlsZUF0dGFjaFwiIHt7d2Via2l0ZGlyZWN0b3J5fX0gbmFtZT1cInt7ZmlsZUZpZWxkfX1cIiB7e211bHRpcGxlfX0gLz4nXS5qb2luKCcnKSxcblx0c3VibWl0OiBbJzxidXR0b24gY2xhc3M9XCJiYXRjaFN1Ym1pdFwiIHR5cGU9XCJzdWJtaXRcIj5TRU5EPC9idXR0b24+J10uam9pbignJyksXG5cdGl0ZW06IFsnPGxpIGNsYXNzPVwiZmlsZXR5cGVEaXNwbGF5Q2xhc3NcIj4nLFxuXHRcdCc8c3BuYSBjbGFzcz1cImZpbGVpY29uIHt7ZmlsZXR5cGV9fVwiPnt7ZmlsZXR5cGV9fTwvc3BuYT4nLFxuXHRcdCc8c3BhbiBjbGFzcz1cImZpbGVfbmFtZVwiPnt7ZmlsZW5hbWV9fTwvc3Bhbj4nLFxuXHRcdCc8c3BhbiBjbGFzcz1cImZpbGVfc2l6ZVwiPnt7ZmlsZXNpemV9fTwvc3Bhbj4nLFxuXHRcdCc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cInt7ZGVsZXRlQnV0dG9uQ2xhc3NOYW1lfX1cIj5EZWxldGU8L2J1dHRvbj4nLFxuXHRcdCc8L2xpPiddLmpvaW4oJycpLFxuXHRkcmFnOiBbJzxkaXYgY2xhc3M9XCJkcmFnem9uZVwiPjwvZGl2PiddLmpvaW4oJycpXG59O1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZpbGVVcGxvYWRlciBpcyBjb3JlIG9mIGZpbGUgdXBsb2FkZXIgY29tcG9uZW50Ljxicj5GaWxlTWFuYWdlciBtYW5hZ2UgY29ubmVjdG9yIHRvIGNvbm5lY3Qgc2VydmVyIGFuZCB1cGRhdGUgRmlsZUxpc3RWaWV3LlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxudmFyIGNvbnN0cyA9IHJlcXVpcmUoJy4vY29uc3RzJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgY29ubiA9IHJlcXVpcmUoJy4vY29ubmVjdG9yL2Nvbm5lY3RvcicpO1xudmFyIElucHV0ID0gcmVxdWlyZSgnLi92aWV3L2lucHV0Jyk7XG52YXIgTGlzdCA9IHJlcXVpcmUoJy4vdmlldy9saXN0Jyk7XG52YXIgUG9vbCA9IHJlcXVpcmUoJy4vdmlldy9wb29sJyk7XG52YXIgRHJhZ0FuZERyb3AgPSByZXF1aXJlKCcuL3ZpZXcvZHJhZycpO1xuXG4vKipcbiAqIEZpbGVVcGxvYWRlciBhY3QgbGlrZSBicmlkZ2UgYmV0d2VlbiBjb25uZWN0b3IgYW5kIHZpZXcuXG4gKiBJdCBtYWtlcyBjb25uZWN0b3IgYW5kIHZpZXcgd2l0aCBvcHRpb24gYW5kIGVudmlyb25tZW50LlxuICogSXQgY29udHJvbCBhbmQgbWFrZSBjb25uZWN0aW9uIGFtb25nIG1vZHVsZXMuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFRoZSBvcHRpb25zIHRvIHNldCB1cCBmaWxlIHVwbG9hZGVyIG1vZHVsZXMuXG4gKiAgQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMudXJsIFRoZSB1cmwgaXMgZmlsZSBzZXJ2ZXIuXG4gKiAgICAgIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnVybC5zZW5kIFRoZSB1cmwgaXMgZm9yIGZpbGUgYXR0YWNoLlxuICogICAgICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy51cmwucmVtb3ZlIFRoZSB1cmwgaXMgZm9yIGZpbGUgZGV0YWNoLlxuICogIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLmhlbHBlciBUaGUgaGVscGVyIG9iamVjdCBpbmZvIGlzIGZvciB4LWRvbWFpbi5cbiAqICAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuaGVscGVyLnVybCBUaGUgdXJsIGlzIGhlbHBlciBwYWdlIHVybC5cbiAqICAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuaGVscGVyLm5hbWUgVGhlIG5hbWUgb2YgaGlkZGVuIGVsZW1lbnQgZm9yIHNlbmRpbmcgc2VydmVyIGhlbHBlciBwYWdlIGluZm9ybWF0aW9uLlxuICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnJlc3VsdFR5cGVFbGVtZW50TmFtZSBUaGUgdHlwZSBvZiBoaWRkZW4gZWxlbWVudCBmb3Igc2VuZGluZyBzZXJ2ZXIgcmVzcG9uc2UgdHlwZSBpbmZvcm1hdGlvbi5cbiAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5mb3JtVGFyZ2V0IFRoZSB0YXJnZXQgZm9yIHgtZG9tYWluIGpzb25wIGNhc2UuXG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuY2FsbGJhY2tOYW1lIFRoZSBuYW1lIG9mIGpzb25wIGNhbGxiYWNrIGZ1bmN0aW9uLlxuICogIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLmxpc3RJbmZvIFRoZSBlbGVtZW50IGluZm8gdG8gZGlzcGxheSBmaWxlIGxpc3QgaW5mb3JtYXRpb24uXG4gKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuc2VwYXJhdG9yIFRoZSBzZXBhcmF0b3IgZm9yIGpzb25wIGhlbHBlciByZXNwb25zZS5cbiAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZmlsZUZpZWxkPXVzZXJGaWxlXSBUaGUgZmllbGQgbmFtZSBvZiBpbnB1dCBmaWxlIGVsZW1lbnQuXG4gKiAgQHBhcmFtIHtib29sZWFufSBvcHRpb25zLnVzZUZvbGRlciBXaGV0aGVyIHNlbGVjdCB1bml0IGlzIGZvbGRlciBvZiBub3QuIElmIHRoaXMgaXMgdHVyZSwgbXVsdGlwbGUgd2lsbCBiZSBpZ25vcmVkLlxuICogIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy5pc011bHRpcGxlIFdoZXRoZXIgZW5hYmxlIG11bHRpcGxlIHNlbGVjdCBvciBub3QuXG4gKiBAcGFyYW0ge2pRdWVyeX0gJGVsIFJvb3QgRWxlbWVudCBvZiBVcGxvYWRlclxuICogQGV4YW1wbGVcbiAqIHZhciB1cGxvYWRlciA9IG5ldyB0dWkuY29tcG9uZW50LlVwbG9hZGVyKHtcbiAqICAgICB1cmw6IHtcbiAqICAgICAgICAgc2VuZDogXCJodHRwOi8vZmUubmhuZW50LmNvbS9ldGMvZXRjL3VwbG9hZGVyL3VwbG9hZGVyLnBocFwiLFxuICogICAgICAgICByZW1vdmU6IFwiaHR0cDovL2ZlLm5obmVudC5jb20vZXRjL2V0Yy91cGxvYWRlci9yZW1vdmUucGhwXCJcbiAqICAgICB9LFxuICogICAgIGhlbHBlcjoge1xuICogICAgICAgICB1cmw6ICdodHRwOi8vMTAuNzcuMzQuMTI2OjgwMDkvc2FtcGxlcy9yZXNwb25zZS5odG1sJyxcbiAqICAgICAgICAgbmFtZTogJ1JFRElSRUNUX1VSTCdcbiAqICAgICB9LFxuICogICAgIHJlc3VsdFR5cGVFbGVtZW50TmFtZTogJ1JFU1BPTlNFX1RZUEUnLFxuICogICAgIGZvcm1UYXJnZXQ6ICdoaWRkZW5GcmFtZScsXG4gKiAgICAgY2FsbGJhY2tOYW1lOiAncmVzcG9uc2VDYWxsYmFjaycsXG4gKiAgICAgbGlzdEluZm86IHtcbiAqICAgICAgICAgbGlzdDogJCgnI2ZpbGVzJyksXG4gKiAgICAgICAgIGNvdW50OiAkKCcjZmlsZV9jb3VudCcpLFxuICogICAgICAgICBzaXplOiAkKCcjc2l6ZV9jb3VudCcpXG4gKiAgICAgfSxcbiAqICAgICBzZXBhcmF0b3I6ICc7J1xuICogfSwgJCgnI3VwbG9hZGVyJykpO1xuICovXG52YXIgVXBsb2FkZXIgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKipAbGVuZHMgVXBsb2FkZXIucHJvdG90eXBlICove1xuXHQvKipcblx0ICogaW5pdGlhbGl6ZVxuXHQgKi9cblx0aW5pdDogZnVuY3Rpb24ob3B0aW9ucywgJGVsKSB7XG5cdFx0dGhpcy5fc2V0RGF0YShvcHRpb25zKTtcblx0XHR0aGlzLl9zZXRDb25uZWN0b3IoKTtcblxuXHRcdHRoaXMuJGVsID0gJGVsO1xuXG5cdFx0aWYodGhpcy51c2VEcmFnICYmICF0aGlzLnVzZUZvbGRlciAmJiB1dGlscy5pc1N1cHBvcnRGaWxlU3lzdGVtKCkpIHtcblx0XHRcdHRoaXMuZHJhZ1ZpZXcgPSBuZXcgRHJhZ0FuZERyb3Aob3B0aW9ucywgdGhpcyk7XG5cdFx0fVxuXG5cdFx0dGhpcy5pbnB1dFZpZXcgPSBuZXcgSW5wdXQob3B0aW9ucywgdGhpcyk7XG5cdFx0dGhpcy5saXN0VmlldyA9IG5ldyBMaXN0KG9wdGlvbnMsIHRoaXMpO1xuXG5cdFx0dGhpcy5maWxlRmllbGQgPSB0aGlzLmZpbGVGaWVsZCB8fCBjb25zdHMuQ09ORi5GSUxFX0ZJTEVEX05BTUU7XG5cdFx0dGhpcy5fcG9vbCA9IG5ldyBQb29sKHRoaXMuaW5wdXRWaWV3LiRlbFswXSk7XG5cdFx0dGhpcy5fYWRkRXZlbnQoKTtcblx0fSxcblx0XG5cdC8qKlxuXHQgKiBTZXQgQ29ubmVjdG9yIGJ5IHVzZUpzb25wIGZsYWcgYW5kIHdoZXRoZXIuXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfc2V0Q29ubmVjdG9yOiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5pc0JhdGNoVHJhbnNmZXIpIHtcblx0XHRcdHRoaXMudHlwZSA9ICdsb2NhbCc7XG5cdFx0fSBlbHNlIGlmICh0aGlzLmlzQ3Jvc3NEb21haW4oKSkge1xuXHRcdFx0aWYgKHRoaXMuaGVscGVyKSB7XG5cdFx0XHRcdHRoaXMudHlwZSA9ICdqc29ucCc7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhbGVydChjb25zdHMuQ09ORi5FUlJPUi5OT1RfU1VSUFBPUlQpO1xuICAgICAgICAgICAgICAgIHRoaXMudHlwZSA9ICdsb2NhbCc7ICAgIFxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAodGhpcy51c2VKc29ucCB8fCAhdXRpbHMuaXNTdXBwb3J0Rm9ybURhdGEoKSkge1xuXHRcdFx0XHR0aGlzLnR5cGUgPSAnanNvbnAnO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy50eXBlID0gJ2FqYXgnO1xuXHRcdFx0fVxuXHRcdH1cblx0XHR0aGlzLl9jb25uZWN0b3IgPSBjb25uLmdldENvbm5lY3Rvcih0aGlzKTtcblx0fSxcblxuXHQvKipcblx0ICogVXBkYXRlIGxpc3QgdmlldyB3aXRoIGN1c3RvbSBvciBvcmlnaW5hbCBkYXRhLlxuXHQgKiBAcGFyYW0ge29iamVjdH0gaW5mbyBUaGUgZGF0YSBmb3IgdXBkYXRlIGxpc3Rcblx0ICogIEBwYXJhbSB7c3RyaW5nfSBpbmZvLmFjdGlvbiBUaGUgYWN0aW9uIG5hbWUgdG8gZXhlY3V0ZSBtZXRob2Rcblx0ICovXG5cdG5vdGlmeTogZnVuY3Rpb24oaW5mbykge1xuXHRcdHRoaXMubGlzdFZpZXcudXBkYXRlKGluZm8pO1xuXHRcdHRoaXMubGlzdFZpZXcudXBkYXRlVG90YWxJbmZvKGluZm8pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBTZXQgZmllbGQgZGF0YSBieSBvcHRpb24gdmFsdWVzLlxuXHQgKiBAcGFyYW0gb3B0aW9uc1xuXHQgKiBAcHJpdmF0ZVxuICAgICAqL1xuXHRfc2V0RGF0YTogZnVuY3Rpb24ob3B0aW9ucykge1xuXHRcdHR1aS51dGlsLmV4dGVuZCh0aGlzLCBvcHRpb25zKTtcblx0fSxcblxuXHQvKipcblx0ICogRXh0cmFjdCBwcm90b2NvbCArIGRvbWFpbiBmcm9tIHVybCB0byBmaW5kIG91dCB3aGV0aGVyIGNyb3NzLWRvbWFpbiBvciBub3QuXG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0aXNDcm9zc0RvbWFpbjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHBhZ2VEb21haW4gPSBkb2N1bWVudC5kb21haW47XG5cdFx0cmV0dXJuIHRoaXMudXJsLnNlbmQuaW5kZXhPZihwYWdlRG9tYWluKSA9PT0gLTE7XG5cdH0sXG5cblx0LyoqXG5cdCAqIENhbGxiYWNrIGZvciBlcnJvclxuXHQgKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgRXJyb3IgcmVzcG9uc2Vcblx0ICovXG5cdGVycm9yQ2FsbGJhY2s6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0dmFyIG1lc3NhZ2U7XG5cdFx0aWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLm1zZykge1xuXHRcdFx0bWVzc2FnZSA9IHJlc3BvbnNlLm1zZztcblx0XHR9IGVsc2Uge1xuXHRcdFx0bWVzc2FnZSA9IGNvbnN0cy5DT05GLkVSUk9SLkRFRkFVTFQ7XG5cdFx0fVxuXHRcdGFsZXJ0KG1lc3NhZ2UpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBDYWxsYmFjayBmb3IgY3VzdG9tIHNlbmQgZXZlbnRcblx0ICogQHBhcmFtIHtvYmplY3R9IFtkYXRhXSBUaGUgZGF0YSBpbmNsdWRlIGNhbGxiYWNrIGZ1bmN0aW9uIGZvciBmaWxlIGNsb25lXG5cdCAqL1xuXHRzZW5kRmlsZTogZnVuY3Rpb24oZGF0YSkge1xuXHRcdHZhciBjYWxsYmFjayA9IHR1aS51dGlsLmJpbmQodGhpcy5ub3RpZnksIHRoaXMpLFxuXHRcdGZpbGVzID0gZGF0YSAmJiBkYXRhLmZpbGVzO1xuXHRcdFxuXHRcdHRoaXMuX2Nvbm5lY3Rvci5hZGRSZXF1ZXN0KHtcblx0XHRcdHR5cGU6ICdhZGQnLFxuXHRcdFx0c3VjY2VzczogZnVuY3Rpb24ocmVzdWx0KSB7XG5cdFx0XHRcdGlmIChkYXRhICYmIGRhdGEuY2FsbGJhY2spIHtcblx0XHRcdFx0XHRkYXRhLmNhbGxiYWNrKHJlc3VsdCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y2FsbGJhY2socmVzdWx0KTtcblx0XHRcdH0sXG5cdFx0XHRlcnJvcjogdGhpcy5lcnJvckNhbGxiYWNrXG5cdFx0fSwgZmlsZXMpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBDYWxsYmFjayBmb3IgY3VzdG9tIHJlbW92ZSBldmVudFxuXHQgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBUaGUgZGF0YSBmb3IgcmVtb3ZlIGZpbGUuXG5cdCAqL1xuXHRyZW1vdmVGaWxlOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0dmFyIGNhbGxiYWNrID0gdHVpLnV0aWwuYmluZCh0aGlzLm5vdGlmeSwgdGhpcyk7XG5cdFx0dGhpcy5fY29ubmVjdG9yLnJlbW92ZVJlcXVlc3Qoe1xuXHRcdFx0dHlwZTogJ3JlbW92ZScsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0c3VjY2VzczogY2FsbGJhY2tcblx0XHR9KTtcblx0fSxcblxuXHQvKipcblx0ICogU3VibWl0IGZvciBkYXRhIHN1Ym1pdCB0byBzZXJ2ZXJcbiAgICAgKiBAYXBpXG5cdCAqL1xuXHRzdWJtaXQ6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLl9jb25uZWN0b3Iuc3VibWl0KSB7XG5cdFx0XHRpZiAodXRpbHMuaXNTdXBwb3J0Rm9ybURhdGEoKSkge1xuXHRcdFx0XHR0aGlzLl9jb25uZWN0b3Iuc3VibWl0KHR1aS51dGlsLmJpbmQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0LyoqXG5cdFx0XHRcdFx0ICogQGFwaVxuXHRcdFx0XHRcdCAqIEBldmVudCBVcGxvYWRlciNiZWZvcmVzdWJtaXRcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHtVcGxvYWRlcn0gdXBsb2FkZXIgLSB1cGxvYWRlciBpbnN0YW5jZVxuXHRcdFx0XHRcdCAqL1xuXHRcdFx0XHRcdHRoaXMuZmlyZSgnYmVmb3Jlc3VibWl0JywgdGhpcyk7XG5cdFx0XHRcdH0sIHRoaXMpKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuX3Bvb2wucGxhbnQoKTtcblx0XHRcdH1cblx0XHR9IFxuXHR9LFxuXG5cdC8qKlxuXHQgKiBHZXQgZmlsZSBpbmZvIGxvY2FsbHlcblx0ICogQHBhcmFtIHtIdG1sRWxlbWVudH0gZWxlbWVudCBJbnB1dCBlbGVtZW50XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfZ2V0RmlsZUluZm86IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0XHR2YXIgZmlsZXM7XG5cdFx0aWYgKHV0aWxzLmlzU3VwcG9ydEZpbGVTeXN0ZW0oKSkge1xuXHRcdFx0ZmlsZXMgPSB0aGlzLl9nZXRGaWxlTGlzdChlbGVtZW50LmZpbGVzKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZmlsZXMgPSB7XG5cdFx0XHRcdG5hbWU6IGVsZW1lbnQudmFsdWUsXG5cdFx0XHRcdGlkOiBlbGVtZW50LnZhbHVlXG5cdFx0XHR9O1xuXHRcdH1cblx0XHRyZXR1cm4gZmlsZXM7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEdldCBmaWxlIGxpc3QgZnJvbSBGaWxlTGlzdCBvYmplY3Rcblx0ICogQHBhcmFtIHtGaWxlTGlzdH0gZmlsZXMgQSBGaWxlTGlzdCBvYmplY3Rcblx0ICogQHJldHVybnMge0FycmF5fVxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X2dldEZpbGVMaXN0OiBmdW5jdGlvbihmaWxlcykge1xuXHRcdHJldHVybiB0dWkudXRpbC5tYXAoZmlsZXMsIGZ1bmN0aW9uKGZpbGUpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdG5hbWU6IGZpbGUubmFtZSxcblx0XHRcdFx0c2l6ZTogZmlsZS5zaXplLFxuXHRcdFx0XHRpZDogZmlsZS5uYW1lXG5cdFx0XHR9O1xuXHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBZGQgZXZlbnQgdG8gbGlzdHZpZXcgYW5kIGlucHV0dmlld1xuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X2FkZEV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0aWYodGhpcy51c2VEcmFnICYmIHRoaXMuZHJhZ1ZpZXcpIHtcblx0XHRcdC8vIEB0b2RvIHRvcCDsspjrpqzqsIAg65Sw66GcIO2VhOyalO2VqCwgc2VuZEZpbGUg7IKs7JqpIOyViOuQqFxuXHRcdFx0dGhpcy5kcmFnVmlldy5vbignZHJvcCcsIHRoaXMuc2VuZEZpbGUsIHRoaXMpO1xuXHRcdH1cblx0XHRpZiAodGhpcy5pc0JhdGNoVHJhbnNmZXIpIHtcblx0XHRcdHRoaXMuaW5wdXRWaWV3Lm9uKCdzYXZlJywgdGhpcy5zZW5kRmlsZSwgdGhpcyk7XG5cdFx0XHR0aGlzLmxpc3RWaWV3Lm9uKCdyZW1vdmUnLCB0aGlzLnJlbW92ZUZpbGUsIHRoaXMpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmlucHV0Vmlldy5vbignY2hhbmdlJywgdGhpcy5zZW5kRmlsZSwgdGhpcyk7XG5cdFx0XHR0aGlzLmxpc3RWaWV3Lm9uKCdyZW1vdmUnLCB0aGlzLnJlbW92ZUZpbGUsIHRoaXMpO1xuXHRcdH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQ3VzdG9tIEV2ZW50c1xuICAgICAgICAgKiBAYXBpXG4gICAgICAgICAqIEBldmVudCBVcGxvYWRlciNmaWxlQWRkZWRcbiAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IHRhcmdldCAtIFRhcmdldCBpdGVtIGluZm9ybWF0aW9uXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmxpc3RWaWV3Lm9uKCdmaWxlQWRkZWQnLCBmdW5jdGlvbih0YXJnZXQpIHtcbiAgICAgICAgICAgIHNlbGYuZmlyZSh0YXJnZXQpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ3VzdG9tIEV2ZW50c1xuICAgICAgICAgKiBAYXBpXG4gICAgICAgICAqIEBldmVudCBVcGxvYWRlciNmaWxlUmVtb3ZlZFxuICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gbmFtZSAtIFRoZSBmaWxlIG5hbWUgdG8gcmVtb3ZlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmxpc3RWaWV3Lm9uKCdmaWxlUmVtb3ZlZCcsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICAgIHNlbGYuZmlyZShuYW1lKTtcbiAgICAgICAgfSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFN0b3JlIGlucHV0IGVsZW1lbnQgdG8gcG9vbC5cblx0ICogQHBhcmFtIHtIVE1MRWxlbWVudH0gaW5wdXQgQSBpbnB1dCBlbGVtZW50W3R5cGU9ZmlsZV0gZm9yIHN0b3JlIHBvb2xcblx0ICovXG5cdHN0b3JlOiBmdW5jdGlvbihpbnB1dCkge1xuXHRcdHRoaXMuX3Bvb2wuc3RvcmUoaW5wdXQpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZW1vdmUgaW5wdXQgZWxlbWVudCBmb3JtIHBvb2wuXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBmaWxlIG5hbWUgdG8gcmVtb3ZlXG5cdCAqL1xuXHRyZW1vdmU6IGZ1bmN0aW9uKG5hbWUpIHtcblx0XHRpZiAoIXV0aWxzLmlzU3VwcG9ydEZvcm1EYXRhKCkpIHtcblx0XHRcdHRoaXMuX3Bvb2wucmVtb3ZlKG5hbWUpO1xuXHRcdH1cblx0fVxufSk7XG5cbnR1aS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihVcGxvYWRlcik7XG5tb2R1bGUuZXhwb3J0cyA9IFVwbG9hZGVyO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgZmlsZSBjb250YWluIHV0aWxpdHkgbWV0aG9kcyBmb3IgdXBsb2FkZXIuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG5cbi8qKlxuICogQG5hbWVzcGFjZSB1dGlsc1xuICovXG5cbi8qKlxuICogRXh0cmFjdCB1bml0IGZvciBmaWxlIHNpemVcbiAqIEBwYXJhbSB7bnVtYmVyfSBieXRlcyBBIHVzYWdlIG9mIGZpbGVcbiAqIEBtZW1iZXJvZiB1dGlsc1xuICovXG52YXIgZ2V0RmlsZVNpemVXaXRoVW5pdCA9IGZ1bmN0aW9uKGJ5dGVzKSB7XG4gICAgdmFyIHVuaXRzID0gWydCJywgJ0tCJywgJ01CJywgJ0dCJywgJ1RCJ10sXG4gICAgICAgIGJ5dGVzID0gcGFyc2VJbnQoYnl0ZXMsIDEwKSxcbiAgICAgICAgZXhwID0gTWF0aC5sb2coYnl0ZXMpIC8gTWF0aC5sb2coMTAyNCkgfCAwLFxuICAgICAgICByZXN1bHQgPSAoYnl0ZXMgLyBNYXRoLnBvdygxMDI0LCBleHApKS50b0ZpeGVkKDIpO1xuXG4gICAgcmV0dXJuIHJlc3VsdCArIHVuaXRzW2V4cF07XG59O1xuXG4vKipcbiAqIFdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydCBGb3JtRGF0YSBvciBub3RcbiAqIEBtZW1iZXJvZiB1dGlsc1xuICovXG52YXIgaXNTdXBwb3J0Rm9ybURhdGEgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgRm9ybURhdGEgPSAod2luZG93LkZvcm1EYXRhIHx8IG51bGwpO1xuICAgIHJldHVybiAhIUZvcm1EYXRhO1xufTtcblxuLyoqXG4gKiBHZXQgaXRlbSBlbGVtZW4gSFRNTFxuICogQHBhcmFtIHtzdHJpbmd9IGh0bWwgSFRNTCB0ZW1wbGF0ZVxuICogQHJldHVybnMge3N0cmluZ31cbiAqIEBtZW1iZXJvZiB1dGlsc1xuICovXG52YXIgdGVtcGxhdGUgPSBmdW5jdGlvbihtYXAsIGh0bWwpIHtcbiAgICBodG1sID0gaHRtbC5yZXBsYWNlKC9cXHtcXHsoW15cXH1dKylcXH1cXH0vZywgZnVuY3Rpb24obXN0ciwgbmFtZSkge1xuICAgICAgICByZXR1cm4gbWFwW25hbWVdO1xuICAgIH0pO1xuICAgIHJldHVybiBodG1sO1xufTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHN1cHBvcnQgZmlsZSBhcGkgb3Igbm90XG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqIEBtZW1iZXJvZiB1dGlsc1xuICovXG52YXIgaXNTdXBwb3J0RmlsZVN5c3RlbSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAhISh3aW5kb3cuRmlsZSAmJiB3aW5kb3cuRmlsZVJlYWRlciAmJiB3aW5kb3cuRmlsZUxpc3QgJiYgd2luZG93LkJsb2IpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0RmlsZVNpemVXaXRoVW5pdDogZ2V0RmlsZVNpemVXaXRoVW5pdCxcbiAgICBpc1N1cHBvcnRGaWxlU3lzdGVtOiBpc1N1cHBvcnRGaWxlU3lzdGVtLFxuICAgIGlzU3VwcG9ydEZvcm1EYXRhOiBpc1N1cHBvcnRGb3JtRGF0YSxcbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGVcbn07XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgVGhpcyBmaWxlIGlzIGFib3V0IGRyYWcgYW5kIGRyb3AgZmlsZSB0byBzZW5kLiBEcmFnIGFuZCBkcm9wIGlzIHJ1bm5pbmcgdmlhIGZpbGUgYXBpLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxudmFyIGNvbnN0cyA9IHJlcXVpcmUoJy4uL2NvbnN0cycpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuLyoqXG4gKiBNYWtlcyBkcmFnIGFuZCBkcm9wIGFyZWEsIHRoZSBkcm9wcGVkIGZpbGUgaXMgYWRkZWQgdmlhIGV2ZW50IGRyb3AgZXZlbnQuXG4gKiBAY2xhc3MgVmlldy5EcmFnQW5kRHJvcFxuICovXG52YXIgRHJhZ0FuZERyb3AgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFZpZXcuRHJhZ0FuZERyb3AucHJvdG90eXBlICove1xuXHQvKipcblx0ICogaW5pdGlhbGl6ZSBEcmFnQW5kRHJvcFxuXHQgKi9cblx0aW5pdDogZnVuY3Rpb24ob3B0aW9ucywgdXBsb2FkZXIpIHtcblx0XHR2YXIgaHRtbCA9IG9wdGlvbnMudGVtcGxhdGUgJiYgb3B0aW9ucy50ZW1wbGF0ZS5kcmFnIHx8IGNvbnN0cy5IVE1MLmRyYWc7XG5cdFx0dGhpcy5fZW5hYmxlQ2xhc3MgPSBvcHRpb25zLmRyYWcgJiYgb3B0aW9ucy5kcmFnLmVuYWJsZUNsYXNzIHx8IGNvbnN0cy5DT05GLkRSQUdfREVGQVVMVF9FTkFCTEVfQ0xBU1M7XG5cdFx0dGhpcy5fcmVuZGVyKGh0bWwsIHVwbG9hZGVyKTtcblx0XHR0aGlzLl9hZGRFdmVudCgpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZW5kZXJzIGRyYWcgYW5kIGRyb3AgYXJlYVxuXHQgKiBAcGFyYW0ge3N0cmluZ30gaHRtbCBUaGUgaHRtbCBzdHJpbmcgdG8gbWFrZSBkYXJnIHpvbmVcblx0ICogQHBhcmFtIHtvYmplY3R9IHVwbG9hZGVyIFRoZSBjb3JlIGluc3RhbmNlIG9mIHRoaXMgY29tcG9uZW50XG4gICAgICogQHByaXZhdGVcblx0ICovXG5cdF9yZW5kZXI6IGZ1bmN0aW9uKGh0bWwsIHVwbG9hZGVyKSB7XG5cdFx0dGhpcy4kZWwgPSAkKGh0bWwpO1xuXHRcdHVwbG9hZGVyLiRlbC5hcHBlbmQodGhpcy4kZWwpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBZGRzIGRyYWcgYW5kIGRyb3AgZXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X2FkZEV2ZW50OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5vbignZHJhZ2VudGVyJywgdHVpLnV0aWwuYmluZCh0aGlzLm9uRHJhZ0VudGVyLCB0aGlzKSk7XG5cdFx0dGhpcy4kZWwub24oJ2RyYWdvdmVyJywgdHVpLnV0aWwuYmluZCh0aGlzLm9uRHJhZ092ZXIsIHRoaXMpKTtcblx0XHR0aGlzLiRlbC5vbignZHJvcCcsIHR1aS51dGlsLmJpbmQodGhpcy5vbkRyb3AsIHRoaXMpKTtcblx0XHR0aGlzLiRlbC5vbignZHJhZ2xlYXZlJywgdHVpLnV0aWwuYmluZCh0aGlzLm9uRHJhZ0xlYXZlLCB0aGlzKSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEhhbmRsZXMgZHJhZ2VudGVyIGV2ZW50XG5cdCAqL1xuXHRvbkRyYWdFbnRlcjogZnVuY3Rpb24oZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdHRoaXMuX2VuYWJsZSgpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBIYW5kbGVzIGRyYWdvdmVyIGV2ZW50XG5cdCAqL1xuXHRvbkRyYWdPdmVyOiBmdW5jdGlvbihlKSB7XG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEhhbmRsZXMgZHJhZ2xlYXZlIGV2ZW50XG5cdCAqL1xuXHRvbkRyYWdMZWF2ZTogZnVuY3Rpb24oZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdHRoaXMuX2Rpc2FibGUoKTtcblx0fSxcblxuXHQvKipcblx0ICogSGFuZGxlcyBkcm9wIGV2ZW50XG5cdCAqL1xuXHRvbkRyb3A6IGZ1bmN0aW9uKGUpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0dGhpcy5fZGlzYWJsZSgpO1xuXHRcdHRoaXMuZmlyZSgnZHJvcCcsIHtcblx0XHRcdGZpbGVzOiBlLm9yaWdpbmFsRXZlbnQuZGF0YVRyYW5zZmVyLmZpbGVzXG5cdFx0fSk7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9LFxuXG5cdF9lbmFibGU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmFkZENsYXNzKHRoaXMuX2VuYWJsZUNsYXNzKTtcblx0fSxcblxuXHRfZGlzYWJsZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3ModGhpcy5fZW5hYmxlQ2xhc3MpO1xuXHR9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKERyYWdBbmREcm9wKTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcmFnQW5kRHJvcDtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBJbnB1dFZpZXcgbWFrZSBpbnB1dCBmb3JtIGJ5IHRlbXBsYXRlLiBBZGQgZXZlbnQgZmlsZSB1cGxvYWQgZXZlbnQuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG52YXIgY29uc3RzID0gcmVxdWlyZSgnLi4vY29uc3RzJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG4vKipcbiAqIFRoaXMgdmlldyBjb250cm9sIGlucHV0IGVsZW1lbnQgdHlwZWQgZmlsZS5cbiAqIEBjb25zdHJ1Y3RvciBWaWV3LklucHV0Vmlld1xuICovXG52YXIgSW5wdXQgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKipAbGVuZHMgVmlldy5JbnB1dC5wcm90b3R5cGUgKiove1xuXHQvKipcblx0ICogSW5pdGlhbGl6ZSBpbnB1dCBlbGVtZW50LlxuXHQgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXG5cdCAqL1xuXHRpbml0OiBmdW5jdGlvbihvcHRpb25zLCB1cGxvYWRlcikge1xuXG5cdFx0dGhpcy5fdXBsb2FkZXIgPSB1cGxvYWRlcjtcblx0XHR0aGlzLl90YXJnZXQgPSBvcHRpb25zLmZvcm1UYXJnZXQ7XG5cdFx0dGhpcy5fdXJsID0gb3B0aW9ucy51cmw7XG5cdFx0dGhpcy5faXNCYXRjaFRyYW5zZmVyID0gb3B0aW9ucy5pc0JhdGNoVHJhbnNmZXI7XG5cdFx0dGhpcy5faXNNdWx0aXBsZSA9ICEhKHV0aWxzLmlzU3VwcG9ydEZvcm1EYXRhKCkgJiYgb3B0aW9ucy5pc011bHRpcGxlKTtcblx0XHR0aGlzLl91c2VGb2xkZXIgPSAhISh1dGlscy5pc1N1cHBvcnRGb3JtRGF0YSgpICYmIG9wdGlvbnMudXNlRm9sZGVyKTtcblxuXHRcdHRoaXMuX2h0bWwgPSB0aGlzLl9zZXRIVE1MKG9wdGlvbnMudGVtcGxhdGUpO1xuXG5cdFx0dGhpcy5fcmVuZGVyKCk7XG5cdFx0dGhpcy5fcmVuZGVySGlkZGVuRWxlbWVudHMoKTtcblxuXHRcdGlmIChvcHRpb25zLmhlbHBlcikge1xuXHRcdFx0dGhpcy5fbWFrZUJyaWRnZUluZm9FbGVtZW50KG9wdGlvbnMuaGVscGVyKTtcblx0XHR9XG5cblx0XHR0aGlzLl9hZGRFdmVudCgpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZW5kZXIgaW5wdXQgYXJlYVxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X3JlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwgPSAkKHRoaXMuX2dldEh0bWwoKSk7XG5cdFx0dGhpcy4kZWwuYXR0cih7XG5cdFx0XHRhY3Rpb246IHRoaXMuX3VybC5zZW5kLFxuXHRcdFx0bWV0aG9kOiAncG9zdCcsXG5cdFx0XHRlbmN0eXBlOiBcIm11bHRpcGFydC9mb3JtLWRhdGFcIixcblx0XHRcdHRhcmdldDogKCF0aGlzLl9pc0JhdGNoVHJhbnNmZXIgPyB0aGlzLl90YXJnZXQgOiAnJylcblx0XHR9KTtcblx0XHR0aGlzLiRpbnB1dCA9IHRoaXMuX2dldElucHV0RWxlbWVudCgpO1xuXHRcdHRoaXMuJHN1Ym1pdCA9IHRoaXMuX2dldFN1Ym1pdEVsZW1lbnQoKTtcblx0XHR0aGlzLiRpbnB1dC5hcHBlbmRUbyh0aGlzLiRlbCk7XG5cdFx0aWYgKHRoaXMuJHN1Ym1pdCkge1xuXHRcdFx0dGhpcy4kc3VibWl0LmFwcGVuZFRvKHRoaXMuJGVsKTtcblx0XHR9XG5cdFx0dGhpcy5fdXBsb2FkZXIuJGVsLmFwcGVuZCh0aGlzLiRlbCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFNldCBhbGwgb2YgaW5wdXQgZWxlbWVudHMgaHRtbCBzdHJpbmdzLlxuXHQgKiBAcGFyYW0ge29iamVjdH0gW3RlbXBsYXRlXSBUaGUgdGVtcGxhdGUgaXMgc2V0IGZvcm0gY3VzdG9tZXIuXG5cdCAqIEByZXR1cm4ge29iamVjdH0gVGhlIGh0bWwgc3RyaW5nIHNldCBmb3IgaW5wdXRWaWV3XG5cdCAqL1xuXHRfc2V0SFRNTDogZnVuY3Rpb24odGVtcGxhdGUpIHtcblx0XHRpZiAoIXRlbXBsYXRlKSB7XG5cdFx0XHR0ZW1wbGF0ZSA9IHt9O1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRpbnB1dDogdGVtcGxhdGUuaW5wdXQgfHwgY29uc3RzLkhUTUwuaW5wdXQsXG5cdFx0XHRzdWJtaXQ6IHRlbXBsYXRlLnN1Ym1pdCB8fCBjb25zdHMuSFRNTC5zdWJtaXQsXG5cdFx0XHRmb3JtOiB0ZW1wbGF0ZS5mb3JtIHx8IGNvbnN0cy5IVE1MLmZvcm1cblx0XHR9XG5cdH0sXG5cdC8qKlxuXHQgKiBHZXQgaHRtbCBzdHJpbmcgZnJvbSB0ZW1wbGF0ZVxuXHQgKiBAcmV0dXJuIHtvYmplY3R9XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfZ2V0SHRtbDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2h0bWwuZm9ybTtcblx0fSxcblxuXHQvKipcblx0ICogTWFrZXMgYW5kIHJldHVybnMganF1ZXJ5IGVsZW1lbnRcblx0ICogQHJldHVybiB7b2JqZWN0fSBUaGUganF1ZXJ5IG9iamVjdCB3cmFwcGluZyBvcmlnaW5hbCBpbnB1dCBlbGVtZW50XG5cdCAqL1xuXHRfZ2V0SW5wdXRFbGVtZW50OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgbWFwID0ge1xuXHRcdFx0bXVsdGlwbGU6IHRoaXMuX2lzTXVsdGlwbGUgPyAnbXVsdGlwbGUnIDogJycsXG5cdFx0XHRmaWxlRmllbGQ6IHRoaXMuX3VwbG9hZGVyLmZpbGVGaWVsZCxcblx0XHRcdHdlYmtpdGRpcmVjdG9yeTogdGhpcy5fdXNlRm9sZGVyID8gJ3dlYmtpdGRpcmVjdG9yeScgOiAnJ1xuXHRcdH07XG5cblx0XHRyZXR1cm4gJCh1dGlscy50ZW1wbGF0ZShtYXAsIHRoaXMuX2h0bWwuaW5wdXQpKTtcblx0fSxcblxuXHQvKipcblx0ICogTWFrZXMgYW5kIHJldHVybnMganF1ZXJ5IGVsZW1lbnRcblx0ICogQHJldHVybiB7b2JqZWN0fSBUaGUganF1ZXJ5IG9iamVjdCB3cmFwcGluZyBzdW1iaXQgYnV0dG9uIGVsZW1lbnRcblx0ICovXG5cdF9nZXRTdWJtaXRFbGVtZW50OiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5faXNCYXRjaFRyYW5zZmVyKSB7XG5cdFx0XHRyZXR1cm4gJCh0aGlzLl9odG1sLnN1Ym1pdCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBmYWxzZTtcdFxuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogQ2FsbCBtZXRob2RzIHRob3NlIG1ha2UgZWFjaCBoaWRkZW4gZWxlbWVudC5cblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9yZW5kZXJIaWRkZW5FbGVtZW50czogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5fbWFrZVRhcmdldEZyYW1lKCk7XG5cdFx0dGhpcy5fbWFrZVJlc3VsdFR5cGVFbGVtZW50KCk7XG5cdFx0dGhpcy5fbWFrZUNhbGxiYWNrRWxlbWVudCgpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBZGQgZXZlbnRcblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMuX2lzQmF0Y2hUcmFuc2Zlcikge1xuXHRcdFx0dGhpcy4kZWwub24oJ3N1Ym1pdCcsIHR1aS51dGlsLmJpbmQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHRoaXMuX3VwbG9hZGVyLnN1Ym1pdCgpO1xuXHRcdFx0fSwgdGhpcykpO1xuXHRcdH1cblx0XHR0aGlzLl9hZGRJbnB1dEV2ZW50KCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEFkZCBpbnB1dCBlbGVtZW50IGNoYW5nZSBldmVudCBieSBzZW5kaW5nIHR5cGVcblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9hZGRJbnB1dEV2ZW50OiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5faXNCYXRjaFRyYW5zZmVyKSB7XG5cdFx0XHR0aGlzLiRpbnB1dC5vbignY2hhbmdlJywgdHVpLnV0aWwuYmluZCh0aGlzLm9uU2F2ZSwgdGhpcykpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLiRpbnB1dC5vbignY2hhbmdlJywgdHVpLnV0aWwuYmluZCh0aGlzLm9uQ2hhbmdlLCB0aGlzKSk7XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBFdmVudC1IYW5kbGUgZm9yIGlucHV0IGVsZW1lbnQgY2hhbmdlXG5cdCAqL1xuXHRvbkNoYW5nZTogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCF0aGlzLiRpbnB1dFswXS52YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuOyBcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZpcmUoJ2NoYW5nZScsIHtcblx0XHRcdHRhcmdldDogdGhpc1xuXHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBFdmVudC1IYW5kbGUgZm9yIHNhdmUgaW5wdXQgZWxlbWVudFxuXHQgKi9cblx0b25TYXZlOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIXRoaXMuJGlucHV0WzBdLnZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNhdmVDYWxsYmFjayA9ICF1dGlscy5pc1N1cHBvcnRGb3JtRGF0YSgpID8gdHVpLnV0aWwuYmluZCh0aGlzLl9yZXNldElucHV0RWxlbWVudCwgdGhpcykgOiBudWxsO1xuXHRcdHRoaXMuZmlyZSgnc2F2ZScsIHtcblx0XHRcdGVsZW1lbnQ6IHRoaXMuJGlucHV0WzBdLFxuXHRcdFx0Y2FsbGJhY2s6IHNhdmVDYWxsYmFja1xuXHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZXNldCBJbnB1dCBlbGVtZW50IHRvIHNhdmUgd2hvbGUgaW5wdXQ9ZmlsZSBlbGVtZW50LlxuXHQgKi9cblx0X3Jlc2V0SW5wdXRFbGVtZW50OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRpbnB1dC5vZmYoKTtcblx0XHR0aGlzLl9jbG9uZSh0aGlzLiRpbnB1dFswXSk7XG5cdFx0dGhpcy4kaW5wdXQgPSB0aGlzLl9nZXRJbnB1dEVsZW1lbnQoKTtcblx0XHRpZiAodGhpcy4kc3VibWl0KSB7XG5cdFx0XHR0aGlzLiRzdWJtaXQuYmVmb3JlKHRoaXMuJGlucHV0KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy4kZWwuYXBwZW5kKHRoaXMuJGlucHV0KTtcblx0XHR9XG5cdFx0dGhpcy5fYWRkSW5wdXRFdmVudCgpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBNYWtlcyBlbGVtZW50IHRvIGJlIHRhcmdldCBvZiBzdWJtaXQgZm9ybSBlbGVtZW50LlxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X21ha2VUYXJnZXRGcmFtZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5fJHRhcmdldCA9ICQoJzxpZnJhbWUgbmFtZT1cIicgKyB0aGlzLl90YXJnZXQgKyAnXCI+PC9pZnJhbWU+Jyk7XG5cdFx0dGhpcy5fJHRhcmdldC5jc3Moe1xuXHRcdFx0dmlzaWJpbGl0eTogJ2hpZGRlbicsXG5cdFx0XHRwb3NpdGlvbjogJ2Fic29sdXRlJ1xuXHRcdH0pO1xuXHRcdHRoaXMuX3VwbG9hZGVyLiRlbC5hcHBlbmQodGhpcy5fJHRhcmdldCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIE1ha2UgZWxlbWVudCB0byBiZSBjYWxsYmFjayBmdW5jdGlvbiBuYW1lXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfbWFrZUNhbGxiYWNrRWxlbWVudDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5fJGNhbGxiYWNrID0gdGhpcy5fbWFrZUhpZGRlbkVsZW1lbnQoe1xuXHRcdFx0J25hbWUnOiBjb25zdHMuQ09ORi5KU09OUENBTExCQUNLX05BTUUsXG5cdFx0XHQndmFsdWUnOiB0aGlzLl91cGxvYWRlci5jYWxsYmFja05hbWVcblx0XHR9KTtcblx0XHR0aGlzLiRlbC5hcHBlbmQodGhpcy5fJGNhbGxiYWNrKTtcblx0fSxcblxuXHQvKipcblx0ICogTWFrZXMgZWxlbWVudCB0byBrbm93IHdoaWNoIHR5cGUgcmVxdWVzdFxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X21ha2VSZXN1bHRUeXBlRWxlbWVudDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5fJHJlc1R5cGUgPSB0aGlzLl9tYWtlSGlkZGVuRWxlbWVudCh7XG5cdFx0XHQnbmFtZScgOiB0aGlzLl91cGxvYWRlci5yZXN1bHRUeXBlRWxlbWVudE5hbWUgfHwgY29uc3RzLkNPTkYuUkVTUE9OU0VfVFlQRSxcblx0XHRcdCd2YWx1ZSc6IHRoaXMuX3VwbG9hZGVyLnR5cGVcblx0XHR9KTtcblx0XHR0aGlzLiRlbC5hcHBlbmQodGhpcy5fJHJlc1R5cGUpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBNYWtlIGVsZW1lbnQgdGhhdCBoYXMgcmVkaXJlY3QgcGFnZSBpbmZvcm1hdGlvbiB1c2VkIGJ5IFNlcnZlciBzaWRlLlxuXHQgKiBAcGFyYW0ge29iamVjdH0gaGVscGVyIFJlZGlyZWN0aW9uIGluZm9ybWF0aW9uIGZvciBjbGVhciB4LWRvbWFpbiBwcm9ibGVtLlxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X21ha2VCcmlkZ2VJbmZvRWxlbWVudDogZnVuY3Rpb24oaGVscGVyKSB7XG5cdFx0dGhpcy5fJGhlbHBlciA9IHRoaXMuX21ha2VIaWRkZW5FbGVtZW50KHtcblx0XHRcdCduYW1lJyA6IGhlbHBlci5uYW1lIHx8IGNvbnN0cy5DT05GLlJFRElSRUNUX1VSTCxcblx0XHRcdCd2YWx1ZSc6IGhlbHBlci51cmxcblx0XHR9KTtcblx0XHR0aGlzLiRlbC5hcHBlbmQodGhpcy5fJGhlbHBlcik7XG5cdH0sXG5cblx0LyoqXG5cdCAqIE1ha2UgaGlkZGVuIGlucHV0IGVsZW1lbnQgd2l0aCBvcHRpb25zXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFRoZSBvcGl0b25zIHRvIGJlIGF0dHJpYnV0ZSBvZiBpbnB1dFxuXHQgKiBAcmV0dXJucyB7KnxqUXVlcnl9XG5cdCAqIEBwcml2YXRlXG4gICAgICovXHRcblx0X21ha2VIaWRkZW5FbGVtZW50OiBmdW5jdGlvbihvcHRpb25zKSB7XG5cdFx0dHVpLnV0aWwuZXh0ZW5kKG9wdGlvbnMsIHtcblx0XHRcdHR5cGU6ICdoaWRkZW4nXG5cdFx0fSk7XG5cdFx0cmV0dXJuICQoJzxpbnB1dCAvPicpLmF0dHIob3B0aW9ucyk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEFzayB1cGxvYWRlciB0byBzYXZlIGlucHV0IGVsZW1lbnQgdG8gcG9vbFxuXHQgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBpbnB1dCBBIGlucHV0IGVsZW1lbnRbdHlwZT1maWxlXSBmb3Igc3RvcmUgcG9vbFxuXHQgKi9cblx0X2Nsb25lOiBmdW5jdGlvbihpbnB1dCkge1xuXHRcdGlucHV0LmZpbGVfbmFtZSA9IGlucHV0LnZhbHVlO1xuXHRcdHRoaXMuX3VwbG9hZGVyLnN0b3JlKGlucHV0KTtcblx0fVxuXG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKElucHV0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbnB1dDtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBJdGVtVmlldyBtYWtlIGVsZW1lbnQgdG8gZGlzcGxheSBhZGRlZCBmaWxlIGluZm9ybWF0aW9uLiBJdCBoYXMgYXR0YWNoZWQgZmlsZSBJRCB0byByZXF1ZXN0IGZvciByZW1vdmUuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG52YXIgY29uc3RzID0gcmVxdWlyZSgnLi4vY29uc3RzJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG4vKipcbiAqIENsYXNzIG9mIGl0ZW0gdGhhdCBpcyBtZW1iZXIgb2YgZmlsZSBsaXN0LlxuICogQGNsYXNzIFZpZXcuSXRlbVxuICovXG52YXIgSXRlbSA9IHR1aS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgVmlldy5JdGVtLnByb3RvdHlwZSAqKi8ge1xuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgaXRlbVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLm5hbWUgRmlsZSBuYW1lXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnR5cGUgRmlsZSB0eXBlXG4gICAgICogIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLnJvb3QgTGlzdCBvYmplY3RcbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuaGlkZGVuRnJhbWUgVGhlIGlmcmFtZSBuYW1lIHdpbGwgYmUgdGFyZ2V0IG9mIGZvcm0gc3VibWl0LlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy51cmwgVGhlIHVybCBmb3IgZm9ybSBhY3Rpb24gdG8gc3VibWV0LlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuaWRdIFVuaXF1ZSBrZXksIHdoYXQgaWYgdGhlIGtleSBpcyBub3QgZXhpc3QgaWQgd2lsbCBiZSB0aGUgZmlsZSBuYW1lLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuaGlkZGVuRmllbGROYW1lXSBUaGUgbmFtZSBvZiBoaWRkZW4gZmlsZWQuIFRoZSBoaWRkZW4gZmllbGQgaXMgZm9yIGNvbm5lY3RpbmcgeC1kb21pYW4uXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5kZWxldGVCdXR0b25DbGFzc05hbWU9J3VwbG9hZGVyX2J0bl9kZWxldGUnXSBUaGUgY2xhc3MgbmFtZSBpcyBmb3IgZGVsZXRlIGJ1dHRvbi5cbiAgICAgKiAgQHBhcmFtIHsoc3RyaW5nfG51bWJlcil9IFtvcHRpb25zLnNpemVdIEZpbGUgc2l6ZSAoYnV0IGllIGxvdyBicm93c2VyLCB4LWRvbWFpbilcbiAgICAgKiAgQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zLmhlbHBlcl0gVGhlIGhlbHBlciBwYWdlIGluZm8uXG4gICAgICovXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuXG4gICAgICAgIHRoaXMuX3NldFJvb3Qob3B0aW9ucyk7XG4gICAgICAgIHRoaXMuX3NldEl0ZW1JbmZvKG9wdGlvbnMpO1xuICAgICAgICB0aGlzLl9zZXRDb25uZWN0SW5mbyhvcHRpb25zKTtcblxuICAgICAgICB0aGlzLnJlbmRlcihvcHRpb25zLnRlbXBsYXRlIHx8IGNvbnN0cy5IVE1MLml0ZW0pO1xuXG4gICAgICAgIGlmIChvcHRpb25zLmhlbHBlcikge1xuICAgICAgICAgICAgdGhpcy5fbWFrZUJyaWRnZUluZm9FbGVtZW50KG9wdGlvbnMuaGVscGVyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgcm9vdChMaXN0IG9iamVjdCkgaW5mb3JtYXRpb24uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgU2FtZSB3aXRoIGluaXQgb3B0aW9ucyBwYXJhbWV0ZXIuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0Um9vdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB0aGlzLl9yb290ID0gb3B0aW9ucy5yb290O1xuICAgICAgICB0aGlzLl8kcm9vdCA9IG9wdGlvbnMucm9vdC4kZWw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBmaWxlIGluZm9ybWF0aW9uLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFNhbWUgd2l0aCBpbml0IG9wdGlvbnMgcGFyYW1ldGVyLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldEl0ZW1JbmZvOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG9wdGlvbnMubmFtZTtcbiAgICAgICAgdGhpcy5fdHlwZSA9IG9wdGlvbnMudHlwZSB8fCB0aGlzLl9leHRyYWN0RXh0ZW5zaW9uKCk7XG4gICAgICAgIHRoaXMuX2lkID0gb3B0aW9ucy5pZCB8fCBvcHRpb25zLm5hbWU7XG4gICAgICAgIHRoaXMuc2l6ZSA9IG9wdGlvbnMuc2l6ZSB8fCAnJztcbiAgICAgICAgdGhpcy5fYnRuQ2xhc3MgPSBvcHRpb25zLmRlbGV0ZUJ1dHRvbkNsYXNzTmFtZSB8fCAndXBsb2FkZXJfYnRuX2RlbGV0ZSc7XG4gICAgICAgIHRoaXMuX3VuaXQgPSBvcHRpb25zLnVuaXQgfHwgJ0tCJztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGNvbm5lY3QgZWxlbWVudCBpbmZvcm1hdGlvbi5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBTYW1lIHdpdGggaW5pdCBvcHRpb25zIHBhcmFtZXRlci5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRDb25uZWN0SW5mbzogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB0aGlzLl91cmwgPSBvcHRpb25zLnVybDtcbiAgICAgICAgdGhpcy5faGlkZGVuSW5wdXROYW1lID0gb3B0aW9ucy5oaWRkZW5GaWVsZE5hbWUgfHwgJ2ZpbGVuYW1lJztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVuZGVyIG1ha2luZyBmb3JtIHBhZGRpbmcgd2l0aCBkZWxldGFibGUgaXRlbVxuICAgICAqIEBwYXJhbSB0ZW1wbGF0ZVxuICAgICAqL1xuICAgIHJlbmRlcjogZnVuY3Rpb24odGVtcGxhdGUpIHtcbiAgICAgICAgdmFyIGh0bWwgPSB0aGlzLl9nZXRIdG1sKHRlbXBsYXRlKTtcbiAgICAgICAgdGhpcy5fJGVsID0gJChodG1sKTtcbiAgICAgICAgdGhpcy5fJHJvb3QuYXBwZW5kKHRoaXMuXyRlbCk7XG4gICAgICAgIHRoaXMuX2FkZEV2ZW50KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV4dHJhY3QgZmlsZSBleHRlbnNpb24gYnkgbmFtZVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZXh0cmFjdEV4dGVuc2lvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5hbWUuc3BsaXQoJy4nKS5wb3AoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSBlbGVtZW50IHRoYXQgaGFzIHJlZGlyZWN0IHBhZ2UgaW5mb3JtYXRpb24gdXNlZCBieSBTZXJ2ZXIgc2lkZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gaGVscGVyIFJlZGlyZWN0aW9uIGhlbHBlciBwYWdlIGluZm9ybWF0aW9uIGZvciBjbGVhciB4LWRvbWFpbiBwcm9ibGVtLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX21ha2VCcmlkZ2VJbmZvRWxlbWVudDogZnVuY3Rpb24oaGVscGVyKSB7XG4gICAgICAgIHRoaXMuJGhlbHBlciA9ICQoJzxpbnB1dCAvPicpO1xuICAgICAgICB0aGlzLiRoZWxwZXIuYXR0cih7XG4gICAgICAgICAgICAnbmFtZScgOiBoZWxwZXIubmFtZSxcbiAgICAgICAgICAgICd2YWx1ZSc6IGhlbHBlci51cmxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBpdGVtIGVsZW1lbiBIVE1MXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGh0bWwgSFRNTCB0ZW1wbGF0ZVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0SHRtbDogZnVuY3Rpb24oaHRtbCkge1xuICAgICAgICB2YXIgbWFwID0ge1xuICAgICAgICAgICAgZmlsZXR5cGU6IHRoaXMuX3R5cGUsXG4gICAgICAgICAgICBmaWxlbmFtZTogdGhpcy5uYW1lLFxuICAgICAgICAgICAgZmlsZXNpemU6IHRoaXMuc2l6ZSA/IHV0aWxzLmdldEZpbGVTaXplV2l0aFVuaXQodGhpcy5zaXplKSA6ICcnLFxuICAgICAgICAgICAgZGVsZXRlQnV0dG9uQ2xhc3NOYW1lOiB0aGlzLl9idG5DbGFzc1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB1dGlscy50ZW1wbGF0ZShtYXAsIGh0bWwpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEZXN0b3J5IGl0ZW1cbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fcmVtb3ZlRXZlbnQoKTtcbiAgICAgICAgdGhpcy5fJGVsLnJlbW92ZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnQgaGFuZGxlciBvbiBkZWxldGUgYnV0dG9uLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZEV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHF1ZXJ5ID0gJy4nICsgdGhpcy5fYnRuQ2xhc3MsXG4gICAgICAgICAgICAkZGVsQnRuID0gdGhpcy5fJGVsLmZpbmQocXVlcnkpO1xuICAgICAgICAkZGVsQnRuLm9uKCdjbGljaycsIHR1aS51dGlsLmJpbmQodGhpcy5fb25DbGlja0V2ZW50LCB0aGlzKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBldmVudCBoYW5kbGVyIGZyb20gZGVsZXRlIGJ1dHRvbi5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW1vdmVFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBxdWVyeSA9ICcuJyArIHRoaXMuX2J0bkNsYXNzLFxuICAgICAgICAgICAgJGRlbEJ0biA9IHRoaXMuXyRlbC5maW5kKHF1ZXJ5KTtcbiAgICAgICAgJGRlbEJ0bi5vZmYoJ2NsaWNrJyk7XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICogRXZlbnQtaGFuZGxlIGZvciBkZWxldGUgYnV0dG9uIGNsaWNrZWQuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25DbGlja0V2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5maXJlKCdyZW1vdmUnLCB7XG4gICAgICAgICAgICBmaWxlbmFtZSA6IHRoaXMubmFtZSxcbiAgICAgICAgICAgIGlkIDogdGhpcy5faWQsXG4gICAgICAgICAgICB0eXBlOiAncmVtb3ZlJ1xuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxudHVpLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKEl0ZW0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEl0ZW07XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmlsZUxpc3RWaWV3IG1hbmFnZSBhbmQgZGlzcGxheSBmaWxlcyBzdGF0ZShsaWtlIHNpemUsIGNvdW50KSBhbmQgbGlzdC5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG52YXIgSXRlbSA9IHJlcXVpcmUoJy4vaXRlbScpO1xuXG4vKipcbiAqIExpc3QgaGFzIGl0ZW1zLiBJdCBjYW4gYWRkIGFuZCByZW1vdmUgaXRlbSwgYW5kIGdldCB0b3RhbCB1c2FnZS5cbiAqIEBjbGFzcyBWaWV3Lkxpc3RcbiAqL1xudmFyIExpc3QgPSB0dWkudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIFZpZXcuTGlzdC5wcm90b3R5cGUgKi97XG4gICAgaW5pdCA6IGZ1bmN0aW9uKG9wdGlvbnMsIHVwbG9hZGVyKSB7XG4gICAgICAgIHZhciBsaXN0SW5mbyA9IG9wdGlvbnMubGlzdEluZm87XG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTtcbiAgICAgICAgdGhpcy4kZWwgPSBsaXN0SW5mby5saXN0O1xuICAgICAgICB0aGlzLiRjb3VudGVyID0gbGlzdEluZm8uY291bnQ7XG4gICAgICAgIHRoaXMuJHNpemUgPSBsaXN0SW5mby5zaXplO1xuICAgICAgICB0aGlzLl91cGxvYWRlciA9IHVwbG9hZGVyO1xuXG4gICAgICAgIHR1aS51dGlsLmV4dGVuZCh0aGlzLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW0gbGlzdFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBpbmZvIEEgaW5mb3JtYXRpb24gdG8gdXBkYXRlIGxpc3QuXG4gICAgICogIEBwYXJhbSB7YXJyYXl9IGluZm8uaXRlbXMgVGhlIGxpc3Qgb2YgZmlsZSBpbmZvcm1hdGlvbi5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IFtpbmZvLmFjdGlvbl0gVGhlIGFjdGlvbiB0byBkby5cbiAgICAgKi9cbiAgICB1cGRhdGU6IGZ1bmN0aW9uKGluZm8pIHtcbiAgICAgICAgaWYgKGluZm8uYWN0aW9uID09PSAncmVtb3ZlJykge1xuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlRmlsZUl0ZW0oaW5mby5uYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2FkZEZpbGVJdGVtcyhpbmZvLml0ZW1zKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgaXRlbXMgdG90YWwgY291bnQsIHRvdGFsIHNpemUgaW5mb3JtYXRpb24uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGluZm8gQSBpbmZvcm1hdGlvbiB0byB1cGRhdGUgbGlzdC5cbiAgICAgKiAgQHBhcmFtIHthcnJheX0gaW5mby5pdGVtcyBUaGUgbGlzdCBvZiBmaWxlIGluZm9ybWF0aW9uLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gaW5mby5zaXplIFRoZSB0b3RhbCBzaXplLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gaW5mby5jb3VudCBUaGUgY291bnQgb2YgZmlsZXMuXG4gICAgICovXG4gICAgdXBkYXRlVG90YWxJbmZvOiBmdW5jdGlvbihpbmZvKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVRvdGFsQ291bnQoaW5mby5jb3VudCk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVRvdGFsVXNhZ2UoaW5mby5zaXplKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW1zIHRvdGFsIGNvdW50IGFuZCByZWZyZXNoIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0geyhudW1iZXJ8c3RyaW5nKX0gW2NvdW50XSBUb3RhbCBmaWxlIGNvdW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfdXBkYXRlVG90YWxDb3VudDogZnVuY3Rpb24oY291bnQpIHtcblxuICAgICAgICBpZiAoIXR1aS51dGlsLmlzRXhpc3R5KGNvdW50KSkge1xuICAgICAgICAgICAgY291bnQgPSB0aGlzLml0ZW1zLmxlbmd0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuJGNvdW50ZXIuaHRtbChjb3VudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBpdGVtcyB0b3RhbCBzaXplIGFuZCByZWZyZXNoIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0geyhudW1iZXJ8c3RyaW5nKX0gc2l6ZSBUb3RhbCBmaWxlcyBzaXplc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwZGF0ZVRvdGFsVXNhZ2U6IGZ1bmN0aW9uKHNpemUpIHtcblxuICAgICAgICBpZiAoIXR1aS51dGlsLmlzRXhpc3R5KHNpemUpKSB7XG4gICAgICAgICAgICBzaXplID0gdGhpcy5fZ2V0U3VtQWxsSXRlbVVzYWdlKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR1aS51dGlsLmlzTnVtYmVyKHNpemUpICYmICFpc05hTihzaXplKSkge1xuICAgICAgICAgICAgc2l6ZSA9IHV0aWxzLmdldEZpbGVTaXplV2l0aFVuaXQoc2l6ZSk7XG4gICAgICAgICAgICB0aGlzLiRzaXplLmh0bWwoc2l6ZSk7XG4gICAgICAgICAgICB0aGlzLiRzaXplLnNob3coKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuJHNpemUuaGlkZSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN1bSBzaXplcyBvZiBhbGwgaXRlbXMuXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0U3VtQWxsSXRlbVVzYWdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGl0ZW1zID0gdGhpcy5pdGVtcyxcbiAgICAgICAgICAgIHRvdGFsVXNhZ2UgPSAwO1xuXG4gICAgICAgIHR1aS51dGlsLmZvckVhY2goaXRlbXMsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIHRvdGFsVXNhZ2UgKz0gcGFyc2VGbG9hdChpdGVtLnNpemUpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdG90YWxVc2FnZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGZpbGUgaXRlbXNcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdGFyZ2V0IFRhcmdldCBpdGVtIGluZm9ybWF0aW9uLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZEZpbGVJdGVtczogZnVuY3Rpb24odGFyZ2V0KSB7XG4gICAgICAgIGlmICghdHVpLnV0aWwuaXNBcnJheSh0YXJnZXQpKSB7XG4gICAgICAgICAgICB0YXJnZXQgPSBbdGFyZ2V0XTtcbiAgICAgICAgfVxuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKHRhcmdldCwgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKHRoaXMuX2NyZWF0ZUl0ZW0oZGF0YSkpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICB0aGlzLmZpcmUoJ2ZpbGVBZGRlZCcsIHtcblx0XHRcdHRhcmdldDogdGFyZ2V0XG5cdFx0fSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBmaWxlIGl0ZW1cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgZmlsZSBuYW1lIHRvIHJlbW92ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbW92ZUZpbGVJdGVtOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIG5hbWUgPSBkZWNvZGVVUklDb21wb25lbnQobmFtZSk7XG4gICAgICAgIHRoaXMuaXRlbXMgPSB0dWkudXRpbC5maWx0ZXIodGhpcy5pdGVtcywgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgdmFyIGlzTWF0Y2ggPSBuYW1lID09PSBkZWNvZGVVUklDb21wb25lbnQoaXRlbS5uYW1lKTtcbiAgICAgICAgICAgIGlmIChpc01hdGNoKSB7XG4gICAgICAgICAgICAgICAgaXRlbS5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fdXBsb2FkZXIucmVtb3ZlKG5hbWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgnZmlsZVJlbW92ZWQnLCB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IG5hbWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAhaXNNYXRjaDtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBpdGVtIEJ5IERhdGFcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YVxuICAgICAqIEByZXR1cm5zIHtJdGVtfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NyZWF0ZUl0ZW06IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIGl0ZW0gPSBuZXcgSXRlbSh7XG4gICAgICAgICAgICByb290OiB0aGlzLFxuICAgICAgICAgICAgbmFtZTogZGF0YS5uYW1lLFxuICAgICAgICAgICAgc2l6ZTogZGF0YS5zaXplLFxuICAgICAgICAgICAgZGVsZXRlQnV0dG9uQ2xhc3NOYW1lOiB0aGlzLmRlbGV0ZUJ1dHRvbkNsYXNzTmFtZSxcbiAgICAgICAgICAgIHVybDogdGhpcy51cmwsXG4gICAgICAgICAgICBoaWRkZW5GcmFtZTogdGhpcy5mb3JtVGFyZ2V0LFxuICAgICAgICAgICAgaGlkZGVuRmllbGROYW1lOiB0aGlzLmhpZGRlbkZpZWxkTmFtZSxcbiAgICAgICAgICAgIHRlbXBsYXRlOiB0aGlzLnRlbXBsYXRlICYmIHRoaXMudGVtcGxhdGUuaXRlbVxuICAgICAgICB9KTtcbiAgICAgICAgaXRlbS5vbigncmVtb3ZlJywgdGhpcy5fcmVtb3ZlRmlsZSwgdGhpcyk7XG4gICAgICAgIHJldHVybiBpdGVtO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBSZW1vdmUgRmlsZVxuICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlRmlsZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZScsIGRhdGEpO1xuICAgIH1cbn0pO1xuXG50dWkudXRpbC5DdXN0b21FdmVudHMubWl4aW4oTGlzdCk7XG5cbm1vZHVsZS5leHBvcnRzID0gTGlzdDtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIGlzIG1hbmFnZXIgb2YgaW5wdXQgZWxlbWVudHMgdGhhdCBhY3QgbGlrZSBmaWxlIHBvb2wuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG4vKipcbiAqIFRoZSBwb29sIGZvciBzYXZlIGZpbGVzLlxuICogSXQncyBvbmx5IGZvciBpbnB1dFtmaWxlXSBlbGVtZW50IHNhdmUgYXQgYnJvd3NlciB0aGF0IGRvZXMgbm90IHN1cHBvcnQgZmlsZSBhcGkuXG4gKiBAY2xhc3MgVmlldy5Qb29sXG4gKi9cbnZhciBQb29sID0gdHVpLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBWaWV3LlBvb2wucHJvdG90eXBlICove1xuICAgIC8qKlxuICAgICAqIGluaXRpYWxpemVcbiAgICAgKi9cbiAgICBpbml0OiBmdW5jdGlvbihwbGFuZXQpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFN1Ym1pdHRlciBmb3IgZmlsZSBlbGVtZW50IHRvIHNlcnZlclxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnBsYW5ldCA9IHBsYW5ldDtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZpbGUgZGF0YSBzdHJ1Y3R1cmUgb2JqZWN0KGtleT1uYW1lIDogdmFsdWU9aXVwdXQgZWxtZWVudCk7XG4gICAgICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZpbGVzID0ge307XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBY3RzIHBvb2wgdG8gc2F2ZSBpbnB1dCBlbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtEb2N1bWVudEZyYWdtZW50fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5mcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTYXZlIGEgaW5wdXQgZWxlbWVudFt0eXBlPWZpbGVdLCBhcyB2YWx1ZSBvZiBmaWxlIG5hbWUuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGZpbGUgQSBpbnB1dCBlbGVtZW50IHRoYXQgaGF2ZSB0byBiZSBzYXZlZFxuICAgICAqL1xuICAgIHN0b3JlOiBmdW5jdGlvbihmaWxlKSB7XG4gICAgICAgIHRoaXMuZmlsZXNbZmlsZS5maWxlX25hbWVdID0gZmlsZTtcbiAgICAgICAgdGhpcy5mcmFnLmFwcGVuZENoaWxkKGZpbGUpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBpbnB1dCBlbGVtZW50W3R5cGU9ZmlsZV0gZnJvbSBwb29sLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIEEgZmlsZSBuYW1lIHRoYXQgaGF2ZSB0byBiZSByZW1vdmVkLlxuICAgICAqL1xuICAgIHJlbW92ZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICB0aGlzLmZyYWcucmVtb3ZlQ2hpbGQodGhpcy5maWxlc1tuYW1lXSk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmZpbGVzW25hbWVdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFbXB0eSBwb29sXG4gICAgICovXG4gICAgZW1wdHk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKHRoaXMuZmlsZXMsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKGRhdGEuZmlsZV9uYW1lKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFBsYW50IGZpbGVzIG9uIHBvb2wgdG8gZm9ybSBpbnB1dFxuICAgICAqL1xuICAgIHBsYW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHBsYW5ldCA9IHRoaXMucGxhbmV0O1xuICAgICAgICB0dWkudXRpbC5mb3JFYWNoKHRoaXMuZmlsZXMsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHBsYW5ldC5hcHBlbmRDaGlsZChkYXRhKTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmZpbGVzW2RhdGEuZmlsZV9uYW1lXTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUG9vbDtcbiJdfQ==
