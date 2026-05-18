import { WORKFLOW_SCHEMA } from "./schema";
import { WORKFLOW_RULES } from "./rules";

export const buildWorkflowPrompt = (input: string) => {
  return `INPUT:\n${input}\n\nOUTPUT ONLY JSON.`;
};

export const getWorkflowSystemInstruction = () => {
  return `${WORKFLOW_SCHEMA}\n\n${WORKFLOW_RULES}`;
};