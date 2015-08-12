/**
 * @fileoverview Configuration or default values.
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */

/**
 * Configuration of connection with server.
  * @type {{RESPONSE_TYPE: string, REDIRECT_URL: string}}
 */
module.exports.CONF = {
    RESPONSE_TYPE: 'RESPONSE_TYPE',
    REDIRECT_URL: 'REDIRECT_URL',
    JSONPCALLBACK_NAME: 'CALLBACK_NAME',
    SIZE_UNIT: 'SIZE_UNIT',
    REMOVE_CALLBACK : 'responseRemoveCallback',
    ERROR: {
        DEFAULT: 'Unknown error.',
        NOT_SURPPORT: 'This is x-domain connection, you have to make helper page.'
    },
    FILE_FILED_NAME: 'userfile[]'
};

/**
 * Default Htmls
 * @type {{input: string, item: string}}
 */
module.exports.HTML = {
    form : ['<form enctype="multipart/form-data" id="formData" method="post">',
                '<input type="hidden" name="MAX_FILE_SIZE" value="3000000" />',
                '<input type="file" id="fileAttach" {{webkitdirectory}} name="{{fileField}}" {{multiple}} />',
                '<button class="batchSubmit" type="submit">SEND</button>',
            '</form>'].join(''),
    input: ['<input type="file" id="fileAttach" {{webkitdirectory}} name="{{fileField}}" {{multiple}}} />'].join(''),
    item : ['<li class="filetypeDisplayClass">',
                '<spna class="fileicon {{filetype}}">{{filetype}}</spna>',
                '<span class="file_name">{{filename}}</span>',
                '<span class="file_size">{{filesize}}</span>',
                '<button type="button" class="{{deleteButtonClassName}}">Delete</button>',
            '</li>'].join('')
};
