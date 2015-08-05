var ajax = require('../../src/js/connector/ajax.js');

describe('Ajax Connector util test', function() {
    var conn;

    beforeEach(function() {
        conn = {
            _uploader: {}
        };
        ne.util.extend(conn, ajax);
    });

    it('successPadding', function() {
        var res = '{"msg":"ok","filelist":[1, 2, 3]}',
            result,
            func = function(res) {
                result = res;
            };

        conn.successPadding(func, res);
        expect(result.items.length).toBe(3);
    });

    it('removePadding', function() {
        var res = '{"msg":"ok","name":"removedfile.jpg"}',
            result,
            func = function(res) {
                result = res;
            };

        conn.removePadding(func, res);
        expect(result.name).toBe('removedfile.jpg');
    });

});