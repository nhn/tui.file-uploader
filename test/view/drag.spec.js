'use strict';

var $ = require('jquery');

var DragAndDrop = require('../../src/js/view/drag.js');

describe('Drag and drop test', function() {
    var drag, $el;
    var mockEvent = {
        preventDefault: function() {},
        stopPropagation: function() {}
    };

    beforeEach(function() {
        $el = $('<div></div>');
        drag = new DragAndDrop($el);
    });

    it('enable if onDragEnter', function() {
        drag.onDragEnter(mockEvent);

        expect(drag.$el.hasClass(drag._enableClass)).toBe(true);
    });

    it('disable if onDragLeave', function() {
        drag._enable();
        expect(drag.$el.hasClass(drag._enableClass)).toBe(true);

        drag.onDragLeave(mockEvent);
        expect(drag.$el.hasClass(drag._enableClass)).toBe(false);
    });

    it('should fire "drop" - custom event when user drop the files', function() {
        spyOn(drag, 'fire');

        mockEvent.originalEvent = {
            dataTransfer: {
                files: {
                    file1: 'foo',
                    file2: 'bar'
                }
            }
        };

        drag.onDrop(mockEvent);
        expect(drag.fire).toHaveBeenCalledWith('drop', mockEvent.originalEvent.dataTransfer.files);
    });
});
