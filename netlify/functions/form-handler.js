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

    const query =
        "UPDATE event_attendee_junction SET rsvp = $1 WHERE public_id = $2 RETURNING *";
    const values = [rsvp, junction_pub];

    updatedRsvp = await client
        .query(query, values)
        .then((result) => {
            return result.rows[0].rsvp;
        }) // your callback here
        .catch((e) => {
            console.error(e.stack);
            return { statusCode: 500 };
        }); // your callback here

    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            updatedRsvp,
        }),
    };
};
