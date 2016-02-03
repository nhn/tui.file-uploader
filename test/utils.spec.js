'use strict';

var utils = require('../src/js/utils.js');

describe('Util test', function() {
    it('getFileSizeWithUnit', function() {
        var size1 = 1024,
            size2 = 1024 * 1024 * 120;
        expect(utils.getFileSizeWithUnit(size1)).toBe('1.00KB');
        expect(utils.getFileSizeWithUnit(size2)).toBe('120.00MB');
    });
});

