<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');
include("../common.php");

if (!isset($_GET['id'])) {
	doAjaxError("Invalid Request",
				"The request you send was invalid. Make sure everything is entered correctly",
				"400 Bad Request");
}

$directory = "../../img/galleries/" . $_GET['id'];

if (!file_exists($directory))
	die("[]");
	
$images = array_reverse(glob($directory . "/*"));

foreach ($images as $image) {
	if (is_dir($image))
		continue;
	$imageArray['filepath'] = substr($image, 5);
	$pathParts = explode("/", $image);
	$pathParts[sizeof($pathParts)] = $pathParts[sizeof($pathParts) - 1];
	$pathParts[sizeof($pathParts) - 2] = "thumbs";
	$imageArray['thumbpath'] = implode("/", $pathParts);
	$pathParts[sizeof($pathParts) - 2] = "small";
	$imageArray['smallpath'] = implode("/", $pathParts);
	$size = getimagesize($image);
	$imageArray['width'] = $size[0];
	$imageArray['height'] = $size[1];
	$result[] = $imageArray;
}

if (!isset($result) || count($result) == 0)
	die("[]");

die(json_encode($result));
?>