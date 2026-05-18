import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { WorkflowPayload } from '@/lib/types';

export interface ExecutionLog {
  id: string;
  timestamp: string;
  message: string;
}

export interface SecurityEvent {
  id: string;
  status: 'PASS' | 'BLOCK' | 'REVIEW';
  message: string;
  timestamp: string;
  policyContext?: string;
}

export interface SystemStates {
  hr: { employee: string; employment: string; payroll: string };
  slack: { sessionsRevoked: number; access: string };
  google: { accountSuspended: boolean; driveTransfer: string };
}

export interface EscalationDetails {
  policy: string;
  riskLevel: string;
  department: string;
  requestedAction: string;
  reason: string;
  nodeId: string;
}

export interface RunRecord {
  id: string;
  completedAt: string;
  workflowName: string;
  workflowSnapshot: WorkflowPayload;
  executionLogs: ExecutionLog[];
  analysisLogs: string[];
  securityEvents: SecurityEvent[];
  systemStatesSnapshot: SystemStates;
  durationSeconds: number;
  completedSteps: string[];
  failedSteps: string[];
  escalationOutcome: 'none' | 'approved' | 'denied';
  escalationDetails: EscalationDetails | null;
  riskClassification: string;
  nodesCount: number;
}

export interface WorkflowRuntimeState {
  workflow: WorkflowPayload | null;
  selectedNodeId: string | null;
  executionState: {
    running: boolean;
    currentStep: number;
    completedSteps: string[];
    failedSteps: string[];
    logs: ExecutionLog[];
    escalationStatus: 'none' | 'pending' | 'approved' | 'denied';
    escalationDetails: EscalationDetails | null;
  };
  securityEvents: SecurityEvent[];
  systemStates: SystemStates;
  runHistory: RunRecord[];
}

interface WorkflowRuntimeContextValue {
  state: WorkflowRuntimeState;
  setWorkflow: (workflow: WorkflowPayload | null) => void;
  setSelectedNodeId: (id: string | null) => void;
  startExecution: () => void;
  stopExecution: () => void;
  resetExecution: () => void;
  addLog: (log: ExecutionLog) => void;
  addSecurityEvent: (event: SecurityEvent) => void;
  completeStep: (stepId: string) => void;
  failStep: (stepId: string) => void;
  abortStep: (stepId: string) => void;
  updateSystemState: (system: keyof SystemStates, data: Partial<SystemStates[keyof SystemStates]>) => void;
  triggerEscalation: (details: EscalationDetails) => Promise<'approved' | 'denied'>;
  resolveEscalation: (status: 'approved' | 'denied') => void;
  createAndAddRunRecord: (workflowDetails: WorkflowPayload, analysisLogs: string[], durationSeconds: number) => void;
}

const WorkflowRuntimeContext = createContext<WorkflowRuntimeContextValue | undefined>(undefined);

const initialSystemStates: SystemStates = {
  hr: { employee: 'Sarah Chen', employment: 'Active', payroll: 'Active' },
  slack: { sessionsRevoked: 0, access: 'Active' },
  google: { accountSuspended: false, driveTransfer: 'Pending' },
};

