import { END, Send, START, StateGraph } from "@langchain/langgraph";
import { GraphAnnotation, ConfigurableAnnotation } from "./generate-post-state.js";
import { generateContentReport } from "./nodes/generate-content-report.js";
import { verifyGeneralContent } from "../shared/nodes/verify-general.js";
import { verifyYouTubeContent } from "../shared/nodes/verify-youtube.js";
import { verifyGitHubContent } from "../shared/nodes/verify-github.js";
import { generatePosts } from "./nodes/generate-post.js";
import { schedulePost } from "./nodes/schedule-post.js";
import { VerifyContentAnnotation } from "../shared/shared-state.js";
import { verifyTweetGraph } from "../verify-tweet/graph.js";

const isTwitterUrl = (url: string) => {
  return url.includes("twitter.com") || url.includes("x.com");
};

/**
 * This conditional edge will iterate over all the links in a slack message.
 * It creates a `Send` for each link, which will invoke a node specific to that website.
 */
function routeContentTypes(state: typeof GraphAnnotation.State) {
  return state.slackMessage.links.map((link) => {
    if (link.includes("youtube.com")) {
      return new Send("verifyYouTubeContent", {
        link,
        slackMessage: state.slackMessage,
      });
    } else if (link.includes("github.com")) {
      return new Send("verifyGitHubContent", {
        link,
        slackMessage: state.slackMessage,
      });
    } else if (isTwitterUrl(link)) {
      return new Send("verifyTweetSubGraph", {
        link,
        slackMessage: state.slackMessage,
      });
    } else {
      return new Send("verifyGeneralContent", {
        link,
        slackMessage: state.slackMessage,
      });
    }
  });
}

function routeAfterGeneratingReport(
  state: typeof GraphAnnotation.State,
): "generatePosts" | typeof END {
  if (state.report) {
    return "generatePosts";
  }
  return END;
}

// Finally, create the graph itself.
const generatePostBuilder = new StateGraph(GraphAnnotation, ConfigurableAnnotation)
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
  .addNode("generatePosts", generatePosts)
  // Interrupts the node for human in the loop, then schedules the
  // post for Twitter/LinkedIn.
  .addNode("schedulePost", schedulePost)

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
    "generatePosts",
    END,
  ])

  // Finally, schedule the post. This will also throw an interrupt
  // so a human can edit the post before scheduling.
  .addEdge("generatePosts", "schedulePost")

  // If the schedule post is successful, end the graph.
  .addEdge("schedulePost", END);

export const generatePostGraph = generatePostBuilder.compile();

generatePostGraph.name = "Generate Post Subgraph";
