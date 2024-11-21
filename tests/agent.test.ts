import { test, expect } from "@jest/globals";
import { extractUrlsFromSlackText } from "../src/agent/utils.js";

test("Can extract URL from Slack-style message text", () => {
  const singleUrlText = `<https://github.com/karimulla0908/capstone_repo|https://github.com/karimulla0908/capstone_repo>`;
  const urls = extractUrlsFromSlackText(singleUrlText);
  expect(urls).toHaveLength(1);
  expect(urls[0]).toBe("https://github.com/karimulla0908/capstone_repo");
});

test("Can extract multiple URLs from Slack-style message text", () => {
  const multipleUrlsText = `<https://github.com/karimulla0908/capstone_repo|https://github.com/karimulla0908/capstone_repo> And another one is <this youtube video|https://www.youtube.com/watch?v=OyDfr0xIhss>`;
  const urls = extractUrlsFromSlackText(multipleUrlsText);
  expect(urls).toHaveLength(2);
  expect(urls[0]).toBe("https://github.com/karimulla0908/capstone_repo");
  expect(urls[1]).toBe("https://www.youtube.com/watch?v=OyDfr0xIhss");
});
