const { Client } = require("pg");
const { parse } = require("querystring");

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
        "Select phone from attendee left join event_attendee_junction on attendee.id=event_attendee_junction.attendee_id WHERE public_id = $1";
    phone = await client
        .query(query, values)
        .then((result) => {
            return result.rows[0].phone;
        })
        .catch((e) => {
            console.error(e.stack);
            return { statusCode: 500 };
        });

    pbStatus = await fetch("https://api.pushbullet.com/v2/texts", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + env_vars["PUSHBULLET_AUTH_TOKEN"],
        },
        body: JSON.stringify({
            addresses: [phone],
            message: "Your RSVP for " + junction_pub + " has been updated to " + rsvp,
            target_device_iden: env_vars["PUSHBULLET_IDEN"],
        }),
    });

    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            updatedRsvp,
        }),
    };
};
