import { Annotation } from "@langchain/langgraph";
import { SimpleSlackMessageWithLinks } from "../../state.js";

export const VerifyContentAnnotation = Annotation.Root({
  /**
   * The link to the content to verify.
   */
  link: Annotation<string>,
  /**
   * The message to use for generating a post.
   */
  slackMessage: Annotation<SimpleSlackMessageWithLinks>,
});
