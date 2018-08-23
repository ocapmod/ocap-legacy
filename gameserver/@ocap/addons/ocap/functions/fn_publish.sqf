["publish", [
	ocap_host,
	worldName,
	briefingName,
	getMissionConfigValue ["author", ""],
	ocap_frameCaptureDelay,
	ocap_frameNum
]] call ocap_fnc_callExtension;
[] call ocap_fnc_resetCapture;

if (ocap_stopCaptureAfterPublish) then {
	ocap_capture = false;
};

private _str = "Sent publish request in background.";
[_str] call ocap_fnc_log;
("OCAP: " + _str) remoteExec ["systemChat", -2];