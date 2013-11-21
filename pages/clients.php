<?php

include_once("api/abstract_page.php");

function get_active_nav() {
	return "clients";
}

function get_title() {
	return "Clients";
}

function print_main_content($req_params) {
	?>
	<h1>Clients</h1>
	<?php
}

?>