import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { SimpleSlackMessage } from "../clients/slack.js";

export type LangChainProduct = "langchain" | "langgraph" | "langsmith";
export type SimpleSlackMessageWithLinks = SimpleSlackMessage & {
  links: string[];
};

export const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  /**
   * The Slack messages to use for the content.
   */
  slackMessages: Annotation<SimpleSlackMessageWithLinks[]>,
  /**
   * The LangChain product(s) this content is relevant to.
   * Undefined if it is not relevant to any product.
   */
  relevantProducts: Annotation<LangChainProduct[] | undefined>,
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
