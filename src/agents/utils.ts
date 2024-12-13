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
 * Parses a date string with timezone (e.g. "12/25/2023 10:30 AM EST") and converts it to a Date object.
 * The date string must be in the format "MM/dd/yyyy hh:mm a ZZZ" where ZZZ is a 3-letter timezone code.
 *
 * @param dateString - The date string to parse (e.g. "12/25/2023 10:30 AM EST")
 * @returns A Date object representing the parsed date and time, or undefined if parsing fails
 */
export function getDateFromTimezoneDateString(
  dateString: string,
): Date | undefined {
  try {
    // extract the timezone from the date string
    const timezone = dateString.match(/ [A-Z]{3}$/)?.[0]?.trim();
    if (!timezone) {
      throw new Error("No timezone found in date string");
    }

    // Parse the date without timezone first
    const withoutTz = dateString.replace(/ [A-Z]{3}$/, "");
    const parsedDate = parse(withoutTz, "MM/dd/yyyy hh:mm a", new Date());

    if (!isValid(parsedDate)) {
      console.error("Invalid date parsed:", parsedDate);
      return undefined;
    }

    // Convert to the specified timezone
    const zonedDate = toZonedTime(
      parsedDate,
      `America/${timezone === "PST" ? "Los_Angeles" : timezone}`,
    );
    return zonedDate;
  } catch (e) {
    console.error("Failed to parse date string:", e);
    return undefined;
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
export async function imageUrlToBase64(imageUrl: string): Promise<string> {
  if (!isValidUrl(imageUrl)) {
    throw new Error("Invalid image URL provided");
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64String = buffer.toString("base64");
  const contentType = response.headers.get("content-type") || "image/jpeg";

  return `data:${contentType};base64,${base64String}`;
}
