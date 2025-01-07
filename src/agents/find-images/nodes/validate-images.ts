import { ChatVertexAI } from "@langchain/google-vertexai-web";
import { FindImagesAnnotation } from "../find-images-graph.js";
import {
  removeQueryParams,
  getMimeTypeFromUrl,
  imageUrlToBuffer,
  BLACKLISTED_MIME_TYPES,
} from "../../utils.js";

const VALIDATE_IMAGES_PROMPT = `You are an advanced AI assistant tasked with validating image options for a social media post.
Your goal is to identify which images from a given set are relevant to the post, based on the content of the post and an associated marketing report.

First, carefully read and analyze the following social media post:

<post>
{POST}
</post>

Now, review the marketing report that was used to generate this post:

<report>
{REPORT}
</report>

To determine which images are relevant, consider the following criteria:
1. Does the image directly illustrate a key point or theme from the post?
2. Does the image represent any products, services, or concepts mentioned in either the post or the report?

You should NEVER include images which are:
- Logos, icons, or profile pictures (unless it is a LangChain/LangGraph/LangSmith logo).
- Personal, or non-essential images from a business perspective.
- Small, low-resolution images. These are likely accidentally included in the post and should be excluded.

You will be presented with a list of image options. Your task is to identify which of these images are relevant to the post based on the criteria above.

Provide your response in the following format:
1. <analysis> tag: Briefly explain your thought process for each image, referencing specific elements from the post and report.
2. <relevant_indices> tag: List the indices of the relevant images, starting from 0, separated by commas.

Ensure you ALWAYS WRAP your analysis and relevant indices inside the <analysis> and <relevant_indices> tags, respectively. Do not only prefix, but ensure they are wrapped completely.

Remember to carefully consider each image in relation to both the post content and the marketing report.
Be thorough in your analysis, but focus on the most important factors that determine relevance.
If an image is borderline, err on the side of inclusion.

Provide your complete response within <answer> tags.
`;

export function parseResult(result: string): number[] {
  const match = result.match(
    /<relevant_indices>\s*([\d,\s]*?)\s*<\/relevant_indices>/s,
  );
  if (!match) return [];

  return match[1]
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map(Number)
    .filter((n) => !isNaN(n));
}

function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}

export async function validateImages(
  state: typeof FindImagesAnnotation.State,
): Promise<{
  imageOptions: string[];
}> {
  const { imageOptions, report, post } = state;

  const model = new ChatVertexAI({
    model: "gemini-2.0-flash-exp",
    temperature: 0,
  });

  let imagesWithoutSupabase = imageOptions;
  if (process.env.SUPABASE_URL) {
    // Do not include the supabase screenshot in the image list to validate.
    imagesWithoutSupabase = imageOptions.filter(
      (fileUri) => !fileUri.startsWith(process.env.SUPABASE_URL as string),
    );
  }

  if (imagesWithoutSupabase.length === 0) {
    return {
      imageOptions,
    };
  }

  // Split images into chunks of 10
  const imageChunks = chunk(imagesWithoutSupabase, 10);
  let allIrrelevantIndices: number[] = [];
  let baseIndex = 0;

  const formattedSystemPrompt = VALIDATE_IMAGES_PROMPT.replace(
    "{POST}",
    post,
  ).replace("{REPORT}", report);

  // Process each chunk
  for (const imageChunk of imageChunks) {
    const imageMessagesPromises = imageChunk.flatMap(
      async (fileUri, chunkIndex) => {
        const cleanedFileUri = removeQueryParams(fileUri);
        let mimeType = getMimeTypeFromUrl(fileUri);

        if (!mimeType) {
          try {
            const { contentType } = await imageUrlToBuffer(fileUri);
            if (!contentType) {
              throw new Error("Failed to fetch content type");
            }
            mimeType = contentType;
          } catch (e) {
            console.warn(
              "No mime type found, and failed to fetch content type:",
              e,
            );
          }
        }
        if (
          !mimeType ||
          BLACKLISTED_MIME_TYPES.find((mt) => mimeType.startsWith(mt))
        ) {
          return [];
        }

        return [
          {
            type: "text",
            text: `The below image is index ${baseIndex + chunkIndex}`,
          },
          {
            type: "media",
            mimeType,
            fileUri: cleanedFileUri,
          },
        ];
      },
    );
    const imageMessages = (await Promise.all(imageMessagesPromises)).flat();

    if (!imageMessages.length) {
      continue;
    }
    const response = await model.invoke([
      {
        role: "system",
        content: formattedSystemPrompt,
      },
      {
        role: "user",
        content: imageMessages,
      },
    ]);

    const chunkAnalysis = parseResult(response.content as string);
    // Convert chunk indices to global indices and add to our list of relevant indices
    const globalIndices = chunkAnalysis.map((index) => index + baseIndex);
    allIrrelevantIndices = [...allIrrelevantIndices, ...globalIndices];

    baseIndex += imageChunk.length;
  }

  const supabaseUrl = imageOptions.find((fileUri) =>
    fileUri.startsWith(process.env.SUPABASE_URL as string),
  );

  // Keep only the relevant images (those whose indices are in allIrrelevantIndices)
  return {
    imageOptions: [
      ...(supabaseUrl ? [supabaseUrl] : []),
      ...imagesWithoutSupabase.filter((_, index) =>
        allIrrelevantIndices.includes(index),
      ),
    ],
  };
}
