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
