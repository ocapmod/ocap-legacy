private _events = _this;
private _json = "[";

{
	private _frameNum = _x select 0;
	private _type = _x select 1;

	switch (true) do {
		case (_type == "killed" || _type == "hit"): {
			private _victimId = _x select 2;
			private _causedByInfo = _x select 3;
			_causedByInfo set [1, [_causedByInfo select 1, """", "'"] call CBA_fnc_replace]; // Escape quotes
			private _distance = _x select 4;

			_json = formatText['
			%1[%2,"%3",%4,%5,"%6"]', _json, _frameNum, _type, _victimId, _causedByInfo, round(_distance)];
		};
		case (_type == "connected" || _type == "disconnected"): {
			private _name = _x select 2;
			_name = [_name, """", "'"] call CBA_fnc_replace; // Escape quotes

			_json = formatText['
			%1[%2,"%3","%4"]', _json, _frameNum, _type, _name];
		};
	};

	if !([_forEachIndex, _events] call ocap_fnc_atEndOfArray) then {_json =  formatText["%1,", _json]};
} forEach _events;

_json = formatText["%1]", _json];
_json