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
  buffer?: Buffer;
  imageUrl?: string;
  mimeType: string;
}): Promise<CreateMediaRequest | undefined> {
  if (image?.buffer) {
    return {
      media: image.buffer,
      mimeType: image.mimeType,
    };
  } else if (image?.imageUrl) {
    const { buffer, contentType } = await imageUrlToBuffer(image.imageUrl);
    return {
      media: buffer,
      mimeType: contentType,
    };
  }
  return undefined;
}

const UploadPostAnnotation = Annotation.Root({
  post: Annotation<string>,
  image: Annotation<
    | {
        buffer?: Buffer;
        imageUrl?: string;
        mimeType: string;
      }
    | undefined
  >,
});

const UploadPostGraphConfiguration = Annotation.Root({
  twitterUserId: Annotation<string | undefined>,
  linkedInUserId: Annotation<string | undefined>,
});

export async function uploadPost(
  state: typeof UploadPostAnnotation.State,
  config: LangGraphRunnableConfig,
): Promise<Partial<typeof UploadPostAnnotation.State>> {
  if (!state.post) {
    throw new Error("No post text found");
  }
  const twitterUserId = config.configurable?.twitterUserId;
  const linkedInUserId = config.configurable?.linkedInUserId;

  if (!twitterUserId && !linkedInUserId) {
    throw new Error("One of twitterUserId or linkedInUserId must be provided");
  }

  if (twitterUserId) {
    const client = await TwitterClient.fromUserId(twitterUserId);
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
