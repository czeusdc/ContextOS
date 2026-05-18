import { motion } from 'motion/react';
import { Network, Bot, Wallet, Users, Settings, Workflow } from 'lucide-react';

export function MultiAgentSection() {
  const agents = [
    {
      icon: <Users className="w-6 h-6 text-emerald-400" />,
      title: "HR Provisioning Agent",
      desc: "Autonomously handles onboarding, IAM role requests, and payroll synchronization.",
      badge: "Active",
      color: "emerald"
    },
    {
      icon: <Wallet className="w-6 h-6 text-amber-400" />,
      title: "Finance Ops Agent",
      desc: "Validates PO workflows, cross-checks ledger entries, and prepares compliance reports.",
      badge: "Active",
      color: "amber"
    },
    {
      icon: <Settings className="w-6 h-6 text-blue-400" />,
      title: "IT Infrastructure Agent",
      desc: "Manages identity lifecycle, provisions software licenses, and enforces system policies.",
      badge: "Standby",
      color: "blue"
    }
  ];

  return (
    <section className="py-32 bg-[#0a0a0f] border-t border-white/5 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.03)_0,transparent_100%)] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-medium uppercase tracking-[0.15em] self-start">
              <Network className="w-3 h-3" />
              LangGraph Orchestration
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              Coordinated multi-agent <br/> inference networks.
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Enterprise workflows span across departments. ContextOS utilizes LangGraph to coordinate specialized AI agents—each with distinct context scopes, tooling, and boundaries—resulting in high-fidelity execution across silos.
            </p>
            
            <div className="mt-6 flex items-center gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
               <Workflow className="w-10 h-10 text-indigo-400/50 shrink-0" />
               <div>
                 <h4 className="text-white font-medium mb-1">Stateful Handoffs</h4>
                 <p className="text-sm text-slate-400">Agents securely pass execution context and partial outputs to downstream actors.</p>
               </div>
            </div>
          </motion.div>

          {/* Right: Agents Grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-4"
          >
            {agents.map((agent, i) => (
              <div 
                key={i} 
                className="group relative p-6 rounded-2xl bg-black/40 border border-white/10 hover:bg-white/[0.02] transition-colors overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${agent.color}-500/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-${agent.color}-500/20 transition-colors`} />
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      {agent.icon}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">{agent.title}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">{agent.desc}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded bg-white/5 text-[10px] font-mono tracking-wider uppercase text-slate-400 border border-white/10 shrink-0`}>
                    {agent.badge}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
