import { createClient } from "supabase";
import parse from "querystring";

const env_vars = Deno.env.toObject();
const supabase = createClient(env_vars["supabaseUrl"], env_vars["supabaseKey"]);

// const twilio_client = require("twilio")(
//     process.env.TWILIO_ACCOUNT_SID,
//     process.env.TWILIO_AUTH_TOKEN
// );
exports.handler = async (event, _context, callback) => {
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

    updatedRsvp = supabase
        .from("event_attendee_junction")
        .update({ rsvp: rsvp })
        .eq("public_id", junction_pub)
        .select("rsvp")
        .then((result) => {
            return result.data[0].rsvp;
        })
        .catch((e) => {
            console.error(e.stack);
            return { statusCode: 500 };
        });

    phoneAndEvent = supabase
        .from("event_attendee_junction")
        .select("attendee(phone), events(event)")
        .eq("public_id", junction_pub)
        .then((result) => {
            console.log(result.data[0]);
            return result.data[0];
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
                "! :) \nView details: https://shy.party/rsvp/" +
                junction_pub +
                "/";
            break;
        case "maybe":
            message =
                "You RSVP-ed Maybe to " +
                phoneAndEvent.event +
                ". :| \nOnce you know if you can go, update your RSVP: https://shy.party/rsvp/" +
                junction_pub +
                "/";
            break;
        default:
            message =
                ":( Sorry you can't make it to " +
                phoneAndEvent.event +
                ". I've turned off the reminder texts.\nChange your mind anytime: https://shy.party/rsvp/" +
                junction_pub +
                "/";
    }

    // return await twilio_client.messages
    //     .create({
    //         body: message,
    //         from: process.env.TWILIO_FROM_Number,
    //         to: phoneAndEvent.phone,
    //     })
    //     .then((message) => {
    //         return { statusCode: 200, body: JSON.stringify(message.sid) };
    //     })
    //     .catch(function (error) {
    //         return { statusCode: 500, body: JSON.stringify(error) };
    //     });
};
