import json
import logging
import re
import time

from flask import Flask, jsonify, render_template, request

import config
import models
import services
from models import db

if __name__ == '__main__':
	logging.basicConfig(level=logging.DEBUG)
else:
	logging.basicConfig(filename='app.log', level=logging.DEBUG)

logger = logging.getLogger(__name__)
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database/data.db'
app.json_encoder = services.CustomJSONEncoder

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
	operations = (models.Operation.query
			.order_by(models.Operation.timestamp)
			.limit(50)
			.all())
	return jsonify(operations)


@app.route('/import', methods=['POST'])
def import_data():
	data = request.get_json(force=True)
	capture_id = data["captureId"]
	capture_id = re.sub('[^A-Za-z0-9_\-]+', '', capture_id)

	logger.debug('Received import request with id: {}'.format(capture_id))

	# Create row in db
	db.session.add(models.Operation(
		capture_id=capture_id,
		world=data["worldName"],
		mission=data["missionName"],
		author=data["author"],
		length=data["frameCount"] * data["captureDelay"],
		timestamp=time.time()))
	db.session.commit()

	# Write json to file
	with open('static/captures/{}.json'.format(capture_id), 'w') as f:
		json.dump(data, f)

	return 'Success'


logger.debug('Main called')


# This block isn't called by Gunicorn. It is intended for use when running
# the app directly during development
if __name__ == '__main__':
	app.run(debug=config.DEBUG, port=config.PORT, threaded=config.DEBUG)