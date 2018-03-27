/*
	Singleton UI module
*/

import * as constants from './constants';
import {globals} from './globals';
import * as app from './app';
import * as services from './services';


class UI {
	constructor() {
		this.aboutButton = null;
		this.bottomPanel = null;
		this.container = null;
		this.cursorTargetBox = null;
		this.cursorTooltip = null;
		this.eventList = null;
		this.eventTimeline = null;
		this.filterEventsInput = null;
		this.filterHitEventsButton = null;
		this.firelinesEnabled = true;
		this.frameSlider = null;
		this.frameSliderWidthInPercent = -1;
		this.fullscreenButton = null;
		this.hideMarkerPopups = false;
		this.hint = null;
		this.leftPanel = null;
		this.listCiv = null;
		this.listEast = null;
		this.listGuer = null;
		this.listWest = null;
		this.loadOpButton = null;
		this.mapDiv = document.getElementById("map");
		this.missionCurTime = null;
		this.missionEndTime = null;
		this.missionName = null;
		this.modal = null;
		this.modalContainer = null;
		this.modalBody = null;
		this.modalButtons = null;
		this.modalHeader = null;
		this.playbackSpeedSlider = null;
		this.playbackSpeedSliderContainer = null;
		this.playbackSpeedVal = null;
		this.playPauseButton = null;
		this.rightPanel = null;
		this.showHitEvents = true;
		this.toggleFirelinesButton = null;

		this._init();
	};

	_init() {
		this.container = document.getElementById('container');

		// Setup top panel
		this.missionName = document.getElementById("mission-name");

		// Load operation button
		var loadOpButton = document.getElementById("load-op-button");
		loadOpButton.addEventListener("click", function() {
			location.reload();
		});
		this.loadOpButton = loadOpButton;

		// About button
		var aboutButton = document.getElementById("about-button");
		aboutButton.addEventListener("click", () => {
			this.showModalAbout();
		});
		this.aboutButton = aboutButton;

		// Toggle firelines button
		var toggleFirelinesButton = document.getElementById(
				"toggle-firelines-button");
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
		this.leftPanel = document.getElementById("left-panel");

		// Define group side elements
		this.listWest = document.getElementById("list-west");
		this.listEast = document.getElementById("list-east");
		this.listGuer = document.getElementById("list-ind");
		this.listCiv = document.getElementById("list-civ");

		// Setup right panel
		this.rightPanel = document.getElementById("right-panel");
		this.eventList = document.getElementById("event-list");
		this.filterHitEventsButton = document.getElementById(
				"filter-hit-events-button");
		this.filterHitEventsButton.addEventListener("click", () => {
			toggleHitEvents();
		});
		this.filterEventsInput = document.getElementById("filter-events-input");

		// Cursor target box
		this.cursorTargetBox = document.getElementById("cursor-target-box");

		// Cursor tooltip
		let cursorTooltip = document.createElement("div");
		cursorTooltip.className = "cursorTooltip";
		document.body.appendChild(cursorTooltip);
		this.cursorTooltip = cursorTooltip;

		// Setup bottom panel
		this.bottomPanel = document.getElementById("bottom-panel");
		this.missionCurTime = document.getElementById("mission-cur-time");
		this.missionEndTime = document.getElementById("mission-end-time");
		this.frameSlider = document.getElementById("frame-slider");
		this.frameSlider.addEventListener("input", (event) => {
			var val = event.srcElement.value;
			this.setMissionCurTime(val);
		});
		this.playPauseButton = document.getElementById("play-pause-button");
		this.playPauseButton.addEventListener('click', () => {
			console.log('Play/pause button clicked');
			app.playPause();
		});

		// Events timeline
		this.eventTimeline = document.getElementById("event-timeline");

		// Hide/show ui on keypress
		this.mapDiv.addEventListener("keypress", (event) => {

			switch (event.charCode) {
				case constants.CharCode.E: // e
					this.toggleLeftPanel();
					break;
				case constants.CharCode.R: // r
					this.toggleRightPanel();
					break;
			};
		});

		// Add keypress event listener
		this.mapDiv.addEventListener("keypress", function(event) {
			switch (event.charCode) {
				case constants.CharCode.SPACE: // Spacebar
					app.playPause();
					break;
			};
		});

		// Add custom handling for mousewheel zooming
		// Prevents map blurring when zooming in too quickly
		this.mapDiv.addEventListener("wheel", function(event) {
			var zoom;
			if (event.deltaY > 0) {zoom = -0.5} else {zoom = 0.5};
			globals.map.zoomIn(zoom, {animate: false});
		});

		// Modal
		this.setModal(
			document.getElementById("modal-container"),
			document.getElementById("modal"),
			document.getElementById("modal-header"),
			document.getElementById("modal-body"),
			document.getElementById("modal-buttons")
		);
		this.showModalOpSelection();

		// Small popup
		this.hint = document.getElementById("hint");

		// Playback speed slider
		this.playbackSpeedSliderContainer = document.getElementById(
				"playback-speed-slider-container");
		this.playbackSpeedSlider = document.getElementById("playback-speed-slider");

		this.playbackSpeedVal = document.getElementById("playback-speed-val");
		this.playbackSpeedVal.textContent = globals.playbackMultiplier + "x";
		this.playbackSpeedVal.addEventListener("mouseover", () => {
			this.showPlaybackSpeedSlider();
		});
		this.playbackSpeedSliderContainer.addEventListener("mouseleave", () => {
			this.hidePlaybackSpeedSlider();
		});

		this.playbackSpeedSlider.max = globals.maxPlaybackMultipler;
		this.playbackSpeedSlider.min = globals.minPlaybackMultipler;
		this.playbackSpeedSlider.step = globals.playbackMultiplierStep;
		this.playbackSpeedSlider.value = globals.playbackMultiplier;
		this.playbackSpeedSlider.addEventListener("input", () => {
			let sliderVal = this.playbackSpeedSlider.value;
			this.playbackSpeedVal.textContent = sliderVal + "x";
			globals.playbackMultiplier = sliderVal;
		});

		this.frameSliderWidthInPercent = (
			(this.frameSlider.offsetWidth /
			this.frameSlider.parentElement.offsetWidth)
			* 100
		);

		this.fullscreenButton = document.getElementById('fullscreen-button');
		this.fullscreenButton.addEventListener('click', services.goFullscreen);
	};

