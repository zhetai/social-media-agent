import { Annotation } from "@langchain/langgraph";
import { VerifyContentAnnotation } from "../shared/shared-state.js";

export const VerifyRedditPostAnnotation = Annotation.Root({
  /**
   * The link to the Reddit post to verify.
   */
  link: VerifyContentAnnotation.spec.link,
  /**
   * A stringified version of the Reddit post, and up to the main 10 replies.
   */
  redditContent: Annotation<string>,
  /**
   * URLs which were found in the Reddit post
   */
  redditPostUrls: Annotation<string[]>({
    reducer: (state, update) => state.concat(update),
    default: () => [],
  }),
  /**
   * Page content used in the verification nodes. Will be used in the report
   * generation node.
   */
  pageContents: Annotation<string[]>({
    reducer: (state, update) => {
      if (
        update[0]?.startsWith(
          "The following is the content of the Reddit post:",
        )
      ) {
        // This means the update is from validateRedditPostContent so we can remove
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
