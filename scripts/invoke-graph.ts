import "dotenv/config";
import { Client } from "@langchain/langgraph-sdk";
import { SlackClient } from "../src/clients/slack.js";
import { extractUrlsFromSlackText } from "../src/agents/utils.js";

async function invokeGraph(url: string) {
  const client = new Client({
    apiUrl: process.env.LANGGRAPH_API_URL,
  });

  const { thread_id } = await client.threads.create();
  await client.runs.create(thread_id, "generate_post", {
    input: {
      links: [url],
    },
  });
}

async function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function main() {
  console.log("Running main");
  const slackClient = new SlackClient({
    channelId: "C06BU7XF5S7",
  });
  const messages = await slackClient.fetchLast24HoursMessages({
    maxDaysHistory: 60,
  });

  const links = messages.flatMap((msg) => {
    const links = extractUrlsFromSlackText(msg.text);
    if (!links.length) {
      return [];
    }
    return links;
  });

  console.log("Total links found:", links.length);

  // Process links in chunks of 10
  for (let i = 0; i < links.length; i += 10) {
    const chunk = links.slice(i, i + 10);
    console.log(
      `Processing chunk ${i / 10 + 1} of ${Math.ceil(links.length / 10)}`,
    );

    // Process each URL in the chunk
    for (const url of chunk) {
      await invokeGraph(url);
    }

    // Sleep for 1 minute after processing each chunk (except for the last chunk)
    if (i + 10 < links.length) {
      console.log("Sleeping for 1 minute before processing next chunk...");
      await sleep(60000);
    }
  }

  console.log("Finished processing all links");
}

main().catch(console.error);
