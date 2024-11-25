import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { GraphAnnotation } from "../state.js";
import { ChatAnthropic } from "@langchain/anthropic";

const GENERATE_POST_PROMPT = `You are a highly regarded marketing employee at LangChain, working on crafting thoughtful and engaging content for LangChain's LinkedIn page.
You've been provided with a report on some content that you need to turn into a LinkedIn post. This content & report have been submitted to you by a third party who is looking to get their content promoted by LangChain.

You should use the given report to generate an engaging, professional, and informative LinkedIn post that will be used to promote the content and LangChain's products.

Focus on what their content covers, aims to achieve, and how it uses LangChain's product(s) to do that. You should also include a call to action to encourage engagement with the post and the content.

The following are examples of LinkedIn posts on third party content that have done well, and you should use them as inspiration for your post:

<example index="1">
Podcastfy.ai 🎙️🤖

An Open Source API alternative to NotebookLM's podcast product

Transforming Multimodal Content into Captivating Multilingual Audio Conversations with GenAI

https://podcastfy.ai
</example>

<example index="2">
🧱Complex SQL Joins with LangGraph and Waii

Waii is a toolkit that provides text-to-SQL and text-to-chart capabilities

This post focuses on Waii’s approach to handling complex joins in databases, doing so within LangGraph

https://waii.com
</example>

<example index="3">
🚀RepoGPT: AI-Powered GitHub Assistant 

RepoGPT is an open-source, AI-powered assistant

Chat with your repositories using natural language to get insights, generate documentation, or receive code suggestions

https://repogpt.com
</example>


Given these examples, and the content provided by the user, curate a LinkedIn post that is engaging and follows the structure of the examples provided.
Remember to include one link provided by the user in the post, so that viewers can access the content being promoted.

Finally, ensure your response ONLY includes the LinkedIn post content, and does not include any additional information.`;

const formatPrompt = (report: string, link: string) => {
  return `Here is the report I wrote on the content I'd like promoted by LangChain:
<report>
${report}
</report>

And here is the link to the content I'd like promoted:
<link>
${link}
</link>`
}

export async function generatePosts(
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
    temperature: 0,
  })

  const prompt = formatPrompt(state.report, state.relevantLinks[0]);


  const result = await postModel.invoke([
    {
      role: "system",
      content: GENERATE_POST_PROMPT,
    },
    {
      role: "user",
      content: prompt,
    }
  ]);

  return {
    post: result.content as string,
  }
}
