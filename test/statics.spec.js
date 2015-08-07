var statics = require('../src/js/statics.js');

describe('Util test', function() {
    it('isSupportDataForm', function () {
        var FormData = window.FormData || null,
            result = !!FormData;
        expect(statics.isSupportFormData()).toBe(result);
    });

    it('getFileSizeWithUnit', function() {
        var size1 = 1024,
            size2 = 1024 * 1024 * 120;
        expect(statics.getFileSizeWithUnit(size1)).toBe('1.00KB');
        expect(statics.getFileSizeWithUnit(size2)).toBe('120.00MB');
    });
});

