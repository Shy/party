from flask import Flask
from flask_minify import minify
from flask_sqlalchemy import SQLAlchemy
from config import Config

app = Flask(__name__)
minify(app=app, html=True, js=True, cssless=True)
app.config.from_object(Config)
db = SQLAlchemy(app)

from app import routes, models, filters
