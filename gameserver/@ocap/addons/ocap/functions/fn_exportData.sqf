/*
	Author: MisterGoodson

	Description:
		Converts all capture data (events + entities) into JSON format and outputs this string
		to the OCAP extension.

	Params:
		_this select 0: BOOLEAN - Stop capture after export (Default: false)
*/

if (!ocap_capture) exitWith {
	["fnc_exportData called. Export did not go ahead as capture is currently paused/stopped. Has export already been called?"] call ocap_fnc_log;
};

params [["_stopCapture", false]];
["fnc_exportData called. Exporting capture data..."] call ocap_fnc_log;

_sT = diag_tickTime;

ocap_capture = false; // Stop capture while we export
ocap_endFrameNo = ocap_captureFrameNo;
ocap_exportCapFilename = formatText["%1_%2.json", missionName, floor(random(1000))]; // Filename used for capture data file

_br = toString[13, 10];
_tab = toString[9];
_APC_CLASSES = [
	"Wheeled_APC_F",
	"Tracked_APC",
	"APC_Wheeled_01_base_F",
	"APC_Wheeled_02_base_F",
	"APC_Wheeled_03_base_F",
	"APC_Tracked_01_base_F",
	"APC_Tracked_02_base_F",
	"APC_Tracked_03_base_F"
];
_TANK_CLASSES = [
	"MBT_01_base_F",
	"MBT_02_base_F",
	"MBT_03_base_F"
];

// Same as isKindOf, but can be tested against multiple types
_isKindOf = {
	_testClass = _this select 0;
	_classes = _this select 1;
	_bool = false;
	{
		if (_testClass isKindOf _x) exitWith {
			_bool = true;
		};
	} forEach _classes;

	_bool
};

_atEndOfArray = {
	_index = _this select 0;
	_array = _this select 1;

	_index + 1 >= count _array
};

