/*
	Author: MisterGoodson

	Description:
	Initialises OCAP.
	Capture loop is automatically started once init complete.
*/

waitUntil{time > 1};

// Define global vars
#include "\userconfig\ocap\config.hpp";
private _runScheduled = true; // Should NEVER be false UNLESS testing
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
if (_runScheduled) then {
	while {true} do {
		private _nextFrameTime = diag_tickTime + ocap_frameCaptureDelay;
		[] call ocap_fnc_captureFrame;
		waitUntil {diag_tickTime >= _nextFrameTime}; // More reliable than sleep
	};
} else {
	private _str = "Running in unscheduled mode! This should ONLY be used when testing!";
	[_str] call ocap_fnc_log;
	("OCAP: " + _str) remoteExec ["systemChat", -2];
	[ocap_fnc_captureFrame, ocap_frameCaptureDelay] call cba_fnc_addPerFrameHandler;
};
