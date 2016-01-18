var Input = require('../../src/js/view/input.js');

describe('Input test', function() {

    var input,
        inputBatchTransfer,
        uploader;

    beforeEach(function() {
        uploader = {
            $el: $('<div id="uploader"></div>'),
            fileField: 'userfile[]',
            store: function() {
                // uploader store mock
            }
        };
        input = new Input({
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

        inputBatchTransfer = new Input({
            sizeunit: 'kb',
            url: 'http://localhost:8080/uploader.php',
            formTarget: 'hiddenTarget',
            isBatchTransfer: true,
            helper: 'http://localhost:8080/'
        }, uploader);
    });


    it('create Input', function() {
        expect(input).toBeDefined();
    });

    it('onChange event fire from onChange event handler', function() {
        var data;

        input.$input[0] = {
            value: 'changed file'
        };

        input.on('change', function(param) {
            data = param.target;
        });
        input.onChange();

        expect(data).toBe(input);
    });

    it('saveChange event filre form onSave(onChange) event handler', function() {
        var data;
        input.on('save', function(param) {
            data = param.element;
        });

        input.onSave();
        expect(data).not.toBe(input.$el[0]);
    });

    it('_resetInputElement, after onChange event callback called.', function() {
        var $input = input.$input;
        input._resetInputElement();
        expect(input.$input).not.toBe($input);
    });

});
