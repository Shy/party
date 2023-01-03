const axios = require("axios");
const { parse } = require("querystring");
const webhook_url =
    "https://app.superblocks.com/agent/v1/workflows/7bbfb2f0-3d67-43ac-983e-59885ece99e8?environment=production";
exports.handler = (event, context, callback) => {
    let body = {};

    try {
        body = JSON.parse(event.body);
    } catch (e) {
        body = parse(event.body);
    }

    if (!body.junction_pub || !body.rsvp) {
        console.log("[SPAM DETECTED] Required fields not defined.");
        console.log(body);
        return callback(null, {
            statusCode: 400,
            body: JSON.stringify({
                error: "[SPAM DETECTED] Required fields not defined.",
            }),
        });
    }
    console.log(body.junction_pub);
    console.log(body.rsvp);
    axios({
        method: "post",
        url: webhook_url,
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + process.env.SUPERBLOCKS_PROD_WF,
        },
        data: JSON.stringify({
            event_junction_public_id: body.junction_pub,
            rsvp: body.rsvp,
        }),
    })
        .then(function (response) {
            console.log(`status:${response.status}`);
            console.log(`success:${response.data.responseMeta.success}`);

            if (response.data.responseMeta.success == true) {
                switch (response.data.data[0].rsvp) {
                    case "attending":
                        message =
                            "Your response was recorded successfully. I have you marked down as attending! 😍";
                        break;
                    case "maybe":
                        message =
                            "Your response was recorded successfully. I have you marked down as a maybe. Come back soon to let me know what's going on with you. 🤔";
                        break;
                    default:
                        message =
                            "Your response was recorded successfully. I have you marked down as not being able to make it. 😢. Feel free to change your mind anytime.";
                }

                return callback(null, {
                    statusCode: 200,
                    body: JSON.stringify({
                        message: message,
                    }),
                });
            }
        })
        .catch(function (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
            } else if (error.request) {
                // The request was made but no response was received
                console.log(error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.log("Error", error.message);
            }
            console.log(error.config);
        });
};
