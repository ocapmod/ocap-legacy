private _entities = _this;

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


{
	_x params ["_header"];
	private _isUnit = (_header select 1) == 1;

	// Process entity header
	if (_isUnit) then {
		private _name = [_header select 3, """", "'"] call CBA_fnc_replace;
		private _group = [_header select 4, """", "'"] call CBA_fnc_replace;
		_header set[3, _name];
		_header set[4, _group];
	} else {
		private _class = _header select 3;
		private _name = [_header select 4, """", "'"] call CBA_fnc_replace;
		_header set[4, _name];

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
		_header set[3, _class];
	};
} forEach _entities;

_entities