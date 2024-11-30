import {
  END,
  LangGraphRunnableConfig,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { ConfigurableAnnotation, GraphAnnotation } from "./state.js";
import { ingestData } from "./nodes/ingest-data.js";
import { Client } from "@langchain/langgraph-sdk";

async function generatePostFromMessages(
  state: typeof GraphAnnotation.State,
  config: LangGraphRunnableConfig,
) {
  const client = new Client();
  for await (const m of state.slackMessages) {
    if (m.links.length) {
      const thread = await client.threads.create();
      await client.runs.create(thread.thread_id, "generate_post", {
        input: {
          slackMessage: m,
        },
        config: {
          configurable: {
            ...config.configurable,
          },
        },
      });
    }
  }
  return {};
}

const builder = new StateGraph(GraphAnnotation, ConfigurableAnnotation)
  // Ingests posts from Slack channel.
  .addNode("ingestData", ingestData)
  // Subgraph which is invoked once for each message.
  // This subgraph will verify content is relevant to
  // LangChain, generate a report on the content, and
  // finally generate and schedule a post.
  .addNode("generatePostGraph", generatePostFromMessages)
  // Start node
  .addEdge(START, "ingestData")
  // After ingesting data, route to the subgraph for each message.
  .addEdge("ingestData", "generatePostGraph")
  // Finish after generating the Twitter post.
  .addEdge("generatePostGraph", END);

export const graph = builder.compile();

graph.name = "Social Media Agent";
