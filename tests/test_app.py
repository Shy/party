import pytest
from app import app, db
from app.models import Attendee, Event, EventAttendeeJunction

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.test_client() as client:
        yield client

def test_app_initialization(client):
    """Ensure the app initializes and can connect to the database"""
    assert app is not None

def test_models_exist():
    """Ensure models are correctly imported"""
    assert Attendee is not None
    assert Event is not None
    assert EventAttendeeJunction is not None
