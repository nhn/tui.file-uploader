'use strict';

var $ = require('jquery');

var ModernRequester = require('../../src/js/requester/modern');

if (window.FormData) {
    describe('Modern Requester', function() {
        var formView = jasmine.createSpyObj('formView', ['resetFileInput']);
        var uploader = {
            $targetFrame: $('iframe'),
            formView: formView,
            url: {
                send: 'http://fakeURL-upload',
                remove: 'http://fakeURL-remove'
            }
        };
        var requester;

        /* eslint-disable require-jsdoc */
        function createUploder(options) {
            formView.$el = $('<form></form>');
            formView.$fileInput = $('<input type="file" name="userfile[]">');

            formView.$el.on('submit', function(event) {
                event.preventDefault();
            });

            return new ModernRequester(options);
        }

        beforeEach(function() {
            requester = createUploder(uploader);
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

            // refer to http://api.jquery.com/jQuery.ajax/#jqXHR
            jasmine.Ajax.requests.mostRecent().respondWith({
                status: 200,
                responseText: '{}'
            });

            expect(jasmine.Ajax.requests.mostRecent().url).toEqual(uploader.url.send);
            expect(requester._uploadSuccess).toHaveBeenCalled();

            jasmine.Ajax.uninstall();
        });

        describe('when using batch transfer, ', function() {
            beforeEach(function() {
                uploader.isBatchTransfer = true;
                requester = createUploder(uploader);
            });

            it('remove items from pool.', function() {
                var removedItems = {
                    'bar': true,
                    'baz': true
                };

                requester.pool = [
                    {id: 'foo'},
                    {id: 'bar'},
                    {id: 'baz'}
                ];

                requester.remove(removedItems);

                expect(requester.pool).toEqual([{id: 'foo'}]);
            });
        });
    });
}
