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

  let status = {
    attending: "",
    not_attending: "unable to attend",
    maybe: "a maybe for",
  };

  const help = {
    "🧽": "attending and washing the dishes after the main course",
    "🧹": "attending and staying to clean",
    "🧤": "attending and washing the dishes after desert",
    "🗑️": "attending and will take the trash down to the scary basement whenever it gets full",
    "🪵": "attending and doing assorted woodworking projects around the home",
    "🧑‍🍼": "attending and I should feel thankful that I've managed to get you out of your apartment for the first time in months",
  };

  const event_id_lookup = await supabase
    .from("event_attendee_junction")
    .select("event_id, rsvp, help, attendee_id, attendee(attendee)")
    .eq("public_id", event_junction_pub_id);
  const attending_lookup = await supabase
    .from("event_attendee_junction")
    .select("plus_one, rsvp, attendee(attendee)")
    .eq("event_id", event_id_lookup.data[0]["event_id"])
    .eq("rsvp", "attending")
    .order("updated_at", { ascending: true });

  let attendingArray = [];
  attending_lookup.data.forEach((attendee) => {
    attendingArray.push(attendee.attendee.attendee.split(" ")[0]);
  }, attendingArray);

  let rsvpMessage = "invited to attend";
  if (status[event_id_lookup.data[0]["rsvp"]] == "attending") {
    status["attending"] = help[event_id_lookup.data[0]["help"]];
  }

  try {
    const response = await context.next();
    const page = await response.text();
    const updatedPage = page
      .replace(
        /STATUS_UNKNOWN/i,
        status[event_id_lookup.data[0]["rsvp"]] || "invited to attend"
      )
      .replace(
        /ATTENDEE_STATUS_UNKNOWN/i,
        event_id_lookup.data[0]["rsvp"] || ""
      )
      .replace(/ATTENDEES_UNKNOWN/i, attendingArray)
      .replace(
        /ATTENDEE_STATUS_HELP_UNKNOWN/i,
        event_id_lookup.data[0]["help"] || ""
      );

    return new Response(updatedPage, response);
  } catch (err) {
    return {
      statusCode: err.statusCode || 404,
      body: JSON.stringify(404),
    };
  }
};
