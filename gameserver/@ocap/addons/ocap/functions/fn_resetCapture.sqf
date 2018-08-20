/*
	Description:
		Resets capture.
*/

params[["_resetUnitVars", true]];

ocap_entity_id = 0; // ID assigned to each entity (auto increments)
ocap_frameNum = 0;
ocap_eventsData = []; // Data on all events (involving 2+ units) that occur throughout the mission.

if (_resetUnitVars) then {
	{
		_x setVariable ["ocap_id", nil];
	} count (allUnits + allDeadMen + vehicles);
};
