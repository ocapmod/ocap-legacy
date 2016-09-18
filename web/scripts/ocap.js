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

class Entities {
	constructor() {
		this._entities = [];
	};

	add(entity) {
		this._entities.push(entity);
	};

	getAll() {
		return this._entities;
	};
	
	getById(id) {
		return this._entities[id]; // Assumes entity IDs are always equal to their index in _entities
	};

	getAllByName(name) {
		let matching = [];
		this._entities.forEach(function (entity) {
			if (entity.getName().indexOf(name) != -1) {
				matching.push(entity);
			};
		});
		return matching;
	};
}

// Should not be instantiated directly. Intended only to be used as extender class
class Entity {
	constructor(startFrameNum, id, name, positions) {
		this._startFrameNum = startFrameNum;
		this._id = id;
		this._name = name;
		this._positions = positions; // pos, dir, alive
		this._marker = null;
		this.iconType = icons.unknown;
		this._realIcon = icons.unknown.dead;
		this._curIcon = icons.unknown.dead;
		this._tempIcon = icons.unknown.dead;
		this._lockMarkerIcon = false; // When true, prevent marker icon from being changed
		this._element = null; // DOM element associated with this entity
		this._alive = false;
		this._sideColour = "#000000";
		this._markerRotationOrigin = "50% 50%";
		this._popupClassName = "";
	};

	// Correct index by taking into account startFrameNum.
	// e.g. If requested frame is 31, and entity startFrameNum is 30,
	// then relative frame index is 1 (31-30).
	// If relative index is < 0, then entity doesn't exist yet
	getRelativeFrameIndex(f) {
		return (f - this._startFrameNum);
	};

	getPosAtFrame(f) {
		f = this.getRelativeFrameIndex(f);

		var notExistYet = f<0; // Unit doesn't exist yet
		var notExistAnymore = f >= (this._positions.length-1); // Unit dead/doesn't exist anymore
		if (notExistYet || notExistAnymore) { 
			return;
		} else {
			return this._positions[f].position;
		};
	};

	// Get LatLng at specific frame
	getLatLngAtFrame(f) {
		var pos = this.getPosAtFrame(f);
		if (pos != null) {return armaToLatLng(pos)};
		return;
	};

	// Get LatLng at current frame
	getLatLng() {
		return this.getLatLngAtFrame(playbackFrame);
	};

	getMarker() {
		return this._marker;
	};

	setElement(el) {
		this._element = el;
	};

	getElement() {
		return this._element;
	};

	getName() {
		return this._name;
	};

	getId() {
		return this._id;
	};

	_createPopup(content) {
		let popup = L.popup({
			autoPan: false,
			autoClose: false,
			closeButton: false,
			className: this._popupClassName
		});
		popup.setContent(content);
		return popup;
	};

	createMarker(latLng) {
		let marker = L.marker(latLng).addTo(map);
		marker.setIcon(this._realIcon);
		marker.setRotationOrigin(this._markerRotationOrigin);
		this._marker = marker;
	};

	// TODO: Optimise this. No need to remove marker (and recreate it later).
	// 		 Instead, hide marker and then unhide it later when needed again
	// Remove marker if exists
	removeMarker() {
		let marker = this._marker;
		if (marker != null) {
			map.removeLayer(marker);
			this._marker = null;
		};
	};

/*	getMarkerEditableGroup() {
		let doc = this._marker.getElement().contentDocument;
		return doc.getElementById("editable");
	};

	setMarkerColour(colour) {
		let g = this.getMarkerEditableGroup();

		// May be null if not loaded yet
		if (g != null) {
			g.style.fill = colour;
		};
	};*/

	setMarkerIcon(icon) {
		this._marker.setIcon(icon);
		this._curIcon = icon;
	};

	setMarkerOpacity(opacity) {
		this._marker.setOpacity(opacity);

		let popup = this._marker.getPopup();
		if (popup != null) {
			popup.getElement().style.opacity = opacity;
		};
	};

	hideMarkerPopup(bool) {
		let popup = this._marker.getPopup();
		if (popup == null) {return};

		let element = popup.getElement();
		let display = "inherit";
		if (bool) {display = "none"};

		if (element.style.display != display) {
			element.style.display = display;
		};
	};

	removeElement() {
		this._element.parentElement.removeChild(this._element);
		this._element = null;
	};

	// Does entity now exist (for the first time) at relativeFrameIndex
	_existFirstTime(relativeFrameIndex) {
		return (relativeFrameIndex == 0);
	};

	// Does entity exist yet (not connected/hasn't spawned) at relativeFrameIndex
	_notExistYet(relativeFrameIndex) {
		return (relativeFrameIndex < 0);
	};

	// Does entity exist anymore (disconnected/garbage collected) at relativeFrameIndex
	_notExistAnymore(relativeFrameIndex) {
		return (relativeFrameIndex >= this._positions.length);
	};

	// Is relativeFrameIndex out of bounds
	isFrameOutOfBounds(relativeFrameIndex) {
		return ((this._notExistYet(relativeFrameIndex)) || (this._notExistAnymore(relativeFrameIndex)));
	};

	// Update entiy position, direction, and alive status at valid frame
	_updateAtFrame(relativeFrameIndex) {
		// Set pos
		let latLng = armaToLatLng(this._positions[relativeFrameIndex].position);
		if (this._marker == null) { // First time unit has appeared on map
			this.createMarker(latLng);
		} else {
			this._marker.setLatLng(latLng);
		};

		// Set direction
		this._marker.setRotationAngle(this._positions[relativeFrameIndex].direction);

		// Set alive status
		this.setAlive(this._positions[relativeFrameIndex].alive);
	};

