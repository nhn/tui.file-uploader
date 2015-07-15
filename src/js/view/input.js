/**
 * @fileoverview InputView make input form by template. Add event file upload event.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author FE dev team Jein Yi <jein.yi@nhnent.com>
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
        this._makeResultTypeElement();
        this._makeCallbackElement();
        this._makeTargetFrame();

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

    _makeSizeUnit: function() {
        this._$sizeunit = $('<input />');
        this._$sizeunit.attr({
            'type': 'hidden',
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
        this._$callback = $('<input />');
        this._$callback.attr({
            'type': 'hidden',
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
        this._$resType = $('<input />');
        this._$resType.attr({
            'type': 'hidden',
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
        this._$helper = $('<input />');
        this._$helper.attr({
            'type': 'hidden',
            'name' : helper.name || CONF.REDIRECT_URL,
            'value': helper.url
        });
        this.$el.append(this._$helper);
    }
});


ne.util.CustomEvents.mixin(ne.component.Uploader.View.Input);