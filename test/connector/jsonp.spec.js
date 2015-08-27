var jsonp = require('../../src/js/connector/jsonp.js');

describe('Jsonp Connector test', function() {

    var conn,
        conn2;

    beforeEach(function() {
        conn = {
            _uploader: {
                isCrossDomain: function() {
                    return false;
                }
            }
        };
        conn2 = {
            _uploader: {
                isCrossDomain: function() {
                    return true;
                },
                separator: ';'
            }
        };
        ne.util.extend(conn, jsonp);
        ne.util.extend(conn2, jsonp);
    });

    it('_getSplitItems with id', function() {
        var data = {
            status: 'success;faild;success',
            names: 'name.jpg;name.sh;name.png',
            sizes: '150;3.14;50.04',
            ids: 'id1;id2;id3'
        }, res;

        res = conn2._getSplitItems(data);

        expect(res.length).toBe(2);
        expect(res[1].name).toBe('name.png');
        expect(res[1].id).toBe('id3');
    });

    it('_getSplitItems with id', function() {
        var data = {
            status: 'success;success;success',
            names: 'name.jpg;name.sh;name.png',
            sizes: '150;3.14;50.04'
        }, res;

        res = conn2._getSplitItems(data);

        expect(res.length).toBe(3);
        expect(res[1].name).toBe('name.sh');
        expect(res[2].id).toBe('name.png');
    });

    it('successPadding, crossDoamin case', function() {
        var result,
            data = {
                status: 'success;success',
                names: 'test.jpg;test.xls',
                sizes: '150;3.14'
            },
            fnc = function(res) {
                result = res;
            },
            items;

        conn2.successPadding(fnc, data);
        items = result.items;
        expect(items.length).toBe(2);
        expect(items[1].name).toBe('test.xls');
        expect(items[0].size).toBe('150');
    });

    it('successPadding, sameDoamin case', function() {
        var result,
            name = 'test.ppt',
            usage = '14.7',
            id = 'id',
            data = {
                filelist: [{
                    name: name,
                    size: usage,
                    id: 'id1'
                }]
            },
            fnc = function(res) {
                result = res;
            },
            items;

        conn.successPadding(fnc, data);
        items = result.items;
        expect(items.length).toBe(1);
        expect(items[0].name).toBe(name);
        expect(items[0].size).toBe(usage);
    });

    it('removePadding', function() {
        var result,
            name = 'test.xls',
            data = {
                name: name
            },
            fnc = function(res) {
                result = res;
            };

        conn.removePadding(fnc, data);
        expect(result.name).toBe(name);
    });
});