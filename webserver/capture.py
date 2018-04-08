import json
import logging
import time

import models
from constants import CaptureData, CaptureHeader


logger = logging.getLogger(__name__)


class Capture():
	"""Represents a capture session."""
	def __init__(self, id, db):
		self.id = id
		self.db = db
		self.data = {
			CaptureData.ENTITIES: {},
			CaptureData.EVENTS: [],
			CaptureData.HEADER: {},
		}
		self.first_import_time = None
		self.last_import_time = None
		self.is_capturing = False
		self.is_first_import = True

	def __str__(self):
		return self.id

	def to_dict(self):
		last_import_delta = (
			round(time.time() - self.last_import_time, 1)
			if self.last_import_time else None
		)
		return {
			'capture_id': self.id,
			'capture_data': self.data,
			'last_import_delta': last_import_delta,
		}

	def import_data(self, new_data):
		logger.debug('Importing data for server: {}'.format(self.id))
		time_now = time.time()
		header = new_data[CaptureData.HEADER]
		self.is_capturing = True
		self.last_import_time = time_now
		self.data[CaptureData.HEADER] = header

		# Add entity data
		logger.debug('Importing entities')
		for entity_id, new_entity in new_data[CaptureData.ENTITIES].items():
			entities = self.data[CaptureData.ENTITIES]

			if entity_id in entities:
				entity = entities[entity_id]

				# Add new states
				entity[CaptureData.STATES].extend(new_entity[CaptureData.STATES])

				# Add new frames fired
				if CaptureData.FRAMES_FIRED in entity:
					entity[CaptureData.FRAMES_FIRED].extend(new_entity[CaptureData.FRAMES_FIRED])
			else:
				# Add new entity
				entities[entity_id] = new_entity

		# Add events data
		logger.debug('Importing events')
		self.data[CaptureData.EVENTS].extend(new_data[CaptureData.EVENTS])

		if self.is_first_import:
			self.first_import_time = time_now

			# Create row in db
			self.db.session.add(models.Operation(
				capture_id=self.id,
				world=header[CaptureHeader.WORLD],
				mission=header[CaptureHeader.MISSION],
				author=header[CaptureHeader.AUTHOR],
				timestamp=self.first_import_time))
			self.is_first_import = False
		else:
			operation = models.Operation.query.filter_by(capture_id=self.id).first()
			operation.length = header[
					CaptureHeader.CAPTURE_DELAY] * header[CaptureHeader.FRAME_COUNT]

		self.db.session.commit()

		# logger.debug('Data after import: {}'.format(self.data))
		logger.debug('Import complete')

	def publish_data(self):
		"""Publishes the captures's data."""
		self.is_capturing = False

		# Get op from db, update it
		operation = models.Operation.query.filter_by(capture_id=self.id).first()
		operation.in_progress = False
		self.db.session.commit()

		# Store capture as json file
		with open('static/captures/{}.json'.format(operation.id), 'w') as f:
			f.write(json.dumps(self.data))