	showCursorTooltip(text) {
		let tooltip = this.cursorTooltip;
		tooltip.textContent = text;
		tooltip.className = "cursor-tooltip";

		// Attach text to cursor. Remove after timeout
		this.mapDiv.addEventListener("mousemove", this._moveCursorTooltip);
		setTimeout(() => {
			tooltip.className = "cursor-tooltip hidden";

			// Remove listener once opacity transition ended
			tooltip.addEventListener("transitionend", () => {
				this.mapDiv.removeEventListener("mousemove", this._moveCursorTooltip);
			});
		}, 2500);
		console.log(this.cursorTooltip);
	};

	_moveCursorTooltip(event) {
		ui.cursorTooltip.style.transform = `
				translate3d(${event.pageX}px, ${event.pageY}px, 0px)`;
	};

	setMissionName(name) {
		this.missionName.textContent = name;
	};

	updatePlayPauseButton(playbackPaused) {
		if (playbackPaused) {
			this.playPauseButton.classList.add(constants.ClassName.PAUSE);
		} else {
			this.playPauseButton.classList.remove(constants.ClassName.PAUSE)
		};
	}

	// Set mission time based on given frame
	// Move playback + slider to given frame in time
	setMissionCurTime(f) {
		globals.missionCurDate.setTime(f*globals.frameCaptureDelay);
		this.missionCurTime.textContent = services.dateToTimeString(
				globals.missionCurDate);
		this.setFrameSliderVal(f);
		globals.playbackFrame = f;
	};