	// Manage entity at given frame
	manageFrame(f) {
		f = this.getRelativeFrameIndex(f);

		if (this.isFrameOutOfBounds(f)) { // Entity does not exist on frame
			this.removeMarker();
		} else { // Entity does exist on frame
			this._updateAtFrame(f);
		};
	};

	_flash(icon, framesToSpan) {
		this.setMarkerIcon(icon);
		this._lockMarkerIcon = true;
		setTimeout(() => {
			//this._marker.setIcon(this._tempIcon);
			this._lockMarkerIcon = false;
		}, (frameCaptureDelay/playbackMultiplier) * framesToSpan);
	};

	flashHit() {
		this._flash(this.iconType.hit, 3);
	};

	flashHighlight() {
		this._flash(this.iconType.follow, 6);
	};

	setAlive(alive) {
		if (alive) {
			this._alive = alive;

			//console.log(this._marker);
			if ((!this._lockMarkerIcon) && (this._curIcon != this._realIcon)) {
				this.setMarkerIcon(this._realIcon);
			};

			this.setMarkerOpacity(1);
		} else {
			let icon = this.iconType.dead;
			this._alive = alive;

			if (this._curIcon != icon) {
				this.setMarkerIcon(icon);
			};
			this._tempIcon = (icon);
			this.setMarkerOpacity(0.4);
		};
	};

	// Change unit's marker colour (highlight) and set as entity to follow
	follow() {
		this._lockMarkerIcon = true; // Prevent marker colour from being changed
		if (entityToFollow != null) {entityToFollow.unfollow()}; // Unfollow current followed entity (if any)
		
		let icon = this.iconType.follow;
		this.setMarkerIcon(icon);
		this._tempIcon = icon;
		entityToFollow = this;
	};

	// Reset unit's marker colour and clear entityToFollow
	unfollow() {
		this._lockMarkerIcon = false;

		let marker = this.getMarker();
		if (marker != null) {
			this.setMarkerIcon(this._tempIcon);
		};
		entityToFollow = null;
	};
};

class Unit extends Entity {
	constructor(startFrameNum, id, name, group, side, isPlayer, positions, framesFired) {
		super(startFrameNum, id, name, positions);
		this._group = group;
		this._side = side;
		this.isPlayer = isPlayer;
		this._framesFired = framesFired;
		this.killCount = 0;
		this.deathCount = 0;
		this._sideClass = "";
		this._sideColour = "#FFFFFF";
		this._isInVehicle = false;
		this.iconType = icons.man;
		this._popupClassName = "leaflet-popup-unit";

		// Set colour and icon of unit depeneding on side
		let sideClass = "";
		let sideColour = "";
		switch (this._side) {
			case "WEST":
				sideClass = "blufor";
				sideColour = "#004d99";
				break;
			case "EAST":
				sideClass  = "opfor";
				sideColour = "#800000";
				break;
			case "GUER":
				sideClass  = "ind";
				sideColour = "#007f00";
				break;
			case "CIV":
				sideClass  = "civ";
				sideColour = "#650080";
				break;
		};

		this._sideClass = sideClass;
		this._sideColour = sideColour;
		this._realIcon = this.iconType[sideClass];
		this._tempIcon = this.iconType[sideClass];
		this._markerRotationOrigin = "50% 60%";
	};

	createMarker(latLng) {
		super.createMarker(latLng);

		// Only create a nametag label (popup) for players
		if (this.isPlayer) {
			let popup = this._createPopup(this._name);
			this._marker.bindPopup(popup).openPopup();
		};
	};

	_updateAtFrame(relativeFrameIndex) {
		super._updateAtFrame(relativeFrameIndex);
		this.hideMarkerPopup(ui.hideMarkerPopups);
		this.setIsInVehicle(this._positions[relativeFrameIndex].isInVehicle);
	};

	setIsInVehicle(isInVehicle) {
		this._isInVehicle = isInVehicle;

		if (isInVehicle) {
			this.setMarkerOpacity(0);
		} else if (!isInVehicle && this._alive) {
			this.setMarkerOpacity(1);
		};
	};

	get sideClass() {return this._sideClass};

	// Check if unit fired on given frame
	// If true, return position of projectile impact
	firedOnFrame(f) {
		for (let i = 0; i < (this._framesFired.length-1); i++) {
			let frameNum = this._framesFired[i][0];
			let projectilePos = this._framesFired[i][1];
			if (frameNum == f) {return projectilePos};
		};
		return;
	};

	remove() {
		super.remove();
		this._group.removeUnit(this);
	};

	getSide() {
		return this._side;
	};

	makeElement(liTarget) { // Make and add element to UI target list
		let liUnit = document.createElement("li");
		liUnit.className = "liUnit";
		liUnit.textContent = this._name;
		liUnit.addEventListener("click", () => {
			let marker = this.getMarker();
			if (marker != null) {
				map.setView(marker.getLatLng(), map.getZoom(), {animate: true});
				this.follow();
			};
		});
		this.setElement(liUnit);
		liTarget.appendChild(liUnit);
	};

	getSideColour() {return this._sideColour};

	getSideClass() {return this._sideClass};

	setAlive(alive) {
		super.setAlive(alive);

		if (alive) {
			this._group.addUnit(this);
		} else {
			this._group.removeUnit(this);
		};
	};
};

class Vehicle extends Entity {
	constructor(startFrameNum, id, type, name, positions) {
		super(startFrameNum, id, name, positions);
		this._popupClassName = "leaflet-popup-vehicle";
		this._type = type;
		this._crew = []; // Crew in order: [driver,gunner,commander,turrets,cargo]

		let iconType = null;
		switch (type) {
			case "sea":
				iconType = icons.ship;
				break;
			case "parachute":
				iconType = icons.parachute;
				break;
			case "heli":
				iconType = icons.heli;
				break;
			case "plane":
				iconType = icons.plane;
				break;
			case "truck":
				iconType = icons.truck;
				break;
			case "car":
				iconType = icons.car;
				break;
			case "apc":
				iconType = icons.apc;
				break;
			case "tank":
				iconType = icons.tank;
				break;
			case "static-mortar":
				iconType = icons.unknown; // TODO
				break;
			case "static-weapon":
				iconType = icons.unknown; // TODO
				break;
			default:
				iconType = icons.unknown;
		};

		this.iconType = iconType;
		this._realIcon = iconType.dead;
		this._tempIcon = iconType.dead;
	};

