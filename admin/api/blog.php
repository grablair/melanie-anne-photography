<?php

include_once("common.php");

$response = array(
	"section" => "blog",
	"title" => "Blog"
);

if ($_SERVER['REQUEST_METHOD'] == "GET") {
	$where_clause = isset($_GET['before']) ? " WHERE id < " . intval($_GET['after']) : "";
	
	$response['posts'] = array(
		array(
			"title" => "Test",
			"content" => "This is a test post",
			"id" => 5
		),
		array(
			"title" => "First Post",
			"content" => "This is the first post ever.",
			"id" => 4
		)
	);
} else {

}

die(json_encode($response));

?>