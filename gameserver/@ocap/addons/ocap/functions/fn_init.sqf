/*
	Author: MisterGoodson

	Description:
	Initialises OCAP variables and mission-wide eventhandlers.
	Capture loop is automatically started once init complete.
*/

//if (!isServer) exitWith {};

// Define global vars
#include "\userconfig\ocap\config.hpp";
ocap_captureFrameLimit = 5; // Number of captured frames before auto-exporting
ocap_captureFrameNo = 0; // Frame number for current capture
ocap_entitiesData = [];  // Data on all units + vehicles that appear throughout the mission.
ocap_eventsData = []; // Data on all events (involving 2+ units) that occur throughout the mission.
ocap_captureId = format["%1__%2", serverName, serverTime];

// Add mission EHs
addMissionEventHandler ["EntityKilled", {
	_victim = _this select 0;
	_killer = _this select 1;

	// Check entity is initiliased with OCAP
	// TODO: Set ocap_exclude to true if unit is not going to respawn (e.g. AI)
	if (_victim getVariable ["ocap_isInitialised", false]) then {
		[_victim, _killer] call ocap_fnc_eh_killed;

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
	_name = _this select 3;

	if (_unit getVariable ["ocap_isInitialised", false]) then {
		_unit setVariable ["ocap_exclude", true];
	};

	_name call ocap_fnc_eh_disconnected;
}];

addMissionEventHandler["PlayerConnected", {
	_name = _this select 2;

	_name call ocap_fnc_eh_connected;
}];

if (ocap_endCaptureOnEndMission) then {
	// Currently broken due to Arma bug
	// https://feedback.bistudio.com/T120253
	addMissionEventHandler ["Ended", {
		["Mission ended."] call ocap_fnc_log;
		[] call ocap_fnc_exportData;
	}];
};

[] spawn ocap_fnc_startCaptureLoop;