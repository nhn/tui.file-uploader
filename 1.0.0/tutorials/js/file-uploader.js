(function() {
/**
 * @fileoverview Configuration or default values.
 * @author  NHN entertainment FE dev team Jein Yi <jein.yi@nhnent.com>
 */


/**
 * Configuration of connection with server.
  * @type {{RESPONSE_TYPE: string, REDIRECT_URL: string}}
 */
var CONF = {
    RESPONSE_TYPE: 'RESPONSE_TYPE',
    REDIRECT_URL: 'REDIRECT_URL',
    JSONPCALLBACK_NAME: 'CALLBACK_NAME',
    SIZE_UNIT: 'SIZE_UNIT',
    REMOVE_CALLBACK : 'responseRemoveCallback',
    ERROR: {
        DEFAULT: 'Unknown error.',
        NOT_SURPPORT: 'This is x-domain connection, you have to make helper page.'
    }
};

/**
 * Default Htmls
 * @type {{input: string, item: string}}
 */
var HTML = {
    input : ['<form enctype="multipart/form-data" id="formData" method="post">',
                '<input type="hidden" name="MAX_FILE_SIZE" value="3000000" />',
                '<input type="file" id="fileAttach" name="userfile[]" multiple="true" />',
            '</form>'].join(''),
    item : ['<li class="filetypeDisplayClass">',
                '<spna class="fileicon {{filetype}}">{{filetype}}</spna>',
                '<span class="file_name">{{filename}}</span>',
                '<span class="file_size">{{filesize}}</span>',
                '<button type="button" class="{{deleteButtonClassName}}">Delete</button>',
            '</li>'].join('')
};

/**
 * @fileoverview FileUploader is core of file uploader component.<br>FileManager manage connector to connect server and update FileListView.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author  NHN entertainment FE dev team Jein Yi <jein.yi@nhnent.com>
 */
ne.util.defineNamespace('ne.component.Uploader');

/**
 * FileUploader act like bridge between connector and view.<br>
 * It makes connector and view with option and environment.<br>
 * It control and make connection among modules.<br>
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
 *     sizeunit: "KB",
 *     separator: ';'
 * }, $('#uploader'));
 */
ne.component.Uploader = ne.util.defineClass(/**@lends ne.component.Uploader.prototype */{

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
     *  @param {string} options.sizeunit The unit of file usage.
     *  @param {string} options.separator The separator for jsonp helper response.
     * @param {JqueryObject} $el Root Element of Uploader
     */
    init: function(options, $el) {
        var View = ne.component.Uploader.View;

        this._setData(options);
        this._setConnector();

        this.$el = $el;
        this.inputView = new View.Input(options, this);
        this.listView = new View.List(options, this);

        this._addEvent();
    },

    /**
     * Set Connector by useJsonp flag and whether.
     * @private
     */
    _setConnector: function() {
        var constructor = ne.component.Uploader;
        if (this.isCrossDomain()) {
            if (this.helper) {
                this.type = 'jsonp';
            } else {
                alert(CONF.ERROR.NOT_SURPPORT);
            }
        } else {
            if (this.useJsonp || !this._isSupportDataForm()) {
                this.type = 'jsonp';
            } else {
                this.type = 'ajax';
            }
        }
        this._connector = new constructor.Connector(this);
    },

    /**
     * Update list view with custom or original data.
     * @param info
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
     * Check DataForm Object exist.
     * @returns {boolean}
     */
    _isSupportDataForm: function() {
        var formData = FormData || null;
        return !!formData;
    },

    /**
     * Callback of custom send event
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
     * Callback of error
     * @param {object} response Error response
     */
    errorCallback: function(response) {
        var message;
        if (response && response.msg) {
            message = response.msg;
        } else {
            message = CONF.ERROR.DEFAULT;
        }
        alert(message);
    },

    /**
     * Callback of custom remove event
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

    /**
     * Add event to listview and inputview
     * @private
     */
    _addEvent: function() {
        this.listView.on('remove', this.removeFile, this);
        this.inputView.on('change', this.sendFile, this);
    }

});

ne.util.CustomEvents.mixin(ne.component.Uploader);
/**
 * @fileoverview This Connector make connection between FileManager and file server api at modern browser.<br>
 *     This Connector use ajax.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author  NHN entertainment FE dev team Jein Yi <jein.yi@nhnent.com>
 */

ne.util.defineNamespace('ne.component.Uploader.Ajax');

/**
 * The modules will be mixed in connector by type.
 */
ne.component.Uploader.Ajax = {/** @lends ne.component.Uploader.Ajax */
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
/**
 * @fileoverview A Connector make connection between FileManager and file server API.<br> The Connector is interface.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author  NHN entertainment FE dev team Jein Yi <jein.yi@nhnent.com>
 */

ne.util.defineNamespace('ne.component.Uploader.Connector');

/**
 * The connector class could connect with server and return server response to callback.
 * @constructor
 */
ne.component.Uploader.Connector = ne.util.defineClass(/** @lends ne.component.Uploader.Connector.prototype */{
    init: function(uploader) {
        var type = this._getMixinModuleName(uploader.type);

        this._uploader = uploader;
        this.mixin(ne.component.Uploader[type]);
    },

    /**
     * Get Class Name for mixin
     * @param {string} type
     * @returns {XML|string|void}
     */
    _getMixinModuleName: function(type) {
        return type.replace(type.charAt(0), type.charAt(0).toUpperCase());
    },

    /**
     * Send request
     * @param {object} options
     *  @param {string} options.type Type of request
     */
    send: function(options) {
        if (options.type === 'remove') {
            this.removeRequest(options);
        } else {
            this.addRequest(options);
        }
    },

    /**
     * Mixin with selected connector
     * @param {object} connector
     */
    mixin: function(connector) {
        ne.util.extend(this, connector);
    }
});

/**
 * @fileoverview This Connector make connection between FileManager and file server api at old browser.<br>
 *     This Connector use hidden iframe.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author  NHN entertainment FE dev team Jein Yi <jein.yi@nhnent.com>
 */

ne.util.defineNamespace('ne.component.Uploader.Jsonp');

/**
 * The modules will be mixed in connector by type.
 */
ne.component.Uploader.Jsonp = {/** @lends ne.component.Uploader.Jsonp */
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
            items = [];

        ne.util.forEach(status, function(item, index) {
            if (item === 'success') {
                var nItem = {
                    name: names[index],
                    status: status[index],
                    size: sizes[index]
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

/**
 * @fileoverview InputView make input form by template. Add event file upload event.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author  NHN entertainment FE dev team Jein Yi <jein.yi@nhnent.com>
 */

ne.util.defineNamespace('ne.component.Uploader.View.Input');

/**
 * This view control input element typed file.
 * @constructor ne.component.FileUploader.InputView
 */
ne.component.Uploader.View.Input = ne.util.defineClass(/**@lends ne.component.Uploader.View.Input.prototype **/{
    /**
     * Initialize input element.
     * @param {object} [options]
     */
    init: function(options, uploader) {
        var html = (options.template && options.template.input) || HTML.input;

        this._uploader = uploader;
        this._target = options.formTarget;
        this._url = options.url;

        this._render(html);
        this._renderHiddenElements();

        if (options.helper) {
            this._makeBridgeInfoElement(options.helper);
        }

        this._addEvent();
    },


    /**
     * Render input area
     * @param {string} html Input element html
     * @private
     */
    _render: function(html) {
        this.$el = $(html);
        this.$el.attr({
            action: this._url.send,
            method: 'post',
            enctype: "multipart/form-data",
            target: this._target
        });
        this._uploader.$el.append(this.$el);
    },

    /**
     * Call methods those make each hidden element.
     * @private
     */
    _renderHiddenElements: function() {
        this._makeTargetFrame();
        this._makeResultTypeElement();
        this._makeCallbackElement();
        this._makeSizeUnit();
    },

    /**
     * Add change evnet and custom Event
     * @private
     */
    _addEvent: function() {
        this.$el.on('change', ne.util.bind(this.onChange, this));
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
     * Make element has size unit.(like KB, MB..)
     * @private
     */
    _makeSizeUnit: function() {
        this._$sizeunit = this._makeHiddenElement({
            'name': CONF.SIZE_UNIT,
            'value': this._uploader.sizeunit
        });
        this.$el.append(this._$sizeunit);
    },

    /**
     * Make element to be callback function name
     * @private
     */
    _makeCallbackElement: function() {
        this._$callback = this._makeHiddenElement({
            'name': CONF.JSONPCALLBACK_NAME,
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
            'name' : this._uploader.resultTypeElementName || CONF.RESPONSE_TYPE,
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
            'name' : helper.name || CONF.REDIRECT_URL,
            'value': helper.url
        });
        this.$el.append(this._$helper);
    },

    /**
     * Make Hidden input element with options
     * @param {objejct} options The opitons to be attribute of input
     * @returns {*|jQuery}
     * @private
     */
    _makeHiddenElement: function(options) {
        ne.util.extend(options, {
            type: 'hidden'
        });
        return $('<input />').attr(options);
    }
});


ne.util.CustomEvents.mixin(ne.component.Uploader.View.Input);
/**
 * @fileoverview ItemView make element to display added file information. It has attached file ID to request for remove.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author  NHN entertainment FE dev team Jein Yi <jein.yi@nhnent.com>
 */

ne.util.defineNamespace('ne.component.Uploader.View.Item');

/**
 * Class of item that is member of file list.
 * @constructor
 */
ne.component.Uploader.View.Item = ne.util.defineClass(/** @lends ne.component.Uploader.View.Item.prototype **/ {
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
     *  @param {string} options.unit The unit of file usage.
     *  @param {object} [options.helper] The helper page info.
     */
    init: function(options) {

        this._setRoot(options);
        this._setItemInfo(options);
        this._setConnectInfo(options);

        this.render(options.template || HTML.item);

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
            filesize: this._getSizeWithUnit(this.size),
            deleteButtonClassName: this._btnClass
        };

        html = html.replace(/\{\{([^\}]+)\}\}/g, function(mstr, name) {
            return map[name];
        });
        return html;
    },

    /**
     * Get formatting size
     * @param {(string|number)} size File size
     * @returns {string}
     * @private
     */
    _getSizeWithUnit: function(size) {
        return size + this._unit;
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

ne.util.CustomEvents.mixin(ne.component.Uploader.View.Item);
/**
 * @fileoverview FileListView manage and display files state(like size, count) and list.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author  NHN entertainment FE dev team Jein Yi <jein.yi@nhnent.com>
 */

ne.util.defineNamespace('ne.component.Uploader.View.List');

/**
 * List has items. It can add and remove item, and get total usage.
 * @constructor
 */
ne.component.Uploader.View.List = ne.util.defineClass(/** @lends ne.component.Uploader.View.List.prototype */{
    init : function(options, uploader, $el) {
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
            totalUsage += parseInt(item.size, 10);
        });

        return totalUsage + this.sizeunit;
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
        var item = new ne.component.Uploader.View.Item({
            root: this,
            name: data.name,
            size: data.size,
            deleteButtonClassName: this.deleteButtonClassName,
            url: this.url,
            hiddenFrame: this.formTarget,
            hiddenFieldName: this.hiddenFieldName,
            template: this.template && this.template.item,
            unit: this.sizeunit
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

ne.util.CustomEvents.mixin(ne.component.Uploader.View.List);
})();