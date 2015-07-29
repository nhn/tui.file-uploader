describe('Fileuploader test', function() {
    var fileUploader,
        fileUploader2,
        fileUploader3,
        config = {
            url: 'http://fe.nhnent.com'
        },
        config2 = {
            url : document.URL
        },
        config3 = {
            url : document.URL,
            useJsonp: true
        };

    beforeEach(function() {
        fileUploader = new ne.component.FileUploader(config);
        fileUploader2 = new ne.component.FileUploader(config2);
        fileUploader3 = new ne.component.FileUploader(config3);
    });

    it('define file uploader', function() {
        expect(fileUploader).toBeDefined();
        expect(fileUploader2).toBeDefined();
        expect(fileUploader3).toBeDefined();
    });

    it('define file uploader with useJsonp', function() {
        var jsonpConnector = ne.component.FileUploader.JsonPConnector,
            con = fileUploader3._connector;
        expect(con.constructor).toBe(jsonpConnector);
    });

    it('define file cross-domain', function() {
        var jsonpConnector = ne.component.FileUploader.JsonPConnector,
            con = fileUploader._connector;
        expect(con.constructor).toEqual(jsonpConnector);
    });

    it('cross-domain test(correct case)', function() {
        var isCross = fileUploader._isCrossDomain();
        expect(isCross).toBe(true);
    });

    it('cross-domain test(not correct case)', function() {
        var isCross = fileUploader2._isCrossDomain();
        expect(isCross).not.toBe(true);
    });
});