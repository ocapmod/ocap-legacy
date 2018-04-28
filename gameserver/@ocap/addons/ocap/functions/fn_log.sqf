/*
	Author: MisterGoodson

	Description:
		Output given string to log.

	Parameters:
		_string: STRING - The string to log. (Default: "")
		_toHint: BOOLEAN - Log as hint. (Default: false)
		_toChat: BOOLEAN - Log to system chat. (Default: false)
		_toRpt: BOOLEAN - Log to RPT file. (Default: true)
*/

params [
	["_string", ""],
	["_toHint", false],
	["_toChat", false],
	["_toRpt", true]
];

if (_toHint) then {
	hint _string;
};

if (_toChat) then {
	systemChat _string;
};

if (_toRpt) then {
	diag_log text ("OCAP: " + _string);
};