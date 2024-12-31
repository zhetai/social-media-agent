import { END, Send, START, StateGraph } from "@langchain/langgraph";
import {
  GeneratePostAnnotation,
  GeneratePostConfigurableAnnotation,
} from "./generate-post-state.js";
import { generateContentReport } from "./nodes/generate-content-report.js";
import { generatePost } from "./nodes/geterate-post/index.js";
import { humanNode } from "./nodes/human-node.js";
import { rewritePost } from "./nodes/rewrite-post.js";
import { schedulePost } from "./nodes/schedule-post.js";
import { condensePost } from "./nodes/condense-post.js";
import { removeUrls } from "../utils.js";
import { verifyLinksGraph } from "../verify-links/verify-links-graph.js";
import { authSocialsPassthrough } from "./nodes/auth-socials.js";
import { findImages } from "./nodes/find-images/index.js";

function routeAfterGeneratingReport(
  state: typeof GeneratePostAnnotation.State,
): "generatePost" | typeof END {
  if (state.report) {
    return "generatePost";
  }
  return END;
}

function rewriteOrEndConditionalEdge(
  state: typeof GeneratePostAnnotation.State,
): "rewritePost" | "schedulePost" | typeof END {
  if (state.next) {
    return state.next;
  }
  return END;
}

function condenseOrHumanConditionalEdge(
  state: typeof GeneratePostAnnotation.State,
): "condensePost" | "humanNode" {
  const cleanedPost = removeUrls(state.post || "");
  if (cleanedPost.length > 300) {
    return "condensePost";
  }
  return "humanNode";
}

function generateReportOrEndConditionalEdge(
  state: typeof GeneratePostAnnotation.State,
): Send[] | typeof END {
  if (state.pageContents.length) {
    return [
      new Send("generateContentReport", {
        ...state,
      }),
      new Send("findImages", {
        ...state,
      }),
    ];
  }
  return END;
}

const generatePostBuilder = new StateGraph(
  GeneratePostAnnotation,
  GeneratePostConfigurableAnnotation,
)
  .addNode("authSocialsPassthrough", authSocialsPassthrough)

  .addNode("verifyLinksSubGraph", verifyLinksGraph)

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
  // Finds images in the content.
  .addNode("findImages", findImages)

  // Start node
  .addEdge(START, "authSocialsPassthrough")
  .addEdge("authSocialsPassthrough", "verifyLinksSubGraph")

  // After verifying the different content types, we should generate a report on them.
  .addConditionalEdges(
    "verifyLinksSubGraph",
    generateReportOrEndConditionalEdge,
    ["generateContentReport", "findImages", END],
  )

  // Once generating a report & finding images, we should confirm the report exists (meaning the content is relevant).
  .addConditionalEdges("findImages", routeAfterGeneratingReport, [
    "generatePost",
    END,
  ])
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
