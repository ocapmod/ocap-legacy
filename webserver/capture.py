import json
import logging
import time

import models
from constants import ExportData, ImportData, EntityIndex


logger = logging.getLogger(__name__)


class Capture():
	"""Represents a capture session."""
	def __init__(self, id, db):
		self.id = id
		self.db = db
		self.data = {
			ExportData.ENTITIES: {},
			ExportData.EVENTS: [],
		}
		self.first_import_time = None
		self.last_import_time = None

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
		header = new_data[ImportData.HEADER]
		self.last_import_time = time_now

		# Add entity data
		logger.debug('Importing entities')
		for new_entity_data in new_data[ImportData.ENTITIES]:
			entities = self.data[ExportData.ENTITIES]

			entity_header = new_entity_data[EntityIndex.HEADER]
			entity_id = entity_header[EntityIndex.Header.ID]

			if entity_id in entities:
				entity_states = new_entity_data[EntityIndex.STATES]
				entity_is_unit = entity_header[EntityIndex.Header.IS_UNIT] == 1

				entity = entities[entity_id]

				# Add new states for this entity
				entity[EntityIndex.STATES].extend(entity_states)

				# Add new frames fired for this entity
				if entity_is_unit:
					entity[EntityIndex.FRAMES_FIRED].extend(
							new_entity_data[EntityIndex.FRAMES_FIRED])
			else:
				entities[entity_id] = new_entity_data

		# Add events data
		logger.debug('Importing events')
		self.data[ExportData.EVENTS].extend(new_data[ImportData.EVENTS])

		if not self.first_import_time:
			self.first_import_time = time_now
			self.data.update({
				ExportData.WORLD: header[ImportData.HeaderIndex.WORLD],
				ExportData.MISSION: header[ImportData.HeaderIndex.MISSION],
				ExportData.AUTHOR: header[ImportData.HeaderIndex.AUTHOR],
				ExportData.CAPTURE_DELAY: header[ImportData.HeaderIndex.CAPTURE_DELAY],
				ExportData.FRAME_COUNT: header[ImportData.HeaderIndex.FRAME_COUNT]
			})

			# Create row in db
			self.db.session.add(models.Operation(
				capture_id=self.id,
				world=header[ImportData.HeaderIndex.WORLD],
				mission=header[ImportData.HeaderIndex.MISSION],
				author=header[ImportData.HeaderIndex.AUTHOR],
				timestamp=self.first_import_time))
			self.is_first_import = False
		else:
			self.data[ExportData.FRAME_COUNT] = header[ImportData.HeaderIndex.FRAME_COUNT]
			operation = models.Operation.query.filter_by(capture_id=self.id).first()
			operation.length = (
					header[ImportData.HeaderIndex.CAPTURE_DELAY] *
					header[ImportData.HeaderIndex.FRAME_COUNT])

		self.db.session.commit()

		# logger.debug('Data after import: {}'.format(self.data))
		logger.debug('Import complete')

	def publish_data(self):
		"""Publishes the captures's data."""

		# Get op from db, update it
		operation = models.Operation.query.filter_by(capture_id=self.id).first()
		operation.in_progress = False
		self.db.session.commit()

		# Store capture as json file
		with open('static/captures/{}.json'.format(self.id), 'w') as f:
			f.write(json.dumps(self.data))