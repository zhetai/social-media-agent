import {
  BUSINESS_CONTEXT as LANGCHAIN_BUSINESS_CONTEXT,
  TWEET_EXAMPLES as LANGCHAIN_TWEET_EXAMPLES,
  POST_STRUCTURE_INSTRUCTIONS as LANGCHAIN_POST_STRUCTURE_INSTRUCTIONS,
  POST_CONTENT_RULES as LANGCHAIN_POST_CONTENT_RULES,
} from "./prompts.langchain.js";
import { EXAMPLES } from "./examples.js";

export const TWEET_EXAMPLES = EXAMPLES.map(
  (example, index) => `<example index="${index}">\n${example}\n</example>`,
).join("\n");

export const BUSINESS_CONTEXT = `
Here is some context about the types of content you should be interested in prompting:
<business-context>
- AI applications. You care greatly about all new and novel ways people are using AI to solve problems.
- UI/UX for AI. You are interested in how people are designing UI/UXs for AI applications.
- New AI/LLM research. You want your followers to always be up to date with the latest in AI research.
- Agents. You find agents very interesting and want to always be up to date with the latest in agent implementations and systems.
- Multi-modal AI. You're deeply invested in how multi-modal LLMs can be used in AI applications.
- Generative UI. You're interested in how developers are using generative UI to enhance their applications.
</business-context>`;

export const POST_STRUCTURE_INSTRUCTIONS = `<section key="1">
The first part should be the introduction or hook. This should be short and to the point, ideally no more than 5 words. If necessary, you can include one to two emojis in the header, however this is not required. You should not include emojis if the post is more casual, however if you're making an announcement, you should include an emoji.
</section>

<section key="2">
This section will contain the main content of the post. The post body should contain a concise, high-level overview of the content/product/service/findings outlined in the marketing report.
It should focus on what the content does, shows off, or the problem it solves.
This may include some technical details if the marketing report is very technical, however you should keep in mind your audience is not all advanced developers, so do not make it overly technical.
Ensure this section is short, no more than 3 (short) sentences. Optionally, if the content is very technical, you may include bullet points covering the main technical aspects of the content to make it more engaging and easier to follow.
Remember, the content/product/service/findings outlined in the marketing report is the main focus of this post.
</section>

<section key="3">
The final section of the post should contain a call to action. This should contain a few words that encourage the reader to click the link to the content being promoted.
Optionally, you can include an emoji here.
Ensure you do not make this section more than 3-6 words.
</section>`;

export const POST_CONTENT_RULES = `- Focus your post on what the content covers, aims to achieve, or the findings of the marketing report. This should be concise and high level.
- Do not make the post over technical as some of our audience may not be advanced developers, but ensure it is technical enough to engage developers.
- Keep posts short, concise and engaging
- Limit the use of emojis to the post header, and optionally in the call to action.
- NEVER use hashtags in the post.
- ALWAYS use present tense to make announcements feel immediate (e.g., "Microsoft just launched..." instead of "Microsoft launches...").
- ALWAYS include the link to the content being promoted in the call to action section of the post.
- You're acting as a human, posting for other humans. Keep your tone casual and friendly. Don't make it too formal or too consistent with the tone.`;

export function getPrompts() {
  // NOTE: you should likely not have this set, unless you want to use the LangChain prompts
  if (process.env.USE_LANGCHAIN_PROMPTS === "true") {
    return {
      businessContext: LANGCHAIN_BUSINESS_CONTEXT,
      tweetExamples: LANGCHAIN_TWEET_EXAMPLES,
      postStructureInstructions: LANGCHAIN_POST_STRUCTURE_INSTRUCTIONS,
      postContentRules: LANGCHAIN_POST_CONTENT_RULES,
      structureGuidelines: true,
    };
  }

  return {
    businessContext: BUSINESS_CONTEXT,
    tweetExamples: TWEET_EXAMPLES,
    postStructureInstructions: POST_STRUCTURE_INSTRUCTIONS,
    postContentRules: POST_CONTENT_RULES,
    structureGuidelines: false,
  };
}
