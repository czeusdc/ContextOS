export const WORKFLOW_RULES = `
BUSINESS LOGIC RULES:

1. HR is ALWAYS the entry point.
2. IT depends on HR completion.
3. Finance depends on IT completion.
4. Legal depends on Finance completion.
5. Security can intervene at any stage.

NODE GENERATION:
- 18–28 total nodes
- 4–6 departments
- 5–10 systems
- 8–15 actions

SYSTEMS (only use these unless necessary):
- HRIS
- Google Workspace
- Slack
- Jira
- Payroll System
- Compliance Vault

RISK MODEL:
- high: payroll, credentials, PII, legal records
- medium: access changes, account updates
- low: notifications, archival

EDGE RULES:
- animated = true ONLY for cross-department edges
- animated = false for internal flows
- graph must be DAG (no cycles)

LAYOUT RULES:
- lane defines vertical grouping
- position defines ordering inside lane
- do NOT output x/y coordinates

EXECUTION RULES:
- execution_plan must be strictly sequential
- must include ALL action nodes
- must reflect real operational order, not visual order

QUALITY RULES:
- Extract a concise, accurate workflow title based on the uploaded SOP and store it in workflow_name.
- avoid duplicates
- avoid generic tasks
- ensure at least 2 cross-department handoffs
- ensure at least 1 high-risk node
- For every 'action' node, provide a 1-sentence 'logic_reasoning' string inside the 'data' object explaining WHY this step is required for the specific department's compliance.

FAILSAFE:
If input is unclear → assume "Employee Offboarding Workflow"
`;