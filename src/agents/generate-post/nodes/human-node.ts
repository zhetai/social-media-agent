import { END, LangGraphRunnableConfig, interrupt } from "@langchain/langgraph";
import { GeneratePostAnnotation } from "../generate-post-state.js";
import { formatInTimeZone } from "date-fns-tz";
import { HumanInterrupt, HumanResponse } from "../../types.js";
import {
  getDateFromTimezoneDateString,
  getNextSaturdayDate,
  isValidDateString,
} from "../../utils.js";

interface ConstructDescriptionArgs {
  report: string;
  relevantLinks: string[];
  post: string;
}

function constructDescription({
  report,
  relevantLinks,
  post,
}: ConstructDescriptionArgs): string {
  const header = `# Schedule post\n\nThe following post was generated for Twitter/LinkedIn:\n\n\`\`\`\n${post}\n\`\`\``;
  const editInstructions = `If the post is edited and submitted, it will be scheduled for Twitter/LinkedIn.`;
  const respondInstructions = `If a response is sent, it will be used to rewrite the post. Please note, the response will be used as the 'user' message in an LLM call to rewrite the post, so ensure your response is properly formatted.`;
  const acceptInstructions = `If 'accept' is selected, the post will be scheduled for Twitter/LinkedIn.`;
  const ignoreInstructions = `If 'ignore' is selected, this post will not be scheduled, and the thread will end.`;
  const additionalInstructions = `The date the post will be scheduled for may be edited, but it must follow the format 'MM/dd/yyyy hh:mm a z'. Example: '12/25/2024 10:00 AM PST'`;
  const instructionsText = `## Instructions\n\nThere are a few different actions which can be taken:\n
- **Edit**: ${editInstructions}
- **Response**: ${respondInstructions}
- **Accept**: ${acceptInstructions}
- **Ignore**: ${ignoreInstructions}

${additionalInstructions}`;
  const reportText = `Here is the report that was generated for the posts:\n${report}`;
  const linksText = `Here are the relevant links used for generating the report & posts:\n- ${relevantLinks.join("\n- ")}`;

  return `${header}\n\n${instructionsText}\n\n${reportText}\n\n${linksText}`;
}

export async function humanNode(
  state: typeof GeneratePostAnnotation.State,
  _config: LangGraphRunnableConfig,
): Promise<Partial<typeof GeneratePostAnnotation.State>> {
  if (!state.post) {
    throw new Error("No post found");
  }

  const defaultDate = state.scheduleDate || getNextSaturdayDate();
  const defaultDateString = formatInTimeZone(
    defaultDate,
    "America/Los_Angeles",
    "MM/dd/yyyy hh:mm a z",
  );

  const interruptValue: HumanInterrupt = {
    action_request: {
      action: "Schedule Twitter/LinkedIn posts",
      args: {
        post: state.post,
        date: defaultDateString,
      },
    },
    config: {
      allow_accept: true,
      allow_edit: true,
      allow_ignore: true,
      allow_respond: true,
    },
    description: constructDescription({
      report: state.report,
      relevantLinks: state.relevantLinks,
      post: state.post,
    }),
  };

  const response = interrupt<HumanInterrupt[], HumanResponse[]>([
    interruptValue,
  ])[0];

  if (!["edit", "ignore", "accept", "response"].includes(response.type)) {
    throw new Error(
      `Unexpected response type: ${response.type}. Must be "edit", "ignore", "accept", or "response".`,
    );
  }
  if (response.type === "ignore") {
    return {
      next: END,
    };
  }
  if (!response.args) {
    throw new Error(
      `Unexpected response args: ${response.args}. Must be defined.`,
    );
  }

  if (response.type === "response") {
    if (typeof response.args !== "string") {
      throw new Error("Response args must be a string.");
    }

    return {
      userResponse: response.args,
      next: "rewritePost",
    };
  }

  if (typeof response.args !== "object") {
    throw new Error(
      `Unexpected response args type: ${typeof response.args}. Must be an object.`,
    );
  }
  if (!("args" in response.args)) {
    throw new Error(
      `Unexpected response args value: ${response.args}. Must be defined.`,
    );
  }

  const castArgs = response.args.args as unknown as Record<string, string>;

  const responseOrPost = castArgs.post;
  if (!responseOrPost) {
    throw new Error(
      `Unexpected response args value: ${responseOrPost}. Must be defined.\n\nResponse args:\n${JSON.stringify(response.args, null, 2)}`,
    );
  }

  const postDateString = castArgs.date || defaultDateString;
  const isDateValid = isValidDateString(postDateString);
  if (!isDateValid) {
    // TODO: Handle invalid dates better
    throw new Error("Invalid date provided.");
  }
  const postDate = getDateFromTimezoneDateString(postDateString);
  if (!postDate) {
    // TODO: Handle invalid dates better
    throw new Error("Invalid date provided.");
  }

  // TODO: Implement scheduling tweets and LinkedIn posts once Arcade supports scheduling.
  console.log(
    "\n\nScheduling post:\n---\n",
    responseOrPost,
    "\nFor date:",
    postDateString,
    "\n---\n\n",
  );
  return {
    next: "schedulePost",
    scheduleDate: postDate,
  };
}
