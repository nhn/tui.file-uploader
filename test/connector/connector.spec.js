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

    it('send, jsonp case', function() {
        var resultRm,
            resultAdd,
            rmName = 'removename.txt',
            addName = 'addname.txt';
        //mocking
        connJsonp.removeRequest = function(res) {
            resultRm = res;
        };
        connJsonp.addRequest = function(res) {
            resultAdd = res;
        };

        connJsonp.send({
            type: 'remove',
            name: rmName
        });
        connJsonp.send({
            name: addName
        });

        expect(resultRm.name).toBe(rmName);
        expect(resultAdd.name).toBe(addName);
    });

    it('send, ajax case', function() {
        var resultRm,
            resultAdd,
            rmName = 'removename.txt',
            addName = 'addname.txt';
        //mocking
        connAjax.removeRequest = function(res) {
            resultRm = res;
        };
        connAjax.addRequest = function(res) {
            resultAdd = res;
        };

        connAjax.send({
            type: 'remove',
            name: rmName
        });
        connAjax.send({
            name: addName
        });

        expect(resultRm.name).toBe(rmName);
        expect(resultAdd.name).toBe(addName);
    });

});
