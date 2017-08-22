'use strict';

var $ = require('jquery');

var OldRequester = require('../../src/js/requester/old');

describe('Old Requester', function() {
    var formView = jasmine.createSpyObj('formView', ['resetFileInput', 'clear']),
        uploader = {
            $targetFrame: $('iframe'),
            formView: formView
        },
        requester;

    beforeEach(function() {
        formView.$el = $('<form></form>');
        formView.$fileInput = $('<input>');
        requester = new OldRequester(uploader);

        formView.$el.on('submit', function(event) {
            event.preventDefault();
        });
    });

    it('should store fileInput from formView to pool', function() {
        spyOn(requester.pool, 'store');

        requester.store();
        expect(requester.pool.store).toHaveBeenCalledWith(formView.$fileInput[0]);
    });

    it('when store, should reset fileInput and fire "stored" event', function() {
        spyOn(requester, 'fire');

        requester.store();
        expect(formView.resetFileInput).toHaveBeenCalled();
        expect(requester.fire).toHaveBeenCalledWith('stored', jasmine.any(Array));
    });

    it('when upload, the pool should be planted', function() {
        spyOn(requester.pool, 'plant');

        requester.upload();
        expect(requester.pool.plant).toHaveBeenCalled();
    });
});
