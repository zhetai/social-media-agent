import "dotenv/config";
import { Client } from "@langchain/langgraph-sdk";

async function getInterrupts() {
  const client = new Client({
    apiUrl: process.env.LANGGRAPH_API_URL,
  });

  const newLinksArr = [
    "https://go.es.io/4g0npfi",
    "https://levelup.gitconnected.com/learn-how-to-build-ai-agents-chatbots-with-langgraph-1fe09c4558c6",
    "https://blog.langchain.dev/introducing-prompt-canvas/",
    "https://cckeh.hashnode.dev/building-chatbots-with-memory-capabilities-a-comprehensive-tutorial-with-langchain-langgraph-gemini-ai-and-mongodb",
    "https://www.copilotkit.ai/blog/build-full-stack-apps-with-langgraph-and-copilotkit",
    "https://github.com/samwit/agent_tutorials/tree/main/agent_write",
    "https://github.com/multinear-demo/demo-bank-support-lc-py",
    "https://m.youtube.com/watch?v=hE8C2M8GRLo&amp;feature=youtu.be",
    "https://github.com/Upsonic/gpt-computer-assistant",
    "https://github.com/actualize-ae/voice-chat-pdf",
    "https://github.com/lgesuellip/researcher_agent/tree/main/servers",
  ];

  const { thread_id } = await client.threads.create();
  await client.runs.create(thread_id, "ingest_data", {
    input: {
      links: newLinksArr,
    },
    config: {
      configurable: {
        skipIngest: true,
      },
    },
  });
}

getInterrupts();

