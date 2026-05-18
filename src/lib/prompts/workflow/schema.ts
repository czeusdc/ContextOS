export const WORKFLOW_SCHEMA = `
Return JSON in this exact structure:

{
  "workflow_name": "string",
  "workflow_summary": "string",

  "analysis_report": {
    "workflow_type": "string",
    "departments_detected": ["string"],
    "systems_detected": ["string"],
    "risk_classification": "low | medium | high",
    "estimated_automation_coverage_percent": number
  },

  "_reasoning": ["string"],

  "nodes": [
    {
      "id": "string",
      "type": "default",
      "layout": {
        "lane": "hr | it | finance | legal | security | operations",
        "position": number
      },
      "data": {
        "label": "string",
        "nodeType": "department | system | action",
        "department": "hr | it | finance | legal | security | operations",
        "status": "pending",
        "description": "string",
        "logic_reasoning": "string",
        "dependsOn": ["string"],
        "riskLevel": "low | medium | high"
      }
    }
  ],

  "edges": [
    {
      "id": "string",
      "source": "string",
      "target": "string",
      "label": "string",
      "animated": boolean,
      "style": { "stroke": "#4f46e5" }
    }
  ],

  "execution_plan": [
    {
      "step": number,
      "node_id": "string",
      "action": "string",
      "department": "string",
      "estimated_duration_sec": number,
      "depends_on": ["string"]
    }
  ],

  "ui_metadata": {
    "primary_flow_direction": "top-down",
    "layout_hint": "balanced",
    "animation_intensity": "medium",
    "highlight_strategy": "cross_department_edges",
    "execution_mode": "sequential"
  }
}
`;