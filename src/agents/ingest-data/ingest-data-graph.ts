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
import {
  LINKEDIN_ACCESS_TOKEN,
  LINKEDIN_ORGANIZATION_ID,
  LINKEDIN_PERSON_URN,
  LINKEDIN_USER_ID,
  POST_TO_LINKEDIN_ORGANIZATION,
  TWITTER_TOKEN,
  TWITTER_TOKEN_SECRET,
  TWITTER_USER_ID,
} from "../generate-post/constants.js";

async function generatePostFromMessages(
  state: typeof IngestDataAnnotation.State,
  config: LangGraphRunnableConfig,
) {
  const client = new Client({
    apiUrl: `http://localhost:${process.env.PORT}`,
  });
  for await (const link of state.links) {
    const thread = await client.threads.create();
    const postToLinkedInOrg =
      config.configurable?.[POST_TO_LINKEDIN_ORGANIZATION] != null
        ? config.configurable?.[POST_TO_LINKEDIN_ORGANIZATION]
        : process.env.POST_TO_LINKEDIN_ORGANIZATION;
    await client.runs.create(thread.thread_id, "generate_post", {
      input: {
        links: [link],
      },
      config: {
        configurable: {
          [TWITTER_USER_ID]:
            config.configurable?.[TWITTER_USER_ID] ||
            process.env.TWITTER_USER_ID,
          [LINKEDIN_USER_ID]:
            config.configurable?.[LINKEDIN_USER_ID] ||
            process.env.LINKEDIN_USER_ID,
          [TWITTER_TOKEN]:
            config.configurable?.[TWITTER_TOKEN] ||
            process.env.TWITTER_USER_TOKEN,
          [TWITTER_TOKEN_SECRET]:
            config.configurable?.[TWITTER_TOKEN_SECRET] ||
            process.env.TWITTER_USER_TOKEN_SECRET,
          [LINKEDIN_ACCESS_TOKEN]:
            config.configurable?.[LINKEDIN_ACCESS_TOKEN] ||
            process.env.LINKEDIN_ACCESS_TOKEN,
          [LINKEDIN_PERSON_URN]:
            config.configurable?.[LINKEDIN_PERSON_URN] ||
            process.env.LINKEDIN_PERSON_URN,
          [LINKEDIN_ORGANIZATION_ID]:
            config.configurable?.[LINKEDIN_ORGANIZATION_ID] ||
            process.env.LINKEDIN_ORGANIZATION_ID,
          [POST_TO_LINKEDIN_ORGANIZATION]: postToLinkedInOrg,
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
