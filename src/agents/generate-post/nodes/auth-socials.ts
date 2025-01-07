import { interrupt, LangGraphRunnableConfig } from "@langchain/langgraph";
import { GeneratePostAnnotation } from "../generate-post-state.js";
import Arcade from "@arcadeai/arcadejs";
import { getLinkedInAuthOrInterrupt } from "../../shared/auth/linkedin.js";
import {
  getArcadeTwitterAuthOrInterrupt,
  getBasicTwitterAuthOrInterrupt,
} from "../../shared/auth/twitter.js";
import { HumanInterrupt, HumanResponse } from "../../types.js";

export async function authSocialsPassthrough(
  _state: typeof GeneratePostAnnotation.State,
  config: LangGraphRunnableConfig,
) {
  let linkedInHumanInterrupt: HumanInterrupt | undefined = undefined;
  const linkedInUserId = process.env.LINKEDIN_USER_ID;
  if (linkedInUserId) {
    linkedInHumanInterrupt = await getLinkedInAuthOrInterrupt(
      linkedInUserId,
      config,
      { returnInterrupt: true },
    );
  }

  let twitterHumanInterrupt: HumanInterrupt | undefined = undefined;
  const twitterUserId = process.env.TWITTER_USER_ID;
  if (twitterUserId) {
    const useArcadeAuth = process.env.USE_ARCADE_AUTH;
    if (useArcadeAuth === "true") {
      const arcade = new Arcade({
        apiKey: process.env.ARCADE_API_KEY,
      });

      twitterHumanInterrupt = await getArcadeTwitterAuthOrInterrupt(
        twitterUserId,
        arcade,
        { returnInterrupt: true },
      );
    } else {
      twitterHumanInterrupt = await getBasicTwitterAuthOrInterrupt();
    }
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
${combinedArgs.authorizeLinkedInPostingURL ? `LinkedIn Posting: ${combinedArgs.authorizeLinkedInPostingURL}` : ""}

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
