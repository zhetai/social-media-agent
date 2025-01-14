import { test, expect } from "@jest/globals";
import { formatRedditData } from "../get-post.js";
import fs from "fs/promises";
import { RedditPostRoot } from "../../types.js";

test("Can fetch and format a post from Reddit thoughts_on_openai_o1", async () => {
  const postData: RedditPostRoot = JSON.parse(
    await fs.readFile(
      "src/agents/verify-reddit-post/nodes/tests/data/thoughts_on_openai_o1.json",
      "utf-8",
    ),
  );
  const result = formatRedditData(postData);
  console.log("Post:", result.post);
  console.log("Replies:", result.replies);
  await fs.writeFile(
    "src/agents/generate-post/nodes/generate-report/tests/data/thoughts_on_openai_o1.txt",
    `Post:\n${result.post}\n\nReplies:\n${result.replies.join("\n")}`,
  );
  expect(result.post).toBeDefined();
  expect(result.replies).toBeDefined();
});

test("Can fetch and format a post from Reddit openai_o1_vs_recent_leetcode_questions", async () => {
  const postData: RedditPostRoot = JSON.parse(
    await fs.readFile(
      "src/agents/verify-reddit-post/nodes/tests/data/openai_o1_vs_recent_leetcode_questions.json",
      "utf-8",
    ),
  );
  const result = formatRedditData(postData);
  console.log("Post:", result.post);
  console.log("Replies:", result.replies);

  await fs.writeFile(
    "src/agents/generate-post/nodes/generate-report/tests/data/openai_o1_vs_recent_leetcode_questions.txt",
    `Post:\n${result.post}\n\nReplies:\n${result.replies.join("\n")}`,
  );
  expect(result.post).toBeDefined();
  expect(result.replies).toBeDefined();
});
