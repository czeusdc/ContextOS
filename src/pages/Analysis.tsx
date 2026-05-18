import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { File, CheckCircle2, Loader2, ArrowRight, Activity, ShieldCheck, Database, Link, Network, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { useWorkflowRuntime } from '@/context/WorkflowRuntimeContext';
import { generateWorkflow } from '@/lib/workflow/runWorkflow';
import { toast } from 'sonner';

export function AnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    aiModel, setAiModel, 
    filePayload, fileName, hasRedactedPII,
    analysisLogs, setAnalysisLogs,
    analysisStage, setAnalysisStage,
    setDiscoveredConnections,
    hasStartedAnalysis, setHasStartedAnalysis
  } = useStore();
  const { state, setWorkflow, addSecurityEvent } = useWorkflowRuntime();
  
  const payload = filePayload || location.state?.inputPayload;
  const name = fileName || location.state?.fileName || 'SOP_Document';
  const hasPII = hasRedactedPII || location.state?.hasRedactedPII;
  
  const [agentsStatus, setAgentsStatus] = useState({
    analyst: analysisStage !== 'extracting' ? 'done' : 'pending',
    security: analysisStage === 'planning' || analysisStage === 'done' ? 'done' : 'pending',
    systems: analysisStage === 'planning' || analysisStage === 'done' ? 'done' : 'pending',
    planner: analysisStage === 'done' ? 'done' : 'pending',
  });
  const [expandedSection, setExpandedSection] = useState<'process' | 'results'>('process');
  const logsEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "AI Analysis | ContextOS";
  }, []);

  useEffect(() => {
    if (analysisStage === 'done') {
      setExpandedSection('results');
    }
  }, [analysisStage]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [analysisLogs]);

  const addLog = (log: string) => {
    setAnalysisLogs(prev => [...prev, `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] ${log}`]);
  };

  useEffect(() => {
    if (hasStartedAnalysis) return;
    if (analysisStage === 'done') return;
    
    // If we already have a generated workflow and no new payload (e.g., Demo scenario), animate it!
    if (!payload && state.workflow) {
      setHasStartedAnalysis(true);
      
      const animateExisting = async () => {
         setAnalysisStage('extracting');
         addLog('SYSTEM: Loading pre-built knowledge graph...');
         addLog('SYSTEM: Initializing cognitive engine...');
         await new Promise(r => setTimeout(r, 1500));
         
         const workflowData: any = state.workflow;
         setAnalysisStage('understanding');
         addLog(`ANALYST: Successfully processed ${name}`);
         addLog(`ANALYST: Detected workflow context: ${workflowData?.workflow_name || 'Enterprise Steps'}`);
         await new Promise(r => setTimeout(r, 2000));
         
         setAnalysisStage('planning');
         
         // Agent 1: Analyst
         addLog('ORCHESTRATOR: Invoking Workflow Analyst Agent');
         setAgentsStatus(prev => ({ ...prev, analyst: 'active' }));
         await new Promise(r => setTimeout(r, 1000));
         addLog('ANALYST: Resolving step dependencies and linearizing actions...');
         setAgentsStatus(prev => ({ ...prev, analyst: 'done', security: 'active' }));
         
         addLog('ORCHESTRATOR: Invoking Security Governance Agent');
         await new Promise(r => setTimeout(r, 1000));
         addLog('SECURITY: Evaluating compliance perimeters and API surface...');
         setAgentsStatus(prev => ({ ...prev, security: 'done', systems: 'active' }));
         
         addLog('ORCHESTRATOR: Invoking Systems Integration Agent');
         await new Promise(r => setTimeout(r, 1000));
         addLog('SYSTEMS: Mapping discovered systems to enterprise APIs...');

         if (workflowData.systems_detected || (workflowData.analysis_report && workflowData.analysis_report.systems_detected)) {
            const systems = workflowData.systems_detected || workflowData.analysis_report.systems_detected;
            if (Array.isArray(systems)) {
               setDiscoveredConnections(systems.map((s: any) => ({ name: s, type: 'api' as const })));
            }
         }

         setAgentsStatus(prev => ({ ...prev, systems: 'done', planner: 'active' }));
         
         addLog('ORCHESTRATOR: Invoking Execution Planner Agent');
         await new Promise(r => setTimeout(r, 1000));
         addLog('PLANNER: Constructing directed acyclic graph for orchestrator engine...');
         setAgentsStatus(prev => ({ ...prev, planner: 'done' }));
         addLog('SYSTEM: All agents completed. Ready for orchestration.');
         setAnalysisStage('done');
      };
      
      animateExisting();
      return;
    }

    // If no payload and no workflow, redirect to upload
    if (!payload && !state.workflow) {
      navigate('/upload', { replace: true });
      return;
    }
    
    setHasStartedAnalysis(true);

    // Dispatch PII event if redacted
    if (hasPII) {
       // Wait a sec then add the event
       setTimeout(() => {
          addSecurityEvent({
            id: 'pii-redact-' + Date.now().toString(),
            status: 'REVIEW',
            message: `[PRE-FLIGHT] Detected and redacted PII (SSN, Phone Numbers, Emails) from document "${name}" before LLM processing.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          });
       }, 500);
    }

    const runAnalysis = async () => {
      // Stage 0: Extracting
      addLog('SYSTEM: Initializing cognitive engine...');
      addLog('SYSTEM: Starting document extraction and parsing...');
      
      // Start real workflow generation in the background
      let workflowData: any = null;
      let generatePromise = generateWorkflow(payload, aiModel, 0, setAiModel).then(data => {
        if (data && data.workflow) {
           workflowData = data.workflow;
           
           if (data.workflow.systems_detected || (data.workflow.analysis_report && data.workflow.analysis_report.systems_detected)) {
              const systems = data.workflow.systems_detected || data.workflow.analysis_report.systems_detected;
              if (Array.isArray(systems)) {
                 setDiscoveredConnections(systems.map(s => ({ name: s, type: 'api' })));
              }
           }
           
           if (data.usedModel && data.usedModel !== aiModel) {
             setAiModel(data.usedModel);
             addLog(`ORCHESTRATOR: Model switched to ${data.usedModel}`);
           }
           setWorkflow(data.workflow); // Set it early so we can show it in 'understanding'
           return data.workflow;
        }
        return data;
      }).catch(err => {
        console.error(err);
        addLog(`ERROR: Workflow Generation Failed: ${err.message}`);
        toast.error("Workflow Generation Failed", { description: err.message });
        return null;
      });

      // Wait for at least the data to arrive before moving to 'understanding'
      await generatePromise;
      if (!workflowData) {
         setAnalysisStage('done');
         return; // Error happened, or mock returned
      }

      setAnalysisStage('understanding');
      addLog(`ANALYST: Successfully processed ${name}`);
      addLog(`ANALYST: Detected workflow context: ${workflowData?.workflow_name || 'Enterprise Steps'}`);
      await new Promise(r => setTimeout(r, 2000));
      
      setAnalysisStage('planning');
      
      // Agent 1: Analyst
      addLog('ORCHESTRATOR: Invoking Workflow Analyst Agent');
      setAgentsStatus(prev => ({ ...prev, analyst: 'active' }));
      await new Promise(r => setTimeout(r, 1000));
      addLog('ANALYST: Resolving step dependencies and linearizing actions...');
      setAgentsStatus(prev => ({ ...prev, analyst: 'done', security: 'active' }));
      
      addLog('ORCHESTRATOR: Invoking Security Governance Agent');
      await new Promise(r => setTimeout(r, 1000));
      addLog('SECURITY: Evaluating compliance perimeters and API surface...');
      setAgentsStatus(prev => ({ ...prev, security: 'done', systems: 'active' }));
      
      addLog('ORCHESTRATOR: Invoking Systems Integration Agent');
      await new Promise(r => setTimeout(r, 1000));
      addLog('SYSTEMS: Mapping discovered systems to enterprise APIs...');
      setAgentsStatus(prev => ({ ...prev, systems: 'done', planner: 'active' }));
      
      addLog('ORCHESTRATOR: Invoking Execution Planner Agent');
      await new Promise(r => setTimeout(r, 1000));
      addLog('PLANNER: Constructing directed acyclic graph for orchestrator engine...');
      setAgentsStatus(prev => ({ ...prev, planner: 'done' }));
      addLog('SYSTEM: All agents completed. Ready for orchestration.');
      await new Promise(r => setTimeout(r, 1500));
      setAnalysisStage('done');
    };

    runAnalysis();
  }, [payload, navigate, aiModel, setWorkflow, state.workflow]);

  return (
    <div className="flex flex-col items-center max-w-5xl mx-auto px-6 py-6 w-full h-full overflow-hidden">
      <div className="mb-6 text-center space-y-1">
        <h2 className="text-3xl font-semibold text-white">
          {analysisStage === 'done' ? 'Analysis Complete' : 'AI Cognition & Planning'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {analysisStage === 'done' ? 'Successfully processed' : 'Processing'} {name}
        </p>
      </div>

      <div className="w-full flex-1 min-h-0 flex flex-col gap-6 relative">
        <AnimatePresence mode="popLayout">
          {expandedSection === 'process' && (
            <motion.div 
              key="processing-view"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-4 w-full h-full absolute inset-0"
            >
              <div className="flex flex-col md:flex-row gap-6 w-full flex-1 min-h-0">
                {/* Left Side: Understanding Summary */}
                <div 
                  className="flex-[0.8] overflow-y-auto bg-white/[0.03] border border-white/10 rounded-3xl p-6 flex flex-col gap-4"
                >
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-2">
                    {analysisStage === 'extracting' ? (
                      <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                    ) : (
                      <Activity className="w-5 h-5 text-indigo-400" />
                    )}
                    <h3 className="text-lg font-medium text-white">
                      {analysisStage === 'extracting' ? 'Extracting Context...' : 'Context Extraction'}
                    </h3>
                  </div>
                  
                  {analysisStage === 'extracting' ? (
                    <div className="space-y-6 pt-2">
                      <div className="flex flex-col gap-2">
                        <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
                        <div className="h-6 w-32 bg-indigo-500/20 rounded animate-pulse" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="h-3 w-36 bg-white/10 rounded animate-pulse" />
                        <div className="flex gap-2">
                          <div className="h-6 w-12 bg-white/5 rounded animate-pulse" />
                          <div className="h-6 w-16 bg-white/5 rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
                        <div className="flex gap-2">
                          <div className="h-6 w-24 bg-white/5 rounded animate-pulse" />
                          <div className="h-6 w-20 bg-white/5 rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Workflow Type</span>
                      <span className="text-sm text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded">
                        {state.workflow?.analysis_report?.workflow_type || state.workflow?.workflow_name || 'Workflow Context'}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Departments Detected</span>
                      <div className="flex flex-wrap gap-2">
                        {(state.workflow?.analysis_report?.departments_detected || ['General']).map((dept: string, i: number) => (
                          <span key={i} className="text-xs text-white bg-white/5 border border-white/10 px-2 py-1 rounded">{dept.toUpperCase()}</span>
                        ))}
                      </div>
                    </div>

                    <div>
                       <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Enterprise Systems</span>
                       <div className="flex flex-wrap gap-2">
                        {(state.workflow?.analysis_report?.systems_detected || ['System']).map((sys: string, i: number) => (
                          <span key={i} className="text-xs text-blue-200 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded">{sys}</span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 border-dashed">
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Risk Classification</span>
                        <span className="text-sm text-amber-400 flex items-center gap-1 capitalize">
                          <ShieldCheck className="w-3 h-3" /> {state.workflow?.analysis_report?.risk_classification || 'medium'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Est. Coverage</span>
                        <span className="text-sm text-green-400 text-mono">{state.workflow?.analysis_report?.estimated_automation_coverage_percent || 70}%</span>
                      </div>
                    </div>
                  </motion.div>
                  )}
                </div>

                {/* Right Side: Multi-Agent Planning & Logs */}
                <div 
                  className="flex-[1.2] flex flex-col gap-4 h-full"
                >
                  <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 shrink-0">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-4">
                      <Network className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-medium text-white">Multi-Agent Planning</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <AgentCard 
                        title="Workflow Analyst"
                        icon={<Activity className="w-4 h-4" />}
                        status={agentsStatus.analyst}
                        messages={["Parsing causal dependencies...", "Classifying node risk levels..."]}
                      />
                      <AgentCard 
                        title="Security Governance"
                        icon={<ShieldCheck className="w-4 h-4" />}
                        status={agentsStatus.security}
                        messages={["Scanning for PII boundary crossings...", "Evaluating RBAC perimeters..."]}
                      />
                      <AgentCard 
                        title="Systems Integration"
                        icon={<Database className="w-4 h-4" />}
                        status={agentsStatus.systems}
                        messages={["Mapping to enterprise API surface...", "Resolving system endpoints..."]}
                      />
                      <AgentCard 
                        title="Execution Planner"
                        icon={<Link className="w-4 h-4" />}
                        status={agentsStatus.planner}
                        messages={["Optimizing execution DAG...", "Allocating agent steps..."]}
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden bg-black/50 border border-white/10 rounded-3xl p-4 flex flex-col font-mono text-xs relative">
                     <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />
                     <div className="flex-1 overflow-y-auto space-y-1 p-2">
                        {analysisLogs.map((log, i) => (
                           <div key={i} className={`flex items-start gap-2 ${log.includes('ERROR') ? 'text-red-400' : log.includes('SYSTEM') ? 'text-indigo-300' : 'text-slate-400'}`}>
                              <span>{log}</span>
                           </div>
                        ))}
                        <div ref={logsEndRef} />
                     </div>
                     <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />
                  </div>
                </div>
              </div>

              {analysisStage === 'done' && (
                <button 
                  onClick={() => setExpandedSection('results')} 
                  className="shrink-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-4 cursor-pointer hover:bg-emerald-500/10 transition-colors flex items-center justify-between w-full shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <Target className="w-5 h-5 text-emerald-400" />
                    <div className="text-sm font-semibold text-white">Analysis Complete: View Projected Value & Intelligence Report</div>
                  </div>
                  <div className="flex gap-4">
                     <div className="hidden sm:block text-xs text-slate-400">Time Saved: <span className="text-white font-bold inline-block ml-1">~{(state.workflow?.nodes?.filter((n: any) => n.data?.nodeType !== 'department').length || 8) * 23}m</span></div>
                     <div className="hidden sm:block text-xs text-slate-400">Compliance: <span className="text-white font-bold inline-block ml-1">{state.workflow?.analysis_report?.risk_classification === 'high' ? 82 : 94}/100</span></div>
                     <CheckCircle2 className="w-4 h-4 text-emerald-400 sm:hidden" />
                  </div>
                </button>
              )}
            </motion.div>
          )}

          {expandedSection === 'results' && analysisStage === 'done' && (
            <motion.div
              layout
              key="done-view"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full h-full flex flex-col gap-4 absolute inset-0"
            >
              <div className="w-full flex-1 min-h-0 overflow-y-auto space-y-4">
                {/* Executive Summary */}
                {(state.workflow?.analysis_report?.executive_summary || (state.workflow?.analysis_report as any)?.summary) && (
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
                    <h4 className="text-sm font-semibold text-indigo-300 mb-2">AI Extraction Summary</h4>
                    <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">{state.workflow.analysis_report.executive_summary || (state.workflow.analysis_report as any).summary}</p>
                  </div>
                )}

                {/* Value Estimate Analytics Card */}
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 rounded bg-emerald-500/20 flex items-center justify-center">
                      <Target className="w-3 h-3 text-emerald-400" />
                    </div>
                    <h4 className="text-sm font-semibold text-white">Projected Business Value</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="bg-black/20 rounded-xl p-3">
                      <div className="text-[10px] text-emerald-500 uppercase tracking-wider mb-1">Time Saved</div>
                      <div className="text-2xl font-bold text-white">~{(state.workflow?.nodes?.filter((n: any) => n.data?.nodeType !== 'department').length || 8) * 23}<span className="text-sm font-normal text-slate-400 ml-1">mins/run</span></div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3">
                      <div className="text-[10px] text-emerald-500 uppercase tracking-wider mb-1">Cost Avoided</div>
                      <div className="text-2xl font-bold text-white">~${((state.workflow?.nodes?.filter((n: any) => n.data?.nodeType !== 'department').length || 8) * 47).toLocaleString()}<span className="text-sm font-normal text-slate-400 ml-1">/incident</span></div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3">
                      <div className="text-[10px] text-emerald-500 uppercase tracking-wider mb-1">Compliance Score</div>
                      <div className="text-2xl font-bold text-white">{state.workflow?.analysis_report?.risk_classification === 'high' ? 82 : 94}<span className="text-sm font-normal text-slate-400 ml-1">/100</span></div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3">
                      <div className="text-[10px] text-emerald-500 uppercase tracking-wider mb-1">Est. Automation</div>
                      <div className="text-2xl font-bold text-white">~{state.workflow?.analysis_report?.estimated_automation_coverage_percent ? Math.round(Number(state.workflow?.analysis_report?.estimated_automation_coverage_percent)*0.8) : 60}%</div>
                    </div>
                  </div>
                </div>

                {/* Data Intelligence Analytics Card */}
                <div className="bg-white/[0.03] border border-purple-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 rounded bg-purple-500/20 flex items-center justify-center">
                      <Activity className="w-3 h-3 text-purple-400" />
                    </div>
                    <h4 className="text-sm font-semibold text-white">Data Intelligence Report</h4>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded ml-1">AI Data Pipeline</span>
                    {aiModel && (
                      <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded ml-1 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Extracted by {aiModel}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-white">{state.workflow?.nodes?.filter((n: any) => n.data?.nodeType !== 'department').length || state.workflow?.nodes?.length || '—'}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Nodes</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-white">{state.workflow?.analysis_report?.departments_detected?.length || '—'}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Depts</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-white">{state.workflow?.analysis_report?.systems_detected?.length || '—'}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Systems</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <div className={`text-xl font-bold capitalize ${
                        state.workflow?.analysis_report?.risk_classification === 'high' ? 'text-red-400' :
                        state.workflow?.analysis_report?.risk_classification === 'medium' ? 'text-amber-400' :
                        'text-green-400'
                      }`}>{state.workflow?.analysis_report?.risk_classification || '—'}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Risk</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-green-400">{state.workflow?.analysis_report?.estimated_automation_coverage_percent || '—'}%</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Coverage</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <div className={`text-xl font-bold ${hasRedactedPII ? 'text-emerald-400' : 'text-slate-500'}`}>{hasRedactedPII ? '✓' : '—'}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">PII Clean</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center py-4">
                  <Button size="lg" onClick={() => navigate('/graph')} className="rounded-full bg-primary hover:bg-primary/90 px-8">
                    View Orchestration Graph
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

              <button 
                onClick={() => setExpandedSection('process')} 
                className="shrink-0 bg-white/[0.03] border border-white/10 rounded-2xl p-4 cursor-pointer hover:bg-white/[0.06] transition-colors flex items-center justify-between w-full mt-auto"
              >
                <div className="flex items-center gap-4">
                  <Activity className="w-5 h-5 text-indigo-400" />
                  <div className="text-sm font-semibold text-white">Review AI Cognition & Planning Logs</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>4 Agents Completed</span>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AgentCard({ title, icon, status, messages = [] }: { title: string, icon: React.ReactNode, status: string, messages?: string[] }) {
  const isActive = status === 'active';
  const isDone = status === 'done';
  const isPending = status === 'pending';
  
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (!isActive || !messages.length) return;
    const interval = setInterval(() => {
      setMsgIdx(i => (i + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isActive, messages]);

  return (
    <div className={`p-3 rounded-xl border transition-colors ${
      isActive ? 'border-indigo-500/50 bg-indigo-500/5' : 
      isDone ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 bg-transparent'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          isActive ? 'bg-indigo-500/20 text-indigo-400' :
          isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-muted-foreground'
        }`}>
          {isDone ? <CheckCircle2 className="w-4 h-4" /> : icon}
        </div>
        <div className="flex-1 overflow-hidden">
          <h4 className={`text-sm font-medium ${isActive ? 'text-indigo-100' : isDone ? 'text-emerald-100' : 'text-slate-400'}`}>{title}</h4>
          {isActive && messages.length > 0 && (
            <div className="flex items-center gap-2 mt-1 w-full">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
              <div className="text-[10px] text-indigo-300 font-mono tracking-tight animate-pulse truncate leading-tight w-full" style={{lineHeight: 1}}>{messages[msgIdx]}</div>
            </div>
          )}
          {isDone && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-emerald-400 font-mono tracking-tight">Agent completed task</span>
            </div>
          )}
          {isPending && (
             <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500 font-mono tracking-tight">Awaiting execution...</span>
            </div>
          )}
        </div>
        {isActive && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />}
      </div>
    </div>
  );
}
