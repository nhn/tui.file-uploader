/**
 * @fileoverview A Connector make connection between FileManager and file server API.<br> The Connector is interface.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author FE dev team Jein Yi <jein.yi@nhnent.com>
 */

ne.util.defineNamespace('ne.component.Uploader.Connector');

ne.component.Uploader.Connector = ne.util.defineClass({
    init: function(uploader) {
        var type = uploader.type;

        type = this._getClassName(type);
        this._uploader = uploader;
        this.mixin(ne.component.Uploader[type]);
    },

    /**
     * Get Class Name for mixin
     * @param {string} type
     * @returns {XML|string|void}
     */
    _getClassName: function(type) {
        return type.replace(type.charAt(0), type.charAt(0).toUpperCase());
    },

    /**
     * Send reqeust
     * @param {object} options
     *  @param {string} options.type Type of request
     */
    send: function(options) {
        if (options.type === 'remove') {
            this.removeRequest(options);
        } else {
            this.addRequest(options);
        }
    },

    /**
     * Mixin with selected connector
     * @param {object} connector
     */
    mixin: function(connector) {
        ne.util.extend(this, connector);
    }
});
