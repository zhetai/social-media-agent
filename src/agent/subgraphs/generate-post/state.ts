import { Annotation } from "@langchain/langgraph";
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
});

export const VerifyContentAnnotation = Annotation.Root({
  /**
   * The link to the content to verify.
   */
  link: Annotation<string>,
});
