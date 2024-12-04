import { GraphAnnotation } from "../verify-reddit-post-state.js";
import { getPostAndReplies } from "../utils.js";
import { LangGraphRunnableConfig } from "@langchain/langgraph";

export async function getRedditPostContent(
  state: typeof GraphAnnotation.State,
  _config: LangGraphRunnableConfig,
): Promise<Partial<typeof GraphAnnotation.State>> {
  const url = new URL(state.link);
  const jsonUrl = `${url.origin}${url.pathname.endsWith("/") ? url.pathname.slice(0, -1) : url.pathname}.json`;
  const postContents = await fetch(jsonUrl);
  const post = await postContents.json();
  const postAndReplies = getPostAndReplies(post, 10);

  const postAsString = `<post>**${postAndReplies.postTitle}**\n${postAndReplies.post}</post>`;
  const repliesAsString = `<replies>\n${postAndReplies.replies
    .map(
      (reply, idx) =>
        `<reply index="${idx}">**${reply.author}**\n${reply.body}</reply>`,
    )
    .join("\n")}\n</replies>`;

  return {
    pageContents: [`${postAsString}\n\n${repliesAsString}`],
    relevantLinks: [state.link],
  };
}
