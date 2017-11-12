import logging
import time
from threading import Thread

import config

logger = logging.getLogger(__name__)

class Watcher(Thread):
  """
  Watch all gameservers, publish their data if no data received from
  game for a while (i.e. due to end of op, or server crash).
  """
  def __init__(self, gameservers):
    Thread.__init__(self)
    self.daemon = True

    self.gameservers = gameservers
  
  def run(self):
    logger.debug('Running')

    while True:
      time.sleep(5)
      logger.debug('Checking gameservers...')
      time_now = time.time()

      for server_id, server in self.gameservers.items():
        if not server.is_capturing:
          continue

        time_delta = time_now - server.last_append_time
        logger.debug('  {} seconds since last append: {}'.format(
          server, time_delta))
        if time_delta > config.CAPTURE_TIMEOUT:
          logger.debug('  {} timed out. Publishing...'.format(server_id))
          server.publish()