import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { GraphAnnotation } from "../state.js";

type VerifyGeneralContentReturn = {
  relevantLinks: (typeof GraphAnnotation.State)["relevantLinks"];
  pageContents: (typeof GraphAnnotation.State)["pageContents"];
};

/**
 * Verifies the content provided is relevant to LangChain products.
 */
export async function verifyGeneralContent(
  _state: typeof GraphAnnotation.State,
  _config: LangGraphRunnableConfig,
): Promise<VerifyGeneralContentReturn> {
  throw new Error("Not implemented");
}
