# Social Media Agent

## Setup

- Install dependencies:

```bash
yarn install
```

- Set environment variables.

Copy the values of `.env.example` to `.env`

```bash
cp .env.example .env
```

You can sign up for an Arcade account [here](https://arcade-ai.typeform.com/early-access?typeform-source=docs.arcade-ai.com).

- Open in LangGraph Studio

## Basic Usage

In LangGraph Studio, select the `generate-post` graph and insert a single URL into the `links` field. (for example: `https://github.com/langchain-ai/open-canvas`).

Then, insert your Twitter/LinkedIn user IDs to the configurable fields (I used my email address linked to my Twitter/LinkedIn accounts for this).

Lastly, invoke the graph. The first two nodes will verify your Twitter/LinkedIn account has granted Arcade the proper authentication. If the account has not yet been authorized, the graph will interrupt and ask you to visit the URLs provided to authorize the account. Once this has finished, the graph will continue with the rest of the process, ending on the `humanNode` node.
