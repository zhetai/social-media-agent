import {
  interrupt,
  LangGraphRunnableConfig,
  // @ts-expect-error - The type is used in the JSDoc comment, but not defined in the code.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type NodeInterrupt,
} from "@langchain/langgraph";
import { HumanInterrupt, HumanResponse } from "../../types.js";
import {
  LINKEDIN_ACCESS_TOKEN,
  LINKEDIN_ORGANIZATION_ID,
  LINKEDIN_PERSON_URN,
} from "../../generate-post/constants.js";

const LINKEDIN_AUTHORIZATION_DOCS_URL =
  "https://github.com/langchain-ai/social-media-agent?tab=readme-ov-file#setup";

/**
 * Checks LinkedIn authorization status and triggers an interrupt if authorization is needed.
 * This function verifies the presence of required LinkedIn credentials (access token and either person URN or organization ID).
 * If credentials are missing, it will interrupt the flow to request user authorization.
 *
 * @param linkedInUserId - The user ID for LinkedIn authorization
 * @param config - Configuration object containing LinkedIn credentials and other settings
 * @param options - Optional configuration for interrupt handling
 * @param options.returnInterrupt - If true, returns the interrupt object instead of throwing it
 * @returns A promise that resolves to a HumanInterrupt object if returnInterrupt is true and authorization is needed,
 *          otherwise resolves to undefined
 * @throws {NodeInterrupt} When authorization is needed and returnInterrupt is false
 * @throws {Error} When user denies authorization by ignoring the interrupt
 *
 * @example
 * ```typescript
 * await getLinkedInAuthOrInterrupt("user123", config);
 * ```
 */
export async function getLinkedInAuthOrInterrupt(
  linkedInUserId: string,
  config: LangGraphRunnableConfig,
  options?: {
    returnInterrupt?: boolean;
  },
) {
  const { accessToken, personUrn, organizationId } = {
    accessToken:
      process.env.LINKEDIN_ACCESS_TOKEN ||
      config.configurable?.[LINKEDIN_ACCESS_TOKEN],
    organizationId:
      process.env.LINKEDIN_ORGANIZATION_ID ||
      config.configurable?.[LINKEDIN_ORGANIZATION_ID],
    personUrn:
      process.env.LINKEDIN_PERSON_URN ||
      config.configurable?.[LINKEDIN_PERSON_URN],
  };

  if (!accessToken || (!personUrn && !organizationId)) {
    const description = `# Authorization Required
    
Missing LinkedIn authorization for user: ${linkedInUserId}.

Please follow the authorization instructions [here](${LINKEDIN_AUTHORIZATION_DOCS_URL}).

Once completed, please mark this interrupt as resolved to end this task, and restart with the proper configuration fields or environment variables set.

----

If you have already authorized and set the required configuration fields or environment variables for posting on LinkedIn, please accept this interrupt event to continue the task.`;

    const authInterrupt: HumanInterrupt = {
      action_request: {
        action: "[AUTHORIZATION REQUIRED]: LinkedIn",
        args: {
          authorizationDocs: LINKEDIN_AUTHORIZATION_DOCS_URL,
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
      // The user has accepted, indicating the required fields have been set.
      // Trust this and continue with the task.
      return undefined;
    }
    if (res.type === "ignore") {
      // Throw an error to end the graph.
      throw new Error("Authorization denied by user.");
    }
  }

  return undefined;
}
