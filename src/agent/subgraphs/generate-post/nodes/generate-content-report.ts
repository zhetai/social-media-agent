import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { GraphAnnotation } from "../generate-post-state.js";
import { LANGCHAIN_PRODUCTS_CONTEXT } from "../prompts.js";
import { ChatAnthropic } from "@langchain/anthropic";

const GENERATE_REPORT_PROMPT = `You are a highly regarded marketing employee at LangChain.
You have been tasked with writing a report summary on content submitted to you from a third party in hopes of having it promoted by LangChain.
This summary report will then be used to craft Tweets and LinkedIn posts promoting the content and LangChain products.
LangChain has a policy of promoting any content submitted that uses LangChain's products.

Here is some context about the different LangChain products and services:
${LANGCHAIN_PRODUCTS_CONTEXT}

Given this context, examine the users input closely, and generate a summary report on it.

The summary report should follow the following structure guidelines:
<structure guidelines>
1. The first part of the report should be a high level overview of the content. Include the name, what it does/what it aims to achieve/the problems it solves.
2. The second part should be all about how it implements LangChain's products/services. Cover what product(s) it uses. How these products are used, and why they're important to the application. This should be technical and detailed. Ensure you clearly state the LangChain product(s) used at the top of this section.
3. The final part should go into detail covering anything the first two parts missed. This should be a detailed technical overview of the content, and interesting facts you found that readers might find engaging. This part does NOT need to long, and if you've already covered everything, you can skip it. Remember you do NOT want to bore the readers with repetitive information.
</structure guidelines>

Follow these rules and guidelines when generating the report:
<rules>
- Focus on subject of the content, and why/how LangChain's product(s) enhance it.
- The final Tweet/LinkedIn post will be developer focused, so ensure the report is technical and detailed.
- Include any relevant links found in the content in the report.
- Include details about what the product does/what problem it solves.
- Use proper markdown styling when formatting the report summary.
- If possible, keep the post at or under 280 characters (not including the URL) for conciseness.
<rules>

Do not include any personal opinions or biases in the report. Stick to the facts and technical details.
Your response should ONLY include the report summary, and no other text.`;

const formatReportPrompt = (pageContents: string[]): string => {
  return `The following text contains summaries, or entire pages from the content I submitted to you. Please review the content and generate a report on it.
${pageContents.map((content, index) => `<Content index={${index + 1}}>\n${content}\n</Content>`).join("\n\n")}`;
};

export async function generateContentReport(
  state: typeof GraphAnnotation.State,
  _config: LangGraphRunnableConfig,
): Promise<Partial<typeof GraphAnnotation.State>> {
  const reportModel = new ChatAnthropic({
    model: "claude-3-5-sonnet-20241022",
    temperature: 0,
  });

  const prompt = formatReportPrompt(state.pageContents);

  const result = await reportModel.invoke([
    {
      role: "system",
      content: GENERATE_REPORT_PROMPT,
    },
    {
      role: "user",
      content: prompt,
    },
  ]);

  return {
    report: result.content as string,
  };
}
