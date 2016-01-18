/**
 * @fileoverview InputView make input form by template. Add event file upload event.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */

var consts = require('../consts');
var utils = require('../utils');

/**
 * This view control input element typed file.
 * @constructor View.InputView
 */
var Input = tui.util.defineClass(/**@lends View.Input.prototype **/{
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

        this._html = this._setHTML(options.template);

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
            target: (!this._isBatchTransfer ? this._target : '')
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
            input: template.input || consts.HTML.input,
            submit: template.submit || consts.HTML.submit,
            form: template.form || consts.HTML.form
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
        if (this._isBatchTransfer) {
            if (utils.isSupportFormData()) {
                this.$el.on('submit', tui.util.bind(function (event) {
                    event.preventDefault();
                    this._uploader.submit();
                }, this));
            } else {
                this.$el.on('submit', tui.util.bind(function () {
                    this._uploader.submit();
                }, this));
            }
        }
        this._addInputEvent();
    },

    /**
     * Add input element change event by sending type
     * @private
     */
    _addInputEvent: function() {
        if (this._isBatchTransfer) {
            this.$input.on('change', tui.util.bind(this.onSave, this));
        } else {
            this.$input.on('change', tui.util.bind(this.onChange, this));
        }
    },

    /**
     * Event-Handle for input element change
     */
    onChange: function() {
        if (!this.$input[0].value) {
            return;
        }
        this.fire('change', {
            target: this
        });
    },

    /**
     * Event-Handle for save input element
     */
    onSave: function() {
        if (!this.$input[0].value) {
            return;
        }
        var saveCallback = !utils.isSupportFormData() ? tui.util.bind(this._resetInputElement, this) : null;
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
        this.$input = this._getInputElement();
        if (this.$submit) {
            this.$submit.before(this.$input);
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
            'name': consts.CONF.JSONPCALLBACK_NAME,
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
            'name' : this._uploader.resultTypeElementName || consts.CONF.RESPONSE_TYPE,
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
            'name' : helper.name || consts.CONF.REDIRECT_URL,
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
        tui.util.extend(options, {
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

tui.util.CustomEvents.mixin(Input);

module.exports = Input;
