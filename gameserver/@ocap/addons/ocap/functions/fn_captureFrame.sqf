/*
	Author: MisterGoodson

	Description:
	Captures unit/vehicle states for current frame.
	Compatible with dynamically spawned AI and JIP players.
*/

if (!ocap_capture) exitWith {};

private _startTime = diag_tickTime;
private _entityCount = 0;

// Capture units
{
	private _id = _x getVariable ["ocap_id", -1];
	private _isAlive = alive _x;
	if (_x getVariable ["ocap_exclude", false] || {((!_isAlive) && _id == -1)} || {_x isKindOf "Logic"}) exitWith {};
	private _pos = getPosATL _x;
	_pos = [round(_pos select 0), round(_pos select 1)];

	// New unit
	if (_id == -1) then {
		_id = ocap_entity_id;
		_x setVariable ["ocap_id", _id];

		// Add new unit
		["new_unit", [
			_id, name _x, groupID (group _x),
			str(side _x), parseNumber (isPlayer _x)
		]] call ocap_fnc_callExtension;

		//_x call ocap_fnc_addEventHandlers;
		ocap_entity_id = ocap_entity_id + 1;
	};

	// Update unit
	["update_unit", [
		ocap_captureFrameNo, _id, _pos, round(getDir _x), parseNumber _isAlive,
		parseNumber ((vehicle _x) != _x)
	]] call ocap_fnc_callExtension;

	_entityCount = _entityCount + 1;
} count (allUnits + allDeadMen);

// Capture vehicles
{
	private _id = _x getVariable ["ocap_id", -1];
	private _isAlive = alive _x;
	if (_x getVariable ["ocap_exclude", false] || {((!_isAlive) && _id == -1)} || {_x isKindOf "Logic"}) exitWith {};
	private _exclude = false;
	private _pos = getPosATL _x;
	_pos = [round(_pos select 0), round(_pos select 1)];

	if (_id == -1) then {
		private _class = _x call ocap_fnc_getClass;
		if (_class == "unknown") exitWith {
			_exclude = true;
			_x setVariable ["ocap_exclude", _exclude]
		};

		_id = ocap_entity_id;
		_x setVariable ["ocap_id", _id];

		// Add new vehicle
		["new_vehicle", [
			_id,
			getText (configFile >> "CfgVehicles" >> typeOf _x >> "displayName"),
			_class
		]] call ocap_fnc_callExtension;

		//_x call ocap_fnc_addEventHandlers;
		ocap_entity_id = ocap_entity_id + 1;
	};

	if (_exclude) exitWith {};

	// Get ID for each crew member
	private _crewIds = [];
	{
		private _crewId = _x getVariable ["ocap_id", -1];
		if (_crewId != -1) then {
			private _index = _crewIds pushBack _crewId;
		};
	} count (crew _x);

	// Update vehicle
	["update_vehicle", [
		ocap_captureFrameNo, _id, _pos, round(getDir _x),
		parseNumber _isAlive, _crewIds
	]] call ocap_fnc_callExtension;

	_entityCount = _entityCount + 1;
} count vehicles;

ocap_captureFrameNo = ocap_captureFrameNo + 1;

// Log capture time
private _runTime = diag_tickTime - _startTime;
[format[
	"Captured frame %1 (%2 entities in %3ms).",
	ocap_captureFrameNo,
	_entityCount,
	round (_runTime * 1000)
]] call ocap_fnc_log;