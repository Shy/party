from flask import Flask, current_app
from flask_minify import minify
from flask_sqlalchemy import SQLAlchemy
from config import Config
import asyncio
from temporalio.client import Client


async def connect_temporal(app):
    client = await Client.connect("localhost:7233")
    app.temporal_client = client


def get_client() -> Client:
    return current_app.temporal_client


app = Flask(__name__)
minify(app=app, html=True, js=True, cssless=True)
app.config.from_object(Config)
db = SQLAlchemy(app)
asyncio.run(connect_temporal(app))
app.add_template_global(name="PARTY_NAME", f=app.config["PARTY_NAME"])

from app import routes, models, filters  # noqa: F401, E402
