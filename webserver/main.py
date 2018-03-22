import json
import logging

from flask import Flask, jsonify, render_template, request

import config
import models
import services
from models import db
from gameserver import GameServer
from watcher import Watcher


logging.basicConfig(filename='app.log', level=logging.DEBUG)
logger = logging.getLogger(__name__)
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database/data.db'
app.json_encoder = services.CustomJSONEncoder
gameservers = {} # e.g. {'server1': GameServer, 'server2', GameServer, ...}

API_PREFIX = '/api/v1'

# Init db
db.app = app
db.init_app(app)
db.create_all()
db.session.commit()


@app.route('/')
def index():
	return render_template('index.html')


@app.route('/admin/resetdb')
def admin_resetdb():
	models.Operation.query.delete()
	db.session.commit()

	return 'Database reset'


@app.route(API_PREFIX + '/operations')
def api_operations():
	operations = models.Operation.query.limit(50).all()
	return jsonify(operations)


@app.route('/import', methods=['POST'])
def import_data():
	raw_data = request.data.decode('utf-8')
	with open('import.json', 'w') as f:
		f.write(raw_data)

	data = request.get_json(force=True)

	server_id = data['serverId'] # Defined in userconfig, included in export to dll
	logger.debug('Received import request from game server: {}'.format(server_id))

	if server_id not in gameservers: # Create new server
		gameservers[server_id] = GameServer(server_id)

	gameservers[server_id].import_data(data['captureData'])
	return 'Success'


@app.route('/import/view', methods=['GET', 'POST'])
def import_data_view():
	return jsonify([g.to_dict() for g in gameservers.values()])


Watcher(gameservers, db).start()
logger.debug('Main called')

if __name__ == '__main__':
	app.run(debug=config.DEBUG, port=config.PORT, threaded=config.DEBUG)