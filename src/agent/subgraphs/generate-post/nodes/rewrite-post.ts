import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { GraphAnnotation } from "../generate-post-state.js";
import { ChatAnthropic } from "@langchain/anthropic";

const REWRITE_POST_PROMPT = `You're a highly regarded marketing employee at LangChain, working on crafting thoughtful and engaging content for LangChain's LinkedIn and Twitter pages.
You wrote a post for the LangChain LinkedIn and Twitter pages, however your boss has asked for some changes to be made before it can be published.

The original post you wrote is as follows:
<original-post>
{originalPost}
</original-post>

Listen to your boss closely, and make the necessary changes to the post. You should respond ONLY with the updated post, with no additional information, or text before or after the post.`;

export async function rewritePost(
  state: typeof GraphAnnotation.State,
  _config: LangGraphRunnableConfig,
): Promise<Partial<typeof GraphAnnotation.State>> {
  if (!state.post) {
    throw new Error("No post found");
  }
  if (!state.userResponse) {
    throw new Error("No user response found");
  }

  const rewritePostModel = new ChatAnthropic({
    model: "claude-3-5-sonnet-20241022",
    temperature: 0.5,
  });

  const systemPrompt = REWRITE_POST_PROMPT.replace(
    "{originalPost}",
    state.post,
  );

  const revisePostResponse = await rewritePostModel.invoke([
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: state.userResponse,
    },
  ]);

  return {
    post: revisePostResponse.content as string,
    shouldRewritePost: false,
  };
}
