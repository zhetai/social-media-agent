/**
 * Extracts URLs from Slack-style message text containing links in the format:
 * <display_text|https://example.com>
 * @param text The message text to extract URLs from
 * @returns Array of URLs found in the text
 */
export function extractUrlsFromSlackText(text: string): string[] {
  const regex = /<[^|>]*\|([^>]+)>/g;
  const matches = [...text.matchAll(regex)];
  return matches.map((match) => match[1]);
}
