/**
 * Resolves a shortened Twitter URL to the original URL.
 * This is because Twitter shortens URLs in tweets and makes
 * you follow a redirect to get the original URL.
 * @param shortUrl The shortened Twitter URL
 * @returns The resolved Twitter URL
 */
export async function resolveTwitterUrl(
  shortUrl: string,
): Promise<string | undefined> {
  try {
    const response = await fetch(shortUrl, {
      method: "HEAD",
      redirect: "follow",
    });
    return response.url;
  } catch (error) {
    console.warn(`Failed to resolve Twitter URL ${shortUrl}:`, error);
    return undefined;
  }
}
