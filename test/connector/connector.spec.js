var jsonp = require('../../src/js/connector/jsonp.js');
var ajax = require('../../src/js/connector/ajax.js');
var local = require('../../src/js/connector/local.js');
var Connector = require('../../src/js/connector/connector.js');

describe('Connector test', function() {

    var connJsonp,
        connAjax;

    beforeEach(function() {
        connJsonp = new Connector({
            type: 'jsonp'
        });

        connAjax = new Connector({
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

    it('_getModuleSet by type', function() {
        var construct1 = connJsonp._getModuleSet('jsonp'),
            construct2 = connJsonp._getModuleSet('ajax'),
            construct3 = connJsonp._getModuleSet('local'),
            construct4 = connJsonp._getModuleSet('xxx');
        expect(construct1).toBe(jsonp);
        expect(construct2).toBe(ajax);
        expect(construct3).toBe(local);
        expect(construct4).toBe(local);
    });
});
