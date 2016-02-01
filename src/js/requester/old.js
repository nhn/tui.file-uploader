'use strict';

var Pool = require('../pool'),
    consts = require('../consts');

var TYPE = consts.CONF.REQUESTER_TYPE_OLD;

var Old = tui.util.defineClass({
    init: function(uploader) {
        var $hiddenFrame = uploader.$target;

        this.pool = new Pool(uploader.formView.$el[0]);
        this.uploader = uploader;
        this.formView = uploader.formView;
        $hiddenFrame.on('load', $.proxy(this._onUpload, this, $hiddenFrame));

        if (uploader.isBatchTransfer) {
            this.upload = this._uploadWhenBatch;
            this.remove = this._removeWhenBatch;
        }

        if (uploader.isCrossDomain) {
            this._supportCrossDomain();
        }
    },

    TYPE: TYPE,

    _supportCrossDomain: function() {
        var $hiddenFrame = this.uploader.$target,
            self = this;

        if ($hiddenFrame[0].contentWindow.postMessage) {
            $hiddenFrame.off('load', this._onUpload);
            this.formView.$el.append(
                '<input type="hidden" name="messageTarget" value="' + location.protocol + '//' + location.host + '">'
            );
            $(window).on('message', function(event) {
                var data = $.parseJSON(event.originalEvent.data);
                if (uploader.filterMessage && !uploader.filterMessage(event.originalEvent)) {
                    return;
                }
                self.fire('uploaded', data);
            });
        } else if (uploader.redirectURL) {
            this.formView.$el.append(
                '<input type="hidden" name="redirectURL" value="' + uploader.redirectURL + '">'
            );
        }
    },

    _onUpload: function($hiddenFrame) {
        var frameBody,
            data;

        try {
            frameBody = $hiddenFrame[0].contentWindow.document.body;
            data = frameBody.innerText || frameBody.textContent;
            if (data) {
                this.fire('uploaded', $.parseJSON(data));
            }
        } catch (e) {
            this.fire('error', {
                status: e.name,
                message: e.message
            });
        }
    },

    store: function() {
        var el = this.formView.$fileInput[0],
            id = tui.util.stamp(el);

        this.pool.store(el);
        this.formView.resetFileInput();

        this.fire('stored', [{
            id: id,
            name: el.value,
            size: ''
        }]);
    },

    upload: function() {
        this.pool.plant();
        this.formView.$el.submit();
        this.formView.clear();
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
            success: $.proxy(function(data) {
                data.type = 'remove';
                this.fire('removed', data);
            }, this)
        });
    },

    _removeWhenBatch: function(params) {
        var result = this.pool.remove(params);

        this.fire('removed', tui.util.extend({
            message: result ? 'success' : 'fail'
        }, params));
    },

    clear: function() {
        this.pool.empty();
    }
});

tui.util.CustomEvents.mixin(Old);
module.exports = Old;
