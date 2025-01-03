import { ChatVertexAI } from "@langchain/google-vertexai-web";
import { getMimeTypeFromUrl } from "../../../utils.js";

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
2. Does the image align with the tone and style described in the marketing report?
3. Does the image represent any products, services, or concepts mentioned in either the post or the report?
4. Would the image likely resonate with the target audience described in the report?

You will be presented with a list of image options. Your task is to identify which of these images are relevant to the post based on the criteria above.

Provide your response in the following format:
1. <analysis> tag: Briefly explain your thought process for each image, referencing specific elements from the post and report.
2. <relevant_indices> tag: List the indices of the relevant images, starting from 0, separated by commas.


Remember to carefully consider each image in relation to both the post content and the marketing report.
Be thorough in your analysis, but focus on the most important factors that determine relevance.
If an image is borderline, err on the side of inclusion.

Provide your complete response within <answer> tags.
`;

function parseResult(result: string): number[] {
  const match = result.match(/<relevant_indices>(.*?)<\/relevant_indices>/);
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

interface ValidateImagesArgs {
  imageOptions: string[];
  report: string;
  post: string;
}

export async function validateImages({
  imageOptions,
  report,
  post,
}: ValidateImagesArgs): Promise<{
  imageOptions: string[];
}> {
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
      imageOptions: imageOptions,
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
    const imageMessages = imageChunk.flatMap((fileUri, chunkIndex) => {
      const mimeType = getMimeTypeFromUrl(fileUri);
      if (!mimeType) {
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
          fileUri: fileUri,
        },
      ];
    });

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
