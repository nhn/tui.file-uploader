var Pool = require('../../src/js/view/pool.js');

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
        var files = pool.files;

        pool.store(inputF1);
        pool.store(inputF2);
        pool.store(inputF3);

        expect(files[fileName1]).toBe(inputF1);
        expect(files[fileName2]).toBe(inputF2);
        expect(files[fileName3]).toBe(inputF3);
    });

    it('remove file from pool', function() {
        var files = pool.files;

        pool.store(inputF1);
        pool.store(inputF2);
        pool.store(inputF3);

        pool.remove(fileName1);

        expect(files[fileName1]).not.toBeDefined();

    });

    it('remove file from pool', function() {
        var files = pool.files;

        pool.store(inputF1);
        pool.store(inputF2);
        pool.store(inputF3);

        pool.empty();

        expect(files[fileName1]).not.toBeDefined();
        expect(files[fileName2]).not.toBeDefined();
        expect(files[fileName3]).not.toBeDefined();

    });

    it('plant pool elements to other element', function() {
        var contains,
            files = pool.files;

        // store inputs
        pool.store(inputF1);
        pool.store(inputF2);
        pool.store(inputF3);

        // plant to planet
        pool.plant(planet);

        // check plant result
        expect(files[fileName1]).not.toBeDefined();
        expect(files[fileName2]).not.toBeDefined();
        expect(files[fileName3]).not.toBeDefined();

        contains = [$.contains(planet, inputF1),
                    $.contains(planet, inputF2),
                    $.contains(planet, inputF3)];

        // check planet has inputs
        expect(tui.util.filter(contains, function(el) {
            return el;
        }).length).toBe(3);

    });
});
