<?php
session_start();

if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
	errorMessage("Not Logged In", "You must be logged in to do that.", "403 Forbidden");
}

function mysqlConnect() {
	mysql_connect("melanieannephotography.com", "melanie", "p4ssw0rd88");
	mysql_select_db("melanie");
}

function errorMessage($title, $message, $error = "500 Internal Server Error") {
	header("HTTP/1.1 " . $error);
	header("Content-Type: application/json");
	die(json_encode(array("title" => $title, "message" => $message)));
}

function doMysqlAjaxError() {
	errorMessage("Database Error", "There was an error connecting to the database.");
}

/**
 * A function for easily uploading files. This function will automatically generate a new 
 *        file name so that files are not overwritten.
 * Taken From: http://www.bin-co.com/php/scripts/upload_function/
 * Arguments:     $file_id- The name of the input field contianing the file.
 *                $folder    - The folder to which the file should be uploaded to - it must be writable. OPTIONAL
 *                $types    - A list of comma(,) seperated extensions that can be uploaded. If it is empty, anything goes OPTIONAL
 * Returns  : This is somewhat complicated - this function returns an array with two values...
 *                The first element is randomly generated filename to which the file was uploaded to.
 *                The second element is the status - if the upload failed, it will be 'Error : Cannot upload the file 'name.txt'.' or something like that
 */
function upload($file_id, $folder="", $types="", $rename_ext="") {
    if(!$_FILES[$file_id]['name']) return array("error" => 'No File|No file was uploaded, please select a valid file.');
	
	if (is_array($_FILES[$file_id]['name'])) {
		$file_ary = array();
		$file_count = count($_FILES[$file_id]['name']);
		$file_keys = array_keys($_FILES[$file_id]);

		for ($i=0; $i<$file_count; $i++) {
			foreach ($file_keys as $key) {
				$file_ary[$i][$key] = $_FILES[$file_id][$key][$i];
			}
		}
	}
		
	$result_ary = array();
	
	foreach ($file_ary as $file) {
    	$file_title = $file['name'];
	    //Get file extension
	    $ext_arr = split("\.",basename($file_title));
	    $ext = strtolower($ext_arr[count($ext_arr)-1]); //Get the last extension

	    

	    $all_types = explode(",",strtolower($types));
	    if($types) {
	        if(in_array($ext,$all_types));
	        else {
	            $result = "'".$file['name']."' is not a valid file type. Only images allowed: jpg, jpeg, gif, png."; //Show error if any.
	            return array("error" => "Invalid File Type|" . $result);
	        }
	    }
	
		$size = getimagesize($file['tmp_name']);

	    //Where the file must be uploaded to
	    if($folder && substr($folder, strlen($folder) - 1) != '/') $folder .= '/';//Add a '/' at the end of the folder
		
		do {
		    //Not really uniqe - but for all practical reasons, it is
		    $file_name = create_guid();//Get Unique Name
		    $uploadfile = $folder . $file_name . "." . ($rename_ext ? $rename_ext : $ext);
		} while (file_exists($uploadfile));
		
		
	
	    $result = '';
	    //Move the file from the stored location to the new location
	    if (!move_uploaded_file($file['tmp_name'], $uploadfile)) {
			$result = "Internal Error|There was an internal error. Please try again later.|";
	        if(!file_exists($folder)) {
	            $result .= " : Folder don't exist.";
	        } elseif(!is_writable($folder)) {
	            $result .= " : Folder not writable.";
	        } elseif(!is_writable($uploadfile)) {
	            $result .= " : File not writable.";
	        }
	       // $file_name = '';
	    } else {
	        if(!$file['size']) { //Check if the file is made
	            @unlink($uploadfile);//Delete the Empty file
	            $file_name = '';
	            $result = "Empty File|Empty file found. Please select a valid file."; //Show the error message
	        } else {
	            chmod($uploadfile,0777);//Make it universally writable.
	        }
	    }
		
		if ($result) {
			return array("error" => $result);
		}
	
		$size = getimagesize($uploadfile);
	
		$folder_report = $folder;
		while (strpos($folder_report, "../") === 0) {
			$folder_report = substr($folder_report, 3);
		}
		
		$result_ary[] = array(
			"file_name" => $file_name . "." . ($rename_ext ? $rename_ext : $ext),
			"filepath" => $folder_report . $file_name . "." . ($rename_ext ? $rename_ext : $ext),
			"width" => $size[0],
			"height" => $size[1],
			"error" => $result
		);
	}

    return $result_ary;
}

function image_resize($src, $dst, $width, $height, $crop=0){

	if(!list($w, $h) = getimagesize($src)) return "Unsupported picture type!";

	$type = strtolower(substr(strrchr($src,"."),1));
	if($type == 'jpeg') $type = 'jpg';
	switch($type){
		case 'bmp': $img = imagecreatefromwbmp($src); break;
		case 'gif': $img = imagecreatefromgif($src); break;
		case 'jpg': $img = imagecreatefromjpeg($src); break;
		case 'png': $img = imagecreatefrompng($src); break;
		default : return "Unsupported picture type!";
	}

	// resize
	if($crop){
		if($w < $width or $h < $height) return "Picture is too small!";
		$ratio = max($width/$w, $height/$h);
		$h = $height / $ratio;
		$x = ($w - $width / $ratio) / 2;
		$w = $width / $ratio;
	} else {
		if($w < $width and $h < $height) return "Picture is too small!";
		$ratio = min($width/$w, $height/$h);
		$width = $w * $ratio;
		$height = $h * $ratio;
		$x = 0;
	}

	$new = imagecreatetruecolor($width, $height);

	// preserve transparency
	if($type == "gif" or $type == "png"){
		imagecolortransparent($new, imagecolorallocatealpha($new, 0, 0, 0, 127));
		imagealphablending($new, false);
		imagesavealpha($new, true);
	}

	imagecopyresampled($new, $img, 0, 0, $x, 0, $width, $height, $w, $h);

	switch($type){
		case 'bmp': imagewbmp($new, $dst); break;
		case 'gif': imagegif($new, $dst); break;
		case 'jpg': imagejpeg($new, $dst); break;
		case 'png': imagepng($new, $dst); break;
	}
	return true;
}



function create_guid($namespace = '') {     
    static $guid = '';
    $uid = uniqid("", true);
    $data = $namespace;
    $data .= $_SERVER['REQUEST_TIME'];
    $data .= $_SERVER['HTTP_USER_AGENT'];
    $data .= $_SERVER['LOCAL_ADDR'];
    $data .= $_SERVER['LOCAL_PORT'];
    $data .= $_SERVER['REMOTE_ADDR'];
    $data .= $_SERVER['REMOTE_PORT'];
    $hash = strtolower(hash('ripemd128', $uid . $guid . md5($data)));
    $guid = '' .   
            substr($hash,  0,  8) . 
            '-' .
            substr($hash,  8,  4) .
            '-' .
            substr($hash, 12,  4) .
            '-' .
            substr($hash, 16,  4) .
            '-' .
            substr($hash, 20, 12);
    return $guid;
}

?>