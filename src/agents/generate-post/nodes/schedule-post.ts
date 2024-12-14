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
  const twitterUserId = config.configurable?.twitterUserId || process.env.TWITTER_USER_ID;
  const linkedInUserId = config.configurable?.linkedInUserId || process.env.LINKEDIN_USER_ID;

  if (!twitterUserId && !linkedInUserId) {
    throw new Error("One of twitterUserId or linkedInUserId must be provided");
  }

  const client = new Client({
    apiUrl: `http://localhost:${process.env.PORT}`,
  });

  const currentDate = new Date();
  const afterSeconds = Math.floor(
    (state.scheduleDate.getTime() - currentDate.getTime()) / 1000,
  );

  // if after seconds is negative, throw an error
  if (afterSeconds < 0) {
    throw new Error(
      `Schedule date must be in the future. Instead, received: ${afterSeconds} seconds.`,
    );
  }

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
        twitterToken: config.configurable?.twitterToken || process.env.TWITTER_USER_TOKEN,
        twitterTokenSecret: config.configurable?.twitterTokenSecret || process.env.TWITTER_USER_TOKEN_SECRET,
      },
    },
    afterSeconds,
  });

  return {};
}
