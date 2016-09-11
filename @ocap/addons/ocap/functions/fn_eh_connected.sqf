/*
	Author: MisterGoodson

	Description:
	Adds new "connected" event, marking the current frame number and name of
	connecting entity.

	Parameters:
	_this: OBJECT - Entity that connected.
*/

_name = _this;

ocap_eventsData pushBack [
	ocap_captureFrameNo,
	"connected",
	_name
];