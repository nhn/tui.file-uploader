/**
 * @fileoverview FileUploader is core of file uploader component.<br>FileManager manage connector to connect server and update FileListView.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author FE dev team Jein Yi <jein.yi@nhnent.com>
 */
ne.util.defineNamespace('ne.component.FileUploader');

/**
 * FileUploader act like bridge between connector and view.<br>
 * It makes connector and view with option and environment.<br>
 * It control and make connection among modules.<br>
 * @constructor ne.component.FileUplodaer
 */
ne.component.FileUploader = ne.util.defineClass(/**@lends ne.component.FileUploader.prototype */{

    /**
     * initialize options
     * @param {object} options The options to set up file uploader modules.
     *  @param {string} options.url The url is file server.
     *  @parma {string} useJsonP Whether JsonpConnector or not.
     */
    init: function(options) {

        var constructor = ne.component.FileUploader;

        this._setData(options);

        if (this._isCrossDomain() || this._isSupportDataForm() || this.useJsonp) {
            this._connector = new constructor.Connector.getJsonpConnector();
        } else {
            this._connector = new constructor.Connector.getDefaultConnector();
        }
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
     * @private
     */
    _isCrossDomain: function() {
        var pageUrl = document.URL.split('/')[0],
            destUrl = this.url.split('/')[0];

        return pageUrl !== destUrl;
    },

    /**
     * Check DataForm Object exist.
     * @returns {boolean}
     */
    _isSupportDataForm: function() {
        return !!FormData;
    }
});