## Add dependency files

To use a file-uploader component, you must include CSS and JavaScript files.
Main bundling files can download from a `dist` folder in the repository.
And this component has `jQuery` and `CodeSnippet` dependencies.


#### CSS File

```html
<link rel="stylesheet" href="tui-file-uploader.css">
```

#### JS Files

```html
<script type="text/javascript" src="jquery.js"></script>
<script type="text/javascript" src="tui-code-snippet.js"></script>
<script type="text/javascript" src="tui-file-uploader.js"></script>
```

## Create a file-uploader component

### Step 1. Add a container element that a file-uploader component will be created.

* Container element must include 2 essential elements and a optional element.
  * File button : Read files from a local system. This element must set `name` property to request server.
  * List container element : Append list item's view. This element must have a `tui-js-file-uploader-list` class name.
  * Submit button (optional) : Send files to server. When using batch transfer, add this element.

```html
<div id="uploader">
    <input type="file" name="userfile[]"> <!-- file button -->
    <div class="tui-js-file-uploader-list"></div> <!-- list conatiner -->
    <button type="submit">upload<button> <!-- submit button -->
</div>
```

### Step 2. Create instance.

Create an instance by passing the container element and option values as parameters.
A container element is a `jQuery` element.

* Create with container element and options
```js
var options = {
    url: {
        send: 'http://localhost:3000/upload',
        remove: 'http://localhost:3000/remove'
    }
    redirectURL: 'http://localhost:8080/examples/result.html',
    isMultiple: true,
    isBatchTransfer: false,
    useFolder: false,
    listUI: {
        type: 'simple',
        ...
    }
};

var fileUploader = new tui.FileUploader($('uploader'), options);
```

Information about each option is as follows:

|Name|Type|Description|
|---|---|---|
|`url`|`{object}`|Server request urls|
|`url.send`|`{string}`|To send files to server|
|`[url.remove]`|`{string}`|To remove files on server (Using when transfer type is normal)|
|`[redirectURL]`|`{string}`|This option is only used in IE7 for CORS|
|`isMultiple`|`{boolean}`|Whether selecting multiple file or not|
|`isBatchTransfer`|`{boolean}`|Whether using batch transfer or not|
|`useFolder`|`{boolean}`|Whether the folder can be selected or not|
|`listUI`|`{object}`|To set a list view|
|`listUI.type`|`{string}`|List view type (`simple` or `table`)|
|`[listUI.item]`|`{string}`|List item's template when using list type is `simple`|
|`[listUI.columnList]`|`{array.<object>}`|List item's template when using list type is `table`|

#### How to use the `listUI` option

`listUI` option is used to easily set a list view.
`item` or `columnList` property can change list item's template.

* Simple list view customzing
```js
{
    ...
    listUI: {
        type: 'simple',
        // default embeded template
        // item: '<span class="tui-filename-area">' +
        //           '<span class="tui-file-name">{{filename}}</span>' +
        //           '<span class="tui-file-tail"> ({{filesize}})</span>' +
        //       '</span>' +
        //       '{{removeButton}}'
        item: '{{removeButton}} {{filename}} | {{filesize}}'
    }
}
```

* Table list view customizing
  * Each item of `columList` set table's elements. (`colgroup`, `thead`, `tbody`)
```js
{
    ...
    listUI: {
        type: 'table',
        // default embeded template
        // columnList: [
        //      {
        //          header: '{{checkbox}}'
        //          body: '{{checkbox}}',
        //          width: '32'   
        //      },
        //      {
        //          header: 'File Type',
        //          body: '{{filetype}}',
        //          width: 156
        //      },
        //      {
        //          header: 'File Name',
        //          body: '<span class="tui-filename-area">' +
        //                    '<span class="tui-file-name">{{filename}}</span>' +
        //                '</span>',
        //          width: 362
        //      },
        //      {
        //          header: 'File Size',
        //          body: '{{filesize}}',
        //          width: 146
        //      }
        // ]
        columnList: [
            {
                header: ''
                body: '{{removeButton}}',
                width: '50'   
            },
            {
                header: 'name',
                body: '{{filename}}'
            },
            {
                header: 'size',
                body: '<span style="color:red;">{{filesize}}</span>'
            }
        ]
    }
}
```

