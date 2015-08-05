var Item = require('../../src/js/view/item.js');

describe('Item test', function() {

    var item,
        itemH,
        root = {
            $el : $('<div></div>')
        };

    beforeEach(function() {
        item = new Item({
            name: 'filename1.jpg',
            type: 'jpg',
            url: 'http://localhost:8009/filename.jpg',
            root: root,
            hiddenFrame: {}
        });
        itemH = new Item({
            name: 'filename2.png',
            url: 'http://localhost:8009/filename2.png',
            root: root,
            hiddenFrame: {},
            helper: 'http://localhost:8009/helper.html'
        });
    });

    it('Item is define', function() {
        expect(item).toBeDefined();
        expect(itemH).toBeDefined();
    });

    it('itemH type by _extractExtension', function() {
        expect(itemH._type).toBe('png');
    });

    it('destroy', function() {
        var containBefore,
            containAfter;
        containBefore = $.contains(root.$el[0], item._$el[0]);
        item.destroy();
        containAfter = $.contains(root.$el[0], item._$el[0]);
        expect(containBefore).toBe(true);
        expect(containAfter).toBe(false);

    });

    it('onclickEvent handler fire remove event', function() {
        var name,
            id,
            type;

        item.on('remove', function(data) {
            name = data.filename;
            id = data.id;
            type = data.type
        });

        item._onClickEvent();

        expect(name).toBe(item.name);
        expect(id).toBe(item._id);
        expect(type).toBe('remove');
    });
});