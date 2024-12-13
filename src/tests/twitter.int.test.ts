import * as fs from "fs/promises";
import { describe, it, expect } from "@jest/globals";
import Arcade from "@arcadeai/arcadejs";
import { TwitterClient } from "../clients/twitter/client.js";

const tweetId = "1864386797788385455";
const userId = "braceasproul@gmail.com";
const username = "bracesproul";

describe.skip("Can use Arcade to call the Twitter API", () => {
  const arcade = new Arcade({
    apiKey: process.env.ARCADE_API_KEY,
  });

  it("Can load tweets by a user ID", async () => {
    const result = await arcade.tools.execute({
      tool_name: "X.SearchRecentTweetsByUsername",
      inputs: {
        username,
        max_results: 1,
      },
      user_id: userId,
    });

    console.log("Result\n");
    console.dir(result, { depth: null });
    expect(result).toBeDefined();
  });

  it("Can load a single tweet by ID", async () => {
    const result = await arcade.tools.execute({
      tool_name: "X.LookupTweetById",
      inputs: { tweet_id: tweetId },
      user_id: userId,
    });

    console.log("Result\n");
    console.dir(result, { depth: null });
    expect(result).toBeDefined();
  });
});

describe("TwitterClient wrapper", () => {
  it("Can upload a tweet", async () => {
    const client = await TwitterClient.fromUserId(userId);
    const tweetText = "test 123 hello world!";
    const result = await client.uploadTweet({
      text: tweetText,
    });

    expect(result.errors).not.toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.data.id).toBeDefined();
    expect(result.data.text).toBe(tweetText);
  });

  it("Can upload media", async () => {
    const client = await TwitterClient.fromUserId(userId);
    const imageBuffer = await fs.readFile("src/tests/data/langchain_logo.png");

    const result = await client.uploadMedia(imageBuffer, "image/png");
    console.log("Media ID", result);
    expect(result).toBeDefined();
  });

  it("Can upload a tweet with media", async () => {
    const client = await TwitterClient.fromUserId(userId);
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
