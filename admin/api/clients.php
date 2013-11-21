<?php

include_once("common.php");

$response = array(
	"section" => "clients",
	"title" => "Clients"
);

if ($_SERVER['REQUEST_METHOD'] == "GET") {
	
} else {

}

die(json_encode($response));

?>