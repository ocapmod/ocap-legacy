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


# TODO: Store JSON in postgres as JSONB format.
# from sqlalchemy.dialects.postgresql import JSON
# data = db.Column(JSON)

class Operation(db.Model, ModelMixin):
  """Represents an operation, holds capture metadata.

  Used by frontend to display list of recorded operations.
  `id` holds capture filename.
  """
  id = db.Column(db.Integer, primary_key=True, autoincrement=True)
  capture_id = db.Column(db.String, nullable=False)
  world = db.Column(db.String, nullable=False)
  mission = db.Column(db.String, nullable=False)
  author = db.Column(db.String, nullable=False)
  timestamp = db.Column(db.Integer)
  length = db.Column(db.Integer)
  in_progress = db.Column(db.Boolean, default=True)