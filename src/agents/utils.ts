import { nextSaturday, setHours, setMinutes, parse, isValid } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import * as cheerio from "cheerio";

/**
 * Extracts URLs from Slack-style message text containing links in the format:
 * <display_text|https://example.com> or <https://example.com>
 * @param text The message text to extract URLs from
 * @returns Array of URLs found in the text
 */
export function extractUrlsFromSlackText(text: string): string[] {
  const regex = /<(?:([^|>]*)\|)?([^>]+)>/g;
  const matches = [...text.matchAll(regex)];
  return matches.map((match) => match[2]);
}

/**
 * Checks if a string ends with a file extension (e.g., 'file.md', 'doc.txt')
 * @param str The string to check
 * @returns boolean indicating if the string ends with a file extension
 */
export function hasFileExtension(str: string): boolean {
  return /\.[a-zA-Z0-9]+$/.test(str);
}

/**
 * Extracts the tweet ID from a Twitter URL
 * @param url The Twitter URL (can be string or URL object)
 * @returns The tweet ID
 * @throws Error if the tweet ID cannot be extracted
 */
export function extractTweetId(url: string | URL): string | undefined {
  const pathname = url instanceof URL ? url.pathname : new URL(url).pathname;
  const tweetId = pathname.match(/\/status\/(\d+)/)?.[1];
  return tweetId;
}

/**
 * Extracts all URLs from a given string
 * @param text The string to extract URLs from
 * @returns Array of URLs found in the text
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  return text.match(urlRegex) || [];
}

/**
 * Removes all URLs from a given string
 * @param text The string to remove URLs from
 * @returns The input string with all URLs removed
 */
export function removeUrls(text: string): string {
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  return text.replace(urlRegex, "").replace(/\s+/g, " ").trim();
}

/**
 * Get a date for the next Saturday at the specified hour in Pacific Time (PST/PDT)
 * @param {number} hour - The hour to set for the next Saturday in PST/PDT (default: 12)
 * @param {number} minute - The minute to set for the next Saturday in PST/PDT (default: 0)
 * @returns {Date} The date for the next Saturday at the specified hour in PST/PDT
 */
export function getNextSaturdayDate(hour = 12, minute = 0): Date {
  const saturday = nextSaturday(new Date());
  const saturdayWithTime = setMinutes(setHours(saturday, hour), minute);
  return toZonedTime(saturdayWithTime, "America/Los_Angeles");
}

/**
 * Validates a date string in the format 'MM/dd/yyyy hh:mm a z'
 * @param dateString - The date string to validate
 * @returns {boolean} - Whether the date string is valid
 */
export function isValidDateString(dateString: string): boolean {
  try {
    // Remove timezone abbreviation if present
    const dateWithoutTz = dateString.replace(/ [A-Z]{3}$/, "");

    // Parse the date without timezone
    const parsedDate = parse(dateWithoutTz, "MM/dd/yyyy hh:mm a", new Date());
    return isValid(parsedDate);
  } catch (e) {
    console.error("Failed to parse date string:", e);
    return false;
  }
}

/**
 * Fetches and extracts the main text content from a webpage by removing common non-content elements.
 *
 * @param {string} url - The URL of the webpage to fetch and extract text from.
 * @returns {Promise<string | undefined>} The cleaned text content of the webpage, or undefined if an error occurs.
 *
 * @throws {TypeError} When the provided URL is invalid.
 * @throws {Error} When there's a network error during the request.
 *
 * @example
 * ```typescript
 * const text = await getPageText('https://example.com');
 * if (text) {
 *   console.log('Page content:', text);
 * } else {
 *   console.log('Failed to fetch page content');
 * }
 * ```
 */
export async function getPageText(url: string): Promise<string | undefined> {
  try {
    // Validate URL
    new URL(url); // Will throw if URL is invalid

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $("script").remove();
    $("style").remove();
    $("head").remove();
    $("nav").remove();
    $("footer").remove();
    $("header").remove();

    // Get text content and clean it up
    const text = $("body")
      .text()
      .replace(/\s+/g, " ")
      .replace(/\n+/g, " ")
      .trim();

    return text;
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes("HTTP error")) {
        console.error(`Network error: ${error.message}`);
        return undefined;
      } else if (error instanceof TypeError) {
        console.error(`Invalid URL: ${error.message}`);
        return undefined;
      }

      console.error(`Unknown error: ${error.message}`);
      return undefined;
    }

    console.error("Unknown error:", error);
    return undefined;
  }
}

/**
 * Checks if a given string is a valid URL
 *
 * @param {string} str - The string to check
 * @returns {boolean} True if the string is a valid URL, false otherwise
 *
 * @example
 * ```typescript
 * isValidUrl('https://example.com'); // returns true
 * isValidUrl('not-a-url'); // returns false
 * isValidUrl('http://localhost:3000'); // returns true
 * ```
 */
export function isValidUrl(str: string): boolean {
  if (!str || typeof str !== "string") {
    return false;
  }

  try {
    new URL(str);
    return true;
  } catch (error) {
    if (error instanceof TypeError) {
      return false;
    }
    // Re-throw unexpected errors
    throw error;
  }
}

