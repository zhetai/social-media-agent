import { interrupt, LangGraphRunnableConfig } from "@langchain/langgraph";
import { GeneratePostAnnotation } from "../generate-post-state.js";
import { getLinkedInAuthOrInterrupt } from "../../shared/auth/linkedin.js";
import { getTwitterAuthOrInterrupt } from "../../shared/auth/twitter.js";
import { HumanInterrupt, HumanResponse } from "../../types.js";
import { POST_TO_LINKEDIN_ORGANIZATION } from "../constants.js";

export async function authSocialsPassthrough(
  _state: typeof GeneratePostAnnotation.State,
  config: LangGraphRunnableConfig,
) {
  let linkedInHumanInterrupt: HumanInterrupt | undefined = undefined;
  const linkedInUserId = process.env.LINKEDIN_USER_ID;
  if (linkedInUserId) {
    const postToOrgConfig =
      config.configurable?.[POST_TO_LINKEDIN_ORGANIZATION];
    const postToOrg =
      postToOrgConfig != null
        ? postToOrgConfig
        : process.env.POST_TO_LINKEDIN_ORGANIZATION;
    linkedInHumanInterrupt = await getLinkedInAuthOrInterrupt({
      linkedInUserId,
      returnInterrupt: true,
      postToOrg,
    });
  }

  let twitterHumanInterrupt: HumanInterrupt | undefined = undefined;
  const twitterUserId = process.env.TWITTER_USER_ID;
  if (twitterUserId) {
    twitterHumanInterrupt = await getTwitterAuthOrInterrupt({
      twitterUserId,
      returnInterrupt: true,
    });
  }

  if (!twitterHumanInterrupt && !linkedInHumanInterrupt) {
    // Use has already authorized. Return early
    return {};
  }

  const combinedArgs = {
    ...twitterHumanInterrupt?.action_request.args,
    ...linkedInHumanInterrupt?.action_request.args,
  };

  const description = `# Authorization Required

Please visit the following URL(s) to authorize your social media accounts:

${combinedArgs.authorizeTwitterPostingURL ? `Twitter Posting: ${combinedArgs.authorizeTwitterPostingURL}` : ""}
${combinedArgs.authorizeTwitterReadingURL ? `Twitter Reading: ${combinedArgs.authorizeTwitterReadingURL}` : ""}
${combinedArgs.authorizeLinkedInURL ? `LinkedIn: ${combinedArgs.authorizeLinkedInURL}` : ""}
${combinedArgs.authorizationDocs ? `LinkedIn Authorization Docs: ${combinedArgs.authorizationDocs}` : ""}

Once done, please 'accept' this interrupt event.`;

  const interruptEvent: HumanInterrupt = {
    description,
    action_request: {
      action: "Authorize Social Media Accounts",
      args: combinedArgs,
    },
    config: {
      allow_accept: true,
      allow_ignore: true,
      allow_respond: false,
      allow_edit: false,
    },
  };

  const interruptRes = interrupt<HumanInterrupt[], HumanResponse[]>([
    interruptEvent,
  ])[0];

  if (interruptRes.type === "ignore") {
    // Throw an error to end the graph.
    throw new Error("Authorization denied by user.");
  }

  return {};
}
