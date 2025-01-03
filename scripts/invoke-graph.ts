import "dotenv/config";
import { Client } from "@langchain/langgraph-sdk";

async function invokeGraph() {
  const url = "";
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

invokeGraph().catch(console.error);
