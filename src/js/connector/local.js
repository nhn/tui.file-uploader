/**
 * @fileoveview This Connector make connection between Uploader and html5 file api.
 * @author NHN Ent. FE Development Team <e0242@nhnent.com>
 */
var statics = require('../statics.js');

/**
 * The modules will be mixed in connector by type.
 */
var Local = {/** @lends ne.component.Uploader.Local */
    /**
     * Add Request, save files to array.
     * @param data
     */
    addRequest: function(data) {
        this._saveFile(statics.isSupportFormData());
        data.success({
            items: this._result,
            isReset: true
        });
    },

    /**
     * Save file to pool
     * @param {boolean} isSupportAjax Whether FormData is supported or not
     * @private
     */
    _saveFile: function(isSupportAjax) {
        var uploader = this._uploader,
            inputView = uploader.inputView,
            fileEl = inputView.$input[0],
            result = [];

        if (isSupportAjax) {
            ne.util.forEach(fileEl.files, function(item) {
                result.push(item);
            }, this);
        } else {
            result.push({
                name: fileEl.value,
                element: fileEl
            });
        }

        this._result = result;
    },

    /**
     * Make form data to send POST(FormDate supported case)
     * @returns {*}
     * @private
     */
    _makeFormData : function() {
        var uploader = this._uploader,
            form = new window.FormData(uploader.inputView.$el[0]);
        ne.util.forEach(this._result, function(item) {
            form.append(uploader.fileField, item);
        });
        return form;
    },

    removeRequest: function(data) {
        console.log('remove', data);
    },

    /**
     * Send files in a batch.
     * @param callback
     */
    submit: function(callback) {
        var form = this._makeFormData();
        $.ajax({
            url: this._uploader.url.send,
            type: 'POST',
            data: form,
            success: callback,
            processData: false,
            contentType: false
        });
    }
};

module.exports = Local;