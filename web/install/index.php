<?php
include "../common.php";

/*$serverSoftware = strtolower($_SERVER["SERVER_SOFTWARE"]);
$loadedModules = array();
print_debug("Server software: " . $serverSoftware);

if (strpos($serverSoftware, "apache") !== false) {
	$serverSoftware = "apache";
	$loadedModules = apache_get_modules();
} elseif (strpos($serverSoftware, "nginx") !== false) {
	$serverSoftware = "nginx";
} else {
	$serverSoftware = "unknown";
}*/

// Configuration tests
$isWritableData = is_writable("../data/");
$isWritableMaps = is_writable("../images/maps/");
$isCurlEnabled = function_exists("curl_version");
?>
<!DOCTYPE html>
<html>
<head>
	<title><?php echo $appTitle; ?></title>
	<link rel="stylesheet" href="../style/common.css" />
	<link rel="stylesheet" href="../style/admin.css" />
	<script src="../scripts/jquery.min.js"></script>
</head>
<body>

<h1>Install</h1>
<div id="content">
Thanks for downloading OCAP. Let's get set up.<br/><br/><br/>

<h3>Requirements check</h3>
<table id="table" class="table">
</table>

<br/><br/>
<h3>Community/unit name:</h3>
<input id="inputName" type="text" oninput="checkAllowProceed()" />


<br/><br/><br/>
Before we can proceed, please read and agree to the following:
<br/><br/>
<textarea readonly>
Copyright (C) 2016 Jamie Goodson (aka MisterGoodson)

==================================================

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see http://www.gnu.org/licenses/.

==================================================

This server's IP will be logged for statistical purposes.
</textarea>

<button>Disagree</button><button id="btnAgree" disabled onclick="install()">Agree & Install</button>
</div>

<script>
let elContent = $("#content");
let elTableTests = $("#table");
let inputName = $("#inputName");
let btnAgree = $("#btnAgree");

let isWritableData = <?php echo json_encode($isWritableData); ?>;
let isWritableMaps = <?php echo json_encode($isWritableMaps); ?>;
let isCurlEnabled = <?php echo json_encode($isCurlEnabled ); ?>;
let isGzipEnabled = false;
let passedTests = false;

// Check if gzip compression enabled
$.ajax({
	url: "dummy_data.json",
	method: "get",
	success: function(res, status, xhr) {
		let contentEncoding = xhr.getResponseHeader("Content-Encoding");
		if (contentEncoding == "gzip") {isGzipEnabled = true};

		passedTests = isWritableData && isWritableMaps && isCurlEnabled && isGzipEnabled;
		buildTestsTable();
		checkAllowProceed();
	}
});

// Construct tests-table rows
function buildTestsTable() {
	let status;
	let comment;

	// Is data directory writable
	if (isWritableData) {
		status = '<td class="success">Pass</td>';
		comment = '<span class="code inline">data/</span> directory is writable.<br/><b>Note: </b>If your Arma server(s) also run on this box, please ensure they have read/write access to this directory too.';
	} else {
		status = '<td class="error">Fail</td>';
		comment = '<span class="code inline">data/</span> directory is not writable.';
	};
	elTableTests.append(`<tr>${status}<td>${comment}</td></tr>`);

	// Is maps directory writable
	if (isWritableMaps) {
		status = '<td class="success">Pass</td>';
		comment = '<span class="code inline">images/maps/</span> directory is writable.';
	} else {
		status = '<td class="error">Fail</td>';
		comment = '<span class="code inline">images/maps/</span> directory is not writable.';
	};
	elTableTests.append(`<tr>${status}<td>${comment}</td></tr>`);

	// Is curl enabled
	if (isCurlEnabled) {
		status = '<td class="success">Pass</td>';
		comment = 'PHP cURL is enabled.';
	} else {
		status = '<td class="error">Fail</td>';
		comment = 'PHP cURL is not enabled.';
	};
	elTableTests.append(`<tr>${status}<td>${comment}</td></tr>`);

	// Is gzip enabled
	if (isGzipEnabled) {
		status = '<td class="success">Pass</td>';
		comment = 'Gzip compression is enabled.';
	} else {
		status = '<td class="error">Fail</td>';
		comment = "Gzip compression is not enabled. Please enable it and then clear your browser's cache.<div class='note'>If you're using Apache, please enable the <span class='code inline'>mod_deflate</span> module and ensure <span class='code inline'>AllowOverride All</span> is set in your <span class='code inline'>httpd.conf</span> (at least for the directory where OCAP is installed).</div>";
	};
	elTableTests.append(`<tr>${status}<td>${comment}</td></tr>`);
}

function checkAllowProceed() {
	if (passedTests && (inputName.val().length > 0)) {
		btnAgree.attr("disabled", false);
	} else {
		btnAgree.attr("disabled", true);
	};
};

function fancyIntro() {
	console.log(fancyIntro);
	console.log(document.getElementById("content").style);
	setTimeout(function () {
		elContent.css("top", 0);
		elContent.css("opacity", 1);
	}, 1);
};

function install() {
	elContent.html("Installing (this should take less than a minute)...");
	$.ajax({
		method: 'POST',
		url: 'install.php',
		data: {
			'agree': true,
			'groupName': inputName.val()
		},
		success: function(data) {
			let message;
			if (data.toLowerCase().indexOf("error:") != -1) {
				 message = '<div class="error">Install failed.</div>'
			} else {
				message = `
				<div class="success">Install complete!</div>
				You may now capture and playback operations.<br/></br>

				Please delete, move, or rename the <span class="code inline">install/</span> directory.<br/><br/>

				Please ensure you have tested OCAP before using it on official gaming nights with your group.
				<ul>
					<li>Capture a mission (using the OCAP server addon) and check that the capture .json file was correctly transferred to the <span class="code inline">data/</span> directory.</li>
					<li>Playback the recently captured mission to ensure that all is working well</li>
				</ul><br/>

				<b>Note: </b>To download/install new maps or check for OCAP updates, head to <a href="../admin">/admin</a>.
				`;
			};

			elContent.html(data + message);
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			elContent.html("<div class='error'>" + errorThrown + "</div>");
		}
	});
};

fancyIntro();
</script>
</body>
</html>