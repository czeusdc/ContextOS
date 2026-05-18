/**
 * Simulated Gemini responses for all 4 chat surfaces.
 * Used when aiModel === 'gemini-simulated' or API limit is reached.
 * Keyword-matched with graceful fallback.
 */

// ─── Shared off-topic refusal ──────────────────────────────────────────────

export const OFF_TOPIC_REFUSAL =
  "I can only assist with questions about this workflow's execution, security posture, and governance findings. Please ask about the workflow steps, risk assessment, compliance events, or execution results.";

// ─── Keyword matching ──────────────────────────────────────────────────────

type ResponseMap = Array<{ keywords: string[]; response: string }>;

function matchResponse(question: string, map: ResponseMap): string {
  const q = question.toLowerCase();
  for (const entry of map) {
    if (entry.keywords.some(kw => q.includes(kw))) {
      return entry.response;
    }
  }
  return OFF_TOPIC_REFUSAL;
}

// ─── Graph page — Workflow Analyst ─────────────────────────────────────────

const GRAPH_RESPONSES: ResponseMap = [
  {
    keywords: ['risk', 'policy', 'compliance', 'violation', 'control', 'regulation'],
    response:
      'This workflow contains one high-risk node: the payroll data export step. SEC-447 (Data Exfiltration Guard) is pre-configured to trigger automatically at this node, requiring manual governance approval before any data transfer proceeds to the external payroll vendor.',
  },
  {
    keywords: ['step', 'node', 'task', 'action', 'department', 'how many', 'what does', 'order', 'sequence', 'flow'],
    response:
      'The HR Offboarding workflow contains 7 sequential action nodes across 4 departments — HR (HRIS state transition), IT (Google Workspace suspension & Drive transfer), Slack (session deprovisioning), and Finance (payroll export + final paycheck). Each node is executed autonomously by its designated department agent in dependency order.',
  },
  {
    keywords: ['security', 'block', 'guard', 'intercept', 'sec-', 'iam', 'threat', 'anomaly', 'detect'],
    response:
      'The workflow has one pre-identified security intercept point at the payroll export node. This step triggers SEC-447 and IAM-104 simultaneously, requiring zero-trust verification through the Veea edge enclave before any data leaves the enterprise boundary. No data exfiltration occurs until human approval is confirmed.',
  },
  {
    keywords: ['pay', 'salary', 'finance', 'payroll', 'money', 'compensation', 'final', 'check', 'amount'],
    response:
      'The Finance agent handles two nodes: the payroll export (intercepted by SEC-447) and the final paycheck calculation. All financial figures in these steps are automatically classified as HIGH risk and subject to DLP-003 redaction before appearing in any log output. The exact payout amount is masked as [REDACTED-FINANCIAL].',
  },
  {
    keywords: ['employee', 'sarah', 'user', 'emp', 'who', 'offboard', 'terminate', 'off-board'],
    response:
      'This workflow is configured for employee EMP-89422 (Sarah Chen), transitioning from Active to Pending_Offboard status. The orchestration coordinates access revocation across 4 enterprise systems — HRIS, Google Workspace, Slack, and Workday Payroll — within a single automated governance run.',
  },
];

export function getGraphSimulatedResponse(question: string): string {
  return matchResponse(question, GRAPH_RESPONSES);
}

// ─── Execute page — Execution Console ─────────────────────────────────────

const EXECUTE_RESPONSES: ResponseMap = [
  {
    keywords: ['status', 'progress', 'done', 'complete', 'finish', 'current', 'running', 'how far'],
    response:
      'The workflow execution has completed all 7 orchestration steps. The orchestrator processed HR deprovisioning, IT access revocation, Slack session termination, and Finance payroll finalization in sequence. All steps were resolved through the ContextOS governance engine with one escalation event.',
  },
  {
    keywords: ['block', 'security', 'sec-447', 'intercept', 'guard', 'stop', 'prevent', 'escalation'],
    response:
      'ContextOS intercepted the payroll export action via the SEC-447 Data Exfiltration Guard. The action was held in the Veea Trusted Edge Enclave for zero-trust IAM verification. After human approval was received, the orchestrator resumed execution and the workflow completed successfully.',
  },
  {
    keywords: ['log', 'output', 'message', 'console', 'what happened', 'show', 'display', 'result'],
    response:
      'The execution console shows a complete audit trail of all 7 agent actions. Key events include the HRIS state transition, Google Workspace suspension, Slack SCIM deprovisioning, the SEC-447 security intercept, IAM verification hold, payroll calculation, and the final legal document archival.',
  },
  {
    keywords: ['error', 'fail', 'issue', 'problem', 'wrong', 'retry', 'timeout'],
    response:
      'No critical errors occurred during this execution run. The Slack API reported a transient SCIM timeout which was automatically retried successfully. The SEC-447 intercept was an expected governance event, not an error — it was resolved through the standard manual approval process.',
  },
  {
    keywords: ['time', 'duration', 'long', 'fast', 'slow', 'speed', 'how long'],
    response:
      'The workflow execution completed within the expected time window for a 7-node offboarding process. Execution speed can be adjusted using the speed control (1×, 3×, 10×) at the top of the console. The IAM verification hold accounts for the majority of the elapsed time.',
  },
];

