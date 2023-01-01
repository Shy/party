// Simple Contact Form Spam Filter
exports.handler = function (event, context, callback) {
    // 1. Parse the form
    try {
        // NB: Using `var` since `const` is block-scoped
        var body = JSON.parse(event.body);
    } catch (e) {
        console.log(event);
        callback(e.message, {
            statusCode: 400,
            body: `[ERROR] Invalid JSON - ${e.message}`,
        });
        return;
    }

    // 2. Filter
    if (!body.payload.data.rsvp || !body.payload.data["junction_pub"]) {
        const errorMessage = "[SPAM DETECTED] Required fields not defined.";
        console.log(errorMessage);
        callback(null, {
            statusCode: 200,
            body: errorMessage,
        });
        return;
    }

    // 3. Forward data to webhook (ie, send email)

    const URL = require("url");
    const https = require("https");

    // TODO: Lazy testing. Replace with `dotenv`
    // const webhook_url = URL.parse('https://chrisjmears.com/test')
    const webhook_url = URL.parse(
        "https://app.superblocks.com/agent/v1/workflows/7bbfb2f0-3d67-43ac-983e-59885ece99e8?environment=production"
    );
    const options = {
        hostname: webhook_url.hostname,
        path: webhook_url.pathname,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + process.env.SUPERBLOCKS_PROD_WF,
        },

        body: {
            rsvp: body["payload"]["data"]["rsvp"],
            event_junction_public_id: body["payload"]["data"]["junction_pub"],
        },
    };
    // Set up webhook request
    const req = https.request(options, function (res) {
        res.setEncoding("utf8");
    });

    // Handle webhook request error
    req.on("error", function (e) {
        const errorMessage = `[ERROR] Problem with request: ${e.message}`;
        console.log(errorMessage);

        callback(e.message, {
            statusCode: 400,
            body: errorMessage,
        });
    });

    // Send form data to webhook request and end request
    req.end(
        JSON.stringify({
            rsvp: body["payload"]["data"]["rsvp"],
            event_junction_public_id: body["payload"]["data"]["junction_pub"],
        })
    );
    callback(null, {
        statusCode: 302,
        headers: {
            Refresh: 1,
            "Cache-Control": "no-cache",
        },
        body: JSON.stringify(),
    });
};
