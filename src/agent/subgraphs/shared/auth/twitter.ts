// @ts-expect-error - The type is used in the JSDoc comment, but not defined in the code.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { interrupt, type NodeInterrupt } from "@langchain/langgraph";
import { HumanInterrupt } from "../../../types.js";
import Arcade from "@arcadeai/arcadejs";

/**
 * Checks Twitter authorization status and triggers an interrupt if authorization is needed.
 * This function attempts to authorize both tweet lookup and posting capabilities.
 * If either authorization is missing, it will interrupt the flow to request user authorization.
 *
 * @param twitterUserId - The user ID for Twitter authorization
 * @param arcade - The Arcade instance used for tool authorization
 * @throws {NodeInterrupt} When authorization is needed, throws an interrupt to request user action
 * @returns {Promise<void>} Resolves when authorization is complete or if no authorization is needed
 *
 * @example
 * ```typescript
 * await getTwitterAuthOrInterrupt("user123", arcadeInstance);
 * ```
 */
export async function getTwitterAuthOrInterrupt(
  twitterUserId: string,
  arcade: Arcade,
) {
  const authResponseLookup = await arcade.tools.authorize({
    tool_name: "X.LookupTweetById",
    user_id: twitterUserId,
  });
  const authResponsePost = await arcade.tools.authorize({
    tool_name: "X.PostTweet",
    user_id: twitterUserId,
  });

  const authUrlLookup = authResponseLookup.authorization_url;
  const authUrlPost = authResponsePost.authorization_url;

  if (authUrlLookup || authUrlPost) {
    const description = `Please visit the following URL(s) to authorize reading & posting Tweets.

Read: ${authUrlLookup}

Post: ${authUrlPost}

----

If you have already authorized reading/posting on Twitter, please accept this interrupt event.`;

    const authInterrupt: HumanInterrupt = {
      action_request: {
        action: "[AUTHORIZATION REQUIRED]: Twitter",
        args: {},
      },
      config: {
        allow_ignore: true,
        // TODO: Verify in UI what 'allow_accept' without args will do.
        allow_accept: true,
        allow_edit: false,
        allow_respond: false,
      },
      description,
    };

    // We do not need to extract the return value because the interrupt
    // function will not be called after authorizing both

    // TODO: Verify that the interrupt acts as expected when it's not called again after authorizing like in this instance.
    interrupt([authInterrupt]);
  }
}
