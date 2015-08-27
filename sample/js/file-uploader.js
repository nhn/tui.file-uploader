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
		if (!this.$input[0].value) {
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
        this._updateTotalUsage(info.size);
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
        if (ne.util.isNumber(size) && !isNaN(size)) {
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25uZWN0b3IvYWpheC5qcyIsInNyYy9qcy9jb25uZWN0b3IvY29ubmVjdG9yLmpzIiwic3JjL2pzL2Nvbm5lY3Rvci9qc29ucC5qcyIsInNyYy9qcy9jb25uZWN0b3IvbG9jYWwuanMiLCJzcmMvanMvc3RhdGljcy5qcyIsInNyYy9qcy91cGxvYWRlci5qcyIsInNyYy9qcy91dGlscy5qcyIsInNyYy9qcy92aWV3L2RyYWcuanMiLCJzcmMvanMvdmlldy9pbnB1dC5qcyIsInNyYy9qcy92aWV3L2l0ZW0uanMiLCJzcmMvanMvdmlldy9saXN0LmpzIiwic3JjL2pzL3ZpZXcvcG9vbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm5lLnV0aWwuZGVmaW5lTmFtZXNwYWNlKCduZS5jb21wb25lbnQuVXBsb2FkZXInLCByZXF1aXJlKCcuL3NyYy9qcy91cGxvYWRlci5qcycpKTtcblxuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgQ29ubmVjdG9yIG1ha2UgY29ubmVjdGlvbiBiZXR3ZWVuIEZpbGVNYW5hZ2VyIGFuZCBmaWxlIHNlcnZlciBhcGkgYXQgbW9kZXJuIGJyb3dzZXIuPGJyPlxuICogICAgIFRoaXMgQ29ubmVjdG9yIHVzZSBhamF4LlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxuLyoqXG4gKiBUaGUgbW9kdWxlcyB3aWxsIGJlIG1peGVkIGluIGNvbm5lY3RvciBieSB0eXBlLlxuICovXG52YXIgQWpheCA9IHsvKiogQGxlbmRzIG5lLmNvbXBvbmVudC5VcGxvYWRlci5BamF4ICovXG4gICAgdHlwZTogJ1BPU1QnLFxuICAgIC8qKlxuICAgICAqIFJlcXVlc3QgYWpheCBieSBjb25maWcgdG8gYWRkIGZpbGVzLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWcgVGhlIGNvbmZpZ3VyYXRpb24gZm9yIGFqYXggcmVxdWVzdFxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gY29uZmlnLnVybCBSZXF1ZXN0IHVybCh1cGxvYWQgdXJsIG9yIHJlbW92ZSB1cmwpXG4gICAgICogIEBwYXJhbSB7ZnVuY3Rpb259IGNvbmZpZy5zdWNjZXNzIENhbGxiYWNrIGZ1bmN0aW9uIHdoZW4gcmVxdWVzdCBzdWNlZXNzLlxuICAgICAqICBAcGFyYW0ge2Z1bmN0aW9ufSBjb25maWcuZXJyb3IgQ2FsbGJhY2sgZnVuY3Rpb24gd2hlbiByZXF1ZXN0IGZhaWxkLlxuICAgICAqL1xuICAgIGFkZFJlcXVlc3Q6IGZ1bmN0aW9uKGNvbmZpZywgZmlsZXMpIHtcbiAgICAgICAgdmFyIHVwbG9hZGVyID0gdGhpcy5fdXBsb2FkZXIsXG4gICAgICAgICAgICAkZm9ybSA9IHVwbG9hZGVyLmlucHV0Vmlldy4kZWwsXG4gICAgICAgICAgICBjYWxsYmFjayA9IG5lLnV0aWwuYmluZCh0aGlzLnN1Y2Nlc3NQYWRkaW5nLCB0aGlzLCBjb25maWcuc3VjY2Vzcyk7XG4gICAgXG5cdFx0aWYgKGZpbGVzKSB7XG5cdFx0XHR0aGlzLmZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG5cdFx0XHRuZS51dGlsLmZvckVhY2goZmlsZXMsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0dGhpcy5mb3JtRGF0YS5hcHBlbmQodXBsb2FkZXIuZmlsZUZpZWxkLCBlKTtcblx0XHRcdH0sIHRoaXMpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCRmb3JtWzBdKTtcblx0XHR9XG5cdFx0JC5hamF4KHtcbiAgICAgICAgICAgIHVybDogdGhpcy5fdXBsb2FkZXIudXJsLnNlbmQsXG4gICAgICAgICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICAgICAgICBkYXRhOiB0aGlzLmZvcm1EYXRhLFxuICAgICAgICAgICAgc3VjY2VzczogY2FsbGJhY2ssXG4gICAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgICBjb250ZW50VHlwZTogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogY29uZmlnLmVycm9yXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcmVwcm9jZXNzaW5nIGNhbGxiYWNrIGJlZm9yZSBjYWxsYmFjayBydW4uXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgUmVxdWVzdCBDYWxsYmFjayBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSBSZXNwb25zZSBmcm9tIHNlcnZlclxuICAgICAqL1xuICAgIHN1Y2Nlc3NQYWRkaW5nOiBmdW5jdGlvbihjYWxsYmFjaywgcmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIGpzb24gPSBKU09OLnBhcnNlKHJlc3BvbnNlKSxcbiAgICAgICAgICAgIHJlc3VsdCA9IHt9O1xuXG4gICAgICAgIHJlc3VsdC5pdGVtcyA9IGpzb24uZmlsZWxpc3Q7XG4gICAgICAgIGNhbGxiYWNrKHJlc3VsdCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlcXVlc3QgYWpheCBieSBjb25maWcgdG8gcmVtb3ZlIGZpbGUuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGNvbmZpZ1xuICAgICAqL1xuICAgIHJlbW92ZVJlcXVlc3Q6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBuZS51dGlsLmJpbmQodGhpcy5yZW1vdmVQYWRkaW5nLCB0aGlzLCBjb25maWcuc3VjY2Vzcyk7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHRoaXMuX3VwbG9hZGVyLnVybC5yZW1vdmUsXG4gICAgICAgICAgICBkYXRhOiBjb25maWcuZGF0YSxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGNhbGxiYWNrLFxuICAgICAgICAgICAgZXJyb3I6IGNvbmZpZy5lcnJvclxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJlcHJvY2Vzc2luZyByZXNwb25zZSBiZWZvcmUgY2FsbGJhY2sgcnVuLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFJlcXVlc3QgQ2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgUmVzcG9uc2UgZnJvbSBzZXJ2ZXJcbiAgICAgKi9cbiAgICByZW1vdmVQYWRkaW5nOiBmdW5jdGlvbihjYWxsYmFjaywgcmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIGpzb24gPSBKU09OLnBhcnNlKHJlc3BvbnNlKSxcbiAgICAgICAgICAgIHJlc3VsdCA9IHt9O1xuXG4gICAgICAgIHJlc3VsdC5hY3Rpb24gPSAncmVtb3ZlJztcbiAgICAgICAgcmVzdWx0Lm5hbWUgPSBkZWNvZGVVUklDb21wb25lbnQoanNvbi5uYW1lKTtcblxuICAgICAgICBjYWxsYmFjayhyZXN1bHQpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQWpheDsiLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgQSBDb25uZWN0b3IgbWFrZSBjb25uZWN0aW9uIGJldHdlZW4gRmlsZU1hbmFnZXIgYW5kIGZpbGUgc2VydmVyIEFQSS48YnI+IFRoZSBDb25uZWN0b3IgaXMgaW50ZXJmYWNlLlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxudmFyIEFqYXggPSByZXF1aXJlKCcuL2FqYXgnKTtcbnZhciBKc29ucCA9IHJlcXVpcmUoJy4vanNvbnAnKTtcbnZhciBMb2NhbCA9IHJlcXVpcmUoJy4vbG9jYWwnKTtcblxuLyoqXG4gKiBUaGUgY29ubmVjdG9yIGNsYXNzIGNvdWxkIGNvbm5lY3Qgd2l0aCBzZXJ2ZXIgYW5kIHJldHVybiBzZXJ2ZXIgcmVzcG9uc2UgdG8gY2FsbGJhY2suXG4gKi9cbnZhciBNb2R1bGVTZXRzID0ge1xuICAgICdhamF4JzogQWpheCxcbiAgICAnanNvbnAnOiBKc29ucCxcbiAgICAnbG9jYWwnOiBMb2NhbFxufTtcblxuLyoqXG4gKiBUaGlzIGlzIEludGVyZmFjZSB0byBiZSBpbXBsZW1lbnRlZCBieSBjb25uZWN0b3JzXG4gKi9cbnZhciBDb25uZWN0b3IgPSB7XG4gICAgLyoqXG4gICAgICogQSBpbnRlcmZhY2UgcmVtb3ZlUmVxdWVzdCB0byBpbXBsZW1lbnRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBBIGluZm9ybWF0aW9uIGZvciBkZWxldGUgZmlsZVxuICAgICAqL1xuICAgIHJlbW92ZVJlcXVlc3Q6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgaW50ZXJmYWNlIHJlbW92ZVJlcXVlc3QgZG9lcyBub3QgZXhpc3QnKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQSBpbnRlcmZhY2UgYWRkUmVxdWVzdCB0byBpbXBsZW1lbnRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBBIGluZm9ybWF0aW9uIGZvciBhZGQgZmlsZVxuICAgICAqL1xuICAgIGFkZFJlcXVlc3Q6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgaW50ZXJmYWNlIGFkZFJlcXVlc3QgZG9lcyBub3QgZXhpc3QnKTtcbiAgICB9XG5cbn07XG5cbi8qKlxuICogVGhlIGZhY3RvcnkgbW9kdWxlIGZvciBjb25uZWN0b3JzLlxuICogR2V0IGVhY2ggY29ubmVjdG9yIGJ5IGVhY2ggdHlwZS5cbiAqL1xudmFyIEZhY3RvcnkgPSB7XG4gICAgLyoqXG4gICAgICogQ2hvb3NlIGNvbm5lY3RvclxuICAgICAqIEBwYXJhbSB1cGxvYWRlclxuICAgICAqIEByZXR1cm5zIHt7X3VwbG9hZGVyOiAqfX1cbiAgICAgKi9cbiAgICBnZXRDb25uZWN0b3I6IGZ1bmN0aW9uKHVwbG9hZGVyKSB7XG4gICAgICAgIHZhciB0eXBlID0gdXBsb2FkZXIudHlwZS50b0xvd2VyQ2FzZSgpLFxuICAgICAgICAgICAgY29ubiA9IHtcbiAgICAgICAgICAgICAgICBfdXBsb2FkZXI6IHVwbG9hZGVyXG4gICAgICAgICAgICB9O1xuICAgICAgICBuZS51dGlsLmV4dGVuZChjb25uLCBDb25uZWN0b3IsIE1vZHVsZVNldHNbdHlwZV0gfHwgTG9jYWwpO1xuICAgICAgICByZXR1cm4gY29ubjtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZhY3Rvcnk7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgVGhpcyBDb25uZWN0b3IgbWFrZSBjb25uZWN0aW9uIGJldHdlZW4gRmlsZU1hbmFnZXIgYW5kIGZpbGUgc2VydmVyIGFwaSBhdCBvbGQgYnJvd3Nlci48YnI+XG4gKiAgICAgVGhpcyBDb25uZWN0b3IgdXNlIGhpZGRlbiBpZnJhbWUuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG4vKipcbiAqIFRoZSBtb2R1bGVzIHdpbGwgYmUgbWl4ZWQgaW4gY29ubmVjdG9yIGJ5IHR5cGUuXG4gKi9cbnZhciBKc29ucCA9IHsvKiogQGxlbmRzIG5lLmNvbXBvbmVudC5VcGxvYWRlci5Kc29ucCAqL1xuICAgIC8qKlxuICAgICAqIFJlcXVlc3QgYnkgZm9ybSBzdWJtaXQuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGNvbmZpZyBDb25maWd1cmF0aW9uIGZvciBzdWJtaXQgZm9ybS5cbiAgICAgKiAgQHBhcmFtIHtmdW5jdGlvbn0gY29uZmlnLnN1Y2Nlc3MgQ2FsbGJhY2sgd2hlbiBwb3N0IHN1Ym1pdCBjb21wbGF0ZS5cbiAgICAgKi9cbiAgICBhZGRSZXF1ZXN0OiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrTmFtZSA9IHRoaXMuX3VwbG9hZGVyLmNhbGxiYWNrTmFtZSxcbiAgICAgICAgY2FsbGJhY2sgPSBjb25maWcuc3VjY2VzcztcbiAgICAgICAgbmUudXRpbC5kZWZpbmVOYW1lc3BhY2UoY2FsbGJhY2tOYW1lLCAgbmUudXRpbC5iaW5kKHRoaXMuc3VjY2Vzc1BhZGRpbmcsIHRoaXMsIGNhbGxiYWNrKSk7XG5cblx0XHR0aGlzLl91cGxvYWRlci5pbnB1dFZpZXcuJGVsLnN1Ym1pdCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcmVwcm9jZXNzaW5nIHJlc3BvbnNlIGJlZm9yZSBjYWxsYmFjayBydW4uXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgUmVxdWVzdCBDYWxsYmFjayBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSBSZXNwb25zZSBmcm9tIHNlcnZlclxuICAgICAqL1xuICAgIHN1Y2Nlc3NQYWRkaW5nOiBmdW5jdGlvbihjYWxsYmFjaywgcmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuXG5cdFx0aWYgKHRoaXMuX3VwbG9hZGVyLmlzQ3Jvc3NEb21haW4oKSkge1xuICAgICAgICAgICAgcmVzdWx0Lml0ZW1zID0gdGhpcy5fZ2V0U3BsaXRJdGVtcyhyZXNwb25zZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQuaXRlbXMgPSBuZS51dGlsLnRvQXJyYXkocmVzcG9uc2UuZmlsZWxpc3QpO1xuICAgICAgICB9XG5cbiAgICAgICAgY2FsbGJhY2socmVzdWx0KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSBxdWVyeSBkYXRhIHRvIGFycmF5XG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgVGhlIERhdGEgZXh0cmFjdGVkIGZyb20gcXVlcnlzdHJpbmcgc2VwYXJhdGVkIGJ5ICcmJ1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldFNwbGl0SXRlbXM6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIHNlcCA9IHRoaXMuX3VwbG9hZGVyLnNlcGFyYXRvcixcbiAgICAgICAgICAgIHN0YXR1cyA9IGRhdGEuc3RhdHVzLnNwbGl0KHNlcCksXG4gICAgICAgICAgICBuYW1lcyA9IGRhdGEubmFtZXMuc3BsaXQoc2VwKSxcbiAgICAgICAgICAgIHNpemVzID0gZGF0YS5zaXplcy5zcGxpdChzZXApLFxuICAgICAgICAgICAgaWRzID0gbmUudXRpbC5pc1N0cmluZyhkYXRhLmlkcykgPyBkYXRhLmlkcy5zcGxpdChzZXApIDogbmFtZXMsXG4gICAgICAgICAgICBpdGVtcyA9IFtdO1xuXG4gICAgICAgIG5lLnV0aWwuZm9yRWFjaChzdGF0dXMsIGZ1bmN0aW9uKGl0ZW0sIGluZGV4KSB7XG4gICAgICAgICAgICBpZiAoaXRlbSA9PT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5JdGVtID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBuYW1lc1tpbmRleF0sXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czogc3RhdHVzW2luZGV4XSxcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogc2l6ZXNbaW5kZXhdLFxuICAgICAgICAgICAgICAgICAgICBpZDogaWRzW2luZGV4XVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaXRlbXMucHVzaChuSXRlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaXRlbXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlcXVlc3QgYWpheCBieSBjb25maWcgdG8gcmVtb3ZlIGZpbGUuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGNvbmZpZ1xuICAgICAqL1xuICAgIHJlbW92ZVJlcXVlc3Q6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgICB2YXIgY2FsbGJhY2tOYW1lID0gdGhpcy5fdXBsb2FkZXIuY2FsbGJhY2tOYW1lLFxuICAgICAgICAgICAgZGF0YSA9IHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjazogY2FsbGJhY2tOYW1lXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2FsbGJhY2sgPSBjb25maWcuc3VjY2VzcztcblxuICAgICAgICBuZS51dGlsLmRlZmluZU5hbWVzcGFjZShjYWxsYmFja05hbWUsIG5lLnV0aWwuYmluZCh0aGlzLnJlbW92ZVBhZGRpbmcsIHRoaXMsIGNhbGxiYWNrKSwgdHJ1ZSk7XG5cbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogdGhpcy5fdXBsb2FkZXIudXJsLnJlbW92ZSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbnAnLFxuICAgICAgICAgICAganNvbnA6IGNhbGxiYWNrTmFtZSxcbiAgICAgICAgICAgIGRhdGE6IG5lLnV0aWwuZXh0ZW5kKGRhdGEsIGNvbmZpZy5kYXRhKVxuICAgICAgICB9KTtcblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcmVwcm9jZXNzaW5nIHJlc3BvbnNlIGJlZm9yZSBjYWxsYmFjayBydW4uXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgUmVxdWVzdCBDYWxsYmFjayBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSBSZXNwb25zZSBmcm9tIHNlcnZlclxuICAgICAqL1xuICAgIHJlbW92ZVBhZGRpbmc6IGZ1bmN0aW9uKGNhbGxiYWNrLCByZXNwb25zZSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICAgIHJlc3VsdC5hY3Rpb24gPSAncmVtb3ZlJztcbiAgICAgICAgcmVzdWx0Lm5hbWUgPSBkZWNvZGVVUklDb21wb25lbnQocmVzcG9uc2UubmFtZSk7XG5cbiAgICAgICAgY2FsbGJhY2socmVzdWx0KTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEpzb25wO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXZpZXcgVGhpcyBDb25uZWN0b3IgbWFrZSBjb25uZWN0aW9uIGJldHdlZW4gVXBsb2FkZXIgYW5kIGh0bWw1IGZpbGUgYXBpLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cbi8qKlxuICogVGhlIG1vZHVsZXMgd2lsbCBiZSBtaXhlZCBpbiBjb25uZWN0b3IgYnkgdHlwZS5cbiAqL1xudmFyIExvY2FsID0gey8qKiBAbGVuZHMgbmUuY29tcG9uZW50LlVwbG9hZGVyLkxvY2FsICovXG4gICAgLyoqXG4gICAgICogQSByZXN1bHQgYXJyYXkgdG8gc2F2ZSBmaWxlIHRvIHNlbmQuXG4gICAgICovXG4gICAgX3Jlc3VsdCA6IG51bGwsXG4gICAgLyoqXG4gICAgICogQWRkIFJlcXVlc3QsIHNhdmUgZmlsZXMgdG8gYXJyYXkuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgVGhlIGRhdGEgb2YgY29ubmVjdGlvbiBmb3Igc2VydmVyXG5cdFx0ICogQHBhcmFtIHtvYmplY3R9IFtmaWxlc10gVGhlIGZpbGVzIHRvIHNhdmVcbiAgICAgKi9cbiAgICBhZGRSZXF1ZXN0OiBmdW5jdGlvbihkYXRhLCBmaWxlcykge1xuICAgICAgICB2YXIgaXNWYWxpZFBvb2wgPSB1dGlscy5pc1N1cHBvcnRGb3JtRGF0YSgpLFxuICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5fc2F2ZUZpbGUoaXNWYWxpZFBvb2wsIGZpbGVzKTtcbiAgICAgICAgZGF0YS5zdWNjZXNzKHtcbiAgICAgICAgICAgIGl0ZW1zOiByZXN1bHRcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNhdmUgZmlsZSB0byBwb29sXG4gICAgICogQHBhcmFtIHtib29sZWFufSBpc1N1cHBvcnRBamF4IFdoZXRoZXIgRm9ybURhdGEgaXMgc3VwcG9ydGVkIG9yIG5vdFxuXHRcdCAqIEBwYXJhbSB7b2JqZWN0fSBbZmlsZXNdIFRoZSBmaWxlcyB0byBzYXZlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2F2ZUZpbGU6IGZ1bmN0aW9uKGlzU3VwcG9ydEFqYXgsIGZpbGVzKSB7XG4gICAgICAgIHZhciB1cGxvYWRlciA9IHRoaXMuX3VwbG9hZGVyLFxuICAgICAgICAgICAgaW5wdXRWaWV3ID0gdXBsb2FkZXIuaW5wdXRWaWV3LFxuICAgICAgICAgICAgZmlsZUVsID0gaW5wdXRWaWV3LiRpbnB1dFswXSxcblx0XHRcdFx0XHRcdHJlc3VsdCA9IFtdO1xuXG4gICAgICAgIGlmICghdGhpcy5fcmVzdWx0KSB7XG4gICAgICAgICAgICB0aGlzLl9yZXN1bHQgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc1N1cHBvcnRBamF4KSB7XG4gICAgICAgICAgICBmaWxlcyA9IGZpbGVzIHx8IGZpbGVFbC5maWxlcztcbiAgICAgICAgICAgIG5lLnV0aWwuZm9yRWFjaChmaWxlcywgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgICAgIGlmIChuZS51dGlsLmlzT2JqZWN0KGl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goe1xuICAgICAgICAgICAgICAgIG5hbWU6IGZpbGVFbC52YWx1ZSxcbiAgICAgICAgICAgICAgICBlbGVtZW50OiBmaWxlRWxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cblx0XHR0aGlzLl9yZXN1bHQgPSB0aGlzLl9yZXN1bHQuY29uY2F0KHJlc3VsdCk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2VzIGZvcm0gZGF0YSB0byBzZW5kIFBPU1QoRm9ybURhdGUgc3VwcG9ydGVkIGNhc2UpXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbWFrZUZvcm1EYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHVwbG9hZGVyID0gdGhpcy5fdXBsb2FkZXIsXG5cdFx0ZmllbGQgPSB1cGxvYWRlci5maWxlRmllbGQsXG5cdFx0aW5wdXQgPSB1cGxvYWRlci5pbnB1dFZpZXcsXG5cdFx0Zm9ybSA9IG5ldyB3aW5kb3cuRm9ybURhdGEodGhpcy5fZXh0cmFjdEZvcm0oaW5wdXQpKTtcblxuICAgICAgICBuZS51dGlsLmZvckVhY2godGhpcy5fcmVzdWx0LCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICBmb3JtLmFwcGVuZChmaWVsZCwgaXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZm9ybTtcbiAgICB9LFxuXG5cdC8qKlxuXHQgKiBFeHRyYWN0cyBGb3JtIGZyb20gaW5wdXRWaWV3XG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBpbnB1dCBUaGUgaW5wdXQgdmlldyBmb3IgZXh0cmFjdGluZyBcblx0ICovXG5cdF9leHRyYWN0Rm9ybTogZnVuY3Rpb24oaW5wdXQpIHtcblx0dmFyIGZvcm0gPSBpbnB1dC4kZWwuY2xvbmUoKTtcblx0XHQvLyBhcHBlbmQgdG8gcG9vbFxuXHRcdHJldHVybiBmb3JtWzBdO1xuXHR9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpbGUgZm9ybSByZXN1bHQgYXJyYXlcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gaW5mbyBUaGUgaW5mb3JtYXRpb24gc2V0IHRvIHJlbW92ZSBmaWxlXG4gICAgICovXG4gICAgcmVtb3ZlUmVxdWVzdDogZnVuY3Rpb24oaW5mbykge1xuICAgICAgICB2YXIgZGF0YSA9IGluZm8uZGF0YTtcbiAgICAgICAgdGhpcy5fcmVzdWx0ID0gbmUudXRpbC5maWx0ZXIodGhpcy5fcmVzdWx0LCBmdW5jdGlvbihlbCkge1xuICAgICAgICAgICAgcmV0dXJuIGVsLm5hbWUgIT09IGRhdGEuZmlsZW5hbWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGluZm8uc3VjY2Vzcyh7XG4gICAgICAgICAgICBhY3Rpb246ICdyZW1vdmUnLFxuICAgICAgICAgICAgbmFtZTogZGF0YS5maWxlbmFtZVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2VuZCBmaWxlcyBpbiBhIGJhdGNoLlxuICAgICAqIEBwYXJhbSBjYWxsYmFja1xuICAgICAqL1xuICAgIHN1Ym1pdDogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGZvcm0gPSB0aGlzLl9tYWtlRm9ybURhdGEoaW5wdXRWaWV3KTtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogdGhpcy5fdXBsb2FkZXIudXJsLnNlbmQsXG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICBkYXRhOiBmb3JtLFxuICAgICAgICAgICAgc3VjY2VzczogY2FsbGJhY2ssXG4gICAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgICBjb250ZW50VHlwZTogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBMb2NhbDsiLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29uZmlndXJhdGlvbiBvciBkZWZhdWx0IHZhbHVlcy5cbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbi8qKlxuICogQ29uZmlndXJhdGlvbiBvZiBjb25uZWN0aW9uIHdpdGggc2VydmVyLlxuICAqIEB0eXBlIHt7UkVTUE9OU0VfVFlQRTogc3RyaW5nLCBSRURJUkVDVF9VUkw6IHN0cmluZ319XG4gKi9cbm1vZHVsZS5leHBvcnRzLkNPTkYgPSB7XG5cdFJFU1BPTlNFX1RZUEU6ICdSRVNQT05TRV9UWVBFJyxcblx0UkVESVJFQ1RfVVJMOiAnUkVESVJFQ1RfVVJMJyxcblx0SlNPTlBDQUxMQkFDS19OQU1FOiAnQ0FMTEJBQ0tfTkFNRScsXG5cdFNJWkVfVU5JVDogJ1NJWkVfVU5JVCcsXG5cdFJFTU9WRV9DQUxMQkFDSyA6ICdyZXNwb25zZVJlbW92ZUNhbGxiYWNrJyxcblx0RVJST1I6IHtcblx0XHRERUZBVUxUOiAnVW5rbm93biBlcnJvci4nLFxuXHRcdE5PVF9TVVJQUE9SVDogJ1RoaXMgaXMgeC1kb21haW4gY29ubmVjdGlvbiwgeW91IGhhdmUgdG8gbWFrZSBoZWxwZXIgcGFnZS4nXG5cdH0sXG5cdERSQUdfREVGQVVMVF9FTkFCTEVfQ0xBU1M6ICdlbmFibGVDbGFzcycsXG5cdEZJTEVfRklMRURfTkFNRTogJ3VzZXJmaWxlW10nLFxuXHRGT0xERVJfSU5GTzogJ2ZvbGRlck5hbWUnXG59O1xuXG4vKipcbiogRGVmYXVsdCBIdG1sc1xuKiBAdHlwZSB7e2lucHV0OiBzdHJpbmcsIGl0ZW06IHN0cmluZ319XG4qL1xubW9kdWxlLmV4cG9ydHMuSFRNTCA9IHtcblx0Zm9ybTogWyc8Zm9ybSBlbmN0eXBlPVwibXVsdGlwYXJ0L2Zvcm0tZGF0YVwiIGlkPVwiZm9ybURhdGFcIiBtZXRob2Q9XCJwb3N0XCI+Jyxcblx0XHQnPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwiTUFYX0ZJTEVfU0laRVwiIHZhbHVlPVwiMzAwMDAwMFwiIC8+Jyxcblx0JzwvZm9ybT4nXS5qb2luKCcnKSxcblx0aW5wdXQ6IFsnPGlucHV0IHR5cGU9XCJmaWxlXCIgaWQ9XCJmaWxlQXR0YWNoXCIge3t3ZWJraXRkaXJlY3Rvcnl9fSBuYW1lPVwie3tmaWxlRmllbGR9fVwiIHt7bXVsdGlwbGV9fSAvPiddLmpvaW4oJycpLFxuXHRzdWJtaXQ6IFsnPGJ1dHRvbiBjbGFzcz1cImJhdGNoU3VibWl0XCIgdHlwZT1cInN1Ym1pdFwiPlNFTkQ8L2J1dHRvbj4nXS5qb2luKCcnKSxcblx0aXRlbTogWyc8bGkgY2xhc3M9XCJmaWxldHlwZURpc3BsYXlDbGFzc1wiPicsXG5cdFx0JzxzcG5hIGNsYXNzPVwiZmlsZWljb24ge3tmaWxldHlwZX19XCI+e3tmaWxldHlwZX19PC9zcG5hPicsXG5cdFx0JzxzcGFuIGNsYXNzPVwiZmlsZV9uYW1lXCI+e3tmaWxlbmFtZX19PC9zcGFuPicsXG5cdFx0JzxzcGFuIGNsYXNzPVwiZmlsZV9zaXplXCI+e3tmaWxlc2l6ZX19PC9zcGFuPicsXG5cdFx0JzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwie3tkZWxldGVCdXR0b25DbGFzc05hbWV9fVwiPkRlbGV0ZTwvYnV0dG9uPicsXG5cdFx0JzwvbGk+J10uam9pbignJyksXG5cdGRyYWc6IFsnPGRpdiBjbGFzcz1cImRyYWd6b25lXCI+PC9kaXY+J10uam9pbignJylcbn07XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmlsZVVwbG9hZGVyIGlzIGNvcmUgb2YgZmlsZSB1cGxvYWRlciBjb21wb25lbnQuPGJyPkZpbGVNYW5hZ2VyIG1hbmFnZSBjb25uZWN0b3IgdG8gY29ubmVjdCBzZXJ2ZXIgYW5kIHVwZGF0ZSBGaWxlTGlzdFZpZXcuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG52YXIgc3RhdGljcyA9IHJlcXVpcmUoJy4vc3RhdGljcycpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIGNvbm4gPSByZXF1aXJlKCcuL2Nvbm5lY3Rvci9jb25uZWN0b3InKTtcbnZhciBJbnB1dCA9IHJlcXVpcmUoJy4vdmlldy9pbnB1dCcpO1xudmFyIExpc3QgPSByZXF1aXJlKCcuL3ZpZXcvbGlzdCcpO1xudmFyIFBvb2wgPSByZXF1aXJlKCcuL3ZpZXcvcG9vbCcpO1xudmFyIERyYWdBbmREcm9wID0gcmVxdWlyZSgnLi92aWV3L2RyYWcnKTtcblxuLyoqXG4gKiBGaWxlVXBsb2FkZXIgYWN0IGxpa2UgYnJpZGdlIGJldHdlZW4gY29ubmVjdG9yIGFuZCB2aWV3LlxuICogSXQgbWFrZXMgY29ubmVjdG9yIGFuZCB2aWV3IHdpdGggb3B0aW9uIGFuZCBlbnZpcm9ubWVudC5cbiAqIEl0IGNvbnRyb2wgYW5kIG1ha2UgY29ubmVjdGlvbiBhbW9uZyBtb2R1bGVzLlxuICogQGNvbnN0cnVjdG9yIG5lLmNvbXBvbmVudC5VcGxvYWRlclxuICogQGV4YW1wbGVcbiAqIHZhciB1cGxvYWRlciA9IG5ldyBuZS5jb21wb25lbnQuVXBsb2FkZXIoe1xuICogICAgIHVybDoge1xuICogICAgICAgICBzZW5kOiBcImh0dHA6Ly9mZS5uaG5lbnQuY29tL2V0Yy9ldGMvdXBsb2FkZXIvdXBsb2FkZXIucGhwXCIsXG4gKiAgICAgICAgIHJlbW92ZTogXCJodHRwOi8vZmUubmhuZW50LmNvbS9ldGMvZXRjL3VwbG9hZGVyL3JlbW92ZS5waHBcIlxuICogICAgIH0sXG4gKiAgICAgaGVscGVyOiB7XG4gKiAgICAgICAgIHVybDogJ2h0dHA6Ly8xMC43Ny4zNC4xMjY6ODAwOS9zYW1wbGVzL3Jlc3BvbnNlLmh0bWwnLFxuICogICAgICAgICBuYW1lOiAnUkVESVJFQ1RfVVJMJ1xuICogICAgIH0sXG4gKiAgICAgcmVzdWx0VHlwZUVsZW1lbnROYW1lOiAnUkVTUE9OU0VfVFlQRScsXG4gKiAgICAgZm9ybVRhcmdldDogJ2hpZGRlbkZyYW1lJyxcbiAqICAgICBjYWxsYmFja05hbWU6ICdyZXNwb25zZUNhbGxiYWNrJyxcbiAqICAgICBsaXN0SW5mbzoge1xuICogICAgICAgICBsaXN0OiAkKCcjZmlsZXMnKSxcbiAqICAgICAgICAgY291bnQ6ICQoJyNmaWxlX2NvdW50JyksXG4gKiAgICAgICAgIHNpemU6ICQoJyNzaXplX2NvdW50JylcbiAqICAgICB9LFxuICogICAgIHNlcGFyYXRvcjogJzsnXG4gKiB9LCAkKCcjdXBsb2FkZXInKSk7XG4gKi9cbnZhciBVcGxvYWRlciA9IG5lLnV0aWwuZGVmaW5lQ2xhc3MoLyoqQGxlbmRzIG5lLmNvbXBvbmVudC5VcGxvYWRlci5wcm90b3R5cGUgKi97XG5cblx0LyoqXG5cdCAqIGluaXRpYWxpemUgb3B0aW9uc1xuXHQgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBUaGUgb3B0aW9ucyB0byBzZXQgdXAgZmlsZSB1cGxvYWRlciBtb2R1bGVzLlxuXHQgKiAgQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMudXJsIFRoZSB1cmwgaXMgZmlsZSBzZXJ2ZXIuXG5cdCAqICAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMudXJsLnNlbmQgVGhlIHVybCBpcyBmb3IgZmlsZSBhdHRhY2guXG5cdCAqICAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMudXJsLnJlbW92ZSBUaGUgdXJsIGlzIGZvciBmaWxlIGRldGFjaC5cblx0ICogIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLmhlbHBlciBUaGUgaGVscGVyIG9iamVjdCBpbmZvIGlzIGZvciB4LWRvbWFpbi5cblx0ICogICAgICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5oZWxwZXIudXJsIFRoZSB1cmwgaXMgaGVscGVyIHBhZ2UgdXJsLlxuXHQgKiAgICAgIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmhlbHBlci5uYW1lIFRoZSBuYW1lIG9mIGhpZGRlbiBlbGVtZW50IGZvciBzZW5kaW5nIHNlcnZlciBoZWxwZXIgcGFnZSBpbmZvcm1hdGlvbi5cblx0ICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnJlc3VsdFR5cGVFbGVtZW50TmFtZSBUaGUgdHlwZSBvZiBoaWRkZW4gZWxlbWVudCBmb3Igc2VuZGluZyBzZXJ2ZXIgcmVzcG9uc2UgdHlwZSBpbmZvcm1hdGlvbi5cblx0ICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmZvcm1UYXJnZXQgVGhlIHRhcmdldCBmb3IgeC1kb21haW4ganNvbnAgY2FzZS5cblx0ICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmNhbGxiYWNrTmFtZSBUaGUgbmFtZSBvZiBqc29ucCBjYWxsYmFjayBmdW5jdGlvbi5cblx0ICogIEBwYXJhbSB7b2JqZWN0fSBvcGl0b25zLmxpc3RJbmZvIFRoZSBlbGVtZW50IGluZm8gdG8gZGlzcGxheSBmaWxlIGxpc3QgaW5mb3JtYXRpb24uXG5cdCAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5zZXBhcmF0b3IgVGhlIHNlcGFyYXRvciBmb3IganNvbnAgaGVscGVyIHJlc3BvbnNlLlxuXHQgKiAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmZpbGVGaWVsZD11c2VyRmlsZV0gVGhlIGZpZWxkIG5hbWUgb2YgaW5wdXQgZmlsZSBlbGVtZW50LlxuXHQgKiAgQHBhcmFtIHtib29sZWFufSBvcHRpb25zLnVzZUZvbGRlciBXaGV0aGVyIHNlbGVjdCB1bml0IGlzIGZvbGRlciBvZiBub3QuIElmIHRoaXMgaXMgdHVyZSwgbXVsdGlwbGUgd2lsbCBiZSBpZ25vcmVkLlxuXHQgKiAgQHBhcmFtIHtib29sZWFufSBvcHRpb25zLmlzTXVsdGlwbGUgV2hldGhlciBlbmFibGUgbXVsdGlwbGUgc2VsZWN0IG9yIG5vdC5cblx0ICogQHBhcmFtIHtKcXVlcnlPYmplY3R9ICRlbCBSb290IEVsZW1lbnQgb2YgVXBsb2FkZXJcblx0ICovXG5cdGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMsICRlbCkge1xuXHRcdHRoaXMuX3NldERhdGEob3B0aW9ucyk7XG5cdFx0dGhpcy5fc2V0Q29ubmVjdG9yKCk7XG5cblx0XHR0aGlzLiRlbCA9ICRlbDtcblxuXHRcdGlmKHRoaXMudXNlRHJhZyAmJiAhdGhpcy51c2VGb2xkZXIgJiYgdXRpbHMuaXNTdXBwb3J0RmlsZVN5c3RlbSgpKSB7XG5cdFx0XHR0aGlzLmRyYWdWaWV3ID0gbmV3IERyYWdBbmREcm9wKG9wdGlvbnMsIHRoaXMpO1xuXHRcdH1cblxuXHRcdHRoaXMuaW5wdXRWaWV3ID0gbmV3IElucHV0KG9wdGlvbnMsIHRoaXMpO1xuXHRcdHRoaXMubGlzdFZpZXcgPSBuZXcgTGlzdChvcHRpb25zLCB0aGlzKTtcblxuXHRcdHRoaXMuZmlsZUZpZWxkID0gdGhpcy5maWxlRmllbGQgfHwgc3RhdGljcy5DT05GLkZJTEVfRklMRURfTkFNRTtcblx0XHR0aGlzLl9wb29sID0gbmV3IFBvb2wodGhpcy5pbnB1dFZpZXcuJGVsWzBdKTtcblx0XHR0aGlzLl9hZGRFdmVudCgpO1xuXHR9LFxuXHRcblx0LyoqXG5cdCAqIFNldCBDb25uZWN0b3IgYnkgdXNlSnNvbnAgZmxhZyBhbmQgd2hldGhlci5cblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9zZXRDb25uZWN0b3I6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLmlzQmF0Y2hUcmFuc2Zlcikge1xuXHRcdFx0dGhpcy50eXBlID0gJ2xvY2FsJztcblx0XHR9IGVsc2UgaWYgKHRoaXMuaXNDcm9zc0RvbWFpbigpKSB7XG5cdFx0XHRpZiAodGhpcy5oZWxwZXIpIHtcblx0XHRcdFx0dGhpcy50eXBlID0gJ2pzb25wJztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGFsZXJ0KHN0YXRpY3MuQ09ORi5FUlJPUi5OT1RfU1VSUFBPUlQpO1xuICAgICAgICAgICAgICAgIHRoaXMudHlwZSA9ICdsb2NhbCc7ICAgIFxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAodGhpcy51c2VKc29ucCB8fCAhdXRpbHMuaXNTdXBwb3J0Rm9ybURhdGEoKSkge1xuXHRcdFx0XHR0aGlzLnR5cGUgPSAnanNvbnAnO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy50eXBlID0gJ2FqYXgnO1xuXHRcdFx0fVxuXHRcdH1cblx0XHR0aGlzLl9jb25uZWN0b3IgPSBjb25uLmdldENvbm5lY3Rvcih0aGlzKTtcblx0fSxcblxuXHQvKipcblx0ICogVXBkYXRlIGxpc3QgdmlldyB3aXRoIGN1c3RvbSBvciBvcmlnaW5hbCBkYXRhLlxuXHQgKiBAcGFyYW0ge29iamVjdH0gaW5mbyBUaGUgZGF0YSBmb3IgdXBkYXRlIGxpc3Rcblx0ICogIEBwYXJhbSB7c3RyaW5nfSBpbmZvLmFjdGlvbiBUaGUgYWN0aW9uIG5hbWUgdG8gZXhlY3V0ZSBtZXRob2Rcblx0ICovXG5cdG5vdGlmeTogZnVuY3Rpb24oaW5mbykge1xuXHRcdHRoaXMubGlzdFZpZXcudXBkYXRlKGluZm8pO1xuXHRcdHRoaXMubGlzdFZpZXcudXBkYXRlVG90YWxJbmZvKGluZm8pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBTZXQgZmllbGQgZGF0YSBieSBvcHRpb24gdmFsdWVzLlxuXHQgKiBAcGFyYW0gb3B0aW9uc1xuXHQgKi9cblx0X3NldERhdGE6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0XHRuZS51dGlsLmV4dGVuZCh0aGlzLCBvcHRpb25zKTtcblx0fSxcblxuXHQvKipcblx0ICogRXh0cmFjdCBwcm90b2NvbCArIGRvbWFpbiBmcm9tIHVybCB0byBmaW5kIG91dCB3aGV0aGVyIGNyb3NzLWRvbWFpbiBvciBub3QuXG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0aXNDcm9zc0RvbWFpbjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHBhZ2VEb21haW4gPSBkb2N1bWVudC5kb21haW47XG5cdFx0cmV0dXJuIHRoaXMudXJsLnNlbmQuaW5kZXhPZihwYWdlRG9tYWluKSA9PT0gLTE7XG5cdH0sXG5cblx0LyoqXG5cdCAqIENhbGxiYWNrIGZvciBlcnJvclxuXHQgKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgRXJyb3IgcmVzcG9uc2Vcblx0ICovXG5cdGVycm9yQ2FsbGJhY2s6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0dmFyIG1lc3NhZ2U7XG5cdFx0aWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLm1zZykge1xuXHRcdFx0bWVzc2FnZSA9IHJlc3BvbnNlLm1zZztcblx0XHR9IGVsc2Uge1xuXHRcdFx0bWVzc2FnZSA9IHN0YXRpY3MuQ09ORi5FUlJPUi5ERUZBVUxUO1xuXHRcdH1cblx0XHRhbGVydChtZXNzYWdlKTtcblx0fSxcblxuXHQvKipcblx0ICogQ2FsbGJhY2sgZm9yIGN1c3RvbSBzZW5kIGV2ZW50XG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBbZGF0YV0gVGhlIGRhdGEgaW5jbHVkZSBjYWxsYmFjayBmdW5jdGlvbiBmb3IgZmlsZSBjbG9uZVxuXHQgKi9cblx0c2VuZEZpbGU6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHR2YXIgY2FsbGJhY2sgPSBuZS51dGlsLmJpbmQodGhpcy5ub3RpZnksIHRoaXMpLFxuXHRcdGZpbGVzID0gZGF0YSAmJiBkYXRhLmZpbGVzO1xuXHRcdFxuXHRcdHRoaXMuX2Nvbm5lY3Rvci5hZGRSZXF1ZXN0KHtcblx0XHRcdHR5cGU6ICdhZGQnLFxuXHRcdFx0c3VjY2VzczogZnVuY3Rpb24ocmVzdWx0KSB7XG5cdFx0XHRcdGlmIChkYXRhICYmIGRhdGEuY2FsbGJhY2spIHtcblx0XHRcdFx0XHRkYXRhLmNhbGxiYWNrKHJlc3VsdCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y2FsbGJhY2socmVzdWx0KTtcblx0XHRcdH0sXG5cdFx0XHRlcnJvcjogdGhpcy5lcnJvckNhbGxiYWNrXG5cdFx0fSwgZmlsZXMpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBDYWxsYmFjayBmb3IgY3VzdG9tIHJlbW92ZSBldmVudFxuXHQgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBUaGUgZGF0YSBmb3IgcmVtb3ZlIGZpbGUuXG5cdCAqL1xuXHRyZW1vdmVGaWxlOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0dmFyIGNhbGxiYWNrID0gbmUudXRpbC5iaW5kKHRoaXMubm90aWZ5LCB0aGlzKTtcblx0XHR0aGlzLl9jb25uZWN0b3IucmVtb3ZlUmVxdWVzdCh7XG5cdFx0XHR0eXBlOiAncmVtb3ZlJyxcblx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRzdWNjZXNzOiBjYWxsYmFja1xuXHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBTdWJtaXQgZm9yIGRhdGEgc3VibWl0IHRvIHNlcnZlclxuXHQgKi9cblx0c3VibWl0OiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5fY29ubmVjdG9yLnN1Ym1pdCkge1xuXHRcdFx0aWYgKHV0aWxzLmlzU3VwcG9ydEZvcm1EYXRhKCkpIHtcblx0XHRcdFx0dGhpcy5fY29ubmVjdG9yLnN1Ym1pdChuZS51dGlsLmJpbmQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dGhpcy5maXJlKCdiZWZvcmVzdWJtaXQnLCB0aGlzKTtcblx0XHRcdFx0fSwgdGhpcykpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5fcG9vbC5wbGFudCgpO1xuXHRcdFx0fVxuXHRcdH0gXG5cdH0sXG5cblx0LyoqXG5cdCAqIEdldCBmaWxlIGluZm8gbG9jYWxseVxuXHQgKiBAcGFyYW0ge0h0bWxFbGVtZW50fSBlbGVtZW50IElucHV0IGVsZW1lbnRcblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9nZXRGaWxlSW5mbzogZnVuY3Rpb24oZWxlbWVudCkge1xuXHRcdHZhciBmaWxlcztcblx0XHRpZiAodXRpbHMuaXNTdXBwb3J0RmlsZVN5c3RlbSgpKSB7XG5cdFx0XHRmaWxlcyA9IHRoaXMuX2dldEZpbGVMaXN0KGVsZW1lbnQuZmlsZXMpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmaWxlcyA9IHtcblx0XHRcdFx0bmFtZTogZWxlbWVudC52YWx1ZSxcblx0XHRcdFx0aWQ6IGVsZW1lbnQudmFsdWVcblx0XHRcdH07XG5cdFx0fVxuXHRcdHJldHVybiBmaWxlcztcblx0fSxcblxuXHQvKipcblx0ICogR2V0IGZpbGUgbGlzdCBmcm9tIEZpbGVMaXN0IG9iamVjdFxuXHQgKiBAcGFyYW0ge0ZpbGVMaXN0fSBmaWxlcyBBIEZpbGVMaXN0IG9iamVjdFxuXHQgKiBAcmV0dXJucyB7QXJyYXl9XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfZ2V0RmlsZUxpc3Q6IGZ1bmN0aW9uKGZpbGVzKSB7XG5cdFx0cmV0dXJuIG5lLnV0aWwubWFwKGZpbGVzLCBmdW5jdGlvbihmaWxlKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRuYW1lOiBmaWxlLm5hbWUsXG5cdFx0XHRcdHNpemU6IGZpbGUuc2l6ZSxcblx0XHRcdFx0aWQ6IGZpbGUubmFtZVxuXHRcdFx0fTtcblx0XHR9KTtcblx0fSxcblxuXHQvKipcblx0ICogQWRkIGV2ZW50IHRvIGxpc3R2aWV3IGFuZCBpbnB1dHZpZXdcblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG5cblx0XHRpZih0aGlzLnVzZURyYWcgJiYgdGhpcy5kcmFnVmlldykge1xuXHRcdFx0Ly8gQHRvZG8gdG9wIOyymOumrOqwgCDrlLDroZwg7ZWE7JqU7ZWoLCBzZW5kRmlsZSDsgqzsmqkg7JWI65CoXG5cdFx0XHR0aGlzLmRyYWdWaWV3Lm9uKCdkcm9wJywgdGhpcy5zZW5kRmlsZSwgdGhpcyk7XG5cdFx0fVxuXHRcdGlmICh0aGlzLmlzQmF0Y2hUcmFuc2Zlcikge1xuXHRcdFx0dGhpcy5pbnB1dFZpZXcub24oJ3NhdmUnLCB0aGlzLnNlbmRGaWxlLCB0aGlzKTtcblx0XHRcdHRoaXMubGlzdFZpZXcub24oJ3JlbW92ZScsIHRoaXMucmVtb3ZlRmlsZSwgdGhpcyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuaW5wdXRWaWV3Lm9uKCdjaGFuZ2UnLCB0aGlzLnNlbmRGaWxlLCB0aGlzKTtcblx0XHRcdHRoaXMubGlzdFZpZXcub24oJ3JlbW92ZScsIHRoaXMucmVtb3ZlRmlsZSwgdGhpcyk7XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBTdG9yZSBpbnB1dCBlbGVtZW50IHRvIHBvb2wuXG5cdCAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGlucHV0IEEgaW5wdXQgZWxlbWVudFt0eXBlPWZpbGVdIGZvciBzdG9yZSBwb29sXG5cdCAqL1xuXHRzdG9yZTogZnVuY3Rpb24oaW5wdXQpIHtcblx0XHR0aGlzLl9wb29sLnN0b3JlKGlucHV0KTtcblx0fSxcblxuXHQvKipcblx0ICogUmVtb3ZlIGlucHV0IGVsZW1lbnQgZm9ybSBwb29sLlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgZmlsZSBuYW1lIHRvIHJlbW92ZVxuXHQgKi9cblx0cmVtb3ZlOiBmdW5jdGlvbihuYW1lKSB7XG5cdFx0aWYgKCF1dGlscy5pc1N1cHBvcnRGb3JtRGF0YSgpKSB7XG5cdFx0XHR0aGlzLl9wb29sLnJlbW92ZShuYW1lKTtcblx0XHR9XG5cdH1cbn0pO1xuXG5uZS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihVcGxvYWRlcik7XG5tb2R1bGUuZXhwb3J0cyA9IFVwbG9hZGVyO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgZmlsZSBjb250YWluIHV0aWxpdHkgbWV0aG9kcyBmb3IgdXBsb2FkZXIuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG4vKipcbiAqIEV4dHJhY3QgdW5pdCBmb3IgZmlsZSBzaXplXG4gKiBAcGFyYW0ge251bWJlcn0gYnl0ZXMgQSB1c2FnZSBvZiBmaWxlXG4gKi9cbm1vZHVsZS5leHBvcnRzLmdldEZpbGVTaXplV2l0aFVuaXQgPSBmdW5jdGlvbihieXRlcykge1xuICAgIHZhciB1bml0cyA9IFsnQicsICdLQicsICdNQicsICdHQicsICdUQiddLFxuICAgICAgICBieXRlcyA9IHBhcnNlSW50KGJ5dGVzLCAxMCksXG4gICAgICAgIGV4cCA9IE1hdGgubG9nKGJ5dGVzKSAvIE1hdGgubG9nKDEwMjQpIHwgMCxcbiAgICAgICAgcmVzdWx0ID0gKGJ5dGVzIC8gTWF0aC5wb3coMTAyNCwgZXhwKSkudG9GaXhlZCgyKTtcblxuICAgIHJldHVybiByZXN1bHQgKyB1bml0c1tleHBdO1xufTtcblxuLyoqXG4gKiBXaGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnQgRm9ybURhdGEgb3Igbm90XG4gKi9cbm1vZHVsZS5leHBvcnRzLmlzU3VwcG9ydEZvcm1EYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIEZvcm1EYXRhID0gKHdpbmRvdy5Gb3JtRGF0YSB8fCBudWxsKTtcbiAgICByZXR1cm4gISFGb3JtRGF0YTtcbn07XG5cbi8qKlxuICogR2V0IGl0ZW0gZWxlbWVuIEhUTUxcbiAqIEBwYXJhbSB7c3RyaW5nfSBodG1sIEhUTUwgdGVtcGxhdGVcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbm1vZHVsZS5leHBvcnRzLnRlbXBsYXRlID0gZnVuY3Rpb24obWFwLCBodG1sKSB7XG4gICAgaHRtbCA9IGh0bWwucmVwbGFjZSgvXFx7XFx7KFteXFx9XSspXFx9XFx9L2csIGZ1bmN0aW9uKG1zdHIsIG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIG1hcFtuYW1lXTtcbiAgICB9KTtcbiAgICByZXR1cm4gaHRtbDtcbn07XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBzdXBwb3J0IGZpbGUgYXBpIG9yIG5vdFxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbm1vZHVsZS5leHBvcnRzLmlzU3VwcG9ydEZpbGVTeXN0ZW0gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gISEod2luZG93LkZpbGUgJiYgd2luZG93LkZpbGVSZWFkZXIgJiYgd2luZG93LkZpbGVMaXN0ICYmIHdpbmRvdy5CbG9iKTtcbn07IiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgZmlsZSBpcyBhYm91dCBkcmFnIGFuZCBkcm9wIGZpbGUgdG8gc2VuZC4gRHJhZyBhbmQgZHJvcCBpcyBydW5uaW5nIHZpYSBmaWxlIGFwaS5cbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbnZhciBzdGF0aWNzID0gcmVxdWlyZSgnLi4vc3RhdGljcycpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuLyoqXG4gKiBNYWtlcyBkcmFnIGFuZCBkcm9wIGFyZWEsIHRoZSBkcm9wcGVkIGZpbGUgaXMgYWRkZWQgdmlhIGV2ZW50IGRyb3AgZXZlbnQuXG4gKiBAY2xhc3MgRHJhZ0FuZERyb3BcbiAqL1xudmFyIERyYWdBbmREcm9wID0gbmUudXRpbC5kZWZpbmVDbGFzcyh7XG5cdC8qKlxuXHQgKiBpbml0aWFsaXplIERyYWdBbmREcm9wXG5cdCAqL1xuXHRpbml0OiBmdW5jdGlvbihvcHRpb25zLCB1cGxvYWRlcikge1xuXHRcdHZhciBodG1sID0gb3B0aW9ucy50ZW1wbGF0ZSAmJiBvcHRpb25zLnRlbXBsYXRlLmRyYWcgfHwgc3RhdGljcy5IVE1MLmRyYWc7XG5cdFx0dGhpcy5fZW5hYmxlQ2xhc3MgPSBvcHRpb25zLmRyYWcgJiYgb3B0aW9ucy5kcmFnLmVuYWJsZUNsYXNzIHx8IHN0YXRpY3MuQ09ORi5EUkFHX0RFRkFVTFRfRU5BQkxFX0NMQVNTO1xuXHRcdHRoaXMuX3JlbmRlcihodG1sLCB1cGxvYWRlcik7XG5cdFx0dGhpcy5fYWRkRXZlbnQoKTtcblx0fSxcblxuXHQvKipcblx0ICogUmVuZGVycyBkcmFnIGFuZCBkcm9wIGFyZWFcblx0ICogQHBhcmFtIHtzdHJpbmd9IGh0bWwgVGhlIGh0bWwgc3RyaW5nIHRvIG1ha2UgZGFyZyB6b25lXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSB1cGxvYWRlciBUaGUgY29yZSBpbnN0YW5jZSBvZiB0aGlzIGNvbXBvbmVudFxuXHQgKi9cblx0X3JlbmRlcjogZnVuY3Rpb24oaHRtbCwgdXBsb2FkZXIpIHtcblx0XHR0aGlzLiRlbCA9ICQoaHRtbCk7XG5cdFx0dXBsb2FkZXIuJGVsLmFwcGVuZCh0aGlzLiRlbCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEFkZHMgZHJhZyBhbmQgZHJvcCBldmVudFxuXHQgKi9cblx0X2FkZEV2ZW50OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5vbignZHJhZ2VudGVyJywgbmUudXRpbC5iaW5kKHRoaXMub25EcmFnRW50ZXIsIHRoaXMpKTtcblx0XHR0aGlzLiRlbC5vbignZHJhZ292ZXInLCBuZS51dGlsLmJpbmQodGhpcy5vbkRyYWdPdmVyLCB0aGlzKSk7XG5cdFx0dGhpcy4kZWwub24oJ2Ryb3AnLCBuZS51dGlsLmJpbmQodGhpcy5vbkRyb3AsIHRoaXMpKTtcblx0XHR0aGlzLiRlbC5vbignZHJhZ2xlYXZlJywgbmUudXRpbC5iaW5kKHRoaXMub25EcmFnTGVhdmUsIHRoaXMpKTtcblx0fSxcblxuXHQvKipcblx0ICogSGFuZGxlcyBkcmFnZW50ZXIgZXZlbnRcblx0ICovXG5cdG9uRHJhZ0VudGVyOiBmdW5jdGlvbihlKSB7XG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0dGhpcy5fZW5hYmxlKCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEhhbmRsZXMgZHJhZ292ZXIgZXZlbnRcblx0ICovXG5cdG9uRHJhZ092ZXI6IGZ1bmN0aW9uKGUpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0fSxcblxuXHQvKipcblx0ICogSGFuZGxlcyBkcmFnbGVhdmUgZXZlbnRcblx0ICovXG5cdG9uRHJhZ0xlYXZlOiBmdW5jdGlvbihlKSB7XG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0dGhpcy5fZGlzYWJsZSgpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBIYW5kbGVzIGRyb3AgZXZlbnRcblx0ICovXG5cdG9uRHJvcDogZnVuY3Rpb24oZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHR0aGlzLl9kaXNhYmxlKCk7XG5cdFx0dGhpcy5maXJlKCdkcm9wJywge1xuXHRcdFx0ZmlsZXM6IGUub3JpZ2luYWxFdmVudC5kYXRhVHJhbnNmZXIuZmlsZXNcblx0XHR9KTtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0sXG5cblx0X2VuYWJsZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuYWRkQ2xhc3ModGhpcy5fZW5hYmxlQ2xhc3MpO1xuXHR9LFxuXG5cdF9kaXNhYmxlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyh0aGlzLl9lbmFibGVDbGFzcyk7XG5cdH1cbn0pO1xuXG5uZS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihEcmFnQW5kRHJvcCk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJhZ0FuZERyb3A7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgSW5wdXRWaWV3IG1ha2UgaW5wdXQgZm9ybSBieSB0ZW1wbGF0ZS4gQWRkIGV2ZW50IGZpbGUgdXBsb2FkIGV2ZW50LlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxudmFyIHN0YXRpY3MgPSByZXF1aXJlKCcuLi9zdGF0aWNzJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG4vKipcbiAqIFRoaXMgdmlldyBjb250cm9sIGlucHV0IGVsZW1lbnQgdHlwZWQgZmlsZS5cbiAqIEBjb25zdHJ1Y3RvciBuZS5jb21wb25lbnQuRmlsZVVwbG9hZGVyLklucHV0Vmlld1xuICovXG52YXIgSW5wdXQgPSBuZS51dGlsLmRlZmluZUNsYXNzKC8qKkBsZW5kcyBuZS5jb21wb25lbnQuVXBsb2FkZXIuSW5wdXQucHJvdG90eXBlICoqL3tcblx0LyoqXG5cdCAqIEluaXRpYWxpemUgaW5wdXQgZWxlbWVudC5cblx0ICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuXHQgKi9cblx0aW5pdDogZnVuY3Rpb24ob3B0aW9ucywgdXBsb2FkZXIpIHtcblxuXHRcdHRoaXMuX3VwbG9hZGVyID0gdXBsb2FkZXI7XG5cdFx0dGhpcy5fdGFyZ2V0ID0gb3B0aW9ucy5mb3JtVGFyZ2V0O1xuXHRcdHRoaXMuX3VybCA9IG9wdGlvbnMudXJsO1xuXHRcdHRoaXMuX2lzQmF0Y2hUcmFuc2ZlciA9IG9wdGlvbnMuaXNCYXRjaFRyYW5zZmVyO1xuXHRcdHRoaXMuX2lzTXVsdGlwbGUgPSAhISh1dGlscy5pc1N1cHBvcnRGb3JtRGF0YSgpICYmIG9wdGlvbnMuaXNNdWx0aXBsZSk7XG5cdFx0dGhpcy5fdXNlRm9sZGVyID0gISEodXRpbHMuaXNTdXBwb3J0Rm9ybURhdGEoKSAmJiBvcHRpb25zLnVzZUZvbGRlcik7XG5cblx0XHR0aGlzLl9odG1sID0gdGhpcy5fc2V0SFRNTChvcHRpb25zLnRlbXBsYXRlKTtcblxuXHRcdHRoaXMuX3JlbmRlcigpO1xuXHRcdHRoaXMuX3JlbmRlckhpZGRlbkVsZW1lbnRzKCk7XG5cblx0XHRpZiAob3B0aW9ucy5oZWxwZXIpIHtcblx0XHRcdHRoaXMuX21ha2VCcmlkZ2VJbmZvRWxlbWVudChvcHRpb25zLmhlbHBlcik7XG5cdFx0fVxuXG5cdFx0dGhpcy5fYWRkRXZlbnQoKTtcblx0fSxcblxuXHQvKipcblx0ICogUmVuZGVyIGlucHV0IGFyZWFcblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9yZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsID0gJCh0aGlzLl9nZXRIdG1sKCkpO1xuXHRcdHRoaXMuJGVsLmF0dHIoe1xuXHRcdFx0YWN0aW9uOiB0aGlzLl91cmwuc2VuZCxcblx0XHRcdG1ldGhvZDogJ3Bvc3QnLFxuXHRcdFx0ZW5jdHlwZTogXCJtdWx0aXBhcnQvZm9ybS1kYXRhXCIsXG5cdFx0XHR0YXJnZXQ6ICghdGhpcy5faXNCYXRjaFRyYW5zZmVyID8gdGhpcy5fdGFyZ2V0IDogJycpXG5cdFx0fSk7XG5cdFx0dGhpcy4kaW5wdXQgPSB0aGlzLl9nZXRJbnB1dEVsZW1lbnQoKTtcblx0XHR0aGlzLiRzdWJtaXQgPSB0aGlzLl9nZXRTdWJtaXRFbGVtZW50KCk7XG5cdFx0dGhpcy4kaW5wdXQuYXBwZW5kVG8odGhpcy4kZWwpO1xuXHRcdGlmICh0aGlzLiRzdWJtaXQpIHtcblx0XHRcdHRoaXMuJHN1Ym1pdC5hcHBlbmRUbyh0aGlzLiRlbCk7XG5cdFx0fVxuXHRcdHRoaXMuX3VwbG9hZGVyLiRlbC5hcHBlbmQodGhpcy4kZWwpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBTZXQgYWxsIG9mIGlucHV0IGVsZW1lbnRzIGh0bWwgc3RyaW5ncy5cblx0ICogQHBhcmFtIHtvYmplY3R9IFt0ZW1wbGF0ZV0gVGhlIHRlbXBsYXRlIGlzIHNldCBmb3JtIGN1c3RvbWVyLlxuXHQgKiBAcmV0dXJuIHtvYmplY3R9IFRoZSBodG1sIHN0cmluZyBzZXQgZm9yIGlucHV0Vmlld1xuXHQgKi9cblx0X3NldEhUTUw6IGZ1bmN0aW9uKHRlbXBsYXRlKSB7XG5cdFx0aWYgKCF0ZW1wbGF0ZSkge1xuXHRcdFx0dGVtcGxhdGUgPSB7fTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0aW5wdXQ6IHRlbXBsYXRlLmlucHV0IHx8IHN0YXRpY3MuSFRNTC5pbnB1dCxcblx0XHRcdHN1Ym1pdDogdGVtcGxhdGUuc3VibWl0IHx8IHN0YXRpY3MuSFRNTC5zdWJtaXQsXG5cdFx0XHRmb3JtOiB0ZW1wbGF0ZS5mb3JtIHx8IHN0YXRpY3MuSFRNTC5mb3JtXG5cdFx0fVxuXHR9LFxuXHQvKipcblx0ICogR2V0IGh0bWwgc3RyaW5nIGZyb20gdGVtcGxhdGVcblx0ICogQHJldHVybiB7b2JqZWN0fVxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X2dldEh0bWw6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLl9odG1sLmZvcm07XG5cdH0sXG5cblx0LyoqXG5cdCAqIE1ha2VzIGFuZCByZXR1cm5zIGpxdWVyeSBlbGVtZW50XG5cdCAqIEByZXR1cm4ge29iamVjdH0gVGhlIGpxdWVyeSBvYmplY3Qgd3JhcHBpbmcgb3JpZ2luYWwgaW5wdXQgZWxlbWVudFxuXHQgKi9cblx0X2dldElucHV0RWxlbWVudDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIG1hcCA9IHtcblx0XHRcdG11bHRpcGxlOiB0aGlzLl9pc011bHRpcGxlID8gJ211bHRpcGxlJyA6ICcnLFxuXHRcdFx0ZmlsZUZpZWxkOiB0aGlzLl91cGxvYWRlci5maWxlRmllbGQsXG5cdFx0XHR3ZWJraXRkaXJlY3Rvcnk6IHRoaXMuX3VzZUZvbGRlciA/ICd3ZWJraXRkaXJlY3RvcnknIDogJydcblx0XHR9O1xuXG5cdFx0cmV0dXJuICQodXRpbHMudGVtcGxhdGUobWFwLCB0aGlzLl9odG1sLmlucHV0KSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIE1ha2VzIGFuZCByZXR1cm5zIGpxdWVyeSBlbGVtZW50XG5cdCAqIEByZXR1cm4ge29iamVjdH0gVGhlIGpxdWVyeSBvYmplY3Qgd3JhcHBpbmcgc3VtYml0IGJ1dHRvbiBlbGVtZW50XG5cdCAqL1xuXHRfZ2V0U3VibWl0RWxlbWVudDogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMuX2lzQmF0Y2hUcmFuc2Zlcikge1xuXHRcdFx0cmV0dXJuICQodGhpcy5faHRtbC5zdWJtaXQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XHRcblx0XHR9XG5cdH0sXG5cblx0LyoqXG5cdCAqIENhbGwgbWV0aG9kcyB0aG9zZSBtYWtlIGVhY2ggaGlkZGVuIGVsZW1lbnQuXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfcmVuZGVySGlkZGVuRWxlbWVudHM6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuX21ha2VUYXJnZXRGcmFtZSgpO1xuXHRcdHRoaXMuX21ha2VSZXN1bHRUeXBlRWxlbWVudCgpO1xuXHRcdHRoaXMuX21ha2VDYWxsYmFja0VsZW1lbnQoKTtcblx0fSxcblxuXHQvKipcblx0ICogQWRkIGV2ZW50XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfYWRkRXZlbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLl9pc0JhdGNoVHJhbnNmZXIpIHtcblx0XHRcdHRoaXMuJGVsLm9uKCdzdWJtaXQnLCBuZS51dGlsLmJpbmQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHRoaXMuX3VwbG9hZGVyLnN1Ym1pdCgpO1xuXHRcdFx0fSwgdGhpcykpO1xuXHRcdH1cblx0XHR0aGlzLl9hZGRJbnB1dEV2ZW50KCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEFkZCBpbnB1dCBlbGVtZW50IGNoYW5nZSBldmVudCBieSBzZW5kaW5nIHR5cGVcblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9hZGRJbnB1dEV2ZW50OiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5faXNCYXRjaFRyYW5zZmVyKSB7XG5cdFx0XHR0aGlzLiRpbnB1dC5vbignY2hhbmdlJywgbmUudXRpbC5iaW5kKHRoaXMub25TYXZlLCB0aGlzKSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuJGlucHV0Lm9uKCdjaGFuZ2UnLCBuZS51dGlsLmJpbmQodGhpcy5vbkNoYW5nZSwgdGhpcykpO1xuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogRXZlbnQtSGFuZGxlIGZvciBpbnB1dCBlbGVtZW50IGNoYW5nZVxuXHQgKi9cblx0b25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICghdGhpcy4kaW5wdXRbMF0udmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybjsgXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5maXJlKCdjaGFuZ2UnLCB7XG5cdFx0XHR0YXJnZXQ6IHRoaXNcblx0XHR9KTtcblx0fSxcblxuXHQvKipcblx0ICogRXZlbnQtSGFuZGxlIGZvciBzYXZlIGlucHV0IGVsZW1lbnRcblx0ICovXG5cdG9uU2F2ZTogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCF0aGlzLiRpbnB1dFswXS52YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzYXZlQ2FsbGJhY2sgPSAhdXRpbHMuaXNTdXBwb3J0Rm9ybURhdGEoKSA/IG5lLnV0aWwuYmluZCh0aGlzLl9yZXNldElucHV0RWxlbWVudCwgdGhpcykgOiBudWxsO1xuXHRcdHRoaXMuZmlyZSgnc2F2ZScsIHtcblx0XHRcdGVsZW1lbnQ6IHRoaXMuJGlucHV0WzBdLFxuXHRcdFx0Y2FsbGJhY2s6IHNhdmVDYWxsYmFja1xuXHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZXNldCBJbnB1dCBlbGVtZW50IHRvIHNhdmUgd2hvbGUgaW5wdXQ9ZmlsZSBlbGVtZW50LlxuXHQgKi9cblx0X3Jlc2V0SW5wdXRFbGVtZW50OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRpbnB1dC5vZmYoKTtcblx0XHR0aGlzLl9jbG9uZSh0aGlzLiRpbnB1dFswXSk7XG5cdFx0dGhpcy4kaW5wdXQgPSB0aGlzLl9nZXRJbnB1dEVsZW1lbnQoKTtcblx0XHRpZiAodGhpcy4kc3VibWl0KSB7XG5cdFx0XHR0aGlzLiRzdWJtaXQuYmVmb3JlKHRoaXMuJGlucHV0KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy4kZWwuYXBwZW5kKHRoaXMuJGlucHV0KTtcblx0XHR9XG5cdFx0dGhpcy5fYWRkSW5wdXRFdmVudCgpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBNYWtlcyBlbGVtZW50IHRvIGJlIHRhcmdldCBvZiBzdWJtaXQgZm9ybSBlbGVtZW50LlxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X21ha2VUYXJnZXRGcmFtZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5fJHRhcmdldCA9ICQoJzxpZnJhbWUgbmFtZT1cIicgKyB0aGlzLl90YXJnZXQgKyAnXCI+PC9pZnJhbWU+Jyk7XG5cdFx0dGhpcy5fJHRhcmdldC5jc3Moe1xuXHRcdFx0dmlzaWJpbGl0eTogJ2hpZGRlbicsXG5cdFx0XHRwb3NpdGlvbjogJ2Fic29sdXRlJ1xuXHRcdH0pO1xuXHRcdHRoaXMuX3VwbG9hZGVyLiRlbC5hcHBlbmQodGhpcy5fJHRhcmdldCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIE1ha2UgZWxlbWVudCB0byBiZSBjYWxsYmFjayBmdW5jdGlvbiBuYW1lXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfbWFrZUNhbGxiYWNrRWxlbWVudDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5fJGNhbGxiYWNrID0gdGhpcy5fbWFrZUhpZGRlbkVsZW1lbnQoe1xuXHRcdFx0J25hbWUnOiBzdGF0aWNzLkNPTkYuSlNPTlBDQUxMQkFDS19OQU1FLFxuXHRcdFx0J3ZhbHVlJzogdGhpcy5fdXBsb2FkZXIuY2FsbGJhY2tOYW1lXG5cdFx0fSk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKHRoaXMuXyRjYWxsYmFjayk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIE1ha2VzIGVsZW1lbnQgdG8ga25vdyB3aGljaCB0eXBlIHJlcXVlc3Rcblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9tYWtlUmVzdWx0VHlwZUVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuXyRyZXNUeXBlID0gdGhpcy5fbWFrZUhpZGRlbkVsZW1lbnQoe1xuXHRcdFx0J25hbWUnIDogdGhpcy5fdXBsb2FkZXIucmVzdWx0VHlwZUVsZW1lbnROYW1lIHx8IHN0YXRpY3MuQ09ORi5SRVNQT05TRV9UWVBFLFxuXHRcdFx0J3ZhbHVlJzogdGhpcy5fdXBsb2FkZXIudHlwZVxuXHRcdH0pO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCh0aGlzLl8kcmVzVHlwZSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIE1ha2UgZWxlbWVudCB0aGF0IGhhcyByZWRpcmVjdCBwYWdlIGluZm9ybWF0aW9uIHVzZWQgYnkgU2VydmVyIHNpZGUuXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBoZWxwZXIgUmVkaXJlY3Rpb24gaW5mb3JtYXRpb24gZm9yIGNsZWFyIHgtZG9tYWluIHByb2JsZW0uXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfbWFrZUJyaWRnZUluZm9FbGVtZW50OiBmdW5jdGlvbihoZWxwZXIpIHtcblx0XHR0aGlzLl8kaGVscGVyID0gdGhpcy5fbWFrZUhpZGRlbkVsZW1lbnQoe1xuXHRcdFx0J25hbWUnIDogaGVscGVyLm5hbWUgfHwgc3RhdGljcy5DT05GLlJFRElSRUNUX1VSTCxcblx0XHRcdCd2YWx1ZSc6IGhlbHBlci51cmxcblx0XHR9KTtcblx0XHR0aGlzLiRlbC5hcHBlbmQodGhpcy5fJGhlbHBlcik7XG5cdH0sXG5cblx0LyoqXG5cdCAqIE1ha2UgaGlkZGVuIGlucHV0IGVsZW1lbnQgd2l0aCBvcHRpb25zXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFRoZSBvcGl0b25zIHRvIGJlIGF0dHJpYnV0ZSBvZiBpbnB1dFxuXHQgKiBAcmV0dXJucyB7KnxqUXVlcnl9XG5cdCAqIEBwcml2YXRlXG4gICAgICovXHRcblx0X21ha2VIaWRkZW5FbGVtZW50OiBmdW5jdGlvbihvcHRpb25zKSB7XG5cdFx0bmUudXRpbC5leHRlbmQob3B0aW9ucywge1xuXHRcdFx0dHlwZTogJ2hpZGRlbidcblx0XHR9KTtcblx0XHRyZXR1cm4gJCgnPGlucHV0IC8+JykuYXR0cihvcHRpb25zKTtcblx0fSxcblxuXHQvKipcblx0ICogQXNrIHVwbG9hZGVyIHRvIHNhdmUgaW5wdXQgZWxlbWVudCB0byBwb29sXG5cdCAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGlucHV0IEEgaW5wdXQgZWxlbWVudFt0eXBlPWZpbGVdIGZvciBzdG9yZSBwb29sXG5cdCAqL1xuXHRfY2xvbmU6IGZ1bmN0aW9uKGlucHV0KSB7XG5cdFx0aW5wdXQuZmlsZV9uYW1lID0gaW5wdXQudmFsdWU7XG5cdFx0dGhpcy5fdXBsb2FkZXIuc3RvcmUoaW5wdXQpO1xuXHR9XG5cbn0pO1xuXG5uZS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihJbnB1dCk7XG5cbm1vZHVsZS5leHBvcnRzID0gSW5wdXQ7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgSXRlbVZpZXcgbWFrZSBlbGVtZW50IHRvIGRpc3BsYXkgYWRkZWQgZmlsZSBpbmZvcm1hdGlvbi4gSXQgaGFzIGF0dGFjaGVkIGZpbGUgSUQgdG8gcmVxdWVzdCBmb3IgcmVtb3ZlLlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxudmFyIHN0YXRpY3MgPSByZXF1aXJlKCcuLi9zdGF0aWNzJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG4vKipcbiAqIENsYXNzIG9mIGl0ZW0gdGhhdCBpcyBtZW1iZXIgb2YgZmlsZSBsaXN0LlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZhciBJdGVtID0gbmUudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIG5lLmNvbXBvbmVudC5VcGxvYWRlci5JdGVtLnByb3RvdHlwZSAqKi8ge1xuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgaXRlbVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLm5hbWUgRmlsZSBuYW1lXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnR5cGUgRmlsZSB0eXBlXG4gICAgICogIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLnJvb3QgTGlzdCBvYmplY3RcbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuaGlkZGVuRnJhbWUgVGhlIGlmcmFtZSBuYW1lIHdpbGwgYmUgdGFyZ2V0IG9mIGZvcm0gc3VibWl0LlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy51cmwgVGhlIHVybCBmb3IgZm9ybSBhY3Rpb24gdG8gc3VibWV0LlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuaWRdIFVuaXF1ZSBrZXksIHdoYXQgaWYgdGhlIGtleSBpcyBub3QgZXhpc3QgaWQgd2lsbCBiZSB0aGUgZmlsZSBuYW1lLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuaGlkZGVuRmllbGROYW1lXSBUaGUgbmFtZSBvZiBoaWRkZW4gZmlsZWQuIFRoZSBoaWRkZW4gZmllbGQgaXMgZm9yIGNvbm5lY3RpbmcgeC1kb21pYW4uXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5kZWxldGVCdXR0b25DbGFzc05hbWU9J3VwbG9hZGVyX2J0bl9kZWxldGUnXSBUaGUgY2xhc3MgbmFtZSBpcyBmb3IgZGVsZXRlIGJ1dHRvbi5cbiAgICAgKiAgQHBhcmFtIHsoc3RyaW5nfG51bWJlcil9IFtvcHRpb25zLnNpemVdIEZpbGUgc2l6ZSAoYnV0IGllIGxvdyBicm93c2VyLCB4LWRvbWFpbilcbiAgICAgKiAgQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zLmhlbHBlcl0gVGhlIGhlbHBlciBwYWdlIGluZm8uXG4gICAgICovXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuXG4gICAgICAgIHRoaXMuX3NldFJvb3Qob3B0aW9ucyk7XG4gICAgICAgIHRoaXMuX3NldEl0ZW1JbmZvKG9wdGlvbnMpO1xuICAgICAgICB0aGlzLl9zZXRDb25uZWN0SW5mbyhvcHRpb25zKTtcblxuICAgICAgICB0aGlzLnJlbmRlcihvcHRpb25zLnRlbXBsYXRlIHx8IHN0YXRpY3MuSFRNTC5pdGVtKTtcblxuICAgICAgICBpZiAob3B0aW9ucy5oZWxwZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX21ha2VCcmlkZ2VJbmZvRWxlbWVudChvcHRpb25zLmhlbHBlcik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHJvb3QoTGlzdCBvYmplY3QpIGluZm9ybWF0aW9uLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFNhbWUgd2l0aCBpbml0IG9wdGlvbnMgcGFyYW1ldGVyLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldFJvb3Q6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fcm9vdCA9IG9wdGlvbnMucm9vdDtcbiAgICAgICAgdGhpcy5fJHJvb3QgPSBvcHRpb25zLnJvb3QuJGVsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgZmlsZSBpbmZvcm1hdGlvbi5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBTYW1lIHdpdGggaW5pdCBvcHRpb25zIHBhcmFtZXRlci5cbiAgICAgKi9cbiAgICBfc2V0SXRlbUluZm86IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gb3B0aW9ucy5uYW1lO1xuICAgICAgICB0aGlzLl90eXBlID0gb3B0aW9ucy50eXBlIHx8IHRoaXMuX2V4dHJhY3RFeHRlbnNpb24oKTtcbiAgICAgICAgdGhpcy5faWQgPSBvcHRpb25zLmlkIHx8IG9wdGlvbnMubmFtZTtcbiAgICAgICAgdGhpcy5zaXplID0gb3B0aW9ucy5zaXplIHx8ICcnO1xuICAgICAgICB0aGlzLl9idG5DbGFzcyA9IG9wdGlvbnMuZGVsZXRlQnV0dG9uQ2xhc3NOYW1lIHx8ICd1cGxvYWRlcl9idG5fZGVsZXRlJztcbiAgICAgICAgdGhpcy5fdW5pdCA9IG9wdGlvbnMudW5pdCB8fCAnS0InO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgY29ubmVjdCBlbGVtZW50IGluZm9ybWF0aW9uLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFNhbWUgd2l0aCBpbml0IG9wdGlvbnMgcGFyYW1ldGVyLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldENvbm5lY3RJbmZvOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX3VybCA9IG9wdGlvbnMudXJsO1xuICAgICAgICB0aGlzLl9oaWRkZW5JbnB1dE5hbWUgPSBvcHRpb25zLmhpZGRlbkZpZWxkTmFtZSB8fCAnZmlsZW5hbWUnO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgbWFraW5nIGZvcm0gcGFkZGluZyB3aXRoIGRlbGV0YWJsZSBpdGVtXG4gICAgICogQHBhcmFtIHRlbXBsYXRlXG4gICAgICovXG4gICAgcmVuZGVyOiBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuICAgICAgICB2YXIgaHRtbCA9IHRoaXMuX2dldEh0bWwodGVtcGxhdGUpO1xuICAgICAgICB0aGlzLl8kZWwgPSAkKGh0bWwpO1xuICAgICAgICB0aGlzLl8kcm9vdC5hcHBlbmQodGhpcy5fJGVsKTtcbiAgICAgICAgdGhpcy5fYWRkRXZlbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXh0cmFjdCBmaWxlIGV4dGVuc2lvbiBieSBuYW1lXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9leHRyYWN0RXh0ZW5zaW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZS5zcGxpdCgnLicpLnBvcCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIGVsZW1lbnQgdGhhdCBoYXMgcmVkaXJlY3QgcGFnZSBpbmZvcm1hdGlvbiB1c2VkIGJ5IFNlcnZlciBzaWRlLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBoZWxwZXIgUmVkaXJlY3Rpb24gaGVscGVyIHBhZ2UgaW5mb3JtYXRpb24gZm9yIGNsZWFyIHgtZG9tYWluIHByb2JsZW0uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbWFrZUJyaWRnZUluZm9FbGVtZW50OiBmdW5jdGlvbihoZWxwZXIpIHtcbiAgICAgICAgdGhpcy4kaGVscGVyID0gJCgnPGlucHV0IC8+Jyk7XG4gICAgICAgIHRoaXMuJGhlbHBlci5hdHRyKHtcbiAgICAgICAgICAgICduYW1lJyA6IGhlbHBlci5uYW1lLFxuICAgICAgICAgICAgJ3ZhbHVlJzogaGVscGVyLnVybFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGl0ZW0gZWxlbWVuIEhUTUxcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaHRtbCBIVE1MIHRlbXBsYXRlXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRIdG1sOiBmdW5jdGlvbihodG1sKSB7XG4gICAgICAgIHZhciBtYXAgPSB7XG4gICAgICAgICAgICBmaWxldHlwZTogdGhpcy5fdHlwZSxcbiAgICAgICAgICAgIGZpbGVuYW1lOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICBmaWxlc2l6ZTogdGhpcy5zaXplID8gdXRpbHMuZ2V0RmlsZVNpemVXaXRoVW5pdCh0aGlzLnNpemUpIDogJycsXG4gICAgICAgICAgICBkZWxldGVCdXR0b25DbGFzc05hbWU6IHRoaXMuX2J0bkNsYXNzXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHV0aWxzLnRlbXBsYXRlKG1hcCwgaHRtbCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERlc3RvcnkgaXRlbVxuICAgICAqL1xuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9yZW1vdmVFdmVudCgpO1xuICAgICAgICB0aGlzLl8kZWwucmVtb3ZlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudCBoYW5kbGVyIG9uIGRlbGV0ZSBidXR0b24uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcXVlcnkgPSAnLicgKyB0aGlzLl9idG5DbGFzcyxcbiAgICAgICAgICAgICRkZWxCdG4gPSB0aGlzLl8kZWwuZmluZChxdWVyeSk7XG4gICAgICAgICRkZWxCdG4ub24oJ2NsaWNrJywgbmUudXRpbC5iaW5kKHRoaXMuX29uQ2xpY2tFdmVudCwgdGhpcykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZXZlbnQgaGFuZGxlciBmcm9tIGRlbGV0ZSBidXR0b24uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcXVlcnkgPSAnLicgKyB0aGlzLl9idG5DbGFzcyxcbiAgICAgICAgICAgICRkZWxCdG4gPSB0aGlzLl8kZWwuZmluZChxdWVyeSk7XG4gICAgICAgICRkZWxCdG4ub2ZmKCdjbGljaycpO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIEV2ZW50LWhhbmRsZSBmb3IgZGVsZXRlIGJ1dHRvbiBjbGlja2VkLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uQ2xpY2tFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZmlyZSgncmVtb3ZlJywge1xuICAgICAgICAgICAgZmlsZW5hbWUgOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICBpZCA6IHRoaXMuX2lkLFxuICAgICAgICAgICAgdHlwZTogJ3JlbW92ZSdcbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG5cbm5lLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKEl0ZW0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEl0ZW07IiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZpbGVMaXN0VmlldyBtYW5hZ2UgYW5kIGRpc3BsYXkgZmlsZXMgc3RhdGUobGlrZSBzaXplLCBjb3VudCkgYW5kIGxpc3QuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xudmFyIEl0ZW0gPSByZXF1aXJlKCcuL2l0ZW0nKTtcblxuLyoqXG4gKiBMaXN0IGhhcyBpdGVtcy4gSXQgY2FuIGFkZCBhbmQgcmVtb3ZlIGl0ZW0sIGFuZCBnZXQgdG90YWwgdXNhZ2UuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmFyIExpc3QgPSBuZS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgbmUuY29tcG9uZW50LlVwbG9hZGVyLkxpc3QucHJvdG90eXBlICove1xuICAgIGluaXQgOiBmdW5jdGlvbihvcHRpb25zLCB1cGxvYWRlcikge1xuICAgICAgICB2YXIgbGlzdEluZm8gPSBvcHRpb25zLmxpc3RJbmZvO1xuICAgICAgICB0aGlzLml0ZW1zID0gW107XG4gICAgICAgIHRoaXMuJGVsID0gbGlzdEluZm8ubGlzdDtcbiAgICAgICAgdGhpcy4kY291bnRlciA9IGxpc3RJbmZvLmNvdW50O1xuICAgICAgICB0aGlzLiRzaXplID0gbGlzdEluZm8uc2l6ZTtcbiAgICAgICAgdGhpcy5fdXBsb2FkZXIgPSB1cGxvYWRlcjtcblxuICAgICAgICBuZS51dGlsLmV4dGVuZCh0aGlzLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW0gbGlzdFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBpbmZvIEEgaW5mb3JtYXRpb24gdG8gdXBkYXRlIGxpc3QuXG4gICAgICogIEBwYXJhbSB7YXJyYXl9IGluZm8uaXRlbXMgVGhlIGxpc3Qgb2YgZmlsZSBpbmZvcm1hdGlvbi5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IFtpbmZvLmFjdGlvbl0gVGhlIGFjdGlvbiB0byBkby5cbiAgICAgKi9cbiAgICB1cGRhdGU6IGZ1bmN0aW9uKGluZm8pIHtcbiAgICAgICAgaWYgKGluZm8uYWN0aW9uID09PSAncmVtb3ZlJykge1xuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlRmlsZUl0ZW0oaW5mby5uYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2FkZEZpbGVJdGVtcyhpbmZvLml0ZW1zKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgaXRlbXMgdG90YWwgY291bnQsIHRvdGFsIHNpemUgaW5mb3JtYXRpb24uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGluZm8gQSBpbmZvcm1hdGlvbiB0byB1cGRhdGUgbGlzdC5cbiAgICAgKiAgQHBhcmFtIHthcnJheX0gaW5mby5pdGVtcyBUaGUgbGlzdCBvZiBmaWxlIGluZm9ybWF0aW9uLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gaW5mby5zaXplIFRoZSB0b3RhbCBzaXplLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gaW5mby5jb3VudCBUaGUgY291bnQgb2YgZmlsZXMuXG4gICAgICovXG4gICAgdXBkYXRlVG90YWxJbmZvOiBmdW5jdGlvbihpbmZvKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVRvdGFsQ291bnQoaW5mby5jb3VudCk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVRvdGFsVXNhZ2UoaW5mby5zaXplKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW1zIHRvdGFsIGNvdW50IGFuZCByZWZyZXNoIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0geyhudW1iZXJ8c3RyaW5nKX0gW2NvdW50XSBUb3RhbCBmaWxlIGNvdW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfdXBkYXRlVG90YWxDb3VudDogZnVuY3Rpb24oY291bnQpIHtcblxuICAgICAgICBpZiAoIW5lLnV0aWwuaXNFeGlzdHkoY291bnQpKSB7XG4gICAgICAgICAgICBjb3VudCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4kY291bnRlci5odG1sKGNvdW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW1zIHRvdGFsIHNpemUgYW5kIHJlZnJlc2ggZWxlbWVudFxuICAgICAqIEBwYXJhbSB7KG51bWJlcnxzdHJpbmcpfSBzaXplIFRvdGFsIGZpbGVzIHNpemVzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfdXBkYXRlVG90YWxVc2FnZTogZnVuY3Rpb24oc2l6ZSkge1xuXG4gICAgICAgIGlmICghbmUudXRpbC5pc0V4aXN0eShzaXplKSkge1xuICAgICAgICAgICAgc2l6ZSA9IHRoaXMuX2dldFN1bUFsbEl0ZW1Vc2FnZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuZS51dGlsLmlzTnVtYmVyKHNpemUpICYmICFpc05hTihzaXplKSkge1xuICAgICAgICAgICAgc2l6ZSA9IHV0aWxzLmdldEZpbGVTaXplV2l0aFVuaXQoc2l6ZSk7XG4gICAgICAgICAgICB0aGlzLiRzaXplLmh0bWwoc2l6ZSk7XG4gICAgICAgICAgICB0aGlzLiRzaXplLnNob3coKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuJHNpemUuaGlkZSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN1bSBzaXplcyBvZiBhbGwgaXRlbXMuXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0U3VtQWxsSXRlbVVzYWdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGl0ZW1zID0gdGhpcy5pdGVtcyxcbiAgICAgICAgICAgIHRvdGFsVXNhZ2UgPSAwO1xuXG4gICAgICAgIG5lLnV0aWwuZm9yRWFjaChpdGVtcywgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgdG90YWxVc2FnZSArPSBwYXJzZUZsb2F0KGl0ZW0uc2l6ZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0b3RhbFVzYWdlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZmlsZSBpdGVtc1xuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXQgVGFyZ2V0IGl0ZW0gaW5mb21hdGlvbnMuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRmlsZUl0ZW1zOiBmdW5jdGlvbih0YXJnZXQpIHtcbiAgICAgICAgaWYgKCFuZS51dGlsLmlzQXJyYXkodGFyZ2V0KSkge1xuICAgICAgICAgICAgdGFyZ2V0ID0gW3RhcmdldF07XG4gICAgICAgIH1cbiAgICAgICAgbmUudXRpbC5mb3JFYWNoKHRhcmdldCwgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKHRoaXMuX2NyZWF0ZUl0ZW0oZGF0YSkpO1xuICAgICAgICB9LCB0aGlzKTtcblx0XHR0aGlzLl91cGxvYWRlci5maXJlKCdmaWxlQWRkZWQnLCB7XG5cdFx0XHR0YXJnZXQ6IHRhcmdldFxuXHRcdH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZmlsZSBpdGVtXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGZpbGUgbmFtZSB0byByZW1vdmVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW1vdmVGaWxlSXRlbTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICBuYW1lID0gZGVjb2RlVVJJQ29tcG9uZW50KG5hbWUpO1xuICAgICAgICB0aGlzLml0ZW1zID0gbmUudXRpbC5maWx0ZXIodGhpcy5pdGVtcywgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgdmFyIGlzTWF0Y2ggPSBuYW1lID09PSBkZWNvZGVVUklDb21wb25lbnQoaXRlbS5uYW1lKTtcbiAgICAgICAgICAgIGlmIChpc01hdGNoKSB7XG4gICAgICAgICAgICAgICAgaXRlbS5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fdXBsb2FkZXIucmVtb3ZlKG5hbWUpO1xuXHRcdFx0XHRcdHRoaXMuX3VwbG9hZGVyLmZpcmUoJ2ZpbGVSZW1vdmVkJywge1xuXHRcdFx0XHRcdFx0bmFtZTogbmFtZVxuXHRcdFx0XHRcdH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICFpc01hdGNoO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGl0ZW0gQnkgRGF0YVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhXG4gICAgICogQHJldHVybnMge0l0ZW19XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY3JlYXRlSXRlbTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgaXRlbSA9IG5ldyBJdGVtKHtcbiAgICAgICAgICAgIHJvb3Q6IHRoaXMsXG4gICAgICAgICAgICBuYW1lOiBkYXRhLm5hbWUsXG4gICAgICAgICAgICBzaXplOiBkYXRhLnNpemUsXG4gICAgICAgICAgICBkZWxldGVCdXR0b25DbGFzc05hbWU6IHRoaXMuZGVsZXRlQnV0dG9uQ2xhc3NOYW1lLFxuICAgICAgICAgICAgdXJsOiB0aGlzLnVybCxcbiAgICAgICAgICAgIGhpZGRlbkZyYW1lOiB0aGlzLmZvcm1UYXJnZXQsXG4gICAgICAgICAgICBoaWRkZW5GaWVsZE5hbWU6IHRoaXMuaGlkZGVuRmllbGROYW1lLFxuICAgICAgICAgICAgdGVtcGxhdGU6IHRoaXMudGVtcGxhdGUgJiYgdGhpcy50ZW1wbGF0ZS5pdGVtXG4gICAgICAgIH0pO1xuICAgICAgICBpdGVtLm9uKCdyZW1vdmUnLCB0aGlzLl9yZW1vdmVGaWxlLCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIFJlbW92ZSBGaWxlXG4gICAgICogQHBhcmFtIGRhdGFcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW1vdmVGaWxlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHRoaXMuZmlyZSgncmVtb3ZlJywgZGF0YSk7XG4gICAgfVxufSk7XG5cbm5lLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKExpc3QpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IExpc3Q7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgVGhpcyBpcyBtYW5hZ2VyIG9mIGlucHV0IGVsZW1lbnRzIHRoYXQgYWN0IGxpa2UgZmlsZSBwb29sLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxuLyoqXG4gKiBUaGUgcG9vbCBmb3Igc2F2ZSBmaWxlcy5cbiAqIEl0J3Mgb25seSBmb3IgaW5wdXRbZmlsZV0gZWxlbWVudCBzYXZlIGF0IGJyb3dzZXIgdGhhdCBkb2VzIG5vdCBzdXBwb3J0IGZpbGUgYXBpLlxuICogQHR5cGUgeyp9XG4gKi9cbnZhciBQb29sID0gbmUudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIG5lLmNvbXBvbmVudC5VcGxvYWRlci5Qb29sLnByb3RvdHlwZSAqL3tcbiAgICAvKipcbiAgICAgKiBpbml0aWFsaXplXG4gICAgICovXG4gICAgaW5pdDogZnVuY3Rpb24ocGxhbmV0KSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTdWJtaXR0ZXIgZm9yIGZpbGUgZWxlbWVudCB0byBzZXJ2ZXJcbiAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wbGFuZXQgPSBwbGFuZXQ7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGaWxlIGRhdGEgc3RydWN0dXJlIG9iamVjdChrZXk9bmFtZSA6IHZhbHVlPWl1cHV0IGVsbWVlbnQpO1xuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5maWxlcyA9IHt9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQWN0cyBwb29sIHRvIHNhdmUgaW5wdXQgZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7RG9jdW1lbnRGcmFnbWVudH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2F2ZSBhIGlucHV0IGVsZW1lbnRbdHlwZT1maWxlXSwgYXMgdmFsdWUgb2YgZmlsZSBuYW1lLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBmaWxlIEEgaW5wdXQgZWxlbWVudCB0aGF0IGhhdmUgdG8gYmUgc2F2ZWRcbiAgICAgKi9cbiAgICBzdG9yZTogZnVuY3Rpb24oZmlsZSkge1xuICAgICAgICB0aGlzLmZpbGVzW2ZpbGUuZmlsZV9uYW1lXSA9IGZpbGU7XG4gICAgICAgIHRoaXMuZnJhZy5hcHBlbmRDaGlsZChmaWxlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgaW5wdXQgZWxlbWVudFt0eXBlPWZpbGVdIGZyb20gcG9vbC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBBIGZpbGUgbmFtZSB0aGF0IGhhdmUgdG8gYmUgcmVtb3ZlZC5cbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgdGhpcy5mcmFnLnJlbW92ZUNoaWxkKHRoaXMuZmlsZXNbbmFtZV0pO1xuICAgICAgICBkZWxldGUgdGhpcy5maWxlc1tuYW1lXTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRW1wdHkgcG9vbFxuICAgICAqL1xuICAgIGVtcHR5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgbmUudXRpbC5mb3JFYWNoKHRoaXMuZmlsZXMsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKGRhdGEuZmlsZV9uYW1lKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFBsYW50IGZpbGVzIG9uIHBvb2wgdG8gZm9ybSBpbnB1dFxuICAgICAqL1xuICAgIHBsYW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHBsYW5ldCA9IHRoaXMucGxhbmV0O1xuICAgICAgICBuZS51dGlsLmZvckVhY2godGhpcy5maWxlcywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgcGxhbmV0LmFwcGVuZENoaWxkKGRhdGEpO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuZmlsZXNbZGF0YS5maWxlX25hbWVdO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQb29sO1xuIl19
