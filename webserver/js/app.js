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
	console.group("Processing operation: (" + filepath + ")...");
	var time = new Date();

	$.getJSON(filepath, function(data) {
		var header = data.header;
		globals.missionName = header.missionName;
		ui.setMissionName(globals.missionName);

		globals.endFrame = header.frameCount;
		ui.setMissionEndTime(globals.endFrame);

		// Loop through entities
		for (var entityId in data.entities) {
			var entityJSON = data.entities[entityId];

			let type = entityJSON.type;
			let startFrameNum = entityJSON.startFrameNum;
			let id = entityJSON.id;
			let name = entityJSON.name;

			// Convert positions into array of objects
			let states = [];
			entityJSON.states.forEach(entry => {
				let pos = entry[0];
				let dir = entry[1];
				let alive = Boolean(entry[2]);

				if (type == constants.EntityType.UNIT) {
					states.push({position: pos, direction: dir, alive: alive, isInVehicle: Boolean(entry[3])});
				} else if (type == constants.EntityType.VEHICLE) {
					states.push({position: pos, direction: dir, alive: alive, crew: entry[3]});
				};
			});

			if (type == constants.EntityType.UNIT) {
				// Add group to global groups object (if new)
				var group = groups.findGroup(entityJSON.group, entityJSON.side);
				if (group == null) {
					group = new Group(entityJSON.group, entityJSON.side);
					groups.addGroup(group);
				};

				// Create unit and add to entities list
				var unit = new Unit(startFrameNum, id, name, group, entityJSON.side, (entityJSON.isPlayer == 1), states, entityJSON.framesFired);
				entities.add(unit);
			} else if (type == constants.EntityType.VEHICLE) {
				// Create vehicle and add to entities list
				var vehicle = new Vehicle(startFrameNum, id, entityJSON.class, name, states);
				entities.add(vehicle);
				console.log('Imported vehicle:');
				console.log(vehicle);
			};
		};

		console.log('Entities extracted from capture data:')
		console.log(entities);

		// Loop through events
		data.events.forEach(function(eventJSON) {
			var frameNum = eventJSON[0];
			var type = eventJSON[1];

			var gameEvent = null;
			switch (true) {
				case (type == "killed" || type == "hit"):
					var victimId = eventJSON[2];
					var causedByInfo = eventJSON[3];
					var victim = entities.getById(victimId);
					var causedBy = entities.getById(causedByInfo[0]);
					var distance = eventJSON[4];

					// Create event object
					var weapon;
					if (causedBy instanceof Unit) {
						weapon = causedByInfo[1];
					} else {
						weapon = "N/A";
					};
					gameEvent = new HitOrKilledEvent(frameNum, type, causedBy, victim, distance, weapon);

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
					gameEvent = new ConnectEvent(frameNum, type, eventJSON[2]);
					break;
			};

			// Add event to gameEvents list
			if (gameEvent != null) {
				gameEvents.addEvent(gameEvent);
			};
		});

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
	}).fail(function(xhr, textStatus, error) {
		ui.modalBody.innerHTML = `Error: "${filepath}" failed to load.<br/>${error}.`;
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

	var mapBounds = new L.LatLngBounds(
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
		var pos = entity.getPosAtFrame(0);
		if (pos != null) { // If unit did exist at start of game
			entity.createMarker(services.armaToLatLng(pos));
		};
	});
};

function test() {
	// Add marker to map on click
	map.on("click", function(e) {
		//console.log(e.latlng);
		console.log(map.project(e.latlng, globals.mapMaxNativeZoom));
		var marker = L.circleMarker(e.latlng).addTo(map);
		marker.setRadius(5);
	});

	var marker = L.circleMarker(services.armaToLatLng([2438.21,820])).addTo(map);
	marker.setRadius(5);

	var marker = L.circleMarker(services.armaToLatLng([2496.58,5709.34])).addTo(map);
	marker.setRadius(5);
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
	var killlines = [];
	var firelines = [];

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

				entities.getAll().forEach(function playbackEntity(entity) {
					//console.log(entity);
					entity.manageFrame(globals.playbackFrame);

					if (entity instanceof Unit) {
						// Draw fire line (if enabled)
						var projectilePos = entity.firedOnFrame(globals.playbackFrame);
						if (projectilePos != null && ui.firelinesEnabled) {
							console.log('Shooter:');
							console.log(entity);
							console.log('Shooter pos:');
							console.log(entity.getLatLng());
							//console.log(`Shooter pos: ${entity.getLatLng()}\nFired event: ${projectilePos} (is null: ${projectilePos == null})`);
							var line = L.polyline([entity.getLatLng(), services.armaToLatLng(projectilePos)], {
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
				});

				// Display events for this frame (if any)
				gameEvents.getEvents().forEach(function playbackEvent(event) {

					// Check if event is supposed to exist by this point
					if (event.frameNum <= globals.playbackFrame) {
						ui.addEvent(event);

						// Draw kill line
						if (event.frameNum == globals.playbackFrame) {
							if (event.type == "killed") {
								var victim = event.victim;
								var killer = event.causedBy;

								// Draw kill line
								if (killer.getName() != "something") {
									//console.log(victim);
									//console.log(killer);
									var victimPos = victim.getLatLng();
									var killerPos = killer.getLatLng();

									if (victimPos != null && killerPos != null) {
										var line = L.polyline([victimPos, killerPos], {
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
								var victim = event.victim;
								victim.flashHit();
							};
						};

					} else {
						ui.removeEvent(event);
					};
				});

				// Handle globals.entityToFollow
				if (globals.entityToFollow != null) {
					var pos = globals.entityToFollow.getPosAtFrame(globals.playbackFrame);
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

	var playbackTimeout = setTimeout(playbackFunction, globals.frameCaptureDelay/globals.playbackMultiplier);
};

init();