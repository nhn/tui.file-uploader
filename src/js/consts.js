/**
 * @fileoverview Configuration or default values.
 * @author NHN. FE Development Lab <dl_javascript@nhn.com>
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
    SUPPORT_DROPZONE: 'tui-dropzone-support',
    DROP_ENABLED: 'tui-dropzone-enabled',
    HAS_ITEMS: 'tui-has-items',
    HAS_SCROLL: 'tui-has-scroll',
    IS_CHECKED: 'tui-is-checked'
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
                '<span class="tui-file-name">{{filename}}</span>',
                '<span class="tui-file-tail"> ({{filesize}})</span>',
            '</span>',
            '{{removeButton}}',
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
                    '<th scope="col" width="32" style="border-right:0;">{{checkbox}}</th>',
                    '<th scope="col" width="156">File Type</th>',
                    '<th scope="col" width="362">File Name</th>',
                    '<th scope="col" width="146" style="border-right:0">File Size</th>',
                '</tr>',
            '</thead>',
            '<tbody class="tui-form-body {{listItemsClassName}}"></tbody>',
        '</table>'
    ].join(''),
    LIST_ITEM: [
        '<tr>',
            '<td width="32">',
                '<label class="tui-checkbox">{{checkbox}}</td>',
            '<td width="156">{{filetype}}</td>',
            '<td width="362">',
                '<span class="tui-filename-area">',
                    '<span class="tui-file-name">{{filename}}</span>',
                '</span>',
            '</td>',
            '<td width="146">{{filesize}}</td>',
        '</tr>'
    ].join('')
};
