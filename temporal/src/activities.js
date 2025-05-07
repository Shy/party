import { supabase, twilioClient, twilioPhoneNumber } from "./shared.js";

export async function getEventJunctionData(junction_slug) {
  const event_id_lookup = await supabase
    .from("event_attendee_junction")
    .select(
      "event_id, rsvp, help, attendee_id, attendee(attendee), events(event,location,date,description,image_id)"
    )
    .eq("public_id", junction_slug);
  const help = {
    "🧽": "attending and washing the dishes after the main course",
    broomstick:
      "attending and gonna make sure the apartment looks as clean as it did before folks arrived",
    "🧹": "attending and gonna make sure the apartment looks as clean as it did before folks arrived",
    "🧤": "attending and washing the dishes after desert",
    "🗑️": "attending and will take the trash down to the scary basement whenever it gets full",
    "🪵": "attending and doing assorted woodworking projects around my home",
    "🧑‍🍼": "attending and I should feel thankful that I've managed to get you out of your apartment for the first time in months",
    "🍳": "hosting",
    "🍽️": "attending and moving furniture so people can eat at",
    "☕": "attending and just enjoying good food and good friends",
  };

  let humanReadableStatus = "";
  if (event_id_lookup.data[0]["rsvp"] == "attending") {
    humanReadableStatus = help[event_id_lookup.data[0]["help"]];
  } else if (event_id_lookup.data[0]["rsvp"] == "not_attending") {
    humanReadableStatus = "unable to attend";
  } else if (event_id_lookup.data[0]["rsvp"] == "maybe") {
    humanReadableStatus = "undecided about attending";
  } else {
    humanReadableStatus = "invited to attend";
  }

  return {
    attendee: event_id_lookup.data[0]["attendee"]["attendee"],
    rsvp: event_id_lookup.data[0]["rsvp"],
    help: event_id_lookup.data[0]["help"],
    event_id: event_id_lookup.data[0]["event_id"],
    event: event_id_lookup.data[0]["events"],
    humanReadableStatus,
  };
}

export async function getEventAttendence(event_id) {
  const attending_lookup = await supabase
    .from("event_attendee_junction")
    .select("plus_one, rsvp, help, attendee(attendee)")
    .eq("event_id", event_id)
    .eq("rsvp", "attending")
    .order("updated_at", { ascending: true });

  const attendingArray = attending_lookup.data.map((attendee) => {
    const plusOne = attendee.plus_one;
    const attendeeName = attendee.attendee.attendee.split(" ")[0];
    return plusOne === 0 ? attendeeName : `${attendeeName} + ${plusOne}`;
  });

  return attendingArray;
}

export async function updateRSVP(junction_slug, rsvp, help) {
  await supabase
    .from("event_attendee_junction")
    .update({ rsvp, help })
    .eq("public_id", junction_slug)
    .select("rsvp")
    .then((result) => {
      return result.data[0]["rsvp"];
    })
    .catch((e) => {
      console.error(e.stack);
      return { statusCode: 500 };
    });

  return { statusCode: 200, body: JSON.stringify(200) };
}

export async function getAttendeePhone(junction_slug) {
  const phoneAndEvent = await supabase
    .from("event_attendee_junction")
    .select("attendee(phone), events(event)")
    .eq("public_id", junction_slug)
    .then((result) => {
      return result.data[0];
    })
    .catch((e) => {
      console.error(e.stack);
      return { statusCode: 500, body: JSON.stringify(e.JSON) };
    });
  return {
    phone: phoneAndEvent.attendee.phone,
    event: phoneAndEvent.events.event,
  };
}

export async function sendAttendeeUpdate(phone, event, rsvp, junction_slug) {
  let message = "Error. Ping Shy to fix things.";
  switch (rsvp) {
    case "attending":
      message =
        "You're going to " +
        event +
        "! :) \nView details: https://shy.party/rsvp/" +
        junction_slug +
        "/";
      break;
    case "maybe":
      message =
        "You RSVP-ed Maybe to " +
        event +
        ". :| \nOnce you know if you can go, update your RSVP: https://shy.party/rsvp/" +
        junction_slug +
        "/";
      break;
    case "not_attending":
      message =
        ":( Sorry you can't make it to " +
        event +
        ". I've turned off the reminder texts for this one.\nChange your mind anytime: https://shy.party/rsvp/" +
        junction_slug +
        "/";
  }
  return await twilioClient.messages
    .create({
      body: await message,
      from: twilioPhoneNumber,
      to: phone,
    })
    .then((message) => {
      return { statusCode: 200, body: JSON.stringify(message.sid) };
    })
    .catch(function (error) {
      return { statusCode: 500, body: JSON.stringify(error) };
    });
}
