'use strict';

var utils = require('../src/js/utils.js');

describe('Util test', function() {
    it('getFileSizeWithUnit', function() {
        var size1 = 1024,
            size2 = 1024 * 1024 * 120;
        expect(utils.getFileSizeWithUnit(size1)).toBe('1.00 KB');
        expect(utils.getFileSizeWithUnit(size2)).toBe('120.00 MB');
    });

    it('template', function() {
        var source = '<div>{{text}}</div><div>{{anotherText}}</div>',
            prop = {
                text: 'hello world',
                anotherText: 'new world'
            };

        expect(utils.template(prop, source)).toEqual(
            '<div>hello world</div><div>new world</div>'
        );
    });

    it('isCrossDomain', function() {
        var url = 'http://fakeURL';
        expect(utils.isCrossDomain(url)).toBe(true);
    });
});
