import { describe, it } from "@jest/globals";
import { generatePostGraph } from "../agent/subgraphs/generate-post/graph.js";
import { GITHUB_URL_STATE } from "./states.js";
import { TwitterApi } from "twitter-api-v2";
import { resolveTwitterUrl } from "../agent/subgraphs/generate-post/nodes/verify-twitter.js";

describe("GeneratePostGraph", () => {
  it.skip("Should be able to generate posts from a GitHub URL slack message", async () => {
    console.log("Starting graph test");
    const result = await generatePostGraph.stream(GITHUB_URL_STATE, {
      streamMode: "values",
    });

    let post = "";
    for await (const value of result) {
      console.log(
        "Event occurred",
        Object.entries(value).map(([k, v]) => ({
          [k]: !!v,
        })),
      );

      if (value.post) {
        post = value.post;
      }
    }

    if (post) {
      console.log("\nPOST:\n");
      console.log(post);
    }
  }, 60000);

  // Skip by default to prevent using up API quota
  it.skip("Can read tweets via Twitter API", async () => {
    if (!process.env.TWITTER_BEARER_TOKEN) {
      throw new Error("TWITTER_BEARER_TOKEN is not set");
    }
    const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
    const singleTweet = await client.v2.singleTweet("1861528104901984330");
    expect(singleTweet.data.text).toBeDefined();
  });

  it("can resolve twitter URLs", async () => {
    const resolvedUrl = await resolveTwitterUrl("https://t.co/GI4uWOGPO5");
    expect(resolvedUrl).toBe(
      "https://twitter.com/GergelyOrosz/status/1861528104901984330/photo/1",
    );
  });
});
