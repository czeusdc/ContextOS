import React from 'react';
import { ShieldAlert, Fingerprint, Lock, ShieldCheck, AlertOctagon, Download, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { useWorkflowRuntime } from '@/context/WorkflowRuntimeContext';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const POLICY_RULES = [
  { id: 'SEC-447', name: 'Data Exfiltration Guard',       severity: 'HIGH',   triggerKey: 'BLOCK' },
  { id: 'IAM-221', name: 'Unauthorized Access Attempt',   severity: 'HIGH',   triggerKey: 'BLOCK' },
  { id: 'DLP-003', name: 'Bulk PII Export Control',       severity: 'MEDIUM', triggerKey: null },
  { id: 'PII-101', name: 'Personal Data Transmission',    severity: 'MEDIUM', triggerKey: null },
  { id: 'CMP-009', name: 'Cross-Department Authorization', severity: 'LOW',   triggerKey: null },
];

export function SecurityDashboard() {
  const { state: { securityEvents, workflow } } = useWorkflowRuntime();
  const { hasRedactedPII } = useStore();

  React.useEffect(() => {
    document.title = "Governance & Security | ContextOS";
  }, []);
  
  const blockedEvents = securityEvents.filter(e => e.status === 'BLOCK');
  const latestBlock = blockedEvents[0];

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Prompt Feed */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2 shrink-0">
            <Fingerprint className="w-4 h-4" />
            Live Guardrail Inspection
          </h3>
          <Card className="overflow-hidden flex flex-col bg-[#0d0d14] border-white/5 rounded-2xl shadow-xl min-h-[300px] max-h-[520px]">
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

        {/* Right: Blocked Action Audit */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2 shrink-0">
            <Lock className="w-4 h-4" />
            Audit Findings
          </h3>
          
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
          
          <Card className="p-6 bg-gradient-to-br from-[#0d0d14] to-[#0a1128] flex flex-col justify-center border-blue-900/30 rounded-2xl shadow-xl mt-4 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
             <div className="text-center max-w-sm mx-auto relative z-10">
               <ShieldCheck className="w-12 h-12 text-blue-400/80 mx-auto mb-4" />
               <h4 className="text-white font-medium mb-2 tracking-wide">Veea Edge Security Enclave</h4>
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

    </div>
  );
}
