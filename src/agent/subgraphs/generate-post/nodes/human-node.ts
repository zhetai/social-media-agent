import { END, LangGraphRunnableConfig, interrupt } from "@langchain/langgraph";
import { GraphAnnotation } from "../generate-post-state.js";
import { HumanInterrupt, HumanResponse } from "../../../types.js";
import { ALLOWED_DAYS } from "../constants.js";
import { getDayAndTimeAsDate } from "../../../utils.js";

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
  const header = `# Schedule post\n\nThe following post was generated for Twitter/LinkedIn.`;
  const editInstructions = `If the post is edited and submitted, it will be scheduled for Twitter/LinkedIn.`;
  const respondInstructions = `If a response is sent, it will be used to rewrite the post. Please note, the response will be used as the 'user' message in an LLM call to rewrite the post, so ensure your response is properly formatted.`;
  const acceptInstructions = `If 'accept' is selected, the post will be scheduled for Twitter/LinkedIn.`;
  const ignoreInstructions = `If 'ignore' is selected, this post will not be scheduled, and the thread will end.`;
  const instructionsText = `## Instructions\n\nThere are a few different actions which can be taken:\n
- **Edit**: ${editInstructions}
- **Respond**: ${respondInstructions}
- **Accept**: ${acceptInstructions}
- **Ignore**: ${ignoreInstructions}`;
  const reportText = `Here is the report that was generated for the posts:\n${report}`;
  const linksText = `Here are the relevant links used for generating the report & posts:\n- ${relevantLinks.join("\n- ")}`;
  const slackMsgText = `Here is the message that was sent to Slack:\n${slackMessage}`;

  return `${header}\n\n${instructionsText}\n\n${reportText}\n\n${linksText}\n\n${slackMsgText}`;
}

function isDayAndTimeValid(day: string, time: string): boolean {
  // Check day validity
  if (!ALLOWED_DAYS.includes(day.toLowerCase())) {
    return false;
  }

  // Remove any extra spaces and convert to uppercase for consistency
  const cleanTime = time.trim().toUpperCase();

  // Regular expression for XX:XX AM/PM format
  const timeRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s*(AM|PM)$/i;
  const match = cleanTime.match(timeRegex);

  if (!match) {
    return false;
  }

  const [_, hours, minutes] = match;
  const hour = parseInt(hours, 10);
  const minute = parseInt(minutes, 10);

  // Validate hour and minute ranges
  return hour >= 1 && hour <= 12 && minute >= 0 && minute <= 59;
}

export async function humanNode(
  state: typeof GraphAnnotation.State,
  _config: LangGraphRunnableConfig,
): Promise<Partial<typeof GraphAnnotation.State>> {
  if (!state.post) {
    throw new Error("No post found");
  }

  const defaultDay = state.scheduleDate.day || "Saturday";
  const defaultTime = state.scheduleDate.time || "12:00 PM";

  const interruptValue: HumanInterrupt = {
    action_request: {
      action: "Schedule Twitter/LinkedIn posts",
      args: {
        post: state.post,
        day: defaultDay,
        time: defaultTime,
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
    return {
      next: END,
    };
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

  // ---
  // TODO: Verify `response`, `accept` and `edit` gives back the proper object.
  // ---

  const castArgs = response.args as unknown as Record<string, string>;

  const responseOrPost = castArgs.post;
  const postDay = castArgs.day || defaultDay;
  const postTime = castArgs.time || defaultTime;
  if (!responseOrPost) {
    throw new Error(
      `Unexpected response args value: ${responseOrPost}. Must be defined.\n\nResponse args:\n${JSON.stringify(response.args, null, 2)}`,
    );
  }

  if (!isDayAndTimeValid(postDay, postTime)) {
    // TODO: Handle invalid dates better
    throw new Error("Invalid day or time provided.");
  }

  if (response.type === "response") {
    return {
      userResponse: responseOrPost,
      next: "rewritePost",
      scheduleDate: {
        day: postDay,
        time: postTime,
        date: getDayAndTimeAsDate(postDay, postTime),
      },
    };
  }

  // TODO: Implement scheduling tweets and LinkedIn posts once Arcade supports scheduling.
  console.log("\n\nScheduling post:\n---\n", responseOrPost, "\n---\n\n");
  return {
    next: "schedulePost",
    scheduleDate: {
      day: postDay,
      time: postTime,
      date: getDayAndTimeAsDate(postDay, postTime),
    },
  };
}
