from flask.json import JSONEncoder
from models import db


class CustomJSONEncoder(JSONEncoder):
	def default(self, obj):
		if isinstance(obj, db.Model):
			obj_dict = obj.to_dict()
			return obj_dict
		else:
			return JSONEncoder.default(self, obj)