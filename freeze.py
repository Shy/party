from flask_frozen import Freezer
from app import app
from app.models import EventAttendeeJunction, Event


freezer = Freezer(app)


@freezer.register_generator
def event():
    for event in Event.query.all():
        yield {"event_public_id": event.public_id}


@freezer.register_generator
def attendee_rsvp():
    for rsvp in EventAttendeeJunction.query.all():
        yield {"event_junction_public_id": rsvp.public_id}


if __name__ == "__main__":
    freezer.freeze()
