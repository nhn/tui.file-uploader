/**
 * @fileoverview A Connector make connection between FileManager and file server API.<br> The Connector is interface.
 * @dependency ne-code-snippet 1.0.3, jquery1.8.3
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';
var Ajax = require('./ajax');
var Jsonp = require('./jsonp');
var Local = require('./local');

var ModuleSets = {
    'ajax': Ajax,
    'jsonp': Jsonp,
    'local': Local
};

/**
 * This is Interface to be implemented by connectors
 * @namespace Connector
 */
var Connector = {
    /**
     * A interface removeRequest to implement
     * @param {object} options A information for delete file
     * @memberof Connector
     */
    removeRequest: function(options) {
        throw new Error('The interface removeRequest does not exist');
    },

    /**
     * A interface addRequest to implement
     * @param {object} options A information for add file
     * @memberof Connector
     */
    addRequest: function(options) {
        throw new Error('The interface addRequest does not exist');
    }
};

/**
 * The factory module for connectors.
 * Get each connector by each type.
 * @namespace Factory
 */
var Factory = {
    /**
     * Choose connector
     * @param uploader
     * @returns {{_uploader: *}}
     * @memberof Factory
     */
    getConnector: function(uploader) {
        var type = uploader.type.toLowerCase(),
            conn = {
                _uploader: uploader
            };
        tui.util.extend(conn, Connector, ModuleSets[type] || Local);
        return conn;
    }
};

module.exports = Factory;
