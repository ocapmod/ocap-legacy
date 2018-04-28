/*
	Author: MisterGoodson

	Description:
	Calls extension and supplies given arguments.

	Extension is intended to be called multiple times to send
	successive JSON 'chunks' to the OCAP webserver.

	Parameters:
	_this: STRING - Data to output to extension (e.g. JSON)
*/

private _startTime = diag_tickTime;

[
	format["Exporting data via extension (length: %1)...", count(str(_this))],
	true,
	true
] call ocap_fnc_log;

_result = "ocap_exporter" callExtension [ocap_host, _this];

[
	format["Extension responded (%1ms) with: %2", (diag_tickTime - _startTime) * 1000, _result],
	true,
	true
] call ocap_fnc_log;