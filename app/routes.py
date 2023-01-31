from flask import (
    render_template,
    send_from_directory,
    request,
)

from app import app
from app.models import Event, Attendee, EventAttendeeJunction
from functools import wraps
from flask import current_app, abort


def debug_only(f):
    @wraps(f)
    def wrapped(**kwargs):
        if not current_app.debug:
            abort(404)

        return f(**kwargs)

    return wrapped


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/robots.txt")
def static_from_root():
    return send_from_directory(app.static_folder, request.path[1:])


@app.route("/events/<event_public_id>/", methods=["GET"])
def event(event_public_id):
    event = Event.query.filter_by(public_id=event_public_id).first_or_404()
    return render_template(
        "event.html",
        title=event.event,
        event=event,
    )


@app.route("/rsvp/<event_junction_public_id>/", methods=["GET"])
def attendee_rsvp(event_junction_public_id):
    event_junction = EventAttendeeJunction.query.filter_by(
        public_id=event_junction_public_id
    ).first_or_404()
    attendee = Attendee.query.filter_by(id=event_junction.attendee_id).first_or_404()
    event = Event.query.filter_by(id=event_junction.event_id).first_or_404()

    return render_template(
        "attendee_rsvp.html",
        event=event,
        attendee=attendee,
        event_junction_public_id=event_junction_public_id,
        title=f"{attendee.attendee}'s private invite to {event.event}.,",
    )
