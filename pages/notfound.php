<?php

include_once("api/abstract_page.php");

function get_active_nav() {
	return "notfound";
}

function get_title() {
	return "Page Not Found";
}

function print_main_content($req_params) {
	?>
	<h1>Page Not Found</h1>
	<?php
}

?>