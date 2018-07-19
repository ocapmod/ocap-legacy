import json
import logging
import re

from flask import Flask, jsonify, render_template, request

import config
import models
import services
from models import db
from capture import Capture
from constants import ImportData
from watcher import Watcher

if __name__ == '__main__':
	logging.basicConfig(level=logging.DEBUG)
else:
	logging.basicConfig(filename='app.log', level=logging.DEBUG)

logger = logging.getLogger(__name__)
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database/data.db'
app.json_encoder = services.CustomJSONEncoder
captures = {} # type: Dict[str, Capture]

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
	raw_data = request.data.decode('utf-8')
	with open('import.json', 'w') as f:
		f.write(raw_data)

	data = request.get_json(force=True)
	header = data['header']
	capture_id = header[ImportData.HeaderIndex.ID]
	capture_id = re.sub('[^A-Za-z0-9_\-]+', '', capture_id)

	logger.debug(
			'Received import request from capture session: {}'.format(capture_id))

	if capture_id not in captures: # Create new capture
		captures[capture_id] = Capture(capture_id, db)

	captures[capture_id].import_data(data)
	return 'Success'


@app.route('/import/view', methods=['GET', 'POST'])
def import_data_view():
	return jsonify([x.to_dict() for x in captures.values()])


Watcher(captures, db).start()
logger.debug('Main called')


# This block isn't called by Gunicorn. It is intended for use when running
# the app directly during development
if __name__ == '__main__':
	app.run(debug=config.DEBUG, port=config.PORT, threaded=config.DEBUG)