// https://go.es.io/4g0npfi - https://smith.langchain.com/o/ebbaf2eb-769b-4505-aca2-d11de10372a4/projects/p/698e2add-c314-4a8c-837f-e11667cb3639?columnVisibilityModel=%7B%22select%22%3Atrue%2C%22id%22%3Atrue%2C%22status%22%3Atrue%2C%22name%22%3Atrue%2C%22inputs%22%3Atrue%2C%22outputs%22%3Atrue%2C%22start_time%22%3Atrue%2C%22latency%22%3Atrue%2C%22in_dataset%22%3Atrue%2C%22last_queued_at%22%3Atrue%2C%22total_tokens%22%3Atrue%2C%22total_cost%22%3Atrue%2C%22first_token_time%22%3Atrue%2C%22tags%22%3Atrue%2C%22metadata%22%3Atrue%2C%22feedback_stats%22%3Atrue%2C%22reference_example_id%22%3Atrue%2C%22actions%22%3Atrue%7D&timeModel=%7B%22duration%22%3A%227d%22%7D&peek=1efd0533-eff5-641b-8c87-9db83743fca2
// https://levelup.gitconnected.com/learn-how-to-build-ai-agents-chatbots-with-langgraph-1fe09c4558c6 - https://smith.langchain.com/o/ebbaf2eb-769b-4505-aca2-d11de10372a4/projects/p/698e2add-c314-4a8c-837f-e11667cb3639?columnVisibilityModel=%7B%22select%22%3Atrue%2C%22id%22%3Atrue%2C%22status%22%3Atrue%2C%22name%22%3Atrue%2C%22inputs%22%3Atrue%2C%22outputs%22%3Atrue%2C%22start_time%22%3Atrue%2C%22latency%22%3Atrue%2C%22in_dataset%22%3Atrue%2C%22last_queued_at%22%3Atrue%2C%22total_tokens%22%3Atrue%2C%22total_cost%22%3Atrue%2C%22first_token_time%22%3Atrue%2C%22tags%22%3Atrue%2C%22metadata%22%3Atrue%2C%22feedback_stats%22%3Atrue%2C%22reference_example_id%22%3Atrue%2C%22actions%22%3Atrue%7D&timeModel=%7B%22duration%22%3A%227d%22%7D&peek=1efd0510-e05b-6375-92ce-40420bff1eea
// https://cckeh.hashnode.dev/building-chatbots-with-memory-capabilities-a-comprehensive-tutorial-with-langchain-langgraph-gemini-ai-and-mongodb - https://smith.langchain.com/o/ebbaf2eb-769b-4505-aca2-d11de10372a4/projects/p/698e2add-c314-4a8c-837f-e11667cb3639?columnVisibilityModel=%7B%22select%22%3Atrue%2C%22id%22%3Atrue%2C%22status%22%3Atrue%2C%22name%22%3Atrue%2C%22inputs%22%3Atrue%2C%22outputs%22%3Atrue%2C%22start_time%22%3Atrue%2C%22latency%22%3Atrue%2C%22in_dataset%22%3Atrue%2C%22last_queued_at%22%3Atrue%2C%22total_tokens%22%3Atrue%2C%22total_cost%22%3Atrue%2C%22first_token_time%22%3Atrue%2C%22tags%22%3Atrue%2C%22metadata%22%3Atrue%2C%22feedback_stats%22%3Atrue%2C%22reference_example_id%22%3Atrue%2C%22actions%22%3Atrue%7D&timeModel=%7B%22duration%22%3A%227d%22%7D&peek=1efd0500-fd70-69f6-8ba1-a9f81355c492
// maybe
// https://www.copilotkit.ai/blog/build-full-stack-apps-with-langgraph-and-copilotkit -https://smith.langchain.com/o/ebbaf2eb-769b-4505-aca2-d11de10372a4/projects/p/698e2add-c314-4a8c-837f-e11667cb3639?columnVisibilityModel=%7B%22select%22%3Atrue%2C%22id%22%3Atrue%2C%22status%22%3Atrue%2C%22name%22%3Atrue%2C%22inputs%22%3Atrue%2C%22outputs%22%3Atrue%2C%22start_time%22%3Atrue%2C%22latency%22%3Atrue%2C%22in_dataset%22%3Atrue%2C%22last_queued_at%22%3Atrue%2C%22total_tokens%22%3Atrue%2C%22total_cost%22%3Atrue%2C%22first_token_time%22%3Atrue%2C%22tags%22%3Atrue%2C%22metadata%22%3Atrue%2C%22feedback_stats%22%3Atrue%2C%22reference_example_id%22%3Atrue%2C%22actions%22%3Atrue%7D&timeModel=%7B%22duration%22%3A%227d%22%7D&peek=1efcf182-f0a4-632e-ba58-fa76d172ec0c
// https://github.com/multinear-demo/demo-bank-support-lc-py - https://smith.langchain.com/o/ebbaf2eb-769b-4505-aca2-d11de10372a4/projects/p/698e2add-c314-4a8c-837f-e11667cb3639?columnVisibilityModel=%7B%22select%22%3Atrue%2C%22id%22%3Atrue%2C%22status%22%3Atrue%2C%22name%22%3Atrue%2C%22inputs%22%3Atrue%2C%22outputs%22%3Atrue%2C%22start_time%22%3Atrue%2C%22latency%22%3Atrue%2C%22in_dataset%22%3Atrue%2C%22last_queued_at%22%3Atrue%2C%22total_tokens%22%3Atrue%2C%22total_cost%22%3Atrue%2C%22first_token_time%22%3Atrue%2C%22tags%22%3Atrue%2C%22metadata%22%3Atrue%2C%22feedback_stats%22%3Atrue%2C%22reference_example_id%22%3Atrue%2C%22actions%22%3Atrue%7D&timeModel=%7B%22duration%22%3A%227d%22%7D&peek=1efcf17b-f41c-670b-87c2-d643a3d85328
// https://m.youtube.com/watch?v=hE8C2M8GRLo&amp;feature=youtu.be -https://smith.langchain.com/o/ebbaf2eb-769b-4505-aca2-d11de10372a4/projects/p/698e2add-c314-4a8c-837f-e11667cb3639?columnVisibilityModel=%7B%22select%22%3Atrue%2C%22id%22%3Atrue%2C%22status%22%3Atrue%2C%22name%22%3Atrue%2C%22inputs%22%3Atrue%2C%22outputs%22%3Atrue%2C%22start_time%22%3Atrue%2C%22latency%22%3Atrue%2C%22in_dataset%22%3Atrue%2C%22last_queued_at%22%3Atrue%2C%22total_tokens%22%3Atrue%2C%22total_cost%22%3Atrue%2C%22first_token_time%22%3Atrue%2C%22tags%22%3Atrue%2C%22metadata%22%3Atrue%2C%22feedback_stats%22%3Atrue%2C%22reference_example_id%22%3Atrue%2C%22actions%22%3Atrue%7D&timeModel=%7B%22duration%22%3A%227d%22%7D&peek=1efcf17a-e641-61cf-a499-81c79b40edbe
// https://github.com/Upsonic/gpt-computer-assistant - https://smith.langchain.com/o/ebbaf2eb-769b-4505-aca2-d11de10372a4/projects/p/698e2add-c314-4a8c-837f-e11667cb3639?columnVisibilityModel=%7B%22select%22%3Atrue%2C%22id%22%3Atrue%2C%22status%22%3Atrue%2C%22name%22%3Atrue%2C%22inputs%22%3Atrue%2C%22outputs%22%3Atrue%2C%22start_time%22%3Atrue%2C%22latency%22%3Atrue%2C%22in_dataset%22%3Atrue%2C%22last_queued_at%22%3Atrue%2C%22total_tokens%22%3Atrue%2C%22total_cost%22%3Atrue%2C%22first_token_time%22%3Atrue%2C%22tags%22%3Atrue%2C%22metadata%22%3Atrue%2C%22feedback_stats%22%3Atrue%2C%22reference_example_id%22%3Atrue%2C%22actions%22%3Atrue%7D&timeModel=%7B%22duration%22%3A%227d%22%7D&peek=1efcf177-6e51-6510-b0c9-98997385137e
// https://github.com/actualize-ae/voice-chat-pdf - https://smith.langchain.com/o/ebbaf2eb-769b-4505-aca2-d11de10372a4/projects/p/698e2add-c314-4a8c-837f-e11667cb3639?columnVisibilityModel=%7B%22select%22%3Atrue%2C%22id%22%3Atrue%2C%22status%22%3Atrue%2C%22name%22%3Atrue%2C%22inputs%22%3Atrue%2C%22outputs%22%3Atrue%2C%22start_time%22%3Atrue%2C%22latency%22%3Atrue%2C%22in_dataset%22%3Atrue%2C%22last_queued_at%22%3Atrue%2C%22total_tokens%22%3Atrue%2C%22total_cost%22%3Atrue%2C%22first_token_time%22%3Atrue%2C%22tags%22%3Atrue%2C%22metadata%22%3Atrue%2C%22feedback_stats%22%3Atrue%2C%22reference_example_id%22%3Atrue%2C%22actions%22%3Atrue%7D&timeModel=%7B%22duration%22%3A%227d%22%7D&peek=1efcf176-7e20-65ff-ab32-70e1a9521b6e
// https://github.com/lgesuellip/researcher_agent/tree/main/servers - https://smith.langchain.com/o/ebbaf2eb-769b-4505-aca2-d11de10372a4/projects/p/698e2add-c314-4a8c-837f-e11667cb3639?columnVisibilityModel=%7B%22select%22%3Atrue%2C%22id%22%3Atrue%2C%22status%22%3Atrue%2C%22name%22%3Atrue%2C%22inputs%22%3Atrue%2C%22outputs%22%3Atrue%2C%22start_time%22%3Atrue%2C%22latency%22%3Atrue%2C%22in_dataset%22%3Atrue%2C%22last_queued_at%22%3Atrue%2C%22total_tokens%22%3Atrue%2C%22total_cost%22%3Atrue%2C%22first_token_time%22%3Atrue%2C%22tags%22%3Atrue%2C%22metadata%22%3Atrue%2C%22feedback_stats%22%3Atrue%2C%22reference_example_id%22%3Atrue%2C%22actions%22%3Atrue%7D&timeModel=%7B%22duration%22%3A%227d%22%7D&peek=1efcf175-025d-6e33-96d0-29df3b6aa9a4
//

