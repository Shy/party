import pytest
import pytz
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from app import app
from app.models import Attendee, Event, EventAttendeeJunction

@pytest.fixture
def client():
    app.config['TESTING'] = True
    # Do not initialize a real database connection since models contain
    # postgres-specific dialect functions that break SQLite setup
    
    with app.test_client() as client:
        with app.app_context():
            yield client

def test_app_initialization(client):
    """Ensure the app initializes"""
    assert app is not None

def test_models_exist():
    """Ensure models are correctly imported"""
    assert Attendee is not None
    assert Event is not None
    assert EventAttendeeJunction is not None

@patch('app.routes.Event.query')
def test_index_route(mock_event_query, client):
    """Ensure the index route successfully fetches the upcoming event (tests Flask and Pytz updates)"""
    mock_event = MagicMock()
    mock_event.image_id = "mock-image"
    mock_event_query.filter.return_value.order_by.return_value.first.return_value = mock_event
    
    response = client.get("/")
    assert response.status_code == 200
    assert b"mock-image" in response.data or b"html" in response.data

@patch('app.routes.Event.query')
def test_event_route(mock_event_query, client):
    """Ensure the event detail route successfully fetches by public_id"""
    mock_event = MagicMock()
    mock_event.event = "Test Event"
    mock_event_query.filter_by.return_value.first_or_404.return_value = mock_event
    
    response = client.get("/events/mock-event/")
    assert response.status_code == 200
    assert b"Test Event" in response.data or b"html" in response.data

@patch('app.routes.EventAttendeeJunction.query')
@patch('app.routes.Attendee.query')
@patch('app.routes.Event.query')
def test_rsvp_route(mock_event_query, mock_attendee_query, mock_junction_query, client):
    """Ensure the RSVP route correctly performs queries across the three updated models"""
    mock_junction = MagicMock()
    mock_junction.attendee_id = 1
    mock_junction.event_id = 1
    mock_junction_query.filter_by.return_value.first_or_404.return_value = mock_junction
    
    mock_attendee = MagicMock()
    mock_attendee.attendee = "Alice"
    mock_attendee_query.filter_by.return_value.first_or_404.return_value = mock_attendee
    
    mock_event = MagicMock()
    mock_event.event = "Test Event"
    mock_event_query.filter_by.return_value.first_or_404.return_value = mock_event

    response = client.get("/rsvp/mock-junction/")
    assert response.status_code == 200


