<?php

function get_page_path($req_params) {
	return "/" . implode("/", $req_params);
}

function get_main_content($req_params) {
	ob_start();
	print_main_content($req_params);
	return ob_get_clean();
}

?>