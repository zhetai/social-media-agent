import { youtube } from "@googleapis/youtube";
import { GoogleAuth } from "google-auth-library";

/**
 * Extracts the videoId from a YouTube video URL.
 * @param url The URL of the YouTube video.
 * @returns The videoId of the YouTube video.
 */
function getVideoID(url: string): string | undefined {
  try {
    const urlObj = new URL(url);
    const videoId = urlObj.searchParams.get("v");
    if (videoId) {
      return videoId;
    }
  } catch (_) {
    // no-op
  }

  const match = url.match(
    /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/,
  );
  if (match !== null && match[1].length === 11) {
    return match[1];
  } else {
    return undefined;
  }
}

/**
 * Converts ISO 8601 duration to seconds
 * @param duration ISO 8601 duration string (e.g., "PT15M51S")
 * @returns number of seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Get the duration of a video from a YouTube URL.
 * @param videoUrl The URL of the YouTube video
 * @returns The duration of the video in seconds
 */
export async function getYouTubeVideoDuration(
  videoUrl: string,
): Promise<number | undefined> {
  const videoId = getVideoID(videoUrl);
  if (!videoId) {
    console.error(`Invalid YouTube URL: ${videoUrl}`);
    return undefined;
  }
  if (!process.env.GOOGLE_VERTEX_AI_WEB_CREDENTIALS) {
    throw new Error("GOOGLE_VERTEX_AI_WEB_CREDENTIALS is not set");
  }
  const parsedGoogleCredentials = JSON.parse(
    process.env.GOOGLE_VERTEX_AI_WEB_CREDENTIALS,
  );

  const auth = new GoogleAuth({
    credentials: parsedGoogleCredentials,
    scopes: ["https://www.googleapis.com/auth/youtube.readonly"],
  });

  const youtubeClient = youtube({
    version: "v3",
    auth,
  });

  const videoInfo = await youtubeClient.videos.list({
    id: [videoId],
    part: ["contentDetails"], // Add this to get duration info
  });

  if (!videoInfo.data.items?.length || videoInfo.data.items?.length > 1) {
    // TODO: Handle this better
    throw new Error(`Expected 1 item, got ${videoInfo.data.items?.length}`);
  }

  let videoDuration: number | undefined = undefined;
  videoInfo.data.items?.forEach((i) => {
    const duration = i.contentDetails?.duration;
    if (duration) {
      videoDuration = parseDuration(duration);
    }
  });
  return videoDuration;
}
