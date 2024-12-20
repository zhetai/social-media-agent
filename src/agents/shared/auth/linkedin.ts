// @ts-expect-error - The type is used in the JSDoc comment, but not defined in the code.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { interrupt, type NodeInterrupt } from "@langchain/langgraph";
import Arcade from "@arcadeai/arcadejs";
import { HumanInterrupt, HumanResponse } from "../../types.js";

/**
 * Checks LinkedIn authorization status and triggers an interrupt if authorization is needed.
 * This function attempts to authorize both tweet lookup and posting capabilities.
 * If either authorization is missing, it will interrupt the flow to request user authorization.
 *
 * @param linkedInUserId - The user ID for LinkedIn authorization
 * @param arcade - The Arcade instance used for tool authorization
 * @throws {NodeInterrupt} When authorization is needed, throws an interrupt to request user action
 * @returns {Promise<HumanInterrupt | undefined>} A promise that resolves to the interrupt if `options.returnInterrupt` is true, or undefined if `options.returnInterrupt` is false
 *
 * @example
 * ```typescript
 * await getLinkedInAuthOrInterrupt("user123", arcadeInstance);
 * ```
 */
export async function getLinkedInAuthOrInterrupt(
  linkedInUserId: string,
  arcade: Arcade,
  options?: {
    returnInterrupt?: boolean;
  }
) {
  const authResponsePost = await arcade.tools.authorize({
    tool_name: "LinkedIn.CreateTextPost",
    user_id: linkedInUserId,
  });

  const authUrlPost = authResponsePost.authorization_url;

  if (authUrlPost) {
    const description = `# Authorization Required
    
Please visit the following URL(s) to authorize posting on LinkedIn.

Post: ${authUrlPost}

----

If you have already authorized posting on LinkedIn, please accept this interrupt event.`;

    const authInterrupt: HumanInterrupt = {
      action_request: {
        action: "[AUTHORIZATION REQUIRED]: LinkedIn",
        args: {
          authorizeLinkedInPostingURL: authUrlPost,
        },
      },
      config: {
        allow_ignore: true,
        allow_accept: true,
        allow_edit: false,
        allow_respond: false,
      },
      description,
    };

    if (options?.returnInterrupt) {
      return authInterrupt;
    }

    const res = interrupt<HumanInterrupt[], HumanResponse[]>([
      authInterrupt,
    ])[0];
    if (res.type === "accept") {
      // This means that the user has accepted, however the
      // authorization is still needed. Throw an error.
      throw new Error(
        "User accepted authorization, but authorization is still needed.",
      );
    } else if (res.type === "ignore") {
      // Throw an error to end the graph.
      throw new Error("Authorization denied by user.");
    }
  }

  return undefined;
}