	createMarker(latLng) {
		super.createMarker(latLng);

		let popup = this._createPopup(this._name);
		this._marker.bindPopup(popup).openPopup();

		// Wait until popup loads, set permanent size
		var checkPopupLoad = setInterval(() => {
			if (popup._contentNode != null) {
				popup._contentNode.style.width = "200px";
				clearInterval(checkPopupLoad);
			};
		}, 100);

		// Add vehicle name tooltip on marker hover
/*		let markerEl = this._marker.getElement();
		markerEl.addEventListener("mouseover", (event) => {
			ui.cursorTargetBox.textContent = this._name;
			ui.showCursorTooltip(this._name);
		});*/
	};

	_updateAtFrame(relativeFrameIndex) {
		super._updateAtFrame(relativeFrameIndex);
		this.setCrew(this._positions[relativeFrameIndex].crew);
	};

	setCrew(crew) {
		this._crew = crew;
		//this._marker.getPopup().setContent(`Test`); // Very slow (no need to recalc layout), use ._content instead

		let crewLength = crew.length;
		let content = `${this._name} <i>(0)</i>`;
		if (crewLength > 0) {
			let crewLengthString = `<i>(${crewLength})</i>`;
			let crewString = this.getCrewString();

			if (crewString.length > 0) {
				let title = `<u>${this._name}</u> ${crewLengthString}`;
				content = `${title}<br>${crewString}`;
			} else {
				content = `${this._name} ${crewLengthString}`;
			};

			// Change vehicle icon depending on driver's side
			let driverId = crew[0];
			let driver = entities.getById(driverId);
			//console.log(this);
			//console.log(driver);
			let icon = this.iconType[driver.sideClass];
			if (this._realIcon != icon) {
				this.setMarkerIcon(icon);
				this._realIcon = icon; // Vehicle icon will now remain this colour until a unit of a differet side becomes driver
			};
		};

		let popupNode = this._marker.getPopup()._contentNode;
		if (popupNode.innerHTML != content) {
			popupNode.innerHTML = content;
		};
	};

	getCrew() {
		return this._crew;
	};

	getCrewString() {
		if (this._crew.length == 0) {return " "};

		let str = "";
		this._crew.forEach(function(unitId) {
			//if (unitId != -1) {
				let unit = entities.getById(unitId);

				// Only include player names
				if (unit.isPlayer) {
					str += (unit.getName() + "<br/>");
				};
			//};
		});
		return str;
	};

	// If vehicle has crew, return side colour of 1st crew member. Else return black.
	getSideColour() {
		let crew = this._crew;
		if (crew.length > 0) {
			return entities.getById(crew[0]).getSideColour();
		} else {
			return "black";
		};
	};
};

class UI {
	constructor() {
		this.leftPanel = null;
		this.rightPanel = null;
		this.bottomPanel = null;
		this.eventList = null;
		this.listWest = null;
		this.listEast = null;
		this.listGuer = null;
		this.listCiv = null;
		this.missionCurTime = null;
		this.missionEndTime = null;
		this.frameSlider = null;
		this.modal = null;
		this.modalHeader = null;
		this.modalBody = null;
		this.modalButtons = null;
		this.missionName = null;
		this.loadOpButton = null;
		this.playPauseButton = null;
		this.playbackSpeedSliderContainer = null;
		this.playbackSpeedSlider = null;
		this.playbackSpeedVal = null;
		this.aboutButton = null;
		this.toggleFirelinesButton = null;
		this.hint = null;
		this.eventTimeline = null;
		this.frameSliderWidthInPercent = -1;
		this.filterHitEventsButton = null;
		this.showHitEvents = true;
		this.firelinesEnabled = true;
		this.filterEventsInput = null;
		this.hideMarkerPopups = false;
		this.cursorTargetBox = null;
		this.cursorTooltip = null;

		this._init();
	};

