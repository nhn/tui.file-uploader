(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
ne.util.defineNamespace('ne.component.Uploader', require('./src/js/uploader.js'));


},{"./src/js/uploader.js":7}],2:[function(require,module,exports){
/**
 * @fileoverview This Connector make connection between FileManager and file server api at modern browser.<br>
 *     This Connector use ajax.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <e0242@nhnent.com>
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
    addRequest: function(config) {
        var $form = this._uploader.inputView.$el,
            callback = ne.util.bind(this.successPadding, this, config.success);
        this.formData = new FormData($form[0]);
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
 * @author NHN Ent. FE Development Team <e0242@nhnent.com>
 */

var Ajax = require('./ajax.js');
var Jsonp = require('./jsonp.js');
var Local = require('./local.js');

/**
 * The connector class could connect with server and return server response to callback.
 * @constructor
 */
//var Connector = ne.util.defineClass(/** @lends ne.component.Uploader.Connector.prototype */{
//    init: function(uploader) {
//        var type = uploader.type.toLowerCase();
//
//        /**
//         * The uploader core
//         * @type ne.component.Uploader
//         */
//        this._uploader = uploader;
//        /**
//         * The connector module set
//         * @type {object}
//         */
//        this.conn = ModuleSets[type] || Local;
//    },
//
//    /**
//     * Send request
//     * @param {object} options
//     *  @param {string} options.type Type of request
//     */
//    send: function(options) {
//        if (options.type === 'remove') {
//            this.conn.removeRequest(options);
//        } else {
//            this.conn.addRequest(options);
//        }
//    },
//
//    /**
//     * Mixin with selected connector
//     * @param {object} connector
//     */
//    mixin: function(connector) {
//        ne.util.extend(this, connector);
//    }
//});

var ModuleSets = {
    'ajax': Ajax,
    'jsonp': Jsonp,
    'local': Local
};

var connFactory = {
    getConnector: function(uploader) {

        var type = uploader.type.toLowerCase();
        var conn = ne.util.extend({
            _uplodaer: uploader,
            send: function(options) {
                if (options.type === 'remove') {
                    this.removeRequest(options);
                } else {
                    this.addRequest(options);
                }
            }
        }, ModuleSets[type] || Local);

        return conn;
    }
};

module.exports = connFactory;

},{"./ajax.js":2,"./jsonp.js":4,"./local.js":5}],4:[function(require,module,exports){
/**
 * @fileoverview This Connector make connection between FileManager and file server api at old browser.<br>
 *     This Connector use hidden iframe.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <e0242@nhnent.com>
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
 * @author NHN Ent. FE Development Team <e0242@nhnent.com>
 */
var statics = require('../statics.js');

/**
 * The modules will be mixed in connector by type.
 */
var Local = {/** @lends ne.component.Uploader.Local */
    /**
     * Add Request, save files to array.
     * @param data
     */
    addRequest: function(data) {
        this._saveFile(statics.isSupportFormData());
        data.success({
            items: this._result,
            isReset: true
        });
    },

    /**
     * Save file to pool
     * @param {boolean} isSupportAjax Whether FormData is supported or not
     * @private
     */
    _saveFile: function(isSupportAjax) {
        var uploader = this._uploader,
            inputView = uploader.inputView,
            fileEl = inputView.$input[0],
            result = [];

        if (isSupportAjax) {
            ne.util.forEach(fileEl.files, function(item) {
                result.push(item);
            }, this);
        } else {
            result.push({
                name: fileEl.value,
                element: fileEl
            });
        }

        this._result = result;
    },

    /**
     * Make form data to send POST(FormDate supported case)
     * @returns {*}
     * @private
     */
    _makeFormData : function() {
        var uploader = this._uploader,
            form = new window.FormData(uploader.inputView.$el[0]);
        ne.util.forEach(this._result, function(item) {
            form.append(uploader.fileField, item);
        });
        return form;
    },

    removeRequest: function(data) {
        console.log('remove', data);
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
},{"../statics.js":6}],6:[function(require,module,exports){
/**
 * @fileoverview Configuration or default values.
 * @author NHN Ent. FE Development Team <e0242@nhnent.com>
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
    FILE_FILED_NAME: 'userfile[]'
};

/**
 * Default Htmls
 * @type {{input: string, item: string}}
 */
module.exports.HTML = {
    input : ['<form enctype="multipart/form-data" id="formData" method="post">',
                '<input type="hidden" name="MAX_FILE_SIZE" value="3000000" />',
                '<input type="file" id="fileAttach" name="{{fileField}}" multiple="true" />',
                '<button class="batchSubmit" type="submit">SEND</button>',
            '</form>'].join(''),
    item : ['<li class="filetypeDisplayClass">',
                '<spna class="fileicon {{filetype}}">{{filetype}}</spna>',
                '<span class="file_name">{{filename}}</span>',
                '<span class="file_size">{{filesize}}</span>',
                '<button type="button" class="{{deleteButtonClassName}}">Delete</button>',
            '</li>'].join('')
};

/**
 * Extract unit for file size
 * @param {number} size A usage of file
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
 * @private
 */
module.exports.template = function(map, html) {
    html = html.replace(/\{\{([^\}]+)\}\}/g, function(mstr, name) {
        return map[name];
    });
    return html;
};
},{}],7:[function(require,module,exports){
/**
 * @fileoverview FileUploader is core of file uploader component.<br>FileManager manage connector to connect server and update FileListView.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <e0242@nhnent.com>
 */

var static = require('./statics.js');
var conn = require('./connector/connector.js');
var Input = require('./view/input.js');
var List = require('./view/list.js');

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
     * @param {JqueryObject} $el Root Element of Uploader
     */
    init: function(options, $el) {
        this._setData(options);
        this._setConnector();

        this.$el = $el;
        this.inputView = new Input(options, this);
        this.listView = new List(options, this);
        this.fileField = this.fileField || static.CONF.FILE_FILED_NAME;

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
                alert(static.CONF.ERROR.NOT_SURPPORT);
            }
        } else {
            if (this.useJsonp || !static.isSupportFormData()) {
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
            message = static.CONF.ERROR.DEFAULT;
        }
        alert(message);
    },

    /**
     * Callback for custom send event
     */
    sendFile: function() {
        var callback = ne.util.bind(this.notify, this);
        this._connector.send({
            type: 'add',
            success: callback,
            error: this.errorCallback
        });
    },

    /**
     * Callback for custom remove event
     * @param {object} data The data for remove file.
     */
    removeFile: function(data) {
        var callback = ne.util.bind(this.notify, this);
        this._connector.send({
            type: 'remove',
            data: data,
            success: callback
        });
    },

    submit: function() {
        this._connector.submit(function() {
            console.log('uploader caomplete');
        });
    },
    /**
     * Callback for custom remove event
     * Remove input file's clone
      * @param data
     */
    removeElement: function(data) {

    },

    /**
     * Get file info locally
     * @param {HtmlElement} element Input element
     * @private
     */
    _getFileInfo: function(element) {
        var files;
        if (this._isSupportFileSystem()) {
            files = this._getFileList(element.files);
        } else {
            files = {
                name: element.value,
                id: element.value
            }
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
            console.log(file);
            return {
                name: file.name,
                size: file.size,
                id: file.name
            };
        });
    },

    /**
     * Check whether support file api or not
     * @returns {boolean}
     * @private
     */
    _isSupportFileSystem: function() {
        return !!(window.File && window.FileReader && window.FileList && window.Blob);
    },


    /**
     * Add event to listview and inputview
     * @private
     */
    _addEvent: function() {
        if (this.isBatchTransfer) {
            this.inputView.on('save', this.sendFile, this);
            this.listView.on('remove', this.removeFile, this);
        } else {
            this.inputView.on('change', this.sendFile, this);
            this.listView.on('remove', this.removeFile, this);
        }
    }

});

ne.util.CustomEvents.mixin(Uploader);
module.exports = Uploader;
},{"./connector/connector.js":3,"./statics.js":6,"./view/input.js":8,"./view/list.js":10}],8:[function(require,module,exports){
/**
 * @fileoverview InputView make input form by template. Add event file upload event.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <e0242@nhnent.com>
 */

var static = require('../statics.js');

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
        this.html = (options.template && options.template.input) || static.HTML.input;

        this._render();
        this._renderHiddenElements();

        if (options.helper) {
            this._makeBridgeInfoElement(options.helper);
        }

        this.$input = this.$el.find('input:file');
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
            fileField: this._uploader.fileField
        };
        return static.template(map, html);
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
     * Add change event and custom Event
     * @private
     */
    _addEvent: function() {
        var submit = this.$el.find('button:submit'),
            self = this;
        if (this._isBatchTransfer) {
            this.$input.on('change', ne.util.bind(this.onSave, this));
            this.$el.on('submit', function() {
                self._uploader.submit();
                return false;
            });
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
        this.fire('save', {
            element: this.$input[0],
            callback: ne.util.bind(this._changeElement, this)
        });
    },

    /**
     * Change element for save file data
     * @param {object} data
     */
    _changeElement: function(data) {
        this._clone(data);
        this._addEvent();
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
            'name': static.CONF.JSONPCALLBACK_NAME,
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
            'name' : this._uploader.resultTypeElementName || static.CONF.RESPONSE_TYPE,
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
            'name' : helper.name || static.CONF.REDIRECT_URL,
            'value': helper.url
        });
        this.$el.append(this._$helper);
    },

    /**
     * Make Hidden input element with options
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
     * Clone Input element to send by form submit
     * @param {object} info A information of clone element
     */
    _clone: function(info) {
        this.$input.off();
        // todo clone
    }
});


ne.util.CustomEvents.mixin(Input);

