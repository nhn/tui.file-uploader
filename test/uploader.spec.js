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
            listInfo: {
                list: $('<div class="list"></div>'),
                count: $('<div class="count"></div>'),
                size: $('<div class="size"></div>')
            }
        };
        uploader = new Uploader(options, $('<div class="uploader"></div>'));

        // uploader, batch
        options.isBatchTransfer = true;
        batchUploader = new Uploader(options, $('<div class="uploader"></div>'));
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
        var removeItemData = {
            name: 'file1',
            size: '10',
            id: '3'
        };

        spyOn(uploader._requester, 'remove');
        uploader.listView.fire('remove', removeItemData);

        expect(uploader._requester.remove).toHaveBeenCalledWith(removeItemData);
    });
});
