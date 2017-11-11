// true: Capture will automatically begin upon mission start
// false: Capture will not begin until set to true (e.g. in mission init.sqf) AND ocap_minPlayerCount is met.
// Setting to false allows for mission-specific capture
ocap_capture = true;

// true: Export capture files to a remote server via FTP (use if web server and game server are separate boxes)
// false: Export capture files locally (use if web server and game server run on the same box)
ocap_exportRemote = false;

/*
== Local details ==
Configure these values if ocap_exportRemote = false
*/
// Absolute path to OCAP web root directory
ocap_exportPath = "F:/xampp/htdocs/"; // e.g. "C:/apache/htdocs/ocap/"
// == Local details end ==


ocap_exportURL = "http://localhost/"; // URL to OCAP root directory (e.g. http://your-website.com/ocap/)
ocap_frameCaptureDelay = 1; // Delay between each frame capture. Default: 1
ocap_minPlayerCount = 1; // Minimum player count before capture begins. Set this to 0 for immediate capture (assuming ocap_endCaptureOnNoPlayers = false)

ocap_endCaptureOnNoPlayers = true; // End (and export) capture once players are no longer present

// Currently non-functional due to Arma bug
// https://feedback.bistudio.com/T120253
ocap_endCaptureOnEndMission = false; // End (and export) capture once mission ends

ocap_debug = true; // Debug mode