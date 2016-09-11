
/*
	Author: MisterGoodson

	Description:
	Adds new "disconnected" event, marking the current frame number and name of
	connecting entity.

	Parameters:
	_this: OBJECT - Entity that disconnected.
*/
_name = _this;

ocap_eventsData pushBack [
	ocap_captureFrameNo,
	"disconnected",
	_name
];