export const BUSINESS_CONTEXT = `
Here is some context about the different LangChain products and services:
<business-context>
- **LangChain** - the main open source libraries developers use for building AI applications. These are open source Python/JavaScript/TypeScript libraries.
- **LangGraph** - an open source library for building agentic AI applications. This is a Python/JavaScript/TypeScript library.
  LangChain also offers a hosted cloud platform called 'LangGraph Cloud' or 'LangGraph Platform' which developers can use to host their LangGraph applications in production.
- **LangSmith** - this is LangChain's SaaS product for building AI applications. It offers solutions for evaluating AI systems, observability, datasets and testing.
</business-context>`;

export const TWEET_EXAMPLES = `<example index="1">
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

export const POST_STRUCTURE_INSTRUCTIONS = `<section key="1">
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
</section>`;

export const POST_CONTENT_RULES = `- Focus your post on what the content covers, aims to achieve, and how it uses LangChain's product(s) to do that. This should be concise and high level.
- Do not make the post over technical as some of our audience may not be advanced developers, but ensure it is technical enough to engage developers.
- Keep posts short, concise and engaging
- Limit the use of emojis to the post header, and optionally in the call to action.
- NEVER use hashtags in the post.
- ALWAYS use present tense to make announcements feel immediate (e.g., "Microsoft just launched..." instead of "Microsoft launches...").
- ALWAYS include the link to the content being promoted in the call to action section of the post.`;
