import { TwitterApi, type TweetV2SingleResult } from "twitter-api-v2";
import { GraphAnnotation } from "../verify-tweet-state.js";
import { extractTweetId, extractUrls } from "../../../utils.js";
import { resolveTwitterUrl } from "../utils.js";

export async function getTweetContent(state: typeof GraphAnnotation.State) {
  if (!process.env.TWITTER_BEARER_TOKEN) {
    throw new Error("TWITTER_BEARER_TOKEN is not set");
  }
  const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);

  const tweetId = extractTweetId(state.link);
  if (!tweetId) {
    return {
      relevantLinks: [],
      pageContents: [],
    };
  }

  let tweetContent: TweetV2SingleResult;
  try {
    tweetContent = await twitterClient.v2.singleTweet(tweetId);
    if (!tweetContent) {
      throw new Error("No response given when fetching tweet content.");
    }
  } catch (e) {
    console.error("Failed to fetch tweet content");
    throw e;
  }

  // Extract any links from inside the tweet content.
  // Then, fetch the content of those links to include in the main content.
  const urlsInTweet = extractUrls(tweetContent.data.text);
  if (!urlsInTweet.length) {
    return {
      tweetContent: tweetContent.data.text,
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
  };
}
