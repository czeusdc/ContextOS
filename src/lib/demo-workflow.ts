// Pre-built demo workflow matching the full ContextOS schema.
// Used by the "Try Live Demo" button on the Upload page to bypass
// Gemini API latency during live demos and hackathon judging.

export const DEMO_WORKFLOW = {
  workflow_name: "Employee Offboarding — TechCorp Inc.",
  target_entity: { name: "Alex Morgan", id: "EMP-89422" },
  employee_name: "Alex Morgan",
  analysis_report: {
    workflow_type: "HR Offboarding — Cross-Department",
    departments_detected: ["HR", "IT", "Finance", "Legal"],
    systems_detected: [
      "BambooHR", "Google Workspace", "Slack Enterprise", "Jira",
      "Workday Payroll", "DocuSign", "VPN Gateway"
    ],
    risk_classification: "high",
    estimated_automation_coverage_percent: 78,
    summary: "Multi-department employee offboarding workflow requiring coordinated access revocation, payroll finalization, and legal document archival. One high-risk financial data export step requires human approval."
  },
  nodes: [
    {
      id: "node-hr-intake",
      type: "action",
      label: "HR Offboarding Intake",
      department: "HR",
      riskLevel: "low",
      layout: { order: 1 },
      data: {
        nodeType: "action",
        label: "HR Offboarding Intake",
        department: "HR",
        riskLevel: "low",
        logic_reasoning: "Initial intake step initiated by HR upon receiving signed resignation or termination documentation. Creates offboarding ticket in HRIS and notifies cross-functional stakeholders.",
        evidenceSources: [{ type: "document", reference: "SOP_OFFBOARD_v3.pdf" }]
      }
    },
    {
      id: "node-vpn-revoke",
      type: "action",
      label: "Revoke VPN & SSO Access",
      department: "IT",
      riskLevel: "high",
      layout: { order: 2 },
      data: {
        nodeType: "action",
        label: "Revoke VPN & SSO Access",
        department: "IT",
        riskLevel: "high",
        logic_reasoning: "Immediately revoke VPN credentials and invalidate all active SSO tokens to prevent unauthorized access from the departing employee's accounts.",
        evidenceSources: [{ type: "document", reference: "SOP_OFFBOARD_v3.pdf" }]
      }
    },
    {
      id: "node-gws-suspend",
      type: "action",
      label: "Suspend Google Workspace Account",
      department: "IT",
      riskLevel: "low",
      layout: { order: 3 },
      data: {
        nodeType: "action",
        label: "Suspend Google Workspace Account",
        department: "IT",
        riskLevel: "low",
        logic_reasoning: "Suspend the Google Workspace account to disable Gmail, Drive, and all Google services. Transfer Drive ownership to direct manager before suspension.",
        evidenceSources: [{ type: "document", reference: "SOP_OFFBOARD_v3.pdf" }]
      }
    },
    {
      id: "node-slack-deactivate",
      type: "action",
      label: "Deactivate Slack User & Revoke Sessions",
      department: "IT",
      riskLevel: "low",
      layout: { order: 4 },
      data: {
        nodeType: "action",
        label: "Deactivate Slack User & Revoke Sessions",
        department: "IT",
        riskLevel: "low",
        logic_reasoning: "Deactivate Slack user account via Admin API and revoke all active session tokens. Export channel membership list for compliance records.",
        evidenceSources: [{ type: "document", reference: "SOP_OFFBOARD_v3.pdf" }]
      }
    },
    {
      id: "node-jira-revoke",
      type: "action",
      label: "Revoke Jira & Confluence Access",
      department: "IT",
      riskLevel: "low",
      layout: { order: 5 },
      data: {
        nodeType: "action",
        label: "Revoke Jira & Confluence Access",
        department: "IT",
        riskLevel: "low",
        logic_reasoning: "Remove user from all Jira projects and Confluence spaces. Reassign open tickets to team lead. Archive personal dashboards.",
        evidenceSources: [{ type: "document", reference: "SOP_OFFBOARD_v3.pdf" }]
      }
    },
    {
      id: "node-payroll-export",
      type: "action",
      label: "Export Final Compensation Report to Vendor",
      department: "Finance",
      riskLevel: "high",
      layout: { order: 6 },
      data: {
        nodeType: "action",
        label: "Export Final Compensation Report to Vendor",
        department: "Finance",
        riskLevel: "high",
        logic_reasoning: "Generate and export the employee's full compensation history, including bonuses and equity vesting schedule, to the third-party payroll vendor. This action involves bulk PII and financial data exfiltration to an external endpoint.",
        evidenceSources: [{ type: "document", reference: "SOP_OFFBOARD_v3.pdf" }]
      }
    },
    {
      id: "node-payroll-finalize",
      type: "action",
      label: "Finalize Last Paycheck & PTO Payout",
      department: "Finance",
      riskLevel: "medium",
      layout: { order: 7 },
      data: {
        nodeType: "action",
        label: "Finalize Last Paycheck & PTO Payout",
        department: "Finance",
        riskLevel: "medium",
        logic_reasoning: "Calculate prorated final paycheck including unused PTO hours (34.5h accrued). Process via Workday payroll cycle. Ensure compliance with local labour law for final pay timing.",
        evidenceSources: [{ type: "document", reference: "SOP_OFFBOARD_v3.pdf" }]
      }
    },
    {
      id: "node-legal-archive",
      type: "action",
      label: "Archive NDA & Exit Agreements via DocuSign",
      department: "Legal",
      riskLevel: "low",
      layout: { order: 8 },
      data: {
        nodeType: "action",
        label: "Archive NDA & Exit Agreements via DocuSign",
        department: "Legal",
        riskLevel: "low",
        logic_reasoning: "Collect all signed exit agreements (NDA, IP assignment, non-compete) via DocuSign and archive to the legal document vault. Trigger 7-year retention policy on all archived documents.",
        evidenceSources: [{ type: "document", reference: "SOP_OFFBOARD_v3.pdf" }]
      }
    }
  ],
  edges: [
    { id: "e1", source: "node-hr-intake", target: "node-vpn-revoke", label: "initiates" },
    { id: "e2", source: "node-vpn-revoke", target: "node-gws-suspend", label: "then" },
    { id: "e3", source: "node-vpn-revoke", target: "node-slack-deactivate", label: "parallel" },
    { id: "e4", source: "node-vpn-revoke", target: "node-jira-revoke", label: "parallel" },
    { id: "e5", source: "node-gws-suspend", target: "node-payroll-export", label: "then" },
    { id: "e6", source: "node-payroll-export", target: "node-payroll-finalize", label: "after approval" },
    { id: "e7", source: "node-payroll-finalize", target: "node-legal-archive", label: "finally" }
  ]
};

export const DEMO_FILE_NAME = "employee_offboarding_demo.pdf";
