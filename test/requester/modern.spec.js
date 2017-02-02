'use strict';

var ModernRequester;
if (!window.FormData) {
    return;
}

ModernRequester = require('../../src/js/requester/modern');
require('jasmine-ajax');
describe('Modern Requester', function() {
    var formView = jasmine.createSpyObj('formView', ['resetFileInput']),
        uploader = {
            $targetFrame: $('iframe'),
            formView: formView,
            url: {
                send: 'http://fakeURL-upload',
                remove: 'http://fakeURL-remove'
            }
        },
        requester;

    beforeEach(function() {
        formView.$el = $('<form></form>');
        formView.$fileInput = $('<input type="file" name="userfile[]">');
        requester = new ModernRequester(uploader);

        formView.$el.on('submit', function(event) {
            event.preventDefault();
        });
    });

    it('When store, should resetFileInput and fire "stored" event', function() {
        spyOn(requester, 'fire');
        requester.store();

        expect(requester.fire).toHaveBeenCalledWith('stored', jasmine.any(Array));
        expect(uploader.formView.resetFileInput).toHaveBeenCalled();
    });

    it('When upload, should request ajax and call success-callback if succeed', function() {
        jasmine.Ajax.install();
        spyOn(requester, '_uploadSuccess');

        requester.upload();
        jasmine.Ajax.requests.mostRecent().respondWith({
            status: 200,
            type: 'text/plain'
        });

        expect(jasmine.Ajax.requests.mostRecent().url).toEqual(uploader.url.send);
        expect(requester._uploadSuccess).toHaveBeenCalled();

        jasmine.Ajax.uninstall();
    });
});
