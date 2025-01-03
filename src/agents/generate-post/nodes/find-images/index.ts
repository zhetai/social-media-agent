import * as path from "path";
import {
  extractAllImageUrlsFromMarkdown,
  getUrlType,
  isValidUrl,
} from "../../../utils.js";
import { GeneratePostAnnotation } from "../../generate-post-state.js";
import { takeScreenshotAndUpload } from "./screenshot.js";
import { getFileContents } from "../../../../utils/github-repo-contents.js";

export async function findImages(state: typeof GeneratePostAnnotation.State) {
  const { pageContents, imageOptions, relevantLinks } = state;
  const link = relevantLinks[0];
  const imageUrls = new Set<string>();

  const screenshotUrl = await takeScreenshotAndUpload(link);
  if (screenshotUrl) {
    imageUrls.add(screenshotUrl);
  }

  if (imageOptions.length) {
    imageOptions.forEach((urlOrPathname) => {
      imageUrls.add(urlOrPathname);
    });
  }

  if (pageContents && pageContents.length) {
    const allImageUrls = pageContents.flatMap(extractAllImageUrlsFromMarkdown);

    for await (const urlOrPathname of allImageUrls) {
      if (isValidUrl(urlOrPathname)) {
        imageUrls.add(urlOrPathname);
        continue;
      }

      const fullUrl = new URL(link);
      if (getUrlType(link) === "github") {
        const parsedPathname = path.normalize(urlOrPathname);
        const getContents = await getFileContents(link, parsedPathname);
        imageUrls.add(getContents.download_url || fullUrl.href);
      } else {
        fullUrl.pathname = path.join(fullUrl.pathname, urlOrPathname);
        imageUrls.add(fullUrl.href);
      }
    }
  } else {
    throw new Error("No page content or images found");
  }

  return {
    imageOptions: Array.from(imageUrls),
  };
}
