import { END, Send, START, StateGraph } from "@langchain/langgraph";
import { VerifyContentAnnotation } from "../shared/shared-state.js";
import { verifyYouTubeContent } from "../shared/nodes/verify-youtube.js";
import { verifyGeneralContent } from "../shared/nodes/verify-general.js";
import { verifyGitHubContent } from "../shared/nodes/verify-github.js";
import { verifyTweetGraph } from "../verify-tweet/verify-tweet-graph.js";
import { VerifyLinksGraphAnnotation } from "./verify-links-state.js";

const isTwitterUrl = (url: string) => {
  return url.includes("twitter.com") || url.includes("x.com");
};

function routeLinkTypes(state: typeof VerifyLinksGraphAnnotation.State) {
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

const verifyLinksWorkflow = new StateGraph(VerifyLinksGraphAnnotation)
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
  // Start node
  .addConditionalEdges(START, routeLinkTypes, [
    "verifyYouTubeContent",
    "verifyGeneralContent",
    "verifyGitHubContent",
    "verifyTweetSubGraph",
  ])
  .addEdge("verifyYouTubeContent", END)
  .addEdge("verifyGeneralContent", END)
  .addEdge("verifyGitHubContent", END)
  .addEdge("verifyTweetSubGraph", END);

export const verifyLinksGraph = verifyLinksWorkflow.compile();
verifyLinksGraph.name = "Verify Links Subgraph";