	setMissionEndTime(f) {
		this.missionEndTime.textContent = services.dateToTimeString(
				new Date(f*globals.frameCaptureDelay));
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

	setModal(modalContainer, modal, modalHeader, modalBody, modalButtons) {
		this.modalContainer = modalContainer;
		this.modal = modal;
		this.modalHeader = modalHeader;
		this.modalBody = modalBody;
		this.modalButtons = modalButtons;
	};

	showModalOpSelection() {
		// Set header/body
		this.modalBody.textContent = "Retrieving list...";

		// Show modal
		this.showModal();
	};

	setModalOpList(data) {
		this.modalHeader.textContent = "Operation Selection";

		// Set body
		var table = document.createElement("table");
		var headerRow = document.createElement("tr");

		var columnNames = ["Mission", "Location", "Date", "Time", "Duration"];
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

			if (op.in_progress) {
				row.classList.add(constants.ClassName.IN_PROGRESS);
			};

			var date = new Date(op.timestamp * 1000);
			var duration = (
					op.in_progress ?
					"In progress" :
					services.secondsToTimeString(op.length)
			);
			var vals = [
				op.mission,
				op.world,
				services.dateToLittleEndianString(date),
				services.dateToTimeString(date, false),
				duration,
			];
			vals.forEach(function(val) {
				var cell = document.createElement("td");
				cell.textContent = val;
				row.appendChild(cell);
			});

			row.addEventListener("click", () => {
				this.modalBody.textContent = "Loading...";
				services.getWorldByName(op.world).then((world) => {
					console.log("Got world: ");
					console.log(world);
					globals.world = world;
					app.processOp(`${constants.CAPTURES_PATH}/${op.id}.json`);
				});
			});
			table.insertBefore(row, table.childNodes[1]);
		});
		this.modalBody.textContent = "";
		this.modalBody.appendChild(table);
	};

	makeModalButton(text, func) {
		var button = document.createElement("div");
		button.className = "modal-button";
		button.textContent = text;
		button.addEventListener("click", func);

		return button;
	};

	showModalAbout() {
		this.modalHeader.textContent = "About";

		this.modalBody.innerHTML = `
			<img src="../static/images/ocap-logo.png" height="60px" alt="${constants.App.TITLE}">
			<h4 style=line-height:0>${constants.App.TITLE_FULL}</h4>
			<h5 style=line-height:0>v${constants.App.VERSION}</h5>
			Created by ${constants.App.AUTHOR}<br/>
			Originally made for <a href=" ${constants.App.COMMUNITY_URL}" target="_blank"> ${constants.App.COMMUNITY_TITLE}</a>
			<br/>
			<br/>
			<a href="${constants.App.BI_THREAD_URL}" target="_blank">BI Forum Post</a><br/>
			<a href="${constants.App.GITHUB_URL}" target="_blank">GitHub Page</a>
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
		this.modalContainer.classList.add(constants.ClassName.SHOW);
		this.modal.classList.add(constants.ClassName.SHOW);
	};

	hideModal() {
		this.modalContainer.classList.remove(constants.ClassName.SHOW);
		this.modal.classList.remove(constants.ClassName.SHOW);
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
			if (event.frameNum != globals.playbackFrame) {
				el.className = `${constants.ClassName.EVENT} ${constants.ClassName.REVEAL}`;
			} else {
				el.className = `${constants.ClassName.EVENT}`;
				setTimeout(() => {
					el.className = `${constants.ClassName.EVENT} ${constants.ClassName.REVEAL}`;
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
		this.hint.classList.add(constants.ClassName.SHOW);

		setTimeout(() => {
			this.hint.classList.remove(constants.ClassName.SHOW);
		}, 5000);
	};

	addTickToTimeline(frameNum) {
		var frameWidth = this.frameSliderWidthInPercent / globals.endFrame;
		var tick = document.createElement("div");

		tick.className = constants.ClassName.EVENT_TIMELINE_TICK;
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

const ui = new UI();
console.log('UI:')
console.log(ui);

export {ui};