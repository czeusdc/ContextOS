import { Link, Outlet, useLocation } from 'react-router-dom';
import { Activity, ShieldAlert, Cpu, Upload, GitGraph, Play, ChevronDown, Zap, BarChart3, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore, AI_MODELS } from '@/lib/store';
import { useWorkflowRuntime } from '@/context/WorkflowRuntimeContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

export function Shell() {
  const location = useLocation();
  const { runStatus, setRunStatus, aiModel, setAiModel, discoveredConnections } = useStore();
  const { state: { workflow }, resetExecution } = useWorkflowRuntime();
  
  const navItems = [
    { name: 'Upload SOP', path: '/upload', icon: Upload },
    ...(workflow ? [{ name: 'Analysis', path: '/analysis', icon: Cpu }] : []),
    { name: 'Workflow Graph', path: '/graph', icon: GitGraph },
    { name: 'Execution', path: '/execute', icon: Activity },
    { name: 'Security', path: '/security', icon: ShieldAlert },
    { name: 'Intelligence Report', path: '/report', icon: BarChart3 },
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0a0f] text-slate-300 font-sans overflow-hidden">
      {/* Header / Navigation */}
      <nav className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0a0a0f]/80 backdrop-blur-md z-30 shrink-0">
        <div className="flex items-center gap-4">
          <Logo className="w-8 h-8 drop-shadow-md" />
          <div className="flex flex-col justify-center">
            <span className="text-white font-semibold text-xl leading-none tracking-tight">ContextOS</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10 mx-2 hidden sm:block"></div>
          <div className="items-center gap-2 text-xs font-medium bg-white/5 px-3 py-1.5 rounded-full border border-white/10 hidden sm:flex">
            <span className={cn("w-2 h-2 rounded-full", runStatus === 'running' ? "bg-green-500 animate-pulse" : "bg-indigo-500 animate-pulse")}></span>
            <span className="text-slate-400">Project:</span>
            <span className="text-white">{workflow?.workflow_name || 'Enterprise Workflow'}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-50">
          {/* Gemini model badge */}
          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
            aiModel === 'gemini-simulated'
              ? 'bg-slate-500/10 border-slate-500/20 text-slate-400'
              : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
          }`}>
            <Zap className={`w-3 h-3 fill-current ${aiModel === 'gemini-simulated' ? 'text-slate-400' : 'text-indigo-400 fill-indigo-400'}`} />
            <span className="text-[10px] font-mono uppercase tracking-widest">{aiModel === 'gemini-simulated' ? 'SIMULATED' : aiModel}</span>
          </div>
          <div className="hidden sm:block w-48">
            <Select value={aiModel} onValueChange={(val: any) => setAiModel(val)}>
              <SelectTrigger className="h-8 text-[11px] bg-[#12121a] hover:bg-[#1a1a24] border border-white/10 text-indigo-300 font-mono focus:ring-0 focus:ring-offset-0 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-[pulse_2s_ease-in-out_infinite]"></div>
                  <SelectValue placeholder="Select Model" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#0d0d14] border-white/10 text-slate-300 font-mono text-[11px] z-50 relative">
                {AI_MODELS.map((model) => (
                  <SelectItem key={model} value={model} className={`hover:bg-white/5 focus:bg-white/5 cursor-pointer ${
                    model === 'gemini-simulated' ? 'text-slate-400 border-t border-white/5 mt-1 pt-2' : ''
                  }`}>
                    {model === 'gemini-simulated' ? '⚫ Gemini (Simulated)' : model.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(() => {
            if (location.pathname === '/' || location.pathname === '/upload') {
              return (
                <button disabled className="px-4 py-2 bg-indigo-600/50 text-white/50 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 cursor-not-allowed">
                  <Upload className="w-3 h-3 fill-current" />
                  <span className="hidden sm:inline">AWAITING UPLOAD</span>
                  <span className="sm:hidden">WAIT</span>
                </button>
              );
            }
            if (location.pathname === '/analysis') {
               if (!workflow) {
                 return (
                   <button disabled className="px-4 py-2 bg-indigo-600/50 text-white/50 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 cursor-not-allowed">
                    <Activity className="w-3 h-3 animate-spin" />
                    <span className="hidden sm:inline">ANALYZING...</span>
                    <span className="sm:hidden">WAIT</span>
                  </button>
                 )
               }
               return (
                 <Link to="/graph" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-2">
                  <GitGraph className="w-3 h-3 fill-current" />
                  <span className="hidden sm:inline">VIEW GRAPH</span>
                  <span className="sm:hidden">GRAPH</span>
                </Link>
               );
            }
            if (location.pathname === '/graph') {
               return (
                <Link to="/execute" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-2">
                  <Play className="w-3 h-3 fill-current" />
                  <span className="hidden sm:inline">PREPARE EXECUTION</span>
                  <span className="sm:hidden">PREP</span>
                </Link>
              );
            }
            if (location.pathname === '/execute') {
               if (runStatus === 'idle') {
                  return (
                    <Dialog>
                      <DialogTrigger className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-2">
                        <Play className="w-3 h-3 fill-current" />
                        <span className="hidden sm:inline">RUN WORKFLOW</span>
                        <span className="sm:hidden">RUN</span>
                      </DialogTrigger>
                      <DialogContent className="bg-[#0f0f16] border-white/10 text-white">
                        <DialogHeader>
                          <DialogTitle>Confirm Execution</DialogTitle>
                          <DialogDescription className="text-slate-400">
                            Are you sure you want to run this workflow? This will execute all scheduled automated tasks in {workflow?.workflow_name || 'the system'} and modify systems accordingly.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="border-t border-white/10 mt-4 bg-transparent pt-4 mb-2">
                          <DialogClose render={<Button variant="outline" className="border-white/10 bg-transparent hover:bg-white/5 text-slate-300" />}>Cancel</DialogClose>
                          <DialogClose render={<Button className="bg-indigo-600 hover:bg-indigo-500 text-white border-transparent" onClick={() => { resetExecution(); setRunStatus('running'); }} />}>Confirm Run</DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )
               }
               if (runStatus === 'running') {
                  return (
                    <button disabled className="px-4 py-2 bg-amber-600/50 text-white/80 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 cursor-not-allowed">
                      <Activity className="w-3 h-3 animate-spin" />
                      <span className="hidden sm:inline">EXECUTING...</span>
                      <span className="sm:hidden">EXEC</span>
                    </button>
                  )
               }
               if (runStatus === 'completed') {
                  return (
                    <Link to="/security" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-2">
                      <ShieldAlert className="w-3 h-3" />
                      <span className="hidden sm:inline">SECURITY AUDIT</span>
                      <span className="sm:hidden">AUDIT</span>
                    </Link>
                  )
               }
            }
            if (location.pathname === '/report') {
              return (
                <button onClick={() => window.print()} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-2">
                  <Download className="w-3 h-3" />
                  <span className="hidden sm:inline">EXPORT PDF</span>
                  <span className="sm:hidden">EXPORT</span>
                </button>
              )
            }
            if (location.pathname === '/security') {
              return (
                <div className="flex gap-2">
                  <Link to="/upload" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-2">
                    <Upload className="w-3 h-3" />
                    <span className="hidden sm:inline">NEW WORKFLOW</span>
                    <span className="sm:hidden">NEW</span>
                  </Link>
                  <Link to="/report" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-2">
                    <BarChart3 className="w-3 h-3" />
                    <span className="hidden sm:inline">VIEW REPORT →</span>
                  </Link>
                </div>
              )
            }
            return (
              <Link to="/execute" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-2">
                <Play className="w-3 h-3 fill-current" />
                <span className="hidden sm:inline">RUN WORKFLOW</span>
                <span className="sm:hidden">RUN</span>
              </Link>
            );
          })()}
        </div>
      </nav>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 border-r border-white/5 bg-[#0d0d14] flex flex-col shrink-0 z-20">
          <div className="p-4 flex flex-col gap-6 flex-1 overflow-y-auto">
            <div>
              <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-3 font-bold">Navigation</h3>
              <nav className="space-y-1 mt-3">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center justify-between text-xs p-2 rounded transition-colors",
                        isActive 
                          ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20" 
                          : "text-slate-300 hover:bg-white/5 border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                      {item.path === '/execute' && runStatus === 'running' && (
                        <span className="text-[9px] bg-indigo-500/20 px-1.5 rounded animate-pulse">ACTIVE</span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            <div className="mt-2">
              <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-3 font-bold">External Connections</h3>
              <div className="space-y-2">
                {discoveredConnections && discoveredConnections.length > 0 ? (
                  discoveredConnections.map((conn, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs opacity-90 transition-all hover:opacity-100">
                      <div className="w-2 h-2 rounded-full bg-green-500 relative">
                         <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></span>
                      </div>
                      <span className="truncate">{conn.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-slate-600 italic">No connections mapping yet...</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-auto p-4 border-t border-white/5">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert className="w-3 h-3 text-amber-500" />
                <span className="text-[11px] font-bold text-amber-500 tracking-wider">GOVERNANCE ACTIVE</span>
              </div>
              <p className="text-[10px] text-amber-200/60 leading-relaxed mt-2">
                Zero-Trust engine monitoring real-time workflow actions.
              </p>
            </div>
            <div className="mt-4 text-center">
              <span className="text-[10px] text-slate-500 font-mono">v0.8.2-beta // enterprise_env</span>
            </div>
          </div>
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 relative overflow-hidden bg-[radial-gradient(#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]">
          <div className="absolute inset-0 w-full h-full flex flex-col overflow-y-auto z-10 p-0 m-0">
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
