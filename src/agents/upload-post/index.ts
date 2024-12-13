import {
  Annotation,
  END,
  LangGraphRunnableConfig,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { TwitterClient } from "../../clients/twitter/client.js";

const UploadPostAnnotation = Annotation.Root({
  post: Annotation<string>,
  image: Annotation<
    | {
        base64: string;
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

    await client.uploadTweet({
      text: state.post,
      media: state.image
        ? {
            media: Buffer.from(state.image.base64, "base64"),
            mimeType: state.image.mimeType,
          }
        : undefined,
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
