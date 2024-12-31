import "dotenv/config";
import { Client } from "@langchain/langgraph-sdk";
import {
  LINKEDIN_USER_ID,
  TWITTER_USER_ID,
} from "../src/agents/generate-post/constants.js";

async function invokeGraph() {
  const link = "https://github.com/langchain-ai/open-canvas";

  const client = new Client({
    apiUrl: process.env.LANGGRAPH_API_URL || "http://localhost:54367",
  });

  const { thread_id } = await client.threads.create();
  await client.runs.create(thread_id, "generate_post", {
    input: {
      links: [link],
    },
    config: {
      configurable: {
        [TWITTER_USER_ID]: process.env.TWITTER_USER_ID,
        [LINKEDIN_USER_ID]: process.env.LINKEDIN_USER_ID,
      },
    },
  });
}

invokeGraph().catch(console.error);
