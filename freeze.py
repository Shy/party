from flask_frozen import Freezer
from dotenv import load_dotenv
import os

# Load environment variables from .flaskenv if it exists
if os.path.exists('.flaskenv'):
    load_dotenv('.flaskenv')

from app import app
from app.models import EventAttendeeJunction, Event
from datetime import datetime, timedelta
import pytz


freezer = Freezer(app)


@freezer.register_generator
def event():
    utc = pytz.UTC
    now = datetime.now(utc)

    # Only generate event pages for upcoming or recent events (within last day)
    time_diff = timedelta(days=1)
    active_events = Event.query.filter(Event.date >= now - time_diff).all()

    for event in active_events:
        print(f"Generating event page for {event.event}")
        yield {"event_public_id": event.public_id}


@freezer.register_generator
def attendee_rsvp():
    utc = pytz.UTC
    now = datetime.now(utc)
    time_diff = timedelta(days=1)

    # Only generate RSVP pages for active events (upcoming or within last day)
    active_events = Event.query.filter(Event.date >= now - time_diff).all()

    for event in active_events:
        print(f"Generating rsvps for {event.event} on {event.date}")
        # Use more efficient query with join to avoid N+1 problem
        rsvps = EventAttendeeJunction.query.filter_by(event_id=event.id).all()
        for rsvp in rsvps:
            print(f"Making rsvp for {rsvp.attendee.attendee}")
            yield {"event_junction_public_id": rsvp.public_id}


@freezer.register_generator
def not_found_page():
    yield {}


if __name__ == "__main__":
    freezer.freeze()
