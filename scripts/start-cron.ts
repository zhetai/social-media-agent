import "dotenv/config";
import { Client } from "@langchain/langgraph-sdk";

async function main() {
  const client = new Client({
    apiUrl: "ADD_URL_HERE",
  });

  const res = await client.crons.create("ingest_data", {
    schedule: "0 0 * * *",
    config: {
      configurable: {
        slackChannelId: "",
        maxDaysHistory: 1,
      }
    }
  });
  console.log("Created cron");
  console.log(res);

  const crons = await client.crons.search();
  console.log("Crons");
  console.log(crons)
}

main().catch(console.error);