import * as constants from './constants';

export class Utility {
	async fetchJson(url) {
		const response = await fetch(url);
		return await response.json();
	};
}