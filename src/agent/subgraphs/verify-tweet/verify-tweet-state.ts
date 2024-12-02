import { Annotation } from "@langchain/langgraph";
import { VerifyContentAnnotation } from "../shared/shared-state.js";

export const GraphAnnotation = Annotation.Root({
  /**
   * The link to the content to verify.
   */
  link: VerifyContentAnnotation.spec.link,
  /**
   * The message to use for generating a post.
   */
  slackMessage: VerifyContentAnnotation.spec.slackMessage,
  /**
   * The raw content of the Tweet
   */
  tweetContent: Annotation<string>,
  /**
   * URLs which were found in the Tweet
   */
  tweetContentUrls: Annotation<string[]>({
    reducer: (state, update) => state.concat(update),
    default: () => [],
  }),
  /**
   * Page content used in the verification nodes. Will be used in the report
   * generation node.
   */
  pageContents: Annotation<string[]>({
    reducer: (state, update) => {
      if (update[0]?.startsWith("The following is the content of the Tweet:")) {
        // This means the update is from validateTweetContent so we can remove
        // all other state fields.
        return update;
      }

      return state.concat(update);
    },
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
