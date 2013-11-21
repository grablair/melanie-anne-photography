<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');
session_start();

if (!isset($_SESSION['logged_in']) && isset($_POST['username']) && isset($_POST['password'])) {
	$_SESSION['logged_in'] = true;
	header("Location: /admin");
}
?>

<!DOCTYPE HTML>
<html class="lockable">
	<head>
		<title>Melanie Anne Photography - Admin Page</title>
		<!--<meta name="viewport" content="width=860, user-scalable=0" />-->
		<link rel="stylesheet" href="css/style.css" />
		<script src="../js/jquery.min.js"></script>
		<script src="../js/jquery-ui.min.js"></script>
		<script src="../js/Class.js"></script>
		<script type="text/javascript" src="js/main.js"></script>
	</head>
	<body>
		<?php
		if (isset($_SESSION['logged_in']) && $_SESSION['logged_in']) {
			?>
			<input type="hidden" id="logged-in-input" />
			
			<div id="dashboard-button-holder">
				<h1>melanie anne photography</h1>
				<div class="dashboard-button-wrapper">
					<div class="dashboard-button" dash-section="blog"><img src="img/blog-icon.jpg"/></div>
					Blog
				</div>
				<div class="dashboard-button-wrapper">
					<div class="dashboard-button" dash-section="gallery"><img src="img/gallery-icon.jpg"/></div>
					Gallery
				</div>
				<div class="dashboard-button-wrapper">
					<div class="dashboard-button" dash-section="clients"><img src="img/clients-icon.jpg"/></div>
					Clients
				</div>
			</div>
			<!--
			<div id="dashboard">
				<header></header>
				<nav></nav>
				<section></section>
			</div>
			-->
			<?php
		} else {
			?>
			<div id="login-box">
				<h1>login</h1>
				<form method="POST">
					<input type="text" name="username" placeholder="Username" autofocus/>
					<div class="divider"></div>
					<input type="password" name="password" placeholder="Password" />
					<div class="divider"></div>
					<div class="submit-wrapper">
						<button>Submit</button>
					</div>
				</form>
			</div>
			<?php
		}
		?>
		<form id="file_upload_form" method="post" enctype="multipart/form-data" action="scripts/players/uploadImage.php" style="width:0;height:0;border:0px solid #fff;visibility:hidden;">
			<input name="file[]" id="file" size="27" type="file" multiple="multiple" accept=".jpg,.jpeg"/>
			<input name="action" type="hidden" value="upload" />
			<iframe id="upload_target" name="upload_target" src="" style="width:0;height:0;border:0px solid #fff;visibility:hidden;"></iframe>
		</form>
	</body>
</html>