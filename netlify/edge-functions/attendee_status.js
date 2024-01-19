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
        .select("event_id, rsvp", "attendee_id, attendee(attendee)")
        .eq("public_id", event_junction_pub_id);

    const attending_lookup = await supabase
        .from("event_attendee_junction")
        .select("plus_one, rsvp, attendee(attendee)")
        .eq("event_id", event_id_lookup.data[0]["event_id"])
        .eq("rsvp", "attending")
        .order("updated_at", { ascending: true });

    let attendingArray = [];
    attending_lookup.data.forEach((attendee) => {
        attendingArray.push(attendee.attendee.attendee);
    }, attendingArray);

    try {
        const response = await context.next();
        const page = await response.text();
        const updatedPage = page
            .replace(
                /STATUS_UNKNOWN/i,
                status[event_id_lookup.data[0]["rsvp"]] ?? "invited to attend"
            )
            .replace(/ATTENDEE_STATUS_UNKNOWN/i, event_id_lookup.data[0]["rsvp"] || "")
            .replace(/ATTENDEES_UNKNOWN/i, attendingArray);

        return new Response(updatedPage, response);
    } catch (err) {
        return {
            statusCode: err.statusCode || 404,
            body: JSON.stringify(404),
        };
    }
};
