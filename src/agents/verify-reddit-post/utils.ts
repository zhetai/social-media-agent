/**
 * Iterates over all the data returned and returns the main post and the top 10 replies
 * sorted by upvotes.
 *
 * @param content The data returned from the API call
 * @param maxReplies The maximum number of replies to return
 * @returns The main post and the top 10 replies
 */
export function getPostAndReplies(
  content: Record<string, any>[],
  maxReplies: number = 10,
) {
  const postTitle = content[0].data.children[0].data.title;
  const post = content[0].data.children[0].data.selftext;

  const sortedReplies: Record<string, any>[] = content[1].data.children
    .sort(
      (a: Record<string, any>, b: Record<string, any>) =>
        b.data.ups - a.data.ups,
    )
    .slice(0, maxReplies);
  const replies = sortedReplies.map((reply: Record<string, any>) => {
    return {
      author: reply.data.author,
      body: reply.data.body,
    };
  });
  return { postTitle, post, replies };
}