	_init() {
		// Setup top panel
		this.missionName = document.getElementById("missionName");

		// Load operation button
		var loadOpButton = document.getElementById("loadOpButton");
		loadOpButton.addEventListener("click", function() {
			//TODO: Show op selection menu, reset all variables + clear all panels.
			ui.showHint("Not yet implemented.");
		});
		this.loadOpButton = loadOpButton;

		// About button
		var aboutButton = document.getElementById("aboutButton");
		aboutButton.addEventListener("click", () => {
			this.showModalAbout();
		});
		this.aboutButton = aboutButton;

		// Toggle firelines button
		var toggleFirelinesButton = document.getElementById("toggleFirelines");
		toggleFirelinesButton.addEventListener("click", () => {
			this.firelinesEnabled = !this.firelinesEnabled;

			var text;
			if (this.firelinesEnabled) {
				toggleFirelinesButton.style.opacity = 1;
				text = "enabled";
			} else {
				toggleFirelinesButton.style.opacity = 0.5;
				text = "disabled (excluding kills)";
			};

			this.showHint("Projectile lines " + text);
		});
		this.toggleFirelinesButton = toggleFirelinesButton;


		// Setup left panel
		this.leftPanel = document.getElementById("leftPanel");

		// Define group side elements
		this.listWest = document.getElementById("listWest");
		this.listEast = document.getElementById("listEast");
		this.listGuer = document.getElementById("listGuer");
		this.listCiv = document.getElementById("listCiv");

		// Setup right panel
		this.rightPanel = document.getElementById("rightPanel");
		this.eventList = document.getElementById("eventList");
		this.filterHitEventsButton = document.getElementById("filterHitEventsButton");
		this.filterHitEventsButton.addEventListener("click", () => {
			toggleHitEvents();
		});
		this.filterEventsInput = document.getElementById("filterEventsInput");

		// Cursor target box
		this.cursorTargetBox = document.getElementById("cursorTargetBox");

		// Cursor tooltip
		let cursorTooltip = document.createElement("div");
		cursorTooltip.className = "cursorTooltip";
		document.body.appendChild(cursorTooltip);
		this.cursorTooltip = cursorTooltip;

		// Setup bottom panel
		this.bottomPanel = document.getElementById("bottomPanel");
		this.missionCurTime = document.getElementById("missionCurTime");
		this.missionEndTime = document.getElementById("missionEndTime");
		this.frameSlider = document.getElementById("frameSlider");
		this.frameSlider.addEventListener("input", (event) => {
			var val = event.srcElement.value;
			this.setMissionCurTime(val);
		});
		this.playPauseButton = document.getElementById("playPauseButton");

		// Events timeline
		this.eventTimeline = document.getElementById("eventTimeline");

		// Hide/show ui on keypress
		mapDiv.addEventListener("keypress", (event) => {
			//console.log(event.charCode);
			
			switch (event.charCode) {
				case 101: // e
					this.toggleLeftPanel();
					break;
				case 114: // r
					this.toggleRightPanel();
					break;
			};
		});


		// Modal
		this.setModal(
			document.getElementById("modal"),
			document.getElementById("modalHeader"),
			document.getElementById("modalBody"),
			document.getElementById("modalButtons")
		);
		this.showModalOpSelection();

		// Small popup
		this.hint = document.getElementById("hint");

		// Playback speed slider
		this.playbackSpeedSliderContainer = document.getElementById("playbackSpeedSliderContainer");
		this.playbackSpeedSlider = document.getElementById("playbackSpeedSlider");

		this.playbackSpeedVal = document.getElementById("playbackSpeedVal");
		this.playbackSpeedVal.textContent = playbackMultiplier + "x";
		this.playbackSpeedVal.addEventListener("mouseover", () => {
			this.showPlaybackSpeedSlider();
		});
		this.playbackSpeedSliderContainer.addEventListener("mouseleave", () => {
			this.hidePlaybackSpeedSlider();
		});

		this.playbackSpeedSlider.max = maxPlaybackMultipler;
		this.playbackSpeedSlider.min = minPlaybackMultipler;
		this.playbackSpeedSlider.step = playbackMultiplierStep;
		this.playbackSpeedSlider.value = playbackMultiplier;
		this.playbackSpeedSlider.addEventListener("input", () => {
			let sliderVal = this.playbackSpeedSlider.value;
			this.playbackSpeedVal.textContent = sliderVal + "x";
			playbackMultiplier = sliderVal;
		});

		this.frameSliderWidthInPercent = (this.frameSlider.offsetWidth / this.frameSlider.parentElement.offsetWidth) * 100;
	};

	showCursorTooltip(text) {
		let tooltip = this.cursorTooltip;
		tooltip.textContent = text;
		tooltip.className = "cursorTooltip";

		// Attach text to cursor. Remove after timeout
		mapDiv.addEventListener("mousemove", this._moveCursorTooltip);
		setTimeout(() => {
			tooltip.className = "cursorTooltip hidden";

			// Remove listener once opacity transition ended
			tooltip.addEventListener("transitionend", () => {
				mapDiv.removeEventListener("mousemove", this._moveCursorTooltip);
			});
		}, 2500);
		console.log(this.cursorTooltip);
	};

	_moveCursorTooltip(event) {
		ui.cursorTooltip.style.transform = `translate3d(${event.pageX}px, ${event.pageY}px, 0px)`;
	};

	setMissionName(name) {
		this.missionName.textContent = name;
	};

	// Set mission time based on given frame
	// Move playback + slider to given frame in time
	setMissionCurTime(f) {
		missionCurDate.setTime(f*frameCaptureDelay);
		this.missionCurTime.textContent = dateToTimeString(missionCurDate);
		this.setFrameSliderVal(f);
		playbackFrame = f;
	};

	setMissionEndTime(f) {
		this.missionEndTime.textContent = dateToTimeString(new Date(f*frameCaptureDelay));
		this.setFrameSliderMax(f);
	};

	setFrameSliderMax(f) {
		this.frameSlider.max = f;
	};

	setFrameSliderVal(f) {
		this.frameSlider.value = f;
	};
	
	toggleLeftPanel() {
		if (this.leftPanel.style.display == "none") {
			this.leftPanel.style.display = "initial";
		} else {
			this.leftPanel.style.display = "none";
		};
	};
	
	toggleRightPanel() {
		if (this.rightPanel.style.display == "none") {
			this.rightPanel.style.display = "initial";
		} else {
			this.rightPanel.style.display = "none";
		};
	};
	
	setModal(modal, modalHeader, modalBody, modalButtons) {
		this.modal = modal;
		this.modalHeader = modalHeader;
		this.modalBody = modalBody;
		this.modalButtons = modalButtons;
	};
	
	showModalOpSelection() {
		// Set header/body
		this.modalHeader.textContent = "Operation selection";
		this.modalBody.textContent = "Retrieving list...";

		// Add buttons
/*		var playButton = document.createElement("div");
		playButton.className = "modalButton";
		playButton.textContent = "Play";
		var cancelButton = document.createElement("div");
		cancelButton.className = "modalButton";
		cancelButton.textContent = "Cancel";
		var hideModal = this.hideModal;
		cancelButton.addEventListener("click", function() {
			this.hideModal();
		});

		this.modalButtons.appendChild(cancelButton);
		this.modalButtons.appendChild(playButton);*/

		// Show modal
		this.showModal();
	};
	
