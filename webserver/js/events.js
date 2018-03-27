import {Unit} from './entities';
import {globals} from './globals';
import * as services from './services';
import {ui} from './ui';
import * as constants from './constants';

class GameEvents {
	constructor() {
		this._events = [];
	};

	addEvent(event) {
		this._events.push(event);
	};

	// Return an array of events that occured on the given frame
	getEventsAtFrame(f) {
		var events = [];
		this._events.forEach((event) => {
			if (event.frameNum == f) {
				events.push(event);
			};
		});

		return events;
	};

	getEvents() {return this._events};
};

// TODO: Handle case where victim is a vehicle
class HitOrKilledEvent {
	constructor(frameNum, type, causedBy, victim, distance, weapon) {
		this.frameNum = frameNum; // Frame number that event occurred
		this.timecode = services.dateToTimeString(new Date(frameNum*globals.frameCaptureDelay));
		this.type = type; // "hit" or "killed"
		this.causedBy = causedBy;
		this.victim = victim;
		this.distance = distance;
		this.weapon = weapon;
		this._element = null;

		// If causedBy is null, victim was likely killed/hit by collision/fire/exploding vehicle
		// TODO: Use better way of handling this
		if (this.causedBy == null) {
			this.distance = 0;
			this.weapon = "N/A";
			this.causedBy = new Unit(null, null, "something", null, null, null, null); // Dummy unit
		};


		// === Create UI element for this event (for later use)
		// Victim
		var victimSpan = document.createElement("span");
		if (victim instanceof Unit) {victimSpan.className = this.victim.getSideClass()};
		victimSpan.className += " bold";
		victimSpan.textContent = this.victim.getName();

		// CausedBy
		var causedBySpan = document.createElement("span");
		if ((causedBy instanceof Unit) && (causedBy.getId() != null)) {causedBySpan.className = this.causedBy.getSideClass()};
		causedBySpan.className += " medium";
		causedBySpan.textContent = this.causedBy.getName();

		var textSpan = document.createElement("span");
		switch(this.type) {
			case "killed":
				textSpan.textContent = " was killed by ";
				break;
			case "hit":
				textSpan.textContent = " was hit by ";
				break;
		};

		var detailsDiv = document.createElement("div");
		detailsDiv.className = constants.ClassName.EVENT_DETAILS;
		detailsDiv.textContent = this.timecode + " - " + this.distance + "m - " + this.weapon;

		var li = document.createElement("li");
		li.appendChild(victimSpan);
		li.appendChild(textSpan);
		li.appendChild(causedBySpan);
		li.appendChild(detailsDiv);

		// When clicking on event, skip playback to point of event, move camera to victim's position
		li.addEventListener("click", () => {
			console.log(this.victim);

			// Aim to skip back to a point just before this event
			let targetFrame = this.frameNum - globals.playbackMultiplier;
			let latLng = this.victim.getLatLngAtFrame(targetFrame);
			
			// Rare case: victim did not exist at target frame, fallback to event frame
			if (latLng == null) {
				targetFrame = this.frameNum;
				latLng = this.victim.getLatLngAtFrame(targetFrame);
			};

			ui.setMissionCurTime(targetFrame);
			//globals.map.setView(latLng, globals.map.getZoom());
			//this.victim.flashHighlight();
			this.victim.follow();
		});
		this._element = li;
	};

	getElement() {return this._element};
};

class ConnectEvent {
	constructor(frameNum, type, unitName) {
		this.frameNum = frameNum;
		this.timecode = services.dateToTimeString(new Date(frameNum*globals.frameCaptureDelay));
		this.type = type;
		this.unitName = unitName;
		this._element = null;

		// Create list element for this event (for later use)
		var span = document.createElement("span");
		span.className = "medium";
		span.textContent = this.unitName + " " + this.type;

		var detailsDiv = document.createElement("div");
		detailsDiv.className = constants.EVENT_DETAILS;
		detailsDiv.textContent = this.timecode;

		var li = document.createElement("li");
		li.appendChild(span);
		li.appendChild(detailsDiv);
		this._element = li;
	};

	getElement() {return this._element};
};

const gameEvents = new GameEvents();
export {gameEvents, GameEvents, HitOrKilledEvent, ConnectEvent};