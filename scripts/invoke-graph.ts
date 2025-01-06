import "dotenv/config";
import { Client } from "@langchain/langgraph-sdk";
import { SlackClient } from "../src/clients/slack.js";
import { extractUrlsFromSlackText } from "../src/agents/utils.js";
import { getAllUsedLinks } from "./get-all-used-links.js";

async function main() {
  console.log("Running main");
  const slackClient = new SlackClient({
    channelId: "C06BU7XF5S7",
  });
  const messages = await slackClient.fetchLast24HoursMessages({
    maxDaysHistory: 63,
  });

  const links = messages.flatMap((msg) => {
    const links = extractUrlsFromSlackText(msg.text);
    if (!links.length) {
      return [];
    }
    return links;
  });

  console.log("Total links found:", links.length);
  const allUsedLinks = await getAllUsedLinks();

  const uniqueLinks = new Set(allUsedLinks);
  const unusedLinks = links.filter((link) => !uniqueLinks.has(link));
  console.log("Total unique unused links found:", unusedLinks.length);

  const client = new Client({
    apiUrl: process.env.LANGGRAPH_API_URL,
  });
  const { thread_id } = await client.threads.create();
  await client.runs.create(thread_id, "ingest_data", {
    input: {
      links: unusedLinks,
    },
    config: {
      configurable: {
        skipIngest: true,
      },
    },
  });
}

main().catch(console.error);
