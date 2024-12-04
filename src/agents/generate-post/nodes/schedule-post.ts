import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { GraphAnnotation } from "../generate-post-state.js";

export async function schedulePost(
  state: typeof GraphAnnotation.State,
  _config: LangGraphRunnableConfig,
): Promise<Partial<typeof GraphAnnotation.State>> {
  if (!state.post || !state.scheduleDate) {
    throw new Error("No post or schedule date found");
  }

  // TODO: implement scheduling the post
  return {};
}
