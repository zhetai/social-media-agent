import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { GraphAnnotation } from "../state.js";

type VerifyYouTubeContentReturn = {
  relevantLinks: (typeof GraphAnnotation.State)["relevantLinks"];
  videoSummaries: (typeof GraphAnnotation.State)["videoSummaries"];
};

/**
 * Verifies the content provided is relevant to LangChain products.
 */
export async function verifyYouTubeContent(
  _state: typeof GraphAnnotation.State,
  _config: LangGraphRunnableConfig,
): Promise<VerifyYouTubeContentReturn> {
  throw new Error("Not implemented");
}
