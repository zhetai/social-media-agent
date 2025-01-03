import * as ls from "langsmith/jest";
import { type SimpleEvaluator } from "langsmith/jest";
import { validateImages } from "../agents/generate-post/nodes/find-images/validate-images.js";
import { GeneratePostAnnotation } from "../agents/generate-post/generate-post-state.js";

const REPORT = `News TL;DR: An Intelligent News Processing Agent

The News TL;DR agent is an innovative open-source solution developed by Jason Sheinkopf during a LangChain hackathon. This sophisticated system transforms how users consume news by intelligently processing, analyzing, and summarizing articles across multiple sources. Instead of overwhelming users with content, it delivers concise, meaningful insights by understanding the context and relevance of news articles.


LangChain Implementation

The system is built on LangGraph, which serves as the foundation for orchestrating complex workflows and decision-making processes. LangGraph enables the agent to:



Dynamically adapt its search and analysis strategies

Process multiple articles in parallel

Make intelligent decisions about content relevance

Orchestrate the flow between different components (query processing, news collection, analysis, and summarization)


Technical Deep Dive

The agent implements several sophisticated components:



Query processor for understanding user intent

News collection engine using NewsAPI integration

Content analysis pipeline with web scraping capabilities

Intelligent article selection system

Cross-article summary generation


The entire implementation is available as an open-source tutorial at: https://github.com/NirDiamant/GenAI_Agents/blob/main/all_agents_tutorials/news_tldr_langgraph.ipynb


This project demonstrates how LangGraph can be used to build practical, production-ready AI applications that solve real-world information processing challenges. The system's ability to adapt its approach dynamically and process multiple articles in parallel showcases the power of LangGraph's workflow orchestration capabilities.`;
const POST = `📰 News TL;DR Agent

Meet your intelligent news assistant that analyzes multiple articles simultaneously to deliver concise insights. Built with LangGraph, this open-source agent processes news in parallel, scores content relevance, and generates cross-article summaries.

Learn how to build your own news processing agent 🔍
https://diamantai.substack.com/p/stop-reading-start-understanding`;
const IMAGE_OPTIONS = [
  "https://verdyqfuvvtxtygqekei.supabase.co/storage/v1/object/public/images/screenshot-diamantai.substack.com-1735869048739.jpeg", // 0 - approved
  "https://substackcdn.com/image/fetch/w_96,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F84bf24d0-f0ec-49fc-8e8f-800eec27706d_1280x1280.png", // 1 - not
  "https://substackcdn.com/image/fetch/w_80,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F6cacafa3-9e4a-49d6-afde-2239493e73a3_6960x4640.jpeg", // 2 - not
  "https://substackcdn.com/image/fetch/w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F19c2d967-34c9-472c-92a5-508a5fa46855_360x730.png", // 3 - approved
  "https://substackcdn.com/image/fetch/w_80,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F9fea2024-a403-469d-9c4e-e7bc06882275_640x550.png", // 4 - not
  "https://substackcdn.com/image/fetch/w_80,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fce9d2e8d-2701-4ad1-a761-02d6167a02e7_96x96.png", // 5 - not
  "https://substackcdn.com/image/fetch/w_80,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F8d78d477-471b-43f2-9770-38418f9e64bd_500x500.png", // 6 - not
  "https://substackcdn.com/image/fetch/w_80,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F637a9f66-65c3-40eb-916e-5952936e24d5_490x464.png", // 7 - not
  "https://substackcdn.com/image/fetch/w_80,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fa59ae4c4-030a-45f4-8d0f-42e75c0e12c5_96x96.jpeg", // 8 - not
  "https://substackcdn.com/image/fetch/w_32,h_32,c_fill,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack.com%2Fimg%2Favatars%2Fdefault-light.png", // 9 - not
  "https://substackcdn.com/image/fetch/w_32,h_32,c_fill,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F3f00ef95-0cc4-439b-9c92-f56a34ee59eb_256x256.png", // 10 - not
  "https://substackcdn.com/image/fetch/w_32,h_32,c_fill,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F8d9cbdb7-eb66-40c2-8c60-2ba9b461f69c_1170x1170.png", // 11 - not
  "https://substackcdn.com/image/fetch/w_320,h_213,c_fill,f_auto,q_auto:good,fl_progressive:steep,g_auto/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F7731cfa7-fc73-473b-bb49-fabac7432086_1792x1024.png", // 12 - maybe
  "https://substackcdn.com/image/fetch/w_320,h_213,c_fill,f_auto,q_auto:good,fl_progressive:steep,g_auto/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F916fbcb0-447f-42b6-8635-71e71e6280b5_1024x1024.png", // 13 - maybe
  "https://substackcdn.com/image/fetch/w_320,h_213,c_fill,f_auto,q_auto:good,fl_progressive:steep,g_auto/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Feefc7325-a910-410d-9fb2-04bf0d38fe2e_1024x1024.png", // 4 - maybe
];

const EXPECTED_IMAGE_OPTIONS = [
  "https://verdyqfuvvtxtygqekei.supabase.co/storage/v1/object/public/images/screenshot-diamantai.substack.com-1735869048739.jpeg", // 0 - approved
  "https://substackcdn.com/image/fetch/w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F19c2d967-34c9-472c-92a5-508a5fa46855_360x730.png", // 3 - approved
];

const myEvaluator: SimpleEvaluator = ({ expected, actual }) => {
  const expectedImageOptions = expected.imageOptions as string[];
  const actualImageOptions = actual.imageOptions as string[];
  let numCorrect = 0;
  for (const expectedUrl of expectedImageOptions) {
    if (actualImageOptions.find((actualUrl) => actualUrl === expectedUrl)) {
      numCorrect += 1;
    }
  }
  const score = numCorrect / expectedImageOptions.length;

  return {
    key: "correct_images",
    score,
  };
};

ls.describe("SMA - Validate Images", () => {
  ls.test(
    "Should validate images",
    // You can pass an "n" parameter or other LS config here if desired
    {
      inputs: { report: REPORT, post: POST, imageOptions: IMAGE_OPTIONS },
      outputs: { imageOptions: EXPECTED_IMAGE_OPTIONS },
    },
    async ({ inputs }) => {
      // Import and run your app, or some part of it here
      const result = await validateImages(
        inputs as typeof GeneratePostAnnotation.State,
      );
      const evalResult = ls.expect(result).evaluatedBy(myEvaluator);
      // Ensure the result is greater than 0.8 and less than or equal to 1
      await evalResult.toBeGreaterThanOrEqual(0.8);
      await evalResult.toBeLessThanOrEqual(1);
      return result;
    },
  );
});
