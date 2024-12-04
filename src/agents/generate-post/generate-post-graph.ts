import { END, START, StateGraph } from "@langchain/langgraph";
import {
  GraphAnnotation,
  ConfigurableAnnotation,
} from "./generate-post-state.js";
import { generateContentReport } from "./nodes/generate-content-report.js";
import { generatePost } from "./nodes/geterate-post/index.js";
import { humanNode } from "./nodes/human-node.js";
import { rewritePost } from "./nodes/rewrite-post.js";
import { schedulePost } from "./nodes/schedule-post.js";
import { condensePost } from "./nodes/condense-post.js";
import { removeUrls } from "../utils.js";
import { verifyLinksGraph } from "../verify-links/verify-links-graph.js";
import { VerifyLinksGraphSharedAnnotation } from "../verify-links/verify-links-state.js";

function routeAfterGeneratingReport(
  state: typeof GraphAnnotation.State,
): "generatePost" | typeof END {
  if (state.report) {
    return "generatePost";
  }
  return END;
}

function rewriteOrEndConditionalEdge(
  state: typeof GraphAnnotation.State,
): "rewritePost" | "schedulePost" | typeof END {
  if (state.next) {
    return state.next;
  }
  return END;
}

function condenseOrHumanConditionalEdge(
  state: typeof GraphAnnotation.State,
): "condensePost" | "humanNode" {
  const cleanedPost = removeUrls(state.post || "");
  if (cleanedPost.length > 300) {
    return "condensePost";
  }
  return "humanNode";
}

// Finally, create the graph itself.
const generatePostBuilder = new StateGraph(
  GraphAnnotation,
  ConfigurableAnnotation,
)
  .addNode("verifyLinksSubGraph", verifyLinksGraph, {
    input: VerifyLinksGraphSharedAnnotation,
  })

  // Generates a Tweet/LinkedIn post based on the report content.
  .addNode("generatePost", generatePost)
  // Attempt to condense the post if it's too long.
  .addNode("condensePost", condensePost)
  // Interrupts the node for human in the loop.
  .addNode("humanNode", humanNode)
  // Schedules the post for Twitter/LinkedIn.
  .addNode("schedulePost", schedulePost)
  // Rewrite a post based on the user's response.
  .addNode("rewritePost", rewritePost)
  // Generates a report on the content.
  .addNode("generateContentReport", generateContentReport)

  // Start node
  .addEdge(START, "verifyLinksSubGraph")

  // After verifying the different content types, we should generate a report on them.
  .addEdge("verifyLinksSubGraph", "generateContentReport")

  // Once generating a report, we should confirm the report exists (meaning the content is relevant).
  .addConditionalEdges("generateContentReport", routeAfterGeneratingReport, [
    "generatePost",
    END,
  ])

  // After generating the post for the first time, check if it's too long,
  // and if so, condense it. Otherwise, route to the human node.
  .addConditionalEdges("generatePost", condenseOrHumanConditionalEdge, [
    "condensePost",
    "humanNode",
  ])

  // After condensing the post, always route to the human node.
  .addEdge("condensePost", "humanNode")

  // Always route back to `humanNode` if the post was re-written.
  .addEdge("rewritePost", "humanNode")

  // If the schedule post is successful, end the graph.
  .addConditionalEdges("humanNode", rewriteOrEndConditionalEdge, [
    "rewritePost",
    "schedulePost",
    END,
  ])
  // Always end after scheduling the post.
  .addEdge("schedulePost", END);

export const generatePostGraph = generatePostBuilder.compile();

generatePostGraph.name = "Generate Post Subgraph";
