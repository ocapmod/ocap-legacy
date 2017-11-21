import logging
import time


logger = logging.getLogger(__name__)

class GameServer():
  def __init__(self, id):
    self.id = id
    self._reset()

  def __str__(self):
    return self.id

  def _reset(self):
    self.data = {
      'entities': {},
      'events': []
    }
    self.last_import_time = -1
    self.is_capturing = False

  def import_data(self, new_data):
    self.is_capturing = True
    self.last_import_time = time.time()

    # Append entity data
    for entity_id, entity in new_data['entities'].items():
      cur_entities = self.data['entities']

      if entity_id in cur_entities:
        # Append positions
        cur_entities[entity_id]['positions'].extend(entity['positions'])
      else:
        # Add entity
        cur_entities[entity_id] = entity

    # Append events data
    self.data['events'].extend(new_data['events'])

    logger.debug('Data after import: {}'.format(self.data))


  def publish(self):
    """
    Send capture to webserver. Do nothing if no capture was in progress.
    """
    if not self.is_capturing:
      return
    self.is_capturing = False

    # TODO: Publish data to webserver

    self._reset()