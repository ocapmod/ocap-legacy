![OCAP](https://i.imgur.com/4Z16B8J.png)

**Operation Capture And Playback (BETA)**

![OCAP Screenshot](https://i.imgur.com/67L12wKl.jpg)

**[Live Web Demo](http://www.3commandobrigade.com:8080/ocap-demo/)**

## What is it?
OCAP lets you **record and replay** operations on an interactive (web-based) map.
Reveal where the enemy were located.

Discover how each group carried out their assaults.

See who engaged who, when, and what with.

Use it simply for fun or as a training tool to see how well your group performs on ops.


## Overview

* Interactive web-based playback. All you need is a browser.
* Captures positions of all units and vehicles throughout an operation.
* Captures events such as shots fired, kills, and hits.
* Event log displays events as they happened in realtime.
* Clicking on a unit lets you follow them.
* Server based capture - no mods required for clients.

## Running OCAP
Capture automatically begins when server becomes populated (see userconfig for settings).

To stop capture, call the following (server-side):

`[] call ocap_fnc_exportData;`

**Tip:** You can use the above function in a trigger.
e.g. Create a trigger that activates once all objectives complete. Then on activiation:
```
if (isServer) then {
    [] call ocap_fnc_exportData;
};

"end1" call BIS_fnc_endMission; // Ends mission for everyone
```


## Credits

* [3 Commando Brigade](http://www.3commandobrigade.com/) for testing and moral-boosting.
* [Leaflet](http://leafletjs.com/) - an awesome JS interactive map library.
* Maca134 for his tutorial on [writing Arma extensions in C#](http://maca134.co.uk/tutorial/write-an-arma-extension-in-c-sharp-dot-net/).
