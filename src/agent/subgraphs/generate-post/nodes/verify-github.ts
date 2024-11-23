import { z } from "zod";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { GraphAnnotation, VerifyContentAnnotation } from "../state.js";
import { ChatAnthropic } from "@langchain/anthropic";

type VerifyGitHubContentReturn = {
  relevantLinks: (typeof GraphAnnotation.State)["relevantLinks"];
  pageContents: (typeof GraphAnnotation.State)["pageContents"];
};

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

const VERIFY_LANGCHAIN_RELEVANT_CONTENT_PROMPT = `You are a highly regarded marketing employee at LangChain.
You're given the Readme of a GitHub repository and need to verify the repository implements LangChain's products.
You're doing this to ensure the content is relevant to LangChain, and it can be used as marketing material to promote LangChain.

For context, LangChain has three main products you should be looking out for:
- **LangChain** - the main open source libraries developers use for building AI applications. These are open source Python/JavaScript/TypeScript libraries.
- **LangGraph** - an open source library for building agentic AI applications. This is a Python/JavaScript/TypeScript library.
  LangChain also offers a hosted cloud platform called 'LangGraph Cloud' or 'LangGraph Platform' which developers can use to host their LangGraph applications in production.
- **LangSmith** - this is LangChain's SaaS product for building AI applications. It offers solutions for evaluating AI systems, observability, datasets and testing.

Given this context, examine the readme closely, and determine if the content is relevant to LangChain's products.
You should provide reasoning as to why or why not the content is relevant to LangChain's products, then a simple true or false for whether or not it's relevant.`

/**
 * Verifies the content provided is relevant to LangChain products.
 */
export async function verifyGitHubContent(
  state: typeof VerifyContentAnnotation.State,
  _config: LangGraphRunnableConfig,
): Promise<VerifyGitHubContentReturn> {
  const relevancyModel = new ChatAnthropic({
    model: "claude-3-5-sonnet-20241022",
    temperature: 0,
  }).withStructuredOutput(RELEVANCY_SCHEMA, {
    name: "relevancy",
  });
  
  let baseGitHubRepoUrl = "";
  try {
    const githubUrl = new URL(state.link);
    // Ensure the url only contains the owner/repo path
    baseGitHubRepoUrl = githubUrl.pathname.split("/").slice(0, 3).join("/");
  } catch (e) {
    console.error("Failed to parse GitHub URL", e);
    return {
      relevantLinks: [],
      pageContents: [],
    };
  }

  const rawMainReadmeLink = `${baseGitHubRepoUrl}/refs/heads/main/README.md`;
  const rawMasterReadmeLink = `${baseGitHubRepoUrl}/refs/heads/master/README.md`;
  // Attempt to fetch the contents of main, if it fails, try master, finally, just read the content of the original URL.
  let readmeContent = "";
  try {
    readmeContent = await fetch(rawMainReadmeLink).then((res) => res.text());
  } catch (_) {
    try {
      readmeContent = await fetch(rawMasterReadmeLink).then((res) => res.text());
    } catch (_) {
      readmeContent = await fetch(state.link).then((res) => res.text());
    }
  }

  const { relevant } = await relevancyModel
    .withConfig({
      runName: "check-github-relevancy-model",
    })
    .invoke([
      {
        role: "system",
        content: VERIFY_LANGCHAIN_RELEVANT_CONTENT_PROMPT,
      },
      {
        role: "user",
        content: readmeContent,
      },
    ]);

  if (relevant) {
    return {
      // TODO: Replace with actual relevant link/page content (summary in this case)
      relevantLinks: [state.link],
      pageContents: [readmeContent],
    };
  }

  // Not relevant, return empty arrays so this URL is not included.
  return {
    relevantLinks: [],
    pageContents: [],
  };
}
