
// Set whether OCAP should be enabled
// true: Allow capture
// false: Never capture (overrides all other options)
ocap_capture = true;

// URL or IP to your OCAP site
// e.g. http://your-website.com/ocap, http://172.217.4.206:8000, etc
ocap_host = "http://localhost:8000";

// Delay (seconds) between each frame capture.
ocap_frameCaptureDelay = 1;

// Minimum player count required for OCAP to run.
// Capture will start once player account is >= this value.
// Capture will end (and publish) once player count is < this value.
// Set to 0 to always capture, even if no players present.
ocap_minPlayerCount = 1;

// Minimum capture time (seconds) before auto-publish is allowed.
// Set to 0 to disable.
ocap_minCaptureTime = 10;

// Maximum capture time (seconds) before capture is auto-published.
// Set to 0 for no limit.
ocap_maxCaptureTime = 60;

// Whether to stop OCAP after first publish.
// Setting to false allows for multiple capture sessions during a single
// mission (e.g. on a public server).
ocap_stopCaptureAfterPublish = false;