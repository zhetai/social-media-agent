import { ALLOWED_DAYS } from "./subgraphs/generate-post/constants.js";

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
 * Converts a day of the week and time string into a Date object
 * @param day The day of the week (e.g., 'Monday', 'Tuesday', etc.)
 * @param time Time in 12-hour format (e.g., '01:23 PM')
 * @returns Date object representing the next occurrence of that day and time
 * @throws Error if invalid day or time format
 */
export function getDayAndTimeAsDate(day: string, time: string): Date {
  const days = ALLOWED_DAYS.map((day) => day.toLowerCase());
  const targetDay = days.indexOf(day.toLowerCase());

  if (targetDay === -1) {
    throw new Error("Invalid day of week");
  }

  // Parse time components
  const timeMatch = time.match(/^(\d{2}):(\d{2}) (AM|PM)$/i);
  if (!timeMatch) {
    throw new Error('Invalid time format. Expected "HH:MM AM/PM"');
  }

  let [_, hours, minutes, period] = timeMatch;
  let hour = parseInt(hours);

  // Convert to 24-hour format
  if (period.toUpperCase() === "PM" && hour !== 12) {
    hour += 12;
  } else if (period.toUpperCase() === "AM" && hour === 12) {
    hour = 0;
  }

  // Get current date
  const now = new Date();
  const currentDay = now.getDay();

  // Calculate days to add
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }

  // Create target date
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysToAdd);
  targetDate.setHours(hour, parseInt(minutes), 0, 0);

  return targetDate;
}
