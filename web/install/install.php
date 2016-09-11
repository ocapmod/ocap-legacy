<?php
include "../common.php";

if (count($_POST) == 0) {
	header('Location: ../install/index.php'); // Redirect to correct page
	exit;
}

if ($_POST['agree']) {
	// Get URL and IP of server
	$host = 'http://' . $_SERVER['HTTP_HOST'];
	$root = $_SERVER["REQUEST_URI"];
	$root = str_replace(basename($root), "", $root);
	$root = str_replace("install/", "", $root);
	print_debug("Root location: " . $root);
	$ip = file_get_contents($statServerUrl . 'ip.php');
	$groupName = $_POST['groupName'];

	// == Contact stats server to log this server's details
	// Set POST vars
	$fields = array(
		'option' => "create",
		'name' => $groupName,
		'host' => $host,
		'root' => $root,
		'ip' => $ip
	);

	// Contact stats server
	// Please do not modify this as these stats help me get a job. Thank-you! :)
	$result = curlRemote("stats-manager.php", $fields);
	print_debug("Result: " . $result);

	$id = intval($result);

	if ($id == 0) {
		echo "Error: Failed adding this server to statistics database (invalid ID returned).<br/>";
		exit;
	} 

	// == Create/initialise local database + store server's details
	try {
		$db = new PDO('sqlite:../data/data.db'); // Create local database
		
		// Create table to store list of operations
		$db->exec("
			CREATE TABLE operations (
				id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
				world_name TEXT,
				mission_name TEXT,
				mission_duration INTEGER,
				filename TEXT,
				date TEXT
			)
		");

		// Create table to log this server's details
		$db->exec("
			CREATE TABLE servers (
				remote_id INTEGER NOT NULL PRIMARY KEY,
				name TEXT,
				ip TEXT,
				host TEXT,
				root TEXT,
				view_count INTEGER,
				capture_count INTEGER
			)
		");
		$db->exec(sprintf("
			INSERT INTO servers (remote_id, name, ip, host, root, view_count, capture_count)
			VALUES (
				%d,
				'%s',
				'%s',
				'%s',
				'%s',
				0,
				0
			)
		", $id, $groupName, $ip, $host, $root));

		print_debug("ID: " . $id);
	} catch (PDOExecption $e) {
		echo "Exception: ".$e->getMessage();
	}
}
?>