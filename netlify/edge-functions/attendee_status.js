import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const env_vars = Deno.env.toObject();
const supabase = createClient(env_vars["supabaseUrl"], env_vars["supabaseKey"]);

export default async (request, context) => {
  const url = new URL(request.url);
  const split_path = url.pathname.split("/");
  let event_junction_pub_id;
  if (split_path[split_path.length - 1] == "") {
    event_junction_pub_id = split_path[split_path.length - 2];
  } else {
    event_junction_pub_id = split_path[split_path.length - 1];
  }

  const help = {
    "🧽": "attending and washing the dishes after the main course",
    "🧹": "attending and gonna make sure the apartment looks as clean as it did before folks arrived",
    "🧤": "attending and washing the dishes after desert",
    "🗑️": "attending and will take the trash down to the scary basement whenever it gets full",
    "🪵": "attending and doing assorted woodworking projects around my home",
    "🧑‍🍼": "attending and I should feel thankful that I've managed to get you out of your apartment for the first time in months",
    "🍳": "hosting",
    "🍽️": "attending and moving furniture so people can eat at",
    "☕": "attending and just enjoying good food and good friends",
  };

  // Combine queries: first get the event_id, then use it in a single combined query
  const event_id_lookup = await supabase
    .from("event_attendee_junction")
    .select("event_id, rsvp, help, attendee_id, attendee(attendee)")
    .eq("public_id", event_junction_pub_id)
    .single();

  if (event_id_lookup.error) {
    return new Response("Not found", { status: 404 });
  }

  const attending_lookup = await supabase
    .from("event_attendee_junction")
    .select("plus_one, rsvp, help, attendee(attendee)")
    .eq("event_id", event_id_lookup.data.event_id)
    .eq("rsvp", "attending")
    .order("updated_at", { ascending: true });

  const attendingArray = attending_lookup.data.map(attendee => {
    const plusOne = attendee.plus_one;
    const attendeeName = attendee.attendee.attendee.split(" ")[0];
    return plusOne === 0 ? attendeeName : `${attendeeName} + ${plusOne}`;
  });

  const userData = event_id_lookup.data;
  let statusKnown = "";
  if (userData.rsvp == "attending") {
    statusKnown = help[userData.help];
  } else if (userData.rsvp == "not_attending") {
    statusKnown = "unable to attend";
  } else if (userData.rsvp == "maybe") {
    statusKnown = "undecided about attending";
  } else {
    statusKnown = "invited to attend";
  }
  try {
    const response = await context.next();
    const page = await response.text();
    const updatedPage = page
      .replace(/STATUS_UNKNOWN/i, statusKnown)
      .replace(
        /ATTENDEE_STATUS_UNKNOWN/i,
        userData.rsvp || ""
      )
      .replace(/ATTENDEES_UNKNOWN/i, attendingArray)
      .replace(
        /ATTENDEE_STATUS_HELP_UNKNOWN/i,
        userData.help || ""
      );

    return new Response(updatedPage, response);
  } catch (err) {
    return {
      statusCode: err.statusCode || 404,
      body: JSON.stringify(404),
    };
  }
};
