import React from 'react';
import { ShieldAlert, Fingerprint, Lock, ShieldCheck, AlertOctagon, Download, AlertTriangle, MessageSquare, Send, X, Loader2 as SpinnerIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { useWorkflowRuntime } from '@/context/WorkflowRuntimeContext';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { GoogleGenAI } from '@google/genai';
import { incrementApiCall, isApiLimitReached } from '@/lib/simulation/apiCounter';
import { getSecuritySimulatedResponse } from '@/lib/simulation/simulatedResponses';

const POLICY_RULES = [
  { id: 'SEC-447', name: 'Data Exfiltration Guard',       severity: 'HIGH',   triggerKey: 'BLOCK' },
  { id: 'IAM-221', name: 'Unauthorized Access Attempt',   severity: 'HIGH',   triggerKey: 'BLOCK' },
  { id: 'DLP-003', name: 'Bulk PII Export Control',       severity: 'MEDIUM', triggerKey: null },
  { id: 'PII-101', name: 'Personal Data Transmission',    severity: 'MEDIUM', triggerKey: null },
  { id: 'CMP-009', name: 'Cross-Department Authorization', severity: 'LOW',   triggerKey: null },
];

export function SecurityDashboard() {
  const { state: { securityEvents, workflow } } = useWorkflowRuntime();
  const { hasRedactedPII, aiModel } = useStore();

  const [chatOpen, setChatOpen] = React.useState(false);
  const [chatInput, setChatInput] = React.useState('');
  const [chatMessages, setChatMessages] = React.useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);
  const [chatLoading, setChatLoading] = React.useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    document.title = "Governance & Security | ContextOS";
  }, []);
  
  const blockedEvents = securityEvents.filter(e => e.status === 'BLOCK');
  const latestBlock = blockedEvents[0];

  const SUGGESTED_QUESTIONS = [
    'Why was the action blocked?',
    'What policies are active?',
    'How does the Veea Edge Enclave work?',
  ];

  const askSecurity = async (question: string) => {
    if (!question.trim()) return;
    setChatMessages(prev => [...prev, { role: 'user', text: question }]);
    setChatInput('');
    setChatLoading(true);

    // Simulated mode — return keyword-matched canned response
    if (aiModel === 'gemini-simulated' || isApiLimitReached()) {
      await new Promise(r => setTimeout(r, 800));
      setChatMessages(prev => [...prev, { role: 'ai', text: getSecuritySimulatedResponse(question) }]);
      setChatLoading(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'AI_STUDIO_FREE_TIER' });
      const context = JSON.stringify({
        security_events: securityEvents,
        active_policies: POLICY_RULES,
      });
      incrementApiCall();
      const response = await ai.models.generateContent({
        model: aiModel || 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: `You are ContextOS Platform Intelligence — a specialized enterprise security and governance assistant.
You ONLY answer questions about:
- The security events, policy violations, and guardrail blocks in the current session
- Active policies and compliance rules
- The Veea Edge Security Enclave and zero-trust configuration

If the question is not directly related to these topics, respond ONLY with:
"I can only assist with questions about security policies, guardrail events, and the Veea Edge enclave."

DO NOT answer general knowledge, science, history, or any topic outside enterprise governance and security.
Answer concisely in 2-4 sentences maximum.

Security context:
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

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const exportAuditLog = () => {
    const data = {
      generatedAt: new Date().toISOString(),
      tool: 'ContextOS v1.0',
      workflow: (workflow as any)?.workflow_name || 'Enterprise Workflow',
      summary: {
        total: securityEvents.length,
        blocked: securityEvents.filter(e => e.status === 'BLOCK').length,
        reviewed: securityEvents.filter(e => e.status === 'REVIEW').length,
        passed: securityEvents.filter(e => e.status === 'PASS').length,
      },
      events: securityEvents,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contextos_audit_log_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const departments = (workflow as any)?.analysis_report?.departments_detected || [];
  const needsHIPAA = departments.some((d: string) => d.toLowerCase().includes('health') || d.toLowerCase().includes('medical'));
  const needsSOX = departments.some((d: string) => d.toLowerCase().includes('finance') || d.toLowerCase().includes('legal'));

  return (
    <div className="flex flex-col w-full p-6 max-w-7xl mx-auto space-y-8 pb-16">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-blue-400" />
              Governance & Security
              <Badge variant="outline" className="ml-auto bg-blue-500/10 text-blue-400 border-blue-500/30 font-sans tracking-widest uppercase text-[10px]">
                 Powered by Veea Edge
              </Badge>
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Real-time Anomaly Detection &middot; Veea Zero-Trust Policy Engine</p>
          </div>
          <button
            onClick={exportAuditLog}
            disabled={securityEvents.length === 0}
            title={securityEvents.length === 0 ? 'Run a workflow first' : 'Export audit log as JSON'}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20"
          >
            <Download className="w-3.5 h-3.5" />
            Export Audit Log
          </button>
        </div>

        {/* Compliance Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className={`p-3 rounded-xl border flex items-center gap-3 ${blockedEvents.length > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}>
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold tracking-widest opacity-80">SOC 2 Type II</div>
              <div className="text-xs font-medium">{blockedEvents.length > 0 ? 'Anomaly Detected' : 'Audited & Active'}</div>
            </div>
          </div>
          <div className={`p-3 rounded-xl border flex items-center gap-3 ${hasRedactedPII ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400'}`}>
             <Fingerprint className="w-4 h-4 shrink-0" />
             <div>
               <div className="text-[10px] uppercase font-bold tracking-widest opacity-80">GDPR Art. 35</div>
               <div className="text-xs font-medium">{hasRedactedPII ? 'PII Redacted' : 'No PII Detected'}</div>
             </div>
          </div>
          <div className={`p-3 rounded-xl border flex items-center gap-3 ${(needsHIPAA || needsSOX) ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-white/5 border-white/10 text-slate-500 opacity-60'}`}>
             <Lock className="w-4 h-4 shrink-0" />
             <div>
               <div className="text-[10px] uppercase font-bold tracking-widest opacity-80">{needsHIPAA ? 'HIPAA §164' : needsSOX ? 'SOX Sec 404' : 'HIPAA / SOX'}</div>
               <div className="text-xs font-medium">{(needsHIPAA || needsSOX) ? 'Enforcing Boundaries' : 'Out of Scope'}</div>
             </div>
          </div>
          <div className={`p-3 rounded-xl border flex items-center gap-3 ${(workflow as any)?.analysis_report?.risk_classification === 'high' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}>
             <Fingerprint className="w-4 h-4 shrink-0" />
             <div>
               <div className="text-[10px] uppercase font-bold tracking-widest opacity-80">ISO 27001</div>
               <div className="text-xs font-medium uppercase">{(workflow as any)?.analysis_report?.risk_classification || 'Verified'} Risk Model</div>
             </div>
          </div>
        </div>

        {/* Anomaly Detection Banner */}
        {blockedEvents.length > 0 && (
          <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 animate-pulse" />
            <span className="text-sm text-red-400 font-medium">
              Behavioral Anomaly Detected &mdash; {blockedEvents.length} workflow step{blockedEvents.length > 1 ? 's' : ''} triggered automatic containment
            </span>
            <span className="ml-auto text-[10px] font-mono text-red-500/70 uppercase tracking-widest">SEC-447 · IAM-221</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Left: Prompt Feed */}
        <div className="flex flex-col gap-4 h-full">
          <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2 shrink-0">
            <Fingerprint className="w-4 h-4" />
            Live Guardrail Inspection
          </h3>
          <div className="flex-1 relative">
            <Card className="absolute inset-0 overflow-hidden flex flex-col bg-[#0d0d14] border-white/5 rounded-2xl shadow-xl">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence>
                  {securityEvents.map((feed) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    key={feed.id} 
                    className={`p-4 rounded-xl border ${
                      feed.status === 'BLOCK' 
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
                        : feed.status === 'REVIEW'
                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                        : 'bg-white/[0.03] border-white/10 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {feed.status === 'BLOCK' ? (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-mono text-xs">
                          BLOCKED
                        </Badge>
                      ) : feed.status === 'REVIEW' ? (
                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 font-mono text-xs">
                          REVIEW REQUIRED
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 font-mono text-xs">
                          PASSED
                        </Badge>
                      )}
                      <span className="text-xs uppercase opacity-50 font-mono">
                        {feed.timestamp}
                      </span>
                    </div>
                    {feed.policyContext && (
                      <div className="text-[10px] font-mono tracking-wider opacity-60 mb-1 border-b border-white/5 pb-1 inline-block">
                        {feed.policyContext}
                      </div>
                    )}
                    <p className="font-mono text-sm leading-relaxed tracking-tight">
                      {feed.message}
                    </p>
                  </motion.div>
                ))}
                {securityEvents.length === 0 && (
                   <div className="text-slate-500 text-sm italic p-4 text-center">No security events triggered yet. Run a workflow to view the live inspection.</div>
                )}
              </AnimatePresence>
            </div>
          </Card>
          </div>
        </div>

        {/* Right: Blocked Action Audit */}
        <div className="flex flex-col gap-4 h-full">
          <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2 shrink-0">
            <Lock className="w-4 h-4" />
            Audit Findings
          </h3>
          
          <div className="flex-1">
            <AnimatePresence>
              {latestBlock ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl bg-amber-950/10 border border-amber-900/30 p-1 overflow-hidden"
                >
                  <div className="bg-[#0d0d14] w-full h-full rounded-xl p-6 relative overflow-hidden ring-1 ring-amber-500/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />
                    
                    <div className="flex items-start gap-4 mb-6">
                      <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                        <AlertOctagon className="w-8 h-8 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white mb-1 tracking-tight">Critical Action Blocked</h4>
                        <p className="text-slate-400 text-sm">Automated workflow attempted restricted operation.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-3 border-b border-white/5 py-3">
                        <span className="text-slate-400 text-sm">Target Action</span>
                        <span className="col-span-2 text-white font-mono text-sm text-amber-400">
                          {latestBlock.message.match(/'([^']+)'/)?.[1] || latestBlock.message.split('violated')[0] || "Restricted Operation"}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 border-b border-white/5 py-3">
                        <span className="text-slate-400 text-sm">Target System</span>
                        <span className="col-span-2 text-white text-sm">Enterprise Identity / Finance</span>
                      </div>
                      
                      <div className="grid grid-cols-3 border-b border-white/5 py-3">
                        <span className="text-slate-400 text-sm">Risk Score</span>
                        <div className="col-span-2 flex items-center gap-3">
                          <span className="text-white text-sm font-semibold">94/100</span>
                          <div className="flex-1 h-2 bg-black/50 rounded-full overflow-hidden">
                            <div className="h-full w-[94%] bg-amber-500 rounded-full" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 border-b border-white/5 py-3">
                        <span className="text-slate-400 text-sm">Violated Policy</span>
                        <span className="col-span-2 text-white text-sm">
                          {latestBlock.policyContext || "PII Exfiltration Prevention"}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                  <div className="rounded-2xl bg-[#0d0d14] border border-white/5 p-6 flex flex-col items-center justify-center min-h-[300px] text-center gap-3">
                     <ShieldCheck className="w-10 h-10 text-blue-500/50" />
                     {securityEvents.length > 0 ? (
                        <p className="text-slate-400 text-sm max-w-[200px]">Veea Governance engine intercepted {securityEvents.length} privileged workflow actions. No unresolved security violations detected.</p>
                     ) : (
                        <p className="text-slate-500 text-sm">Awaiting workflow execution to monitor for security events across the edge network.</p>
                     )}
                  </div>
              )}
            </AnimatePresence>
          </div>

          <Card className="p-6 bg-gradient-to-br from-[#0d0d14] to-[#0a1128] flex flex-col justify-center border-blue-900/30 rounded-2xl shadow-xl relative overflow-hidden mt-auto min-h-[140px]">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
             <div className="text-center max-w-sm mx-auto relative z-10">
               <ShieldCheck className="w-10 h-10 text-blue-400/80 mx-auto mb-3" />
               <h4 className="text-white font-medium mb-1 tracking-wide text-sm">Veea Edge Security Enclave</h4>
               <p className="text-slate-400 text-xs leading-relaxed">
                 All autonomous AI actions are processed securely at the edge, complying with enterprise RBAC boundaries and DLP constraints via Veea zero-trust isolation.
               </p>
             </div>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4" />
          Active Policy Ruleset
        </h3>
        <Card className="bg-[#0d0d14] border-white/5 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.01]">
            <h4 className="text-sm font-medium text-white tracking-wide">Policy Engine &middot; 5 Rules Loaded &middot; Veea Edge v2.1</h4>
          </div>
          <div className="divide-y divide-white/5">
            {POLICY_RULES.map(rule => {
              const triggeredEvent = rule.triggerKey === 'BLOCK' ? securityEvents.find(e => e.status === 'BLOCK') : undefined;
              const isTriggered = !!triggeredEvent;
              
              return (
                <div key={rule.id} className="p-4 px-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-3 w-3">
                      {isTriggered && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${isTriggered ? 'bg-red-500' : 'bg-green-500'}`}></span>
                    </div>
                    <span className="font-mono text-xs text-slate-400 w-20">{rule.id}</span>
                    <span className="text-sm text-slate-200">{rule.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm",
                      rule.severity === 'HIGH' ? "text-red-400 bg-red-500/10" :
                      rule.severity === 'MEDIUM' ? "text-amber-400 bg-amber-500/10" :
                      "text-slate-400 bg-white/5"
                    )}>
                      {rule.severity}
                    </span>
                    <div className={cn("text-[10px] font-mono tracking-widest px-2 py-1 rounded-full border min-w-[120px] text-center",
                      isTriggered ? "text-red-400 border-red-500/20 bg-red-500/10" : "text-green-400 border-green-500/20 bg-green-500/10"
                    )}>
                      {isTriggered ? `TRIGGERED · ${triggeredEvent?.timestamp.split(' ')[0]}` : 'ACTIVE'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Ask Security — RAG Chat Panel */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {chatOpen && (
          <div className="w-80 bg-[#0d0d14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '420px' }}>
            <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-white">Ask Security</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">Gemini RAG</span>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0" style={{ maxHeight: '260px' }}>
              {chatMessages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-500 text-center mb-3">Ask about the edge enclave and live intercepts</p>
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => askSecurity(q)}
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
                  onKeyDown={(e) => { if (e.key === 'Enter' && !chatLoading) askSecurity(chatInput); }}
                  placeholder="Ask about governance..."
                  className="flex-1 text-[11px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                />
                <button
                  onClick={() => askSecurity(chatInput)}
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
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-lg shadow-purple-900/30 transition-all"
        >
          <MessageSquare className="w-4 h-4" />
          Ask Security
        </button>
      </div>
    </div>
  );
}
