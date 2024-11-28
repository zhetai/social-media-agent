import { LangGraphRunnableConfig, interrupt } from "@langchain/langgraph";
import { GraphAnnotation } from "../generate-post-state.js";
import { HumanInterrupt, HumanResponse } from "../../../types.js";

interface ConstructDescriptionArgs {
  report: string;
  relevantLinks: string[];
  numPosts: number;
  slackMessage: string;
}

function constructDescription({
  report,
  relevantLinks,
  numPosts,
  slackMessage,
}: ConstructDescriptionArgs): string {
  const header = `${numPosts} posts have been generated. Posts are separated by '---'.\nTo select a post please edit the 'Post' field by deleting all text except for the desired post.`;
  const reportText = `Here is the report that was generated for the posts:\n${report}`;
  const linksText = `Here are the relevant links used for generating the report & posts:\n- ${relevantLinks.join("\n- ")}`;
  const slackMsgText = `Here is the message that was sent to Slack:\n${slackMessage}`;

  return `${header}\n\n${reportText}\n\n${linksText}\n\n${slackMsgText}`;
}

export async function schedulePost(
  state: typeof GraphAnnotation.State,
  _config: LangGraphRunnableConfig,
): Promise<Partial<typeof GraphAnnotation.State>> {
  if (state.posts.length === 0) {
    throw new Error("No posts found");
  }

  const interruptValue: HumanInterrupt = {
    action_request: {
      action: "Schedule Twitter/LinkedIn posts",
      args: {
        posts: state.posts.join("\n---------\n"),
      },
    },
    config: {
      // Can not accept because the user needs to select one of the posts.
      allow_accept: false,
      allow_edit: true,
      allow_ignore: true,
      // TODO: Support responses
      allow_respond: false,
    },
    description: constructDescription({
      report: state.report,
      relevantLinks: state.relevantLinks,
      numPosts: state.posts.length,
      slackMessage: state.slackMessage.text,
    }),
  };

  const response = interrupt<HumanInterrupt[], HumanResponse>([interruptValue]);

  if (!["edit", "ignore"].includes(response.type)) {
    throw new Error(
      `Unexpected response type: ${response.type}. Must be "edit" or "ignore".`,
    );
  }
  if (response.type === "ignore") {
    return {} as Partial<typeof GraphAnnotation.State>;
  }
  if (!response.args) {
    throw new Error(
      `Unexpected response args: ${response.args}. Must be defined.`,
    );
  }
  if (typeof response.args !== "object") {
    throw new Error(
      `Unexpected response args type: ${typeof response.args}. Must be an object.`,
    );
  }
  const selectedPost: string = Object.values(response.args)?.[0];
  if (!selectedPost) {
    throw new Error(
      `Unexpected response args value: ${selectedPost}. Must be defined.`,
    );
  }

  // TODO: Implement scheduling tweets and LinkedIn posts
  console.log("Scheduling post:", selectedPost);
  return {} as Partial<typeof GraphAnnotation.State>;
}
