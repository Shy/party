const { Client } = require("pg");
const { parse } = require("querystring");

const connectionString = process.env.DATABASE_URL_PG;
const client = new Client({
    connectionString,
});
client.connect();

exports.handler = async (event, _context, callback) => {
    let body = {};

    try {
        body = JSON.parse(event.body);
    } catch (e) {
        body = parse(event.body);
    }

    if (!body.junction_pub || !body.rsvp) {
        console.log("[SPAM DETECTED] Required fields not defined.");
        console.log(body);

        return callback(null, {
            statusCode: 400,
            body: JSON.stringify({
                error: "[SPAM DETECTED] Required fields not defined.",
            }),
        });
    }

    const { junction_pub, rsvp } = body;

    const query =
        "UPDATE event_attendee_junction SET rsvp = $1 WHERE public_id = $2 RETURNING *";
    const values = [rsvp, junction_pub];

    updatedRsvp = client
        .query(query, values)
        .then((result) => result.rows[0].rsvp) // your callback here
        .catch((e) => console.error(e.stack)) // your callback here
        .then(() => client.end());

    let message = "Error. Ping Shy to fix things.";

    switch (updatedRsvp) {
        case "attending":
            message =
                "Your response was recorded successfully. I have you marked down as attending! 😍";
            break;
        case "maybe":
            message =
                "Your response was recorded successfully. I have you marked down as a maybe. Come back soon to let me know what's going on with you. 🤔";
            break;
        default:
            message =
                "Your response was recorded successfully. I have you marked down as not being able to make it. 😢. Feel free to change your mind anytime.";
            break;
    }

    return callback(null, {
        statusCode: 200,
        body: JSON.stringify({ message }),
    });
};
