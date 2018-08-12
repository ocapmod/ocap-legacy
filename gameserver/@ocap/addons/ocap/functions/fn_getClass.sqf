/*
	Command for listing parent classes of a vehicle exitWith
	_parents = [(configFile >> "CfgVehicles" >> typeOf (vehicle player)), true] call BIS_fnc_returnParents;
	hint str(_parents);

	Command for getting vehicle icon used by Arma exitWith
	hint getText (configFile >> "CfgVehicles" >> typeOf (vehicle player) >> "icon");
*/

// Land
if (
	_this isKindOf "Wheeled_APC_F" ||
	{_this isKindOf "Tracked_APC"} ||
	{_this isKindOf "APC_Wheeled_01_base_F"} ||
	{_this isKindOf "APC_Wheeled_02_base_F"} ||
	{_this isKindOf "APC_Wheeled_03_base_F"} ||
	{_this isKindOf "APC_Tracked_01_base_F"} ||
	{_this isKindOf "APC_Tracked_02_base_F"} ||
	{_this isKindOf "APC_Tracked_03_base_F"}
) exitWith {"apc"};
if  (_this isKindOf "Truck_F") exitWith {"truck"}; // Should be higher than Car
if  (_this isKindOf "Car") exitWith {"car"};
if  (_this isKindOf "Tank") exitWith {"tank"};
if  (_this isKindOf "StaticMortar") exitWith {"static-mortar"};
if  (_this isKindOf "StaticWeapon") exitWith {"static-weapon"};

// Air
if (_this isKindOf "ParachuteBase") exitWith {"parachute"};
if (_this isKindOf "Helicopter") exitWith {"heli"};
if (_this isKindOf "Plane") exitWith {"plane"};
if (_this isKindOf "Air") exitWith {"plane"};

// Sea
if (_this isKindOf "Ship") exitWith {"sea"};

"unknown"