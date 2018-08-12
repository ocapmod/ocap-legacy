/*
	Author: MisterGoodson

	Description:
	Initialises OCAP.
	Capture loop is automatically started once init complete.
*/

// Define global vars
#include "\userconfig\ocap\config.hpp";
ocap_entity_id = 0; // ID assigned to each entity (auto increments). Also acts as an index for each entity in entitiesData.
ocap_captureFrameNo = 0; // Frame number for current capture
ocap_eventsData = []; // Data on all events (involving 2+ units) that occur throughout the mission.

private _serverName = serverName;
if (!isMultiplayer) then {_serverName = "sp"};

if (ocap_debug) then {
	player addAction ["Publish", {[] call ocap_fnc_publish}];
	player addEventHandler ["Respawn", {
		player addAction ["Publish", {[] call ocap_fnc_publish}];
	}];
};

// Wait until minimum player count is reached before starting capture
waitUntil{sleep 1; (time > 1) && (count(allPlayers) >= ocap_minPlayerCount) && (ocap_capture)};
["Min player count reached, starting capture."] call ocap_fnc_log;
[] call ocap_fnc_addMissionEventHandlers;
["init"] call ocap_fnc_callExtension;

// Begin capture loop
[ocap_fnc_captureFrame, ocap_frameCaptureDelay] call CBA_fnc_addPerFrameHandler;