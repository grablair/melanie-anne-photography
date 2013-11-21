<?php

include_once("api/get_req_params.php");

include_once("pages/{$req_params[0]}.php");

?>

<!DOCTYPE HTML>
<html>
	<head>
		<title>Melanie Anne Photography - <?= get_title() ?></title>
		<meta name="viewport" content="width=860, user-scalable=0" />
		<link rel="stylesheet" href="/css/main.css" />
		<script src="js/jquery.min.js"></script>
		<script src="js/jquery-ui.min.js"></script>
		<script type="text/javascript" src="/js/main.js"></script>
		<?= page_js($req_params[0]) ?>
		<?= page_css($req_params[0]) ?>
	</head>
	<body page="<?= $req_params[0] ?>">
		<header>
			Melanie Anne Photography
		</header>
		<?php
		$main_style = "";
		if ($req_params[0] == "home") $main_style = "opacity: 0";
		?>
		<div id="main-content" style="<?= $main_style ?>">
			<?php
			print_main_content($req_params);
			?>
		</div>
		<div id="copyright" style="<?= $main_style ?>">
			&copy; 2013 Melanie Anne Photography
		</div>
		<footer>
			<nav>
				<?php
				echo nav_link("Home", "", true);
				echo nav_link("Gallery", "gallery");
				echo nav_link("Blog", "blog");
				echo nav_link("Clients", "clients");
				?>
			</nav>
			<aside>
				<!--&copy; 2013 Melanie Anne Photography-->
				<img id="prev-slideshow" class="slideshow-control" src="/img/prev.png" style="display: none" caption="Previous" title/>
				<img id="pause-slideshow" class="slideshow-control" src="/img/pause.png" style="display: none" caption="Pause" title/>
				<img id="next-slideshow" class="slideshow-control" src="/img/next.png" style="display: none" caption="Next" title/>
				<img id="show-slideshow" class="slideshow-control hide-on-home" src="/img/slideshow.png" style="display: none" caption="Hide Content" title/>
				<img id="loading-slideshow" src="/img/ajax-loader.gif" alt="-" />
			</aside>
		</footer>
	</body>
</html>


<?php

function page_js($page) {
	if (file_exists("js/$page.js")) {
		return "<script type=\"text/javascript\" src=\"/js/$page.js\"></script>";
	}
	
	return "";
}

function page_css($page) {
	if (file_exists("css/$page.css")) {
		return "<link rel=\"stylesheet\" href=\"/css/$page.css\" />";
	}
	
	return "";
}

function nav_link($title, $link, $is_home = false) {
	$link_id = "link-" . implode("-", explode("/", $link));
	$link_text = "<a id=\"$link_id\" href=\"/$link\" class=\"local";
	if ($link == get_active_nav()) {
		$link_text .= " active";
	}
	if ($is_home) {
		$link_text .= " home-link";
	}
	return $link_text . "\">$title</a>";
}

?>
