from flask import render_template, request, url_for
from app import app, db
from app.models import Event, Attendee, EventAttendeeJunction
from functools import wraps
from flask import current_app, abort
from nanoid import generate


def debug_only(f):
    @wraps(f)
    def wrapped(**kwargs):
        if not current_app.debug:
            abort(404)

        return f(**kwargs)

    return wrapped


def lookupAttendeesByEvent(event_id):
    lookup = EventAttendeeJunction.query.filter_by(
        event_id=event_id, rsvp="attending"
    ).all()
    attending = []
    for item in lookup:
        attending.append(item.attendee.attendee)
    if len(attending) == 0:
        return ""
    elif len(attending) == 1:
        return f"{attending[0]} is coming. Hopefully I'll get to see you too!"
    else:
        return f"{', '.join(attending[:-1])} and {attending[-1]} are coming. Hopefully I'll get to see you too!"


def textInvites(attendee, event_junction_public_id):
    print(
        f'{app.config["DOMAIN"]}{url_for("attendee_rsvp", event_junction_public_id=event_junction_public_id)} texted to {attendee.phone}'
    )


@app.route("/")
@app.route("/index")
def index():
    return render_template("index.html")


@app.route("/events/<event_public_id>", methods=["GET"])
def event(event_public_id):
    event = Event.query.filter_by(public_id=event_public_id).first_or_404()
    return render_template(
        "event.html",
        title=event.event,
        event=event,
        attending=lookupAttendeesByEvent(event.id),
    )


@app.route("/events/<event_public_id>/invite")
@debug_only
def invite(event_public_id):
    event = Event.query.filter_by(public_id=event_public_id).first_or_404()
    invited = Attendee.query.filter_by(invited=True).all()
    for invitee in invited:
        event_junction = EventAttendeeJunction(
            public_id=generate("0123456789abcdefghijklmnopqrstuvwxyz", 12),
            event_id=event.id,
            attendee_id=invitee.id,
        )
        db.session.add(event_junction)
        db.session.commit()
        textInvites(invitee, event_junction.public_id)

    return "Invites to event {} sent.".format(event.event)


@app.route("/attendee/<attendee_public_id>", methods=["GET"])
def attendee(attendee_public_id):
    attendee = Attendee.query.filter_by(public_id=attendee_public_id).first_or_404()
    print(attendee)
    return attendee.attendee


@app.route("/rsvp/<event_junction_public_id>", methods=["GET", "POST"])
def attendee_rsvp(event_junction_public_id):
    event_junction = EventAttendeeJunction.query.filter_by(
        public_id=event_junction_public_id
    ).first_or_404()
    if request.method == "POST":
        print(request.form["rsvp"])
        event_junction.rsvp = request.form["rsvp"]
        db.session.commit()
    attendee = Attendee.query.filter_by(id=event_junction.attendee_id).first_or_404()
    event = Event.query.filter_by(id=event_junction.event_id).first_or_404()

    if event_junction.rsvp == "attending":
        attendee_status = "attending!"
    elif event_junction.rsvp == "not_attending":
        attendee_status = "not being able to make it."
    elif event_junction.rsvp == "maybe":
        attendee_status = "a maybe?"
    else:
        attendee_status = "yet to RSVP."

    return render_template(
        "attendee_rsvp.html",
        event=event,
        attendee=attendee,
        attendee_status=attendee_status,
        title=f"{attendee.attendee}'s private invite to {event.event}.,",
        attending=lookupAttendeesByEvent(event.id),
    )
