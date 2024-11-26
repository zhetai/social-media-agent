import { z } from "zod";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { GraphAnnotation } from "../../generate-post/generate-post-state.js";
import { ChatAnthropic } from "@langchain/anthropic";
import { LANGCHAIN_PRODUCTS_CONTEXT } from "../../generate-post/prompts.js";
import { hasFileExtension } from "../../../utils.js";
import { VerifyContentAnnotation } from "../shared-state.js";

type VerifyGitHubContentReturn = {
  relevantLinks: (typeof GraphAnnotation.State)["relevantLinks"];
  pageContents: (typeof GraphAnnotation.State)["pageContents"];
};

const RELEVANCY_SCHEMA = z
  .object({
    reasoning: z
      .string()
      .describe(
        "Reasoning for why the content from the GitHub repository is or isn't relevant to LangChain's products.",
      ),
    relevant: z
      .boolean()
      .describe(
        "Whether or not the content from the GitHub repository is relevant to LangChain's products.",
      ),
  })
  .describe("The relevancy of the content to LangChain's products.");

const VERIFY_LANGCHAIN_RELEVANT_CONTENT_PROMPT = `You are a highly regarded marketing employee at LangChain.
You're given a {file_type} from a GitHub repository and need to verify the repository implements LangChain's products.
You're doing this to ensure the content is relevant to LangChain, and it can be used as marketing material to promote LangChain.

For context, LangChain has three main products you should be looking out for:
${LANGCHAIN_PRODUCTS_CONTEXT}

Given this context, examine the  {file_type} closely, and determine if the repository implements LangChain's products.
You should provide reasoning as to why or why not the repository implements LangChain's products, then a simple true or false for whether or not it implements some.`;

const tryGetReadmeContents = async (
  urls: string[],
): Promise<string | undefined> => {
  let content: string | undefined = undefined;
  for await (const url of urls) {
    if (content) {
      break;
    }

    try {
      content = await fetch(url).then((res) => res.text());
    } catch (_) {
      // no-op
    }
  }

  return content;
};

export async function getGitHubContentsAndTypeFromUrl(
  url: string,
  messageAttachments?: string,
): Promise<
  | {
      contents: string;
      fileType: string;
    }
  | undefined
> {
  let pageContent: string | undefined = undefined;
  let fileType = "README file";

  let baseGitHubRepoUrl = "";
  try {
    const githubUrl = new URL(url);
    // Ensure the url only contains the owner/repo path
    baseGitHubRepoUrl = githubUrl.pathname.split("/").slice(0, 3).join("/");
  } catch (e) {
    console.error("Failed to parse GitHub URL", e);
    return undefined;
  }

  if (hasFileExtension(url) && messageAttachments) {
    // Use the `text` field of the attachment as the content
    pageContent = messageAttachments;
    fileType = "code file";
  } else {
    const rawMainReadmeLink = `${baseGitHubRepoUrl}/refs/heads/main/README.md`;
    const rawMainReadmeLinkLowercase = `${baseGitHubRepoUrl}/refs/heads/main/readme.md`;
    const rawMasterReadmeLink = `${baseGitHubRepoUrl}/refs/heads/master/README.md`;
    const rawMasterReadmeLinkLowercase = `${baseGitHubRepoUrl}/refs/heads/master/readme.md`;
    // Attempt to fetch the contents of main, if it fails, try master, finally, just read the content of the original URL.
    pageContent = await tryGetReadmeContents([
      rawMainReadmeLink,
      rawMainReadmeLinkLowercase,
      rawMasterReadmeLink,
      rawMasterReadmeLinkLowercase,
      url,
    ]);
  }

  if (!pageContent) {
    return undefined;
  }

  return {
    contents: pageContent,
    fileType,
  };
}

export async function verifyGitHubContentIsRelevant(
  contents: string,
  fileType: string,
): Promise<boolean> {
  const relevancyModel = new ChatAnthropic({
    model: "claude-3-5-sonnet-20241022",
    temperature: 0,
  }).withStructuredOutput(RELEVANCY_SCHEMA, {
    name: "relevancy",
  });

  const { relevant } = await relevancyModel
    .withConfig({
      runName: "check-github-relevancy-model",
    })
    .invoke([
      {
        role: "system",
        content: VERIFY_LANGCHAIN_RELEVANT_CONTENT_PROMPT.replaceAll(
          "{file_type}",
          fileType,
        ),
      },
      {
        role: "user",
        content: contents,
      },
    ]);
  return relevant;
}

/**
 * Verifies the content provided is relevant to LangChain products.
 */
export async function verifyGitHubContent(
  state: typeof VerifyContentAnnotation.State,
  _config: LangGraphRunnableConfig,
): Promise<VerifyGitHubContentReturn> {
  const contentsAndType = await getGitHubContentsAndTypeFromUrl(
    state.link,
    state.slackMessage.attachments?.[0].text,
  );
  if (!contentsAndType) {
    return {
      relevantLinks: [],
      pageContents: [],
    };
  }

  const relevant = await verifyGitHubContentIsRelevant(
    contentsAndType.contents,
    contentsAndType.fileType,
  );
  if (relevant) {
    return {
      // TODO: Replace with actual relevant link/page content (summary in this case)
      relevantLinks: [state.link],
      pageContents: [contentsAndType.contents],
    };
  }

  // Not relevant, return empty arrays so this URL is not included.
  return {
    relevantLinks: [],
    pageContents: [],
  };
}
