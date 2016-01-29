/**
 * File upload server example - NodeJS 5.1.0 stable
 * NHN Entertainment FE development team
 * Github:
 *  nhnent/tui.component.file-uploader
 *  https://github.com/nhnent/tui.component.file-uploader
 **/
'use strict';
var express = require('express'),
    multer = require('multer');

// config
var PORT = 3000,
    app = express(),
    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, __dirname + '/files');
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + file.originalname);
        }
    }),
    upload = multer({
        storage: storage,
        limit: {
            fileSize: 10 * 1024 * 1024
        }
    }).array('userfile[]');

// setting
app.use('/', express.static('samples'))
    .use(function(req, res, next) { // CORS
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        next();
    });

// routes
app.post('/upload', upload, function(req, res) { // Let us suppose that all the files are uploaded successfully.
        var data = makeResponseData(req.files),
            callbackName = req.body.callbackName;

        if (callbackName) { // CORS - IE 7,8,9
            res.send(
                '<script type="text/javascript">' +
                    'window.parent.' + callbackName + '(' + JSON.stringify(data) + ');' +
                '</script>'
            );
        } else {
            res.send(JSON.stringify(data));
        }
    })
    .get('/remove', function(req, res) { // Let us suppose that the file was removed successfully.
        var callbackName = req.query.callback,
            result = JSON.stringify({
                message: 'success',
                id: req.query.id,
                name: req.query.name
            });

        if (callbackName) { // for x-domain jsonp
            res.send(callbackName + '(' + result + ')');
        } else { // for same domain
            res.send(result);
        }
    });

// start
app.listen(PORT, function() {
    console.log('Listening on port: ' + PORT);
});

// make result of uplaod
function makeResponseData(files) {
    var result = {
        filelist: [],
        success: 0,
        faild: 0,
        count: files.length
    };

    files.forEach(function(file) {
        result.filelist.push({
            message: 'success',
            name: file.originalname,
            size: file.size / 1000,
            id: file.filename
        });
        result.success += 1;
    });

    return result;
}

//// response - jsonp type
//function responseJsonp(req, res) {
//    var data = makeResponseData(req.files),
//        redirectURL = req.body.REDIRECT_URL,
//        callbackName;
//
//    if (redirectURL) {
//        responseToURL(redirectURL, data.filelist, res);
//    } else {
//        callbackName = req.body.CALLBACK_NAME;
//        responseToCallback(callbackName, data, res);
//    }
//}
//
//
//// response to hidden frame url
//function responseToURL(url, filelist, res) {
//    url += '?' + makeQueryString(filelist);
//    res.redirect(url);
//}
//
//// response to global callback
//function responseToCallback(callbackName, data, res) {
//    //var queryObj = makeQueryObj(filelist);
//    res.send('<script>window.parent.' + callbackName + '(' + JSON.stringify(data) + ')</script>');
//}
//
//// make query object
//function makeQueryObj(filelist) {
//    var queryObj = {
//        status: [],
//        names: [],
//        sizes: [],
//        ids: []
//    };
//
//    filelist.forEach(function(file) {
//        queryObj.status.push(file.message);
//        queryObj.names.push(file.originalname);
//        queryObj.sizes.push(file.filesize);
//        queryObj.ids.push(file.fileId);
//    });
//
//    return queryObj;
//}
// make query string
//function makeQueryString(filelist) {
//    var status = [],
//        names = [],
//        sizes = [],
//        ids = [];
//
//    filelist.forEach(function(file) {
//        status.push(file.message);
//        names.push(file.name);
//        sizes.push(file.size);
//        ids.push(file.fileId);
//    });
//
//    return encodeURI('status=' + status.join(';') + '&names=' + names.join(';') + '&sizes=' + sizes.join(';') + '&ids=' + ids.join(';'));
//}
