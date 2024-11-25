import { END, Send, START, StateGraph } from "@langchain/langgraph";
import { GraphAnnotation, VerifyContentAnnotation } from "./state.js";
import { generateContentReport } from "./nodes/generate-content-report.js";
import { verifyGeneralContent } from "./nodes/verify-general.js";
import { verifyYouTubeContent } from "./nodes/verify-youtube.js";
import { verifyGitHubContent } from "./nodes/verify-github.js";
import { generatePosts } from "./nodes/generate-post.js";
import { schedulePost } from "./nodes/schedule-post.js";

/**
 * Should do the following:
 * Handle youtube videos
 * Handle GitHub repos
 * Handle all other content (general purpose web scraping)
 *
 * YouTube videos:
 * 1. use gemini 1.5 flash to ingest youtube video & create a summary
 * 2. pass the summary to claude and have claude identify if it's langchain content
 *
 * GitHub repos:
 * 1a. Pull the readme from the repo, pass to claude and ask to identify if it's LangChain content.
 * 1b. iterate over the first 100 .js|jsx|ts|tsx or .py files, use regex to extract all imports, verify it has LangChain imports.
 *
 * All others:
 * Mayb FireCrawl to scrape the page content. Then pass to an LLM to identify if it's LangChain content.
 */

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
const generatePostBuilder = new StateGraph(GraphAnnotation)
  .addNode("verifyYouTubeContent", verifyYouTubeContent, {
    input: VerifyContentAnnotation,
  })
  .addNode("verifyGeneralContent", verifyGeneralContent, {
    input: VerifyContentAnnotation,
  })
  .addNode("verifyGitHubContent", verifyGitHubContent, {
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
  ])

  // After verifying the different content types, we should generate a report on them.
  .addEdge("verifyYouTubeContent", "generateContentReport")
  .addEdge("verifyGeneralContent", "generateContentReport")
  .addEdge("verifyGitHubContent", "generateContentReport")

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
