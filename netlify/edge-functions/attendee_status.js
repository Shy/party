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

  const status = {
    attending: "attending",
    not_attending: "unable to attend",
    maybe: "a maybe for",
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
  switch (status[event_id_lookup.data[0]["rsvp"]]) {
    case "attending":
      switch (status[event_id_lookup.data[0]["help"]]) {
        case "🧹":
          rsvpMessage = "attending and staying to clean";
        case "🧽":
          rsvpMessage =
            "attending and washing the dishes after the main course";
        case "🧤":
          rsvpMessage = "attending and washing the dishes after desert";
        case "🗑️":
          rsvpMessage =
            "attending and will take the trash down to the scary basement whenever it gets full";
        case "🪵":
          rsvpMessage =
            "attending and doing assorted woodworking projects around the home";
        case "🧑‍🍼":
          rsvpMessage =
            "attending and I should feel thankful that I've managed to get you out of your apartment for the first time in months";
        default:
             rsvpMessage = "invited to attend";
      }
    case "maybe":
      rsvpMessage = "a maybe for";
    case "not_attending":
      rsvpMessage = "unable to attend";
    default:
      rsvpMessage = "invited to attend";
  }

  try {
    const response = await context.next();
    const page = await response.text();
    const updatedPage = page
      .replace(/STATUS_UNKNOWN/i, rsvpMessage)
      .replace(
        /ATTENDEE_STATUS_UNKNOWN/i,
        event_id_lookup.data[0]["rsvp"] || ""
      )
      .replace(/ATTENDEES_UNKNOWN/i, attendingArray)
      .replace(
        /ATTENDEE_STATUS_HELP_UNKNOWN/i,
        event_id_lookup.data[0]["help"] || "");

    return new Response(updatedPage, response);
  } catch (err) {
    return {
      statusCode: err.statusCode || 404,
      body: JSON.stringify(404),
    };
  }
};
