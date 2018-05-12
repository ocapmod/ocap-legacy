/*
	Author: MisterGoodson

	Description:
	Initialises OCAP variables and mission-wide eventhandlers.
	Capture loop is automatically started once init complete.
*/

// Define global vars
#include "\userconfig\ocap\config.hpp";
ocap_entity_id = 0; // ID assigned to each entity (auto increments). Also acts as an index for each entity in entitiesData.
ocap_captureFrameLimit = 5; // Number of captured frames before auto-exporting
ocap_captureFrameNo = 0; // Frame number for current capture
ocap_entitiesData = [];  // Data on all units + vehicles that appear throughout the mission.
ocap_eventsData = []; // Data on all events (involving 2+ units) that occur throughout the mission.

private _serverName = serverName;
if (!isMultiplayer) then {_serverName = "singleplayer"};
ocap_captureId = format[
		"%1__%2__%3", _serverName, briefingName, round (random 1000000)];


// Add mission EHs
addMissionEventHandler ["EntityKilled", {
	params ["_victim", "_attacker"];

	// Check entity is initiliased with OCAP
	// TODO: Set ocap_exclude to true if unit is not going to respawn (e.g. AI)
	if (_victim getVariable ["ocap_isInitialised", false]) then {
		[_victim, _attacker, "killed"] call ocap_fnc_eh_hitOrKilled;

		{
			_victim removeEventHandler _x;
		} forEach (_victim getVariable "ocap_eventHandlers");
	};
}];

// Transfer ID from old unit to new unit
// Mark old body to now be excluded from capture
addMissionEventHandler ["EntityRespawned", {
	_newEntity = _this select 0;
	_oldEntity = _this select 1;

	if (_oldEntity getVariable ["ocap_isInitialised", false]) then {
		_newEntity setVariable ["ocap_isInitialised", true];
		_id = _oldEntity getVariable "ocap_id";
		_newEntity setVariable ["ocap_id", _id];
		_newEntity setVariable ["ocap_exclude", false];
		_oldEntity setVariable ["ocap_exclude", true]; // Exclude old body from capture

		_newEntity call ocap_fnc_addEventHandlers;
	};
}];

addMissionEventHandler["HandleDisconnect", {
	_unit = _this select 0;

	if (_unit getVariable ["ocap_isInitialised", false]) then {
		_unit setVariable ["ocap_exclude", true];
	};

	ocap_eventsData pushBack [
		ocap_captureFrameNo,
		"disconnected",
		_this select 3 // Name
	];
}];

addMissionEventHandler["PlayerConnected", {
	ocap_eventsData pushBack [
		ocap_captureFrameNo,
		"connected",
		_this select 2 // Name
	];
}];

if (ocap_debug) then {
	player addAction ["Copy entitiesData to clipboard", {copyToClipboard str(ocap_entitiesData)}];
	player addAction ["Write saved data", {[] call ocap_fnc_exportData}];
	player addEventHandler ["Respawn", {
		player addAction ["Copy entitiesData to clipboard", {copyToClipboard str(ocap_entitiesData)}];
		player addAction ["Write saved data", {[] call ocap_fnc_exportData}];
	}];
};

// Wait until minimum player count is reached before starting capture
waitUntil{sleep 1; (time > 1) && (count(allPlayers) >= ocap_minPlayerCount) && (ocap_capture)};
["Min player count reached, starting capture."] call ocap_fnc_log;
[ocap_fnc_captureFrame, ocap_frameCaptureDelay] call CBA_fnc_addPerFrameHandler;