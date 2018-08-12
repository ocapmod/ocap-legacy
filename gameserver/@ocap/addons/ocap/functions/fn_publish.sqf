private _startTime = diag_tickTime;
private _str = "Publishing...";

[_str] call ocap_fnc_log;
("OCAP: " + _str) remoteExec ["systemChat", -2];

["publish", [
	ocap_host,
	worldName,
	briefingName,
	getMissionConfigValue ["author", ""],
	ocap_frameCaptureDelay,
	ocap_captureFrameNo
]] call ocap_fnc_callExtension;

private _runTime = diag_tickTime - _startTime;
_str = format["Publish complete (%1s).", _runTime toFixed 1];
[_str] call ocap_fnc_log;
("OCAP: " + _str) remoteExec ["systemChat", -2];