	setModalOpList(data) {
		this.modalHeader.textContent = "Operation Selection";

		// Set body
		var table = document.createElement("table");
		var headerRow = document.createElement("tr");
		
		var columnNames = ["Mission", "Terrain", "Date", "Duration"];
		columnNames.forEach(function(name) {
			var th = document.createElement("th");
			th.textContent = name;
			th.className = "medium";
			headerRow.appendChild(th);
		});
		table.appendChild(headerRow);


		data.forEach((op) => {
			var row = document.createElement("tr");
			var cell = document.createElement("td");

			var vals = [
				op.mission_name,
				op.world_name,
				dateToLittleEndianString(new Date(op.date)),
				secondsToTimeString(op.mission_duration)
			];
			vals.forEach(function(val) {
				var cell = document.createElement("td");
				cell.textContent = val;
				row.appendChild(cell);
			});

			row.addEventListener("click", () => {
				this.modalHeader.textContent = "Processing...";
				processOp("data/" + op.filename);
				this.hideModal();
			});
			table.insertBefore(row, table.childNodes[1]);
		});
		this.modalBody.textContent = "";
		this.modalBody.appendChild(table);
	};
	
	makeModalButton(text, func) {
		var button = document.createElement("div");
		button.className = "modalButton";
		button.textContent = text;
		button.addEventListener("click", func);

		return button;
	};
	
	showModalAbout() {
		this.modalHeader.textContent = "About";
		
		this.modalBody.innerHTML = `
			<img src="images/ocap-logo.png" height="60px" alt="OCAP">
			<h4 style=line-height:0>${appDesc} (BETA)</h4>
			<h5 style=line-height:0>v${appVersion}</h5>
			Created by ${appAuthor}<br/>
			Originally made for <a href="http://www.3commandobrigade.com" target="_blank">3 Commando Brigade</a>
			<br/>
			<br/>
			<a href="" target="_blank">BI Forum Post</a><br/>
			<a href="" target="_blank">GitHub Link</a>
			<br/>
			<br/>
			Press space to play/pause<br/>
			Press E/R to hide/show side panels`;
		this.modalButtons.innerHTML = "";
		this.modalButtons.appendChild(this.makeModalButton("Close", function() {
			ui.hideModal();
		}));

		this.showModal();
	};
	
	showModal() {
		this.modal.style.display = "inherit";
	};
	
	hideModal() {
		this.modal.style.display = "none";
	};
	
	showPlaybackSpeedSlider() {
		this.playbackSpeedSlider.style.display = "inherit";
	};
	
	hidePlaybackSpeedSlider() {
		this.playbackSpeedSlider.style.display = "none";
	};
	
	removeEvent(event) {
		var el = event.getElement();

		// Remove element if not already removed
		if (el.parentNode != null) {
			this.eventList.removeChild(el);
		};
	};
	
	addEvent(event) {
		var el = event.getElement();

		// Add element if not already added
		if (el.parentNode == null) {
			this.eventList.insertBefore(el, this.eventList.childNodes[0]);

			// Fade element in if occured on current frame
			if (event.frameNum != playbackFrame) {
				el.className = "liEvent reveal";
			} else {
				el.className = "liEvent";
				setTimeout(() => {
					el.className = "liEvent reveal";
				}, 100);
			};
		};

/*		if (event.type == "hit") {
			if (this.showHitEvents) {
				el.style.display = "inherit";
			} else {
				el.style.display = "none";
			};
		};*/

		this.filterEvent(event);
	};
	
	showHint(text) {
		this.hint.textContent = text;
		this.hint.style.display = "inherit";

		setTimeout(() => {
			this.hint.style.display = "none";
		}, 5000);
	};
	
	addTickToTimeline(frameNum) {
		var frameWidth = this.frameSliderWidthInPercent / endFrame;
		var tick = document.createElement("div");

		tick.className = "eventTimelineTick";
		tick.style.left = (frameNum * frameWidth) + "%"; // We use percent so position of tick maintains even on window resize
		tick.style.width = frameWidth + "%";
		this.eventTimeline.appendChild(tick);
	};
	
	filterEvent(event) {
		var el = event.getElement();
		var filterText = this.filterEventsInput.value.toLowerCase();

		var isHitEvent = (event.type == "hit");

		//if (filterText == "") {return};

		//TODO: Use .textContent instead of .innerHTML for increased performance
		if (isHitEvent && !this.showHitEvents) {
			el.style.display = "none";
		} else if (el.innerHTML.toLowerCase().includes(filterText)) {
			el.style.display = "inherit";
			//console.log("Matches filter (" + filterText + ")");
		} else {
			el.style.display = "none";
		}
	};
};

class Groups {
	constructor() {
		this.groups = [];
	};

	addGroup(group) {
		this.groups.push(group);
	};

	getGroups() {
		return this.groups;
	};

	removeGroup(group) {
		var index = this.groups.indexOf(group);
		this.groups.splice(index, 1);
	};

	// Find group by name and side
	findGroup(name, side) {
		//console.log("Finding group with name: " + name + ", side: " + side);

		if (this.groups.length == 0) {
			//console.log("Group does not exist (list empty)!");
			return;
		};

		for (let i = 0; i < this.groups.length; i++) {
			var group = this.groups[i];
			//console.log("Comparing with group name: " + group.name + ", side: " + group.side);
			
			if ((group.getName() == name) && (group.getSide() == side)) {
				//console.log("Group exists!");
				return group;
			};
		};

		//console.log("Group does not exist!");
		return;
	};
};