export function WorkflowRuntimeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkflowRuntimeState>({
    workflow: null,
    selectedNodeId: null,
    executionState: {
      running: false,
      currentStep: 0,
      completedSteps: [],
      failedSteps: [],
      logs: [],
      escalationStatus: 'none',
      escalationDetails: null
    },
    securityEvents: [],
    systemStates: initialSystemStates,
    runHistory: [],
  });

  const setWorkflow = (workflow: WorkflowPayload | null) => {
    setState(prev => ({ ...prev, workflow }));
  };

  const setSelectedNodeId = (id: string | null) => {
    setState(prev => ({ ...prev, selectedNodeId: id }));
  };

  const createAndAddRunRecord = (workflowDetails: WorkflowPayload, analysisLogs: string[], durationSeconds: number) => {
    setState(prev => {
      const record: RunRecord = {
        id: 'RUN-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        completedAt: new Date().toISOString(),
        workflowName: workflowDetails?.workflow_name || 'Enterprise Workflow',
        workflowSnapshot: JSON.parse(JSON.stringify(workflowDetails)),
        executionLogs: [...prev.executionState.logs],
        analysisLogs: [...analysisLogs],
        securityEvents: [...prev.securityEvents],
        systemStatesSnapshot: JSON.parse(JSON.stringify(prev.systemStates)),
        durationSeconds,
        completedSteps: [...prev.executionState.completedSteps],
        failedSteps: [...prev.executionState.failedSteps],
        escalationOutcome: prev.executionState.escalationStatus as any,
        escalationDetails: prev.executionState.escalationDetails,
        riskClassification: workflowDetails?.analysis_report?.risk_classification || 'medium',
        nodesCount: (workflowDetails?.nodes || []).length,
      };

      return {
        ...prev,
        runHistory: [record, ...prev.runHistory],
        // securityEvents intentionally NOT cleared here — /security page needs them after navigation.
        // They are cleared in resetExecution() when the user explicitly re-runs.
      };
    });
  };

  const startExecution = () => {
    setState(prev => ({
      ...prev,
      executionState: { ...prev.executionState, running: true },
    }));
  };

  const stopExecution = () => {
    setState(prev => ({
      ...prev,
      executionState: { ...prev.executionState, running: false },
    }));
  };

  const resetExecution = () => {
    setState(prev => ({
      ...prev,
      executionState: {
        running: false,
        currentStep: 0,
        completedSteps: [],
        failedSteps: [],
        logs: [],
        escalationStatus: 'none',
        escalationDetails: null
      },
      securityEvents: [], // Clear for the next run
      systemStates: initialSystemStates,
    }));
  };

  const addLog = (log: ExecutionLog) => {
    setState(prev => ({
      ...prev,
      executionState: {
        ...prev.executionState,
        logs: [...prev.executionState.logs, log],
      },
    }));
  };

  const addSecurityEvent = (event: SecurityEvent) => {
    setState(prev => ({
      ...prev,
      securityEvents: [event, ...prev.securityEvents],
    }));
  };

  const completeStep = (stepId: string) => {
    setState(prev => ({
      ...prev,
      executionState: {
        ...prev.executionState,
        completedSteps: [...prev.executionState.completedSteps, stepId],
        currentStep: prev.executionState.currentStep + 1,
      },
    }));
  };

  const failStep = (stepId: string) => {
    setState(prev => ({
      ...prev,
      executionState: {
        ...prev.executionState,
        failedSteps: [...prev.executionState.failedSteps, stepId],
      },
    }));
  };

  const abortStep = (stepId: string) => {
    setState(prev => ({
      ...prev,
      executionState: {
        ...prev.executionState,
        failedSteps: [...prev.executionState.failedSteps, stepId], // Treating abort as failed visually or keeping it identical
      },
    }));
  }

  const updateSystemState = (system: keyof SystemStates, data: any) => {
    setState(prev => ({
      ...prev,
      systemStates: {
        ...prev.systemStates,
        [system]: {
          ...prev.systemStates[system],
          ...data,
        },
      },
    }));
  };

  const resolveEscalationRef = useRef<((status: 'approved' | 'denied') => void) | null>(null);

  const triggerEscalation = (details: EscalationDetails) => {
    return new Promise<'approved' | 'denied'>((resolve) => {
      resolveEscalationRef.current = resolve;
      setState(prev => ({
        ...prev,
        executionState: {
          ...prev.executionState,
          escalationStatus: 'pending',
          escalationDetails: details,
        }
      }));
    });
  };

  const resolveEscalation = (status: 'approved' | 'denied') => {
    if (resolveEscalationRef.current) {
      resolveEscalationRef.current(status);
      resolveEscalationRef.current = null;
    }
    setState(prev => ({
      ...prev,
      executionState: {
        ...prev.executionState,
        escalationStatus: status,
      }
    }));
  };

  return (
    <WorkflowRuntimeContext.Provider
      value={{
        state,
        setWorkflow,
        setSelectedNodeId,
        startExecution,
        stopExecution,
        resetExecution,
        addLog,
        addSecurityEvent,
        completeStep,
        failStep,
        abortStep,
        updateSystemState,
        triggerEscalation,
        resolveEscalation,
        createAndAddRunRecord
      }}
    >
      {children}
    </WorkflowRuntimeContext.Provider>
  );
}

export function useWorkflowRuntime() {
  const context = useContext(WorkflowRuntimeContext);
  if (context === undefined) {
    throw new Error('useWorkflowRuntime must be used within a WorkflowRuntimeProvider');
  }
  return context;
}
