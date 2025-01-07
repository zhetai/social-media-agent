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
import { LinkedInClient } from "../../clients/linkedin.js";
import {
  LINKEDIN_ACCESS_TOKEN,
  LINKEDIN_ORGANIZATION_ID,
  LINKEDIN_PERSON_URN,
  POST_TO_LINKEDIN_ORGANIZATION,
  TEXT_ONLY_MODE,
} from "../generate-post/constants.js";

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
  [POST_TO_LINKEDIN_ORGANIZATION]: Annotation<boolean | undefined>,
  /**
   * Whether or not to use text only mode throughout the graph.
   * If true, it will not try to extract, validate, or upload images.
   * Additionally, it will not be able to handle validating YouTube videos.
   * @default false
   */
  [TEXT_ONLY_MODE]: Annotation<boolean | undefined>({
    reducer: (_state, update) => update,
    default: () => false,
  }),
});

export async function uploadPost(
  state: typeof UploadPostAnnotation.State,
  config: LangGraphRunnableConfig,
): Promise<Partial<typeof UploadPostAnnotation.State>> {
  if (!state.post) {
    throw new Error("No post text found");
  }
  const isTextOnlyMode = config.configurable?.[TEXT_ONLY_MODE];

  const twitterUserId = process.env.TWITTER_USER_ID;
  const linkedInUserId = process.env.LINKEDIN_USER_ID;

  if (!twitterUserId && !linkedInUserId) {
    throw new Error("One of twitterUserId or linkedInUserId must be provided");
  }

  if (twitterUserId) {
    let twitterClient: TwitterClient;

    const useArcadeAuth = process.env.USE_ARCADE_AUTH;
    if (useArcadeAuth === "true") {
      const twitterToken = process.env.TWITTER_TOKEN;
      const twitterTokenSecret = process.env.TWITTER_USER_TOKEN_SECRET;
      if (!twitterToken || !twitterTokenSecret) {
        throw new Error(
          "Twitter token or token secret not found in configurable fields.",
        );
      }

      twitterClient = await TwitterClient.fromArcade(twitterUserId, {
        twitterToken,
        twitterTokenSecret,
      });
    } else {
      twitterClient = TwitterClient.fromBasicTwitterAuth();
    }

    let mediaBuffer: CreateMediaRequest | undefined = undefined;
    if (!isTextOnlyMode) {
      mediaBuffer = await getMediaFromImage(state.image);
    }

    await twitterClient.uploadTweet({
      text: state.post,
      ...(mediaBuffer && { media: mediaBuffer }),
    });
    console.log("✅ Successfully uploaded Tweet ✅");
  } else {
    console.log("❌ Not uploading Tweet ❌");
  }

  if (linkedInUserId) {
    const linkedInClient = new LinkedInClient({
      accessToken: config.configurable?.[LINKEDIN_ACCESS_TOKEN],
      personUrn: config.configurable?.[LINKEDIN_PERSON_URN],
      organizationId: config.configurable?.[LINKEDIN_ORGANIZATION_ID],
    });

    const postToOrg =
      config.configurable?.[POST_TO_LINKEDIN_ORGANIZATION] != null
        ? JSON.parse(config.configurable?.[POST_TO_LINKEDIN_ORGANIZATION])
        : false;

    if (!isTextOnlyMode && state.image) {
      await linkedInClient.createImagePost(
        {
          text: state.post,
          imageUrl: state.image.imageUrl,
        },
        {
          postToOrganization: postToOrg,
        },
      );
    } else {
      await linkedInClient.createTextPost(state.post, {
        postToOrganization: postToOrg,
      });
    }

    console.log("✅ Successfully uploaded post to LinkedIn ✅");
  } else {
    console.log("❌ Not uploading post to LinkedIn ❌");
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
