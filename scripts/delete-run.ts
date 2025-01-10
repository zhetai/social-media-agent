import "dotenv/config";
import { Client } from "@langchain/langgraph-sdk";

async function deleteRun() {
  const threadId = "ADD_THREAD_ID_HERE";
  const runId = "ADD_RUN_ID_HERE";
  const client = new Client({
    apiUrl: process.env.LANGGRAPH_API_URL,
  });

  await client.runs.delete(threadId, runId);
}

deleteRun().catch(console.error);
