
<?php
class FileRemover {
	var $file_name;
	var $response;
	var $uploadfile;

	function FileRemover() {
		$upload_dir = './files/';
		$this->file_name = $_GET['filename'];
		$this->uploadfile = $upload_dir . $this->file_name; 
		$this->response = new stdClass();		
		$this->deleteFile();
	}

	function deleteFile() {
		if (unlink($this->uploadfile)) {
			$this->response->massage = "success";
			$this->response->name = $this->file_name;
		} else {
			$this->response->massage = "faild";
			$this->response->name = $this->file_name;
		}
	}

	function getResult() {
		return $this->response;
	}
}


$fileRemover = new FileRemover();
if ($_GET['callback'] !== Null) {
	echo $_GET['callback'] . '(' . json_encode($fileRemover->getResult()) . ')';
} else {
	echo json_encode($fileRemover->getResult());
}

?>