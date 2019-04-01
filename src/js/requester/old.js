/**
 * @fileoverview Requester for old browsers.
 * @author NHN. FE Development Lab <dl_javascript@nhn.com>
 */

'use strict';

var $ = require('jquery');
var snippet = require('tui-code-snippet');

var Pool = require('../pool');
var consts = require('../consts');

var TYPE = consts.conf.REQUESTER_TYPE_OLD;

/**
 * Old requester
 * @param {Uploader} uploader - Uploader
 * @class
 * @ignore
 */
var Old = snippet.defineClass(/** @lends Old.prototype */{
    init: function(uploader) {
        var $hiddenFrame = uploader.$targetFrame;
        var formView = uploader.formView;

        /**
         * Uploader
         * @type {Uploader}
         */
        this.uploader = uploader;

        /**
         * From view
         * @type {Form}
         */
        this.formView = formView;

        /**
         * Local pool for file elements
         * @type {Pool}
         */
        this.pool = new Pool(formView.$el[0]);

        if (uploader.isBatchTransfer) {
            /**
             * Override Upload function for batch transfer
             * @type {Old._uploadWhenBatch}
             */
            this.upload = this._uploadWhenBatch;

            /**
             * Override remove function for batch transfer
             * @type {Old._removeWhenBatch}
             */
            this.remove = this._removeWhenBatch;
        }

        $hiddenFrame.on('load', $.proxy(this._onLoadHiddenFrame, this, $hiddenFrame));
    },

    /**
     * Requester type
     * @type {string}
     */
    TYPE: TYPE,

    /**
     * Event handler
     * "load" of hidden frame.
     * @param {jQuery} $hiddenFrame - Hidden iframe
     * @private
     */
    _onLoadHiddenFrame: function($hiddenFrame) {
        var frameBody;
        var data;

        try {
            frameBody = $hiddenFrame[0].contentWindow.document.body;
            data = snippet.pick(frameBody, 'firstChild', 'data');
            if (data) {
                this.fire('uploaded', $.parseJSON(data));
                frameBody.innerHTML = '';
            }
        } catch (e) {
            this.fire('error', {
                status: e.name,
                message: e.message
            });
        }
    },

    /**
     * Store file input element from upload form
     */
    store: function() {
        var el = this.formView.$fileInput[0];
        var id = snippet.stamp(el);

        this.pool.store(el);
        this.formView.resetFileInput();

        this.fire('stored', [{
            id: id,
            name: el.value,
            size: ''
        }]);
    },

    /**
     * Upload.
     * It is not used for batch transfer.
     */
    upload: function() {
        this.pool.plant();
        this.formView.$el.submit();
        this.formView.clear();
        this.clear();
    },

    /**
     * Upload.
     * It is used for batch transfer.
     * @private
     */
    _uploadWhenBatch: function() {
        this.pool.plant();
    },

    /**
     * Remove file (ajax-jsonp)
     * It is not used for batch transfer.
     * @param {Object} params - Removed item's id list (idList: [])
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
     * Remove file
     * It is used for batch transfer.
     * @param {Object} removedItems - Removed items info
     * @private
     */
    _removeWhenBatch: function(removedItems) {
        snippet.forEach(removedItems, function(id, name) {
            this.pool.remove(id, name);
        }, this);

        this.fire('removed', removedItems);
    },

    /**
     * Clear the pool
     */
    clear: function() {
        this.pool.empty();
    }
});

snippet.CustomEvents.mixin(Old);
module.exports = Old;
