import { END, START, StateGraph } from "@langchain/langgraph";
import { GraphAnnotation } from "./state.js";
import { verifyLangChainContent } from "./nodes/verify-langchain-content.js";
import { generateContentReport } from "./nodes/generate-content-report.js";

function routeIsLangChainContent(
  state: typeof GraphAnnotation.State,
): "generateContentReport" | typeof END {
  if (state.relevantProducts && state.relevantProducts.length > 0) {
    return "generateContentReport";
  }
  return END;
}

// Finally, create the graph itself.
const identifyContentBuilder = new StateGraph(GraphAnnotation)
  .addNode("verifyLangChainContent", verifyLangChainContent)
  .addNode("generateContentReport", generateContentReport)
  // Start node
  .addEdge(START, "verifyLangChainContent")
  // Router conditional edge
  .addConditionalEdges("verifyLangChainContent", routeIsLangChainContent, [
    "generateContentReport",
    END,
  ])
  // End graph after generating report.
  .addEdge("generateContentReport", END);

export const identifyContentGraph = identifyContentBuilder.compile();

identifyContentGraph.name = "Identify Content Subgraph";
