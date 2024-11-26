import { describe, it } from "@jest/globals";
import { generatePostGraph } from "../src/agent/subgraphs/generate-post/graph.js";
import { GITHUB_URL_STATE } from "./states.js";

describe("GeneratePostGraph", () => {
  it("Should be able to generate posts from a GitHub URL slack message", async () => {
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
  }, 60000); // Timeout to 60 seconds
});
