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