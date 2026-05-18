import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ChevronRight, Terminal, AlertTriangle, ShieldCheck, UserCheck, Check, X, Server, MessageSquare, Send, Loader2 as SpinnerIcon } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { incrementApiCall, isApiLimitReached } from '@/lib/simulation/apiCounter';
import { getExecuteSimulatedResponse } from '@/lib/simulation/simulatedResponses';
import { useStore } from '@/lib/store';
import { useWorkflowRuntime, RunRecord } from '@/context/WorkflowRuntimeContext';
import { executeWorkflow } from '@/lib/runtime/executeWorkflow';
import { applyWorkflowLayout } from '@/lib/layout/applyWorkflowLayout';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, Node } from '@xyflow/react';

export function ExecuteConsole() {
  const { runStatus, setRunStatus, aiModel, setAiModel, uploadedFiles, analysisLogs, analysisStage, hasRedactedPII } = useStore();
  const runtimeCtx = useWorkflowRuntime();
  const { state: { executionState, workflow } } = runtimeCtx;
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  const hasWorkflow = !!workflow;
  const hasData = (Array.isArray(uploadedFiles) && uploadedFiles.length > 0) || !!workflow;

  useEffect(() => {
    if (workflow?.workflow_name) {
      document.title = `${workflow.workflow_name} — Execution | ContextOS`;
    }
  }, [workflow]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [showBanner, setShowBanner] = useState(true);
  const [showSystemState, setShowSystemState] = useState(hasWorkflow);
  const [uptime, setUptime] = useState(0);
  const uptimeRef = useRef(0); // ref to avoid stale closure in executeWorkflow .then()
  const [speed, setSpeed] = useState<1 | 3 | 10>(1);
  const speedRef = useRef<1 | 3 | 10>(1);
  const prevRunStatusRef = useRef<string>('idle'); // track transitions to safely reset startedRef

  const [showSystemStatus, setShowSystemStatus] = useState(false);
  const [unreadUpdates, setUnreadUpdates] = useState(0);
  const prevSystemStateRef = useRef(runtimeCtx.state.systemStates);

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

  const askWorkflow = async (question: string) => {
    if (!workflow || !question.trim()) return;
    setChatMessages(prev => [...prev, { role: 'user', text: question }]);
    setChatInput('');
    setChatLoading(true);

    // Simulated mode — return keyword-matched canned response
    if (aiModel === 'gemini-simulated' || isApiLimitReached()) {
      await new Promise(r => setTimeout(r, 800));
      setChatMessages(prev => [...prev, { role: 'ai', text: getExecuteSimulatedResponse(question) }]);
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
- The current workflow execution: its steps, nodes, departments, and orchestration logs
- Security events: policy violations, guardrail blocks, IAM escalations
- Execution results: completed steps, timing, errors, and retries

If the question is not directly related to these topics, respond ONLY with:
"I can only assist with questions about the current workflow execution, its logs, security events, and step completion status."

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
    if (JSON.stringify(prevSystemStateRef.current) !== JSON.stringify(runtimeCtx.state.systemStates)) {
      prevSystemStateRef.current = runtimeCtx.state.systemStates;
      if (!showSystemStatus) {
        setUnreadUpdates(prev => prev + 1);
      }
    }
  }, [runtimeCtx.state.systemStates, showSystemStatus]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (runStatus === 'running' && executionState.escalationStatus !== 'pending') {
      interval = setInterval(() => {
        setUptime(prev => {
          const next = prev + 1;
          uptimeRef.current = next; // keep ref in sync
          return next;
        });
      }, 1000);
    } else if (runStatus === 'idle') {
      setUptime(0);
      uptimeRef.current = 0;
    }
    return () => clearInterval(interval);
  }, [runStatus, executionState.escalationStatus]);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Make employee name dynamic based on workflow if possible
    if (workflow) {
      const empName = workflow?.target_entity?.name || workflow?.employee_name || 'Alex Morgan';
      runtimeCtx.updateSystemState('hr', { employee: empName });
    }
  }, [workflow]);

  useEffect(() => {
    // Check if we already have logs or are currently running globally
    const hasAlreadyStarted = executionState.logs.length > 0 || executionState.running;

    // Only reset startedRef when transitioning from 'completed' → 'running'
    // (Shell's Confirm Run re-runs from same page without navigating).
    // Do NOT reset mid-run — this caused double execution at high speed when
    // runtimeCtx changed reference before the first log landed.
    if (runStatus === 'running' && prevRunStatusRef.current === 'completed') {
      startedRef.current = false;
    }
    prevRunStatusRef.current = runStatus;

    if (runStatus === 'running' && !startedRef.current && !hasAlreadyStarted && workflow) {
      startedRef.current = true;
      setShowBanner(true);
      setSpeed(1);

      executeWorkflow(workflow, { ...runtimeCtx, setAiModel }, aiModel, { getSpeed: () => speedRef.current, hasRedactedPII }).then(() => {
        runtimeCtx.createAndAddRunRecord(workflow, analysisLogs, uptimeRef.current);
        setRunStatus('completed');
      });
    }

    // Auto scroll to bottom
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, [runStatus, runtimeCtx, workflow, executionState.logs.length, setRunStatus, aiModel]);

  useEffect(() => {
    if (workflow && workflow.nodes && workflow.edges) {
      const { nodes: plannedNodes, edges: plannedEdges } = applyWorkflowLayout(workflow.nodes, workflow.edges);
      
      const activeNodeId = [...workflow.nodes]
        .filter(n => n.data?.nodeType !== 'department')
        .sort((a, b) => (a.layout?.order || 0) - (b.layout?.order || 0))
        .find(n => !executionState.completedSteps.includes(n.id))?.id;

      const nodesWithState = plannedNodes.map(n => {
        const isCompleted = executionState.completedSteps.includes(n.id);
        const isFailed = executionState.failedSteps.includes(n.id);
        const isRunning = executionState.running && n.id === activeNodeId;
        
        const isEscalating = executionState.escalationStatus === 'pending' && n.id === executionState.escalationDetails?.nodeId;
        const isQuarantined = executionState.escalationStatus === 'pending' && !isCompleted && !isEscalating;
        
        let className = n.className || '';
        if (isFailed) {
          className += ' ring-2 ring-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] bg-red-900/20 opacity-90';
        } else if (isEscalating) {
          className += ' ring-2 ring-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] bg-red-900/40 animate-pulse';
        } else if (isQuarantined) {
          className += ' ring-1 ring-white/10 bg-white/5 opacity-40 grayscale';
        } else if (isCompleted) {
          className += ' ring-2 ring-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] bg-green-900/10 opacity-70';
        } else if (isRunning) {
          className += ' ring-2 ring-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] animate-pulse';
        }
        
        return { ...n, className };
      });

      setNodes(nodesWithState);
      
      const edgesWithState = plannedEdges.map(e => {
        const isCompleted = executionState.completedSteps.includes(e.source) && executionState.completedSteps.includes(e.target);
        const sourceFailed = executionState.failedSteps.includes(e.source);
        const sourceEscalating = executionState.escalationStatus === 'pending';
        
        return {
          ...e,
          style: sourceFailed 
                  ? { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '4,4' }
                  : sourceEscalating && !isCompleted
                  ? { stroke: '#ef4444', strokeWidth: 1, strokeDasharray: '4,4', opacity: 0.5 }
                  : isCompleted 
                    ? { stroke: '#22c55e', strokeWidth: 2 } 
                    : { stroke: 'rgba(99, 102, 241, 0.5)', strokeWidth: 2 },
          animated: executionState.running && (!isCompleted && !sourceFailed && !sourceEscalating)
        };
      });
      
      setEdges(edgesWithState);
    }
  }, [workflow, setNodes, setEdges, executionState]);

  const parseLog = (logMessage: string) => {
    const timestampMatch = logMessage.match(/^\[(.*?)\]/);
    const systemMatch = logMessage.match(/\] \[(.*?)\]/);
    const timestamp = timestampMatch ? timestampMatch[1] : '';
    const system = systemMatch ? systemMatch[1] : '';
    let message = logMessage;
    if (timestamp) message = message.replace(`[${timestamp}]`, '');
    if (system) message = message.replace(`[${system}]`, '');
    return { timestamp, system, message: message.trim() };
  };

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
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between p-6 pb-2 shrink-0">
        <div>
          <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
            <Terminal className="w-6 h-6 text-indigo-400" />
            Execution Console
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Digital Twin Simulation &middot; Enterprise Operations Console</p>
        </div>
        
        {runStatus === 'running' ? (
          executionState.escalationStatus === 'pending' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-mono animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              HUMAN_INTERVENTION_REQUIRED
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-mono animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              VIRTUAL_RUN_IN_PROGRESS
            </div>
          )
        ) : runStatus === 'idle' ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 text-sm font-mono">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            AWAITING_RUN
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-sm font-mono">
            <CheckCircle2 className="w-4 h-4" />
            COMPLETED
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden p-6 pt-2 gap-6 relative">
        {/* Escalation Overlay */}
        <AnimatePresence>
          {executionState.escalationStatus === 'pending' && executionState.escalationDetails && (
            <motion.div 
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-[#0a0a0f] border border-red-500/30 rounded-2xl w-full max-w-2xl shadow-[0_0_50px_rgba(239,68,68,0.15)] flex flex-col overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-red-500/20 bg-red-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-red-500">
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                    <h2 className="font-semibold tracking-tight">Manual Approval Required</h2>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-red-500/20 text-red-400 uppercase">Policy Enforced</span>
                </div>

                <div className="p-6 grid grid-cols-2 gap-x-8 gap-y-6 text-sm">
                  <div className="space-y-1">
                    <span className="text-slate-500 font-mono text-[10px] tracking-wider uppercase">Enforced Policy</span>
                    <p className="text-white font-medium flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4 text-emerald-400" />
                       {executionState.escalationDetails.policy}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 font-mono text-[10px] tracking-wider uppercase">Risk Level</span>
                    <p className="text-red-400 font-bold tracking-widest uppercase">{executionState.escalationDetails.riskLevel}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 font-mono text-[10px] tracking-wider uppercase">Department</span>
                    <p className="text-white opacity-90">{executionState.escalationDetails.department}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 font-mono text-[10px] tracking-wider uppercase">Requested Action</span>
                    <p className="text-white font-medium">"{executionState.escalationDetails.requestedAction}"</p>
                  </div>
                  
                  <div className="col-span-2 space-y-1 p-4 rounded-lg bg-red-950/20 border border-red-900/30">
                    <span className="text-red-400 font-mono text-[10px] tracking-wider uppercase">Reason for Escalation</span>
                    <p className="text-red-200 mt-1">{executionState.escalationDetails.reason}</p>
                  </div>

                  <div className="col-span-2 border-t border-white/5 pt-4 mt-2">
                    <span className="text-slate-500 font-mono text-[10px] tracking-wider uppercase mb-3 block">Multi-Agent Governance Discussion</span>
                    <div className="space-y-3 font-mono text-[11px] leading-relaxed">
                      <div className="flex gap-3 text-red-300/90">
                        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                        <div><strong className="text-red-400">Security Governance Agent:</strong> Detected policy violation involving {executionState.escalationDetails.department} boundary.</div>
                      </div>
                      <div className="flex gap-3 text-indigo-300/90">
                        <Terminal className="w-4 h-4 shrink-0 mt-0.5" />
                        <div><strong className="text-indigo-400">Execution Planner Agent:</strong> Downstream "{executionState.escalationDetails.requestedAction}" tasks have been suspended pending outcome.</div>
                      </div>
                      <div className="flex gap-3 text-emerald-300/90">
                        <UserCheck className="w-4 h-4 shrink-0 mt-0.5" />
                        <div><strong className="text-emerald-400">Compliance Agent:</strong> Manual reviewer approval required under policy {executionState.escalationDetails.policy}.</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-black/40 border-t border-white/5 flex items-center justify-end gap-3">
                  <Button 
                    variant="outline" 
                    className="border-red-900/50 hover:bg-red-900/30 text-red-400 hover:text-red-300"
                    onClick={() => runtimeCtx.resolveEscalation('denied')}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Deny Execution
                  </Button>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"
                    onClick={() => runtimeCtx.resolveEscalation('approved')}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve Once
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Graph View */}
        <div className="flex-1 rounded-xl border border-white/5 bg-[#0a0a0f] relative overflow-hidden shadow-2xl">
           <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
              colorMode="dark"
              minZoom={0.5}
              elementsSelectable={true}
              nodesDraggable={true}
              nodesConnectable={false}
              zoomOnScroll={true}
              panOnDrag={true}
            >
              <Background color="#ffffff" gap={24} size={1} opacity={0.05} />
              <Controls className="bg-card border-border fill-white" showInteractive={false} />
            </ReactFlow>

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
                             <span className={runtimeCtx.state.systemStates.google.accountSuspended ? "text-amber-400" : "text-green-400"}>
                               {runtimeCtx.state.systemStates.google.accountSuspended ? "Suspended" : "Active"}
                             </span>
                           </div>
                           <div className="flex justify-between text-[10px]">
                             <span className="text-slate-400">Drive Transfer</span>
                             <span className={runtimeCtx.state.systemStates.google.driveTransfer === 'Complete' ? "text-emerald-400" : "text-slate-500"}>
                               {runtimeCtx.state.systemStates.google.driveTransfer}
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
                             <span className={runtimeCtx.state.systemStates.slack.access === 'Disabled' ? "text-red-400" : "text-green-400"}>
                               {runtimeCtx.state.systemStates.slack.access}
                             </span>
                           </div>
                           <div className="flex justify-between text-[10px]">
                             <span className="text-slate-400">Sessions</span>
                             <span className={runtimeCtx.state.systemStates.slack.sessionsRevoked > 0 ? "text-red-400" : "text-slate-300"}>
                               {runtimeCtx.state.systemStates.slack.sessionsRevoked > 0 ? `${runtimeCtx.state.systemStates.slack.sessionsRevoked} Revoked` : "Active"}
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
                             <span className={runtimeCtx.state.systemStates.hr.employment === 'Terminated' ? "text-red-400" : "text-green-400"}>
                               {runtimeCtx.state.systemStates.hr.employment}
                             </span>
                           </div>
                           <div className="flex justify-between text-[10px]">
                             <span className="text-slate-400">Payroll</span>
                             <span className={runtimeCtx.state.systemStates.hr.payroll === 'Pending' ? "text-amber-400" : "text-emerald-400"}>
                               {runtimeCtx.state.systemStates.hr.payroll}
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
        </div>

        {/* Side Panel */}
        <div className="w-[450px] flex flex-col gap-6 relative shrink-0">
          
          {/* State Mirrors */}
          <div className="bg-[#0d0d14] border border-white/5 rounded-xl overflow-hidden shadow-2xl flex flex-col shrink-0 transition-all duration-300">
            <div 
              className={cn("px-4 py-3 border-b border-white/5 bg-white/[0.01] flex items-center justify-between transition-colors", hasWorkflow ? "cursor-pointer hover:bg-white/[0.02]" : "opacity-50 cursor-not-allowed")} 
              onClick={() => {
                if (hasWorkflow) setShowSystemState(!showSystemState);
              }}
            >
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                Live System States
                <span className="text-[9px] font-bold uppercase tracking-widest text-teal-400 bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.5 rounded ml-1">Digital Twin Mirror</span>
              </h3>
              <ChevronRight className={cn("w-4 h-4 text-slate-500 transition-transform duration-300", showSystemState ? "rotate-90" : "")} />
            </div>
            
            <AnimatePresence initial={false}>
              {showSystemState && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="p-4 grid grid-cols-1 gap-4 text-sm">
                    {/* HR Card */}
                    <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-indigo-300">HRIS Portal</span>
                        <span className="text-[10px] text-slate-500">EMP-89422</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between"><span className="text-slate-400">Employee:</span> <span className="text-white">{runtimeCtx.state.systemStates.hr.employee}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Employment:</span> <span className={runtimeCtx.state.systemStates.hr.employment === 'Terminated' ? 'text-red-400 font-medium' : 'text-green-400 font-medium'}>{runtimeCtx.state.systemStates.hr.employment}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Payroll:</span> <span className={runtimeCtx.state.systemStates.hr.payroll === 'Pending' ? 'text-amber-400' : 'text-white'}>{runtimeCtx.state.systemStates.hr.payroll}</span></div>
                      </div>
                    </div>

                    {/* Slack Card */}
                    <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-indigo-300">Slack Enterprise</span>
                        <span className="text-[10px] text-slate-500">API/OAuth</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between"><span className="text-slate-400">Access:</span> <span className={runtimeCtx.state.systemStates.slack.access === 'Disabled' ? 'text-red-400 font-medium' : 'text-green-400 font-medium'}>{runtimeCtx.state.systemStates.slack.access}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Sessions Revoked:</span> <span className="text-white">{runtimeCtx.state.systemStates.slack.sessionsRevoked}</span></div>
                      </div>
                    </div>

                    {/* Google Workspace Card */}
                    <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-indigo-300">Google Workspace</span>
                        <span className="text-[10px] text-slate-500">Admin SDK</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between"><span className="text-slate-400">Account:</span> <span className={runtimeCtx.state.systemStates.google.accountSuspended ? 'text-red-400 font-medium' : 'text-green-400 font-medium'}>{runtimeCtx.state.systemStates.google.accountSuspended ? 'Suspended' : 'Active'}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Drive Transfer:</span> <span className={runtimeCtx.state.systemStates.google.driveTransfer === 'Complete' ? 'text-green-400 font-medium' : 'text-amber-400'}>{runtimeCtx.state.systemStates.google.driveTransfer}</span></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Console View */}
          <div className="bg-[#0d0d14] border border-white/5 rounded-xl overflow-hidden flex flex-col font-mono shadow-2xl relative flex-1">
            <div className="h-10 border-b border-white/5 flex items-center px-4 justify-between bg-white/[0.01] shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Logs</span>
                    {runStatus === 'running' && (
                      executionState.escalationStatus === 'pending' ? (
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-red-500"></span> Paused
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span> Streaming
                        </span>
                      )
                    )}
                </div>
              </div>
              <div className="flex flex-row items-center gap-4">
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                  {([1, 3, 10] as const).map(s => (
                    <button key={s} onClick={() => setSpeed(s)}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                        speed === s 
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                          : 'text-slate-500 hover:text-slate-300'
                      }`}>{s}×</button>
                  ))}
                </div>
                <span className="text-[10px] font-mono text-slate-600">Uptime: {formatUptime(uptime)}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 relative text-[11px] leading-relaxed">
              <AnimatePresence initial={false}>
                {executionState.logs.map((log) => {
                  const { system, message } = parseLog(`[${log.timestamp}] ${log.message}`);
                  
                  const isAlert = message.includes('WARNING') || message.includes('DENIED') || message.includes('held') || message.includes('SECURITY') || message.includes('VEEA-SHIELD') || message.includes('ERROR');
                  const isSuccess = message.includes('completed') || message.includes('successfully') || message.includes('Proceeding');
                  const isSync = system === 'ORCHESTRATOR' && !isSuccess;
                  const isAction = system !== 'ORCHESTRATOR' && system !== 'HR';

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "flex font-mono",
                        isAlert ? "text-amber-500 underline" :
                        isSuccess ? "text-green-400" :
                        isSync ? "text-indigo-400" :
                        isAction ? "text-slate-400" : 
                        "text-indigo-300"
                      )}
                    >
                      <span className="opacity-70 w-24 shrink-0">[{log.timestamp}]</span>
                      <span className="opacity-90 w-28 shrink-0">{system}:</span>
                      <span className={cn(isAction && "italic")}>{message}</span>
                    </motion.div>
                  );
                })}
                
                {runStatus === 'running' && executionState.escalationStatus !== 'pending' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key="typing"
                    className="flex items-center mt-4 text-slate-500"
                  >
                    <ChevronRight className="w-4 h-4 mr-2" />
                    <span className="w-2 h-4 bg-indigo-500/80 animate-pulse" />
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={bottomRef} className="h-8" />
            </div>
          </div>
        </div>

        {/* Completion Banner */}
        <AnimatePresence>
          {runStatus === 'completed' && showBanner && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="absolute bottom-6 left-6 right-6 z-20"
            >
              <div className="bg-card border border-white/10 p-6 rounded-xl shadow-2xl backdrop-blur-md flex items-center justify-between flex-wrap gap-4 mx-auto max-w-4xl relative">
                <button 
                  onClick={() => setShowBanner(false)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {executionState.escalationStatus === 'denied' 
                      ? 'Execution Terminated — Policy Enforced' 
                      : 'Digital Twin Simulation Complete'}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {executionState.escalationStatus === 'denied'
                      ? 'Workflow was safely halted due to policy violation. Audit log updated.'
                      : 'All enterprise systems mirrored successfully in dry-run simulation.'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="border-white/10 bg-black hover:bg-white/5" onClick={() => {
                    const report = {
                      simulation_id: "SIM-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
                      workflow: workflow?.workflow_name || 'Enterprise Workflow',
                      duration_seconds: uptimeRef.current,
                      nodes_executed: executionState.completedSteps.length + executionState.failedSteps.length,
                      escalations_triggered: executionState.escalationStatus === 'none' ? 0 : 1,
                      escalation_outcome: executionState.escalationStatus,
                      policy_violations: executionState.escalationStatus !== 'none' && executionState.escalationDetails ? [executionState.escalationDetails.policy] : [],
                      systems_mirrored: ["Google Workspace", "Slack", "BambooHR"],
                      digital_twin_fidelity: ((executionState.completedSteps.length / Math.max(1, (executionState.completedSteps.length + executionState.failedSteps.length))) * 100).toFixed(1) + "%"
                    };
                    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `simulation-report-${report.simulation_id}.json`;
                    a.click();
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    Simulation Report
                  </Button>
                  <Button variant="outline" className="border-indigo-500/20 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20" onClick={() => navigate('/security')}>
                    View Audit Log
                  </Button>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => {
                    runtimeCtx.resetExecution();
                    startedRef.current = false;
                    setRunStatus('idle');
                    navigate('/graph');
                  }}>
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Re-run
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minimized Banner Toggle */}
        <AnimatePresence>
          {runStatus === 'completed' && !showBanner && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute bottom-6 right-6 z-20"
            >
              <Button 
                onClick={() => setShowBanner(true)}
                className="rounded-full shadow-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Show Results
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
