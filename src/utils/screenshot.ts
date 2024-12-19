import { chromium } from "playwright";

export async function takeScreenshot(url: string): Promise<Buffer> {
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    },
  });

  const page = await context.newPage();

  try {
    // Navigate and wait for the page to be fully loaded
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Wait for dynamic content to be ready
    await page
      .waitForFunction(
        () => {
          // Check if document is ready
          if (document.readyState !== "complete") return false;

          // Check for any loading indicators
          const loadingElements = document.querySelectorAll(
            '[class*="loading"], [id*="loading"]',
          );
          if (loadingElements.length > 0) return false;

          // Check images if they exist
          const images = document.getElementsByTagName("img");
          if (images.length > 0) {
            return Array.from(images).every(
              (img) =>
                img.complete &&
                (img.naturalHeight !== 0 || img.naturalWidth !== 0),
            );
          }

          return true;
        },
        { timeout: 5000 },
      )
      .catch(() => {
        // Continue even if waiting times out
        console.warn(
          "Page might not be fully loaded, proceeding with screenshot",
        );
      });

    const screenshot = await page.screenshot({
      type: "jpeg",
    });

    await context.close();
    await browser.close();
    return Buffer.from(screenshot);
  } catch (error) {
    await context.close();
    await browser.close();
    console.error(`Failed to take screenshot of ${url}:`, error);
    throw error;
  }
}
