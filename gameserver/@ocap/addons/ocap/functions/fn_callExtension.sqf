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
	format["Exporting data via extension (length: %1)...", count(_this)],
	true,
	true
] call ocap_fnc_log;

"ocap_exporter" callExtension str(formatText["{%1}%2", ocap_host, _this]);

[
	format["Extension responded (%1ms)", (diag_tickTime - _startTime) * 1000],
	true,
	true
] call ocap_fnc_log;