import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { GeneratePostAnnotation } from "../generate-post-state.js";
import Arcade from "@arcadeai/arcadejs";
import { getLinkedInAuthOrInterrupt } from "../../shared/auth/linkedin.js";

export async function authLinkedInPassthrough(
  _state: typeof GeneratePostAnnotation.State,
  config: LangGraphRunnableConfig,
) {
  const linkedInUserId =
    config.configurable?.linkedInUserId || process.env.LINKEDIN_USER_ID;
  if (linkedInUserId) {
    const arcade = new Arcade({
      apiKey: process.env.ARCADE_API_KEY,
    });
    await getLinkedInAuthOrInterrupt(linkedInUserId, arcade);
  }

  return {};
}
