var Item = require('../src/js/view/item.js');

describe('Item test', function() {

    var item,
        root = {
            $el : $('<div></div>')
        };

    beforeEach(function() {
        item = new Item({
            name: 'filename1',
            type: 'jpg',
            url: 'http://localhost:8009/filename.jpg',
            root: root,
            hiddenFrame: {}
        });
    });

    it('Item is define', function() {
        expect(item).toBeDefined();
    });

});