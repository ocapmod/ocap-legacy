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

## Arma server setup
1. Put `@ocap` and `@ocap/userconfig` folders into your server's Arma root directory
1. Put `ocap_exporter_x64.dll` into your server's Arma root directory
1. Configure the userconfig file
1. Launch server with `@ocap` enabled

Capture automatically begins when server becomes populated (see userconfig for settings).
Capture will stop on mission end.

To stop capture manually, call the following (server-side):

`[] call ocap_fnc_exportData;`

**Tip:** You can use the above function in a trigger.
e.g. Create a trigger that activates once all objectives complete. Then on activiation:
```
if (isServer) then {
    [] call ocap_fnc_exportData;
};

"end1" call BIS_fnc_endMission; // Ends mission for everyone
```
## Web server setup
TODO

### Development
1. Ensure you have Python 3 and NodeJS installed
1. Run `cd webserver/`
1. Run `npm install`
1. Run `pip install -r requirements.txt`
1. Configure `config.py` (can leave as default)
1. Run `python main.py`

The server is now running and listening for capture data from the Arma server(s).

## Credits

* [3 Commando Brigade](http://www.3commandobrigade.com/) for testing and moral-boosting.
* [Leaflet](http://leafletjs.com/) - an awesome JS interactive map library.
* Maca134 for his tutorial on [writing Arma extensions in C#](http://maca134.co.uk/tutorial/write-an-arma-extension-in-c-sharp-dot-net/).
