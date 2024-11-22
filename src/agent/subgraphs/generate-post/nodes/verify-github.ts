import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { GraphAnnotation } from "../state.js";

type VerifyGitHubContentReturn = {
  relevantLinks: (typeof GraphAnnotation.State)["relevantLinks"];
  pageContents: (typeof GraphAnnotation.State)["pageContents"];
};

/**
 * Verifies the content provided is relevant to LangChain products.
 */
export async function verifyGitHubContent(
  _state: typeof GraphAnnotation.State,
  _config: LangGraphRunnableConfig,
): Promise<VerifyGitHubContentReturn> {
  throw new Error("Not implemented");
}
