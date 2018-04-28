import logging
import time
from threading import Thread

import config
import models


logger = logging.getLogger(__name__)


class Watcher(Thread):
	"""
	Watch all captures, publish their data if no data received from
	game for a while (i.e. due to end of op, or server crash).
	"""
	def __init__(self, captures, db):
		Thread.__init__(self)
		self.daemon = True

		self.captures = captures
		self.db = db

	def run(self):
		logger.debug('Running')

		while True:
			time.sleep(5)
			logger.debug('Checking captures...')
			time_now = time.time()

			timed_out_captures = []
			for capture_id, capture in self.captures.items():
				logger.debug('Checking: {}'.format(capture_id))

				time_delta = time_now - capture.last_import_time
				logger.debug('  Seconds since last import: {}'.format(round(time_delta, 1)))
				if time_delta > config.CAPTURE_TIMEOUT:
					logger.debug('  Timed out. Publishing...'.format(capture_id))

					capture.publish_data()
					timed_out_captures.append(capture_id)

			# Remove timed-out captures from watchlist
			for capture_id in timed_out_captures:
				self.captures.pop(capture_id)