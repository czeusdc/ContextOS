import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, Activity, ShieldAlert, Cpu, Download, CheckCircle2, 
  AlertTriangle, AlertCircle, Play, FileText, Bot, X, MessageSquare, 
  Send, Search, Network, Terminal, Loader2 as SpinnerIcon, Grid,
  Zap, TrendingUp, Layers, Lock, Share2, Printer, Map, Lightbulb
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useWorkflowRuntime, RunRecord } from '@/context/WorkflowRuntimeContext';
import { ReactFlow, Background, Controls, Handle, Position } from '@xyflow/react';
import { applyWorkflowLayout } from '@/lib/layout/applyWorkflowLayout';
import { cn } from '@/lib/utils';
import { GoogleGenAI } from '@google/genai';
import { useNavigate } from 'react-router-dom';
import { incrementApiCall, isApiLimitReached } from '@/lib/simulation/apiCounter';
import { getPlatformSimulatedResponse, getRunDetailSimulatedResponse } from '@/lib/simulation/simulatedResponses';
import jsPDF from 'jspdf';
import { toJpeg } from 'html-to-image';
import { Logo } from '@/components/ui/logo';

import geminiLogo from '@/assets/gemini-logo.svg';
import veeaLogo from '@/assets/veea-logo.svg';

const CustomNode = ({ data, isConnectable }: any) => {
  const riskScore: Record<string, number> = { high: 85, medium: 52, low: 18 };
  const riskColor = data.riskLevel === 'high' ? 'text-rose-400/70' : data.riskLevel === 'medium' ? 'text-amber-400/70' : 'text-slate-600';
  
  return (
    <>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="opacity-0" />
      <div className={cn("relative w-full h-full flex items-center justify-center p-2 text-center break-words rounded-md border", 
          data.status === 'completed' ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] bg-emerald-500/10' : 
          data.status === 'error' ? 'border-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.4)] bg-rose-500/10' : 
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
  const reportRef = useRef<HTMLDivElement>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);
  const recommendationsRef = useRef<HTMLDivElement>(null);
  const pdfHeaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Executive Intelligence | ContextOS";
  }, []);

  const totalRuns = runHistory.length;
  const totalNodesExecuted = useMemo(() => runHistory.reduce((acc, r) => acc + r.completedSteps.length + (r.failedSteps?.length || 0), 0), [runHistory]);
  const totalWorkflowNodes = useMemo(() => runHistory.reduce((acc, r) => acc + (r.nodesCount || 8), 0), [runHistory]);
  const totalBlocks = useMemo(() => runHistory.reduce((acc, r) => acc + r.securityEvents.filter(e => e.status === 'BLOCK').length, 0), [runHistory]);
  const costAvoided = runHistory.reduce((acc, r) => acc + (r.nodesCount || 8) * 47, 0);
  
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!reportRef.current || !heroRef.current || !metricsRef.current || !chartsRef.current || !recommendationsRef.current || !pdfHeaderRef.current) return;
    setIsExporting(true);
    // Add a slight delay to ensure UI is completely painted
    await new Promise(r => setTimeout(r, 100));
    try {
      // 1. Snapshot the header
      const headerImgData = await toJpeg(pdfHeaderRef.current, {
        quality: 0.95,
        backgroundColor: '#0a0a0f',
        style: { transform: 'scale(1)', transformOrigin: 'top left', width: '1000px', height: '100px' },
        pixelRatio: 2,
        skipFonts: true
      });
      
      const { default: autoTable } = await import('jspdf-autotable');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 12;
      
      const headerHeightMM = 20; // 100px mapped roughly to 20mm
      let currentY = margin + headerHeightMM + 5;
      
      const drawHeader = (p: jsPDF) => {
         p.setFillColor(10, 10, 15);
         p.rect(0, 0, pdfWidth, pdfHeight, 'F');
         p.addImage(headerImgData, 'JPEG', margin, margin, pdfWidth - margin * 2, headerHeightMM);
      };
      
      const captureSection = async (ref: React.RefObject<HTMLDivElement>, yPos: number): Promise<number> => {
        if (!ref.current) return yPos;
        const imgData = await toJpeg(ref.current, {
           quality: 0.95,
           backgroundColor: '#0a0a0f',
           skipFonts: true,
           fontEmbedCSS: '',
           pixelRatio: 2,
           filter: (node) => !(node.hasAttribute && node.hasAttribute('data-html2canvas-ignore'))
        });
        const wpx = ref.current.offsetWidth;
        const hpx = ref.current.offsetHeight;
        const displayWidth = pdfWidth - margin * 2;
        const displayHeight = (hpx * displayWidth) / wpx;
        
        if (yPos + displayHeight > pdfHeight - margin - 15) {
           pdf.addPage();
           drawHeader(pdf);
           yPos = margin + headerHeightMM + 5;
        }
        
        pdf.addImage(imgData, 'JPEG', margin, yPos, displayWidth, displayHeight);
        return yPos + displayHeight + 5;
      };

      // Draw first page header
      drawHeader(pdf);

      currentY = await captureSection(heroRef, currentY);
      currentY = await captureSection(metricsRef, currentY);
      currentY = await captureSection(chartsRef, currentY);
      currentY = await captureSection(recommendationsRef, currentY);

      // Now add the table using autoTable
      const tableData = runHistory.map(run => [
         run.workflowName + '\\nID: ' + run.id,
         run.nodesCount + ' Nodes | ' + run.durationSeconds + 's compute',
         run.escalationOutcome === 'denied' ? 'BLOCKED' : run.escalationOutcome === 'approved' ? 'ESCALATED' : 'PASSED'
      ]);

      if (currentY + 20 > pdfHeight - margin - 15) {
         pdf.addPage();
         drawHeader(pdf);
         currentY = margin + headerHeightMM + 5;
      }

      autoTable(pdf, {
        startY: currentY,
        head: [['Session Trace', 'Context Flow', 'Security Posture']],
        body: tableData,
        theme: 'grid',
        styles: { fillColor: [13, 13, 20], textColor: [200, 200, 200], lineColor: [40, 40, 40], fontSize: 9 },
        headStyles: { fillColor: [20, 20, 30], textColor: [255, 255, 255], fontStyle: 'bold' },
        margin: { left: margin, right: margin, bottom: margin + 15, top: margin + headerHeightMM + 5 },
        willDrawPage: (data) => {
           if (data.pageNumber > 1) {
               drawHeader(pdf);
           }
        }
      });
      
      // Footer text on all pages
      const pages = (pdf.internal as any).getNumberOfPages();
      for (let j = 1; j <= pages; j++) {
        pdf.setPage(j);
        pdf.setFontSize(8);
        pdf.setTextColor(100);
        pdf.text('CONFIDENTIAL // INTERNAL USE ONLY', margin, pdfHeight - 8);
        pdf.text(`PAGE ${j} OF ${pages}`, pdfWidth / 2, pdfHeight - 8, { align: 'center' });
        pdf.text('CONTEXTOS ENTERPRISE EDITION', pdfWidth - margin, pdfHeight - 8, { align: 'right' });
      }

      const dateStrFile = new Date().toLocaleDateString('en-CA');
      pdf.save(`ContextOS-Executive-Report-${dateStrFile}.pdf`);
    } catch (e) {
      console.error("PDF Export failed:", e);
    } finally {
      setIsExporting(false);
    }
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

    if (aiModel === 'gemini-simulated' || isApiLimitReached()) {
      await new Promise(r => setTimeout(r, 900));
      setPlatformMessages(prev => [...prev, { role: 'ai', text: getPlatformSimulatedResponse(question) }]);
      setPlatformLoading(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'AI_STUDIO_FREE_TIER' });
      const summaryContext = runHistory.map(r => `Run ${r.id}: ${r.workflowName}, ${r.nodesCount} nodes, ${r.riskClassification} risk, ${r.escalationOutcome} outcome, ${r.securityEvents.filter(e => e.status === 'BLOCK').length} blocks`).join('\\n');
      incrementApiCall();
      const response = await ai.models.generateContent({
        model: aiModel || 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: `You are ContextOS Platform Intelligence... Run Summary: ${summaryContext} Question: ${question}` }] }]
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#0a0a0f] text-slate-300 relative overflow-y-auto">
        <div className="absolute inset-0 bg-[#0a0a0f]" /> 
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="z-10 bg-[#0d0d14] border border-white/5 rounded-3xl p-12 flex flex-col items-center text-center max-w-lg shadow-[0_0_80px_rgba(79,70,229,0.1)]">
          <Activity className="w-16 h-16 text-indigo-500 mb-6 animate-pulse" />
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Intelligence Not Ready</h2>
          <p className="text-slate-400 mb-8 text-sm">Execute a workflow digital twin simulation to generate the enterprise intelligence report.</p>
          <button onClick={() => navigate('/upload')} className="flex items-center gap-2 bg-white text-black hover:bg-slate-200 px-6 py-3 rounded-full text-sm font-semibold transition-all">
            <Play className="w-4 h-4 fill-current" />
            Initialize Simulation
          </button>
        </motion.div>
      </div>
    );
  }

  const [chartView, setChartView] = useState<'monthly' | 'yearly'>('monthly');
  const labels = chartView === 'monthly' ? ['Jan','Feb','Mar','Apr','May','LIVE'] : ['2020','2021','2022','2023','2024','LIVE'];

  const generateChartPoints = () => {
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
  
  const hasSocBlock = runHistory.some(r => r.securityEvents.some(se => se.status === 'BLOCK'));
  const hasHipaa = runHistory.some(r => r.workflowSnapshot?.nodes?.some((n:any) => ['Finance','Legal','Health'].includes(n.department || n.data?.department)));
  let riskIso = 'LOW';
  if (runHistory.some(r => r.riskClassification === 'high')) riskIso = 'HIGH';
  else if (runHistory.some(r => r.riskClassification === 'medium')) riskIso = 'MEDIUM';

  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

  return (
    <div className="flex-1 bg-[#0a0a0f] text-slate-300 relative font-sans overflow-x-hidden">
      
      {/* Hidden PDF Elements */}
      <div style={{ position: 'fixed', top: '-10000px', left: '-10000px', width: '1000px', zIndex: -1 }}>
         <div ref={pdfHeaderRef} className="bg-[#0a0a0f] p-8 border-b border-indigo-500/20 flex justify-between items-center text-white font-sans h-[100px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div className="flex items-center gap-4">
               <div className="flex items-center justify-center w-12 h-12 bg-indigo-500/20 border border-indigo-500/30 rounded-xl">
                 <Logo className="w-6 h-6" />
               </div>
               <div>
                  <div className="font-bold text-2xl tracking-tight leading-none mb-1 text-white">ContextOS</div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-[0.2em] font-medium">Executive Intelligence</div>
               </div>
            </div>
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block text-right mt-1">Secured By</span>
                  <img src={veeaLogo} className="w-6 h-6 filter grayscale invert brightness-200 opacity-80" />
               </div>
               <div className="w-px h-8 bg-white/10"></div>
               <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block text-right mt-1">Intelligence</span>
                  <img src={geminiLogo} className="w-6 h-6" />
               </div>
            </div>
         </div>
      </div>
      <div className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center no-print border-t border-white/5">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <Logo className="w-5 h-5" />
           </div>
           <div>
             <h1 className="text-sm font-semibold text-white tracking-tight">Executive Intelligence Report</h1>
             <p className="text-[10px] text-slate-500 font-mono">ID: CX-REP-{Math.floor(Math.random()*10000).toString().padStart(4,'0')} • {dateStr}</p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={handleExport} disabled={isExporting} className="bg-white hover:bg-slate-200 text-black px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
             {isExporting ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
             {isExporting ? 'Generating PDF...' : 'Export PDF'}
           </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-4 md:p-8 lg:p-12 space-y-12" ref={reportRef}>
        
        <div ref={heroRef} className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d0d14] p-8 md:p-12">
           <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
           <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
           <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
           
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8">
              <div className="max-w-2xl">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase font-bold tracking-widest text-slate-300 mb-6">
                    <img src={geminiLogo} alt="Gemini" className="w-3 h-3" />
                    AI-Authored Observation
                 </div>
                 <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-4 text-balance">
                    Operational Intelligence & <br/>Governance Summary
                 </h1>
                 <p className="text-slate-400 text-sm md:text-base leading-relaxed text-balance">
                    Executive overview of automated workflow executions, intercepted policy violations, and systemic risk analysis generated by the ContextOS orchestration engine.
                 </p>
              </div>
              <div className="shrink-0 flex flex-col gap-4 bg-black/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl min-w-[280px]">
                 <div>
                   <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">Generated At</div>
                   <div className="text-sm text-white font-mono">{dateStr} {timeStr}</div>
                 </div>
                 <div>
                   <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">Security Enforcement</div>
                   <div className="flex items-center gap-2 text-sm text-white font-mono">
                      <img src={veeaLogo} alt="Veea" className="w-4 h-4 opacity-70 filter invert grayscale brightness-200 contrast-200 mix-blend-screen" />
                      Veea Boundary Active
                   </div>
                 </div>
                 <div className="pt-4 border-t border-white/10">
                   <div className="flex items-center justify-between">
                     <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Overall Risk Iso</span>
                     <span className={cn("text-xs font-bold px-2 py-0.5 rounded", riskIso==='HIGH'?'bg-rose-500/20 text-rose-400':riskIso==='MEDIUM'?'bg-amber-500/20 text-amber-400':'bg-emerald-500/20 text-emerald-400')}>{riskIso}</span>
                   </div>
                 </div>
              </div>
           </div>
        </div>

        <div ref={metricsRef}>
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-400" /> Executive Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0d0d14] border border-white/5 p-6 rounded-2xl flex flex-col relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
               <Activity className="w-5 h-5 text-indigo-500/70 mb-4" />
               <div className="text-3xl font-bold text-white tracking-tight">{totalRuns}</div>
               <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest font-semibold">Simulations Run</div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#0d0d14] border border-white/5 p-6 rounded-2xl flex flex-col relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
               <Layers className="w-5 h-5 text-emerald-500/70 mb-4" />
               <div className="text-3xl font-bold text-white tracking-tight">{totalNodesExecuted}</div>
               <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest font-semibold">Nodes Orchestrated</div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#0d0d14] border border-white/5 p-6 rounded-2xl flex flex-col relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
               <Lock className="w-5 h-5 text-amber-500/70 mb-4" />
               <div className="text-3xl font-bold text-white tracking-tight">{totalBlocks}</div>
               <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest font-semibold">Policy Intercepts</div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#0d0d14] border border-emerald-500/20 p-6 rounded-2xl flex flex-col relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
               <Zap className="w-5 h-5 text-emerald-400 mb-4" />
               <div className="text-3xl font-bold text-emerald-400 tracking-tight">${costAvoided.toLocaleString()}</div>
               <div className="text-[11px] text-emerald-500/70 mt-1 uppercase tracking-widest font-semibold">Est. Capital Preserved</div>
            </motion.div>
          </div>
        </div>

        <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-[#0d0d14] border border-white/5 rounded-3xl p-8 flex flex-col">
              <div className="flex justify-between items-start mb-8">
                 <div>
                   <h3 className="text-base font-bold text-white">Efficiency Forecasting</h3>
                   <p className="text-xs text-slate-500 mt-1">Projected operational cost savings over time.</p>
                 </div>
                 <div className="flex bg-black/40 p-1 rounded-lg border border-white/5" data-html2canvas-ignore>
                   <button onClick={() => setChartView('monthly')} className={cn("text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-md transition-all", chartView === 'monthly' ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-slate-300")}>Monthly</button>
                   <button onClick={() => setChartView('yearly')} className={cn("text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-md transition-all", chartView === 'yearly' ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-slate-300")}>Yearly</button>
                 </div>
              </div>
              <div className="flex-1 w-full relative min-h-[200px] mt-auto">
                <svg viewBox="0 0 800 220" className="w-full h-full overflow-visible text-slate-300">
                  <defs>
                    <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[4, 3, 2, 1, 0].map((t, i) => (
                    <g key={i}>
                      <line x1="40" y1={i * 45 + 10} x2="780" y2={i * 45 + 10} stroke="currentColor" strokeOpacity="0.05" strokeWidth="1" strokeDasharray="4 4" />
                      <text x="30" y={i * 45 + 14} fontSize="10" fill="currentColor" fillOpacity="0.4" textAnchor="end" fontFamily="monospace">${Math.round((maxCost * (t/4))/1000)}k</text>
                    </g>
                  ))}
                  {labels.map((m, i) => {
                    const isLive = m === 'LIVE';
                    return (
                      <text key={m} x={50 + i * (730/5)} y="215" fontSize="10" fill={isLive ? "#10b981" : "currentColor"} fillOpacity={isLive?1:0.4} textAnchor="middle" fontWeight={isLive ? "bold" : "normal"} fontFamily="monospace">{m}</text>
                    );
                  })}
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
                    fill="none" stroke="#10b981" strokeWidth="2"
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
                  <circle cx={780} cy={190 - (cPoints[5]/maxCost)*180} r="4" fill="#10b981" className="shadow-[0_0_10px_#10b981]" />
                </svg>
              </div>
           </div>

           <div className="bg-[#0d0d14] border border-white/5 rounded-3xl p-8 flex flex-col">
              <div className="flex justify-between items-start mb-8">
                 <div>
                   <h3 className="text-base font-bold text-white">Compliance Posture</h3>
                   <p className="text-xs text-slate-500 mt-1">Regulatory validation of autonomous actions.</p>
                 </div>
                 <ShieldAlert className="w-5 h-5 text-slate-600" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                 <div className={cn("p-4 rounded-2xl border flex items-center justify-between", hasSocBlock ? "bg-rose-500/5 border-rose-500/20" : "bg-emerald-500/5 border-emerald-500/20")}>
                    <div>
                      <div className="text-xs font-bold text-white mb-1">SOC 2 Type II</div>
                      <div className={cn("text-[10px] font-mono", hasSocBlock ? "text-rose-400" : "text-emerald-400")}>{hasSocBlock ? "VIOLATION" : "COMPLIANT"}</div>
                    </div>
                    {hasSocBlock ? <Lock className="w-5 h-5 text-rose-500/50" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500/50" />}
                 </div>
                 <div className={cn("p-4 rounded-2xl border flex items-center justify-between", hasRedactedPII ? "bg-emerald-500/5 border-emerald-500/20" : "bg-slate-500/10 border-slate-500/10")}>
                    <div>
                      <div className="text-xs font-bold text-white mb-1">GDPR / CCPA</div>
                      <div className={cn("text-[10px] font-mono", hasRedactedPII ? "text-emerald-400" : "text-slate-400")}>{hasRedactedPII ? "PII REDACTED" : "NO PII"}</div>
                    </div>
                    {hasRedactedPII ? <CheckCircle2 className="w-5 h-5 text-emerald-500/50" /> : <Map className="w-5 h-5 text-slate-600" />}
                 </div>
                 <div className={cn("p-4 rounded-2xl border flex items-center justify-between", hasHipaa ? "bg-indigo-500/5 border-indigo-500/20" : "bg-slate-500/10 border-slate-500/10")}>
                    <div>
                      <div className="text-xs font-bold text-white mb-1">HIPAA / SOX</div>
                      <div className={cn("text-[10px] font-mono", hasHipaa ? "text-indigo-400" : "text-slate-400")}>{hasHipaa ? "SENSITIVE DATA" : "N/A"}</div>
                    </div>
                    {hasHipaa ? <AlertTriangle className="w-5 h-5 text-indigo-500/50" /> : <FileText className="w-5 h-5 text-slate-600" />}
                 </div>
                 <div className={cn("p-4 rounded-2xl border flex items-center justify-between", riskIso==='HIGH'?"bg-rose-500/5 border-rose-500/20":riskIso==='MEDIUM'?"bg-amber-500/5 border-amber-500/20":"bg-emerald-500/5 border-emerald-500/20")}>
                    <div>
                      <div className="text-xs font-bold text-white mb-1">ISO 27001</div>
                      <div className={cn("text-[10px] font-mono", riskIso==='HIGH'?"text-rose-400":riskIso==='MEDIUM'?"text-amber-400":"text-emerald-400")}>{riskIso} RISK</div>
                    </div>
                    <ShieldAlert className={cn("w-5 h-5", riskIso==='HIGH'?"text-rose-500/50":riskIso==='MEDIUM'?"text-amber-500/50":"text-emerald-500/50")} />
                 </div>
              </div>
              
              <div className="mt-auto">
                 <div className="flex justify-between text-xs font-semibold text-slate-300 mb-3">
                   <span>Enterprise Governance Coverage</span>
                   <span>92%</span>
                 </div>
                 <div className="h-3 flex rounded-full overflow-hidden border border-white/5 bg-black/50">
                   <motion.div initial={{width:0}} animate={{width:'82%'}} className="bg-emerald-500" />
                   <motion.div initial={{width:0}} animate={{width:'10%'}} className="bg-amber-500" />
                   <motion.div initial={{width:0}} animate={{width:'8%'}} className="bg-rose-500" />
                 </div>
                 <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-3">
                   <span className="text-emerald-500/80">PASSED (82%)</span>
                   <span className="text-amber-500/80">REVIEW (10%)</span>
                   <span className="text-rose-500/80">BLOCKED (8%)</span>
                 </div>
              </div>
           </div>
        </div>

        <div ref={recommendationsRef} className="bg-gradient-to-r from-indigo-500/10 to-teal-500/5 border border-indigo-500/20 p-8 md:p-10 rounded-3xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
           <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-teal-400" /> Executive Recommendations</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Harden Slack Integrations', desc: 'Recent blocks indicate excessive PII sharing through notification channels. Limit payload verbosity.', type: 'security' },
                { title: 'Review Legal Escalations', desc: 'High frequency of manual approvals in Legal steps. Consider refining zero-trust boundary limits.', type: 'process' },
                { title: 'Expand Governance Envelope', desc: 'Onboard remaining HR workflows into ContextOS to achieve 100% visibility of automated offboarding.', type: 'growth' }
              ].map((rec, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                   <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">{rec.type}</div>
                   <div className="text-sm font-semibold text-white mb-2">{rec.title}</div>
                   <div className="text-xs text-slate-400 leading-relaxed">{rec.desc}</div>
                </div>
              ))}
           </div>
        </div>

        <div className="pb-24">
           <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Network className="w-5 h-5 text-indigo-400" /> Multi-Agent Execution Trace</h2>
           <div className="bg-[#0d0d14] border border-white/5 rounded-3xl overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm whitespace-nowrap">
                 <thead>
                   <tr className="bg-white/[0.04] text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-white/5">
                     <th className="px-6 py-5 font-normal border-r border-white/5">Session Trace</th>
                     <th className="px-6 py-5 font-normal border-r border-white/5">Context Flow</th>
                     <th className="px-6 py-5 font-normal">Security Posture</th>
                     <th className="px-6 py-5 font-normal text-right no-print" data-html2canvas-ignore>Inspection</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {runHistory.map(run => (
                     <tr key={run.id} className="hover:bg-white/[0.02] transition-colors group">
                       <td className="px-6 py-5 border-r border-white/5">
                         <div className="font-semibold text-white">{run.workflowName}</div>
                         <div className="text-[10px] text-slate-500 font-mono mt-1">ID: {run.id}</div>
                       </td>
                       <td className="px-6 py-5 border-r border-white/5">
                         <div className="text-sm text-slate-300">{run.nodesCount} Nodes Orchestrated</div>
                         <div className="text-[10px] text-slate-500 mt-1">{run.durationSeconds}s compute · {run.completedSteps.length} successful</div>
                       </td>
                       <td className="px-6 py-5">
                         <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                           run.escalationOutcome === 'denied' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                           run.escalationOutcome === 'approved' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                           "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                         )}>
                           {run.escalationOutcome === 'denied' ? <X className="w-3 h-3" /> :
                            run.escalationOutcome === 'approved' ? <AlertTriangle className="w-3 h-3" /> :
                            <CheckCircle2 className="w-3 h-3" />}
                           {run.escalationOutcome === 'none' ? 'Enclave Passed' : run.escalationOutcome}
                         </span>
                       </td>
                       <td className="px-6 py-5 text-right no-print" data-html2canvas-ignore>
                         <button onClick={() => setSelectedRun(run)} className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg transition-colors font-medium opacity-0 group-hover:opacity-100">
                           Analyze Trace
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        </div>
      </div>

      {/* Platform Chat (Floating Bubble) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end no-print">
        <AnimatePresence>
          {platformChatOpen && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="bg-[#0d0d14] border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(79,70,229,0.15)] w-[380px] mb-4 overflow-hidden flex flex-col h-[450px]">
               <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                 <div className="flex items-center gap-2 text-white font-bold text-sm tracking-tight">
                   <Bot className="w-5 h-5 text-indigo-400" />
                   ContextOS Intelligence
                 </div>
                 <button onClick={() => setPlatformChatOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {platformMessages.length === 0 && (
                   <div className="text-center mt-12">
                     <Bot className="w-10 h-10 text-slate-700 mx-auto mb-4" />
                     <p className="text-slate-400 text-xs text-balance">
                       Ask questions about compliance trends, risk posture, or blocked instances.
                     </p>
                   </div>
                 )}
                 {platformMessages.map((m, i) => (
                   <div key={i} className={cn("flex flex-col max-w-[85%]", m.role==='user'?"items-end self-end":"items-start self-start")}>
                      <div className={cn("p-3 rounded-2xl text-sm leading-relaxed", m.role==='user'?"bg-indigo-600 text-white rounded-br-sm":"bg-white/10 text-slate-200 rounded-bl-sm")}>{m.text}</div>
                   </div>
                 ))}
                 {platformLoading && (
                   <div className="flex items-center gap-2 text-xs text-slate-500">
                     <SpinnerIcon className="w-3 h-3 animate-spin" /> Synthesizing...
                   </div>
                 )}
               </div>
               <div className="p-3 border-t border-white/5 bg-black/40">
                 <div className="relative">
                   <input 
                     value={platformInput} onChange={e => setPlatformInput(e.target.value)}
                     onKeyDown={e => { if(e.key === 'Enter') askPlatform(platformInput) }}
                     placeholder="Query enterprise intelligence..."
                     className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                   />
                   <button onClick={() => askPlatform(platformInput)} disabled={platformLoading || !platformInput.trim()} className="absolute right-2 top-2 bottom-2 w-9 flex items-center justify-center bg-white text-black hover:bg-slate-200 rounded-lg disabled:opacity-50 transition-colors">
                     <Send className="w-4 h-4 ml-0.5" />
                   </button>
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
        {!platformChatOpen && (
          <button onClick={() => setPlatformChatOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-[0_0_30px_rgba(79,70,229,0.3)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 group border border-indigo-400/30">
            <Bot className="w-6 h-6 group-hover:animate-pulse" />
          </button>
        )}
      </div>

      {selectedRun && (
        <RunDetailModal run={selectedRun} onClose={() => setSelectedRun(null)} aiModel={aiModel} />
      )}
    </div>
  );
}

function RunDetailModal({ run, onClose, aiModel }: { run: RunRecord, onClose: () => void, aiModel: string }) {
  const [tab, setTab] = useState<'graph'|'exec'|'agent'|'chat'>('graph');
  
  const previewNodes = useMemo(() => {
    if (!run.workflowSnapshot?.nodes) return [];
    const layout = applyWorkflowLayout(run.workflowSnapshot.nodes, run.workflowSnapshot.edges || []);
    return layout.nodes.map(n => ({
      ...n,
      data: {
         ...n.data,
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

    if (aiModel === 'gemini-simulated' || isApiLimitReached()) {
      await new Promise(r => setTimeout(r, 900));
      setChatMessages(prev => [...prev, { role: 'ai', text: getRunDetailSimulatedResponse(q) }]);
      setChatLoading(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'AI_STUDIO_FREE_TIER' });
      const context = `Run context: ${run.workflowName}, ${run.nodesCount} nodes, ${run.riskClassification} risk.
Completed steps: ${run.completedSteps.length}, Failed: ${run.failedSteps.length}
Escalation: ${run.escalationOutcome} (${run.escalationDetails?.policy})
Security: ${run.securityEvents.length} total, ${run.securityEvents.filter(x=>x.status==='BLOCK').length} blocks.
Logs: ${run.executionLogs.slice(-10).map(x=>x.message).join(' | ')}`;
      incrementApiCall();
      const response = await ai.models.generateContent({
        model: aiModel || 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: `You are ContextOS Platform Intelligence... Context: ${context} Question: ${q}` }] }]
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
      <div className="absolute inset-0 bg-[#0a0a0f]/90 backdrop-blur-xl" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-6xl h-[85vh] flex flex-col bg-[#0d0d14] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-white/[0.01]">
           <div>
             <h2 className="text-xl font-bold text-white flex items-center gap-3 tracking-tight">
               <Activity className="w-6 h-6 text-indigo-400" />
               Simulation Trace
             </h2>
             <p className="text-xs text-slate-400 mt-2 font-mono">TRACE_ID: {run.id} · {new Date(run.completedAt).toLocaleString()}</p>
           </div>
           <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="flex border-b border-white/5 px-6 shrink-0 pt-2 bg-[#0a0a0f]">
          {[
            { id: 'graph', label: 'Topology Map', icon: Network },
            { id: 'exec', label: 'System Telemetry', icon: Terminal },
            { id: 'agent', label: 'Agent Reasoning', icon: FileText },
            { id: 'chat', label: 'Inspector AI', icon: MessageSquare }
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} className={cn("flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest relative transition-colors", tab===t.id?"text-white":"text-slate-500 hover:text-slate-300")}>
               <t.icon className="w-4 h-4" />
               {t.label}
               {tab === t.id && <motion.div layoutId="runTabDetail" className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden relative">
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
               <Background color="#ffffff" gap={24} size={1} opacity={0.03} />
               <Controls showInteractive={false} className="opacity-50 hover:opacity-100" />
             </ReactFlow>
           )}
           
           {tab === 'exec' && (
             <div className="h-full overflow-y-auto p-6 font-mono text-xs space-y-2 bg-[#050508]">
                {run.executionLogs.map((log, i) => (
                  <div key={i} className={cn("p-3 rounded-lg border", 
                     log.message.includes('FAILED') || log.message.includes('BLOCKED') ? "text-rose-400 bg-rose-500/5 border-rose-500/10" :
                     log.message.includes('COMPLETED') || log.message.includes('SUCCESS') ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/10" :
                     log.message.includes('ESCALATED') ? "text-amber-400 bg-amber-500/5 border-amber-500/10" :
                     log.message.includes('ORCHESTRATOR') ? "text-indigo-400 bg-indigo-500/5 border-indigo-500/10" : "text-slate-400 bg-white/[0.02] border-white/5"
                  )}>
                    <span className="text-slate-600 mr-4 opacity-50">[{log.timestamp}]</span>
                    {log.message}
                  </div>
                ))}
             </div>
           )}

           {tab === 'agent' && (
             <div className="h-full overflow-y-auto p-6 font-mono text-xs space-y-2 bg-[#050508]">
                {run.analysisLogs.length === 0 && <div className="text-slate-500 italic text-center mt-10">No reasoning trace persisted for this segment.</div>}
                {run.analysisLogs.map((log, i) => {
                  let colorClass = 'text-slate-400';
                  if (log.startsWith('[SYSTEM]')) colorClass = 'text-indigo-400 font-bold';
                  else if (log.startsWith('[ERROR]')) colorClass = 'text-rose-400 font-bold';
                  return <div key={i} className={`p-4 rounded-xl bg-white/[0.02] border border-white/5 ${colorClass}`}>{log}</div>;
                })}
             </div>
           )}

           {tab === 'chat' && (
             <div className="h-full flex flex-col p-6 max-w-4xl mx-auto">
                <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-4">
                   {chatMessages.length === 0 && (
                     <div className="text-center mt-20 max-w-lg mx-auto">
                        <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-white mb-2">Interrogate this Simulation</h3>
                        <p className="text-slate-400 text-sm mb-8 text-balance">Use AI to extract insights, root causes, and security validations specifically scoped to this orchestration trace.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {['Analyze security blocks', 'Explain the escalation', 'List systems touched', 'Was PII exposed?'].map(q => (
                            <button key={q} onClick={() => setChatInput(q)} className="border border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/30 text-sm text-slate-300 p-4 rounded-2xl transition-all text-left">{q}</button>
                          ))}
                        </div>
                     </div>
                   )}
                   {chatMessages.map((msg, i) => (
                      <div key={i} className={cn("flex flex-col gap-2 max-w-[85%]", msg.role==='user'?"items-end self-end ml-auto":"items-start self-start")}>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">{msg.role === 'user' ? 'Operator' : 'ContextOS Intelligence'}</span>
                        <div className={cn("text-sm leading-relaxed p-4 rounded-3xl", msg.role==='user'?"bg-indigo-600 border border-transparent text-white rounded-br-sm":"bg-white/5 border border-white/10 text-slate-200 rounded-bl-sm")}>
                          {msg.text}
                        </div>
                      </div>
                   ))}
                   {chatLoading && (
                     <div className="flex items-center gap-3 text-sm text-slate-500 p-4">
                       <SpinnerIcon className="w-4 h-4 animate-spin" />
                       Synthesizing answer...
                     </div>
                   )}
                </div>
                <div className="relative shrink-0">
                  <input 
                    value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if(e.key==='Enter' && !chatLoading) askRunChat() }}
                    placeholder={`Interrogate TRACE_${run.id}...`}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-6 pr-14 py-4 text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-medium"
                  />
                   <button disabled={chatLoading || !chatInput.trim()} onClick={askRunChat} className="absolute right-2 top-2 bottom-2 w-12 bg-white text-black hover:bg-slate-200 disabled:opacity-50 flex items-center justify-center rounded-xl transition-colors">
                      <Send className="w-5 h-5 ml-1" />
                   </button>
                </div>
             </div>
           )}
        </div>
      </motion.div>
    </div>
  );
}
