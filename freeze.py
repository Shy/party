from flask_frozen import Freezer
from app import app
from app.models import EventAttendeeJunction, Event
from datetime import datetime, timedelta
import pytz


freezer = Freezer(app)


@freezer.register_generator
def event():
    for event in Event.query.all():
        yield {"event_public_id": event.public_id}


@freezer.register_generator
def attendee_rsvp():
    utc = pytz.UTC
    now = utc.localize(datetime.now())
    time_diff = timedelta(days=1)

    # Filter events in the database instead of in Python
    recent_events = Event.query.filter(Event.date >= now - time_diff).all()

    for event in recent_events:
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
