import { describe, it, expect } from "@jest/globals";
import { LinkedInClient } from "../clients/linkedin.js";
import Arcade from "@arcadeai/arcadejs";

describe("LinkedIN API wrapper", () => {
  it("Can use the authorizeUser method", async () => {
    const arcade = new Arcade({
      apiKey: process.env.ARCADE_API_KEY,
    });
    const result = await LinkedInClient.authorizeUser(
      "braceasproul@gmail.com",
      arcade,
    );
    console.log("result", result);
  });

  it("Can make a text post", async () => {
    const arcade = new Arcade({
      apiKey: process.env.ARCADE_API_KEY,
    });
    const result = await LinkedInClient.authorizeUser(
      "braceasproul@gmail.com",
      arcade,
    );
    if (!result.token || !result.sub) {
      throw new Error(
        "Authorization status is completed, but token or sub not found",
      );
    }
    const linkedIn = new LinkedInClient(result.token, result.sub);
    const textPostResponse = await linkedIn.createTextPost(
      "Hello, this is a test post from LinkedIn API!",
    );
    console.log("Text post created:", textPostResponse);
    expect(textPostResponse).toBeDefined();
  });

  it("Can make an image post", async () => {
    const arcade = new Arcade({
      apiKey: process.env.ARCADE_API_KEY,
    });
    const result = await LinkedInClient.authorizeUser(
      "braceasproul@gmail.com",
      arcade,
    );
    if (!result.token || !result.sub) {
      throw new Error(
        "Authorization status is completed, but token or sub not found",
      );
    }
    const linkedIn = new LinkedInClient(result.token, result.sub);
    const textPostResponse = await linkedIn.createImagePost({
      text: "Hello, this is a test post from LinkedIn API!",
      imageUrl:
        "https://verdyqfuvvtxtygqekei.supabase.co/storage/v1/object/public/images/screenshot-github.com-1734639569875.jpeg",
      imageDescription: "A screenshot of the Open Canvas Readme",
      imageTitle: "Open Canvas",
    });
    console.log("Image post created:", textPostResponse);
    expect(textPostResponse).toBeDefined();
  });
});
