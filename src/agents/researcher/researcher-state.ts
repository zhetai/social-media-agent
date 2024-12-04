import { Annotation } from "@langchain/langgraph";

export const ResearcherGraphAnnotation = Annotation.Root({
  /**
   * The contents to generate a report for.
   */
  pageContents: Annotation<string[]>,
  /**
   * The relevant links used when gathering page contents.
   */
  relevantLinks: Annotation<string[]>,
  /**
   * The final report generated.
   */
  report: Annotation<string>,
});