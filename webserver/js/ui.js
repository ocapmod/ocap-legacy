/*
	Singleton UI module
*/

import {constants} from './constants';
import {globals} from './globals';
import * as app from './app';
import * as services from './services';


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
		this.mapDiv = document.getElementById("map");;

		this._init();
	};

	_init() {
		// Setup top panel
		this.missionName = document.getElementById("missionName");

		// Load operation button
		var loadOpButton = document.getElementById("loadOpButton");
		loadOpButton.addEventListener("click", function() {
			location.reload();
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
		this.playPauseButton.addEventListener('click', () => {
			console.log('Play/pause button clicked');
			app.playPause();
		});

		// Events timeline
		this.eventTimeline = document.getElementById("eventTimeline");

		// Hide/show ui on keypress
		this.mapDiv.addEventListener("keypress", (event) => {

			switch (event.charCode) {
				case constants.CharCodes.E: // e
					this.toggleLeftPanel();
					break;
				case constants.CharCodes.R: // r
					this.toggleRightPanel();
					break;
			};
		});

		// Add keypress event listener
		this.mapDiv.addEventListener("keypress", function(event) {
			switch (event.charCode) {
				case constants.CharCodes.SPACE: // Spacebar
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

		this.frameSliderWidthInPercent = (this.frameSlider.offsetWidth / this.frameSlider.parentElement.offsetWidth) * 100;
	};

	showCursorTooltip(text) {
		let tooltip = this.cursorTooltip;
		tooltip.textContent = text;
		tooltip.className = "cursorTooltip";

		// Attach text to cursor. Remove after timeout
		this.mapDiv.addEventListener("mousemove", this._moveCursorTooltip);
		setTimeout(() => {
			tooltip.className = "cursorTooltip hidden";

			// Remove listener once opacity transition ended
			tooltip.addEventListener("transitionend", () => {
				this.mapDiv.removeEventListener("mousemove", this._moveCursorTooltip);
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
		globals.missionCurDate.setTime(f*globals.frameCaptureDelay);
		this.missionCurTime.textContent = services.dateToTimeString(globals.missionCurDate);
		this.setFrameSliderVal(f);
		globals.playbackFrame = f;
	};

	setMissionEndTime(f) {
		this.missionEndTime.textContent = services.dateToTimeString(new Date(f*globals.frameCaptureDelay));
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
		//this.modalHeader.textContent = "Operation selection";
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
				op.mission,
				op.world,
				services.dateToLittleEndianString(new Date(op.timestamp * 1000)),
				services.secondsToTimeString(op.length)
			];
			vals.forEach(function(val) {
				var cell = document.createElement("td");
				cell.textContent = val;
				row.appendChild(cell);
			});

			row.addEventListener("click", () => {
				this.modalBody.textContent = "Loading...";
				app.processOp(`${constants.CAPTURES_PATH}/${op.id}.json`);
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
			if (event.frameNum != globals.playbackFrame) {
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
		var frameWidth = this.frameSliderWidthInPercent / globals.endFrame;
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

const ui = new UI();
console.log('UI:')
console.log(ui);

export {ui};