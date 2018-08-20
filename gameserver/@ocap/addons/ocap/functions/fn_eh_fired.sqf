/*
	Author: MisterGoodson

	Description:
	Called when a unit fires their weapon.
	Captures the landing position of the fired projectile and
	logs this event to the unit's 'framesFired' data.

	Information logged includes:
		- Current frame number
		- Landing position (x,y) of projectile

	This is used in playback to display when this unit fired, and what
	they fired at.

	Parameters:
	_this select 0: OBJECT - Unit that fired
	_this select 6: OBJECT - Projectile that was fired
*/

private _unit = _this select 0;
private _projectile = _this select 6;
private _frame = ocap_frameNum;

// Wait until bullet lands, capture position
private _lastPos = [];
waitUntil {
	private _pos = getPosATL _projectile;

	// We exit if projectile no longer exists
	if (((_pos select 0) == 0) || isNull _projectile) exitWith {true};

	_lastPos = _pos;
	false
};

if ((count _lastPos) != 0) then {
	// Append to existing framesFired data for this unit
	["event_fired", [
		_unit getVariable "ocap_id",
		_frame,
		[round(_lastPos select 0), round(_lastPos select 1)]
	]] call ocap_fnc_callExtension;
};