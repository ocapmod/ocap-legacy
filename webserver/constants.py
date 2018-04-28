class ExportData():
	ENTITIES = 'entities'
	EVENTS = 'events'
	STATES = 'states'
	FRAMES_FIRED = 'framesFired'
	WORLD = 'worldName'
	MISSION = 'missionName'
	AUTHOR = 'author'
	CAPTURE_DELAY = 'captureDelay'
	FRAME_COUNT = 'frameCount'


class ImportData():
	HEADER = 'header'
	ENTITIES = 'entities'
	EVENTS = 'events'

	class HeaderIndex():
		ID = 0
		WORLD = 1
		MISSION = 2
		AUTHOR = 3
		CAPTURE_DELAY = 4
		FRAME_COUNT = 5


class EntityIndex():
	HEADER = 0
	STATES = 1
	FRAMES_FIRED = 2

	class Header():
		START_FRAME_NUM = 0
		IS_UNIT = 1
		ID = 2