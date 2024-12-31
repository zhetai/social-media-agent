import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { GeneratePostAnnotation } from "../generate-post-state.js";
import { Client } from "@langchain/langgraph-sdk";
import {
  LINKEDIN_ACCESS_TOKEN,
  LINKEDIN_ORGANIZATION_ID,
  LINKEDIN_PERSON_URN,
  LINKEDIN_USER_ID,
  POST_TO_LINKEDIN_ORGANIZATION,
  TWITTER_TOKEN,
  TWITTER_TOKEN_SECRET,
  TWITTER_USER_ID,
} from "../constants.js";

export async function schedulePost(
  state: typeof GeneratePostAnnotation.State,
  config: LangGraphRunnableConfig,
): Promise<Partial<typeof GeneratePostAnnotation.State>> {
  if (!state.post || !state.scheduleDate) {
    throw new Error("No post or schedule date found");
  }
  const twitterUserId =
    config.configurable?.[TWITTER_USER_ID] || process.env.TWITTER_USER_ID;
  const linkedInUserId =
    config.configurable?.[LINKEDIN_USER_ID] || process.env.LINKEDIN_USER_ID;

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
        [TWITTER_USER_ID]: twitterUserId,
        [LINKEDIN_USER_ID]: linkedInUserId,
        [TWITTER_TOKEN]:
          config.configurable?.[TWITTER_TOKEN] ||
          process.env.TWITTER_USER_TOKEN,
        [TWITTER_TOKEN_SECRET]:
          config.configurable?.[TWITTER_TOKEN_SECRET] ||
          process.env.TWITTER_USER_TOKEN_SECRET,
        [LINKEDIN_ACCESS_TOKEN]:
          config.configurable?.[LINKEDIN_ACCESS_TOKEN] ||
          process.env.LINKEDIN_ACCESS_TOKEN,
        [LINKEDIN_PERSON_URN]:
          config.configurable?.[LINKEDIN_PERSON_URN] ||
          process.env.LINKEDIN_PERSON_URN,
        [LINKEDIN_ORGANIZATION_ID]:
          config.configurable?.[LINKEDIN_ORGANIZATION_ID] ||
          process.env.LINKEDIN_ORGANIZATION_ID,
        [POST_TO_LINKEDIN_ORGANIZATION]:
          config.configurable?.[POST_TO_LINKEDIN_ORGANIZATION] ||
          process.env.POST_TO_LINKEDIN_ORGANIZATION,
      },
    },
    afterSeconds,
  });

  return {};
}
