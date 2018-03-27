import * as constants from './constants';
import {entities, Entities, Unit, Vehicle} from './entities';
import {gameEvents} from './events';
import {globals} from './globals';
import {groups, Group, Groups} from './groups';
import {ui} from './ui';


// Converts Arma coordinates [x,y] to LatLng
export function armaToLatLng(coords) {
	const multiplier = globals.world.multiplier;
	const pixelCoords = [
		(coords[0] * multiplier) + globals.trim,
		(globals.imageSize - (coords[1] * multiplier)) + globals.trim
	];
	return globals.map.unproject(pixelCoords, globals.mapMaxNativeZoom);
};

export function goFullscreen() {
	const element = document.getElementById("container");
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
	return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

export function dateToTimeString(date, includeSeconds=true) {
	const hours = date.getHours();
	const minutes = date.getMinutes();
	const seconds = date.getSeconds();
	let string = "";

	string += (hours + ":");

	if (minutes < 10) {
		string += "0";
	}
	string += minutes;

	if (includeSeconds) {
		string += ":";
		if (seconds < 10) {
			string += "0";
		};
		string += seconds;
	};

	return string;
};

// Convert time in seconds to a more readable format
// e.g. 121 seconds -> 2 minutes
// e.g. 4860 seconds -> 1 hour, 21 minutes
export function secondsToTimeString(seconds) {
	const mins =  Math.round(seconds / 60);

	if (mins < 60) {
		const minUnit = (mins > 1 ? "mins" : "min");

		return `${mins} ${minUnit}`;
	} else {
		const hours = Math.floor(mins / 60);
		const remainingMins = mins % 60;
		const hourUnit = (hours > 1 ? "hrs" : "hr");
		const minUnit = (remainingMins > 1 ? "mins" : "min");

		return `${hours} ${hourUnit}, ${remainingMins} ${minUnit}`;
	};
};

export function getWorldByName(worldName) {
	console.log("Getting world " + worldName);

	return new Promise((resolve, reject) => {
		fetch(`
				${constants.MAPS_PATH}/
				${worldName.toLowerCase()}/
				${constants.MAP_META_FILENAME}
		`).then(response => {
			if (response.ok) {
				return response.json();
			};
			throw new Error();
		}).then(json => {
				resolve(json);
		}).catch(error => {
			reject(`Error fetching meta file for ${worldName}`)
		});
	});
};