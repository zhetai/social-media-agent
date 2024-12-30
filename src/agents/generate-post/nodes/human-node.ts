import { END, LangGraphRunnableConfig, interrupt } from "@langchain/langgraph";
import { GeneratePostAnnotation } from "../generate-post-state.js";
import { formatInTimeZone } from "date-fns-tz";
import { HumanInterrupt, HumanResponse } from "../../types.js";
import {
  getNextSaturdayDate,
  isValidDateString,
  processImageInput,
} from "../../utils.js";
import { timezoneToUtc } from "../../../utils/dateUtils.js";

interface ConstructDescriptionArgs {
  report: string;
  relevantLinks: string[];
  post: string;
  imageOptions?: string[];
}

function constructDescription({
  report,
  relevantLinks,
  post,
  imageOptions,
}: ConstructDescriptionArgs): string {
  const linksText = `- ${relevantLinks.join("\n- ")}`;
  const header = `# Schedule post\n\nUsing these URL(s), a post was generated for Twitter/LinkedIn:\n${linksText}\nThe following post was generated \n\n\`\`\`\n${post}\n\`\`\``;
  const imageOptionsText = imageOptions?.length
    ? `## Image Options\n\nThe following image options are available. Select one by copying and pasting the URL into the 'image' field.\n\n${imageOptions.map((url) => `URL: ${url}\nImage: <details><summary>Click to view image</summary>\n\n![](${url})\n</details>\n`).join("\n")}`
    : "";
  const editInstructions = `If the post is edited and submitted, it will be scheduled for Twitter/LinkedIn.`;
  const respondInstructions = `If a response is sent, it will be used to rewrite the post. Please note, the response will be used as the 'user' message in an LLM call to rewrite the post, so ensure your response is properly formatted.`;
  const acceptInstructions = `If 'accept' is selected, the post will be scheduled for Twitter/LinkedIn.`;
  const ignoreInstructions = `If 'ignore' is selected, this post will not be scheduled, and the thread will end.`;
  const scheduleDateInstructions = `The date the post will be scheduled for may be edited, but it must follow the format 'MM/dd/yyyy hh:mm a z'. Example: '12/25/2024 10:00 AM PST'`;
  const imageInstructions = `If you wish to attach an image to the post, please add a public image URL.

You may remove the image by setting the 'image' field to 'remove', or by removing all text from the field
To replace the image, simply add a new public image URL to the field.

MIME types will be automatically extracted from the image.
Supported image types: \`image/jpeg\` | \`image/gif\` | \`image/png\` | \`image/webp\``;
  const instructionsText = `## Instructions\n\nThere are a few different actions which can be taken:\n
- **Edit**: ${editInstructions}
- **Response**: ${respondInstructions}
- **Accept**: ${acceptInstructions}
- **Ignore**: ${ignoreInstructions}

## Additional Instructions

### Schedule Date
${scheduleDateInstructions}

### Image
${imageInstructions}`;
  const reportText = `Here is the report that was generated for the posts:\n${report}`;

  return `${header}\n\n${imageOptionsText}\n\n${instructionsText}\n\n${reportText}`;
}

export async function humanNode(
  state: typeof GeneratePostAnnotation.State,
  _config: LangGraphRunnableConfig,
): Promise<Partial<typeof GeneratePostAnnotation.State>> {
  if (!state.post) {
    throw new Error("No post found");
  }

  const defaultDate = state.scheduleDate || getNextSaturdayDate();
  const defaultDateString = formatInTimeZone(
    defaultDate,
    "America/Los_Angeles",
    "MM/dd/yyyy hh:mm a z",
  );
  const imageURL = state.image?.imageUrl ?? "";
  const interruptValue: HumanInterrupt = {
    action_request: {
      action: "Schedule Twitter/LinkedIn posts",
      args: {
        post: state.post,
        date: defaultDateString,
        image: imageURL,
      },
    },
    config: {
      allow_accept: true,
      allow_edit: true,
      allow_ignore: true,
      allow_respond: true,
    },
    description: constructDescription({
      report: state.report,
      relevantLinks: state.relevantLinks,
      post: state.post,
      imageOptions: state.imageOptions,
    }),
  };

  const response = interrupt<HumanInterrupt[], HumanResponse[]>([
    interruptValue,
  ])[0];

  if (!["edit", "ignore", "accept", "response"].includes(response.type)) {
    throw new Error(
      `Unexpected response type: ${response.type}. Must be "edit", "ignore", "accept", or "response".`,
    );
  }
  if (response.type === "ignore") {
    return {
      next: END,
    };
  }
  if (!response.args) {
    throw new Error(
      `Unexpected response args: ${response.args}. Must be defined.`,
    );
  }

  if (response.type === "response") {
    if (typeof response.args !== "string") {
      throw new Error("Response args must be a string.");
    }

    return {
      userResponse: response.args,
      next: "rewritePost",
    };
  }

  if (typeof response.args !== "object") {
    throw new Error(
      `Unexpected response args type: ${typeof response.args}. Must be an object.`,
    );
  }
  if (!("args" in response.args)) {
    throw new Error(
      `Unexpected response args value: ${response.args}. Must be defined.`,
    );
  }

  const castArgs = response.args.args as unknown as Record<string, string>;

  const responseOrPost = castArgs.post;
  if (!responseOrPost) {
    throw new Error(
      `Unexpected response args value: ${responseOrPost}. Must be defined.\n\nResponse args:\n${JSON.stringify(response.args, null, 2)}`,
    );
  }

  const postDateString = castArgs.date || defaultDateString;
  const isDateValid = isValidDateString(postDateString);
  if (!isDateValid) {
    // TODO: Handle invalid dates better
    throw new Error("Invalid date provided.");
  }
  const postDate = timezoneToUtc(postDateString);
  if (!postDate) {
    // TODO: Handle invalid dates better
    throw new Error("Invalid date provided.");
  }

  const processedImage = await processImageInput(castArgs.image);
  let imageState: { imageUrl: string; mimeType: string } | undefined =
    undefined;
  if (processedImage && processedImage !== "remove") {
    imageState = processedImage;
  } else if (processedImage === "remove") {
    imageState = undefined;
  } else {
    imageState = state.image;
  }

  return {
    next: "schedulePost",
    scheduleDate: postDate,
    image: imageState,
  };
}
