import { type Example, Run } from "langsmith";
import { evaluate, EvaluationResult } from "langsmith/evaluation";
import "dotenv/config";
import { generatePostGraph } from "../../agent/subgraphs/generate-post/graph.js";

const runGraph = async (
  input: Record<string, any>
): Promise<Record<string, any>> => {
  return await generatePostGraph.invoke(input);
};

const evaluatePost = (run: Run, example?: Example): EvaluationResult => {
  if (!example) {
    throw new Error("No example provided");
  }
  if (!example.outputs) {
    throw new Error("No example outputs provided");
  }
  if (!run.outputs) {
    throw new Error("No run outputs provided");
  }

  // TODO: Implement evaluation logic
  throw new Error("Evaluation logic not implemented");
};

async function runEval() {
  const datasetName = "sma:generate-post:general";
  await evaluate(runGraph, {
    data: datasetName,
    evaluators: [evaluatePost],
    experimentPrefix: "Post Generation - General",
  });
}

runEval();
