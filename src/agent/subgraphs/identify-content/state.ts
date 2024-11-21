import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { GraphAnnotation as MainGraphAnnotation } from "../../state.js";

export type LangChainProduct = "langchain" | "langgraph" | "langsmith";

export const GraphAnnotation = Annotation.Root({
  messages: MessagesAnnotation.spec.messages,
  relevantProducts: MainGraphAnnotation.spec.relevantProducts,
  report: MainGraphAnnotation.spec.report,
});
