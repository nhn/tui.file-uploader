'use strict';

var $ = require('jquery');

var Uploader = require('../src/js/uploader.js');

describe('Uploader test', function() {
    var uploader,
        batchUploader,
        options;

    beforeEach(function() {
        options = {
            url: {
                send: 'fakeURL-send',
                remove: 'fakeURL-remove'
            },
            formTarget: 'hiddenFrame',
            listUI: {
                type: 'list'
            }
        };
        uploader = new Uploader($('<div class="uploader"></div>'), options);

        // uploader, batch
        options.isBatchTransfer = true;
        batchUploader = new Uploader($('<div class="uploader"></div>'), options);
    });

    it('should have formView, listView', function() {
        expect(uploader.formView).toBeDefined();
        expect(uploader.listView).toBeDefined();
    });

    it('when fired change event from formView, normalUploader should store and submit file(s)', function() {
        spyOn(uploader._requester, 'store');
        spyOn(uploader._requester, 'upload');

        uploader.formView.fire('change');
        expect(uploader._requester.store).toHaveBeenCalled();
        expect(uploader._requester.upload).toHaveBeenCalled();
    });

    it('when fired change event from formView, batchUploader should store and not submit file(s)', function() {
        spyOn(batchUploader._requester, 'store');
        spyOn(batchUploader._requester, 'upload');

        batchUploader.formView.fire('change');
        expect(batchUploader._requester.store).toHaveBeenCalled();
        expect(batchUploader._requester.upload).not.toHaveBeenCalled();
    });

    it('when fired remove event from listView, should remove file', function() {
        spyOn(uploader._requester, 'remove');
        uploader.listView.fire('remove', {'A': true});

        expect(uploader._requester.remove).toHaveBeenCalledWith({idList: ['A']});
    });
});
