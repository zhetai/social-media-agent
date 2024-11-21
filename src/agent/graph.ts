import { END, Send, START, StateGraph } from "@langchain/langgraph";
import { GraphAnnotation } from "./state.js";
import { ingestData } from "./nodes/ingest-data.js";
import { generatePostGraph } from "./subgraphs/generate-post/graph.js";

/**
 * Other thinking
 * 1. ingest data
 * 2. invoke a subgraph for each message
 *  inside the subgraph, identify the content, generate a report, generate a post, and schedule a post (interrupt beforehand)
 */

function routeAfterIdentifyContent(
  state: typeof GraphAnnotation.State,
): Array<Send> {
  return state.slackMessages.flatMap((m) => {
    if (m.links.length) {
      return new Send("generatePostGraph", {
        slackMessage: m,
      });
    }
    return [];
  });
}

const builder = new StateGraph(GraphAnnotation)
  // Ingests posts from Slack channel.
  .addNode("ingestData", ingestData)
  // Subgraph which is invoked once for each message.
  // This subgraph will verify content is relevant to
  // LangChain, generate a report on the content, and
  // finally generate and schedule a post.
  .addNode("generatePostGraph", generatePostGraph)

  // Start node
  .addEdge(START, "ingestData")
  // After ingesting data, route to the subgraph for each message.
  .addConditionalEdges("ingestData", routeAfterIdentifyContent, [
    "generatePostGraph",
  ])
  // Finish after generating the Twitter post.
  .addEdge("generatePostGraph", END);

export const graph = builder.compile();

graph.name = "Social Media Agent";
