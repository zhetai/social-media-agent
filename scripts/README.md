# Social Media Agent Scripts

## Get Scheduled Runs

First ensure you have all dependencies installed:

```bash
yarn install
```

And your `LANGCHAIN_API_KEY`, `LANGGRAPH_API_URL` environment variables set:

```bash
LANGCHAIN_API_KEY=...
LANGGRAPH_API_URL=...
```

If you want this output to post to Slack, ensure you have the `SLACK_BOT_OAUTH_TOKEN` and `SLACK_CHANNEL_ID` environment variables set:

```bash
SLACK_BOT_OAUTH_TOKEN=...
SLACK_CHANNEL_ID=...
```

If you don't want to post to Slack, the script will print the output to the console.

Then run the script:

```bash
yarn get:scheduled_runs
```
