/*
	Author: MisterGoodson

	Description:
	Logs supplied string to Arma RPT log file (with "OCAP" prefix).
*/

_this params ["_string", ["_displayHint", true]];

if (_displayHint) then {
	hint _string;
};

diag_log text ("OCAP: " + _string);