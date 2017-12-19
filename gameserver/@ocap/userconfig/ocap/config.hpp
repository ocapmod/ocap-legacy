// true: Capture will automatically begin upon mission start
// false: Capture will not begin until set to true (e.g. in mission init.sqf) AND ocap_minPlayerCount is met.
// Setting to false allows for mission-specific capture
ocap_capture = true;

ocap_capManagerHost = "localhost:5000"; // Hostname and port of Capture Manager
ocap_frameCaptureDelay = 1; // Delay between each frame capture. Default: 1
ocap_minPlayerCount = 1; // Minimum player count before capture begins. Set this to 0 for immediate capture (assuming ocap_endCaptureOnNoPlayers = false)

ocap_endCaptureOnNoPlayers = true; // End (and export) capture once players are no longer present

// Currently non-functional due to Arma bug
// https://feedback.bistudio.com/T120253
ocap_endCaptureOnEndMission = false; // End (and export) capture once mission ends

ocap_debug = true; // Debug mode