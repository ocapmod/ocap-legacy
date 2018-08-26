/*
	Author: MisterGoodson

	Description:
	Captures unit/vehicle states for current frame.
	Compatible with dynamically spawned AI and JIP players.
*/

if (!ocap_capture) exitWith {};

private _playerCount = count (allPlayers - (entities "HeadlessClient_F"));
private _captureTime = ocap_frameNum * ocap_frameCaptureDelay;
private _hitMaxCaptureLength = ocap_maxCaptureTime != 0 && (_captureTime >= ocap_maxCaptureTime);

if ((!(_playerCount >= ocap_minPlayerCount)) || {_hitMaxCaptureLength}) exitWith {
	if (ocap_frameNum == 0) exitWith {};

	// Check if capture session should be kept or discarded
	if (_hitMaxCaptureLength || {_captureTime >= ocap_minCaptureTime}) then {
		[] call ocap_fnc_publish;
	} else {
		[] call ocap_fnc_resetCapture;
		["Discarded capture session."] call ocap_fnc_log;
	};
};

if (ocap_frameNum == 0) then {
	["Starting new capture session."] call ocap_fnc_log;
	["init"] call ocap_fnc_callExtension;
};

private _startTime = diag_tickTime;
private _entityCount = 0;

// Capture units
{
	private _id = _x getVariable ["ocap_id", -1];
	private _isAlive = alive _x;
	if (!(_x getVariable ["ocap_exclude", false] || {((!_isAlive) && _id == -1)} || {_x isKindOf "Logic"})) then {
		private _pos = getPosATL _x;
		_pos = [round(_pos select 0), round(_pos select 1)];

		// New unit
		if (_id == -1) then {
			_id = ocap_entity_id;
			_x setVariable ["ocap_id", _id];
			_x setVariable ["ocap_prevState", []];

			// Add new unit
			["new_unit", [
				ocap_frameNum, _id, name _x, groupID (group _x),
				str(side _x), parseNumber (isPlayer _x)
			]] call ocap_fnc_callExtension;

			_x call ocap_fnc_addEventHandlers;
			ocap_entity_id = ocap_entity_id + 1;
		};

		private _state = [_id, _pos, _x call ocap_fnc_getRoundedDir,
			parseNumber _isAlive, parseNumber !(isNull objectParent player)];

		// Skip if state hasn't changed
		if ((_x getVariable "ocap_prevState") isEqualTo _state) exitWith {};
		_x setVariable ["ocap_prevState", _state];

		// Update unit
		["update_unit", [ocap_frameNum] + _state] call ocap_fnc_callExtension;

		_entityCount = _entityCount + 1;
	};
} count (allUnits + allDeadMen);

// Capture vehicles
{
	if (!(_x getVariable ["ocap_exclude", false] || {_x isKindOf "Logic"})) then {
		private _id = _x getVariable ["ocap_id", -1];
		private _isAlive = alive _x;
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
			_x setVariable ["ocap_prevState", []];

			// Add new vehicle
			["new_vehicle", [
				ocap_frameNum,
				_id,
				getText (configFile >> "CfgVehicles" >> typeOf _x >> "displayName"),
				_class
			]] call ocap_fnc_callExtension;

		 	_x call ocap_fnc_addEventHandlers;
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

		private _state = [_id, _pos, _x call ocap_fnc_getRoundedDir,
			parseNumber _isAlive, _crewIds];

		// Skip if state hasn't changed
		if ((_x getVariable "ocap_prevState") isEqualTo _state) exitWith {};
		_x setVariable ["ocap_prevState", _state];

		// Update vehicle
		["update_vehicle", [ocap_frameNum] + _state] call ocap_fnc_callExtension;

		_entityCount = _entityCount + 1;
	};
} count vehicles;

// Log capture time
private _runTime = diag_tickTime - _startTime;
[format[
	"Captured frame %1 (%2 entities in %3ms).",
	ocap_frameNum,
	_entityCount,
	round (_runTime * 1000)
]] call ocap_fnc_log;

ocap_frameNum = ocap_frameNum + 1;