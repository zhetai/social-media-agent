import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { GraphAnnotation } from "../generate-post-state.js";
import { ChatAnthropic } from "@langchain/anthropic";

const TWEET_EXAMPLES = `<example index="1">
Podcastfy.ai 🎙️🤖

An Open Source API alternative to NotebookLM's podcast product

Transforming Multimodal Content into Captivating Multilingual Audio Conversations with GenAI

https://podcastfy.ai
</example>

<example index="2">
🧱Complex SQL Joins with LangGraph and Waii

Waii is a toolkit that provides text-to-SQL and text-to-chart capabilities

This post focuses on Waii's approach to handling complex joins in databases, doing so within LangGraph

https://waii.com
</example>

<example index="3">
🌐 Build agents that can interact with any website

Check out this video by @DendriteSystems showing how to build an agent that can interact with websites just like a human would!

This video demonstrates a workflow that:

- Finds competitors on Product Hunt and Hacker News
- Drafts an email about new competitors
- Sends the email via Outlook

📺 Video: https://youtube.com/watch?v=BGvqeRB4Jpk
🧠 Repo: https://github.com/dendrite-systems/dendrite-examples
</example>

<example index="4">
🚀RepoGPT: AI-Powered GitHub Assistant 

RepoGPT is an open-source, AI-powered assistant

Chat with your repositories using natural language to get insights, generate documentation, or receive code suggestions

https://repogpt.com
</example>

<example index="5">
✈️AI Travel Agent

This is one of the most comprehensive examples we've seen of a LangGraph agent. It's specifically designed to be a real world practical use case

Features
- Stateful Interactions
- Human-in-the-Loop
- Dynamic LLMs
- Email Automation

https://github.com/nirbar1985/ai-travel-agent
</example>`;

const GENERATE_POST_PROMPT = `You're a highly regarded marketing employee at LangChain, working on crafting thoughtful and engaging content for LangChain's LinkedIn and Twitter pages.
You've been provided with a report on some content that you need to turn into a LinkedIn/Twitter post. The same post will be used for both platforms.
Your coworker has already taken the time to write a detailed marketing report on this content for you, so please take your time and read it carefully.

The following are examples of LinkedIn/Twitter posts on third-party LangChain content that have done well, and you should use them as style inspiration for your post:
<examples>
${TWEET_EXAMPLES}
</examples>

Now that you've seen some examples, lets's cover the structure of the LinkedIn/Twitter post you should follow. The post should have three main sections, outlined below:
<structure-instructions>
<section key="1">
The first part of the post is the header. This should be very short, no more than 5 words, and should include one to two emojis, and the name of the content provided. If the marketing report does not specify a name, you should get creative and come up with a catchy title for it.
</section>

<section key="2">
This section will contain the main content of the post. The post body should contain a concise, high-level overview of the content/product/service outlines in the marketing report.
It should focus on what the content does, or the problem it solves. Also include details on how the content implements LangChain's product(s) and why these products are important to the application.
Ensure this is short, no more than 3 sentences. Optionally, if the content is very technical, you may include bullet points covering the main technical aspects of the content.
You should NOT make the main focus of this on LangChain, but instead on the content itself. Remember, the content/product/service outlined in the marketing report is the main focus of this post.
</section>

<section key="3">
The final section of the post should contain a call to action. This should be a short sentence that encourages the reader to click the link to the content being promoted. Optionally, you can include an emoji here.
</section>
</structure-instructions>

This structure should ALWAYS be followed. And remember, the shorter and more engaging the post, the better (your yearly bonus depends on this!!).

Here are a set of rules and guidelines you should strictly follow when creating the LinkedIn/Twitter post:
<rules>
- Focus your post on what the content covers, aims to achieve, and how it uses LangChain's product(s) to do that. This should be concise and high level.
- Do not make the post over technical as some of our audience may not be advanced developers, but ensure it is technical enough to engage developers.
- Keep posts short, concise and engaging
- Limit the use of emojis to the post header, and optionally in the call to action.
- NEVER use hashtags in the post.
- ALWAYS include the link to the content being promoted in the call to action section of the post.
</rules>

Lastly, you should follow the process below when writing the LinkedIn/Twitter post:
<writing-process>
Step 1. First, read over the marketing report VERY thoroughly.
Step 2. Take notes, and write down your thoughts about the report after reading it carefully. This should include details you think will help make the post more engaging, and your initial thoughts about what to focus the post on, the style, etc. This should be the first text you write. Wrap the notes and thoughts inside a "<thinking>" tag.
Step 3. Lastly, write the LinkedIn/Twitter post. Use the notes and thoughts you wrote down in the previous step to help you write the post. This should be the last text you write. Wrap your report inside a "<post>" tag. Ensure you write only ONE post for both LinkedIn and Twitter.
</writing-process>

Given these examples, rules, and the content provided by the user, curate a LinkedIn/Twitter post that is engaging and follows the structure of the examples provided.`;

/**
 * Parse the LLM generation to extract the report from inside the <report> tag.
 * If the report can not be parsed, the original generation is returned.
 * @param generation The text generation to parse
 * @returns The parsed generation, or the unmodified generation if it cannot be parsed
 */
function parseGeneration(generation: string): string {
  const reportMatch = generation.match(/<post>([\s\S]*?)<\/post>/);
  if (!reportMatch) {
    console.warn(
      "Could not parse post from generation:\nSTART OF POST GENERATION\n\n",
      generation,
      "\n\nEND OF POST GENERATION",
    );
  }
  return reportMatch ? reportMatch[1].trim() : generation;
}

const formatPrompt = (report: string, link: string) => {
  return `Here is the report I wrote on the content I'd like promoted by LangChain:
<report>
${report}
</report>

And here is the link to the content I'd like promoted:
<link>
${link}
</link>`;
};

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

  return {
    post: parseGeneration(postResponse.content as string),
  };
}
