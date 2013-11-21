<?php

include_once("api/abstract_page.php");

function get_active_nav() {
	return "gallery";
}

function get_title() {
	return "Gallery";
}

function print_main_content($req_params) {
	?>
	<h1>Gallery</h1>
	<?php
}

?>