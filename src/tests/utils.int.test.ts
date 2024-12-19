import * as path from "path";
import * as fs from "fs/promises";
import { describe, it, expect } from "@jest/globals";
import {
  getFileContents,
  getRepoContents,
} from "../utils/github-repo-contents.js";
import { takeScreenshot } from "../utils/screenshot.js";
import { takeScreenshotAndUpload } from "../agents/generate-post/nodes/findImages/screenshot.js";

describe("GitHub utils", () => {
  it("Can fetch the files and folders of a public GitHub repo", async () => {
    const repoUrl = "https://github.com/langchain-ai/open-canvas";
    const contents = await getRepoContents(repoUrl);
    console.log(contents);
    expect(contents.length).toBeGreaterThan(1);
  });

  it("Can get the contents of a file from a public GitHub repo", async () => {
    const repoUrl = "https://github.com/langchain-ai/open-canvas";
    const contents = await getRepoContents(repoUrl);
    const packageJson = contents.find(
      (content) => content.name === "package.json" && content.type === "file",
    );
    expect(packageJson).toBeDefined();
    if (!packageJson) return;

    const packageJsonContents = await getFileContents(
      repoUrl,
      packageJson.path,
    );
    expect(packageJsonContents.content).toBeDefined();
    expect(packageJsonContents.content.length).toBeGreaterThan(10);
    expect(packageJsonContents.type).toBe("file");
  });
});

describe("Screenshot utils", () => {
  const writeScreenshotToFile = async (
    screenshotBuffer: Buffer,
    screenshotFileName: string,
  ) => {
    const rootDir = "./src/tests/data/screenshots/";
    // Create the directory if it doesn't exist
    await fs.mkdir(rootDir, { recursive: true });
    const screenshotPath = path.join(rootDir, screenshotFileName);
    await fs.writeFile(screenshotPath, screenshotBuffer);
    console.log(`Screenshot saved to ${screenshotPath}`);
  };

  const generalUrl =
    "https://cckeh.hashnode.dev/building-chatbots-with-memory-capabilities-a-comprehensive-tutorial-with-langchain-langgraph-gemini-ai-and-mongodb";
  const repoUrl = "https://github.com/langchain-ai/open-canvas";

  it("Can take a screenshot of a GitHub repo", async () => {
    const screenshotBuffer = await takeScreenshot(repoUrl);
    expect(screenshotBuffer).toBeDefined();
    // write screenshot to file
    await writeScreenshotToFile(screenshotBuffer, "github-screenshot.png");
  });

  it("Can take a screenshot of a general URL", async () => {
    const screenshotBuffer = await takeScreenshot(generalUrl);
    expect(screenshotBuffer).toBeDefined();
    // write screenshot to file
    await writeScreenshotToFile(screenshotBuffer, "general-screenshot.png");
  });

  it("Can take a screenshot of a GitHub repo and upload it to Supabase", async () => {
    const screenshotUrl = await takeScreenshotAndUpload(repoUrl);
    console.log("screenshotUrl", screenshotUrl);
    expect(screenshotUrl).toBeDefined();
    if (!screenshotUrl) return;

    const parsedUrl = new URL(screenshotUrl);
    expect(parsedUrl).toBeDefined();
  });

  it("Can take a screenshot of a general URL and upload it to Supabase", async () => {
    const screenshotUrl = await takeScreenshotAndUpload(generalUrl);
    console.log("screenshotUrl", screenshotUrl);
    expect(screenshotUrl).toBeDefined();
    if (!screenshotUrl) return;

    const parsedUrl = new URL(screenshotUrl);
    expect(parsedUrl).toBeDefined();
  });
});
