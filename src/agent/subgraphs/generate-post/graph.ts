import { END, Send, START, StateGraph } from "@langchain/langgraph";
import {
  GraphAnnotation,
  ConfigurableAnnotation,
} from "./generate-post-state.js";
import { generateContentReport } from "./nodes/generate-content-report.js";
import { verifyGeneralContent } from "../shared/nodes/verify-general.js";
import { verifyYouTubeContent } from "../shared/nodes/verify-youtube.js";
import { verifyGitHubContent } from "../shared/nodes/verify-github.js";
import { generatePost } from "./nodes/geterate-post/index.js";
import { humanNode } from "./nodes/human-node.js";
import { VerifyContentAnnotation } from "../shared/shared-state.js";
import { verifyTweetGraph } from "../verify-tweet/graph.js";
import { rewritePost } from "./nodes/rewrite-post.js";
import { schedulePost } from "./nodes/schedule-post.js";
import { condensePost } from "./nodes/condense-post.js";
import { removeUrls } from "../../utils.js";

const isTwitterUrl = (url: string) => {
  return url.includes("twitter.com") || url.includes("x.com");
};

/**
 * This conditional edge will iterate over all the links in a slack message.
 * It creates a `Send` for each link, which will invoke a node specific to that website.
 */
function routeContentTypes(state: typeof GraphAnnotation.State) {
  return state.links.map((link) => {
    if (link.includes("youtube.com")) {
      return new Send("verifyYouTubeContent", {
        link,
      });
    } else if (link.includes("github.com")) {
      return new Send("verifyGitHubContent", {
        link,
      });
    } else if (isTwitterUrl(link)) {
      return new Send("verifyTweetSubGraph", {
        link,
      });
    } else {
      return new Send("verifyGeneralContent", {
        link,
      });
    }
  });
}

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
  .addNode("verifyYouTubeContent", verifyYouTubeContent, {
    input: VerifyContentAnnotation,
  })
  .addNode("verifyGeneralContent", verifyGeneralContent, {
    input: VerifyContentAnnotation,
  })
  .addNode("verifyGitHubContent", verifyGitHubContent, {
    input: VerifyContentAnnotation,
  })
  .addNode("verifyTweetSubGraph", verifyTweetGraph, {
    input: VerifyContentAnnotation,
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

  .addNode("generateContentReport", generateContentReport)
  // Start node
  .addConditionalEdges(START, routeContentTypes, [
    "verifyYouTubeContent",
    "verifyGeneralContent",
    "verifyGitHubContent",
    "verifyTweetSubGraph",
  ])

  // After verifying the different content types, we should generate a report on them.
  .addEdge("verifyYouTubeContent", "generateContentReport")
  .addEdge("verifyGeneralContent", "generateContentReport")
  .addEdge("verifyGitHubContent", "generateContentReport")
  .addEdge("verifyTweetSubGraph", "generateContentReport")

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
