/*
	Description:
		Get direction of object rounded to nearest 15.

	Parameters:
		_this: OBJECT - Object to get rounded direction of.
*/

private _dir = getDir _this;
_dir - (_dir % 15);