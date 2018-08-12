/*
	Author: MisterGoodson

	Description:
	Calls extension and supplies given arguments.

	Parameters:
	_this select 0: STRING - Name of function extension should call
	_this select 1: ARRAY - Arguments to supply to extension (Default: [])
*/

params["_funcName", ["_args", []]];

_result = "ocap_exporter" callExtension [_funcName, _args];