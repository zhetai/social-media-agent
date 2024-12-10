import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { GeneratePostAnnotation } from "../generate-post-state.js";
import { getTwitterAuthOrInterrupt } from "../../shared/auth/twitter.js";
import Arcade from "@arcadeai/arcadejs";

export async function schedulePost(
  state: typeof GeneratePostAnnotation.State,
  config: LangGraphRunnableConfig,
): Promise<Partial<typeof GeneratePostAnnotation.State>> {
  if (!state.post || !state.scheduleDate) {
    throw new Error("No post or schedule date found");
  }
  const twitterUserId = config.configurable?.twitterUserId;
  if (!twitterUserId) {
    throw new Error("Twitter user ID not found in configurable fields.");
  }

  const arcade = new Arcade({
    apiKey: process.env.ARCADE_API_KEY,
  });
  await getTwitterAuthOrInterrupt(twitterUserId, arcade);

  const runAtDate = state.scheduleDate.toISOString();
  const scheduleResponse = await fetch(`${arcade.baseURL}/v1/tools/execute`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${arcade.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: twitterUserId,
      tool_name: "X.PostTweet",
      inputs: {
        tweet_text: state.post,
      },
      run_at: runAtDate,
    }),
  });

  const result = await scheduleResponse.json();
  console.log("Schedule result: ", result);

  // TODO: implement scheduling the post
  return {};
}
