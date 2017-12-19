import json
import logging

from flask import Flask, request, jsonify

import config
from gameserver import GameServer
from watcher import Watcher


logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
app = Flask(__name__)
gameservers = {} # e.g. {'server1': GameServer, 'server2', GameServer, ...}


@app.route('/', methods=['GET', 'POST'])
def hello_world():
	return jsonify([g.to_dict() for g in gameservers.values()])


@app.route('/import', methods=['POST'])
def import_data():
	raw_data = request.data.decode('utf-8')
	with open('debug.txt', 'w') as f:
		f.write(raw_data)

	data = request.get_json(force=True)
	logger.debug(data)

	server_id = data['serverId'] # Defined in userconfig, included in export to dll
	logger.debug('Received import request from game server: {}'.format(server_id))

	if server_id not in gameservers: # Create new server
		gameservers[server_id] = GameServer(server_id)

	gameservers[server_id].import_data(data['captureData'])
	return 'Success'


if __name__ == '__main__':
	# Watcher(gameservers).start()
	app.run(debug=True, port=config.PORT, threaded=True)