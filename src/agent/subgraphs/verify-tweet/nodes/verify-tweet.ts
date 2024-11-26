import { GraphAnnotation } from "../verify-tweet-state.js";

/**
 * Verifies the content provided is relevant to LangChain products.
 */
export async function verifyTwitterContent(
  _state: typeof GraphAnnotation.State,
): Promise<typeof GraphAnnotation.State> {
  throw new Error("Not implemented");
}
