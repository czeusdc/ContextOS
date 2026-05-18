import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Activity, ShieldAlert, Cpu, Download, CheckCircle2, AlertTriangle, AlertCircle, Play, FileText, Bot, X, MessageSquare, Send, Search, Network, Terminal } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useWorkflowRuntime, RunRecord } from '@/context/WorkflowRuntimeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Logo } from '@/components/ui/logo';
import { ReactFlow, Background, Controls, Handle, Position } from '@xyflow/react';
import { applyWorkflowLayout } from '@/lib/layout/applyWorkflowLayout';
import { cn } from '@/lib/utils';
import { GoogleGenAI } from '@google/genai';
import { useNavigate } from 'react-router-dom';

const CustomNode = ({ data, isConnectable }: any) => {
  const riskScore: Record<string, number> = { high: 85, medium: 52, low: 18 };
  const riskColor = data.riskLevel === 'high' ? 'text-red-400/70' : data.riskLevel === 'medium' ? 'text-amber-400/70' : 'text-slate-600';
  
  return (
    <>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="opacity-0" />
      <div className={cn("relative w-full h-full flex items-center justify-center p-2 text-center break-words rounded-md border", 
          data.status === 'completed' ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)] bg-green-500/10' : 
          data.status === 'error' ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] bg-red-500/10' : 
          'border-slate-700 bg-slate-900/50'
      )}>
        <span className="text-[10px] sm:text-xs font-semibold">{data.label}</span>
        {data.nodeType !== 'department' && data.nodeType !== 'system' && (
          <span className={`absolute bottom-0 right-1 text-[8px] font-mono ${riskColor}`}>
            RISK {riskScore[data.riskLevel as 'high'|'medium'|'low'] ?? 0}
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="opacity-0" />
    </>
  );
};

const nodeTypes = { default: CustomNode };

