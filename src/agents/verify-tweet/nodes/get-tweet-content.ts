import { VerifyTweetAnnotation } from "../verify-tweet-state.js";
import { extractTweetId, extractUrls } from "../../utils.js";
import { resolveTwitterUrl } from "../utils.js";
import { TwitterClient } from "../../../clients/twitter/client.js";

export async function getTweetContent(
  state: typeof VerifyTweetAnnotation.State,
) {
  const twitterUserId = process.env.TWITTER_USER_ID;
  if (!twitterUserId) {
    throw new Error("Twitter user ID not found in configurable fields.");
  }

  const tweetId = extractTweetId(state.link);
  if (!tweetId) {
    return {};
  }

  let twitterClient: TwitterClient;
  const useArcadeAuth = process.env.USE_ARCADE_AUTH;
  if (useArcadeAuth === "true") {
    const twitterToken = process.env.TWITTER_USER_TOKEN;
    const twitterTokenSecret = process.env.TWITTER_USER_TOKEN_SECRET;

    twitterClient = await TwitterClient.fromArcade(twitterUserId, {
      twitterToken,
      twitterTokenSecret,
    });
  } else {
    twitterClient = TwitterClient.fromBasicTwitterAuth();
  }

  const tweetContent = await twitterClient.getTweet(tweetId);
  const mediaUrls = tweetContent.data.attachments?.media_keys?.map(
    (k) => `https://pbs.twimg.com/media/${k}?format=jpg&name=medium`,
  );
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
