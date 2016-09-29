/*
	Author: MisterGoodson

	Description:
		Converts all capture data (events + entities) into a JSON format and outputs this string
		to the OCAP extension (which handles JSON file writing/moving).

	Params:
		_this select 0: BOOLEAN - Stop capture (false will continue capture after export) (Default: true)
*/

if (!ocap_capture) exitWith {
	["fnc_exportData called. Export did not go ahead as capture is currently paused/stopped. Has export already been called?"] call ocap_fnc_log;
};

params [["_stopCapture", true]];
["fnc_exportData called. Exporting capture data..."] call ocap_fnc_log;

_sT = diag_tickTime;

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

ocap_capture = false; // Stop capture while we export
ocap_endFrameNo = ocap_captureFrameNo;
ocap_exportCapFilename = format["%1_%2.json", missionName, floor(random(1000))]; // Filename used for capture data file

_br = toString [13, 10];
_tab = toString[9];
_apcClasses = [
	"Wheeled_APC_F",
	"Tracked_APC",
	"APC_Wheeled_01_base_F",
	"APC_Wheeled_02_base_F",
	"APC_Wheeled_03_base_F",
	"APC_Tracked_01_base_F",
	"APC_Tracked_02_base_F",
	"APC_Tracked_03_base_F"
];
_tankClasses = [
	"MBT_01_base_F",
	"MBT_02_base_F",
	"MBT_03_base_F"
];

// Write main header
_header = format['{"worldName":"%1","missionName":"%2","missionAuthor":"%3","captureDelay":%4,"endFrame":%5
',worldName, briefingName, getMissionConfigValue ["author", ""], ocap_frameCaptureDelay, ocap_endFrameNo];
[_header, true] call ocap_fnc_callExtension;

// Write entities
_jsonUnits = ',"entities":[';
{
	_properties = _x select 0;
	_positions = _x select 1;

	_startFrameNo = _properties select 0;
	_type = _properties select 1;
	_id = _properties select 2;
	_isUnit = (_type == "unit");

	// Write entity header
	if (_isUnit) then {
		_name = _properties select 3;
		_name = [_name, """", "'"] call CBA_fnc_replace; // Escape quotes
		_group = _properties select 4;
		_side = _properties select 5;

		_isPlayer = 0;
		if (_properties select 6) then {
			_isPlayer = 1;
		};

		_jsonUnits = _jsonUnits + format['
		{"startFrameNum":%1,"type":"unit","id":%2,"name":"%3","group":"%4","side":"%5","isPlayer":%6', _startFrameNo, _id, _name, _group, _side, _isPlayer];
	} else {
		_class = _properties select 3;
		_name = _properties select 4;
		_name = [_name, """", "'"] call CBA_fnc_replace; // Escape quotes

		// Identify vehicle category.
		// Order of cases are important. With each super class (Ship, Air, LandVehicle),
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
			case ([_class, _apcClasses] call _isKindOf): {"apc"};
			case (_class isKindOf "Truck_F"): {"truck"}; // Should be higher than Car
			case (_class isKindOf "Car"): {"car"};
			//case ([_class, _tankClasses] call _isKindOf): {"tank"};
			case (_class isKindOf "Tank"): {"tank"};
			case (_class isKindOf "StaticMortar"): {"static-mortar"};
			case (_class isKindOf "StaticWeapon"): {"static-weapon"};
			case (_class isKindOf "LandVehicle"): {"unknown"};
			default {"unknown"};
		};

		_jsonUnits = _jsonUnits + format['
		{"startFrameNum":%1,"type":"vehicle","id":%2,"class":"%3","name":"%4"', _startFrameNo, _id, _class, _name];
	};
	[_jsonUnits, true] call ocap_fnc_callExtension;
	_jsonUnits = "";


	// Write entity positions
	_jsonUnitPosArr = ',"positions":[';
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

			_jsonUnitPosArr = _jsonUnitPosArr + format['
			[%1,%2,%3,%4]', _x select 0, round(_x select 1), _alive, _isInVehicle]; // position, direction, alive, in vehicle
		} else {
			_jsonUnitPosArr = _jsonUnitPosArr + format['
			[%1,%2,%3,%4]', _x select 0, round(_x select 1), _alive, _x select 3]; // position, direction, alive, crew
		};

		if (_forEachIndex != ((count _positions)-1)) then {_jsonUnitPosArr = _jsonUnitPosArr + ","};
	} forEach _positions;
	[_jsonUnitPosArr, true] call ocap_fnc_callExtension;
	["]", true] call ocap_fnc_callExtension; // Add cap


	// Write frames unit fired
	if (_isUnit) then {
		_framesFired = _x select 2;
		_jsonFramesFired = ',"framesFired":[';
		{
			_frameNum = _x select 0;
			_projectilePos = _x select 1;
			_jsonFramesFired = _jsonFramesFired + format['
			[%1,%2]', _frameNum, _projectilePos];

			if (_forEachIndex != ((count _framesFired)-1)) then {_jsonFramesFired = _jsonFramesFired + ","};
		} forEach _framesFired;
		[_jsonFramesFired, true] call ocap_fnc_callExtension;
		["]", true] call ocap_fnc_callExtension; // Add cap
	};

	_jsonUnitFooter = '}'; // End of this unit's JSON object
	
	if (_forEachIndex != ((count ocap_entitiesData)-1)) then {_jsonUnitFooter = _jsonUnitFooter + ","};
	[_jsonUnitFooter, true] call ocap_fnc_callExtension;
} forEach ocap_entitiesData;
[']', true] call ocap_fnc_callExtension; // Add cap to entities array


// Write events
_jsonEvents = ',"events":[';
{

	_frameNum = _x select 0;
	_type = _x select 1;

	switch (true) do {
		case (_type == "killed" || _type == "hit"): {
			_victimId = _x select 2;
			_causedByInfo = _x select 3;
			_causedByInfo set [1, [_causedByInfo select 1, """", "'"] call CBA_fnc_replace]; // Escape quotes
			_distance = _x select 4;

			_jsonEvents = _jsonEvents + format['
			[%1,"%2",%3,%4,"%5"]', _frameNum, _type, _victimId, _causedByInfo, round(_distance)];
		};
		case (_type == "connected" || _type == "disconnected"): {
			_name = _x select 2;
			_name = [_name, """", "'"] call CBA_fnc_replace; // Escape quotes

			_jsonEvents = _jsonEvents + format['
			[%1,"%2","%3"]', _frameNum, _type, _name];
		};
	};

	if (_forEachIndex != ((count ocap_eventsData)-1)) then {_jsonEvents = _jsonEvents + ","};
} forEach ocap_eventsData;
[_jsonEvents + "]", true] call ocap_fnc_callExtension;

['}', true] call ocap_fnc_callExtension; // End of JSON file
['', false] call ocap_fnc_callExtension;

_deltaT = diag_tickTime - _sT;
[format["Exporting complete (%1ms).", _deltaT * 1000]] call ocap_fnc_log;

if (!_stopCapture) then {
	["Continuing capture."] call ocap_fnc_log;
	ocap_capture = true; // Continue capturing
};