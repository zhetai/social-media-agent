import "dotenv/config";
import { Client } from "@langchain/langgraph-sdk";

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
        twitterUserId: process.env.TWITTER_USER_ID,
      },
    },
  });
}

invokeGraph().catch(console.error);
