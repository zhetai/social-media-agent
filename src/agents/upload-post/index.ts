import {
  Annotation,
  END,
  LangGraphRunnableConfig,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { TwitterClient } from "../../clients/twitter/client.js";
import { imageUrlToBuffer } from "../utils.js";
import { CreateMediaRequest } from "../../clients/twitter/types.js";

async function getMediaFromImage(image?: {
  imageUrl: string;
  mimeType: string;
}): Promise<CreateMediaRequest | undefined> {
  if (!image) return undefined;
  const { buffer, contentType } = await imageUrlToBuffer(image.imageUrl);
  return {
    media: buffer,
    mimeType: contentType,
  };
}

const UploadPostAnnotation = Annotation.Root({
  post: Annotation<string>,
  image: Annotation<
    | {
        imageUrl: string;
        mimeType: string;
      }
    | undefined
  >,
});

const UploadPostGraphConfiguration = Annotation.Root({
  twitterUserId: Annotation<string | undefined>,
  linkedInUserId: Annotation<string | undefined>,
  twitterToken: Annotation<string | undefined>,
  twitterTokenSecret: Annotation<string | undefined>,
});

export async function uploadPost(
  state: typeof UploadPostAnnotation.State,
  config: LangGraphRunnableConfig,
): Promise<Partial<typeof UploadPostAnnotation.State>> {
  if (!state.post) {
    throw new Error("No post text found");
  }
  const twitterUserId =
    config.configurable?.twitterUserId || process.env.TWITTER_USER_ID;
  const linkedInUserId =
    config.configurable?.linkedInUserId || process.env.LINKEDIN_USER_ID;

  if (!twitterUserId && !linkedInUserId) {
    throw new Error("One of twitterUserId or linkedInUserId must be provided");
  }

  const twitterToken =
    config.configurable?.twitterToken || process.env.TWITTER_USER_TOKEN;
  const twitterTokenSecret =
    config.configurable?.twitterTokenSecret ||
    process.env.TWITTER_USER_TOKEN_SECRET;

  if (twitterUserId) {
    if (!twitterToken || !twitterTokenSecret) {
      throw new Error(
        "Twitter token or token secret not found in configurable fields.",
      );
    }

    const client = await TwitterClient.fromUserId(twitterUserId, {
      twitterToken,
      twitterTokenSecret,
    });
    const mediaBuffer = await getMediaFromImage(state.image);

    await client.uploadTweet({
      text: state.post,
      ...(mediaBuffer && { media: mediaBuffer }),
    });
  }

  if (linkedInUserId) {
    console.log("TODO: Implement linkedin upload");
  }

  return {};
}

const uploadPostWorkflow = new StateGraph(
  UploadPostAnnotation,
  UploadPostGraphConfiguration,
)
  .addNode("uploadPost", uploadPost)
  .addEdge(START, "uploadPost")
  .addEdge("uploadPost", END);

export const uploadPostGraph = uploadPostWorkflow.compile();
uploadPostGraph.name = "Upload Post Graph";
