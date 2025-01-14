import {
  RedditPostRoot,
  RedditPostChildren,
  FormattedRedditPost,
} from "../types.js";

async function fetchPost(url: string): Promise<RedditPostRoot> {
  // Add .json to the URL if it's not already there
  const jsonUrl = url.endsWith(".json") ? url : `${url}.json`;

  const response = await fetch(jsonUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  });
  const data: RedditPostRoot = await response.json();
  return data;
}

export function formatRedditData(data: RedditPostRoot): FormattedRedditPost {
  // The first element contains the post, the second contains comments
  const postData = data[0].data.children[0].data;
  const commentsData = data[1].data.children;

  // Format the post content
  const post = `${postData.title || ""}\n${postData.selftext || ""}`.trim();

  // Format the replies
  const replies = formatReplies(commentsData);

  return {
    post,
    replies,
  };
}

export async function getRedditPost(url: string): Promise<FormattedRedditPost> {
  try {
    const data = await fetchPost(url);

    return formatRedditData(data);
  } catch (error) {
    console.error("Error fetching Reddit post:", error);
    throw error;
  }
}

function formatReplies(comments: RedditPostChildren[]): string[] {
  const formattedReplies: string[] = [];

  function processComment(
    comment: RedditPostChildren,
    parentString = "",
  ): void {
    const commentData = comment.data;

    // Create the comment string with username and content
    const commentString =
      `${parentString}${commentData.author}: ${commentData.body || ""}`.trim();

    // Add to our results if it's not empty
    if (commentString) {
      formattedReplies.push(commentString);
    }

    // Process replies if they exist
    if (
      commentData.replies &&
      typeof commentData.replies === "object" &&
      commentData.replies.data?.children
    ) {
      commentData.replies.data.children.forEach((reply: any) => {
        if (reply.kind === "t1") {
          // 't1' is the kind for comments
          processComment(reply, `${commentString}\n`);
        }
      });
    }
  }

  // Process each top-level comment
  comments.forEach((comment) => {
    if (comment.kind === "t1") {
      processComment(comment);
    }
  });

  return formattedReplies;
}
