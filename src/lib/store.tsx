import { createContext, useContext, useState, ReactNode } from 'react';
import { WorkflowPayload } from './types';

export type UploadStatus = 'idle' | 'analyzing' | 'redacting' | 'extracting' | 'identifying' | 'done';
export type RunStatus = 'idle' | 'running' | 'completed';

export const AI_MODELS = [
  'gemini-3.1-pro-preview',
  'gemini-3-flash-preview',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-simulated',
] as const;

export type AIModel = typeof AI_MODELS[number];

interface ContextOSState {
  uploadStatus: UploadStatus;
  setUploadStatus: (status: UploadStatus) => void;
  runStatus: RunStatus;
  setRunStatus: (status: RunStatus) => void;
  activeNodeId: string | null;
  setActiveNodeId: (id: string | null) => void;
  workflow: WorkflowPayload | null;
  setWorkflow: (workflow: WorkflowPayload | null) => void;
  aiModel: AIModel;
  setAiModel: (model: AIModel) => void;
  filePayload: any | null;
  setFilePayload: (payload: any | null) => void;
  fileName: string | null;
  setFileName: (name: string | null) => void;
  uploadedFiles: File[];
  setUploadedFiles: (files: File[]) => void;
  hasRedactedPII: boolean;
  setHasRedactedPII: (val: boolean) => void;
  analysisLogs: string[];
  setAnalysisLogs: (logs: string[] | ((prev: string[]) => string[])) => void;
  analysisStage: 'extracting' | 'understanding' | 'planning' | 'done';
  setAnalysisStage: (stage: 'extracting' | 'understanding' | 'planning' | 'done') => void;
  discoveredConnections: Array<{ name: string, type: 'api' | 'oauth' | 'sdk' }>;
  setDiscoveredConnections: (conns: Array<{ name: string, type: 'api' | 'oauth' | 'sdk' }> | ((prev: Array<{ name: string, type: 'api' | 'oauth' | 'sdk' }>) => Array<{ name: string, type: 'api' | 'oauth' | 'sdk' }>)) => void;
  hasStartedAnalysis: boolean;
  setHasStartedAnalysis: (val: boolean) => void;
}

const StoreContext = createContext<ContextOSState | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [runStatus, setRunStatus] = useState<RunStatus>('idle');
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowPayload | null>(null);
  const [aiModel, setAiModel] = useState<AIModel>('gemini-3-flash-preview');
  const [filePayload, setFilePayload] = useState<any | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [hasRedactedPII, setHasRedactedPII] = useState<boolean>(false);
  const [analysisLogs, setAnalysisLogs] = useState<string[]>([]);
  const [analysisStage, setAnalysisStage] = useState<'extracting' | 'understanding' | 'planning' | 'done'>('extracting');
  const [discoveredConnections, setDiscoveredConnections] = useState<Array<{ name: string, type: 'api' | 'oauth' | 'sdk' }>>([]);
  const [hasStartedAnalysis, setHasStartedAnalysis] = useState<boolean>(false);

  return (
    <StoreContext.Provider
      value={{
        uploadStatus,
        setUploadStatus,
        runStatus,
        setRunStatus,
        activeNodeId,
        setActiveNodeId,
        workflow,
        setWorkflow,
        aiModel,
        setAiModel,
        filePayload,
        setFilePayload,
        fileName,
        setFileName,
        uploadedFiles,
        setUploadedFiles,
        hasRedactedPII,
        setHasRedactedPII,
        analysisLogs,
        setAnalysisLogs,
        analysisStage,
        setAnalysisStage,
        discoveredConnections,
        setDiscoveredConnections,
        hasStartedAnalysis,
        setHasStartedAnalysis,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
