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
  LINKEDIN_USER_ID,
  POST_TO_LINKEDIN_ORGANIZATION,
  TWITTER_TOKEN,
  TWITTER_TOKEN_SECRET,
  TWITTER_USER_ID,
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
  [TWITTER_USER_ID]: Annotation<string | undefined>,
  [LINKEDIN_USER_ID]: Annotation<string | undefined>,
  [TWITTER_TOKEN]: Annotation<string | undefined>,
  [TWITTER_TOKEN_SECRET]: Annotation<string | undefined>,
  [LINKEDIN_ACCESS_TOKEN]: Annotation<string | undefined>,
  [LINKEDIN_PERSON_URN]: Annotation<string | undefined>,
  [LINKEDIN_ORGANIZATION_ID]: Annotation<string | undefined>,
  [POST_TO_LINKEDIN_ORGANIZATION]: Annotation<boolean | undefined>,
});

export async function uploadPost(
  state: typeof UploadPostAnnotation.State,
  config: LangGraphRunnableConfig,
): Promise<Partial<typeof UploadPostAnnotation.State>> {
  if (!state.post) {
    throw new Error("No post text found");
  }
  const twitterUserId =
    config.configurable?.[TWITTER_USER_ID] || process.env.TWITTER_USER_ID;
  const linkedInUserId =
    config.configurable?.[LINKEDIN_USER_ID] || process.env.LINKEDIN_USER_ID;

  if (!twitterUserId && !linkedInUserId) {
    throw new Error("One of twitterUserId or linkedInUserId must be provided");
  }

  const twitterToken =
    config.configurable?.[TWITTER_TOKEN] || process.env.TWITTER_USER_TOKEN;
  const twitterTokenSecret =
    config.configurable?.[TWITTER_TOKEN_SECRET] ||
    process.env.TWITTER_USER_TOKEN_SECRET;

  if (twitterUserId) {
    if (!twitterToken || !twitterTokenSecret) {
      throw new Error(
        "Twitter token or token secret not found in configurable fields.",
      );
    }

    const twitterClient = await TwitterClient.fromUserId(twitterUserId, {
      twitterToken,
      twitterTokenSecret,
    });
    const mediaBuffer = await getMediaFromImage(state.image);

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

    if (state.image) {
      await linkedInClient.createImagePost(
        {
          text: state.post,
          imageUrl: state.image.imageUrl,
        },
        {
          postToOrganization:
            config.configurable?.[POST_TO_LINKEDIN_ORGANIZATION],
        },
      );
    } else {
      await linkedInClient.createTextPost(state.post, {
        postToOrganization:
          config.configurable?.[POST_TO_LINKEDIN_ORGANIZATION],
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
