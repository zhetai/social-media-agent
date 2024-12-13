import { Annotation, END } from "@langchain/langgraph";
import { IngestDataAnnotation } from "../ingest-data/ingest-data-state.js";

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

export const GeneratePostAnnotation = Annotation.Root({
  /**
   * The links to use to generate a post.
   */
  links: Annotation<string[]>,
  /**
   * The report generated on the content of the message. Used
   * as context for generating the post.
   */
  report: IngestDataAnnotation.spec.report,
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
  scheduleDate: Annotation<Date>,
  /**
   * Response from the user for the post. Typically used to request
   * changes to be made to the post.
   */
  userResponse: Annotation<string>,
  /**
   * The node to execute next.
   */
  next: Annotation<"schedulePost" | "rewritePost" | typeof END | undefined>,
  /**
   * The base64 encoded image to attach to the post, and the MIME type.
   */
  image: Annotation<
    | {
        base64: string;
        mimeType: string;
      }
    | undefined
  >,
});

export const GeneratePostConfigurableAnnotation = Annotation.Root({
  /**
   * The user ID or email of the user to use for fetching & posting Tweets.
   */
  twitterUserId: Annotation<string | undefined>,
  /**
   * The user ID or email of the user to use for fetching
   * content & posting on LinkedIn.
   */
  linkedInUserId: Annotation<string | undefined>,
});
