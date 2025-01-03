import { Item, LangGraphRunnableConfig } from "@langchain/langgraph";

const NAMESPACE = ["reflection_rules"];
const KEY = "rules";
export const RULESET_KEY = "ruleset";

/**
 * Retrieves reflection rules from the store
 * @param {LangGraphRunnableConfig} config - Configuration object containing the store
 * @throws {Error} When no store is provided in the config
 * @returns {Promise<Item | undefined>} The reflection rules if they exist, undefined otherwise
 */
export async function getReflections(
  config: LangGraphRunnableConfig,
): Promise<Item | undefined> {
  const { store } = config;
  if (!store) {
    throw new Error("No store provided");
  }
  const reflections = await store.get(NAMESPACE, KEY);
  return reflections || undefined;
}

/**
 * Stores reflection rules in the store
 * @param {LangGraphRunnableConfig} config - Configuration object containing the store
 * @param {Record<string, any>} value - The reflection rules to store
 * @throws {Error} When no store is provided in the config
 * @returns {Promise<void>}
 */
export async function putReflections(
  config: LangGraphRunnableConfig,
  reflections: string[],
): Promise<void> {
  const { store } = config;
  if (!store) {
    throw new Error("No store provided");
  }
  await store.put(NAMESPACE, KEY, {
    [RULESET_KEY]: reflections,
  });
}
