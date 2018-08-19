import { Map, World } from './models';
import { Serializer } from './serializers';
import { Utility } from './utils';
import * as constants from './constants';


const serializer = new Serializer();
const util = new Utility();
let capture = null;
let map = null;
let world = null;

async function main() {
	const captureJson = await util.fetchJson('static/captures/large_120_frame.json');
	const worldJson = await util.fetchJson(`static/images/maps/${captureJson.worldName}/meta.json`);

	// Deserialize world
	world = serializer.deserializeWorld(worldJson);
	console.log('Deserialized world:');
	console.log(world);

	// Setup map
	map = new Map(
		constants.elementId.MAP,
		constants.MAX_ZOOM,
		constants.MAX_NATIVE_ZOOM,
		world
	);

	// Deserialize capture
	capture = serializer.deserializeCapture(captureJson, map);
	console.log('Deserialized capture:');
	console.log(capture);

	// Start playback loop
	requestAnimationFrame(() => {
		playFrame(0, capture.endFrameIndex, capture.units, capture.vehicles, 300); // TODO: Use correct delay based on playback speed
	});
};

function playFrame(frameIndex, endFrameIndex, units, vehicles, delay) {
	console.log(`Frame ${frameIndex}`);
	for (const unit of units) {
		if (!(frameIndex in unit.states)) continue; // TODO: Remove any existing marker from map
		const state = unit.states[frameIndex];
		unit.setPosition(state.position);
	};

	if (frameIndex == endFrameIndex) return;
	setTimeout(() => {
		requestAnimationFrame(() => {
			playFrame(frameIndex + 1, endFrameIndex, units, vehicles, delay);
		});
	}, delay);
}

main();