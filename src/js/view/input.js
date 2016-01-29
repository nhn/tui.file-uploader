/**
 * @fileoverview InputView make input form by template. Add event file upload event.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';
var consts = require('../consts'),
    HIDDEN_FILE_INPUT_CLASS = consts.CONF.HIDDEN_FILE_INPUT_CLASS,
    utils = require('../utils');

var isSupportFormData = utils.isSupportFormData();

/**
 * This view control input element typed file.
 * @constructor View.InputView
 */
var Input = tui.util.defineClass(/**@lends View.Input.prototype **/{
    /**
     * Initialize input element.
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
     * @return {jQuery} The jquery object wrapping original input element
     */
    _createFileInput: function() {
        var map = {
            multiple: this._isMultiple ? 'multiple' : '',
            fileField: this._uploader.fileField,
            webkitdirectory: this._useFolder ? 'webkitdirectory' : ''
        };

        return $(utils.template(map, this._html.input));
    },

    /**
     * Makes and returns jquery element
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
        var onSubmitHandler;
        if (this._isBatchTransfer) {
            if (isSupportFormData) {
                onSubmitHandler = tui.util.bind(function(event) {
                    event.preventDefault();
                    this._uploader.submit();
                }, this);
            } else {
                onSubmitHandler = tui.util.bind(function() {
                    this._uploader.submit();
                }, this);
            }

            this.$el.on('submit', onSubmitHandler);
        }
        this._addInputEvent();
    },

    /**
     * Add input element change event by sending type
     * @private
     */
    _addInputEvent: function() {
        this.$fileInput.on('change', tui.util.bind(this.onChange, this));
    },

    /**
     * Event-Handle for input element change
     */
    onChange: function() {
        if (!this.$fileInput[0].value) {
            return;
        }
        this.fire('change', {
            target: this
        });
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

    clear: function() {
        this.$el.find('.' + HIDDEN_FILE_INPUT_CLASS).remove();
        this.resetFileInput();
    }
});

tui.util.CustomEvents.mixin(Input);

module.exports = Input;
