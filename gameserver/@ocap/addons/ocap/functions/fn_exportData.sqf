/*
	Author: MisterGoodson

	Description:
		Converts all capture data (events + entities) into JSON format and outputs this string
		to the OCAP extension.

	Params:
		_this select 0: BOOLEAN - Stop capture after export (Default: false)
*/

if (!ocap_capture) exitWith {
	[
		"fnc_exportData called. Export did not go ahead as capture is currently paused/stopped. Has export already been called?",
		true,
		true
	] call ocap_fnc_log;
};

params [["_stopCapture", false]];

[
	"fnc_exportData called. Exporting capture data...",
	true,
	true
] call ocap_fnc_log;

private _startTime = diag_tickTime;

ocap_capture = false; // Stop capture while we export

// Export data in background so that we can return to capturing asap
[+ocap_captureFrameNo, +ocap_entitiesData, +ocap_eventsData] spawn {
	// Duplicate global variables into local variables so that we can operate on
	// them without their state changing while capturing continues in background
	params ["_frameNo", "_entitiesData", "_eventsData"];

	private _preparationStartTime = diag_tickTime;
	private _preppedEntities = _entitiesData call ocap_fnc_prepareEntitiesForTransit;
	[
		format["Entities prepared for transit (%1ms).", (diag_tickTime - _preparationStartTime) * 1000],
		true,
		true
	] call ocap_fnc_log;

	private _header = [
		ocap_captureId,
		worldName,
		briefingName,
		getMissionConfigValue ["author", ""],
		ocap_frameCaptureDelay,
		_frameNo
	];

	[_header, _preppedEntities, _eventsData] spawn ocap_fnc_callExtension;

};


// Reset capture data
private _resetStartTime = diag_tickTime;
{
	_x set [1, []]; // Reset states
	_x set [2, []]; // Reset frames fired
} forEach ocap_entitiesData;
ocap_eventsData = [];

[
	format["Capture data reset (%1ms).", (diag_tickTime - _resetStartTime) * 1000],
	true,
	true
] call ocap_fnc_log;


if (!_stopCapture) then {
	[
		format["Resuming capture while export continues in background (%1ms).", (diag_tickTime - _startTime) * 1000],
		true,
		true
	] call ocap_fnc_log;
	ocap_capture = true; // Continue capturing
};