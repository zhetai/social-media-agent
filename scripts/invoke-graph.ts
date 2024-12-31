import "dotenv/config";
import { Client } from "@langchain/langgraph-sdk";
import { TWITTER_USER_ID } from "../src/agents/generate-post/constants.js";

async function invokeGraph() {
  const repoUrl = "";

  const client = new Client({
    apiUrl: process.env.LANGGRAPH_API_URL,
  });

  const { thread_id } = await client.threads.create();
  await client.runs.create(thread_id, "generate_post", {
    input: {
      links: [repoUrl],
    },
    config: {
      configurable: {
        [TWITTER_USER_ID]: process.env.TWITTER_USER_ID,
      },
    },
  });
}

invokeGraph().catch(console.error);
