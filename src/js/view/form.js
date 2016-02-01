/**
 * @fileoverview From-view makes a form by template. Add events for file upload.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';
var consts = require('../consts'),
    utils = require('../utils');

var isSupportFormData = utils.isSupportFormData(),
    HIDDEN_FILE_INPUT_CLASS = consts.CONF.HIDDEN_FILE_INPUT_CLASS;

/**
 * This view control input element typed file.
 * @constructor View.Form
 */
var Form = tui.util.defineClass(/**@lends View.Form.prototype **/{
    /**
     * Initialize form element.
     * @param {Uploader} uploader - Uploader instance
     * @param {object} [options] - Options
     */
    init: function(uploader, options) {
        this._uploader = uploader;
        this._target = options.formTarget;
        this._url = options.url;
        this._isBatchTransfer = options.isBatchTransfer;
        this._html = this._setHTML(options.template);

        if (isSupportFormData) {
            this._isMultiple = options.isMultiple;
            this._useFolder = options.useFolder;
        }
        this._render();
    },

    /**
     * Render input area
     * @private
     */
    _render: function() {
        this.$el = $(this._html.form);
        this.$el.attr({
            action: this._url.send,
            method: 'post',
            enctype: 'multipart/form-data',
            target: isSupportFormData ? '' : this._target
        });

        this.$fileInput = this._createFileInput();
        this.$fileInput.appendTo(this.$el);
        if (this._isBatchTransfer) {
            this.$submit = this._createSubmitElement();
            this.$submit.appendTo(this.$el);
        }
        this._uploader.$el.append(this.$el);
        this._addEvent();
    },

    /**
     * Set all of input elements html strings.
     * @private
     * @param {object} [template] The template is set form customer.
     * @return {object} The html string set for inputView
     */
    _setHTML: function(template) {
        if (!template) {
            template = {};
        }

        return {
            input: template.input || consts.HTML.input,
            submit: template.submit || consts.HTML.submit,
            form: template.form || consts.HTML.form
        }
    },

    /**
     * Makes and returns jquery element
     * @private
     * @return {jQuery} The jquery object wrapping original input element
     */
    _createFileInput: function() {
        var map = {
            multiple: this._isMultiple ? 'multiple' : '',
            fileField: this._uploader.fileField,
            webkitdirectory: this._useFolder ? 'directory mozdirectory webkitdirectory' : ''
        };

        return $(utils.template(map, this._html.input));
    },

    /**
     * Makes and returns jquery element
     * @private
     * @return {jQuery} The jquery object wrapping sumbit button element
     */
    _createSubmitElement: function() {
        return $(this._html.submit);
    },

    /**
     * Add event
     * @private
     */
    _addEvent: function() {
        if (this._isBatchTransfer) {
            this._addEventWhenBatchTransfer();
        }
        this._addInputEvent();
    },

    /**
     * Add submit event
     * @private
     */
    _addEventWhenBatchTransfer: function() {
        this.$el.on('submit', $.proxy(function(event) {
            this.fire('submit', event);
        }, this));
    },

    /**
     * Add input element change event by sending type
     * @private
     */
    _addInputEvent: function() {
        this.$fileInput.on('change', $.proxy(this.onChange, this));
        this.$fileInput.attr('title', ' ');
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
        this.$fileInput.remove();
        this.$fileInput = this._createFileInput();
        if (this.$submit) {
            this.$submit.before(this.$fileInput);
        } else {
            this.$el.append(this.$fileInput);
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
