'use strict';

var consts = require('../consts');

var TYPE = consts.CONF.REQUESTER_TYPE_MODERN;
var forEach = tui.util.forEach;

/**
 * Modern requester
 * @param {Uploader} uploader - Uploader
 * @class
 */
var Modern = tui.util.defineClass(/** @lends Modern.prototype */{
    init: function(uploader) {
        /**
         * Uploader
         * @type {Uploader}
         */
        this.uploader = uploader;

        /**
         * From view
         * @type {Form}
         */
        this.formView = uploader.formView;

        /**
         * Local pool for files
         * @type {Array.<File>}
         */
        this.pool = [];

        if (uploader.isBatchTransfer) {
            /**
             * Override remove function for batch transfer
             * @type {Old._removeWhenBatch}
             */
            this.remove = this._removeWhenBatch;
        }
    },

    /**
     * Requester type
     * @type {string}
     */
    TYPE: TYPE,

    /**
     * Event handler for upload error
     * @param {Object} jqXHR - jQuery XHR
     * @param {string} status - Ajax Status
     * @param {string} msgThrown - Error message
     * @private
     */
    _uploadError: function(jqXHR, status, msgThrown) {
        this.fire('error', {
            status: status,
            message: msgThrown
        });
    },

    /**
     * Event handler for upload success
     * @param {Object} data - Upload success data
     * @private
     */
    _uploadSuccess: function(data) {
        this.fire('uploaded', JSON.parse(data));
    },

    /**
     * Store files to local pool
     * @param {Array.<File> | File} [files] - A file or files
     */
    store: function(files) {
        var pool = this.pool;
        var stamp = tui.util.stamp;
        var data = [];

        files = tui.util.toArray(files || this.formView.$fileInput[0].files);
        forEach(files, function(file) {
            var id = stamp(file);
            pool.push(file);
            data.push({
                id: id,
                name: file.name,
                size: file.size
            });
        });

        this.formView.resetFileInput();
        this.fire('stored', data);
    },

    /**
     * Upload ajax
     */
    upload: function() {
        var field = this.formView.$fileInput.attr('name');
        var $form = this.formView.$el.clone();
        var formData;

        $form.find('input[type="file"]').remove();
        formData = new FormData($form[0]);

        forEach(this.pool, function(file) {
            formData.append(field, file);
        });

        $.ajax({
            url: this.uploader.url.send,
            type: 'POST',
            data: formData,
            success: $.proxy(this._uploadSuccess, this),
            error: $.proxy(this._uploadError, this),
            processData: false,
            contentType: false
        });
        this.clear();
    },

    /**
     * Remove file (ajax-jsonp)
     * It is not used for batch transfer.
     * @param {Object} params - Parameters to remove file
     */
    remove: function(params) {
        $.ajax({
            url: this.uploader.url.remove,
            dataType: 'jsonp',
            data: params,
            success: $.proxy(function(data) {
                this.fire('removed', data);
            }, this)
        });
    },

    /**
     * Remove file (ajax-jsonp)
     * It is used for batch transfer.
     * @param {Object} params - Parameters to remove file
     * @private
     */
    _removeWhenBatch: function(params) {
        var result = false;

        forEach(params.filelist, function(file) {
            result = this._removeFileInPool(file);
            file.state = result;
        }, this);

        this.fire('removed', tui.util.extend({
            message: result ? 'success' : 'fail'
        }, params));
    },

    /**
     * Remove file in pool
     * @param {object} data - File data
     * @returns {boolean} Removed state
     * @private
     */
    /*eslint-disable consistent-return*/
    _removeFileInPool: function(data) {
        var pool = this.pool;
        var hasStamp = tui.util.hasStamp;
        var stamp = tui.util.stamp;
        var result = false;

        forEach(pool, function(file, index) {
            if (hasStamp(file) && (stamp(file) === data.id)) {
                pool.splice(index, 1);
                result = true;

                return false;
            }
        });

        return result;
    },
    /*eslint-enable consistent-return*/

    /**
     * Clear the pool
     */
    clear: function() {
        this.pool.length = 0;
    }
});

tui.util.CustomEvents.mixin(Modern);
module.exports = Modern;
