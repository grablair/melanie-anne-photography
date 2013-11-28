<?php

include_once("common.php");

$response = array(
	"section" => "blog",
	"title" => "Blog"
);

if ($_SERVER['REQUEST_METHOD'] == "GET") {
	$where_clause = isset($_GET['before']) ? " WHERE id < " . intval($_GET['after']) : "";
	
	mysqlConnect();
	$qry = mysql_query("SELECT * FROM blog_posts" . $where_clause . " ORDER BY id DESC");
	
	if (!$qry) doMysqlAjaxError();
	
	$response['posts'] = array();
	while ($row = mysql_fetch_assoc($qry)) {
		$response['posts'][] = $row;
	}
} else if ($_POST['action'] == "create") {
	mysqlConnect();
	
	$title = mysql_real_escape_string($_POST['title']);
	$content = mysql_real_escape_string($_POST['content']);
	$time = time();
	
	$qry = mysql_query("INSERT INTO blog_posts (title, content, author_id, creation_time) 
						VALUES ('$title', '$content', 1, $time)");
						
	if (!$qry) doMysqlAjaxError();
	
	$response['id'] = mysql_insert_id();
	$response['title'] = $_POST['title'];
	$response['content'] = $_POST['content'];
} else if ($_POST['action'] == "update") {
	mysqlConnect();
	
	$post_id = $_POST['id'];
	$title = mysql_real_escape_string($_POST['title']);
	$content = mysql_real_escape_string($_POST['content']);

	$qry = mysql_query("UPDATE blog_posts SET title = '$title', content = '$content'
						WHERE id = $post_id");
						
	if (!$qry) doMysqlAjaxError();
}

die(json_encode($response));

?>