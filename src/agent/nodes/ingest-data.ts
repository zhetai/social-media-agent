import { GraphAnnotation } from "../state.js";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { SlackMessageFetcher } from "../../clients/slack.js";
import { extractUrlsFromSlackText } from "../utils.js";

const getChannelIdFromConfig = async (
  config: LangGraphRunnableConfig,
): Promise<string | undefined> => {
  if (config.configurable?.slack.channelName) {
    const client = new SlackMessageFetcher({
      channelName: config.configurable.slack.channelName,
    });
    return await client.getChannelId();
  }
  return config.configurable?.slack.channelId;
};

export async function ingestData(
  _state: typeof GraphAnnotation.State,
  config: LangGraphRunnableConfig,
): Promise<Partial<typeof GraphAnnotation.State>> {
  const channelId = await getChannelIdFromConfig(config);
  if (!channelId) {
    throw new Error("Channel ID not found");
  }

  const client = new SlackMessageFetcher({
    channelId: channelId,
  });

  const recentMessages = await client.fetchLast24HoursMessages();
  const messagesWithUrls = recentMessages.flatMap((msg) => {
    const links = extractUrlsFromSlackText(msg.text);
    if (!links.length) {
      return [];
    }
    return {
      ...msg,
      links,
    };
  });

  return {
    slackMessages: messagesWithUrls,
  };
}
