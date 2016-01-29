'use strict';

var Pool = require('../pool'),
    X_DOMAIN_GLOBAL_CALLBACK_NAME = require('../consts').CONF.X_DOMAIN_GLOBAL_CALLBACK_NAME;

var Old = tui.util.defineClass({
    init: function(uploader) {
        var $hiddenFrame = uploader.$target;

        this.pool = new Pool(uploader.inputView.$el[0]);
        this.uploader = uploader;
        this.inputView = uploader.inputView;
        $hiddenFrame.on('load', tui.util.bind(this._onUpload, this, $hiddenFrame));

        if (uploader.isBatchTransfer) {
            this.upload = this._uploadWhenBatch;
            this.remove = this._removeWhenBatch;
        }

        if (uploader.isCrossDomain) {
            window[X_DOMAIN_GLOBAL_CALLBACK_NAME] = tui.util.bind(function(data) {
                this.fire('uploaded', data);
            }, this);

            this.inputView.$el.append(
                '<input type="hidden" name="callbackName" value="' + X_DOMAIN_GLOBAL_CALLBACK_NAME + '">'
            );
        }
    },

    TYPE: 'old',

    store: function() {
        var el = this.inputView.$fileInput[0],
            id = tui.util.stamp(el);

        this.pool.store(el);
        this.inputView.resetFileInput();

        this.fire('stored', [{
            id: id,
            name: el.value,
            size: ''
        }]);
    },

    upload: function() {
        this.pool.plant();
        this.inputView.$el.submit();
        this.inputView.clear();
        this.clear();
    },

    _uploadWhenBatch: function() {
        this.pool.plant();
    },

    remove: function(params) {
        var uploader = this.uploader;
        $.ajax({
            url: uploader.url.remove,
            dataType: 'jsonp',
            data: params,
            success: tui.util.bind(function(data) {
                data.type = 'remove';
                this.fire('removed', data);
            }, this)
        });
    },

    clear: function() {
        this.pool.empty();
    },

    _removeWhenBatch: function(params) {
        var result = this.pool.remove(params);

        this.fire('removed', tui.util.extend({
            message: result ? 'success' : 'fail'
        }, params));
    },

    _onUpload: function($hiddenFrame) {
        var data;

        this.uploader.clear();
        try {
            data = $hiddenFrame[0].contentWindow.document.body.innerHTML;
            if (data) {
                this.fire('uploaded', $.parseJSON(data));
            }
        } catch (e) {
            this.fire('error', {
                status: e.name,
                message: e.message
            });
        }
    }
});

tui.util.CustomEvents.mixin(Old);
module.exports = Old;
