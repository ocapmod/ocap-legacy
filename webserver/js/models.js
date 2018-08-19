import * as constants from './constants';
import defaultExport from 'leaflet';


export class Capture {
	constructor(id, worldName, missionName, author, frameDelay, endFrameIndex, units, vehicles, events) {
		this.id = id;
		this.worldName = worldName;
		this.missionName = missionName;
		this.author = author;
		this.frameDelay = frameDelay;
		this.endFrameIndex = endFrameIndex;
		this.units = units;
		this.vehicles = vehicles;
		this.events = events;
	}
}

export class World {
	constructor(name, className, size, imageSize, multiplier) {
		this.name = name;
		this.className = className;
		this.size = size;
		this.imageSize = imageSize;
		this.multiplier = multiplier;
	}
}

class Entity {
	constructor(id) {
		this.id = id;
	}
}

export class Unit extends Entity {
	constructor(id, name, groupName, side, isPlayer, states, framesFired, map) {
		super(id);
		this.name = name;
		this.groupName = groupName;
		this.side = side;
		this.isPlayer = isPlayer;
		this.states = states;
		this.framesFired = framesFired;
		this._map = map;
		this._marker = null;
		this._icon = L.icon({
			iconUrl: `${constants.MARKERS_PATH}/man/man-blufor.svg`, // TODO: Use correct icon
		});
	}

	/**
	 * Sets the position of the unit on the map.
	 *
	 * @param {L.LatLng} latLng
	 * @param {L.Icon} [icon]
	 * @param {string} [origin]
	 */
	setPosition(latLng) {
		if (this._marker == null) {
			this._marker = this._map.createMarker(latLng, this._icon);
		} else {
			this._marker.setLatLng(latLng);
		};
	}
}

export class Vehicle extends Entity {
	// TODO: Finish this class
	constructor() {};
}

export class Map {
	constructor(elementId, maxZoom, maxNativeZoom, world) {
		const minZoom = 1;
		const map = L.map(elementId, {
			attributionControl: false,
			closePopupOnClick: false,
			crs: L.CRS.Simple,
			zoomControl: false,
			zoomDelta: 1,
			zoomSnap: 0.1,
			scrollWheelZoom: false,
		}).setView([0,0], maxNativeZoom);

		map.setView(map.unproject([world.imageSize/2, world.imageSize/2]), minZoom);

		const mapBounds = new L.LatLngBounds(
			map.unproject([0, world.imageSize], maxNativeZoom),
			map.unproject([world.imageSize, 0], maxNativeZoom)
		);
		map.fitBounds(mapBounds);

		// Setup tile layer
		L.tileLayer(`${constants.MAPS_PATH}/${world.className}/{z}/{x}/{y}.png`, {
			maxNativeZoom: maxNativeZoom,
			maxZoom: maxZoom,
			minZoom: minZoom,
			bounds: mapBounds,
			noWrap: true,
			tms: false
		}).addTo(map);

		this._maxZoom = maxZoom;
		this._maxNativeZoom = maxNativeZoom;
		this._map = map;
		this._element = this._map.getContainer();
		this._world = world;
		this._markers = null;

		this.addEventListeners();
	}

	addEventListeners() {
		this._map.on('zoomstart', () => {
			this._markers = document.getElementsByClassName(constants.className.LEAFLET_MARKER_ICON);
			for (const icon of this._markers) {
				icon.style.transitionDuration = '0s';
			};
		});

		this._map.on('zoomend', () => {
			setTimeout(() => {
				for (const icon of this._markers) {
					icon.style.transitionDuration = '1s'; // TODO: Set correct duration according to delay between frame playback
				};
			}, 1);
		});

		// Add custom handling for map zooming
		// Prevents marker positions from glitching on zoom
		this._element.addEventListener("wheel", (event) => {
			let zoomDelta = (event.deltaY <= 0) ? 1 : -1;
			this._map.zoomIn(zoomDelta, {animate: false});
		});
	}

	/**
	 * Creates a map marker and adds to map.
	 *
	 * @param {L.LatLng} latLng
	 * @param {L.Icon} icon
	 * @param {string} [origin]
	 * @returns {L.Marker}
	 */
	createMarker(latLng, icon, origin = "50% 50%") {
		const marker = L.marker(latLng).addTo(this._map);
		marker.setIcon(icon);
		marker._icon.style.transitionDuration = '1s'; // TODO: Set correct duration according to delay between frame playback
		//marker.setRotationOrigin(origin);
		return marker;
	}

	/**
	 * Converts an Arma position to a LatLng object.
	 *
	 * @param {number[]} position
	 * @returns {L.LatLng}
	 */
	armaPositionToLatLng(position) {
		const multiplier = this._world.multiplier;
		const x = position[0] * multiplier;

		// Flip Y origin from bottom (Arma) to top (Leaflet)
		const y = this._world.imageSize - (position[1] * multiplier);

		return this._map.unproject([x, y], this._maxNativeZoom);
	};
}