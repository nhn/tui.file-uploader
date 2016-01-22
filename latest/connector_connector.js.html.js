tui.util.defineNamespace("fedoc.content", {});
fedoc.content["connector_connector.js.html"] = "      <div id=\"main\" class=\"main\">\n\n\n\n    \n    <section>\n        <article>\n            <pre class=\"prettyprint source linenums\"><code>/**\n * @fileoverview A Connector make connection between FileManager and file server API.&lt;br> The Connector is interface.\n * @dependency ne-code-snippet 1.0.3, jquery1.8.3\n * @author NHN Ent. FE Development Team &lt;dl_javascript@nhnent.com>\n */\n'use strict';\nvar Ajax = require('./ajax');\nvar Jsonp = require('./jsonp');\nvar Local = require('./local');\n\nvar ModuleSets = {\n    'ajax': Ajax,\n    'jsonp': Jsonp,\n    'local': Local\n};\n\n/**\n * This is Interface to be implemented by connectors\n * @namespace Connector\n */\nvar Connector = {\n    /**\n     * A interface removeRequest to implement\n     * @param {object} options A information for delete file\n     * @memberof Connector\n     */\n    removeRequest: function(options) {\n        throw new Error('The interface removeRequest does not exist');\n    },\n\n    /**\n     * A interface addRequest to implement\n     * @param {object} options A information for add file\n     * @memberof Connector\n     */\n    addRequest: function(options) {\n        throw new Error('The interface addRequest does not exist');\n    }\n};\n\n/**\n * The factory module for connectors.\n * Get each connector by each type.\n * @namespace Factory\n */\nvar Factory = {\n    /**\n     * Choose connector\n     * @param uploader\n     * @returns {{_uploader: *}}\n     * @memberof Factory\n     */\n    getConnector: function(uploader) {\n        var type = uploader.type.toLowerCase(),\n            conn = {\n                _uploader: uploader\n            };\n        tui.util.extend(conn, Connector, ModuleSets[type] || Local);\n        return conn;\n    }\n};\n\nmodule.exports = Factory;\n</code></pre>\n        </article>\n    </section>\n\n\n\n</div>\n\n"