import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { GeneratePostAnnotation } from "../generate-post-state.js";
import { Client } from "@langchain/langgraph-sdk";

export async function schedulePost(
  state: typeof GeneratePostAnnotation.State,
  config: LangGraphRunnableConfig,
): Promise<Partial<typeof GeneratePostAnnotation.State>> {
  if (!state.post || !state.scheduleDate) {
    throw new Error("No post or schedule date found");
  }
  const twitterUserId = config.configurable?.twitterUserId;
  const linkedInUserId = config.configurable?.linkedInUserId;

  if (!twitterUserId && !linkedInUserId) {
    throw new Error("One of twitterUserId or linkedInUserId must be provided");
  }

  const client = new Client({
    apiUrl: `http://localhost:${process.env.PORT}`,
  });

  const afterSeconds = Math.floor(
    (state.scheduleDate.getTime() - new Date().getTime()) / 1000,
  );

  const thread = await client.threads.create();
  await client.runs.create(thread.thread_id, "upload_post", {
    input: {
      post: state.post,
      image: state.image,
    },
    config: {
      configurable: {
        twitterUserId,
        linkedInUserId,
      },
    },
    afterSeconds,
  });
  console.log(
    "Successfully scheduled post for",
    state.scheduleDate,
    "with id",
    thread.thread_id,
  );

  return {};
}
