var Form = require('../../src/js/view/form.js');

describe('Input test', function() {

    var form,
        inputBatchTransfer,
        uploader;

    beforeEach(function() {
        uploader = {
            $el: $('<div id="uploader"></div>'),
            fileField: 'userfile[]'
        };
        form = new Form({
            sizeunit: 'kb',
            url: 'http://localhost:8080/uploader.php',
            formTarget: 'hiddenTarget',
            template: {
                form: ['<form enctype="multipart/form-data" id="formData" method="post">',
                    '<input type="hidden" name="MAX_FILE_SIZE" value="3000000" />',
                    //'<input type="file" id="fileAttach" name="userfile[]" multiple="true" />',
                    '</form>'].join('')
            },
            helper: 'http://localhost:8080/'
        }, uploader);

        inputBatchTransfer = new Form({
            sizeunit: 'kb',
            url: 'http://localhost:8080/uploader.php',
            formTarget: 'hiddenTarget',
            isBatchTransfer: true,
            helper: 'http://localhost:8080/'
        }, uploader);
    });


    it('create Input', function() {
        expect(form).toBeDefined();
    });

    it('onChange event fire from onChange event handler', function() {
        var data;

        form.$fileInput[0] = {
            value: 'changed file'
        };

        form.on('change', function(param) {
            data = param.target;
        });
        form.onChange();

        expect(data).toBe(form);
    });

    it('saveChange event filre form onSave(onChange) event handler', function() {
        var data;
        form.on('save', function(param) {
            data = param.element;
        });

        form.onSave();
        expect(data).not.toBe(form.$el[0]);
    });

    it('_resetInputElement, after onChange event callback called.', function() {
        var $input = form.$fileInput;
        form._resetInputElement();
        expect(form.$fileInput).not.toBe($input);
    });

});
