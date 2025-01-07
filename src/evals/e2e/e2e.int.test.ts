import { v4 as uuidv4 } from "uuid";
import * as ls from "langsmith/jest";
import { beforeAll } from "@jest/globals";
import { type SimpleEvaluator } from "langsmith/jest";
import { INPUTS } from "./inputs.js";
import { generatePostGraph } from "../../agents/generate-post/generate-post-graph.js";
import { InMemoryStore, MemorySaver } from "@langchain/langgraph";
import { POST_TO_LINKEDIN_ORGANIZATION } from "../../agents/generate-post/constants.js";
import { removeUrls } from "../../agents/utils.js";
import { GeneratePostAnnotation } from "../../agents/generate-post/generate-post-state.js";
import { HumanInterrupt } from "../../agents/types.js";

const checkGeneratePostResult: SimpleEvaluator = ({ expected: _expected, actual }) => {
  // Check the following:
  // 1(a). A post was generated
  // 1(b). Check post length is less than or equal to 280 after removing URL.
  // 2. Check page contents were extracted
  // 3. A report was generated with the proper fields (check markdown headers)
  // 4. Check images were generated
  // 5. Check the interrupt value is as expected

  // If any are false, return 0
  // If all are true, return 1.
  let postScore = 0;
  let pageContentsScore = 0;
  let reportScore = 0;
  let imagesScore = 0;
  let interruptScore = 0;

  const { state, interrupt } = actual as {
    state: typeof GeneratePostAnnotation.State;
    interrupt: HumanInterrupt | undefined;
  };

  if (state.post) {
    const cleanedPost = removeUrls(state.post || "");
    if (cleanedPost.length <= 280 && cleanedPost.length > 0) {
      postScore = 1;
    }
  }

  if (state.pageContents.length > 0) {
    pageContentsScore = 1;
  }

  if (state.report.length > 0) {
    // TODO: Extract headers and validate they are correct
    reportScore = 1;
  }

  if (state.imageOptions.length > 0) {
    // TODO: Update expected images dataset and check the image length is expected.
    // TODO: Ensure supabase image is included
    imagesScore = 1;
  }

  if (interrupt) {
    interruptScore = 1;
  }

  const totalScore = postScore + pageContentsScore + reportScore + imagesScore + interruptScore;
  let score = 0;
  if (totalScore === 5) {
    score = 1;
  }

  return {
    key: "correct_post_generation",
    score,
    evaluatorInfo: {
      postScore,
      pageContentsScore,
      reportScore,
      imagesScore,
      interruptScore,
    }
  };
};

const BASE_CONFIG = {
  [POST_TO_LINKEDIN_ORGANIZATION]: undefined,
}

ls.describe("SMA - E2E", () => {
  const graph = generatePostGraph;

  beforeAll(async () => {
    graph.checkpointer = new MemorySaver();
    graph.store = new InMemoryStore();
  })

  ls.test.each(INPUTS)(
    "Should validate the end to end flow of the generate post agent",
    async ({ inputs }) => {
      const threadId = uuidv4();
      const config = {
        configurable: {
          thread_id: threadId,
          ...BASE_CONFIG,
        }
      }

      expect(await generatePostGraph.invoke(inputs, config)).not.toThrow();
      const graphState = await generatePostGraph.getState(config);
      const state = graphState.values;
      const interruptValue = graphState.tasks[0]?.interrupts?.[0]?.value;
      console.log("\nState\n", state);
      console.log("\nInterrupt Value\n", interruptValue);
      await ls.expect({
        state,
        interrupt: interruptValue,
      }).evaluatedBy(checkGeneratePostResult).toBe(1);
      return graphState;
    },
  );
});