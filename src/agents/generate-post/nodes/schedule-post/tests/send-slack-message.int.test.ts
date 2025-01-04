import { test } from "@jest/globals";
import { SlackClient } from "../../../../../clients/slack.js";
import { getFutureDate } from "../get-future-date.js";

test("Can send slack msg", async () => {
  const linkedInClient = new SlackClient({
    channelId: process.env.SLACK_CHANNEL_ID,
  });

  await linkedInClient.sendMessage(`Scheduled post for ${getFutureDate(638236823)}.
Run ID: random_run_id
Thread ID: random_thread_id

Post:
\`\`\`
This is a twitter post
\`\`\`

Image:
https://a.slack-edge.com/80588/img/apps/default_new_app_icon.png`);
});
