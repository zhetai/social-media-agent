# Social Media Agent

This repository contains an 'agent' which can take in a URL, and generate a Twitter & LinkedIn post based on the content of the URL. It uses a human-in-the-loop (HITL) flow to handle authentication with different social media platforms, and to allow the user to make changes, or accept/reject the generated post.

![Screenshot of the social media agent graph](./static/graph_screenshot.png)

## Setup

> [!NOTE]
> 🎥 For a visual guide, check out our [step-by-step video tutorial](ADD_URL_HERE) that walks you through the account setup process and project configuration.

### Prerequisites

To use this project, you'll need to have the following accounts/API keys:

- [Anthropic API](https://console.anthropic.com/) - General LLM
- [Google Vertex AI](https://cloud.google.com/vertex-ai) - For dealing with YouTube video content
- [LangGraph CLI](https://langchain-ai.github.io/langgraph/cloud/reference/cli/) - Running the LangGraph server locally
- [FireCrawl API](https://www.firecrawl.dev/) - Web scraping
- [Arcade](https://www.arcade-ai.com/) - Social media authentication
- [Twitter Developer Account](https://developer.twitter.com/en/portal/dashboard) - For uploading media to Twitter
- [LinkedIn Developer Account](https://developer.linkedin.com/) - Posting to LinkedIn
- [GitHub API](https://github.com/settings/personal-access-tokens) - Reading GitHub content
- [Supabase](https://supabase.com/) - Storing images
- [Slack Developer Account](https://api.slack.com/apps) (optional) - ingesting data from a Slack channel

### Setup Instructions

#### Clone the repository:

```bash
git clone https://github.com/langchain-ai/social-media-agent.git
```

```bash
cd social-media-agent
```

#### Install dependencies:

```bash
yarn install
```

#### Set environment variables.

Copy the values of `.env.example` to `.env`, then update the values as needed.

```bash
cp .env.example .env
```

#### Setup Arcade authentication for Twitter:

- [Twitter Arcade auth docs](https://docs.arcade-ai.com/integrations/auth/x)

Once done, ensure you've added the following environment variables to your `.env` file:

- `ARCADE_API_KEY`
- `TWITTER_API_KEY`
- `TWITTER_API_KEY_SECRET`

Arcade does not yet support Twitter (X) API v1, which is required for uploading media to Twitter. To configure the Twitter API v1, you'll need to follow a few extra steps:

1. Create an app in the Twitter Developer Portal, or use the default app (you should already have one after setting up Arcade above).
2. Enter app settings, and find the `User authentication settings` section. Start this setup.
3. Set `App permissions` to `Read and write`. Set `Type of app` to `Web app`. Set the `Callback URI / Redirect URL` to `http://localhost:3000/callback`. Save.
4. Navigate to the `Keys and tokens` tab in the app settings, and copy the `API key` and `API key secret`. Set these values as `TWITTER_API_KEY` and `TWITTER_API_KEY_SECRET` in your `.env` file (skip if already set when setting up Arcade above).
5. Run the `yarn start:auth` command to run the Twitter OAuth server. Open [http://localhost:3000](http://localhost:3000) in your browser, and click `Login with Twitter`.
6. After logging in, copy the user token, and user token secret that was logged to the terminal. Set these values as `TWITTER_USER_TOKEN` and `TWITTER_USER_TOKEN_SECRET` in your `.env` file.

#### Setup LinkedIn authentication:

To authorize posting on LinkedIn, you'll need to:

1. Create a new LinkedIn developer account, and app [here](https://developer.linkedin.com/)
2. After creating your app, navigate to the `Auth` tab, and add a new authorized redirect URL for OAuth 2.0. Set it to `http://localhost:3000/auth/linkedin/callback`
3. Go to the `Products` tab and enable the `Share on LinkedIn` and `Sign In with LinkedIn using OpenID Connect` products.

If you plan on posting from company pages, you'll need to do the following:

<details>
<summary>Company Setup</summary>

1. If you plan on posting from company pages, you'll also need to enable the `Advertising API` product. Furthermore, ensure your personal account has at least one one of the following roles with the company page:

- `ADMINISTRATOR`
- `DIRECT_SPONSORED_CONTENT_POSTER`
- `RECRUITING_POSTER`

2. Next, ensure your company page has verified the app. You can create a verification link on the `Settings` tab of your app, then click the `Verify` button on the company page card.
3. Once requesting access, you'll need to fill out a form for verification. Once submitted, you should receive an email stating you've been granted developer access which will give you the proper permission to test out the API until it's been approved.
4. Inside the [authorization server file (./src/clients/auth-server.ts)](./src/clients/auth-server.ts), ensure the `w_organization_social` scope is enabled inside the scopes string in the `/auth/linkedin` route. Once done, the scopes string should look like this: `openid profile email w_member_social w_organization_social`
5. Get the organization ID from the URL of the company page when you're logged in as an admin and set it as the `LINKEDIN_ORGANIZATION_ID` environment variable. For example, if the URL is `https://www.linkedin.com/company/12345678/admin/dashboard/`, the organization ID would be `12345678`.

> NOTE
>
> If you plan on only posting from the company account, you can set the `POST_TO_LINKEDIN_ORGANIZATION` to `"true"` in your `.env` file. If you want to choose dynamically, you can set this to `true`/`false` in the configurable fields (`postToLinkedInOrganization`) when invoking the `generate_post` graph.
>
> This value will take precedence over the `POST_TO_LINKEDIN_ORGANIZATION` environment variable.

</details>

4. Save the following environment variables in your `.env` file:

- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`

5. Run the `yarn start:auth` command to run the LinkedIn OAuth server. Open [http://localhost:3000](http://localhost:3000) in your browser, and click `Login with LinkedIn`.
6. After logging in, copy the `access_token` and `sub` values from the objects logged to the terminal. Set these values as `LINKEDIN_ACCESS_TOKEN` (`access_token`) and `LINKEDIN_PERSON_URN` (`sub`) in your `.env` file.

#### Setup Supabase

Supabase is required for storing images found/generated by the agent. To setup Supabase, create an account and a new project.

Set the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables to the values provided by Supabase.

Create a new storage bucket called `images`. Make sure the bucket is set to public to the image URLs are accessible. Also ensure the max upload size is set to at least 5MB inside the global project settings, and the bucket specific settings.

#### Setup Slack

Slack integration is optional, but recommended if you intend on using the `ingest_data` agent. This agent can be used in a cron job to fetch messages from a Slack channel, and call the `generate_post` graph for each message. We use this flow internally to have a single place for submitting relevant URLs to the agent, which are then turned into posts once daily.

To configure the Slack integration, you'll need to create a new Slack app and install it into your desired Slack workspace. Once installed, ensure it has access to the channel you want to ingest messages from. Finally, make sure the `SLACK_BOT_TOKEN` environment variable is set.

#### Setup GitHub

The GitHub API token is required to fetch details about GitHub repository URLs submitted to the agent. To get a GitHub API token, simply create a new fine grained token with the `Public Repositories (read-only)` scope at a minimum. If you intend on using this agent for private GitHub repositories, you'll need to give the token access to those repositories as well.

#### Setup LangGraph CLI

The LangGraph CLI is required for running the LangGraph server locally (optionally you may use the LangGraph Studio application if you're running on Mac. See [these docs](https://github.com/langchain-ai/langgraph-studio) for a setup guide).

[Follow these instructions to download the LangGraph CLI](https://langchain-ai.github.io/langgraph/cloud/reference/cli/).

Once the CLI is installed, you can run the following command to start the local LangGraph server:

```bash
yarn langgraph:up
```

This executes the following command:

```bash
langgraph up --watch --port 54367
```

> [!NOTE]
> You must either have your `LANGSMITH_API_KEY` set as an environment variable (e.g., via `export LANGSMITH_API_KEY="..."` in your shell config like `.zshrc` or `.bashrc`), or include it inline when running the command

## Basic Usage

Once all the required environment variables are set, you can try out the agent by running the `yarn generate_post` command.

Before running, ensure you have the following environment variables set:

- `TWITTER_USER_ID` & `LINKEDIN_USER_ID` - The email address/username of the Twitter & LinkedIn account you'd like to have the agent use. (only one of these must be set). Optionally, you can pass these as configurable fields by editing the [`generate-demo-post.ts`](./scripts/generate-demo-post.ts) script.
- `LANGGRAPH_API_URL` - The URL of the local LangGraph server. **not** required if you passed `--port 54367` when running `langgraph up`.

This will run the [`generate-demo-post.ts`](./scripts/generate-demo-post.ts) script, which generates a demo post on the [Open Canvas](https://github.com/langchain-ai/open-canvas) project.

After invoking, visit the [Agent Inbox](https://agent-inbox-nu.vercel.app) and add the Generate Post inbox in settings, passing in the following fields:

- Your LangSmith API key

Then click `Add Inbox` and add the following fields:

- Graph ID: `generate_post`
- Graph API URL: `http://localhost:54367` (or whatever port you set for your LangGraph server)
- Name: (optional) `Generate Post (local)`

Once submitted you should see a single interrupt event! Follow the instructions in the description to authorize your Twitter/LinkedIn account(s), then accept to continue the graph and have a post draft generated!
