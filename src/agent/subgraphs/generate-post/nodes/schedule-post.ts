import { LangGraphRunnableConfig, NodeInterrupt } from "@langchain/langgraph";
import { GraphAnnotation } from "../generate-post-state.js";

export async function schedulePost(
  _state: typeof GraphAnnotation.State,
  _config: LangGraphRunnableConfig,
): Promise<Partial<typeof GraphAnnotation.State>> {
  throw new NodeInterrupt("Needs approval!");
}
