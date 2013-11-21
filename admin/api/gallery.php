<?php

include_once("common.php");

$response = array(
	"section" => "gallery",
	"title" => "Gallery"
);

if ($_SERVER['REQUEST_METHOD'] == "GET") {
	$albums = array();
	
	mysqlConnect();
	
	$qry = mysql_query("SELECT * FROM albums");
	
	if (!$qry) {
		doMysqlAjaxError();
	}
	
	while ($album = mysql_fetch_assoc($qry)) {
		$id = $album['id'];
		$title = $album['name'];
		$photos = array();
		
		$photoQry = mysql_query("	SELECT * FROM album_photos ap
									JOIN photos p ON ap.photo_id = p.id
									WHERE ap.album_id = $id
									ORDER BY p.id DESC");
		
		if (!$photoQry) {
			doMysqlAjaxError();
		}
		
		while ($photo = mysql_fetch_assoc($photoQry)) {
			list($photo['width'], $photo['height']) = getimagesize("../../img/photos/" . $photo['full']);
			$photos[] = $photo;
		}
		
		$albums[] = array(
			"id" => $id,
			"title" => $title,
			"photos" => $photos
		);
	}
	
	$response['albums'] = $albums;
} else if ($_POST['action'] == "new_album") {
	mysqlConnect();
	
	$title = mysql_real_escape_string($_POST['title']);
	
	$qry = mysql_query("INSERT INTO albums (name) VALUES ('$title')");
	
	if (!$qry) {
		doMysqlAjaxError();
	}
	
	$response['album'] = array(
		"id" => mysql_insert_id(),
		"title" => $_POST['title'],
		"photos" => array()
	);
} else if ($_POST['action'] == "upload") {
	if (!file_exists('../tmp') && !mkdir('../tmp', 0777, true))
		die('<span id="imageresult">' . json_encode(array("error" => "Internal Error|There was an error, please try again later.|mkdirs")) . '</span>');
	
	$folder_path = "../tmp";
	
	$full = upload('file', $folder_path, 'jpg,jpeg', "jpg");
	
	if ($full['error'] != "")
		die('<span id="imageresult">' . json_encode($full) . '</span>');
	
	die('<span id="imageresult">' . json_encode($full) . '</span>');
} else if ($_POST['action'] == "submit") {
	// Create different sizes with(out) watermarks
	
	$full_res_file = '../' . $_POST['image']['filepath'];
	$full_res_wm_file = '../tmp/trans-' . $_POST['image']['file_name'];
	
	{	// Create watermarked full-res
		$png = imagecreatefrompng('../img/watermark.png');
		$jpeg = imagecreatefromjpeg($full_res_file);

		list($water_width, $water_height) = getimagesize('../img/watermark.png');
		$x_coor = $_POST['image']['wm']['x'];
		$y_coor = $_POST['image']['wm']['y'];
		$scale = $_POST['image']['wm']['s'];
		$width = intval($water_width * $scale);
		$height = intval($water_height * $scale);
	
		list($newwidth, $newheight) = getimagesize($full_res_file);
	
		$out = imagecreatetruecolor($newwidth, $newheight);
		imagecopyresampled($out, $jpeg, 0, 0, 0, 0, $newwidth, $newheight, $newwidth, $newheight);
	
		$color_num = $_POST['image']['wmBarWhite'] == "true" ? 255 : 0;
		$trans_color = imagecolorallocatealpha($out, $color_num, $color_num, $color_num, 100);
		imagefilledrectangle($out, 0, $y_coor, $newwidth, $y_coor + $height, $trans_color);
		imagecopyresampled($out, $png, $x_coor, $y_coor, 0, 0, $width, $height, $water_width, $water_height);
	
		imagejpeg($out, $full_res_wm_file, 100);
	}
	
	if (!file_exists('../../img/photos') && !mkdir('../../img/photos', 0777, true)) {
		errorMessage("Internal Error", "There was an internal error, try again later.");
	}
	
	{ // Copy thumbnail
		$folder_name = create_guid();
		$folder = '../../img/photos/' . $folder_name;
		if (!file_exists($folder) && !mkdir($folder, 0777, true)) {
			errorMessage("Internal Error", "There was an internal error, try again later.");
		}
		
		$thumb_name = create_guid() . ".jpg";
		$thumb_path = $folder_name . "/" . $thumb_name;
		
		image_resize($full_res_file, $folder . "/" . $thumb_name, 250, 250);
	}
	
	{ // Copy 720p photo
		$folder_name = create_guid();
		$folder = '../../img/photos/' . $folder_name;
		if (!file_exists($folder) && !mkdir($folder, 0777, true)) {
			errorMessage("Internal Error", "There was an internal error, try again later.");
		}
		
		$display_name = create_guid() . ".jpg";
		$display_path = $folder_name . "/" . $display_name;
		
		image_resize($full_res_file, $folder . "/" . $display_name, 720, 720);
		
		// Watermarked
		
		$folder_name = create_guid();
		$folder = '../../img/photos/' . $folder_name;
		if (!file_exists($folder) && !mkdir($folder, 0777, true)) {
			errorMessage("Internal Error", "There was an internal error, try again later.");
		}
		
		$display_name_wm = create_guid() . ".jpg";
		$display_path_wm = $folder_name . "/" . $display_name_wm;
		
		image_resize($full_res_wm_file, $folder . "/" . $display_name_wm, 720, 720);
	}
	
	{ // Copy full res photo
		$folder_name = create_guid();
		$folder = '../../img/photos/' . $folder_name;
		if (!file_exists($folder) && !mkdir($folder, 0777, true)) {
			errorMessage("Internal Error", "There was an internal error, try again later.");
		}
		
		$full_name = create_guid() . ".jpg";
		$full_path = $folder_name . "/" . $full_name;
		
		copy($full_res_file, $folder . "/" . $full_name);
		
		// Watermarked
		
		$folder_name = create_guid();
		$folder = '../../img/photos/' . $folder_name;
		if (!file_exists($folder) && !mkdir($folder, 0777, true)) {
			errorMessage("Internal Error", "There was an internal error, try again later.");
		}
		
		$full_name_wm = create_guid() . ".jpg";
		$full_path_wm = $folder_name . "/" . $full_name_wm;
		
		copy($full_res_wm_file, $folder . "/" . $full_name_wm);
	}
	
	mysqlConnect();
	
	$qry = mysql_query("INSERT INTO photos (thumb, med, med_wm, full, full_wm) VALUES
		('$thumb_path','$display_path','$display_path_wm','$full_path','$full_path_wm')");
	
	if (!$qry) {
		doMysqlAjaxError();
	}
	
	$photo_id = mysql_insert_id();
	$album_id = $_POST['album_id'];
	
	$qry = mysql_query("INSERT INTO album_photos VALUES ($album_id, $photo_id)");
	
	if (!$qry) {
		doMysqlAjaxError();
	}
	
	unlink($full_res_file);
	unlink($full_res_wm_file);
	
	$response['image_info'] = array(
		"id" => $photo_id,
		"thumb" => $thumb_path,
		"display" => $display_path,
		"full" => $full_path,
		"width" => $newwidth,
		"height" => $newheight
	);
}

die(json_encode($response));

?>