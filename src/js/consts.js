/**
 * @fileoverview Configuration or default values.
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';
/**
 * Uploader config
 */
module.exports.CONF = {
    SIZE_UNIT: 'SIZE_UNIT',
    ERROR: {
        DEFAULT: 'Unknown error.'
    },
    DRAG_DEFAULT_ENABLE_CLASS: 'enableClass',
    FILE_FILED_NAME: 'userfile[]',
    FOLDER_INFO: 'folderName',
    HIDDEN_FILE_INPUT_CLASS: 'uploader-hidden-file-input',
    X_DOMAIN_GLOBAL_CALLBACK_NAME: '__uploaderXDomainCallback'
};

/**
 * Default Htmls
 * @type {{input: string, item: string}}
 */
module.exports.HTML = {
    form: ['<form enctype="multipart/form-data" id="formData" method="post">',
        '<input type="hidden" name="MAX_FILE_SIZE" value="3000000" />',
        '</form>'].join(''),
    input: ['<input type="file" id="fileAttach" {{webkitdirectory}} name="{{fileField}}" {{multiple}} />'].join(''),
    submit: ['<button class="batchSubmit" type="submit">SEND</button>'].join(''),
    item: ['<li class="filetypeDisplayClass">',
        '<spna class="fileicon {{filetype}}">{{filetype}}</spna>',
        '<span class="file_name">{{filename}}</span>',
        '<span class="file_size">{{filesize}}</span>',
        '<button type="button" class="{{deleteButtonClassName}}">Delete</button>',
        '</li>'].join(''),
    drag: ['<div class="dragzone"></div>'].join('')
};
