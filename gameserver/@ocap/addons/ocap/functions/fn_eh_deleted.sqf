/*
	Description:
	Handles what to do when an entity is deleted.

	Parameters:
	0: NUMBER - OCAP ID of entity.
	1: BOOLEAN - Whether entity is a unit.
*/

params ["_id", "_isUnit"];

if (_id == -1) exitWith {};

["delete_entity", [
	ocap_frameNum, _id, parseNumber _isUnit
]] call ocap_fnc_callExtension;