Mustache template like `{{property}}` match file's data and make some contents.

The available property values are:

|Name|Matching value|
|---|---|
|`filename`|File name|
|`filesize`|File size with unit|
|`filetype`|File extension|
|`checkbox`|Checkbox element|
|`removeButton`|Remove button element|

### Step 3. Apply a default CSS.

To apply a default CSS normally, you need to add markup and class names as follows.
If you want to apply styles to more elements such as delete or submit button, see example pages.

* Simple list view
```html
<div id="uploader" class="tui-file-uploader">
    <label class="tui-btn tui-btn-upload">
        <span class="tui-btn-txt">Add files</span>
        <input type="file" name="userfile[]" class="tui-input-file"> <!-- file button -->
    </label>
    <div class="tui-js-file-uploader-list"></div> <!-- list container -->
</div>
```

* Table list view
```html
<div id="uploader" class="tui-file-uploader">
    <label class="tui-btn tui-btn-upload">
        <span class="tui-btn-txt">Add files</span>
        <input type="file" name="userfile[]" class="tui-input-file"> <!-- file button -->
    </label>
    <div class="tui-js-file-uploader-list tui-file-uploader-area tui-has-scroll"></div> <!-- list container -->
</div>
```

## Features
### Transfer method

* Normal transfer
  * When local files are read, they are sent to server immediately.
  * It is possible to request server for deleting a file.
  * Browser support : All browser (IE8~)
  * How to use : Set options
```js
{
    url: {
        send: '...',
        remove: '...'
    }
}
```
* Batch transfer
  * The local files are sent to the server as a batch through submit action.
  * Browser support : All browser (IE8~)
  * How to use : Set options
```js
{
    url: {
        send: '...'
    },
    isBatchTransfer: true
}
```

### Select multiple files
* Whether to select multiple files when selecting a local file
* Browser support : Modern browser ([IE11~](http://caniuse.com/#feat=input-file-multiple))
* How to use : Set a option
```js
{
    isMultiple: true
}
```

### Select folder
* Whether to select a folder when selecting a local file
* Browser support : Webkit browser (IE not support)
* How to use : Set a option
```js
{
    useFolder: true
}
```

### Use dropzone
* Set a dropzone to send a dragging local file.
* Browser support : Mordern browser (IE10~)
* How to use : Add a class `tui-js-file-uploader-dropzone` to a dropzone element.
```html
<div id="uploader">
    <input type="file" name="userfile[]" class="tui-input-file">
    <div class="tui-js-file-uploader-list tui-js-file-uploader-dropzone"></div>
</div>
```

### Display list view according to transfer method
* Normal transfer
  * Display a file's list view after requesting server.
  * Render a list view as server response data.
  * Click the remove button in a list to request server to delete a file.
* Batch transfer
  * Local file's information is displayed as a list before requesting server.
  * Files that have completed server request are removed from the list view.
  * IE8 and 9 don't provide file size information.

### Using in IE7 (Optional)

A file-uploader component is possible to send files in IE7.
But a default CSS can't use normally in IE7.
So in IE7, CSS should be implemented on the service.

And CORS for IE7 must also be handled by server. The following option is used.
Refer to [server request & response tutorial](https://github.com/nhnent/tui.component.file-uploader/wiki/Server-request-&-response) for information about the page set to `redirectURL` option.

```js
{
    redirectURL: 'http://localhost:8080/examples/result.html'
}
```

For more information, see [example pages] (https://nhnent.github.io/tui.file-uploader/latest/tutorial-example01-basic.html).
