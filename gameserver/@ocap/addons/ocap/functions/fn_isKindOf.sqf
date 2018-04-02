// Same as isKindOf, but can be tested against multiple types
private _testClass = _this select 0;
private _classes = _this select 1;
private _bool = false;
{
	if (_testClass isKindOf _x) exitWith {
		_bool = true;
	};
} forEach _classes;

_bool