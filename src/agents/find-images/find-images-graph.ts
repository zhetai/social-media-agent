import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { findImages } from "./nodes/find-images.js";
import { validateImages } from "./nodes/validate-images.js";
import { reRankImages } from "./nodes/re-rank-images.js";

export const FindImagesAnnotation = Annotation.Root({
  /**
   * Page content used in the verification nodes. Will be used in the report
   * generation node.
   */
  pageContents: Annotation<string[]>({
    reducer: (state, update) => state.concat(update),
    default: () => [],
  }),
  /**
   * Relevant links found in the message.
   */
  relevantLinks: Annotation<string[]>({
    reducer: (state, update) => {
      // Use a set to ensure no duplicate links are added.
      const stateSet = new Set(state);
      update.forEach((link) => stateSet.add(link));
      return Array.from(stateSet);
    },
    default: () => [],
  }),
  /**
   * Image options to provide to the user.
   */
  imageOptions: Annotation<string[]>({
    reducer: (_state, update) => update,
    default: () => [],
  }),
  /**
   * The report generated on the content of the message. Used
   * as context for generating the post.
   */
  report: Annotation<string>,
  /**
   * The generated post for LinkedIn/Twitter.
   */
  post: Annotation<string>,
});

function validateImagesOrEnd(state: typeof FindImagesAnnotation.State) {
  if (state.imageOptions.length > 0) {
    return "validateImages";
  }
  return END;
}

const findImagesWorkflow = new StateGraph(FindImagesAnnotation)
  .addNode("findImages", findImages)
  .addNode("validateImages", validateImages)
  .addNode("reRankImages", reRankImages)

  .addEdge(START, "findImages")

  .addConditionalEdges("findImages", validateImagesOrEnd, [
    "validateImages",
    END,
  ])

  .addEdge("validateImages", "reRankImages")

  .addEdge("reRankImages", END);

export const findImagesGraph = findImagesWorkflow.compile();
findImagesGraph.name = "Find Images Graph";
