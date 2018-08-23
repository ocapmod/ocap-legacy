/*
	Author: MisterGoodson

	Description:
	Initialises OCAP.
	Capture loop is automatically started once init complete.
*/

waitUntil{time > 1};

// Define global vars
#include "\userconfig\ocap\config.hpp";
private _serverName = serverName;
if (!isMultiplayer) then {_serverName = "sp"};

[false] call ocap_fnc_resetCapture;
[] call ocap_fnc_addMissionEventHandlers;

// Add debug actions
player addAction ["Publish", {[] call ocap_fnc_publish}];
player addEventHandler ["Respawn", {
	player addAction ["Publish", {[] call ocap_fnc_publish}];
}];

// Begin capture loop
while {true} do {
	private _nextFrameTime = diag_tickTime + ocap_frameCaptureDelay;
	[] call ocap_fnc_captureFrame;
	waitUntil {diag_tickTime >= _nextFrameTime};
};