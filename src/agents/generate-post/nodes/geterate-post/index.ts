import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { GraphAnnotation } from "../../generate-post-state.js";
import { ChatAnthropic } from "@langchain/anthropic";
import { GENERATE_POST_PROMPT } from "./prompts.js";
import { formatPrompt, parseGeneration } from "./utils.js";
import { ALLOWED_TIMES } from "../../constants.js";
import { getNextSaturdayDate } from "../../../utils.js";

export async function generatePost(
  state: typeof GraphAnnotation.State,
  _config: LangGraphRunnableConfig,
): Promise<Partial<typeof GraphAnnotation.State>> {
  if (!state.report) {
    throw new Error("No report found");
  }
  if (state.relevantLinks.length === 0) {
    throw new Error("No relevant links found");
  }
  const postModel = new ChatAnthropic({
    model: "claude-3-5-sonnet-20241022",
    temperature: 0.5,
  });

  const prompt = formatPrompt(state.report, state.relevantLinks[0]);

  const postResponse = await postModel.invoke([
    {
      role: "system",
      content: GENERATE_POST_PROMPT,
    },
    {
      role: "user",
      content: prompt,
    },
  ]);

  // Randomly select a time from the allowed times
  const [postHour, postMinute] = ALLOWED_TIMES[
    Math.floor(Math.random() * ALLOWED_TIMES.length)
  ]
    .split(" ")[0]
    .split(":");
  const postDate = getNextSaturdayDate(Number(postHour), Number(postMinute));

  return {
    post: parseGeneration(postResponse.content as string),
    scheduleDate: postDate,
  };
}
