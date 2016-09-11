<?php

include "../common.php";

if (count($_POST) == 0) {
	echo "No data.";
	exit;
}

if (!file_exists("data.db")) {
	echo "Database not found. Please ensure you have ran the installer first.";
	exit;
}

$string = "";
foreach($_POST as $key => $value) {
	$string .= $key . ": " . $value . "\n";
}

echo $string;

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


?>