import {constants} from './constants';
import {entities, Entities, Unit, Vehicle} from './entities';
import {gameEvents} from './events';
import {globals} from './globals';
import {groups, Group, Groups} from './groups';
import {ui} from './ui';


// Converts Arma coordinates [x,y] to LatLng
export function armaToLatLng(coords) {
	var pixelCoords = [
		(coords[0] * globals.multiplier) + globals.trim,
		(globals.imageSize - (coords[1] * globals.multiplier)) + globals.trim
	];
	return globals.map.unproject(pixelCoords, globals.mapMaxNativeZoom);
};

export function goFullscreen() {
	var element = document.getElementById("container");
	if (element.requestFullscreen) {
		element.requestFullscreen();
	} else if(element.mozRequestFullScreen) {
		element.mozRequestFullScreen();
	} else if(element.webkitRequestFullscreen) {
		element.webkitRequestFullscreen();
	} else if(element.msRequestFullscreen) {
		element.msRequestFullscreen();
	};
};

// Returns date object as little endian (day, month, year) string 
export function dateToLittleEndianString(date) {
	return (date.getDate() + "/" + (date.getMonth()+1) + "/" + date.getFullYear());
};

export function dateToTimeString(date) {
	var hours = date.getUTCHours();
	var minutes = date.getUTCMinutes();
	var seconds = date.getUTCSeconds();
	var string = "";

/*	if (hours < 10) {
		string += "0";
	}*/
	string += (hours + ":");

	if (minutes < 10) {
		string += "0";
	}
	string += (minutes + ":");

	if (seconds < 10) {
		string+= "0";
	};
	string += seconds;

	return string;
};

// Convert time in seconds to a more readable format
// e.g. 121 seconds -> 2 minutes
// e.g. 4860 seconds -> 1 hour, 21 minutes
export function secondsToTimeString(seconds) {
	let mins =  Math.round(seconds / 60);

	if (mins < 60) {
		let minUnit = (mins > 1 ? "mins" : "min");
		
		return `${mins} ${minUnit}`;
	} else {
		let hours = Math.floor(mins / 60);
		let remainingMins = mins % 60;
		let hourUnit = (hours > 1 ? "hrs" : "hr");
		let minUnit = (remainingMins > 1 ? "mins" : "min");

		return `${hours} ${hourUnit}, ${remainingMins} ${minUnit}`;
	};
};