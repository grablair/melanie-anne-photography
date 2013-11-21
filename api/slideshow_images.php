<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');

$directory = "../img/slideshow";

if (!file_exists($directory))
	die("[]");
	
$images = glob($directory . "/*");

foreach ($images as $image) {
	if (is_dir($image))
		continue;
	$imageArray['filepath'] = $image;
	$size = getimagesize($image);
	$imageArray['width'] = $size[0];
	$imageArray['height'] = $size[1];
	$result[] = $imageArray;
}

if (!isset($result) || count($result) == 0)
	die("[]");

die(json_encode($result));
?>