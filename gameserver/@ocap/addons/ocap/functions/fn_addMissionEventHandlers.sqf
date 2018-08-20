/*
	Author: MisterGoodson

	Description:
	Adds mission-wide event handlers.
*/

addMissionEventHandler ["EntityKilled", {
	params ["_victim", "_attacker"];

	// Check entity is initiliased with OCAP
	// TODO: Set ocap_exclude to true if unit is not going to respawn (e.g. AI)
	if (_victim getVariable ["ocap_id", -1] != -1) then {
		[_victim, _attacker, "killed"] call ocap_fnc_eh_hitOrKilled;

		{
			_victim removeEventHandler _x;
		} forEach (_victim getVariable "ocap_eventHandlers");
	};
}];

// Transfer ID from old unit to new unit
// Stop tracking old unit
addMissionEventHandler ["EntityRespawned", {
	private _newEntity = _this select 0;
	private _oldEntity = _this select 1;
	private _id = _oldEntity getVariable ["ocap_id", -1];

	if (_id != -1) then {
		_oldEntity setVariable ["ocap_exclude", true];
		_newEntity setVariable ["ocap_id", _id];
		_newEntity setVariable ["ocap_exclude", false];

		_newEntity call ocap_fnc_addEventHandlers;
	};
}];

addMissionEventHandler["HandleDisconnect", {
	private _unit = _this select 0;
	private _id = _unit getVariable ["ocap_id", -1];
	private _frame = ocap_frameNum;

	if (_id != -1) then {
		_unit setVariable ["ocap_exclude", true];
	};

	["event_disconnected", [
		_frame,
		_this select 3 // Name
	]] call ocap_fnc_callExtension;
}];

addMissionEventHandler["PlayerConnected", {
	private _frame = ocap_frameNum;

	["event_connected", [
		_frame,
		_this select 2 // Name
	]] call ocap_fnc_callExtension;
}];