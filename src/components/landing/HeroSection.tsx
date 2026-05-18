import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, AlertTriangle, ShieldCheck } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden min-h-[90vh] flex items-center">
      <div className="absolute inset-0 pointer-events-none bg-[#0B0F19]" />
      
      {/* Background grids / gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)]" />
      
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10 w-full">
        {/* Left: Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[11px] font-medium uppercase tracking-[0.15em] self-start">
            <AlertTriangle className="w-3 h-3" />
            The $100 Billion Invisible Workflow Gap
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]">
            Enterprise workflows, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-200">modeled.</span>
          </h1>
          
          <p className="text-xl text-slate-300 font-medium leading-relaxed">
            ContextOS maps undocumented operational workflows from enterprise activity using multimodal Gemini reasoning.
          </p>

          <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
            Translate manual processes into structured, policy-governed execution graphs without rewriting your legacy systems.
          </p>
          
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link 
              to="/upload" 
              className="inline-flex items-center gap-3 px-8 py-4 rounded-lg bg-white text-[#0B0F19] hover:bg-slate-200 transition-colors font-semibold tracking-wide"
            >
              Launch ContextOS
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="inline-flex items-center gap-3 px-8 py-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors font-medium tracking-wide">
              <Play className="w-4 h-4" />
              Watch System Demo
            </button>
          </div>
        </motion.div>

        {/* Right: Graphic */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative h-[500px] rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden shadow-2xl flex items-center justify-center backdrop-blur-sm"
        >
           {/* Abstract workflow visualization */}
           <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
           <div className="relative w-full h-full flex flex-col justify-center items-center gap-6 p-8">
              
              {/* Node 1 */}
              <motion.div 
                 animate={{ opacity: [0.3, 1, 0.3], boxShadow: ['0 0 0px transparent', '0 0 20px rgba(99,102,241,0.3)', '0 0 0px transparent'] }}
                 transition={{ duration: 3, repeat: Infinity, times: [0, 0.2, 1] }}
                 className="w-64 rounded-xl bg-white/5 border border-indigo-500/30 p-4 relative z-10 backdrop-blur-xl"
              >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                    <span className="text-xs text-indigo-100 font-mono uppercase tracking-widest">Document Ingest</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ width: ["0%", "100%", "100%"] }} 
                      transition={{ duration: 3, repeat: Infinity, times: [0, 0.2, 1] }} 
                      className="h-full bg-indigo-400" 
                    />
                  </div>
              </motion.div>
              
              {/* Connection 1 */}
              <div className="w-0.5 h-8 bg-white/10 relative -my-6 z-0">
                <motion.div 
                  animate={{ top: ["0%", "100%", "100%"], opacity: [0, 1, 0] }}
                  transition={{ duration: 3, repeat: Infinity, times: [0.2, 0.4, 1] }}
                  className="absolute w-full h-4 bg-indigo-400 blur-[2px]"
                />
              </div>

              {/* Node 2 */}
              <motion.div 
                 animate={{ opacity: [0.3, 0.3, 1, 0.3], boxShadow: ['0 0 0px transparent', '0 0 0px transparent', '0 0 20px rgba(168,85,247,0.3)', '0 0 0px transparent'] }}
                 transition={{ duration: 3, repeat: Infinity, times: [0, 0.4, 0.6, 1] }}
                 className="w-64 rounded-xl bg-white/5 border border-purple-500/30 p-4 relative z-10 backdrop-blur-xl"
              >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                    <span className="text-xs text-purple-100 font-mono uppercase tracking-widest">Gemini Reasoning</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">Extracting causal edges...</div>
              </motion.div>

              {/* Connection 2 */}
              <div className="w-0.5 h-8 bg-white/10 relative -my-6 z-0">
                <motion.div 
                  animate={{ top: ["0%", "0%", "100%", "100%"], opacity: [0, 0, 1, 0] }}
                  transition={{ duration: 3, repeat: Infinity, times: [0, 0.6, 0.8, 1] }}
                  className="absolute w-full h-4 bg-emerald-400 blur-[2px]"
                />
              </div>

               {/* Node 3 */}
               <motion.div 
                 animate={{ opacity: [0.3, 0.3, 1, 0.3], boxShadow: ['0 0 0px transparent', '0 0 0px transparent', '0 0 20px rgba(52,211,153,0.3)', '0 0 0px transparent'] }}
                 transition={{ duration: 3, repeat: Infinity, times: [0, 0.8, 0.9, 1] }}
                 className="w-64 rounded-xl bg-white/5 border border-emerald-500/30 p-4 relative z-10 backdrop-blur-xl"
              >
                 <div className="absolute -top-3 -right-3">
                    <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Execute
                    </div>
                 </div>
                 <div className="flex items-center gap-3 mb-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                   <span className="text-xs text-emerald-100 font-mono uppercase tracking-widest">Graph Deployment</span>
                 </div>
                 <div className="text-[10px] text-emerald-500/70 font-mono">12 Nodes Validated</div>
              </motion.div>
           </div>
           
           <div className="absolute bottom-4 left-4 right-4 h-12 bg-black/40 backdrop-blur-md rounded border border-white/10 flex items-center px-4 gap-4">
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest">Digital Twin</span>
              <div className="flex-1 h-px bg-white/10" />
              <motion.span 
                 animate={{ opacity: [0.5, 1, 0.5] }}
                 transition={{ duration: 2, repeat: Infinity }}
                 className="text-[10px] text-slate-300 font-mono truncate"
              >
                  Orchestrating autonomous actions...
              </motion.span>
           </div>
        </motion.div>
      </div>
    </section>
  );
}