export function getExecuteSimulatedResponse(question: string): string {
  return matchResponse(question, EXECUTE_RESPONSES);
}

// ─── Report page — Platform Intelligence ──────────────────────────────────

const PLATFORM_RESPONSES: ResponseMap = [
  {
    keywords: ['run', 'history', 'total', 'how many', 'count', 'record', 'session', 'previous'],
    response:
      'The intelligence report shows the completed workflow runs for this session. Each run record captures the workflow name, node count, risk classification, escalation outcome, security events, and a full execution log snapshot — providing a complete governance audit trail.',
  },
  {
    keywords: ['security', 'block', 'compliance', 'violation', 'risk', 'threat', 'policy', 'posture'],
    response:
      'Across all recorded runs, ContextOS maintained a 100% containment rate on high-risk operations. The SEC-447 policy successfully blocked unauthorized financial data exfiltration, and IAM-104 enforced zero-trust verification before any privileged action proceeded. No unresolved violations are present.',
  },
  {
    keywords: ['export', 'pdf', 'report', 'download', 'generate', 'document'],
    response:
      'Use the "Export PDF" button at the top of the report page to generate a professionally formatted intelligence report. The PDF includes executive KPIs, compliance posture, run history, and the full audit log with ContextOS, Gemini, and Veea branding.',
  },
  {
    keywords: ['trend', 'pattern', 'analytic', 'insight', 'performance', 'metric'],
    response:
      'Based on the current run data, all workflow executions have followed the expected governance path with no unresolved policy violations. The Finance department consistently triggers the highest-risk security events, confirming that the DLP-003 and SEC-447 controls are functioning as designed.',
  },
];

export function getPlatformSimulatedResponse(question: string): string {
  return matchResponse(question, PLATFORM_RESPONSES);
}

// ─── Report page — Run Detail Modal chat ───────────────────────────────────

const RUN_DETAIL_RESPONSES: ResponseMap = [
  {
    keywords: ['risk', 'classify', 'level', 'severity', 'high', 'medium', 'low'],
    response:
      'This run was classified as high risk due to the payroll data export node. The risk classification is determined by the highest-risk node in the workflow — in this case, the Finance department\'s bulk PII and financial data export operation.',
  },
  {
    keywords: ['escalation', 'approval', 'human', 'manual', 'review', 'decision'],
    response:
      'This run triggered one escalation event at the payroll export node. The SEC-447 guardrail held execution pending human approval. After governance clearance was confirmed, the orchestrator resumed and completed the remaining steps successfully.',
  },
  {
    keywords: ['step', 'complete', 'finish', 'node', 'success', 'done'],
    response:
      'All action nodes in this run completed successfully after the governance escalation was resolved. Completed steps include HRIS transition, GWS suspension, Drive transfer, Slack deprovisioning, payroll export (after approval), payroll finalization, and legal archival.',
  },
  {
    keywords: ['security', 'event', 'block', 'pass', 'review', 'guard'],
    response:
      'This run generated security events processed through the Veea zero-trust governance layer. Events included a PII pre-flight PASS (DLP-003), a BLOCK event (SEC-447 Data Exfiltration Guard), and a REVIEW event (IAM-104 Zero-Trust Token Verification) — all resolved without uncontained violations.',
  },
];

export function getRunDetailSimulatedResponse(question: string): string {
  return matchResponse(question, RUN_DETAIL_RESPONSES);
}

// ─── Simulated workflow analysis response (for Analysis page) ──────────────

export const SIMULATED_ANALYSIS_LOGS = [
  'SYSTEM: Initializing cognitive engine...',
  'SYSTEM: Starting document extraction and parsing...',
  'ANALYST: Document structure recognized. Parsing offboarding procedure...',
  'ANALYST: Identified 7 action steps across 4 departments.',
  'SECURITY: Evaluating compliance perimeters. 1 high-risk node flagged.',
  'SYSTEMS: Mapping discovered systems: HRIS, Google Workspace, Slack, Workday Payroll.',
  'ORCHESTRATOR: Constructing directed acyclic graph for orchestrator engine...',
  'SYSTEM: All agents completed. Simulation mode active — workflow ready.',
];
