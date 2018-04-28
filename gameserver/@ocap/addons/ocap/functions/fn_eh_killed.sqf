/*
	Author: MisterGoodson

	Description:
	Called when a unit is killed.
	Logs this event and adds it to ocap_eventsData array.
	Information logged includes:
		- Current frame number
		- Event type (in this case "killed")
		- Victim's OCAP ID
		- Killer's OCAP ID
		- Killer's weapon (if killer is a unit)
		- Distance between victim and killer

	Parameters:
	_this select 0: OBJECT - Victim
	_this select 1: OBJECT - Killer
*/

params ["_victim", "_killer"];

if (_victim getVariable ["ocap_exclude", false]) exitWith {}; // Just in case

_victimId = _victim getVariable "ocap_id";

// If killer is null, then unit likely killed by fire/collision/exploding vehicle
_eventData = [ocap_captureFrameNo, "killed", _victimId, ["null"], -1];
if (!isNull _killer) then {
	_killerInfo = [];
	if (_killer isKindOf "CAManBase") then {
		_weaponName = getText (configFile >> "CfgWeapons" >> currentWeapon _killer >> "displayName");
		_weaponName = [_weaponName, """", "'"] call CBA_fnc_replace;
		_killerInfo = [
			_killer getVariable "ocap_id",
			_weaponName
		];
	} else {
		_killerInfo = [_killer getVariable "ocap_id"];
	};

	_eventData = [
		ocap_captureFrameNo,
		"killed",
		_victimId,
		_killerInfo,
		round(_killer distance _victim)
	];
};

// Add event to eventsData
ocap_eventsData pushBack _eventData;

//if (ocap_debug) then {systemChat format["%1 was killed by %2", name _victim, name _killer]};