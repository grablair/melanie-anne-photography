<?php

include_once("api/abstract_page.php");

function get_active_nav() {
	return "blog";
}

function get_title() {
	return "Blog";
}

function print_main_content($req_params) {
	?>
	<h1>Blog</h1>
	<?php
}

?>