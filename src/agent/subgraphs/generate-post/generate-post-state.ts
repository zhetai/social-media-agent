import { Annotation, END } from "@langchain/langgraph";
import {
  GraphAnnotation as MainGraphAnnotation,
  SimpleSlackMessageWithLinks,
} from "../../state.js";

export type LangChainProduct = "langchain" | "langgraph" | "langsmith";

export type YouTubeVideoSummary = {
  /**
   * The link to the YouTube video the summary is for.
   */
  link: string;
  /**
   * The summary of the video.
   */
  summary: string;
};

export const GraphAnnotation = Annotation.Root({
  /**
   * The message to use for generating a post.
   */
  slackMessage: Annotation<SimpleSlackMessageWithLinks>,
  /**
   * The report generated on the content of the message. Used
   * as context for generating the post.
   */
  report: MainGraphAnnotation.spec.report,
  /**
   * Page content used in the verification nodes. Will be used in the report
   * generation node.
   */
  pageContents: Annotation<string[]>({
    reducer: (state, update) => state.concat(update),
    default: () => [],
  }),
  /**
   * Relevant links found in the message.
   */
  relevantLinks: Annotation<string[]>({
    reducer: (state, update) => {
      // Use a set to ensure no duplicate links are added.
      const stateSet = new Set(state);
      update.forEach((link) => stateSet.add(link));
      return Array.from(stateSet);
    },
    default: () => [],
  }),
  /**
   * The generated post for LinkedIn/Twitter.
   */
  post: Annotation<string>,
  /**
   * The date to schedule the post for.
   */
  scheduleDate: Annotation<{
    day: string;
    time: string;
    date: Date;
  }>,
  /**
   * Response from the user for the post. Typically used to request
   * changes to be made to the post.
   */
  userResponse: Annotation<string>,
  /**
   * The node to execute next.
   */
  next: Annotation<"schedulePost" | "rewritePost" | typeof END | undefined>,
});

export const ConfigurableAnnotation = Annotation.Root({
  /**
   * The user ID or email of the user to use for fetching & posting Tweets.
   */
  twitterUserId: Annotation<string>,
  /**
   * The user ID or email of the user to use for fetching
   * content & posting on LinkedIn.
   */
  linkedInUserId: Annotation<string>,
});
