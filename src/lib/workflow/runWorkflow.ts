import { validateWorkflow } from "@/lib/validation/workflowValidator";
import { fixWorkflow } from "@/lib/validation/workflowFixer";
import { buildWorkflowPrompt, getWorkflowSystemInstruction } from "@/lib/prompts/workflow/buildPrompt";
import { GoogleGenAI } from "@google/genai";
import { toast } from "sonner";
import { incrementApiCall, isApiLimitReached } from "@/lib/simulation/apiCounter";
import { DEMO_WORKFLOW } from "@/lib/demo-workflow";

export async function generateWorkflow(input: any, preferredModel: string = "gemini-3-flash-preview", retry = 0, setAiModel?: (model: any) => void): Promise<any> {
  // Simulated mode: skip all API calls, return pre-built demo workflow
  if (preferredModel === 'gemini-simulated' || isApiLimitReached()) {
    if (setAiModel) setAiModel('gemini-simulated');
    toast.warning('Your Gemini API credits for today have been used. ContextOS is now running in simulation mode.', {
      id: 'simulated-mode',
      duration: 6000,
    });
    return { workflow: DEMO_WORKFLOW, usedModel: 'gemini-simulated' };
  }

  try {
    let parsed: any;
    let activeModel = preferredModel;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "AI_STUDIO_FREE_TIER" });

      // Put preferred model first, then fallbacks
      const allModels = ["gemini-3.1-pro-preview", "gemini-3-flash-preview", "gemini-2.5-pro", "gemini-2.5-flash"];

      let fallbackModel = preferredModel;
      if (preferredModel === "gemini-3.1-pro-preview") fallbackModel = "gemini-2.5-pro";
      if (preferredModel === "gemini-3-flash-preview") fallbackModel = "gemini-2.5-flash";

      const modelsToTry = [preferredModel, fallbackModel, ...allModels.filter(m => m !== preferredModel && m !== fallbackModel)];

      let responseText = "";

      const parts: any[] = [];
      if (typeof input === 'string') {
        parts.push({ text: buildWorkflowPrompt(input) });
      } else if (input?.inlineData) {
        parts.push({ text: buildWorkflowPrompt(input.text) });
        parts.push({ inlineData: input.inlineData });
      } else {
        parts.push({ text: buildWorkflowPrompt("Employee offboarding workflow") });
      }

      for (const model of modelsToTry) {
        try {
          activeModel = model; // Reflect the current model we are trying/falling back to
          if (setAiModel) {
            setAiModel(model);
          }
          const response = await ai.models.generateContent({
            model: model,
            contents: [{ role: "user", parts }],
            config: {
              responseMimeType: "application/json",
              systemInstruction: getWorkflowSystemInstruction()
            },
          });
          responseText = response.text || "";
          if (responseText) {
            console.log(`Successfully generated with model: ${model}`);
            activeModel = model;
            incrementApiCall(); // track usage for daily limit
            break;
          }
        } catch (err: any) {
          console.warn(`Model ${model} failed:`, err.message || err);
          if (model.includes("3.1")) {
            const fallback = model.includes("pro") ? "gemini-2.5-pro" : "gemini-2.5-flash";
            toast.info(`Model ${model} experienced an error. Regressing to ${fallback}...`, { id: `model-regression-${model}` });
          } else if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
            console.warn(`Rate limit hit on ${model}, trying next model...`);
          } else {
            throw err; // if it's an auth error or something else on a non-3.1 model, abort
          }
        }
      }

      if (!responseText) {
        throw new Error("All models failed or rate limited.");
      }

      parsed = JSON.parse(responseText || "{}");
    } catch (e: any) {
      console.warn("AI generation failed or rate limited, falling back to simulated mode:", e.message);
      // All models exhausted — switch to simulated mode
      if (setAiModel) setAiModel('gemini-simulated');
      toast.warning('Your Gemini API credits for today have been used. ContextOS is now running in simulation mode.', {
        id: 'simulated-mode',
        duration: 6000,
      });
      return { workflow: DEMO_WORKFLOW, usedModel: 'gemini-simulated' };
    }

    if (!parsed) {
      if (retry < 2) {
        return generateWorkflow(input, preferredModel, retry + 1);
      }
      throw new Error("Failed to generate valid workflow: The model returned an invalid response.");
    }

    const validation = validateWorkflow(parsed);

    if (validation.valid) {
      return { workflow: parsed, usedModel: activeModel };
    }

    console.log("Workflow invalid:", validation.errors);

    const fixed = fixWorkflow(parsed);
    const recheck = validateWorkflow(fixed);

    if (recheck.valid) {
      return { workflow: fixed, usedModel: activeModel };
    }

    if (retry < 2) {
      return generateWorkflow(input, preferredModel, retry + 1);
    }

    throw new Error("Failed to generate valid workflow after retries");
  } catch (error: any) {
    console.error("Frontend generation failed:", error);
    let errorMessage = error.message || "Failed to generate workflow.";

    if (errorMessage.includes("prepayment credits are depleted") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("429")) {
      errorMessage = "The AI Studio Free Tier proxy is currently rate-limited (429) or out of capacity. Please wait a moment and try again, or switch to your own active billing-enabled key in the Secrets panel.";
    } else if (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID")) {
      errorMessage = "Invalid API key provided. Please select 'AI Studio Free Tier', or provide a valid key in the Secrets panel.";
    }

    throw new Error(errorMessage);
  }
}
