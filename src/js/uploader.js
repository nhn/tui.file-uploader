/**
 * @fileoverview FileUploader is core of file uploader component.<br>FileManager manage connector to connect server and update FileListView.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';
var consts = require('./consts');
var utils = require('./utils');
var Input = require('./view/input');
var List = require('./view/list');
var DragAndDrop = require('./view/drag');
var OldRequester = require('./requester/old');
var ModernRequester = require('./requester/modern');

/**
 * FileUploader act like bridge between connector and view.
 * It makes connector and view with option and environment.
 * It control and make connection among modules.
 * @constructor
 * @param {object} options The options to set up file uploader modules.
 *  @param {object} options.url The url is file server.
 *      @param {string} options.url.send The url is for file attach.
 *      @param {string} options.url.remove The url is for file detach.
 *  @param {string} options.formTarget The target for x-domain jsonp case.
 *  @param {object} options.listInfo The element info to display file list information.
 *  @param {string} [options.fileField='userFile[]'] The field name of input file element.
 *  @param {boolean} options.useFolder Whether select unit is folder of not. If this is ture, multiple will be ignored.
 *  @param {boolean} options.isMultiple Whether enable multiple select or not.
 * @param {jQuery} $el Root Element of Uploader
 * @example
 * var uploader = new tui.component.Uploader({
 *     url: {
 *         send: "http://fe.nhnent.com/etc/etc/uploader/uploader.php",
 *         remove: "http://fe.nhnent.com/etc/etc/uploader/remove.php"
 *     },
 *     formTarget: 'hiddenFrame',
 *     listInfo: {
 *         list: $('#files'),
 *         count: $('#file_count'),
 *         size: $('#size_count')
 *     }
 * }, $('#uploader'));
 */
var Uploader = tui.util.defineClass(/**@lends Uploader.prototype */{
    /**
     * initialize
     */
    init: function(options, $el) {
        this._setData(options);
        this.$el = $el;
        this.fileField = this.fileField || consts.CONF.FILE_FILED_NAME;
        if (this.useDrag && !this.useFolder && utils.isSupportFileSystem()) {
            this.dragView = new DragAndDrop(options, this);
        }
        this.inputView = new Input(this, options);
        this.listView = new List(options, this);
        this._setConnector();
        this._addEvent();
        this.isCrossDomain = utils.isCrossDomain(this.url.send);
    },

    /**
     * Set Connector
     * @private
     */
    _setConnector: function() {
        if (utils.isSupportFormData()) {
            this._requester = new ModernRequester(this);
        } else {
            this.$target = this._createTargetFrame();
            this.$el.append(this.$target);
            this._requester = new OldRequester(this);
        }
    },

    /**
     * Makes element to be target of submit form element.
     * @private
     */
    _createTargetFrame: function() {
        var $target = $('<iframe name="' + this.formTarget + '"></iframe>');
        $target.css({
            visibility: 'hidden',
            position: 'absolute'
        });

        return $target;
    },

    /**
     * Update list view with custom or original data.
     * @param {object} info The data for update list
     *  @param {string} info.action The action name to execute method
     */
    updateList: function(info) {
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
     */
    sendFile: function() {
        this._requester.store();
        this._requester.upload();
    },

    /**
     * Callback for custom remove event
     * @param {object} data The data for remove file.
     */
    removeFile: function(data) {
        this._requester.remove(data);
    },

    /**
     * Submit for data submit to server
     * @api
     */
    submit: function() {
        this._requester.upload();
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
        this._requester.on('removed', function(data) {
            this.listView.update(data);
            this.fire('remove', data);
        }, this);

        this._requester.on('error', function(data) {
            this.fire('error', data);
        }, this);

        if (this.useDrag && this.dragView) {
            // @todo top 처리가 따로 필요함, sendFile 사용 안됨
            this.dragView.on('drop', this._store, this);
        }

        if (this.isBatchTransfer) {
            this.inputView.on('change', this._store, this);
            this.listView.on('remove', this.removeFile, this);
            this._requester.on({
                uploaded: function(data) {
                    this.clear();
                    this.fire('success', data);
                },
                stored: function(data) {
                    this.updateList(data);
                    this.fire('update', data);
                }
            }, this);
        } else {
            this.inputView.on('change', this.sendFile, this);
            this.listView.on('remove', this.removeFile, this);
            this._requester.on({
                uploaded: function(data) {
                    this.updateList(data.filelist);
                    this.fire('success', data);
                }
            }, this);
        }
    },

    clear: function() {
        this._requester.clear();
        this.inputView.clear();
        this.listView.clear();
    },

    /**
     * Store input element to pool.
     //* @param {HTMLElement} input A input element[type=file] for store pool
     */
    _store: function() {
        this._requester.store();
    }
});

tui.util.CustomEvents.mixin(Uploader);
module.exports = Uploader;
