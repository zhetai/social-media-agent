import { describe, it, expect } from "@jest/globals";
import Arcade from "@arcadeai/arcadejs";

describe("Can use Arcade to call the Twitter API", () => {
  const arcade = new Arcade({
    apiKey: process.env.ARCADE_API_KEY,
  });

  const tweetId = "1864386797788385455";
  const userId = "braceasproul@gmail.com";
  const username = "bracesproul";

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

  it.only("Can load a single tweet by ID", async () => {
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
