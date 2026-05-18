import { motion } from 'motion/react';
import { Terminal, ShieldAlert } from 'lucide-react';

export function RuntimePreviewSection() {
  return (
    <section className="py-32 bg-[#0B0F19] relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
            Simulate and govern workflow execution.
          </h2>
          <p className="text-slate-400 text-lg">Model dependencies, visualize IAM boundaries, and enforce security policies.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[500px]">
          {/* Left: Graph Mock */}
          <div className="rounded-2xl border border-white/10 bg-[#0a0a0f] p-8 flex flex-col items-center justify-center relative overflow-hidden">
             
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0,transparent_100%)]" />

             {/* Graph Layout Mock */}
             <div className="relative w-full h-full max-w-sm flex flex-col gap-10 items-center">
                <div className="w-full flex justify-center">
                  <div className="px-6 py-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono shadow-[0_0_20px_rgba(52,211,153,0.15)] flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" /> Start Processing
                  </div>
                </div>

                <div className="w-px h-10 bg-emerald-500/30 relative">
                   <div className="absolute top-0 left-0 w-full h-full bg-emerald-400 blur-[2px] opacity-50" />
                </div>

                <div className="w-full flex justify-center">
                  <div className="px-6 py-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 text-xs font-mono shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-pulse flex items-center gap-2">
                    <ShieldAlert className="w-3 h-3" /> SEC-447 Guard Triggered
                  </div>
                </div>
             </div>
          </div>

          {/* Right: Console Mock */}
          <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-6 font-mono text-xs text-slate-400 flex flex-col">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-4 text-slate-500 uppercase tracking-widest text-[10px]">
               <Terminal className="w-4 h-4" /> Execution Stream (Simulated)
            </div>
            
            <div className="flex flex-col gap-3 flex-1 overflow-hidden opacity-90">
               <div><span className="text-slate-500">[00:00:23]</span> <span className="text-indigo-400">ORCHESTRATOR</span> Initiating governed execution sequence...</div>
               <div><span className="text-slate-500">[00:00:24]</span> <span className="text-emerald-400">SYSTEM</span> Pre-flight validation passed.</div>
               <div><span className="text-slate-500">[00:00:24]</span> <span className="text-indigo-400">ORCHESTRATOR</span> Evaluating downstream dependencies...</div>
               <div className="mt-4"><span className="text-slate-500">[00:00:25]</span> <span className="text-amber-400 font-bold">SECURITY</span> SEC-447 Data Exfiltration Guard triggered.</div>
               <div><span className="text-slate-500">[00:00:25]</span> <span className="text-red-400 font-bold">GOVERNANCE</span> Execution path quarantined pending human approval.</div>
               <div><span className="text-slate-500">[00:00:26]</span> <span className="text-amber-400">ORCHESTRATOR</span> Dependent finance operations suspended.</div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-slate-500">Status: Paused</span>
              <span className="text-red-400 animate-pulse font-bold">AWAITING APPROVAL</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
