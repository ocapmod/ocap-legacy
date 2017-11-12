import time

class GameServer():
  def __init__(self, id):
    self.id = id
    self.data = {}
    self.last_append_time = -1
    self.is_capturing = False
  
  def __str__(self):
    return self.id

  def append(self, new_data):
    self.is_capturing = True
    self.last_append_time = time.time()

    # TODO: Append new_data to self.data correctly
    # Unit frames, events, etc
  
  def publish(self):
    """
    Send capture to webserver. Do nothing if no capture was in progress.
    """
    if not self.is_capturing:
      return
    self.is_capturing = False

    # TODO: Publish data to webserver
    
    self.data = {}
    self.last_append_time = -1