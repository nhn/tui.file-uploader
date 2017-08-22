'use strict';

var $ = require('jquery');
var snippet = require('tui-code-snippet');

var Form = require('../../src/js/view/form.js');
var consts = require('../../src/js/consts');

var HIDDEN_FILE_INPUT_CLASS = consts.className.HIDDEN_FILE_INPUT;

describe('Input test', function() {
    var uploader, normalForm, batchForm, html;

    beforeEach(function() {
        html = '<div id="uploader">' +
                    '<input type="file" name="userfile[]" />' +
                    '<button type="submit">submit</button>' +
                '</div>';
        uploader = {
            $container: $(html),
            fileField: 'userfile[]',
            url: {
                send: 'uploadURL',
                remove: 'removeURL'
            }
        };
        normalForm = new Form(uploader);

        batchForm = new Form(snippet.extend({
            isBatchTransfer: true
        }, uploader));
    });

    it('when batchTransfer, should have "submit element(jquery)"', function() {
        expect(normalForm.$submit).toBe(null);
        expect(batchForm.$submit.jquery).toBeTruthy();
    });

    it('when fileInput changed with truthy-value, should fire "change" custom event', function() {
        spyOn(normalForm, 'fire');

        normalForm.$fileInput[0] = {
            value: ''
        };
        normalForm.onChange();
        expect(normalForm.fire).not.toHaveBeenCalledWith('change');

        normalForm.$fileInput[0] = {
            value: 'fakeFile'
        };
        normalForm.onChange();
        expect(normalForm.fire).toHaveBeenCalledWith('change');
    });

    it('when call "resetFileInput", should create new fileInput jquery-element', function() {
        var $input = normalForm.$fileInput;

        normalForm.resetFileInput();
        expect(normalForm.$fileInput.jquery).toBeTruthy();
        expect(normalForm.$fileInput).not.toBe($input);
    });

    it('when call "clear",' +
        ' should remove all hidden file input elements and reset file input', function() {
        spyOn(normalForm, 'resetFileInput');

        expect(normalForm.$el.find('input').length).toBe(1);
        normalForm.$fileInput
            .clone()
            .addClass(HIDDEN_FILE_INPUT_CLASS)
            .appendTo(normalForm.$el);
        expect(normalForm.$el.find('input').length).toBe(2);

        normalForm.clear();
        expect(normalForm.resetFileInput).toHaveBeenCalled();
        expect(normalForm.$el.find('input').length).toBe(1);
    });
});
