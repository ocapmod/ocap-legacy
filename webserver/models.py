import logging
import time

from flask_sqlalchemy import SQLAlchemy, inspect


logger = logging.getLogger(__name__)
db = SQLAlchemy()


class ModelMixin():
  def to_dict(self):
    obj_dict = {}
    for key, value in self.__dict__.items():
      if key == '_sa_instance_state':
        continue
      obj_dict[key] = value
    return obj_dict


class Operation(db.Model, ModelMixin):
  id = db.Column(db.Integer, primary_key=True, autoincrement=True) # Also acts as filename for JSON
  world = db.Column(db.String, nullable=False)
  mission = db.Column(db.String, nullable=False)
  author = db.Column(db.String, nullable=False)
  timestamp = db.Column(db.Integer, nullable=False)
  length = db.Column(db.Integer, nullable=False)