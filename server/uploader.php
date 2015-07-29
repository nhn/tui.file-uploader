<?php

class FileUploader {
	var $path;
	var $response;
	var $max_size;
	var $destination;
	var $uploadfile;
	var $massage;
	var $error;
	var $size;
	var $name;

	function isAvailableSize() {
		return $this->max_size > $this->size;
	}

	function isNotUploadError() {
		return $this->error <= 0 && $this->size > 0;
	}

	function isAvailableProtocol() {
		return is_uploaded_file($this->tmp_name);
	}

	/**
	 * temp data
	 **/
	function createFileID() {
		return time('h-m-s');
	}

	function uploadFile() {
		return move_uploaded_file($this->tmp_name, $this->destination);
	}

	/**
	 * 	create file id for db save 
	 **/
	function saveResult() {
		$fileInfo = new stdClass();
		$fileInfo->massage  = $this->massage;
		$fileInfo->name = $this->name;
		$fileInfo->size = $this->getSize($this->size);
		$fileInfo->fileID = $this->createFileID();
		$this->response->filelist[] = $fileInfo;
	}

	function getSize($size) {
		$unit = 1000;

		switch($_POST['SIZE_UNIT']) {
			case 'KB' :
				$unit = 1000;
				break;
			case 'MB' :
				 $unit = 1000 * 1000;
				 break;
		}
		return $size / $unit;
	}

	function executeUpload() {
		if ($this->isAvailableSize() && $this->isAvailableProtocol() && $this->isNotUploadError()) {
			if ($this->uploadFile()) {
				$this->massage = 'success';
				$this->response->success++;
			}
		} else {
			$this->massage = 'faild';
			$this->response->faild++;
		}

		$this->saveResult();
	}

	function getResult() {
		return $this->response;
	}

	function reArrayFiles($file_post) {
	    $file_ary = array();
	    $file_count = count($file_post['name']);
	    $file_keys = array_keys($file_post);

	    for ($i=0; $i<$file_count; $i++) {
	        foreach ($file_keys as $key) {
	            $file_ary[$i][$key] = $file_post[$key][$i];
	        }
	    }

	    return $file_ary;
	}


	function FileUploader() {
		$userfile = $_FILES['userfile'];
		$fileArray = $this->reArrayFiles($userfile);
		$this->response = new stdClass();
		$this->response->filelist = array();
		$this->response->success = 0;
		$this->response->faild = 0;
		$this->response->count = count($userfile['name']);
		foreach($fileArray as $key => $file) {
			$userfile = $file;
			$this->path = './files/';
			$this->max_size = ($_POST['MAX_FILE_SIZE'] ? $_POST['MAX_FILE_SIZE'] : 10000000);
			$this->size = $userfile['size'];
			$this->error = $userfile['error'];
			$this->tmp_name = $userfile['tmp_name'];
			$this->name = $userfile['name'];
			$this->destination = $this->path . basename($userfile['name']);
			$this->executeUpload();
		}
	}
}

/**
* Builds an http query string.
* @param array $query  // of key value pairs to be used in the query
* @return string       // http query string.
**/

$queryobject = new stdClass();
$queryobject->status =  array();
$queryobject->names =array();
$queryobject->sizes = array();
$queryobject->IDs = array();
function build_http_query( $query ){

    $query_array = array();

	foreach( $query as $key => $key_value ){
        $query_array[] = urlencode( $key ) . '=' . urlencode( $key_value );
    }

    return implode( '&', $query_array );

}

function makeQuery($list) {
	$query = '';
	foreach ($list as $key => $value) {
		$queryobject->status[] = $value->massage;
		$queryobject->names[] = $value->name;
		$queryobject->sizes[] = $value->size;
	}

	$strObject = new stdClass();
	$strObject->status = implode(';', $queryobject->status);
	$strObject->names = implode(';', $queryobject->names);
	$strObject->sizes = implode(';', $queryobject->sizes);
	$query = build_http_query($strObject);

	return $query;
}

$uploader = new FileUploader();
if ($_POST['RESPONSE_TYPE'] == 'jsonp') {
	if (gettype($_POST['REDIRECT_URL']) == 'string') {
		$querystr = makeQuery($uploader->getResult()->filelist);
		echo header('Location: ' . $_POST['REDIRECT_URL'] . '?' . $querystr);
	} else {
		echo '<script type="text/javascript">window.parent.' . $_POST['CALLBACK_NAME'] . '(' . json_encode($uploader->getResult()) . ');</script>';
	}
} else {
	echo json_encode($uploader->getResult());	
}


?>