/**
 * Fetches an image from a URL and converts it to a base64 string
 *
 * @param {string} imageUrl - The URL of the image to fetch
 * @returns {Promise<string>} A Promise that resolves to the base64 string of the image
 * @throws {Error} When the URL is invalid or the fetch request fails
 *
 * @example
 * ```typescript
 * const base64String = await imageUrlToBase64('https://example.com/image.jpg');
 * console.log(base64String); // data:image/jpeg;base64,/9j/4AAQSkZJRg...
 * ```
 */
export async function imageUrlToBuffer(imageUrl: string): Promise<{
  buffer: Buffer;
  contentType: string;
}> {
  if (!isValidUrl(imageUrl)) {
    throw new Error("Invalid image URL provided");
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") || "image/jpeg";

  return {
    buffer: imageBuffer,
    contentType,
  };
}

/**
 * Extracts the MIME type from a base64 string.
 *
 * @param {string} base64String - The base64 string to extract MIME type from
 * @returns {string | null} The MIME type if found, null otherwise
 *
 * @throws {Error} When the input string is not a valid base64 string
 *
 * @example
 * ```typescript
 * const mimeType = extractMimeTypeFromBase64('data:image/jpeg;base64,/9j/4AAQSkZJRg...');
 * console.log(mimeType); // 'image/jpeg'
 * ```
 */
export function extractMimeTypeFromBase64(base64String: string): string | null {
  try {
    // Check if the string is empty or not a string
    if (!base64String || typeof base64String !== "string") {
      throw new Error("Invalid input: base64String must be a non-empty string");
    }

    // Check if it's a data URL
    if (base64String.startsWith("data:")) {
      const matches = base64String.match(
        /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/,
      );
      if (matches && matches.length > 1) {
        return matches[1];
      }
    }

    // If it's just a base64 string without data URL prefix, try to detect common file signatures
    const decodedString = Buffer.from(base64String, "base64")
      .toString("hex")
      .toLowerCase();

    // Common file signatures (magic numbers)
    const signatures: { [key: string]: string } = {
      ffd8ff: "image/jpeg",
      "89504e47": "image/png",
      "47494638": "image/gif",
      "25504446": "application/pdf",
      "504b0304": "application/zip",
    };

    for (const [signature, mimeType] of Object.entries(signatures)) {
      if (decodedString.startsWith(signature)) {
        return mimeType;
      }
    }

    return null;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to extract MIME type: ${error.message}`);
    }
    throw new Error("Failed to extract MIME type: Unknown error");
  }
}

/**
 * Processes an image input which can be a URL, base64 string, or "remove" command
 * @param imageInput The image input string (URL, base64, or "remove")
 * @returns Object containing the public image URL and MIME type, or undefined if image should be removed
 */
export async function processImageInput(
  imageInput: string,
): Promise<{ imageUrl: string; mimeType: string } | "remove" | undefined> {
  if (imageInput.toLowerCase() === "remove" || !imageInput) {
    return "remove";
  }

  if (isValidUrl(imageInput)) {
    const { contentType } = await imageUrlToBuffer(imageInput);
    return {
      imageUrl: imageInput,
      mimeType: contentType,
    };
  }

  return undefined;
}

// Regex to match markdown image syntax: ![alt text](url)
const MARKDOWN_IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;

/**
 * Extracts a single image URL from a markdown string
 * @param text The markdown text to search
 * @returns The first matched image URL or null if no match found
 */
export function extractFirstImageUrlFromMarkdown(text: string): string | null {
  const match = MARKDOWN_IMAGE_REGEX.exec(text);
  return match ? match[2] : null;
}

/**
 * Extracts all image URLs from a markdown string
 * @param text The markdown text to search
 * @returns Array of all matched image URLs
 */
export function extractAllImageUrlsFromMarkdown(text: string): string[] {
  const urls: string[] = [];
  let match;

  // Reset regex state
  MARKDOWN_IMAGE_REGEX.lastIndex = 0;

  while ((match = MARKDOWN_IMAGE_REGEX.exec(text)) !== null) {
    urls.push(match[2]);
  }

  return urls;
}

/**
 * The type of a URL. One of "github", "youtube", "general"
 * `undefined` if the URL type could not be determined
 */
export type UrlType =
  | "github"
  | "youtube"
  | "general"
  | "twitter"
  | "reddit"
  | undefined;

export function getUrlType(url: string): UrlType {
  let parsedUrl: URL | undefined = undefined;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    console.error("Failed to parse URL:", e);
    return undefined;
  }

  if (parsedUrl.hostname.includes("github")) {
    return "github";
  }

  if (
    parsedUrl.hostname.includes("youtube") ||
    parsedUrl.hostname.includes("youtu.be")
  ) {
    return "youtube";
  }

  if (
    parsedUrl.hostname.includes("twitter") ||
    parsedUrl.hostname.includes("x.com")
  ) {
    return "twitter";
  }

  if (parsedUrl.hostname.includes("reddit")) {
    return "reddit";
  }

  return "general";
}
