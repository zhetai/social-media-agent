import { z } from "zod";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { GraphAnnotation, VerifyContentAnnotation } from "../state.js";
import { ChatVertexAI } from "@langchain/google-vertexai-web";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";

type VerifyYouTubeContentReturn = {
  relevantLinks: (typeof GraphAnnotation.State)["relevantLinks"];
  pageContents: (typeof GraphAnnotation.State)["pageContents"];
};

const GENERATE_REPORT_PROMPT = `You are a highly regarded marketing employee at a large software company.
You have been assigned the provided YouTube video, and you need to generate a summary report of the content in the video.
Specifically, you should be focusing on the technical details, why people should care about it, and any problems it solves.
You should also focus on the LangChain products the video might talk about (although not all videos will have LangChain content).

For context, LangChain has three main products you should be looking out for:
- **LangChain** - the main open source libraries developers use for building AI applications. These are open source Python/JavaScript/TypeScript libraries.
- **LangGraph** - an open source library for building agentic AI applications. This is a Python/JavaScript/TypeScript library.
  LangChain also offers a hosted cloud platform called 'LangGraph Cloud' or 'LangGraph Platform' which developers can use to host their LangGraph applications in production.
- **LangSmith** - this is LangChain's SaaS product for building AI applications. It offers solutions for evaluating AI systems, observability, datasets and testing.

Given this context, examine the YouTube videos contents closely, and generate a report on the video.
For context, this report will be used to generate a Tweet and LinkedIn post promoting the video and the LangChain products it uses, if any.
Ensure to include in your report if this video is relevant to LangChain's products, and if so, include content in your report on what the video covered in relation to LangChain's products.`;

const VERIFY_LANGCHAIN_RELEVANT_CONTENT_PROMPT = `You are a highly regarded marketing employee at LangChain.
You're given a summary/report on some content a third party submitted to you in hopes of having it promoted by LangChain.
You need to verify if the content is relevant to LangChain's products before approving or denying the request.

For context, LangChain has three main products you should be looking out for:
- **LangChain** - the main open source libraries developers use for building AI applications. These are open source Python/JavaScript/TypeScript libraries.
- **LangGraph** - an open source library for building agentic AI applications. This is a Python/JavaScript/TypeScript library.
  LangChain also offers a hosted cloud platform called 'LangGraph Cloud' or 'LangGraph Platform' which developers can use to host their LangGraph applications in production.
- **LangSmith** - this is LangChain's SaaS product for building AI applications. It offers solutions for evaluating AI systems, observability, datasets and testing.

Given this context, examine the summary/report closely, and determine if the content is relevant to LangChain's products.
You should provide reasoning as to why or why not the content is relevant to LangChain's products, then a simple true or false for whether or not it's relevant.
`;

const RELEVANCY_SCHEMA = z
  .object({
    reasoning: z
      .string()
      .describe(
        "Reasoning for why the content is or isn't relevant to LangChain's products.",
      ),
    relevant: z
      .boolean()
      .describe(
        "Whether or not the content is relevant to LangChain's products.",
      ),
  })
  .describe("The relevancy of the content to LangChain's products.");

/**
 * Verifies the content provided is relevant to LangChain products.
 */
export async function verifyYouTubeContent(
  state: typeof VerifyContentAnnotation.State,
  _config: LangGraphRunnableConfig,
): Promise<VerifyYouTubeContentReturn> {
  const model = new ChatVertexAI({
    model: "gemini-1.5-flash",
    temperature: 0,
  });

  const mediaMessage = new HumanMessage({
    content: [
      {
        type: "media",
        fileUri: state.link,
      },
    ],
  });

  const summaryResult = await model
    .withConfig({
      runName: "generate-video-summary-model",
    })
    .invoke([
      {
        role: "system",
        content: GENERATE_REPORT_PROMPT,
      },
      mediaMessage,
    ]);

  const relevancyModel = new ChatAnthropic({
    model: "claude-3-5-sonnet-20241022",
    temperature: 0,
  }).withStructuredOutput(RELEVANCY_SCHEMA, {
    name: "relevancy",
  });

  const { relevant } = await relevancyModel
    .withConfig({
      runName: "check-video-relevancy-model",
    })
    .invoke([
      {
        role: "system",
        content: VERIFY_LANGCHAIN_RELEVANT_CONTENT_PROMPT,
      },
      {
        role: "user",
        content: summaryResult.content,
      },
    ]);

  if (relevant) {
    return {
      // TODO: Replace with actual relevant link/page content (summary in this case)
      relevantLinks: [state.link],
      pageContents: [summaryResult.content as string],
    };
  }

  // Not relevant, return empty arrays so this URL is not included.
  return {
    relevantLinks: [],
    pageContents: [],
  };
}
