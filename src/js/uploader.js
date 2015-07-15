/**
 * @fileoverview FileUploader is core of file uploader component.<br>FileManager manage connector to connect server and update FileListView.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author FE dev team Jein Yi <jein.yi@nhnent.com>
 */
ne.util.defineNamespace('ne.component.Uploader');

/**
 * FileUploader act like bridge between connector and view.<br>
 * It makes connector and view with option and environment.<br>
 * It control and make connection among modules.<br>
 * @constructor ne.component.FileUplodaer
 */
ne.component.Uploader = ne.util.defineClass(/**@lends ne.component.Uploader.prototype */{

    /**
     * initialize options
     * @param {object} options The options to set up file uploader modules.
     *  @param {string} options.url The url is file server.
     *  @parma {string} useJsonP Whether JsonpConnector or not.
     */
    init: function(options, $el) {

        var view = ne.component.Uploader.View;

        this._setData(options);
        this._setConnector();

        this.$el = $el;
        this.inputView = new view.Input(options, this);
        this.listView = new view.List(options, this);

        this._addEvent();
    },

    /**
     * Set Connector by useJsonp flag and whether.
     * @private
     */
    _setConnector: function() {
        var constructor = ne.component.Uploader;
        if (this.isCrossDomain()) {
            if (this.useAsyncTransfer && this.helper) {
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
        this.useAsyncTransfer = ne.util.isExisty(this.useAsyncTransfer) ?  this.useAsyncTransfer : true;
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
        // for ie low version browser tester
        var formData = ne.util.constructor(FormData) || null;
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
     * @param response
     */
    errorCallback: function(response) {
        var massage;
        if (response && response.msg) {
            massage = response.msg;
        } else {
            massage = CONF.ERROR.DEFAULT;
        }
        alert(massage);
    },

    /**
     * Callback of custom remove event
     */
    removeFile: function(data) {
        var callback = ne.util.bind(this.notify, this);
        this._connector.send({
            type: 'remove',
            data: data,
            success: callback
        });
    },

    _addEvent: function() {
        this.listView.on('remove', ne.util.bind(this.removeFile, this));
        this.inputView.on('change', ne.util.bind(this.sendFile, this));
    }

});

ne.util.CustomEvents.mixin(ne.component.Uploader);