_entitiesToJson = {
	_entities = _this;
	_json = "{";
	{
		_properties = _x select 0;
		_states = _x select 1;

		_startFrameNo = _properties select 0;
		_type = _properties select 1;
		_id = _properties select 2;
		_isUnit = (_type == "unit");

		_json = formatText['%1"%2":', _json, _id];

		// Write entity header
		_jsonHeader = "";
		if (_isUnit) then {
			_name = _properties select 3;
			_name = [_name, """", "'"] call CBA_fnc_replace; // Escape quotes
			_group = _properties select 4;
			_side = _properties select 5;

			_isPlayer = 0;
			if (_properties select 6) then {
				_isPlayer = 1;
			};

			_jsonHeader = formatText['
				"startFrameNum":%1,"type":"unit","id":%2, "name":"%3","group":"%4","side":"%5","isPlayer":%6',
				_startFrameNo, _id, _name, _group, _side, _isPlayer];
		} else {
			_class = _properties select 3;
			_name = _properties select 4;
			_name = [_name, """", "'"] call CBA_fnc_replace; // Escape quotes

			// Identify vehicle category.
			// Order of cases is important. With each super class (Ship, Air, LandVehicle),
			// more specific classes should be placed highest, and less specific classes placed lowest.
			_class = switch (true) do {
				/*
					Command for listing parent classes of a vehicle:
					_parents = [(configFile >> "CfgVehicles" >> typeOf (vehicle player)), true] call BIS_fnc_returnParents;
					hint str(_parents);

					Command for getting vehicle icon used by Arma:
					hint getText (configFile >> "CfgVehicles" >> typeOf (vehicle player) >> "icon");
				*/

				// Sea
				case (_class isKindOf "Ship"): {"sea"};

				// Air
				case (_class isKindOf "ParachuteBase"): {"parachute"};
				case (_class isKindOf "Helicopter"): {"heli"};
				case (_class isKindOf "Plane"): {"plane"};
				case (_class isKindOf "Air"): {"plane"};

				// Land
				//case (_class isKindOf "UK3CB_BAF_Jackal_Base_D"): {"jackal"};
				case ([_class, _APC_CLASSES] call _isKindOf): {"apc"};
				case (_class isKindOf "Truck_F"): {"truck"}; // Should be higher than Car
				case (_class isKindOf "Car"): {"car"};
				//case ([_class, _TANK_CLASSES] call _isKindOf): {"tank"};
				case (_class isKindOf "Tank"): {"tank"};
				case (_class isKindOf "StaticMortar"): {"static-mortar"};
				case (_class isKindOf "StaticWeapon"): {"static-weapon"};
				case (_class isKindOf "LandVehicle"): {"unknown"};
				default {"unknown"};
			};

			_jsonHeader = formatText['
				"startFrameNum":%1,"type":"vehicle","id":%2,"class":"%3", "name":"%4"',
				_startFrameNo, _id, _class, _name];
		};


		// Write entity states
		_jsonStates = ',"states":[';
		{
			_alive = 1;
			if (!(_x select 2)) then {
				_alive = 0;
			};

			if (_isUnit) then {
				_isInVehicle = 0;
				if (_x select 3) then {
					_isInVehicle = 1;
				};

				_jsonStates = formatText['
				%1[%2,%3,%4,%5]', _jsonStates, _x select 0, round(_x select 1), _alive, _isInVehicle]; // position, direction, alive, in vehicle
			} else {
				_jsonStates = formatText['
				%1[%2,%3,%4,%5]', _jsonStates, _x select 0, round(_x select 1), _alive, _x select 3]; // position, direction, alive, crew
			};

			if !([_forEachIndex, _states] call _atEndOfArray) then {_jsonStates = formatText["%1,", _jsonStates]};
		} forEach _states;
		_jsonStates = formatText["%1]", _jsonStates];


		// Write frames unit fired
		_jsonFramesFired = "";
		if (_isUnit) then {
			_framesFired = _x select 2;
			_jsonFramesFired = formatText[',"framesFired":%1', str(_framesFired)];
		};

		_json = formatText["%1 {%2 %3 %4}", _json, _jsonHeader, _jsonStates, _jsonFramesFired];

		if (!([_forEachIndex, _entities] call _atEndOfArray)) then {
			_json = formatText["%1,", _json];
		};
	} forEach _entities;

	_json = formatText["%1}", _json];
	_json
};

_eventsToJson = {
	_events = _this;
	_json = "[";
	{

		_frameNum = _x select 0;
		_type = _x select 1;

		switch (true) do {
			case (_type == "killed" || _type == "hit"): {
				_victimId = _x select 2;
				_causedByInfo = _x select 3;
				_causedByInfo set [1, [_causedByInfo select 1, """", "'"] call CBA_fnc_replace]; // Escape quotes
				_distance = _x select 4;

				_json = formatText['
				%1[%2,"%3",%4,%5,"%6"]', _json, _frameNum, _type, _victimId, _causedByInfo, round(_distance)];
			};
			case (_type == "connected" || _type == "disconnected"): {
				_name = _x select 2;
				_name = [_name, """", "'"] call CBA_fnc_replace; // Escape quotes

				_json = formatText['
				%1[%2,"%3","%4"]', _json, _frameNum, _type, _name];
			};
		};

		if !([_forEachIndex, _events] call _atEndOfArray) then {_json =  formatText["%1,", _json]};
	} forEach _events;

	_json = formatText["%1]", _json];
	_json
};

// Export
(str(formatText['
	{
		"serverId": "%1",
		"captureData": {
			"header": {
				"worldName": "%2",
				"missionName": "%3",
				"missionAuthor": "%4",
				"captureDelay": %5,
				"frameCount": %6
			},
			"entities": %7,
			"events": %8
		}
	}',
	ocap_serverId, worldName, briefingName, getMissionConfigValue ["author", ""], ocap_frameCaptureDelay,
	ocap_captureFrameNo, ocap_entitiesData call _entitiesToJson, ocap_eventsData call _eventsToJson]
)) call ocap_fnc_callExtension;


{
	_x set [1, []]; // Reset states
	_x set [2, []]; // Reset frames fired
} forEach ocap_entitiesData;
ocap_eventsData = [];

_deltaT = diag_tickTime - _sT;
[format["Exporting complete (%1ms).", _deltaT * 1000]] call ocap_fnc_log;

if (!_stopCapture) then {
	["Resuming capture."] call ocap_fnc_log;
	ocap_capture = true; // Continue capturing
};