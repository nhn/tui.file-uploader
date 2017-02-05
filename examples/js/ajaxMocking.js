/**
 * @fileoverview This script is to test server request. All response data is a fake.
 */
'use strict';

(function() {
    var uploadResponseText = JSON.stringify({
        filelist: [
            {
                message: 'success',
                name: 'mockImage01.jpg',
                size: 812852,
                id: '1486184836133mockImage01.jpg'
            },
            {
                message: 'success',
                name: 'mockImage01.jpg',
                size: 812852,
                id: '1486184836133mockImage01.jpg'
            },
            {
                message: 'success',
                name: 'mockImage01.jpg',
                size: 812852,
                id: '1486184836133mockImage01.jpg'
            }
        ],
        success: 1,
        failed: 0,
        count: 1
    });
    var removeResponseText = {
        message: 'success',
        filelist: [
            {
                id: '1486184836133mockImage01.jpg',
                state: true
            }
        ]
    };

    /**
     * Upload mocking
     */
    $.mockjax({
        url: 'http://localhost:3000/upload',
        responseTime: 0,
        responseText: uploadResponseText
    });

    /**
     * Remove mocking
     */
    $.mockjax({
        url: 'http://localhost:3000/remove',
        responseTime: 0,
        responseText: removeResponseText
    });
})();
