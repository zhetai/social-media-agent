import {
  END,
  LangGraphRunnableConfig,
  START,
  StateGraph,
} from "@langchain/langgraph";
import {
  IngestDataConfigurableAnnotation,
  IngestDataAnnotation,
} from "./ingest-data-state.js";
import { ingestSlackData } from "./nodes/ingest-slack.js";
import { Client } from "@langchain/langgraph-sdk";

async function generatePostFromMessages(
  state: typeof IngestDataAnnotation.State,
  config: LangGraphRunnableConfig,
) {
  const client = new Client({
    apiUrl: `http://localhost:${process.env.PORT}`,
  });
  for await (const link of state.links) {
    const thread = await client.threads.create();
    await client.runs.create(thread.thread_id, "generate_post", {
      input: {
        links: [link],
      },
      config: {
        configurable: {
          twitterUserId: config.configurable?.twitterUserId || process.env.TWITTER_USER_ID,
          linkedInUserId: config.configurable?.linkedInUserId || process.env.LINKEDIN_USER_ID,
          twitterToken: config.configurable?.twitterToken || process.env.TWITTER_USER_TOKEN,
          twitterTokenSecret: config.configurable?.twitterTokenSecret || process.env.TWITTER_USER_TOKEN_SECRET,
        },
      },
    });
  }
  return {};
}

const builder = new StateGraph(
  IngestDataAnnotation,
  IngestDataConfigurableAnnotation,
)
  // Ingests posts from Slack channel.
  .addNode("ingestSlackData", ingestSlackData)
  // Subgraph which is invoked once for each message.
  // This subgraph will verify content is relevant to
  // LangChain, generate a report on the content, and
  // finally generate and schedule a post.
  .addNode("generatePostGraph", generatePostFromMessages)
  // Start node
  .addEdge(START, "ingestSlackData")
  // After ingesting data, route to the subgraph for each message.
  .addEdge("ingestSlackData", "generatePostGraph")
  // Finish after generating the Twitter post.
  .addEdge("generatePostGraph", END);

export const graph = builder.compile();

graph.name = "Social Media Agent";
