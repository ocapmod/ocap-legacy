import { Unit, Vehicle, Capture, World } from './models';
import { unitSchema } from './constants';


export class Serializer {

	_deserializeUnit(json, map) {
		const header = json[unitSchema.HEADER];
		const states = json[unitSchema.STATES];
		const framesFired = json[unitSchema.FRAMES_FIRED];

		let stateObjs = [];
		for (const frameIndex in states) {
			const state = states[frameIndex];
			let position = state[unitSchema.state.POSITION]
			stateObjs.push({
				position: map.armaPositionToLatLng(position),
				direction: state[unitSchema.state.DIRECTION],
				isAlive: Boolean(state[unitSchema.state.IS_ALIVE]),
				isInVehicle: Boolean(state[unitSchema.state.IS_IN_VEHICLE]),
			});
		};

		return new Unit(
			header[unitSchema.header.ID],
			header[unitSchema.header.NAME],
			header[unitSchema.header.GROUP_NAME],
			header[unitSchema.header.SIDE],
			Boolean(header[unitSchema.header.IS_PLAYER]),
			stateObjs,
			framesFired,
			map
		);
	}

	_deserializeVehicle(json) {
		// TODO
	}

	deserializeCapture(json, map) {
		let entities = json.entities;
		let events = json.events;
		let units = [];
		let vehicles = [];

		for (const entity of entities) {
			const header = entity[unitSchema.HEADER];
			if (Boolean(header[unitSchema.header.IS_UNIT])) {
				units.push(this._deserializeUnit(entity, map));
			} else {
				//vehicles.push(this._deserializeVehicle(entity));
			}
		}

		return new Capture(
			json.captureId,
			json.worldName,
			json.missionName,
			json.author,
			json.captureDelay * 1000,
			json.frameCount,
			units,
			vehicles,
			events,
		);
	}

	deserializeWorld(json) {
		return new World(
			json.name,
			json.worldName,
			json.worldSize,
			json.imageSize,
			json.multiplier
		);
	}
}