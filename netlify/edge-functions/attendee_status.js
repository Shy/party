const API_ENDPOINT =
    "https://app.superblocks.com/agent/v1/workflows/0e26c575-344c-483c-a848-f76e78ee4c86?environment=production";

export default async (request, context) => {
    const url = new URL(request.url);
    const env_vars = Deno.env.toObject();
    const split_path = url.pathname.split("/");
    let event_junction_pub_id;
    if (split_path[split_path.length - 1] == "") {
        event_junction_pub_id = split_path[split_path.length - 2];
    } else {
        event_junction_pub_id = split_path[split_path.length - 1];
    }
    let SBresponse;
    try {
        SBresponse = await fetch(API_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + env_vars["SUPERBLOCKS_PROD_WF"],
            },
            body: JSON.stringify({ event_junction_pub_id: event_junction_pub_id }),
        });
    } catch (err) {
        return {
            statusCode: err.statusCode || 500,
            body: JSON.stringify({
                error: err.message,
            }),
        };
    }

    const response = await context.next();
    const page = await response.text();
    const jsonData = await SBresponse.json();
    const jsonjsonData = JSON.parse(jsonData["data"]);

    let updatedPage = page
        .replace(/STATUS_UNKNOWN/i, jsonjsonData["status"])
        .replace(/ATTENDING_UNKOWN/i, jsonjsonData["attending"]);

    return new Response(updatedPage, response);
};
