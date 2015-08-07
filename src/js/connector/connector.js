/**
 * @fileoverview A Connector make connection between FileManager and file server API.<br> The Connector is interface.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <e0242@nhnent.com>
 */

var Ajax = require('./ajax.js');
var Jsonp = require('./jsonp.js');
var Local = require('./local.js');

/**
 * The connector class could connect with server and return server response to callback.
 * @constructor
 */
//var Connector = ne.util.defineClass(/** @lends ne.component.Uploader.Connector.prototype */{
//    init: function(uploader) {
//        var type = uploader.type.toLowerCase();
//
//        /**
//         * The uploader core
//         * @type ne.component.Uploader
//         */
//        this._uploader = uploader;
//        /**
//         * The connector module set
//         * @type {object}
//         */
//        this.conn = ModuleSets[type] || Local;
//    },
//
//    /**
//     * Send request
//     * @param {object} options
//     *  @param {string} options.type Type of request
//     */
//    send: function(options) {
//        if (options.type === 'remove') {
//            this.conn.removeRequest(options);
//        } else {
//            this.conn.addRequest(options);
//        }
//    },
//
//    /**
//     * Mixin with selected connector
//     * @param {object} connector
//     */
//    mixin: function(connector) {
//        ne.util.extend(this, connector);
//    }
//});

var ModuleSets = {
    'ajax': Ajax,
    'jsonp': Jsonp,
    'local': Local
};

var connFactory = {
    getConnector: function(uploader) {

        var type = uploader.type.toLowerCase();
        var conn = ne.util.extend({

            _uplodaer: uploader,

            send: function(options) {
                if (options.type === 'remove') {
                    this.removeRequest(options);
                } else {
                    this.addRequest(options);
                }
            }
        }, ModuleSets[type] || Local);

        return conn;
    }
};

module.exports = connFactory;
