import { LangGraphRunnableConfig, interrupt } from "@langchain/langgraph";
import { GraphAnnotation } from "../generate-post-state.js";
import { HumanInterrupt, HumanResponse } from "../../../types.js";

interface ConstructDescriptionArgs {
  report: string;
  relevantLinks: string[];
  slackMessage: string;
}

function constructDescription({
  report,
  relevantLinks,
  slackMessage,
}: ConstructDescriptionArgs): string {
  const header = `The following post was generated for Twitter/LinkedIn.`;
  const reportText = `Here is the report that was generated for the posts:\n${report}`;
  const linksText = `Here are the relevant links used for generating the report & posts:\n- ${relevantLinks.join("\n- ")}`;
  const slackMsgText = `Here is the message that was sent to Slack:\n${slackMessage}`;

  return `${header}\n\n${reportText}\n\n${linksText}\n\n${slackMsgText}`;
}

export async function schedulePost(
  state: typeof GraphAnnotation.State,
  _config: LangGraphRunnableConfig,
): Promise<Partial<typeof GraphAnnotation.State>> {
  if (!state.post) {
    throw new Error("No post found");
  }

  const interruptValue: HumanInterrupt = {
    action_request: {
      action: "Schedule Twitter/LinkedIn posts",
      args: {
        post: state.post,
      },
    },
    config: {
      // Can not accept because the user needs to select one of the posts.
      allow_accept: true,
      allow_edit: true,
      allow_ignore: true,
      allow_respond: true,
    },
    description: constructDescription({
      report: state.report,
      relevantLinks: state.relevantLinks,
      slackMessage: state.slackMessage.text,
    }),
  };

  const response = interrupt<HumanInterrupt[], HumanResponse[]>([
    interruptValue,
  ])[0];

  if (!["edit", "ignore", "accept", "respond"].includes(response.type)) {
    throw new Error(
      `Unexpected response type: ${response.type}. Must be "edit", "ignore", "accept", or "respond".`,
    );
  }
  if (response.type === "ignore") {
    return {} as Partial<typeof GraphAnnotation.State>;
  }
  if (!response.args) {
    throw new Error(
      `Unexpected response args: ${response.args}. Must be defined.`,
    );
  }
  if (typeof response.args !== "object") {
    throw new Error(
      `Unexpected response args type: ${typeof response.args}. Must be an object.`,
    );
  }
  const responseOrPost: string = Object.values(response.args)?.[0];
  if (!responseOrPost) {
    throw new Error(
      `Unexpected response args value: ${responseOrPost}. Must be defined.\n\nResponse args:\n${JSON.stringify(response.args, null, 2)}`,
    );
  }

  if (response.type === "response") {
    return {
      userResponse: responseOrPost,
      shouldRewritePost: true,
    };
  }

  // TODO: Implement scheduling tweets and LinkedIn posts once Arcade supports scheduling.
  console.log("\n\nScheduling post:\n---\n", responseOrPost, "\n---\n\n");
  return {
    shouldRewritePost: false,
  };
}
