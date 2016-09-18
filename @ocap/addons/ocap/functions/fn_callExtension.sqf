/*
	Author: MisterGoodson

	Description:
	Calls extension (dll) and supplies given arguments.
	
	Extension is intended to be called multiple times to write
	successive JSON 'chunks' to a file. Once there is no more data
	to write, the extension should be called a final time (transfer mode)
	to transfer this file to a different location (local or remote).
	The location to transfer to is defined in the userconfig settings.

	Parameters:
	_this select 0: STRING - Data to output to extension (e.g. JSON)
	_this select 1: BOOLEAN - True for write mode, false for transfer mode.
*/

_output = _this select 0;
_write = _this select 1;

if (_write) then {
	// Write string to file
	"ocap_exporter" callExtension format["{write;%1}%2", ocap_exportCapFilename, _output];
} else {
	_worldName = worldName;
	_missionName = briefingName;
	_missionDuration = ocap_endFrameNo * ocap_frameCaptureDelay; // Duration of mission (seconds)

	// Transfer file to different location (local or remote)
	if (ocap_exportRemote) then {
		"ocap_exporter" callExtension format["{transferRemote;%1;%2;%3;%4;%5}",
			ocap_exportCapFilename,
			_worldName,
			_missionName,
			_missionDuration,
			ocap_exportURL
		];
	} else {
		"ocap_exporter" callExtension format["{transferLocal;%1;%2;%3;%4;%5;%6}",
			ocap_exportCapFilename,
			_worldName,
			_missionName,
			_missionDuration,
			ocap_exportURL,
			ocap_exportPath
		];
	};
};