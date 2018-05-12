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

private _unitData = (ocap_entitiesData select (_unit getVariable "ocap_id"));

// Wait until bullet lands, capture position
private _finalPos = [];
waitUntil {
	private _pos = getPosATL _projectile;

	// We exit if projectile no longer exists
	if (((_pos select 0) == 0) || isNull _projectile) exitWith {true};

	_finalPos = _pos;
	sleep 0.2;
	false;
};


/*_lastVelocity = vectorMagnitude velocity _projectile;
waitUntil {
	_pos = getPosATL _projectile;
	_velocity = vectorMagnitude velocity _projectile;
	_velocityChange = _lastVelocity - _velocity;

	// We exit if projectile no longer exists or significant change in velocity (impact/ricochet)
	if (((_pos select 0) == 0) || isNull _projectile || (_velocityChange >= 50)) exitWith {true};

	_finalPos = _pos;
	_lastVelocity = _velocity;
	false;
};*/


if ((count _finalPos) != 0) then {
	// Append to existing framesFired data for this unit
	(_unitData select 2) pushBack [
		ocap_captureFrameNo,
		[_finalPos select 0, _finalPos select 1]
	];
};