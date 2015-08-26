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
			ne.util.forEach(files, function(e) {
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
            result.items = ne.util.toArray(response.filelist);
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
            files = files || fileEl.files;
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
     * Makes form data to send POST(FormDate supported case)
     * @returns {*}
     * @private
     */
    _makeFormData: function() {
        var uploader = this._uploader,
		field = uploader.fileField,
		input = uploader.inputView,
		form = new window.FormData(this._extractForm(input));

        ne.util.forEach(this._result, function(item) {
            form.append(field, item);
        });
        return form;
    },

	/**
	 * Extracts Form from inputView
	 * @param {object} input The input view for extracting 
	 */
	_extractForm: function(input) {
	var form = input.$el.clone();
		// append to pool
		return form[0];
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
		if (this._connector.submit) {
			if (utils.isSupportFormData()) {
				this._connector.submit(ne.util.bind(function() {
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
			this.$el.on('submit', ne.util.bind(function() {
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
			this.$input.on('change', ne.util.bind(this.onSave, this));
		} else {
			this.$input.on('change', ne.util.bind(this.onChange, this));
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
		if (!this.$el[0].value) {
            return;
        }
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
		this._uploader.fire('fileAdded', {
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
        this.items = ne.util.filter(this.items, function(item) {
            var isMatch = name === decodeURIComponent(item.name);
            if (isMatch) {
                item.destroy();
                this._uploader.remove(name);
					this._uploader.fire('fileRemoved', {
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25uZWN0b3IvYWpheC5qcyIsInNyYy9qcy9jb25uZWN0b3IvY29ubmVjdG9yLmpzIiwic3JjL2pzL2Nvbm5lY3Rvci9qc29ucC5qcyIsInNyYy9qcy9jb25uZWN0b3IvbG9jYWwuanMiLCJzcmMvanMvc3RhdGljcy5qcyIsInNyYy9qcy91cGxvYWRlci5qcyIsInNyYy9qcy91dGlscy5qcyIsInNyYy9qcy92aWV3L2RyYWcuanMiLCJzcmMvanMvdmlldy9pbnB1dC5qcyIsInNyYy9qcy92aWV3L2l0ZW0uanMiLCJzcmMvanMvdmlldy9saXN0LmpzIiwic3JjL2pzL3ZpZXcvcG9vbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJuZS51dGlsLmRlZmluZU5hbWVzcGFjZSgnbmUuY29tcG9uZW50LlVwbG9hZGVyJywgcmVxdWlyZSgnLi9zcmMvanMvdXBsb2FkZXIuanMnKSk7XG5cbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIENvbm5lY3RvciBtYWtlIGNvbm5lY3Rpb24gYmV0d2VlbiBGaWxlTWFuYWdlciBhbmQgZmlsZSBzZXJ2ZXIgYXBpIGF0IG1vZGVybiBicm93c2VyLjxicj5cbiAqICAgICBUaGlzIENvbm5lY3RvciB1c2UgYWpheC5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbi8qKlxuICogVGhlIG1vZHVsZXMgd2lsbCBiZSBtaXhlZCBpbiBjb25uZWN0b3IgYnkgdHlwZS5cbiAqL1xudmFyIEFqYXggPSB7LyoqIEBsZW5kcyBuZS5jb21wb25lbnQuVXBsb2FkZXIuQWpheCAqL1xuICAgIHR5cGU6ICdQT1NUJyxcbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGFqYXggYnkgY29uZmlnIHRvIGFkZCBmaWxlcy5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gY29uZmlnIFRoZSBjb25maWd1cmF0aW9uIGZvciBhamF4IHJlcXVlc3RcbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy51cmwgUmVxdWVzdCB1cmwodXBsb2FkIHVybCBvciByZW1vdmUgdXJsKVxuICAgICAqICBAcGFyYW0ge2Z1bmN0aW9ufSBjb25maWcuc3VjY2VzcyBDYWxsYmFjayBmdW5jdGlvbiB3aGVuIHJlcXVlc3Qgc3VjZWVzcy5cbiAgICAgKiAgQHBhcmFtIHtmdW5jdGlvbn0gY29uZmlnLmVycm9yIENhbGxiYWNrIGZ1bmN0aW9uIHdoZW4gcmVxdWVzdCBmYWlsZC5cbiAgICAgKi9cbiAgICBhZGRSZXF1ZXN0OiBmdW5jdGlvbihjb25maWcsIGZpbGVzKSB7XG4gICAgICAgIHZhciB1cGxvYWRlciA9IHRoaXMuX3VwbG9hZGVyLFxuICAgICAgICAgICAgJGZvcm0gPSB1cGxvYWRlci5pbnB1dFZpZXcuJGVsLFxuICAgICAgICAgICAgY2FsbGJhY2sgPSBuZS51dGlsLmJpbmQodGhpcy5zdWNjZXNzUGFkZGluZywgdGhpcywgY29uZmlnLnN1Y2Nlc3MpO1xuICAgIFxuXHRcdGlmIChmaWxlcykge1xuXHRcdFx0dGhpcy5mb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuXHRcdFx0bmUudXRpbC5mb3JFYWNoKGZpbGVzLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdHRoaXMuZm9ybURhdGEuYXBwZW5kKHVwbG9hZGVyLmZpbGVGaWVsZCwgZSk7XG5cdFx0XHR9LCB0aGlzKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5mb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgkZm9ybVswXSk7XG5cdFx0fVxuXHRcdCQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHRoaXMuX3VwbG9hZGVyLnVybC5zZW5kLFxuICAgICAgICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgICAgICAgZGF0YTogdGhpcy5mb3JtRGF0YSxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGNhbGxiYWNrLFxuICAgICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6IGNvbmZpZy5lcnJvclxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJlcHJvY2Vzc2luZyBjYWxsYmFjayBiZWZvcmUgY2FsbGJhY2sgcnVuLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFJlcXVlc3QgQ2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgUmVzcG9uc2UgZnJvbSBzZXJ2ZXJcbiAgICAgKi9cbiAgICBzdWNjZXNzUGFkZGluZzogZnVuY3Rpb24oY2FsbGJhY2ssIHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciBqc29uID0gSlNPTi5wYXJzZShyZXNwb25zZSksXG4gICAgICAgICAgICByZXN1bHQgPSB7fTtcblxuICAgICAgICByZXN1bHQuaXRlbXMgPSBqc29uLmZpbGVsaXN0O1xuICAgICAgICBjYWxsYmFjayhyZXN1bHQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGFqYXggYnkgY29uZmlnIHRvIHJlbW92ZSBmaWxlLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWdcbiAgICAgKi9cbiAgICByZW1vdmVSZXF1ZXN0OiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gbmUudXRpbC5iaW5kKHRoaXMucmVtb3ZlUGFkZGluZywgdGhpcywgY29uZmlnLnN1Y2Nlc3MpO1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiB0aGlzLl91cGxvYWRlci51cmwucmVtb3ZlLFxuICAgICAgICAgICAgZGF0YTogY29uZmlnLmRhdGEsXG4gICAgICAgICAgICBzdWNjZXNzOiBjYWxsYmFjayxcbiAgICAgICAgICAgIGVycm9yOiBjb25maWcuZXJyb3JcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByZXByb2Nlc3NpbmcgcmVzcG9uc2UgYmVmb3JlIGNhbGxiYWNrIHJ1bi5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBSZXF1ZXN0IENhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIFJlc3BvbnNlIGZyb20gc2VydmVyXG4gICAgICovXG4gICAgcmVtb3ZlUGFkZGluZzogZnVuY3Rpb24oY2FsbGJhY2ssIHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciBqc29uID0gSlNPTi5wYXJzZShyZXNwb25zZSksXG4gICAgICAgICAgICByZXN1bHQgPSB7fTtcblxuICAgICAgICByZXN1bHQuYWN0aW9uID0gJ3JlbW92ZSc7XG4gICAgICAgIHJlc3VsdC5uYW1lID0gZGVjb2RlVVJJQ29tcG9uZW50KGpzb24ubmFtZSk7XG5cbiAgICAgICAgY2FsbGJhY2socmVzdWx0KTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFqYXg7IiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEEgQ29ubmVjdG9yIG1ha2UgY29ubmVjdGlvbiBiZXR3ZWVuIEZpbGVNYW5hZ2VyIGFuZCBmaWxlIHNlcnZlciBBUEkuPGJyPiBUaGUgQ29ubmVjdG9yIGlzIGludGVyZmFjZS5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbnZhciBBamF4ID0gcmVxdWlyZSgnLi9hamF4Jyk7XG52YXIgSnNvbnAgPSByZXF1aXJlKCcuL2pzb25wJyk7XG52YXIgTG9jYWwgPSByZXF1aXJlKCcuL2xvY2FsJyk7XG5cbi8qKlxuICogVGhlIGNvbm5lY3RvciBjbGFzcyBjb3VsZCBjb25uZWN0IHdpdGggc2VydmVyIGFuZCByZXR1cm4gc2VydmVyIHJlc3BvbnNlIHRvIGNhbGxiYWNrLlxuICovXG52YXIgTW9kdWxlU2V0cyA9IHtcbiAgICAnYWpheCc6IEFqYXgsXG4gICAgJ2pzb25wJzogSnNvbnAsXG4gICAgJ2xvY2FsJzogTG9jYWxcbn07XG5cbi8qKlxuICogVGhpcyBpcyBJbnRlcmZhY2UgdG8gYmUgaW1wbGVtZW50ZWQgYnkgY29ubmVjdG9yc1xuICovXG52YXIgQ29ubmVjdG9yID0ge1xuICAgIC8qKlxuICAgICAqIEEgaW50ZXJmYWNlIHJlbW92ZVJlcXVlc3QgdG8gaW1wbGVtZW50XG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgQSBpbmZvcm1hdGlvbiBmb3IgZGVsZXRlIGZpbGVcbiAgICAgKi9cbiAgICByZW1vdmVSZXF1ZXN0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGludGVyZmFjZSByZW1vdmVSZXF1ZXN0IGRvZXMgbm90IGV4aXN0Jyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEEgaW50ZXJmYWNlIGFkZFJlcXVlc3QgdG8gaW1wbGVtZW50XG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgQSBpbmZvcm1hdGlvbiBmb3IgYWRkIGZpbGVcbiAgICAgKi9cbiAgICBhZGRSZXF1ZXN0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGludGVyZmFjZSBhZGRSZXF1ZXN0IGRvZXMgbm90IGV4aXN0Jyk7XG4gICAgfVxuXG59O1xuXG4vKipcbiAqIFRoZSBmYWN0b3J5IG1vZHVsZSBmb3IgY29ubmVjdG9ycy5cbiAqIEdldCBlYWNoIGNvbm5lY3RvciBieSBlYWNoIHR5cGUuXG4gKi9cbnZhciBGYWN0b3J5ID0ge1xuICAgIC8qKlxuICAgICAqIENob29zZSBjb25uZWN0b3JcbiAgICAgKiBAcGFyYW0gdXBsb2FkZXJcbiAgICAgKiBAcmV0dXJucyB7e191cGxvYWRlcjogKn19XG4gICAgICovXG4gICAgZ2V0Q29ubmVjdG9yOiBmdW5jdGlvbih1cGxvYWRlcikge1xuICAgICAgICB2YXIgdHlwZSA9IHVwbG9hZGVyLnR5cGUudG9Mb3dlckNhc2UoKSxcbiAgICAgICAgICAgIGNvbm4gPSB7XG4gICAgICAgICAgICAgICAgX3VwbG9hZGVyOiB1cGxvYWRlclxuICAgICAgICAgICAgfTtcbiAgICAgICAgbmUudXRpbC5leHRlbmQoY29ubiwgQ29ubmVjdG9yLCBNb2R1bGVTZXRzW3R5cGVdIHx8IExvY2FsKTtcbiAgICAgICAgcmV0dXJuIGNvbm47XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBGYWN0b3J5O1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgQ29ubmVjdG9yIG1ha2UgY29ubmVjdGlvbiBiZXR3ZWVuIEZpbGVNYW5hZ2VyIGFuZCBmaWxlIHNlcnZlciBhcGkgYXQgb2xkIGJyb3dzZXIuPGJyPlxuICogICAgIFRoaXMgQ29ubmVjdG9yIHVzZSBoaWRkZW4gaWZyYW1lLlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxuLyoqXG4gKiBUaGUgbW9kdWxlcyB3aWxsIGJlIG1peGVkIGluIGNvbm5lY3RvciBieSB0eXBlLlxuICovXG52YXIgSnNvbnAgPSB7LyoqIEBsZW5kcyBuZS5jb21wb25lbnQuVXBsb2FkZXIuSnNvbnAgKi9cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGJ5IGZvcm0gc3VibWl0LlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWcgQ29uZmlndXJhdGlvbiBmb3Igc3VibWl0IGZvcm0uXG4gICAgICogIEBwYXJhbSB7ZnVuY3Rpb259IGNvbmZpZy5zdWNjZXNzIENhbGxiYWNrIHdoZW4gcG9zdCBzdWJtaXQgY29tcGxhdGUuXG4gICAgICovXG4gICAgYWRkUmVxdWVzdDogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICAgIHZhciBjYWxsYmFja05hbWUgPSB0aGlzLl91cGxvYWRlci5jYWxsYmFja05hbWUsXG4gICAgICAgIGNhbGxiYWNrID0gY29uZmlnLnN1Y2Nlc3M7XG4gICAgICAgIG5lLnV0aWwuZGVmaW5lTmFtZXNwYWNlKGNhbGxiYWNrTmFtZSwgIG5lLnV0aWwuYmluZCh0aGlzLnN1Y2Nlc3NQYWRkaW5nLCB0aGlzLCBjYWxsYmFjaykpO1xuXG5cdFx0dGhpcy5fdXBsb2FkZXIuaW5wdXRWaWV3LiRlbC5zdWJtaXQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJlcHJvY2Vzc2luZyByZXNwb25zZSBiZWZvcmUgY2FsbGJhY2sgcnVuLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFJlcXVlc3QgQ2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgUmVzcG9uc2UgZnJvbSBzZXJ2ZXJcbiAgICAgKi9cbiAgICBzdWNjZXNzUGFkZGluZzogZnVuY3Rpb24oY2FsbGJhY2ssIHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSB7fTtcblxuXHRcdGlmICh0aGlzLl91cGxvYWRlci5pc0Nyb3NzRG9tYWluKCkpIHtcbiAgICAgICAgICAgIHJlc3VsdC5pdGVtcyA9IHRoaXMuX2dldFNwbGl0SXRlbXMocmVzcG9uc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0Lml0ZW1zID0gbmUudXRpbC50b0FycmF5KHJlc3BvbnNlLmZpbGVsaXN0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNhbGxiYWNrKHJlc3VsdCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2UgcXVlcnkgZGF0YSB0byBhcnJheVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIFRoZSBEYXRhIGV4dHJhY3RlZCBmcm9tIHF1ZXJ5c3RyaW5nIHNlcGFyYXRlZCBieSAnJidcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRTcGxpdEl0ZW1zOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBzZXAgPSB0aGlzLl91cGxvYWRlci5zZXBhcmF0b3IsXG4gICAgICAgICAgICBzdGF0dXMgPSBkYXRhLnN0YXR1cy5zcGxpdChzZXApLFxuICAgICAgICAgICAgbmFtZXMgPSBkYXRhLm5hbWVzLnNwbGl0KHNlcCksXG4gICAgICAgICAgICBzaXplcyA9IGRhdGEuc2l6ZXMuc3BsaXQoc2VwKSxcbiAgICAgICAgICAgIGlkcyA9IG5lLnV0aWwuaXNTdHJpbmcoZGF0YS5pZHMpID8gZGF0YS5pZHMuc3BsaXQoc2VwKSA6IG5hbWVzLFxuICAgICAgICAgICAgaXRlbXMgPSBbXTtcblxuICAgICAgICBuZS51dGlsLmZvckVhY2goc3RhdHVzLCBmdW5jdGlvbihpdGVtLCBpbmRleCkge1xuICAgICAgICAgICAgaWYgKGl0ZW0gPT09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgICAgIHZhciBuSXRlbSA9IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogbmFtZXNbaW5kZXhdLFxuICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IHN0YXR1c1tpbmRleF0sXG4gICAgICAgICAgICAgICAgICAgIHNpemU6IHNpemVzW2luZGV4XSxcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGlkc1tpbmRleF1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGl0ZW1zLnB1c2gobkl0ZW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGl0ZW1zO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGFqYXggYnkgY29uZmlnIHRvIHJlbW92ZSBmaWxlLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWdcbiAgICAgKi9cbiAgICByZW1vdmVSZXF1ZXN0OiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrTmFtZSA9IHRoaXMuX3VwbG9hZGVyLmNhbGxiYWNrTmFtZSxcbiAgICAgICAgICAgIGRhdGEgPSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrTmFtZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNhbGxiYWNrID0gY29uZmlnLnN1Y2Nlc3M7XG5cbiAgICAgICAgbmUudXRpbC5kZWZpbmVOYW1lc3BhY2UoY2FsbGJhY2tOYW1lLCBuZS51dGlsLmJpbmQodGhpcy5yZW1vdmVQYWRkaW5nLCB0aGlzLCBjYWxsYmFjayksIHRydWUpO1xuXG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHRoaXMuX3VwbG9hZGVyLnVybC5yZW1vdmUsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb25wJyxcbiAgICAgICAgICAgIGpzb25wOiBjYWxsYmFja05hbWUsXG4gICAgICAgICAgICBkYXRhOiBuZS51dGlsLmV4dGVuZChkYXRhLCBjb25maWcuZGF0YSlcbiAgICAgICAgfSk7XG5cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJlcHJvY2Vzc2luZyByZXNwb25zZSBiZWZvcmUgY2FsbGJhY2sgcnVuLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFJlcXVlc3QgQ2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgUmVzcG9uc2UgZnJvbSBzZXJ2ZXJcbiAgICAgKi9cbiAgICByZW1vdmVQYWRkaW5nOiBmdW5jdGlvbihjYWxsYmFjaywgcmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgICByZXN1bHQuYWN0aW9uID0gJ3JlbW92ZSc7XG4gICAgICAgIHJlc3VsdC5uYW1lID0gZGVjb2RlVVJJQ29tcG9uZW50KHJlc3BvbnNlLm5hbWUpO1xuXG4gICAgICAgIGNhbGxiYWNrKHJlc3VsdCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBKc29ucDtcbiIsIi8qKlxuICogQGZpbGVvdmV2aWV3IFRoaXMgQ29ubmVjdG9yIG1ha2UgY29ubmVjdGlvbiBiZXR3ZWVuIFVwbG9hZGVyIGFuZCBodG1sNSBmaWxlIGFwaS5cbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG4vKipcbiAqIFRoZSBtb2R1bGVzIHdpbGwgYmUgbWl4ZWQgaW4gY29ubmVjdG9yIGJ5IHR5cGUuXG4gKi9cbnZhciBMb2NhbCA9IHsvKiogQGxlbmRzIG5lLmNvbXBvbmVudC5VcGxvYWRlci5Mb2NhbCAqL1xuICAgIC8qKlxuICAgICAqIEEgcmVzdWx0IGFycmF5IHRvIHNhdmUgZmlsZSB0byBzZW5kLlxuICAgICAqL1xuICAgIF9yZXN1bHQgOiBudWxsLFxuICAgIC8qKlxuICAgICAqIEFkZCBSZXF1ZXN0LCBzYXZlIGZpbGVzIHRvIGFycmF5LlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIFRoZSBkYXRhIG9mIGNvbm5lY3Rpb24gZm9yIHNlcnZlclxuXHRcdCAqIEBwYXJhbSB7b2JqZWN0fSBbZmlsZXNdIFRoZSBmaWxlcyB0byBzYXZlXG4gICAgICovXG4gICAgYWRkUmVxdWVzdDogZnVuY3Rpb24oZGF0YSwgZmlsZXMpIHtcbiAgICAgICAgdmFyIGlzVmFsaWRQb29sID0gdXRpbHMuaXNTdXBwb3J0Rm9ybURhdGEoKSxcbiAgICAgICAgICAgIHJlc3VsdCA9IHRoaXMuX3NhdmVGaWxlKGlzVmFsaWRQb29sLCBmaWxlcyk7XG4gICAgICAgIGRhdGEuc3VjY2Vzcyh7XG4gICAgICAgICAgICBpdGVtczogcmVzdWx0XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTYXZlIGZpbGUgdG8gcG9vbFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNTdXBwb3J0QWpheCBXaGV0aGVyIEZvcm1EYXRhIGlzIHN1cHBvcnRlZCBvciBub3Rcblx0XHQgKiBAcGFyYW0ge29iamVjdH0gW2ZpbGVzXSBUaGUgZmlsZXMgdG8gc2F2ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NhdmVGaWxlOiBmdW5jdGlvbihpc1N1cHBvcnRBamF4LCBmaWxlcykge1xuICAgICAgICB2YXIgdXBsb2FkZXIgPSB0aGlzLl91cGxvYWRlcixcbiAgICAgICAgICAgIGlucHV0VmlldyA9IHVwbG9hZGVyLmlucHV0VmlldyxcbiAgICAgICAgICAgIGZpbGVFbCA9IGlucHV0Vmlldy4kaW5wdXRbMF0sXG5cdFx0XHRcdFx0XHRyZXN1bHQgPSBbXTtcblxuICAgICAgICBpZiAoIXRoaXMuX3Jlc3VsdCkge1xuICAgICAgICAgICAgdGhpcy5fcmVzdWx0ID0gW107XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNTdXBwb3J0QWpheCkge1xuICAgICAgICAgICAgZmlsZXMgPSBmaWxlcyB8fCBmaWxlRWwuZmlsZXM7XG4gICAgICAgICAgICBuZS51dGlsLmZvckVhY2goZmlsZXMsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICBpZiAobmUudXRpbC5pc09iamVjdChpdGVtKSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHtcbiAgICAgICAgICAgICAgICBuYW1lOiBmaWxlRWwudmFsdWUsXG4gICAgICAgICAgICAgICAgZWxlbWVudDogZmlsZUVsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG5cdFx0dGhpcy5fcmVzdWx0ID0gdGhpcy5fcmVzdWx0LmNvbmNhdChyZXN1bHQpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlcyBmb3JtIGRhdGEgdG8gc2VuZCBQT1NUKEZvcm1EYXRlIHN1cHBvcnRlZCBjYXNlKVxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX21ha2VGb3JtRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB1cGxvYWRlciA9IHRoaXMuX3VwbG9hZGVyLFxuXHRcdGZpZWxkID0gdXBsb2FkZXIuZmlsZUZpZWxkLFxuXHRcdGlucHV0ID0gdXBsb2FkZXIuaW5wdXRWaWV3LFxuXHRcdGZvcm0gPSBuZXcgd2luZG93LkZvcm1EYXRhKHRoaXMuX2V4dHJhY3RGb3JtKGlucHV0KSk7XG5cbiAgICAgICAgbmUudXRpbC5mb3JFYWNoKHRoaXMuX3Jlc3VsdCwgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgZm9ybS5hcHBlbmQoZmllbGQsIGl0ZW0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGZvcm07XG4gICAgfSxcblxuXHQvKipcblx0ICogRXh0cmFjdHMgRm9ybSBmcm9tIGlucHV0Vmlld1xuXHQgKiBAcGFyYW0ge29iamVjdH0gaW5wdXQgVGhlIGlucHV0IHZpZXcgZm9yIGV4dHJhY3RpbmcgXG5cdCAqL1xuXHRfZXh0cmFjdEZvcm06IGZ1bmN0aW9uKGlucHV0KSB7XG5cdHZhciBmb3JtID0gaW5wdXQuJGVsLmNsb25lKCk7XG5cdFx0Ly8gYXBwZW5kIHRvIHBvb2xcblx0XHRyZXR1cm4gZm9ybVswXTtcblx0fSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBmaWxlIGZvcm0gcmVzdWx0IGFycmF5XG4gICAgICogQHBhcmFtIHtvYmplY3R9IGluZm8gVGhlIGluZm9ybWF0aW9uIHNldCB0byByZW1vdmUgZmlsZVxuICAgICAqL1xuICAgIHJlbW92ZVJlcXVlc3Q6IGZ1bmN0aW9uKGluZm8pIHtcbiAgICAgICAgdmFyIGRhdGEgPSBpbmZvLmRhdGE7XG4gICAgICAgIHRoaXMuX3Jlc3VsdCA9IG5lLnV0aWwuZmlsdGVyKHRoaXMuX3Jlc3VsdCwgZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgICAgIHJldHVybiBlbC5uYW1lICE9PSBkYXRhLmZpbGVuYW1lO1xuICAgICAgICB9KTtcblxuICAgICAgICBpbmZvLnN1Y2Nlc3Moe1xuICAgICAgICAgICAgYWN0aW9uOiAncmVtb3ZlJyxcbiAgICAgICAgICAgIG5hbWU6IGRhdGEuZmlsZW5hbWVcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNlbmQgZmlsZXMgaW4gYSBiYXRjaC5cbiAgICAgKiBAcGFyYW0gY2FsbGJhY2tcbiAgICAgKi9cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBmb3JtID0gdGhpcy5fbWFrZUZvcm1EYXRhKGlucHV0Vmlldyk7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHRoaXMuX3VwbG9hZGVyLnVybC5zZW5kLFxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgZGF0YTogZm9ybSxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGNhbGxiYWNrLFxuICAgICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTG9jYWw7IiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbmZpZ3VyYXRpb24gb3IgZGVmYXVsdCB2YWx1ZXMuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG4vKipcbiAqIENvbmZpZ3VyYXRpb24gb2YgY29ubmVjdGlvbiB3aXRoIHNlcnZlci5cbiAgKiBAdHlwZSB7e1JFU1BPTlNFX1RZUEU6IHN0cmluZywgUkVESVJFQ1RfVVJMOiBzdHJpbmd9fVxuICovXG5tb2R1bGUuZXhwb3J0cy5DT05GID0ge1xuXHRSRVNQT05TRV9UWVBFOiAnUkVTUE9OU0VfVFlQRScsXG5cdFJFRElSRUNUX1VSTDogJ1JFRElSRUNUX1VSTCcsXG5cdEpTT05QQ0FMTEJBQ0tfTkFNRTogJ0NBTExCQUNLX05BTUUnLFxuXHRTSVpFX1VOSVQ6ICdTSVpFX1VOSVQnLFxuXHRSRU1PVkVfQ0FMTEJBQ0sgOiAncmVzcG9uc2VSZW1vdmVDYWxsYmFjaycsXG5cdEVSUk9SOiB7XG5cdFx0REVGQVVMVDogJ1Vua25vd24gZXJyb3IuJyxcblx0XHROT1RfU1VSUFBPUlQ6ICdUaGlzIGlzIHgtZG9tYWluIGNvbm5lY3Rpb24sIHlvdSBoYXZlIHRvIG1ha2UgaGVscGVyIHBhZ2UuJ1xuXHR9LFxuXHREUkFHX0RFRkFVTFRfRU5BQkxFX0NMQVNTOiAnZW5hYmxlQ2xhc3MnLFxuXHRGSUxFX0ZJTEVEX05BTUU6ICd1c2VyZmlsZVtdJyxcblx0Rk9MREVSX0lORk86ICdmb2xkZXJOYW1lJ1xufTtcblxuLyoqXG4qIERlZmF1bHQgSHRtbHNcbiogQHR5cGUge3tpbnB1dDogc3RyaW5nLCBpdGVtOiBzdHJpbmd9fVxuKi9cbm1vZHVsZS5leHBvcnRzLkhUTUwgPSB7XG5cdGZvcm06IFsnPGZvcm0gZW5jdHlwZT1cIm11bHRpcGFydC9mb3JtLWRhdGFcIiBpZD1cImZvcm1EYXRhXCIgbWV0aG9kPVwicG9zdFwiPicsXG5cdFx0JzxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cIk1BWF9GSUxFX1NJWkVcIiB2YWx1ZT1cIjMwMDAwMDBcIiAvPicsXG5cdCc8L2Zvcm0+J10uam9pbignJyksXG5cdGlucHV0OiBbJzxpbnB1dCB0eXBlPVwiZmlsZVwiIGlkPVwiZmlsZUF0dGFjaFwiIHt7d2Via2l0ZGlyZWN0b3J5fX0gbmFtZT1cInt7ZmlsZUZpZWxkfX1cIiB7e211bHRpcGxlfX0gLz4nXS5qb2luKCcnKSxcblx0c3VibWl0OiBbJzxidXR0b24gY2xhc3M9XCJiYXRjaFN1Ym1pdFwiIHR5cGU9XCJzdWJtaXRcIj5TRU5EPC9idXR0b24+J10uam9pbignJyksXG5cdGl0ZW06IFsnPGxpIGNsYXNzPVwiZmlsZXR5cGVEaXNwbGF5Q2xhc3NcIj4nLFxuXHRcdCc8c3BuYSBjbGFzcz1cImZpbGVpY29uIHt7ZmlsZXR5cGV9fVwiPnt7ZmlsZXR5cGV9fTwvc3BuYT4nLFxuXHRcdCc8c3BhbiBjbGFzcz1cImZpbGVfbmFtZVwiPnt7ZmlsZW5hbWV9fTwvc3Bhbj4nLFxuXHRcdCc8c3BhbiBjbGFzcz1cImZpbGVfc2l6ZVwiPnt7ZmlsZXNpemV9fTwvc3Bhbj4nLFxuXHRcdCc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cInt7ZGVsZXRlQnV0dG9uQ2xhc3NOYW1lfX1cIj5EZWxldGU8L2J1dHRvbj4nLFxuXHRcdCc8L2xpPiddLmpvaW4oJycpLFxuXHRkcmFnOiBbJzxkaXYgY2xhc3M9XCJkcmFnem9uZVwiPjwvZGl2PiddLmpvaW4oJycpXG59O1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZpbGVVcGxvYWRlciBpcyBjb3JlIG9mIGZpbGUgdXBsb2FkZXIgY29tcG9uZW50Ljxicj5GaWxlTWFuYWdlciBtYW5hZ2UgY29ubmVjdG9yIHRvIGNvbm5lY3Qgc2VydmVyIGFuZCB1cGRhdGUgRmlsZUxpc3RWaWV3LlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxudmFyIHN0YXRpY3MgPSByZXF1aXJlKCcuL3N0YXRpY3MnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBjb25uID0gcmVxdWlyZSgnLi9jb25uZWN0b3IvY29ubmVjdG9yJyk7XG52YXIgSW5wdXQgPSByZXF1aXJlKCcuL3ZpZXcvaW5wdXQnKTtcbnZhciBMaXN0ID0gcmVxdWlyZSgnLi92aWV3L2xpc3QnKTtcbnZhciBQb29sID0gcmVxdWlyZSgnLi92aWV3L3Bvb2wnKTtcbnZhciBEcmFnQW5kRHJvcCA9IHJlcXVpcmUoJy4vdmlldy9kcmFnJyk7XG5cbi8qKlxuICogRmlsZVVwbG9hZGVyIGFjdCBsaWtlIGJyaWRnZSBiZXR3ZWVuIGNvbm5lY3RvciBhbmQgdmlldy5cbiAqIEl0IG1ha2VzIGNvbm5lY3RvciBhbmQgdmlldyB3aXRoIG9wdGlvbiBhbmQgZW52aXJvbm1lbnQuXG4gKiBJdCBjb250cm9sIGFuZCBtYWtlIGNvbm5lY3Rpb24gYW1vbmcgbW9kdWxlcy5cbiAqIEBjb25zdHJ1Y3RvciBuZS5jb21wb25lbnQuVXBsb2FkZXJcbiAqIEBleGFtcGxlXG4gKiB2YXIgdXBsb2FkZXIgPSBuZXcgbmUuY29tcG9uZW50LlVwbG9hZGVyKHtcbiAqICAgICB1cmw6IHtcbiAqICAgICAgICAgc2VuZDogXCJodHRwOi8vZmUubmhuZW50LmNvbS9ldGMvZXRjL3VwbG9hZGVyL3VwbG9hZGVyLnBocFwiLFxuICogICAgICAgICByZW1vdmU6IFwiaHR0cDovL2ZlLm5obmVudC5jb20vZXRjL2V0Yy91cGxvYWRlci9yZW1vdmUucGhwXCJcbiAqICAgICB9LFxuICogICAgIGhlbHBlcjoge1xuICogICAgICAgICB1cmw6ICdodHRwOi8vMTAuNzcuMzQuMTI2OjgwMDkvc2FtcGxlcy9yZXNwb25zZS5odG1sJyxcbiAqICAgICAgICAgbmFtZTogJ1JFRElSRUNUX1VSTCdcbiAqICAgICB9LFxuICogICAgIHJlc3VsdFR5cGVFbGVtZW50TmFtZTogJ1JFU1BPTlNFX1RZUEUnLFxuICogICAgIGZvcm1UYXJnZXQ6ICdoaWRkZW5GcmFtZScsXG4gKiAgICAgY2FsbGJhY2tOYW1lOiAncmVzcG9uc2VDYWxsYmFjaycsXG4gKiAgICAgbGlzdEluZm86IHtcbiAqICAgICAgICAgbGlzdDogJCgnI2ZpbGVzJyksXG4gKiAgICAgICAgIGNvdW50OiAkKCcjZmlsZV9jb3VudCcpLFxuICogICAgICAgICBzaXplOiAkKCcjc2l6ZV9jb3VudCcpXG4gKiAgICAgfSxcbiAqICAgICBzZXBhcmF0b3I6ICc7J1xuICogfSwgJCgnI3VwbG9hZGVyJykpO1xuICovXG52YXIgVXBsb2FkZXIgPSBuZS51dGlsLmRlZmluZUNsYXNzKC8qKkBsZW5kcyBuZS5jb21wb25lbnQuVXBsb2FkZXIucHJvdG90eXBlICove1xuXG5cdC8qKlxuXHQgKiBpbml0aWFsaXplIG9wdGlvbnNcblx0ICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgVGhlIG9wdGlvbnMgdG8gc2V0IHVwIGZpbGUgdXBsb2FkZXIgbW9kdWxlcy5cblx0ICogIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLnVybCBUaGUgdXJsIGlzIGZpbGUgc2VydmVyLlxuXHQgKiAgICAgIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnVybC5zZW5kIFRoZSB1cmwgaXMgZm9yIGZpbGUgYXR0YWNoLlxuXHQgKiAgICAgIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnVybC5yZW1vdmUgVGhlIHVybCBpcyBmb3IgZmlsZSBkZXRhY2guXG5cdCAqICBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy5oZWxwZXIgVGhlIGhlbHBlciBvYmplY3QgaW5mbyBpcyBmb3IgeC1kb21haW4uXG5cdCAqICAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuaGVscGVyLnVybCBUaGUgdXJsIGlzIGhlbHBlciBwYWdlIHVybC5cblx0ICogICAgICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5oZWxwZXIubmFtZSBUaGUgbmFtZSBvZiBoaWRkZW4gZWxlbWVudCBmb3Igc2VuZGluZyBzZXJ2ZXIgaGVscGVyIHBhZ2UgaW5mb3JtYXRpb24uXG5cdCAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5yZXN1bHRUeXBlRWxlbWVudE5hbWUgVGhlIHR5cGUgb2YgaGlkZGVuIGVsZW1lbnQgZm9yIHNlbmRpbmcgc2VydmVyIHJlc3BvbnNlIHR5cGUgaW5mb3JtYXRpb24uXG5cdCAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5mb3JtVGFyZ2V0IFRoZSB0YXJnZXQgZm9yIHgtZG9tYWluIGpzb25wIGNhc2UuXG5cdCAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5jYWxsYmFja05hbWUgVGhlIG5hbWUgb2YganNvbnAgY2FsbGJhY2sgZnVuY3Rpb24uXG5cdCAqICBAcGFyYW0ge29iamVjdH0gb3BpdG9ucy5saXN0SW5mbyBUaGUgZWxlbWVudCBpbmZvIHRvIGRpc3BsYXkgZmlsZSBsaXN0IGluZm9ybWF0aW9uLlxuXHQgKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuc2VwYXJhdG9yIFRoZSBzZXBhcmF0b3IgZm9yIGpzb25wIGhlbHBlciByZXNwb25zZS5cblx0ICogIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5maWxlRmllbGQ9dXNlckZpbGVdIFRoZSBmaWVsZCBuYW1lIG9mIGlucHV0IGZpbGUgZWxlbWVudC5cblx0ICogIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy51c2VGb2xkZXIgV2hldGhlciBzZWxlY3QgdW5pdCBpcyBmb2xkZXIgb2Ygbm90LiBJZiB0aGlzIGlzIHR1cmUsIG11bHRpcGxlIHdpbGwgYmUgaWdub3JlZC5cblx0ICogIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy5pc011bHRpcGxlIFdoZXRoZXIgZW5hYmxlIG11bHRpcGxlIHNlbGVjdCBvciBub3QuXG5cdCAqIEBwYXJhbSB7SnF1ZXJ5T2JqZWN0fSAkZWwgUm9vdCBFbGVtZW50IG9mIFVwbG9hZGVyXG5cdCAqL1xuXHRpbml0OiBmdW5jdGlvbihvcHRpb25zLCAkZWwpIHtcblx0XHR0aGlzLl9zZXREYXRhKG9wdGlvbnMpO1xuXHRcdHRoaXMuX3NldENvbm5lY3RvcigpO1xuXG5cdFx0dGhpcy4kZWwgPSAkZWw7XG5cblx0XHRpZih0aGlzLnVzZURyYWcgJiYgIXRoaXMudXNlRm9sZGVyICYmIHV0aWxzLmlzU3VwcG9ydEZpbGVTeXN0ZW0oKSkge1xuXHRcdFx0dGhpcy5kcmFnVmlldyA9IG5ldyBEcmFnQW5kRHJvcChvcHRpb25zLCB0aGlzKTtcblx0XHR9XG5cblx0XHR0aGlzLmlucHV0VmlldyA9IG5ldyBJbnB1dChvcHRpb25zLCB0aGlzKTtcblx0XHR0aGlzLmxpc3RWaWV3ID0gbmV3IExpc3Qob3B0aW9ucywgdGhpcyk7XG5cblx0XHR0aGlzLmZpbGVGaWVsZCA9IHRoaXMuZmlsZUZpZWxkIHx8IHN0YXRpY3MuQ09ORi5GSUxFX0ZJTEVEX05BTUU7XG5cdFx0dGhpcy5fcG9vbCA9IG5ldyBQb29sKHRoaXMuaW5wdXRWaWV3LiRlbFswXSk7XG5cdFx0dGhpcy5fYWRkRXZlbnQoKTtcblx0fSxcblx0XG5cdC8qKlxuXHQgKiBTZXQgQ29ubmVjdG9yIGJ5IHVzZUpzb25wIGZsYWcgYW5kIHdoZXRoZXIuXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfc2V0Q29ubmVjdG9yOiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5pc0JhdGNoVHJhbnNmZXIpIHtcblx0XHRcdHRoaXMudHlwZSA9ICdsb2NhbCc7XG5cdFx0fSBlbHNlIGlmICh0aGlzLmlzQ3Jvc3NEb21haW4oKSkge1xuXHRcdFx0aWYgKHRoaXMuaGVscGVyKSB7XG5cdFx0XHRcdHRoaXMudHlwZSA9ICdqc29ucCc7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhbGVydChzdGF0aWNzLkNPTkYuRVJST1IuTk9UX1NVUlBQT1JUKTtcbiAgICAgICAgICAgICAgICB0aGlzLnR5cGUgPSAnbG9jYWwnOyAgICBcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKHRoaXMudXNlSnNvbnAgfHwgIXV0aWxzLmlzU3VwcG9ydEZvcm1EYXRhKCkpIHtcblx0XHRcdFx0dGhpcy50eXBlID0gJ2pzb25wJztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMudHlwZSA9ICdhamF4Jztcblx0XHRcdH1cblx0XHR9XG5cdFx0dGhpcy5fY29ubmVjdG9yID0gY29ubi5nZXRDb25uZWN0b3IodGhpcyk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFVwZGF0ZSBsaXN0IHZpZXcgd2l0aCBjdXN0b20gb3Igb3JpZ2luYWwgZGF0YS5cblx0ICogQHBhcmFtIHtvYmplY3R9IGluZm8gVGhlIGRhdGEgZm9yIHVwZGF0ZSBsaXN0XG5cdCAqICBAcGFyYW0ge3N0cmluZ30gaW5mby5hY3Rpb24gVGhlIGFjdGlvbiBuYW1lIHRvIGV4ZWN1dGUgbWV0aG9kXG5cdCAqL1xuXHRub3RpZnk6IGZ1bmN0aW9uKGluZm8pIHtcblx0XHR0aGlzLmxpc3RWaWV3LnVwZGF0ZShpbmZvKTtcblx0XHR0aGlzLmxpc3RWaWV3LnVwZGF0ZVRvdGFsSW5mbyhpbmZvKTtcblx0fSxcblxuXHQvKipcblx0ICogU2V0IGZpZWxkIGRhdGEgYnkgb3B0aW9uIHZhbHVlcy5cblx0ICogQHBhcmFtIG9wdGlvbnNcblx0ICovXG5cdF9zZXREYXRhOiBmdW5jdGlvbihvcHRpb25zKSB7XG5cdFx0bmUudXRpbC5leHRlbmQodGhpcywgb3B0aW9ucyk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEV4dHJhY3QgcHJvdG9jb2wgKyBkb21haW4gZnJvbSB1cmwgdG8gZmluZCBvdXQgd2hldGhlciBjcm9zcy1kb21haW4gb3Igbm90LlxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdGlzQ3Jvc3NEb21haW46IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBwYWdlRG9tYWluID0gZG9jdW1lbnQuZG9tYWluO1xuXHRcdHJldHVybiB0aGlzLnVybC5zZW5kLmluZGV4T2YocGFnZURvbWFpbikgPT09IC0xO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBDYWxsYmFjayBmb3IgZXJyb3Jcblx0ICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIEVycm9yIHJlc3BvbnNlXG5cdCAqL1xuXHRlcnJvckNhbGxiYWNrOiBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdHZhciBtZXNzYWdlO1xuXHRcdGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5tc2cpIHtcblx0XHRcdG1lc3NhZ2UgPSByZXNwb25zZS5tc2c7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG1lc3NhZ2UgPSBzdGF0aWNzLkNPTkYuRVJST1IuREVGQVVMVDtcblx0XHR9XG5cdFx0YWxlcnQobWVzc2FnZSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIENhbGxiYWNrIGZvciBjdXN0b20gc2VuZCBldmVudFxuXHQgKiBAcGFyYW0ge29iamVjdH0gW2RhdGFdIFRoZSBkYXRhIGluY2x1ZGUgY2FsbGJhY2sgZnVuY3Rpb24gZm9yIGZpbGUgY2xvbmVcblx0ICovXG5cdHNlbmRGaWxlOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0dmFyIGNhbGxiYWNrID0gbmUudXRpbC5iaW5kKHRoaXMubm90aWZ5LCB0aGlzKSxcblx0XHRmaWxlcyA9IGRhdGEgJiYgZGF0YS5maWxlcztcblx0XHRcblx0XHR0aGlzLl9jb25uZWN0b3IuYWRkUmVxdWVzdCh7XG5cdFx0XHR0eXBlOiAnYWRkJyxcblx0XHRcdHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3VsdCkge1xuXHRcdFx0XHRpZiAoZGF0YSAmJiBkYXRhLmNhbGxiYWNrKSB7XG5cdFx0XHRcdFx0ZGF0YS5jYWxsYmFjayhyZXN1bHQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGNhbGxiYWNrKHJlc3VsdCk7XG5cdFx0XHR9LFxuXHRcdFx0ZXJyb3I6IHRoaXMuZXJyb3JDYWxsYmFja1xuXHRcdH0sIGZpbGVzKTtcblx0fSxcblxuXHQvKipcblx0ICogQ2FsbGJhY2sgZm9yIGN1c3RvbSByZW1vdmUgZXZlbnRcblx0ICogQHBhcmFtIHtvYmplY3R9IGRhdGEgVGhlIGRhdGEgZm9yIHJlbW92ZSBmaWxlLlxuXHQgKi9cblx0cmVtb3ZlRmlsZTogZnVuY3Rpb24oZGF0YSkge1xuXHRcdHZhciBjYWxsYmFjayA9IG5lLnV0aWwuYmluZCh0aGlzLm5vdGlmeSwgdGhpcyk7XG5cdFx0dGhpcy5fY29ubmVjdG9yLnJlbW92ZVJlcXVlc3Qoe1xuXHRcdFx0dHlwZTogJ3JlbW92ZScsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0c3VjY2VzczogY2FsbGJhY2tcblx0XHR9KTtcblx0fSxcblxuXHQvKipcblx0ICogU3VibWl0IGZvciBkYXRhIHN1Ym1pdCB0byBzZXJ2ZXJcblx0ICovXG5cdHN1Ym1pdDogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMuX2Nvbm5lY3Rvci5zdWJtaXQpIHtcblx0XHRcdGlmICh1dGlscy5pc1N1cHBvcnRGb3JtRGF0YSgpKSB7XG5cdFx0XHRcdHRoaXMuX2Nvbm5lY3Rvci5zdWJtaXQobmUudXRpbC5iaW5kKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHRoaXMuZmlyZSgnYmVmb3Jlc3VibWl0JywgdGhpcyk7XG5cdFx0XHRcdH0sIHRoaXMpKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuX3Bvb2wucGxhbnQoKTtcblx0XHRcdH1cblx0XHR9IFxuXHR9LFxuXG5cdC8qKlxuXHQgKiBHZXQgZmlsZSBpbmZvIGxvY2FsbHlcblx0ICogQHBhcmFtIHtIdG1sRWxlbWVudH0gZWxlbWVudCBJbnB1dCBlbGVtZW50XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfZ2V0RmlsZUluZm86IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0XHR2YXIgZmlsZXM7XG5cdFx0aWYgKHV0aWxzLmlzU3VwcG9ydEZpbGVTeXN0ZW0oKSkge1xuXHRcdFx0ZmlsZXMgPSB0aGlzLl9nZXRGaWxlTGlzdChlbGVtZW50LmZpbGVzKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZmlsZXMgPSB7XG5cdFx0XHRcdG5hbWU6IGVsZW1lbnQudmFsdWUsXG5cdFx0XHRcdGlkOiBlbGVtZW50LnZhbHVlXG5cdFx0XHR9O1xuXHRcdH1cblx0XHRyZXR1cm4gZmlsZXM7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEdldCBmaWxlIGxpc3QgZnJvbSBGaWxlTGlzdCBvYmplY3Rcblx0ICogQHBhcmFtIHtGaWxlTGlzdH0gZmlsZXMgQSBGaWxlTGlzdCBvYmplY3Rcblx0ICogQHJldHVybnMge0FycmF5fVxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X2dldEZpbGVMaXN0OiBmdW5jdGlvbihmaWxlcykge1xuXHRcdHJldHVybiBuZS51dGlsLm1hcChmaWxlcywgZnVuY3Rpb24oZmlsZSkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0bmFtZTogZmlsZS5uYW1lLFxuXHRcdFx0XHRzaXplOiBmaWxlLnNpemUsXG5cdFx0XHRcdGlkOiBmaWxlLm5hbWVcblx0XHRcdH07XG5cdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEFkZCBldmVudCB0byBsaXN0dmlldyBhbmQgaW5wdXR2aWV3XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfYWRkRXZlbnQ6IGZ1bmN0aW9uKCkge1xuXG5cdFx0aWYodGhpcy51c2VEcmFnICYmIHRoaXMuZHJhZ1ZpZXcpIHtcblx0XHRcdC8vIEB0b2RvIHRvcCDsspjrpqzqsIAg65Sw66GcIO2VhOyalO2VqCwgc2VuZEZpbGUg7IKs7JqpIOyViOuQqFxuXHRcdFx0dGhpcy5kcmFnVmlldy5vbignZHJvcCcsIHRoaXMuc2VuZEZpbGUsIHRoaXMpO1xuXHRcdH1cblx0XHRpZiAodGhpcy5pc0JhdGNoVHJhbnNmZXIpIHtcblx0XHRcdHRoaXMuaW5wdXRWaWV3Lm9uKCdzYXZlJywgdGhpcy5zZW5kRmlsZSwgdGhpcyk7XG5cdFx0XHR0aGlzLmxpc3RWaWV3Lm9uKCdyZW1vdmUnLCB0aGlzLnJlbW92ZUZpbGUsIHRoaXMpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmlucHV0Vmlldy5vbignY2hhbmdlJywgdGhpcy5zZW5kRmlsZSwgdGhpcyk7XG5cdFx0XHR0aGlzLmxpc3RWaWV3Lm9uKCdyZW1vdmUnLCB0aGlzLnJlbW92ZUZpbGUsIHRoaXMpO1xuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogU3RvcmUgaW5wdXQgZWxlbWVudCB0byBwb29sLlxuXHQgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBpbnB1dCBBIGlucHV0IGVsZW1lbnRbdHlwZT1maWxlXSBmb3Igc3RvcmUgcG9vbFxuXHQgKi9cblx0c3RvcmU6IGZ1bmN0aW9uKGlucHV0KSB7XG5cdFx0dGhpcy5fcG9vbC5zdG9yZShpbnB1dCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJlbW92ZSBpbnB1dCBlbGVtZW50IGZvcm0gcG9vbC5cblx0ICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGZpbGUgbmFtZSB0byByZW1vdmVcblx0ICovXG5cdHJlbW92ZTogZnVuY3Rpb24obmFtZSkge1xuXHRcdGlmICghdXRpbHMuaXNTdXBwb3J0Rm9ybURhdGEoKSkge1xuXHRcdFx0dGhpcy5fcG9vbC5yZW1vdmUobmFtZSk7XG5cdFx0fVxuXHR9XG59KTtcblxubmUudXRpbC5DdXN0b21FdmVudHMubWl4aW4oVXBsb2FkZXIpO1xubW9kdWxlLmV4cG9ydHMgPSBVcGxvYWRlcjtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIGZpbGUgY29udGFpbiB1dGlsaXR5IG1ldGhvZHMgZm9yIHVwbG9hZGVyLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxuLyoqXG4gKiBFeHRyYWN0IHVuaXQgZm9yIGZpbGUgc2l6ZVxuICogQHBhcmFtIHtudW1iZXJ9IGJ5dGVzIEEgdXNhZ2Ugb2YgZmlsZVxuICovXG5tb2R1bGUuZXhwb3J0cy5nZXRGaWxlU2l6ZVdpdGhVbml0ID0gZnVuY3Rpb24oYnl0ZXMpIHtcbiAgICB2YXIgdW5pdHMgPSBbJ0InLCAnS0InLCAnTUInLCAnR0InLCAnVEInXSxcbiAgICAgICAgYnl0ZXMgPSBwYXJzZUludChieXRlcywgMTApLFxuICAgICAgICBleHAgPSBNYXRoLmxvZyhieXRlcykgLyBNYXRoLmxvZygxMDI0KSB8IDAsXG4gICAgICAgIHJlc3VsdCA9IChieXRlcyAvIE1hdGgucG93KDEwMjQsIGV4cCkpLnRvRml4ZWQoMik7XG5cbiAgICByZXR1cm4gcmVzdWx0ICsgdW5pdHNbZXhwXTtcbn07XG5cbi8qKlxuICogV2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0IEZvcm1EYXRhIG9yIG5vdFxuICovXG5tb2R1bGUuZXhwb3J0cy5pc1N1cHBvcnRGb3JtRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBGb3JtRGF0YSA9ICh3aW5kb3cuRm9ybURhdGEgfHwgbnVsbCk7XG4gICAgcmV0dXJuICEhRm9ybURhdGE7XG59O1xuXG4vKipcbiAqIEdldCBpdGVtIGVsZW1lbiBIVE1MXG4gKiBAcGFyYW0ge3N0cmluZ30gaHRtbCBIVE1MIHRlbXBsYXRlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5tb2R1bGUuZXhwb3J0cy50ZW1wbGF0ZSA9IGZ1bmN0aW9uKG1hcCwgaHRtbCkge1xuICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoL1xce1xceyhbXlxcfV0rKVxcfVxcfS9nLCBmdW5jdGlvbihtc3RyLCBuYW1lKSB7XG4gICAgICAgIHJldHVybiBtYXBbbmFtZV07XG4gICAgfSk7XG4gICAgcmV0dXJuIGh0bWw7XG59O1xuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgc3VwcG9ydCBmaWxlIGFwaSBvciBub3RcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5tb2R1bGUuZXhwb3J0cy5pc1N1cHBvcnRGaWxlU3lzdGVtID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICEhKHdpbmRvdy5GaWxlICYmIHdpbmRvdy5GaWxlUmVhZGVyICYmIHdpbmRvdy5GaWxlTGlzdCAmJiB3aW5kb3cuQmxvYik7XG59OyIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIGZpbGUgaXMgYWJvdXQgZHJhZyBhbmQgZHJvcCBmaWxlIHRvIHNlbmQuIERyYWcgYW5kIGRyb3AgaXMgcnVubmluZyB2aWEgZmlsZSBhcGkuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG52YXIgc3RhdGljcyA9IHJlcXVpcmUoJy4uL3N0YXRpY3MnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cbi8qKlxuICogTWFrZXMgZHJhZyBhbmQgZHJvcCBhcmVhLCB0aGUgZHJvcHBlZCBmaWxlIGlzIGFkZGVkIHZpYSBldmVudCBkcm9wIGV2ZW50LlxuICogQGNsYXNzIERyYWdBbmREcm9wXG4gKi9cbnZhciBEcmFnQW5kRHJvcCA9IG5lLnV0aWwuZGVmaW5lQ2xhc3Moe1xuXHQvKipcblx0ICogaW5pdGlhbGl6ZSBEcmFnQW5kRHJvcFxuXHQgKi9cblx0aW5pdDogZnVuY3Rpb24ob3B0aW9ucywgdXBsb2FkZXIpIHtcblx0XHR2YXIgaHRtbCA9IG9wdGlvbnMudGVtcGxhdGUgJiYgb3B0aW9ucy50ZW1wbGF0ZS5kcmFnIHx8IHN0YXRpY3MuSFRNTC5kcmFnO1xuXHRcdHRoaXMuX2VuYWJsZUNsYXNzID0gb3B0aW9ucy5kcmFnICYmIG9wdGlvbnMuZHJhZy5lbmFibGVDbGFzcyB8fCBzdGF0aWNzLkNPTkYuRFJBR19ERUZBVUxUX0VOQUJMRV9DTEFTUztcblx0XHR0aGlzLl9yZW5kZXIoaHRtbCwgdXBsb2FkZXIpO1xuXHRcdHRoaXMuX2FkZEV2ZW50KCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJlbmRlcnMgZHJhZyBhbmQgZHJvcCBhcmVhXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBodG1sIFRoZSBodG1sIHN0cmluZyB0byBtYWtlIGRhcmcgem9uZVxuXHQgKiBAcGFyYW0ge29iamVjdH0gdXBsb2FkZXIgVGhlIGNvcmUgaW5zdGFuY2Ugb2YgdGhpcyBjb21wb25lbnRcblx0ICovXG5cdF9yZW5kZXI6IGZ1bmN0aW9uKGh0bWwsIHVwbG9hZGVyKSB7XG5cdFx0dGhpcy4kZWwgPSAkKGh0bWwpO1xuXHRcdHVwbG9hZGVyLiRlbC5hcHBlbmQodGhpcy4kZWwpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBZGRzIGRyYWcgYW5kIGRyb3AgZXZlbnRcblx0ICovXG5cdF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwub24oJ2RyYWdlbnRlcicsIG5lLnV0aWwuYmluZCh0aGlzLm9uRHJhZ0VudGVyLCB0aGlzKSk7XG5cdFx0dGhpcy4kZWwub24oJ2RyYWdvdmVyJywgbmUudXRpbC5iaW5kKHRoaXMub25EcmFnT3ZlciwgdGhpcykpO1xuXHRcdHRoaXMuJGVsLm9uKCdkcm9wJywgbmUudXRpbC5iaW5kKHRoaXMub25Ecm9wLCB0aGlzKSk7XG5cdFx0dGhpcy4kZWwub24oJ2RyYWdsZWF2ZScsIG5lLnV0aWwuYmluZCh0aGlzLm9uRHJhZ0xlYXZlLCB0aGlzKSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEhhbmRsZXMgZHJhZ2VudGVyIGV2ZW50XG5cdCAqL1xuXHRvbkRyYWdFbnRlcjogZnVuY3Rpb24oZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdHRoaXMuX2VuYWJsZSgpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBIYW5kbGVzIGRyYWdvdmVyIGV2ZW50XG5cdCAqL1xuXHRvbkRyYWdPdmVyOiBmdW5jdGlvbihlKSB7XG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEhhbmRsZXMgZHJhZ2xlYXZlIGV2ZW50XG5cdCAqL1xuXHRvbkRyYWdMZWF2ZTogZnVuY3Rpb24oZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdHRoaXMuX2Rpc2FibGUoKTtcblx0fSxcblxuXHQvKipcblx0ICogSGFuZGxlcyBkcm9wIGV2ZW50XG5cdCAqL1xuXHRvbkRyb3A6IGZ1bmN0aW9uKGUpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0dGhpcy5fZGlzYWJsZSgpO1xuXHRcdHRoaXMuZmlyZSgnZHJvcCcsIHtcblx0XHRcdGZpbGVzOiBlLm9yaWdpbmFsRXZlbnQuZGF0YVRyYW5zZmVyLmZpbGVzXG5cdFx0fSk7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9LFxuXG5cdF9lbmFibGU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmFkZENsYXNzKHRoaXMuX2VuYWJsZUNsYXNzKTtcblx0fSxcblxuXHRfZGlzYWJsZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3ModGhpcy5fZW5hYmxlQ2xhc3MpO1xuXHR9XG59KTtcblxubmUudXRpbC5DdXN0b21FdmVudHMubWl4aW4oRHJhZ0FuZERyb3ApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyYWdBbmREcm9wO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IElucHV0VmlldyBtYWtlIGlucHV0IGZvcm0gYnkgdGVtcGxhdGUuIEFkZCBldmVudCBmaWxlIHVwbG9hZCBldmVudC5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbnZhciBzdGF0aWNzID0gcmVxdWlyZSgnLi4vc3RhdGljcycpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuLyoqXG4gKiBUaGlzIHZpZXcgY29udHJvbCBpbnB1dCBlbGVtZW50IHR5cGVkIGZpbGUuXG4gKiBAY29uc3RydWN0b3IgbmUuY29tcG9uZW50LkZpbGVVcGxvYWRlci5JbnB1dFZpZXdcbiAqL1xudmFyIElucHV0ID0gbmUudXRpbC5kZWZpbmVDbGFzcygvKipAbGVuZHMgbmUuY29tcG9uZW50LlVwbG9hZGVyLklucHV0LnByb3RvdHlwZSAqKi97XG5cdC8qKlxuXHQgKiBJbml0aWFsaXplIGlucHV0IGVsZW1lbnQuXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cblx0ICovXG5cdGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMsIHVwbG9hZGVyKSB7XG5cblx0XHR0aGlzLl91cGxvYWRlciA9IHVwbG9hZGVyO1xuXHRcdHRoaXMuX3RhcmdldCA9IG9wdGlvbnMuZm9ybVRhcmdldDtcblx0XHR0aGlzLl91cmwgPSBvcHRpb25zLnVybDtcblx0XHR0aGlzLl9pc0JhdGNoVHJhbnNmZXIgPSBvcHRpb25zLmlzQmF0Y2hUcmFuc2Zlcjtcblx0XHR0aGlzLl9pc011bHRpcGxlID0gISEodXRpbHMuaXNTdXBwb3J0Rm9ybURhdGEoKSAmJiBvcHRpb25zLmlzTXVsdGlwbGUpO1xuXHRcdHRoaXMuX3VzZUZvbGRlciA9ICEhKHV0aWxzLmlzU3VwcG9ydEZvcm1EYXRhKCkgJiYgb3B0aW9ucy51c2VGb2xkZXIpO1xuXG5cdFx0dGhpcy5faHRtbCA9IHRoaXMuX3NldEhUTUwob3B0aW9ucy50ZW1wbGF0ZSk7XG5cblx0XHR0aGlzLl9yZW5kZXIoKTtcblx0XHR0aGlzLl9yZW5kZXJIaWRkZW5FbGVtZW50cygpO1xuXG5cdFx0aWYgKG9wdGlvbnMuaGVscGVyKSB7XG5cdFx0XHR0aGlzLl9tYWtlQnJpZGdlSW5mb0VsZW1lbnQob3B0aW9ucy5oZWxwZXIpO1xuXHRcdH1cblxuXHRcdHRoaXMuX2FkZEV2ZW50KCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJlbmRlciBpbnB1dCBhcmVhXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfcmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbCA9ICQodGhpcy5fZ2V0SHRtbCgpKTtcblx0XHR0aGlzLiRlbC5hdHRyKHtcblx0XHRcdGFjdGlvbjogdGhpcy5fdXJsLnNlbmQsXG5cdFx0XHRtZXRob2Q6ICdwb3N0Jyxcblx0XHRcdGVuY3R5cGU6IFwibXVsdGlwYXJ0L2Zvcm0tZGF0YVwiLFxuXHRcdFx0dGFyZ2V0OiAoIXRoaXMuX2lzQmF0Y2hUcmFuc2ZlciA/IHRoaXMuX3RhcmdldCA6ICcnKVxuXHRcdH0pO1xuXHRcdHRoaXMuJGlucHV0ID0gdGhpcy5fZ2V0SW5wdXRFbGVtZW50KCk7XG5cdFx0dGhpcy4kc3VibWl0ID0gdGhpcy5fZ2V0U3VibWl0RWxlbWVudCgpO1xuXHRcdHRoaXMuJGlucHV0LmFwcGVuZFRvKHRoaXMuJGVsKTtcblx0XHRpZiAodGhpcy4kc3VibWl0KSB7XG5cdFx0XHR0aGlzLiRzdWJtaXQuYXBwZW5kVG8odGhpcy4kZWwpO1xuXHRcdH1cblx0XHR0aGlzLl91cGxvYWRlci4kZWwuYXBwZW5kKHRoaXMuJGVsKTtcblx0fSxcblxuXHQvKipcblx0ICogU2V0IGFsbCBvZiBpbnB1dCBlbGVtZW50cyBodG1sIHN0cmluZ3MuXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBbdGVtcGxhdGVdIFRoZSB0ZW1wbGF0ZSBpcyBzZXQgZm9ybSBjdXN0b21lci5cblx0ICogQHJldHVybiB7b2JqZWN0fSBUaGUgaHRtbCBzdHJpbmcgc2V0IGZvciBpbnB1dFZpZXdcblx0ICovXG5cdF9zZXRIVE1MOiBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuXHRcdGlmICghdGVtcGxhdGUpIHtcblx0XHRcdHRlbXBsYXRlID0ge307XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGlucHV0OiB0ZW1wbGF0ZS5pbnB1dCB8fCBzdGF0aWNzLkhUTUwuaW5wdXQsXG5cdFx0XHRzdWJtaXQ6IHRlbXBsYXRlLnN1Ym1pdCB8fCBzdGF0aWNzLkhUTUwuc3VibWl0LFxuXHRcdFx0Zm9ybTogdGVtcGxhdGUuZm9ybSB8fCBzdGF0aWNzLkhUTUwuZm9ybVxuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIEdldCBodG1sIHN0cmluZyBmcm9tIHRlbXBsYXRlXG5cdCAqIEByZXR1cm4ge29iamVjdH1cblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9nZXRIdG1sOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5faHRtbC5mb3JtO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBNYWtlcyBhbmQgcmV0dXJucyBqcXVlcnkgZWxlbWVudFxuXHQgKiBAcmV0dXJuIHtvYmplY3R9IFRoZSBqcXVlcnkgb2JqZWN0IHdyYXBwaW5nIG9yaWdpbmFsIGlucHV0IGVsZW1lbnRcblx0ICovXG5cdF9nZXRJbnB1dEVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBtYXAgPSB7XG5cdFx0XHRtdWx0aXBsZTogdGhpcy5faXNNdWx0aXBsZSA/ICdtdWx0aXBsZScgOiAnJyxcblx0XHRcdGZpbGVGaWVsZDogdGhpcy5fdXBsb2FkZXIuZmlsZUZpZWxkLFxuXHRcdFx0d2Via2l0ZGlyZWN0b3J5OiB0aGlzLl91c2VGb2xkZXIgPyAnd2Via2l0ZGlyZWN0b3J5JyA6ICcnXG5cdFx0fTtcblxuXHRcdHJldHVybiAkKHV0aWxzLnRlbXBsYXRlKG1hcCwgdGhpcy5faHRtbC5pbnB1dCkpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBNYWtlcyBhbmQgcmV0dXJucyBqcXVlcnkgZWxlbWVudFxuXHQgKiBAcmV0dXJuIHtvYmplY3R9IFRoZSBqcXVlcnkgb2JqZWN0IHdyYXBwaW5nIHN1bWJpdCBidXR0b24gZWxlbWVudFxuXHQgKi9cblx0X2dldFN1Ym1pdEVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLl9pc0JhdGNoVHJhbnNmZXIpIHtcblx0XHRcdHJldHVybiAkKHRoaXMuX2h0bWwuc3VibWl0KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1x0XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBDYWxsIG1ldGhvZHMgdGhvc2UgbWFrZSBlYWNoIGhpZGRlbiBlbGVtZW50LlxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X3JlbmRlckhpZGRlbkVsZW1lbnRzOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLl9tYWtlVGFyZ2V0RnJhbWUoKTtcblx0XHR0aGlzLl9tYWtlUmVzdWx0VHlwZUVsZW1lbnQoKTtcblx0XHR0aGlzLl9tYWtlQ2FsbGJhY2tFbGVtZW50KCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEFkZCBldmVudFxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X2FkZEV2ZW50OiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5faXNCYXRjaFRyYW5zZmVyKSB7XG5cdFx0XHR0aGlzLiRlbC5vbignc3VibWl0JywgbmUudXRpbC5iaW5kKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0aGlzLl91cGxvYWRlci5zdWJtaXQoKTtcblx0XHRcdH0sIHRoaXMpKTtcblx0XHR9XG5cdFx0dGhpcy5fYWRkSW5wdXRFdmVudCgpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBZGQgaW5wdXQgZWxlbWVudCBjaGFuZ2UgZXZlbnQgYnkgc2VuZGluZyB0eXBlXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfYWRkSW5wdXRFdmVudDogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMuX2lzQmF0Y2hUcmFuc2Zlcikge1xuXHRcdFx0dGhpcy4kaW5wdXQub24oJ2NoYW5nZScsIG5lLnV0aWwuYmluZCh0aGlzLm9uU2F2ZSwgdGhpcykpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLiRpbnB1dC5vbignY2hhbmdlJywgbmUudXRpbC5iaW5kKHRoaXMub25DaGFuZ2UsIHRoaXMpKTtcblx0XHR9XG5cdH0sXG5cblx0LyoqXG5cdCAqIEV2ZW50LUhhbmRsZSBmb3IgaW5wdXQgZWxlbWVudCBjaGFuZ2Vcblx0ICovXG5cdG9uQ2hhbmdlOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIXRoaXMuJGlucHV0WzBdLnZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm47IFxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZmlyZSgnY2hhbmdlJywge1xuXHRcdFx0dGFyZ2V0OiB0aGlzXG5cdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEV2ZW50LUhhbmRsZSBmb3Igc2F2ZSBpbnB1dCBlbGVtZW50XG5cdCAqL1xuXHRvblNhdmU6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICghdGhpcy4kZWxbMF0udmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc2F2ZUNhbGxiYWNrID0gIXV0aWxzLmlzU3VwcG9ydEZvcm1EYXRhKCkgPyBuZS51dGlsLmJpbmQodGhpcy5fcmVzZXRJbnB1dEVsZW1lbnQsIHRoaXMpIDogbnVsbDtcblx0XHR0aGlzLmZpcmUoJ3NhdmUnLCB7XG5cdFx0XHRlbGVtZW50OiB0aGlzLiRpbnB1dFswXSxcblx0XHRcdGNhbGxiYWNrOiBzYXZlQ2FsbGJhY2tcblx0XHR9KTtcblx0fSxcblxuXHQvKipcblx0ICogUmVzZXQgSW5wdXQgZWxlbWVudCB0byBzYXZlIHdob2xlIGlucHV0PWZpbGUgZWxlbWVudC5cblx0ICovXG5cdF9yZXNldElucHV0RWxlbWVudDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kaW5wdXQub2ZmKCk7XG5cdFx0dGhpcy5fY2xvbmUodGhpcy4kaW5wdXRbMF0pO1xuXHRcdHRoaXMuJGlucHV0ID0gdGhpcy5fZ2V0SW5wdXRFbGVtZW50KCk7XG5cdFx0aWYgKHRoaXMuJHN1Ym1pdCkge1xuXHRcdFx0dGhpcy4kc3VibWl0LmJlZm9yZSh0aGlzLiRpbnB1dCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuJGVsLmFwcGVuZCh0aGlzLiRpbnB1dCk7XG5cdFx0fVxuXHRcdHRoaXMuX2FkZElucHV0RXZlbnQoKTtcblx0fSxcblxuXHQvKipcblx0ICogTWFrZXMgZWxlbWVudCB0byBiZSB0YXJnZXQgb2Ygc3VibWl0IGZvcm0gZWxlbWVudC5cblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9tYWtlVGFyZ2V0RnJhbWU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuXyR0YXJnZXQgPSAkKCc8aWZyYW1lIG5hbWU9XCInICsgdGhpcy5fdGFyZ2V0ICsgJ1wiPjwvaWZyYW1lPicpO1xuXHRcdHRoaXMuXyR0YXJnZXQuY3NzKHtcblx0XHRcdHZpc2liaWxpdHk6ICdoaWRkZW4nLFxuXHRcdFx0cG9zaXRpb246ICdhYnNvbHV0ZSdcblx0XHR9KTtcblx0XHR0aGlzLl91cGxvYWRlci4kZWwuYXBwZW5kKHRoaXMuXyR0YXJnZXQpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBNYWtlIGVsZW1lbnQgdG8gYmUgY2FsbGJhY2sgZnVuY3Rpb24gbmFtZVxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X21ha2VDYWxsYmFja0VsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuXyRjYWxsYmFjayA9IHRoaXMuX21ha2VIaWRkZW5FbGVtZW50KHtcblx0XHRcdCduYW1lJzogc3RhdGljcy5DT05GLkpTT05QQ0FMTEJBQ0tfTkFNRSxcblx0XHRcdCd2YWx1ZSc6IHRoaXMuX3VwbG9hZGVyLmNhbGxiYWNrTmFtZVxuXHRcdH0pO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCh0aGlzLl8kY2FsbGJhY2spO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBNYWtlcyBlbGVtZW50IHRvIGtub3cgd2hpY2ggdHlwZSByZXF1ZXN0XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfbWFrZVJlc3VsdFR5cGVFbGVtZW50OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLl8kcmVzVHlwZSA9IHRoaXMuX21ha2VIaWRkZW5FbGVtZW50KHtcblx0XHRcdCduYW1lJyA6IHRoaXMuX3VwbG9hZGVyLnJlc3VsdFR5cGVFbGVtZW50TmFtZSB8fCBzdGF0aWNzLkNPTkYuUkVTUE9OU0VfVFlQRSxcblx0XHRcdCd2YWx1ZSc6IHRoaXMuX3VwbG9hZGVyLnR5cGVcblx0XHR9KTtcblx0XHR0aGlzLiRlbC5hcHBlbmQodGhpcy5fJHJlc1R5cGUpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBNYWtlIGVsZW1lbnQgdGhhdCBoYXMgcmVkaXJlY3QgcGFnZSBpbmZvcm1hdGlvbiB1c2VkIGJ5IFNlcnZlciBzaWRlLlxuXHQgKiBAcGFyYW0ge29iamVjdH0gaGVscGVyIFJlZGlyZWN0aW9uIGluZm9ybWF0aW9uIGZvciBjbGVhciB4LWRvbWFpbiBwcm9ibGVtLlxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X21ha2VCcmlkZ2VJbmZvRWxlbWVudDogZnVuY3Rpb24oaGVscGVyKSB7XG5cdFx0dGhpcy5fJGhlbHBlciA9IHRoaXMuX21ha2VIaWRkZW5FbGVtZW50KHtcblx0XHRcdCduYW1lJyA6IGhlbHBlci5uYW1lIHx8IHN0YXRpY3MuQ09ORi5SRURJUkVDVF9VUkwsXG5cdFx0XHQndmFsdWUnOiBoZWxwZXIudXJsXG5cdFx0fSk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKHRoaXMuXyRoZWxwZXIpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBNYWtlIGhpZGRlbiBpbnB1dCBlbGVtZW50IHdpdGggb3B0aW9uc1xuXHQgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBUaGUgb3BpdG9ucyB0byBiZSBhdHRyaWJ1dGUgb2YgaW5wdXRcblx0ICogQHJldHVybnMgeyp8alF1ZXJ5fVxuXHQgKiBAcHJpdmF0ZVxuICAgICAqL1x0XG5cdF9tYWtlSGlkZGVuRWxlbWVudDogZnVuY3Rpb24ob3B0aW9ucykge1xuXHRcdG5lLnV0aWwuZXh0ZW5kKG9wdGlvbnMsIHtcblx0XHRcdHR5cGU6ICdoaWRkZW4nXG5cdFx0fSk7XG5cdFx0cmV0dXJuICQoJzxpbnB1dCAvPicpLmF0dHIob3B0aW9ucyk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEFzayB1cGxvYWRlciB0byBzYXZlIGlucHV0IGVsZW1lbnQgdG8gcG9vbFxuXHQgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBpbnB1dCBBIGlucHV0IGVsZW1lbnRbdHlwZT1maWxlXSBmb3Igc3RvcmUgcG9vbFxuXHQgKi9cblx0X2Nsb25lOiBmdW5jdGlvbihpbnB1dCkge1xuXHRcdGlucHV0LmZpbGVfbmFtZSA9IGlucHV0LnZhbHVlO1xuXHRcdHRoaXMuX3VwbG9hZGVyLnN0b3JlKGlucHV0KTtcblx0fVxuXG59KTtcblxubmUudXRpbC5DdXN0b21FdmVudHMubWl4aW4oSW5wdXQpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IElucHV0O1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEl0ZW1WaWV3IG1ha2UgZWxlbWVudCB0byBkaXNwbGF5IGFkZGVkIGZpbGUgaW5mb3JtYXRpb24uIEl0IGhhcyBhdHRhY2hlZCBmaWxlIElEIHRvIHJlcXVlc3QgZm9yIHJlbW92ZS5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbnZhciBzdGF0aWNzID0gcmVxdWlyZSgnLi4vc3RhdGljcycpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuLyoqXG4gKiBDbGFzcyBvZiBpdGVtIHRoYXQgaXMgbWVtYmVyIG9mIGZpbGUgbGlzdC5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG52YXIgSXRlbSA9IG5lLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBuZS5jb21wb25lbnQuVXBsb2FkZXIuSXRlbS5wcm90b3R5cGUgKiovIHtcbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplIGl0ZW1cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xuICAgICAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5uYW1lIEZpbGUgbmFtZVxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy50eXBlIEZpbGUgdHlwZVxuICAgICAqICBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy5yb290IExpc3Qgb2JqZWN0XG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmhpZGRlbkZyYW1lIFRoZSBpZnJhbWUgbmFtZSB3aWxsIGJlIHRhcmdldCBvZiBmb3JtIHN1Ym1pdC5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMudXJsIFRoZSB1cmwgZm9yIGZvcm0gYWN0aW9uIHRvIHN1Ym1ldC5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmlkXSBVbmlxdWUga2V5LCB3aGF0IGlmIHRoZSBrZXkgaXMgbm90IGV4aXN0IGlkIHdpbGwgYmUgdGhlIGZpbGUgbmFtZS5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmhpZGRlbkZpZWxkTmFtZV0gVGhlIG5hbWUgb2YgaGlkZGVuIGZpbGVkLiBUaGUgaGlkZGVuIGZpZWxkIGlzIGZvciBjb25uZWN0aW5nIHgtZG9taWFuLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGVsZXRlQnV0dG9uQ2xhc3NOYW1lPSd1cGxvYWRlcl9idG5fZGVsZXRlJ10gVGhlIGNsYXNzIG5hbWUgaXMgZm9yIGRlbGV0ZSBidXR0b24uXG4gICAgICogIEBwYXJhbSB7KHN0cmluZ3xudW1iZXIpfSBbb3B0aW9ucy5zaXplXSBGaWxlIHNpemUgKGJ1dCBpZSBsb3cgYnJvd3NlciwgeC1kb21haW4pXG4gICAgICogIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucy5oZWxwZXJdIFRoZSBoZWxwZXIgcGFnZSBpbmZvLlxuICAgICAqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuICAgICAgICB0aGlzLl9zZXRSb290KG9wdGlvbnMpO1xuICAgICAgICB0aGlzLl9zZXRJdGVtSW5mbyhvcHRpb25zKTtcbiAgICAgICAgdGhpcy5fc2V0Q29ubmVjdEluZm8ob3B0aW9ucyk7XG5cbiAgICAgICAgdGhpcy5yZW5kZXIob3B0aW9ucy50ZW1wbGF0ZSB8fCBzdGF0aWNzLkhUTUwuaXRlbSk7XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuaGVscGVyKSB7XG4gICAgICAgICAgICB0aGlzLl9tYWtlQnJpZGdlSW5mb0VsZW1lbnQob3B0aW9ucy5oZWxwZXIpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCByb290KExpc3Qgb2JqZWN0KSBpbmZvcm1hdGlvbi5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBTYW1lIHdpdGggaW5pdCBvcHRpb25zIHBhcmFtZXRlci5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRSb290OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX3Jvb3QgPSBvcHRpb25zLnJvb3Q7XG4gICAgICAgIHRoaXMuXyRyb290ID0gb3B0aW9ucy5yb290LiRlbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGZpbGUgaW5mb3JtYXRpb24uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgU2FtZSB3aXRoIGluaXQgb3B0aW9ucyBwYXJhbWV0ZXIuXG4gICAgICovXG4gICAgX3NldEl0ZW1JbmZvOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG9wdGlvbnMubmFtZTtcbiAgICAgICAgdGhpcy5fdHlwZSA9IG9wdGlvbnMudHlwZSB8fCB0aGlzLl9leHRyYWN0RXh0ZW5zaW9uKCk7XG4gICAgICAgIHRoaXMuX2lkID0gb3B0aW9ucy5pZCB8fCBvcHRpb25zLm5hbWU7XG4gICAgICAgIHRoaXMuc2l6ZSA9IG9wdGlvbnMuc2l6ZSB8fCAnJztcbiAgICAgICAgdGhpcy5fYnRuQ2xhc3MgPSBvcHRpb25zLmRlbGV0ZUJ1dHRvbkNsYXNzTmFtZSB8fCAndXBsb2FkZXJfYnRuX2RlbGV0ZSc7XG4gICAgICAgIHRoaXMuX3VuaXQgPSBvcHRpb25zLnVuaXQgfHwgJ0tCJztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGNvbm5lY3QgZWxlbWVudCBpbmZvcm1hdGlvbi5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBTYW1lIHdpdGggaW5pdCBvcHRpb25zIHBhcmFtZXRlci5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRDb25uZWN0SW5mbzogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB0aGlzLl91cmwgPSBvcHRpb25zLnVybDtcbiAgICAgICAgdGhpcy5faGlkZGVuSW5wdXROYW1lID0gb3B0aW9ucy5oaWRkZW5GaWVsZE5hbWUgfHwgJ2ZpbGVuYW1lJztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVuZGVyIG1ha2luZyBmb3JtIHBhZGRpbmcgd2l0aCBkZWxldGFibGUgaXRlbVxuICAgICAqIEBwYXJhbSB0ZW1wbGF0ZVxuICAgICAqL1xuICAgIHJlbmRlcjogZnVuY3Rpb24odGVtcGxhdGUpIHtcbiAgICAgICAgdmFyIGh0bWwgPSB0aGlzLl9nZXRIdG1sKHRlbXBsYXRlKTtcbiAgICAgICAgdGhpcy5fJGVsID0gJChodG1sKTtcbiAgICAgICAgdGhpcy5fJHJvb3QuYXBwZW5kKHRoaXMuXyRlbCk7XG4gICAgICAgIHRoaXMuX2FkZEV2ZW50KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV4dHJhY3QgZmlsZSBleHRlbnNpb24gYnkgbmFtZVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZXh0cmFjdEV4dGVuc2lvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5hbWUuc3BsaXQoJy4nKS5wb3AoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSBlbGVtZW50IHRoYXQgaGFzIHJlZGlyZWN0IHBhZ2UgaW5mb3JtYXRpb24gdXNlZCBieSBTZXJ2ZXIgc2lkZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gaGVscGVyIFJlZGlyZWN0aW9uIGhlbHBlciBwYWdlIGluZm9ybWF0aW9uIGZvciBjbGVhciB4LWRvbWFpbiBwcm9ibGVtLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX21ha2VCcmlkZ2VJbmZvRWxlbWVudDogZnVuY3Rpb24oaGVscGVyKSB7XG4gICAgICAgIHRoaXMuJGhlbHBlciA9ICQoJzxpbnB1dCAvPicpO1xuICAgICAgICB0aGlzLiRoZWxwZXIuYXR0cih7XG4gICAgICAgICAgICAnbmFtZScgOiBoZWxwZXIubmFtZSxcbiAgICAgICAgICAgICd2YWx1ZSc6IGhlbHBlci51cmxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBpdGVtIGVsZW1lbiBIVE1MXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGh0bWwgSFRNTCB0ZW1wbGF0ZVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0SHRtbDogZnVuY3Rpb24oaHRtbCkge1xuICAgICAgICB2YXIgbWFwID0ge1xuICAgICAgICAgICAgZmlsZXR5cGU6IHRoaXMuX3R5cGUsXG4gICAgICAgICAgICBmaWxlbmFtZTogdGhpcy5uYW1lLFxuICAgICAgICAgICAgZmlsZXNpemU6IHRoaXMuc2l6ZSA/IHV0aWxzLmdldEZpbGVTaXplV2l0aFVuaXQodGhpcy5zaXplKSA6ICcnLFxuICAgICAgICAgICAgZGVsZXRlQnV0dG9uQ2xhc3NOYW1lOiB0aGlzLl9idG5DbGFzc1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB1dGlscy50ZW1wbGF0ZShtYXAsIGh0bWwpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEZXN0b3J5IGl0ZW1cbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fcmVtb3ZlRXZlbnQoKTtcbiAgICAgICAgdGhpcy5fJGVsLnJlbW92ZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnQgaGFuZGxlciBvbiBkZWxldGUgYnV0dG9uLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZEV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHF1ZXJ5ID0gJy4nICsgdGhpcy5fYnRuQ2xhc3MsXG4gICAgICAgICAgICAkZGVsQnRuID0gdGhpcy5fJGVsLmZpbmQocXVlcnkpO1xuICAgICAgICAkZGVsQnRuLm9uKCdjbGljaycsIG5lLnV0aWwuYmluZCh0aGlzLl9vbkNsaWNrRXZlbnQsIHRoaXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGV2ZW50IGhhbmRsZXIgZnJvbSBkZWxldGUgYnV0dG9uLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbW92ZUV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHF1ZXJ5ID0gJy4nICsgdGhpcy5fYnRuQ2xhc3MsXG4gICAgICAgICAgICAkZGVsQnRuID0gdGhpcy5fJGVsLmZpbmQocXVlcnkpO1xuICAgICAgICAkZGVsQnRuLm9mZignY2xpY2snKTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKiBFdmVudC1oYW5kbGUgZm9yIGRlbGV0ZSBidXR0b24gY2xpY2tlZC5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vbkNsaWNrRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZScsIHtcbiAgICAgICAgICAgIGZpbGVuYW1lIDogdGhpcy5uYW1lLFxuICAgICAgICAgICAgaWQgOiB0aGlzLl9pZCxcbiAgICAgICAgICAgIHR5cGU6ICdyZW1vdmUnXG4gICAgICAgIH0pO1xuICAgIH1cbn0pO1xuXG5uZS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihJdGVtKTtcblxubW9kdWxlLmV4cG9ydHMgPSBJdGVtOyIsIi8qKlxuICogQGZpbGVvdmVydmlldyBGaWxlTGlzdFZpZXcgbWFuYWdlIGFuZCBkaXNwbGF5IGZpbGVzIHN0YXRlKGxpa2Ugc2l6ZSwgY291bnQpIGFuZCBsaXN0LlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcbnZhciBJdGVtID0gcmVxdWlyZSgnLi9pdGVtJyk7XG5cbi8qKlxuICogTGlzdCBoYXMgaXRlbXMuIEl0IGNhbiBhZGQgYW5kIHJlbW92ZSBpdGVtLCBhbmQgZ2V0IHRvdGFsIHVzYWdlLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZhciBMaXN0ID0gbmUudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIG5lLmNvbXBvbmVudC5VcGxvYWRlci5MaXN0LnByb3RvdHlwZSAqL3tcbiAgICBpbml0IDogZnVuY3Rpb24ob3B0aW9ucywgdXBsb2FkZXIpIHtcbiAgICAgICAgdmFyIGxpc3RJbmZvID0gb3B0aW9ucy5saXN0SW5mbztcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdO1xuICAgICAgICB0aGlzLiRlbCA9IGxpc3RJbmZvLmxpc3Q7XG4gICAgICAgIHRoaXMuJGNvdW50ZXIgPSBsaXN0SW5mby5jb3VudDtcbiAgICAgICAgdGhpcy4kc2l6ZSA9IGxpc3RJbmZvLnNpemU7XG4gICAgICAgIHRoaXMuX3VwbG9hZGVyID0gdXBsb2FkZXI7XG5cbiAgICAgICAgbmUudXRpbC5leHRlbmQodGhpcywgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBpdGVtIGxpc3RcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gaW5mbyBBIGluZm9ybWF0aW9uIHRvIHVwZGF0ZSBsaXN0LlxuICAgICAqICBAcGFyYW0ge2FycmF5fSBpbmZvLml0ZW1zIFRoZSBsaXN0IG9mIGZpbGUgaW5mb3JtYXRpb24uXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBbaW5mby5hY3Rpb25dIFRoZSBhY3Rpb24gdG8gZG8uXG4gICAgICovXG4gICAgdXBkYXRlOiBmdW5jdGlvbihpbmZvKSB7XG4gICAgICAgIGlmIChpbmZvLmFjdGlvbiA9PT0gJ3JlbW92ZScpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZUZpbGVJdGVtKGluZm8ubmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9hZGRGaWxlSXRlbXMoaW5mby5pdGVtcyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW1zIHRvdGFsIGNvdW50LCB0b3RhbCBzaXplIGluZm9ybWF0aW9uLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBpbmZvIEEgaW5mb3JtYXRpb24gdG8gdXBkYXRlIGxpc3QuXG4gICAgICogIEBwYXJhbSB7YXJyYXl9IGluZm8uaXRlbXMgVGhlIGxpc3Qgb2YgZmlsZSBpbmZvcm1hdGlvbi5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IGluZm8uc2l6ZSBUaGUgdG90YWwgc2l6ZS5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IGluZm8uY291bnQgVGhlIGNvdW50IG9mIGZpbGVzLlxuICAgICAqL1xuICAgIHVwZGF0ZVRvdGFsSW5mbzogZnVuY3Rpb24oaW5mbykge1xuICAgICAgICB0aGlzLl91cGRhdGVUb3RhbENvdW50KGluZm8uY291bnQpO1xuICAgICAgICBpZiAodXRpbHMuaXNTdXBwb3J0Rm9ybURhdGEoKSkge1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlVG90YWxVc2FnZShpbmZvLnNpemUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBpdGVtcyB0b3RhbCBjb3VudCBhbmQgcmVmcmVzaCBlbGVtZW50XG4gICAgICogQHBhcmFtIHsobnVtYmVyfHN0cmluZyl9IFtjb3VudF0gVG90YWwgZmlsZSBjb3VudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwZGF0ZVRvdGFsQ291bnQ6IGZ1bmN0aW9uKGNvdW50KSB7XG5cbiAgICAgICAgaWYgKCFuZS51dGlsLmlzRXhpc3R5KGNvdW50KSkge1xuICAgICAgICAgICAgY291bnQgPSB0aGlzLml0ZW1zLmxlbmd0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuJGNvdW50ZXIuaHRtbChjb3VudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBpdGVtcyB0b3RhbCBzaXplIGFuZCByZWZyZXNoIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0geyhudW1iZXJ8c3RyaW5nKX0gc2l6ZSBUb3RhbCBmaWxlcyBzaXplc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwZGF0ZVRvdGFsVXNhZ2U6IGZ1bmN0aW9uKHNpemUpIHtcblxuICAgICAgICBpZiAoIW5lLnV0aWwuaXNFeGlzdHkoc2l6ZSkpIHtcbiAgICAgICAgICAgIHNpemUgPSB0aGlzLl9nZXRTdW1BbGxJdGVtVXNhZ2UoKTtcbiAgICAgICAgfVxuICAgICAgICBzaXplID0gdXRpbHMuZ2V0RmlsZVNpemVXaXRoVW5pdChzaXplKTtcbiAgICAgICAgdGhpcy4kc2l6ZS5odG1sKHNpemUpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdW0gc2l6ZXMgb2YgYWxsIGl0ZW1zLlxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldFN1bUFsbEl0ZW1Vc2FnZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpdGVtcyA9IHRoaXMuaXRlbXMsXG4gICAgICAgICAgICB0b3RhbFVzYWdlID0gMDtcblxuICAgICAgICBuZS51dGlsLmZvckVhY2goaXRlbXMsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIHRvdGFsVXNhZ2UgKz0gcGFyc2VGbG9hdChpdGVtLnNpemUpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdG90YWxVc2FnZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGZpbGUgaXRlbXNcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdGFyZ2V0IFRhcmdldCBpdGVtIGluZm9tYXRpb25zLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZEZpbGVJdGVtczogZnVuY3Rpb24odGFyZ2V0KSB7XG4gICAgICAgIGlmICghbmUudXRpbC5pc0FycmF5KHRhcmdldCkpIHtcbiAgICAgICAgICAgIHRhcmdldCA9IFt0YXJnZXRdO1xuICAgICAgICB9XG4gICAgICAgIG5lLnV0aWwuZm9yRWFjaCh0YXJnZXQsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCh0aGlzLl9jcmVhdGVJdGVtKGRhdGEpKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cdFx0dGhpcy5fdXBsb2FkZXIuZmlyZSgnZmlsZUFkZGVkJywge1xuXHRcdFx0dGFyZ2V0OiB0YXJnZXRcblx0XHR9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpbGUgaXRlbVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBmaWxlIG5hbWUgdG8gcmVtb3ZlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlRmlsZUl0ZW06IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgbmFtZSA9IGRlY29kZVVSSUNvbXBvbmVudChuYW1lKTtcbiAgICAgICAgdGhpcy5pdGVtcyA9IG5lLnV0aWwuZmlsdGVyKHRoaXMuaXRlbXMsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIHZhciBpc01hdGNoID0gbmFtZSA9PT0gZGVjb2RlVVJJQ29tcG9uZW50KGl0ZW0ubmFtZSk7XG4gICAgICAgICAgICBpZiAoaXNNYXRjaCkge1xuICAgICAgICAgICAgICAgIGl0ZW0uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3VwbG9hZGVyLnJlbW92ZShuYW1lKTtcblx0XHRcdFx0XHR0aGlzLl91cGxvYWRlci5maXJlKCdmaWxlUmVtb3ZlZCcsIHtcblx0XHRcdFx0XHRcdG5hbWU6IG5hbWVcblx0XHRcdFx0XHR9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAhaXNNYXRjaDtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBpdGVtIEJ5IERhdGFcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YVxuICAgICAqIEByZXR1cm5zIHtJdGVtfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NyZWF0ZUl0ZW06IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIGl0ZW0gPSBuZXcgSXRlbSh7XG4gICAgICAgICAgICByb290OiB0aGlzLFxuICAgICAgICAgICAgbmFtZTogZGF0YS5uYW1lLFxuICAgICAgICAgICAgc2l6ZTogZGF0YS5zaXplLFxuICAgICAgICAgICAgZGVsZXRlQnV0dG9uQ2xhc3NOYW1lOiB0aGlzLmRlbGV0ZUJ1dHRvbkNsYXNzTmFtZSxcbiAgICAgICAgICAgIHVybDogdGhpcy51cmwsXG4gICAgICAgICAgICBoaWRkZW5GcmFtZTogdGhpcy5mb3JtVGFyZ2V0LFxuICAgICAgICAgICAgaGlkZGVuRmllbGROYW1lOiB0aGlzLmhpZGRlbkZpZWxkTmFtZSxcbiAgICAgICAgICAgIHRlbXBsYXRlOiB0aGlzLnRlbXBsYXRlICYmIHRoaXMudGVtcGxhdGUuaXRlbVxuICAgICAgICB9KTtcbiAgICAgICAgaXRlbS5vbigncmVtb3ZlJywgdGhpcy5fcmVtb3ZlRmlsZSwgdGhpcyk7XG4gICAgICAgIHJldHVybiBpdGVtO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBSZW1vdmUgRmlsZVxuICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlRmlsZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZScsIGRhdGEpO1xuICAgIH1cbn0pO1xuXG5uZS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihMaXN0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBMaXN0OyIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIGlzIG1hbmFnZXIgb2YgaW5wdXQgZWxlbWVudHMgdGhhdCBhY3QgbGlrZSBmaWxlIHBvb2wuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG4vKipcbiAqIFRoZSBwb29sIGZvciBzYXZlIGZpbGVzLlxuICogSXQncyBvbmx5IGZvciBpbnB1dFtmaWxlXSBlbGVtZW50IHNhdmUgYXQgYnJvd3NlciB0aGF0IGRvZXMgbm90IHN1cHBvcnQgZmlsZSBhcGkuXG4gKiBAdHlwZSB7Kn1cbiAqL1xudmFyIFBvb2wgPSBuZS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgbmUuY29tcG9uZW50LlVwbG9hZGVyLlBvb2wucHJvdG90eXBlICove1xuICAgIC8qKlxuICAgICAqIGluaXRpYWxpemVcbiAgICAgKi9cbiAgICBpbml0OiBmdW5jdGlvbihwbGFuZXQpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFN1Ym1pdHRlciBmb3IgZmlsZSBlbGVtZW50IHRvIHNlcnZlclxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnBsYW5ldCA9IHBsYW5ldDtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZpbGUgZGF0YSBzdHJ1Y3R1cmUgb2JqZWN0KGtleT1uYW1lIDogdmFsdWU9aXVwdXQgZWxtZWVudCk7XG4gICAgICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZpbGVzID0ge307XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBY3RzIHBvb2wgdG8gc2F2ZSBpbnB1dCBlbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtEb2N1bWVudEZyYWdtZW50fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5mcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTYXZlIGEgaW5wdXQgZWxlbWVudFt0eXBlPWZpbGVdLCBhcyB2YWx1ZSBvZiBmaWxlIG5hbWUuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGZpbGUgQSBpbnB1dCBlbGVtZW50IHRoYXQgaGF2ZSB0byBiZSBzYXZlZFxuICAgICAqL1xuICAgIHN0b3JlOiBmdW5jdGlvbihmaWxlKSB7XG4gICAgICAgIHRoaXMuZmlsZXNbZmlsZS5maWxlX25hbWVdID0gZmlsZTtcbiAgICAgICAgdGhpcy5mcmFnLmFwcGVuZENoaWxkKGZpbGUpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBpbnB1dCBlbGVtZW50W3R5cGU9ZmlsZV0gZnJvbSBwb29sLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIEEgZmlsZSBuYW1lIHRoYXQgaGF2ZSB0byBiZSByZW1vdmVkLlxuICAgICAqL1xuICAgIHJlbW92ZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICB0aGlzLmZyYWcucmVtb3ZlQ2hpbGQodGhpcy5maWxlc1tuYW1lXSk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmZpbGVzW25hbWVdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFbXB0eSBwb29sXG4gICAgICovXG4gICAgZW1wdHk6IGZ1bmN0aW9uKCkge1xuICAgICAgICBuZS51dGlsLmZvckVhY2godGhpcy5maWxlcywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUoZGF0YS5maWxlX25hbWUpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUGxhbnQgZmlsZXMgb24gcG9vbCB0byBmb3JtIGlucHV0XG4gICAgICovXG4gICAgcGxhbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcGxhbmV0ID0gdGhpcy5wbGFuZXQ7XG4gICAgICAgIG5lLnV0aWwuZm9yRWFjaCh0aGlzLmZpbGVzLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBwbGFuZXQuYXBwZW5kQ2hpbGQoZGF0YSk7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5maWxlc1tkYXRhLmZpbGVfbmFtZV07XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBvb2w7XG4iXX0=
