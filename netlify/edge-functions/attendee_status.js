const fetch = require("node-fetch");

const API_ENDPOINT =
    "https://app.superblocks.com/agent/v1/workflows/0e26c575-344c-483c-a848-f76e78ee4c86?environment=production";

export default async (request, context) => {
    const url = new URL(request.url);

    // Look for the "?method=transform" query parameter, and return if we don't find it
    if (url.pathname.startsWith("/rsvp/")) {
        const SUPERBLOCKS_PROD_WF = process.env.SUPERBLOCKS_PROD_WF;
        split_path = url.pathname.split("/");

        if (split_path[split_path.length - 1] == "") {
            event_junction_pub_id = split_path[split_path.length - 2];
        } else {
            event_junction_pub_id = split_path[split_path.length - 1];
        }

        let response;
        try {
            response = await fetch(API_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + SUPERBLOCKS_PROD_WF,
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

        const page = await response.JSON();

        // Search for the placeholder
        const regex = /STATUS_UNKNOWN/i;

        // Replace the content with the current location
        const updatedPage = page.replace(regex, response["data"][0]["rsvp"]);

        // Return the response
        return new Response(updatedPage, response);
    } else {
        return;
    }
};
