import * as ls from "langsmith/jest";
import { type SimpleEvaluator } from "langsmith/jest";
import { validateImages } from "../../agents/generate-post/nodes/find-images/validate-images.js";
import { GeneratePostAnnotation } from "../../agents/generate-post/generate-post-state.js";
import { INPUTS, OUTPUTS } from "./inputs.js";

const myEvaluator: SimpleEvaluator = ({ expected, actual }) => {
  const expectedImageOptions = expected.imageOptions as string[];
  const actualImageOptions = actual.imageOptions as string[];
  let numCorrect = 0;
  for (const expectedUrl of expectedImageOptions) {
    if (actualImageOptions.find((actualUrl) => actualUrl === expectedUrl)) {
      numCorrect += 1;
    }
  }
  const score = numCorrect / expectedImageOptions.length;

  return {
    key: "correct_images",
    score,
  };
};

ls.describe("SMA - Validate Images", () => {
  ls.test.each([
    {
      inputs: INPUTS[0],
      outputs: OUTPUTS[0],
    },
    {
      inputs: INPUTS[1],
      outputs: OUTPUTS[1],
    },
  ])("Should validate images", async ({ inputs }) => {
    // Import and run your app, or some part of it here
    const result = await validateImages(
      inputs as typeof GeneratePostAnnotation.State,
    );
    console.log("result!", result);
    const evalResult = ls.expect(result).evaluatedBy(myEvaluator);
    // Ensure the result is greater than 0.8 and less than or equal to 1
    await evalResult.toBeGreaterThanOrEqual(0.8);
    await evalResult.toBeLessThanOrEqual(1);
    return result;
  });
});
