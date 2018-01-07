/*
	Author: MisterGoodson

	Description:
	Calls extension and supplies given arguments.

	Extension is intended to be called multiple times to send
	successive JSON 'chunks' to the OCAP webserver.

	Parameters:
	_this: STRING - Data to output to extension (e.g. JSON)
*/

if (ocap_debug) then {
	_str = "Export string length: " + str(count(_this));
	[_str] call ocap_fnc_log;
};

"ocap_exporter" callExtension str(formatText["{%1}%2", ocap_host, _this]);