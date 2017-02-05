/**
 * @fileoverview Configuration or default values.
 * @author NHN Ent. FE Development Lab <dl_javascript@nhnent.com>
 */
'use strict';

/**
 * Uploader config
 * @type {object}
 * @ignore
 */
module.exports.conf = {
    REQUESTER_TYPE_MODERN: 'modernRequester',
    REQUESTER_TYPE_OLD: 'oldRequester',
    FORM_TARGET_NAME: 'tuiUploaderHiddenFrame'
};

/**
 * Class names
 * @type {object}
 * @ignore
 */
module.exports.className = {
    HIDDEN_FILE_INPUT: 'tui-js-hidden-file-input',
    LIST_CONTAINER: 'tui-js-file-uploader-list',
    LIST_ITEMS_CONTAINER: 'tui-js-file-uploader-list-items',
    DROPZONE: 'tui-js-file-uploader-dropzone',
    NOT_SUPPORT_DROPZONE: 'tui-dropzone-not-support',
    DROP_ENABLED: 'tui-dropzone-enabled',
    HAS_ITEMS: 'tui-has-items',
    IS_CHECKED: 'tui-is-checked',
    THEAD_STYLE: 'tui-col-name'
};

/*eslint-disable*/
/**
 * Default Htmls
 * @type {object}
 * @ignore
 */
module.exports.html = {
    FORM: '<form enctype="multipart/form-data" id="tui-uploader-form" method="post"></form>',
    HIDDEN_INPUT: '<input type="hidden" name="{{name}}" value="{{value}}">',
    CHECKBOX: [
        '<label class="tui-checkbox">',
            '<span class="tui-ico-check"><input type="checkbox"></span>',
        '</label>'
    ].join(''),
    REMOVE_BUTTON: '<button type="button" class="tui-btn-delete">Remove</button>'
};

/**
 * Simple list template
 * @type {object}
 * @ignore
 */
module.exports.listTemplate = {
    CONTAINER: '<ul class="tui-upload-lst {{listItemsClassName}}"></ul>',
    LIST_ITEM: [
        '<li class="tui-upload-item">',
            '<span class="tui-filename-area">',
                '<span class="tui-file-name">{{filename}} ({{filesize}})</span>',
            '</span>',
            '<button type="button" class="tui-btn-delete">remove</button>',
        '</li>'
    ].join('')
};

/**
 * Table list template
 * @type {object}
 * @ignore
 */
module.exports.tableTemplate = {
    CONTAINER: [
        '<table class="tui-file-uploader-tbl">',
            '<caption><span>File Uploader List</span></caption>',
            '<colgroup>',
                '<col width="32">',
                '<col width="156">',
                '<col width="362">',
                '<col width="">',
            '</colgroup>',
            '<thead class="tui-form-header">',
                '<tr>',
                    '<th scope="col">',
                        '<label class="tui-checkbox">',
                            '<span class="tui-ico-check"><input type="checkbox"></span>',
                        '</label>',
                    '</th>',
                    '<th scope="col">File Type</th>',
                    '<th scope="col">File Name</th>',
                    '<th scope="col">File Size</th>',
                '</tr>',
            '</thead>',
            '<tbody class="tui-form-body {{listItemsClassName}}"></tbody>',
        '</table>'
    ].join(''),
    LIST_ITEM: [
        '<tr>',
            '<td>',
                '<label class="tui-checkbox">',
                    '<span class="tui-ico-check"><input type="checkbox"></span>',
                '</label>',
            '</td>',
            '<td>{{filetype}}</td>',
            '<td>{{filename}}</td>',
            '<td>{{filesize}}</td>',
        '</tr>'
    ].join('')
};
