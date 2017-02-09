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

var LIMIT_FILE_SIZE = 10 * 1024;

// config
var PORT = 3000,
    app = express(),
    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, __dirname + '/files');
        },
        filename: function (req, file, cb) {
            cb(null, Date.now().toString());
        }
    }),
    upload = multer({
        storage: storage,
        limit: {
            fileSize: LIMIT_FILE_SIZE
        }
    }).array('userfile[]');

/**
 * Log
 */
function log(api, data) {
    api = '\n' + api + '\n';
    data = data || '';
    console.log(api, data);
}

/**
 * Make response data from files
 * @param {Array.<File>} files - Files
 * @returns {object} Result data
 */
function makeResponseData(files) {
    var filelist = files.map(function(file) {
            return {
                message: 'success',
                name: file.originalname,
                size: file.size,
                id: file.filename
            }
        }),
        result = {
            filelist: filelist,
            success: filelist.length,
            failed: 0,
            count: filelist.length
        };

    return result;
}

/**
 * Set static files
 */
app.use('/', express.static('samples'));

/**
 * Set CORS for modern browsers
 *  - XMLHttpRequest - level 2
 */
 app.use(function(req, res, next) { // CORS
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

/**
 * API - post
 *  /upload
 *      req.files
 *      req.body.redirectURL (for IE7)
 *      req.body.messageTarget (for IE8, 9)
 */
app.post('/upload', upload, function(req, res) { // Let us suppose that all the files are uploaded successfully.
    var data = makeResponseData(req.files),
        redirectURL = req.body.redirectURL,
        messageTarget = req.body.messageTarget,
        responseData = JSON.stringify(data);
    log('upload', data);

    if (messageTarget) { // CORS - IE 8, 9
        res.send(
            responseData +
            '<script type="text/javascript">' +
                'var data = document.body.firstChild.data;\n' +
                'window.parent.postMessage(data, "' + messageTarget + '");\n' +
                'document.body.innerHTML = "";' +
            '</script>'
        );
    } else if (redirectURL) { // CORS - IE 7
        responseData = encodeURIComponent(responseData);
        res.redirect(redirectURL + '?' + responseData);
    } else {
        res.send(responseData);
    }
});

/**
 * API - get
 *  /remove
 *      req.query.callback - Callback name for jsonp
 *      req.query.idList - Removed file's id list
 */
app.get('/remove', function(req, res) { // Suppose that the file was removed successfully.
    var callbackName = req.query.callback;
    var files = req.query.idList;
    var result = {};

    files.forEach(function(id) {
        result[id] = true;
    });

    log('remove', result);

    if (callbackName) { // for x-domain jsonp
        res.send(callbackName + '(' + JSON.stringify(result) + ')');
    } else { // for same domain
        res.send(result);
    }
});

/**
 * Start server
 */
app.listen(PORT, function() {
    log('Listening on port: ' + PORT);
});
