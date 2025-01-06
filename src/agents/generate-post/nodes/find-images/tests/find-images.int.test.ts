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

  ls.test(
    "Should extract and validate images from khoj-ai/khoj repo",
    // You can pass an "n" parameter or other LS config here if desired
    {
      inputs: {
        post: `🧠🤖 Khoj: Your AI Second Brain\n\nA personal AI that creates custom agents with tunable personalities, scaling from local to enterprise use. Khoj uses LangChain to power intelligent conversations across your documents, supporting multiple LLMs and platforms.\n\nDiscover your new AI companion 🚀\nhttps://github.com/khoj-ai/khoj`,
        links: ["https://github.com/khoj-ai/khoj"],
        relevantLinks: ["https://github.com/khoj-ai/khoj"],
        report:
          '## Part 1: Introduction and Summary\nKhoj is an innovative open-source personal AI application that functions as a "second brain," designed to extend human capabilities through AI-powered features. The platform uniquely scales from an on-device personal AI to a cloud-scale enterprise solution, offering users flexibility in deployment. Key features include chatting with various LLMs (local or online), comprehensive document search capabilities, and multi-platform accessibility through browsers, Obsidian, Emacs, Desktop, Phone, or WhatsApp.\n\n## Part 2: LangChain Implementation\nKhoj leverages LangChain\'s capabilities to power its custom agent creation system. Users can create specialized agents with:\n- Tunable personalities and behaviors\n- Custom knowledge bases\n- Specific tool sets\n- Configurable chat models\n\nThe integration of LangChain enables Khoj to provide advanced features like semantic search, research automation, and personalized information processing, making it a powerful tool for both personal and enterprise use.\n\n## Part 3: Technical Details and Additional Information\nKhoj offers extensive technical capabilities:\n- Support for multiple LLM models including llama3, qwen, gemma, mistral, gpt, claude, and gemini\n- Advanced document processing supporting various formats (PDF, markdown, org-mode, word, notion files)\n- Image generation and audio processing capabilities\n- Research automation with newsletter generation and smart notifications\n- Recently added experimental research mode (activated with `/research` command)\n- Demonstrated excellent performance on modern retrieval and reasoning benchmarks\n- Available as both self-hosted solution and cloud platform (app.khoj.dev)\n- Comprehensive documentation available at docs.khoj.dev\n- Active development with strong community support on Discord\n\nFor detailed setup instructions and documentation, users can visit [docs.khoj.dev](https://docs.khoj.dev). The platform can be accessed via their cloud service at [app.khoj.dev](https://app.khoj.dev) or self-hosted following their setup guide.',
        pageContents: [
          '<p align="center"><img src="https://assets.khoj.dev/khoj-logo-sideways-1200x540.png" width="230" alt="Khoj Logo"></p>\n\n<div align="center">\n\n[![test](https://github.com/khoj-ai/khoj/actions/workflows/test.yml/badge.svg)](https://github.com/khoj-ai/khoj/actions/workflows/test.yml)\n[![docker](https://github.com/khoj-ai/khoj/actions/workflows/dockerize.yml/badge.svg)](https://github.com/khoj-ai/khoj/pkgs/container/khoj)\n[![pypi](https://github.com/khoj-ai/khoj/actions/workflows/pypi.yml/badge.svg)](https://pypi.org/project/khoj/)\n[![discord](https://img.shields.io/discord/1112065956647284756?style=plastic&label=discord)](https://discord.gg/BDgyabRM6e)\n\n</div>\n\n<div align="center">\n<b>Your AI second brain</b>\n</div>\n\n<br />\n\n<div align="center">\n\n[📑 Docs](https://docs.khoj.dev)\n<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>\n[🌐 Web](https://khoj.dev)\n<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>\n[🔥 App](https://app.khoj.dev)\n<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>\n[💬 Discord](https://discord.gg/BDgyabRM6e)\n<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>\n[✍🏽 Blog](https://blog.khoj.dev)\n\n</div>\n\n***\n\n### 🎁 New\n* Start any message with `/research` to try out the experimental research mode with Khoj.\n* Anyone can now [create custom agents](https://blog.khoj.dev/posts/create-agents-on-khoj/) with tunable personality, tools and knowledge bases.\n* [Read](https://blog.khoj.dev/posts/evaluate-khoj-quality/) about Khoj\'s excellent performance on modern retrieval and reasoning benchmarks.\n\n***\n\n## Overview\n\n[Khoj](https://khoj.dev) is a personal AI app to extend your capabilities. It smoothly scales up from an on-device personal AI to a cloud-scale enterprise AI.\n\n- Chat with any local or online LLM (e.g llama3, qwen, gemma, mistral, gpt, claude, gemini).\n- Get answers from the internet and your docs (including image, pdf, markdown, org-mode, word, notion files).\n- Access it from your Browser, Obsidian, Emacs, Desktop, Phone or Whatsapp.\n- Create agents with custom knowledge, persona, chat model and tools to take on any role.\n- Automate away repetitive research. Get personal newsletters and smart notifications delivered to your inbox.\n- Find relevant docs quickly and easily using our advanced semantic search.\n- Generate images, talk out loud, play your messages.\n- Khoj is open-source, self-hostable. Always.\n- Run it privately on [your computer](https://docs.khoj.dev/get-started/setup) or try it on our [cloud app](https://app.khoj.dev).\n\n***\n\n## See it in action\n\n![demo_chat](https://github.com/khoj-ai/khoj/blob/master/documentation/assets/img/quadratic_equation_khoj_web.gif?raw=true)\n\nGo to https://app.khoj.dev to see Khoj live.\n\n## Full feature list\nYou can see the full feature list [here](https://docs.khoj.dev/category/features).\n\n## Self-Host\n\nTo get started with self-hosting Khoj, [read the docs](https://docs.khoj.dev/get-started/setup).\n\n## Contributors\nCheers to our awesome contributors! 🎉\n\n<a href="https://github.com/khoj-ai/khoj/graphs/contributors">\n  <img src="https://contrib.rocks/image?repo=khoj-ai/khoj" />\n</a>\n\nMade with [contrib.rocks](https://contrib.rocks).\n\n### Interested in Contributing?\n\nWe are always looking for contributors to help us build new features, improve the project documentation, or fix bugs. If you\'re interested, please see our [Contributing Guidelines](https://docs.khoj.dev/contributing/development) and check out our [Contributors Project Board](https://github.com/orgs/khoj-ai/projects/4).\n',
        ],
        imageOptions: [],
      },
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
