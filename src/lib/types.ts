export interface WorkflowNode {
  id: string;
  type?: string;
  position?: { x: number; y: number };
  data: any;
  layout?: any;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
}

export interface WorkflowPayload {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  workflow_name?: string;
  analysis_report?: AnalysisReport;
}

export interface AnalysisReport {
  summary?: string;
  risk_classification?: string;
  identified_systems?: string[];
  pii_detected?: boolean;
  compliance_flags?: string[];
}
