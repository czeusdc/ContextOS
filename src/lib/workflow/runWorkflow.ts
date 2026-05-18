import { validateWorkflow } from "@/lib/validation/workflowValidator";
import { fixWorkflow } from "@/lib/validation/workflowFixer";
import { buildWorkflowPrompt, getWorkflowSystemInstruction } from "@/lib/prompts/workflow/buildPrompt";
import { GoogleGenAI } from "@google/genai";
import { toast } from "sonner";

export async function generateWorkflow(input: any, preferredModel: string = "gemini-3-flash-preview", retry = 0, setAiModel?: (model: any) => void): Promise<any> {
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
      console.warn("AI generation failed or rate limited, falling back to mock workflow graph:", e.message);
      toast.error("Gemini API Error: Using mock workflow data temporarily.", {
        description: "Rate limit exceeded or quota exhausted across available models."
      });
      // Fallback mock graph
      parsed = {
        workflow_name: "Employee Offboarding Demo",
        workflow_summary: "Automated standard offboarding",
        analysis_report: {
          workflow_type: "Employee Offboarding",
          departments_detected: ["HR", "IT", "Finance", "Legal"],
          systems_detected: ["Google Workspace", "Slack", "HRIS", "Payroll"],
          risk_classification: "medium",
          estimated_automation_coverage_percent: 82
        },
        execution_plan: ["step-1", "step-2", "step-3", "step-4"],
        nodes: [
          { id: "dept-hr", type: "department", data: { label: "HR Department", department: "hr", nodeType: "department", riskLevel: "low", status: "pending" }, layout: { lane: "hr", position: 0 } },
          { id: "dept-it", type: "department", data: { label: "IT Department", department: "it", nodeType: "department", riskLevel: "low", status: "pending" }, layout: { lane: "it", position: 0 } },
          { id: "dept-finance", type: "department", data: { label: "Finance", department: "finance", nodeType: "department", riskLevel: "low", status: "pending" }, layout: { lane: "finance", position: 0 } },
          { id: "dept-legal", type: "department", data: { label: "Legal", department: "legal", nodeType: "department", riskLevel: "low", status: "pending" }, layout: { lane: "legal", position: 0 } },
          { id: "step-1", type: "action", data: { label: "Deactivate employee record", department: "hr", system: "HRIS", nodeType: "action", riskLevel: "low", status: "pending" }, layout: { lane: "hr", position: 1 } },
          { id: "step-2", type: "action", data: { label: "Disable Google Workspace", department: "it", system: "Google Workspace", nodeType: "action", riskLevel: "medium", status: "pending" }, layout: { lane: "it", position: 2 } },
          { id: "step-3", type: "action", data: { label: "Revoke Slack Access", department: "it", system: "Slack", nodeType: "action", riskLevel: "medium", status: "pending" }, layout: { lane: "it", position: 3 } },
          { id: "step-4", type: "action", data: { label: "Process final payroll", department: "finance", system: "Payroll", nodeType: "action", riskLevel: "high", status: "pending" }, layout: { lane: "finance", position: 4 } },
        ],
        edges: [
          { id: "e1", source: "dept-hr", target: "step-1" },
          { id: "e2", source: "step-1", target: "step-2" },
          { id: "e-it", source: "dept-it", target: "step-2" },
          { id: "e3", source: "step-2", target: "step-3" },
          { id: "e4", source: "step-3", target: "step-4" },
          { id: "e-fin", source: "dept-finance", target: "step-4" }
        ]
      };
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
