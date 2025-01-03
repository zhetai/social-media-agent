import {
  Annotation,
  END,
  LangGraphRunnableConfig,
  START,
  StateGraph,
} from "@langchain/langgraph";
import {
  LINKEDIN_ACCESS_TOKEN,
  LINKEDIN_ORGANIZATION_ID,
  LINKEDIN_PERSON_URN,
  LINKEDIN_USER_ID,
  POST_TO_LINKEDIN_ORGANIZATION,
  TWITTER_TOKEN,
  TWITTER_TOKEN_SECRET,
  TWITTER_USER_ID,
} from "../generate-post/constants.js";
import { z } from "zod";
import { ChatAnthropic } from "@langchain/anthropic";

const REFLECTION_PROMPT = `You are an AI assistant tasked with analyzing social media post revisions and user feedback to determine if a new rule should be created for future post modifications.
Your goal is to identify patterns in the changes requested by the user and decide if these changes should be applied automatically in the future.

You will be given three pieces of information:

1. The original social media post:
<original_post>
{ORIGINAL_POST}
</original_post>

2. The revised post:
<new_post>
{NEW_POST}
</new_post>

3. The user's response to the revision:
<user_response>
{USER_RESPONSE}
</user_response>

Carefully analyze these three elements, paying attention to the following:
1. What specific changes were made between the original and new post?
2. How did the user respond to these changes?
3. Is there a clear pattern or preference expressed by the user?
4. Could this preference be generalized into a rule for future posts?

Based on your analysis, decide if a new rule should be created. Consider the following:
1. Is the change specific enough to be applied consistently?
2. Would applying this change automatically improve future posts?
3. Is there any potential downside to always making this change?

If you determine that a new rule should be created, formulate it clearly and concisely. The rule should be specific enough to be applied consistently but general enough to cover similar situations in the future.

Provide your analysis and decision in the following format:

<analysis>
[Your detailed analysis of the changes and user response]
</analysis>

<decision>
[Your decision on whether a new rule should be created, along with your reasoning]
</decision>

If applicable, call the 'new_rule' tool to create the new rule. If no new rule is needed, simply write "No new rule required."

Remember to be thorough in your analysis, clear in your decision-making, and precise in your rule formulation if one is needed.`;

const newRuleSchema = z.object({
  newRule: z.string().describe("The new rule to create."),
});

const UPDATE_RULES_PROMPT = `You are an AI assistant tasked with updating a ruleset based on the addition of a new rule. Your goal is to analyze the new rule in relation to the existing rules and provide an updated ruleset.

First, review the existing rules:
<existing_rules>
{EXISTING_RULES}
</existing_rules>

Now, consider the new rule:
<new_rule>
{NEW_RULE}
</new_rule>

Analyze the new rule in relation to the existing rules by considering the following:
1. Can this rule be combined with existing rules to cover similar situations?
2. Has this rule already been covered by existing rules?
3. Does this rule conflict with existing rules?

Follow these guidelines when updating the ruleset:
1. If the new rule conflicts with an existing rule, remove the existing conflicting rule and prioritize the new rule.
2. If the new rule is already covered by an existing rule, remove the new rule or combine them.
3. If the new rule can be combined with existing rules, combine them to cover similar situations.

Before providing the updated ruleset, use a <scratchpad> to think through your analysis and decision-making process. Consider each existing rule in relation to the new rule, and explain your reasoning for any changes you plan to make.

After your analysis, provide the updated ruleset in the following format:
<updated_ruleset>
1. [First updated or new rule]
2. [Second updated or new rule]
...
n. [Last updated or new rule]
</updated_ruleset>

Following the updated ruleset, provide a brief explanation of the changes made and the reasoning behind them in <explanation> tags.`;

const updateRulesetSchema = z
  .object({
    updatedRuleset: z.string().describe("The updated ruleset."),
  })
  .describe("The updated ruleset.");

const ReflectionAnnotation = Annotation.Root({
  /**
   * The original post before edits were made.
   */
  originalPost: Annotation<string>,
  /**
   * The post after edits have been made.
   */
  newPost: Annotation<string>,
  /**
   * The user's response to the interrupt event
   * which triggered the reflection.
   */
  userResponse: Annotation<string>,
});

const ReflectionGraphConfiguration = Annotation.Root({
  [TWITTER_USER_ID]: Annotation<string | undefined>,
  [LINKEDIN_USER_ID]: Annotation<string | undefined>,
  [TWITTER_TOKEN]: Annotation<string | undefined>,
  [TWITTER_TOKEN_SECRET]: Annotation<string | undefined>,
  [LINKEDIN_ACCESS_TOKEN]: Annotation<string | undefined>,
  [LINKEDIN_PERSON_URN]: Annotation<string | undefined>,
  [LINKEDIN_ORGANIZATION_ID]: Annotation<string | undefined>,
  [POST_TO_LINKEDIN_ORGANIZATION]: Annotation<boolean | undefined>,
});

async function reflection(
  state: typeof ReflectionAnnotation.State,
  config: LangGraphRunnableConfig,
): Promise<Partial<typeof ReflectionAnnotation.State>> {
  if (!config.store) {
    throw new Error("No store provided");
  }
  const model = new ChatAnthropic({
    model: "claude-3-5-sonnet-latest",
    temperature: 0,
  });

  const generateNewRuleModel = model.bindTools([
    {
      name: "new_rule",
      description:
        "Create a new rule based on the provided text. Only call this tool if a new rule is needed.",
      schema: newRuleSchema,
    },
  ]);
  const formattedPrompt = REFLECTION_PROMPT.replace(
    "{ORIGINAL_POST}",
    state.originalPost,
  )
    .replace("{NEW_POST}", state.newPost)
    .replace("{USER_RESPONSE}", state.userResponse);

  const result = await generateNewRuleModel.invoke([
    {
      role: "user",
      content: formattedPrompt,
    },
  ]);
  const toolCalls = result.tool_calls || [];
  if (!toolCalls.length) {
    // No new rule needed
    return {};
  }
  const newRule = toolCalls[0].args.newRule as string;
  if (!newRule) {
    // Called tool but didn't return a rule
    return {};
  }

  const existingRules = await config.store.get(["reflection_rules"], "rules");

  if (!existingRules) {
    // No rules exist yet. Create and return early.
    await config.store.put(["reflection_rules"], "rules", {
      ruleset: [newRule],
    });

    return {};
  }

  const updateRulesetModel = model.withStructuredOutput(updateRulesetSchema, {
    name: "update_ruleset",
  });
  const updateRulesetPrompt = UPDATE_RULES_PROMPT.replace(
    "{EXISTING_RULES}",
    existingRules?.value.ruleset.join("\n") || "",
  ).replace("{NEW_RULE}", newRule);
  const updateRulesetResult = await updateRulesetModel.invoke([
    {
      role: "user",
      content: updateRulesetPrompt,
    },
  ]);

  await config.store.put(["reflection_rules"], "rules", {
    ruleset: updateRulesetResult.updatedRuleset,
  });

  return {};
}

const reflectionWorkflow = new StateGraph(
  ReflectionAnnotation,
  ReflectionGraphConfiguration,
)
  .addNode("reflection", reflection)
  .addEdge(START, "reflection")
  .addEdge("reflection", END);

export const reflectionGraph = reflectionWorkflow.compile();
reflectionGraph.name = "Reflection Graph";
