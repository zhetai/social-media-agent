import * as ls from "langsmith/jest";
import { SimpleEvaluator } from "langsmith/jest";
import { findImages } from "../index.js";

const data = {
  links: ["https://github.com/lgesuellip/researcher_agent/tree/main/servers"],
  report:
    "## Content Transformation Tool with Model Context Protocol\n\n### Overview\nA sophisticated web content transformation application that leverages the Model Context Protocol (MCP) to convert any website into query-relevant content. The tool specializes in creating LLM-optimized text files, documentation indexing, and research automation, while offering seamless integration with platforms like X and Slack through Arcade.\n\n### LangChain Implementation\nThe application demonstrates robust integration of LangChain's ecosystem:\n- **LangGraph**: Serves as the primary MCP client, handling the core content transformation logic\n- **LangSmith**: Powers the tracing functionality, enabling comprehensive monitoring and debugging of the transformation pipeline\n\n### Technical Details\nThe solution employs a sophisticated tech stack:\n- Firecrawll technology for intelligent web research, including site mapping and selective scraping\n- Integration with OpenAI's structured outputs for reliable content processing\n- Robust error handling through exponential backoff mechanisms\n- Data validation using Pydantic models\n- Asynchronous processing for improved performance\n- Arcade integration for multi-platform support (X, Slack)\n\nThe architecture prioritizes reliability and efficiency, making it an ideal solution for developers looking to transform web content into LLM-ready formats while maintaining high accuracy and performance standards.",
  pageContents: [
    "An application built on the Model Context Protocol (MCP) that transforms any website into highly relevant content based on your queries. The app seamlessly integrates with platforms like X, Slack, and others through Arcade.\n\n### Perfect For\n- LLM-Ready File Creation: Generate .txt files optimized for use with large language models.\n- Documentation Indexing: Organize and structure documentation effortlessly.\n- Research Automation: Save time by automating repetitive research tasks.\n\n### Tech Stack\n- LangGraph as the MCP Client\n- Firecrawll for web research (site mapping, intelligent selection, and scraping)\n- Arcade for seamless platform integration (X, Slack, etc.)\n- Tracing powered by LangChainAI LangSmith\n- Utilizes OpenAI's structured outputs, async processing, exponential backoff, and Pydantic for reliability\n\n### Architecture Diagram\n\n![Architecture Diagram](app_architecture.png)\n",
  ],
  relevantLinks: [
    "https://github.com/lgesuellip/researcher_agent/tree/main/servers",
  ],
  post: "🔍 Web Content Transformer\n\nTransform websites into LLM-optimized content with this powerful research automation tool. Leveraging LangGraph for content transformation and LangSmith for monitoring, it seamlessly integrates with X and Slack through Arcade.\n\nKey features:\n• Intelligent web research with Firecrawll\n• Real-time monitoring\n• Multi-platform support\n\n🚀 Check it out: https://github.com/lgesuellip/researcher_agent/tree/main/servers",
  scheduleDate: "2025-01-11T04:00:14.852Z",
  imageOptions: [],
};

const myEvaluator: SimpleEvaluator = ({ expected, actual }) => {
  if (expected.imageOptionsLength !== actual.imageOptions?.length) {
    return {
      key: "imageOptionsLength",
      score: 0,
    };
  }

  return {
    key: "imageOptionsLength",
    score: 1,
  };
};

ls.describe("SMA - Find Images", () => {
  ls.test(
    "Should extract and validate images",
    // You can pass an "n" parameter or other LS config here if desired
    {
      inputs: data,
      outputs: { imageOptionsLength: 2 },
    },
    async ({ inputs }) => {
      // Import and run your app, or some part of it here
      const result = await findImages(inputs as any);
      console.log("result!", result);
      const evalResult = ls.expect(result).evaluatedBy(myEvaluator);
      await evalResult.toBe(1);
      return result;
    },
  );
});
