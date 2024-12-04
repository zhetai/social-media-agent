import { VerifyRedditPostAnnotation } from "../verify-reddit-post-state.js";

export async function validateRedditPost(
  _state: typeof VerifyRedditPostAnnotation.State,
): Promise<Partial<typeof VerifyRedditPostAnnotation.State>> {
  throw new Error("Not implemented");
}
