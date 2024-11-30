import { Annotation } from "@langchain/langgraph";
import { SimpleSlackMessage } from "../clients/slack.js";

export type LangChainProduct = "langchain" | "langgraph" | "langsmith";
export type SimpleSlackMessageWithLinks = SimpleSlackMessage & {
  links: string[];
};

export const GraphAnnotation = Annotation.Root({
  /**
   * The Slack messages to use for the content.
   */
  slackMessages: Annotation<SimpleSlackMessageWithLinks[]>,
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

export const ConfigurableAnnotation = Annotation.Root({
  maxMessages: Annotation<number>({
    reducer: (_state, update) => update,
    default: () => 100,
  }),
  slackChannelName: Annotation<string | undefined>,
  slackChannelId: Annotation<string | undefined>,
  /**
   * Whether or not to skip ingesting messages from Slack.
   * This will throw an error if slack messages are not
   * pre-provided in state.
   */
  skipIngest: Annotation<boolean>,
  /**
   * The user ID or email of the user to use for fetching
   * & posting Tweets.
   */
  twitterUserId: Annotation<string>,
  /**
   * The user ID or email of the user to use for fetching
   * content & posting on LinkedIn.
   */
  linkedInUserId: Annotation<string>,
});
