<?php
//error_reporting(E_ALL);
//ini_set('display_errors', '1');

header("Content-Type: application/json");

include_once("api/get_req_params.php");

include_once("pages/{$req_params[0]}.php");

die(json_encode(array(
	"content" => get_main_content($req_params),
	"title" => get_title(),
	"path" => get_page_path($req_params)
)));

?>