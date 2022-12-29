# coding: utf-8
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql.sqltypes import NullType
from sqlalchemy.orm import relationship
from app import db


class Attendee(db.Model):
    __tablename__ = "attendee"

    id = db.Column(UUID, primary_key=True, server_default=db.text("gen_random_uuid()"))
    public_id = db.Column(db.String(12), nullable=False, unique=True)
    attendee = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    dietary_restrictions = db.Column(db.String(255))
    created_at = db.Column(
        db.DateTime, server_default=db.text("current_timestamp():::TIMESTAMPTZ")
    )
    updated_at = db.Column(
        db.DateTime, server_default=db.text("current_timestamp():::TIMESTAMPTZ")
    )
    invited = db.Column(db.Boolean, nullable=False, server_default=db.text("true"))

    def __repr__(self):
        return "<Attendee {}>".format(self.attendee)


class Event(db.Model):
    __tablename__ = "events"

    id = db.Column(UUID, primary_key=True, server_default=db.text("gen_random_uuid()"))
    public_id = db.Column(db.String(12), nullable=False, unique=True)
    event = db.Column(db.String(255), nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(600), nullable=False)
    description = db.Column(db.String(1000), nullable=False)
    created_at = db.Column(
        db.DateTime, server_default=db.text("current_timestamp():::TIMESTAMPTZ")
    )
    updated_at = db.Column(
        db.DateTime, server_default=db.text("current_timestamp():::TIMESTAMPTZ")
    )

    def __repr__(self):
        return "<Event {}>".format(self.event)


class EventAttendeeJunction(db.Model):
    __tablename__ = "event_attendee_junction"

    id = db.Column(UUID, primary_key=True, server_default=db.text("gen_random_uuid()"))
    public_id = db.Column(db.String(12), nullable=False)
    event_id = db.Column(db.ForeignKey("events.id", ondelete="CASCADE"))
    attendee_id = db.Column(db.ForeignKey("attendee.id", onupdate="CASCADE"))
    rsvp = db.Column(NullType)
    created_at = db.Column(
        db.DateTime, server_default=db.text("current_timestamp():::TIMESTAMPTZ")
    )
    updated_at = db.Column(
        db.DateTime, server_default=db.text("current_timestamp():::TIMESTAMPTZ")
    )

    attendee = relationship("Attendee")
    event = relationship("Event")
