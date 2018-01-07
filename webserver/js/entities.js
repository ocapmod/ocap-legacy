import {globals} from './globals';
import {ui} from './ui';
import * as services from './services';

let icons = globals.icons;

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

class Entity {
	constructor(startFrameNum, id, name, positions) {
    if (this.constructor === Entity) {
      throw new TypeError('Abstract class "Entity" cannot be instantiated directly.'); 
    }
		
		this._startFrameNum = startFrameNum;
		this._id = id;
		this._name = name;
		this._states = positions; // pos, dir, alive
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
		var notExistAnymore = f >= (this._states.length-1); // Unit dead/doesn't exist anymore
		if (notExistYet || notExistAnymore) { 
			return;
		} else {
			return this._states[f].position;
		};
	};

	// Get LatLng at specific frame
	getLatLngAtFrame(f) {
		var pos = this.getPosAtFrame(f);
		if (pos != null) {return services.armaToLatLng(pos)};
		return;
	};

	// Get LatLng at current frame
	getLatLng() {
		return this.getLatLngAtFrame(globals.playbackFrame);
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
		let marker = L.marker(latLng).addTo(globals.map);
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
			globals.map.removeLayer(marker);
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
		return (relativeFrameIndex >= this._states.length);
	};

	// Is relativeFrameIndex out of bounds
	isFrameOutOfBounds(relativeFrameIndex) {
		return ((this._notExistYet(relativeFrameIndex)) || (this._notExistAnymore(relativeFrameIndex)));
	};

	// Update entiy position, direction, and alive status at valid frame
	_updateAtFrame(relativeFrameIndex) {
		// Set pos
		let latLng = services.armaToLatLng(this._states[relativeFrameIndex].position);
		if (this._marker == null) { // First time unit has appeared on map
			this.createMarker(latLng);
		} else {
			this._marker.setLatLng(latLng);
		};

		// Set direction
		this._marker.setRotationAngle(this._states[relativeFrameIndex].direction);

		// Set alive status
		this.setAlive(this._states[relativeFrameIndex].alive);
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
		}, (globals.frameCaptureDelay/globals.playbackMultiplier) * framesToSpan);
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
		if (globals.entityToFollow != null) {globals.entityToFollow.unfollow()}; // Unfollow current followed entity (if any)
		
		let icon = this.iconType.follow;
		this.setMarkerIcon(icon);
		this._tempIcon = icon;
		globals.entityToFollow = this;
	};

	// Reset unit's marker colour and clear globals.entityToFollow
	unfollow() {
		this._lockMarkerIcon = false;

		let marker = this.getMarker();
		if (marker != null) {
			this.setMarkerIcon(this._tempIcon);
		};
		globals.entityToFollow = null;
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
		console.log('Real icon:');
		console.log(this._realIcon);
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
		this.setIsInVehicle(this._states[relativeFrameIndex].isInVehicle);
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
		for (let i = 0; i < (this._framesFired.length - 1); i++) {
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
				globals.map.setView(marker.getLatLng(), globals.map.getZoom(), {animate: true});
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
		this.setCrew(this._states[relativeFrameIndex].crew);
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

const entities = new Entities();
export {entities, Entities, Unit, Vehicle};