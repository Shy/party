from uuid import uuid4
import asyncio
from flask import render_template, send_from_directory, request, current_app, abort
from app import app, get_client  # noqa: F401, E402
from app.models import Event, Attendee, EventAttendeeJunction
from functools import wraps
from datetime import datetime
import asyncio

from temporalio import workflow


def debug_only(f):
    @wraps(f)
    def wrapped(**kwargs):
        if not current_app.debug:
            abort(404)

        return f(**kwargs)

    return wrapped


@app.route("/")
def index():
    event = (
        Event.query.filter(Event.date >= datetime.now())
        .order_by(Event.date.asc())
        .first_or_404()
    )
    print(event.image_id)
    return render_template("index.html", image_id=event.image_id)


@app.route("/robots.txt")
def static_from_root():
    return send_from_directory(app.static_folder, request.path[1:])


# Nobody uses this route so it's commented out.
# @app.route("/events/<event_public_id>/", methods=["GET"])
# def event(event_public_id):
#     event = Event.query.filter_by(public_id=event_public_id).first_or_404()
#     return render_template(
#         "event.html",
#         title=event.event,
#         event=event,
#     )


@app.route("/rsvp/<event_junction_public_id>/", methods=["GET"])
async def attendee_rsvp(event_junction_public_id):
    client = get_client()
    handle = await client.start_workflow(
        "getAttendeeStatusInfo",
        event_junction_public_id,
        id="shy.party/rsvp/" + event_junction_public_id,
        task_queue="shy-party",
    )

    result = await handle.result()

    return render_template(
        "attendee_rsvp.html",
        event=result["EventJunction"]["event"],
        attendee=result["EventJunction"]["attendee"],
        attendees=result["EventAttendees"],
        help=result["EventJunction"]["help"],
        humanReadableStatus=result["EventJunction"]["humanReadableStatus"],
        event_junction_public_id=event_junction_public_id,
        title=f"{result['EventJunction']['attendee']}'s private invite to {result['EventJunction']['event']['event']}.,",
    )


@app.route("/form-handler", methods=["POST"])
async def updateRSVP():

    data = request.get_json()
    app.logger.info([data["junction_pub"], data["rsvp"], data["help"]])
    # send data as a sequence of arguments
    # to the workflow function

    client = get_client()
    handle = await client.start_workflow(
        "updateAttendeeRSVP",
        args=[
            data["junction_pub"],
            data["rsvp"],
            data["help"],
        ],
        # pass the data as a sequence of arguments
        id="Update RSVP/" + data["junction_pub"] + str(uuid4()),
        task_queue="shy-party",
    )

    return await handle.result()
