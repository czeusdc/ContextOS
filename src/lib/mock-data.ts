import { Edge } from '@xyflow/react';

export interface WorkflowNode {
  id: string;
  type: 'department' | 'system' | 'action';
  label: string;
  status: 'pending' | 'active' | 'completed' | 'blocked';
  department?: 'hr' | 'it' | 'finance' | 'legal';
  dependsOn?: string[];
}

// React Flow initial nodes
export const initialNodes = [
  // Departments
  { id: 'dept-hr', type: 'default', position: { x: 250, y: 50 }, data: { label: 'Human Resources' }, className: 'bg-[#16161e] border-2 border-indigo-500/50 rounded-xl px-6 py-4 shadow-2xl shadow-indigo-500/10 text-white font-semibold text-sm' },
  { id: 'dept-it', type: 'default', position: { x: 250, y: 250 }, data: { label: 'Information Technology' }, className: 'bg-[#16161e] border-2 border-indigo-500/50 rounded-xl px-6 py-4 shadow-2xl shadow-indigo-500/10 text-white font-semibold text-sm' },
  { id: 'dept-finance', type: 'default', position: { x: 250, y: 450 }, data: { label: 'Finance & Payroll' }, className: 'bg-[#16161e] border-2 border-indigo-500/50 rounded-xl px-6 py-4 shadow-2xl shadow-indigo-500/10 text-white font-semibold text-sm' },
  { id: 'dept-legal', type: 'default', position: { x: 250, y: 650 }, data: { label: 'Legal & Compliance' }, className: 'bg-[#16161e] border-2 border-indigo-500/50 rounded-xl px-6 py-4 shadow-2xl shadow-indigo-500/10 text-white font-semibold text-sm' },

  // IT Actions
  { id: 'sys-gws', type: 'default', position: { x: 550, y: 150 }, data: { label: 'Google Workspace' }, className: 'bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 ring-1 ring-indigo-500/50 text-white text-xs' },
  { id: 'act-gws-suspend', type: 'default', position: { x: 780, y: 150 }, data: { label: 'Suspend Account' }, className: 'bg-[#16161e] border border-white/5 rounded-lg px-3 py-2 opacity-80 text-white text-[11px]' },
  
  { id: 'sys-slack', type: 'default', position: { x: 550, y: 250 }, data: { label: 'Slack' }, className: 'bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 ring-1 ring-indigo-500/50 text-white text-xs' },
  { id: 'act-slack-deactivate', type: 'default', position: { x: 780, y: 250 }, data: { label: 'Deactivate User' }, className: 'bg-[#16161e] border border-white/5 rounded-lg px-3 py-2 opacity-80 text-white text-[11px]' },
  
  { id: 'sys-jira', type: 'default', position: { x: 550, y: 350 }, data: { label: 'Jira' }, className: 'bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 ring-1 ring-indigo-500/50 text-white text-xs' },
  { id: 'act-jira-revoke', type: 'default', position: { x: 780, y: 350 }, data: { label: 'Revoke Access' }, className: 'bg-[#16161e] border border-white/5 rounded-lg px-3 py-2 opacity-80 text-white text-[11px]' },

  // Finance Actions
  { id: 'sys-payroll', type: 'default', position: { x: 550, y: 450 }, data: { label: 'Workday Payroll' }, className: 'bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 ring-1 ring-indigo-500/50 text-white text-xs' },
  { id: 'act-payroll-finalize', type: 'default', position: { x: 780, y: 450 }, data: { label: 'Finalize Last Paycheck' }, className: 'bg-[#16161e] border border-white/5 rounded-lg px-3 py-2 opacity-80 text-white text-[11px]' },

  // Legal Actions
  { id: 'sys-docusign', type: 'default', position: { x: 550, y: 650 }, data: { label: 'DocuSign' }, className: 'bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 ring-1 ring-indigo-500/50 text-white text-xs' },
  { id: 'act-nda-archive', type: 'default', position: { x: 780, y: 650 }, data: { label: 'Archive NDA' }, className: 'bg-red-500/5 border border-red-500/30 border-dashed rounded-xl px-4 py-3 text-white text-xs ring-1 ring-red-500/50' },
];

export const initialEdges: Edge[] = [
  // HR starts it
  { id: 'e-hr-it', source: 'dept-hr', target: 'dept-it', animated: true, style: { stroke: '#4f46e5' } },
  
  // IT flows
  { id: 'e-it-gws', source: 'dept-it', target: 'sys-gws' },
  { id: 'e-it-slack', source: 'dept-it', target: 'sys-slack' },
  { id: 'e-it-jira', source: 'dept-it', target: 'sys-jira' },
  { id: 'e-gws-act', source: 'sys-gws', target: 'act-gws-suspend' },
  { id: 'e-slack-act', source: 'sys-slack', target: 'act-slack-deactivate' },
  { id: 'e-jira-act', source: 'sys-jira', target: 'act-jira-revoke' },
  
  // IT to Finance
  { id: 'e-it-fin', source: 'dept-it', target: 'dept-finance', animated: true, style: { stroke: '#4f46e5' } },
  
  // Finance flows
  { id: 'e-fin-payroll', source: 'dept-finance', target: 'sys-payroll' },
  { id: 'e-payroll-act', source: 'sys-payroll', target: 'act-payroll-finalize' },
  
  // Finance to Legal
  { id: 'e-fin-leg', source: 'dept-finance', target: 'dept-legal', animated: true, style: { stroke: '#4f46e5' } },
  
  // Legal paths
  { id: 'e-leg-doc', source: 'dept-legal', target: 'sys-docusign' },
  { id: 'e-doc-act', source: 'sys-docusign', target: 'act-nda-archive' }
];

export const mockLogs = [
  "[14:02:01.100] [HR_CORE] Received signed offboarding document for employee_id=89234",
  "[14:02:01.250] [ORCHESTRATOR] Initializing multi-department offboarding workflow",
  "[14:02:02.050] [GWS_ADMIN] Suspending Google Workspace account: alex.doe@enterprise.com",
  "[14:02:02.800] [GWS_ADMIN] Transferred Drive ownership to manager_id=1023",
  "[14:02:03.120] [SLACK_API] Deactivating user U98234XYZ",
  "[14:02:03.950] [JIRA_ADMIN] Revoking site access for user and removing from groups",
  "[14:02:04.500] [WORKDAY] Generating final paycheck calculation",
  "[14:02:05.100] [WORKDAY] Prorating PTO balance: 34.5 hours",
  "[14:02:05.800] [DOCUSIGN] Archiving employee exit agreements to legal vault",
  "[14:02:06.000] [ORCHESTRATOR] Workflow execution completed successfully."
];

export const mockBlockedAction = {
  action: "EXPORT ALL EXECUTIVE SALARY RECORDS",
  system: "Workday Payroll",
  timestamp: "14:01:55.200",
  riskScore: 94,
  policy: "PII Exfiltration Prevention",
  status: "DENIED"
};

export const promptFeeds = [
  { status: 'PASS', text: 'Extract user email from HR exit form PDF' },
  { status: 'PASS', text: 'Identify Google Workspace API deprecations for suspend method' },
  { status: 'BLOCK', text: 'EXPORT ALL EXECUTIVE SALARY RECORDS TO TMP.CSV' },
  { status: 'PASS', text: 'Calculate prorated PTO hours based on departure date' }
];
