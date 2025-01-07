import * as fs from "fs/promises";
import { describe, it, expect } from "@jest/globals";
import { TwitterClient } from "../../clients/twitter/client.js";

const tweetId = "1864386797788385455";
const tweetWithMediaId = "1846215982765035677";

describe("Basic Twitter Auth", () => {
  const client = TwitterClient.fromBasicTwitterAuth();

  it("Can confirm the user is authed", async () => {
    const isAuthed = await client.testAuthentication();
    expect(isAuthed).toBe(true);
  });

  it("Can read a tweet from ID", async () => {
    const tweet = await client.getTweet(tweetId, {
      includeMedia: false,
    });
    expect(tweet).toBeDefined();
    console.log("Tweet\n");
    console.dir(tweet, { depth: null });
  });

  it("Can read a tweet from ID and get media", async () => {
    const tweet = await client.getTweet(tweetWithMediaId, {
      includeMedia: true,
    });
    expect(tweet).toBeDefined();
    // Check the full length Tweet is returned
    expect(tweet.data.note_tweet?.text).toBeDefined();
    expect(tweet.data.note_tweet?.text?.length).toBeGreaterThan(280);
    // Check the media is returned
    expect(tweet.includes?.media?.[0]).toBeDefined();
    expect(tweet.includes?.media?.[0].url).toBeDefined();
    expect(tweet.includes?.media?.[0].type).toBe("photo");
  });

  it("Can post a text only tweet", async () => {
    const result = await client.uploadTweet({
      text: "test 123 hello world!",
    });

    expect(result.errors).not.toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.data.id).toBeDefined();
    expect(result.data.text).toBe("test 123 hello world!");
  });

  it("Can post a text and media tweet", async () => {
    const imageBuffer = await fs.readFile("src/tests/data/langchain_logo.png");
    const tweetText = "test 123 hello world! (with image)";

    const result = await client.uploadTweet({
      text: tweetText,
      media: {
        media: imageBuffer,
        mimeType: "image/png",
      },
    });

    expect(result).toBeDefined();
  });
});
