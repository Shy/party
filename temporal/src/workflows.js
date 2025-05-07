import * as workflow from "@temporalio/workflow";

// Load Activities and assign the Retry Policy

const {
  getEventJunctionData,
  getEventAttendence,
  getAttendeePhone,
  updateRSVP,
  sendAttendeeUpdate,
} = workflow.proxyActivities({
  retry: {
    initialInterval: "1 second",
    maximumInterval: "1 minute",
    backoffCoefficient: 2, // how much the retry interval increases.
    // maximumAttempts: 5, // maximum number of execution attempts. Unspecified means unlimited retries.
  },
  startToCloseTimeout: "1 minute", // maximum time allowed for a single Activity Task Execution.
});

export async function getAttendeeStatusInfo(junction_slug) {
  try {
    const EventJunction = await getEventJunctionData(junction_slug);
    try {
      const EventAttendees = await getEventAttendence(EventJunction.event_id);
      return {
        EventJunction,
        EventAttendees,
      };
    } catch (e) {
      throw new workflow.ApplicationFailure("Failed to get Attendee List");
    }
  } catch (e) {
    throw new workflow.ApplicationFailure("Failed to get Event Information");
  }
}

export async function updateAttendeeRSVP(junction_slug, rsvp, help) {
  try {
    const response = await updateRSVP(junction_slug, rsvp, help);
    if (response.statusCode !== 200) {
      throw new workflow.ApplicationFailure("Failed to Update RSVP");
    }
    try {
      const smsInfo = await getAttendeePhone(junction_slug);
      try {
        return await sendAttendeeUpdate(
          smsInfo.phone,
          smsInfo.event,
          rsvp,
          junction_slug
        );
      } catch (e) {
        throw new workflow.ApplicationFailure("Failed to send SMS");
      }
    } catch (e) {
      throw new workflow.ApplicationFailure(
        "Failed to get information for SMS"
      );
    }
  } catch (e) {
    throw new workflow.ApplicationFailure("Failed to get Event Information");
  }
}
