// Same as isKindOf, but can be tested against multiple types
params["_testClass", "_classes"];
private _bool = false;
{
	if (_testClass isKindOf _x) exitWith {
		_bool = true;
	};
} forEach _classes;

_bool