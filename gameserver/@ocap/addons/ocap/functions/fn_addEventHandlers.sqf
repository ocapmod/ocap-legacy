/*
	Author: MisterGoodson

	Description:
	Adds fired/hit event handlers to given entity (unit/vehicle).

	Parameters:
	_this: OBJECT - Entity to add event handlers to.
*/

_entity = _this;

_firedEH = _entity addEventHandler ["Fired", {_this spawn ocap_fnc_eh_fired}];
_hitEH = _entity addEventHandler ["Hit", {_this spawn ocap_fnc_eh_hit}];

_entity setVariable ["ocap_eventHandlers", [["Fired", _firedEH], ["Hit", _hitEH]]];