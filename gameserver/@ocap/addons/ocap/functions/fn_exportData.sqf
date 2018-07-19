/*
	Author: MisterGoodson

	Description:
		Converts all capture data (events + entities) into JSON format and outputs this string
		to the OCAP extension.

	Params:
		_this select 0: BOOLEAN - Stop capture after export (Default: false)
*/

[
	"fnc_exportData called. Exporting capture data...",
	true,
	true
] call ocap_fnc_log;

private _preparationStartTime = diag_tickTime;
private _preppedEntities = ocap_entitiesData call ocap_fnc_prepEntitiesForTransit;
[
	format[
		"%1 entities prepared for transit (%2ms).",
		count ocap_entitiesData,
		(diag_tickTime - _preparationStartTime) * 1000
	]
] call ocap_fnc_log;

private _header = [
	ocap_captureId,
	worldName,
	briefingName,
	getMissionConfigValue ["author", ""],
	ocap_frameCaptureDelay,
	ocap_captureFrameNo
];

[_header, _preppedEntities, ocap_eventsData] call ocap_fnc_callExtension;


// Reset capture data
{
	_x set [1, []]; // Reset states
	_x set [2, []]; // Reset frames fired
} forEach ocap_entitiesData;
ocap_eventsData = [];