class Group {
	constructor(name, side) {
		this.name = name;
		this.side = side;
		this.units = [];
		this.element = null; // DOM element associated with this group
	}

	getSide() {
		return this.side;
	};

	getName() {
		return this.name;
	};

	getUnits() {
		return this.units;
	};

	setElement(el) {
		this.element = el;
	};

	getElement() {
		return this.element;
	};

	getSize() {
		return this.units.length;
	};

	getUnits() {
		return this.units;
	};

	getUnit(unit) {
		return this.units[this.units.indexOf(unit)];
	};

	// Add unit to group (if not already added)
	addUnit(unit) {
		if (this.units.indexOf(unit) != -1) {return};
		
		var wasEmpty = this.isEmpty();
		this.units.push(unit);

		if (wasEmpty) {
			this.makeElement(); // Make element for group
			groups.addGroup(this); // Add self to groups list
		};

		// Make element for unit too
		unit.makeElement(this.getElement());
	};

	// Remove unit from group (if not already removed)
	removeUnit(unit) {
		var index = this.units.indexOf(unit);
		if (index == -1) {return};

		this.units.splice(index, 1);

		//console.log(this.name + ": removed " + unit.getName() + ". Remaining: " + this.getSize());

		// Handle what to do if group empty
		if (this.isEmpty()) {
			groups.removeGroup(this); // Remove self from global groups object
			this.removeElement();
		};

		// Remove element for unit too
		unit.removeElement();
	};

	// Remove element from UI groups list
	removeElement() { 
		this.element.parentElement.removeChild(this.element);
		this.setElement(null);
	};

	makeElement() { // Make and add element to UI groups list
		var targetList;

		switch (this.getSide()) {
			case "WEST":
				targetList = ui.listWest;
				break;
			case "EAST":
				targetList = ui.listEast;
				break;
			case "GUER":
				targetList = ui.listGuer;
				break;
			case "CIV":
				targetList = ui.listCiv;
				break;
			default:
				targetList = ui.listCiv;
		};

		// Create DOM element
		var liGroup = document.createElement("li");
		liGroup.className = "liGroup";
		liGroup.textContent = this.getName();
		var group = this;
		//liGroup.addEventListener("click", function() {console.log(group.getUnits())});
		this.setElement(liGroup);
		targetList.appendChild(liGroup);
	};

	isEmpty() {
		return this.units.length == 0;
	};
};

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
class HitKilledEvent {
	constructor(frameNum, type, causedBy, victim, distance, weapon) {
		this.frameNum = frameNum; // Frame number that event occurred
		this.timecode = dateToTimeString(new Date(frameNum*frameCaptureDelay));
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
		detailsDiv.className = "eventDetails";
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
			let targetFrame = this.frameNum - playbackMultiplier;
			let latLng = this.victim.getLatLngAtFrame(targetFrame);
			
			// Rare case: victim did not exist at target frame, fallback to event frame
			if (latLng == null) {
				targetFrame = this.frameNum;
				latLng = this.victim.getLatLngAtFrame(targetFrame);
			};

			ui.setMissionCurTime(targetFrame);
			//map.setView(latLng, map.getZoom());
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
		this.timecode = dateToTimeString(new Date(frameNum*frameCaptureDelay));
		this.type = type;
		this.unitName = unitName;
		this._element = null;

		// Create list element for this event (for later use)
		var span = document.createElement("span");
		span.className = "medium";
		span.textContent = this.unitName + " " + this.type;

		var detailsDiv = document.createElement("div");
		detailsDiv.className = "eventDetails";
		detailsDiv.textContent = this.timecode;

		var li = document.createElement("li");
		li.appendChild(span);
		li.appendChild(detailsDiv);
		this._element = li;
	};

	getElement() {return this._element};
};

var imageSize = null;
var multiplier = null;
var trim = 0; // Number of pixels that were trimmed when cropping image (used to correct unit placement)
var mapMinZoom = 1;
var mapMaxNativeZoom = 6;
var mapMaxZoom = mapMaxNativeZoom+3;
var map = null;
var mapDiv = null;
var mapPanes = null;
var frameCaptureDelay = 1000; // Delay between capture of each frame in-game (ms). Default: 1000
var playbackMultiplier = 10; // Playback speed. 1 = realtime.
var maxPlaybackMultipler = 60; // Max speed user can set playback to
var minPlaybackMultipler = 1; // Min speed user can set playback to
var playbackMultiplierStep = 1; // Playback speed slider increment value
var playbackPaused = true;
var playbackFrame = 0;
var entityToFollow = null; // When set, camera will follow this unit
var ui = null;
var entities = new Entities();
var groups = new Groups();
var gameEvents = new GameEvents();
var worlds = null;

// Mission details
var worldName = "";
var missionName = "";
var endFrame = 0;
var missionCurDate = new Date(0);

// Icons
var icons = null;
var followColour = "#FFA81A";
var hitColour = "#FF0000";
var deadColour = "#000000";

function initOCAP() {
	mapDiv = document.getElementById("map");
	defineIcons();
	ui = new UI();
	ui.setModalOpList(opList);
	setWorlds();

	window.addEventListener("keypress", function(event) {
		switch (event.charCode) {
			case 32: // Spacebar
				event.preventDefault(); // Prevent space from scrolling page on some browsers
				break;
		};
	});
};

function setWorlds() {
	let jsonPath = "images/maps/maps.json";

	console.log("Getting worlds from " + jsonPath);
	$.getJSON(jsonPath, function(data) {
		worlds = data;
	});
};

function getWorldByName(worldName) {
	console.log("Getting world " + worldName);
	
	for (let i = 0; i < worlds.length; i++) {
		var world = worlds[i];
		if (world.worldName.toLowerCase() == worldName) {
			return world;
		};
	};
};

