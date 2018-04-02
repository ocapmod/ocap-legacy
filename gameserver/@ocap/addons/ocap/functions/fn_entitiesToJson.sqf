private _APC_CLASSES = [
	"Wheeled_APC_F",
	"Tracked_APC",
	"APC_Wheeled_01_base_F",
	"APC_Wheeled_02_base_F",
	"APC_Wheeled_03_base_F",
	"APC_Tracked_01_base_F",
	"APC_Tracked_02_base_F",
	"APC_Tracked_03_base_F"
];

private _TANK_CLASSES = [
	"MBT_01_base_F",
	"MBT_02_base_F",
	"MBT_03_base_F"
];

private _entities = _this;
private _json = "{";

{
	private _properties = _x select 0;
	private _states = _x select 1;

	private _startFrameNo = _properties select 0;
	private _type = _properties select 1;
	private _id = _properties select 2;
	private _isUnit = (_type == "unit");

	_json = formatText['%1"%2":', _json, _id];

	// Write entity header
	private _jsonHeader = "";
	if (_isUnit) then {
		private _name = _properties select 3;
		private _name = [_name, """", "'"] call CBA_fnc_replace; // Escape quotes
		private _group = _properties select 4;
		private _side = _properties select 5;

		private _isPlayer = 0;
		if (_properties select 6) then {
			_isPlayer = 1;
		};

		_jsonHeader = formatText['
			"startFrameNum":%1,"type":"unit","id":%2, "name":"%3","group":"%4","side":"%5","isPlayer":%6',
			_startFrameNo, _id, _name, _group, _side, _isPlayer];
	} else {
		private _class = _properties select 3;
		private _name = _properties select 4;
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
			case ([_class, _APC_CLASSES] call ocap_fnc_isKindOf): {"apc"};
			case (_class isKindOf "Truck_F"): {"truck"}; // Should be higher than Car
			case (_class isKindOf "Car"): {"car"};
			//case ([_class, _TANK_CLASSES] call ocap_fnc_isKindOf): {"tank"};
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
	private _jsonStates = ',"states":[';
	{
		private _alive = 1;
		if (!(_x select 2)) then {
			_alive = 0;
		};

		if (_isUnit) then {
			private _isInVehicle = 0;
			if (_x select 3) then {
				_isInVehicle = 1;
			};

			_jsonStates = formatText['
			%1[%2,%3,%4,%5]', _jsonStates, _x select 0, round(_x select 1), _alive, _isInVehicle]; // position, direction, alive, in vehicle
		} else {
			_jsonStates = formatText['
			%1[%2,%3,%4,%5]', _jsonStates, _x select 0, round(_x select 1), _alive, _x select 3]; // position, direction, alive, crew
		};

		if !([_forEachIndex, _states] call ocap_fnc_atEndOfArray) then {_jsonStates = formatText["%1,", _jsonStates]};
	} forEach _states;
	_jsonStates = formatText["%1]", _jsonStates];


	// Write frames unit fired
	private _jsonFramesFired = "";
	if (_isUnit) then {
		private _framesFired = _x select 2;
		_jsonFramesFired = formatText[',"framesFired":%1', str(_framesFired)];
	};

	_json = formatText["%1 {%2 %3 %4}", _json, _jsonHeader, _jsonStates, _jsonFramesFired];

	if (!([_forEachIndex, _entities] call ocap_fnc_atEndOfArray)) then {
		_json = formatText["%1,", _json];
	};
} forEach _entities;

_json = formatText["%1}", _json];
_json