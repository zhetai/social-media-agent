import { Annotation } from "@langchain/langgraph";
import { SimpleSlackMessage } from "../../clients/slack.js";

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
  twitterUserId: Annotation<string | undefined>,
  /**
   * The user ID or email of the user to use for fetching
   * content & posting on LinkedIn.
   */
  linkedInUserId: Annotation<string | undefined>,
  /**
   * A Twitter username to use to ingest recent tweets.
   */
  ingestTwitterUsername: Annotation<string | undefined>,
});