module.exports = Input;
},{"../statics.js":6}],9:[function(require,module,exports){
/**
 * @fileoverview ItemView make element to display added file information. It has attached file ID to request for remove.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <e0242@nhnent.com>
 */

var static = require('../statics.js');

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

        this.render(options.template || static.HTML.item);

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
            filesize: static.getFileSizeWithUnit(this.size),
            deleteButtonClassName: this._btnClass
        };

        return static.template(map, html);
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
},{"../statics.js":6}],10:[function(require,module,exports){
/**
 * @fileoverview FileListView manage and display files state(like size, count) and list.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <e0242@nhnent.com>
 */

var static = require('../statics.js');
var Item = require('./item.js');

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
            this.items = ne.util.filter(this.items, function(item) {
                if (decodeURIComponent(info.name) === decodeURIComponent(item.name)) {
                    item.destroy();
                    return false;
                } else {
                    return true;
                }
            });
        } else {
            this._addFiles(info.items);
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
        size = static.getFileSizeWithUnit(size);
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
    _addFiles: function(target) {
        if (!ne.util.isArray(target)) {
            target = [target];
        }
        ne.util.forEach(target, function(data) {
            this.items.push(this._createItem(data));
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
},{"../statics.js":6,"./item.js":9}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25uZWN0b3IvYWpheC5qcyIsInNyYy9qcy9jb25uZWN0b3IvY29ubmVjdG9yLmpzIiwic3JjL2pzL2Nvbm5lY3Rvci9qc29ucC5qcyIsInNyYy9qcy9jb25uZWN0b3IvbG9jYWwuanMiLCJzcmMvanMvc3RhdGljcy5qcyIsInNyYy9qcy91cGxvYWRlci5qcyIsInNyYy9qcy92aWV3L2lucHV0LmpzIiwic3JjL2pzL3ZpZXcvaXRlbS5qcyIsInNyYy9qcy92aWV3L2xpc3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDek9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm5lLnV0aWwuZGVmaW5lTmFtZXNwYWNlKCduZS5jb21wb25lbnQuVXBsb2FkZXInLCByZXF1aXJlKCcuL3NyYy9qcy91cGxvYWRlci5qcycpKTtcblxuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgQ29ubmVjdG9yIG1ha2UgY29ubmVjdGlvbiBiZXR3ZWVuIEZpbGVNYW5hZ2VyIGFuZCBmaWxlIHNlcnZlciBhcGkgYXQgbW9kZXJuIGJyb3dzZXIuPGJyPlxuICogICAgIFRoaXMgQ29ubmVjdG9yIHVzZSBhamF4LlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxlMDI0MkBuaG5lbnQuY29tPlxuICovXG5cbi8qKlxuICogVGhlIG1vZHVsZXMgd2lsbCBiZSBtaXhlZCBpbiBjb25uZWN0b3IgYnkgdHlwZS5cbiAqL1xudmFyIEFqYXggPSB7LyoqIEBsZW5kcyBuZS5jb21wb25lbnQuVXBsb2FkZXIuQWpheCAqL1xuICAgIHR5cGU6ICdQT1NUJyxcbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGFqYXggYnkgY29uZmlnIHRvIGFkZCBmaWxlcy5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gY29uZmlnIFRoZSBjb25maWd1cmF0aW9uIGZvciBhamF4IHJlcXVlc3RcbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy51cmwgUmVxdWVzdCB1cmwodXBsb2FkIHVybCBvciByZW1vdmUgdXJsKVxuICAgICAqICBAcGFyYW0ge2Z1bmN0aW9ufSBjb25maWcuc3VjY2VzcyBDYWxsYmFjayBmdW5jdGlvbiB3aGVuIHJlcXVlc3Qgc3VjZWVzcy5cbiAgICAgKiAgQHBhcmFtIHtmdW5jdGlvbn0gY29uZmlnLmVycm9yIENhbGxiYWNrIGZ1bmN0aW9uIHdoZW4gcmVxdWVzdCBmYWlsZC5cbiAgICAgKi9cbiAgICBhZGRSZXF1ZXN0OiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgdmFyICRmb3JtID0gdGhpcy5fdXBsb2FkZXIuaW5wdXRWaWV3LiRlbCxcbiAgICAgICAgICAgIGNhbGxiYWNrID0gbmUudXRpbC5iaW5kKHRoaXMuc3VjY2Vzc1BhZGRpbmcsIHRoaXMsIGNvbmZpZy5zdWNjZXNzKTtcbiAgICAgICAgdGhpcy5mb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgkZm9ybVswXSk7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHRoaXMuX3VwbG9hZGVyLnVybC5zZW5kLFxuICAgICAgICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgICAgICAgZGF0YTogdGhpcy5mb3JtRGF0YSxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGNhbGxiYWNrLFxuICAgICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6IGNvbmZpZy5lcnJvclxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJlcHJvY2Vzc2luZyBjYWxsYmFjayBiZWZvcmUgY2FsbGJhY2sgcnVuLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFJlcXVlc3QgQ2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgUmVzcG9uc2UgZnJvbSBzZXJ2ZXJcbiAgICAgKi9cbiAgICBzdWNjZXNzUGFkZGluZzogZnVuY3Rpb24oY2FsbGJhY2ssIHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciBqc29uID0gSlNPTi5wYXJzZShyZXNwb25zZSksXG4gICAgICAgICAgICByZXN1bHQgPSB7fTtcblxuICAgICAgICByZXN1bHQuaXRlbXMgPSBqc29uLmZpbGVsaXN0O1xuICAgICAgICBjYWxsYmFjayhyZXN1bHQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGFqYXggYnkgY29uZmlnIHRvIHJlbW92ZSBmaWxlLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWdcbiAgICAgKi9cbiAgICByZW1vdmVSZXF1ZXN0OiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gbmUudXRpbC5iaW5kKHRoaXMucmVtb3ZlUGFkZGluZywgdGhpcywgY29uZmlnLnN1Y2Nlc3MpO1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiB0aGlzLl91cGxvYWRlci51cmwucmVtb3ZlLFxuICAgICAgICAgICAgZGF0YTogY29uZmlnLmRhdGEsXG4gICAgICAgICAgICBzdWNjZXNzOiBjYWxsYmFjayxcbiAgICAgICAgICAgIGVycm9yOiBjb25maWcuZXJyb3JcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByZXByb2Nlc3NpbmcgcmVzcG9uc2UgYmVmb3JlIGNhbGxiYWNrIHJ1bi5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBSZXF1ZXN0IENhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIFJlc3BvbnNlIGZyb20gc2VydmVyXG4gICAgICovXG4gICAgcmVtb3ZlUGFkZGluZzogZnVuY3Rpb24oY2FsbGJhY2ssIHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciBqc29uID0gSlNPTi5wYXJzZShyZXNwb25zZSksXG4gICAgICAgICAgICByZXN1bHQgPSB7fTtcblxuICAgICAgICByZXN1bHQuYWN0aW9uID0gJ3JlbW92ZSc7XG4gICAgICAgIHJlc3VsdC5uYW1lID0gZGVjb2RlVVJJQ29tcG9uZW50KGpzb24ubmFtZSk7XG5cbiAgICAgICAgY2FsbGJhY2socmVzdWx0KTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFqYXg7IiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEEgQ29ubmVjdG9yIG1ha2UgY29ubmVjdGlvbiBiZXR3ZWVuIEZpbGVNYW5hZ2VyIGFuZCBmaWxlIHNlcnZlciBBUEkuPGJyPiBUaGUgQ29ubmVjdG9yIGlzIGludGVyZmFjZS5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZTAyNDJAbmhuZW50LmNvbT5cbiAqL1xuXG52YXIgQWpheCA9IHJlcXVpcmUoJy4vYWpheC5qcycpO1xudmFyIEpzb25wID0gcmVxdWlyZSgnLi9qc29ucC5qcycpO1xudmFyIExvY2FsID0gcmVxdWlyZSgnLi9sb2NhbC5qcycpO1xuXG4vKipcbiAqIFRoZSBjb25uZWN0b3IgY2xhc3MgY291bGQgY29ubmVjdCB3aXRoIHNlcnZlciBhbmQgcmV0dXJuIHNlcnZlciByZXNwb25zZSB0byBjYWxsYmFjay5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG4vL3ZhciBDb25uZWN0b3IgPSBuZS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgbmUuY29tcG9uZW50LlVwbG9hZGVyLkNvbm5lY3Rvci5wcm90b3R5cGUgKi97XG4vLyAgICBpbml0OiBmdW5jdGlvbih1cGxvYWRlcikge1xuLy8gICAgICAgIHZhciB0eXBlID0gdXBsb2FkZXIudHlwZS50b0xvd2VyQ2FzZSgpO1xuLy9cbi8vICAgICAgICAvKipcbi8vICAgICAgICAgKiBUaGUgdXBsb2FkZXIgY29yZVxuLy8gICAgICAgICAqIEB0eXBlIG5lLmNvbXBvbmVudC5VcGxvYWRlclxuLy8gICAgICAgICAqL1xuLy8gICAgICAgIHRoaXMuX3VwbG9hZGVyID0gdXBsb2FkZXI7XG4vLyAgICAgICAgLyoqXG4vLyAgICAgICAgICogVGhlIGNvbm5lY3RvciBtb2R1bGUgc2V0XG4vLyAgICAgICAgICogQHR5cGUge29iamVjdH1cbi8vICAgICAgICAgKi9cbi8vICAgICAgICB0aGlzLmNvbm4gPSBNb2R1bGVTZXRzW3R5cGVdIHx8IExvY2FsO1xuLy8gICAgfSxcbi8vXG4vLyAgICAvKipcbi8vICAgICAqIFNlbmQgcmVxdWVzdFxuLy8gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnNcbi8vICAgICAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy50eXBlIFR5cGUgb2YgcmVxdWVzdFxuLy8gICAgICovXG4vLyAgICBzZW5kOiBmdW5jdGlvbihvcHRpb25zKSB7XG4vLyAgICAgICAgaWYgKG9wdGlvbnMudHlwZSA9PT0gJ3JlbW92ZScpIHtcbi8vICAgICAgICAgICAgdGhpcy5jb25uLnJlbW92ZVJlcXVlc3Qob3B0aW9ucyk7XG4vLyAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICAgdGhpcy5jb25uLmFkZFJlcXVlc3Qob3B0aW9ucyk7XG4vLyAgICAgICAgfVxuLy8gICAgfSxcbi8vXG4vLyAgICAvKipcbi8vICAgICAqIE1peGluIHdpdGggc2VsZWN0ZWQgY29ubmVjdG9yXG4vLyAgICAgKiBAcGFyYW0ge29iamVjdH0gY29ubmVjdG9yXG4vLyAgICAgKi9cbi8vICAgIG1peGluOiBmdW5jdGlvbihjb25uZWN0b3IpIHtcbi8vICAgICAgICBuZS51dGlsLmV4dGVuZCh0aGlzLCBjb25uZWN0b3IpO1xuLy8gICAgfVxuLy99KTtcblxudmFyIE1vZHVsZVNldHMgPSB7XG4gICAgJ2FqYXgnOiBBamF4LFxuICAgICdqc29ucCc6IEpzb25wLFxuICAgICdsb2NhbCc6IExvY2FsXG59O1xuXG52YXIgY29ubkZhY3RvcnkgPSB7XG4gICAgZ2V0Q29ubmVjdG9yOiBmdW5jdGlvbih1cGxvYWRlcikge1xuXG4gICAgICAgIHZhciB0eXBlID0gdXBsb2FkZXIudHlwZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB2YXIgY29ubiA9IG5lLnV0aWwuZXh0ZW5kKHtcbiAgICAgICAgICAgIF91cGxvZGFlcjogdXBsb2FkZXIsXG4gICAgICAgICAgICBzZW5kOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMudHlwZSA9PT0gJ3JlbW92ZScpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVSZXF1ZXN0KG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkUmVxdWVzdChvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIE1vZHVsZVNldHNbdHlwZV0gfHwgTG9jYWwpO1xuXG4gICAgICAgIHJldHVybiBjb25uO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gY29ubkZhY3Rvcnk7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgVGhpcyBDb25uZWN0b3IgbWFrZSBjb25uZWN0aW9uIGJldHdlZW4gRmlsZU1hbmFnZXIgYW5kIGZpbGUgc2VydmVyIGFwaSBhdCBvbGQgYnJvd3Nlci48YnI+XG4gKiAgICAgVGhpcyBDb25uZWN0b3IgdXNlIGhpZGRlbiBpZnJhbWUuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGUwMjQyQG5obmVudC5jb20+XG4gKi9cblxuLyoqXG4gKiBUaGUgbW9kdWxlcyB3aWxsIGJlIG1peGVkIGluIGNvbm5lY3RvciBieSB0eXBlLlxuICovXG52YXIgSnNvbnAgPSB7LyoqIEBsZW5kcyBuZS5jb21wb25lbnQuVXBsb2FkZXIuSnNvbnAgKi9cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGJ5IGZvcm0gc3VibWl0LlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWcgQ29uZmlndXJhdGlvbiBmb3Igc3VibWl0IGZvcm0uXG4gICAgICogIEBwYXJhbSB7ZnVuY3Rpb259IGNvbmZpZy5zdWNjZXNzIENhbGxiYWNrIHdoZW4gcG9zdCBzdWJtaXQgY29tcGxhdGUuXG4gICAgICovXG4gICAgYWRkUmVxdWVzdDogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICAgIHZhciBjYWxsYmFja05hbWUgPSB0aGlzLl91cGxvYWRlci5jYWxsYmFja05hbWUsXG4gICAgICAgIGNhbGxiYWNrID0gY29uZmlnLnN1Y2Nlc3M7XG4gICAgICAgIG5lLnV0aWwuZGVmaW5lTmFtZXNwYWNlKGNhbGxiYWNrTmFtZSwgIG5lLnV0aWwuYmluZCh0aGlzLnN1Y2Nlc3NQYWRkaW5nLCB0aGlzLCBjYWxsYmFjaykpO1xuXG4gICAgICAgIHRoaXMuX3VwbG9hZGVyLmlucHV0Vmlldy4kZWwuc3VibWl0KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByZXByb2Nlc3NpbmcgcmVzcG9uc2UgYmVmb3JlIGNhbGxiYWNrIHJ1bi5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBSZXF1ZXN0IENhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIFJlc3BvbnNlIGZyb20gc2VydmVyXG4gICAgICovXG4gICAgc3VjY2Vzc1BhZGRpbmc6IGZ1bmN0aW9uKGNhbGxiYWNrLCByZXNwb25zZSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0ge307XG5cbiAgICAgICAgaWYgKHRoaXMuX3VwbG9hZGVyLmlzQ3Jvc3NEb21haW4oKSkge1xuICAgICAgICAgICAgcmVzdWx0Lml0ZW1zID0gdGhpcy5fZ2V0U3BsaXRJdGVtcyhyZXNwb25zZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQuaXRlbXMgPSByZXNwb25zZS5maWxlbGlzdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNhbGxiYWNrKHJlc3VsdCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2UgcXVlcnkgZGF0YSB0byBhcnJheVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIFRoZSBEYXRhIGV4dHJhY3RlZCBmcm9tIHF1ZXJ5c3RyaW5nIHNlcGFyYXRlZCBieSAnJidcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRTcGxpdEl0ZW1zOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBzZXAgPSB0aGlzLl91cGxvYWRlci5zZXBhcmF0b3IsXG4gICAgICAgICAgICBzdGF0dXMgPSBkYXRhLnN0YXR1cy5zcGxpdChzZXApLFxuICAgICAgICAgICAgbmFtZXMgPSBkYXRhLm5hbWVzLnNwbGl0KHNlcCksXG4gICAgICAgICAgICBzaXplcyA9IGRhdGEuc2l6ZXMuc3BsaXQoc2VwKSxcbiAgICAgICAgICAgIGlkcyA9IG5lLnV0aWwuaXNTdHJpbmcoZGF0YS5pZHMpID8gZGF0YS5pZHMuc3BsaXQoc2VwKSA6IG5hbWVzLFxuICAgICAgICAgICAgaXRlbXMgPSBbXTtcblxuICAgICAgICBuZS51dGlsLmZvckVhY2goc3RhdHVzLCBmdW5jdGlvbihpdGVtLCBpbmRleCkge1xuICAgICAgICAgICAgaWYgKGl0ZW0gPT09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgICAgIHZhciBuSXRlbSA9IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogbmFtZXNbaW5kZXhdLFxuICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IHN0YXR1c1tpbmRleF0sXG4gICAgICAgICAgICAgICAgICAgIHNpemU6IHNpemVzW2luZGV4XSxcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGlkc1tpbmRleF1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGl0ZW1zLnB1c2gobkl0ZW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGl0ZW1zO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGFqYXggYnkgY29uZmlnIHRvIHJlbW92ZSBmaWxlLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWdcbiAgICAgKi9cbiAgICByZW1vdmVSZXF1ZXN0OiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrTmFtZSA9IHRoaXMuX3VwbG9hZGVyLmNhbGxiYWNrTmFtZSxcbiAgICAgICAgICAgIGRhdGEgPSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrTmFtZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNhbGxiYWNrID0gY29uZmlnLnN1Y2Nlc3M7XG5cbiAgICAgICAgbmUudXRpbC5kZWZpbmVOYW1lc3BhY2UoY2FsbGJhY2tOYW1lLCBuZS51dGlsLmJpbmQodGhpcy5yZW1vdmVQYWRkaW5nLCB0aGlzLCBjYWxsYmFjayksIHRydWUpO1xuXG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHRoaXMuX3VwbG9hZGVyLnVybC5yZW1vdmUsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb25wJyxcbiAgICAgICAgICAgIGpzb25wOiBjYWxsYmFja05hbWUsXG4gICAgICAgICAgICBkYXRhOiBuZS51dGlsLmV4dGVuZChkYXRhLCBjb25maWcuZGF0YSlcbiAgICAgICAgfSk7XG5cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJlcHJvY2Vzc2luZyByZXNwb25zZSBiZWZvcmUgY2FsbGJhY2sgcnVuLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFJlcXVlc3QgQ2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgUmVzcG9uc2UgZnJvbSBzZXJ2ZXJcbiAgICAgKi9cbiAgICByZW1vdmVQYWRkaW5nOiBmdW5jdGlvbihjYWxsYmFjaywgcmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgICByZXN1bHQuYWN0aW9uID0gJ3JlbW92ZSc7XG4gICAgICAgIHJlc3VsdC5uYW1lID0gZGVjb2RlVVJJQ29tcG9uZW50KHJlc3BvbnNlLm5hbWUpO1xuXG4gICAgICAgIGNhbGxiYWNrKHJlc3VsdCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBKc29ucDtcbiIsIi8qKlxuICogQGZpbGVvdmV2aWV3IFRoaXMgQ29ubmVjdG9yIG1ha2UgY29ubmVjdGlvbiBiZXR3ZWVuIFVwbG9hZGVyIGFuZCBodG1sNSBmaWxlIGFwaS5cbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZTAyNDJAbmhuZW50LmNvbT5cbiAqL1xudmFyIHN0YXRpY3MgPSByZXF1aXJlKCcuLi9zdGF0aWNzLmpzJyk7XG5cbi8qKlxuICogVGhlIG1vZHVsZXMgd2lsbCBiZSBtaXhlZCBpbiBjb25uZWN0b3IgYnkgdHlwZS5cbiAqL1xudmFyIExvY2FsID0gey8qKiBAbGVuZHMgbmUuY29tcG9uZW50LlVwbG9hZGVyLkxvY2FsICovXG4gICAgLyoqXG4gICAgICogQWRkIFJlcXVlc3QsIHNhdmUgZmlsZXMgdG8gYXJyYXkuXG4gICAgICogQHBhcmFtIGRhdGFcbiAgICAgKi9cbiAgICBhZGRSZXF1ZXN0OiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHRoaXMuX3NhdmVGaWxlKHN0YXRpY3MuaXNTdXBwb3J0Rm9ybURhdGEoKSk7XG4gICAgICAgIGRhdGEuc3VjY2Vzcyh7XG4gICAgICAgICAgICBpdGVtczogdGhpcy5fcmVzdWx0LFxuICAgICAgICAgICAgaXNSZXNldDogdHJ1ZVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2F2ZSBmaWxlIHRvIHBvb2xcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzU3VwcG9ydEFqYXggV2hldGhlciBGb3JtRGF0YSBpcyBzdXBwb3J0ZWQgb3Igbm90XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2F2ZUZpbGU6IGZ1bmN0aW9uKGlzU3VwcG9ydEFqYXgpIHtcbiAgICAgICAgdmFyIHVwbG9hZGVyID0gdGhpcy5fdXBsb2FkZXIsXG4gICAgICAgICAgICBpbnB1dFZpZXcgPSB1cGxvYWRlci5pbnB1dFZpZXcsXG4gICAgICAgICAgICBmaWxlRWwgPSBpbnB1dFZpZXcuJGlucHV0WzBdLFxuICAgICAgICAgICAgcmVzdWx0ID0gW107XG5cbiAgICAgICAgaWYgKGlzU3VwcG9ydEFqYXgpIHtcbiAgICAgICAgICAgIG5lLnV0aWwuZm9yRWFjaChmaWxlRWwuZmlsZXMsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChpdGVtKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goe1xuICAgICAgICAgICAgICAgIG5hbWU6IGZpbGVFbC52YWx1ZSxcbiAgICAgICAgICAgICAgICBlbGVtZW50OiBmaWxlRWxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fcmVzdWx0ID0gcmVzdWx0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIGZvcm0gZGF0YSB0byBzZW5kIFBPU1QoRm9ybURhdGUgc3VwcG9ydGVkIGNhc2UpXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbWFrZUZvcm1EYXRhIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB1cGxvYWRlciA9IHRoaXMuX3VwbG9hZGVyLFxuICAgICAgICAgICAgZm9ybSA9IG5ldyB3aW5kb3cuRm9ybURhdGEodXBsb2FkZXIuaW5wdXRWaWV3LiRlbFswXSk7XG4gICAgICAgIG5lLnV0aWwuZm9yRWFjaCh0aGlzLl9yZXN1bHQsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIGZvcm0uYXBwZW5kKHVwbG9hZGVyLmZpbGVGaWVsZCwgaXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZm9ybTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlUmVxdWVzdDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBjb25zb2xlLmxvZygncmVtb3ZlJywgZGF0YSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNlbmQgZmlsZXMgaW4gYSBiYXRjaC5cbiAgICAgKiBAcGFyYW0gY2FsbGJhY2tcbiAgICAgKi9cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBmb3JtID0gdGhpcy5fbWFrZUZvcm1EYXRhKCk7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHRoaXMuX3VwbG9hZGVyLnVybC5zZW5kLFxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgZGF0YTogZm9ybSxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGNhbGxiYWNrLFxuICAgICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTG9jYWw7IiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbmZpZ3VyYXRpb24gb3IgZGVmYXVsdCB2YWx1ZXMuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGUwMjQyQG5obmVudC5jb20+XG4gKi9cblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIG9mIGNvbm5lY3Rpb24gd2l0aCBzZXJ2ZXIuXG4gICogQHR5cGUge3tSRVNQT05TRV9UWVBFOiBzdHJpbmcsIFJFRElSRUNUX1VSTDogc3RyaW5nfX1cbiAqL1xubW9kdWxlLmV4cG9ydHMuQ09ORiA9IHtcbiAgICBSRVNQT05TRV9UWVBFOiAnUkVTUE9OU0VfVFlQRScsXG4gICAgUkVESVJFQ1RfVVJMOiAnUkVESVJFQ1RfVVJMJyxcbiAgICBKU09OUENBTExCQUNLX05BTUU6ICdDQUxMQkFDS19OQU1FJyxcbiAgICBTSVpFX1VOSVQ6ICdTSVpFX1VOSVQnLFxuICAgIFJFTU9WRV9DQUxMQkFDSyA6ICdyZXNwb25zZVJlbW92ZUNhbGxiYWNrJyxcbiAgICBFUlJPUjoge1xuICAgICAgICBERUZBVUxUOiAnVW5rbm93biBlcnJvci4nLFxuICAgICAgICBOT1RfU1VSUFBPUlQ6ICdUaGlzIGlzIHgtZG9tYWluIGNvbm5lY3Rpb24sIHlvdSBoYXZlIHRvIG1ha2UgaGVscGVyIHBhZ2UuJ1xuICAgIH0sXG4gICAgRklMRV9GSUxFRF9OQU1FOiAndXNlcmZpbGVbXSdcbn07XG5cbi8qKlxuICogRGVmYXVsdCBIdG1sc1xuICogQHR5cGUge3tpbnB1dDogc3RyaW5nLCBpdGVtOiBzdHJpbmd9fVxuICovXG5tb2R1bGUuZXhwb3J0cy5IVE1MID0ge1xuICAgIGlucHV0IDogWyc8Zm9ybSBlbmN0eXBlPVwibXVsdGlwYXJ0L2Zvcm0tZGF0YVwiIGlkPVwiZm9ybURhdGFcIiBtZXRob2Q9XCJwb3N0XCI+JyxcbiAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwiTUFYX0ZJTEVfU0laRVwiIHZhbHVlPVwiMzAwMDAwMFwiIC8+JyxcbiAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJmaWxlXCIgaWQ9XCJmaWxlQXR0YWNoXCIgbmFtZT1cInt7ZmlsZUZpZWxkfX1cIiBtdWx0aXBsZT1cInRydWVcIiAvPicsXG4gICAgICAgICAgICAgICAgJzxidXR0b24gY2xhc3M9XCJiYXRjaFN1Ym1pdFwiIHR5cGU9XCJzdWJtaXRcIj5TRU5EPC9idXR0b24+JyxcbiAgICAgICAgICAgICc8L2Zvcm0+J10uam9pbignJyksXG4gICAgaXRlbSA6IFsnPGxpIGNsYXNzPVwiZmlsZXR5cGVEaXNwbGF5Q2xhc3NcIj4nLFxuICAgICAgICAgICAgICAgICc8c3BuYSBjbGFzcz1cImZpbGVpY29uIHt7ZmlsZXR5cGV9fVwiPnt7ZmlsZXR5cGV9fTwvc3BuYT4nLFxuICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImZpbGVfbmFtZVwiPnt7ZmlsZW5hbWV9fTwvc3Bhbj4nLFxuICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImZpbGVfc2l6ZVwiPnt7ZmlsZXNpemV9fTwvc3Bhbj4nLFxuICAgICAgICAgICAgICAgICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cInt7ZGVsZXRlQnV0dG9uQ2xhc3NOYW1lfX1cIj5EZWxldGU8L2J1dHRvbj4nLFxuICAgICAgICAgICAgJzwvbGk+J10uam9pbignJylcbn07XG5cbi8qKlxuICogRXh0cmFjdCB1bml0IGZvciBmaWxlIHNpemVcbiAqIEBwYXJhbSB7bnVtYmVyfSBzaXplIEEgdXNhZ2Ugb2YgZmlsZVxuICovXG5tb2R1bGUuZXhwb3J0cy5nZXRGaWxlU2l6ZVdpdGhVbml0ID0gZnVuY3Rpb24oYnl0ZXMpIHtcbiAgICB2YXIgdW5pdHMgPSBbJ0InLCAnS0InLCAnTUInLCAnR0InLCAnVEInXSxcbiAgICAgICAgYnl0ZXMgPSBwYXJzZUludChieXRlcywgMTApLFxuICAgICAgICBleHAgPSBNYXRoLmxvZyhieXRlcykgLyBNYXRoLmxvZygxMDI0KSB8IDAsXG4gICAgICAgIHJlc3VsdCA9IChieXRlcyAvIE1hdGgucG93KDEwMjQsIGV4cCkpLnRvRml4ZWQoMik7XG5cbiAgICByZXR1cm4gcmVzdWx0ICsgdW5pdHNbZXhwXTtcbn07XG5cbi8qKlxuICogV2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0IEZvcm1EYXRhIG9yIG5vdFxuICovXG5tb2R1bGUuZXhwb3J0cy5pc1N1cHBvcnRGb3JtRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBGb3JtRGF0YSA9ICh3aW5kb3cuRm9ybURhdGEgfHwgbnVsbCk7XG4gICAgcmV0dXJuICEhRm9ybURhdGE7XG59O1xuXG4vKipcbiAqIEdldCBpdGVtIGVsZW1lbiBIVE1MXG4gKiBAcGFyYW0ge3N0cmluZ30gaHRtbCBIVE1MIHRlbXBsYXRlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICogQHByaXZhdGVcbiAqL1xubW9kdWxlLmV4cG9ydHMudGVtcGxhdGUgPSBmdW5jdGlvbihtYXAsIGh0bWwpIHtcbiAgICBodG1sID0gaHRtbC5yZXBsYWNlKC9cXHtcXHsoW15cXH1dKylcXH1cXH0vZywgZnVuY3Rpb24obXN0ciwgbmFtZSkge1xuICAgICAgICByZXR1cm4gbWFwW25hbWVdO1xuICAgIH0pO1xuICAgIHJldHVybiBodG1sO1xufTsiLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmlsZVVwbG9hZGVyIGlzIGNvcmUgb2YgZmlsZSB1cGxvYWRlciBjb21wb25lbnQuPGJyPkZpbGVNYW5hZ2VyIG1hbmFnZSBjb25uZWN0b3IgdG8gY29ubmVjdCBzZXJ2ZXIgYW5kIHVwZGF0ZSBGaWxlTGlzdFZpZXcuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGUwMjQyQG5obmVudC5jb20+XG4gKi9cblxudmFyIHN0YXRpYyA9IHJlcXVpcmUoJy4vc3RhdGljcy5qcycpO1xudmFyIGNvbm4gPSByZXF1aXJlKCcuL2Nvbm5lY3Rvci9jb25uZWN0b3IuanMnKTtcbnZhciBJbnB1dCA9IHJlcXVpcmUoJy4vdmlldy9pbnB1dC5qcycpO1xudmFyIExpc3QgPSByZXF1aXJlKCcuL3ZpZXcvbGlzdC5qcycpO1xuXG4vKipcbiAqIEZpbGVVcGxvYWRlciBhY3QgbGlrZSBicmlkZ2UgYmV0d2VlbiBjb25uZWN0b3IgYW5kIHZpZXcuXG4gKiBJdCBtYWtlcyBjb25uZWN0b3IgYW5kIHZpZXcgd2l0aCBvcHRpb24gYW5kIGVudmlyb25tZW50LlxuICogSXQgY29udHJvbCBhbmQgbWFrZSBjb25uZWN0aW9uIGFtb25nIG1vZHVsZXMuXG4gKiBAY29uc3RydWN0b3IgbmUuY29tcG9uZW50LlVwbG9hZGVyXG4gKiBAZXhhbXBsZVxuICogdmFyIHVwbG9hZGVyID0gbmV3IG5lLmNvbXBvbmVudC5VcGxvYWRlcih7XG4gKiAgICAgdXJsOiB7XG4gKiAgICAgICAgIHNlbmQ6IFwiaHR0cDovL2ZlLm5obmVudC5jb20vZXRjL2V0Yy91cGxvYWRlci91cGxvYWRlci5waHBcIixcbiAqICAgICAgICAgcmVtb3ZlOiBcImh0dHA6Ly9mZS5uaG5lbnQuY29tL2V0Yy9ldGMvdXBsb2FkZXIvcmVtb3ZlLnBocFwiXG4gKiAgICAgfSxcbiAqICAgICBoZWxwZXI6IHtcbiAqICAgICAgICAgdXJsOiAnaHR0cDovLzEwLjc3LjM0LjEyNjo4MDA5L3NhbXBsZXMvcmVzcG9uc2UuaHRtbCcsXG4gKiAgICAgICAgIG5hbWU6ICdSRURJUkVDVF9VUkwnXG4gKiAgICAgfSxcbiAqICAgICByZXN1bHRUeXBlRWxlbWVudE5hbWU6ICdSRVNQT05TRV9UWVBFJyxcbiAqICAgICBmb3JtVGFyZ2V0OiAnaGlkZGVuRnJhbWUnLFxuICogICAgIGNhbGxiYWNrTmFtZTogJ3Jlc3BvbnNlQ2FsbGJhY2snLFxuICogICAgIGxpc3RJbmZvOiB7XG4gKiAgICAgICAgIGxpc3Q6ICQoJyNmaWxlcycpLFxuICogICAgICAgICBjb3VudDogJCgnI2ZpbGVfY291bnQnKSxcbiAqICAgICAgICAgc2l6ZTogJCgnI3NpemVfY291bnQnKVxuICogICAgIH0sXG4gKiAgICAgc2VwYXJhdG9yOiAnOydcbiAqIH0sICQoJyN1cGxvYWRlcicpKTtcbiAqL1xudmFyIFVwbG9hZGVyID0gbmUudXRpbC5kZWZpbmVDbGFzcygvKipAbGVuZHMgbmUuY29tcG9uZW50LlVwbG9hZGVyLnByb3RvdHlwZSAqL3tcblxuICAgIC8qKlxuICAgICAqIGluaXRpYWxpemUgb3B0aW9uc1xuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFRoZSBvcHRpb25zIHRvIHNldCB1cCBmaWxlIHVwbG9hZGVyIG1vZHVsZXMuXG4gICAgICogIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zLnVybCBUaGUgdXJsIGlzIGZpbGUgc2VydmVyLlxuICAgICAqICAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMudXJsLnNlbmQgVGhlIHVybCBpcyBmb3IgZmlsZSBhdHRhY2guXG4gICAgICogICAgICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy51cmwucmVtb3ZlIFRoZSB1cmwgaXMgZm9yIGZpbGUgZGV0YWNoLlxuICAgICAqICBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy5oZWxwZXIgVGhlIGhlbHBlciBvYmplY3QgaW5mbyBpcyBmb3IgeC1kb21haW4uXG4gICAgICogICAgICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5oZWxwZXIudXJsIFRoZSB1cmwgaXMgaGVscGVyIHBhZ2UgdXJsLlxuICAgICAqICAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuaGVscGVyLm5hbWUgVGhlIG5hbWUgb2YgaGlkZGVuIGVsZW1lbnQgZm9yIHNlbmRpbmcgc2VydmVyIGhlbHBlciBwYWdlIGluZm9ybWF0aW9uLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5yZXN1bHRUeXBlRWxlbWVudE5hbWUgVGhlIHR5cGUgb2YgaGlkZGVuIGVsZW1lbnQgZm9yIHNlbmRpbmcgc2VydmVyIHJlc3BvbnNlIHR5cGUgaW5mb3JtYXRpb24uXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmZvcm1UYXJnZXQgVGhlIHRhcmdldCBmb3IgeC1kb21haW4ganNvbnAgY2FzZS5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuY2FsbGJhY2tOYW1lIFRoZSBuYW1lIG9mIGpzb25wIGNhbGxiYWNrIGZ1bmN0aW9uLlxuICAgICAqICBAcGFyYW0ge29iamVjdH0gb3BpdG9ucy5saXN0SW5mbyBUaGUgZWxlbWVudCBpbmZvIHRvIGRpc3BsYXkgZmlsZSBsaXN0IGluZm9ybWF0aW9uLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5zZXBhcmF0b3IgVGhlIHNlcGFyYXRvciBmb3IganNvbnAgaGVscGVyIHJlc3BvbnNlLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZmlsZUZpZWxkPXVzZXJGaWxlXSBUaGUgZmllbGQgbmFtZSBvZiBpbnB1dCBmaWxlIGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtKcXVlcnlPYmplY3R9ICRlbCBSb290IEVsZW1lbnQgb2YgVXBsb2FkZXJcbiAgICAgKi9cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zLCAkZWwpIHtcbiAgICAgICAgdGhpcy5fc2V0RGF0YShvcHRpb25zKTtcbiAgICAgICAgdGhpcy5fc2V0Q29ubmVjdG9yKCk7XG5cbiAgICAgICAgdGhpcy4kZWwgPSAkZWw7XG4gICAgICAgIHRoaXMuaW5wdXRWaWV3ID0gbmV3IElucHV0KG9wdGlvbnMsIHRoaXMpO1xuICAgICAgICB0aGlzLmxpc3RWaWV3ID0gbmV3IExpc3Qob3B0aW9ucywgdGhpcyk7XG4gICAgICAgIHRoaXMuZmlsZUZpZWxkID0gdGhpcy5maWxlRmllbGQgfHwgc3RhdGljLkNPTkYuRklMRV9GSUxFRF9OQU1FO1xuXG4gICAgICAgIHRoaXMuX2FkZEV2ZW50KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBDb25uZWN0b3IgYnkgdXNlSnNvbnAgZmxhZyBhbmQgd2hldGhlci5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRDb25uZWN0b3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5pc0JhdGNoVHJhbnNmZXIpIHtcbiAgICAgICAgICAgIHRoaXMudHlwZSA9ICdsb2NhbCc7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5pc0Nyb3NzRG9tYWluKCkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmhlbHBlcikge1xuICAgICAgICAgICAgICAgIHRoaXMudHlwZSA9ICdqc29ucCc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFsZXJ0KHN0YXRpYy5DT05GLkVSUk9SLk5PVF9TVVJQUE9SVCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAodGhpcy51c2VKc29ucCB8fCAhc3RhdGljLmlzU3VwcG9ydEZvcm1EYXRhKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnR5cGUgPSAnanNvbnAnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnR5cGUgPSAnYWpheCc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fY29ubmVjdG9yID0gY29ubi5nZXRDb25uZWN0b3IodGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBsaXN0IHZpZXcgd2l0aCBjdXN0b20gb3Igb3JpZ2luYWwgZGF0YS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gaW5mbyBUaGUgZGF0YSBmb3IgdXBkYXRlIGxpc3RcbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IGluZm8uYWN0aW9uIFRoZSBhY3Rpb24gbmFtZSB0byBleGVjdXRlIG1ldGhvZFxuICAgICAqL1xuICAgIG5vdGlmeTogZnVuY3Rpb24oaW5mbykge1xuICAgICAgICB0aGlzLmxpc3RWaWV3LnVwZGF0ZShpbmZvKTtcbiAgICAgICAgdGhpcy5saXN0Vmlldy51cGRhdGVUb3RhbEluZm8oaW5mbyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBmaWVsZCBkYXRhIGJ5IG9wdGlvbiB2YWx1ZXMuXG4gICAgICogQHBhcmFtIG9wdGlvbnNcbiAgICAgKi9cbiAgICBfc2V0RGF0YTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICBuZS51dGlsLmV4dGVuZCh0aGlzLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXh0cmFjdCBwcm90b2NvbCArIGRvbWFpbiBmcm9tIHVybCB0byBmaW5kIG91dCB3aGV0aGVyIGNyb3NzLWRvbWFpbiBvciBub3QuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgaXNDcm9zc0RvbWFpbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBwYWdlRG9tYWluID0gZG9jdW1lbnQuZG9tYWluO1xuICAgICAgICByZXR1cm4gdGhpcy51cmwuc2VuZC5pbmRleE9mKHBhZ2VEb21haW4pID09PSAtMTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZm9yIGVycm9yXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIEVycm9yIHJlc3BvbnNlXG4gICAgICovXG4gICAgZXJyb3JDYWxsYmFjazogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2U7XG4gICAgICAgIGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5tc2cpIHtcbiAgICAgICAgICAgIG1lc3NhZ2UgPSByZXNwb25zZS5tc2c7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtZXNzYWdlID0gc3RhdGljLkNPTkYuRVJST1IuREVGQVVMVDtcbiAgICAgICAgfVxuICAgICAgICBhbGVydChtZXNzYWdlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZm9yIGN1c3RvbSBzZW5kIGV2ZW50XG4gICAgICovXG4gICAgc2VuZEZpbGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBuZS51dGlsLmJpbmQodGhpcy5ub3RpZnksIHRoaXMpO1xuICAgICAgICB0aGlzLl9jb25uZWN0b3Iuc2VuZCh7XG4gICAgICAgICAgICB0eXBlOiAnYWRkJyxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGNhbGxiYWNrLFxuICAgICAgICAgICAgZXJyb3I6IHRoaXMuZXJyb3JDYWxsYmFja1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZm9yIGN1c3RvbSByZW1vdmUgZXZlbnRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBUaGUgZGF0YSBmb3IgcmVtb3ZlIGZpbGUuXG4gICAgICovXG4gICAgcmVtb3ZlRmlsZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBuZS51dGlsLmJpbmQodGhpcy5ub3RpZnksIHRoaXMpO1xuICAgICAgICB0aGlzLl9jb25uZWN0b3Iuc2VuZCh7XG4gICAgICAgICAgICB0eXBlOiAncmVtb3ZlJyxcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICBzdWNjZXNzOiBjYWxsYmFja1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgc3VibWl0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fY29ubmVjdG9yLnN1Ym1pdChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCd1cGxvYWRlciBjYW9tcGxldGUnKTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBmb3IgY3VzdG9tIHJlbW92ZSBldmVudFxuICAgICAqIFJlbW92ZSBpbnB1dCBmaWxlJ3MgY2xvbmVcbiAgICAgICogQHBhcmFtIGRhdGFcbiAgICAgKi9cbiAgICByZW1vdmVFbGVtZW50OiBmdW5jdGlvbihkYXRhKSB7XG5cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGZpbGUgaW5mbyBsb2NhbGx5XG4gICAgICogQHBhcmFtIHtIdG1sRWxlbWVudH0gZWxlbWVudCBJbnB1dCBlbGVtZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0RmlsZUluZm86IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGZpbGVzO1xuICAgICAgICBpZiAodGhpcy5faXNTdXBwb3J0RmlsZVN5c3RlbSgpKSB7XG4gICAgICAgICAgICBmaWxlcyA9IHRoaXMuX2dldEZpbGVMaXN0KGVsZW1lbnQuZmlsZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmlsZXMgPSB7XG4gICAgICAgICAgICAgICAgbmFtZTogZWxlbWVudC52YWx1ZSxcbiAgICAgICAgICAgICAgICBpZDogZWxlbWVudC52YWx1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmaWxlcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGZpbGUgbGlzdCBmcm9tIEZpbGVMaXN0IG9iamVjdFxuICAgICAqIEBwYXJhbSB7RmlsZUxpc3R9IGZpbGVzIEEgRmlsZUxpc3Qgb2JqZWN0XG4gICAgICogQHJldHVybnMge0FycmF5fVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldEZpbGVMaXN0OiBmdW5jdGlvbihmaWxlcykge1xuICAgICAgICByZXR1cm4gbmUudXRpbC5tYXAoZmlsZXMsIGZ1bmN0aW9uKGZpbGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGZpbGUpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBmaWxlLm5hbWUsXG4gICAgICAgICAgICAgICAgc2l6ZTogZmlsZS5zaXplLFxuICAgICAgICAgICAgICAgIGlkOiBmaWxlLm5hbWVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayB3aGV0aGVyIHN1cHBvcnQgZmlsZSBhcGkgb3Igbm90XG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfaXNTdXBwb3J0RmlsZVN5c3RlbTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAhISh3aW5kb3cuRmlsZSAmJiB3aW5kb3cuRmlsZVJlYWRlciAmJiB3aW5kb3cuRmlsZUxpc3QgJiYgd2luZG93LkJsb2IpO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudCB0byBsaXN0dmlldyBhbmQgaW5wdXR2aWV3XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5pc0JhdGNoVHJhbnNmZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRWaWV3Lm9uKCdzYXZlJywgdGhpcy5zZW5kRmlsZSwgdGhpcyk7XG4gICAgICAgICAgICB0aGlzLmxpc3RWaWV3Lm9uKCdyZW1vdmUnLCB0aGlzLnJlbW92ZUZpbGUsIHRoaXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5pbnB1dFZpZXcub24oJ2NoYW5nZScsIHRoaXMuc2VuZEZpbGUsIHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5saXN0Vmlldy5vbigncmVtb3ZlJywgdGhpcy5yZW1vdmVGaWxlLCB0aGlzKTtcbiAgICAgICAgfVxuICAgIH1cblxufSk7XG5cbm5lLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKFVwbG9hZGVyKTtcbm1vZHVsZS5leHBvcnRzID0gVXBsb2FkZXI7IiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IElucHV0VmlldyBtYWtlIGlucHV0IGZvcm0gYnkgdGVtcGxhdGUuIEFkZCBldmVudCBmaWxlIHVwbG9hZCBldmVudC5cbiAqIEBkZXBlbmRlbmN5IG5lLWNvZGUtc25pcHBldCAxLjAuMywganF1ZXJ5MS44LjNcbiAqIEBhdXRob3IgTkhOIEVudC4gRkUgRGV2ZWxvcG1lbnQgVGVhbSA8ZTAyNDJAbmhuZW50LmNvbT5cbiAqL1xuXG52YXIgc3RhdGljID0gcmVxdWlyZSgnLi4vc3RhdGljcy5qcycpO1xuXG4vKipcbiAqIFRoaXMgdmlldyBjb250cm9sIGlucHV0IGVsZW1lbnQgdHlwZWQgZmlsZS5cbiAqIEBjb25zdHJ1Y3RvciBuZS5jb21wb25lbnQuRmlsZVVwbG9hZGVyLklucHV0Vmlld1xuICovXG52YXIgSW5wdXQgPSBuZS51dGlsLmRlZmluZUNsYXNzKC8qKkBsZW5kcyBuZS5jb21wb25lbnQuVXBsb2FkZXIuSW5wdXQucHJvdG90eXBlICoqL3tcbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplIGlucHV0IGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICAgICAqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMsIHVwbG9hZGVyKSB7XG5cbiAgICAgICAgdGhpcy5fdXBsb2FkZXIgPSB1cGxvYWRlcjtcbiAgICAgICAgdGhpcy5fdGFyZ2V0ID0gb3B0aW9ucy5mb3JtVGFyZ2V0O1xuICAgICAgICB0aGlzLl91cmwgPSBvcHRpb25zLnVybDtcbiAgICAgICAgdGhpcy5faXNCYXRjaFRyYW5zZmVyID0gb3B0aW9ucy5pc0JhdGNoVHJhbnNmZXI7XG4gICAgICAgIHRoaXMuaHRtbCA9IChvcHRpb25zLnRlbXBsYXRlICYmIG9wdGlvbnMudGVtcGxhdGUuaW5wdXQpIHx8IHN0YXRpYy5IVE1MLmlucHV0O1xuXG4gICAgICAgIHRoaXMuX3JlbmRlcigpO1xuICAgICAgICB0aGlzLl9yZW5kZXJIaWRkZW5FbGVtZW50cygpO1xuXG4gICAgICAgIGlmIChvcHRpb25zLmhlbHBlcikge1xuICAgICAgICAgICAgdGhpcy5fbWFrZUJyaWRnZUluZm9FbGVtZW50KG9wdGlvbnMuaGVscGVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuJGlucHV0ID0gdGhpcy4kZWwuZmluZCgnaW5wdXQ6ZmlsZScpO1xuICAgICAgICB0aGlzLl9hZGRFdmVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgaW5wdXQgYXJlYVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsID0gJCh0aGlzLl9nZXRIdG1sKHRoaXMuaHRtbCkpO1xuICAgICAgICB0aGlzLiRlbC5hdHRyKHtcbiAgICAgICAgICAgIGFjdGlvbjogdGhpcy5fdXJsLnNlbmQsXG4gICAgICAgICAgICBtZXRob2Q6ICdwb3N0JyxcbiAgICAgICAgICAgIGVuY3R5cGU6IFwibXVsdGlwYXJ0L2Zvcm0tZGF0YVwiLFxuICAgICAgICAgICAgdGFyZ2V0OiB0aGlzLl90YXJnZXRcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX3VwbG9hZGVyLiRlbC5hcHBlbmQodGhpcy4kZWwpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgaHRtbCBzdHJpbmcgZnJvbSB0ZW1wbGF0ZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBodG1sIFRoZSBodG1sIHRvIGJlIGNvbnZlcnRlZC5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldEh0bWw6IGZ1bmN0aW9uKGh0bWwpIHtcbiAgICAgICAgdmFyIG1hcCA9IHtcbiAgICAgICAgICAgIGZpbGVGaWVsZDogdGhpcy5fdXBsb2FkZXIuZmlsZUZpZWxkXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBzdGF0aWMudGVtcGxhdGUobWFwLCBodG1sKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbCBtZXRob2RzIHRob3NlIG1ha2UgZWFjaCBoaWRkZW4gZWxlbWVudC5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW5kZXJIaWRkZW5FbGVtZW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX21ha2VUYXJnZXRGcmFtZSgpO1xuICAgICAgICB0aGlzLl9tYWtlUmVzdWx0VHlwZUVsZW1lbnQoKTtcbiAgICAgICAgdGhpcy5fbWFrZUNhbGxiYWNrRWxlbWVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgY2hhbmdlIGV2ZW50IGFuZCBjdXN0b20gRXZlbnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzdWJtaXQgPSB0aGlzLiRlbC5maW5kKCdidXR0b246c3VibWl0JyksXG4gICAgICAgICAgICBzZWxmID0gdGhpcztcbiAgICAgICAgaWYgKHRoaXMuX2lzQmF0Y2hUcmFuc2Zlcikge1xuICAgICAgICAgICAgdGhpcy4kaW5wdXQub24oJ2NoYW5nZScsIG5lLnV0aWwuYmluZCh0aGlzLm9uU2F2ZSwgdGhpcykpO1xuICAgICAgICAgICAgdGhpcy4kZWwub24oJ3N1Ym1pdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3VwbG9hZGVyLnN1Ym1pdCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kaW5wdXQub24oJ2NoYW5nZScsIG5lLnV0aWwuYmluZCh0aGlzLm9uQ2hhbmdlLCB0aGlzKSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQtSGFuZGxlIGZvciBpbnB1dCBlbGVtZW50IGNoYW5nZVxuICAgICAqL1xuICAgIG9uQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5maXJlKCdjaGFuZ2UnLCB7XG4gICAgICAgICAgICB0YXJnZXQ6IHRoaXNcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50LUhhbmRsZSBmb3Igc2F2ZSBpbnB1dCBlbGVtZW50XG4gICAgICovXG4gICAgb25TYXZlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5maXJlKCdzYXZlJywge1xuICAgICAgICAgICAgZWxlbWVudDogdGhpcy4kaW5wdXRbMF0sXG4gICAgICAgICAgICBjYWxsYmFjazogbmUudXRpbC5iaW5kKHRoaXMuX2NoYW5nZUVsZW1lbnQsIHRoaXMpXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGFuZ2UgZWxlbWVudCBmb3Igc2F2ZSBmaWxlIGRhdGFcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YVxuICAgICAqL1xuICAgIF9jaGFuZ2VFbGVtZW50OiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHRoaXMuX2Nsb25lKGRhdGEpO1xuICAgICAgICB0aGlzLl9hZGRFdmVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIGVsZW1lbnQgdG8gYmUgdGFyZ2V0IG9mIHN1Ym1pdCBmb3JtIGZvcm0gZWxlbWVudC5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9tYWtlVGFyZ2V0RnJhbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl8kdGFyZ2V0ID0gJCgnPGlmcmFtZSBuYW1lPVwiJyArIHRoaXMuX3RhcmdldCArICdcIj48L2lmcmFtZT4nKTtcbiAgICAgICAgdGhpcy5fJHRhcmdldC5jc3Moe1xuICAgICAgICAgICAgdmlzaWJpbGl0eTogJ2hpZGRlbicsXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJ1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fdXBsb2FkZXIuJGVsLmFwcGVuZCh0aGlzLl8kdGFyZ2V0KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSBlbGVtZW50IHRvIGJlIGNhbGxiYWNrIGZ1bmN0aW9uIG5hbWVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9tYWtlQ2FsbGJhY2tFbGVtZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fJGNhbGxiYWNrID0gdGhpcy5fbWFrZUhpZGRlbkVsZW1lbnQoe1xuICAgICAgICAgICAgJ25hbWUnOiBzdGF0aWMuQ09ORi5KU09OUENBTExCQUNLX05BTUUsXG4gICAgICAgICAgICAndmFsdWUnOiB0aGlzLl91cGxvYWRlci5jYWxsYmFja05hbWVcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuJGVsLmFwcGVuZCh0aGlzLl8kY2FsbGJhY2spO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIGVsZW1lbnQgdG8ga25vdyB3aGljaCB0eXBlIHJlcXVlc3RcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9tYWtlUmVzdWx0VHlwZUVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl8kcmVzVHlwZSA9IHRoaXMuX21ha2VIaWRkZW5FbGVtZW50KHtcbiAgICAgICAgICAgICduYW1lJyA6IHRoaXMuX3VwbG9hZGVyLnJlc3VsdFR5cGVFbGVtZW50TmFtZSB8fCBzdGF0aWMuQ09ORi5SRVNQT05TRV9UWVBFLFxuICAgICAgICAgICAgJ3ZhbHVlJzogdGhpcy5fdXBsb2FkZXIudHlwZVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy4kZWwuYXBwZW5kKHRoaXMuXyRyZXNUeXBlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSBlbGVtZW50IHRoYXQgaGFzIHJlZGlyZWN0IHBhZ2UgaW5mb3JtYXRpb24gdXNlZCBieSBTZXJ2ZXIgc2lkZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gaGVscGVyIFJlZGlyZWN0aW9uIGluZm9ybWF0aW9uIGZvciBjbGVhciB4LWRvbWFpbiBwcm9ibGVtLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX21ha2VCcmlkZ2VJbmZvRWxlbWVudDogZnVuY3Rpb24oaGVscGVyKSB7XG4gICAgICAgIHRoaXMuXyRoZWxwZXIgPSB0aGlzLl9tYWtlSGlkZGVuRWxlbWVudCh7XG4gICAgICAgICAgICAnbmFtZScgOiBoZWxwZXIubmFtZSB8fCBzdGF0aWMuQ09ORi5SRURJUkVDVF9VUkwsXG4gICAgICAgICAgICAndmFsdWUnOiBoZWxwZXIudXJsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLiRlbC5hcHBlbmQodGhpcy5fJGhlbHBlcik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2UgSGlkZGVuIGlucHV0IGVsZW1lbnQgd2l0aCBvcHRpb25zXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgVGhlIG9waXRvbnMgdG8gYmUgYXR0cmlidXRlIG9mIGlucHV0XG4gICAgICogQHJldHVybnMgeyp8alF1ZXJ5fVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX21ha2VIaWRkZW5FbGVtZW50OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIG5lLnV0aWwuZXh0ZW5kKG9wdGlvbnMsIHtcbiAgICAgICAgICAgIHR5cGU6ICdoaWRkZW4nXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gJCgnPGlucHV0IC8+JykuYXR0cihvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xvbmUgSW5wdXQgZWxlbWVudCB0byBzZW5kIGJ5IGZvcm0gc3VibWl0XG4gICAgICogQHBhcmFtIHtvYmplY3R9IGluZm8gQSBpbmZvcm1hdGlvbiBvZiBjbG9uZSBlbGVtZW50XG4gICAgICovXG4gICAgX2Nsb25lOiBmdW5jdGlvbihpbmZvKSB7XG4gICAgICAgIHRoaXMuJGlucHV0Lm9mZigpO1xuICAgICAgICAvLyB0b2RvIGNsb25lXG4gICAgfVxufSk7XG5cblxubmUudXRpbC5DdXN0b21FdmVudHMubWl4aW4oSW5wdXQpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IElucHV0OyIsIi8qKlxuICogQGZpbGVvdmVydmlldyBJdGVtVmlldyBtYWtlIGVsZW1lbnQgdG8gZGlzcGxheSBhZGRlZCBmaWxlIGluZm9ybWF0aW9uLiBJdCBoYXMgYXR0YWNoZWQgZmlsZSBJRCB0byByZXF1ZXN0IGZvciByZW1vdmUuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGUwMjQyQG5obmVudC5jb20+XG4gKi9cblxudmFyIHN0YXRpYyA9IHJlcXVpcmUoJy4uL3N0YXRpY3MuanMnKTtcblxuLyoqXG4gKiBDbGFzcyBvZiBpdGVtIHRoYXQgaXMgbWVtYmVyIG9mIGZpbGUgbGlzdC5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG52YXIgSXRlbSA9IG5lLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBuZS5jb21wb25lbnQuVXBsb2FkZXIuSXRlbS5wcm90b3R5cGUgKiovIHtcbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplIGl0ZW1cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xuICAgICAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5uYW1lIEZpbGUgbmFtZVxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy50eXBlIEZpbGUgdHlwZVxuICAgICAqICBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy5yb290IExpc3Qgb2JqZWN0XG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmhpZGRlbkZyYW1lIFRoZSBpZnJhbWUgbmFtZSB3aWxsIGJlIHRhcmdldCBvZiBmb3JtIHN1Ym1pdC5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMudXJsIFRoZSB1cmwgZm9yIGZvcm0gYWN0aW9uIHRvIHN1Ym1ldC5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmlkXSBVbmlxdWUga2V5LCB3aGF0IGlmIHRoZSBrZXkgaXMgbm90IGV4aXN0IGlkIHdpbGwgYmUgdGhlIGZpbGUgbmFtZS5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmhpZGRlbkZpZWxkTmFtZV0gVGhlIG5hbWUgb2YgaGlkZGVuIGZpbGVkLiBUaGUgaGlkZGVuIGZpZWxkIGlzIGZvciBjb25uZWN0aW5nIHgtZG9taWFuLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGVsZXRlQnV0dG9uQ2xhc3NOYW1lPSd1cGxvYWRlcl9idG5fZGVsZXRlJ10gVGhlIGNsYXNzIG5hbWUgaXMgZm9yIGRlbGV0ZSBidXR0b24uXG4gICAgICogIEBwYXJhbSB7KHN0cmluZ3xudW1iZXIpfSBbb3B0aW9ucy5zaXplXSBGaWxlIHNpemUgKGJ1dCBpZSBsb3cgYnJvd3NlciwgeC1kb21haW4pXG4gICAgICogIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucy5oZWxwZXJdIFRoZSBoZWxwZXIgcGFnZSBpbmZvLlxuICAgICAqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuICAgICAgICB0aGlzLl9zZXRSb290KG9wdGlvbnMpO1xuICAgICAgICB0aGlzLl9zZXRJdGVtSW5mbyhvcHRpb25zKTtcbiAgICAgICAgdGhpcy5fc2V0Q29ubmVjdEluZm8ob3B0aW9ucyk7XG5cbiAgICAgICAgdGhpcy5yZW5kZXIob3B0aW9ucy50ZW1wbGF0ZSB8fCBzdGF0aWMuSFRNTC5pdGVtKTtcblxuICAgICAgICBpZiAob3B0aW9ucy5oZWxwZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX21ha2VCcmlkZ2VJbmZvRWxlbWVudChvcHRpb25zLmhlbHBlcik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHJvb3QoTGlzdCBvYmplY3QpIGluZm9ybWF0aW9uLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFNhbWUgd2l0aCBpbml0IG9wdGlvbnMgcGFyYW1ldGVyLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldFJvb3Q6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fcm9vdCA9IG9wdGlvbnMucm9vdDtcbiAgICAgICAgdGhpcy5fJHJvb3QgPSBvcHRpb25zLnJvb3QuJGVsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgZmlsZSBpbmZvcm1hdGlvbi5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBTYW1lIHdpdGggaW5pdCBvcHRpb25zIHBhcmFtZXRlci5cbiAgICAgKi9cbiAgICBfc2V0SXRlbUluZm86IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gb3B0aW9ucy5uYW1lO1xuICAgICAgICB0aGlzLl90eXBlID0gb3B0aW9ucy50eXBlIHx8IHRoaXMuX2V4dHJhY3RFeHRlbnNpb24oKTtcbiAgICAgICAgdGhpcy5faWQgPSBvcHRpb25zLmlkIHx8IG9wdGlvbnMubmFtZTtcbiAgICAgICAgdGhpcy5zaXplID0gb3B0aW9ucy5zaXplIHx8ICcnO1xuICAgICAgICB0aGlzLl9idG5DbGFzcyA9IG9wdGlvbnMuZGVsZXRlQnV0dG9uQ2xhc3NOYW1lIHx8ICd1cGxvYWRlcl9idG5fZGVsZXRlJztcbiAgICAgICAgdGhpcy5fdW5pdCA9IG9wdGlvbnMudW5pdCB8fCAnS0InO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgY29ubmVjdCBlbGVtZW50IGluZm9ybWF0aW9uLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFNhbWUgd2l0aCBpbml0IG9wdGlvbnMgcGFyYW1ldGVyLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NldENvbm5lY3RJbmZvOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX3VybCA9IG9wdGlvbnMudXJsO1xuICAgICAgICB0aGlzLl9oaWRkZW5JbnB1dE5hbWUgPSBvcHRpb25zLmhpZGRlbkZpZWxkTmFtZSB8fCAnZmlsZW5hbWUnO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgbWFraW5nIGZvcm0gcGFkZGluZyB3aXRoIGRlbGV0YWJsZSBpdGVtXG4gICAgICogQHBhcmFtIHRlbXBsYXRlXG4gICAgICovXG4gICAgcmVuZGVyOiBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuICAgICAgICB2YXIgaHRtbCA9IHRoaXMuX2dldEh0bWwodGVtcGxhdGUpO1xuICAgICAgICB0aGlzLl8kZWwgPSAkKGh0bWwpO1xuICAgICAgICB0aGlzLl8kcm9vdC5hcHBlbmQodGhpcy5fJGVsKTtcbiAgICAgICAgdGhpcy5fYWRkRXZlbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXh0cmFjdCBmaWxlIGV4dGVuc2lvbiBieSBuYW1lXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9leHRyYWN0RXh0ZW5zaW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZS5zcGxpdCgnLicpLnBvcCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIGVsZW1lbnQgdGhhdCBoYXMgcmVkaXJlY3QgcGFnZSBpbmZvcm1hdGlvbiB1c2VkIGJ5IFNlcnZlciBzaWRlLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBoZWxwZXIgUmVkaXJlY3Rpb24gaGVscGVyIHBhZ2UgaW5mb3JtYXRpb24gZm9yIGNsZWFyIHgtZG9tYWluIHByb2JsZW0uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbWFrZUJyaWRnZUluZm9FbGVtZW50OiBmdW5jdGlvbihoZWxwZXIpIHtcbiAgICAgICAgdGhpcy4kaGVscGVyID0gJCgnPGlucHV0IC8+Jyk7XG4gICAgICAgIHRoaXMuJGhlbHBlci5hdHRyKHtcbiAgICAgICAgICAgICduYW1lJyA6IGhlbHBlci5uYW1lLFxuICAgICAgICAgICAgJ3ZhbHVlJzogaGVscGVyLnVybFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGl0ZW0gZWxlbWVuIEhUTUxcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaHRtbCBIVE1MIHRlbXBsYXRlXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRIdG1sOiBmdW5jdGlvbihodG1sKSB7XG4gICAgICAgIHZhciBtYXAgPSB7XG4gICAgICAgICAgICBmaWxldHlwZTogdGhpcy5fdHlwZSxcbiAgICAgICAgICAgIGZpbGVuYW1lOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICBmaWxlc2l6ZTogc3RhdGljLmdldEZpbGVTaXplV2l0aFVuaXQodGhpcy5zaXplKSxcbiAgICAgICAgICAgIGRlbGV0ZUJ1dHRvbkNsYXNzTmFtZTogdGhpcy5fYnRuQ2xhc3NcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gc3RhdGljLnRlbXBsYXRlKG1hcCwgaHRtbCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERlc3RvcnkgaXRlbVxuICAgICAqL1xuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9yZW1vdmVFdmVudCgpO1xuICAgICAgICB0aGlzLl8kZWwucmVtb3ZlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudCBoYW5kbGVyIG9uIGRlbGV0ZSBidXR0b24uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcXVlcnkgPSAnLicgKyB0aGlzLl9idG5DbGFzcyxcbiAgICAgICAgICAgICRkZWxCdG4gPSB0aGlzLl8kZWwuZmluZChxdWVyeSk7XG4gICAgICAgICRkZWxCdG4ub24oJ2NsaWNrJywgbmUudXRpbC5iaW5kKHRoaXMuX29uQ2xpY2tFdmVudCwgdGhpcykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgZXZlbnQgaGFuZGxlciBmcm9tIGRlbGV0ZSBidXR0b24uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcXVlcnkgPSAnLicgKyB0aGlzLl9idG5DbGFzcyxcbiAgICAgICAgICAgICRkZWxCdG4gPSB0aGlzLl8kZWwuZmluZChxdWVyeSk7XG4gICAgICAgICRkZWxCdG4ub2ZmKCdjbGljaycpO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIEV2ZW50LWhhbmRsZSBmb3IgZGVsZXRlIGJ1dHRvbiBjbGlja2VkLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uQ2xpY2tFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZmlyZSgncmVtb3ZlJywge1xuICAgICAgICAgICAgZmlsZW5hbWUgOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICBpZCA6IHRoaXMuX2lkLFxuICAgICAgICAgICAgdHlwZTogJ3JlbW92ZSdcbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG5cbm5lLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKEl0ZW0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEl0ZW07IiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZpbGVMaXN0VmlldyBtYW5hZ2UgYW5kIGRpc3BsYXkgZmlsZXMgc3RhdGUobGlrZSBzaXplLCBjb3VudCkgYW5kIGxpc3QuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGUwMjQyQG5obmVudC5jb20+XG4gKi9cblxudmFyIHN0YXRpYyA9IHJlcXVpcmUoJy4uL3N0YXRpY3MuanMnKTtcbnZhciBJdGVtID0gcmVxdWlyZSgnLi9pdGVtLmpzJyk7XG5cbi8qKlxuICogTGlzdCBoYXMgaXRlbXMuIEl0IGNhbiBhZGQgYW5kIHJlbW92ZSBpdGVtLCBhbmQgZ2V0IHRvdGFsIHVzYWdlLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZhciBMaXN0ID0gbmUudXRpbC5kZWZpbmVDbGFzcygvKiogQGxlbmRzIG5lLmNvbXBvbmVudC5VcGxvYWRlci5MaXN0LnByb3RvdHlwZSAqL3tcbiAgICBpbml0IDogZnVuY3Rpb24ob3B0aW9ucywgdXBsb2FkZXIpIHtcbiAgICAgICAgdmFyIGxpc3RJbmZvID0gb3B0aW9ucy5saXN0SW5mbztcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdO1xuICAgICAgICB0aGlzLiRlbCA9IGxpc3RJbmZvLmxpc3Q7XG4gICAgICAgIHRoaXMuJGNvdW50ZXIgPSBsaXN0SW5mby5jb3VudDtcbiAgICAgICAgdGhpcy4kc2l6ZSA9IGxpc3RJbmZvLnNpemU7XG4gICAgICAgIHRoaXMuX3VwbG9hZGVyID0gdXBsb2FkZXI7XG5cbiAgICAgICAgbmUudXRpbC5leHRlbmQodGhpcywgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBpdGVtIGxpc3RcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gaW5mbyBBIGluZm9ybWF0aW9uIHRvIHVwZGF0ZSBsaXN0LlxuICAgICAqICBAcGFyYW0ge2FycmF5fSBpbmZvLml0ZW1zIFRoZSBsaXN0IG9mIGZpbGUgaW5mb3JtYXRpb24uXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBbaW5mby5hY3Rpb25dIFRoZSBhY3Rpb24gdG8gZG8uXG4gICAgICovXG4gICAgdXBkYXRlOiBmdW5jdGlvbihpbmZvKSB7XG4gICAgICAgIGlmIChpbmZvLmFjdGlvbiA9PT0gJ3JlbW92ZScpIHtcbiAgICAgICAgICAgIHRoaXMuaXRlbXMgPSBuZS51dGlsLmZpbHRlcih0aGlzLml0ZW1zLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRlY29kZVVSSUNvbXBvbmVudChpbmZvLm5hbWUpID09PSBkZWNvZGVVUklDb21wb25lbnQoaXRlbS5uYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fYWRkRmlsZXMoaW5mby5pdGVtcyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGl0ZW1zIHRvdGFsIGNvdW50LCB0b3RhbCBzaXplIGluZm9ybWF0aW9uLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBpbmZvIEEgaW5mb3JtYXRpb24gdG8gdXBkYXRlIGxpc3QuXG4gICAgICogIEBwYXJhbSB7YXJyYXl9IGluZm8uaXRlbXMgVGhlIGxpc3Qgb2YgZmlsZSBpbmZvcm1hdGlvbi5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IGluZm8uc2l6ZSBUaGUgdG90YWwgc2l6ZS5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IGluZm8uY291bnQgVGhlIGNvdW50IG9mIGZpbGVzLlxuICAgICAqL1xuICAgIHVwZGF0ZVRvdGFsSW5mbzogZnVuY3Rpb24oaW5mbykge1xuICAgICAgICB0aGlzLl91cGRhdGVUb3RhbENvdW50KGluZm8uY291bnQpO1xuICAgICAgICB0aGlzLl91cGRhdGVUb3RhbFVzYWdlKGluZm8uc2l6ZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBpdGVtcyB0b3RhbCBjb3VudCBhbmQgcmVmcmVzaCBlbGVtZW50XG4gICAgICogQHBhcmFtIHsobnVtYmVyfHN0cmluZyl9IFtjb3VudF0gVG90YWwgZmlsZSBjb3VudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwZGF0ZVRvdGFsQ291bnQ6IGZ1bmN0aW9uKGNvdW50KSB7XG5cbiAgICAgICAgaWYgKCFuZS51dGlsLmlzRXhpc3R5KGNvdW50KSkge1xuICAgICAgICAgICAgY291bnQgPSB0aGlzLml0ZW1zLmxlbmd0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuJGNvdW50ZXIuaHRtbChjb3VudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBpdGVtcyB0b3RhbCBzaXplIGFuZCByZWZyZXNoIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0geyhudW1iZXJ8c3RyaW5nKX0gc2l6ZSBUb3RhbCBmaWxlcyBzaXplc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3VwZGF0ZVRvdGFsVXNhZ2U6IGZ1bmN0aW9uKHNpemUpIHtcblxuICAgICAgICBpZiAoIW5lLnV0aWwuaXNFeGlzdHkoc2l6ZSkpIHtcbiAgICAgICAgICAgIHNpemUgPSB0aGlzLl9nZXRTdW1BbGxJdGVtVXNhZ2UoKTtcbiAgICAgICAgfVxuICAgICAgICBzaXplID0gc3RhdGljLmdldEZpbGVTaXplV2l0aFVuaXQoc2l6ZSk7XG4gICAgICAgIHRoaXMuJHNpemUuaHRtbChzaXplKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3VtIHNpemVzIG9mIGFsbCBpdGVtcy5cbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRTdW1BbGxJdGVtVXNhZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaXRlbXMgPSB0aGlzLml0ZW1zLFxuICAgICAgICAgICAgdG90YWxVc2FnZSA9IDA7XG5cbiAgICAgICAgbmUudXRpbC5mb3JFYWNoKGl0ZW1zLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICB0b3RhbFVzYWdlICs9IHBhcnNlRmxvYXQoaXRlbS5zaXplKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRvdGFsVXNhZ2U7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBmaWxlIGl0ZW1zXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHRhcmdldCBUYXJnZXQgaXRlbSBpbmZvbWF0aW9ucy5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRGaWxlczogZnVuY3Rpb24odGFyZ2V0KSB7XG4gICAgICAgIGlmICghbmUudXRpbC5pc0FycmF5KHRhcmdldCkpIHtcbiAgICAgICAgICAgIHRhcmdldCA9IFt0YXJnZXRdO1xuICAgICAgICB9XG4gICAgICAgIG5lLnV0aWwuZm9yRWFjaCh0YXJnZXQsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCh0aGlzLl9jcmVhdGVJdGVtKGRhdGEpKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBpdGVtIEJ5IERhdGFcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YVxuICAgICAqIEByZXR1cm5zIHtJdGVtfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NyZWF0ZUl0ZW06IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIGl0ZW0gPSBuZXcgSXRlbSh7XG4gICAgICAgICAgICByb290OiB0aGlzLFxuICAgICAgICAgICAgbmFtZTogZGF0YS5uYW1lLFxuICAgICAgICAgICAgc2l6ZTogZGF0YS5zaXplLFxuICAgICAgICAgICAgZGVsZXRlQnV0dG9uQ2xhc3NOYW1lOiB0aGlzLmRlbGV0ZUJ1dHRvbkNsYXNzTmFtZSxcbiAgICAgICAgICAgIHVybDogdGhpcy51cmwsXG4gICAgICAgICAgICBoaWRkZW5GcmFtZTogdGhpcy5mb3JtVGFyZ2V0LFxuICAgICAgICAgICAgaGlkZGVuRmllbGROYW1lOiB0aGlzLmhpZGRlbkZpZWxkTmFtZSxcbiAgICAgICAgICAgIHRlbXBsYXRlOiB0aGlzLnRlbXBsYXRlICYmIHRoaXMudGVtcGxhdGUuaXRlbVxuICAgICAgICB9KTtcbiAgICAgICAgaXRlbS5vbigncmVtb3ZlJywgdGhpcy5fcmVtb3ZlRmlsZSwgdGhpcyk7XG4gICAgICAgIHJldHVybiBpdGVtO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayBSZW1vdmUgRmlsZVxuICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVtb3ZlRmlsZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZScsIGRhdGEpO1xuICAgIH1cbn0pO1xuXG5uZS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihMaXN0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBMaXN0OyJdfQ==