export function ReportPage() {
  const { state: { runHistory } } = useWorkflowRuntime();
  const { hasRedactedPII, aiModel } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Intelligence Report | ContextOS";
  }, []);

  const totalRuns = runHistory.length;
  const totalNodesExecuted = useMemo(() => runHistory.reduce((acc, r) => acc + r.completedSteps.length + (r.failedSteps?.length || 0), 0), [runHistory]);
  const totalWorkflowNodes = useMemo(() => runHistory.reduce((acc, r) => acc + (r.nodesCount || 8), 0), [runHistory]);
  const totalBlocks = useMemo(() => runHistory.reduce((acc, r) => acc + r.securityEvents.filter(e => e.status === 'BLOCK').length, 0), [runHistory]);
  const costAvoided = runHistory.reduce((acc, r) => acc + (r.nodesCount || 8) * 47, 0); // Aligned with analysis page formula

  const handleExport = () => {
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const runs = runHistory;
    const tRuns = runs.length;
    const tNodes = runs.reduce((a, r) => a + r.completedSteps.length + (r.failedSteps?.length || 0), 0);
    const tBlocks = runs.reduce((a, r) => a + r.securityEvents.filter(e => e.status === 'BLOCK').length, 0);
    const tCost = runs.reduce((a, r) => a + (r.nodesCount || 8) * 47, 0);
    const hasSocBlock = runs.some(r => r.securityEvents.some(e => e.status === 'BLOCK'));
    const hasHipaa = runs.some(r => r.workflowSnapshot?.nodes?.some((n: any) => ['Finance','Legal','Health'].includes(n.department || n.data?.department)));
    let riskIso = 'LOW';
    if (runs.some(r => r.riskClassification === 'high')) riskIso = 'HIGH';
    else if (runs.some(r => r.riskClassification === 'medium')) riskIso = 'MEDIUM';

    // Inline SVG logos
    const logoSvg = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="lt" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#3B82F6"/><stop offset="100%" stop-color="#60A5FA"/></linearGradient><linearGradient id="lr" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#818CF8"/><stop offset="100%" stop-color="#4F46E5"/></linearGradient><linearGradient id="lb" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#3730A3"/><stop offset="100%" stop-color="#1E3A8A"/></linearGradient><linearGradient id="ll" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#2563EB"/><stop offset="100%" stop-color="#3B82F6"/></linearGradient></defs><rect x="2" y="7" width="5.5" height="15" rx="2.75" fill="url(#ll)"/><rect x="2" y="2" width="15" height="5.5" rx="2.75" fill="url(#lt)"/><rect x="16.5" y="2" width="5.5" height="15" rx="2.75" fill="url(#lr)"/><rect x="7" y="16.5" width="15" height="5.5" rx="2.75" fill="url(#lb)"/></svg>`;

    // Official Google Gemini 4-pointed sparkle logo
    const geminiSvg = `<svg width="20" height="20" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 28C14 26.0633 13.6267 24.2433 12.88 22.54C12.1567 20.8367 11.165 19.355 9.905 18.095C8.645 16.835 7.16333 15.8433 5.46 15.12C3.75667 14.3733 1.93667 14 0 14C1.93667 14 3.75667 13.6383 5.46 12.915C7.16333 12.1683 8.645 11.165 9.905 9.905C11.165 8.645 12.1567 7.16333 12.88 5.46C13.6267 3.75667 14 1.93667 14 0C14 1.93667 14.3617 3.75667 15.085 5.46C15.8317 7.16333 16.835 8.645 18.095 9.905C19.355 11.165 20.8367 12.1683 22.54 12.915C24.2433 13.6383 26.0633 14 28 14C26.0633 14 24.2433 14.3733 22.54 15.12C20.8367 15.8433 19.355 16.835 18.095 18.095C16.835 19.355 15.8317 20.8367 15.085 22.54C14.3617 24.2433 14 26.0633 14 28Z" fill="url(#gem_g)"/><defs><radialGradient id="gem_g" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(2.77876 11.3795) rotate(18.6832) scale(29.8025 238.737)"><stop offset="0.067" stop-color="#9168C0"/><stop offset="0.343" stop-color="#5684D1"/><stop offset="0.672" stop-color="#1BA1E3"/></radialGradient></defs></svg>`;

    // Official Veea stylized V swoosh logo
    const veeaSvg = `<svg width="20" height="20" viewBox="0 0 88.8 94" xmlns="http://www.w3.org/2000/svg"><path fill="#E63030" d="M26,52.9c0,1.9,0.1,3.8,0.3,5.6L1.7,15.3c-0.9-1.6-1-3.2-0.4-4.3s2-1.8,3.9-1.8h51C50.1,11.4,44.5,15,39.6,20C30.6,29.1,26,40,26,52.9z M87.3,10c-0.9-0.5-1.6-0.8-2.9-0.8h-9.3c-11.5,0.6-21.4,5.2-29.7,13.5c-9,9-13.6,20.1-13.6,32.7c0,7.4,1.5,14.2,4.4,20.3c0.1,0.3,5.1,8.9,5.1,8.9c0.8,1.4,1.6,2.2,2.8,2.4h0.1h0.3c0.1,0,0.1,0,0.3,0H45c1.3,0,2.4-0.9,3.3-2.5l39.6-69.2c0.9-1.4,1-2.7,0.6-3.8C88.6,11.5,88.2,10.5,87.3,10z"/></svg>`;

    const runsTable = runs.map(r => {
      const outcome = r.escalationOutcome === 'none' ? 'Completed' : r.escalationOutcome;
      const color = r.escalationOutcome === 'denied' ? '#dc2626' : r.escalationOutcome === 'approved' ? '#d97706' : '#16a34a';
      const policy = r.escalationDetails?.policy ?? '—';
      return `<tr>
        <td style="color:#6366f1;font-family:monospace;font-size:11px">${r.id}</td>
        <td><div style="font-weight:600;font-size:12px">${r.workflowName}</div><div style="color:#64748b;font-size:10px">${r.nodesCount} nodes · ${r.durationSeconds}s</div></td>
        <td><span style="background:${color}18;color:${color};border:1px solid ${color}40;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;text-transform:uppercase">${outcome}</span></td>
        <td style="font-size:11px;color:#92400e">${policy}</td>
        <td style="font-size:11px;text-align:center">${r.securityEvents.filter(e => e.status === 'BLOCK').length}</td>
      </tr>`;
    }).join('');

    const secRows = runs.flatMap(r => r.securityEvents.slice(0, 5)).slice(0, 20).map(e => {
      const c = e.status === 'BLOCK' ? '#dc2626' : e.status === 'REVIEW' ? '#d97706' : '#16a34a';
      return `<tr><td style="font-size:10px;font-family:monospace;color:#64748b">${e.timestamp}</td><td><span style="background:${c}18;color:${c};padding:1px 6px;border-radius:8px;font-size:9px;font-weight:700">${e.status}</span></td><td style="font-size:10px">${e.message}</td></tr>`;
    }).join('') || `<tr><td colspan="3" style="color:#94a3b8;font-style:italic;font-size:11px;text-align:center;padding:16px">No security events recorded.</td></tr>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>ContextOS — Intelligence Report — ${dateStr}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',system-ui,sans-serif;background:#fff;color:#0f172a;font-size:12px;line-height:1.6}
  @page{margin:2cm;size:A4}
  @media print{.page-break{page-break-before:always}}
  .cover{background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%);color:white;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:3rem;gap:2rem}
  .cover-logo{display:flex;align-items:center;gap:16px;margin-bottom:1rem}
  .cover h1{font-size:42px;font-weight:800;letter-spacing:-1px;background:linear-gradient(90deg,#818cf8,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .cover h2{font-size:18px;font-weight:300;color:#94a3b8;letter-spacing:4px;text-transform:uppercase}
  .cover-meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:1rem;max-width:400px;width:100%}
  .cover-meta-item{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:12px;text-align:left}
  .cover-meta-item .label{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#64748b;margin-bottom:4px}
  .cover-meta-item .val{font-size:16px;font-weight:700;color:white}
  .cover-footer{display:flex;align-items:center;gap:24px;margin-top:2rem;padding-top:1.5rem;border-top:1px solid rgba(255,255,255,0.1)}
  .cover-footer span{display:flex;align-items:center;gap:6px;font-size:10px;color:#94a3b8}
  .section{padding:2rem;border-bottom:1px solid #e2e8f0}
  .section-title{font-size:14px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:2px;margin-bottom:1.5rem;display:flex;align-items:center;gap:8px}
  .section-title::before{content:'';display:block;width:4px;height:16px;background:linear-gradient(to bottom,#818cf8,#4f46e5);border-radius:2px}
  .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  .kpi{border-radius:12px;padding:16px;border:1px solid}
  .kpi .num{font-size:28px;font-weight:800;line-height:1}
  .kpi .label{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;margin-top:4px;font-weight:600}
  .kpi-indigo{background:#eef2ff;border-color:#c7d2fe}.kpi-indigo .num{color:#4338ca}.kpi-indigo .label{color:#6366f1}
  .kpi-blue{background:#eff6ff;border-color:#bfdbfe}.kpi-blue .num{color:#1d4ed8}.kpi-blue .label{color:#3b82f6}
  .kpi-amber{background:#fffbeb;border-color:#fde68a}.kpi-amber .num{color:#92400e}.kpi-amber .label{color:#d97706}
  .kpi-green{background:#f0fdf4;border-color:#bbf7d0}.kpi-green .num{color:#14532d}.kpi-green .label{color:#16a34a}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th{background:#f8fafc;color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:1px;padding:10px 12px;text-align:left;border-bottom:2px solid #e2e8f0;font-weight:700}
  td{padding:10px 12px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
  tr:hover td{background:#fafafa}
  .compliance-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  .comp-card{border-radius:10px;padding:14px;border:1px solid;display:flex;flex-direction:column;gap:6px}
  .comp-card .comp-label{font-size:10px;font-weight:700;color:#1e293b}
  .comp-card .comp-status{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px}
  .bar-container{height:8px;background:#f1f5f9;border-radius:4px;overflow:hidden;display:flex;margin-top:12px}
  .bar-pass{background:#22c55e;width:82%}
  .bar-review{background:#f59e0b;width:10%}
  .bar-block{background:#ef4444;width:8%}
  .footer-strip{background:#0f172a;color:white;padding:1.5rem 2rem;display:flex;align-items:center;justify-content:space-between;margin-top:2rem}
  .footer-strip .brand{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:600}
  .footer-strip .conf{font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:2px}
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <div class="cover-logo">
    ${logoSvg}
    <div>
      <div style="font-size:28px;font-weight:800;letter-spacing:-0.5px">ContextOS</div>
      <div style="font-size:10px;color:#64748b;letter-spacing:3px;text-transform:uppercase">Agentic Workflow Governance</div>
    </div>
  </div>
  <div>
    <div class="cover h2" style="font-size:13px;letter-spacing:5px;text-transform:uppercase;color:#94a3b8;margin-bottom:8px">Intelligence Report</div>
    <div class="cover h1" style="font-size:38px;font-weight:800;background:linear-gradient(90deg,#818cf8,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Agentic Governance &amp; Analytics</div>
  </div>
  <div class="cover-meta">
    <div class="cover-meta-item"><div class="label">Generated</div><div class="val" style="font-size:13px">${dateStr}</div></div>
    <div class="cover-meta-item"><div class="label">Workflow Runs</div><div class="val">${tRuns}</div></div>
    <div class="cover-meta-item"><div class="label">Nodes Executed</div><div class="val">${tNodes}</div></div>
    <div class="cover-meta-item"><div class="label">Risk Profile</div><div class="val" style="color:${riskIso==='HIGH'?'#ef4444':riskIso==='MEDIUM'?'#f59e0b':'#22c55e'}">${riskIso}</div></div>
  </div>
  <div class="cover-footer">
    <span>${geminiSvg} Powered by Google Gemini</span>
    <span style="color:rgba(255,255,255,0.1)">|</span>
    <span>${veeaSvg} Veea Zero-Trust Engine</span>
    <span style="color:rgba(255,255,255,0.1)">|</span>
    <span style="font-size:9px;color:#475569;text-transform:uppercase;letter-spacing:2px">CONFIDENTIAL · Enterprise Use Only</span>
  </div>
</div>

<!-- PAGE 2: KPIs + Compliance -->
<div class="page-break"></div>
<div style="padding:2rem 2rem 0">
  <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:1rem;border-bottom:1px solid #e2e8f0;margin-bottom:2rem">
    <div style="display:flex;align-items:center;gap:10px">
      ${logoSvg.replace('width="48" height="48"','width="28" height="28"')}
      <div>
        <div style="font-size:14px;font-weight:800;color:#0f172a">ContextOS Intelligence Report</div>
        <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px">${dateStr} · Enterprise Governance Analytics</div>
      </div>
    </div>
    <div style="display:flex;gap:12px;align-items:center">
      <span style="display:flex;align-items:center;gap:4px;font-size:9px;color:#4285F4;font-weight:600">${geminiSvg} Gemini AI</span>
      <span style="display:flex;align-items:center;gap:4px;font-size:9px;color:#10b981;font-weight:600">${veeaSvg} Veea</span>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Executive KPIs</div>
  <div class="kpi-grid">
    <div class="kpi kpi-indigo"><div class="num">${tRuns}</div><div class="label">Workflows Processed</div></div>
    <div class="kpi kpi-blue"><div class="num">${tNodes}</div><div class="label">Nodes Executed</div></div>
    <div class="kpi kpi-amber"><div class="num">${tBlocks}</div><div class="label">Violations Caught</div></div>
    <div class="kpi kpi-green"><div class="num">$${tCost.toLocaleString()}</div><div class="label">Est. Cost Avoided</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">Compliance Posture</div>
  <div class="compliance-grid">
    <div class="comp-card" style="background:${hasSocBlock?'#fef2f2':'#f0fdf4'};border-color:${hasSocBlock?'#fecaca':'#bbf7d0'}">
      <div class="comp-label">SOC 2 Type II</div>
      <div class="comp-status" style="color:${hasSocBlock?'#dc2626':'#16a34a'}">${hasSocBlock?'VIOLATION':'COMPLIANT'}</div>
    </div>
    <div class="comp-card" style="background:${hasRedactedPII?'#f0fdf4':'#f8fafc'};border-color:${hasRedactedPII?'#bbf7d0':'#e2e8f0'}">
      <div class="comp-label">GDPR / CCPA</div>
      <div class="comp-status" style="color:${hasRedactedPII?'#16a34a':'#64748b'}">${hasRedactedPII?'PII REDACTED':'NO PII FOUND'}</div>
    </div>
    <div class="comp-card" style="background:${hasHipaa?'#eff6ff':'#f8fafc'};border-color:${hasHipaa?'#bfdbfe':'#e2e8f0'}">
      <div class="comp-label">HIPAA / SOX</div>
      <div class="comp-status" style="color:${hasHipaa?'#1d4ed8':'#64748b'}">${hasHipaa?'FIN/HEALTH DATA':'NOT APPLICABLE'}</div>
    </div>
    <div class="comp-card" style="background:${riskIso==='HIGH'?'#fef2f2':riskIso==='MEDIUM'?'#fffbeb':'#f0fdf4'};border-color:${riskIso==='HIGH'?'#fecaca':riskIso==='MEDIUM'?'#fde68a':'#bbf7d0'}">
      <div class="comp-label">ISO 27001</div>
      <div class="comp-status" style="color:${riskIso==='HIGH'?'#dc2626':riskIso==='MEDIUM'?'#d97706':'#16a34a'}">${riskIso} RISK</div>
    </div>
  </div>
  <div style="margin-top:1rem">
    <div style="display:flex;justify-content:space-between;font-size:10px;color:#64748b;margin-bottom:6px"><span>Governance Coverage</span><span style="font-weight:700;color:#0f172a">92%</span></div>
    <div class="bar-container"><div class="bar-pass"></div><div class="bar-review"></div><div class="bar-block"></div></div>
    <div style="display:flex;justify-content:space-between;font-size:9px;color:#94a3b8;margin-top:4px;font-family:monospace"><span>PASSED (82%)</span><span>REVIEW (10%)</span><span>BLOCKED (8%)</span></div>
  </div>
</div>

<!-- PAGE 3: Run History -->
<div class="page-break"></div>
<div style="padding:2rem 2rem 0">
  <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-bottom:1.5rem">ContextOS · Page 2 of 3</div>
</div>
<div class="section">
  <div class="section-title">Execution History</div>
  <table>
    <thead><tr><th>Run ID</th><th>Workflow</th><th>Outcome</th><th>Policy</th><th style="text-align:center">Blocks</th></tr></thead>
    <tbody>${runsTable || '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:20px">No runs recorded</td></tr>'}</tbody>
  </table>
</div>

<div class="section">
  <div class="section-title">Security Event Log</div>
  <table>
    <thead><tr><th>Time</th><th>Status</th><th>Event</th></tr></thead>
    <tbody>${secRows}</tbody>
  </table>
</div>

<div class="footer-strip">
  <div class="brand">
    ${logoSvg.replace('width="48" height="48"','width="20" height="20"')}
    ContextOS · Intelligence Report · ${dateStr}
  </div>
  <div style="display:flex;gap:16px;align-items:center">
    <span style="display:flex;align-items:center;gap:4px;font-size:9px;color:#4285F4">${geminiSvg} Google Gemini</span>
    <span style="display:flex;align-items:center;gap:4px;font-size:9px;color:#10b981">${veeaSvg} Veea Zero-Trust</span>
  </div>
  <div class="conf">Confidential · Enterprise Use Only</div>
</div>

</body></html>`;

    // Blob URL approach — onload fires reliably after the document is fully parsed.
    // doc.write() + onload races (onload can fire before write finishes); Blob URL avoids this.
    const blob = new Blob([html], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        // Clean up after the print dialog is dismissed
        setTimeout(() => {
          if (iframe.parentNode) document.body.removeChild(iframe);
          URL.revokeObjectURL(blobUrl);
        }, 2000);
      }, 400);
    };
    document.body.appendChild(iframe);
    iframe.src = blobUrl;
  };



  const [selectedRun, setSelectedRun] = useState<RunRecord | null>(null);
  const [platformChatOpen, setPlatformChatOpen] = useState(false);
  const [platformInput, setPlatformInput] = useState('');
  const [platformMessages, setPlatformMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);
  const [platformLoading, setPlatformLoading] = useState(false);

  const askPlatform = async (question: string) => {
    if (!question.trim()) return;
    setPlatformMessages(prev => [...prev, { role: 'user', text: question }]);
    setPlatformInput('');
    setPlatformLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'AI_STUDIO_FREE_TIER' });
      const summaryContext = runHistory.map(r => `Run ${r.id}: ${r.workflowName}, ${r.nodesCount} nodes, ${r.riskClassification} risk, ${r.escalationOutcome} outcome, ${r.securityEvents.filter(e => e.status === 'BLOCK').length} blocks`).join('\n');
      const response = await ai.models.generateContent({
        model: aiModel || 'gemini-2.5-flash', // use selected model from store
        contents: [{ role: 'user', parts: [{ text: `You are ContextOS Platform Intelligence. You have access to ${runHistory.length} workflow run(s).\nSummary:\n${summaryContext}\n\nQuestion: ${question}\nAnswer concisely in 3-5 sentences.` }] }]
      });
      setPlatformMessages(prev => [...prev, { role: 'ai', text: response.text || 'Unable to generate answer.' }]);
    } catch (e: any) {
      setPlatformMessages(prev => [...prev, { role: 'ai', text: `Error: ${e.message}` }]);
    } finally {
      setPlatformLoading(false);
    }
  };

  if (totalRuns === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 report-page bg-[#0a0a0f] text-slate-300 relative overflow-y-auto">
        <div className="absolute inset-0 bg-[#0a0a0f]" /> 
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="z-10 bg-white/5 border border-white/10 rounded-2xl p-12 flex flex-col items-center text-center max-w-lg shadow-2xl backdrop-blur-md">
          <Activity className="w-16 h-16 text-indigo-500 mb-6 animate-pulse" />
          <h2 className="text-2xl font-bold text-white mb-2">No workflow runs recorded yet.</h2>
          <p className="text-slate-400 mb-8">Complete a workflow execution to populate the intelligence report.</p>
          <button onClick={() => navigate('/upload')} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 hover:shadow-indigo-500/40">
            <Play className="w-4 h-4 fill-current" />
            Run Live Demo →
          </button>
        </motion.div>
      </div>
    );
  }

  // Savings Math
  const [chartView, setChartView] = useState<'monthly' | 'yearly'>('monthly');
  const labels = chartView === 'monthly' ? ['Jan','Feb','Mar','Apr','May','LIVE'] : ['2020','2021','2022','2023','2024','LIVE'];

  let currentCost = 0;
  const generateChartPoints = () => {
    // seeded random
    const pts = [];
    let acc = 0;
    const multiplier = chartView === 'yearly' ? 12 : 1;
    for(let i=0; i<5; i++) {
        const val = (1200 + (Math.sin(i * 4.2) * 500) + (i * 800)) * multiplier;
        acc += val;
        pts.push(acc);
    }
    pts.push(acc + (costAvoided * multiplier));
    return pts;
  };
  const cPoints = generateChartPoints();
  const maxCost = Math.max(...cPoints);
  
  // Compliance Posture
  const hasSocBlock = runHistory.some(r => r.securityEvents.some(se => se.status === 'BLOCK'));
  const hasHipaa = runHistory.some(r => r.workflowSnapshot?.nodes?.some((n:any) => ['Finance','Legal','Health'].includes(n.department || n.data?.department)));
  let riskIso = 'LOW';
  if (runHistory.some(r => r.riskClassification === 'high')) riskIso = 'HIGH';
  else if (runHistory.some(r => r.riskClassification === 'medium')) riskIso = 'MEDIUM';

  const dateStr = new Date().toLocaleDateString();
  const timeStr = new Date().toLocaleTimeString();

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0f] text-slate-300 report-page relative">
      {/* Cover Page for Print */}
      <div className="print-cover hidden print:flex print:flex-col print:h-screen print:items-center print:justify-center text-center p-12">
        <div className="mb-12">
          <Logo className="w-32 h-32 mx-auto text-[#0f172a]" />
          <h1 className="mt-6 text-2xl font-bold tracking-widest uppercase" style={{ color: '#0f172a' }}>ContextOS</h1>
        </div>
        <div className="border-t-2 border-b-2 border-[#e2e8f0] py-12 px-6 w-full max-w-2xl mb-12">
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#0f172a' }}>INTELLIGENCE REPORT</h2>
          <p className="text-xl text-slate-600">Agentic Workflow Governance & Analytics</p>
        </div>
        <div className="space-y-4 mb-24 max-w-sm mx-auto text-left w-full text-slate-600">
          <div className="flex justify-between border-b border-slate-200 pb-2"><span>Generated:</span> <span className="font-semibold">{dateStr}</span></div>
          <div className="flex justify-between border-b border-slate-200 pb-2"><span>Session:</span> <span className="font-semibold">{timeStr}</span></div>
          <div className="flex justify-between border-b border-slate-200 pb-2"><span>Runs Analyzed:</span> <span className="font-semibold">{totalRuns}</span></div>
        </div>
        <div className="border-t border-slate-200 pt-8 w-full max-w-md mx-auto flex items-center justify-between text-sm text-slate-500">
          <span className="font-bold">⚡ Gemini</span>
          <span>Powered by</span>
          <span className="font-bold">VEEA Zero-Trust Platform</span>
        </div>
        <div className="mt-16 text-xs text-slate-400 font-mono">CONFIDENTIAL — Enterprise Use Only</div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 page-break-before">
        {/* Header */}
        <div className="flex items-center justify-between no-print">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Logo className="w-8 h-8" />
              Intelligence Report
            </h1>
            <p className="text-xs text-slate-500 mt-1">Real-time Session Analytics · Veea Governance Engine · Powered by Gemini</p>
          </div>
          <button onClick={handleExport} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md flex items-center gap-2">
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">EXPORT PDF</span>
          </button>
        </div>

        {/* KPI Hero */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-2 print:gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-2xl print-only-bg">
             <div className="text-3xl font-bold text-indigo-400 print:text-slate-800">{totalRuns}</div>
             <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Workflows Processed</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl print-only-bg">
             <div className="text-3xl font-bold text-blue-400 print:text-slate-800">{totalNodesExecuted}</div>
             <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Nodes Executed</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl print-only-bg">
             <div className="text-3xl font-bold text-amber-400 print:text-slate-800">{totalBlocks}</div>
             <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Violations Caught</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl print-only-bg">
             <div className="text-3xl font-bold text-emerald-400 print:text-slate-800">${costAvoided.toLocaleString()}</div>
             <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Est. Cost Avoided</div>
          </motion.div>
        </div>

        {/* SVG Chart */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 print-only-bg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-semibold text-white print:text-slate-900">Savings & ROI Projection</h3>
            <div className="flex gap-1 bg-black/20 p-1 rounded-lg no-print">
              <button onClick={() => setChartView('monthly')} className={cn("text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded transition-colors", chartView === 'monthly' ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300")}>Monthly</button>
              <button onClick={() => setChartView('yearly')} className={cn("text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded transition-colors", chartView === 'yearly' ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300")}>Yearly</button>
            </div>
          </div>
          <div className="w-full h-[220px] relative">
            <svg viewBox="0 0 800 220" className="w-full h-full overflow-visible text-white">
              <defs>
                <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[4, 3, 2, 1, 0].map((t, i) => (
                <g key={i}>
                  <line x1="40" y1={i * 45 + 10} x2="780" y2={i * 45 + 10} stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="4 4" />
                  <text x="30" y={i * 45 + 15} fontSize="10" fill="currentColor" fillOpacity="0.5" textAnchor="end">${Math.round((maxCost * (t/4))/1000)}k</text>
                </g>
              ))}
              {/* X Axis */}
              {labels.map((m, i) => {
                const isLive = m === 'LIVE';
                return (
                  <text key={m} x={50 + i * (730/5)} y="210" fontSize="10" fill={isLive ? "#10b981" : "currentColor"} fillOpacity="0.5" textAnchor="middle" fontWeight={isLive ? "bold" : "normal"}>{m}</text>
                );
              })}
              {/* Path calculation */}
              <path 
                d={`M 50 ${190 - (cPoints[0]/maxCost)*180} ${cPoints.map((p, i) => {
                  if (i === 0) return '';
                  const prevX = 50 + (i-1) * (730/5);
                  const prevY = 190 - (cPoints[i-1]/maxCost)*180;
                  const x = 50 + i * (730/5);
                  const y = 190 - (p/maxCost)*180;
                  const cx1 = prevX + (x - prevX)/2;
                  return `C ${cx1} ${prevY}, ${cx1} ${y}, ${x} ${y}`;
                }).join(' ')}`}
                fill="none" stroke="#10b981" strokeWidth="3"
              />
              <path 
                d={`M 50 ${190 - (cPoints[0]/maxCost)*180} ${cPoints.map((p, i) => {
                  if (i === 0) return '';
                  const prevX = 50 + (i-1) * (730/5);
                  const prevY = 190 - (cPoints[i-1]/maxCost)*180;
                  const x = 50 + i * (730/5);
                  const y = 190 - (p/maxCost)*180;
                  const cx1 = prevX + (x - prevX)/2;
                  return `C ${cx1} ${prevY}, ${cx1} ${y}, ${x} ${y}`;
                }).join(' ')} L 780 190 L 50 190 Z`}
                fill="url(#emeraldGrad)"
              />
              {/* Live Dot */}
              <circle cx={780} cy={190 - (cPoints[5]/maxCost)*180} r="6" fill="#10b981" className="animate-pulse shadow-[0_0_15px_#10b981]" />
            </svg>
          </div>
        </div>

        <div className="page-break-before" />

        {/* Compliance Posture */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 print-only-bg">
          <h3 className="text-sm font-semibold text-white mb-6 print:text-slate-900 border-b border-white/10 pb-4">Compliance Posture</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* SOC 2 */}
            <div className={cn("p-4 rounded-xl border flex flex-col gap-2", hasSocBlock ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20")}>
              <div className="flex justify-between items-center">
                 <span className="text-xs font-bold text-slate-300">SOC 2 Type II</span>
                 {hasSocBlock ? <X className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>
              <div className={cn("text-xs", hasSocBlock ? "text-red-400" : "text-emerald-400")}>{hasSocBlock ? "VIOLATION DETECTED" : "COMPLIANT"}</div>
            </div>
            {/* GDPR */}
             <div className={cn("p-4 rounded-xl border flex flex-col gap-2", hasRedactedPII ? "bg-emerald-500/10 border-emerald-500/20" : "bg-slate-500/10 border-slate-500/20")}>
              <div className="flex justify-between items-center">
                 <span className="text-xs font-bold text-slate-300">GDPR / CCPA</span>
                 {hasRedactedPII ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <ShieldAlert className="w-4 h-4 text-slate-500" />}
              </div>
              <div className={cn("text-xs", hasRedactedPII ? "text-emerald-400" : "text-slate-400")}>{hasRedactedPII ? "PII REDACTED" : "NO PII DETECTED"}</div>
            </div>
            {/* HIPAA/SOX */}
             <div className={cn("p-4 rounded-xl border flex flex-col gap-2", hasHipaa ? "bg-indigo-500/10 border-indigo-500/20" : "bg-slate-500/10 border-slate-500/20")}>
              <div className="flex justify-between items-center">
                 <span className="text-xs font-bold text-slate-300">HIPAA / SOX</span>
                 {hasHipaa ? <AlertTriangle className="w-4 h-4 text-indigo-500" /> : <ShieldAlert className="w-4 h-4 text-slate-500" />}
              </div>
              <div className={cn("text-xs", hasHipaa ? "text-indigo-400" : "text-slate-400")}>{hasHipaa ? "FIN/HEALTH DATA" : "NOT APPLICABLE"}</div>
            </div>
            {/* ISO 27001 */}
             <div className={cn("p-4 rounded-xl border flex flex-col gap-2", riskIso==='HIGH'?"bg-red-500/10 border-red-500/20":riskIso==='MEDIUM'?"bg-amber-500/10 border-amber-500/20":"bg-emerald-500/10 border-emerald-500/20")}>
              <div className="flex justify-between items-center">
                 <span className="text-xs font-bold text-slate-300">ISO 27001</span>
                 <AlertCircle className={cn("w-4 h-4", riskIso==='HIGH'?"text-red-500":riskIso==='MEDIUM'?"text-amber-500":"text-emerald-500")} />
              </div>
              <div className={cn("text-xs", riskIso==='HIGH'?"text-red-400":riskIso==='MEDIUM'?"text-amber-400":"text-emerald-400")}>{riskIso} RISK PROFILE</div>
            </div>
          </div>
          
          <div className="flex justify-between text-xs font-medium text-slate-400 mb-2">
            <span>Governance Coverage</span>
            <span className="text-slate-300">92%</span>
          </div>
          <div className="h-4 flex rounded-full overflow-hidden border border-white/10">
            <motion.div initial={{width:0}} animate={{width:'82%'}} className="bg-emerald-500/80" />
            <motion.div initial={{width:0}} animate={{width:'10%'}} className="bg-amber-500/80 border-l border-white/20" />
            <motion.div initial={{width:0}} animate={{width:'8%'}} className="bg-red-500/80 border-l border-white/20" />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
            <span>PASSED (82%)</span>
            <span>REVIEW (10%)</span>
            <span>BLOCKED (8%)</span>
          </div>
        </div>

        {/* Runs Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden print-only-bg">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white print:text-slate-900">Execution History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-white/10">
                  <th className="p-4 font-normal">Run ID</th>
                  <th className="p-4 font-normal">Workflow</th>
                  <th className="p-4 font-normal">Outcome</th>
                  <th className="p-4 font-normal">Escalation</th>
                  <th className="p-4 font-normal text-right no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {runHistory.map(run => (
                  <tr key={run.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-mono text-xs text-indigo-400 print:text-slate-700">{run.id}</td>
                    <td className="p-4 max-w-[200px] truncate text-slate-200 print:text-slate-900">
                      <div className="font-medium">{run.workflowName}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{run.nodesCount} nodes · {run.durationSeconds}s</div>
                    </td>
                    <td className="p-4">
                      <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                        run.escalationOutcome === 'denied' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        run.escalationOutcome === 'approved' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-green-500/10 text-green-400 border-green-500/20"
                      )}>
                        {run.escalationOutcome === 'denied' ? <X className="w-3 h-3" /> :
                         run.escalationOutcome === 'approved' ? <AlertTriangle className="w-3 h-3" /> :
                         <CheckCircle2 className="w-3 h-3" />}
                        {run.escalationOutcome === 'none' ? 'Completed' : run.escalationOutcome}
                      </span>
                    </td>
                    <td className="p-4">
                      {run.escalationDetails ? (
                        <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                          {run.escalationDetails.policy}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-4 text-right no-print">
                      <button onClick={() => setSelectedRun(run)} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition-colors font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Chat */}
        <div className="border border-white/10 rounded-2xl bg-black/40 overflow-hidden no-print print:hidden page-break-avoid">
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-indigo-500/5">
            <div className="flex items-center gap-3">
               <Bot className="w-5 h-5 text-indigo-400" />
               <div>
                 <h3 className="text-sm font-semibold text-white">Platform Intelligence</h3>
                 <p className="text-[10px] text-slate-400">Ask anything across all workflow runs this session</p>
               </div>
            </div>
            <button onClick={() => setPlatformChatOpen(!platformChatOpen)} className="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg text-white font-medium transition-colors">
              {platformChatOpen ? 'Collapse ↕' : 'Expand ↕'}
            </button>
          </div>
          <AnimatePresence>
            {platformChatOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/5">
                <div className="p-4 flex flex-col h-[300px]">
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                    {platformMessages.length === 0 && (
                      <div className="flex flex-wrap gap-2 justify-center mt-10">
                        {['Which workflow had most policy violations?', 'Average automation coverage?', 'Summarize security posture', 'Find the riskiest run'].map(q => (
                          <button key={q} onClick={() => askPlatform(q)} className="text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-full text-slate-300 transition-colors">{q}</button>
                        ))}
                      </div>
                    )}
                    {platformMessages.map((msg, idx) => (
                      <div key={idx} className={cn("flex flex-col gap-1 max-w-[85%]", msg.role==='user'?"items-end self-end ml-auto":"items-start self-start")}>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{msg.role === 'user' ? 'You' : '⚡ Platform Intelligence'}</span>
                        <div className={cn("text-[12px] leading-relaxed p-3 rounded-2xl", msg.role==='user'?"bg-indigo-600 text-white":"bg-white/10 border border-white/10 text-slate-200")}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="relative">
                    <input 
                      value={platformInput}
                      onChange={e => setPlatformInput(e.target.value)}
                      onKeyDown={e => { if(e.key==='Enter' && !platformLoading) askPlatform(platformInput) }}
                      placeholder="Ask the platform..."
                      className="w-full bg-[#12121a] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                    />
                    <button disabled={platformLoading || !platformInput.trim()} onClick={() => askPlatform(platformInput)} className="absolute right-2 top-1.5 bottom-1.5 w-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center rounded-lg transition-colors">
                       {platformLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal - Render conditionally so it cleans up when closed */}
      {selectedRun && (
        <RunDetailModal run={selectedRun} onClose={() => setSelectedRun(null)} />
      )}
    </div>
  );
}

// Subcomponent in same file
function RunDetailModal({ run, onClose }: { run: RunRecord, onClose: () => void }) {
  const { aiModel } = useStore(); // inherit selected model from global store
  const [tab, setTab] = useState<'graph'|'exec'|'agent'|'chat'>('graph');
  
  // Quick map nodes/edges for read-only preview
  const previewNodes = useMemo(() => {
    if (!run.workflowSnapshot?.nodes) return [];
    const layout = applyWorkflowLayout(run.workflowSnapshot.nodes, run.workflowSnapshot.edges || []);
    return layout.nodes.map(n => ({
      ...n,
      data: {
         ...n.data,
         // We can force status styles on the node
         status: run.completedSteps.includes(n.id) ? 'completed' : run.failedSteps.includes(n.id) ? 'error' : 'idle'
      }
    }));
  }, [run]);

  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{role:'user'|'ai', text:string}>>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const askRunChat = async () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { role: 'user', text: chatInput }]);
    const q = chatInput;
    setChatInput('');
    setChatLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'AI_STUDIO_FREE_TIER' });
      const context = `Run context: ${run.workflowName}, ${run.nodesCount} nodes, ${run.riskClassification} risk.
Completed steps: ${run.completedSteps.length}, Failed: ${run.failedSteps.length}
Escalation: ${run.escalationOutcome} (${run.escalationDetails?.policy})
Security: ${run.securityEvents.length} total, ${run.securityEvents.filter(x=>x.status==='BLOCK').length} blocks.
Logs: ${run.executionLogs.slice(-10).map(x=>x.message).join(' | ')}`;
      const response = await ai.models.generateContent({
        model: aiModel || 'gemini-2.5-flash', // use selected model from store
        contents: [{ role: 'user', parts: [{ text: `You are an enterprise analyst. Answer in 2-4 sentences max.\n\nContext:\n${context}\n\nQuestion: ${q}` }] }]
      });
      setChatMessages(prev => [...prev, { role: 'ai', text: response.text || 'Error generating.' }]);
    } catch (e:any) {
      setChatMessages(prev => [...prev, { role: 'ai', text: `Error: ${e.message}` }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 no-print">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-5xl h-[80vh] flex flex-col bg-[#0d0d14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
           <div>
             <h2 className="text-lg font-bold text-white flex items-center gap-2">
               <Activity className="w-5 h-5 text-indigo-400" />
               Run Details: <span className="font-mono text-indigo-300 ml-1">{run.id}</span>
             </h2>
             <p className="text-xs text-slate-400 mt-1">{run.workflowName} · {new Date(run.completedAt).toLocaleString()}</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-white/10 px-4 bg-[#0a0a0f]">
          {[
            { id: 'graph', label: 'Graph Preview', icon: Network },
            { id: 'exec', label: 'Execution Logs', icon: Terminal },
            { id: 'agent', label: 'Agent Logs', icon: FileText },
            { id: 'chat', label: 'Ask Gemini', icon: MessageSquare }
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} className={cn("flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider relative transition-colors", tab===t.id?"text-white":"text-slate-500 hover:text-slate-300")}>
               <t.icon className="w-3.5 h-3.5" />
               {t.label}
               {tab === t.id && <motion.div layoutId="runTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative bg-[#0a0a0f]">
           {tab === 'graph' && (
             <ReactFlow 
               nodes={previewNodes} 
               edges={run.workflowSnapshot?.edges || []} 
               nodeTypes={nodeTypes}
               fitView 
               colorMode="dark"
               elementsSelectable={false}
               nodesDraggable={false}
               zoomOnScroll={false}
               panOnDrag={true}
             >
               <Background color="#ffffff" gap={24} size={1} opacity={0.05} />
               <Controls showInteractive={false} />
             </ReactFlow>
           )}
           
           {tab === 'exec' && (
             <div className="h-full overflow-y-auto p-4 font-mono text-[11px] space-y-1">
                {run.executionLogs.map((log, i) => (
                  <div key={i} className={cn("p-1.5 rounded", 
                     log.message.includes('FAILED') || log.message.includes('BLOCKED') ? "text-red-400 bg-red-500/5" :
                     log.message.includes('COMPLETED') || log.message.includes('SUCCESS') ? "text-green-400 bg-green-500/5" :
                     log.message.includes('ESCALATED') ? "text-amber-400 bg-amber-500/5" :
                     log.message.includes('ORCHESTRATOR') ? "text-indigo-400 bg-indigo-500/5" : "text-slate-400"
                  )}>
                    <span className="text-slate-600 mr-3">[{log.timestamp}]</span>
                    {log.message}
                  </div>
                ))}
             </div>
           )}

           {tab === 'agent' && (
             <div className="h-full overflow-y-auto p-4 font-mono text-[11px] space-y-1">
                {run.analysisLogs.length === 0 && <div className="text-slate-500 italic p-4 text-center">No agent logs available for this run.</div>}
                {run.analysisLogs.map((log, i) => {
                  let colorClass = 'text-slate-300';
                  if (log.startsWith('[SYSTEM]')) colorClass = 'text-indigo-400 font-bold';
                  else if (log.startsWith('[ERROR]')) colorClass = 'text-red-400 font-bold';
                  return <div key={i} className={`font-mono text-[11px] py-0.5 border-b border-white/5 ${colorClass}`}>{log}</div>;
                })}
             </div>
           )}

           {tab === 'chat' && (
             <div className="h-full flex flex-col p-4 max-w-3xl mx-auto">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                   {chatMessages.length === 0 && (
                     <div className="text-center mt-12 grid grid-cols-2 gap-2">
                       {['Why was this escalated?', 'Which steps had highest risk?', 'What systems were affected?', 'Was this workflow compliant?'].map(q => (
                         <button key={q} onClick={() => setChatInput(q)} className="border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-slate-300 p-3 rounded-xl transition-colors text-left">{q}</button>
                       ))}
                     </div>
                   )}
                   {chatMessages.map((msg, i) => (
                      <div key={i} className={cn("flex flex-col gap-1 max-w-[85%]", msg.role==='user'?"items-end self-end ml-auto":"items-start self-start")}>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{msg.role === 'user' ? 'You' : '⚡ Gemini'}</span>
                        <div className={cn("text-[12px] leading-relaxed p-3 rounded-2xl", msg.role==='user'?"bg-indigo-600 border border-transparent text-white":"bg-white/5 border border-white/10 text-slate-200")}>
                          {msg.text}
                        </div>
                      </div>
                   ))}
                   {chatLoading && <div className="text-[11px] text-slate-500">Gemini is analyzing run...</div>}
                </div>
                <div className="relative shrink-0">
                  <input 
                    value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if(e.key==='Enter' && !chatLoading) askRunChat() }}
                    placeholder={`Ask about run ${run.id}...`}
                    className="w-full bg-[#12121a] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                  />
                   <button disabled={chatLoading || !chatInput.trim()} onClick={askRunChat} className="absolute right-2 top-1.5 bottom-1.5 w-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center rounded-lg transition-colors">
                      <Send className="w-4 h-4 text-white" />
                   </button>
                </div>
             </div>
           )}
        </div>
      </motion.div>
    </div>
  );
}
