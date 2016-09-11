/*
	Author: MisterGoodson

	Description:
	Called when a unit is hit.
	Logs this event and adds it to ocap_eventsData array.
	Information logged includes:
		- Current frame number
		- Event type (in this case "hit")
		- Victim's OCAP ID
		- Hitter's OCAP ID
		- Hitter's weapon (if hitter is a unit)
		- Distance between victim and hitter

	Parameters:
	_this select 0: OBJECT - Victim
	_this select 1: OBJECT - Hitter
*/

_victim = _this select 0;
_hitter = _this select 1;

if (_victim getVariable ["ocap_exclude", false]) exitWith {}; // Just in case

_victimId = _victim getVariable "ocap_id";

// If hitter is null, then unit likely hit by fire/collision/exploding vehicle
_eventData = [ocap_captureFrameNo, "hit", _victimId, ["null"], -1];
if (!isNull _hitter) then {

	_hitterInfo = [];
	if (_hitter isKindOf "CAManBase") then {
		_hitterInfo = [
			_hitter getVariable "ocap_id",
			getText (configFile >> "CfgWeapons" >> currentWeapon _hitter >> "displayName")
		];
	} else {
		_hitterInfo = [_hitter getVariable "ocap_id"];
	};

	_eventData = [
		ocap_captureFrameNo,
		"hit",
		_victimId,
		_hitterInfo,
		_victim distance _hitter
	];
};

ocap_eventsData pushBack _eventData;