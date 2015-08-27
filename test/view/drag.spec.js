var DragAndDrop = require('../../src/js/view/drag.js');

describe('Drag and drop test', function() {
	var drag;
	beforeEach(function() {
		var options = {},
		uploader = {
			$el : $('<div></div>')
		};
		drag = new DragAndDrop(options, uploader);
	});

	it('defined', function() {
		expect(drag).toBeDefined();
	});
});
