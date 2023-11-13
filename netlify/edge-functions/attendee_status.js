import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
const env_vars = Deno.env.toObject();
const client = new Client(
    env_vars["DATABASE_URL"].replace("cockroachdb", "postgresql") + "?sslmode=require"
);

export default async (request, context) => {
    await client.connect();
    const url = new URL(request.url);
    const split_path = url.pathname.split("/");
    let event_junction_pub_id;
    if (split_path[split_path.length - 1] == "") {
        event_junction_pub_id = split_path[split_path.length - 2];
    } else {
        event_junction_pub_id = split_path[split_path.length - 1];
    }

    const status = {
        attending: "attending",
        not_attending: "unable to attend",
        maybe: "a maybe for",
    };

    const event_id_lookup = await client.queryObject(
        "select event_attendee_junction.event_id, event_attendee_junction.rsvp, event_attendee_junction.attendee_id from event_attendee_junction where event_attendee_junction.public_id =  $1",
        [event_junction_pub_id]
    );

    const attending_lookup = await client.queryArray(
        'SELECT CASE WHEN event_attendee_junction."plus_one" <> 0 THEN attendee.attendee || ' +
            ' || event_attendee_junction."plus_one" ELSE attendee.attendee END AS attendee FROM event_attendee_junction INNER JOIN attendee ON event_attendee_junction.attendee_id = attendee.id WHERE event_attendee_junction.event_id = $1 AND event_attendee_junction.rsvp = "attending" ORDER BY attendee.phone DESC',
        [event_id_lookup.rows[0].event_id]
    );

    await client.end();
    let attendingArray = attending_lookup.rows.flat();
    attendingArray.forEach((element, index, attendingArray) => {
        attendingArray[index] = element.split(" ")[0];
    });
    try {
        const response = await context.next();
        const page = await response.text();
        const updatedPage = page
            .replace(
                /STATUS_UNKNOWN/i,
                status[event_id_lookup.rows[0]["rsvp"]] ?? "invited to attend"
            )
            .replace(/ATTENDEE_STATUS_UNKNOWN/i, event_id_lookup.rows[0]["rsvp"] || "")
            .replace(/ATTENDEES_UNKNOWN/i, attendingArray);

        return new Response(updatedPage, response);
    } catch (err) {
        return {
            statusCode: err.statusCode || 404,
            body: JSON.stringify(404),
        };
    }
};
