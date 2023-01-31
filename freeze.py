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
    time_diff = timedelta(days=31)

    for event in Event.query.all():
        if event.date >= now - time_diff and event.date <= now + time_diff:
            print(f"Generating rsvps for {event.event} on {event.date}")
            for rsvp in EventAttendeeJunction.query.filter_by(event_id=event.id).all():
                print(f"Making rsvp {rsvp.public_id} for {rsvp.attendee.attendee}")
                yield {"event_junction_public_id": rsvp.public_id}


if __name__ == "__main__":
    freezer.freeze()
