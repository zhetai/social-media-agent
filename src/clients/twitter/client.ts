import Arcade from "@arcadeai/arcadejs";
import {
  AuthorizeUserResponse,
  CreateTweetRequest,
  TwitterClientArgs,
} from "./types.js";
import { TwitterApi } from "twitter-api-v2";

type MediaIdStringArray =
  | [string]
  | [string, string]
  | [string, string, string]
  | [string, string, string, string];

export class TwitterClient {
  private twitterClient: TwitterApi;

  constructor(args: TwitterClientArgs) {
    this.twitterClient = args.twitterClient;
  }

  static async authorizeUser(
    id: string,
    client: Arcade,
  ): Promise<AuthorizeUserResponse> {
    const authRes = await client.auth.authorize({
      user_id: id,
      auth_requirement: {
        provider_id: "x",
        oauth2: {
          scopes: ["tweet.read", "tweet.write"],
        },
      },
    });

    if (authRes.status === "completed") {
      if (!authRes.context?.token) {
        throw new Error(
          "Authorization status is completed, but token not found",
        );
      }
      return { token: authRes.context.token };
    }

    if (authRes.authorization_url) {
      return { authorizationUrl: authRes.authorization_url };
    }

    throw new Error(
      `Authorization failed for user ID: ${id}\nStatus: '${authRes.status}'`,
    );
  }

  /**
   * Authorizes a user to use the Twitter API, and returns a TwitterClient instance.
   *
   * @param twitterUserId The users Twitter ID.
   * @throws {Error} If the user is not authorized. This will either contain the authorization URL, or an error message.
   * @returns A TwitterClient instance.
   */
  static async fromUserId(twitterUserId: string): Promise<TwitterClient> {
    const arcadeClient = new Arcade({ apiKey: process.env.ARCADE_API_KEY });
    const authResponse = await TwitterClient.authorizeUser(
      twitterUserId,
      arcadeClient,
    );
    if (authResponse.authorizationUrl) {
      throw new Error(
        `User not authorized. Please visit ${authResponse.authorizationUrl} to authorize the user.`,
      );
    }
    if (!authResponse.token) {
      throw new Error("Authorization token not found");
    }
    const tokenContext = authResponse.token;
    const twitterClient = new TwitterApi(tokenContext);
    return new TwitterClient({
      twitterClient,
    });
  }

  async uploadTweet({ text, media }: CreateTweetRequest) {
    let mediaIds: MediaIdStringArray | undefined = undefined;
    if (media?.media) {
      const mediaId = await this.uploadMedia(media.media, media.mimeType);
      mediaIds = [mediaId];
    }
    const mediaInput = mediaIds
      ? {
          media: {
            media_ids: mediaIds,
          },
        }
      : {};

    const response = await this.twitterClient.v2.tweet({
      text,
      ...mediaInput,
    });

    if (response.errors) {
      throw new Error(
        `Error uploading tweet: ${JSON.stringify(response.errors, null)}`,
      );
    }
    return response;
  }

  async testAuthentication(token: string, tokenSecret: string) {
    if (
      !process.env.TWITTER_API_KEY_SECRET ||
      !process.env.TWITTER_API_KEY ||
      !process.env.TWITTER_ACCESS_TOKEN ||
      !process.env.TWITTER_ACCESS_TOKEN_SECRET
    ) {
      throw new Error(
        "Missing twitter credentials.\n" +
          `TWITTER_API_KEY_SECRET: ${!!process.env.TWITTER_API_KEY_SECRET}\n` +
          `TWITTER_API_KEY: ${!!process.env.TWITTER_API_KEY}\n`,
      );
    }
    try {
      const userClient = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_KEY_SECRET,
        accessToken: token,
        accessSecret: tokenSecret,
      });

      // Try to get the authenticated user's information
      const me = await userClient.v2.me();
      return !!me;
    } catch (error) {
      console.error("Authentication error:", error);
      return false;
    }
  }

  async uploadMedia(media: Buffer, mimeType: string): Promise<string> {
    if (
      !process.env.TWITTER_API_KEY_SECRET ||
      !process.env.TWITTER_API_KEY ||
      !process.env.BRACE_TWITTER_TOKEN ||
      !process.env.BRACE_TWITTER_TOKEN_SECRET
    ) {
      throw new Error(
        "Missing twitter credentials.\n" +
          `TWITTER_API_KEY_SECRET: ${!!process.env.TWITTER_API_KEY_SECRET}\n` +
          `TWITTER_API_KEY: ${!!process.env.TWITTER_API_KEY}\n` +
          `BRACE_TWITTER_TOKEN: ${!!process.env.BRACE_TWITTER_TOKEN}\n` +
          `BRACE_TWITTER_TOKEN_SECRET: ${!!process.env.BRACE_TWITTER_TOKEN_SECRET}`,
      );
    }

    try {
      const client = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_KEY_SECRET,
        accessToken: process.env.BRACE_TWITTER_TOKEN,
        accessSecret: process.env.BRACE_TWITTER_TOKEN_SECRET,
      }).readWrite;

      // Ensure media is a Buffer
      if (!Buffer.isBuffer(media)) {
        throw new Error("Media must be a Buffer");
      }

      // Upload the media directly using the buffer
      const mediaResponse = await client.v1.uploadMedia(media, {
        mimeType,
      });

      return mediaResponse;
    } catch (error: any) {
      throw new Error(`Failed to upload media: ${error.message}`);
    }
  }
}
