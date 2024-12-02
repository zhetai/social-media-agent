import { nextSaturday, setHours, setMinutes, parse, isValid } from "date-fns";
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
 * Get a date for the next Saturday at the specified hour
 * @param {number} hour - The hour to set for the next Saturday (default: 12)
 * @param {number} minute - The minute to set for the next Saturday (default: 0)
 * @returns {Date} The date for the next Saturday at the specified hour
 */
export function getNextSaturdayDate(hour = 12, minute = 0): Date {
  const saturday = nextSaturday(new Date());
  return setMinutes(setHours(saturday, hour), minute);
}

/**
 * Validates a date string in the format 'MM/dd/yyyy hh:mm a'
 * @param dateString - The date string to validate
 * @returns {boolean} - Whether the date string is valid
 */
export function isValidDateString(dateString: string): boolean {
  try {
    const parsedDate = parse(dateString, "MM/dd/yyyy hh:mm a", new Date());
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
