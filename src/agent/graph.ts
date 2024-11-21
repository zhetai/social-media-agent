import { END, START, StateGraph } from "@langchain/langgraph";
import { GraphAnnotation } from "./state.js";
import { ingestData } from "./nodes/ingest-data.js";
import { generateLinkedinPost } from "./nodes/generate-post/linkedin.js";
import { generateTwitterPost } from "./nodes/generate-post/twitter.js";
import { identifyContentGraph } from "./subgraphs/identify-content/graph.js";
import { schedulePosts } from "./nodes/schedule-posts.js";

function routeAfterIdentifyContent(
  state: typeof GraphAnnotation.State,
): "generateLinkedinPost" | typeof END {
  if (state.relevantProducts && state.relevantProducts.length > 0) {
    return "generateLinkedinPost";
  }
  return END;
}

const builder = new StateGraph(GraphAnnotation)
  // Ingests posts from Slack channel.
  .addNode("ingestData", ingestData)
  // Subgraph which identifies content is relevant to LangChain products,
  // and if so it generates a report on the content.
  .addNode("identifyContent", identifyContentGraph)
  // Generates a post on the content for LinkedIn.
  .addNode("generateLinkedinPost", generateLinkedinPost)
  // Generates a post on the content for Twitter.
  .addNode("generateTwitterPost", generateTwitterPost)
  // Interrupts the node for human in the loop, then schedules the
  // post for Twitter/LinkedIn.
  .addNode("schedulePosts", schedulePosts)

  // Start node
  .addEdge(START, "ingestData")
  .addEdge("ingestData", "identifyContent")
  // Route to post generators or end node.
  .addConditionalEdges("identifyContent", routeAfterIdentifyContent, [
    "generateLinkedinPost",
    END,
  ])
  // After generating the LinkedIn post, generate the Twitter post.
  .addEdge("generateLinkedinPost", "generateTwitterPost")
  // Finally, schedule the post. This will also throw an interrupt
  // so a human can edit the post before scheduling.
  .addEdge("generateTwitterPost", "schedulePosts")
  // Finish after generating the Twitter post.
  .addEdge("schedulePosts", END);

export const graph = builder.compile();

graph.name = "Social Media Agent";
