/*
	Author: MisterGoodson

	Description:
	Called when a unit is hit or killed.
	Logs this event and adds it to ocap_eventsData array.
	Information logged includes:
		- Current frame number
		- Event type ("hit" or "killed")
		- Victim's OCAP ID
		- Attacker's OCAP ID
		- Attacker's weapon (if attacker is a unit)
		- Distance between victim and attacker

	Parameters:
	_this select 0: OBJECT - Victim
	_this select 1: OBJECT - Attacker
	_this select 2: STRING - "hit" or "killed" event
*/

params ["_victim", "_attacker", "_eventType"];

if (_victim getVariable ["ocap_exclude", false]) exitWith {}; // Just in case

_victimId = _victim getVariable "ocap_id";

_eventData = [];
if (!isNull _attacker) then {
	_attackerInfo = [];
	if (_attacker isKindOf "CAManBase") then {
		_weaponName = getText (configFile >> "CfgWeapons" >> currentWeapon _attacker >> "displayName");
		_weaponName = [_weaponName, """", "'"] call CBA_fnc_replace;
		_attackerInfo = [
			_attacker getVariable "ocap_id",
			_weaponName
		];
	} else {
		_attackerInfo = [_attacker getVariable "ocap_id"];
	};

	_eventData = [
		ocap_captureFrameNo,
		_eventType,
		_victimId,
		_attackerInfo,
		round(_victim distance _attacker)
	];
} else {
	// Victim was likely hit by fire/collision/exploding vehicle
	_eventData = [ocap_captureFrameNo, _eventType, _victimId, ["null"], -1];
};

ocap_eventsData pushBack _eventData;