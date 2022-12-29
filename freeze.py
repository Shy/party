from flask_frozen import Freezer
from app import app
from app.models import EventAttendeeJunction


freezer = Freezer(app)


@freezer.register_generator
def attendee_rsvp():
    for rsvp in EventAttendeeJunction.query.all():
        print(rsvp.public_id)
        yield {"event_junction_public_id": rsvp.public_id}


if __name__ == "__main__":
    freezer.run()
