from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from config import Config

app = Flask(__name__)
app.config.from_object(Config)
db = SQLAlchemy(app)
app.add_template_global(name="PARTY_NAME", f=app.config["PARTY_NAME"])

from app import routes, models, filters  # noqa: F401, E402
