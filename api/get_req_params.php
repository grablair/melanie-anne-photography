<?php

current($_GET);
$req_param_str = key($_GET);

if (strlen($req_param_str) == 1) {
	$req_params = array("home");
} else {
	$req_params = explode("/", substr($req_param_str, 1));
}

if (!file_exists("pages/{$req_params[0]}.php")) {
	$req_params[0] = "notfound";
}

?>