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
			if (utils.isSupportDataForm()) {
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

		this._html = this._setHTML();

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
			target: this._target
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
		if (this._isBatchTarnsfer) {
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
		this.fire('change', {
			target: this
		});
	},

	/**
	 * Event-Handle for save input element
	 */
	onSave: function() {
		console.log(this.$input);
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
		if (this.$button) {
			this.$button.before(this.$input);
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25uZWN0b3IvYWpheC5qcyIsInNyYy9qcy9jb25uZWN0b3IvY29ubmVjdG9yLmpzIiwic3JjL2pzL2Nvbm5lY3Rvci9qc29ucC5qcyIsInNyYy9qcy9jb25uZWN0b3IvbG9jYWwuanMiLCJzcmMvanMvc3RhdGljcy5qcyIsInNyYy9qcy91cGxvYWRlci5qcyIsInNyYy9qcy91dGlscy5qcyIsInNyYy9qcy92aWV3L2RyYWcuanMiLCJzcmMvanMvdmlldy9pbnB1dC5qcyIsInNyYy9qcy92aWV3L2l0ZW0uanMiLCJzcmMvanMvdmlldy9saXN0LmpzIiwic3JjL2pzL3ZpZXcvcG9vbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibmUudXRpbC5kZWZpbmVOYW1lc3BhY2UoJ25lLmNvbXBvbmVudC5VcGxvYWRlcicsIHJlcXVpcmUoJy4vc3JjL2pzL3VwbG9hZGVyLmpzJykpO1xuXG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgVGhpcyBDb25uZWN0b3IgbWFrZSBjb25uZWN0aW9uIGJldHdlZW4gRmlsZU1hbmFnZXIgYW5kIGZpbGUgc2VydmVyIGFwaSBhdCBtb2Rlcm4gYnJvd3Nlci48YnI+XG4gKiAgICAgVGhpcyBDb25uZWN0b3IgdXNlIGFqYXguXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG4vKipcbiAqIFRoZSBtb2R1bGVzIHdpbGwgYmUgbWl4ZWQgaW4gY29ubmVjdG9yIGJ5IHR5cGUuXG4gKi9cbnZhciBBamF4ID0gey8qKiBAbGVuZHMgbmUuY29tcG9uZW50LlVwbG9hZGVyLkFqYXggKi9cbiAgICB0eXBlOiAnUE9TVCcsXG4gICAgLyoqXG4gICAgICogUmVxdWVzdCBhamF4IGJ5IGNvbmZpZyB0byBhZGQgZmlsZXMuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGNvbmZpZyBUaGUgY29uZmlndXJhdGlvbiBmb3IgYWpheCByZXF1ZXN0XG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBjb25maWcudXJsIFJlcXVlc3QgdXJsKHVwbG9hZCB1cmwgb3IgcmVtb3ZlIHVybClcbiAgICAgKiAgQHBhcmFtIHtmdW5jdGlvbn0gY29uZmlnLnN1Y2Nlc3MgQ2FsbGJhY2sgZnVuY3Rpb24gd2hlbiByZXF1ZXN0IHN1Y2Vlc3MuXG4gICAgICogIEBwYXJhbSB7ZnVuY3Rpb259IGNvbmZpZy5lcnJvciBDYWxsYmFjayBmdW5jdGlvbiB3aGVuIHJlcXVlc3QgZmFpbGQuXG4gICAgICovXG4gICAgYWRkUmVxdWVzdDogZnVuY3Rpb24oY29uZmlnLCBmaWxlcykge1xuICAgICAgICB2YXIgdXBsb2FkZXIgPSB0aGlzLl91cGxvYWRlcixcbiAgICAgICAgICAgICRmb3JtID0gdXBsb2FkZXIuaW5wdXRWaWV3LiRlbCxcbiAgICAgICAgICAgIGNhbGxiYWNrID0gbmUudXRpbC5iaW5kKHRoaXMuc3VjY2Vzc1BhZGRpbmcsIHRoaXMsIGNvbmZpZy5zdWNjZXNzKTtcbiAgICBcblx0XHRpZiAoZmlsZXMpIHtcblx0XHRcdHRoaXMuZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcblx0XHRcdG5lLnV0aWwuZm9yRWFjaChmaWxlcywgZnVuY3Rpb24oZSkge1xuXHRcdFx0XHR0aGlzLmZvcm1EYXRhLmFwcGVuZCh1cGxvYWRlci5maWxlRmllbGQsIGUpO1xuXHRcdFx0fSwgdGhpcyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoJGZvcm1bMF0pO1xuXHRcdH1cblx0XHQkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiB0aGlzLl91cGxvYWRlci51cmwuc2VuZCxcbiAgICAgICAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgICAgICAgIGRhdGE6IHRoaXMuZm9ybURhdGEsXG4gICAgICAgICAgICBzdWNjZXNzOiBjYWxsYmFjayxcbiAgICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiBjb25maWcuZXJyb3JcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByZXByb2Nlc3NpbmcgY2FsbGJhY2sgYmVmb3JlIGNhbGxiYWNrIHJ1bi5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBSZXF1ZXN0IENhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIFJlc3BvbnNlIGZyb20gc2VydmVyXG4gICAgICovXG4gICAgc3VjY2Vzc1BhZGRpbmc6IGZ1bmN0aW9uKGNhbGxiYWNrLCByZXNwb25zZSkge1xuICAgICAgICB2YXIganNvbiA9IEpTT04ucGFyc2UocmVzcG9uc2UpLFxuICAgICAgICAgICAgcmVzdWx0ID0ge307XG5cbiAgICAgICAgcmVzdWx0Lml0ZW1zID0ganNvbi5maWxlbGlzdDtcbiAgICAgICAgY2FsbGJhY2socmVzdWx0KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVxdWVzdCBhamF4IGJ5IGNvbmZpZyB0byByZW1vdmUgZmlsZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gY29uZmlnXG4gICAgICovXG4gICAgcmVtb3ZlUmVxdWVzdDogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IG5lLnV0aWwuYmluZCh0aGlzLnJlbW92ZVBhZGRpbmcsIHRoaXMsIGNvbmZpZy5zdWNjZXNzKTtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogdGhpcy5fdXBsb2FkZXIudXJsLnJlbW92ZSxcbiAgICAgICAgICAgIGRhdGE6IGNvbmZpZy5kYXRhLFxuICAgICAgICAgICAgc3VjY2VzczogY2FsbGJhY2ssXG4gICAgICAgICAgICBlcnJvcjogY29uZmlnLmVycm9yXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcmVwcm9jZXNzaW5nIHJlc3BvbnNlIGJlZm9yZSBjYWxsYmFjayBydW4uXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgUmVxdWVzdCBDYWxsYmFjayBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSBSZXNwb25zZSBmcm9tIHNlcnZlclxuICAgICAqL1xuICAgIHJlbW92ZVBhZGRpbmc6IGZ1bmN0aW9uKGNhbGxiYWNrLCByZXNwb25zZSkge1xuICAgICAgICB2YXIganNvbiA9IEpTT04ucGFyc2UocmVzcG9uc2UpLFxuICAgICAgICAgICAgcmVzdWx0ID0ge307XG5cbiAgICAgICAgcmVzdWx0LmFjdGlvbiA9ICdyZW1vdmUnO1xuICAgICAgICByZXN1bHQubmFtZSA9IGRlY29kZVVSSUNvbXBvbmVudChqc29uLm5hbWUpO1xuXG4gICAgICAgIGNhbGxiYWNrKHJlc3VsdCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBBamF4OyIsIi8qKlxuICogQGZpbGVvdmVydmlldyBBIENvbm5lY3RvciBtYWtlIGNvbm5lY3Rpb24gYmV0d2VlbiBGaWxlTWFuYWdlciBhbmQgZmlsZSBzZXJ2ZXIgQVBJLjxicj4gVGhlIENvbm5lY3RvciBpcyBpbnRlcmZhY2UuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG52YXIgQWpheCA9IHJlcXVpcmUoJy4vYWpheCcpO1xudmFyIEpzb25wID0gcmVxdWlyZSgnLi9qc29ucCcpO1xudmFyIExvY2FsID0gcmVxdWlyZSgnLi9sb2NhbCcpO1xuXG4vKipcbiAqIFRoZSBjb25uZWN0b3IgY2xhc3MgY291bGQgY29ubmVjdCB3aXRoIHNlcnZlciBhbmQgcmV0dXJuIHNlcnZlciByZXNwb25zZSB0byBjYWxsYmFjay5cbiAqL1xudmFyIE1vZHVsZVNldHMgPSB7XG4gICAgJ2FqYXgnOiBBamF4LFxuICAgICdqc29ucCc6IEpzb25wLFxuICAgICdsb2NhbCc6IExvY2FsXG59O1xuXG4vKipcbiAqIFRoaXMgaXMgSW50ZXJmYWNlIHRvIGJlIGltcGxlbWVudGVkIGJ5IGNvbm5lY3RvcnNcbiAqL1xudmFyIENvbm5lY3RvciA9IHtcbiAgICAvKipcbiAgICAgKiBBIGludGVyZmFjZSByZW1vdmVSZXF1ZXN0IHRvIGltcGxlbWVudFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIEEgaW5mb3JtYXRpb24gZm9yIGRlbGV0ZSBmaWxlXG4gICAgICovXG4gICAgcmVtb3ZlUmVxdWVzdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBpbnRlcmZhY2UgcmVtb3ZlUmVxdWVzdCBkb2VzIG5vdCBleGlzdCcpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBIGludGVyZmFjZSBhZGRSZXF1ZXN0IHRvIGltcGxlbWVudFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIEEgaW5mb3JtYXRpb24gZm9yIGFkZCBmaWxlXG4gICAgICovXG4gICAgYWRkUmVxdWVzdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBpbnRlcmZhY2UgYWRkUmVxdWVzdCBkb2VzIG5vdCBleGlzdCcpO1xuICAgIH1cblxufTtcblxuLyoqXG4gKiBUaGUgZmFjdG9yeSBtb2R1bGUgZm9yIGNvbm5lY3RvcnMuXG4gKiBHZXQgZWFjaCBjb25uZWN0b3IgYnkgZWFjaCB0eXBlLlxuICovXG52YXIgRmFjdG9yeSA9IHtcbiAgICAvKipcbiAgICAgKiBDaG9vc2UgY29ubmVjdG9yXG4gICAgICogQHBhcmFtIHVwbG9hZGVyXG4gICAgICogQHJldHVybnMge3tfdXBsb2FkZXI6ICp9fVxuICAgICAqL1xuICAgIGdldENvbm5lY3RvcjogZnVuY3Rpb24odXBsb2FkZXIpIHtcbiAgICAgICAgdmFyIHR5cGUgPSB1cGxvYWRlci50eXBlLnRvTG93ZXJDYXNlKCksXG4gICAgICAgICAgICBjb25uID0ge1xuICAgICAgICAgICAgICAgIF91cGxvYWRlcjogdXBsb2FkZXJcbiAgICAgICAgICAgIH07XG4gICAgICAgIG5lLnV0aWwuZXh0ZW5kKGNvbm4sIENvbm5lY3RvciwgTW9kdWxlU2V0c1t0eXBlXSB8fCBMb2NhbCk7XG4gICAgICAgIHJldHVybiBjb25uO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRmFjdG9yeTtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIENvbm5lY3RvciBtYWtlIGNvbm5lY3Rpb24gYmV0d2VlbiBGaWxlTWFuYWdlciBhbmQgZmlsZSBzZXJ2ZXIgYXBpIGF0IG9sZCBicm93c2VyLjxicj5cbiAqICAgICBUaGlzIENvbm5lY3RvciB1c2UgaGlkZGVuIGlmcmFtZS5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbi8qKlxuICogVGhlIG1vZHVsZXMgd2lsbCBiZSBtaXhlZCBpbiBjb25uZWN0b3IgYnkgdHlwZS5cbiAqL1xudmFyIEpzb25wID0gey8qKiBAbGVuZHMgbmUuY29tcG9uZW50LlVwbG9hZGVyLkpzb25wICovXG4gICAgLyoqXG4gICAgICogUmVxdWVzdCBieSBmb3JtIHN1Ym1pdC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gY29uZmlnIENvbmZpZ3VyYXRpb24gZm9yIHN1Ym1pdCBmb3JtLlxuICAgICAqICBAcGFyYW0ge2Z1bmN0aW9ufSBjb25maWcuc3VjY2VzcyBDYWxsYmFjayB3aGVuIHBvc3Qgc3VibWl0IGNvbXBsYXRlLlxuICAgICAqL1xuICAgIGFkZFJlcXVlc3Q6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgICB2YXIgY2FsbGJhY2tOYW1lID0gdGhpcy5fdXBsb2FkZXIuY2FsbGJhY2tOYW1lLFxuICAgICAgICBjYWxsYmFjayA9IGNvbmZpZy5zdWNjZXNzO1xuICAgICAgICBuZS51dGlsLmRlZmluZU5hbWVzcGFjZShjYWxsYmFja05hbWUsICBuZS51dGlsLmJpbmQodGhpcy5zdWNjZXNzUGFkZGluZywgdGhpcywgY2FsbGJhY2spKTtcblxuXHRcdHRoaXMuX3VwbG9hZGVyLmlucHV0Vmlldy4kZWwuc3VibWl0KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByZXByb2Nlc3NpbmcgcmVzcG9uc2UgYmVmb3JlIGNhbGxiYWNrIHJ1bi5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBSZXF1ZXN0IENhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIFJlc3BvbnNlIGZyb20gc2VydmVyXG4gICAgICovXG4gICAgc3VjY2Vzc1BhZGRpbmc6IGZ1bmN0aW9uKGNhbGxiYWNrLCByZXNwb25zZSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0ge307XG5cblx0XHRpZiAodGhpcy5fdXBsb2FkZXIuaXNDcm9zc0RvbWFpbigpKSB7XG4gICAgICAgICAgICByZXN1bHQuaXRlbXMgPSB0aGlzLl9nZXRTcGxpdEl0ZW1zKHJlc3BvbnNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdC5pdGVtcyA9IHJlc3BvbnNlLmZpbGVsaXN0O1xuICAgICAgICB9XG5cbiAgICAgICAgY2FsbGJhY2socmVzdWx0KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSBxdWVyeSBkYXRhIHRvIGFycmF5XG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgVGhlIERhdGEgZXh0cmFjdGVkIGZyb20gcXVlcnlzdHJpbmcgc2VwYXJhdGVkIGJ5ICcmJ1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldFNwbGl0SXRlbXM6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIHNlcCA9IHRoaXMuX3VwbG9hZGVyLnNlcGFyYXRvcixcbiAgICAgICAgICAgIHN0YXR1cyA9IGRhdGEuc3RhdHVzLnNwbGl0KHNlcCksXG4gICAgICAgICAgICBuYW1lcyA9IGRhdGEubmFtZXMuc3BsaXQoc2VwKSxcbiAgICAgICAgICAgIHNpemVzID0gZGF0YS5zaXplcy5zcGxpdChzZXApLFxuICAgICAgICAgICAgaWRzID0gbmUudXRpbC5pc1N0cmluZyhkYXRhLmlkcykgPyBkYXRhLmlkcy5zcGxpdChzZXApIDogbmFtZXMsXG4gICAgICAgICAgICBpdGVtcyA9IFtdO1xuXG4gICAgICAgIG5lLnV0aWwuZm9yRWFjaChzdGF0dXMsIGZ1bmN0aW9uKGl0ZW0sIGluZGV4KSB7XG4gICAgICAgICAgICBpZiAoaXRlbSA9PT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5JdGVtID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBuYW1lc1tpbmRleF0sXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czogc3RhdHVzW2luZGV4XSxcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogc2l6ZXNbaW5kZXhdLFxuICAgICAgICAgICAgICAgICAgICBpZDogaWRzW2luZGV4XVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaXRlbXMucHVzaChuSXRlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaXRlbXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlcXVlc3QgYWpheCBieSBjb25maWcgdG8gcmVtb3ZlIGZpbGUuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGNvbmZpZ1xuICAgICAqL1xuICAgIHJlbW92ZVJlcXVlc3Q6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgICB2YXIgY2FsbGJhY2tOYW1lID0gdGhpcy5fdXBsb2FkZXIuY2FsbGJhY2tOYW1lLFxuICAgICAgICAgICAgZGF0YSA9IHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjazogY2FsbGJhY2tOYW1lXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2FsbGJhY2sgPSBjb25maWcuc3VjY2VzcztcblxuICAgICAgICBuZS51dGlsLmRlZmluZU5hbWVzcGFjZShjYWxsYmFja05hbWUsIG5lLnV0aWwuYmluZCh0aGlzLnJlbW92ZVBhZGRpbmcsIHRoaXMsIGNhbGxiYWNrKSwgdHJ1ZSk7XG5cbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogdGhpcy5fdXBsb2FkZXIudXJsLnJlbW92ZSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbnAnLFxuICAgICAgICAgICAganNvbnA6IGNhbGxiYWNrTmFtZSxcbiAgICAgICAgICAgIGRhdGE6IG5lLnV0aWwuZXh0ZW5kKGRhdGEsIGNvbmZpZy5kYXRhKVxuICAgICAgICB9KTtcblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcmVwcm9jZXNzaW5nIHJlc3BvbnNlIGJlZm9yZSBjYWxsYmFjayBydW4uXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgUmVxdWVzdCBDYWxsYmFjayBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSBSZXNwb25zZSBmcm9tIHNlcnZlclxuICAgICAqL1xuICAgIHJlbW92ZVBhZGRpbmc6IGZ1bmN0aW9uKGNhbGxiYWNrLCByZXNwb25zZSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICAgIHJlc3VsdC5hY3Rpb24gPSAncmVtb3ZlJztcbiAgICAgICAgcmVzdWx0Lm5hbWUgPSBkZWNvZGVVUklDb21wb25lbnQocmVzcG9uc2UubmFtZSk7XG5cbiAgICAgICAgY2FsbGJhY2socmVzdWx0KTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEpzb25wO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXZpZXcgVGhpcyBDb25uZWN0b3IgbWFrZSBjb25uZWN0aW9uIGJldHdlZW4gVXBsb2FkZXIgYW5kIGh0bWw1IGZpbGUgYXBpLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cbi8qKlxuICogVGhlIG1vZHVsZXMgd2lsbCBiZSBtaXhlZCBpbiBjb25uZWN0b3IgYnkgdHlwZS5cbiAqL1xudmFyIExvY2FsID0gey8qKiBAbGVuZHMgbmUuY29tcG9uZW50LlVwbG9hZGVyLkxvY2FsICovXG4gICAgLyoqXG4gICAgICogQSByZXN1bHQgYXJyYXkgdG8gc2F2ZSBmaWxlIHRvIHNlbmQuXG4gICAgICovXG4gICAgX3Jlc3VsdCA6IG51bGwsXG4gICAgLyoqXG4gICAgICogQWRkIFJlcXVlc3QsIHNhdmUgZmlsZXMgdG8gYXJyYXkuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgVGhlIGRhdGEgb2YgY29ubmVjdGlvbiBmb3Igc2VydmVyXG5cdFx0ICogQHBhcmFtIHtvYmplY3R9IFtmaWxlc10gVGhlIGZpbGVzIHRvIHNhdmVcbiAgICAgKi9cbiAgICBhZGRSZXF1ZXN0OiBmdW5jdGlvbihkYXRhLCBmaWxlcykge1xuICAgICAgICB2YXIgaXNWYWxpZFBvb2wgPSB1dGlscy5pc1N1cHBvcnRGb3JtRGF0YSgpLFxuICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5fc2F2ZUZpbGUoaXNWYWxpZFBvb2wsIGZpbGVzKTtcbiAgICAgICAgZGF0YS5zdWNjZXNzKHtcbiAgICAgICAgICAgIGl0ZW1zOiByZXN1bHRcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNhdmUgZmlsZSB0byBwb29sXG4gICAgICogQHBhcmFtIHtib29sZWFufSBpc1N1cHBvcnRBamF4IFdoZXRoZXIgRm9ybURhdGEgaXMgc3VwcG9ydGVkIG9yIG5vdFxuXHRcdCAqIEBwYXJhbSB7b2JqZWN0fSBbZmlsZXNdIFRoZSBmaWxlcyB0byBzYXZlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2F2ZUZpbGU6IGZ1bmN0aW9uKGlzU3VwcG9ydEFqYXgsIGZpbGVzKSB7XG4gICAgICAgIHZhciB1cGxvYWRlciA9IHRoaXMuX3VwbG9hZGVyLFxuICAgICAgICAgICAgaW5wdXRWaWV3ID0gdXBsb2FkZXIuaW5wdXRWaWV3LFxuICAgICAgICAgICAgZmlsZUVsID0gaW5wdXRWaWV3LiRpbnB1dFswXSxcblx0XHRcdFx0XHRcdHJlc3VsdCA9IFtdO1xuXG4gICAgICAgIGlmICghdGhpcy5fcmVzdWx0KSB7XG4gICAgICAgICAgICB0aGlzLl9yZXN1bHQgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc1N1cHBvcnRBamF4KSB7XG4gICAgICAgICAgICBmaWxlcyA9IGZpbGVzIHx8IGZpbGVFbC5maWxlcztcbiAgICAgICAgICAgIG5lLnV0aWwuZm9yRWFjaChmaWxlcywgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgICAgIGlmIChuZS51dGlsLmlzT2JqZWN0KGl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goe1xuICAgICAgICAgICAgICAgIG5hbWU6IGZpbGVFbC52YWx1ZSxcbiAgICAgICAgICAgICAgICBlbGVtZW50OiBmaWxlRWxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cblx0XHR0aGlzLl9yZXN1bHQgPSB0aGlzLl9yZXN1bHQuY29uY2F0KHJlc3VsdCk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2VzIGZvcm0gZGF0YSB0byBzZW5kIFBPU1QoRm9ybURhdGUgc3VwcG9ydGVkIGNhc2UpXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbWFrZUZvcm1EYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHVwbG9hZGVyID0gdGhpcy5fdXBsb2FkZXIsXG5cdFx0ZmllbGQgPSB1cGxvYWRlci5maWxlRmllbGQsXG5cdFx0aW5wdXQgPSB1cGxvYWRlci5pbnB1dFZpZXcsXG5cdFx0Zm9ybSA9IG5ldyB3aW5kb3cuRm9ybURhdGEodGhpcy5fZXh0cmFjdEZvcm0oaW5wdXQpKTtcblxuICAgICAgICBuZS51dGlsLmZvckVhY2godGhpcy5fcmVzdWx0LCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICBmb3JtLmFwcGVuZChmaWVsZCwgaXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZm9ybTtcbiAgICB9LFxuXG5cdC8qKlxuXHQgKiBFeHRyYWN0cyBGb3JtIGZyb20gaW5wdXRWaWV3XG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBpbnB1dCBUaGUgaW5wdXQgdmlldyBmb3IgZXh0cmFjdGluZyBcblx0ICovXG5cdF9leHRyYWN0Rm9ybTogZnVuY3Rpb24oaW5wdXQpIHtcblx0dmFyIGZvcm0gPSBpbnB1dC4kZWwuY2xvbmUoKTtcblx0XHQvLyBhcHBlbmQgdG8gcG9vbFxuXHRcdHJldHVybiBmb3JtWzBdO1xuXHR9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpbGUgZm9ybSByZXN1bHQgYXJyYXlcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gaW5mbyBUaGUgaW5mb3JtYXRpb24gc2V0IHRvIHJlbW92ZSBmaWxlXG4gICAgICovXG4gICAgcmVtb3ZlUmVxdWVzdDogZnVuY3Rpb24oaW5mbykge1xuICAgICAgICB2YXIgZGF0YSA9IGluZm8uZGF0YTtcbiAgICAgICAgdGhpcy5fcmVzdWx0ID0gbmUudXRpbC5maWx0ZXIodGhpcy5fcmVzdWx0LCBmdW5jdGlvbihlbCkge1xuICAgICAgICAgICAgcmV0dXJuIGVsLm5hbWUgIT09IGRhdGEuZmlsZW5hbWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGluZm8uc3VjY2Vzcyh7XG4gICAgICAgICAgICBhY3Rpb246ICdyZW1vdmUnLFxuICAgICAgICAgICAgbmFtZTogZGF0YS5maWxlbmFtZVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2VuZCBmaWxlcyBpbiBhIGJhdGNoLlxuICAgICAqIEBwYXJhbSBjYWxsYmFja1xuICAgICAqL1xuICAgIHN1Ym1pdDogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGZvcm0gPSB0aGlzLl9tYWtlRm9ybURhdGEoaW5wdXRWaWV3KTtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogdGhpcy5fdXBsb2FkZXIudXJsLnNlbmQsXG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICBkYXRhOiBmb3JtLFxuICAgICAgICAgICAgc3VjY2VzczogY2FsbGJhY2ssXG4gICAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgICBjb250ZW50VHlwZTogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBMb2NhbDsiLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29uZmlndXJhdGlvbiBvciBkZWZhdWx0IHZhbHVlcy5cbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbi8qKlxuICogQ29uZmlndXJhdGlvbiBvZiBjb25uZWN0aW9uIHdpdGggc2VydmVyLlxuICAqIEB0eXBlIHt7UkVTUE9OU0VfVFlQRTogc3RyaW5nLCBSRURJUkVDVF9VUkw6IHN0cmluZ319XG4gKi9cbm1vZHVsZS5leHBvcnRzLkNPTkYgPSB7XG5cdFJFU1BPTlNFX1RZUEU6ICdSRVNQT05TRV9UWVBFJyxcblx0UkVESVJFQ1RfVVJMOiAnUkVESVJFQ1RfVVJMJyxcblx0SlNPTlBDQUxMQkFDS19OQU1FOiAnQ0FMTEJBQ0tfTkFNRScsXG5cdFNJWkVfVU5JVDogJ1NJWkVfVU5JVCcsXG5cdFJFTU9WRV9DQUxMQkFDSyA6ICdyZXNwb25zZVJlbW92ZUNhbGxiYWNrJyxcblx0RVJST1I6IHtcblx0XHRERUZBVUxUOiAnVW5rbm93biBlcnJvci4nLFxuXHRcdE5PVF9TVVJQUE9SVDogJ1RoaXMgaXMgeC1kb21haW4gY29ubmVjdGlvbiwgeW91IGhhdmUgdG8gbWFrZSBoZWxwZXIgcGFnZS4nXG5cdH0sXG5cdERSQUdfREVGQVVMVF9FTkFCTEVfQ0xBU1M6ICdlbmFibGVDbGFzcycsXG5cdEZJTEVfRklMRURfTkFNRTogJ3VzZXJmaWxlW10nLFxuXHRGT0xERVJfSU5GTzogJ2ZvbGRlck5hbWUnXG59O1xuXG4vKipcbiogRGVmYXVsdCBIdG1sc1xuKiBAdHlwZSB7e2lucHV0OiBzdHJpbmcsIGl0ZW06IHN0cmluZ319XG4qL1xubW9kdWxlLmV4cG9ydHMuSFRNTCA9IHtcblx0Zm9ybTogWyc8Zm9ybSBlbmN0eXBlPVwibXVsdGlwYXJ0L2Zvcm0tZGF0YVwiIGlkPVwiZm9ybURhdGFcIiBtZXRob2Q9XCJwb3N0XCI+Jyxcblx0XHQnPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwiTUFYX0ZJTEVfU0laRVwiIHZhbHVlPVwiMzAwMDAwMFwiIC8+Jyxcblx0JzwvZm9ybT4nXS5qb2luKCcnKSxcblx0aW5wdXQ6IFsnPGlucHV0IHR5cGU9XCJmaWxlXCIgaWQ9XCJmaWxlQXR0YWNoXCIge3t3ZWJraXRkaXJlY3Rvcnl9fSBuYW1lPVwie3tmaWxlRmllbGR9fVwiIHt7bXVsdGlwbGV9fSAvPiddLmpvaW4oJycpLFxuXHRzdWJtaXQ6IFsnPGJ1dHRvbiBjbGFzcz1cImJhdGNoU3VibWl0XCIgdHlwZT1cInN1Ym1pdFwiPlNFTkQ8L2J1dHRvbj4nXS5qb2luKCcnKSxcblx0aXRlbTogWyc8bGkgY2xhc3M9XCJmaWxldHlwZURpc3BsYXlDbGFzc1wiPicsXG5cdFx0JzxzcG5hIGNsYXNzPVwiZmlsZWljb24ge3tmaWxldHlwZX19XCI+e3tmaWxldHlwZX19PC9zcG5hPicsXG5cdFx0JzxzcGFuIGNsYXNzPVwiZmlsZV9uYW1lXCI+e3tmaWxlbmFtZX19PC9zcGFuPicsXG5cdFx0JzxzcGFuIGNsYXNzPVwiZmlsZV9zaXplXCI+e3tmaWxlc2l6ZX19PC9zcGFuPicsXG5cdFx0JzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwie3tkZWxldGVCdXR0b25DbGFzc05hbWV9fVwiPkRlbGV0ZTwvYnV0dG9uPicsXG5cdFx0JzwvbGk+J10uam9pbignJyksXG5cdGRyYWc6IFsnPGRpdiBjbGFzcz1cImRyYWd6b25lXCI+PC9kaXY+J10uam9pbignJylcbn07XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmlsZVVwbG9hZGVyIGlzIGNvcmUgb2YgZmlsZSB1cGxvYWRlciBjb21wb25lbnQuPGJyPkZpbGVNYW5hZ2VyIG1hbmFnZSBjb25uZWN0b3IgdG8gY29ubmVjdCBzZXJ2ZXIgYW5kIHVwZGF0ZSBGaWxlTGlzdFZpZXcuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG52YXIgc3RhdGljcyA9IHJlcXVpcmUoJy4vc3RhdGljcycpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIGNvbm4gPSByZXF1aXJlKCcuL2Nvbm5lY3Rvci9jb25uZWN0b3InKTtcbnZhciBJbnB1dCA9IHJlcXVpcmUoJy4vdmlldy9pbnB1dCcpO1xudmFyIExpc3QgPSByZXF1aXJlKCcuL3ZpZXcvbGlzdCcpO1xudmFyIFBvb2wgPSByZXF1aXJlKCcuL3ZpZXcvcG9vbCcpO1xudmFyIERyYWdBbmREcm9wID0gcmVxdWlyZSgnLi92aWV3L2RyYWcnKTtcblxuLyoqXG4gKiBGaWxlVXBsb2FkZXIgYWN0IGxpa2UgYnJpZGdlIGJldHdlZW4gY29ubmVjdG9yIGFuZCB2aWV3LlxuICogSXQgbWFrZXMgY29ubmVjdG9yIGFuZCB2aWV3IHdpdGggb3B0aW9uIGFuZCBlbnZpcm9ubWVudC5cbiAqIEl0IGNvbnRyb2wgYW5kIG1ha2UgY29ubmVjdGlvbiBhbW9uZyBtb2R1bGVzLlxuICogQGNvbnN0cnVjdG9yIG5lLmNvbXBvbmVudC5VcGxvYWRlclxuICogQGV4YW1wbGVcbiAqIHZhciB1cGxvYWRlciA9IG5ldyBuZS5jb21wb25lbnQuVXBsb2FkZXIoe1xuICogICAgIHVybDoge1xuICogICAgICAgICBzZW5kOiBcImh0dHA6Ly9mZS5uaG5lbnQuY29tL2V0Yy9ldGMvdXBsb2FkZXIvdXBsb2FkZXIucGhwXCIsXG4gKiAgICAgICAgIHJlbW92ZTogXCJodHRwOi8vZmUubmhuZW50LmNvbS9ldGMvZXRjL3VwbG9hZGVyL3JlbW92ZS5waHBcIlxuICogICAgIH0sXG4gKiAgICAgaGVscGVyOiB7XG4gKiAgICAgICAgIHVybDogJ2h0dHA6Ly8xMC43Ny4zNC4xMjY6ODAwOS9zYW1wbGVzL3Jlc3BvbnNlLmh0bWwnLFxuICogICAgICAgICBuYW1lOiAnUkVESVJFQ1RfVVJMJ1xuICogICAgIH0sXG4gKiAgICAgcmVzdWx0VHlwZUVsZW1lbnROYW1lOiAnUkVTUE9OU0VfVFlQRScsXG4gKiAgICAgZm9ybVRhcmdldDogJ2hpZGRlbkZyYW1lJyxcbiAqICAgICBjYWxsYmFja05hbWU6ICdyZXNwb25zZUNhbGxiYWNrJyxcbiAqICAgICBsaXN0SW5mbzoge1xuICogICAgICAgICBsaXN0OiAkKCcjZmlsZXMnKSxcbiAqICAgICAgICAgY291bnQ6ICQoJyNmaWxlX2NvdW50JyksXG4gKiAgICAgICAgIHNpemU6ICQoJyNzaXplX2NvdW50JylcbiAqICAgICB9LFxuICogICAgIHNlcGFyYXRvcjogJzsnXG4gKiB9LCAkKCcjdXBsb2FkZXInKSk7XG4gKi9cbnZhciBVcGxvYWRlciA9IG5lLnV0aWwuZGVmaW5lQ2xhc3MoLyoqQGxlbmRzIG5lLmNvbXBvbmVudC5VcGxvYWRlci5wcm90b3R5cGUgKi97XG5cblx0LyoqXG5cdCAqIGluaXRpYWxpemUgb3B0aW9uc1xuXHQgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBUaGUgb3B0aW9ucyB0byBzZXQgdXAgZmlsZSB1cGxvYWRlciBtb2R1bGVzLlxuXHQgKiAgQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMudXJsIFRoZSB1cmwgaXMgZmlsZSBzZXJ2ZXIuXG5cdCAqICAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMudXJsLnNlbmQgVGhlIHVybCBpcyBmb3IgZmlsZSBhdHRhY2guXG5cdCAqICAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMudXJsLnJlbW92ZSBUaGUgdXJsIGlzIGZvciBmaWxlIGRldGFjaC5cblx0ICogIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLmhlbHBlciBUaGUgaGVscGVyIG9iamVjdCBpbmZvIGlzIGZvciB4LWRvbWFpbi5cblx0ICogICAgICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5oZWxwZXIudXJsIFRoZSB1cmwgaXMgaGVscGVyIHBhZ2UgdXJsLlxuXHQgKiAgICAgIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmhlbHBlci5uYW1lIFRoZSBuYW1lIG9mIGhpZGRlbiBlbGVtZW50IGZvciBzZW5kaW5nIHNlcnZlciBoZWxwZXIgcGFnZSBpbmZvcm1hdGlvbi5cblx0ICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnJlc3VsdFR5cGVFbGVtZW50TmFtZSBUaGUgdHlwZSBvZiBoaWRkZW4gZWxlbWVudCBmb3Igc2VuZGluZyBzZXJ2ZXIgcmVzcG9uc2UgdHlwZSBpbmZvcm1hdGlvbi5cblx0ICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmZvcm1UYXJnZXQgVGhlIHRhcmdldCBmb3IgeC1kb21haW4ganNvbnAgY2FzZS5cblx0ICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmNhbGxiYWNrTmFtZSBUaGUgbmFtZSBvZiBqc29ucCBjYWxsYmFjayBmdW5jdGlvbi5cblx0ICogIEBwYXJhbSB7b2JqZWN0fSBvcGl0b25zLmxpc3RJbmZvIFRoZSBlbGVtZW50IGluZm8gdG8gZGlzcGxheSBmaWxlIGxpc3QgaW5mb3JtYXRpb24uXG5cdCAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5zZXBhcmF0b3IgVGhlIHNlcGFyYXRvciBmb3IganNvbnAgaGVscGVyIHJlc3BvbnNlLlxuXHQgKiAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmZpbGVGaWVsZD11c2VyRmlsZV0gVGhlIGZpZWxkIG5hbWUgb2YgaW5wdXQgZmlsZSBlbGVtZW50LlxuXHQgKiAgQHBhcmFtIHtib29sZWFufSBvcHRpb25zLnVzZUZvbGRlciBXaGV0aGVyIHNlbGVjdCB1bml0IGlzIGZvbGRlciBvZiBub3QuIElmIHRoaXMgaXMgdHVyZSwgbXVsdGlwbGUgd2lsbCBiZSBpZ25vcmVkLlxuXHQgKiAgQHBhcmFtIHtib29sZWFufSBvcHRpb25zLmlzTXVsdGlwbGUgV2hldGhlciBlbmFibGUgbXVsdGlwbGUgc2VsZWN0IG9yIG5vdC5cblx0ICogQHBhcmFtIHtKcXVlcnlPYmplY3R9ICRlbCBSb290IEVsZW1lbnQgb2YgVXBsb2FkZXJcblx0ICovXG5cdGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMsICRlbCkge1xuXHRcdHRoaXMuX3NldERhdGEob3B0aW9ucyk7XG5cdFx0dGhpcy5fc2V0Q29ubmVjdG9yKCk7XG5cblx0XHR0aGlzLiRlbCA9ICRlbDtcblxuXHRcdGlmKHRoaXMudXNlRHJhZyAmJiAhdGhpcy51c2VGb2xkZXIgJiYgdXRpbHMuaXNTdXBwb3J0RmlsZVN5c3RlbSgpKSB7XG5cdFx0XHR0aGlzLmRyYWdWaWV3ID0gbmV3IERyYWdBbmREcm9wKG9wdGlvbnMsIHRoaXMpO1xuXHRcdH1cblxuXHRcdHRoaXMuaW5wdXRWaWV3ID0gbmV3IElucHV0KG9wdGlvbnMsIHRoaXMpO1xuXHRcdHRoaXMubGlzdFZpZXcgPSBuZXcgTGlzdChvcHRpb25zLCB0aGlzKTtcblxuXHRcdHRoaXMuZmlsZUZpZWxkID0gdGhpcy5maWxlRmllbGQgfHwgc3RhdGljcy5DT05GLkZJTEVfRklMRURfTkFNRTtcblx0XHR0aGlzLl9wb29sID0gbmV3IFBvb2wodGhpcy5saXN0Vmlldy4kZWxbMF0pO1xuXHRcdHRoaXMuX2FkZEV2ZW50KCk7XG5cdH0sXG5cdFxuXHQvKipcblx0ICogU2V0IENvbm5lY3RvciBieSB1c2VKc29ucCBmbGFnIGFuZCB3aGV0aGVyLlxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X3NldENvbm5lY3RvcjogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMuaXNCYXRjaFRyYW5zZmVyKSB7XG5cdFx0XHR0aGlzLnR5cGUgPSAnbG9jYWwnO1xuXHRcdH0gZWxzZSBpZiAodGhpcy5pc0Nyb3NzRG9tYWluKCkpIHtcblx0XHRcdGlmICh0aGlzLmhlbHBlcikge1xuXHRcdFx0XHR0aGlzLnR5cGUgPSAnanNvbnAnO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YWxlcnQoc3RhdGljcy5DT05GLkVSUk9SLk5PVF9TVVJQUE9SVCk7XG4gICAgICAgICAgICAgICAgdGhpcy50eXBlID0gJ2xvY2FsJzsgICAgXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmICh0aGlzLnVzZUpzb25wIHx8ICF1dGlscy5pc1N1cHBvcnRGb3JtRGF0YSgpKSB7XG5cdFx0XHRcdHRoaXMudHlwZSA9ICdqc29ucCc7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLnR5cGUgPSAnYWpheCc7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHRoaXMuX2Nvbm5lY3RvciA9IGNvbm4uZ2V0Q29ubmVjdG9yKHRoaXMpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBVcGRhdGUgbGlzdCB2aWV3IHdpdGggY3VzdG9tIG9yIG9yaWdpbmFsIGRhdGEuXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBpbmZvIFRoZSBkYXRhIGZvciB1cGRhdGUgbGlzdFxuXHQgKiAgQHBhcmFtIHtzdHJpbmd9IGluZm8uYWN0aW9uIFRoZSBhY3Rpb24gbmFtZSB0byBleGVjdXRlIG1ldGhvZFxuXHQgKi9cblx0bm90aWZ5OiBmdW5jdGlvbihpbmZvKSB7XG5cdFx0dGhpcy5saXN0Vmlldy51cGRhdGUoaW5mbyk7XG5cdFx0dGhpcy5saXN0Vmlldy51cGRhdGVUb3RhbEluZm8oaW5mbyk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFNldCBmaWVsZCBkYXRhIGJ5IG9wdGlvbiB2YWx1ZXMuXG5cdCAqIEBwYXJhbSBvcHRpb25zXG5cdCAqL1xuXHRfc2V0RGF0YTogZnVuY3Rpb24ob3B0aW9ucykge1xuXHRcdG5lLnV0aWwuZXh0ZW5kKHRoaXMsIG9wdGlvbnMpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBFeHRyYWN0IHByb3RvY29sICsgZG9tYWluIGZyb20gdXJsIHRvIGZpbmQgb3V0IHdoZXRoZXIgY3Jvc3MtZG9tYWluIG9yIG5vdC5cblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRpc0Nyb3NzRG9tYWluOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgcGFnZURvbWFpbiA9IGRvY3VtZW50LmRvbWFpbjtcblx0XHRyZXR1cm4gdGhpcy51cmwuc2VuZC5pbmRleE9mKHBhZ2VEb21haW4pID09PSAtMTtcblx0fSxcblxuXHQvKipcblx0ICogQ2FsbGJhY2sgZm9yIGVycm9yXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSBFcnJvciByZXNwb25zZVxuXHQgKi9cblx0ZXJyb3JDYWxsYmFjazogZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHR2YXIgbWVzc2FnZTtcblx0XHRpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UubXNnKSB7XG5cdFx0XHRtZXNzYWdlID0gcmVzcG9uc2UubXNnO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRtZXNzYWdlID0gc3RhdGljcy5DT05GLkVSUk9SLkRFRkFVTFQ7XG5cdFx0fVxuXHRcdGFsZXJ0KG1lc3NhZ2UpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBDYWxsYmFjayBmb3IgY3VzdG9tIHNlbmQgZXZlbnRcblx0ICogQHBhcmFtIHtvYmplY3R9IFtkYXRhXSBUaGUgZGF0YSBpbmNsdWRlIGNhbGxiYWNrIGZ1bmN0aW9uIGZvciBmaWxlIGNsb25lXG5cdCAqL1xuXHRzZW5kRmlsZTogZnVuY3Rpb24oZGF0YSkge1xuXHRcdHZhciBjYWxsYmFjayA9IG5lLnV0aWwuYmluZCh0aGlzLm5vdGlmeSwgdGhpcyksXG5cdFx0ZmlsZXMgPSBkYXRhICYmIGRhdGEuZmlsZXM7XG5cdFx0XG5cdFx0dGhpcy5fY29ubmVjdG9yLmFkZFJlcXVlc3Qoe1xuXHRcdFx0dHlwZTogJ2FkZCcsXG5cdFx0XHRzdWNjZXNzOiBmdW5jdGlvbihyZXN1bHQpIHtcblx0XHRcdFx0aWYgKGRhdGEgJiYgZGF0YS5jYWxsYmFjaykge1xuXHRcdFx0XHRcdGRhdGEuY2FsbGJhY2socmVzdWx0KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRjYWxsYmFjayhyZXN1bHQpO1xuXHRcdFx0fSxcblx0XHRcdGVycm9yOiB0aGlzLmVycm9yQ2FsbGJhY2tcblx0XHR9LCBmaWxlcyk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIENhbGxiYWNrIGZvciBjdXN0b20gcmVtb3ZlIGV2ZW50XG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIFRoZSBkYXRhIGZvciByZW1vdmUgZmlsZS5cblx0ICovXG5cdHJlbW92ZUZpbGU6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHR2YXIgY2FsbGJhY2sgPSBuZS51dGlsLmJpbmQodGhpcy5ub3RpZnksIHRoaXMpO1xuXHRcdHRoaXMuX2Nvbm5lY3Rvci5yZW1vdmVSZXF1ZXN0KHtcblx0XHRcdHR5cGU6ICdyZW1vdmUnLFxuXHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdHN1Y2Nlc3M6IGNhbGxiYWNrXG5cdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFN1Ym1pdCBmb3IgZGF0YSBzdWJtaXQgdG8gc2VydmVyXG5cdCAqL1xuXHRzdWJtaXQ6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLl9jb25uZWN0b3Iuc3VibWl0KSB7XG5cdFx0XHRpZiAodXRpbHMuaXNTdXBwb3J0RGF0YUZvcm0oKSkge1xuXHRcdFx0XHR0aGlzLl9jb25uZWN0b3Iuc3VibWl0KG5lLnV0aWwuYmluZChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHR0aGlzLmZpcmUoJ2JlZm9yZXN1Ym1pdCcsIHRoaXMpO1xuXHRcdFx0XHR9LCB0aGlzKSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLl9wb29sLnBsYW50KCk7XG5cdFx0XHR9XG5cdFx0fSBcblx0fSxcblxuXHQvKipcblx0ICogR2V0IGZpbGUgaW5mbyBsb2NhbGx5XG5cdCAqIEBwYXJhbSB7SHRtbEVsZW1lbnR9IGVsZW1lbnQgSW5wdXQgZWxlbWVudFxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X2dldEZpbGVJbmZvOiBmdW5jdGlvbihlbGVtZW50KSB7XG5cdFx0dmFyIGZpbGVzO1xuXHRcdGlmICh1dGlscy5pc1N1cHBvcnRGaWxlU3lzdGVtKCkpIHtcblx0XHRcdGZpbGVzID0gdGhpcy5fZ2V0RmlsZUxpc3QoZWxlbWVudC5maWxlcyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZpbGVzID0ge1xuXHRcdFx0XHRuYW1lOiBlbGVtZW50LnZhbHVlLFxuXHRcdFx0XHRpZDogZWxlbWVudC52YWx1ZVxuXHRcdFx0fTtcblx0XHR9XG5cdFx0cmV0dXJuIGZpbGVzO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBHZXQgZmlsZSBsaXN0IGZyb20gRmlsZUxpc3Qgb2JqZWN0XG5cdCAqIEBwYXJhbSB7RmlsZUxpc3R9IGZpbGVzIEEgRmlsZUxpc3Qgb2JqZWN0XG5cdCAqIEByZXR1cm5zIHtBcnJheX1cblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9nZXRGaWxlTGlzdDogZnVuY3Rpb24oZmlsZXMpIHtcblx0XHRyZXR1cm4gbmUudXRpbC5tYXAoZmlsZXMsIGZ1bmN0aW9uKGZpbGUpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdG5hbWU6IGZpbGUubmFtZSxcblx0XHRcdFx0c2l6ZTogZmlsZS5zaXplLFxuXHRcdFx0XHRpZDogZmlsZS5uYW1lXG5cdFx0XHR9O1xuXHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBZGQgZXZlbnQgdG8gbGlzdHZpZXcgYW5kIGlucHV0dmlld1xuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X2FkZEV2ZW50OiBmdW5jdGlvbigpIHtcblxuXHRcdGlmKHRoaXMudXNlRHJhZyAmJiB0aGlzLmRyYWdWaWV3KSB7XG5cdFx0XHQvLyBAdG9kbyB0b3Ag7LKY66as6rCAIOuUsOuhnCDtlYTsmpTtlagsIHNlbmRGaWxlIOyCrOyaqSDslYjrkKhcblx0XHRcdHRoaXMuZHJhZ1ZpZXcub24oJ2Ryb3AnLCB0aGlzLnNlbmRGaWxlLCB0aGlzKTtcblx0XHR9XG5cdFx0aWYgKHRoaXMuaXNCYXRjaFRyYW5zZmVyKSB7XG5cdFx0XHR0aGlzLmlucHV0Vmlldy5vbignc2F2ZScsIHRoaXMuc2VuZEZpbGUsIHRoaXMpO1xuXHRcdFx0dGhpcy5saXN0Vmlldy5vbigncmVtb3ZlJywgdGhpcy5yZW1vdmVGaWxlLCB0aGlzKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5pbnB1dFZpZXcub24oJ2NoYW5nZScsIHRoaXMuc2VuZEZpbGUsIHRoaXMpO1xuXHRcdFx0dGhpcy5saXN0Vmlldy5vbigncmVtb3ZlJywgdGhpcy5yZW1vdmVGaWxlLCB0aGlzKTtcblx0XHR9XG5cdH0sXG5cblx0LyoqXG5cdCAqIFN0b3JlIGlucHV0IGVsZW1lbnQgdG8gcG9vbC5cblx0ICogQHBhcmFtIHtIVE1MRWxlbWVudH0gaW5wdXQgQSBpbnB1dCBlbGVtZW50W3R5cGU9ZmlsZV0gZm9yIHN0b3JlIHBvb2xcblx0ICovXG5cdHN0b3JlOiBmdW5jdGlvbihpbnB1dCkge1xuXHRcdHRoaXMuX3Bvb2wuc3RvcmUoaW5wdXQpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZW1vdmUgaW5wdXQgZWxlbWVudCBmb3JtIHBvb2wuXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBmaWxlIG5hbWUgdG8gcmVtb3ZlXG5cdCAqL1xuXHRyZW1vdmU6IGZ1bmN0aW9uKG5hbWUpIHtcblx0XHRpZiAoIXV0aWxzLmlzU3VwcG9ydEZvcm1EYXRhKCkpIHtcblx0XHRcdHRoaXMuX3Bvb2wucmVtb3ZlKG5hbWUpO1xuXHRcdH1cblx0fVxufSk7XG5cbm5lLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKFVwbG9hZGVyKTtcbm1vZHVsZS5leHBvcnRzID0gVXBsb2FkZXI7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgVGhpcyBmaWxlIGNvbnRhaW4gdXRpbGl0eSBtZXRob2RzIGZvciB1cGxvYWRlci5cbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbi8qKlxuICogRXh0cmFjdCB1bml0IGZvciBmaWxlIHNpemVcbiAqIEBwYXJhbSB7bnVtYmVyfSBieXRlcyBBIHVzYWdlIG9mIGZpbGVcbiAqL1xubW9kdWxlLmV4cG9ydHMuZ2V0RmlsZVNpemVXaXRoVW5pdCA9IGZ1bmN0aW9uKGJ5dGVzKSB7XG4gICAgdmFyIHVuaXRzID0gWydCJywgJ0tCJywgJ01CJywgJ0dCJywgJ1RCJ10sXG4gICAgICAgIGJ5dGVzID0gcGFyc2VJbnQoYnl0ZXMsIDEwKSxcbiAgICAgICAgZXhwID0gTWF0aC5sb2coYnl0ZXMpIC8gTWF0aC5sb2coMTAyNCkgfCAwLFxuICAgICAgICByZXN1bHQgPSAoYnl0ZXMgLyBNYXRoLnBvdygxMDI0LCBleHApKS50b0ZpeGVkKDIpO1xuXG4gICAgcmV0dXJuIHJlc3VsdCArIHVuaXRzW2V4cF07XG59O1xuXG4vKipcbiAqIFdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydCBGb3JtRGF0YSBvciBub3RcbiAqL1xubW9kdWxlLmV4cG9ydHMuaXNTdXBwb3J0Rm9ybURhdGEgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgRm9ybURhdGEgPSAod2luZG93LkZvcm1EYXRhIHx8IG51bGwpO1xuICAgIHJldHVybiAhIUZvcm1EYXRhO1xufTtcblxuLyoqXG4gKiBHZXQgaXRlbSBlbGVtZW4gSFRNTFxuICogQHBhcmFtIHtzdHJpbmd9IGh0bWwgSFRNTCB0ZW1wbGF0ZVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xubW9kdWxlLmV4cG9ydHMudGVtcGxhdGUgPSBmdW5jdGlvbihtYXAsIGh0bWwpIHtcbiAgICBodG1sID0gaHRtbC5yZXBsYWNlKC9cXHtcXHsoW15cXH1dKylcXH1cXH0vZywgZnVuY3Rpb24obXN0ciwgbmFtZSkge1xuICAgICAgICByZXR1cm4gbWFwW25hbWVdO1xuICAgIH0pO1xuICAgIHJldHVybiBodG1sO1xufTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHN1cHBvcnQgZmlsZSBhcGkgb3Igbm90XG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xubW9kdWxlLmV4cG9ydHMuaXNTdXBwb3J0RmlsZVN5c3RlbSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAhISh3aW5kb3cuRmlsZSAmJiB3aW5kb3cuRmlsZVJlYWRlciAmJiB3aW5kb3cuRmlsZUxpc3QgJiYgd2luZG93LkJsb2IpO1xufTsiLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgVGhpcyBmaWxlIGlzIGFib3V0IGRyYWcgYW5kIGRyb3AgZmlsZSB0byBzZW5kLiBEcmFnIGFuZCBkcm9wIGlzIHJ1bm5pbmcgdmlhIGZpbGUgYXBpLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxudmFyIHN0YXRpY3MgPSByZXF1aXJlKCcuLi9zdGF0aWNzJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG4vKipcbiAqIE1ha2VzIGRyYWcgYW5kIGRyb3AgYXJlYSwgdGhlIGRyb3BwZWQgZmlsZSBpcyBhZGRlZCB2aWEgZXZlbnQgZHJvcCBldmVudC5cbiAqIEBjbGFzcyBEcmFnQW5kRHJvcFxuICovXG52YXIgRHJhZ0FuZERyb3AgPSBuZS51dGlsLmRlZmluZUNsYXNzKHtcblx0LyoqXG5cdCAqIGluaXRpYWxpemUgRHJhZ0FuZERyb3Bcblx0ICovXG5cdGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMsIHVwbG9hZGVyKSB7XG5cdFx0dmFyIGh0bWwgPSBvcHRpb25zLnRlbXBsYXRlICYmIG9wdGlvbnMudGVtcGxhdGUuZHJhZyB8fCBzdGF0aWNzLkhUTUwuZHJhZztcblx0XHR0aGlzLl9lbmFibGVDbGFzcyA9IG9wdGlvbnMuZHJhZyAmJiBvcHRpb25zLmRyYWcuZW5hYmxlQ2xhc3MgfHwgc3RhdGljcy5DT05GLkRSQUdfREVGQVVMVF9FTkFCTEVfQ0xBU1M7XG5cdFx0dGhpcy5fcmVuZGVyKGh0bWwsIHVwbG9hZGVyKTtcblx0XHR0aGlzLl9hZGRFdmVudCgpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZW5kZXJzIGRyYWcgYW5kIGRyb3AgYXJlYVxuXHQgKiBAcGFyYW0ge3N0cmluZ30gaHRtbCBUaGUgaHRtbCBzdHJpbmcgdG8gbWFrZSBkYXJnIHpvbmVcblx0ICogQHBhcmFtIHtvYmplY3R9IHVwbG9hZGVyIFRoZSBjb3JlIGluc3RhbmNlIG9mIHRoaXMgY29tcG9uZW50XG5cdCAqL1xuXHRfcmVuZGVyOiBmdW5jdGlvbihodG1sLCB1cGxvYWRlcikge1xuXHRcdHRoaXMuJGVsID0gJChodG1sKTtcblx0XHR1cGxvYWRlci4kZWwuYXBwZW5kKHRoaXMuJGVsKTtcblx0fSxcblxuXHQvKipcblx0ICogQWRkcyBkcmFnIGFuZCBkcm9wIGV2ZW50XG5cdCAqL1xuXHRfYWRkRXZlbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLm9uKCdkcmFnZW50ZXInLCBuZS51dGlsLmJpbmQodGhpcy5vbkRyYWdFbnRlciwgdGhpcykpO1xuXHRcdHRoaXMuJGVsLm9uKCdkcmFnb3ZlcicsIG5lLnV0aWwuYmluZCh0aGlzLm9uRHJhZ092ZXIsIHRoaXMpKTtcblx0XHR0aGlzLiRlbC5vbignZHJvcCcsIG5lLnV0aWwuYmluZCh0aGlzLm9uRHJvcCwgdGhpcykpO1xuXHRcdHRoaXMuJGVsLm9uKCdkcmFnbGVhdmUnLCBuZS51dGlsLmJpbmQodGhpcy5vbkRyYWdMZWF2ZSwgdGhpcykpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBIYW5kbGVzIGRyYWdlbnRlciBldmVudFxuXHQgKi9cblx0b25EcmFnRW50ZXI6IGZ1bmN0aW9uKGUpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR0aGlzLl9lbmFibGUoKTtcblx0fSxcblxuXHQvKipcblx0ICogSGFuZGxlcyBkcmFnb3ZlciBldmVudFxuXHQgKi9cblx0b25EcmFnT3ZlcjogZnVuY3Rpb24oZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBIYW5kbGVzIGRyYWdsZWF2ZSBldmVudFxuXHQgKi9cblx0b25EcmFnTGVhdmU6IGZ1bmN0aW9uKGUpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR0aGlzLl9kaXNhYmxlKCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEhhbmRsZXMgZHJvcCBldmVudFxuXHQgKi9cblx0b25Ecm9wOiBmdW5jdGlvbihlKSB7XG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdHRoaXMuX2Rpc2FibGUoKTtcblx0XHR0aGlzLmZpcmUoJ2Ryb3AnLCB7XG5cdFx0XHRmaWxlczogZS5vcmlnaW5hbEV2ZW50LmRhdGFUcmFuc2Zlci5maWxlc1xuXHRcdH0pO1xuXHRcdHJldHVybiBmYWxzZTtcblx0fSxcblxuXHRfZW5hYmxlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5hZGRDbGFzcyh0aGlzLl9lbmFibGVDbGFzcyk7XG5cdH0sXG5cblx0X2Rpc2FibGU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKHRoaXMuX2VuYWJsZUNsYXNzKTtcblx0fVxufSk7XG5cbm5lLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKERyYWdBbmREcm9wKTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcmFnQW5kRHJvcDtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBJbnB1dFZpZXcgbWFrZSBpbnB1dCBmb3JtIGJ5IHRlbXBsYXRlLiBBZGQgZXZlbnQgZmlsZSB1cGxvYWQgZXZlbnQuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG52YXIgc3RhdGljcyA9IHJlcXVpcmUoJy4uL3N0YXRpY3MnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cbi8qKlxuICogVGhpcyB2aWV3IGNvbnRyb2wgaW5wdXQgZWxlbWVudCB0eXBlZCBmaWxlLlxuICogQGNvbnN0cnVjdG9yIG5lLmNvbXBvbmVudC5GaWxlVXBsb2FkZXIuSW5wdXRWaWV3XG4gKi9cbnZhciBJbnB1dCA9IG5lLnV0aWwuZGVmaW5lQ2xhc3MoLyoqQGxlbmRzIG5lLmNvbXBvbmVudC5VcGxvYWRlci5JbnB1dC5wcm90b3R5cGUgKiove1xuXHQvKipcblx0ICogSW5pdGlhbGl6ZSBpbnB1dCBlbGVtZW50LlxuXHQgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXG5cdCAqL1xuXHRpbml0OiBmdW5jdGlvbihvcHRpb25zLCB1cGxvYWRlcikge1xuXG5cdFx0dGhpcy5fdXBsb2FkZXIgPSB1cGxvYWRlcjtcblx0XHR0aGlzLl90YXJnZXQgPSBvcHRpb25zLmZvcm1UYXJnZXQ7XG5cdFx0dGhpcy5fdXJsID0gb3B0aW9ucy51cmw7XG5cdFx0dGhpcy5faXNCYXRjaFRyYW5zZmVyID0gb3B0aW9ucy5pc0JhdGNoVHJhbnNmZXI7XG5cdFx0dGhpcy5faXNNdWx0aXBsZSA9ICEhKHV0aWxzLmlzU3VwcG9ydEZvcm1EYXRhKCkgJiYgb3B0aW9ucy5pc011bHRpcGxlKTtcblx0XHR0aGlzLl91c2VGb2xkZXIgPSAhISh1dGlscy5pc1N1cHBvcnRGb3JtRGF0YSgpICYmIG9wdGlvbnMudXNlRm9sZGVyKTtcblxuXHRcdHRoaXMuX2h0bWwgPSB0aGlzLl9zZXRIVE1MKCk7XG5cblx0XHR0aGlzLl9yZW5kZXIoKTtcblx0XHR0aGlzLl9yZW5kZXJIaWRkZW5FbGVtZW50cygpO1xuXG5cdFx0aWYgKG9wdGlvbnMuaGVscGVyKSB7XG5cdFx0XHR0aGlzLl9tYWtlQnJpZGdlSW5mb0VsZW1lbnQob3B0aW9ucy5oZWxwZXIpO1xuXHRcdH1cblxuXHRcdHRoaXMuX2FkZEV2ZW50KCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJlbmRlciBpbnB1dCBhcmVhXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfcmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbCA9ICQodGhpcy5fZ2V0SHRtbCgpKTtcblx0XHR0aGlzLiRlbC5hdHRyKHtcblx0XHRcdGFjdGlvbjogdGhpcy5fdXJsLnNlbmQsXG5cdFx0XHRtZXRob2Q6ICdwb3N0Jyxcblx0XHRcdGVuY3R5cGU6IFwibXVsdGlwYXJ0L2Zvcm0tZGF0YVwiLFxuXHRcdFx0dGFyZ2V0OiB0aGlzLl90YXJnZXRcblx0XHR9KTtcblx0XHR0aGlzLiRpbnB1dCA9IHRoaXMuX2dldElucHV0RWxlbWVudCgpO1xuXHRcdHRoaXMuJHN1Ym1pdCA9IHRoaXMuX2dldFN1Ym1pdEVsZW1lbnQoKTtcblx0XHR0aGlzLiRpbnB1dC5hcHBlbmRUbyh0aGlzLiRlbCk7XG5cdFx0aWYgKHRoaXMuJHN1Ym1pdCkge1xuXHRcdFx0dGhpcy4kc3VibWl0LmFwcGVuZFRvKHRoaXMuJGVsKTtcblx0XHR9XG5cdFx0dGhpcy5fdXBsb2FkZXIuJGVsLmFwcGVuZCh0aGlzLiRlbCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFNldCBhbGwgb2YgaW5wdXQgZWxlbWVudHMgaHRtbCBzdHJpbmdzLlxuXHQgKiBAcGFyYW0ge29iamVjdH0gW3RlbXBsYXRlXSBUaGUgdGVtcGxhdGUgaXMgc2V0IGZvcm0gY3VzdG9tZXIuXG5cdCAqIEByZXR1cm4ge29iamVjdH0gVGhlIGh0bWwgc3RyaW5nIHNldCBmb3IgaW5wdXRWaWV3XG5cdCAqL1xuXHRfc2V0SFRNTDogZnVuY3Rpb24odGVtcGxhdGUpIHtcblx0XHRpZiAoIXRlbXBsYXRlKSB7XG5cdFx0XHR0ZW1wbGF0ZSA9IHt9O1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRpbnB1dDogdGVtcGxhdGUuaW5wdXQgfHwgc3RhdGljcy5IVE1MLmlucHV0LFxuXHRcdFx0c3VibWl0OiB0ZW1wbGF0ZS5zdWJtaXQgfHwgc3RhdGljcy5IVE1MLnN1Ym1pdCxcblx0XHRcdGZvcm06IHRlbXBsYXRlLmZvcm0gfHwgc3RhdGljcy5IVE1MLmZvcm1cblx0XHR9XG5cdH0sXG5cdC8qKlxuXHQgKiBHZXQgaHRtbCBzdHJpbmcgZnJvbSB0ZW1wbGF0ZVxuXHQgKiBAcmV0dXJuIHtvYmplY3R9XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfZ2V0SHRtbDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2h0bWwuZm9ybTtcblx0fSxcblxuXHQvKipcblx0ICogTWFrZXMgYW5kIHJldHVybnMganF1ZXJ5IGVsZW1lbnRcblx0ICogQHJldHVybiB7b2JqZWN0fSBUaGUganF1ZXJ5IG9iamVjdCB3cmFwcGluZyBvcmlnaW5hbCBpbnB1dCBlbGVtZW50XG5cdCAqL1xuXHRfZ2V0SW5wdXRFbGVtZW50OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgbWFwID0ge1xuXHRcdFx0bXVsdGlwbGU6IHRoaXMuX2lzTXVsdGlwbGUgPyAnbXVsdGlwbGUnIDogJycsXG5cdFx0XHRmaWxlRmllbGQ6IHRoaXMuX3VwbG9hZGVyLmZpbGVGaWVsZCxcblx0XHRcdHdlYmtpdGRpcmVjdG9yeTogdGhpcy5fdXNlRm9sZGVyID8gJ3dlYmtpdGRpcmVjdG9yeScgOiAnJ1xuXHRcdH07XG5cblx0XHRyZXR1cm4gJCh1dGlscy50ZW1wbGF0ZShtYXAsIHRoaXMuX2h0bWwuaW5wdXQpKTtcblx0fSxcblxuXHQvKipcblx0ICogTWFrZXMgYW5kIHJldHVybnMganF1ZXJ5IGVsZW1lbnRcblx0ICogQHJldHVybiB7b2JqZWN0fSBUaGUganF1ZXJ5IG9iamVjdCB3cmFwcGluZyBzdW1iaXQgYnV0dG9uIGVsZW1lbnRcblx0ICovXG5cdF9nZXRTdWJtaXRFbGVtZW50OiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5faXNCYXRjaFRyYW5zZmVyKSB7XG5cdFx0XHRyZXR1cm4gJCh0aGlzLl9odG1sLnN1Ym1pdCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBmYWxzZTtcdFxuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogQ2FsbCBtZXRob2RzIHRob3NlIG1ha2UgZWFjaCBoaWRkZW4gZWxlbWVudC5cblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9yZW5kZXJIaWRkZW5FbGVtZW50czogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5fbWFrZVRhcmdldEZyYW1lKCk7XG5cdFx0dGhpcy5fbWFrZVJlc3VsdFR5cGVFbGVtZW50KCk7XG5cdFx0dGhpcy5fbWFrZUNhbGxiYWNrRWxlbWVudCgpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBZGQgZXZlbnRcblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMuX2lzQmF0Y2hUYXJuc2Zlcikge1xuXHRcdFx0dGhpcy4kZWwub24oJ3N1Ym1pdCcsIG5lLnV0aWwuYmluZChmdW5jdGlvbigpIHtcblx0XHRcdFx0dGhpcy5fdXBsb2FkZXIuc3VibWl0KCk7XG5cdFx0XHR9LCB0aGlzKSk7XG5cdFx0fVxuXHRcdHRoaXMuX2FkZElucHV0RXZlbnQoKTtcblx0fSxcblxuXHQvKipcblx0ICogQWRkIGlucHV0IGVsZW1lbnQgY2hhbmdlIGV2ZW50IGJ5IHNlbmRpbmcgdHlwZVxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X2FkZElucHV0RXZlbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLl9pc0JhdGNoVHJhbnNmZXIpIHtcblx0XHRcdHRoaXMuJGlucHV0Lm9uKCdjaGFuZ2UnLCBuZS51dGlsLmJpbmQodGhpcy5vblNhdmUsIHRoaXMpKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy4kaW5wdXQub24oJ2NoYW5nZScsIG5lLnV0aWwuYmluZCh0aGlzLm9uQ2hhbmdlLCB0aGlzKSk7XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBFdmVudC1IYW5kbGUgZm9yIGlucHV0IGVsZW1lbnQgY2hhbmdlXG5cdCAqL1xuXHRvbkNoYW5nZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5maXJlKCdjaGFuZ2UnLCB7XG5cdFx0XHR0YXJnZXQ6IHRoaXNcblx0XHR9KTtcblx0fSxcblxuXHQvKipcblx0ICogRXZlbnQtSGFuZGxlIGZvciBzYXZlIGlucHV0IGVsZW1lbnRcblx0ICovXG5cdG9uU2F2ZTogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2codGhpcy4kaW5wdXQpO1xuXHRcdHZhciBzYXZlQ2FsbGJhY2sgPSAhdXRpbHMuaXNTdXBwb3J0Rm9ybURhdGEoKSA/IG5lLnV0aWwuYmluZCh0aGlzLl9yZXNldElucHV0RWxlbWVudCwgdGhpcykgOiBudWxsO1xuXHRcdHRoaXMuZmlyZSgnc2F2ZScsIHtcblx0XHRcdGVsZW1lbnQ6IHRoaXMuJGlucHV0WzBdLFxuXHRcdFx0Y2FsbGJhY2s6IHNhdmVDYWxsYmFja1xuXHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZXNldCBJbnB1dCBlbGVtZW50IHRvIHNhdmUgd2hvbGUgaW5wdXQ9ZmlsZSBlbGVtZW50LlxuXHQgKi9cblx0X3Jlc2V0SW5wdXRFbGVtZW50OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRpbnB1dC5vZmYoKTtcblx0XHR0aGlzLl9jbG9uZSh0aGlzLiRpbnB1dFswXSk7XG5cdFx0dGhpcy4kaW5wdXQgPSAkKHRoaXMuX2dldEh0bWwodGhpcy5faW5wdXRIVE1MKSk7XG5cdFx0aWYgKHRoaXMuJGJ1dHRvbikge1xuXHRcdFx0dGhpcy4kYnV0dG9uLmJlZm9yZSh0aGlzLiRpbnB1dCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuJGVsLmFwcGVuZCh0aGlzLiRpbnB1dCk7XG5cdFx0fVxuXHRcdHRoaXMuX2FkZElucHV0RXZlbnQoKTtcblx0fSxcblxuXHQvKipcblx0ICogTWFrZXMgZWxlbWVudCB0byBiZSB0YXJnZXQgb2Ygc3VibWl0IGZvcm0gZWxlbWVudC5cblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9tYWtlVGFyZ2V0RnJhbWU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuXyR0YXJnZXQgPSAkKCc8aWZyYW1lIG5hbWU9XCInICsgdGhpcy5fdGFyZ2V0ICsgJ1wiPjwvaWZyYW1lPicpO1xuXHRcdHRoaXMuXyR0YXJnZXQuY3NzKHtcblx0XHRcdHZpc2liaWxpdHk6ICdoaWRkZW4nLFxuXHRcdFx0cG9zaXRpb246ICdhYnNvbHV0ZSdcblx0XHR9KTtcblx0XHR0aGlzLl91cGxvYWRlci4kZWwuYXBwZW5kKHRoaXMuXyR0YXJnZXQpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBNYWtlIGVsZW1lbnQgdG8gYmUgY2FsbGJhY2sgZnVuY3Rpb24gbmFtZVxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X21ha2VDYWxsYmFja0VsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuXyRjYWxsYmFjayA9IHRoaXMuX21ha2VIaWRkZW5FbGVtZW50KHtcblx0XHRcdCduYW1lJzogc3RhdGljcy5DT05GLkpTT05QQ0FMTEJBQ0tfTkFNRSxcblx0XHRcdCd2YWx1ZSc6IHRoaXMuX3VwbG9hZGVyLmNhbGxiYWNrTmFtZVxuXHRcdH0pO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCh0aGlzLl8kY2FsbGJhY2spO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBNYWtlcyBlbGVtZW50IHRvIGtub3cgd2hpY2ggdHlwZSByZXF1ZXN0XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfbWFrZVJlc3VsdFR5cGVFbGVtZW50OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLl8kcmVzVHlwZSA9IHRoaXMuX21ha2VIaWRkZW5FbGVtZW50KHtcblx0XHRcdCduYW1lJyA6IHRoaXMuX3VwbG9hZGVyLnJlc3VsdFR5cGVFbGVtZW50TmFtZSB8fCBzdGF0aWNzLkNPTkYuUkVTUE9OU0VfVFlQRSxcblx0XHRcdCd2YWx1ZSc6IHRoaXMuX3VwbG9hZGVyLnR5cGVcblx0XHR9KTtcblx0XHR0aGlzLiRlbC5hcHBlbmQodGhpcy5fJHJlc1R5cGUpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBNYWtlIGVsZW1lbnQgdGhhdCBoYXMgcmVkaXJlY3QgcGFnZSBpbmZvcm1hdGlvbiB1c2VkIGJ5IFNlcnZlciBzaWRlLlxuXHQgKiBAcGFyYW0ge29iamVjdH0gaGVscGVyIFJlZGlyZWN0aW9uIGluZm9ybWF0aW9uIGZvciBjbGVhciB4LWRvbWFpbiBwcm9ibGVtLlxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X21ha2VCcmlkZ2VJbmZvRWxlbWVudDogZnVuY3Rpb24oaGVscGVyKSB7XG5cdFx0dGhpcy5fJGhlbHBlciA9IHRoaXMuX21ha2VIaWRkZW5FbGVtZW50KHtcblx0XHRcdCduYW1lJyA6IGhlbHBlci5uYW1lIHx8IHN0YXRpY3MuQ09ORi5SRURJUkVDVF9VUkwsXG5cdFx0XHQndmFsdWUnOiBoZWxwZXIudXJsXG5cdFx0fSk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKHRoaXMuXyRoZWxwZXIpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBNYWtlIGhpZGRlbiBpbnB1dCBlbGVtZW50IHdpdGggb3B0aW9uc1xuXHQgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBUaGUgb3BpdG9ucyB0byBiZSBhdHRyaWJ1dGUgb2YgaW5wdXRcblx0ICogQHJldHVybnMgeyp8alF1ZXJ5fVxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X21ha2VIaWRkZW5FbGVtZW50OiBmdW5jdGlvbihvcHRpb25zKSB7XG5cdFx0bmUudXRpbC5leHRlbmQob3B0aW9ucywge1xuXHRcdFx0dHlwZTogJ2hpZGRlbidcblx0XHR9KTtcblx0XHRyZXR1cm4gJCgnPGlucHV0IC8+JykuYXR0cihvcHRpb25zKTtcblx0fSxcblxuXHQvKipcblx0ICogQXNrIHVwbG9hZGVyIHRvIHNhdmUgaW5wdXQgZWxlbWVudCB0byBwb29sXG5cdCAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGlucHV0IEEgaW5wdXQgZWxlbWVudFt0eXBlPWZpbGVdIGZvciBzdG9yZSBwb29sXG5cdCAqL1xuXHRfY2xvbmU6IGZ1bmN0aW9uKGlucHV0KSB7XG5cdFx0aW5wdXQuZmlsZV9uYW1lID0gaW5wdXQudmFsdWU7XG5cdFx0dGhpcy5fdXBsb2FkZXIuc3RvcmUoaW5wdXQpO1xuXHR9XG5cbn0pO1xuXG5uZS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihJbnB1dCk7XG5cbm1vZHVsZS5leHBvcnRzID0gSW5wdXQ7IiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEl0ZW1WaWV3IG1ha2UgZWxlbWVudCB0byBkaXNwbGF5IGFkZGVkIGZpbGUgaW5mb3JtYXRpb24uIEl0IGhhcyBhdHRhY2hlZCBmaWxlIElEIHRvIHJlcXVlc3QgZm9yIHJlbW92ZS5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbnZhciBzdGF0aWNzID0gcmVxdWlyZSgnLi4vc3RhdGljcycpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuLyoqXG4gKiBDbGFzcyBvZiBpdGVtIHRoYXQgaXMgbWVtYmVyIG9mIGZpbGUgbGlzdC5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG52YXIgSXRlbSA9IG5lLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBuZS5jb21wb25lbnQuVXBsb2FkZXIuSXRlbS5wcm90b3R5cGUgKiovIHtcbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplIGl0ZW1cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xuICAgICAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5uYW1lIEZpbGUgbmFtZVxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy50eXBlIEZpbGUgdHlwZVxuICAgICAqICBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy5yb290IExpc3Qgb2JqZWN0XG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmhpZGRlbkZyYW1lIFRoZSBpZnJhbWUgbmFtZSB3aWxsIGJlIHRhcmdldCBvZiBmb3JtIHN1Ym1pdC5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMudXJsIFRoZSB1cmwgZm9yIGZvcm0gYWN0aW9uIHRvIHN1Ym1ldC5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmlkXSBVbmlxdWUga2V5LCB3aGF0IGlmIHRoZSBrZXkgaXMgbm90IGV4aXN0IGlkIHdpbGwgYmUgdGhlIGZpbGUgbmFtZS5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmhpZGRlbkZpZWxkTmFtZV0gVGhlIG5hbWUgb2YgaGlkZGVuIGZpbGVkLiBUaGUgaGlkZGVuIGZpZWxkIGlzIGZvciBjb25uZWN0aW5nIHgtZG9taWFuLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGVsZXRlQnV0dG9uQ2xhc3NOYW1lPSd1cGxvYWRlcl9idG5fZGVsZXRlJ10gVGhlIGNsYXNzIG5hbWUgaXMgZm9yIGRlbGV0ZSBidXR0b24uXG4gICAgICogIEBwYXJhbSB7KHN0cmluZ3xudW1iZXIpfSBbb3B0aW9ucy5zaXplXSBGaWxlIHNpemUgKGJ1dCBpZSBsb3cgYnJvd3NlciwgeC1kb21haW4pXG4gICAgICogIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucy5oZWxwZXJdIFRoZSBoZWxwZXIgcGFnZSBpbmZvLlxuICAgICAqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuICAgICAgICB0aGlzLl9zZXRSb290KG9wdGlvbnMpO1xuICAgICAgICB0aGlzLl9zZXRJdGVtSW5mbyhvcHRpb25zKTtcbiAgICAgICAgdGhpcy5fc2V0Q29ubmVjdEluZm8ob3B0aW9ucyk7XG5cbiAgICAgICAgdGhpcy5yZW5kZXIob3B0aW9ucy50ZW1wbGF0ZSB8fCBzdGF0aWNzLkhUTUwuaXRlbSk7XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuaGVscGVyKSB7XG4gICAgICAgICAgICB0aGlzLl9tYWtlQnJpZGdlSW5mb0VsZW1lbnQob3B0aW9ucy5oZWxwZXIpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCByb290KExpc3Qgb2JqZWN0KSBpbmZvcm1hdGlvbi5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBTYW1lIHdpdGggaW5pdCBvcHRpb25zIHBhcmFtZXRlci5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRSb290OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX3Jvb3QgPSBvcHRpb25zLnJvb3Q7XG4gICAgICAgIHRoaXMuXyRyb290ID0gb3B0aW9ucy5yb290LiRlbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGZpbGUgaW5mb3JtYXRpb24uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgU2FtZSB3aXRoIGluaXQgb3B0aW9ucyBwYXJhbWV0ZXIuXG4gICAgICovXG4gICAgX3NldEl0ZW1JbmZvOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG9wdGlvbnMubmFtZTtcbiAgICAgICAgdGhpcy5fdHlwZSA9IG9wdGlvbnMudHlwZSB8fCB0aGlzLl9leHRyYWN0RXh0ZW5zaW9uKCk7XG4gICAgICAgIHRoaXMuX2lkID0gb3B0aW9ucy5pZCB8fCBvcHRpb25zLm5hbWU7XG4gICAgICAgIHRoaXMuc2l6ZSA9IG9wdGlvbnMuc2l6ZSB8fCAnJztcbiAgICAgICAgdGhpcy5fYnRuQ2xhc3MgPSBvcHRpb25zLmRlbGV0ZUJ1dHRvbkNsYXNzTmFtZSB8fCAndXBsb2FkZXJfYnRuX2RlbGV0ZSc7XG4gICAgICAgIHRoaXMuX3VuaXQgPSBvcHRpb25zLnVuaXQgfHwgJ0tCJztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGNvbm5lY3QgZWxlbWVudCBpbmZvcm1hdGlvbi5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBTYW1lIHdpdGggaW5pdCBvcHRpb25zIHBhcmFtZXRlci5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRDb25uZWN0SW5mbzogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB0aGlzLl91cmwgPSBvcHRpb25zLnVybDtcbiAgICAgICAgdGhpcy5faGlkZGVuSW5wdXROYW1lID0gb3B0aW9ucy5oaWRkZW5GaWVsZE5hbWUgfHwgJ2ZpbGVuYW1lJztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVuZGVyIG1ha2luZyBmb3JtIHBhZGRpbmcgd2l0aCBkZWxldGFibGUgaXRlbVxuICAgICAqIEBwYXJhbSB0ZW1wbGF0ZVxuICAgICAqL1xuICAgIHJlbmRlcjogZnVuY3Rpb24odGVtcGxhdGUpIHtcbiAgICAgICAgdmFyIGh0bWwgPSB0aGlzLl9nZXRIdG1sKHRlbXBsYXRlKTtcbiAgICAgICAgdGhpcy5fJGVsID0gJChodG1sKTtcbiAgICAgICAgdGhpcy5fJHJvb3QuYXBwZW5kKHRoaXMuXyRlbCk7XG4gICAgICAgIHRoaXMuX2FkZEV2ZW50KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV4dHJhY3QgZmlsZSBleHRlbnNpb24gYnkgbmFtZVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZXh0cmFjdEV4dGVuc2lvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5hbWUuc3BsaXQoJy4nKS5wb3AoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSBlbGVtZW50IHRoYXQgaGFzIHJlZGlyZWN0IHBhZ2UgaW5mb3JtYXRpb24gdXNlZCBieSBTZXJ2ZXIgc2lkZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gaGVscGVyIFJlZGlyZWN0aW9uIGhlbHBlciBwYWdlIGluZm9ybWF0aW9uIGZvciBjbGVhciB4LWRvbWFpbiBwcm9ibGVtLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX21ha2VCcmlkZ2VJbmZvRWxlbWVudDogZnVuY3Rpb24oaGVscGVyKSB7XG4gICAgICAgIHRoaXMuJGhlbHBlciA9ICQoJzxpbnB1dCAvPicpO1xuICAgICAgICB0aGlzLiRoZWxwZXIuYXR0cih7XG4gICAgICAgICAgICAnbmFtZScgOiBoZWxwZXIubmFtZSxcbiAgICAgICAgICAgICd2YWx1ZSc6IGhlbHBlci51cmxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBpdGVtIGVsZW1lbiBIVE1MXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGh0bWwgSFRNTCB0ZW1wbGF0ZVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0SHRtbDogZnVuY3Rpb24oaHRtbCkge1xuICAgICAgICB2YXIgbWFwID0ge1xuICAgICAgICAgICAgZmlsZXR5cGU6IHRoaXMuX3R5cGUsXG4gICAgICAgICAgICBmaWxlbmFtZTogdGhpcy5uYW1lLFxuICAgICAgICAgICAgZmlsZXNpemU6IHRoaXMuc2l6ZSA/IHV0aWxzLmdldEZpbGVTaXplV2l0aFVuaXQodGhpcy5zaXplKSA6ICcnLFxuICAgICAgICAgICAgZGVsZXRlQnV0dG9uQ2xhc3NOYW1lOiB0aGlzLl9idG5DbGFzc1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB1dGlscy50ZW1wbGF0ZShtYXAsIGh0bWwpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEZXN0b3J5IGl0ZW1cbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fcmVtb3ZlRXZlbnQoKTtcbiAgICAgICAgdGhpcy5fJGVsLnJlbW92ZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnQgaGFuZGxlciBvbiBkZWxldGUgYnV0dG9uLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZEV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHF1ZXJ5ID0gJy4nICsgdGhpcy5fYnRuQ2xhc3MsXG4gICAgICAgICAgICAkZGVsQnRuID0gdGhpcy5fJGVsLmZpbmQocXVlcnkpO1xuICAgICAgICAkZGVsQnRuLm9uKCdjbGljaycsIG5lLnV0aWwuYmluZCh0aGlzLl9vbkNsaWNrRXZlbnQsIHRoaXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGV2ZW50IGhhbmRsZXIgZnJvbSBkZWxldGUgYnV0dG9uLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbW92ZUV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHF1ZXJ5ID0gJy4nICsgdGhpcy5fYnRuQ2xhc3MsXG4gICAgICAgICAgICAkZGVsQnRuID0gdGhpcy5fJGVsLmZpbmQocXVlcnkpO1xuICAgICAgICAkZGVsQnRuLm9mZignY2xpY2snKTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKiBFdmVudC1oYW5kbGUgZm9yIGRlbGV0ZSBidXR0b24gY2xpY2tlZC5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vbkNsaWNrRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZScsIHtcbiAgICAgICAgICAgIGZpbGVuYW1lIDogdGhpcy5uYW1lLFxuICAgICAgICAgICAgaWQgOiB0aGlzLl9pZCxcbiAgICAgICAgICAgIHR5cGU6ICdyZW1vdmUnXG4gICAgICAgIH0pO1xuICAgIH1cbn0pO1xuXG5uZS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihJdGVtKTtcblxubW9kdWxlLmV4cG9ydHMgPSBJdGVtOyIsIi8qKlxuICogQGZpbGVvdmVydmlldyBGaWxlTGlzdFZpZXcgbWFuYWdlIGFuZCBkaXNwbGF5IGZpbGVzIHN0YXRlKGxpa2Ugc2l6ZSwgY291bnQpIGFuZCBsaXN0LlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcbnZhciBJdGVtID0gcmVxdWlyZSgnLi9pdGVtJyk7XG5cbi8qKlxuICogTGlzdCBoYXMgaXRlbXMuIEl0IGNhbiBhZGQgYW5kIHJlbW92ZSBpdGVtLCBhbmQgZ2V0IHRvdGFsIHVzYWdlLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZhciBMaXN0ID0gbmUudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIG5lLmNvbXBvbmVudC5VcGxvYWRlci5MaXN0LnByb3RvdHlwZSAqL3tcbiAgICBpbml0IDogZnVuY3Rpb24ob3B0aW9ucywgdXBsb2FkZXIpIHtcbiAgICAgICAgdmFyIGxpc3RJbmZvID0gb3B0aW9ucy5saXN0SW5mbztcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdO1xuICAgICAgICB0aGlzLiRlbCA9IGxpc3RJbmZvLmxpc3Q7XG4gICAgICAgIHRoaXMuJGNvdW50ZXIgPSBsaXN0SW5mby5jb3VudDtcbiAgICAgICAgdGhpcy4kc2l6ZSA9IGxpc3RJbmZvLnNpemU7XG4gICAgICAgIHRoaXMuX3VwbG9hZGVyID0gdXBsb2FkZXI7XG5cbiAgICAgICAgbmUudXRpbC5leHRlbmQodGhpcywgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBpdGVtIGxpc3RcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gaW5mbyBBIGluZm9ybWF0aW9uIHRvIHVwZGF0ZSBsaXN0LlxuICAgICAqICBAcGFyYW0ge2FycmF5fSBpbmZvLml0ZW1zIFRoZSBsaXN0IG9mIGZpbGUgaW5mb3JtYXRpb24uXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBbaW5mby5hY3Rpb25dIFRoZSBhY3Rpb24gdG8gZG8uXG4gICAgICovXG4gICAgdXBkYXRlOiBmdW5jdGlvbihpbmZvKSB7XG4gICAgICAgIGlmIChpbmZvLmFjdGlvbiA9PT0gJ3JlbW92ZScpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZUZpbGVJdGVtKGluZm8ubmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9hZGRGaWxlSXRlbXMoaW5mby5pdGVtcyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW1zIHRvdGFsIGNvdW50LCB0b3RhbCBzaXplIGluZm9ybWF0aW9uLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBpbmZvIEEgaW5mb3JtYXRpb24gdG8gdXBkYXRlIGxpc3QuXG4gICAgICogIEBwYXJhbSB7YXJyYXl9IGluZm8uaXRlbXMgVGhlIGxpc3Qgb2YgZmlsZSBpbmZvcm1hdGlvbi5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IGluZm8uc2l6ZSBUaGUgdG90YWwgc2l6ZS5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IGluZm8uY291bnQgVGhlIGNvdW50IG9mIGZpbGVzLlxuICAgICAqL1xuICAgIHVwZGF0ZVRvdGFsSW5mbzogZnVuY3Rpb24oaW5mbykge1xuICAgICAgICB0aGlzLl91cGRhdGVUb3RhbENvdW50KGluZm8uY291bnQpO1xuICAgICAgICBpZiAodXRpbHMuaXNTdXBwb3J0Rm9ybURhdGEoKSkge1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlVG90YWxVc2FnZShpbmZvLnNpemUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBpdGVtcyB0b3RhbCBjb3VudCBhbmQgcmVmcmVzaCBlbGVtZW50XG4gICAgICogQHBhcmFtIHsobnVtYmVyfHN0cmluZyl9IFtjb3VudF0gVG90YWwgZmlsZSBjb3VudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwZGF0ZVRvdGFsQ291bnQ6IGZ1bmN0aW9uKGNvdW50KSB7XG5cbiAgICAgICAgaWYgKCFuZS51dGlsLmlzRXhpc3R5KGNvdW50KSkge1xuICAgICAgICAgICAgY291bnQgPSB0aGlzLml0ZW1zLmxlbmd0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuJGNvdW50ZXIuaHRtbChjb3VudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBpdGVtcyB0b3RhbCBzaXplIGFuZCByZWZyZXNoIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0geyhudW1iZXJ8c3RyaW5nKX0gc2l6ZSBUb3RhbCBmaWxlcyBzaXplc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwZGF0ZVRvdGFsVXNhZ2U6IGZ1bmN0aW9uKHNpemUpIHtcblxuICAgICAgICBpZiAoIW5lLnV0aWwuaXNFeGlzdHkoc2l6ZSkpIHtcbiAgICAgICAgICAgIHNpemUgPSB0aGlzLl9nZXRTdW1BbGxJdGVtVXNhZ2UoKTtcbiAgICAgICAgfVxuICAgICAgICBzaXplID0gdXRpbHMuZ2V0RmlsZVNpemVXaXRoVW5pdChzaXplKTtcbiAgICAgICAgdGhpcy4kc2l6ZS5odG1sKHNpemUpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdW0gc2l6ZXMgb2YgYWxsIGl0ZW1zLlxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldFN1bUFsbEl0ZW1Vc2FnZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpdGVtcyA9IHRoaXMuaXRlbXMsXG4gICAgICAgICAgICB0b3RhbFVzYWdlID0gMDtcblxuICAgICAgICBuZS51dGlsLmZvckVhY2goaXRlbXMsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIHRvdGFsVXNhZ2UgKz0gcGFyc2VGbG9hdChpdGVtLnNpemUpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdG90YWxVc2FnZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGZpbGUgaXRlbXNcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdGFyZ2V0IFRhcmdldCBpdGVtIGluZm9tYXRpb25zLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZEZpbGVJdGVtczogZnVuY3Rpb24odGFyZ2V0KSB7XG4gICAgICAgIGlmICghbmUudXRpbC5pc0FycmF5KHRhcmdldCkpIHtcbiAgICAgICAgICAgIHRhcmdldCA9IFt0YXJnZXRdO1xuICAgICAgICB9XG4gICAgICAgIG5lLnV0aWwuZm9yRWFjaCh0YXJnZXQsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCh0aGlzLl9jcmVhdGVJdGVtKGRhdGEpKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cdFx0dGhpcy5fdXBsb2FkZXIuZmlyZSgnZmlsZUFkZGVkJywge1xuXHRcdFx0dGFyZ2V0OiB0YXJnZXRcblx0XHR9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGZpbGUgaXRlbVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBmaWxlIG5hbWUgdG8gcmVtb3ZlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlRmlsZUl0ZW06IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgbmFtZSA9IGRlY29kZVVSSUNvbXBvbmVudChuYW1lKTtcbiAgICAgICAgdGhpcy5pdGVtcyA9IG5lLnV0aWwuZmlsdGVyKHRoaXMuaXRlbXMsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIHZhciBpc01hdGNoID0gbmFtZSA9PT0gZGVjb2RlVVJJQ29tcG9uZW50KGl0ZW0ubmFtZSk7XG4gICAgICAgICAgICBpZiAoaXNNYXRjaCkge1xuICAgICAgICAgICAgICAgIGl0ZW0uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3VwbG9hZGVyLnJlbW92ZShuYW1lKTtcblx0XHRcdFx0XHR0aGlzLl91cGxvYWRlci5maXJlKCdmaWxlUmVtb3ZlZCcsIHtcblx0XHRcdFx0XHRcdG5hbWU6IG5hbWVcblx0XHRcdFx0XHR9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAhaXNNYXRjaDtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBpdGVtIEJ5IERhdGFcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YVxuICAgICAqIEByZXR1cm5zIHtJdGVtfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NyZWF0ZUl0ZW06IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIGl0ZW0gPSBuZXcgSXRlbSh7XG4gICAgICAgICAgICByb290OiB0aGlzLFxuICAgICAgICAgICAgbmFtZTogZGF0YS5uYW1lLFxuICAgICAgICAgICAgc2l6ZTogZGF0YS5zaXplLFxuICAgICAgICAgICAgZGVsZXRlQnV0dG9uQ2xhc3NOYW1lOiB0aGlzLmRlbGV0ZUJ1dHRvbkNsYXNzTmFtZSxcbiAgICAgICAgICAgIHVybDogdGhpcy51cmwsXG4gICAgICAgICAgICBoaWRkZW5GcmFtZTogdGhpcy5mb3JtVGFyZ2V0LFxuICAgICAgICAgICAgaGlkZGVuRmllbGROYW1lOiB0aGlzLmhpZGRlbkZpZWxkTmFtZSxcbiAgICAgICAgICAgIHRlbXBsYXRlOiB0aGlzLnRlbXBsYXRlICYmIHRoaXMudGVtcGxhdGUuaXRlbVxuICAgICAgICB9KTtcbiAgICAgICAgaXRlbS5vbigncmVtb3ZlJywgdGhpcy5fcmVtb3ZlRmlsZSwgdGhpcyk7XG4gICAgICAgIHJldHVybiBpdGVtO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBSZW1vdmUgRmlsZVxuICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlRmlsZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZScsIGRhdGEpO1xuICAgIH1cbn0pO1xuXG5uZS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihMaXN0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBMaXN0OyIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIGlzIG1hbmFnZXIgb2YgaW5wdXQgZWxlbWVudHMgdGhhdCBhY3QgbGlrZSBmaWxlIHBvb2wuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG4vKipcbiAqIFRoZSBwb29sIGZvciBzYXZlIGZpbGVzLlxuICogSXQncyBvbmx5IGZvciBpbnB1dFtmaWxlXSBlbGVtZW50IHNhdmUgYXQgYnJvd3NlciB0aGF0IGRvZXMgbm90IHN1cHBvcnQgZmlsZSBhcGkuXG4gKiBAdHlwZSB7Kn1cbiAqL1xudmFyIFBvb2wgPSBuZS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgbmUuY29tcG9uZW50LlVwbG9hZGVyLlBvb2wucHJvdG90eXBlICove1xuICAgIC8qKlxuICAgICAqIGluaXRpYWxpemVcbiAgICAgKi9cbiAgICBpbml0OiBmdW5jdGlvbihwbGFuZXQpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFN1Ym1pdHRlciBmb3IgZmlsZSBlbGVtZW50IHRvIHNlcnZlclxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnBsYW5ldCA9IHBsYW5ldDtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZpbGUgZGF0YSBzdHJ1Y3R1cmUgb2JqZWN0KGtleT1uYW1lIDogdmFsdWU9aXVwdXQgZWxtZWVudCk7XG4gICAgICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmZpbGVzID0ge307XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBY3RzIHBvb2wgdG8gc2F2ZSBpbnB1dCBlbGVtZW50XG4gICAgICAgICAqIEB0eXBlIHtEb2N1bWVudEZyYWdtZW50fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5mcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTYXZlIGEgaW5wdXQgZWxlbWVudFt0eXBlPWZpbGVdLCBhcyB2YWx1ZSBvZiBmaWxlIG5hbWUuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGZpbGUgQSBpbnB1dCBlbGVtZW50IHRoYXQgaGF2ZSB0byBiZSBzYXZlZFxuICAgICAqL1xuICAgIHN0b3JlOiBmdW5jdGlvbihmaWxlKSB7XG4gICAgICAgIHRoaXMuZmlsZXNbZmlsZS5maWxlX25hbWVdID0gZmlsZTtcbiAgICAgICAgdGhpcy5mcmFnLmFwcGVuZENoaWxkKGZpbGUpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBpbnB1dCBlbGVtZW50W3R5cGU9ZmlsZV0gZnJvbSBwb29sLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIEEgZmlsZSBuYW1lIHRoYXQgaGF2ZSB0byBiZSByZW1vdmVkLlxuICAgICAqL1xuICAgIHJlbW92ZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICB0aGlzLmZyYWcucmVtb3ZlQ2hpbGQodGhpcy5maWxlc1tuYW1lXSk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmZpbGVzW25hbWVdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFbXB0eSBwb29sXG4gICAgICovXG4gICAgZW1wdHk6IGZ1bmN0aW9uKCkge1xuICAgICAgICBuZS51dGlsLmZvckVhY2godGhpcy5maWxlcywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUoZGF0YS5maWxlX25hbWUpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUGxhbnQgZmlsZXMgb24gcG9vbCB0byBmb3JtIGlucHV0XG4gICAgICovXG4gICAgcGxhbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcGxhbmV0ID0gdGhpcy5wbGFuZXQ7XG4gICAgICAgIG5lLnV0aWwuZm9yRWFjaCh0aGlzLmZpbGVzLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBwbGFuZXQuYXBwZW5kQ2hpbGQoZGF0YSk7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5maWxlc1tkYXRhLmZpbGVfbmFtZV07XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBvb2w7Il19
