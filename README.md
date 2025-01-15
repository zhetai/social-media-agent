# Social Media Agent

This repository contains an 'agent' which can take in a URL, and generate a Twitter & LinkedIn post based on the content of the URL. It uses a human-in-the-loop (HITL) flow to handle authentication with different social media platforms, and to allow the user to make changes, or accept/reject the generated post.

![Screenshot of the social media agent flow](./static/agent_flow.png)

# Quickstart

> [!NOTE]
> 🎥 For a visual guide, check out our [step-by-step video tutorial](https://youtu.be/TmTl5FMgkCQ) that walks you through the account setup process and project configuration.

This quickstart covers how to setup the Social Media Agent in a basic setup mode. This is the quickest way to get up and running, however it will lack some of the features of the full setup mode. See [here](#advanced-setup) for the full setup guide.

<details>
<summary>Running in basic setup mode will lack the following features:</summary>

- Posting to Twitter & LinkedIn _(it will still generate the posts, however you will need to manually post them)_
- Ingesting content from GitHub, Twitter or YouTube URLs
- Ingesting data from a Slack channel
- Image selection & uploads

</details>

To get started, you'll need the following API keys/software:

- [Anthropic API](https://console.anthropic.com/) - General LLM
- [LangSmith](https://smith.langchain.com/) - LangSmith API key required to run the LangGraph server locally (free)
- [FireCrawl API](https://www.firecrawl.dev/) - Web scraping. New users get 500 credits for free
- [Arcade](https://www.arcade-ai.com/) - Social media authentication for reading & writing

## Setup Instructions

### Clone the repository:

```bash
git clone https://github.com/langchain-ai/social-media-agent.git
```

```bash
cd social-media-agent
```

### Install dependencies:

```bash
yarn install
```

### Set environment variables.

Copy the values of the quickstart `.env.quickstart.example` to `.env`, then add the values:

```bash
cp .env.quickstart.example .env
```

Once done, ensure you have the following environment variables set:

```bash
# For LangSmith tracing (optional)
LANGCHAIN_API_KEY=
LANGCHAIN_TRACING_V2=true

# For LLM generations
ANTHROPIC_API_KEY=

# For web scraping
FIRECRAWL_API_KEY=

# Arcade API key - used for fetching Tweets, and scheduling LinkedIn/Twitter posts
ARCADE_API_KEY=
```

### Install LangGraph CLI

```bash
pip install langgraph-cli
```

Then run the following command to check the CLI is installed:

```bash
langgraph --version
```

Click [here](https://langchain-ai.github.io/langgraph/cloud/reference/cli/) to read the full download instructions for the LangGraph CLI.

### Start the LangGraph server:

First, make sure you have Docker installed and running. You can check this by running the following command:

```bash
docker ps
```

Then, run the following command to start the LangGraph server: (ensure you either have the `LANGGRAPH_API_KEY` exposed in your path, or include it inline when you run the command)

```bash
yarn langgraph:up
```

or

```bash
LANGCHAIN_API_KEY="lsv2_pt_..." yarn langgraph:up
```

The first time you run this command, it will take a few minutes to start up. Once it's ready, you can execute the following command to generate a demo post:

```bash
yarn generate_post
```

This will kick off a new run to generate a post on a [LangChain blog post](https://blog.langchain.dev/customers-appfolio/).

To view the output, either inspect it in LangSmith, or use Agent Inbox.

To add your graph to Agent Inbox:

- Visit the deployed site here: [https://dev.agentinbox.ai](https://dev.agentinbox.ai)
- Click the Settings button, then the `Add Inbox` button
- Enter the following values:
  - Graph ID: `generate_post`
  - Graph API URL: `http://localhost:54367`
  - Name: (optional) `Generate Post (local)`
- Submit
- This should then trigger a refresh, and you should see your first interrupted event! (if it does not show up even after refreshing, please make sure you've waited at least 1-2 minutes for the graph execution to finish)

# Advanced Setup

![Screenshot of the social media agent graph](./static/graph_screenshot.png)

To use all of the features of the Social Media Agent, you'll need the following:

- [Anthropic API](https://console.anthropic.com/) - General LLM
- [Google Vertex AI](https://cloud.google.com/vertex-ai) - For dealing with YouTube video content
- [LangSmith](https://smith.langchain.com/) - LangSmith API key required to run the LangGraph server locally (free)
- [FireCrawl API](https://www.firecrawl.dev/) - Web scraping
- [Arcade](https://www.arcade-ai.com/) - Social media authentication
- [Twitter Developer Account](https://developer.twitter.com/en/portal/dashboard) - For uploading media to Twitter
- [LinkedIn Developer Account](https://developer.linkedin.com/) - Posting to LinkedIn
- [GitHub API](https://github.com/settings/personal-access-tokens) - Reading GitHub content
- [Supabase](https://supabase.com/) - Storing images
- [Slack Developer Account](https://api.slack.com/apps) (optional) - ingesting data from a Slack channel

## Setup Instructions

### Clone the repository:

```bash
git clone https://github.com/langchain-ai/social-media-agent.git
```

```bash
cd social-media-agent
```

### Install dependencies:

```bash
yarn install
```

### Set environment variables.

Copy the values of the full env example file `.env.full.example` to `.env`, then update the values as needed.

```bash
cp .env.full.example .env
```

### Install LangGraph CLI

```bash
pip install langgraph-cli
```

Then run the following command to check the CLI is installed:

```bash
langgraph --version
```

Click [here](https://langchain-ai.github.io/langgraph/cloud/reference/cli/) to read the full download instructions for the LangGraph CLI.

### Setup Twitter

Setting up Twitter requires a Twitter developer account for uploading media to Twitter, and an Arcade account if you plan on using it for posting to Twitter. This however is optional, as you can use your own Twitter developer account for all reading & writing.

### Arcade Setup Instructions

Create an Arcade account [here](https://www.arcade-ai.com/). Once done, setting up the account, ensure you have an Arcade API key. Set this value as `ARCADE_API_KEY` in your `.env` file.

Make sure you have the `USE_ARCADE_AUTH` environment variable set to `true` to have the graph use Arcade authentication.

### Twitter Developer Setup Instructions

You'll need to follow these instructions if you plan on uploading media to Twitter, and/or want to use your own Twitter developer account for all reading & writing.

- Create a Twitter developer account
- Create a new app and give it a name.
- Copy the `API Key`, `API Key Secret` and `Bearer Token` and set them as `TWITTER_API_KEY`, `TWITTER_API_KEY_SECRET`, and `TWITTER_BEARER_TOKEN` in your `.env` file.
- After saving, visit the App Dashboard. Find the `User authentication settings` section, and click the `Set up` button. This is how you will authorize users to use the Twitter API on their behalf.
- Set the following fields:
  - `App permissions`: `Read and write`
  - `Type of App`: `Web App, Automated App or Bot`
  - `App info`:
    - `Callback URI/Redirect URL`: `http://localhost:3000/auth/twitter/callback`
    - `Website URL`: Your website URL
- Save. You'll then be given a `Client ID` and `Client Secret`. Set these as `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET` in your `.env` file.

Once done, run the `yarn start:auth` command to run the Twitter OAuth server. Open [http://localhost:3000](http://localhost:3000) in your browser, and click `Login with Twitter`.

After authorizing your account with the app, navigate to your terminal where you'll see a JSON object logged. Copy the `token` and `tokenSecret` values and set them as `TWITTER_USER_TOKEN` and `TWITTER_USER_TOKEN_SECRET` in your `.env` file.

After setting up Twitter/Arcade, set the `TWITTER_USER_ID` environment variable to the user ID of the account that you want to use to post to Twitter. (e.g `TWITTER_USER_ID="LangChainAI"`)

### Setup LinkedIn authentication:

To authorize posting on LinkedIn, you'll need to:

1. Create a new LinkedIn developer account, and app [here](https://developer.linkedin.com/)
2. After creating your app, navigate to the `Auth` tab, and add a new authorized redirect URL for OAuth 2.0. Set it to `http://localhost:3000/auth/linkedin/callback`
3. Go to the `Products` tab and enable the `Share on LinkedIn` and `Sign In with LinkedIn using OpenID Connect` products.

<details>
<summary>If you plan on posting from company pages, you'll need to do the following:</summary>

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

</details>

After setting up LinkedIn, set the `LINKEDIN_USER_ID` environment variable to the user ID of the account that you want to use to post to LinkedIn. (e.g `LINKEDIN_USER_ID="your_linkedin_email_address@example.com"`)

### Setup Supabase

Supabase is required for storing images found/generated by the agent. This step is not required for running the agent in basic setup mode.

To setup Supabase, create an account and a new project.

Set the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables to the values provided by Supabase.

Create a new storage bucket called `images`. Make sure the bucket is set to public to the image URLs are accessible. Also ensure the max upload size is set to at least 5MB inside the global project settings, and the bucket specific settings.

### Setup Slack

Slack integration is optional, but recommended if you intend on using the `ingest_data` agent. This agent can be used in a cron job to fetch messages from a Slack channel, and call the `generate_post` graph for each message. We use this flow internally to have a single place for submitting relevant URLs to the agent, which are then turned into posts once daily.

To configure the Slack integration, create a new Slack app and install it into your desired Slack workspace.

Once installed, ensure it has access to the channel you want to ingest messages from.

Finally, make sure the `SLACK_BOT_TOKEN` environment variable is set in your `.env` file.

### Setup GitHub

The GitHub API token is required to fetch details about GitHub repository URLs submitted to the agent. This is not required if you do not plan on sending GitHub URLs to the agent.

To get a GitHub API token, create a new fine grained token with the `Public Repositories (read-only)` scope at a minimum. If you intend on using this agent for private GitHub repositories, you'll need to give the token access to those repositories as well.

Ensure this is set as `GITHUB_TOKEN` in your `.env` file.

## Usage

Once this is done, start your graph server by running: (ensure you either have the `LANGGRAPH_API_KEY` exposed in your path, or include it inline when you run the command)

```bash
yarn langgraph:up
```

or

```bash
LANGCHAIN_API_KEY="lsv2_pt_..." yarn langgraph:up
```

The first time you run this command, it will take a few minutes to start up. Once it's ready, you can execute the following command to generate a demo post:

After the graph is ready, you can run the following command to generate a demo post:
(before doing this, you should edit the file so that the text only mode is set to false: `[TEXT_ONLY_MODE]: false`)

```bash
yarn generate_post
```

This will kick off a new run to generate a post on a [LangChain blog post](https://blog.langchain.dev/customers-appfolio/).

To view the output, either inspect it in LangSmith, or use Agent Inbox.

To add your graph to Agent Inbox:

- Visit the deployed site here: [https://agent-inbox-nu.vercel.app](https://agent-inbox-nu.vercel.app)
- Click the Settings button, then the `Add Inbox` button
- Enter the following values:
  - Graph ID: `generate_post`
  - Graph API URL: `http://localhost:54367`
  - Name: (optional) `Generate Post (local)`
- Submit
- This should then trigger a refresh, and you should see your first interrupted event! (if it does not show up even after refreshing, please make sure you've waited at least 1-2 minutes for the graph execution to finish)

If the interrupt event does not contain a social media post, this is likely because you have not authenticated your social media account with Arcade (or you're missing the proper environment variables if not using Arcade). Open this interrupt event and follow the instructions outlined in the description.

# Prompts

This agent is setup to generate posts for LangChain, using LangChain products as context. To use the agent for your own use case, you should update the following prompts/prompt sections inside the [`prompts`](./src/agents/generate-post/prompts/index.ts) folder:

- `BUSINESS_CONTEXT` - Context to be used when checking whether or not content is relevant to your business/use case.
- `TWEET_EXAMPLES` ([`prompts/examples.ts`](./src/agents/generate-post/prompts/examples.ts)) - A list of examples of posts you'd like the agent to use as a guide when generating the final post.
- `POST_STRUCTURE_INSTRUCTIONS` - A set of structure instructions for the agent to follow when generating the final post.
- `POST_CONTENT_RULES` - A set of general writing style/content guidelines for the agent to follow when generating a post.

The prompt for the marketing report is located in the [`generate-post/nodes/generate-report/prompts.ts`](./src/agents/generate-post/nodes/generate-report/prompts.ts) file. You likely don't need to update this, as it's already structured to be general.
