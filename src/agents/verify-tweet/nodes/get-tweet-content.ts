import { type TweetV2SingleResult } from "twitter-api-v2";
import { VerifyTweetAnnotation } from "../verify-tweet-state.js";
import { extractTweetId, extractUrls } from "../../utils.js";
import { resolveTwitterUrl } from "../utils.js";
import Arcade from "@arcadeai/arcadejs";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { getTwitterAuthOrInterrupt } from "../../shared/auth/twitter.js";

export async function getTweetContent(
  state: typeof VerifyTweetAnnotation.State,
  config: LangGraphRunnableConfig,
) {
  const twitterUserId =
    config.configurable?.twitterUserId || process.env.TWITTER_USER_ID;
  if (!twitterUserId) {
    throw new Error("Twitter user ID not found in configurable fields.");
  }

  const arcade = new Arcade({
    apiKey: process.env.ARCADE_API_KEY,
  });

  const tweetId = extractTweetId(state.link);
  if (!tweetId) {
    return {};
  }

  await getTwitterAuthOrInterrupt(twitterUserId, arcade);

  // Step 3: Execute the tool
  const result = await arcade.tools.execute({
    tool_name: "X.LookupTweetById",
    inputs: { tweet_id: tweetId },
    user_id: twitterUserId,
  });

  const tweetContent = result.output?.value as TweetV2SingleResult;
  const mediaUrls = tweetContent.data.attachments?.media_keys?.map(
    (k) => `https://pbs.twimg.com/media/${k}?format=jpg&name=medium`,
  );
  console.dir(result, { depth: null });
  // Extract any links from inside the tweet content.
  // Then, fetch the content of those links to include in the main content.
  const urlsInTweet = extractUrls(tweetContent.data.text);
  if (!urlsInTweet.length) {
    return {
      tweetContent: tweetContent.data.text,
      imageOptions: mediaUrls,
    };
  }

  const cleanedUrls = (
    await Promise.all(
      urlsInTweet.map(async (url) => {
        if (
          !url.includes("https://t.co") &&
          !url.includes("https://x.com") &&
          !url.includes("https://twitter.com")
        ) {
          return url;
        }
        const resolvedUrl = await resolveTwitterUrl(url);
        if (
          !resolvedUrl ||
          resolvedUrl.includes("https://t.co") ||
          resolvedUrl.includes("https://twitter.com") ||
          resolvedUrl.includes("https://x.com")
        ) {
          // Do not return twitter URLs.
          return [];
        }
        return resolvedUrl;
      }),
    )
  ).flat();

  return {
    tweetContent: tweetContent.data.text,
    tweetContentUrls: cleanedUrls,
    imageOptions: mediaUrls,
  };
}
