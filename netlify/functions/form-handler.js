import { createClient } from "@supabase/supabase-js";

import parse from "querystring";

const supabase = createClient(
  process.env["supabaseUrl"],
  process.env["supabaseKey"],
);

const twilio_client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);
exports.handler = async (event, _context) => {
  let body = {};

  try {
    body = JSON.parse(event.body);
  } catch (e) {
    body = parse(event.body);
  }

  if (
    !body.junction_pub || !body.rsvp || (body.rsvp == "attending" && !body.help)
  ) {
    console.log("[SPAM DETECTED] Required fields not defined.");

    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "[SPAM DETECTED] Required fields not defined.",
      }),
    };
  }

  const { junction_pub, rsvp, help } = body;

  let message = "Error. Ping Shy to fix things.";
  let updatedRsvp;
  let currentRsvp;
  await supabase.from("event_attendee_junction").select("rsvp")
    .eq("public_id", junction_pub).then((result) => {
      currentRsvp = result.data[0]["rsvp"];
    })
    .catch((e) => {
      console.error(e.stack);
      return { statusCode: 500 };
    })
    .then(async () => {
      updatedRsvp = await supabase
        .from("event_attendee_junction")
        .update({ rsvp: rsvp, help: help })
        .eq("public_id", junction_pub)
        .select("rsvp")
        .then((result) => {
          return result.data[0]["rsvp"];
        })
        .catch((e) => {
          console.error(e.stack);
          return { statusCode: 500 };
        });
    });
  if (currentRsvp == rsvp) {
    return { statusCode: 200,body: JSON.stringify(200), };      

  }

  const phoneAndEvent = await supabase
    .from("event_attendee_junction")
    .select("attendee(phone), events(event)")
    .eq("public_id", junction_pub)
    .then((result) => {
      return result.data[0];
    })
    .catch((e) => {
      console.error(e.stack);
      return { statusCode: 500, body: JSON.stringify(error) };
    });

  switch (updatedRsvp) {
    case "attending":
      message = "You're going to " +
        phoneAndEvent["events"]["event"] +
        "! :) \nView details: https://shy.party/rsvp/" +
        junction_pub +
        "/";
      break;
    case "maybe":
      message = "You RSVP-ed Maybe to " +
        phoneAndEvent["events"]["event"] +
        ". :| \nOnce you know if you can go, update your RSVP: https://shy.party/rsvp/" +
        junction_pub +
        "/";
      break;
    case "not_attending":
      message = ":( Sorry you can't make it to " +
        phoneAndEvent["events"]["event"] +
        ". I've turned off the reminder texts for this one.\nChange your mind anytime: https://shy.party/rsvp/" +
        junction_pub +
        "/";
  }
  return await twilio_client.messages
    .create({
      body: message,
      from: process.env.TWILIO_FROM_Number,
      to: phoneAndEvent["attendee"]["phone"],
    })
    .then((message) => {
      return { statusCode: 200, body: JSON.stringify(message.sid) };
    })
    .catch(function (error) {
      return { statusCode: 500, body: JSON.stringify(error) };
    });
};
