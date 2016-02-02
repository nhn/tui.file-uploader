'use strict';

var Item = require('../../src/js/view/item.js');

describe('Item test', function() {

    var root, itemA, itemB;

    beforeEach(function() {
        root = {
            $el : $('<div></div>')
        };
        itemA = new Item({
            name: 'filename1.jpg',
            id: '1',
            size: '10',
            root: root
        });

        itemB = new Item({
            name: 'filename2.png',
            id: '2',
            size: '10',
            root: root
        });
    });

    it('should have type from name', function() {
        expect(itemA.type).toBe('jpg');
        expect(itemB.type).toBe('png');
    });

    it('should have $removeBtn', function() {
        expect(itemA.$removeBtn.jquery).toBeTruthy();
    });

    it('when destroyed, should not have elements', function() {
        expect(root.$el.children().length).toBe(2);

        itemA.destroy();
        expect(root.$el.children().length).toBe(1);

        itemB.destroy();
        expect(root.$el.children().length).toBe(0);
    });

    it('when removeBtn clicked, should fire remove event', function() {
        spyOn(itemA, 'fire');

        itemA._onClickEvent();

        expect(itemA.fire).toHaveBeenCalledWith('remove', {
            name: itemA.name,
            id: itemA.id,
            type: 'remove'
        });
    });
});
