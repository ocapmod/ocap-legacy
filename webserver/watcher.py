import json
import logging
import time
from threading import Thread

import config
import models
from constants import CaptureData, CaptureHeader


logger = logging.getLogger(__name__)


class Watcher(Thread):
	"""
	Watch all gameservers, publish their data if no data received from
	game for a while (i.e. due to end of op, or server crash).
	"""
	def __init__(self, gameservers, db):
		Thread.__init__(self)
		self.daemon = True

		self.gameservers = gameservers
		self.db = db

	def run(self):
		logger.debug('Running')

		while True:
			time.sleep(5)
			logger.debug('Checking gameservers...')
			time_now = time.time()

			timed_out_servers = []
			for server_id, server in self.gameservers.items():
				logger.debug('Checking: {}'.format(server_id))

				if not server.is_capturing:
					logger.debug('  Skipping (not capturing)')
					continue

				time_delta = time_now - server.last_import_time
				logger.debug('  Seconds since last import: {}'.format(round(time_delta, 1)))
				if time_delta > config.CAPTURE_TIMEOUT and server.is_capturing:
					logger.debug('  Timed out. Publishing...'.format(server_id))
				
					self.publish(server)
					timed_out_servers.append(server_id)
				
			# Remove timed-out servers from watchlist
			for server_id in timed_out_servers:
				self.gameservers.pop(server_id)
		
	def publish(self, server):
		"""Publishes the server's capture data."""
		server.is_capturing = False

		# Create row in db
		header = server.data[CaptureData.HEADER]
		capture_length = header[CaptureHeader.CAPTURE_DELAY] * header[CaptureHeader.FRAME_COUNT]
		operation = models.Operation(
			world=header[CaptureHeader.WORLD],
			mission=header[CaptureHeader.MISSION],
			author=header[CaptureHeader.AUTHOR],
			timestamp=time.time(),
			length=capture_length)
		self.db.session.add(operation)
		self.db.session.commit()

		# Store capture as json file
		with open('static/captures/{}.json'.format(operation.id), 'w') as f:
			f.write(json.dumps(server.data))