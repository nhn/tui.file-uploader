var Connector = require('../../src/js/connector/connector.js');

describe('Connector test', function() {

    var connJsonp,
        connAjax;

    beforeEach(function() {
        connJsonp = Connector.getConnector({
            type: 'jsonp'
        });

        connAjax = Connector.getConnector({
            type: 'ajax'
        });
    });

    it('defined', function() {
        expect(connJsonp).toBeDefined();
        expect(connAjax).toBeDefined();
    });

});
