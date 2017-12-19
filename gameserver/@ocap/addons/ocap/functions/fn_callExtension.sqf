/*
	Author: MisterGoodson

	Description:
	Calls extension and supplies given arguments.

	Extension is intended to be called multiple times to send
	successive JSON 'chunks' to the Capture Manager.

	Parameters:
	_this: STRING - Data to output to extension (e.g. JSON)
*/

"ocap_exporter" callExtension format["{%1}%2", ocap_capManagerHost, _this];