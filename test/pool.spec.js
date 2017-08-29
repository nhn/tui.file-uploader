'use strict';

var $ = require('jquery');
var snippet = require('tui-code-snippet');

var Pool = require('../src/js/pool.js');

describe('Input elements[type=files] pool behavior test.', function() {
    var inputF1, inputF2, inputF3,
        stampId1, stampId2, stampId3,
        key1, key2, key3,
        stamp = snippet.stamp,
        pool,
        planet;

    beforeEach(function() {
        planet = document.createElement('div');
        pool = new Pool(planet);
        inputF1 = document.createElement('input');
        inputF2 = document.createElement('input');
        inputF3 = document.createElement('input');
        stampId1 = stamp(inputF1);
        stampId2 = stamp(inputF2);
        stampId3 = stamp(inputF3);

        key1 = stampId1;
        key2 = stampId2;
        key3 = stampId3;
    });

    it('store file to pool', function() {
        pool.store(inputF1);
        pool.store(inputF2);
        pool.store(inputF3);

        expect(pool.files[key1]).toEqual(inputF1);
        expect(pool.files[key2]).toEqual(inputF2);
        expect(pool.files[key3]).toEqual(inputF3);
    });

    it('remove file from pool', function() {
        pool.store(inputF1);
        pool.store(inputF2);
        pool.store(inputF3);
        pool.remove(stampId1);

        expect(pool.files[key1]).not.toBeDefined();
        expect(pool.files[key2]).toBeDefined();
        expect(pool.files[key3]).toBeDefined();
    });

    it('remove file from pool', function() {
        pool.store(inputF1);
        pool.store(inputF2);
        pool.store(inputF3);

        pool.empty();

        expect(pool.files[key1]).not.toBeDefined();
        expect(pool.files[key2]).not.toBeDefined();
        expect(pool.files[key3]).not.toBeDefined();
    });

    it('plant pool elements to other element', function() {
        // store inputs
        pool.store(inputF1);
        pool.store(inputF2);
        pool.store(inputF3);

        // plant to planet
        pool.plant(planet);

        // check plant result
        expect(pool.files[key1]).not.toBeDefined();
        expect(pool.files[key2]).not.toBeDefined();
        expect(pool.files[key3]).not.toBeDefined();

        // check planet has inputs
        expect($.contains(planet, inputF1)).toBe(true);
        expect($.contains(planet, inputF2)).toBe(true);
        expect($.contains(planet, inputF3)).toBe(true);
    });
});
