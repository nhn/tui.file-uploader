/**
 * @fileoverview A Connector make connection between FileManager and file server API.<br> The Connector is interface.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author  NHN entertainment FE dev team Jein Yi <jein.yi@nhnent.com>
 */

ne.util.defineNamespace('ne.component.Uploader.Connector');

/**
 * The connector class could connect with server and return server response to callback.
 * @constructor
 */
ne.component.Uploader.Connector = ne.util.defineClass(/** @lends ne.component.Uploader.Connector.prototype */{
    init: function(uploader) {
        var type = this._getMixinModuleName(uploader.type);

        this._uploader = uploader;
        this.mixin(ne.component.Uploader[type]);
    },

    /**
     * Get Class Name for mixin
     * @param {string} type
     * @returns {XML|string|void}
     */
    _getMixinModuleName: function(type) {
        return type.replace(type.charAt(0), type.charAt(0).toUpperCase());
    },

    /**
     * Send request
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
