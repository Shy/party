from app import app, db
from app.models import Attendee, Event, EventAttendeeJunction


@app.shell_context_processor
def make_shell_context():
    return {
        "db": db,
        "Attendee": Attendee,
        "Event": Event,
        "EventAttendeeJunction": EventAttendeeJunction,
    }
