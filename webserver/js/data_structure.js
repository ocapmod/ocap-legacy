/**
 * Enums that specify object keys/array indexes of capture data.
 *
 * Since Arma has no concept of object literals/dictionaries, data is stored
 * as arrays. Thus, the capture data consists of many arrays within arrays. To
 * make accessing this data clearer, we specify here the indexes of each array
 * element and its meaning.
 */

// Enum
export const DataIn = {
	ENTITIES: 'entities',
	EVENTS: 'events',
	WORLD_NAME: 'worldName',
	MISSION_NAME: 'missionName',
	AUTHOR: 'author',
	CAPTURE_DELAY: 'capture_delay',
	FRAME_COUNT: 'frameCount',

	Entity: {
		HEADER: 0,
		STATES: 1,
		FRAMES_FIRED: 2,

		Header: {
			IS_UNIT: 0,
			ID: 1,
			NAME: 2,
			GROUP_ID: 3,
			CLASS: 3,
			SIDE: 4,
			IS_PLAYER: 5,
		},

		State: {
			POSITION: 0,
			DIRECTION: 1,
			IS_ALIVE: 2,
			IS_IN_VEHICLE: 3,
			CREW_IDS: 3,
		},

		FramesFired: {
			FRAME_NUM: 0,
			POSITION: 1,
		},
	},

	Event: {
		FRAME_NUM: 0,
		TYPE: 1,
		VICTIM_ID: 2,
		ATTACKER_INFO: 3,
		DISTANCE: 4,

		AttackerInfo: {
			ID: 0,
			WEAPON_NAME: 1,
		},
	},
};