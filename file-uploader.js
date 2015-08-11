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

var AbstractConnector = {

    send: function(options) {
        if (options.type === 'remove') {
            this.removeRequest(options);
        } else {
            this.addRequest(options);
        }
    },

    removeRequest: function(options) {

    },

    addRequest: function() {

    }

};

var connFactory = {
    getConnector: function(uploader) {

        var type = uploader.type.toLowerCase(),
            conn = ne.util.extend({
                _uploader: uploader
            }, AbstractConnector, ModuleSets[type] || Local);

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9qcy9jb25uZWN0b3IvYWpheC5qcyIsInNyYy9qcy9jb25uZWN0b3IvY29ubmVjdG9yLmpzIiwic3JjL2pzL2Nvbm5lY3Rvci9qc29ucC5qcyIsInNyYy9qcy9jb25uZWN0b3IvbG9jYWwuanMiLCJzcmMvanMvc3RhdGljcy5qcyIsInNyYy9qcy91cGxvYWRlci5qcyIsInNyYy9qcy92aWV3L2lucHV0LmpzIiwic3JjL2pzL3ZpZXcvaXRlbS5qcyIsInNyYy9qcy92aWV3L2xpc3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibmUudXRpbC5kZWZpbmVOYW1lc3BhY2UoJ25lLmNvbXBvbmVudC5VcGxvYWRlcicsIHJlcXVpcmUoJy4vc3JjL2pzL3VwbG9hZGVyLmpzJykpO1xuXG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgVGhpcyBDb25uZWN0b3IgbWFrZSBjb25uZWN0aW9uIGJldHdlZW4gRmlsZU1hbmFnZXIgYW5kIGZpbGUgc2VydmVyIGFwaSBhdCBtb2Rlcm4gYnJvd3Nlci48YnI+XG4gKiAgICAgVGhpcyBDb25uZWN0b3IgdXNlIGFqYXguXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGUwMjQyQG5obmVudC5jb20+XG4gKi9cblxuLyoqXG4gKiBUaGUgbW9kdWxlcyB3aWxsIGJlIG1peGVkIGluIGNvbm5lY3RvciBieSB0eXBlLlxuICovXG52YXIgQWpheCA9IHsvKiogQGxlbmRzIG5lLmNvbXBvbmVudC5VcGxvYWRlci5BamF4ICovXG4gICAgdHlwZTogJ1BPU1QnLFxuICAgIC8qKlxuICAgICAqIFJlcXVlc3QgYWpheCBieSBjb25maWcgdG8gYWRkIGZpbGVzLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWcgVGhlIGNvbmZpZ3VyYXRpb24gZm9yIGFqYXggcmVxdWVzdFxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gY29uZmlnLnVybCBSZXF1ZXN0IHVybCh1cGxvYWQgdXJsIG9yIHJlbW92ZSB1cmwpXG4gICAgICogIEBwYXJhbSB7ZnVuY3Rpb259IGNvbmZpZy5zdWNjZXNzIENhbGxiYWNrIGZ1bmN0aW9uIHdoZW4gcmVxdWVzdCBzdWNlZXNzLlxuICAgICAqICBAcGFyYW0ge2Z1bmN0aW9ufSBjb25maWcuZXJyb3IgQ2FsbGJhY2sgZnVuY3Rpb24gd2hlbiByZXF1ZXN0IGZhaWxkLlxuICAgICAqL1xuICAgIGFkZFJlcXVlc3Q6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgICB2YXIgJGZvcm0gPSB0aGlzLl91cGxvYWRlci5pbnB1dFZpZXcuJGVsLFxuICAgICAgICAgICAgY2FsbGJhY2sgPSBuZS51dGlsLmJpbmQodGhpcy5zdWNjZXNzUGFkZGluZywgdGhpcywgY29uZmlnLnN1Y2Nlc3MpO1xuICAgICAgICB0aGlzLmZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCRmb3JtWzBdKTtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogdGhpcy5fdXBsb2FkZXIudXJsLnNlbmQsXG4gICAgICAgICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICAgICAgICBkYXRhOiB0aGlzLmZvcm1EYXRhLFxuICAgICAgICAgICAgc3VjY2VzczogY2FsbGJhY2ssXG4gICAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgICBjb250ZW50VHlwZTogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogY29uZmlnLmVycm9yXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcmVwcm9jZXNzaW5nIGNhbGxiYWNrIGJlZm9yZSBjYWxsYmFjayBydW4uXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgUmVxdWVzdCBDYWxsYmFjayBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSBSZXNwb25zZSBmcm9tIHNlcnZlclxuICAgICAqL1xuICAgIHN1Y2Nlc3NQYWRkaW5nOiBmdW5jdGlvbihjYWxsYmFjaywgcmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIGpzb24gPSBKU09OLnBhcnNlKHJlc3BvbnNlKSxcbiAgICAgICAgICAgIHJlc3VsdCA9IHt9O1xuXG4gICAgICAgIHJlc3VsdC5pdGVtcyA9IGpzb24uZmlsZWxpc3Q7XG4gICAgICAgIGNhbGxiYWNrKHJlc3VsdCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlcXVlc3QgYWpheCBieSBjb25maWcgdG8gcmVtb3ZlIGZpbGUuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGNvbmZpZ1xuICAgICAqL1xuICAgIHJlbW92ZVJlcXVlc3Q6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBuZS51dGlsLmJpbmQodGhpcy5yZW1vdmVQYWRkaW5nLCB0aGlzLCBjb25maWcuc3VjY2Vzcyk7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHRoaXMuX3VwbG9hZGVyLnVybC5yZW1vdmUsXG4gICAgICAgICAgICBkYXRhOiBjb25maWcuZGF0YSxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGNhbGxiYWNrLFxuICAgICAgICAgICAgZXJyb3I6IGNvbmZpZy5lcnJvclxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJlcHJvY2Vzc2luZyByZXNwb25zZSBiZWZvcmUgY2FsbGJhY2sgcnVuLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFJlcXVlc3QgQ2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgUmVzcG9uc2UgZnJvbSBzZXJ2ZXJcbiAgICAgKi9cbiAgICByZW1vdmVQYWRkaW5nOiBmdW5jdGlvbihjYWxsYmFjaywgcmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIGpzb24gPSBKU09OLnBhcnNlKHJlc3BvbnNlKSxcbiAgICAgICAgICAgIHJlc3VsdCA9IHt9O1xuXG4gICAgICAgIHJlc3VsdC5hY3Rpb24gPSAncmVtb3ZlJztcbiAgICAgICAgcmVzdWx0Lm5hbWUgPSBkZWNvZGVVUklDb21wb25lbnQoanNvbi5uYW1lKTtcblxuICAgICAgICBjYWxsYmFjayhyZXN1bHQpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQWpheDsiLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgQSBDb25uZWN0b3IgbWFrZSBjb25uZWN0aW9uIGJldHdlZW4gRmlsZU1hbmFnZXIgYW5kIGZpbGUgc2VydmVyIEFQSS48YnI+IFRoZSBDb25uZWN0b3IgaXMgaW50ZXJmYWNlLlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxlMDI0MkBuaG5lbnQuY29tPlxuICovXG5cbnZhciBBamF4ID0gcmVxdWlyZSgnLi9hamF4LmpzJyk7XG52YXIgSnNvbnAgPSByZXF1aXJlKCcuL2pzb25wLmpzJyk7XG52YXIgTG9jYWwgPSByZXF1aXJlKCcuL2xvY2FsLmpzJyk7XG5cbi8qKlxuICogVGhlIGNvbm5lY3RvciBjbGFzcyBjb3VsZCBjb25uZWN0IHdpdGggc2VydmVyIGFuZCByZXR1cm4gc2VydmVyIHJlc3BvbnNlIHRvIGNhbGxiYWNrLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbi8vdmFyIENvbm5lY3RvciA9IG5lLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBuZS5jb21wb25lbnQuVXBsb2FkZXIuQ29ubmVjdG9yLnByb3RvdHlwZSAqL3tcbi8vICAgIGluaXQ6IGZ1bmN0aW9uKHVwbG9hZGVyKSB7XG4vLyAgICAgICAgdmFyIHR5cGUgPSB1cGxvYWRlci50eXBlLnRvTG93ZXJDYXNlKCk7XG4vL1xuLy8gICAgICAgIC8qKlxuLy8gICAgICAgICAqIFRoZSB1cGxvYWRlciBjb3JlXG4vLyAgICAgICAgICogQHR5cGUgbmUuY29tcG9uZW50LlVwbG9hZGVyXG4vLyAgICAgICAgICovXG4vLyAgICAgICAgdGhpcy5fdXBsb2FkZXIgPSB1cGxvYWRlcjtcbi8vICAgICAgICAvKipcbi8vICAgICAgICAgKiBUaGUgY29ubmVjdG9yIG1vZHVsZSBzZXRcbi8vICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuLy8gICAgICAgICAqL1xuLy8gICAgICAgIHRoaXMuY29ubiA9IE1vZHVsZVNldHNbdHlwZV0gfHwgTG9jYWw7XG4vLyAgICB9LFxuLy9cbi8vICAgIC8qKlxuLy8gICAgICogU2VuZCByZXF1ZXN0XG4vLyAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xuLy8gICAgICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnR5cGUgVHlwZSBvZiByZXF1ZXN0XG4vLyAgICAgKi9cbi8vICAgIHNlbmQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbi8vICAgICAgICBpZiAob3B0aW9ucy50eXBlID09PSAncmVtb3ZlJykge1xuLy8gICAgICAgICAgICB0aGlzLmNvbm4ucmVtb3ZlUmVxdWVzdChvcHRpb25zKTtcbi8vICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgICB0aGlzLmNvbm4uYWRkUmVxdWVzdChvcHRpb25zKTtcbi8vICAgICAgICB9XG4vLyAgICB9LFxuLy9cbi8vICAgIC8qKlxuLy8gICAgICogTWl4aW4gd2l0aCBzZWxlY3RlZCBjb25uZWN0b3Jcbi8vICAgICAqIEBwYXJhbSB7b2JqZWN0fSBjb25uZWN0b3Jcbi8vICAgICAqL1xuLy8gICAgbWl4aW46IGZ1bmN0aW9uKGNvbm5lY3Rvcikge1xuLy8gICAgICAgIG5lLnV0aWwuZXh0ZW5kKHRoaXMsIGNvbm5lY3Rvcik7XG4vLyAgICB9XG4vL30pO1xuXG52YXIgTW9kdWxlU2V0cyA9IHtcbiAgICAnYWpheCc6IEFqYXgsXG4gICAgJ2pzb25wJzogSnNvbnAsXG4gICAgJ2xvY2FsJzogTG9jYWxcbn07XG5cbnZhciBBYnN0cmFjdENvbm5lY3RvciA9IHtcblxuICAgIHNlbmQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMudHlwZSA9PT0gJ3JlbW92ZScpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlUmVxdWVzdChvcHRpb25zKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYWRkUmVxdWVzdChvcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZW1vdmVSZXF1ZXN0OiBmdW5jdGlvbihvcHRpb25zKSB7XG5cbiAgICB9LFxuXG4gICAgYWRkUmVxdWVzdDogZnVuY3Rpb24oKSB7XG5cbiAgICB9XG5cbn07XG5cbnZhciBjb25uRmFjdG9yeSA9IHtcbiAgICBnZXRDb25uZWN0b3I6IGZ1bmN0aW9uKHVwbG9hZGVyKSB7XG5cbiAgICAgICAgdmFyIHR5cGUgPSB1cGxvYWRlci50eXBlLnRvTG93ZXJDYXNlKCksXG4gICAgICAgICAgICBjb25uID0gbmUudXRpbC5leHRlbmQoe1xuICAgICAgICAgICAgICAgIF91cGxvYWRlcjogdXBsb2FkZXJcbiAgICAgICAgICAgIH0sIEFic3RyYWN0Q29ubmVjdG9yLCBNb2R1bGVTZXRzW3R5cGVdIHx8IExvY2FsKTtcblxuICAgICAgICByZXR1cm4gY29ubjtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbm5GYWN0b3J5O1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFRoaXMgQ29ubmVjdG9yIG1ha2UgY29ubmVjdGlvbiBiZXR3ZWVuIEZpbGVNYW5hZ2VyIGFuZCBmaWxlIHNlcnZlciBhcGkgYXQgb2xkIGJyb3dzZXIuPGJyPlxuICogICAgIFRoaXMgQ29ubmVjdG9yIHVzZSBoaWRkZW4gaWZyYW1lLlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxlMDI0MkBuaG5lbnQuY29tPlxuICovXG5cbi8qKlxuICogVGhlIG1vZHVsZXMgd2lsbCBiZSBtaXhlZCBpbiBjb25uZWN0b3IgYnkgdHlwZS5cbiAqL1xudmFyIEpzb25wID0gey8qKiBAbGVuZHMgbmUuY29tcG9uZW50LlVwbG9hZGVyLkpzb25wICovXG4gICAgLyoqXG4gICAgICogUmVxdWVzdCBieSBmb3JtIHN1Ym1pdC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gY29uZmlnIENvbmZpZ3VyYXRpb24gZm9yIHN1Ym1pdCBmb3JtLlxuICAgICAqICBAcGFyYW0ge2Z1bmN0aW9ufSBjb25maWcuc3VjY2VzcyBDYWxsYmFjayB3aGVuIHBvc3Qgc3VibWl0IGNvbXBsYXRlLlxuICAgICAqL1xuICAgIGFkZFJlcXVlc3Q6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgICB2YXIgY2FsbGJhY2tOYW1lID0gdGhpcy5fdXBsb2FkZXIuY2FsbGJhY2tOYW1lLFxuICAgICAgICBjYWxsYmFjayA9IGNvbmZpZy5zdWNjZXNzO1xuICAgICAgICBuZS51dGlsLmRlZmluZU5hbWVzcGFjZShjYWxsYmFja05hbWUsICBuZS51dGlsLmJpbmQodGhpcy5zdWNjZXNzUGFkZGluZywgdGhpcywgY2FsbGJhY2spKTtcblxuICAgICAgICB0aGlzLl91cGxvYWRlci5pbnB1dFZpZXcuJGVsLnN1Ym1pdCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcmVwcm9jZXNzaW5nIHJlc3BvbnNlIGJlZm9yZSBjYWxsYmFjayBydW4uXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgUmVxdWVzdCBDYWxsYmFjayBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSBSZXNwb25zZSBmcm9tIHNlcnZlclxuICAgICAqL1xuICAgIHN1Y2Nlc3NQYWRkaW5nOiBmdW5jdGlvbihjYWxsYmFjaywgcmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuXG4gICAgICAgIGlmICh0aGlzLl91cGxvYWRlci5pc0Nyb3NzRG9tYWluKCkpIHtcbiAgICAgICAgICAgIHJlc3VsdC5pdGVtcyA9IHRoaXMuX2dldFNwbGl0SXRlbXMocmVzcG9uc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0Lml0ZW1zID0gcmVzcG9uc2UuZmlsZWxpc3Q7XG4gICAgICAgIH1cblxuICAgICAgICBjYWxsYmFjayhyZXN1bHQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIHF1ZXJ5IGRhdGEgdG8gYXJyYXlcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBUaGUgRGF0YSBleHRyYWN0ZWQgZnJvbSBxdWVyeXN0cmluZyBzZXBhcmF0ZWQgYnkgJyYnXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0U3BsaXRJdGVtczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgc2VwID0gdGhpcy5fdXBsb2FkZXIuc2VwYXJhdG9yLFxuICAgICAgICAgICAgc3RhdHVzID0gZGF0YS5zdGF0dXMuc3BsaXQoc2VwKSxcbiAgICAgICAgICAgIG5hbWVzID0gZGF0YS5uYW1lcy5zcGxpdChzZXApLFxuICAgICAgICAgICAgc2l6ZXMgPSBkYXRhLnNpemVzLnNwbGl0KHNlcCksXG4gICAgICAgICAgICBpZHMgPSBuZS51dGlsLmlzU3RyaW5nKGRhdGEuaWRzKSA/IGRhdGEuaWRzLnNwbGl0KHNlcCkgOiBuYW1lcyxcbiAgICAgICAgICAgIGl0ZW1zID0gW107XG5cbiAgICAgICAgbmUudXRpbC5mb3JFYWNoKHN0YXR1cywgZnVuY3Rpb24oaXRlbSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmIChpdGVtID09PSAnc3VjY2VzcycpIHtcbiAgICAgICAgICAgICAgICB2YXIgbkl0ZW0gPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IG5hbWVzW2luZGV4XSxcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBzdGF0dXNbaW5kZXhdLFxuICAgICAgICAgICAgICAgICAgICBzaXplOiBzaXplc1tpbmRleF0sXG4gICAgICAgICAgICAgICAgICAgIGlkOiBpZHNbaW5kZXhdXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpdGVtcy5wdXNoKG5JdGVtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBpdGVtcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVxdWVzdCBhamF4IGJ5IGNvbmZpZyB0byByZW1vdmUgZmlsZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gY29uZmlnXG4gICAgICovXG4gICAgcmVtb3ZlUmVxdWVzdDogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICAgIHZhciBjYWxsYmFja05hbWUgPSB0aGlzLl91cGxvYWRlci5jYWxsYmFja05hbWUsXG4gICAgICAgICAgICBkYXRhID0ge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBjYWxsYmFja05hbWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjYWxsYmFjayA9IGNvbmZpZy5zdWNjZXNzO1xuXG4gICAgICAgIG5lLnV0aWwuZGVmaW5lTmFtZXNwYWNlKGNhbGxiYWNrTmFtZSwgbmUudXRpbC5iaW5kKHRoaXMucmVtb3ZlUGFkZGluZywgdGhpcywgY2FsbGJhY2spLCB0cnVlKTtcblxuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiB0aGlzLl91cGxvYWRlci51cmwucmVtb3ZlLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29ucCcsXG4gICAgICAgICAgICBqc29ucDogY2FsbGJhY2tOYW1lLFxuICAgICAgICAgICAgZGF0YTogbmUudXRpbC5leHRlbmQoZGF0YSwgY29uZmlnLmRhdGEpXG4gICAgICAgIH0pO1xuXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByZXByb2Nlc3NpbmcgcmVzcG9uc2UgYmVmb3JlIGNhbGxiYWNrIHJ1bi5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBSZXF1ZXN0IENhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHJlc3BvbnNlIFJlc3BvbnNlIGZyb20gc2VydmVyXG4gICAgICovXG4gICAgcmVtb3ZlUGFkZGluZzogZnVuY3Rpb24oY2FsbGJhY2ssIHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgICAgcmVzdWx0LmFjdGlvbiA9ICdyZW1vdmUnO1xuICAgICAgICByZXN1bHQubmFtZSA9IGRlY29kZVVSSUNvbXBvbmVudChyZXNwb25zZS5uYW1lKTtcblxuICAgICAgICBjYWxsYmFjayhyZXN1bHQpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSnNvbnA7XG4iLCIvKipcbiAqIEBmaWxlb3ZldmlldyBUaGlzIENvbm5lY3RvciBtYWtlIGNvbm5lY3Rpb24gYmV0d2VlbiBVcGxvYWRlciBhbmQgaHRtbDUgZmlsZSBhcGkuXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGUwMjQyQG5obmVudC5jb20+XG4gKi9cbnZhciBzdGF0aWNzID0gcmVxdWlyZSgnLi4vc3RhdGljcy5qcycpO1xuXG4vKipcbiAqIFRoZSBtb2R1bGVzIHdpbGwgYmUgbWl4ZWQgaW4gY29ubmVjdG9yIGJ5IHR5cGUuXG4gKi9cbnZhciBMb2NhbCA9IHsvKiogQGxlbmRzIG5lLmNvbXBvbmVudC5VcGxvYWRlci5Mb2NhbCAqL1xuICAgIC8qKlxuICAgICAqIEFkZCBSZXF1ZXN0LCBzYXZlIGZpbGVzIHRvIGFycmF5LlxuICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICovXG4gICAgYWRkUmVxdWVzdDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB0aGlzLl9zYXZlRmlsZShzdGF0aWNzLmlzU3VwcG9ydEZvcm1EYXRhKCkpO1xuICAgICAgICBkYXRhLnN1Y2Nlc3Moe1xuICAgICAgICAgICAgaXRlbXM6IHRoaXMuX3Jlc3VsdCxcbiAgICAgICAgICAgIGlzUmVzZXQ6IHRydWVcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNhdmUgZmlsZSB0byBwb29sXG4gICAgICogQHBhcmFtIHtib29sZWFufSBpc1N1cHBvcnRBamF4IFdoZXRoZXIgRm9ybURhdGEgaXMgc3VwcG9ydGVkIG9yIG5vdFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NhdmVGaWxlOiBmdW5jdGlvbihpc1N1cHBvcnRBamF4KSB7XG4gICAgICAgIHZhciB1cGxvYWRlciA9IHRoaXMuX3VwbG9hZGVyLFxuICAgICAgICAgICAgaW5wdXRWaWV3ID0gdXBsb2FkZXIuaW5wdXRWaWV3LFxuICAgICAgICAgICAgZmlsZUVsID0gaW5wdXRWaWV3LiRpbnB1dFswXSxcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xuXG4gICAgICAgIGlmIChpc1N1cHBvcnRBamF4KSB7XG4gICAgICAgICAgICBuZS51dGlsLmZvckVhY2goZmlsZUVsLmZpbGVzLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goaXRlbSk7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHtcbiAgICAgICAgICAgICAgICBuYW1lOiBmaWxlRWwudmFsdWUsXG4gICAgICAgICAgICAgICAgZWxlbWVudDogZmlsZUVsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3Jlc3VsdCA9IHJlc3VsdDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSBmb3JtIGRhdGEgdG8gc2VuZCBQT1NUKEZvcm1EYXRlIHN1cHBvcnRlZCBjYXNlKVxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX21ha2VGb3JtRGF0YSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdXBsb2FkZXIgPSB0aGlzLl91cGxvYWRlcixcbiAgICAgICAgICAgIGZvcm0gPSBuZXcgd2luZG93LkZvcm1EYXRhKHVwbG9hZGVyLmlucHV0Vmlldy4kZWxbMF0pO1xuICAgICAgICBuZS51dGlsLmZvckVhY2godGhpcy5fcmVzdWx0LCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICBmb3JtLmFwcGVuZCh1cGxvYWRlci5maWxlRmllbGQsIGl0ZW0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGZvcm07XG4gICAgfSxcblxuICAgIHJlbW92ZVJlcXVlc3Q6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ3JlbW92ZScsIGRhdGEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZW5kIGZpbGVzIGluIGEgYmF0Y2guXG4gICAgICogQHBhcmFtIGNhbGxiYWNrXG4gICAgICovXG4gICAgc3VibWl0OiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB2YXIgZm9ybSA9IHRoaXMuX21ha2VGb3JtRGF0YSgpO1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiB0aGlzLl91cGxvYWRlci51cmwuc2VuZCxcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgIGRhdGE6IGZvcm0sXG4gICAgICAgICAgICBzdWNjZXNzOiBjYWxsYmFjayxcbiAgICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBmYWxzZVxuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IExvY2FsOyIsIi8qKlxuICogQGZpbGVvdmVydmlldyBDb25maWd1cmF0aW9uIG9yIGRlZmF1bHQgdmFsdWVzLlxuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxlMDI0MkBuaG5lbnQuY29tPlxuICovXG5cbi8qKlxuICogQ29uZmlndXJhdGlvbiBvZiBjb25uZWN0aW9uIHdpdGggc2VydmVyLlxuICAqIEB0eXBlIHt7UkVTUE9OU0VfVFlQRTogc3RyaW5nLCBSRURJUkVDVF9VUkw6IHN0cmluZ319XG4gKi9cbm1vZHVsZS5leHBvcnRzLkNPTkYgPSB7XG4gICAgUkVTUE9OU0VfVFlQRTogJ1JFU1BPTlNFX1RZUEUnLFxuICAgIFJFRElSRUNUX1VSTDogJ1JFRElSRUNUX1VSTCcsXG4gICAgSlNPTlBDQUxMQkFDS19OQU1FOiAnQ0FMTEJBQ0tfTkFNRScsXG4gICAgU0laRV9VTklUOiAnU0laRV9VTklUJyxcbiAgICBSRU1PVkVfQ0FMTEJBQ0sgOiAncmVzcG9uc2VSZW1vdmVDYWxsYmFjaycsXG4gICAgRVJST1I6IHtcbiAgICAgICAgREVGQVVMVDogJ1Vua25vd24gZXJyb3IuJyxcbiAgICAgICAgTk9UX1NVUlBQT1JUOiAnVGhpcyBpcyB4LWRvbWFpbiBjb25uZWN0aW9uLCB5b3UgaGF2ZSB0byBtYWtlIGhlbHBlciBwYWdlLidcbiAgICB9LFxuICAgIEZJTEVfRklMRURfTkFNRTogJ3VzZXJmaWxlW10nXG59O1xuXG4vKipcbiAqIERlZmF1bHQgSHRtbHNcbiAqIEB0eXBlIHt7aW5wdXQ6IHN0cmluZywgaXRlbTogc3RyaW5nfX1cbiAqL1xubW9kdWxlLmV4cG9ydHMuSFRNTCA9IHtcbiAgICBpbnB1dCA6IFsnPGZvcm0gZW5jdHlwZT1cIm11bHRpcGFydC9mb3JtLWRhdGFcIiBpZD1cImZvcm1EYXRhXCIgbWV0aG9kPVwicG9zdFwiPicsXG4gICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cIk1BWF9GSUxFX1NJWkVcIiB2YWx1ZT1cIjMwMDAwMDBcIiAvPicsXG4gICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwiZmlsZVwiIGlkPVwiZmlsZUF0dGFjaFwiIG5hbWU9XCJ7e2ZpbGVGaWVsZH19XCIgbXVsdGlwbGU9XCJ0cnVlXCIgLz4nLFxuICAgICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPVwiYmF0Y2hTdWJtaXRcIiB0eXBlPVwic3VibWl0XCI+U0VORDwvYnV0dG9uPicsXG4gICAgICAgICAgICAnPC9mb3JtPiddLmpvaW4oJycpLFxuICAgIGl0ZW0gOiBbJzxsaSBjbGFzcz1cImZpbGV0eXBlRGlzcGxheUNsYXNzXCI+JyxcbiAgICAgICAgICAgICAgICAnPHNwbmEgY2xhc3M9XCJmaWxlaWNvbiB7e2ZpbGV0eXBlfX1cIj57e2ZpbGV0eXBlfX08L3NwbmE+JyxcbiAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJmaWxlX25hbWVcIj57e2ZpbGVuYW1lfX08L3NwYW4+JyxcbiAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJmaWxlX3NpemVcIj57e2ZpbGVzaXplfX08L3NwYW4+JyxcbiAgICAgICAgICAgICAgICAnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJ7e2RlbGV0ZUJ1dHRvbkNsYXNzTmFtZX19XCI+RGVsZXRlPC9idXR0b24+JyxcbiAgICAgICAgICAgICc8L2xpPiddLmpvaW4oJycpXG59O1xuXG4vKipcbiAqIEV4dHJhY3QgdW5pdCBmb3IgZmlsZSBzaXplXG4gKiBAcGFyYW0ge251bWJlcn0gc2l6ZSBBIHVzYWdlIG9mIGZpbGVcbiAqL1xubW9kdWxlLmV4cG9ydHMuZ2V0RmlsZVNpemVXaXRoVW5pdCA9IGZ1bmN0aW9uKGJ5dGVzKSB7XG4gICAgdmFyIHVuaXRzID0gWydCJywgJ0tCJywgJ01CJywgJ0dCJywgJ1RCJ10sXG4gICAgICAgIGJ5dGVzID0gcGFyc2VJbnQoYnl0ZXMsIDEwKSxcbiAgICAgICAgZXhwID0gTWF0aC5sb2coYnl0ZXMpIC8gTWF0aC5sb2coMTAyNCkgfCAwLFxuICAgICAgICByZXN1bHQgPSAoYnl0ZXMgLyBNYXRoLnBvdygxMDI0LCBleHApKS50b0ZpeGVkKDIpO1xuXG4gICAgcmV0dXJuIHJlc3VsdCArIHVuaXRzW2V4cF07XG59O1xuXG4vKipcbiAqIFdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydCBGb3JtRGF0YSBvciBub3RcbiAqL1xubW9kdWxlLmV4cG9ydHMuaXNTdXBwb3J0Rm9ybURhdGEgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgRm9ybURhdGEgPSAod2luZG93LkZvcm1EYXRhIHx8IG51bGwpO1xuICAgIHJldHVybiAhIUZvcm1EYXRhO1xufTtcblxuLyoqXG4gKiBHZXQgaXRlbSBlbGVtZW4gSFRNTFxuICogQHBhcmFtIHtzdHJpbmd9IGh0bWwgSFRNTCB0ZW1wbGF0ZVxuICogQHJldHVybnMge3N0cmluZ31cbiAqIEBwcml2YXRlXG4gKi9cbm1vZHVsZS5leHBvcnRzLnRlbXBsYXRlID0gZnVuY3Rpb24obWFwLCBodG1sKSB7XG4gICAgaHRtbCA9IGh0bWwucmVwbGFjZSgvXFx7XFx7KFteXFx9XSspXFx9XFx9L2csIGZ1bmN0aW9uKG1zdHIsIG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIG1hcFtuYW1lXTtcbiAgICB9KTtcbiAgICByZXR1cm4gaHRtbDtcbn07IiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZpbGVVcGxvYWRlciBpcyBjb3JlIG9mIGZpbGUgdXBsb2FkZXIgY29tcG9uZW50Ljxicj5GaWxlTWFuYWdlciBtYW5hZ2UgY29ubmVjdG9yIHRvIGNvbm5lY3Qgc2VydmVyIGFuZCB1cGRhdGUgRmlsZUxpc3RWaWV3LlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxlMDI0MkBuaG5lbnQuY29tPlxuICovXG5cbnZhciBzdGF0aWMgPSByZXF1aXJlKCcuL3N0YXRpY3MuanMnKTtcbnZhciBjb25uID0gcmVxdWlyZSgnLi9jb25uZWN0b3IvY29ubmVjdG9yLmpzJyk7XG52YXIgSW5wdXQgPSByZXF1aXJlKCcuL3ZpZXcvaW5wdXQuanMnKTtcbnZhciBMaXN0ID0gcmVxdWlyZSgnLi92aWV3L2xpc3QuanMnKTtcblxuLyoqXG4gKiBGaWxlVXBsb2FkZXIgYWN0IGxpa2UgYnJpZGdlIGJldHdlZW4gY29ubmVjdG9yIGFuZCB2aWV3LlxuICogSXQgbWFrZXMgY29ubmVjdG9yIGFuZCB2aWV3IHdpdGggb3B0aW9uIGFuZCBlbnZpcm9ubWVudC5cbiAqIEl0IGNvbnRyb2wgYW5kIG1ha2UgY29ubmVjdGlvbiBhbW9uZyBtb2R1bGVzLlxuICogQGNvbnN0cnVjdG9yIG5lLmNvbXBvbmVudC5VcGxvYWRlclxuICogQGV4YW1wbGVcbiAqIHZhciB1cGxvYWRlciA9IG5ldyBuZS5jb21wb25lbnQuVXBsb2FkZXIoe1xuICogICAgIHVybDoge1xuICogICAgICAgICBzZW5kOiBcImh0dHA6Ly9mZS5uaG5lbnQuY29tL2V0Yy9ldGMvdXBsb2FkZXIvdXBsb2FkZXIucGhwXCIsXG4gKiAgICAgICAgIHJlbW92ZTogXCJodHRwOi8vZmUubmhuZW50LmNvbS9ldGMvZXRjL3VwbG9hZGVyL3JlbW92ZS5waHBcIlxuICogICAgIH0sXG4gKiAgICAgaGVscGVyOiB7XG4gKiAgICAgICAgIHVybDogJ2h0dHA6Ly8xMC43Ny4zNC4xMjY6ODAwOS9zYW1wbGVzL3Jlc3BvbnNlLmh0bWwnLFxuICogICAgICAgICBuYW1lOiAnUkVESVJFQ1RfVVJMJ1xuICogICAgIH0sXG4gKiAgICAgcmVzdWx0VHlwZUVsZW1lbnROYW1lOiAnUkVTUE9OU0VfVFlQRScsXG4gKiAgICAgZm9ybVRhcmdldDogJ2hpZGRlbkZyYW1lJyxcbiAqICAgICBjYWxsYmFja05hbWU6ICdyZXNwb25zZUNhbGxiYWNrJyxcbiAqICAgICBsaXN0SW5mbzoge1xuICogICAgICAgICBsaXN0OiAkKCcjZmlsZXMnKSxcbiAqICAgICAgICAgY291bnQ6ICQoJyNmaWxlX2NvdW50JyksXG4gKiAgICAgICAgIHNpemU6ICQoJyNzaXplX2NvdW50JylcbiAqICAgICB9LFxuICogICAgIHNlcGFyYXRvcjogJzsnXG4gKiB9LCAkKCcjdXBsb2FkZXInKSk7XG4gKi9cbnZhciBVcGxvYWRlciA9IG5lLnV0aWwuZGVmaW5lQ2xhc3MoLyoqQGxlbmRzIG5lLmNvbXBvbmVudC5VcGxvYWRlci5wcm90b3R5cGUgKi97XG5cbiAgICAvKipcbiAgICAgKiBpbml0aWFsaXplIG9wdGlvbnNcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBUaGUgb3B0aW9ucyB0byBzZXQgdXAgZmlsZSB1cGxvYWRlciBtb2R1bGVzLlxuICAgICAqICBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy51cmwgVGhlIHVybCBpcyBmaWxlIHNlcnZlci5cbiAgICAgKiAgICAgIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnVybC5zZW5kIFRoZSB1cmwgaXMgZm9yIGZpbGUgYXR0YWNoLlxuICAgICAqICAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMudXJsLnJlbW92ZSBUaGUgdXJsIGlzIGZvciBmaWxlIGRldGFjaC5cbiAgICAgKiAgQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMuaGVscGVyIFRoZSBoZWxwZXIgb2JqZWN0IGluZm8gaXMgZm9yIHgtZG9tYWluLlxuICAgICAqICAgICAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuaGVscGVyLnVybCBUaGUgdXJsIGlzIGhlbHBlciBwYWdlIHVybC5cbiAgICAgKiAgICAgIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmhlbHBlci5uYW1lIFRoZSBuYW1lIG9mIGhpZGRlbiBlbGVtZW50IGZvciBzZW5kaW5nIHNlcnZlciBoZWxwZXIgcGFnZSBpbmZvcm1hdGlvbi5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMucmVzdWx0VHlwZUVsZW1lbnROYW1lIFRoZSB0eXBlIG9mIGhpZGRlbiBlbGVtZW50IGZvciBzZW5kaW5nIHNlcnZlciByZXNwb25zZSB0eXBlIGluZm9ybWF0aW9uLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5mb3JtVGFyZ2V0IFRoZSB0YXJnZXQgZm9yIHgtZG9tYWluIGpzb25wIGNhc2UuXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmNhbGxiYWNrTmFtZSBUaGUgbmFtZSBvZiBqc29ucCBjYWxsYmFjayBmdW5jdGlvbi5cbiAgICAgKiAgQHBhcmFtIHtvYmplY3R9IG9waXRvbnMubGlzdEluZm8gVGhlIGVsZW1lbnQgaW5mbyB0byBkaXNwbGF5IGZpbGUgbGlzdCBpbmZvcm1hdGlvbi5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMuc2VwYXJhdG9yIFRoZSBzZXBhcmF0b3IgZm9yIGpzb25wIGhlbHBlciByZXNwb25zZS5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmZpbGVGaWVsZD11c2VyRmlsZV0gVGhlIGZpZWxkIG5hbWUgb2YgaW5wdXQgZmlsZSBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7SnF1ZXJ5T2JqZWN0fSAkZWwgUm9vdCBFbGVtZW50IG9mIFVwbG9hZGVyXG4gICAgICovXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucywgJGVsKSB7XG4gICAgICAgIHRoaXMuX3NldERhdGEob3B0aW9ucyk7XG4gICAgICAgIHRoaXMuX3NldENvbm5lY3RvcigpO1xuXG4gICAgICAgIHRoaXMuJGVsID0gJGVsO1xuICAgICAgICB0aGlzLmlucHV0VmlldyA9IG5ldyBJbnB1dChvcHRpb25zLCB0aGlzKTtcbiAgICAgICAgdGhpcy5saXN0VmlldyA9IG5ldyBMaXN0KG9wdGlvbnMsIHRoaXMpO1xuICAgICAgICB0aGlzLmZpbGVGaWVsZCA9IHRoaXMuZmlsZUZpZWxkIHx8IHN0YXRpYy5DT05GLkZJTEVfRklMRURfTkFNRTtcblxuICAgICAgICB0aGlzLl9hZGRFdmVudCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgQ29ubmVjdG9yIGJ5IHVzZUpzb25wIGZsYWcgYW5kIHdoZXRoZXIuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2V0Q29ubmVjdG9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNCYXRjaFRyYW5zZmVyKSB7XG4gICAgICAgICAgICB0aGlzLnR5cGUgPSAnbG9jYWwnO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuaXNDcm9zc0RvbWFpbigpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5oZWxwZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnR5cGUgPSAnanNvbnAnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhbGVydChzdGF0aWMuQ09ORi5FUlJPUi5OT1RfU1VSUFBPUlQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMudXNlSnNvbnAgfHwgIXN0YXRpYy5pc1N1cHBvcnRGb3JtRGF0YSgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50eXBlID0gJ2pzb25wJztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy50eXBlID0gJ2FqYXgnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2Nvbm5lY3RvciA9IGNvbm4uZ2V0Q29ubmVjdG9yKHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgbGlzdCB2aWV3IHdpdGggY3VzdG9tIG9yIG9yaWdpbmFsIGRhdGEuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGluZm8gVGhlIGRhdGEgZm9yIHVwZGF0ZSBsaXN0XG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBpbmZvLmFjdGlvbiBUaGUgYWN0aW9uIG5hbWUgdG8gZXhlY3V0ZSBtZXRob2RcbiAgICAgKi9cbiAgICBub3RpZnk6IGZ1bmN0aW9uKGluZm8pIHtcbiAgICAgICAgdGhpcy5saXN0Vmlldy51cGRhdGUoaW5mbyk7XG4gICAgICAgIHRoaXMubGlzdFZpZXcudXBkYXRlVG90YWxJbmZvKGluZm8pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgZmllbGQgZGF0YSBieSBvcHRpb24gdmFsdWVzLlxuICAgICAqIEBwYXJhbSBvcHRpb25zXG4gICAgICovXG4gICAgX3NldERhdGE6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgbmUudXRpbC5leHRlbmQodGhpcywgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV4dHJhY3QgcHJvdG9jb2wgKyBkb21haW4gZnJvbSB1cmwgdG8gZmluZCBvdXQgd2hldGhlciBjcm9zcy1kb21haW4gb3Igbm90LlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqL1xuICAgIGlzQ3Jvc3NEb21haW46IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcGFnZURvbWFpbiA9IGRvY3VtZW50LmRvbWFpbjtcbiAgICAgICAgcmV0dXJuIHRoaXMudXJsLnNlbmQuaW5kZXhPZihwYWdlRG9tYWluKSA9PT0gLTE7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZvciBlcnJvclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSBFcnJvciByZXNwb25zZVxuICAgICAqL1xuICAgIGVycm9yQ2FsbGJhY2s6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciBtZXNzYWdlO1xuICAgICAgICBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UubXNnKSB7XG4gICAgICAgICAgICBtZXNzYWdlID0gcmVzcG9uc2UubXNnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWVzc2FnZSA9IHN0YXRpYy5DT05GLkVSUk9SLkRFRkFVTFQ7XG4gICAgICAgIH1cbiAgICAgICAgYWxlcnQobWVzc2FnZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZvciBjdXN0b20gc2VuZCBldmVudFxuICAgICAqL1xuICAgIHNlbmRGaWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gbmUudXRpbC5iaW5kKHRoaXMubm90aWZ5LCB0aGlzKTtcbiAgICAgICAgdGhpcy5fY29ubmVjdG9yLnNlbmQoe1xuICAgICAgICAgICAgdHlwZTogJ2FkZCcsXG4gICAgICAgICAgICBzdWNjZXNzOiBjYWxsYmFjayxcbiAgICAgICAgICAgIGVycm9yOiB0aGlzLmVycm9yQ2FsbGJhY2tcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZvciBjdXN0b20gcmVtb3ZlIGV2ZW50XG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgVGhlIGRhdGEgZm9yIHJlbW92ZSBmaWxlLlxuICAgICAqL1xuICAgIHJlbW92ZUZpbGU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gbmUudXRpbC5iaW5kKHRoaXMubm90aWZ5LCB0aGlzKTtcbiAgICAgICAgdGhpcy5fY29ubmVjdG9yLnNlbmQoe1xuICAgICAgICAgICAgdHlwZTogJ3JlbW92ZScsXG4gICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgc3VjY2VzczogY2FsbGJhY2tcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHN1Ym1pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX2Nvbm5lY3Rvci5zdWJtaXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygndXBsb2FkZXIgY2FvbXBsZXRlJyk7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZm9yIGN1c3RvbSByZW1vdmUgZXZlbnRcbiAgICAgKiBSZW1vdmUgaW5wdXQgZmlsZSdzIGNsb25lXG4gICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICovXG4gICAgcmVtb3ZlRWxlbWVudDogZnVuY3Rpb24oZGF0YSkge1xuXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBmaWxlIGluZm8gbG9jYWxseVxuICAgICAqIEBwYXJhbSB7SHRtbEVsZW1lbnR9IGVsZW1lbnQgSW5wdXQgZWxlbWVudFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dldEZpbGVJbmZvOiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAgIHZhciBmaWxlcztcbiAgICAgICAgaWYgKHRoaXMuX2lzU3VwcG9ydEZpbGVTeXN0ZW0oKSkge1xuICAgICAgICAgICAgZmlsZXMgPSB0aGlzLl9nZXRGaWxlTGlzdChlbGVtZW50LmZpbGVzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpbGVzID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6IGVsZW1lbnQudmFsdWUsXG4gICAgICAgICAgICAgICAgaWQ6IGVsZW1lbnQudmFsdWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmlsZXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBmaWxlIGxpc3QgZnJvbSBGaWxlTGlzdCBvYmplY3RcbiAgICAgKiBAcGFyYW0ge0ZpbGVMaXN0fSBmaWxlcyBBIEZpbGVMaXN0IG9iamVjdFxuICAgICAqIEByZXR1cm5zIHtBcnJheX1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRGaWxlTGlzdDogZnVuY3Rpb24oZmlsZXMpIHtcbiAgICAgICAgcmV0dXJuIG5lLnV0aWwubWFwKGZpbGVzLCBmdW5jdGlvbihmaWxlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhmaWxlKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogZmlsZS5uYW1lLFxuICAgICAgICAgICAgICAgIHNpemU6IGZpbGUuc2l6ZSxcbiAgICAgICAgICAgICAgICBpZDogZmlsZS5uYW1lXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgd2hldGhlciBzdXBwb3J0IGZpbGUgYXBpIG9yIG5vdFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2lzU3VwcG9ydEZpbGVTeXN0ZW06IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gISEod2luZG93LkZpbGUgJiYgd2luZG93LkZpbGVSZWFkZXIgJiYgd2luZG93LkZpbGVMaXN0ICYmIHdpbmRvdy5CbG9iKTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnQgdG8gbGlzdHZpZXcgYW5kIGlucHV0dmlld1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZEV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNCYXRjaFRyYW5zZmVyKSB7XG4gICAgICAgICAgICB0aGlzLmlucHV0Vmlldy5vbignc2F2ZScsIHRoaXMuc2VuZEZpbGUsIHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5saXN0Vmlldy5vbigncmVtb3ZlJywgdGhpcy5yZW1vdmVGaWxlLCB0aGlzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRWaWV3Lm9uKCdjaGFuZ2UnLCB0aGlzLnNlbmRGaWxlLCB0aGlzKTtcbiAgICAgICAgICAgIHRoaXMubGlzdFZpZXcub24oJ3JlbW92ZScsIHRoaXMucmVtb3ZlRmlsZSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbn0pO1xuXG5uZS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihVcGxvYWRlcik7XG5tb2R1bGUuZXhwb3J0cyA9IFVwbG9hZGVyOyIsIi8qKlxuICogQGZpbGVvdmVydmlldyBJbnB1dFZpZXcgbWFrZSBpbnB1dCBmb3JtIGJ5IHRlbXBsYXRlLiBBZGQgZXZlbnQgZmlsZSB1cGxvYWQgZXZlbnQuXG4gKiBAZGVwZW5kZW5jeSBuZS1jb2RlLXNuaXBwZXQgMS4wLjMsIGpxdWVyeTEuOC4zXG4gKiBAYXV0aG9yIE5ITiBFbnQuIEZFIERldmVsb3BtZW50IFRlYW0gPGUwMjQyQG5obmVudC5jb20+XG4gKi9cblxudmFyIHN0YXRpYyA9IHJlcXVpcmUoJy4uL3N0YXRpY3MuanMnKTtcblxuLyoqXG4gKiBUaGlzIHZpZXcgY29udHJvbCBpbnB1dCBlbGVtZW50IHR5cGVkIGZpbGUuXG4gKiBAY29uc3RydWN0b3IgbmUuY29tcG9uZW50LkZpbGVVcGxvYWRlci5JbnB1dFZpZXdcbiAqL1xudmFyIElucHV0ID0gbmUudXRpbC5kZWZpbmVDbGFzcygvKipAbGVuZHMgbmUuY29tcG9uZW50LlVwbG9hZGVyLklucHV0LnByb3RvdHlwZSAqKi97XG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBpbnB1dCBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cbiAgICAgKi9cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zLCB1cGxvYWRlcikge1xuXG4gICAgICAgIHRoaXMuX3VwbG9hZGVyID0gdXBsb2FkZXI7XG4gICAgICAgIHRoaXMuX3RhcmdldCA9IG9wdGlvbnMuZm9ybVRhcmdldDtcbiAgICAgICAgdGhpcy5fdXJsID0gb3B0aW9ucy51cmw7XG4gICAgICAgIHRoaXMuX2lzQmF0Y2hUcmFuc2ZlciA9IG9wdGlvbnMuaXNCYXRjaFRyYW5zZmVyO1xuICAgICAgICB0aGlzLmh0bWwgPSAob3B0aW9ucy50ZW1wbGF0ZSAmJiBvcHRpb25zLnRlbXBsYXRlLmlucHV0KSB8fCBzdGF0aWMuSFRNTC5pbnB1dDtcblxuICAgICAgICB0aGlzLl9yZW5kZXIoKTtcbiAgICAgICAgdGhpcy5fcmVuZGVySGlkZGVuRWxlbWVudHMoKTtcblxuICAgICAgICBpZiAob3B0aW9ucy5oZWxwZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX21ha2VCcmlkZ2VJbmZvRWxlbWVudChvcHRpb25zLmhlbHBlcik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiRpbnB1dCA9IHRoaXMuJGVsLmZpbmQoJ2lucHV0OmZpbGUnKTtcbiAgICAgICAgdGhpcy5fYWRkRXZlbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVuZGVyIGlucHV0IGFyZWFcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbCA9ICQodGhpcy5fZ2V0SHRtbCh0aGlzLmh0bWwpKTtcbiAgICAgICAgdGhpcy4kZWwuYXR0cih7XG4gICAgICAgICAgICBhY3Rpb246IHRoaXMuX3VybC5zZW5kLFxuICAgICAgICAgICAgbWV0aG9kOiAncG9zdCcsXG4gICAgICAgICAgICBlbmN0eXBlOiBcIm11bHRpcGFydC9mb3JtLWRhdGFcIixcbiAgICAgICAgICAgIHRhcmdldDogdGhpcy5fdGFyZ2V0XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl91cGxvYWRlci4kZWwuYXBwZW5kKHRoaXMuJGVsKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGh0bWwgc3RyaW5nIGZyb20gdGVtcGxhdGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaHRtbCBUaGUgaHRtbCB0byBiZSBjb252ZXJ0ZWQuXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRIdG1sOiBmdW5jdGlvbihodG1sKSB7XG4gICAgICAgIHZhciBtYXAgPSB7XG4gICAgICAgICAgICBmaWxlRmllbGQ6IHRoaXMuX3VwbG9hZGVyLmZpbGVGaWVsZFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gc3RhdGljLnRlbXBsYXRlKG1hcCwgaHRtbCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGwgbWV0aG9kcyB0aG9zZSBtYWtlIGVhY2ggaGlkZGVuIGVsZW1lbnQuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVuZGVySGlkZGVuRWxlbWVudHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9tYWtlVGFyZ2V0RnJhbWUoKTtcbiAgICAgICAgdGhpcy5fbWFrZVJlc3VsdFR5cGVFbGVtZW50KCk7XG4gICAgICAgIHRoaXMuX21ha2VDYWxsYmFja0VsZW1lbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGNoYW5nZSBldmVudCBhbmQgY3VzdG9tIEV2ZW50XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc3VibWl0ID0gdGhpcy4kZWwuZmluZCgnYnV0dG9uOnN1Ym1pdCcpLFxuICAgICAgICAgICAgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmICh0aGlzLl9pc0JhdGNoVHJhbnNmZXIpIHtcbiAgICAgICAgICAgIHRoaXMuJGlucHV0Lm9uKCdjaGFuZ2UnLCBuZS51dGlsLmJpbmQodGhpcy5vblNhdmUsIHRoaXMpKTtcbiAgICAgICAgICAgIHRoaXMuJGVsLm9uKCdzdWJtaXQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl91cGxvYWRlci5zdWJtaXQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuJGlucHV0Lm9uKCdjaGFuZ2UnLCBuZS51dGlsLmJpbmQodGhpcy5vbkNoYW5nZSwgdGhpcykpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50LUhhbmRsZSBmb3IgaW5wdXQgZWxlbWVudCBjaGFuZ2VcbiAgICAgKi9cbiAgICBvbkNoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZmlyZSgnY2hhbmdlJywge1xuICAgICAgICAgICAgdGFyZ2V0OiB0aGlzXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudC1IYW5kbGUgZm9yIHNhdmUgaW5wdXQgZWxlbWVudFxuICAgICAqL1xuICAgIG9uU2F2ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZmlyZSgnc2F2ZScsIHtcbiAgICAgICAgICAgIGVsZW1lbnQ6IHRoaXMuJGlucHV0WzBdLFxuICAgICAgICAgICAgY2FsbGJhY2s6IG5lLnV0aWwuYmluZCh0aGlzLl9jaGFuZ2VFbGVtZW50LCB0aGlzKVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hhbmdlIGVsZW1lbnQgZm9yIHNhdmUgZmlsZSBkYXRhXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGFcbiAgICAgKi9cbiAgICBfY2hhbmdlRWxlbWVudDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB0aGlzLl9jbG9uZShkYXRhKTtcbiAgICAgICAgdGhpcy5fYWRkRXZlbnQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSBlbGVtZW50IHRvIGJlIHRhcmdldCBvZiBzdWJtaXQgZm9ybSBmb3JtIGVsZW1lbnQuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbWFrZVRhcmdldEZyYW1lOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fJHRhcmdldCA9ICQoJzxpZnJhbWUgbmFtZT1cIicgKyB0aGlzLl90YXJnZXQgKyAnXCI+PC9pZnJhbWU+Jyk7XG4gICAgICAgIHRoaXMuXyR0YXJnZXQuY3NzKHtcbiAgICAgICAgICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nLFxuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX3VwbG9hZGVyLiRlbC5hcHBlbmQodGhpcy5fJHRhcmdldCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2UgZWxlbWVudCB0byBiZSBjYWxsYmFjayBmdW5jdGlvbiBuYW1lXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbWFrZUNhbGxiYWNrRWxlbWVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuXyRjYWxsYmFjayA9IHRoaXMuX21ha2VIaWRkZW5FbGVtZW50KHtcbiAgICAgICAgICAgICduYW1lJzogc3RhdGljLkNPTkYuSlNPTlBDQUxMQkFDS19OQU1FLFxuICAgICAgICAgICAgJ3ZhbHVlJzogdGhpcy5fdXBsb2FkZXIuY2FsbGJhY2tOYW1lXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLiRlbC5hcHBlbmQodGhpcy5fJGNhbGxiYWNrKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSBlbGVtZW50IHRvIGtub3cgd2hpY2ggdHlwZSByZXF1ZXN0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbWFrZVJlc3VsdFR5cGVFbGVtZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fJHJlc1R5cGUgPSB0aGlzLl9tYWtlSGlkZGVuRWxlbWVudCh7XG4gICAgICAgICAgICAnbmFtZScgOiB0aGlzLl91cGxvYWRlci5yZXN1bHRUeXBlRWxlbWVudE5hbWUgfHwgc3RhdGljLkNPTkYuUkVTUE9OU0VfVFlQRSxcbiAgICAgICAgICAgICd2YWx1ZSc6IHRoaXMuX3VwbG9hZGVyLnR5cGVcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuJGVsLmFwcGVuZCh0aGlzLl8kcmVzVHlwZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1ha2UgZWxlbWVudCB0aGF0IGhhcyByZWRpcmVjdCBwYWdlIGluZm9ybWF0aW9uIHVzZWQgYnkgU2VydmVyIHNpZGUuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGhlbHBlciBSZWRpcmVjdGlvbiBpbmZvcm1hdGlvbiBmb3IgY2xlYXIgeC1kb21haW4gcHJvYmxlbS5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9tYWtlQnJpZGdlSW5mb0VsZW1lbnQ6IGZ1bmN0aW9uKGhlbHBlcikge1xuICAgICAgICB0aGlzLl8kaGVscGVyID0gdGhpcy5fbWFrZUhpZGRlbkVsZW1lbnQoe1xuICAgICAgICAgICAgJ25hbWUnIDogaGVscGVyLm5hbWUgfHwgc3RhdGljLkNPTkYuUkVESVJFQ1RfVVJMLFxuICAgICAgICAgICAgJ3ZhbHVlJzogaGVscGVyLnVybFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy4kZWwuYXBwZW5kKHRoaXMuXyRoZWxwZXIpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNYWtlIEhpZGRlbiBpbnB1dCBlbGVtZW50IHdpdGggb3B0aW9uc1xuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFRoZSBvcGl0b25zIHRvIGJlIGF0dHJpYnV0ZSBvZiBpbnB1dFxuICAgICAqIEByZXR1cm5zIHsqfGpRdWVyeX1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9tYWtlSGlkZGVuRWxlbWVudDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICBuZS51dGlsLmV4dGVuZChvcHRpb25zLCB7XG4gICAgICAgICAgICB0eXBlOiAnaGlkZGVuJ1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuICQoJzxpbnB1dCAvPicpLmF0dHIob3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENsb25lIElucHV0IGVsZW1lbnQgdG8gc2VuZCBieSBmb3JtIHN1Ym1pdFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBpbmZvIEEgaW5mb3JtYXRpb24gb2YgY2xvbmUgZWxlbWVudFxuICAgICAqL1xuICAgIF9jbG9uZTogZnVuY3Rpb24oaW5mbykge1xuICAgICAgICB0aGlzLiRpbnB1dC5vZmYoKTtcbiAgICAgICAgLy8gdG9kbyBjbG9uZVxuICAgIH1cbn0pO1xuXG5cbm5lLnV0aWwuQ3VzdG9tRXZlbnRzLm1peGluKElucHV0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbnB1dDsiLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgSXRlbVZpZXcgbWFrZSBlbGVtZW50IHRvIGRpc3BsYXkgYWRkZWQgZmlsZSBpbmZvcm1hdGlvbi4gSXQgaGFzIGF0dGFjaGVkIGZpbGUgSUQgdG8gcmVxdWVzdCBmb3IgcmVtb3ZlLlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxlMDI0MkBuaG5lbnQuY29tPlxuICovXG5cbnZhciBzdGF0aWMgPSByZXF1aXJlKCcuLi9zdGF0aWNzLmpzJyk7XG5cbi8qKlxuICogQ2xhc3Mgb2YgaXRlbSB0aGF0IGlzIG1lbWJlciBvZiBmaWxlIGxpc3QuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmFyIEl0ZW0gPSBuZS51dGlsLmRlZmluZUNsYXNzKC8qKiBAbGVuZHMgbmUuY29tcG9uZW50LlVwbG9hZGVyLkl0ZW0ucHJvdG90eXBlICoqLyB7XG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBpdGVtXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnNcbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMubmFtZSBGaWxlIG5hbWVcbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMudHlwZSBGaWxlIHR5cGVcbiAgICAgKiAgQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMucm9vdCBMaXN0IG9iamVjdFxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5oaWRkZW5GcmFtZSBUaGUgaWZyYW1lIG5hbWUgd2lsbCBiZSB0YXJnZXQgb2YgZm9ybSBzdWJtaXQuXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnVybCBUaGUgdXJsIGZvciBmb3JtIGFjdGlvbiB0byBzdWJtZXQuXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5pZF0gVW5pcXVlIGtleSwgd2hhdCBpZiB0aGUga2V5IGlzIG5vdCBleGlzdCBpZCB3aWxsIGJlIHRoZSBmaWxlIG5hbWUuXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5oaWRkZW5GaWVsZE5hbWVdIFRoZSBuYW1lIG9mIGhpZGRlbiBmaWxlZC4gVGhlIGhpZGRlbiBmaWVsZCBpcyBmb3IgY29ubmVjdGluZyB4LWRvbWlhbi5cbiAgICAgKiAgQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmRlbGV0ZUJ1dHRvbkNsYXNzTmFtZT0ndXBsb2FkZXJfYnRuX2RlbGV0ZSddIFRoZSBjbGFzcyBuYW1lIGlzIGZvciBkZWxldGUgYnV0dG9uLlxuICAgICAqICBAcGFyYW0geyhzdHJpbmd8bnVtYmVyKX0gW29wdGlvbnMuc2l6ZV0gRmlsZSBzaXplIChidXQgaWUgbG93IGJyb3dzZXIsIHgtZG9tYWluKVxuICAgICAqICBAcGFyYW0ge29iamVjdH0gW29wdGlvbnMuaGVscGVyXSBUaGUgaGVscGVyIHBhZ2UgaW5mby5cbiAgICAgKi9cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG5cbiAgICAgICAgdGhpcy5fc2V0Um9vdChvcHRpb25zKTtcbiAgICAgICAgdGhpcy5fc2V0SXRlbUluZm8ob3B0aW9ucyk7XG4gICAgICAgIHRoaXMuX3NldENvbm5lY3RJbmZvKG9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMucmVuZGVyKG9wdGlvbnMudGVtcGxhdGUgfHwgc3RhdGljLkhUTUwuaXRlbSk7XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuaGVscGVyKSB7XG4gICAgICAgICAgICB0aGlzLl9tYWtlQnJpZGdlSW5mb0VsZW1lbnQob3B0aW9ucy5oZWxwZXIpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCByb290KExpc3Qgb2JqZWN0KSBpbmZvcm1hdGlvbi5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBTYW1lIHdpdGggaW5pdCBvcHRpb25zIHBhcmFtZXRlci5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRSb290OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX3Jvb3QgPSBvcHRpb25zLnJvb3Q7XG4gICAgICAgIHRoaXMuXyRyb290ID0gb3B0aW9ucy5yb290LiRlbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGZpbGUgaW5mb3JtYXRpb24uXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgU2FtZSB3aXRoIGluaXQgb3B0aW9ucyBwYXJhbWV0ZXIuXG4gICAgICovXG4gICAgX3NldEl0ZW1JbmZvOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG9wdGlvbnMubmFtZTtcbiAgICAgICAgdGhpcy5fdHlwZSA9IG9wdGlvbnMudHlwZSB8fCB0aGlzLl9leHRyYWN0RXh0ZW5zaW9uKCk7XG4gICAgICAgIHRoaXMuX2lkID0gb3B0aW9ucy5pZCB8fCBvcHRpb25zLm5hbWU7XG4gICAgICAgIHRoaXMuc2l6ZSA9IG9wdGlvbnMuc2l6ZSB8fCAnJztcbiAgICAgICAgdGhpcy5fYnRuQ2xhc3MgPSBvcHRpb25zLmRlbGV0ZUJ1dHRvbkNsYXNzTmFtZSB8fCAndXBsb2FkZXJfYnRuX2RlbGV0ZSc7XG4gICAgICAgIHRoaXMuX3VuaXQgPSBvcHRpb25zLnVuaXQgfHwgJ0tCJztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGNvbm5lY3QgZWxlbWVudCBpbmZvcm1hdGlvbi5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBTYW1lIHdpdGggaW5pdCBvcHRpb25zIHBhcmFtZXRlci5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zZXRDb25uZWN0SW5mbzogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB0aGlzLl91cmwgPSBvcHRpb25zLnVybDtcbiAgICAgICAgdGhpcy5faGlkZGVuSW5wdXROYW1lID0gb3B0aW9ucy5oaWRkZW5GaWVsZE5hbWUgfHwgJ2ZpbGVuYW1lJztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVuZGVyIG1ha2luZyBmb3JtIHBhZGRpbmcgd2l0aCBkZWxldGFibGUgaXRlbVxuICAgICAqIEBwYXJhbSB0ZW1wbGF0ZVxuICAgICAqL1xuICAgIHJlbmRlcjogZnVuY3Rpb24odGVtcGxhdGUpIHtcbiAgICAgICAgdmFyIGh0bWwgPSB0aGlzLl9nZXRIdG1sKHRlbXBsYXRlKTtcbiAgICAgICAgdGhpcy5fJGVsID0gJChodG1sKTtcbiAgICAgICAgdGhpcy5fJHJvb3QuYXBwZW5kKHRoaXMuXyRlbCk7XG4gICAgICAgIHRoaXMuX2FkZEV2ZW50KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV4dHJhY3QgZmlsZSBleHRlbnNpb24gYnkgbmFtZVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZXh0cmFjdEV4dGVuc2lvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5hbWUuc3BsaXQoJy4nKS5wb3AoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTWFrZSBlbGVtZW50IHRoYXQgaGFzIHJlZGlyZWN0IHBhZ2UgaW5mb3JtYXRpb24gdXNlZCBieSBTZXJ2ZXIgc2lkZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gaGVscGVyIFJlZGlyZWN0aW9uIGhlbHBlciBwYWdlIGluZm9ybWF0aW9uIGZvciBjbGVhciB4LWRvbWFpbiBwcm9ibGVtLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX21ha2VCcmlkZ2VJbmZvRWxlbWVudDogZnVuY3Rpb24oaGVscGVyKSB7XG4gICAgICAgIHRoaXMuJGhlbHBlciA9ICQoJzxpbnB1dCAvPicpO1xuICAgICAgICB0aGlzLiRoZWxwZXIuYXR0cih7XG4gICAgICAgICAgICAnbmFtZScgOiBoZWxwZXIubmFtZSxcbiAgICAgICAgICAgICd2YWx1ZSc6IGhlbHBlci51cmxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBpdGVtIGVsZW1lbiBIVE1MXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGh0bWwgSFRNTCB0ZW1wbGF0ZVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0SHRtbDogZnVuY3Rpb24oaHRtbCkge1xuICAgICAgICB2YXIgbWFwID0ge1xuICAgICAgICAgICAgZmlsZXR5cGU6IHRoaXMuX3R5cGUsXG4gICAgICAgICAgICBmaWxlbmFtZTogdGhpcy5uYW1lLFxuICAgICAgICAgICAgZmlsZXNpemU6IHN0YXRpYy5nZXRGaWxlU2l6ZVdpdGhVbml0KHRoaXMuc2l6ZSksXG4gICAgICAgICAgICBkZWxldGVCdXR0b25DbGFzc05hbWU6IHRoaXMuX2J0bkNsYXNzXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHN0YXRpYy50ZW1wbGF0ZShtYXAsIGh0bWwpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEZXN0b3J5IGl0ZW1cbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fcmVtb3ZlRXZlbnQoKTtcbiAgICAgICAgdGhpcy5fJGVsLnJlbW92ZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnQgaGFuZGxlciBvbiBkZWxldGUgYnV0dG9uLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZEV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHF1ZXJ5ID0gJy4nICsgdGhpcy5fYnRuQ2xhc3MsXG4gICAgICAgICAgICAkZGVsQnRuID0gdGhpcy5fJGVsLmZpbmQocXVlcnkpO1xuICAgICAgICAkZGVsQnRuLm9uKCdjbGljaycsIG5lLnV0aWwuYmluZCh0aGlzLl9vbkNsaWNrRXZlbnQsIHRoaXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGV2ZW50IGhhbmRsZXIgZnJvbSBkZWxldGUgYnV0dG9uLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbW92ZUV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHF1ZXJ5ID0gJy4nICsgdGhpcy5fYnRuQ2xhc3MsXG4gICAgICAgICAgICAkZGVsQnRuID0gdGhpcy5fJGVsLmZpbmQocXVlcnkpO1xuICAgICAgICAkZGVsQnRuLm9mZignY2xpY2snKTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKiBFdmVudC1oYW5kbGUgZm9yIGRlbGV0ZSBidXR0b24gY2xpY2tlZC5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vbkNsaWNrRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmZpcmUoJ3JlbW92ZScsIHtcbiAgICAgICAgICAgIGZpbGVuYW1lIDogdGhpcy5uYW1lLFxuICAgICAgICAgICAgaWQgOiB0aGlzLl9pZCxcbiAgICAgICAgICAgIHR5cGU6ICdyZW1vdmUnXG4gICAgICAgIH0pO1xuICAgIH1cbn0pO1xuXG5uZS51dGlsLkN1c3RvbUV2ZW50cy5taXhpbihJdGVtKTtcblxubW9kdWxlLmV4cG9ydHMgPSBJdGVtOyIsIi8qKlxuICogQGZpbGVvdmVydmlldyBGaWxlTGlzdFZpZXcgbWFuYWdlIGFuZCBkaXNwbGF5IGZpbGVzIHN0YXRlKGxpa2Ugc2l6ZSwgY291bnQpIGFuZCBsaXN0LlxuICogQGRlcGVuZGVuY3kgbmUtY29kZS1zbmlwcGV0IDEuMC4zLCBqcXVlcnkxLjguM1xuICogQGF1dGhvciBOSE4gRW50LiBGRSBEZXZlbG9wbWVudCBUZWFtIDxlMDI0MkBuaG5lbnQuY29tPlxuICovXG5cbnZhciBzdGF0aWMgPSByZXF1aXJlKCcuLi9zdGF0aWNzLmpzJyk7XG52YXIgSXRlbSA9IHJlcXVpcmUoJy4vaXRlbS5qcycpO1xuXG4vKipcbiAqIExpc3QgaGFzIGl0ZW1zLiBJdCBjYW4gYWRkIGFuZCByZW1vdmUgaXRlbSwgYW5kIGdldCB0b3RhbCB1c2FnZS5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG52YXIgTGlzdCA9IG5lLnV0aWwuZGVmaW5lQ2xhc3MoLyoqIEBsZW5kcyBuZS5jb21wb25lbnQuVXBsb2FkZXIuTGlzdC5wcm90b3R5cGUgKi97XG4gICAgaW5pdCA6IGZ1bmN0aW9uKG9wdGlvbnMsIHVwbG9hZGVyKSB7XG4gICAgICAgIHZhciBsaXN0SW5mbyA9IG9wdGlvbnMubGlzdEluZm87XG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTtcbiAgICAgICAgdGhpcy4kZWwgPSBsaXN0SW5mby5saXN0O1xuICAgICAgICB0aGlzLiRjb3VudGVyID0gbGlzdEluZm8uY291bnQ7XG4gICAgICAgIHRoaXMuJHNpemUgPSBsaXN0SW5mby5zaXplO1xuICAgICAgICB0aGlzLl91cGxvYWRlciA9IHVwbG9hZGVyO1xuXG4gICAgICAgIG5lLnV0aWwuZXh0ZW5kKHRoaXMsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgaXRlbSBsaXN0XG4gICAgICogQHBhcmFtIHtvYmplY3R9IGluZm8gQSBpbmZvcm1hdGlvbiB0byB1cGRhdGUgbGlzdC5cbiAgICAgKiAgQHBhcmFtIHthcnJheX0gaW5mby5pdGVtcyBUaGUgbGlzdCBvZiBmaWxlIGluZm9ybWF0aW9uLlxuICAgICAqICBAcGFyYW0ge3N0cmluZ30gW2luZm8uYWN0aW9uXSBUaGUgYWN0aW9uIHRvIGRvLlxuICAgICAqL1xuICAgIHVwZGF0ZTogZnVuY3Rpb24oaW5mbykge1xuICAgICAgICBpZiAoaW5mby5hY3Rpb24gPT09ICdyZW1vdmUnKSB7XG4gICAgICAgICAgICB0aGlzLml0ZW1zID0gbmUudXRpbC5maWx0ZXIodGhpcy5pdGVtcywgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgICAgIGlmIChkZWNvZGVVUklDb21wb25lbnQoaW5mby5uYW1lKSA9PT0gZGVjb2RlVVJJQ29tcG9uZW50KGl0ZW0ubmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2FkZEZpbGVzKGluZm8uaXRlbXMpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBpdGVtcyB0b3RhbCBjb3VudCwgdG90YWwgc2l6ZSBpbmZvcm1hdGlvbi5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gaW5mbyBBIGluZm9ybWF0aW9uIHRvIHVwZGF0ZSBsaXN0LlxuICAgICAqICBAcGFyYW0ge2FycmF5fSBpbmZvLml0ZW1zIFRoZSBsaXN0IG9mIGZpbGUgaW5mb3JtYXRpb24uXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBpbmZvLnNpemUgVGhlIHRvdGFsIHNpemUuXG4gICAgICogIEBwYXJhbSB7c3RyaW5nfSBpbmZvLmNvdW50IFRoZSBjb3VudCBvZiBmaWxlcy5cbiAgICAgKi9cbiAgICB1cGRhdGVUb3RhbEluZm86IGZ1bmN0aW9uKGluZm8pIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlVG90YWxDb3VudChpbmZvLmNvdW50KTtcbiAgICAgICAgdGhpcy5fdXBkYXRlVG90YWxVc2FnZShpbmZvLnNpemUpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgaXRlbXMgdG90YWwgY291bnQgYW5kIHJlZnJlc2ggZWxlbWVudFxuICAgICAqIEBwYXJhbSB7KG51bWJlcnxzdHJpbmcpfSBbY291bnRdIFRvdGFsIGZpbGUgY291bnRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF91cGRhdGVUb3RhbENvdW50OiBmdW5jdGlvbihjb3VudCkge1xuXG4gICAgICAgIGlmICghbmUudXRpbC5pc0V4aXN0eShjb3VudCkpIHtcbiAgICAgICAgICAgIGNvdW50ID0gdGhpcy5pdGVtcy5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiRjb3VudGVyLmh0bWwoY291bnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgaXRlbXMgdG90YWwgc2l6ZSBhbmQgcmVmcmVzaCBlbGVtZW50XG4gICAgICogQHBhcmFtIHsobnVtYmVyfHN0cmluZyl9IHNpemUgVG90YWwgZmlsZXMgc2l6ZXNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF91cGRhdGVUb3RhbFVzYWdlOiBmdW5jdGlvbihzaXplKSB7XG5cbiAgICAgICAgaWYgKCFuZS51dGlsLmlzRXhpc3R5KHNpemUpKSB7XG4gICAgICAgICAgICBzaXplID0gdGhpcy5fZ2V0U3VtQWxsSXRlbVVzYWdlKCk7XG4gICAgICAgIH1cbiAgICAgICAgc2l6ZSA9IHN0YXRpYy5nZXRGaWxlU2l6ZVdpdGhVbml0KHNpemUpO1xuICAgICAgICB0aGlzLiRzaXplLmh0bWwoc2l6ZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN1bSBzaXplcyBvZiBhbGwgaXRlbXMuXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2V0U3VtQWxsSXRlbVVzYWdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGl0ZW1zID0gdGhpcy5pdGVtcyxcbiAgICAgICAgICAgIHRvdGFsVXNhZ2UgPSAwO1xuXG4gICAgICAgIG5lLnV0aWwuZm9yRWFjaChpdGVtcywgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgdG90YWxVc2FnZSArPSBwYXJzZUZsb2F0KGl0ZW0uc2l6ZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0b3RhbFVzYWdlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgZmlsZSBpdGVtc1xuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXQgVGFyZ2V0IGl0ZW0gaW5mb21hdGlvbnMuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYWRkRmlsZXM6IGZ1bmN0aW9uKHRhcmdldCkge1xuICAgICAgICBpZiAoIW5lLnV0aWwuaXNBcnJheSh0YXJnZXQpKSB7XG4gICAgICAgICAgICB0YXJnZXQgPSBbdGFyZ2V0XTtcbiAgICAgICAgfVxuICAgICAgICBuZS51dGlsLmZvckVhY2godGFyZ2V0LCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2godGhpcy5fY3JlYXRlSXRlbShkYXRhKSk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgaXRlbSBCeSBEYXRhXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGFcbiAgICAgKiBAcmV0dXJucyB7SXRlbX1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jcmVhdGVJdGVtOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBpdGVtID0gbmV3IEl0ZW0oe1xuICAgICAgICAgICAgcm9vdDogdGhpcyxcbiAgICAgICAgICAgIG5hbWU6IGRhdGEubmFtZSxcbiAgICAgICAgICAgIHNpemU6IGRhdGEuc2l6ZSxcbiAgICAgICAgICAgIGRlbGV0ZUJ1dHRvbkNsYXNzTmFtZTogdGhpcy5kZWxldGVCdXR0b25DbGFzc05hbWUsXG4gICAgICAgICAgICB1cmw6IHRoaXMudXJsLFxuICAgICAgICAgICAgaGlkZGVuRnJhbWU6IHRoaXMuZm9ybVRhcmdldCxcbiAgICAgICAgICAgIGhpZGRlbkZpZWxkTmFtZTogdGhpcy5oaWRkZW5GaWVsZE5hbWUsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogdGhpcy50ZW1wbGF0ZSAmJiB0aGlzLnRlbXBsYXRlLml0ZW1cbiAgICAgICAgfSk7XG4gICAgICAgIGl0ZW0ub24oJ3JlbW92ZScsIHRoaXMuX3JlbW92ZUZpbGUsIHRoaXMpO1xuICAgICAgICByZXR1cm4gaXRlbTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgUmVtb3ZlIEZpbGVcbiAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3JlbW92ZUZpbGU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdGhpcy5maXJlKCdyZW1vdmUnLCBkYXRhKTtcbiAgICB9XG59KTtcblxubmUudXRpbC5DdXN0b21FdmVudHMubWl4aW4oTGlzdCk7XG5cbm1vZHVsZS5leHBvcnRzID0gTGlzdDsiXX0=
