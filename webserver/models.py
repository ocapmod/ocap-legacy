import logging

from flask_sqlalchemy import SQLAlchemy


logger = logging.getLogger(__name__)
db = SQLAlchemy()


class Operation(db.Model):
  id = db.Column(db.Integer, primary_key=True) # Also acts as filename for JSON
  world = db.Column(db.String)
  mission = db.Column(db.String)
  author = db.Column(db.String)
  date = db.Column(db.Integer)
  length = db.Column(db.Integer)
