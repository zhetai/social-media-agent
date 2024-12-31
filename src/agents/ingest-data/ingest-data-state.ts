import { Annotation } from "@langchain/langgraph";
import { SimpleSlackMessage } from "../../clients/slack.js";
import {
  INGEST_TWITTER_USERNAME,
  LINKEDIN_ACCESS_TOKEN,
  LINKEDIN_ORGANIZATION_ID,
  LINKEDIN_PERSON_URN,
  LINKEDIN_USER_ID,
  POST_TO_LINKEDIN_ORGANIZATION,
  TWITTER_TOKEN,
  TWITTER_TOKEN_SECRET,
  TWITTER_USER_ID,
} from "../generate-post/constants.js";

export type LangChainProduct = "langchain" | "langgraph" | "langsmith";
export type SimpleSlackMessageWithLinks = SimpleSlackMessage & {
  links: string[];
};

export const IngestDataAnnotation = Annotation.Root({
  /**
   * The links to content to use for generating posts.
   */
  links: Annotation<string[]>,
  /**
   * A report generated on the content. Will be used in the main
   * graph when generating the post about this content.
   */
  report: Annotation<string>,
  /**
   * The content of the linkedin post.
   */
  linkedinPost: Annotation<string>,
  /**
   * The content of the tweet.
   */
  twitterPost: Annotation<string>,
});

export const IngestDataConfigurableAnnotation = Annotation.Root({
  maxMessages: Annotation<number>({
    reducer: (_state, update) => update,
    default: () => 100,
  }),
  /**
   * The maximum number of days to go back when ingesting
   * messages from Slack.
   */
  maxDaysHistory: Annotation<number>,
  slackChannelName: Annotation<string | undefined>,
  slackChannelId: Annotation<string | undefined>,
  /**
   * Whether or not to skip ingesting messages from Slack.
   * This will throw an error if slack messages are not
   * pre-provided in state.
   */
  skipIngest: Annotation<boolean | undefined>,
  /**
   * The user ID or email of the user to use for fetching
   * & posting Tweets.
   */
  [TWITTER_USER_ID]: Annotation<string | undefined>,
  /**
   * The user ID or email of the user to use for fetching
   * content & posting on LinkedIn.
   */
  [LINKEDIN_USER_ID]: Annotation<string | undefined>,
  /**
   * A Twitter username to use to ingest recent tweets.
   */
  [INGEST_TWITTER_USERNAME]: Annotation<string | undefined>,
  /**
   * Twitter authentication token used for posting Tweets.
   */
  [TWITTER_TOKEN]: Annotation<string | undefined>,
  /**
   * Twitter authentication token secret used for posting Tweets.
   */
  [TWITTER_TOKEN_SECRET]: Annotation<string | undefined>,
  /**
   * LinkedIn authentication token used for posting on LinkedIn.
   */
  [LINKEDIN_ACCESS_TOKEN]: Annotation<string | undefined>,
  /**
   * The user ID or email of the user to use for posting on LinkedIn.
   * Optional if [LINKEDIN_ORGANIZATION_ID] is provided.
   */
  [LINKEDIN_PERSON_URN]: Annotation<string | undefined>,
  /**
   * The ID of the LinkedIn organization to post to.
   * Optional if [LINKEDIN_PERSON_URN] is provided.
   */
  [LINKEDIN_ORGANIZATION_ID]: Annotation<string | undefined>,
  /**
   * Whether to post to the LinkedIn organization or the user's profile.
   * If true, [LINKEDIN_ORGANIZATION_ID] is required.
   */
  [POST_TO_LINKEDIN_ORGANIZATION]: Annotation<boolean | undefined>,
});
