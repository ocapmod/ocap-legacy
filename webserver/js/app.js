/*
	OCAP - Operation Caputre And Playback
    Copyright (C) 2016 Jamie Goodson (aka MisterGoodson) (goodsonjamie@yahoo.co.uk)

	NOTE: This script is written in ES6 and not intended to be used in a live
    environment. Instead, this script should be transpiled to ES5 for
    browser compatibility (including Chrome).


    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import * as constants from './constants';
import {entities, Entities, Unit, Vehicle} from './entities';
import {gameEvents, ConnectEvent, GameEvents, HitOrKilledEvent} from './events';
import {globals} from './globals';
import {groups, Group, Groups} from './groups';
import {ui} from './ui';
import * as services from './services';
import {DataIn} from './data_structure.js';

window.globals = globals;
window.constants = constants;
window.gameEvents = gameEvents;

function init() {
	// Fetch operations and display op selection window
	console.log('Fetching operations...')
	fetch('/api/v1/operations').then(res => {
		return res.json();
	}).then(json => {
		console.group('Fetched operations')
		console.log('Response JSON:');
		console.log(json);
		console.groupEnd();
		ui.setModalOpList(json);
	});

	// Prevent spacebar from scrolling page in some browsers
	window.addEventListener('keypress', function(event) {
		switch (event.charCode) {
			case constants.CharCode.SPACE:
				event.preventDefault();
				break;
		};
	});
};

// Read operation JSON data and create unit objects
export function processOp(filepath) {
	console.group(`Processing operation: ${filepath}...`);
	let time = new Date();

	fetch(filepath).then(response => {
		return services.getJsonAndUpdateProgressBar(
			response,
			ui.progressBar,
			ui.modalHeader
		);
	}).then(json => {
		globals.missionName = json.missionName;
		ui.setMissionName(globals.missionName);

		globals.endFrame = json.frameCount;
		ui.setMissionEndTime(globals.endFrame);

		// Loop through entities
		for (const id in json[DataIn.ENTITIES]) {
			const entity = json[DataIn.ENTITIES][id];
			const header = entity[DataIn.Entity.HEADER]
			const isUnit = header[DataIn.Entity.Header.IS_UNIT] == 1;
			const startFrameNum = header[DataIn.Entity.Header.START_FRAME_NUM];
			const name = header[DataIn.Entity.Header.NAME];

			// Process states
			let states = [];
			const In = DataIn.Entity.State;
			for (const state of entity[DataIn.Entity.STATES]) {
				let stateObj = {
					position: state[In.POSITION],
					direction: state[In.DIRECTION],
					isAlive: state[In.IS_ALIVE],
				};

				if (isUnit) {
					stateObj.isInVehicle = state[In.IS_IN_VEHICLE];
				} else {
					stateObj.crewIds = state[In.CREW_IDS];
				};

				states.push(stateObj);
			};

			// TODO: Format frames fired
			let framesFired = entity[DataIn.Entity.FRAMES_FIRED];

			if (isUnit) {
				const groupID = header[DataIn.Entity.Header.GROUP_ID];
				const side = header[DataIn.Entity.Header.SIDE];

				// Add group to global groups object (if new)
				let group = groups.findGroup(groupID, side);
				if (group == null) {
					group = new Group(groupID, side);
					groups.addGroup(group);
				};

				// Create unit and add to entities list
				entities.add(new Unit(
					startFrameNum,
					id,
					name,
					group,
					side,
					header[DataIn.Entity.Header.IS_PLAYER],
					states,
					framesFired
				));
			} else {
				// Create vehicle and add to entities list
				entities.add(new Vehicle(
					startFrameNum,
					id,
					header[DataIn.Entity.Header.CLASS],
					name,
					states
				));
			};
		};

		console.log('Entities extracted from capture data:')
		console.log(entities);

		// Loop through events
		for (const event of json[DataIn.EVENTS]) {
			let frameNum = event[DataIn.Event.FRAME_NUM];
			let type = event[DataIn.Event.TYPE];

			let gameEvent = null;
			switch (true) {
				case (type == "killed" || type == "hit"):
					let victimId = event[DataIn.Event.VICTIM_ID];
					let causedByInfo = event[DataIn.Event.ATTACKER_INFO];
					let victim = entities.getById(victimId);
					let causedBy = entities.getById(
							causedByInfo[DataIn.Event.AttackerInfo.ID]);
					let distance = event[DataIn.Event.DISTANCE];

					// Create event object
					let weapon;
					if (causedBy instanceof Unit) {
						weapon = causedByInfo[DataIn.Event.AttackerInfo.WEAPON_NAME];
					} else {
						weapon = "N/A";
					};
					gameEvent = new HitOrKilledEvent(
							frameNum, type, causedBy, victim, distance, weapon);

					// TODO: Find out why victim/causedBy can sometimes be null
					if (causedBy == null || (victim == null)) {
						console.log(victim);
						console.log(causedBy);
					};

					// Incrememt kill/death count for killer/victim
					if (type == "killed" && (causedBy != null)) {
						if (causedBy != victim) {
							causedBy.killCount++;
						};
						victim.deathCount++;
					};

					// Add tick to timeline
					ui.addTickToTimeline(frameNum);
					break;
				case (type == "connected" || type == "disconnected"):
					gameEvent = new ConnectEvent(
							frameNum, type, event[DataIn.Event.VICTIM_ID]);
					break;
			};

			// Add event to gameEvents list
			if (gameEvent != null) {
				gameEvents.addEvent(gameEvent);
			};
		};

		console.log('Events extracted from capture data:')
		console.log(gameEvents);

		console.log("Finished processing operation (" +(new Date() - time) + "ms).");
		console.groupEnd();
		initMap();
		createInitialMarkers();
		//test();
		startPlaybackLoop();
		toggleHitEvents(false);
		playPause();
		ui.hideModal();
	}).catch(error => {
		console.error(error);
		ui.modalBody.textContent = `Error: "${filepath}" failed to load.<br/>${error}.`;
	});
};

function initMap() {
	// Create map
	let map = L.map('map', {
		//maxZoom: globals.mapMaxZoom,
		zoomControl: false,
		zoomAnimation: true,
		scrollWheelZoom: false,
		fadeAnimation: true,
		crs: L.CRS.Simple,
		attributionControl: false,
		zoomSnap: 0.1,
		zoomDelta: 1,
		closePopupOnClick: false
	}).setView([0,0], globals.mapMaxNativeZoom);

	// Hide marker popups once below a certain zoom level
	map.on("zoom", function() {
		if (map.getZoom() <= 7) {
			ui.hideMarkerPopups = true;
		} else {
			ui.hideMarkerPopups = false;
		};
	});

	let world = globals.world;
	globals.imageSize = world.imageSize;
	map.setView(map.unproject([globals.imageSize/2, globals.imageSize/2]), globals.mapMinZoom);

	let mapBounds = new L.LatLngBounds(
		map.unproject([0, globals.imageSize], globals.mapMaxNativeZoom),
		map.unproject([globals.imageSize, 0], globals.mapMaxNativeZoom)
	);
	map.fitBounds(mapBounds);

	// Setup tile layer
	L.tileLayer(`${constants.MAPS_PATH}/${world.worldName}/{z}/{x}/{y}.png`, {
		maxNativeZoom: globals.mapMaxNativeZoom,
		maxZoom: globals.mapMaxZoom,
		minZoom: globals.mapMinZoom,
		bounds: mapBounds,
		//attribution: 'MisterGoodson',
		noWrap: true,
		tms: false
	}).addTo(map);

	map.on("dragstart", function() {
		if (globals.entityToFollow != null) {
			globals.entityToFollow.unfollow();
		};
	});

	globals.map = map;
};

function createInitialMarkers() {
	entities.getAll().forEach(function(entity) {
		// Create and set marker for unit
		let pos = entity.getPosAtFrame(0);
		if (pos != null) { // If unit did exist at start of game
			entity.createMarker(services.armaToLatLng(pos));
		};
	});
};

export function playPause() {
	globals.playbackPaused = !globals.playbackPaused;
	ui.updatePlayPauseButton(globals.playbackPaused);
};

function toggleHitEvents(showHint = true) {
	ui.showHitEvents = !ui.showHitEvents;

	let text;
	if (ui.showHitEvents) {
		ui.filterHitEventsButton.style.opacity = 1;
		text = "shown";
	} else {
		ui.filterHitEventsButton.style.opacity = 0.5;
		text = "hidden";
	};

	if (showHint) {
		ui.showHint("Hit events " + text);
	};
};

function startPlaybackLoop() {
	let killlines = [];
	let firelines = [];

	function playbackFunction() {
		if (!globals.playbackPaused && !(globals.playbackFrame == globals.endFrame)) {

			requestAnimationFrame(() => {
				// Remove killines & firelines from last frame
				killlines.forEach(function(line) {
					globals.map.removeLayer(line);
				});
				firelines.forEach(function(line) {
					globals.map.removeLayer(line);
				});

				for (const entity of entities.getAll()) {
					//console.log(entity);

					// if (entity.isFrameOutOfBounds(globals.playbackFrame)) {
					// 	continue;
					// }

					entity.manageFrame(globals.playbackFrame);

					// Draw firelines
					if (entity instanceof Unit) {
						// Draw fire line (if enabled)
						let projectilePos = entity.firedOnFrame(globals.playbackFrame);
						if (projectilePos != null && ui.firelinesEnabled) {
							console.log('Shooter:');
							console.log(entity);

							// TODO: Figure out why/how some entities seem to have 1 extra
							// frame where they've fired *after* they no longer exist.
							// This seems to be a problem with capture, not playback.
							// e.g. Entity's number of states = 10 (so max frame=9). Frame fired = 10
							// `globals.playbackFrame - 1` is a hack to get around this for now.
							const entityPos = entity.getLatLngAtFrame(globals.playbackFrame - 1);
							console.log('Shooter pos:');
							console.log(entityPos);

							//console.log(`Shooter pos: ${entity.getLatLng()}\nFired event: ${projectilePos} (is null: ${projectilePos == null})`);
							let line = L.polyline([entityPos, services.armaToLatLng(projectilePos)], {
								color: entity.getSideColour(),
								weight: 2,
								opacity: 0.4
							});
							console.log('Fireline:')
							console.log(line);
							line.addTo(globals.map);
							firelines.push(line);
						};
					};
				};

				// Display events for this frame (if any)
				for (const event of gameEvents.getEvents()) {
					// Check if event is supposed to exist by this point
					if (event.frameNum <= globals.playbackFrame) {
						ui.addEvent(event);

						// Draw kill line
						if (event.frameNum == globals.playbackFrame) {
							if (event.type == "killed") {
								let victim = event.victim;
								let killer = event.causedBy;

								// Draw kill line
								if (killer.getName() != "something") {
									//console.log(victim);
									//console.log(killer);
									let victimPos = victim.getLatLng();
									let killerPos = killer.getLatLng();

									if (victimPos != null && killerPos != null) {
										let line = L.polyline([victimPos, killerPos], {
											color: killer.getSideColour(),
											weight: 2,
											opacity: 0.4
										});
										line.addTo(globals.map);
										killlines.push(line);
									};
								};
							};

							// Flash unit's icon
							if (event.type == "hit") {
								let victim = event.victim;
								victim.flashHit();
							};
						};

					} else {
						ui.removeEvent(event);
					};
				};

				// Handle globals.entityToFollow
				if (globals.entityToFollow != null) {
					let pos = globals.entityToFollow.getPosAtFrame(globals.playbackFrame);
					if (pos != null) {
						globals.map.setView(services.armaToLatLng(pos), globals.map.getZoom());
					} else { // Unit has died or does not exist, unfollow
						globals.entityToFollow.unfollow();
					};
				};

				globals.playbackFrame++;
				if (globals.playbackFrame == globals.endFrame) {globals.playbackPaused = true};
				ui.setMissionCurTime(globals.playbackFrame);
			});
		};

		// Run timeout again (creating a loop, but with variable intervals)
		playbackTimeout = setTimeout(playbackFunction, globals.frameCaptureDelay/globals.playbackMultiplier);
	};

	let playbackTimeout = setTimeout(playbackFunction, globals.frameCaptureDelay/globals.playbackMultiplier);
};

init();