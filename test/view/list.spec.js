'use strict';

var utils = require('../../src/js/utils.js');
var List = require('../../src/js/view/list.js');
var consts = require('../../src/js/consts.js');

describe('List test', function() {
    var fileItem;
    var listA, listB;
    var $rootA, $rootB;

    beforeEach(function() {
        fileItem = {
            name: 'filename1.jpg',
            type: 'jpg',
            id: '5',
            size: 10
        };

        $rootA = $('<div></div>');
        listA = new List({
            type: 'simple'
        }, $rootA);

        $rootB = $('<div></div>');
        listB = new List({
            type: 'table'
        }, $rootB);
    });

    describe('create simple list,', function() {
        it('list container has "ul" element.', function() {
            expect(listA.$el.find('ul').length).toBe(1);
        });

        it('each item of list has "li" element.', function() {
            listA._addFileItems(fileItem);
            expect(listA.$list.find('li').length).toBe(1);
        });
    });

    describe('create table list,', function() {
        it('list container has "table" element.', function() {
            expect(listB.$el.find('table').length).toBe(1);
        });

        it('each item of list has "tr" element.', function() {
            listB._addFileItems(fileItem);
            expect(listB.$list.find('tr').length).toBe(1);
        });
    });

    describe('private method', function() {
        var addedfiles, removedFiles;
        beforeEach(function() {
            addedfiles = [
                {
                    name: 'filename1.jpg',
                    type: 'jpg',
                    id: 'A',
                    size: 10
                },
                {
                    name: 'filename1.jpg',
                    type: 'jpg',
                    id: 'B',
                    size: 10
                }
            ];
            removedFiles = [
                {
                    id: 'A',
                    state: true
                },
                {
                    id: 'B',
                    state: true
                }
            ];
        });
        it('"addFileItems" add items.', function() {
            listA._addFileItems(addedfiles);
            expect(listA.items.length).toBe(addedfiles.length);
        });

        it('"removeFileItems" remove items.', function() {
            listA._addFileItems(addedfiles);
            listA._removeFileItems(removedFiles);
            expect(listA.items.length).toBe(0);
        });

        it('"findIndexOfItem" return index from item id.', function() {
            listA._addFileItems(addedfiles);
            expect(listA._findIndexOfItem('B')).toBe(1);
        });

        it('"setHasItemsClassName" set class name on list element as having items', function() {
            var hasItemsClassName = consts.CLASSNAME.HAS_ITEMS;

            listA._addFileItems(addedfiles);
            listA._setHasItemsClassName();
            expect(listA.$el.hasClass(hasItemsClassName)).toBe(true);

            listA._removeFileItems(removedFiles);
            listA._setHasItemsClassName();
            expect(listA.$el.hasClass(hasItemsClassName)).toBe(false);
        });
    });

    describe('public method', function() {
        it('"update" is called with remove type, items are removed.', function() {
            spyOn(listA, '_removeFileItems');
            listA.update([], 'remove');
            expect(listA._removeFileItems).toHaveBeenCalled();
        });

        it('"update" is called with no type, items are added.', function() {
            spyOn(listA, '_addFileItems');
            listA.update([]);
            expect(listA._addFileItems).toHaveBeenCalled();
        });

        it('"clear" reset all items.', function() {
            listA._addFileItems(fileItem);
            expect(listA.items.length).toBe(1);
            listA.clear();
            expect(listA.items.length).toBe(0);
        });
    });

    it('create with "item" option, each item set to this value.', function() {
        $rootA = $('<div></div>');
        listA = new List({
            type: 'simple',
            item: 'test'
        }, $rootA);

        listA._addFileItems(fileItem);
        expect(listA.$list.find('li').html()).toBe('test');
    });

    describe('create with "columnList" option,', function() {
        var columnList;

        beforeEach(function() {
            $rootB = $('<div></div>');
            columnList = [
                {
                    header: '{{checkbox}}',
                    body: '{{checkbox}}',
                    width: 10
                },
                {
                    header: 'type',
                    body: '{{filetype}}',
                    width: 5
                },
                {
                    header: 'name',
                    body: '{{filename}}',
                    width: 20
                },
                {
                    header: 'size',
                    body: '{{filesize}}'
                },
                {
                    header: 'remove',
                    body: '{{removeButton}}'
                }
            ];
            listB = new List({
                type: 'table',
                columnList: columnList
            }, $rootB);
        });

        it('elements of table are created as length of column list.', function() {
            var len = columnList.length;
            expect(listB.$el.find('col').length).toBe(len);
            expect(listB.$el.find('th').length).toBe(len);
            listB._addFileItems(fileItem);
            expect(listB.$el.find('td').length).toBe(len);
        });

        it('width of each column group element is setting.', function() {
            var $columns = listB.$el.find('col');
            expect($columns.eq(0).attr('width')).toBe(columnList[0].width.toString());
            expect($columns.eq(1).attr('width')).toBe(columnList[1].width.toString());
            expect($columns.eq(2).attr('width')).toBe(columnList[2].width.toString());
        });

        it('checkbox is created in header when header property has {{checkbox}}.', function() {
            expect(listB.$checkbox).not.toBe(null);
        });

        it('checkbox is created in each item when body property has {{checkbox}}.', function() {
            listB._addFileItems(fileItem);
            listB._addFileItems(fileItem);
            expect(listB.$list.find(':checkbox').length).toBe(2);
        });

        it('remove button is created in each item when body property has {{removeButton}}.', function() {
            listB._addFileItems(fileItem);
            listB._addFileItems(fileItem);
            expect(listB.$list.find('button').length).toBe(2);
        });

        it('file infos are matched in each item ' +
            'when body property has {{filetype}}, {{filename}}, {{filesize}}.', function() {
            var $columns;
            listB._addFileItems(fileItem);
            $columns = listB.$list.find('td');
            expect($columns.eq(1).html()).toBe(fileItem.type);
            expect($columns.eq(2).html()).toBe(fileItem.name);
            expect($columns.eq(3).html()).toBe(utils.getFileSizeWithUnit(fileItem.size));
        });
    });

    describe('checkbox action', function() {
        beforeEach(function() {
            listB._addFileItems([
                {
                    name: 'filename1.jpg',
                    type: 'jpg',
                    id: 'A',
                    size: 10
                },
                {
                    name: 'filename2.png',
                    type: 'jpg',
                    id: 'B',
                    size: 10
                },
                {
                    name: 'filename2.png',
                    type: 'jpg',
                    id: 'C',
                    size: 10
                }
            ]);
        });

        it('when checked item, index number add on list.', function() {
            listB._setCheckedItemsIndex('A', true);
            listB._setCheckedItemsIndex('C', true);
            expect(listB.checkedIndexList).toEqual([0, 2]);
        });

        it('when unchecked item, index number is removed on list.', function() {
            listB._setCheckedItemsIndex('B', true);
            listB._setCheckedItemsIndex('C', true);
            expect(listB.checkedIndexList).toEqual([1, 2]);
            listB._setCheckedItemsIndex('B', false);
            expect(listB.checkedIndexList).toEqual([2]);
        });

        it('when all items are checked, checkbox in header is checked.', function() {
            var checkedClassName = consts.CLASSNAME.IS_CHECKED;
            spyOn(utils, 'getLabelElement').and.returnValue(listB.$checkbox);

            listB._changeCheckboxInHeader(true);
            expect(listB.$checkbox.hasClass(checkedClassName)).toBe(true);
        });
    });
});
