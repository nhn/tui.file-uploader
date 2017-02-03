'use strict';

var consts = require('../consts');
var utils = require('../utils');

var isSupportFormData = utils.isSupportFormData();
var HIDDEN_FILE_INPUT_CLASS = consts.CLASSNAME.HIDDEN_FILE_INPUT;
var STAMP_ID = '__fe_id';

/**
 * This view control input element typed file.
 * @class Form
 * @param {Uploader} uploader - Uploader instance
 * @ignore
 */
var Form = tui.util.defineClass(/**@lends View.Form.prototype **/{
    init: function(uploader) {
        /**
         * File uploader
         * @type {Uploader}
         * @private
         */
        this._uploader = uploader;

        /**
         * Html templates
         * @type {Object.<string, string>}
         */
        this._html = this._setTemplate(uploader.template);

        /**
         * Form element
         * @type {jQuery}
         */
        this.$el = null;

        /**
         * File input element
         * @type {jQuery}
         */
        this.$fileInput = null;

        /**
         * Submit element
         * @type {jQuery}
         */
        this.$submit = null;

        if (isSupportFormData) {
            /**
             * Whether the file input is multiple
             * @type {boolean}
             * @private
             */
            this._isMultiple = uploader.isMultiple;

            /**
             * Whether the file input accepts folder
             * @type {boolean}
             * @private
             */
            this._useFolder = uploader.useFolder;
        }

        this._render({
            action: uploader.url.send,
            method: 'post',
            enctype: 'multipart/form-data',
            target: isSupportFormData ? '' : uploader.formTarget
        });
    },

    /**
     * Render form element
     * @param {object} attributes - Form attributes
     * @private
     */
    _render: function(attributes) {
        var uploader = this._uploader;
        var $fileInput = this._getFileInput();
        var $el = $(this._html.FORM)
                .append(uploader.$el.children())
                .attr(attributes);

        this.$el = $el;
        this.$fileInput = $fileInput;

        if (uploader.isBatchTransfer) {
            this.$submit = uploader.$el.find(':submit');
        }

        if (uploader.isCrossDomain && !isSupportFormData) {
            this._setHiddenInputForCORS();
        }

        uploader.$el.append(this.$el);

        this._addEvent();
    },

    /**
     * Set hidden input element for CORS.
     *  Hidden input of PostMessage or RedirectURL.
     * @private
     */
    _setHiddenInputForCORS: function() {
        var props, $hiddenInput;
        var uploader = this._uploader;
        var redirectURL = uploader.redirectURL;

        if (uploader.isSupportPostMessage) { // for IE8, 9
            props = {
                name: 'messageTarget',
                value: location.protocol + '//' + location.host
            };
        } else if (redirectURL) { // for IE7
            props = {
                name: 'redirectURL',
                value: redirectURL
            };
        }

        if (props) {
            $hiddenInput = $(utils.template(props, this._html.HIDDEN_INPUT));
            $hiddenInput.appendTo(this.$el);
        }
    },

    /**
     * Set all of input elements html strings.
     * @private
     * @param {object} [template] The template is set form customer.
     * @returns {Object.<string, string>} The html template string set for form.
     */
    _setTemplate: function(template) {
        return tui.util.extend({}, consts.HTML, template);
    },

    /**
     * Makes and returns jquery element
     * @private
     * @returns {jQuery} The jquery object wrapping original input element
     */
    _getFileInput: function() {
        var $fileInput = this._uploader.$el.find(':file');
        var isMultiple = this._isMultiple;
        var useFolder = this._useFolder;

        $fileInput.prop({
            multiple: isMultiple,
            directory: useFolder,
            mozdirectory: useFolder,
            webkitdirectory: useFolder
        });

        return $fileInput;
    },

    /**
     * Add event
     * @private
     */
    _addEvent: function() {
        if (this._uploader.isBatchTransfer) {
            this.$el.on('submit', $.proxy(this.fire, this, 'submit'));
        }

        this._addInputEvent();
    },

    /**
     * Add change event to file input
     * @private
     */
    _addInputEvent: function() {
        this.$fileInput.on('change', $.proxy(this.onChange, this));
    },

    /**
     * Event-Handle for input element change
     */
    onChange: function() {
        if (!this.$fileInput[0].value) {
            return;
        }
        this.fire('change');
    },

    /**
     * Reset Input element to save whole input=file element.
     */
    resetFileInput: function() {
        var $clonedFileInput = this.$fileInput.clone();
        this.$fileInput.after($clonedFileInput);
        this.$fileInput.remove();
        this.$fileInput = $clonedFileInput;

        if (tui.util.hasStamp(this.$fileInput[0])) { // for old browser
            delete this.$fileInput[0][STAMP_ID];
        }

        this._addInputEvent();
    },

    /**
     * Clear file input elements
     */
    clear: function() {
        this.$el.find('.' + HIDDEN_FILE_INPUT_CLASS).remove();
        this.resetFileInput();
    }
});

tui.util.CustomEvents.mixin(Form);
module.exports = Form;
