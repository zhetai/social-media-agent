import * as path from "path";
import {
  extractAllImageUrlsFromMarkdown,
  filterUnwantedImageUrls,
  getUrlType,
  isValidUrl,
} from "../../../utils.js";
import { GeneratePostAnnotation } from "../../generate-post-state.js";
import { takeScreenshotAndUpload } from "./screenshot.js";
import { getFileContents } from "../../../../utils/github-repo-contents.js";
import { validateImages } from "./validate-images.js";

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
    const allImageUrls = filterUnwantedImageUrls(
      pageContents.flatMap(extractAllImageUrlsFromMarkdown),
    );
    for await (const urlOrPathname of allImageUrls) {
      if (isValidUrl(urlOrPathname)) {
        if (getUrlType(urlOrPathname) !== "github") {
          imageUrls.add(urlOrPathname);
        } else {
          // If a full github URL. extract the file name from the path. to do this, extract the path after `blob/<branch>`
          const filePath = urlOrPathname.match(/blob\/[^/]+\/(.+)/)?.[1];
          if (!filePath) {
            console.warn("Could not extract file path from URL", urlOrPathname);
            continue;
          }

          const getContents = await getFileContents(urlOrPathname, filePath);
          if (getContents.download_url) {
            imageUrls.add(getContents.download_url);
          }
        }

        continue;
      }

      // We have to assume the path is from the relevant link.
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

  const validatedImages = await validateImages({
    imageOptions: Array.from(imageUrls),
    report: state.report,
    post: state.post,
  });

  return {
    imageOptions: validatedImages.imageOptions,
  };
}
