/*
	Author: MisterGoodson

	Description:
	Adds event handlers to entity.

	Parameters:
	_this: OBJECT - Entity to add event handlers to.
*/

private _entity = _this;

// private _firedEH = _entity addEventHandler ["Fired", {_this spawn ocap_fnc_eh_fired}];
// private _hitEH = _entity addEventHandler ["Hit", {
// 	[_this select 0, _this select 1, "hit"] call ocap_fnc_eh_hitOrKilled;
// }];

private _deletedEH = _entity addEventHandler ["deleted", {
	params ["_entity"];
	[_entity getVariable ["ocap_id", -1], _entity isKindOf "Man"] spawn ocap_fnc_eh_deleted;
}];

_entity setVariable ["ocap_eventHandlers", [
	["deleted", _deletedEH]
]];