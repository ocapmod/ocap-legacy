import json
import logging

from flask import Flask, request

import config
from gameserver import GameServer
from watcher import Watcher


logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
app = Flask(__name__)

# e.g. {'server1': GameServer, 'server2', GameServer, ...}
gameservers = {}

@app.route('/', methods=['GET', 'POST'])
def hello_world():
  if request.method == 'POST':
    data = request.get_json()
    logger.debug('Received: {}'.format(data))
    return 'Received your request'
  else:
    return 'Hello, World!'

@app.route('/init', methods=['POST'])
def gameserver_init():
  """
  Called upon start of new operation capture.
  Creates new gameserver/resets if already exists.
  """
  data = request.get_json()
  server_id = data['server_id']

  if server_id not in gameservers:
    gameservers[server_id] = GameServer(server_id)
  else:
    gameservers[server_id].publish()
  
  logger.debug(gameservers)

  return 'Success'

@app.route('/import', methods=['POST'])
def import_data():
  data = request.get_json(force=True)
  server_id = data['server_id'] # Defined in userconfig, included in export to dll

  logger.debug('Received data from gameserver: {}'.format(server_id))

  # Abort if server not initialised
  if server_id not in gameservers:
    err = 'Game server {} not initialised!'.format(server_id)
    logger.error(err)
    return err

  gameservers[server_id].append(data['capture_data'])
  return 'Success'

if __name__ == '__main__':
  Watcher(gameservers).start()
  app.run(debug=True, port=config.PORT)