import { extractAllImageUrlsFromMarkdown, isValidUrl } from "../../../utils.js";
import { GeneratePostAnnotation } from "../../generate-post-state.js";
import { takeScreenshotAndUpload } from "./screenshot.js";

export async function findImages(state: typeof GeneratePostAnnotation.State) {
  const { pageContents, links, imageOptions } = state;
  const link = links[0];
  const imageUrls = new Set<string>();

  const screenshotUrl = await takeScreenshotAndUpload(link);
  if (screenshotUrl) {
    imageUrls.add(screenshotUrl);
  }

  if (imageOptions.length) {
    imageOptions.forEach((urlOrPathname) => {
      imageUrls.add(urlOrPathname);
    });
  } else if (pageContents && pageContents.length) {
    const allImageUrls = pageContents.flatMap(extractAllImageUrlsFromMarkdown);
    allImageUrls.forEach((urlOrPathname) => {
      if (isValidUrl(urlOrPathname)) {
        imageUrls.add(urlOrPathname);
      } else {
        const fullUrl = new URL(link);
        fullUrl.pathname = urlOrPathname;
        imageUrls.add(fullUrl.href);
      }
    });
  } else {
    throw new Error("No page content or images found");
  }

  return {
    imageOptions: Array.from(imageUrls),
  };
}
