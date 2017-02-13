tui.util.defineNamespace("fedoc.content", {});
fedoc.content["pool.js.html"] = "      <div id=\"main\" class=\"main\">\n\n\n\n    \n    <section>\n        <article>\n            <pre class=\"prettyprint source linenums\"><code>/**\n * @fileoverview This is manager of input elements that act like file pool.\n * @author NHN Ent. FE Development Team &lt;dl_javascript@nhnent.com>\n */\n'use strict';\n\nvar consts = require('./consts');\n\nvar HIDDEN_FILE_INPUT_CLASS = consts.CONF.HIDDEN_FILE_INPUT_CLASS,\n    forEach = tui.util.forEach,\n    hasStamp = tui.util.hasStamp,\n    stamp = tui.util.stamp;\n\n/**\n * The pool for save files.\n * It's only for input[file] element save at browser that does not support file api.\n * @param {HTMLElement} planet - Form element\n * @class Pool\n */\nvar Pool = tui.util.defineClass(/** @lends Pool.prototype */{/*eslint-disable*/\n    init: function(planet) {/*eslint-enable*/\n        /**\n         * Submitter for file element to server\n         * Form element\n         * @type {HTMLElement}\n         */\n        this.planet = planet;\n\n        /**\n         * File data structure object\n         *  key=name : value=iuput[type=file](Element)\n         * @type {object}\n         */\n        this.files = {};\n    },\n\n    /**\n     * Save a input element[type=file], as value of file name.\n     * @param {HTMLInputElement} inputFileEl A input element that have to be saved\n     */\n    store: function(inputFileEl) {\n        var id = hasStamp(inputFileEl) &amp;&amp; stamp(inputFileEl),\n            filename, key;\n\n        if (!id) {\n            return;\n        }\n        filename = inputFileEl.value;\n        key = id + filename;\n        this.files[key] = inputFileEl;\n    },\n\n    /**\n     * Remove a input element[type=file] from pool.\n     * @param {object} params - A file name that have to be removed.\n     * @return {boolean} result\n     */\n    remove: function(params) {\n        var key = params.id + params.name,\n            element = this.files[key];\n\n        if (!element) {\n            return false;\n        }\n\n        delete this.files[key];\n        return true;\n    },\n\n    /**\n     * Empty pool\n     */\n    empty: function() {\n        this.files = {};\n    },\n\n    /**\n     * Plant files on pool to form input\n     */\n    plant: function() {\n        var planet = this.planet;\n        forEach(this.files, function(element, key) {\n            element.className = HIDDEN_FILE_INPUT_CLASS;\n            element.style.display = 'none';\n            planet.appendChild(element);\n            delete this.files[key];\n        }, this);\n    }\n});\n\nmodule.exports = Pool;\n</code></pre>\n        </article>\n    </section>\n\n\n\n</div>\n\n"