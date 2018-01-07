import {constants} from './constants';

let icons = {
	man: {},
	ship: {},
	parachute: {},
	heli: {},
	plane: {},
	truck: {},
	car: {},
	apc: {},
	tank: {},
	staticMortar: {},
	staticWeapon: {},
	unknown: {}
};

let imgPathMan = `${constants.MARKERS_PATH}/man/man-`;
let imgPathShip = `${constants.MARKERS_PATH}/ship/ship-`;
let imgPathParachute = `${constants.MARKERS_PATH}/parachute/parachute-`;
let imgPathHeli = `${constants.MARKERS_PATH}/heli/heli-`;
let imgPathPlane = `${constants.MARKERS_PATH}/plane/plane-`;
let imgPathTruck = `${constants.MARKERS_PATH}/truck/truck-`;
let imgPathCar = `${constants.MARKERS_PATH}/car/car-`;
let imgPathApc = `${constants.MARKERS_PATH}/apc/apc-`;
let imgPathTank = `${constants.MARKERS_PATH}/tank/tank-`;
let imgPathStaticMortar = `${constants.MARKERS_PATH}/static-mortar/static-mortar-`;
let imgPathStaticWeapon = `${constants.MARKERS_PATH}/static-weapon/static-weapon-`;
let imgPathUnknown = `${constants.MARKERS_PATH}/unknown/unknown-`;

let imgs = ["blufor", "opfor", "ind", "civ", "dead", "hit", "follow"];
imgs.forEach((img) => {
	icons.man[img] = L.icon({iconSize: [16, 16], iconUrl: `${imgPathMan}${img}.svg`});
	icons.ship[img] = L.icon({iconSize: [28, 28], iconUrl: `${imgPathShip}${img}.svg`});
	icons.parachute[img] = L.icon({iconSize: [20, 20], iconUrl: `${imgPathParachute}${img}.svg`});
	icons.heli[img] = L.icon({iconSize: [32, 32], iconUrl: `${imgPathHeli}${img}.svg`});
	icons.plane[img] = L.icon({iconSize: [32, 32], iconUrl: `${imgPathPlane}${img}.svg`});
	icons.truck[img] = L.icon({iconSize: [28, 28], iconUrl: `${imgPathTruck}${img}.svg`});
	icons.car[img] = L.icon({iconSize: [24, 24], iconUrl: `${imgPathCar}${img}.svg`});
	icons.apc[img] = L.icon({iconSize: [28, 28], iconUrl: `${imgPathApc}${img}.svg`});
	icons.tank[img] = L.icon({iconSize: [28, 28], iconUrl: `${imgPathTank}${img}.svg`});
	icons.staticMortar[img] = L.icon({iconSize: [20, 20], iconUrl: `${imgPathStaticMortar}${img}.svg`});
	icons.staticWeapon[img] = L.icon({iconSize: [20, 20], iconUrl: `${imgPathStaticWeapon}${img}.svg`});
	icons.unknown[img] = L.icon({iconSize: [28, 28], iconUrl: `${imgPathUnknown}${img}.svg`});
});

let mapMaxNativeZoom = 6;
let globals = {
	icons: icons,
	multiplier: null,
	imageSize: null,
	trim: 0, // Number of pixels that were trimmed when cropping image (used to correct unit placement)
	mapMinZoom: 1,
	mapMaxNativeZoom: mapMaxNativeZoom,
	mapMaxZoom: mapMaxNativeZoom + 3,
	map: null,

	// Playback vars
	frameCaptureDelay: 1000, // Delay between capture of each frame in-game (ms). Default: 1000
	playbackMultiplier: 10, // Playback speed. 1: realtime.
	maxPlaybackMultipler: 60, // Max speed user can set playback to
	minPlaybackMultipler: 1, // Min speed user can set playback to
	playbackMultiplierStep: 1, // Playback speed slider increment value
	playbackPaused: true,
	playbackFrame: 0,
	entityToFollow: null, // When set, camera will follow this unit

	// Mission details
	worldName: "",
	missionName: "",
	endFrame: 0,
	missionCurDate: new Date(0),
};

export {globals};