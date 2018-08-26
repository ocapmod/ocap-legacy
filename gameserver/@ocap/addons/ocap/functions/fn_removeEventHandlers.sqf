/*
	Description:
	Removes event handlers from entity.

	Parameters:
	_this select 0: OBJECT - Entity to remove event handlers from.
	_this select 1: ARRAY - Types of event handlers to exclude from removal.
*/

params ["_entity", ["_exceptions", []]];

{
	_x params ["_type", "_index"];
	if (!(_type in _exceptions)) then {
		_entity removeEventHandler [_type, _index];
	};
} forEach (_entity getVariable "ocap_eventHandlers");