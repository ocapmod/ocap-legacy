<?php

include "../common.php";

if (count($_POST) == 0) {
	echo "No data received.";
	exit;
}

if (!file_exists("data.db")) {
	echo "Database not found. Please ensure you have ran the installer first.";
	exit;
}

$option = $_POST["option"];

//echo "Raw data received: " .implode(" ", $_POST) . "\n";
$string = "";
foreach($_POST as $key => $value) {
	$string .= $key . ": " . $value . "\n";
}

// Truncate string if too large
if (strlen($string) > 500) {
	$string = substr($string, 0, 500) . "...";
}
echo "Processed data: \n". $string . "\n";

if ($option == "addFile") { // Add receieved file to this directory
	$fileName = $_POST["fileName"];
	$fileContents = $_POST["fileContents"];

	try {
		file_put_contents($fileName, $fileContents);
		echo "Successfully created file.";
	} catch (Exception $e) {
		echo $e->getMessage();
	}
} elseif ($option == "dbInsert") { // Insert values into SQLite database
	$date = date("Y-m-d");
	$serverId = -1;
	try {
		$db = new PDO('sqlite:data.db');
		
		// Add operation to database
		$db->exec(sprintf("
			INSERT INTO operations (world_name, mission_name, mission_duration, filename, date) VALUES (
				'%s',
				'%s',
				%d,
				'%s',
				'%s'
			)
		", $_POST["worldName"], $_POST["missionName"], $_POST["missionDuration"], $_POST["filename"], $date));

		// TODO: Increment local capture count

		// Get server ID
		$results = $db->query("SELECT remote_id FROM servers");
		$serverId = $results->fetch()["remote_id"];
		$db = null;
		print_debug($serverId);

	} catch (PDOExecption $e) {
		echo "Exception: ".$e->getMessage();
	}

	// TODO: Increment capture count on remote database
	$result = curlRemote("stats-manager.php", array(
		"option" => "increment_capture_count",
		"server_id" => $serverId
	));

	print_debug($result);
} else {
	echo "Invalid option";
}

?>