// Failed
// https://github.com/samwit/agent_tutorials/tree/main/agent_write - https://smith.langchain.com/o/ebbaf2eb-769b-4505-aca2-d11de10372a4/projects/p/698e2add-c314-4a8c-837f-e11667cb3639?columnVisibilityModel=%7B%22select%22%3Atrue%2C%22id%22%3Atrue%2C%22status%22%3Atrue%2C%22name%22%3Atrue%2C%22inputs%22%3Atrue%2C%22outputs%22%3Atrue%2C%22start_time%22%3Atrue%2C%22latency%22%3Atrue%2C%22in_dataset%22%3Atrue%2C%22last_queued_at%22%3Atrue%2C%22total_tokens%22%3Atrue%2C%22total_cost%22%3Atrue%2C%22first_token_time%22%3Atrue%2C%22tags%22%3Atrue%2C%22metadata%22%3Atrue%2C%22feedback_stats%22%3Atrue%2C%22reference_example_id%22%3Atrue%2C%22actions%22%3Atrue%7D&timeModel=%7B%22duration%22%3A%227d%22%7D&peek=1efcf181-08c9-695f-9ee2-4d0ad761f58e
// https://blog.langchain.dev/introducing-prompt-canvas/ - https://smith.langchain.com/o/ebbaf2eb-769b-4505-aca2-d11de10372a4/projects/p/698e2add-c314-4a8c-837f-e11667cb3639?columnVisibilityModel=%7B%22select%22%3Atrue%2C%22id%22%3Atrue%2C%22status%22%3Atrue%2C%22name%22%3Atrue%2C%22inputs%22%3Atrue%2C%22outputs%22%3Atrue%2C%22start_time%22%3Atrue%2C%22latency%22%3Atrue%2C%22in_dataset%22%3Atrue%2C%22last_queued_at%22%3Atrue%2C%22total_tokens%22%3Atrue%2C%22total_cost%22%3Atrue%2C%22first_token_time%22%3Atrue%2C%22tags%22%3Atrue%2C%22metadata%22%3Atrue%2C%22feedback_stats%22%3Atrue%2C%22reference_example_id%22%3Atrue%2C%22actions%22%3Atrue%7D&timeModel=%7B%22duration%22%3A%227d%22%7D&peek=1efd050b-49ae-632a-bca4-10d246a69efb
