'use strict';

var Modern = tui.util.defineClass({
    init: function(uploader) {
        this.uploader = uploader;
        this.inputView = uploader.inputView;
        this.pool = [];
        if (uploader.isBatchTransfer) {
            this.remove = this._removeWhenBatch;
        }
    },

    TYPE: 'modern',

    store: function() {
        var pool = this.pool,
            files = tui.util.toArray(this.inputView.$fileInput[0].files),
            stamp = tui.util.stamp,
            data = [];

        tui.util.forEach(files, function(file) {
            var id = stamp(file);
            pool.push(file);
            data.push({
                id: id,
                name: file.name,
                size: file.size
            });
        });

        this.inputView.resetFileInput();
        this.fire('stored', data);
    },

    upload: function() {
        var form = this.inputView.$el.clone(),
            field = this.uploader.fileField,
            formData;

        form.find('input[type="file"]').remove();
        formData = new FormData(form);
        tui.util.forEach(this.pool, function(file) {
            formData.append(field, file);
        });

        $.ajax({
            url: this.uploader.url.send,
            type: 'POST',
            data: formData,
            success: tui.util.bind(this._uploadSuccess, this),
            error: tui.util.bind(this._uploadError, this),
            processData: false,
            contentType: false
        });
        this.pool.length = 0;
    },

    clear: function() {
        this.pool.length = 0;
    },

    _removeWhenBatch: function(params) {
        var pool = this.pool,
            hasStamp = tui.util.hasStamp,
            stamp = tui.util.stamp,
            result = false;

        tui.util.forEach(pool, function(file, index) {
            if (hasStamp(file) && (stamp(file) === params.id)) {
                pool.splice(index, 1);
                result = true;
                return false;
            }
        });

        this.fire('removed', tui.util.extend({
            message: result ? 'success' : 'fail'
        }, params));
    },

    remove: function(params) {
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

    _uploadError: function(jqXHR, status, msgThrown) {
        this.fire('error', {
            status: status,
            message: msgThrown
        });
    },

    _uploadSuccess: function(data) {
        this.fire('uploaded', JSON.parse(data));
    }
});

tui.util.CustomEvents.mixin(Modern);
module.exports = Modern;
