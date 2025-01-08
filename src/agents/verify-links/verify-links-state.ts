import { Annotation } from "@langchain/langgraph";

export const VerifyLinksGraphSharedAnnotation = Annotation.Root({
  /**
   * The links to verify.
   */
  links: Annotation<string[]>,
});

export const VerifyLinksGraphAnnotation = Annotation.Root({
  /**
   * The links to verify.
   */
  links: VerifyLinksGraphSharedAnnotation.spec.links,
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
   * Image options to provide to the user.
   */
  imageOptions: Annotation<string[]>({
    reducer: (_state, update) => update,
    default: () => [],
  }),
});
