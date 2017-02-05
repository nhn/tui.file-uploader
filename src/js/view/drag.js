/**
 * @fileoverview This file is about drag and drop file to send. Drag and drop is running via file api.
 * @author NHN Ent. FE Development Lab <dl_javascript@nhnent.com>
 */
'use strict';

var consts = require('../consts');

var DROP_ENABLED_CLASS = consts.className.DROP_ENABLED;

/**
 * Makes drag and drop area, the dropped file is added via event drop event.
 * @class DragAndDrop
 * @param {jQuery} $el - Dropzone element
 * @ignore
 */
var DragAndDrop = tui.util.defineClass(/** @lends DragAndDrop.prototype */{
    init: function($el) {
        /**
         * Drop zone jQuery-element
         * @type {jQuery}
         */
        this.$el = $el;

        /**
         * Class for drop enabled
         * @type {string}
         * @private
         */
        this._enableClass = DROP_ENABLED_CLASS;

        this._addEvent();
    },

    /**
     * Adds drag and drop event
     * @private
     */
    _addEvent: function() {
        this.$el.on({
            dragenter: $.proxy(this.onDragEnter, this),
            dragover: $.proxy(this.onDragOver, this),
            drop: $.proxy(this.onDrop, this),
            dragleave: $.proxy(this.onDragLeave, this)
        });
    },

    /**
     * Handles dragenter event
     * @param {Event} e - Event
     */
    onDragEnter: function(e) {
        e.preventDefault();
        e.stopPropagation();
        this._enable();
    },

    /**
     * Handles dragover event
     * @param {Event} e - Event
     */
    onDragOver: function(e) {
        e.preventDefault();
        e.stopPropagation();
    },

    /**
     * Handles dragleave event
     * @param {Event} e - Event
     */
    onDragLeave: function(e) {
        e.preventDefault();
        e.stopPropagation();
        this._disable();
    },

    /**
     * Handles drop event
     * @param {Event} e - Event
     * @returns {boolean} False
     */
    onDrop: function(e) {
        var files = tui.util.pick(e, 'originalEvent', 'dataTransfer', 'files');

        e.preventDefault();
        this._disable();
        this.fire('drop', files);

        return false;
    },

    /**
     * Enable dropzone
     * @private
     */
    _enable: function() {
        this.$el.addClass(this._enableClass);
    },

    /**
     * Disable droponze
     * @private
     */
    _disable: function() {
        this.$el.removeClass(this._enableClass);
    }
});

tui.util.CustomEvents.mixin(DragAndDrop);

module.exports = DragAndDrop;
