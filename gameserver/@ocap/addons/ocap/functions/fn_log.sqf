/*
	Author: MisterGoodson

	Description:
		Output given string to log.

	Parameters:
		_string: STRING - The string to log. (Default: "")
		_toChat: BOOLEAN - Log to system chat. (Default: true)
		_toFile: BOOLEAN - Log to OCAP logfile. (Default: true)
*/

params [
	["_string", ""],
	["_toChat", true],
	["_toFile", true]
];

if (_toChat) then {
	systemChat _string;
};

if (_toFile) then {
	["log", [_string]] call ocap_fnc_callExtension;
};