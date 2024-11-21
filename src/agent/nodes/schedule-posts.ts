import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { GraphAnnotation } from "../state.js";

export async function schedulePosts(
  _state: typeof GraphAnnotation.State,
  _config: LangGraphRunnableConfig,
): Promise<Partial<typeof GraphAnnotation.State>> {
  // Call `interrupt` here first
  throw new Error("Not implemented");
}
