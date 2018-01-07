import logging
import time

from constants import CaptureData


logger = logging.getLogger(__name__)


class GameServer():
	def __init__(self, id):
		self.id = id
		self.data = {
			CaptureData.ENTITIES: {},
			CaptureData.EVENTS: [],
			CaptureData.HEADER: {},
		}
		self.last_import_time = None
		self.is_capturing = False

	def __str__(self):
		return self.id

	def to_dict(self):
		last_import_delta = round(time.time() - self.last_import_time, 1) if self.last_import_time else None
		return {
			'server_id': self.id,
			'capture_data': self.data,
			'last_import_delta': last_import_delta,
		}

	def import_data(self, new_data):
		logger.debug('Importing data for server: {}'.format(self.id))
		self.is_capturing = True
		self.last_import_time = time.time()
		self.data[CaptureData.HEADER] = new_data[CaptureData.HEADER]

		# Add entity data
		logger.debug('Importing entities')
		for entity_id, new_entity in new_data[CaptureData.ENTITIES].items():
			entities = self.data[CaptureData.ENTITIES]

			if entity_id in entities:
				entity = entities[entity_id]

				# Add new states
				entity[CaptureData.STATES].extend(new_entity[CaptureData.STATES])

				# Add new frames fired
				entity[CaptureData.FRAMES_FIRED].extend(new_entity[CaptureData.FRAMES_FIRED])
			else:
				# Add new entity
				entities[entity_id] = new_entity

		# Add events data
		logger.debug('Importing events')
		self.data[CaptureData.EVENTS].extend(new_data[CaptureData.EVENTS])

		# logger.debug('Data after import: {}'.format(self.data))
		logger.debug('Import complete')