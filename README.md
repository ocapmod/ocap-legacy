![OCAP](https://i.imgur.com/4Z16B8J.png)

**Operation Capture And Playback (BETA)**

![OCAP Screenshot](https://i.imgur.com/67L12wKl.jpg)

[Live Web Demo](http://www.3commandobrigade.com:8080/ocap-demo/)

##What is it?
OCAP is a **game-changing** tool that allows the recording and playback of operations on an interactive (web-based) map.
Reveal where the enemy were located, discover how each group carried out their assaults, and find out who engaged who, when, and what with.
Use it simply for fun or as a training tool to see how well your group performs on ops.

##Overview

* Interactive web-based playback. All you need is a browser.
* Captures positions of all units and vehicles throughout an operation.
* Captures events such as shots fired, kills, and hits.
* Event log displays events as they happened in realtime.
* Clicking on a unit lets you follow them.
* Server based capture - no mods required for clients.

## Running OCAP
Capture automatically begins when server becomes populated (see userconfig for settings).

To end and export capture data, call the following (server-side):

`[] call ocap_fnc_exportData;`

**Tip:** You can use the above function in a trigger.
e.g. Create a trigger that activates once all objectives complete. Then on activiation:
```
if (isServer) then {
    [] call ocap_fnc_exportData;
};

"end1" call BIS_fnc_endMission; // Ends mission for everyone
```

 
##Credits

* 3 Commando Brigade for testing and moral-boosting.
* Leaflet - an awesome JS interactive map library.
