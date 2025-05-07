import { Connection, Client } from "@temporalio/client";
import { getAttendeeStatusInfo, updateAttendeeRSVP } from "./workflows.js";
import { nanoid } from "nanoid";
import { TASK_QUEUE_NAME } from "./shared.js";
import process from "process";

async function run() {
  if (process.argv.length <= 2) {
    console.error("Must specify a Public Junction ID");
    process.exit(1);
  }

  const junction_slug = process.argv[2];
  const connection = await Connection.connect({ address: "localhost:7233" });
  const client = new Client({ connection });

  const handle = await client.workflow.start(getAttendeeStatusInfo, {
    taskQueue: TASK_QUEUE_NAME,
    args: [junction_slug],
    workflowId: junction_slug + "-lookup-" + nanoid(5),
  });

  await client.workflow.start(updateAttendeeRSVP, {
    taskQueue: TASK_QUEUE_NAME,
    args: [junction_slug, "attending", "🧹"],
    workflowId: junction_slug + "-update-" + nanoid(5),
  });
  console.log(await handle.result());
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