function initMap() {
	// Create map
	map = L.map('map', {
		//maxZoom: mapMaxZoom,
		zoomControl: false,
		zoomAnimation: true,
		scrollWheelZoom: false,
		fadeAnimation: true,
		crs: L.CRS.Simple,
		attributionControl: false,
		zoomSnap: 0.1,
		zoomDelta: 1,
		closePopupOnClick: false
	}).setView([0,0], mapMaxNativeZoom);

	mapPanes = map.getPanes();

	// Hide marker popups once below a certain zoom level
	map.on("zoom", function() {
		if (map.getZoom() <= 7) {
			ui.hideMarkerPopups = true;
		} else {
			ui.hideMarkerPopups = false;
		};
	});

	var world = getWorldByName(worldName);
	console.log("Got world: ");
	console.log(world);
	if (world == null) {
		ui.showHint(`Error: Map "${worldName}" is not installed`);
	};

	imageSize = world.imageSize;
	multiplier = world.multiplier;
	map.setView(map.unproject([imageSize/2, imageSize/2]), mapMinZoom);
	
	var mapBounds = new L.LatLngBounds(
		map.unproject([0, imageSize], mapMaxNativeZoom),
		map.unproject([imageSize, 0], mapMaxNativeZoom)
	);
	map.fitBounds(mapBounds);

	// Setup tile layer
	L.tileLayer('images/maps/' + worldName + '/{z}/{x}/{y}.png', {
		maxNativeZoom: mapMaxNativeZoom,
		maxZoom: mapMaxZoom,
		minZoom: mapMinZoom,
		bounds: mapBounds,
		//attribution: 'MisterGoodson',
		noWrap: true,
		tms: false
	}).addTo(map);

	// Add keypress event listener
	mapDiv.addEventListener("keypress", function(event) {
		//console.log(event);

		switch (event.charCode) {
			case 32: // Spacebar
				playPause();
				break;
		};
	});

	// Add custom handling for mousewheel zooming
	// Prevents map blurring when zooming in too quickly
	mapDiv.addEventListener("wheel", function(event) {
/*		// We pause playback while zooming to prevent icon visual glitches
		if (!playbackPaused) {
			playbackPaused = true;
			setTimeout(function() {
				playbackPaused = false;
			}, 250);
		};*/
		console.log(event);
		var zoom;
		if (event.deltaY > 0) {zoom = -0.5} else {zoom = 0.5};
		map.zoomIn(zoom, {animate: false});
	});

	map.on("dragstart", function() {
		if (entityToFollow != null) {
			entityToFollow.unfollow();
		};
	});

	createInitialMarkers();
	//test();
};

function createInitialMarkers() {
/*	setTimeout(function() {
		let svg = marker.getElement().contentDocument;
		let g = svg.getElementById("layer1");
		console.log();

		g.setAttribute('fill', 'yellow');
	}, 100);*/

	entities.getAll().forEach(function(entity) {
		// Create and set marker for unit
		var pos = entity.getPosAtFrame(0);
		if (pos != null) { // If unit did exist at start of game
			entity.createMarker(armaToLatLng(pos));
		};
	});
};

