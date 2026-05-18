import { motion } from 'motion/react';
import { ShieldCheck, Lock, Activity, Users } from 'lucide-react';

export function SecuritySection() {
  return (
    <section className="py-32 bg-[#0a0a0f] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-6"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              Enterprise AI requires <br/> strict governance.
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              We separate inference from execution. While Gemini models the workflow intent, Veea enforces the boundaries. Every proposed action must pass deterministic policy validation before it can execute.
            </p>
            
            <ul className="mt-8 space-y-6">
               {[
                 { icon: <Lock />, title: 'Local PII Redaction', desc: 'Sensitive data is scrubbed before processing by Gemini.' },
                 { icon: <ShieldCheck />, title: 'Zero-Trust Execution', desc: 'No action is autonomous by default. Every integration call is explicitly governed.' },
                 { icon: <Users />, title: 'RBAC Enforcement', desc: 'Execution graphs map to existing human identity and access boundaries.' },
                 { icon: <Activity />, title: 'Deep Prompt Inspection (DPI)', desc: 'Network-level monitoring of Prompt outputs for policy drift.' }
               ].map((item, i) => (
                 <li key={i} className="flex gap-4">
                   <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                     {item.icon}
                   </div>
                   <div>
                     <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                     <p className="text-sm text-slate-400">{item.desc}</p>
                   </div>
                 </li>
               ))}
            </ul>
          </motion.div>

          {/* Right Dashboard Mock */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-white/10 bg-black/40 p-6 shadow-2xl relative overflow-hidden"
          >
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.05)_0,transparent_70%)]" />
             
             <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
               <span className="text-sm font-semibold text-white">Veea Governance Policy Engine</span>
               <div className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-mono">Active</div>
             </div>

             <div className="space-y-3">
               {[
                 { rule: 'SEC-447: Exfiltration Guard', status: 'Enforcing', hits: 14 },
                 { rule: 'IAM-104: Privilege Esc', status: 'Enforcing', hits: 2 },
                 { rule: 'FIN-014: Finance Boundary', status: 'Monitoring', hits: 0 },
               ].map((rule, i) => (
                 <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                   <div>
                     <div className="text-sm text-white font-medium mb-1 font-mono">{rule.rule}</div>
                     <div className="text-xs text-slate-500">Hits this week: {rule.hits}</div>
                   </div>
                   <div className={`text-xs px-2 py-1 rounded ${rule.status === 'Enforcing' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                     {rule.status}
                   </div>
                 </div>
               ))}
             </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
