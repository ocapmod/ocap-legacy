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

// Begin capture loop
[ocap_fnc_captureFrame, ocap_frameCaptureDelay] call CBA_fnc_addPerFrameHandler;

// Add debug actions
player addAction ["Publish", {[] call ocap_fnc_publish}];
player addEventHandler ["Respawn", {
	player addAction ["Publish", {[] call ocap_fnc_publish}];
}];