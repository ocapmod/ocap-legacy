<?php
include "../common.php";

// Manage map installation
if (isset($_POST["option"])) {
	$option = $_POST["option"];
	$filename = $_POST["filename"];
	$localMapDir = "../images/maps/";

	if ($option == "download") {
		$fileUrl = $statServerUrl . "maps/archives/" . $filename;
		$bufferSize = 1024 * 4; // 4KB

		print_debug("File URL: " . sprintf('<a href="%1$s">%1$s</a>', $fileUrl));

		// Begin downloading map archive file
		$fileRemote = fopen($fileUrl, "rb");
		$fileLocal = fopen($localMapDir . $filename, "wb");

		if ($fileLocal && $fileRemote) {
			while (!feof($fileRemote)) {
				fwrite($fileLocal, fread($fileRemote, $bufferSize));
			}

			// Close file handles
			fclose($fileRemote);
			fclose($fileLocal);
		}

		// Refresh local maps json file
		file_put_contents(
			"../images/maps/maps.json",
			file_get_contents($statServerUrl . "maps/archives/maps.json")
		);
	} elseif ($option == "extract") {
		try {
			// Extract recently downloaded file
			$archiveFile = $localMapDir . $filename;
			$phar = new PharData($archiveFile);
			$phar->extractTo($localMapDir);

			// Delete archive file
			unlink($archiveFile);
		} catch (Exception $e) {
			echo $e->getMessage();
		}
	}
	exit;
}

// Get list of maps and their file sizes from remote server
$result = curlRemote("maps/maps.php");
print_debug("Result: " . $result);
$mapList = json_decode($result, true);

// See which maps are already installed, mark accordingly
foreach($mapList as $key => $map) {
	$mapDirName = str_replace(".tar", "", $map["filename"]);
	$mapDirName = strtolower($mapDirName);
	if (file_exists("../images/maps/" . $mapDirName)) {
		$mapList[$key]["installed"] = true;
	} else {
		$mapList[$key]["installed"] = false;
	}
}

$mapList = json_encode($mapList);


// Do a version check
$remoteVersion = curlRemote("updates-manager.php", array("option" => "get_version"));
$updateRequired = false;

print_debug("Remote version: " . $remoteVersion);
print_debug("Local version: " . VERSION);

if (VERSION != ($remoteVersion)) {
	$updateRequired = true;
}
?>

<!DOCTYPE html>
<html>
<head>
	<title><?php echo $appTitle; ?></title>
	<link rel="stylesheet" href="../style/common.css" />
	<link rel="stylesheet" href="../style/admin.css" />
	<script src="../scripts/jquery.min.js"></script>
	<style>
	.table {
		table-layout: fixed;
	}
	.map-row:hover {
		background-color: #F6F6F6;
		cursor: pointer;
	}
	.status {
		font-weight: 500;
	}
	.installed {
		color: #43A047;
	}
	.not-installed {
		color: #9E9E9E;
	}
	</style>
</head>
<body>

<h1>Map Manager</h1>
Click on a map to begin download/install.<br/><br/>
<table id="table" class="table">
	<tr>
		<th>Map</th>
		<th>Size</th>
		<th>Status</th>
	</tr>
</table>
<br/><br/>

<h1>Updates</h1>
<table>
	<tr>
		<td>Your version:</td>
		<td id="current-version"><?php echo VERSION; ?></td>
	</tr>
	<tr>
		<td>Latest version:</td>
		<td id="latest-version"><?php echo $remoteVersion; ?></td>
	</tr>
	<tr>
		<td colspan='2'>
		<?php
		if ($updateRequired) {
			echo "<a href='" . $statServerUrl . "releases/current.zip" . "'>Download latest version</a>";
		} else {
			echo "You have the latest version.";
		}
		?>
		</td>
	</tr>
</table>

<script>
let elMapTable = document.getElementById("table");
let mapList = <?php echo $mapList; ?>;

function downloadComplete(filename, td) {
	td.textContent = "Download complete.";

	setTimeout(function() {
		td.textContent = "Extracting...";

		// TODO: Extract downloaded .tar file
		$.ajax({
			method: "POST",
			url: "index.php",
			data: {
				option: "extract",
				filename: filename
			},
			success: function(data) {
				console.log(data);
				extractComplete(td);
			},
			error: function(xhr, textStatus, errorThrown) {
				console.log(errorThrown);
				console.log(textStatus);
			}
		});
	}, 1000);
};

function extractComplete(td) {
	td.textContent = "Installed";
	td.className = "status installed";
}

// Iterate through list of maps and display each one
mapList.forEach(function(map) {
	let filesizeMB = Math.round(map.filesize * Math.pow(2, -20));

	// Create cell to display install status
	let text = map.installed ? "Installed" : "Not installed";
	let className = map.installed ? "installed" : "not-installed";
	let tdInstalled = document.createElement("td");
	tdInstalled.textContent = text;
	tdInstalled.className = "status " + className;

	// Create row
	let row = document.createElement("tr");
	row.className = "map-row";

	// Download map on row click
	row.addEventListener("click", function() {
		console.log(map.name);
		console.log(map.filename);
		console.log(filesizeMB);

		tdInstalled.textContent = "Downloading...";
		tdInstalled.className = "status";
		$.ajax({
			method: "POST",
			url: "index.php",
			data: {
				option: "download",
				filename: map.filename.toLowerCase()
			},
			success: function(result) {
				console.log(result);
				downloadComplete(map.filename, tdInstalled)
			}
		});
	});

	// Add to table
	row.innerHTML = `
		<td>${map.name}</td>
		<td>${filesizeMB} MB</td>
	`;
	row.appendChild(tdInstalled);
	elMapTable.appendChild(row);
});

</script>
</body>
</html>