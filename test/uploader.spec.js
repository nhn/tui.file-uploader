var Uploader = require('../src/js/uploader.js');

describe('Uploader test', function() {
    var uploader,
        uploaderBatch,
        options;
    beforeEach(function() {
        options = {
            url: {
                send: 'http://localhost:8080/uploader.php',
                remove: 'http://localhost:8080/remove.php'
            },
            helper : {
                url: 'http://localhost:8080/helper.html',
                name: 'REDIRECT_URL'
            },
            resultTypeElementName: 'RESPONSE_TYPE',
            formTarget: 'hiddenFrame',
            callbackName: 'responseCallback',
            listInfo: {
                list: $('<div class="list"></div>'),
                count: $('<div class="count"></div>'),
                size: $('<div class="size"></div>')
            },
            sizeunit: 'KB',
            separator: ';'
        };
        uploader = new Uploader(options, $('<div class="uploader"></div>'));
        // uploader, batch
        options.isBatchTransfer = true;
        uploaderBatch = new Uploader(options, $('<div class="uploader"></div>'));
    });

    it('defined', function() {
        expect(uploader).toBeDefined();
        expect(uploader.listView).toBeDefined();
        expect(uploader.inputView).toBeDefined();
    });


    it('send by change', function() {
        var result;
        // mock connector
        uploader._connector.addRequest = function(data) {
            result = data;
        };

        uploader.inputView.fire('change');

        expect(result.type).toBe('add');
    });

    it('remove filre from ', function() {
        var result,
            name = 'remove.js';
        // mock connector
        uploader._connector.removeRequest = function(data) {
            result = data;
        };

        uploader.listView.fire('remove', {
            name: name
        });

        expect(result.type).toBe('remove');
        expect(result.data.name).toBe(name);
    });
});