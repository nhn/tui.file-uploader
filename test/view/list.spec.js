var utils = require('../../src/js/utils.js');
var List = require('../../src/js/view/list.js');

describe('List test', function() {
    var list,
        listEl,
        counterEl,
        sizeEl,
        itemInfo;

    beforeEach(function() {
        listEl = $('<div class="list"></div>');
        counterEl = $('<div class="counter"></div>');
        sizeEl = $('<div class="size"></div>');

        itemInfo = {
            name: 'filename1.jpg',
            type: 'jpg',
            id: '1',
            size: 10
        };

        list = new List({
            list: listEl,
            count: counterEl,
            size: sizeEl
        });
    });

    it('_createItem', function() {
        var item = list._createItem(itemInfo);
        expect(item).toBeDefined();
    });

    it('_updateTotalCount', function() {
        var count = 10;
        list._updateTotalCount(count);
        expect(parseInt(list.$counter.html(), 10)).toBe(count);
    });

    it('_updateTotalCount Counter without count parameter', function() {
        list._updateTotalCount();
        expect(parseInt(list.$counter.html(), 10)).toBe(0);
    });

    it('_updateTotalUsage', function() {
        var size = 30;
        list._updateTotalUsage(size);
        expect(parseFloat(list.$size.html())).toBe(30);
    });

    it('_updateTotalUsage without param', function() {
        list._updateTotalUsage();
        expect(parseFloat(list.$size.html())).toBe(0);
    });

    it('_updateTotalUsage without param, After file', function() {
        list._addFileItems(itemInfo);
        list._updateTotalUsage();
        expect(parseFloat(list.$size.html())).toBe(10);
    });

    it('updateTotalInfo', function() {
        var info = {
            count: 10,
            size: 1024
        };

        list.updateTotalInfo(info);
        expect(parseInt(list.$counter.html(), 10)).toBe(10);
        expect(parseFloat(list.$size.html())).toBe(1);
    });

    it('removeFile', function() {
        var name;

        list.on('remove', function(data) {
            name = data.name;
        });

        list._removeFile({
            name: 'test'
        });

        expect(name).toBe('test');
    });

    it('_addFileItems', function() {
        list._addFileItems(itemInfo);

        expect(list.items.length).toBe(1);
    });

    it('update add file', function() {
        var info = [itemInfo];
        list.update(info);
        expect(list.items.length).toBe(1);
    });

    it('remove file via _removeFileItem', function() {
        list._addFileItems(itemInfo);
        expect(list.items.length).toBe(1);

        list._removeFileItem(itemInfo.id);
        expect(list.items.length).toBe(0);
    });

    it('remove file via update', function() {
        var info = {
            id : itemInfo.id,
            type: 'remove'
        };
        list._addFileItems(itemInfo);
        expect(list.items.length).toBe(1);

        list.update(info);
        expect(list.items.length).toBe(0);
    });

    it('remove file via update, but not match', function() {
        list._addFileItems(itemInfo);

        expect(list.items.length).toBe(1);

        var info = {
            id: 'foobarfoobar',
            type: 'remove'
        };
        list.update(info);

        expect(list.items.length).toBe(1);
    });

});
