export const unitSchema = {
	HEADER: 0,
	header: {
		IS_UNIT: 0,
		ID: 1,
		NAME: 2,
		GROUP_NAME: 3,
		SIDE: 4,
		IS_PLAYER: 5
	},
	STATES: 1,
	state: {
		POSITION: 0,
		DIRECTION: 1,
		IS_ALIVE: 2,
		IS_IN_VEHICLE: 3,
	},
	FRAMES_FIRED: 2
};

export const elementId = {
	MAP: 'map'
};

export const className = {
	LEAFLET_MARKER_ICON: 'leaflet-marker-icon',
}

export const MAPS_PATH = 'static/images/maps';

export const MARKERS_PATH = 'static/images/markers';

export const MAX_NATIVE_ZOOM = 6;

export const MAX_ZOOM = MAX_NATIVE_ZOOM + 2;