function defineIcons() {
	icons = {
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

	let imgPathMan = "images/markers/man/man-";
	let imgPathShip = "images/markers/ship/ship-";
	let imgPathParachute = "images/markers/parachute/parachute-";
	let imgPathHeli = "images/markers/heli/heli-";
	let imgPathPlane = "images/markers/plane/plane-";
	let imgPathTruck = "images/markers/truck/truck-";
	let imgPathCar = "images/markers/car/car-";
	let imgPathApc = "images/markers/apc/apc-";
	let imgPathTank = "images/markers/tank/tank-";
	let imgPathStaticMortar = "images/markers/static-mortar/static-mortar-";
	let imgPathStaticWeapon = "images/markers/static-weapon/static-weapon-";
	let imgPathUnknown = "images/markers/unknown/unknown-";

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
};

function goFullscreen() {
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

// Converts Arma coordinates [x,y] to LatLng
function armaToLatLng(coords) {
	var pixelCoords = [(coords[0]*multiplier)+trim, (imageSize-(coords[1]*multiplier))+trim];
	return map.unproject(pixelCoords, mapMaxNativeZoom);
};

// Returns date object as little endian (day, month, year) string 
function dateToLittleEndianString(date) {
	return (date.getDate() + "/" + (date.getMonth()+1) + "/" + date.getFullYear());
};

function test() {
	// Add marker to map on click
	map.on("click", function(e) {
		//console.log(e.latlng);
		console.log(map.project(e.latlng, mapMaxNativeZoom));
		var marker = L.circleMarker(e.latlng).addTo(map);
		marker.setRadius(5);
	});

	var marker = L.circleMarker(armaToLatLng([2438.21,820])).addTo(map);
	marker.setRadius(5);

	var marker = L.circleMarker(armaToLatLng([2496.58,5709.34])).addTo(map);
	marker.setRadius(5);
};

function dateToTimeString(date) {
	var hours = date.getUTCHours();
	var minutes = date.getUTCMinutes();
	var seconds = date.getUTCSeconds();
	var string = "";

/*	if (hours < 10) {
		string += "0";
	}*/
	string += (hours + ":");

	if (minutes<10) {
		string += "0";
	}
	string += (minutes + ":");

	if (seconds<10) {
		string+= "0";
	};
	string += seconds;

	return string;
};

// Convert time in seconds to a more readable time format
// e.g. 121 seconds -> 2 minutes
// e.g. 4860 seconds -> 1 hour, 21 minutes
function secondsToTimeString(seconds) {
	let mins =  Math.round(seconds/60);

	if (mins < 60) {
		let minUnit = (mins > 1 ? "mins" : "min");
		
		return `${mins} ${minUnit}`;
	} else {
		let hours = Math.floor(mins/60);
		let remainingMins = mins % 60;
		let hourUnit = (hours > 1 ? "hrs" : "hr");
		let minUnit = (remainingMins > 1 ? "mins" : "min");

		return `${hours} ${hourUnit}, ${remainingMins} ${minUnit}`;
	};
};

// Read operation JSON data and create unit objects
function processOp(filepath) {
	console.log("Processing operation: (" + filepath + ")...");
	var time = new Date();

	$.getJSON(filepath, function(data) {
		worldName = data.worldName.toLowerCase();
		missionName = data.missionName;
		ui.setMissionName(missionName);

		endFrame = data.endFrame;
		ui.setMissionEndTime(endFrame);

		// Loop through entities
		data.entities.forEach(function(entityJSON) {
			//console.log(entityJSON);

			let type = entityJSON.type;
			let startFrameNum = entityJSON.startFrameNum;
			let id = entityJSON.id;
			let name = entityJSON.name;

			// Convert positions into array of objects
			let positions = [];
			entityJSON.positions.forEach(function (entry) {
				let pos = entry[0];
				let dir = entry[1];
				let alive = (entry[2] == 1);

				if (type == "unit") {
					positions.push({position: pos, direction: dir, alive: alive, isInVehicle: (entry[3] == 1)});
				} else {
					positions.push({position: pos, direction: dir, alive: alive, crew: entry[3]});
				};
			});

			if (type == "unit") {
				//if (entityJSON.name == "Error: No unit") {return}; // Temporary fix for old captures that initialised dead units

				// Add group to global groups object (if new)
				var group = groups.findGroup(entityJSON.group, entityJSON.side);
				if (group == null) {
					group = new Group(entityJSON.group, entityJSON.side);
					groups.addGroup(group);
				};

				// Create unit and add to entities list
				var unit = new Unit(startFrameNum, id, name, group, entityJSON.side, (entityJSON.isPlayer == 1), positions, entityJSON.framesFired);
				entities.add(unit);
			} else {
				// Create vehicle and add to entities list
				var vehicle = new Vehicle(startFrameNum, id, entityJSON.class, name, positions);
				entities.add(vehicle);
			};
		});

		// Loop through events
		data.events.forEach(function(eventJSON) {
			var frameNum = eventJSON[0];
			var type = eventJSON[1];

			var gameEvent = null;
			switch (true) {
				case (type == "killed" || type == "hit"):
					var causedByInfo = eventJSON[3];
					var victim = entities.getById(eventJSON[2]);
					var causedBy = entities.getById(causedByInfo[0]); // In older captures, this will return null
					var distance = eventJSON[4];

					//console.log(eventJSON[2]);
					//if (victim == null) {return}; // Temp fix until vehicles are handled (victim is null if reference is a vehicle)
					
					// Create event object
					var weapon;
					if (causedBy instanceof Unit) {
						weapon = causedByInfo[1];
					} else {
						weapon = "N/A";
					};
					gameEvent = new HitKilledEvent(frameNum, type, causedBy, victim, distance, weapon);

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

		console.log("Finished processing operation (" +(new Date() - time) + "ms).");
		initMap();
		startPlaybackLoop();
		toggleHitEvents(false);
		playPause();
	}).fail(function() {
		ui.showHint(`Error: "${filepath}" could not be found`);
	});
};

function playPause() {
	playbackPaused = !playbackPaused;

	if (playbackPaused) {
		playPauseButton.style.backgroundPosition = "0 0";
	} else {
		playPauseButton.style.backgroundPosition = `-${playPauseButton.offsetWidth}px 0`;
	};
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
		if (!playbackPaused && !(playbackFrame == endFrame)) {

			requestAnimationFrame(() => {
				// Remove killines & firelines from last frame
				killlines.forEach(function(line) {
					map.removeLayer(line);
				});
				firelines.forEach(function(line) {
					map.removeLayer(line);
				});
				
				entities.getAll().forEach(function playbackEntity(entity) {
					//console.log(entity);
					entity.manageFrame(playbackFrame);

					if (entity instanceof Unit) {
						// Draw fire line (if enabled)
						var projectilePos = entity.firedOnFrame(playbackFrame);
						if (projectilePos != null && ui.firelinesEnabled) {
							console.log(entity);
							console.log(`Shooter pos: ${entity.getLatLng()}\nFired event: ${projectilePos} (is null: ${projectilePos == null})`);
							var line = L.polyline([entity.getLatLng(), armaToLatLng(projectilePos)], {
								color: entity.getSideColour(),
								weight: 2,
								opacity: 0.4
							});
							line.addTo(map);
							firelines.push(line);
						};
					};
				});

				// Display events for this frame (if any)
				gameEvents.getEvents().forEach(function playbackEvent(event) {

					// Check if event is supposed to exist by this point
					if (event.frameNum <= playbackFrame) {
						ui.addEvent(event);

						// Draw kill line
						if (event.frameNum == playbackFrame) {
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
										line.addTo(map);
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

				// Handle entityToFollow
				if (entityToFollow != null) {
					var pos = entityToFollow.getPosAtFrame(playbackFrame);
					if (pos != null) {
						map.setView(armaToLatLng(pos), map.getZoom());
					} else { // Unit has died or does not exist, unfollow
						entityToFollow.unfollow();
					};
				};

				playbackFrame++;
				if (playbackFrame == endFrame) {playbackPaused = true};
				ui.setMissionCurTime(playbackFrame);
			});
		};

		// Run timeout again (creating a loop, but with variable intervals)
		playbackTimeout = setTimeout(playbackFunction, frameCaptureDelay/playbackMultiplier);
	};

	var playbackTimeout = setTimeout(playbackFunction, frameCaptureDelay/playbackMultiplier);
};