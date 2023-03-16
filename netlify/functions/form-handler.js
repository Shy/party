const { Client } = require("pg");
const { parse } = require("querystring");
const twilio_client = require("twilio")(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const connectionString = process.env.DATABASE_URL_PG;

exports.handler = async (event, _context, callback) => {
    const client = new Client({
        connectionString,
    });
    client.connect();
    let body = {};

    try {
        body = JSON.parse(event.body);
    } catch (e) {
        body = parse(event.body);
    }

    if (!body.junction_pub || !body.rsvp) {
        console.log("[SPAM DETECTED] Required fields not defined.");

        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                error: "[SPAM DETECTED] Required fields not defined.",
            }),
        };
    }

    const { junction_pub, rsvp } = body;

    let query =
        "UPDATE event_attendee_junction SET rsvp = $1 WHERE public_id = $2 RETURNING *";
    let values = [rsvp, junction_pub];

    updatedRsvp = await client
        .query(query, values)
        .then((result) => {
            return result.rows[0].rsvp;
        })
        .catch((e) => {
            console.error(e.stack);
            return { statusCode: 500 };
        });
    query =
        "Select attendee.phone, events.event from event_attendee_junction left join attendee on attendee.id=event_attendee_junction.attendee_id right join events on events.id = event_attendee_junction.event_id WHERE event_attendee_junction.public_id = $1";
    phoneAndEvent = await client
        .query(query, [junction_pub])
        .then((result) => {
            return result.rows[0];
        })
        .catch((e) => {
            console.error(e.stack);
            return { statusCode: 500 };
        });
    let message = "Error. Ping Shy to fix things.";
    switch (updatedRsvp) {
        case "attending":
            message =
                "You're going to " +
                phoneAndEvent.event +
                "! :) \nView details / update your RSVP -   https://shy.party/rsvp/" +
                junction_pub +
                "/";
            break;
        case "maybe":
            message =
                "Thanks for RSVPing Maybe to " +
                phoneAndEvent.event +
                ". \nOnce you know if you can go, update your status: https://shy.party/rsvp/" +
                junction_pub +
                "/";
            break;
        default:
            message =
                ":| Sorry you can't make it to " +
                phoneAndEvent.event +
                ". I've turned off the reminder texts for you.\nIf things change, update your status: https://shy.party/rsvp/" +
                junction_pub +
                "/";
    }

    response = twilio_client.messages
        .create({
            body: message,
            from: process.env.TWILIO_FROM_Number,
            to: phoneAndEvent.phone,
        })
        .then((message) => console.log(message.sid))

        .catch(function (error) {
            return { statusCode: 500, body: JSON.stringify(error) };
        });
    return { statusCode: 200, body: JSON.stringify(response) };
};
