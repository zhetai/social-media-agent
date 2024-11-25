import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { GraphAnnotation } from "../state.js";
import { LANGCHAIN_PRODUCTS_CONTEXT } from "../prompts.js";
import { ChatAnthropic } from "@langchain/anthropic";

const GENERATE_REPORT_PROMPT = `You are a highly regarded marketing employee at LangChain.
You have been tasked with writing a report summary on content submitted to you from a third party in hopes of having it promoted by LangChain.
This summary report will then be used to craft Tweets and LinkedIn posts promoting the content and LangChain products.
LangChain has a policy of promoting any content submitted that uses LangChain's products.

Here is some context about the different LangChain products and services:
${LANGCHAIN_PRODUCTS_CONTEXT}

Given this context, examine the users input closely, and generate a summary report on it.
Follow these rules and guidelines when generating the report:
- Focus on subject of the content, and why/how LangChain's product(s) enhance it.
- The final Tweet/LinkedIn post will be developer focused, so ensure the report is technical and detailed.
- Include any relevant links found in the content in the report.
- Include details about what the product does/what problem it solves.
- Use proper markdown styling when formatting the report summary.

Do not include any personal opinions or biases in the report. Stick to the facts and technical details.
Your response should ONLY include the report summary, and no other text.`;

const formatReportPrompt = (pageContents: string[]): string => {
  return `The following text contains summaries, or entire pages from the content I submitted to you. Please review the content and generate a report on it.
${pageContents.map((content, index) => `<Content index={${index + 1}}>\n${content}\n</Content>`).join("\n\n")}`;
}

export async function generateContentReport(
  state: typeof GraphAnnotation.State,
  _config: LangGraphRunnableConfig,
): Promise<Partial<typeof GraphAnnotation.State>> {
  const reportModel = new ChatAnthropic({
    model: "claude-3-5-sonnet-20241022",
    temperature: 0,
  })

  const prompt = formatReportPrompt(state.pageContents);

  const result = await reportModel.invoke([
    {
      role: "system",
      content: GENERATE_REPORT_PROMPT,
    },
    {
      role: "user",
      content: prompt,
    }
  ])

  return {
    report: result.content as string,
  }
}
