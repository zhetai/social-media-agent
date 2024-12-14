// import "dotenv/config";
// import { Client } from "@langchain/langgraph-sdk";

// async function main() {
//   const client = new Client({
//     apiUrl: "ADD_URL_HERE",
//   });

//   const res = await client.crons.create("ingest_data", {
//     schedule: "0 0 * * *",
//     config: {
//       configurable: {
//         slackChannelId: "",
//         maxDaysHistory: 1,
//       }
//     },
//     input: {}
//   });
//   console.log("Created cron");
//   console.log(res);

//   const crons = await client.crons.search();
//   console.log("Crons");
//   console.log(crons)
// }

// main().catch(console.error);

// async function backfill() {
// const client = new Client({
//   apiUrl: "ADD_URL_HERE",
// });

//   const thread = await client.threads.create();
//   const res = await client.runs.create(thread.thread_id, "ingest_data", {
//     config: {
//       configurable: {
//         slackChannelId: "",
//         maxDaysHistory: 7,
//       }
//     },
//     input: {}
//   });
//   console.log("Created run");
//   console.log(res);
// }

// backfill().catch(console.error);

// async function deleteCron() {
//   const cronId = ""

//   const client = new Client({
//     apiUrl: "ADD_URL_HERE",
//   });

//   await client.crons.delete(cronId);
//   console.log("Deleted cron");
//   const crons = await client.crons.search();
//   console.log("Crons");
//   console.log(crons)
// }

// deleteCron().catch(console.error);
