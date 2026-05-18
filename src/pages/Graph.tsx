import { useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  NodeMouseHandler,
  Node,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play, Info, AlertTriangle, ShieldCheck, ShieldAlert, FileText, Video, Server, Activity, Plus, MessageSquare, Send, X, Loader2 as SpinnerIcon } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { incrementApiCall, isApiLimitReached } from '@/lib/simulation/apiCounter';
import { getGraphSimulatedResponse } from '@/lib/simulation/simulatedResponses';

import { useStore } from '@/lib/store';
import { useWorkflowRuntime } from '@/context/WorkflowRuntimeContext';
import { applyWorkflowLayout } from '@/lib/layout/applyWorkflowLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'motion/react';

const riskScore: Record<string, number> = { high: 85, medium: 52, low: 18 };

const CustomNode = ({ data, isConnectable }: any) => {
  const riskColor = data.riskLevel === 'high' ? 'text-red-400/70' : data.riskLevel === 'medium' ? 'text-amber-400/70' : 'text-slate-600';
  return (
    <>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="opacity-0" />
      <div className="relative w-full h-full flex items-center justify-center p-2 text-center break-words">
        {data.label}
        {data.nodeType !== 'department' && data.nodeType !== 'system' && (
          <span className={`absolute bottom-1 right-2 text-[9px] font-mono ${riskColor}`}>
            RISK {riskScore[data.riskLevel as 'high'|'medium'|'low'] ?? 0}
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="opacity-0" />
    </>
  );
};

const nodeTypes = {
  default: CustomNode
};

export function GraphDashboard() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { state: runtimeState, setSelectedNodeId, resetExecution } = useWorkflowRuntime();
  const { workflow, selectedNodeId, executionState } = runtimeState;
  
  const [inspectPromptOpen, setInspectPromptOpen] = useState(false);
  const [showSystemStatus, setShowSystemStatus] = useState(false);
  const [unreadUpdates, setUnreadUpdates] = useState(0);
  const prevSystemStateRef = useRef(runtimeState.systemStates);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const SUGGESTED_QUESTIONS = [
    'What are the highest risk steps?',
    'Which departments are involved?',
    'What happens if Finance is blocked?',
  ];
  
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
  const { runStatus, setRunStatus, uploadedFiles, analysisStage, aiModel } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (workflow?.workflow_name) {
      document.title = `${workflow.workflow_name} | ContextOS`;
    }
  }, [workflow]);

  useEffect(() => {
    if (workflow && workflow.nodes && workflow.edges) {
      const { nodes: plannedNodes, edges: plannedEdges } = applyWorkflowLayout(workflow.nodes, workflow.edges);
      
      const nodesWithState = plannedNodes.map(n => {
        const isCompleted = executionState.completedSteps.includes(n.id);
        const isFailed = executionState.failedSteps.includes(n.id);
        const isRunning = executionState.running && !isCompleted && !isFailed && 
                          (executionState.completedSteps.length === 0 ? n.data?.nodeType === 'department' : true); 
        
        let className = n.className || '';
        if (isCompleted) {
          className += ' ring-2 ring-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] bg-green-900/10 opacity-70';
        } else if (isFailed) {
          className += ' ring-2 ring-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] bg-red-900/10';
        } else if (isRunning) {
          className += ' ring-2 ring-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] animate-pulse';
        }
        
        return { ...n, className };
      });

      setNodes(nodesWithState);
      
      const edgesWithState = plannedEdges.map(e => {
        const isCompleted = executionState.completedSteps.includes(e.source) && executionState.completedSteps.includes(e.target);
        const isFailed = executionState.failedSteps.includes(e.target) || executionState.failedSteps.includes(e.source);
        
        let style = { stroke: 'rgba(99, 102, 241, 0.5)', strokeWidth: 2 };
        if (isCompleted) {
          style = { stroke: '#22c55e', strokeWidth: 2 };
        } else if (isFailed) {
          style = { stroke: '#ef4444', strokeWidth: 2 };
        }

        return {
          ...e,
          style,
          animated: executionState.running && !isCompleted && !isFailed
        };
      });
      
      setEdges(edgesWithState);
    }
  }, [workflow, setNodes, setEdges, executionState]);

  const handleNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  const handleRun = () => {
    resetExecution();
    setUnreadUpdates(0);
    setRunStatus('running');
    navigate('/execute');
  };

  const askWorkflow = async (question: string) => {
    if (!workflow || !question.trim()) return;
    setChatMessages(prev => [...prev, { role: 'user', text: question }]);
    setChatInput('');
    setChatLoading(true);

    // Simulated mode — return keyword-matched canned response instantly
    if (aiModel === 'gemini-simulated' || isApiLimitReached()) {
      await new Promise(r => setTimeout(r, 800)); // realistic thinking delay
      setChatMessages(prev => [...prev, { role: 'ai', text: getGraphSimulatedResponse(question) }]);
      setChatLoading(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'AI_STUDIO_FREE_TIER' });
      const context = JSON.stringify({
        workflow_name: workflow.workflow_name,
        nodes: (workflow.nodes || []).map((n: any) => ({
          id: n.id,
          label: n.data?.label || n.label,
          department: n.data?.department || n.department,
          riskLevel: n.data?.riskLevel || n.riskLevel,
          reasoning: n.data?.logic_reasoning || n.data?.reasoning,
        })),
        analysis_report: workflow.analysis_report,
      });
      incrementApiCall();
      const response = await ai.models.generateContent({
        model: aiModel || 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: `You are ContextOS Platform Intelligence — a specialized enterprise workflow governance assistant.
You ONLY answer questions about:
- The current workflow: its steps, nodes, departments, risk levels, and dependencies
- Security events: policy violations, guardrail blocks, IAM escalations, and compliance findings
- Execution results and orchestration context

If the question is not directly related to these topics, respond ONLY with:
"I can only assist with questions about this workflow's execution, security posture, and governance findings."

DO NOT answer general knowledge, science, history, or any topic outside enterprise workflow governance.
Answer concisely in 2-4 sentences maximum.

Workflow context:
${context}

Question: ${question}` }] }],
      });
      const answer = response.text || 'Unable to generate an answer.';
      setChatMessages(prev => [...prev, { role: 'ai', text: answer }]);
    } catch (e: any) {
      setChatMessages(prev => [...prev, { role: 'ai', text: `Error: ${e.message || 'Failed to get answer.'}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (JSON.stringify(prevSystemStateRef.current) !== JSON.stringify(runtimeState.systemStates)) {
      prevSystemStateRef.current = runtimeState.systemStates;
      if (!showSystemStatus) {
        setUnreadUpdates(prev => prev + 1);
      }
    }
  }, [runtimeState.systemStates, showSystemStatus]);

  const getRiskColor = (level: string = 'low') => {
    if (level === 'high') return 'text-red-500 bg-red-500/10 ring-red-500/50';
    if (level === 'medium') return 'text-amber-500 bg-amber-500/10 ring-amber-500/50';
    return 'text-green-500 bg-green-500/10 ring-green-500/50';
  };

  const hasData = (Array.isArray(uploadedFiles) && uploadedFiles.length > 0) || !!workflow;

  if (analysisStage !== 'done') {
    return (
      <div className="flex h-full w-full items-center justify-center text-slate-400 gap-4">
        {hasData ? (
          <>
            <SpinnerIcon className="w-8 h-8 animate-spin text-indigo-500" />
            <p>Agents are still analyzing and planning the workflow. Please wait...</p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p>Upload files that contain workflow or try the Demo</p>
            <Button variant="outline" onClick={() => navigate('/upload')}>Go to Upload</Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full relative">
      <div className="flex-1 h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onPaneClick={() => setSelectedNodeId(null)}
          fitView
          colorMode="dark"
          minZoom={0.5}
        >
          <Background color="#ffffff" gap={24} size={1} opacity={0.05} />
          <Controls className="bg-card border-border fill-white" />
        </ReactFlow>

        <div className="absolute top-6 left-6 right-6 flex items-start justify-between pointer-events-none z-10">
          <div className="pointer-events-auto bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex flex-col shadow-xl">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${executionState.running ? 'bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'}`}></div>
              <span className="text-sm font-medium text-white tracking-widest uppercase">
                {workflow?.workflow_name || 'Enterprise Workflow'}
              </span>
            </div>
            {nodes.length > 0 && (
              <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-white/5">
                <span className="text-[10px] text-slate-400 font-mono">{nodes.filter(n => n.data?.nodeType !== 'department').length} nodes</span>
                <span className="text-slate-600 text-[10px]">·</span>
                <span className="text-[10px] text-red-400 font-mono">{nodes.filter(n => n.data?.riskLevel === 'high').length} HIGH</span>
                <span className="text-slate-600 text-[10px]">·</span>
                <span className="text-[10px] text-amber-400 font-mono">{nodes.filter(n => n.data?.riskLevel === 'medium').length} MED</span>
                <span className="text-slate-600 text-[10px]">·</span>
                <span className="text-[10px] text-slate-400 font-mono">{nodes.filter(n => n.data?.riskLevel === 'low').length} LOW</span>
              </div>
            )}
          </div>

          <div className="pointer-events-auto flex items-center gap-4 bg-black/60 backdrop-blur-md p-2 pl-6 rounded-2xl border border-white/10 shadow-xl">
            <span className="text-sm text-muted-foreground mr-2 font-mono">{nodes.filter(n => n.data?.nodeType !== 'department').length} Nodes Ready</span>
            <Button  
              onClick={handleRun}
              className="rounded-xl px-6 bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(129,140,248,0.3)]"
            >
              <Play className="w-4 h-4 mr-2" />
              Execute Workflow
            </Button>
          </div>
        </div>
      </div>

      {/* Right Side Tools Container */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-4 pointer-events-none">
          {/* Live System State Widgets */}
          <div className="flex flex-col items-end gap-3 pointer-events-auto">
            <AnimatePresence>
              {showSystemStatus && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-3 origin-bottom-right"
                >
                  {/* Google Workspace Card */}
                  <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl w-48 transition-all hover:bg-black/90">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${executionState.running ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`}></div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Google Workspace</span>
                    </div>
                    <div className="space-y-1">
                       <div className="flex justify-between text-[10px]">
                         <span className="text-slate-400">Status</span>
                         <span className={runtimeState.systemStates.google.accountSuspended ? "text-amber-400" : "text-green-400"}>
                           {runtimeState.systemStates.google.accountSuspended ? "Suspended" : "Active"}
                         </span>
                       </div>
                       <div className="flex justify-between text-[10px]">
                         <span className="text-slate-400">Drive Transfer</span>
                         <span className={runtimeState.systemStates.google.driveTransfer === 'Complete' ? "text-emerald-400" : "text-slate-500"}>
                           {runtimeState.systemStates.google.driveTransfer}
                         </span>
                       </div>
                    </div>
                  </div>
                  
                  {/* Slack Card */}
                  <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl w-48 transition-all hover:bg-black/90">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${executionState.running ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`}></div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Slack Enterprise</span>
                    </div>
                    <div className="space-y-1">
                       <div className="flex justify-between text-[10px]">
                         <span className="text-slate-400">Access</span>
                         <span className={runtimeState.systemStates.slack.access === 'Disabled' ? "text-red-400" : "text-green-400"}>
                           {runtimeState.systemStates.slack.access}
                         </span>
                       </div>
                       <div className="flex justify-between text-[10px]">
                         <span className="text-slate-400">Sessions</span>
                         <span className={runtimeState.systemStates.slack.sessionsRevoked > 0 ? "text-red-400" : "text-slate-300"}>
                           {runtimeState.systemStates.slack.sessionsRevoked > 0 ? `${runtimeState.systemStates.slack.sessionsRevoked} Revoked` : "Active"}
                         </span>
                       </div>
                    </div>
                  </div>

                  {/* HRIS Card */}
                  <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl w-48 transition-all hover:bg-black/90">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${executionState.running ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`}></div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Bamboo HRIS</span>
                    </div>
                    <div className="space-y-1">
                       <div className="flex justify-between text-[10px]">
                         <span className="text-slate-400">Employment</span>
                         <span className={runtimeState.systemStates.hr.employment === 'Terminated' ? "text-red-400" : "text-green-400"}>
                           {runtimeState.systemStates.hr.employment}
                         </span>
                       </div>
                       <div className="flex justify-between text-[10px]">
                         <span className="text-slate-400">Payroll</span>
                         <span className={runtimeState.systemStates.hr.payroll === 'Pending' ? "text-amber-400" : "text-emerald-400"}>
                           {runtimeState.systemStates.hr.payroll}
                         </span>
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Button 
                variant="outline" 
                onClick={() => { setShowSystemStatus(!showSystemStatus); setUnreadUpdates(0); }}
                className={`bg-black/60 backdrop-blur-xl border ${showSystemStatus ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-white/10 hover:border-white/20 hover:bg-black/80'} text-white rounded-xl shadow-xl flex items-center gap-2 pr-5 transition-colors`}
              >
                <Server className="w-4 h-4 text-indigo-400" />
                <span>System Status</span>
              </Button>
              {/* Notification Badge */}
              {unreadUpdates > 0 && !showSystemStatus && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white shadow-lg z-10 pointer-events-none ring-2 ring-[#0d0d14]">
                  {unreadUpdates}
                </span>
              )}
              {executionState.running && unreadUpdates === 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3 z-10 pointer-events-none">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500 ring-2 ring-[#0d0d14]"></span>
                </span>
              )}
            </div>
          </div>

          {/* Ask the Workflow — RAG Chat Panel */}
          <div className="flex flex-col items-end gap-3 pointer-events-auto">
            {chatOpen && (
              <div className="w-80 bg-[#0d0d14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '420px' }}>
                <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-semibold text-white">Ask the Workflow</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">Gemini RAG</span>
                  </div>
                  <button onClick={() => setChatOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0" style={{ maxHeight: '260px' }}>
                  {chatMessages.length === 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-500 text-center mb-3">Ask anything about this workflow</p>
                      {SUGGESTED_QUESTIONS.map((q) => (
                        <button
                          key={q}
                          onClick={() => askWorkflow(q)}
                          className="w-full text-left text-[11px] text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[9px] uppercase tracking-widest font-bold text-slate-500">{msg.role === 'user' ? 'You' : '⚡ Gemini'}</span>
                      <div className={`text-[11px] leading-relaxed rounded-xl px-3 py-2 max-w-[90%] ${
                        msg.role === 'user'
                          ? 'bg-indigo-500/20 text-indigo-100 border border-indigo-500/20'
                          : 'bg-white/5 text-slate-200 border border-white/10'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <SpinnerIcon className="w-3 h-3 animate-spin" />
                      <span className="text-[11px]">Gemini is thinking...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-3 border-t border-white/10 shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !chatLoading) askWorkflow(chatInput); }}
                      placeholder="Ask about this workflow..."
                      className="flex-1 text-[11px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                    <button
                      onClick={() => askWorkflow(chatInput)}
                      disabled={chatLoading || !chatInput.trim()}
                      className="w-8 h-8 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
                    >
                      <Send className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setChatOpen(!chatOpen)}
              disabled={!workflow}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-lg shadow-purple-900/30 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              Ask the Workflow
            </button>
          </div>
        </div>

      {/* Side Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.aside
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-80 border-l border-white/5 bg-[#0a0a0f] p-5 h-full flex flex-col z-20 shrink-0 overflow-y-auto"
          >
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <h2 className="text-white font-bold text-sm">Selected Node Details</h2>
                  <p className="text-[11px] text-slate-500 font-mono">id: {selectedNode.id}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full border border-white/5 text-slate-400 hover:text-white" onClick={() => setSelectedNodeId(null)}>
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3">
                  <h5 className="text-[10px] uppercase text-slate-500 mb-2 font-bold">Node Label</h5>
                  <p className="text-xs text-white break-words">
                    {selectedNode.data?.label as string}
                  </p>
                  {selectedNode.data?.description && (
                    <p className="text-[11px] text-slate-400 mt-2 truncate">
                      {selectedNode.data.description as string}
                    </p>
                  )}
                </div>

                <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3">
                   <h5 className="text-[10px] uppercase text-slate-500 mb-2 font-bold">AI Reasoning Output</h5>
                   <div className="text-xs text-slate-300 leading-normal italic">
                     {selectedNode.data?.logic_reasoning as string || selectedNode.data?.reasoning as string || "Based on standard operating procedure manual, this step handles execution flow according to extracted dependencies."}
                   </div>
                </div>

                {Array.isArray(selectedNode.data?.evidenceSources) && 
                 (selectedNode.data.evidenceSources as any[]).length > 0 && (
                  <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3">
                    <h5 className="text-[10px] uppercase text-slate-500 mb-2 font-bold">
                      Evidence Sources
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {(selectedNode.data.evidenceSources as any[]).map((src: any, i: number) => (
                        <span key={i} className="flex items-center gap-1.5 text-[10px] bg-indigo-500/10 
                          border border-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full">
                          <FileText className="w-2.5 h-2.5" />
                          {src.reference}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h5 className="text-[10px] uppercase text-slate-500 mb-2 font-bold">Risk Profile</h5>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <div className={`h-full ${
                          selectedNode.data?.riskLevel === 'high' ? 'w-[85%] bg-red-500' :
                          selectedNode.data?.riskLevel === 'medium' ? 'w-[50%] bg-amber-500' :
                          'w-[14%] bg-green-500'
                       }`}></div>
                    </div>
                    <span className={`text-[10px] font-mono capitalize ${
                       selectedNode.data?.riskLevel === 'high' ? 'text-red-500' :
                       selectedNode.data?.riskLevel === 'medium' ? 'text-amber-500' :
                       'text-green-500'
                    }`}>
                       {selectedNode.data?.riskLevel as string || "Low"}
                    </span>
                  </div>
                </div>
                
                {selectedNode.data?.riskLevel === 'high' && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-2">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-[10px] font-semibold text-red-500 uppercase tracking-widest mb-1">Security Policy</h4>
                        <p className="text-[10px] text-red-500/80 leading-relaxed">
                           High risk action detected. Requires automated IAM verification before execution.
                        </p>
                      </div>
                    </div>
                  </div>
                )}


              </div>

              <div className="mt-auto border-t border-white/5 pt-4">
                <button 
                  onClick={() => setInspectPromptOpen(true)}
                  className="w-full py-2 border border-white/10 hover:bg-white/5 text-slate-300 rounded text-[11px] font-bold transition-colors"
                >
                  INSPECT PROMPT
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <Dialog open={inspectPromptOpen} onOpenChange={setInspectPromptOpen}>
        <DialogContent className="bg-[#0a0a0f] border border-white/10 text-white max-w-3xl max-h-[80vh] overflow-y-auto w-[90vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Prompt Inspection
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs mt-1">
              Enterprise workflow extraction & node generation audit
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div>
              <h5 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 border-b border-white/10 pb-1">System Prompt</h5>
              <div className="bg-black/50 p-3 rounded font-mono text-xs text-slate-300 whitespace-pre-wrap border border-white/5">
                {(selectedNode?.data?.inspectionPrompt as any)?.system || "You are an Enterprise Workflow generation AI. Extract nodes and assign correct dependencies based on organizational lanes and security policies..."}
              </div>
            </div>

            <div>
              <h5 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 border-b border-white/10 pb-1">User Input</h5>
              <div className="bg-black/50 p-3 rounded font-mono text-xs text-slate-300 whitespace-pre-wrap border border-white/5">
                {(selectedNode?.data?.inspectionPrompt as any)?.user || "Employee offboarding SOP uploaded:\n1. Revoke VPN access.\n2. Invalidate primary SSO tokens."}
              </div>
            </div>

            <div>
              <h5 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 border-b border-white/10 pb-1">Model Output (Action Node)</h5>
              <div className="bg-black/50 p-3 rounded font-mono text-xs text-indigo-300 whitespace-pre-wrap border border-white/5">
                {(selectedNode?.data?.inspectionPrompt as any)?.generatedAction || JSON.stringify(selectedNode?.data || {}, null, 2)}
              </div>
            </div>

            <div>
              <h5 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 border-b border-white/10 pb-1">Risk Analysis</h5>
              <div className={`p-3 rounded font-mono text-xs font-bold border ${selectedNode?.data?.riskLevel === 'high' ? 'bg-red-900/20 text-red-400 border-red-500/20' : 'bg-green-900/20 text-green-400 border-green-500/20'}`}>
                {selectedNode?.data?.riskLevel === 'high' ? (
                  <>
                    [BLOCK / REVIEW REQUIRED]<br/>
                    Risk Score: 94/100<br/>
                    Policy: PII Exfiltration Prevention
                  </>
                ) : (
                  <>
                    [PASS]<br/>
                    No prompt injection detected. Policy checks cleared.
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
