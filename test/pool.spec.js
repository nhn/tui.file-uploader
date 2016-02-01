var Pool = require('../src/js/pool.js');

describe('Input elements[type=files] pool behavior test.', function() {
    var inputF1,
        inputF2,
        inputF3,
        pool,
        planet,
        fileName1,
        fileName2,
        fileName3;

    beforeEach(function() {
        planet = document.createElement('div');
        pool = new Pool(planet);
        inputF1 = document.createElement('input');
        inputF2 = document.createElement('input');
        inputF3 = document.createElement('input');
        inputF1.file_name = fileName1 = 'filename1.txt';
        inputF2.file_name = fileName2 = 'filename2.txt';
        inputF3.file_name = fileName3 = 'filename3.txt';
    });

    it('store file to pool', function() {
        pool.store(inputF1);
        pool.store(inputF2);
        pool.store(inputF3);

        expect(pool.files[fileName1]).toEqual([inputF1]);
        expect(pool.files[fileName2]).toEqual([inputF2]);
        expect(pool.files[fileName3]).toEqual([inputF3]);
    });

    it('remove file from pool', function() {
        pool.store(inputF1);
        pool.store(inputF2);
        pool.store(inputF3);

        pool.remove(fileName1);

        expect(pool.files[fileName1]).not.toBeDefined();

    });

    it('remove file from pool', function() {

        pool.store(inputF1);
        pool.store(inputF2);
        pool.store(inputF3);

        pool.empty();

        expect(pool.files[fileName1]).not.toBeDefined();
        expect(pool.files[fileName2]).not.toBeDefined();
        expect(pool.files[fileName3]).not.toBeDefined();

    });

    it('plant pool elements to other element', function() {
        var contains;

        // store inputs
        pool.store(inputF1);
        pool.store(inputF2);
        pool.store(inputF3);

        // plant to planet
        pool.plant(planet);

        // check plant result
        expect(pool.files[fileName1]).not.toBeDefined();
        expect(pool.files[fileName2]).not.toBeDefined();
        expect(pool.files[fileName3]).not.toBeDefined();

        contains = [$.contains(planet, inputF1),
                    $.contains(planet, inputF2),
                    $.contains(planet, inputF3)];

        // check planet has inputs
        expect(tui.util.filter(contains, function(el) {
            return el;
        }).length).toBe(3);

    });
});
