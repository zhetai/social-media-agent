import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { GeneratePostAnnotation } from "../generate-post-state.js";
import Arcade from "@arcadeai/arcadejs";
import { getTwitterAuthOrInterrupt } from "../../shared/auth/twitter.js";

export async function authTwitterPassthrough(
  _state: typeof GeneratePostAnnotation.State,
  config: LangGraphRunnableConfig,
) {
  const twitterUserId =
    config.configurable?.twitterUserId || process.env.TWITTER_USER_ID;

  if (twitterUserId) {
    const arcade = new Arcade({
      apiKey: process.env.ARCADE_API_KEY,
    });
    await getTwitterAuthOrInterrupt(twitterUserId, arcade);
  }

  return {};
}
