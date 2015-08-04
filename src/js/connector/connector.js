/**
 * @fileoverview A Connector make connection between FileManager and file server API.<br> The Connector is interface.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author  NHN entertainment FE dev team Jein Yi <jein.yi@nhnent.com>
 */


var Ajax = require('./ajax.js');
var Jsonp = require('./jsonp.js');

/**
 * The connector class could connect with server and return server response to callback.
 * @constructor
 */
var Connector = ne.util.defineClass(/** @lends ne.component.Uploader.Connector.prototype */{
    init: function(uploader) {
        var target = uploader.type === 'ajax' ? Ajax : Jsonp;

        this._uploader = uploader;
        this.mixin(target);
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

module.exports = Connector;
