if (isNil "ocap_captureTimes") then {
	ocap_captureTimes = [];
};

ocap_captureTimes pushBack _this;

if (count ocap_captureTimes == 100) then {
	private _sum = 0;
	{_sum = _sum + _x} forEach ocap_captureTimes;
	private _avg = _sum / 100;
	ocap_captureTimes = [];
	[format["Avg capture time: %1ms (for previous 100 frames)", round (_avg * 1000)]] call ocap_fnc_log;
};