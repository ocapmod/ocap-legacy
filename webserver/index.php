<?php
include "common.php";
$dbPath = "data/data.db";

// Check if database exists
if (!file_exists($dbPath)) {
	echo "
	<div style='font-family: Arial, sans-serif;'>
		<b>Error:</b> Database not found. Please ensure you have ran the <a href='install/'>installer</a> first.
	</div>
	";
	exit();
};

// Get server's id from local DB
$db = new PDO('sqlite:' . $dbPath);
$result = $db->query("SELECT remote_id FROM servers");
$row = $result->fetchObject();
$id = $row->remote_id; // Used later when contacting stats server
print_debug("ID: " . $id);

// Increment view count in local DB
$db->exec(sprintf("UPDATE servers SET view_count = view_count + 1 WHERE remote_id = %d", $id)); 

// Get list of operations from DB
$result = $db->query("SELECT * FROM operations");
$ops = array();
foreach($result as $row) {
	$ops[] = $row;
}

// Close DB
$db = NULL;


// Contact stats server to increment view count
// Please do not modify this as these stats help me get a job. Thank-you! :)
$result = curlRemote("stats-manager.php", array(
	"option" => "increment_view_count",
	"server_id" => $id
));
print_debug("Result: " . $result);

// Check remote server for any urgent messages
$result = curlRemote("stats-manager.php", array(
	"option" => "get_urgent_message",
	"version" => VERSION
));

if ($result != "") {
	echo sprintf("<script>alert(\"%s\")</script>", $result);
	print_debug($result);
}
?>
<!DOCTYPE html>
<html>
<head>
	<title><?php echo $appTitle; ?></title>
	<meta charset="utf-8"/>
	<meta name="viewport" content="initial-scale=1.0, user-scalable=no"/>
	<link rel="stylesheet" href="style/leaflet-1.0.0-rc1.css" />
	<link rel="stylesheet" href="style/common.css" />
	<link rel="stylesheet" href="style/index.css" />
	<link rel="icon" type="img/png" href="images/favicon.png">
	<script src="scripts/leaflet-1.0.0-rc1.js"></script>
	<script src="scripts/leaflet.rotatedMarker.js"></script>
	<script src="scripts/leaflet.svgIcon.js"></script>
	<script src="scripts/jquery.min.js"></script>
	<script src="scripts/ocap.js"></script>
</head>
<body>


<div id="container">
	<a href="http://www.3commandobrigade.com/" target="_blank">
		<div id="uk3cbLogoWatermark"></div>
	</a>
	<div id="map"></div>
	<div id="topPanel">
		<div id="ocapLogoButton"></div>
		<div id="loadOpButton" class="button"></div>
		<div id="aboutButton" class="bold button">i</div>
		<span id="toggleFirelines" class="button"></span>
		<span id="missionName" class="medium"></span>
	</div>
	<div id="leftPanel">
		<div class="title bold"><span>Units</span></div>
		<div class="filterBox"></div>
		<div class="panelContent">
			<ul id="listWest"><span class="blufor sideTitle">BLUFOR</span></ul>
			<ul id="listEast"><span class="opfor sideTitle">OPFOR</span></ul>
			<ul id="listGuer"><span class="ind sideTitle">INDEPENDENT</span></ul>
			<ul id="listCiv"><span class="civ sideTitle">CIVILIAN</span></ul>
		</div>
	</div>
	<div id="rightPanel">
		<div class="title bold">Events</div>
		<div class="filterBox">
			<div id="filterHitEventsButton" class="filterHit"></div>
			<input type="text" id="filterEventsInput" placeholder="Filter" />
		</div>
		<div class="panelContent">
			<ul id="eventList"></ul>
		</div>
	</div>
	<div class="extraInfoBox">
		<div class="extraInfoBoxContent">
			<span class="bold">Cursor target: </span><span id="cursorTargetBox">None</span>
		</div>
	</div>
	<div id="bottomPanel">
		<div class="panelContent">
			<div id="playPauseButton" onclick="playPause()">
			</div>
			<div id="timecodeContainer" class="medium">
				<span id="missionCurTime">0:00:00</span>
				<span>/</span>
				<span id="missionEndTime">0:00:00</span>
			</div>
			<div id="frameSliderContainer">
				<input type="range" id="frameSlider" min="0" value="0">
					<div id="eventTimeline"></div>
				</input>
			</div>
			<div id="playbackSpeedSliderContainer">
				<span id="playbackSpeedVal"></span>
				<input type="range" id="playbackSpeedSlider" />
			</div>
			<div class="fullscreenButton" onclick="goFullscreen()"></div>
		</div>
	</div>
</div>

<div id="modal" class="modal">
	<div class="modalContent">
		<div id="modalHeader" class="modalHeader medium">Header</div>
		<div id="modalBody" class="modalBody">Body</div>
		<div id="modalButtons" class="modalButtons"></div>
	</div>
</div>

<div id="hint" class="hint">Test popup</div>

<script>
let opList = <?php echo json_encode($ops); ?>;
let appVersion = <?php echo json_encode(VERSION); ?>;
let appTitle = <?php echo json_encode($appTitle); ?>;
let appDesc = <?php echo json_encode($appDesc); ?>;
let appAuthor = <?php echo json_encode($appAuthor); ?>;

initOCAP();
</script>
</body>
</html>
