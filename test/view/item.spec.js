'use strict';

var $ = require('jquery');

var Item = require('../../src/js/view/item.js');
var consts = require('../../src/js/consts.js');
var utils = require('../../src/js/utils.js');

describe('Item test -', function() {
    var $root, template, itemA, itemB;

    beforeEach(function() {
        $root = $('<ul></ul>');
        template = '<li>{{checkbox}} {{removeButton}}</li>';

        itemA = new Item($root, {
            name: 'filename1.jpg',
            id: '1',
            size: '10'
        }, template);

        itemB = new Item($root, {
            name: 'filename2.png',
            id: '2',
            size: '10'
        }, template);
    });

    it('each item should have type from name', function() {
        expect(itemA.type).toBe('jpg');
        expect(itemB.type).toBe('png');
    });

    it('when destroyed, item should not have elements', function() {
        expect($root.children().length).toBe(2);

        itemA.destroy();
        expect($root.children().length).toBe(1);

        itemB.destroy();
        expect($root.children().length).toBe(0);
    });

    describe('template', function() {
        it('has "checkbox" property, create a checkbox in item.', function() {
            expect(itemA.$checkbox.length).toBe(1);
        });

        it('has "removeButton" property, create a remove button in item.', function() {
            expect(itemA.$removeButton.length).toBe(1);
        });
    });

    it('when remove button is clicked, should fire remove event', function() {
        spyOn(itemA, 'fire');

        itemA._onClickEvent();

        expect(itemA.fire).toHaveBeenCalledWith('remove', {'1': true});
    });

    describe('checkbox is changed,', function() {
        beforeEach(function() {
            itemA.$checkbox.prop('checked', true);
        });

        it('should fire "check" custom event.', function() {
            spyOn(itemA, 'fire');

            itemA.$checkbox.change();

            expect(itemA.fire).toHaveBeenCalledWith('check', {
                id: itemA.id,
                name: itemA.name,
                size: itemA.size,
                state: true
            });
        });

        it('this element set checked state.', function() {
            var $target = utils.getLabelElement(itemA.$checkbox);

            itemA.$checkbox.change();
            expect($target.hasClass(consts.className.IS_CHECKED)).toBe(true);

            itemA.$checkbox.prop('checked', false);
            itemA.$checkbox.change();
            expect($target.hasClass(consts.className.IS_CHECKED)).toBe(false);
        });
    });
});
