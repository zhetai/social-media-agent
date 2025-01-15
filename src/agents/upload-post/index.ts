import {
  Annotation,
  END,
  LangGraphRunnableConfig,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { TwitterClient } from "../../clients/twitter/client.js";
import {
  imageUrlToBuffer,
  isTextOnly,
  shouldPostToLinkedInOrg,
} from "../utils.js";
import { CreateMediaRequest } from "../../clients/twitter/types.js";
import { LinkedInClient } from "../../clients/linkedin.js";
import {
  LINKEDIN_ACCESS_TOKEN,
  LINKEDIN_ORGANIZATION_ID,
  LINKEDIN_PERSON_URN,
  POST_TO_LINKEDIN_ORGANIZATION,
  TEXT_ONLY_MODE,
} from "../generate-post/constants.js";
import { SlackClient } from "../../clients/slack.js";

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

interface PostUploadFailureToSlackArgs {
  uploadDestination: "twitter" | "linkedin";
  error: any;
  threadId: string;
  postContent: string;
  image?: {
    imageUrl: string;
    mimeType: string;
  };
}

async function postUploadFailureToSlack({
  uploadDestination,
  error,
  threadId,
  postContent,
  image,
}: PostUploadFailureToSlackArgs) {
  if (!process.env.SLACK_CHANNEL_ID) {
    console.warn(
      "No SLACK_CHANNEL_ID found in environment variables. Can not send error message to Slack.",
    );
    return;
  }
  const slackClient = new SlackClient({
    channelId: process.env.SLACK_CHANNEL_ID,
  });
  const slackMessageContent = `❌ FAILED TO UPLOAD POST TO ${uploadDestination.toUpperCase()} ❌

Error message:
\`\`\`
${error}
\`\`\`

Thread ID: *${threadId}*

Post:
\`\`\`
${postContent}
\`\`\`

${image ? `Image:\nURL: ${image.imageUrl}\nMIME type: ${image.mimeType}` : ""}
`;
  await slackClient.sendMessage(slackMessageContent);
}

export async function uploadPost(
  state: typeof UploadPostAnnotation.State,
  config: LangGraphRunnableConfig,
): Promise<Partial<typeof UploadPostAnnotation.State>> {
  if (!state.post) {
    throw new Error("No post text found");
  }
  const isTextOnlyMode = isTextOnly(config);
  const postToLinkedInOrg = shouldPostToLinkedInOrg(config);

  const twitterUserId = process.env.TWITTER_USER_ID;
  const linkedInUserId = process.env.LINKEDIN_USER_ID;

  if (!twitterUserId && !linkedInUserId) {
    throw new Error("One of twitterUserId or linkedInUserId must be provided");
  }

  try {
    if (twitterUserId) {
      let twitterClient: TwitterClient;

      const useArcadeAuth = process.env.USE_ARCADE_AUTH;
      if (useArcadeAuth === "true") {
        const twitterToken = process.env.TWITTER_USER_TOKEN;
        const twitterTokenSecret = process.env.TWITTER_USER_TOKEN_SECRET;

        twitterClient = await TwitterClient.fromArcade(
          twitterUserId,
          {
            twitterToken,
            twitterTokenSecret,
          },
          {
            textOnlyMode: isTextOnlyMode,
          },
        );
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
  } catch (e: any) {
    console.error("Failed to upload post:", e);
    let errorString = "";
    if (typeof e === "object" && "message" in e) {
      errorString = e.message;
    } else {
      errorString = e;
    }
    await postUploadFailureToSlack({
      uploadDestination: "twitter",
      error: errorString,
      threadId:
        config.configurable?.thread_id || "no thread id found in configurable",
      postContent: state.post,
      image: state.image,
    });
  }

  try {
    if (linkedInUserId) {
      let linkedInClient: LinkedInClient;

      const useArcadeAuth = process.env.USE_ARCADE_AUTH;
      if (useArcadeAuth === "true") {
        linkedInClient = await LinkedInClient.fromArcade(linkedInUserId, {
          postToOrganization: postToLinkedInOrg,
        });
      } else {
        linkedInClient = new LinkedInClient({
          accessToken: config.configurable?.[LINKEDIN_ACCESS_TOKEN],
          personUrn: config.configurable?.[LINKEDIN_PERSON_URN],
          organizationId: config.configurable?.[LINKEDIN_ORGANIZATION_ID],
        });
      }

      if (!isTextOnlyMode && state.image) {
        await linkedInClient.createImagePost(
          {
            text: state.post,
            imageUrl: state.image.imageUrl,
          },
          {
            postToOrganization: postToLinkedInOrg,
          },
        );
      } else {
        await linkedInClient.createTextPost(state.post, {
          postToOrganization: postToLinkedInOrg,
        });
      }

      console.log("✅ Successfully uploaded post to LinkedIn ✅");
    } else {
      console.log("❌ Not uploading post to LinkedIn ❌");
    }
  } catch (e: any) {
    console.error("Failed to upload post:", e);
    let errorString = "";
    if (typeof e === "object" && "message" in e) {
      errorString = e.message;
    } else {
      errorString = e;
    }
    await postUploadFailureToSlack({
      uploadDestination: "linkedin",
      error: errorString,
      threadId:
        config.configurable?.thread_id || "no thread id found in configurable",
      postContent: state.post,
      image: state.image,
    });
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
