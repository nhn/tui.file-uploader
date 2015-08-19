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
			this._connector.submit(ne.util.bind(function() {
				this.fire('beforesubmit', this);
			}, this));
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
				return false;
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25uZWN0b3IvYWpheC5qcyIsInNyYy9qcy9jb25uZWN0b3IvY29ubmVjdG9yLmpzIiwic3JjL2pzL2Nvbm5lY3Rvci9qc29ucC5qcyIsInNyYy9qcy9jb25uZWN0b3IvbG9jYWwuanMiLCJzcmMvanMvc3RhdGljcy5qcyIsInNyYy9qcy91cGxvYWRlci5qcyIsInNyYy9qcy91dGlscy5qcyIsInNyYy9qcy92aWV3L2RyYWcuanMiLCJzcmMvanMvdmlldy9pbnB1dC5qcyIsInNyYy9qcy92aWV3L2l0ZW0uanMiLCJzcmMvanMvdmlldy9saXN0LmpzIiwic3JjL2pzL3ZpZXcvcG9vbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDblFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJuZS51dGlsLmRlZmluZU5hbWVzcGFjZSgnbmUuY29tcG9uZW50LlVwbG9hZGVyJywgcmVxdWlyZSgnLi9zcmMvanMvdXBsb2FkZXIuanMnKSk7XG5cbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIENvbm5lY3RvciBtYWtlIGNvbm5lY3Rpb24gYmV0d2VlbiBGaWxlTWFuYWdlciBhbmQgZmlsZSBzZXJ2ZXIgYXBpIGF0IG1vZGVybiBicm93c2VyLjxicj5cbiAqICAgICBUaGlzIENvbm5lY3RvciB1c2UgYWpheC5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbi8qKlxuICogVGhlIG1vZHVsZXMgd2lsbCBiZSBtaXhlZCBpbiBjb25uZWN0b3IgYnkgdHlwZS5cbiAqL1xudmFyIEFqYXggPSB7LyoqIEBsZW5kcyBuZS5jb21wb25lbnQuVXBsb2FkZXIuQWpheCAqL1xuICAgIHR5cGU6ICdQT1NUJyxcbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGFqYXggYnkgY29uZmlnIHRvIGFkZCBmaWxlcy5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gY29uZmlnIFRoZSBjb25maWd1cmF0aW9uIGZvciBhamF4IHJlcXVlc3RcbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy51cmwgUmVxdWVzdCB1cmwodXBsb2FkIHVybCBvciByZW1vdmUgdXJsKVxuICAgICAqICBAcGFyYW0ge2Z1bmN0aW9ufSBjb25maWcuc3VjY2VzcyBDYWxsYmFjayBmdW5jdGlvbiB3aGVuIHJlcXVlc3Qgc3VjZWVzcy5cbiAgICAgKiAgQHBhcmFtIHtmdW5jdGlvbn0gY29uZmlnLmVycm9yIENhbGxiYWNrIGZ1bmN0aW9uIHdoZW4gcmVxdWVzdCBmYWlsZC5cbiAgICAgKi9cbiAgICBhZGRSZXF1ZXN0OiBmdW5jdGlvbihjb25maWcsIGZpbGVzKSB7XG4gICAgICAgIHZhciB1cGxvYWRlciA9IHRoaXMuX3VwbG9hZGVyLFxuICAgICAgICAgICAgJGZvcm0gPSB1cGxvYWRlci5pbnB1dFZpZXcuJGVsLFxuICAgICAgICAgICAgY2FsbGJhY2sgPSBuZS51dGlsLmJpbmQodGhpcy5zdWNjZXNzUGFkZGluZywgdGhpcywgY29uZmlnLnN1Y2Nlc3MpO1xuICAgIFxuXHRcdGlmIChmaWxlcykge1xuXHRcdFx0dGhpcy5mb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuXHRcdFx0bmUudXRpbC5mb3JFYWNoKGZpbGVzLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdHRoaXMuZm9ybURhdGEuYXBwZW5kKHVwbG9hZGVyLmZpbGVGaWVsZCwgZSk7XG5cdFx0XHR9LCB0aGlzKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5mb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgkZm9ybVswXSk7XG5cdFx0fVxuXHRcdCQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHRoaXMuX3VwbG9hZGVyLnVybC5zZW5kLFxuICAgICAgICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgICAgICAgZGF0YTogdGhpcy5mb3JtRGF0YSxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGNhbGxiYWNrLFxuICAgICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6IGNvbmZpZy5lcnJvclxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJlcHJvY2Vzc2luZyBjYWxsYmFjayBiZWZvcmUgY2FsbGJhY2sgcnVuLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFJlcXVlc3QgQ2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgUmVzcG9uc2UgZnJvbSBzZXJ2ZXJcbiAgICAgKi9cbiAgICBzdWNjZXNzUGFkZGluZzogZnVuY3Rpb24oY2FsbGJhY2ssIHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciBqc29uID0gSlNPTi5wYXJzZShyZXNwb25zZSksXG4gICAgICAgICAgICByZXN1bHQgPSB7fTtcblxuICAgICAgICByZXN1bHQuaXRlbXMgPSBqc29uLmZpbGVsaXN0O1xuICAgICAgICBjYWxsYmFjayhyZXN1bHQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGFqYXggYnkgY29uZmlnIHRvIHJlbW92ZSBmaWxlLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWdcbiAgICAgKi9cbiAgICByZW1vdmVSZXF1ZXN0OiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gbmUudXRpbC5iaW5kKHRoaXMucmVtb3ZlUGFkZGluZywgdGhpcywgY29uZmlnLnN1Y2Nlc3MpO1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiB0aGlzLl91cGxvYWRlci51cmwucmVtb3ZlLFxuICAgICAgICAgICAgZGF0YTogY29uZmlnLmRhdGEsXG4gICAgICAgICAgICBzdWNjZXNzOiBjYWxsYmFjayxcbiAgICAgICAgICAgIGVycm9yOiBjb25maWcuZXJyb3JcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByZXByb2Nlc3NpbmcgcmVzcG9uc2UgYmVmb3JlIGNhbGxiYWNrIHJ1bi5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBSZXF1ZXN0IENhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIFJlc3BvbnNlIGZyb20gc2VydmVyXG4gICAgICovXG4gICAgcmVtb3ZlUGFkZGluZzogZnVuY3Rpb24oY2FsbGJhY2ssIHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciBqc29uID0gSlNPTi5wYXJzZShyZXNwb25zZSksXG4gICAgICAgICAgICByZXN1bHQgPSB7fTtcblxuICAgICAgICByZXN1bHQuYWN0aW9uID0gJ3JlbW92ZSc7XG4gICAgICAgIHJlc3VsdC5uYW1lID0gZGVjb2RlVVJJQ29tcG9uZW50KGpzb24ubmFtZSk7XG5cbiAgICAgICAgY2FsbGJhY2socmVzdWx0KTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFqYXg7IiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEEgQ29ubmVjdG9yIG1ha2UgY29ubmVjdGlvbiBiZXR3ZWVuIEZpbGVNYW5hZ2VyIGFuZCBmaWxlIHNlcnZlciBBUEkuPGJyPiBUaGUgQ29ubmVjdG9yIGlzIGludGVyZmFjZS5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbnZhciBBamF4ID0gcmVxdWlyZSgnLi9hamF4Jyk7XG52YXIgSnNvbnAgPSByZXF1aXJlKCcuL2pzb25wJyk7XG52YXIgTG9jYWwgPSByZXF1aXJlKCcuL2xvY2FsJyk7XG5cbi8qKlxuICogVGhlIGNvbm5lY3RvciBjbGFzcyBjb3VsZCBjb25uZWN0IHdpdGggc2VydmVyIGFuZCByZXR1cm4gc2VydmVyIHJlc3BvbnNlIHRvIGNhbGxiYWNrLlxuICovXG52YXIgTW9kdWxlU2V0cyA9IHtcbiAgICAnYWpheCc6IEFqYXgsXG4gICAgJ2pzb25wJzogSnNvbnAsXG4gICAgJ2xvY2FsJzogTG9jYWxcbn07XG5cbi8qKlxuICogVGhpcyBpcyBJbnRlcmZhY2UgdG8gYmUgaW1wbGVtZW50ZWQgYnkgY29ubmVjdG9yc1xuICovXG52YXIgQ29ubmVjdG9yID0ge1xuICAgIC8qKlxuICAgICAqIEEgaW50ZXJmYWNlIHJlbW92ZVJlcXVlc3QgdG8gaW1wbGVtZW50XG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgQSBpbmZvcm1hdGlvbiBmb3IgZGVsZXRlIGZpbGVcbiAgICAgKi9cbiAgICByZW1vdmVSZXF1ZXN0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGludGVyZmFjZSByZW1vdmVSZXF1ZXN0IGRvZXMgbm90IGV4aXN0Jyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEEgaW50ZXJmYWNlIGFkZFJlcXVlc3QgdG8gaW1wbGVtZW50XG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgQSBpbmZvcm1hdGlvbiBmb3IgYWRkIGZpbGVcbiAgICAgKi9cbiAgICBhZGRSZXF1ZXN0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGludGVyZmFjZSBhZGRSZXF1ZXN0IGRvZXMgbm90IGV4aXN0Jyk7XG4gICAgfVxuXG59O1xuXG4vKipcbiAqIFRoZSBmYWN0b3J5IG1vZHVsZSBmb3IgY29ubmVjdG9ycy5cbiAqIEdldCBlYWNoIGNvbm5lY3RvciBieSBlYWNoIHR5cGUuXG4gKi9cbnZhciBGYWN0b3J5ID0ge1xuICAgIC8qKlxuICAgICAqIENob29zZSBjb25uZWN0b3JcbiAgICAgKiBAcGFyYW0gdXBsb2FkZXJcbiAgICAgKiBAcmV0dXJucyB7e191cGxvYWRlcjogKn19XG4gICAgICovXG4gICAgZ2V0Q29ubmVjdG9yOiBmdW5jdGlvbih1cGxvYWRlcikge1xuICAgICAgICB2YXIgdHlwZSA9IHVwbG9hZGVyLnR5cGUudG9Mb3dlckNhc2UoKSxcbiAgICAgICAgICAgIGNvbm4gPSB7XG4gICAgICAgICAgICAgICAgX3VwbG9hZGVyOiB1cGxvYWRlclxuICAgICAgICAgICAgfTtcbiAgICAgICAgbmUudXRpbC5leHRlbmQoY29ubiwgQ29ubmVjdG9yLCBNb2R1bGVTZXRzW3R5cGVdIHx8IExvY2FsKTtcbiAgICAgICAgcmV0dXJuIGNvbm47XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBGYWN0b3J5O1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgQ29ubmVjdG9yIG1ha2UgY29ubmVjdGlvbiBiZXR3ZWVuIEZpbGVNYW5hZ2VyIGFuZCBmaWxlIHNlcnZlciBhcGkgYXQgb2xkIGJyb3dzZXIuPGJyPlxuICogICAgIFRoaXMgQ29ubmVjdG9yIHVzZSBoaWRkZW4gaWZyYW1lLlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxuLyoqXG4gKiBUaGUgbW9kdWxlcyB3aWxsIGJlIG1peGVkIGluIGNvbm5lY3RvciBieSB0eXBlLlxuICovXG52YXIgSnNvbnAgPSB7LyoqIEBsZW5kcyBuZS5jb21wb25lbnQuVXBsb2FkZXIuSnNvbnAgKi9cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGJ5IGZvcm0gc3VibWl0LlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWcgQ29uZmlndXJhdGlvbiBmb3Igc3VibWl0IGZvcm0uXG4gICAgICogIEBwYXJhbSB7ZnVuY3Rpb259IGNvbmZpZy5zdWNjZXNzIENhbGxiYWNrIHdoZW4gcG9zdCBzdWJtaXQgY29tcGxhdGUuXG4gICAgICovXG4gICAgYWRkUmVxdWVzdDogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICAgIHZhciBjYWxsYmFja05hbWUgPSB0aGlzLl91cGxvYWRlci5jYWxsYmFja05hbWUsXG4gICAgICAgIGNhbGxiYWNrID0gY29uZmlnLnN1Y2Nlc3M7XG4gICAgICAgIG5lLnV0aWwuZGVmaW5lTmFtZXNwYWNlKGNhbGxiYWNrTmFtZSwgIG5lLnV0aWwuYmluZCh0aGlzLnN1Y2Nlc3NQYWRkaW5nLCB0aGlzLCBjYWxsYmFjaykpO1xuXG5cdFx0dGhpcy5fdXBsb2FkZXIuaW5wdXRWaWV3LiRlbC5zdWJtaXQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJlcHJvY2Vzc2luZyByZXNwb25zZSBiZWZvcmUgY2FsbGJhY2sgcnVuLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFJlcXVlc3QgQ2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgUmVzcG9uc2UgZnJvbSBzZXJ2ZXJcbiAgICAgKi9cbiAgICBzdWNjZXNzUGFkZGluZzogZnVuY3Rpb24oY2FsbGJhY2ssIHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSB7fTtcblxuXHRcdGlmICh0aGlzLl91cGxvYWRlci5pc0Nyb3NzRG9tYWluKCkpIHtcbiAgICAgICAgICAgIHJlc3VsdC5pdGVtcyA9IHRoaXMuX2dldFNwbGl0SXRlbXMocmVzcG9uc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0Lml0ZW1zID0gcmVzcG9uc2UuZmlsZWxpc3Q7XG4gICAgICAgIH1cblxuICAgICAgICBjYWxsYmFjayhyZXN1bHQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIHF1ZXJ5IGRhdGEgdG8gYXJyYXlcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBUaGUgRGF0YSBleHRyYWN0ZWQgZnJvbSBxdWVyeXN0cmluZyBzZXBhcmF0ZWQgYnkgJyYnXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0U3BsaXRJdGVtczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgc2VwID0gdGhpcy5fdXBsb2FkZXIuc2VwYXJhdG9yLFxuICAgICAgICAgICAgc3RhdHVzID0gZGF0YS5zdGF0dXMuc3BsaXQoc2VwKSxcbiAgICAgICAgICAgIG5hbWVzID0gZGF0YS5uYW1lcy5zcGxpdChzZXApLFxuICAgICAgICAgICAgc2l6ZXMgPSBkYXRhLnNpemVzLnNwbGl0KHNlcCksXG4gICAgICAgICAgICBpZHMgPSBuZS51dGlsLmlzU3RyaW5nKGRhdGEuaWRzKSA/IGRhdGEuaWRzLnNwbGl0KHNlcCkgOiBuYW1lcyxcbiAgICAgICAgICAgIGl0ZW1zID0gW107XG5cbiAgICAgICAgbmUudXRpbC5mb3JFYWNoKHN0YXR1cywgZnVuY3Rpb24oaXRlbSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmIChpdGVtID09PSAnc3VjY2VzcycpIHtcbiAgICAgICAgICAgICAgICB2YXIgbkl0ZW0gPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IG5hbWVzW2luZGV4XSxcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBzdGF0dXNbaW5kZXhdLFxuICAgICAgICAgICAgICAgICAgICBzaXplOiBzaXplc1tpbmRleF0sXG4gICAgICAgICAgICAgICAgICAgIGlkOiBpZHNbaW5kZXhdXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpdGVtcy5wdXNoKG5JdGVtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBpdGVtcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVxdWVzdCBhamF4IGJ5IGNvbmZpZyB0byByZW1vdmUgZmlsZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gY29uZmlnXG4gICAgICovXG4gICAgcmVtb3ZlUmVxdWVzdDogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICAgIHZhciBjYWxsYmFja05hbWUgPSB0aGlzLl91cGxvYWRlci5jYWxsYmFja05hbWUsXG4gICAgICAgICAgICBkYXRhID0ge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBjYWxsYmFja05hbWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjYWxsYmFjayA9IGNvbmZpZy5zdWNjZXNzO1xuXG4gICAgICAgIG5lLnV0aWwuZGVmaW5lTmFtZXNwYWNlKGNhbGxiYWNrTmFtZSwgbmUudXRpbC5iaW5kKHRoaXMucmVtb3ZlUGFkZGluZywgdGhpcywgY2FsbGJhY2spLCB0cnVlKTtcblxuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiB0aGlzLl91cGxvYWRlci51cmwucmVtb3ZlLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29ucCcsXG4gICAgICAgICAgICBqc29ucDogY2FsbGJhY2tOYW1lLFxuICAgICAgICAgICAgZGF0YTogbmUudXRpbC5leHRlbmQoZGF0YSwgY29uZmlnLmRhdGEpXG4gICAgICAgIH0pO1xuXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByZXByb2Nlc3NpbmcgcmVzcG9uc2UgYmVmb3JlIGNhbGxiYWNrIHJ1bi5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBSZXF1ZXN0IENhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIFJlc3BvbnNlIGZyb20gc2VydmVyXG4gICAgICovXG4gICAgcmVtb3ZlUGFkZGluZzogZnVuY3Rpb24oY2FsbGJhY2ssIHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgICAgcmVzdWx0LmFjdGlvbiA9ICdyZW1vdmUnO1xuICAgICAgICByZXN1bHQubmFtZSA9IGRlY29kZVVSSUNvbXBvbmVudChyZXNwb25zZS5uYW1lKTtcblxuICAgICAgICBjYWxsYmFjayhyZXN1bHQpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSnNvbnA7XG4iLCIvKipcbiAqIEBmaWxlb3ZldmlldyBUaGlzIENvbm5lY3RvciBtYWtlIGNvbm5lY3Rpb24gYmV0d2VlbiBVcGxvYWRlciBhbmQgaHRtbDUgZmlsZSBhcGkuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuLyoqXG4gKiBUaGUgbW9kdWxlcyB3aWxsIGJlIG1peGVkIGluIGNvbm5lY3RvciBieSB0eXBlLlxuICovXG52YXIgTG9jYWwgPSB7LyoqIEBsZW5kcyBuZS5jb21wb25lbnQuVXBsb2FkZXIuTG9jYWwgKi9cbiAgICAvKipcbiAgICAgKiBBIHJlc3VsdCBhcnJheSB0byBzYXZlIGZpbGUgdG8gc2VuZC5cbiAgICAgKi9cbiAgICBfcmVzdWx0IDogbnVsbCxcbiAgICAvKipcbiAgICAgKiBBZGQgUmVxdWVzdCwgc2F2ZSBmaWxlcyB0byBhcnJheS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBUaGUgZGF0YSBvZiBjb25uZWN0aW9uIGZvciBzZXJ2ZXJcblx0XHQgKiBAcGFyYW0ge29iamVjdH0gW2ZpbGVzXSBUaGUgZmlsZXMgdG8gc2F2ZVxuICAgICAqL1xuICAgIGFkZFJlcXVlc3Q6IGZ1bmN0aW9uKGRhdGEsIGZpbGVzKSB7XG4gICAgICAgIHZhciBpc1ZhbGlkUG9vbCA9IHV0aWxzLmlzU3VwcG9ydEZvcm1EYXRhKCksXG4gICAgICAgICAgICByZXN1bHQgPSB0aGlzLl9zYXZlRmlsZShpc1ZhbGlkUG9vbCwgZmlsZXMpO1xuICAgICAgICBkYXRhLnN1Y2Nlc3Moe1xuICAgICAgICAgICAgaXRlbXM6IHJlc3VsdFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2F2ZSBmaWxlIHRvIHBvb2xcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzU3VwcG9ydEFqYXggV2hldGhlciBGb3JtRGF0YSBpcyBzdXBwb3J0ZWQgb3Igbm90XG5cdFx0ICogQHBhcmFtIHtvYmplY3R9IFtmaWxlc10gVGhlIGZpbGVzIHRvIHNhdmVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zYXZlRmlsZTogZnVuY3Rpb24oaXNTdXBwb3J0QWpheCwgZmlsZXMpIHtcbiAgICAgICAgdmFyIHVwbG9hZGVyID0gdGhpcy5fdXBsb2FkZXIsXG4gICAgICAgICAgICBpbnB1dFZpZXcgPSB1cGxvYWRlci5pbnB1dFZpZXcsXG4gICAgICAgICAgICBmaWxlRWwgPSBpbnB1dFZpZXcuJGlucHV0WzBdLFxuXHRcdFx0XHRcdFx0cmVzdWx0ID0gW107XG5cbiAgICAgICAgaWYgKCF0aGlzLl9yZXN1bHQpIHtcbiAgICAgICAgICAgIHRoaXMuX3Jlc3VsdCA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzU3VwcG9ydEFqYXgpIHtcbiAgICAgICAgICAgIGZpbGVzID0gZmlsZXMgfHwgZmlsZUVsLmZpbGVzO1xuICAgICAgICAgICAgbmUudXRpbC5mb3JFYWNoKGZpbGVzLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5lLnV0aWwuaXNPYmplY3QoaXRlbSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goaXRlbSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaCh7XG4gICAgICAgICAgICAgICAgbmFtZTogZmlsZUVsLnZhbHVlLFxuICAgICAgICAgICAgICAgIGVsZW1lbnQ6IGZpbGVFbFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuXHRcdHRoaXMuX3Jlc3VsdCA9IHRoaXMuX3Jlc3VsdC5jb25jYXQocmVzdWx0KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZXMgZm9ybSBkYXRhIHRvIHNlbmQgUE9TVChGb3JtRGF0ZSBzdXBwb3J0ZWQgY2FzZSlcbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9tYWtlRm9ybURhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdXBsb2FkZXIgPSB0aGlzLl91cGxvYWRlcixcblx0XHRmaWVsZCA9IHVwbG9hZGVyLmZpbGVGaWVsZCxcblx0XHRpbnB1dCA9IHVwbG9hZGVyLmlucHV0Vmlldyxcblx0XHRmb3JtID0gbmV3IHdpbmRvdy5Gb3JtRGF0YSh0aGlzLl9leHRyYWN0Rm9ybShpbnB1dCkpO1xuXG4gICAgICAgIG5lLnV0aWwuZm9yRWFjaCh0aGlzLl9yZXN1bHQsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIGZvcm0uYXBwZW5kKGZpZWxkLCBpdGVtKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBmb3JtO1xuICAgIH0sXG5cblx0LyoqXG5cdCAqIEV4dHJhY3RzIEZvcm0gZnJvbSBpbnB1dFZpZXdcblx0ICogQHBhcmFtIHtvYmplY3R9IGlucHV0IFRoZSBpbnB1dCB2aWV3IGZvciBleHRyYWN0aW5nIFxuXHQgKi9cblx0X2V4dHJhY3RGb3JtOiBmdW5jdGlvbihpbnB1dCkge1xuXHR2YXIgZm9ybSA9IGlucHV0LiRlbC5jbG9uZSgpO1xuXHRcdC8vIGFwcGVuZCB0byBwb29sXG5cdFx0cmV0dXJuIGZvcm1bMF07XG5cdH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZmlsZSBmb3JtIHJlc3VsdCBhcnJheVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBpbmZvIFRoZSBpbmZvcm1hdGlvbiBzZXQgdG8gcmVtb3ZlIGZpbGVcbiAgICAgKi9cbiAgICByZW1vdmVSZXF1ZXN0OiBmdW5jdGlvbihpbmZvKSB7XG4gICAgICAgIHZhciBkYXRhID0gaW5mby5kYXRhO1xuICAgICAgICB0aGlzLl9yZXN1bHQgPSBuZS51dGlsLmZpbHRlcih0aGlzLl9yZXN1bHQsIGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICAgICByZXR1cm4gZWwubmFtZSAhPT0gZGF0YS5maWxlbmFtZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaW5mby5zdWNjZXNzKHtcbiAgICAgICAgICAgIGFjdGlvbjogJ3JlbW92ZScsXG4gICAgICAgICAgICBuYW1lOiBkYXRhLmZpbGVuYW1lXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZW5kIGZpbGVzIGluIGEgYmF0Y2guXG4gICAgICogQHBhcmFtIGNhbGxiYWNrXG4gICAgICovXG4gICAgc3VibWl0OiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB2YXIgZm9ybSA9IHRoaXMuX21ha2VGb3JtRGF0YShpbnB1dFZpZXcpO1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiB0aGlzLl91cGxvYWRlci51cmwuc2VuZCxcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgIGRhdGE6IGZvcm0sXG4gICAgICAgICAgICBzdWNjZXNzOiBjYWxsYmFjayxcbiAgICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBmYWxzZVxuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IExvY2FsOyIsIi8qKlxuICogQGZpbGVvdmVydmlldyBDb25maWd1cmF0aW9uIG9yIGRlZmF1bHQgdmFsdWVzLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIG9mIGNvbm5lY3Rpb24gd2l0aCBzZXJ2ZXIuXG4gICogQHR5cGUge3tSRVNQT05TRV9UWVBFOiBzdHJpbmcsIFJFRElSRUNUX1VSTDogc3RyaW5nfX1cbiAqL1xubW9kdWxlLmV4cG9ydHMuQ09ORiA9IHtcblx0UkVTUE9OU0VfVFlQRTogJ1JFU1BPTlNFX1RZUEUnLFxuXHRSRURJUkVDVF9VUkw6ICdSRURJUkVDVF9VUkwnLFxuXHRKU09OUENBTExCQUNLX05BTUU6ICdDQUxMQkFDS19OQU1FJyxcblx0U0laRV9VTklUOiAnU0laRV9VTklUJyxcblx0UkVNT1ZFX0NBTExCQUNLIDogJ3Jlc3BvbnNlUmVtb3ZlQ2FsbGJhY2snLFxuXHRFUlJPUjoge1xuXHRcdERFRkFVTFQ6ICdVbmtub3duIGVycm9yLicsXG5cdFx0Tk9UX1NVUlBQT1JUOiAnVGhpcyBpcyB4LWRvbWFpbiBjb25uZWN0aW9uLCB5b3UgaGF2ZSB0byBtYWtlIGhlbHBlciBwYWdlLidcblx0fSxcblx0RFJBR19ERUZBVUxUX0VOQUJMRV9DTEFTUzogJ2VuYWJsZUNsYXNzJyxcblx0RklMRV9GSUxFRF9OQU1FOiAndXNlcmZpbGVbXScsXG5cdEZPTERFUl9JTkZPOiAnZm9sZGVyTmFtZSdcbn07XG5cbi8qKlxuKiBEZWZhdWx0IEh0bWxzXG4qIEB0eXBlIHt7aW5wdXQ6IHN0cmluZywgaXRlbTogc3RyaW5nfX1cbiovXG5tb2R1bGUuZXhwb3J0cy5IVE1MID0ge1xuXHRmb3JtOiBbJzxmb3JtIGVuY3R5cGU9XCJtdWx0aXBhcnQvZm9ybS1kYXRhXCIgaWQ9XCJmb3JtRGF0YVwiIG1ldGhvZD1cInBvc3RcIj4nLFxuXHRcdCc8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJNQVhfRklMRV9TSVpFXCIgdmFsdWU9XCIzMDAwMDAwXCIgLz4nLFxuXHQnPC9mb3JtPiddLmpvaW4oJycpLFxuXHRpbnB1dDogWyc8aW5wdXQgdHlwZT1cImZpbGVcIiBpZD1cImZpbGVBdHRhY2hcIiB7e3dlYmtpdGRpcmVjdG9yeX19IG5hbWU9XCJ7e2ZpbGVGaWVsZH19XCIge3ttdWx0aXBsZX19IC8+J10uam9pbignJyksXG5cdHN1Ym1pdDogWyc8YnV0dG9uIGNsYXNzPVwiYmF0Y2hTdWJtaXRcIiB0eXBlPVwic3VibWl0XCI+U0VORDwvYnV0dG9uPiddLmpvaW4oJycpLFxuXHRpdGVtOiBbJzxsaSBjbGFzcz1cImZpbGV0eXBlRGlzcGxheUNsYXNzXCI+Jyxcblx0XHQnPHNwbmEgY2xhc3M9XCJmaWxlaWNvbiB7e2ZpbGV0eXBlfX1cIj57e2ZpbGV0eXBlfX08L3NwbmE+Jyxcblx0XHQnPHNwYW4gY2xhc3M9XCJmaWxlX25hbWVcIj57e2ZpbGVuYW1lfX08L3NwYW4+Jyxcblx0XHQnPHNwYW4gY2xhc3M9XCJmaWxlX3NpemVcIj57e2ZpbGVzaXplfX08L3NwYW4+Jyxcblx0XHQnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJ7e2RlbGV0ZUJ1dHRvbkNsYXNzTmFtZX19XCI+RGVsZXRlPC9idXR0b24+Jyxcblx0XHQnPC9saT4nXS5qb2luKCcnKSxcblx0ZHJhZzogWyc8ZGl2IGNsYXNzPVwiZHJhZ3pvbmVcIj48L2Rpdj4nXS5qb2luKCcnKVxufTtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlldyBGaWxlVXBsb2FkZXIgaXMgY29yZSBvZiBmaWxlIHVwbG9hZGVyIGNvbXBvbmVudC48YnI+RmlsZU1hbmFnZXIgbWFuYWdlIGNvbm5lY3RvciB0byBjb25uZWN0IHNlcnZlciBhbmQgdXBkYXRlIEZpbGVMaXN0Vmlldy5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbnZhciBzdGF0aWNzID0gcmVxdWlyZSgnLi9zdGF0aWNzJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgY29ubiA9IHJlcXVpcmUoJy4vY29ubmVjdG9yL2Nvbm5lY3RvcicpO1xudmFyIElucHV0ID0gcmVxdWlyZSgnLi92aWV3L2lucHV0Jyk7XG52YXIgTGlzdCA9IHJlcXVpcmUoJy4vdmlldy9saXN0Jyk7XG52YXIgUG9vbCA9IHJlcXVpcmUoJy4vdmlldy9wb29sJyk7XG52YXIgRHJhZ0FuZERyb3AgPSByZXF1aXJlKCcuL3ZpZXcvZHJhZycpO1xuXG4vKipcbiAqIEZpbGVVcGxvYWRlciBhY3QgbGlrZSBicmlkZ2UgYmV0d2VlbiBjb25uZWN0b3IgYW5kIHZpZXcuXG4gKiBJdCBtYWtlcyBjb25uZWN0b3IgYW5kIHZpZXcgd2l0aCBvcHRpb24gYW5kIGVudmlyb25tZW50LlxuICogSXQgY29udHJvbCBhbmQgbWFrZSBjb25uZWN0aW9uIGFtb25nIG1vZHVsZXMuXG4gKiBAY29uc3RydWN0b3IgbmUuY29tcG9uZW50LlVwbG9hZGVyXG4gKiBAZXhhbXBsZVxuICogdmFyIHVwbG9hZGVyID0gbmV3IG5lLmNvbXBvbmVudC5VcGxvYWRlcih7XG4gKiAgICAgdXJsOiB7XG4gKiAgICAgICAgIHNlbmQ6IFwiaHR0cDovL2ZlLm5obmVudC5jb20vZXRjL2V0Yy91cGxvYWRlci91cGxvYWRlci5waHBcIixcbiAqICAgICAgICAgcmVtb3ZlOiBcImh0dHA6Ly9mZS5uaG5lbnQuY29tL2V0Yy9ldGMvdXBsb2FkZXIvcmVtb3ZlLnBocFwiXG4gKiAgICAgfSxcbiAqICAgICBoZWxwZXI6IHtcbiAqICAgICAgICAgdXJsOiAnaHR0cDovLzEwLjc3LjM0LjEyNjo4MDA5L3NhbXBsZXMvcmVzcG9uc2UuaHRtbCcsXG4gKiAgICAgICAgIG5hbWU6ICdSRURJUkVDVF9VUkwnXG4gKiAgICAgfSxcbiAqICAgICByZXN1bHRUeXBlRWxlbWVudE5hbWU6ICdSRVNQT05TRV9UWVBFJyxcbiAqICAgICBmb3JtVGFyZ2V0OiAnaGlkZGVuRnJhbWUnLFxuICogICAgIGNhbGxiYWNrTmFtZTogJ3Jlc3BvbnNlQ2FsbGJhY2snLFxuICogICAgIGxpc3RJbmZvOiB7XG4gKiAgICAgICAgIGxpc3Q6ICQoJyNmaWxlcycpLFxuICogICAgICAgICBjb3VudDogJCgnI2ZpbGVfY291bnQnKSxcbiAqICAgICAgICAgc2l6ZTogJCgnI3NpemVfY291bnQnKVxuICogICAgIH0sXG4gKiAgICAgc2VwYXJhdG9yOiAnOydcbiAqIH0sICQoJyN1cGxvYWRlcicpKTtcbiAqL1xudmFyIFVwbG9hZGVyID0gbmUudXRpbC5kZWZpbmVDbGFzcygvKipAbGVuZHMgbmUuY29tcG9uZW50LlVwbG9hZGVyLnByb3RvdHlwZSAqL3tcblxuXHQvKipcblx0ICogaW5pdGlhbGl6ZSBvcHRpb25zXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFRoZSBvcHRpb25zIHRvIHNldCB1cCBmaWxlIHVwbG9hZGVyIG1vZHVsZXMuXG5cdCAqICBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy51cmwgVGhlIHVybCBpcyBmaWxlIHNlcnZlci5cblx0ICogICAgICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy51cmwuc2VuZCBUaGUgdXJsIGlzIGZvciBmaWxlIGF0dGFjaC5cblx0ICogICAgICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy51cmwucmVtb3ZlIFRoZSB1cmwgaXMgZm9yIGZpbGUgZGV0YWNoLlxuXHQgKiAgQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMuaGVscGVyIFRoZSBoZWxwZXIgb2JqZWN0IGluZm8gaXMgZm9yIHgtZG9tYWluLlxuXHQgKiAgICAgIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmhlbHBlci51cmwgVGhlIHVybCBpcyBoZWxwZXIgcGFnZSB1cmwuXG5cdCAqICAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuaGVscGVyLm5hbWUgVGhlIG5hbWUgb2YgaGlkZGVuIGVsZW1lbnQgZm9yIHNlbmRpbmcgc2VydmVyIGhlbHBlciBwYWdlIGluZm9ybWF0aW9uLlxuXHQgKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMucmVzdWx0VHlwZUVsZW1lbnROYW1lIFRoZSB0eXBlIG9mIGhpZGRlbiBlbGVtZW50IGZvciBzZW5kaW5nIHNlcnZlciByZXNwb25zZSB0eXBlIGluZm9ybWF0aW9uLlxuXHQgKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuZm9ybVRhcmdldCBUaGUgdGFyZ2V0IGZvciB4LWRvbWFpbiBqc29ucCBjYXNlLlxuXHQgKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuY2FsbGJhY2tOYW1lIFRoZSBuYW1lIG9mIGpzb25wIGNhbGxiYWNrIGZ1bmN0aW9uLlxuXHQgKiAgQHBhcmFtIHtvYmplY3R9IG9waXRvbnMubGlzdEluZm8gVGhlIGVsZW1lbnQgaW5mbyB0byBkaXNwbGF5IGZpbGUgbGlzdCBpbmZvcm1hdGlvbi5cblx0ICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnNlcGFyYXRvciBUaGUgc2VwYXJhdG9yIGZvciBqc29ucCBoZWxwZXIgcmVzcG9uc2UuXG5cdCAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZmlsZUZpZWxkPXVzZXJGaWxlXSBUaGUgZmllbGQgbmFtZSBvZiBpbnB1dCBmaWxlIGVsZW1lbnQuXG5cdCAqICBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMudXNlRm9sZGVyIFdoZXRoZXIgc2VsZWN0IHVuaXQgaXMgZm9sZGVyIG9mIG5vdC4gSWYgdGhpcyBpcyB0dXJlLCBtdWx0aXBsZSB3aWxsIGJlIGlnbm9yZWQuXG5cdCAqICBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMuaXNNdWx0aXBsZSBXaGV0aGVyIGVuYWJsZSBtdWx0aXBsZSBzZWxlY3Qgb3Igbm90LlxuXHQgKiBAcGFyYW0ge0pxdWVyeU9iamVjdH0gJGVsIFJvb3QgRWxlbWVudCBvZiBVcGxvYWRlclxuXHQgKi9cblx0aW5pdDogZnVuY3Rpb24ob3B0aW9ucywgJGVsKSB7XG5cdFx0dGhpcy5fc2V0RGF0YShvcHRpb25zKTtcblx0XHR0aGlzLl9zZXRDb25uZWN0b3IoKTtcblxuXHRcdHRoaXMuJGVsID0gJGVsO1xuXG5cdFx0aWYodGhpcy51c2VEcmFnICYmICF0aGlzLnVzZUZvbGRlciAmJiB1dGlscy5pc1N1cHBvcnRGaWxlU3lzdGVtKCkpIHtcblx0XHRcdHRoaXMuZHJhZ1ZpZXcgPSBuZXcgRHJhZ0FuZERyb3Aob3B0aW9ucywgdGhpcyk7XG5cdFx0fVxuXG5cdFx0dGhpcy5pbnB1dFZpZXcgPSBuZXcgSW5wdXQob3B0aW9ucywgdGhpcyk7XG5cdFx0dGhpcy5saXN0VmlldyA9IG5ldyBMaXN0KG9wdGlvbnMsIHRoaXMpO1xuXG5cdFx0dGhpcy5maWxlRmllbGQgPSB0aGlzLmZpbGVGaWVsZCB8fCBzdGF0aWNzLkNPTkYuRklMRV9GSUxFRF9OQU1FO1xuXHRcdHRoaXMuX3Bvb2wgPSBuZXcgUG9vbCh0aGlzLmxpc3RWaWV3LiRlbFswXSk7XG5cdFx0dGhpcy5fYWRkRXZlbnQoKTtcblx0fSxcblx0XG5cdC8qKlxuXHQgKiBTZXQgQ29ubmVjdG9yIGJ5IHVzZUpzb25wIGZsYWcgYW5kIHdoZXRoZXIuXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfc2V0Q29ubmVjdG9yOiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5pc0JhdGNoVHJhbnNmZXIpIHtcblx0XHRcdHRoaXMudHlwZSA9ICdsb2NhbCc7XG5cdFx0fSBlbHNlIGlmICh0aGlzLmlzQ3Jvc3NEb21haW4oKSkge1xuXHRcdFx0aWYgKHRoaXMuaGVscGVyKSB7XG5cdFx0XHRcdHRoaXMudHlwZSA9ICdqc29ucCc7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhbGVydChzdGF0aWNzLkNPTkYuRVJST1IuTk9UX1NVUlBQT1JUKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKHRoaXMudXNlSnNvbnAgfHwgIXV0aWxzLmlzU3VwcG9ydEZvcm1EYXRhKCkpIHtcblx0XHRcdFx0dGhpcy50eXBlID0gJ2pzb25wJztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMudHlwZSA9ICdhamF4Jztcblx0XHRcdH1cblx0XHR9XG5cdFx0dGhpcy5fY29ubmVjdG9yID0gY29ubi5nZXRDb25uZWN0b3IodGhpcyk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFVwZGF0ZSBsaXN0IHZpZXcgd2l0aCBjdXN0b20gb3Igb3JpZ2luYWwgZGF0YS5cblx0ICogQHBhcmFtIHtvYmplY3R9IGluZm8gVGhlIGRhdGEgZm9yIHVwZGF0ZSBsaXN0XG5cdCAqICBAcGFyYW0ge3N0cmluZ30gaW5mby5hY3Rpb24gVGhlIGFjdGlvbiBuYW1lIHRvIGV4ZWN1dGUgbWV0aG9kXG5cdCAqL1xuXHRub3RpZnk6IGZ1bmN0aW9uKGluZm8pIHtcblx0XHR0aGlzLmxpc3RWaWV3LnVwZGF0ZShpbmZvKTtcblx0XHR0aGlzLmxpc3RWaWV3LnVwZGF0ZVRvdGFsSW5mbyhpbmZvKTtcblx0fSxcblxuXHQvKipcblx0ICogU2V0IGZpZWxkIGRhdGEgYnkgb3B0aW9uIHZhbHVlcy5cblx0ICogQHBhcmFtIG9wdGlvbnNcblx0ICovXG5cdF9zZXREYXRhOiBmdW5jdGlvbihvcHRpb25zKSB7XG5cdFx0bmUudXRpbC5leHRlbmQodGhpcywgb3B0aW9ucyk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEV4dHJhY3QgcHJvdG9jb2wgKyBkb21haW4gZnJvbSB1cmwgdG8gZmluZCBvdXQgd2hldGhlciBjcm9zcy1kb21haW4gb3Igbm90LlxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdGlzQ3Jvc3NEb21haW46IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBwYWdlRG9tYWluID0gZG9jdW1lbnQuZG9tYWluO1xuXHRcdHJldHVybiB0aGlzLnVybC5zZW5kLmluZGV4T2YocGFnZURvbWFpbikgPT09IC0xO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBDYWxsYmFjayBmb3IgZXJyb3Jcblx0ICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIEVycm9yIHJlc3BvbnNlXG5cdCAqL1xuXHRlcnJvckNhbGxiYWNrOiBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdHZhciBtZXNzYWdlO1xuXHRcdGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5tc2cpIHtcblx0XHRcdG1lc3NhZ2UgPSByZXNwb25zZS5tc2c7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG1lc3NhZ2UgPSBzdGF0aWNzLkNPTkYuRVJST1IuREVGQVVMVDtcblx0XHR9XG5cdFx0YWxlcnQobWVzc2FnZSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIENhbGxiYWNrIGZvciBjdXN0b20gc2VuZCBldmVudFxuXHQgKiBAcGFyYW0ge29iamVjdH0gW2RhdGFdIFRoZSBkYXRhIGluY2x1ZGUgY2FsbGJhY2sgZnVuY3Rpb24gZm9yIGZpbGUgY2xvbmVcblx0ICovXG5cdHNlbmRGaWxlOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0dmFyIGNhbGxiYWNrID0gbmUudXRpbC5iaW5kKHRoaXMubm90aWZ5LCB0aGlzKSxcblx0XHRmaWxlcyA9IGRhdGEgJiYgZGF0YS5maWxlcztcblx0XHRcblx0XHR0aGlzLl9jb25uZWN0b3IuYWRkUmVxdWVzdCh7XG5cdFx0XHR0eXBlOiAnYWRkJyxcblx0XHRcdHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3VsdCkge1xuXHRcdFx0XHRpZiAoZGF0YSAmJiBkYXRhLmNhbGxiYWNrKSB7XG5cdFx0XHRcdFx0ZGF0YS5jYWxsYmFjayhyZXN1bHQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGNhbGxiYWNrKHJlc3VsdCk7XG5cdFx0XHR9LFxuXHRcdFx0ZXJyb3I6IHRoaXMuZXJyb3JDYWxsYmFja1xuXHRcdH0sIGZpbGVzKTtcblx0fSxcblxuXHQvKipcblx0ICogQ2FsbGJhY2sgZm9yIGN1c3RvbSByZW1vdmUgZXZlbnRcblx0ICogQHBhcmFtIHtvYmplY3R9IGRhdGEgVGhlIGRhdGEgZm9yIHJlbW92ZSBmaWxlLlxuXHQgKi9cblx0cmVtb3ZlRmlsZTogZnVuY3Rpb24oZGF0YSkge1xuXHRcdHZhciBjYWxsYmFjayA9IG5lLnV0aWwuYmluZCh0aGlzLm5vdGlmeSwgdGhpcyk7XG5cdFx0dGhpcy5fY29ubmVjdG9yLnJlbW92ZVJlcXVlc3Qoe1xuXHRcdFx0dHlwZTogJ3JlbW92ZScsXG5cdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0c3VjY2VzczogY2FsbGJhY2tcblx0XHR9KTtcblx0fSxcblxuXHQvKipcblx0ICogU3VibWl0IGZvciBkYXRhIHN1Ym1pdCB0byBzZXJ2ZXJcblx0ICovXG5cdHN1Ym1pdDogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMuX2Nvbm5lY3Rvci5zdWJtaXQpIHtcblx0XHRcdHRoaXMuX2Nvbm5lY3Rvci5zdWJtaXQobmUudXRpbC5iaW5kKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0aGlzLmZpcmUoJ2JlZm9yZXN1Ym1pdCcsIHRoaXMpO1xuXHRcdFx0fSwgdGhpcykpO1xuXHRcdH0gXG5cdH0sXG5cblx0LyoqXG5cdCAqIEdldCBmaWxlIGluZm8gbG9jYWxseVxuXHQgKiBAcGFyYW0ge0h0bWxFbGVtZW50fSBlbGVtZW50IElucHV0IGVsZW1lbnRcblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9nZXRGaWxlSW5mbzogZnVuY3Rpb24oZWxlbWVudCkge1xuXHRcdHZhciBmaWxlcztcblx0XHRpZiAodXRpbHMuaXNTdXBwb3J0RmlsZVN5c3RlbSgpKSB7XG5cdFx0XHRmaWxlcyA9IHRoaXMuX2dldEZpbGVMaXN0KGVsZW1lbnQuZmlsZXMpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmaWxlcyA9IHtcblx0XHRcdFx0bmFtZTogZWxlbWVudC52YWx1ZSxcblx0XHRcdFx0aWQ6IGVsZW1lbnQudmFsdWVcblx0XHRcdH07XG5cdFx0fVxuXHRcdHJldHVybiBmaWxlcztcblx0fSxcblxuXHQvKipcblx0ICogR2V0IGZpbGUgbGlzdCBmcm9tIEZpbGVMaXN0IG9iamVjdFxuXHQgKiBAcGFyYW0ge0ZpbGVMaXN0fSBmaWxlcyBBIEZpbGVMaXN0IG9iamVjdFxuXHQgKiBAcmV0dXJucyB7QXJyYXl9XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfZ2V0RmlsZUxpc3Q6IGZ1bmN0aW9uKGZpbGVzKSB7XG5cdFx0cmV0dXJuIG5lLnV0aWwubWFwKGZpbGVzLCBmdW5jdGlvbihmaWxlKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRuYW1lOiBmaWxlLm5hbWUsXG5cdFx0XHRcdHNpemU6IGZpbGUuc2l6ZSxcblx0XHRcdFx0aWQ6IGZpbGUubmFtZVxuXHRcdFx0fTtcblx0XHR9KTtcblx0fSxcblxuXHQvKipcblx0ICogQWRkIGV2ZW50IHRvIGxpc3R2aWV3IGFuZCBpbnB1dHZpZXdcblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG5cblx0XHRpZih0aGlzLnVzZURyYWcgJiYgdGhpcy5kcmFnVmlldykge1xuXHRcdFx0Ly8gQHRvZG8gdG9wIOyymOumrOqwgCDrlLDroZwg7ZWE7JqU7ZWoLCBzZW5kRmlsZSDsgqzsmqkg7JWI65CoXG5cdFx0XHR0aGlzLmRyYWdWaWV3Lm9uKCdkcm9wJywgdGhpcy5zZW5kRmlsZSwgdGhpcyk7XG5cdFx0fVxuXHRcdGlmICh0aGlzLmlzQmF0Y2hUcmFuc2Zlcikge1xuXHRcdFx0dGhpcy5pbnB1dFZpZXcub24oJ3NhdmUnLCB0aGlzLnNlbmRGaWxlLCB0aGlzKTtcblx0XHRcdHRoaXMubGlzdFZpZXcub24oJ3JlbW92ZScsIHRoaXMucmVtb3ZlRmlsZSwgdGhpcyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuaW5wdXRWaWV3Lm9uKCdjaGFuZ2UnLCB0aGlzLnNlbmRGaWxlLCB0aGlzKTtcblx0XHRcdHRoaXMubGlzdFZpZXcub24oJ3JlbW92ZScsIHRoaXMucmVtb3ZlRmlsZSwgdGhpcyk7XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBTdG9yZSBpbnB1dCBlbGVtZW50IHRvIHBvb2wuXG5cdCAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGlucHV0IEEgaW5wdXQgZWxlbWVudFt0eXBlPWZpbGVdIGZvciBzdG9yZSBwb29sXG5cdCAqL1xuXHRzdG9yZTogZnVuY3Rpb24oaW5wdXQpIHtcblx0XHR0aGlzLl9wb29sLnN0b3JlKGlucHV0KTtcblx0fSxcblxuXHQvKipcblx0ICogUmVtb3ZlIGlucHV0IGVsZW1lbnQgZm9ybSBwb29sLlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgZmlsZSBuYW1lIHRvIHJlbW92ZVxuXHQgKi9cblx0cmVtb3ZlOiBmdW5jdGlvbihuYW1lKSB7XG5cdFx0aWYgKCF1dGlscy5pc1N1cHBvcnRGb3JtRGF0YSgpKSB7XG5cdFx0XHR0aGlzLl9wb29sLnJlbW92ZShuYW1lKTtcblx0XHR9XG5cdH1cbn0pO1xuXG5uZS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihVcGxvYWRlcik7XG5tb2R1bGUuZXhwb3J0cyA9IFVwbG9hZGVyOyIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIGZpbGUgY29udGFpbiB1dGlsaXR5IG1ldGhvZHMgZm9yIHVwbG9hZGVyLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxuLyoqXG4gKiBFeHRyYWN0IHVuaXQgZm9yIGZpbGUgc2l6ZVxuICogQHBhcmFtIHtudW1iZXJ9IGJ5dGVzIEEgdXNhZ2Ugb2YgZmlsZVxuICovXG5tb2R1bGUuZXhwb3J0cy5nZXRGaWxlU2l6ZVdpdGhVbml0ID0gZnVuY3Rpb24oYnl0ZXMpIHtcbiAgICB2YXIgdW5pdHMgPSBbJ0InLCAnS0InLCAnTUInLCAnR0InLCAnVEInXSxcbiAgICAgICAgYnl0ZXMgPSBwYXJzZUludChieXRlcywgMTApLFxuICAgICAgICBleHAgPSBNYXRoLmxvZyhieXRlcykgLyBNYXRoLmxvZygxMDI0KSB8IDAsXG4gICAgICAgIHJlc3VsdCA9IChieXRlcyAvIE1hdGgucG93KDEwMjQsIGV4cCkpLnRvRml4ZWQoMik7XG5cbiAgICByZXR1cm4gcmVzdWx0ICsgdW5pdHNbZXhwXTtcbn07XG5cbi8qKlxuICogV2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0IEZvcm1EYXRhIG9yIG5vdFxuICovXG5tb2R1bGUuZXhwb3J0cy5pc1N1cHBvcnRGb3JtRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBGb3JtRGF0YSA9ICh3aW5kb3cuRm9ybURhdGEgfHwgbnVsbCk7XG4gICAgcmV0dXJuICEhRm9ybURhdGE7XG59O1xuXG4vKipcbiAqIEdldCBpdGVtIGVsZW1lbiBIVE1MXG4gKiBAcGFyYW0ge3N0cmluZ30gaHRtbCBIVE1MIHRlbXBsYXRlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5tb2R1bGUuZXhwb3J0cy50ZW1wbGF0ZSA9IGZ1bmN0aW9uKG1hcCwgaHRtbCkge1xuICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoL1xce1xceyhbXlxcfV0rKVxcfVxcfS9nLCBmdW5jdGlvbihtc3RyLCBuYW1lKSB7XG4gICAgICAgIHJldHVybiBtYXBbbmFtZV07XG4gICAgfSk7XG4gICAgcmV0dXJuIGh0bWw7XG59O1xuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgc3VwcG9ydCBmaWxlIGFwaSBvciBub3RcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5tb2R1bGUuZXhwb3J0cy5pc1N1cHBvcnRGaWxlU3lzdGVtID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICEhKHdpbmRvdy5GaWxlICYmIHdpbmRvdy5GaWxlUmVhZGVyICYmIHdpbmRvdy5GaWxlTGlzdCAmJiB3aW5kb3cuQmxvYik7XG59OyIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIGZpbGUgaXMgYWJvdXQgZHJhZyBhbmQgZHJvcCBmaWxlIHRvIHNlbmQuIERyYWcgYW5kIGRyb3AgaXMgcnVubmluZyB2aWEgZmlsZSBhcGkuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG52YXIgc3RhdGljcyA9IHJlcXVpcmUoJy4uL3N0YXRpY3MnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cbi8qKlxuICogTWFrZXMgZHJhZyBhbmQgZHJvcCBhcmVhLCB0aGUgZHJvcHBlZCBmaWxlIGlzIGFkZGVkIHZpYSBldmVudCBkcm9wIGV2ZW50LlxuICogQGNsYXNzIERyYWdBbmREcm9wXG4gKi9cbnZhciBEcmFnQW5kRHJvcCA9IG5lLnV0aWwuZGVmaW5lQ2xhc3Moe1xuXHQvKipcblx0ICogaW5pdGlhbGl6ZSBEcmFnQW5kRHJvcFxuXHQgKi9cblx0aW5pdDogZnVuY3Rpb24ob3B0aW9ucywgdXBsb2FkZXIpIHtcblx0XHR2YXIgaHRtbCA9IG9wdGlvbnMudGVtcGxhdGUgJiYgb3B0aW9ucy50ZW1wbGF0ZS5kcmFnIHx8IHN0YXRpY3MuSFRNTC5kcmFnO1xuXHRcdHRoaXMuX2VuYWJsZUNsYXNzID0gb3B0aW9ucy5kcmFnICYmIG9wdGlvbnMuZHJhZy5lbmFibGVDbGFzcyB8fCBzdGF0aWNzLkNPTkYuRFJBR19ERUZBVUxUX0VOQUJMRV9DTEFTUztcblx0XHR0aGlzLl9yZW5kZXIoaHRtbCwgdXBsb2FkZXIpO1xuXHRcdHRoaXMuX2FkZEV2ZW50KCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJlbmRlcnMgZHJhZyBhbmQgZHJvcCBhcmVhXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBodG1sIFRoZSBodG1sIHN0cmluZyB0byBtYWtlIGRhcmcgem9uZVxuXHQgKiBAcGFyYW0ge29iamVjdH0gdXBsb2FkZXIgVGhlIGNvcmUgaW5zdGFuY2Ugb2YgdGhpcyBjb21wb25lbnRcblx0ICovXG5cdF9yZW5kZXI6IGZ1bmN0aW9uKGh0bWwsIHVwbG9hZGVyKSB7XG5cdFx0dGhpcy4kZWwgPSAkKGh0bWwpO1xuXHRcdHVwbG9hZGVyLiRlbC5hcHBlbmQodGhpcy4kZWwpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBZGRzIGRyYWcgYW5kIGRyb3AgZXZlbnRcblx0ICovXG5cdF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwub24oJ2RyYWdlbnRlcicsIG5lLnV0aWwuYmluZCh0aGlzLm9uRHJhZ0VudGVyLCB0aGlzKSk7XG5cdFx0dGhpcy4kZWwub24oJ2RyYWdvdmVyJywgbmUudXRpbC5iaW5kKHRoaXMub25EcmFnT3ZlciwgdGhpcykpO1xuXHRcdHRoaXMuJGVsLm9uKCdkcm9wJywgbmUudXRpbC5iaW5kKHRoaXMub25Ecm9wLCB0aGlzKSk7XG5cdFx0dGhpcy4kZWwub24oJ2RyYWdsZWF2ZScsIG5lLnV0aWwuYmluZCh0aGlzLm9uRHJhZ0xlYXZlLCB0aGlzKSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEhhbmRsZXMgZHJhZ2VudGVyIGV2ZW50XG5cdCAqL1xuXHRvbkRyYWdFbnRlcjogZnVuY3Rpb24oZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdHRoaXMuX2VuYWJsZSgpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBIYW5kbGVzIGRyYWdvdmVyIGV2ZW50XG5cdCAqL1xuXHRvbkRyYWdPdmVyOiBmdW5jdGlvbihlKSB7XG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEhhbmRsZXMgZHJhZ2xlYXZlIGV2ZW50XG5cdCAqL1xuXHRvbkRyYWdMZWF2ZTogZnVuY3Rpb24oZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdHRoaXMuX2Rpc2FibGUoKTtcblx0fSxcblxuXHQvKipcblx0ICogSGFuZGxlcyBkcm9wIGV2ZW50XG5cdCAqL1xuXHRvbkRyb3A6IGZ1bmN0aW9uKGUpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0dGhpcy5fZGlzYWJsZSgpO1xuXHRcdHRoaXMuZmlyZSgnZHJvcCcsIHtcblx0XHRcdGZpbGVzOiBlLm9yaWdpbmFsRXZlbnQuZGF0YVRyYW5zZmVyLmZpbGVzXG5cdFx0fSk7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9LFxuXG5cdF9lbmFibGU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmFkZENsYXNzKHRoaXMuX2VuYWJsZUNsYXNzKTtcblx0fSxcblxuXHRfZGlzYWJsZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3ModGhpcy5fZW5hYmxlQ2xhc3MpO1xuXHR9XG59KTtcblxubmUudXRpbC5DdXN0b21FdmVudHMubWl4aW4oRHJhZ0FuZERyb3ApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyYWdBbmREcm9wO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IElucHV0VmlldyBtYWtlIGlucHV0IGZvcm0gYnkgdGVtcGxhdGUuIEFkZCBldmVudCBmaWxlIHVwbG9hZCBldmVudC5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbnZhciBzdGF0aWNzID0gcmVxdWlyZSgnLi4vc3RhdGljcycpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuLyoqXG4gKiBUaGlzIHZpZXcgY29udHJvbCBpbnB1dCBlbGVtZW50IHR5cGVkIGZpbGUuXG4gKiBAY29uc3RydWN0b3IgbmUuY29tcG9uZW50LkZpbGVVcGxvYWRlci5JbnB1dFZpZXdcbiAqL1xudmFyIElucHV0ID0gbmUudXRpbC5kZWZpbmVDbGFzcygvKipAbGVuZHMgbmUuY29tcG9uZW50LlVwbG9hZGVyLklucHV0LnByb3RvdHlwZSAqKi97XG5cdC8qKlxuXHQgKiBJbml0aWFsaXplIGlucHV0IGVsZW1lbnQuXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cblx0ICovXG5cdGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMsIHVwbG9hZGVyKSB7XG5cblx0XHR0aGlzLl91cGxvYWRlciA9IHVwbG9hZGVyO1xuXHRcdHRoaXMuX3RhcmdldCA9IG9wdGlvbnMuZm9ybVRhcmdldDtcblx0XHR0aGlzLl91cmwgPSBvcHRpb25zLnVybDtcblx0XHR0aGlzLl9pc0JhdGNoVHJhbnNmZXIgPSBvcHRpb25zLmlzQmF0Y2hUcmFuc2Zlcjtcblx0XHR0aGlzLl9pc011bHRpcGxlID0gISEodXRpbHMuaXNTdXBwb3J0Rm9ybURhdGEoKSAmJiBvcHRpb25zLmlzTXVsdGlwbGUpO1xuXHRcdHRoaXMuX3VzZUZvbGRlciA9ICEhKHV0aWxzLmlzU3VwcG9ydEZvcm1EYXRhKCkgJiYgb3B0aW9ucy51c2VGb2xkZXIpO1xuXG5cdFx0dGhpcy5faHRtbCA9IHRoaXMuX3NldEhUTUwoKTtcblxuXHRcdHRoaXMuX3JlbmRlcigpO1xuXHRcdHRoaXMuX3JlbmRlckhpZGRlbkVsZW1lbnRzKCk7XG5cblx0XHRpZiAob3B0aW9ucy5oZWxwZXIpIHtcblx0XHRcdHRoaXMuX21ha2VCcmlkZ2VJbmZvRWxlbWVudChvcHRpb25zLmhlbHBlcik7XG5cdFx0fVxuXG5cdFx0dGhpcy5fYWRkRXZlbnQoKTtcblx0fSxcblxuXHQvKipcblx0ICogUmVuZGVyIGlucHV0IGFyZWFcblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9yZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsID0gJCh0aGlzLl9nZXRIdG1sKCkpO1xuXHRcdHRoaXMuJGVsLmF0dHIoe1xuXHRcdFx0YWN0aW9uOiB0aGlzLl91cmwuc2VuZCxcblx0XHRcdG1ldGhvZDogJ3Bvc3QnLFxuXHRcdFx0ZW5jdHlwZTogXCJtdWx0aXBhcnQvZm9ybS1kYXRhXCIsXG5cdFx0XHR0YXJnZXQ6IHRoaXMuX3RhcmdldFxuXHRcdH0pO1xuXHRcdHRoaXMuJGlucHV0ID0gdGhpcy5fZ2V0SW5wdXRFbGVtZW50KCk7XG5cdFx0dGhpcy4kc3VibWl0ID0gdGhpcy5fZ2V0U3VibWl0RWxlbWVudCgpO1xuXHRcdHRoaXMuJGlucHV0LmFwcGVuZFRvKHRoaXMuJGVsKTtcblx0XHRpZiAodGhpcy4kc3VibWl0KSB7XG5cdFx0XHR0aGlzLiRzdWJtaXQuYXBwZW5kVG8odGhpcy4kZWwpO1xuXHRcdH1cblx0XHR0aGlzLl91cGxvYWRlci4kZWwuYXBwZW5kKHRoaXMuJGVsKTtcblx0fSxcblxuXHQvKipcblx0ICogU2V0IGFsbCBvZiBpbnB1dCBlbGVtZW50cyBodG1sIHN0cmluZ3MuXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBbdGVtcGxhdGVdIFRoZSB0ZW1wbGF0ZSBpcyBzZXQgZm9ybSBjdXN0b21lci5cblx0ICogQHJldHVybiB7b2JqZWN0fSBUaGUgaHRtbCBzdHJpbmcgc2V0IGZvciBpbnB1dFZpZXdcblx0ICovXG5cdF9zZXRIVE1MOiBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuXHRcdGlmICghdGVtcGxhdGUpIHtcblx0XHRcdHRlbXBsYXRlID0ge307XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGlucHV0OiB0ZW1wbGF0ZS5pbnB1dCB8fCBzdGF0aWNzLkhUTUwuaW5wdXQsXG5cdFx0XHRzdWJtaXQ6IHRlbXBsYXRlLnN1Ym1pdCB8fCBzdGF0aWNzLkhUTUwuc3VibWl0LFxuXHRcdFx0Zm9ybTogdGVtcGxhdGUuZm9ybSB8fCBzdGF0aWNzLkhUTUwuZm9ybVxuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqIEdldCBodG1sIHN0cmluZyBmcm9tIHRlbXBsYXRlXG5cdCAqIEByZXR1cm4ge29iamVjdH1cblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9nZXRIdG1sOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5faHRtbC5mb3JtO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBNYWtlcyBhbmQgcmV0dXJucyBqcXVlcnkgZWxlbWVudFxuXHQgKiBAcmV0dXJuIHtvYmplY3R9IFRoZSBqcXVlcnkgb2JqZWN0IHdyYXBwaW5nIG9yaWdpbmFsIGlucHV0IGVsZW1lbnRcblx0ICovXG5cdF9nZXRJbnB1dEVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBtYXAgPSB7XG5cdFx0XHRtdWx0aXBsZTogdGhpcy5faXNNdWx0aXBsZSA/ICdtdWx0aXBsZScgOiAnJyxcblx0XHRcdGZpbGVGaWVsZDogdGhpcy5fdXBsb2FkZXIuZmlsZUZpZWxkLFxuXHRcdFx0d2Via2l0ZGlyZWN0b3J5OiB0aGlzLl91c2VGb2xkZXIgPyAnd2Via2l0ZGlyZWN0b3J5JyA6ICcnXG5cdFx0fTtcblxuXHRcdHJldHVybiAkKHV0aWxzLnRlbXBsYXRlKG1hcCwgdGhpcy5faHRtbC5pbnB1dCkpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBNYWtlcyBhbmQgcmV0dXJucyBqcXVlcnkgZWxlbWVudFxuXHQgKiBAcmV0dXJuIHtvYmplY3R9IFRoZSBqcXVlcnkgb2JqZWN0IHdyYXBwaW5nIHN1bWJpdCBidXR0b24gZWxlbWVudFxuXHQgKi9cblx0X2dldFN1Ym1pdEVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLl9pc0JhdGNoVHJhbnNmZXIpIHtcblx0XHRcdHJldHVybiAkKHRoaXMuX2h0bWwuc3VibWl0KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1x0XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBDYWxsIG1ldGhvZHMgdGhvc2UgbWFrZSBlYWNoIGhpZGRlbiBlbGVtZW50LlxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X3JlbmRlckhpZGRlbkVsZW1lbnRzOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLl9tYWtlVGFyZ2V0RnJhbWUoKTtcblx0XHR0aGlzLl9tYWtlUmVzdWx0VHlwZUVsZW1lbnQoKTtcblx0XHR0aGlzLl9tYWtlQ2FsbGJhY2tFbGVtZW50KCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEFkZCBldmVudFxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X2FkZEV2ZW50OiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5faXNCYXRjaFRhcm5zZmVyKSB7XG5cdFx0XHR0aGlzLiRlbC5vbignc3VibWl0JywgbmUudXRpbC5iaW5kKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0aGlzLl91cGxvYWRlci5zdWJtaXQoKTtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fSwgdGhpcykpO1xuXHRcdH1cblx0XHR0aGlzLl9hZGRJbnB1dEV2ZW50KCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEFkZCBpbnB1dCBlbGVtZW50IGNoYW5nZSBldmVudCBieSBzZW5kaW5nIHR5cGVcblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9hZGRJbnB1dEV2ZW50OiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5faXNCYXRjaFRyYW5zZmVyKSB7XG5cdFx0XHR0aGlzLiRpbnB1dC5vbignY2hhbmdlJywgbmUudXRpbC5iaW5kKHRoaXMub25TYXZlLCB0aGlzKSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuJGlucHV0Lm9uKCdjaGFuZ2UnLCBuZS51dGlsLmJpbmQodGhpcy5vbkNoYW5nZSwgdGhpcykpO1xuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogRXZlbnQtSGFuZGxlIGZvciBpbnB1dCBlbGVtZW50IGNoYW5nZVxuXHQgKi9cblx0b25DaGFuZ2U6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZmlyZSgnY2hhbmdlJywge1xuXHRcdFx0dGFyZ2V0OiB0aGlzXG5cdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEV2ZW50LUhhbmRsZSBmb3Igc2F2ZSBpbnB1dCBlbGVtZW50XG5cdCAqL1xuXHRvblNhdmU6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnNvbGUubG9nKHRoaXMuJGlucHV0KTtcblx0XHR2YXIgc2F2ZUNhbGxiYWNrID0gIXV0aWxzLmlzU3VwcG9ydEZvcm1EYXRhKCkgPyBuZS51dGlsLmJpbmQodGhpcy5fcmVzZXRJbnB1dEVsZW1lbnQsIHRoaXMpIDogbnVsbDtcblx0XHR0aGlzLmZpcmUoJ3NhdmUnLCB7XG5cdFx0XHRlbGVtZW50OiB0aGlzLiRpbnB1dFswXSxcblx0XHRcdGNhbGxiYWNrOiBzYXZlQ2FsbGJhY2tcblx0XHR9KTtcblx0fSxcblxuXHQvKipcblx0ICogUmVzZXQgSW5wdXQgZWxlbWVudCB0byBzYXZlIHdob2xlIGlucHV0PWZpbGUgZWxlbWVudC5cblx0ICovXG5cdF9yZXNldElucHV0RWxlbWVudDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kaW5wdXQub2ZmKCk7XG5cdFx0dGhpcy5fY2xvbmUodGhpcy4kaW5wdXRbMF0pO1xuXHRcdHRoaXMuJGlucHV0ID0gJCh0aGlzLl9nZXRIdG1sKHRoaXMuX2lucHV0SFRNTCkpO1xuXHRcdGlmICh0aGlzLiRidXR0b24pIHtcblx0XHRcdHRoaXMuJGJ1dHRvbi5iZWZvcmUodGhpcy4kaW5wdXQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLiRlbC5hcHBlbmQodGhpcy4kaW5wdXQpO1xuXHRcdH1cblx0XHR0aGlzLl9hZGRJbnB1dEV2ZW50KCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIE1ha2VzIGVsZW1lbnQgdG8gYmUgdGFyZ2V0IG9mIHN1Ym1pdCBmb3JtIGVsZW1lbnQuXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfbWFrZVRhcmdldEZyYW1lOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLl8kdGFyZ2V0ID0gJCgnPGlmcmFtZSBuYW1lPVwiJyArIHRoaXMuX3RhcmdldCArICdcIj48L2lmcmFtZT4nKTtcblx0XHR0aGlzLl8kdGFyZ2V0LmNzcyh7XG5cdFx0XHR2aXNpYmlsaXR5OiAnaGlkZGVuJyxcblx0XHRcdHBvc2l0aW9uOiAnYWJzb2x1dGUnXG5cdFx0fSk7XG5cdFx0dGhpcy5fdXBsb2FkZXIuJGVsLmFwcGVuZCh0aGlzLl8kdGFyZ2V0KTtcblx0fSxcblxuXHQvKipcblx0ICogTWFrZSBlbGVtZW50IHRvIGJlIGNhbGxiYWNrIGZ1bmN0aW9uIG5hbWVcblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9tYWtlQ2FsbGJhY2tFbGVtZW50OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLl8kY2FsbGJhY2sgPSB0aGlzLl9tYWtlSGlkZGVuRWxlbWVudCh7XG5cdFx0XHQnbmFtZSc6IHN0YXRpY3MuQ09ORi5KU09OUENBTExCQUNLX05BTUUsXG5cdFx0XHQndmFsdWUnOiB0aGlzLl91cGxvYWRlci5jYWxsYmFja05hbWVcblx0XHR9KTtcblx0XHR0aGlzLiRlbC5hcHBlbmQodGhpcy5fJGNhbGxiYWNrKTtcblx0fSxcblxuXHQvKipcblx0ICogTWFrZXMgZWxlbWVudCB0byBrbm93IHdoaWNoIHR5cGUgcmVxdWVzdFxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X21ha2VSZXN1bHRUeXBlRWxlbWVudDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5fJHJlc1R5cGUgPSB0aGlzLl9tYWtlSGlkZGVuRWxlbWVudCh7XG5cdFx0XHQnbmFtZScgOiB0aGlzLl91cGxvYWRlci5yZXN1bHRUeXBlRWxlbWVudE5hbWUgfHwgc3RhdGljcy5DT05GLlJFU1BPTlNFX1RZUEUsXG5cdFx0XHQndmFsdWUnOiB0aGlzLl91cGxvYWRlci50eXBlXG5cdFx0fSk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKHRoaXMuXyRyZXNUeXBlKTtcblx0fSxcblxuXHQvKipcblx0ICogTWFrZSBlbGVtZW50IHRoYXQgaGFzIHJlZGlyZWN0IHBhZ2UgaW5mb3JtYXRpb24gdXNlZCBieSBTZXJ2ZXIgc2lkZS5cblx0ICogQHBhcmFtIHtvYmplY3R9IGhlbHBlciBSZWRpcmVjdGlvbiBpbmZvcm1hdGlvbiBmb3IgY2xlYXIgeC1kb21haW4gcHJvYmxlbS5cblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9tYWtlQnJpZGdlSW5mb0VsZW1lbnQ6IGZ1bmN0aW9uKGhlbHBlcikge1xuXHRcdHRoaXMuXyRoZWxwZXIgPSB0aGlzLl9tYWtlSGlkZGVuRWxlbWVudCh7XG5cdFx0XHQnbmFtZScgOiBoZWxwZXIubmFtZSB8fCBzdGF0aWNzLkNPTkYuUkVESVJFQ1RfVVJMLFxuXHRcdFx0J3ZhbHVlJzogaGVscGVyLnVybFxuXHRcdH0pO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCh0aGlzLl8kaGVscGVyKTtcblx0fSxcblxuXHQvKipcblx0ICogTWFrZSBoaWRkZW4gaW5wdXQgZWxlbWVudCB3aXRoIG9wdGlvbnNcblx0ICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgVGhlIG9waXRvbnMgdG8gYmUgYXR0cmlidXRlIG9mIGlucHV0XG5cdCAqIEByZXR1cm5zIHsqfGpRdWVyeX1cblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9tYWtlSGlkZGVuRWxlbWVudDogZnVuY3Rpb24ob3B0aW9ucykge1xuXHRcdG5lLnV0aWwuZXh0ZW5kKG9wdGlvbnMsIHtcblx0XHRcdHR5cGU6ICdoaWRkZW4nXG5cdFx0fSk7XG5cdFx0cmV0dXJuICQoJzxpbnB1dCAvPicpLmF0dHIob3B0aW9ucyk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEFzayB1cGxvYWRlciB0byBzYXZlIGlucHV0IGVsZW1lbnQgdG8gcG9vbFxuXHQgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBpbnB1dCBBIGlucHV0IGVsZW1lbnRbdHlwZT1maWxlXSBmb3Igc3RvcmUgcG9vbFxuXHQgKi9cblx0X2Nsb25lOiBmdW5jdGlvbihpbnB1dCkge1xuXHRcdGlucHV0LmZpbGVfbmFtZSA9IGlucHV0LnZhbHVlO1xuXHRcdHRoaXMuX3VwbG9hZGVyLnN0b3JlKGlucHV0KTtcblx0fVxuXG59KTtcblxubmUudXRpbC5DdXN0b21FdmVudHMubWl4aW4oSW5wdXQpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IElucHV0OyIsIi8qKlxuICogQGZpbGVvdmVydmlldyBJdGVtVmlldyBtYWtlIGVsZW1lbnQgdG8gZGlzcGxheSBhZGRlZCBmaWxlIGluZm9ybWF0aW9uLiBJdCBoYXMgYXR0YWNoZWQgZmlsZSBJRCB0byByZXF1ZXN0IGZvciByZW1vdmUuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGRsX2phdmFzY3JpcHRAbmhuZW50LmNvbT5cbiAqL1xuXG52YXIgc3RhdGljcyA9IHJlcXVpcmUoJy4uL3N0YXRpY3MnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cbi8qKlxuICogQ2xhc3Mgb2YgaXRlbSB0aGF0IGlzIG1lbWJlciBvZiBmaWxlIGxpc3QuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmFyIEl0ZW0gPSBuZS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgbmUuY29tcG9uZW50LlVwbG9hZGVyLkl0ZW0ucHJvdG90eXBlICoqLyB7XG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBpdGVtXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnNcbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMubmFtZSBGaWxlIG5hbWVcbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMudHlwZSBGaWxlIHR5cGVcbiAgICAgKiAgQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMucm9vdCBMaXN0IG9iamVjdFxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5oaWRkZW5GcmFtZSBUaGUgaWZyYW1lIG5hbWUgd2lsbCBiZSB0YXJnZXQgb2YgZm9ybSBzdWJtaXQuXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnVybCBUaGUgdXJsIGZvciBmb3JtIGFjdGlvbiB0byBzdWJtZXQuXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5pZF0gVW5pcXVlIGtleSwgd2hhdCBpZiB0aGUga2V5IGlzIG5vdCBleGlzdCBpZCB3aWxsIGJlIHRoZSBmaWxlIG5hbWUuXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5oaWRkZW5GaWVsZE5hbWVdIFRoZSBuYW1lIG9mIGhpZGRlbiBmaWxlZC4gVGhlIGhpZGRlbiBmaWVsZCBpcyBmb3IgY29ubmVjdGluZyB4LWRvbWlhbi5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmRlbGV0ZUJ1dHRvbkNsYXNzTmFtZT0ndXBsb2FkZXJfYnRuX2RlbGV0ZSddIFRoZSBjbGFzcyBuYW1lIGlzIGZvciBkZWxldGUgYnV0dG9uLlxuICAgICAqICBAcGFyYW0geyhzdHJpbmd8bnVtYmVyKX0gW29wdGlvbnMuc2l6ZV0gRmlsZSBzaXplIChidXQgaWUgbG93IGJyb3dzZXIsIHgtZG9tYWluKVxuICAgICAqICBAcGFyYW0ge29iamVjdH0gW29wdGlvbnMuaGVscGVyXSBUaGUgaGVscGVyIHBhZ2UgaW5mby5cbiAgICAgKi9cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG5cbiAgICAgICAgdGhpcy5fc2V0Um9vdChvcHRpb25zKTtcbiAgICAgICAgdGhpcy5fc2V0SXRlbUluZm8ob3B0aW9ucyk7XG4gICAgICAgIHRoaXMuX3NldENvbm5lY3RJbmZvKG9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMucmVuZGVyKG9wdGlvbnMudGVtcGxhdGUgfHwgc3RhdGljcy5IVE1MLml0ZW0pO1xuXG4gICAgICAgIGlmIChvcHRpb25zLmhlbHBlcikge1xuICAgICAgICAgICAgdGhpcy5fbWFrZUJyaWRnZUluZm9FbGVtZW50KG9wdGlvbnMuaGVscGVyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgcm9vdChMaXN0IG9iamVjdCkgaW5mb3JtYXRpb24uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgU2FtZSB3aXRoIGluaXQgb3B0aW9ucyBwYXJhbWV0ZXIuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0Um9vdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB0aGlzLl9yb290ID0gb3B0aW9ucy5yb290O1xuICAgICAgICB0aGlzLl8kcm9vdCA9IG9wdGlvbnMucm9vdC4kZWw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBmaWxlIGluZm9ybWF0aW9uLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFNhbWUgd2l0aCBpbml0IG9wdGlvbnMgcGFyYW1ldGVyLlxuICAgICAqL1xuICAgIF9zZXRJdGVtSW5mbzogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB0aGlzLm5hbWUgPSBvcHRpb25zLm5hbWU7XG4gICAgICAgIHRoaXMuX3R5cGUgPSBvcHRpb25zLnR5cGUgfHwgdGhpcy5fZXh0cmFjdEV4dGVuc2lvbigpO1xuICAgICAgICB0aGlzLl9pZCA9IG9wdGlvbnMuaWQgfHwgb3B0aW9ucy5uYW1lO1xuICAgICAgICB0aGlzLnNpemUgPSBvcHRpb25zLnNpemUgfHwgJyc7XG4gICAgICAgIHRoaXMuX2J0bkNsYXNzID0gb3B0aW9ucy5kZWxldGVCdXR0b25DbGFzc05hbWUgfHwgJ3VwbG9hZGVyX2J0bl9kZWxldGUnO1xuICAgICAgICB0aGlzLl91bml0ID0gb3B0aW9ucy51bml0IHx8ICdLQic7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBjb25uZWN0IGVsZW1lbnQgaW5mb3JtYXRpb24uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgU2FtZSB3aXRoIGluaXQgb3B0aW9ucyBwYXJhbWV0ZXIuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0Q29ubmVjdEluZm86IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fdXJsID0gb3B0aW9ucy51cmw7XG4gICAgICAgIHRoaXMuX2hpZGRlbklucHV0TmFtZSA9IG9wdGlvbnMuaGlkZGVuRmllbGROYW1lIHx8ICdmaWxlbmFtZSc7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbmRlciBtYWtpbmcgZm9ybSBwYWRkaW5nIHdpdGggZGVsZXRhYmxlIGl0ZW1cbiAgICAgKiBAcGFyYW0gdGVtcGxhdGVcbiAgICAgKi9cbiAgICByZW5kZXI6IGZ1bmN0aW9uKHRlbXBsYXRlKSB7XG4gICAgICAgIHZhciBodG1sID0gdGhpcy5fZ2V0SHRtbCh0ZW1wbGF0ZSk7XG4gICAgICAgIHRoaXMuXyRlbCA9ICQoaHRtbCk7XG4gICAgICAgIHRoaXMuXyRyb290LmFwcGVuZCh0aGlzLl8kZWwpO1xuICAgICAgICB0aGlzLl9hZGRFdmVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFeHRyYWN0IGZpbGUgZXh0ZW5zaW9uIGJ5IG5hbWVcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2V4dHJhY3RFeHRlbnNpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5uYW1lLnNwbGl0KCcuJykucG9wKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2UgZWxlbWVudCB0aGF0IGhhcyByZWRpcmVjdCBwYWdlIGluZm9ybWF0aW9uIHVzZWQgYnkgU2VydmVyIHNpZGUuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGhlbHBlciBSZWRpcmVjdGlvbiBoZWxwZXIgcGFnZSBpbmZvcm1hdGlvbiBmb3IgY2xlYXIgeC1kb21haW4gcHJvYmxlbS5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9tYWtlQnJpZGdlSW5mb0VsZW1lbnQ6IGZ1bmN0aW9uKGhlbHBlcikge1xuICAgICAgICB0aGlzLiRoZWxwZXIgPSAkKCc8aW5wdXQgLz4nKTtcbiAgICAgICAgdGhpcy4kaGVscGVyLmF0dHIoe1xuICAgICAgICAgICAgJ25hbWUnIDogaGVscGVyLm5hbWUsXG4gICAgICAgICAgICAndmFsdWUnOiBoZWxwZXIudXJsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgaXRlbSBlbGVtZW4gSFRNTFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBodG1sIEhUTUwgdGVtcGxhdGVcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldEh0bWw6IGZ1bmN0aW9uKGh0bWwpIHtcbiAgICAgICAgdmFyIG1hcCA9IHtcbiAgICAgICAgICAgIGZpbGV0eXBlOiB0aGlzLl90eXBlLFxuICAgICAgICAgICAgZmlsZW5hbWU6IHRoaXMubmFtZSxcbiAgICAgICAgICAgIGZpbGVzaXplOiB0aGlzLnNpemUgPyB1dGlscy5nZXRGaWxlU2l6ZVdpdGhVbml0KHRoaXMuc2l6ZSkgOiAnJyxcbiAgICAgICAgICAgIGRlbGV0ZUJ1dHRvbkNsYXNzTmFtZTogdGhpcy5fYnRuQ2xhc3NcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdXRpbHMudGVtcGxhdGUobWFwLCBodG1sKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGVzdG9yeSBpdGVtXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3JlbW92ZUV2ZW50KCk7XG4gICAgICAgIHRoaXMuXyRlbC5yZW1vdmUoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IGhhbmRsZXIgb24gZGVsZXRlIGJ1dHRvbi5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBxdWVyeSA9ICcuJyArIHRoaXMuX2J0bkNsYXNzLFxuICAgICAgICAgICAgJGRlbEJ0biA9IHRoaXMuXyRlbC5maW5kKHF1ZXJ5KTtcbiAgICAgICAgJGRlbEJ0bi5vbignY2xpY2snLCBuZS51dGlsLmJpbmQodGhpcy5fb25DbGlja0V2ZW50LCB0aGlzKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBldmVudCBoYW5kbGVyIGZyb20gZGVsZXRlIGJ1dHRvbi5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW1vdmVFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBxdWVyeSA9ICcuJyArIHRoaXMuX2J0bkNsYXNzLFxuICAgICAgICAgICAgJGRlbEJ0biA9IHRoaXMuXyRlbC5maW5kKHF1ZXJ5KTtcbiAgICAgICAgJGRlbEJ0bi5vZmYoJ2NsaWNrJyk7XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICogRXZlbnQtaGFuZGxlIGZvciBkZWxldGUgYnV0dG9uIGNsaWNrZWQuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25DbGlja0V2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5maXJlKCdyZW1vdmUnLCB7XG4gICAgICAgICAgICBmaWxlbmFtZSA6IHRoaXMubmFtZSxcbiAgICAgICAgICAgIGlkIDogdGhpcy5faWQsXG4gICAgICAgICAgICB0eXBlOiAncmVtb3ZlJ1xuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxubmUudXRpbC5DdXN0b21FdmVudHMubWl4aW4oSXRlbSk7XG5cbm1vZHVsZS5leHBvcnRzID0gSXRlbTsiLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmlsZUxpc3RWaWV3IG1hbmFnZSBhbmQgZGlzcGxheSBmaWxlcyBzdGF0ZShsaWtlIHNpemUsIGNvdW50KSBhbmQgbGlzdC5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZGxfamF2YXNjcmlwdEBuaG5lbnQuY29tPlxuICovXG5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG52YXIgSXRlbSA9IHJlcXVpcmUoJy4vaXRlbScpO1xuXG4vKipcbiAqIExpc3QgaGFzIGl0ZW1zLiBJdCBjYW4gYWRkIGFuZCByZW1vdmUgaXRlbSwgYW5kIGdldCB0b3RhbCB1c2FnZS5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG52YXIgTGlzdCA9IG5lLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBuZS5jb21wb25lbnQuVXBsb2FkZXIuTGlzdC5wcm90b3R5cGUgKi97XG4gICAgaW5pdCA6IGZ1bmN0aW9uKG9wdGlvbnMsIHVwbG9hZGVyKSB7XG4gICAgICAgIHZhciBsaXN0SW5mbyA9IG9wdGlvbnMubGlzdEluZm87XG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTtcbiAgICAgICAgdGhpcy4kZWwgPSBsaXN0SW5mby5saXN0O1xuICAgICAgICB0aGlzLiRjb3VudGVyID0gbGlzdEluZm8uY291bnQ7XG4gICAgICAgIHRoaXMuJHNpemUgPSBsaXN0SW5mby5zaXplO1xuICAgICAgICB0aGlzLl91cGxvYWRlciA9IHVwbG9hZGVyO1xuXG4gICAgICAgIG5lLnV0aWwuZXh0ZW5kKHRoaXMsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgaXRlbSBsaXN0XG4gICAgICogQHBhcmFtIHtvYmplY3R9IGluZm8gQSBpbmZvcm1hdGlvbiB0byB1cGRhdGUgbGlzdC5cbiAgICAgKiAgQHBhcmFtIHthcnJheX0gaW5mby5pdGVtcyBUaGUgbGlzdCBvZiBmaWxlIGluZm9ybWF0aW9uLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gW2luZm8uYWN0aW9uXSBUaGUgYWN0aW9uIHRvIGRvLlxuICAgICAqL1xuICAgIHVwZGF0ZTogZnVuY3Rpb24oaW5mbykge1xuICAgICAgICBpZiAoaW5mby5hY3Rpb24gPT09ICdyZW1vdmUnKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVGaWxlSXRlbShpbmZvLm5hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fYWRkRmlsZUl0ZW1zKGluZm8uaXRlbXMpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBpdGVtcyB0b3RhbCBjb3VudCwgdG90YWwgc2l6ZSBpbmZvcm1hdGlvbi5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gaW5mbyBBIGluZm9ybWF0aW9uIHRvIHVwZGF0ZSBsaXN0LlxuICAgICAqICBAcGFyYW0ge2FycmF5fSBpbmZvLml0ZW1zIFRoZSBsaXN0IG9mIGZpbGUgaW5mb3JtYXRpb24uXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBpbmZvLnNpemUgVGhlIHRvdGFsIHNpemUuXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBpbmZvLmNvdW50IFRoZSBjb3VudCBvZiBmaWxlcy5cbiAgICAgKi9cbiAgICB1cGRhdGVUb3RhbEluZm86IGZ1bmN0aW9uKGluZm8pIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlVG90YWxDb3VudChpbmZvLmNvdW50KTtcbiAgICAgICAgaWYgKHV0aWxzLmlzU3VwcG9ydEZvcm1EYXRhKCkpIHtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVRvdGFsVXNhZ2UoaW5mby5zaXplKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgaXRlbXMgdG90YWwgY291bnQgYW5kIHJlZnJlc2ggZWxlbWVudFxuICAgICAqIEBwYXJhbSB7KG51bWJlcnxzdHJpbmcpfSBbY291bnRdIFRvdGFsIGZpbGUgY291bnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF91cGRhdGVUb3RhbENvdW50OiBmdW5jdGlvbihjb3VudCkge1xuXG4gICAgICAgIGlmICghbmUudXRpbC5pc0V4aXN0eShjb3VudCkpIHtcbiAgICAgICAgICAgIGNvdW50ID0gdGhpcy5pdGVtcy5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiRjb3VudGVyLmh0bWwoY291bnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgaXRlbXMgdG90YWwgc2l6ZSBhbmQgcmVmcmVzaCBlbGVtZW50XG4gICAgICogQHBhcmFtIHsobnVtYmVyfHN0cmluZyl9IHNpemUgVG90YWwgZmlsZXMgc2l6ZXNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF91cGRhdGVUb3RhbFVzYWdlOiBmdW5jdGlvbihzaXplKSB7XG5cbiAgICAgICAgaWYgKCFuZS51dGlsLmlzRXhpc3R5KHNpemUpKSB7XG4gICAgICAgICAgICBzaXplID0gdGhpcy5fZ2V0U3VtQWxsSXRlbVVzYWdlKCk7XG4gICAgICAgIH1cbiAgICAgICAgc2l6ZSA9IHV0aWxzLmdldEZpbGVTaXplV2l0aFVuaXQoc2l6ZSk7XG4gICAgICAgIHRoaXMuJHNpemUuaHRtbChzaXplKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3VtIHNpemVzIG9mIGFsbCBpdGVtcy5cbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRTdW1BbGxJdGVtVXNhZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaXRlbXMgPSB0aGlzLml0ZW1zLFxuICAgICAgICAgICAgdG90YWxVc2FnZSA9IDA7XG5cbiAgICAgICAgbmUudXRpbC5mb3JFYWNoKGl0ZW1zLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICB0b3RhbFVzYWdlICs9IHBhcnNlRmxvYXQoaXRlbS5zaXplKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRvdGFsVXNhZ2U7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBmaWxlIGl0ZW1zXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHRhcmdldCBUYXJnZXQgaXRlbSBpbmZvbWF0aW9ucy5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRGaWxlSXRlbXM6IGZ1bmN0aW9uKHRhcmdldCkge1xuICAgICAgICBpZiAoIW5lLnV0aWwuaXNBcnJheSh0YXJnZXQpKSB7XG4gICAgICAgICAgICB0YXJnZXQgPSBbdGFyZ2V0XTtcbiAgICAgICAgfVxuICAgICAgICBuZS51dGlsLmZvckVhY2godGFyZ2V0LCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2godGhpcy5fY3JlYXRlSXRlbShkYXRhKSk7XG4gICAgICAgIH0sIHRoaXMpO1xuXHRcdHRoaXMuX3VwbG9hZGVyLmZpcmUoJ2ZpbGVBZGRlZCcsIHtcblx0XHRcdHRhcmdldDogdGFyZ2V0XG5cdFx0fSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBmaWxlIGl0ZW1cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgZmlsZSBuYW1lIHRvIHJlbW92ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbW92ZUZpbGVJdGVtOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIG5hbWUgPSBkZWNvZGVVUklDb21wb25lbnQobmFtZSk7XG4gICAgICAgIHRoaXMuaXRlbXMgPSBuZS51dGlsLmZpbHRlcih0aGlzLml0ZW1zLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICB2YXIgaXNNYXRjaCA9IG5hbWUgPT09IGRlY29kZVVSSUNvbXBvbmVudChpdGVtLm5hbWUpO1xuICAgICAgICAgICAgaWYgKGlzTWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBpdGVtLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICB0aGlzLl91cGxvYWRlci5yZW1vdmUobmFtZSk7XG5cdFx0XHRcdFx0dGhpcy5fdXBsb2FkZXIuZmlyZSgnZmlsZVJlbW92ZWQnLCB7XG5cdFx0XHRcdFx0XHRuYW1lOiBuYW1lXG5cdFx0XHRcdFx0fSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gIWlzTWF0Y2g7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgaXRlbSBCeSBEYXRhXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGFcbiAgICAgKiBAcmV0dXJucyB7SXRlbX1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jcmVhdGVJdGVtOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBpdGVtID0gbmV3IEl0ZW0oe1xuICAgICAgICAgICAgcm9vdDogdGhpcyxcbiAgICAgICAgICAgIG5hbWU6IGRhdGEubmFtZSxcbiAgICAgICAgICAgIHNpemU6IGRhdGEuc2l6ZSxcbiAgICAgICAgICAgIGRlbGV0ZUJ1dHRvbkNsYXNzTmFtZTogdGhpcy5kZWxldGVCdXR0b25DbGFzc05hbWUsXG4gICAgICAgICAgICB1cmw6IHRoaXMudXJsLFxuICAgICAgICAgICAgaGlkZGVuRnJhbWU6IHRoaXMuZm9ybVRhcmdldCxcbiAgICAgICAgICAgIGhpZGRlbkZpZWxkTmFtZTogdGhpcy5oaWRkZW5GaWVsZE5hbWUsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogdGhpcy50ZW1wbGF0ZSAmJiB0aGlzLnRlbXBsYXRlLml0ZW1cbiAgICAgICAgfSk7XG4gICAgICAgIGl0ZW0ub24oJ3JlbW92ZScsIHRoaXMuX3JlbW92ZUZpbGUsIHRoaXMpO1xuICAgICAgICByZXR1cm4gaXRlbTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgUmVtb3ZlIEZpbGVcbiAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbW92ZUZpbGU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdGhpcy5maXJlKCdyZW1vdmUnLCBkYXRhKTtcbiAgICB9XG59KTtcblxubmUudXRpbC5DdXN0b21FdmVudHMubWl4aW4oTGlzdCk7XG5cbm1vZHVsZS5leHBvcnRzID0gTGlzdDsiLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgVGhpcyBpcyBtYW5hZ2VyIG9mIGlucHV0IGVsZW1lbnRzIHRoYXQgYWN0IGxpa2UgZmlsZSBwb29sLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxkbF9qYXZhc2NyaXB0QG5obmVudC5jb20+XG4gKi9cblxuLyoqXG4gKiBUaGUgcG9vbCBmb3Igc2F2ZSBmaWxlcy5cbiAqIEl0J3Mgb25seSBmb3IgaW5wdXRbZmlsZV0gZWxlbWVudCBzYXZlIGF0IGJyb3dzZXIgdGhhdCBkb2VzIG5vdCBzdXBwb3J0IGZpbGUgYXBpLlxuICogQHR5cGUgeyp9XG4gKi9cbnZhciBQb29sID0gbmUudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIG5lLmNvbXBvbmVudC5VcGxvYWRlci5Qb29sLnByb3RvdHlwZSAqL3tcbiAgICAvKipcbiAgICAgKiBpbml0aWFsaXplXG4gICAgICovXG4gICAgaW5pdDogZnVuY3Rpb24ocGxhbmV0KSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTdWJtaXR0ZXIgZm9yIGZpbGUgZWxlbWVudCB0byBzZXJ2ZXJcbiAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wbGFuZXQgPSBwbGFuZXQ7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGaWxlIGRhdGEgc3RydWN0dXJlIG9iamVjdChrZXk9bmFtZSA6IHZhbHVlPWl1cHV0IGVsbWVlbnQpO1xuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5maWxlcyA9IHt9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQWN0cyBwb29sIHRvIHNhdmUgaW5wdXQgZWxlbWVudFxuICAgICAgICAgKiBAdHlwZSB7RG9jdW1lbnRGcmFnbWVudH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2F2ZSBhIGlucHV0IGVsZW1lbnRbdHlwZT1maWxlXSwgYXMgdmFsdWUgb2YgZmlsZSBuYW1lLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBmaWxlIEEgaW5wdXQgZWxlbWVudCB0aGF0IGhhdmUgdG8gYmUgc2F2ZWRcbiAgICAgKi9cbiAgICBzdG9yZTogZnVuY3Rpb24oZmlsZSkge1xuICAgICAgICB0aGlzLmZpbGVzW2ZpbGUuZmlsZV9uYW1lXSA9IGZpbGU7XG4gICAgICAgIHRoaXMuZnJhZy5hcHBlbmRDaGlsZChmaWxlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgaW5wdXQgZWxlbWVudFt0eXBlPWZpbGVdIGZyb20gcG9vbC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBBIGZpbGUgbmFtZSB0aGF0IGhhdmUgdG8gYmUgcmVtb3ZlZC5cbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgdGhpcy5mcmFnLnJlbW92ZUNoaWxkKHRoaXMuZmlsZXNbbmFtZV0pO1xuICAgICAgICBkZWxldGUgdGhpcy5maWxlc1tuYW1lXTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRW1wdHkgcG9vbFxuICAgICAqL1xuICAgIGVtcHR5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgbmUudXRpbC5mb3JFYWNoKHRoaXMuZmlsZXMsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKGRhdGEuZmlsZV9uYW1lKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFBsYW50IGZpbGVzIG9uIHBvb2wgdG8gZm9ybSBpbnB1dFxuICAgICAqL1xuICAgIHBsYW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHBsYW5ldCA9IHRoaXMucGxhbmV0O1xuICAgICAgICBuZS51dGlsLmZvckVhY2godGhpcy5maWxlcywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgcGxhbmV0LmFwcGVuZENoaWxkKGRhdGEpO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuZmlsZXNbZGF0YS5maWxlX25hbWVdO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQb29sOyJdfQ==
