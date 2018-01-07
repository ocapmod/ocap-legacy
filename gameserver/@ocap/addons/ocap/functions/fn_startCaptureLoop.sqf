/*
	Author: MisterGoodson

	Description:
	Captures unit/vehicle data (including dynamically spawned AI/JIP players) during a mission for playback.
	Compatible with dynamically spawned AI and JIP players.

	Structure of entitiesData:
	[
		// Unit 1 (OCAP id 0)
		[
			[startFrameNo, "unit", id, name, group, side, isPlayer] // Doesn't change
			[[pos, dir, alive, isInVehicle], [pos, dir, alive, isInVehicle], ...]
			[[frameNum, projectileLandingPos], [frameNum, projectileLandingPos] ...] // Frame number fired, landing pos of projectile
		]

		// Unit 2 (OCAP id 1)
		[
			[startFrameNo, "unit", id, name, group, side, isPlayer] // Doesn't change
			[[pos, dir, alive, isInVehicle], [pos, dir, alive, isInVehicle], ...]
			[[frameNum, projectileLandingPos], [frameNum, projectileLandingPos] ...] // Frame number fired, landing pos of projectile
		]

		// Vehicle 1 (OCAP id 2)
		[
			[startFrameNo, "vehicle", id, classname] // Doesn't change
			[[pos, dir, alive, crew], [pos, dir, alive, crew], ...] // position, direction, alive, crew IDs
		]

		etc...
	]
*/

// Wait until minimum player count is reached before starting capture
waitUntil{sleep 1; (time > 1) && (count(allPlayers) >= ocap_minPlayerCount) && (ocap_capture)};
["Min player count reached, starting capture."] call ocap_fnc_log;

/*if (ocap_debug) then {
	ocap_debugLoop = true;
	[] spawn {
		_c = 0;
		while {true} do {
			waitUntil {ocap_debugLoop; sleep 1};

			{
				systemChat format["%1 | %2 | %3", _c, _x getVariable "ocap_id", getPosATL _x];
			} forEach (allUnits + allDead);

			_c = _c + 1;
			sleep 1;
		};
	};
};*/

if (ocap_debug) then {
	//player addAction ["Copy entitiesData to clipboard", {copyToClipboard str(ocap_entitiesData)}];
	player addAction ["Write saved data", {[false] call ocap_fnc_exportData}];
	player addEventHandler ["Respawn", {
		player addAction ["Write saved data", {[false] call ocap_fnc_exportData}];
	}];

	//player addAction ["End mission", {endMission "end1"}];
};

// CAPTURE LOOP
_id = 0; // ID assigned to each entity (auto increments). Also acts as an index for each entity in entitiesData.
while {true} do {
	if (!ocap_capture) then {waitUntil {sleep 1; ocap_capture}};

	_sT = diag_tickTime;
	{
		if (!(_x getVariable ["ocap_exclude", false])) then {
			if (_x isKindOf "Logic") exitWith {
				_x setVariable ["ocap_exclude", true];
			};

			_pos = getPosATL _x;
			_pos = [_pos select 0, _pos select 1];
			_dir = getDir _x;
			_alive = alive _x;
			_isUnit = _x isKindOf "CAManBase";

			if (!(_x getVariable ["ocap_isInitialised", false])) then { // Setup entity if not initialised
				if (_alive) then { // Only init alive entities
					_x setVariable ["ocap_exclude", false];
					_x setVariable ["ocap_id", _id];

					if (_isUnit) then {
							ocap_entitiesData pushBack [
								[ocap_captureFrameNo, "unit", _id, name _x, groupID (group _x), str(side _x), isPlayer _x], // Properties
								[[_pos, _dir, _alive, (vehicle _x) != _x]], // States
								[] // Frames fired
							];
					} else { // Else vehicle
						_vehType = typeOf _x;
						ocap_entitiesData pushBack [
							[ocap_captureFrameNo, "vehicle", _id, _vehType, getText (configFile >> "CfgVehicles" >> _vehType >> "displayName")], // Properties
							[[_pos, _dir,_alive, []]] // States
						];
					};

					_x call ocap_fnc_addEventHandlers;
					_id = _id + 1;

					_x setVariable ["ocap_isInitialised", true];
					if (ocap_debug) then {systemChat format["Initialised %1.", str(_x)]};
				};
			} else { // Update states data for this entity
				if (_isUnit) then {
					// Get entity data from entitiesData array, select states entry, push new data to it
					((ocap_entitiesData select (_x getVariable "ocap_id")) select 1) pushBack [_pos, _dir, _alive, (vehicle _x) != _x];
				} else {
					// Get ID for each crew member
					_crew = [];
					{
						if (_x getVariable ["ocap_isInitialised", false]) then {
							_crew pushBack (_x getVariable "ocap_id");
						};
					} forEach (crew _x);

					// Get entity data from entitiesData array, select states entry, push new data to it
					((ocap_entitiesData select (_x getVariable "ocap_id")) select 1) pushBack [_pos, _dir, _alive, _crew];
				};
			};
		};
	} forEach (allUnits + allDead + (entities "LandVehicle") + (entities "Ship") + (entities "Air"));

	_string = format["Captured frame %1 (%2ms).", ocap_captureFrameNo, (diag_tickTime - _sT)*1000];
	if (ocap_debug) then {
		systemChat _string;
	};

	// Write to log file every 10 frames
	if ((ocap_captureFrameNo % 10) == 0) then {
		[_string, false] call ocap_fnc_log;
	};

	// Export data if reached frame limit
	if ((ocap_captureFrameNo % ocap_captureFrameLimit) == 0) then {
		[false] call ocap_fnc_exportData;
	};

	ocap_captureFrameNo = ocap_captureFrameNo + 1;
	sleep ocap_frameCaptureDelay;

	// If option enabled, end capture if all players have disconnected
	if (ocap_endCaptureOnNoPlayers && {count(allPlayers) == 0}) exitWith {
		["Players no longer present, ending capture."] call ocap_fnc_log;
		[] call ocap_fnc_exportData;
/*
		// Reset vars
		ocap_entitiesData = [];
		ocap_eventsData = [];
		ocap_captureFrameNo = 0;
		ocap_endFrameNo = 0;

		// Recommence capture (as new file) once minimum player count is met
		waitUntil{sleep 1; (count(allPlayers) >= ocap_minPlayerCount)};
		diag_log "OCAP: Min player count reached, restarting capture.";*/
	};
};